# Especificación Técnica — Farolabs (sitio web estático)

Este documento define la arquitectura del sitio web estático de Farolabs:
un sitio one-page en HTML + CSS + JavaScript puro, con formulario de contacto
cuyo backend escribe en Google Sheets vía Google Apps Script. En producción en
https://farolabs.pro (GitHub Pages + dominio propio en Cloudflare).

---

## 1. Arquitectura

### 1.1 Stack
- HTML5 semántico (sitio one-page en `index.html` + página aparte `privacidad.html`).
- CSS moderno: variables (custom properties), grid, flexbox. Un solo stylesheet.
- Vanilla JS (sin frameworks, sin build step). Un solo script IIFE.
- Backend de formulario desacoplado vía endpoint configurable (Google Apps Script).
- Deploy estático en GitHub Pages (dominio `farolabs.pro` vía Cloudflare DNS A).

### 1.2 Estructura de archivos
```
farolabs-v3/
├── index.html          (página principal; todo el sitio one-page aquí)
├── privacidad.html     (Política de Privacidad, aparte, enlazada en footer)
├── robots.txt
├── sitemap.xml
├── favicon.svg         (cúpula del faro blanco, recorte cuadrado 430 0 520 260)
├── css/
│   └── styles.css       (design tokens + BEM, un solo archivo)
├── js/
│   └── main.js          (IIFE con 'use strict', módulos por comentarios)
├── backend/
│   └── apps-script.js   (referencia del Apps Script; el código real corre en Google)
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
  - tipografías (`--font-*`): titulos (Montserrat), body (Montserrat).
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

### 1.4 Estructura HTML (one-page + privacidad)
- `<head>`: meta SEO, Open Graph, Twitter card, canonical (`https://farolabs.pro/`),
  fuentes (preconnect + Google Fonts), favicon, y `<script>` inline que define
  `window.FAROLABS_FORM_ENDPOINT` (URL del Apps Script desplegado).
