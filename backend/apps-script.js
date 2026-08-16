/**
 * Backend de leads para Farolabs.
 * Pegar en: Google Sheets -> Extensiones -> Apps Script (reemplaza el código).
 * Luego: Implementar -> Nueva implementación ->Tipo: Aplicación web ->
 *   Ejecutar como: Yo -> Quién tiene acceso: Cualquiera.
 * Copiar la URL de la implementación y pegarla en FAROLABS_FORM_ENDPOINT.
 *
 * ID de la hoja (no necesario en el código si se vincula desde el editor):
 * 1U9QnD2XErxaCtsBLl3Sq40kvq9gwtEmGQKi2_rKQA3g
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, message: 'Farolabs leads endpoint listo' })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

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
      // Si no es JSON, intenta como form-urlencoded.
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
