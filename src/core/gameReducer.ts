import { adjustCommanderDamage, getCommanderDamage, setCommanderDamage } from './commanderDamage';
import { recordEvent, takeSnapshot } from './history';
import { adjustLife, setLife } from './life';
import { createPlayers, findPlayer, nextPlayerId, updatePlayer } from './players';
import {
  chargeTime,
  expireActiveClock,
  pauseClock,
  resumeClock,
  settleClock,
  switchActivePlayer,
} from './timer';
import type { GameConfig, GameState, HistoryEntry, PlayerId } from './types';

export type GameAction =
  | { type: 'adjustLife'; playerId: PlayerId; delta: number; now: number }
  | { type: 'setLife'; playerId: PlayerId; value: number; now: number }
  | { type: 'adjustCommanderDamage'; targetId: PlayerId; sourceId: PlayerId; delta: number; now: number }
  | { type: 'setCommanderDamage'; targetId: PlayerId; sourceId: PlayerId; value: number; now: number }
  | { type: 'passTurn'; now: number }
  | { type: 'activatePlayer'; playerId: PlayerId; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'expireClock'; now: number }
  | { type: 'setEliminated'; playerId: PlayerId; eliminated: boolean; now: number }
  | { type: 'updatePlayerInfo'; playerId: PlayerId; name?: string; commanderName?: string }
  | { type: 'undo'; now: number }
  | { type: 'restart'; now: number };

export function createGame(config: GameConfig, now: number): GameState {
  return {
    config,
    players: createPlayers(config),
    clock: { activePlayerId: null, runningSince: null, paused: false },
    history: [],
    nextHistoryId: 1,
    startedAt: now,
  };
}

function changeLife(state: GameState, playerId: PlayerId, now: number, next: { delta?: number; value?: number }) {
  const player = findPlayer(state.players, playerId);
  if (!player) return state;
  const players = next.value != null ? setLife(state.players, playerId, next.value) : adjustLife(state.players, playerId, next.delta ?? 0);
  const result = findPlayer(players, playerId)!.life;
  if (result === player.life) return state;
  return recordEvent(
    { ...state, players },
    { type: 'life', playerId, delta: result - player.life, result, setTo: next.value },
    takeSnapshot(state),
    now,
  );
}

function changeCommanderDamage(
  state: GameState,
  targetId: PlayerId,
  sourceId: PlayerId,
  now: number,
  next: { delta?: number; value?: number },
) {
  const target = findPlayer(state.players, targetId);
  if (!target || targetId === sourceId || !findPlayer(state.players, sourceId)) return state;
  const previous = getCommanderDamage(target, sourceId);
  const players =
    next.value != null
      ? setCommanderDamage(state.players, targetId, sourceId, next.value)
      : adjustCommanderDamage(state.players, targetId, sourceId, next.delta ?? 0);
  const result = getCommanderDamage(findPlayer(players, targetId)!, sourceId);
  if (result === previous) return state;
  return recordEvent(
    { ...state, players },
    { type: 'commanderDamage', targetId, sourceId, delta: result - previous, result, setTo: next.value },
    takeSnapshot(state),
    now,
  );
}

function activate(state: GameState, playerId: PlayerId | null, now: number): GameState {
  if (playerId == null || playerId === state.clock.activePlayerId) return state;
  if (!findPlayer(state.players, playerId)) return state;
  // Snapshot the settled state so undo restores the clocks exactly as they were at the pass.
  const settled = settleClock(state, now);
  const before = takeSnapshot(settled);
  const switched = switchActivePlayer(settled, playerId, now);
  return recordEvent(switched, { type: 'turn', fromId: state.clock.activePlayerId, toId: playerId }, before, now);
}

/**
 * Undoing a turn pass behaves as if the pass never happened: the clocks are restored and the
 * time the newly-activated player has run since is charged to the player who kept the turn.
 */
function undoTurn(state: GameState, entry: HistoryEntry, toId: PlayerId, now: number): GameState {
  const settled = settleClock(state, now);
  const usedNow = findPlayer(settled.players, toId)?.clock.usedMs ?? 0;
  const usedBefore = findPlayer(entry.before.players, toId)?.clock.usedMs ?? 0;
  const spentMs = Math.max(0, usedNow - usedBefore);
  const previousId = entry.before.clock.activePlayerId;

  let players = settled.players.map((p) => {
    const before = findPlayer(entry.before.players, p.id);
    return before ? { ...p, clock: before.clock } : p;
  });
  if (previousId != null) {
    players = updatePlayer(players, previousId, (p) => ({ ...p, clock: chargeTime(p.clock, spentMs) }));
  }

  const previous = previousId == null ? undefined : findPlayer(players, previousId);
  const canRun = previous != null && !previous.clock.timedOut && !settled.clock.paused;
  return {
    ...settled,
    players,
    clock: { ...settled.clock, activePlayerId: previousId, runningSince: canRun ? now : null },
  };
}

function undo(state: GameState, now: number): GameState {
  const entry = state.history[state.history.length - 1];
  if (!entry) return state;
  const history = state.history.slice(0, -1);

  if (entry.event.type === 'turn') {
    return { ...undoTurn(state, entry, entry.event.toId, now), history };
  }

  // Counter events: restore tracked values but keep clocks running untouched.
  const players = state.players.map((p) => {
    const before = findPlayer(entry.before.players, p.id);
    return before
      ? { ...p, life: before.life, commanderDamage: before.commanderDamage, eliminated: before.eliminated }
      : p;
  });
  return { ...state, players, history };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'adjustLife':
      return changeLife(state, action.playerId, action.now, { delta: action.delta });
    case 'setLife':
      return changeLife(state, action.playerId, action.now, { value: action.value });
    case 'adjustCommanderDamage':
      return changeCommanderDamage(state, action.targetId, action.sourceId, action.now, { delta: action.delta });
    case 'setCommanderDamage':
      return changeCommanderDamage(state, action.targetId, action.sourceId, action.now, { value: action.value });
    case 'passTurn':
      return activate(state, nextPlayerId(state.players, state.clock.activePlayerId), action.now);
    case 'activatePlayer':
      return activate(state, action.playerId, action.now);
    case 'pause':
      return pauseClock(state, action.now);
    case 'resume':
      return resumeClock(state, action.now);
    case 'expireClock':
      return expireActiveClock(state, action.now);
    case 'setEliminated': {
      const player = findPlayer(state.players, action.playerId);
      if (!player || player.eliminated === action.eliminated) return state;
      const players = updatePlayer(state.players, action.playerId, (p) => ({ ...p, eliminated: action.eliminated }));
      return recordEvent(
        { ...state, players },
        { type: 'eliminated', playerId: action.playerId, eliminated: action.eliminated },
        takeSnapshot(state),
        action.now,
      );
    }
    case 'updatePlayerInfo': {
      const players = updatePlayer(state.players, action.playerId, (p) => ({
        ...p,
        name: action.name ?? p.name,
        commanderName: action.commanderName ?? p.commanderName,
      }));
      return { ...state, players };
    }
    case 'undo':
      return undo(state, action.now);
    case 'restart':
      return createGame(
        {
          ...state.config,
          // Keep in-game edits to names and commanders for the rematch.
          players: state.players.map((p) => ({ name: p.name, commanderName: p.commanderName, color: p.color })),
        },
        action.now,
      );
  }
}
