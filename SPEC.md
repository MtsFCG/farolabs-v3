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
│   └── main.js          (IIFE con 'use strict', módulos por comentarios)
└── assets/
    ├── brand/           (isotipo, logo, apple-touch-icon, SVGs)
    └── images/          (hero y demás imágenes)
```

### 1.3 Patrón CSS (design tokens + BEM)
- `:root` con custom properties por bloque:
  - colores (`--color-*`)
  - tipografías (`--font-*`)
  - layout (`--container-max`, `--gutter`, `--header-h`)
  - efectos (`--transition`, `--radius`)
- Reset/base explícito (box-sizing, margins, img, a, ul, button, input).
- Utilidades reutilizables: `.container`, `.section`, `.section__title`,
  `.section__desc`, `.skip-link`.
- Nomenclatura BEM estricta: `bloque__elemento--modificador`
  (ej. `header`, `header__nav`, `header__menu-btn`, `btn--primary`, `form__error`).
- Tipografía con `clamp()` para escala fluida.
- `scroll-behavior: smooth` + `scroll-padding-top` para header fijo.

### 1.4 Estructura HTML (one-page)
- `<head>`: meta SEO, Open Graph, Twitter card, canonical, fuentes
  (preconnect + Google Fonts), favicon, y un `<script>` inline que define la
  variable global del endpoint del formulario.
- `<body>`:
  - skip-link (accesibilidad).
  - `<header>` con logo + botón menú hamburguesa (`data-menu-btn`) + `<nav>` (`data-menu`).
  - `<main>`:
    - `#hero`      (grid 2 columnas; ver sección 1.6)
    - `#valores`   (grid de tarjetas, iconos SVG inline) — *secciones de
      contenido a definir por proyecto*
    - `#contacto`  (formulario completo de captura de leads)
  - `<footer>` con marca, links, año dinámico (`data-year`).
  - `<script src="js/main.js" defer>`.

### 1.5 Patrón JS
- Un solo IIFE con `'use strict'`.
- Módulos separados por comentarios: Mobile Menu, Hero reveal, Formulario, Año footer.
- Selectores por `data-attributes` (`data-menu-btn`, `data-menu`, `data-year`,
  `data-help-toggle`, `data-help-panel`).
- Accesibilidad: `aria-expanded`, `aria-label`, `role`, `Escape` para cerrar.
- Sin dependencias externas.

### 1.6 Configuración por variable global
- `window.FAROLABS_FORM_ENDPOINT` definido inline en `<head>`.
- Permite cambiar el destino del formulario sin tocar HTML/JS.
- Si no se define, fallback a `/api/leads` (o el endpoint por defecto que se
  acuerde; ver sección 2).

---

## 2. Hero con formulario embebido (revelado progresivo)

El hero usa una distribución de 2 columnas (opción split). El formulario de
contacto vive en el lado derecho y se revela de manera progresiva: arranca
colapsado y se expande hacia la izquierda al activarlo.

### 2.1 Escritorio
- Grid de 2 columnas dentro de `.hero__inner`.
- **Columna izquierda (`hero__intro`):** titular + subtítulo + CTA.
- **Columna derecha (`hero__panel`):** arranca angosta mostrando solo el botón
  "Necesito ayuda". Al activarlo, el panel **empuja** (la columna crece de
  angosta a ancha y el texto de la izquierda se desplaza) y revela los 4 campos
  del formulario.
- Al abrir, el texto de la columna izquierda se reemplaza por el **icono del
  faro** (SVG inline) con una luz que parpadea en **morse "farolabs"**. Al
  cerrar, vuelve el texto de marca.
- El botón "Necesito ayuda" se transforma en "Cerrar" al expandirse (mismo
  botón, toggle).

### 2.2 Animación
- Transición de `grid-template-columns` (angosto → ancho), sin animar `width`
  directo para evitar saltos.
- Campos con `opacity` + leve desplazamiento al aparecer.
- Luz morse en loop con CSS keyframes (punto = blink corto, raya = blink largo,
  pausa entre letras). Morse de "farolabs": `..-. .- .-. --- .-.. .- -... ...`.
- Color de la luz en token nuevo (ej. `--color-faro`, por definir en la paleta).

### 2.3 Móvil
- Arranca con el botón "Necesito ayuda".
- Al clic, el formulario se despliega en **bloque completo debajo** del texto
  (sin expansión lateral, porque el split no aplica en pantallas chicas).
- El icono del faro en morse aparece como encabezado del formulario al abrir.
- El botón se vuelve "Cerrar".

### 2.4 Accesibilidad
- Botón con `aria-expanded`, `data-help-toggle`.
- Panel con `data-help-panel`; fuera del tab order cuando está colapsado.
- Al abrir: mover el foco al primer campo. Al cerrar: devolver el foco al botón.
- `Escape` cierra el panel.

