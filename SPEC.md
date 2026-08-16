# Especificación Técnica — Farolabs (sitio web estático)

Este documento define la arquitectura del nuevo sitio web estático de Farolabs:
un sitio one-page en HTML + CSS + JavaScript puro, con formulario de contacto
cuyo backend escribe en Google Sheets vía Google Apps Script.

---

## 1. Arquitectura

### 1.1 Stack
- HTML5 semántico (sitio one-page, un único `index.html`).
- CSS moderno: variables (custom properties), grid, flexbox. Un solo stylesheet.
- Vanilla JS (sin frameworks, sin build step). Un solo script IIFE.
- Backend de formulario desacoplado vía endpoint configurable (Google Apps Script).
- Deploy estático en GitHub Pages (compatible también con Vercel/Netlify/Cloudflare Pages).

### 1.2 Estructura de archivos
```
farolabs-v3/
├── index.html          (única página; todo el sitio aquí)
├── robots.txt
├── sitemap.xml
├── favicon.svg
├── css/
│   └── styles.css       (design tokens + BEM, un solo archivo)
├── js/
│   └── main.js          (IIFE con 'use strict', métodos por comentarios)
└── assets/
    ├── brand/
    │   ├── faro.svg          (faro real, blanco #FFFFFF; hero y footer)
    │   ├── faro-indigo.svg   (misma silueta, azul egipcio #1034A6; solo header)
    │   ├── isotipo.svg       (placeholder, ya no se usa en el sitio)
    │   └── apple-touch-icon.png
    └── images/
        └── hero.webp         (placeholder degradado, fondo del hero)
```

### 1.3 Patrón CSS (design tokens + BEM + estética aguda)
- `:root` con custom properties por bloque:
  - colores (`--color-*`): blanco, indigo (azul egipcio), negro, gris, faro.
  - tipografías (`--font-*`): titulos (Montserrat serif), body (Montserrat).
  - layout (`--container-max`, `--gutter`, `--header-h`).
  - efectos (`--transition`, `--radius` — usado solo en elementos que NO son
    del formulario; véase sección 1.7).
- Reset/base explícito (box-sizing, margins, img, a, ul, button, input).
- Utilidades reutilizables: `.container`, `.section`, `.section__title`,
  `.section__desc`, `.skip-link`.
- Nomenclatura BEM: `bloque__elemento--modificador`.
- Tipografía con `clamp()` para escala fluida.
- `scroll-behavior: smooth` + `scroll-padding-top` para header fijo.
- **Estética "puntas agudas"** (heredada de farolabs-v2): inputs, selects,
  textareas y botones usan `border-radius: 0` y sombra dura sólida
  (`box-shadow: 2px 2px 0 var(--color-indigo)` en focus, `4px 4px 0` en hover de
  botones) en vez de glow suave. El panel del formulario también es `border-radius: 0`.

### 1.4 Estructura HTML (one-page)
- `<head>`: meta SEO, Open Graph, Twitter card, canonical, fuentes
  (preconnect + Google Fonts), favicon, y `<script>` inline que define
  `window.FAROLABS_FORM_ENDPOINT`.
