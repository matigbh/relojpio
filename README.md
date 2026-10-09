# Mesa Commander

Reloj tipo ajedrez + contador de vida + daño de comandante para partidas de **Magic: The Gathering – Commander** de 2 a 6 jugadores, pensado para dejar un solo teléfono en el centro de la mesa.

Funciona 100 % offline, sin cuentas ni servidor. Es una aplicación original (nombre, ícono, colores y diseño propios).

## Tecnología

**PWA con React + TypeScript + Vite**, instalable en iOS y Android desde el navegador.

- Una sola base de código para iPhone, Android y escritorio; no requiere tiendas ni cuentas de desarrollador.
- Offline real: un service worker (Workbox) guarda la app completa en el dispositivo.
- La rotación por asiento (0°/90°/180°/270°) se resuelve con CSS (container queries + `transform`), con rendimiento nativo.
- Si en el futuro se quiere publicar en App Store / Play Store, el mismo código se empaqueta con **Capacitor** (ver abajo) sin reescribir nada.

## Estructura

```
src/
  core/                 Lógica del juego: TypeScript puro, sin React, 100 % testeable
    types.ts            Modelo: Player, ClockState, GameState, GameEvent, HistoryEntry
    timer.ts            Sistema de relojes (basado en timestamps)
    life.ts             Sistema de vida
    commanderDamage.ts  Daño de comandante y detección de 21+
    players.ts          Jugadores, orden de turno
    history.ts          Historial + fusión de toques rápidos
    gameReducer.ts      Acciones → nuevo estado (incluye deshacer)
    format.ts           Formato de reloj y textos del historial
    __tests__/          Tests de las partes críticas
  settings/             Ajustes (tema, sonido…) y última configuración usada
  persistence/          Guardado en localStorage
  feedback/             Sonidos (Web Audio, sin archivos) y vibración
  ui/                   React: pantallas, componentes, hooks, estilos
```

El estado del juego es independiente de la interfaz: la UI solo despacha acciones (`adjustLife`, `passTurn`, `undo`…) al reducer de `core/`.

### Decisiones clave

- **Tiempo por timestamps**: solo se guarda `runningSince` y el tiempo "asentado" de cada jugador. El tiempo restante siempre se calcula como `restante − (ahora − runningSince)`, así que bloquear el teléfono, minimizar o cerrar la app no pierde precisión.
- **La app no arbitra**: nunca elimina a nadie ni cambia la vida automáticamente (vida ≤ 0, 21 de daño de comandante o tiempo agotado solo muestran alertas). La eliminación es manual y se puede deshacer.
- **Deshacer** funciona siempre (aunque el historial visible esté desactivado). Los toques rápidos al mismo contador (−1 −1 −1) se fusionan en una sola entrada ("pierde 3 de vida") y se deshacen juntos.
- **Deshacer un cambio de turno** actúa como si el pase nunca hubiera ocurrido: el tiempo que corrió el jugador equivocado se le devuelve y se le cobra a quien realmente seguía jugando.

## Cómo se usa en la mesa

- El jugador 1 se sienta abajo; el resto en sentido horario (izquierda, arriba, derecha). Cada zona está rotada hacia su jugador.
- **Empezar**: cada jugador ve "▶ Empiezo yo"; lo toca quien empieza.
- **Pasar turno**: botón grande "Pasar turno ➜" en la zona del jugador activo (salta a los eliminados). Tocar el reloj de otro jugador le da el turno directamente.
- **Vida**: −5 / −1 / +1 / +5. Tocar el número abre un teclado (orientado hacia ese jugador) para escribir el valor.
- **Daño de comandante**: tocar los chips ⚔ (o el nombre) abre la hoja de ese jugador con el daño recibido de cada comandante, editable con botones o teclado. También permite editar nombre/comandante y marcar eliminado.
- **Centro**: ↶ deshacer, ❚❚ pausa + menú (continuar, deshacer, historial, ajustes, reiniciar, salir).
- El reloj cambia a naranja con poco tiempo (2 min, o 25 % del total en partidas cortas) y a rojo al agotarse.

## Requisitos

- Node.js 18 o superior (probado con Node 24).

## Ejecutar en desarrollo

```bash
npm install
```

```bash
npm run dev
```

Abre `http://localhost:5173`. El servidor también se publica en la red local (la consola muestra la URL `Network`), útil para probar desde el teléfono en la misma Wi-Fi. Nota: el modo offline/instalable requiere HTTPS, así que en la red local solo sirve para probar.

## Tests

```bash
npm test
```

Cubre reloj (inicio, pausa, cambio de jugador, incremento, tiempo agotado, restauración tras segundo plano, deshacer turno), vida (±1, ±5, negativos, valor directo, deshacer, fusión de toques) y daño de comandante (registrar, acumular, distintos comandantes, exactamente 21, más de 21, deshacer).

## Build de producción

```bash
npm run build
```

Genera `dist/` (estático, ~60 KB gzip). Se puede previsualizar con `npm run preview`.

## Instalar en el teléfono (recomendado para uso personal)

1. Publica la carpeta `dist/` en cualquier hosting estático con HTTPS (gratis):
   - **Netlify Drop**: arrastra la carpeta `dist` en https://app.netlify.com/drop.
   - **GitHub Pages**, **Vercel** o **Cloudflare Pages** también sirven (la app usa rutas relativas, funciona en subcarpetas).
2. Abre la URL en el teléfono:
   - **iPhone (Safari)**: Compartir → *Agregar a pantalla de inicio*.
   - **Android (Chrome)**: menú ⋮ → *Instalar app* / *Agregar a pantalla principal*.
3. Ábrela una vez con conexión; desde entonces funciona sin Internet, a pantalla completa.

Limitaciones del navegador: la vibración no existe en iOS Safari (en Android sí). En iOS el sonido se habilita tras el primer toque.

## Builds nativos iOS / Android (opcional, con Capacitor)

Solo si se quiere distribuir por tiendas o usar APIs nativas (por ejemplo vibración en iPhone con `@capacitor/haptics`).

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

```bash
npx cap init "Mesa Commander" com.tunombre.mesacommander --web-dir dist
```

```bash
npm run build
```

```bash
npx cap add android
```

```bash
npx cap add ios
```

Cada vez que cambie el código: `npm run build` y luego `npx cap sync`.

- **Android** (Windows/Mac/Linux, requiere Android Studio): `npx cap open android` → *Build › Generate Signed Bundle / APK*. Para probar sin firmar: *Run* con el teléfono conectado.
- **iOS** (requiere Mac con Xcode y cuenta Apple Developer para distribuir): `npx cap open ios` → elegir equipo de firma → *Product › Archive*.

## Futuras funciones

La arquitectura deja preparado el terreno para: imagen del comandante / búsqueda en Scryfall (campo nuevo en `Player`), registro de decks y estadísticas (los `GameState` terminados ya son datos serializables), más formatos (vida inicial y reglas en `GameConfig`), y contadores adicionales (Poison, Energy, Experience, Monarch, City's Blessing, Ring, Initiative) como nuevos campos en `Player` + nuevos `GameEvent`, reutilizando historial y deshacer. Ninguna está implementada todavía.
