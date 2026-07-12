# Publicar3D — Arquitectura de Realidad Aumentada Web

> Resumen técnico de la funcionalidad, componentes y tecnologías que la solución
> utiliza para ejecutar Realidad Aumentada (RA) en web mediante marcadores por
> patrón. Pensado como contexto de onboarding para desarrolladores o agentes.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Angular 21 (standalone components, signals, lazy-loading por rutas) |
| **UI** | Angular Material + Material Icons, SCSS |
| **i18n** | `@ngx-translate/core` (multi-idioma) |
| **Backend / Datos** | Firebase — Firestore vía `@angular/fire` 20 + Auth |
| **Motor 3D/RA** | [A-Frame](https://aframe.io) (framework declarativo sobre Three.js) |
| **Tracking RA** | [AR.js](https://github.com/jeromeetienne/AR.js) (marcadores por patrón, cámara vía `getUserMedia`) |
| **PDF** | `pdfmake` (impresión de marcadores) |
| **Gestos** | JS propio (`gesture-detector.js`) — pinch-to-zoom / rotación |

Los scripts de RA se cargan de forma **global** en `src/index.html` desde CDN:

- A-Frame `0.9.2` (`aframe.io/releases`)
- AR.js `2.0.8` (`raw.githack.com/jeromeetienne/AR.js`)
- `assets/js/gesture-detector.js` (local)

> **Nota:** `ar-pattern-viewer.component.ts` conserva un cargador dinámico de
> scripts (`loadARScripts`) que **ya no se usa** — los scripts vienen del
> `index.html`. El feature `ar-experiences` sí usa un cargador dinámico propio
> apuntando a versiones más nuevas (AR.js-org `master`).

---

## 2. Arquitectura de features

Rutas en `src/app/app.routes.ts` — todas las de RA protegidas por `authGuard`:

- **`/ar-info`** → catálogo/búsqueda de elementos RA (lee Firestore).
- **`/ar-pattern-viewer`** → **visor RA de producción** (marcadores por patrón). Feature `ar-legacy`.
- **`/ar-experiences`** → laboratorio de experiencias RA (marker / GPS / NFT) + generador de marcadores.

```
src/app/features/
├── ar-info/                    # Catálogo Firestore → punto de entrada RA
│   ├── ar-info.component.ts
│   ├── models/ar-element.model.ts
│   └── services/ar-elements.service.ts
├── ar-legacy/                  # Visor RA de PRODUCCIÓN
│   ├── ar-pattern-viewer/…
│   └── services/ar-data.service.ts
└── ar-experiences/             # Modos RA nuevos/experimentales
    ├── ar-experiences.component.ts
    ├── components/marker-generator/…
    └── services/ar-pattern-generator.service.ts

src/assets/
├── js/gesture-detector.js      # Componentes A-Frame de gestos
└── presets/patN.patt           # Marcadores por patrón pre-generados
```

---

## 3. Flujo funcional de RA (camino principal)

```
ar-info (catálogo Firestore)
   │  usuario elige elemento → switchToPlace()
   │  guarda el ArElement en ArDataService (signal) + navigation state
   ▼
ar-pattern-viewer  (RA por marcadores)
   1. Lee el ArElement (history.state o ArDataService)
   2. Espera a que <a-scene> de A-Frame esté lista (waitForSceneReady)
   3. createMarkers(): por cada imagen del elemento genera dinámicamente
      un <a-marker type="pattern" url="/assets/presets/patN.patt">
   4. Adjunta contenido al marcador según image.type:
        - image / poster / vcard → <a-image>
        - video                  → <a-video>
        - model                  → <a-gltf-model> (+ <a-asset-item>)
```

### Datos: `ArElement`

Modelo en `ar-info/models/ar-element.model.ts`. Campos clave para RA:

- `images[]` — assets a mostrar; cada uno con `type`
  (`image` / `video` / `model` / `poster` / `vcard`) y `url` / `value`.
- `indexInit` / `indexEnd` — mapean cada imagen a un archivo de patrón `patN.patt`.
- Se cargan desde colecciones Firestore (`negocio`, `lugares`, …) en
  `ar-elements.service.ts`.

### Escena A-Frame

Definida en `ar-pattern-viewer.component.html`:

```html
<a-scene arjs="sourceType: webcam; patternRatio: 0.85; trackingMethod: best;
               sourceWidth: 1280; sourceHeight: 960;"
         gesture-detector embedded vr-mode-ui="enabled: false">
  <a-assets><!-- <img>/<video> precargados desde ArElement.images --></a-assets>
  <a-entity camera><a-cursor></a-cursor></a-entity>
</a-scene>
```

Los `<a-marker>` **no** están en el HTML: se inyectan por JS en `createMarkers()`.
`CUSTOM_ELEMENTS_SCHEMA` permite a Angular tolerar los elementos custom de A-Frame.

---

## 4. Marcadores / "QR" — cómo funcionan

Publicar3D **no usa QR reales** (no decodifica datos de un QR). Usa **marcadores por
patrón (pattern markers)** de AR.js, que visualmente pueden parecer un QR o un logo
dentro de un borde negro cuadrado.

### Consumo (runtime)

- Archivos `.patt` pre-generados en `src/assets/presets/` (`pat0.patt` … `pat602.patt`).
- Cada marcador se referencia por URL: `/assets/presets/pat{indexInit+i}.patt`.

### Generación (herramienta para el usuario)

`marker-generator.component.ts` + `ar-pattern-generator.service.ts`:

- **`encodeImage()`** — port de `THREEx.ArPatternFile.js`: renderiza la imagen en un
  canvas 16×16, en 4 orientaciones (0/90/180/270°), exportando valores de píxel en
  **orden BGR** → genera el archivo `.patt`.
- **`buildFullMarker()`** — compone la imagen con borde negro y margen (`patternRatio`)
  para producir el marcador imprimible en PNG.
- Exporta **`.patt`**, **PNG**, o **PDF imprimible** (1 / 2 / 6 marcadores por página)
  vía `pdfmake`.

---

## 5. Interacción: gestos

`src/assets/js/gesture-detector.js` registra dos componentes A-Frame:

- **`gesture-detector`** (en `<a-scene>`): escucha `touchstart/move/end` sobre el
  `<canvas>` (`passive:false` para poder `preventDefault`), calcula el centro y el
  "spread" (separación) de los toques, y emite eventos `onefingermove` /
  `twofingermove`.
- **`gesture-handler`** (en cada objeto, atributo
  `gesture-handler="minScale:0.25; maxScale:10"`):
  - **1 dedo** → rotación (`object3D.rotation`)
  - **2 dedos** → escala / pinch-to-zoom
  - Incluye un objeto de debug global `window.__PUBLICAR3D_GESTURE_DEBUG`.

---

## 6. `/ar-experiences` (modos adicionales / experimental)

`ar-experiences.component.ts` soporta 3 modos vía AR.js (versión org/`master`
cargada dinámicamente):

- **marker** — presets `hiro` / `kanji`, patrones custom, matrix codes (`3x3`);
  adjunta primitivas 3D animadas o modelos GLTF.
- **location** — RA geolocalizada (`gps-camera`, `gps-entity-place`, `watchPosition`).
- **image** — image tracking / NFT (`<a-nft>`) — requiere AR.js-org.
- Control de **zoom de cámara** vía `MediaStreamTrack.applyConstraints({zoom})` con
  fallback a escala CSS cuando el hardware no lo soporta.

---

## 7. Consideraciones importantes

- **Dos generaciones de código conviven:**
  - `ar-legacy/ar-pattern-viewer` (producción — A-Frame 0.9.2 / AR.js 2.0.8 desde `index.html`)
  - `ar-experiences` (nueva — AR.js-org `master` dinámico)

  No mezclar versiones: son **incompatibles** entre sí.
- La escena y los marcadores se construyen por **manipulación imperativa del DOM**
  (`insertAdjacentHTML`), no con data-binding de Angular. Los `setTimeout`
  (500 ms / 1500 ms) sincronizan con el ciclo de vida de A-Frame.
- RA requiere **HTTPS** y permiso de **cámara** (`getUserMedia`); diseñado para
  **móvil** (viewport bloqueado, `playsinline`, video a pantalla completa `object-fit: cover`).
- Estado entre pantallas: `ArDataService` (signal de Angular) + `history.state`.
  Al salir se limpia la clase `ar-active` en `<body>` / `<html>`.
- Dependencias de RA servidas por **CDN externo** (`raw.githack.com`) → punto de
  fallo / latencia a vigilar; conviene autoalojar en producción.