- `<body>`:
  - skip-link (accesibilidad).
  - `<header>` con logo (faro-indigo.svg, 22px) + botón menú hamburguesa
    (`data-menu-btn`) + `<nav>` (`data-menu`). El nav tiene: Inicio (#hero),
    Nosotros (#valores), Contacto (#hero).
  - `<main>`:
    - `#hero`      (grid 2 columnas; ver sección 2).
    - `#valores`   (grid de 4 tarjetas; contenido placeholder por definir).
  - `<footer>` con marca (faro.svg blanco, 18px), texto y año dinámico
    (`data-year`).
  - `<script src="js/main.js" defer>`.

### 1.5 Patrón JS
- Un solo IIFE con `'use strict'`.
- Módulos: Mobile Menu, Hero reveal, Formulario (pendiente), Año footer.
- Selectores por `data-attributes` (`data-menu-btn`, `data-menu`, `data-year`,
  `data-help-toggle`, `data-help-panel`).
- Accesibilidad: `aria-expanded`, `aria-label`, `role`, `Escape` para cerrar.
- Sin dependencias externas.

### 1.6 Configuración por variable global
- `window.FAROLABS_FORM_ENDPOINT` definido inline en `<head>` (vacío por defecto
  → fallback `/api/leads`).

### 1.7 Notas de estética aguda (aplicada)
- `.form__input`, `.btn`, `.hero__panel`: `border-radius: 0`.
- `.form__input:focus`: `box-shadow: 2px 2px 0 var(--color-indigo)` (sin outline).
- `.form__input:hover`: `transform: translate(-1px,-1px)`.
- `.btn--primary:hover`: `transform: translate(-2px,-2px)` +
  `box-shadow: 4px 4px 0 var(--color-indigo)`.
- `.form__input.error` / `.valid`: sombra dura roja/verde respectiva.
- Textarea de descripción: `resize: none` + `overflow-y: auto` (scroll interno,
  no crece el campo).

---

## 2. Hero con formulario embebido (revelado progresivo)

El hero usa distribución de 2 columnas (split). El formulario de contacto vive
en el lado derecho y se revela de manera progresiva. Es el ÚNICO formulario del
sitio (la sección `#contacto` fue eliminada).

### 2.1 Escritorio
- Grid de 2 columnas dentro de `.hero__inner`.
- **Columna izquierda (`hero__intro`):** titular + subtítulo + CTA "Conoce más"
  (apunta a `#valores`).
- **Columna derecha (`hero__panel`):** arranca angosta mostrando solo el botón
  "Necesito ayuda". Al activarlo, el panel **empuja** (la columna crece de
  angosta a ancha: `1fr 0.4fr` → `0.85fr 1.15fr`) y revela los 4 campos.
- Al abrir, el texto de la columna izquierda se **desvanece** (`opacity: 0` +
  `visibility: hidden`, no `display:none`) y aparece el **faro real** centrado
  (absolute, `top: 10%`, centrado horizontal) con fade-in de 0.4s.
- El botón "Necesito ayuda" se transforma en "Cerrar ✕" (esquina superior
  derecha del panel, estilo ghost gris, mismo nivel que la etiqueta "Nombre").

### 2.2 Faro (real, del proyecto farolabs original)
- `assets/brand/faro.svg`: silueta de faro trazada (potrace), relleno blanco,
  traída del proyecto `farolabs` original (`src/assets/lighthouse.svg`).
- En el hero mide 288px de ancho (agrandado 120% respecto al placeholder).
- Luz morse: círculo `.hero__faro-light` (blanco + glow) superpuesto sobre la
  linterna, animado con keyframe `morse-farolabs` (parpadeo opacidad, no cambia
  color ni tamaño). Morse de "farolabs": `..-. .- .-. --- .-.. .- -... ...`.
- Regla de marca: el faro es de **un solo color (blanco)** y **una sola
  dimensión** (tamaño fijo).

### 2.3 Móvil
- Arranca con el botón "Necesito ayuda".
- Al clic, el formulario se despliega en bloque completo debajo del texto.
- El faro aparece como encabezado del formulario al abrir.
- El botón se vuelve "Cerrar ✕".

### 2.4 Accesibilidad
- Botón con `aria-expanded`, `data-help-toggle`; panel `data-help-panel`.
- Panel fuera del tab order cuando está colapsado (`hidden`).
- Al abrir: foco al primer campo (tras 300ms). Al cerrar: foco al botón.
- `Escape` cierra el panel.

---

## 3. Formulario Estático con Backend en Google Sheets

### 3.1 Arquitectura del flujo
- **Frontend:** HTML + CSS + JavaScript puro. Se sirve desde GitHub Pages.
- **Backend:** Google Apps Script (Web App) que recibe POST y escribe en Sheets.
- **Comunicación:** `fetch` con `POST` y `Content-Type: text/plain` (evita
  CORS preflight).

### 3.2 Requerimientos Funcionales
- **RF-01:** 4 campos: Nombre, Contacto (email o teléfono), Descripción, Urgencia.
- **RF-02:** Al enviar, `fetch` al endpoint con los datos en JSON.
- **RF-03:** Apps Script valida mínimo y agrega una fila.
- **RF-04:** Confirmación visual sin recargar.
- **RF-05:** Si falla, mensaje de error y formulario intacto para reintentar.

### 3.3 Reglas de Negocio (Frontend)
- **RN-01:** Nombre obligatorio.
- **RN-02:** Contacto: selector Email/Teléfono; valida formato según elección.
- **RN-03:** Descripción obligatoria, mínimo 10 caracteres.
- **RN-04:** Urgencia: 4 opciones, default "Media".
- **RN-05:** Botón deshabilitado durante el envío.

### 3.4 Estructura de Datos (JSON que envía el frontend)
```json
{
  "nombre": "string",
  "tipo_contacto": "email|telefono",
  "valor_contacto": "string",
  "descripcion": "string",
  "urgencia": "baja|media|alta|critica",
  "fecha": "ISO string autogenerado por Apps Script"
}
```

### 3.5 Google Sheets (columnas en orden)
```
A         B       C              D               E            F
Fecha     Nombre  Tipo Contacto  Valor Contacto  Descripción  Urgencia
```

### 3.6 Criterios de Aceptación
- Carga sin errores de consola en GitHub Pages.
- Nueva fila en la hoja en menos de 3 segundos.
- Apps Script responde `{ "ok": true, "message": "Recibido" }` o
  `{ "ok": false, "message": "Error" }`. El frontend maneja ambos casos.
- Sin servidor propio ni servicio de pago.

### 3.7 Fuera de Alcance
- Sin autenticación, sin captcha, sin notificaciones por email (ampliable).

---

## 4. Paleta de colores y tokens

### 4.1 Proporciones de uso
- Blanco: 40% (fondos principales)
- Azul egipcio: 30% (accentos, headers, marca)
- Negro: 20% (texto y áreas oscuras)
- Gris: 10% (textos secundarios, bordes)

### 4.2 Valores y tokens CSS
| Uso          | Hex       | Token CSS            | Notas                                    |
|--------------|-----------|----------------------|------------------------------------------|
| Blanco       | `#FFFFFF` | `--color-blanco`     | fondos                                   |
| Azul egipcio | `#1034A6` | `--color-indigo`     | accentos, marca, sombra dura del form    |
| Negro        | `#1A1A1A` | `--color-negro`      | texto y áreas oscuras                    |
| Gris         | `#8A8A8A` | `--color-gris`       | textos secundarios                       |
| Luz del faro | `#FFFFFF` | `--color-faro`       | blanco, un solo color, una dimensión     |

- Tokens en `:root` de `css/styles.css`.
- El faro del header usa `faro-indigo.svg` (azul egipcio, igual que el texto
  "FAROLABS"). El footer y el hero usan `faro.svg` (blanco).
- El faro es de un solo color (blanco en hero/footer, azul egipcio en header) y
  una sola dimensión (tamaño fijo). La luz morse parpadea por opacidad, sin
  cambiar color ni tamaño.

---

## 5. Notas del formulario (patrón del sitio)

- Validación por campo en `blur`/`input`, clases `.error`/`.valid`,
  `<span class="form__error" role="alert">`, `data-form-submit`,
  `data-form-status`, estado de carga con spinner.
- Envío POST `text/plain` al endpoint `FAROLABS_FORM_ENDPOINT`.
- Respuesta manejada como `ok`/`message` (sección 3.6).
- Payload con `tipo_contacto` y `valor_contacto` separados (sección 3.4).
- Campos adaptados a RN-01..RN-05.
- **El formulario aparece en UN solo lugar: dentro del hero (sección 2, revelado
  progresivo).** La sección `#contacto` fue eliminada; el nav "Contacto" apunta
  a `#hero` para llevar al usuario al hero y al botón "Necesito ayuda".
