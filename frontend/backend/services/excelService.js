const ExcelJS = require('exceljs');

async function sendExcel(res, filename, sheets) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SVL HRM';
  workbook.created = new Date();

  sheets.forEach((sheet) => {
    const ws = workbook.addWorksheet(sheet.name || 'Sheet1');
    if (sheet.columns?.length) {
      ws.columns = sheet.columns.map((c) => ({
        header: c.header,
        key: c.key,
        width: c.width || 18,
      }));
      ws.getRow(1).font = { bold: true };
    }
    (sheet.rows || []).forEach((row) => ws.addRow(row));
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

module.exports = { sendExcel };
