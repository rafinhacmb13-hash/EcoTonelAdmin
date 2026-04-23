const SHEET_NAME = 'EcoTonelDados';

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify(getData_()))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  saveData_(payload);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getData_() {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) {
    return {
      notas: [],
      operacao: [],
      administrativo: [],
      financeiro: [],
      comercial: []
    };
  }

  const raw = rows[1][0];
  if (!raw) return { notas: [], operacao: [], administrativo: [], financeiro: [], comercial: [] };
  return JSON.parse(raw);
}

function saveData_(payload) {
  const sheet = getSheet_();
  sheet.clearContents();
  sheet.getRange(1, 1, 1, 2).setValues([['json', 'updatedAt']]);
  sheet.getRange(2, 1, 1, 2).setValues([[JSON.stringify(payload), new Date()]]);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}