---

## 3. Formulario Estático con Backend en Google Sheets

### 3.1 Arquitectura del flujo
- **Frontend:** HTML + CSS + JavaScript puro (sin frameworks, sin build step).
  Se sirve desde GitHub Pages.
- **Backend:** Google Apps Script desplegado como Web App. Recibe POST y escribe
  en Google Sheets.
- **Comunicación:** `fetch` desde el frontend al endpoint de Apps Script con
  método `POST` y `Content-Type: text/plain` (para evitar CORS preflight).

### 3.2 Requerimientos Funcionales
- **RF-01:** Formulario de 4 campos visibles: Nombre, Contacto (email o
  teléfono), Descripción, Urgencia.
- **RF-02:** Al enviar, el frontend hace `fetch` al endpoint de Apps Script con
  los datos como JSON.
- **RF-03:** El backend de Apps Script recibe los datos, los valida mínimamente
  y los agrega como una nueva fila en la hoja de cálculo.
- **RF-04:** El frontend muestra confirmación visual sin recargar la página.
- **RF-05:** Si el `fetch` falla, se muestra mensaje de error y el formulario
  queda intacto para reintentar.

### 3.3 Reglas de Negocio (Frontend)
- **RN-01:** Nombre obligatorio.
- **RN-02:** Contacto: el usuario elige "Email" o "Teléfono" con un selector.
  Según elección, se valida el formato correspondiente.
- **RN-03:** Descripción obligatoria, mínimo 10 caracteres.
- **RN-04:** Urgencia con selector de 4 opciones y valor por defecto "Media".
- **RN-05:** Botón deshabilitado mientras hay un envío en curso (evitar doble envío).

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

### 3.5 Google Sheets (columnas esperadas en orden)
```
A         B       C              D               E            F
Fecha     Nombre  Tipo Contacto  Valor Contacto  Descripción  Urgencia
```

### 3.6 Criterios de Aceptación
- La página carga sin errores de consola en GitHub Pages.
- Al enviar el formulario, una nueva fila aparece en la hoja de Google en menos
  de 3 segundos.
- El endpoint de Apps Script responde con JSON:
  `{ "ok": true, "message": "Recibido" }` o `{ "ok": false, "message": "Error" }`.
- El frontend maneja ambos casos correctamente.
- No se requiere ningún servidor propio ni servicio de pago.

### 3.7 Fuera de Alcance
- Sin autenticación de usuarios.
- Sin captcha (se puede agregar después si hay spam).
- Sin notificaciones por email (se puede agregar después con `MailApp` en Apps Script).

---

## 4. Paleta de colores y tokens

### 4.1 Proporciones de uso
- Blanco: 40% (fondos principales)
- Azul índigo: 30% (accentos, headers, marca)
- Negro: 20% (texto y áreas oscuras)
- Gris: 10% (textos secundarios, bordes)

### 4.2 Valores y tokens CSS
| Uso          | Hex       | Token CSS            |
|--------------|-----------|----------------------|
| Blanco       | `#FFFFFF` | `--color-blanco`     |
| Azul egipcio | `#1034A6` | `--color-indigo`     |
| Negro        | `#1A1A1A` | `--color-negro`      |
| Gris         | `#8A8A8A` | `--color-gris`       |
| Luz del faro | `#FFFFFF` | `--color-faro`     |

- Los tokens se declaran en `:root` dentro de `css/styles.css`, junto a los
  tokens de tipografía y layout ya definidos en la sección 1.3.
- `--color-faro` = blanco (`#FFFFFF`). El faro es de **un solo color** (blanco)
  y **una sola dimensión** (tamaño fijo, no varía). La luz morse (sección 2.2)
  parpadea mediante opacidad/visibilidad, sin cambiar color ni tamaño.

---

## 5. Notas del formulario (patrón del sitio)

- Validación por campo en `blur`/`input`, clases `.error`/`.valid`,
  `<span class="form__error" role="alert">`, `data-form-submit`,
  `data-form-status`, estado de carga con spinner.
- El envío usa POST `text/plain` al endpoint `FAROLABS_FORM_ENDPOINT`.
- La respuesta del backend se maneja como `ok`/`message` (sección 3.6): el
  frontend lee el JSON de respuesta cuando está disponible.
- El payload incluye `tipo_contacto` y `valor_contacto` separados (no un solo
  campo "contacto"), según la estructura de datos de la sección 3.4.
- Campos adaptados a las reglas de negocio: selector de tipo de contacto
  (RN-02), descripción con mínimo de 10 caracteres (RN-03), selector de urgencia
  con default "Media" (RN-04), botón deshabilitado durante el envío (RN-05).
- El formulario aparece en dos lugares: dentro del hero (sección 2, revelado
  progresivo) y en la sección `#contacto` (formulario completo). Ambos usan el
  mismo patrón de validación y envío.