- `<body>` (index.html):
  - skip-link (accesibilidad).
  - `<header>` con logo (faro-indigo.svg, 22px) + botón menú hamburguesa
    (`data-menu-btn`) + `<nav>` (`data-menu`). El nav tiene: Inicio (#hero),
    Bitácora (#valores), Contacto (abre el formulario del hero vía `data-help-open`).
  - `<main>`:
    - `#hero`      (grid 2 columnas; ver sección 2).
    - `#valores`   (Bitácora del Faro: grid 50/50; ver sección 4).
  - `<footer>` con marca (faro.svg blanco, 18px, a la izquierda del texto),
    año dinámico (`data-year`) y enlace a Política de Privacidad.
  - `<script src="js/main.js" defer>`.
- `privacidad.html`: misma cabecera/footer, sección con la política (texto
  chileno, Ley 19.628/21.719), enlazada desde el footer de ambas páginas.

### 1.5 Patrón JS
- Un solo IIFE con `'use strict'`.
- Módulos: Mobile Menu, Hero reveal, Formulario, Año footer.
- Selectores por `data-attributes` (`data-menu-btn`, `data-menu`, `data-year`,
  `data-help-toggle`, `data-help-panel`, `data-help-open`, `data-form-submit`,
  `data-form-status`).
- Accesibilidad: `aria-expanded`, `aria-label`, `role`, `Escape` para cerrar.
- Sin dependencias externas.

### 1.6 Configuración por variable global
- `window.FAROLABS_FORM_ENDPOINT` definido inline en `<head>` (URL del Apps Script
  desplegado; fallback `/api/leads` si está vacío).

### 1.7 Notas de estética aguda (aplicada)
- `.form__input`, `.btn`, `.hero__panel`: `border-radius: 0`.
- `.form__input:focus`: `box-shadow: 2px 2px 0 var(--color-indigo)` (sin outline).
- `.form__input:hover`: `transform: translate(-1px,-1px)`.
- `.btn--primary:hover`: `transform: translate(-2px,-2px)` +
  `box-shadow: 4px 4px 0 var(--color-indigo)`.
- `.form__input.error` / `.valid`: sombra dura roja/verde respectiva.
- Textarea de descripción: `resize: none` + `overflow-y: auto` (scroll interno,
  no crece el campo).
- `.form__consent-label` / `.form__consent-input`: checkbox de consentimiento
  con `accent-color: var(--color-indigo)`.

---

## 2. Hero con formulario embebido (revelado progresivo)

El hero usa distribución de 2 columnas (split). El formulario de contacto vive
en el lado derecho y se revela de manera progresiva. Es el ÚNICO formulario del
sitio (la sección `#contacto` fue eliminada).

### 2.1 Escritorio
- Grid de 2 columnas dentro de `.hero__inner`.
- **Columna izquierda (`hero__intro`):** titular + subtítulo + CTA "Conoce la
  Bitácora" (apunta a `#valores`).
- **Columna derecha (`hero__panel`):** arranca angosta mostrando solo el botón
  "Necesito ayuda". Al activarlo, el panel **empuja** (la columna crece de
  angosta a ancha: `1fr 0.4fr` → `0.85fr 1.15fr`) y revela los 5 campos.
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
- **Favicon** (`favicon.svg`): recorte cuadrado de la cúpula del faro
  (`viewBox="430 0 520 260"`, `preserveAspectRatio="xMidYMid slice`), relleno
  blanco sobre fondo transparente. Se ve en pestaña de navegador de fondo oscuro.

### 2.3 Móvil
- Arranca con el botón "Necesito ayuda".
- Al clic, el formulario se despliega en bloque completo debajo del texto.
- El faro aparece como encabezado del formulario al abrir, **pegado al borde
  derecho** (`right: 0`).
- El botón se vuelve "Cerrar ✕".
- El link "Contacto" del menú también abre el formulario (cierra el menú móvil
  si está abierto).

### 2.4 Accesibilidad
- Botón con `aria-expanded`, `data-help-toggle`; panel `data-help-panel`.
- Panel fuera del tab order cuando está colapsado (`hidden`).
- Al abrir: foco al primer campo (tras 300ms). Al cerrar: foco al botón.
- `Escape` cierra el panel.
- Link "Contacto" (`data-help-open`) llama `setOpen(true)` y previene el scroll.

---

## 3. Formulario Estático con Backend en Google Sheets

### 3.1 Arquitectura del flujo
- **Frontend:** HTML + CSS + JavaScript puro. Se sirve desde GitHub Pages.
- **Backend:** Google Apps Script (Web App) que recibe POST y escribe en Sheets.
- **Comunicación:** `fetch` con `POST` y `Content-Type: text/plain` (evita
  CORS preflight). El Apps Script está desplegado como "Cualquiera" (acceso
  público) y abre la hoja por ID explícito (`openById`) para no depender de la
  hoja activa.

### 3.2 Requerimientos Funcionales
- **RF-01:** 5 campos visibles: Nombre, Contacto (email), Descripción, Urgencia,
  y checkbox de Consentimiento (Política de Privacidad).
- **RF-02:** Al enviar, `fetch` al endpoint con los datos en JSON.
- **RF-03:** Apps Script valida y agrega una fila.
- **RF-04:** Confirmación visual sin recargar.
- **RF-05:** Si falla, mensaje de error y formulario intacto para reintentar.
- **RF-06:** El campo "Tipo de contacto" fue ELIMINADO; el contacto siempre es
  por correo electrónico (input `type="email"`).

### 3.3 Reglas de Negocio (Frontend)
- **RN-01:** Nombre obligatorio.
- **RN-02 (simplificado):** Contacto siempre email; valida formato
  `regex ^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- **RN-03:** Descripción obligatoria, mínimo 10 caracteres.
- **RN-04:** Urgencia: 4 opciones (baja/media/alta/crítica), default "Media".
- **RN-05:** Botón deshabilitado durante el envío (estado `.loading` + spinner).
- **RN-06:** Checkbox de consentimiento obligatorio antes de enviar. El texto
  enlaza a `privacidad.html`.

### 3.4 Estructura de Datos (JSON que envía el frontend)
```json
{
  "nombre": "string",
  "contacto": "string (email)",
  "descripcion": "string",
  "urgencia": "baja|media|alta|critica",
  "consentimiento": true,
  "fecha": "ISO string autogenerado por el frontend"
}
```

### 3.5 Google Sheets (columnas en orden)
```
A         B       C              D               E            F
Fecha     Nombre  Contacto       Descripción     Urgencia     Consentimiento
```
- Cabeceras se crean solas la primera vez si la primera fila está vacía.
- `consentimiento` se guarda como "Sí"/"No".
- El Apps Script de referencia está en `backend/apps-script.js` (con placeholder
  de `SHEET_ID`; el script real en Google usa el ID explícito de la hoja).

### 3.6 Criterios de Aceptación
- Carga sin errores de consola en GitHub Pages.
- Nueva fila en la hoja en menos de 3 segundos.
- Apps Script responde `{ "ok": true, "message": "Recibido" }` o
  `{ "ok": false, "message": "Error" }`. El frontend maneja ambos casos.
- Modo prueba: `GET ?test=1` inserta una fila de prueba y responde JSON.
- Sin servidor propio ni servicio de pago.

### 3.7 Cumplimiento (Chile)
- El formulario recoge datos personales → se rige por Ley 19.628 / 21.719.
- Existe `privacidad.html` (Política de Privacidad) enlazada en el footer y
  desde el checkbox de consentimiento.
- Checkbox de consentimiento (RN-06) obligatorio antes de enviar.
- El sitio NO usa cookies de seguimiento ni analítica de terceros.

### 3.8 Fuera de Alcance
- Sin autenticación, sin captcha, sin notificaciones por email (ampliable).
- Sin banner de cookies (no aplica al no haber tracking de terceros).

---

## 4. Bitácora del Faro (`#valores`)

Sección que reemplazó a "Nosotros". Explica el enfoque de Farolabs en un grid
de 2 columnas (50/50) en escritorio, apilado en móvil.

### 4.1 Layout
- `.bitacora__grid`: `grid-template-columns: 1fr 1fr; gap: 3rem` (escritorio).
- **Izquierda (`.bitacora__intro`):** título "De la complejidad a la ventaja" +
  párrafo de presentación (justificado). Texto literal:
  > Transformamos la complejidad operativa en ventajas competitivas. Evaluamos la
  > arquitectura actual de sus procesos. Diseñamos e implementamos las soluciones
  > tecnológicas exactas que tu negocio necesita, ya sea mediante el desarrollo de
  > software a medida o la integración estratégica de herramientas comerciales ya
  > existentes, que garanticen la continuidad operativa, la visibilidad de datos en
  > tiempo real y la máxima eficiencia en cada área de su organización.
- **Derecha (`.bitacora__lista`):** los 3 pilares (ver 4.2).
- En móvil (`max-width: 767px`): `.bitacora__grid` pasa a 1 columna.

### 4.2 Los 3 pilares (texto literal)
1. **Ingeniería de Procesos** — Analizo cómo opera tu empresa hoy para encontrar
   fugas de dinero, duplicidad de tareas o pérdidas de tiempo.
2. **Evaluación Tecnológica Inteligente** — Decidimos objetivamente qué te
   conviene más: configurar e integrar un software que ya existe en el mercado
   (ahorrando costos) o desarrollar un sistema a medida desde cero si tu operación
   es muy específica.
3. **Implementación y Adopción Total** — No te entrego un sistema y desaparezco.
   Integro las herramientas con tu infraestructura actual y capacito a tu equipo
   para asegurar que el software realmente se use y rinda frutos.

### 4.3 Tipografía y justificación
- Título de sección `.section__title`: "Bitácora del Faro".
- Todos los párrafos (intro y pilares) con `text-align: justify` (bloque recto).

---

## 5. Paleta de colores y tokens

### 5.1 Proporciones de uso
- Blanco: 40% (fondos principales)
- Azul egipcio: 30% (accentos, headers, marca)
- Negro: 20% (texto y áreas oscuras)
- Gris: 10% (textos secundarios, bordes)

### 5.2 Valores y tokens CSS
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
- Footer: icono faro a la izquierda del texto "FAROLABS" (`flex` con `gap`),
  `padding: 3.5rem 0` (más alto que el inicial de 2rem).

---

## 6. Notas del formulario (patrón del sitio)

- Validación por campo en `blur`/`input`, clases `.error`/`.valid`,
  `<span class="form__error" role="alert">`, `data-form-submit`,
  `data-form-status`, estado de carga con spinner.
- Envío POST `text/plain` al endpoint `FAROLABS_FORM_ENDPOINT`.
- Respuesta manejada como `ok`/`message` (sección 3.6).
- Payload con `contacto` (email) y `consentimiento` (sección 3.4).
- Campos adaptados a RN-01..RN-06.
- **El formulario aparece en UN solo lugar: dentro del hero (sección 2, revelado
  progresivo).** La sección `#contacto` fue eliminada; el nav "Contacto" abre el
  formulario del hero (no navega a #hero).

## 7. Producción y despliegue
- Repo: `MtsFCG/farolabs-v3` (GitHub, público).
- GitHub Pages: rama `main`, carpeta root. Dominio `farolabs.pro` vía Cloudflare
  (registros A a 185.199.108-111.153, proxy desactivado para el A de verificación).
- HTTPS: certificado de GitHub Pages (Enforce HTTPS activo).
- `backend/apps-script.js` es solo referencia; el código que corre es el pegado
  en el editor de Apps Script de la hoja (debe actualizarse allí al cambiar).
- No commitear a GitHub el ID real de la hoja ni la URL del script (usar
  placeholders en el repo).
