/**
 * Backend de leads para Farolabs.
 * Pegar en: Google Sheets -> Extensiones -> Apps Script (reemplaza el código).
 * Luego: Implementar -> Nueva implementación -> Tipo: Aplicación web ->
 *   Ejecutar como: Yo -> Quién tiene acceso: Cualquiera.
 * Copiar la URL de la implementación y pegarla en FAROLABS_FORM_ENDPOINT
 * (en index.html, dentro de <script> en el <head>).
 *
 * IMPORTANTE: no commitees el ID real de la hoja ni la URL del script a un
 * repositorio público. Usa los placeholders de abajo y completalos en Google.
 */
var SHEET_ID = 'TU_SHEET_ID_AQUI'; // <-- reemplaza con el ID real de tu Google Sheet

function getHoja() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheets()[0]; // primera hoja del documento
}

function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};

  // Modo prueba: abre la URL con ?test=1 para insertar una fila de prueba.
  if (p.test === '1') {
    try {
      var sheet = getHoja();
      var headers = ['Fecha', 'Nombre', 'Contacto', 'Descripcion', 'Urgencia'];
      var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      if (firstRow.every(function (c) { return c === ''; })) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
      var fecha = new Date().toISOString();
      sheet.appendRow([fecha, 'PRUEBA', 'test@farolabs.pro', 'Fila insertada por modo prueba (?test=1).', 'media']);
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true, message: 'Fila de prueba insertada', fecha: fecha })
      ).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, message: String(err) })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: 'Farolabs leads endpoint listo' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = getHoja();

    // Cabeceras esperadas (se crean solas la primera vez).
    var headers = ['Fecha', 'Nombre', 'Contacto', 'Descripcion', 'Urgencia'];
    var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    var needsHeaders = firstRow.every(function (c) { return c === ''; });
    if (needsHeaders) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    // Parse del cuerpo (text/plain o JSON).
    var data = {};
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
    try {
      data = JSON.parse(raw);
    } catch (err) {
      if (raw && raw.indexOf('=') !== -1) {
        raw.split('&').forEach(function (pair) {
          var kv = pair.split('=');
          data[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || '');
        });
      }
    }

    var fecha = data.fecha || new Date().toISOString();
    var nombre = (data.nombre || '').toString().trim();
    var contacto = (data.contacto || '').toString().trim();
    var descripcion = (data.descripcion || '').toString().trim();
    var urgencia = (data.urgencia || 'media').toString().trim();

    sheet.appendRow([fecha, nombre, contacto, descripcion, urgencia]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, message: 'Recibido' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, message: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
