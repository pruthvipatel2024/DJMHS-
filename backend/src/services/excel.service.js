const ExcelJS = require('exceljs');
const prisma = require('../config/db');

/**
 * Create a styled Excel workbook for exported institutional grids
 */
const exportToExcel = async (sheetName, columns, rows) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DJMHS High School ERP';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: 'FF1D4ED8' } },
  });

  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 25,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' },
    };
    cell.font = { name: 'Inter', family: 4, size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  rows.forEach((rowData) => {
    const r = sheet.addRow(rowData);
    r.font = { name: 'Inter', size: 10, color: { argb: 'FF1E293B' } };
    r.alignment = { vertical: 'middle' };
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * Parse and validate Student Excel file for Bulk Import & New Admissions
 */
const parseStudentBulkImport = async (filePath, adminUserId) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];

  const rawRows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const grNumber = row.getCell(1).text?.trim() || null;
    const rollNumber = row.getCell(2).text?.trim() || '01';
    const firstName = row.getCell(3).text?.trim() || '';
    const lastName = row.getCell(4).text?.trim() || '';
    const gender = row.getCell(5).text?.trim() || 'Male';
    const dobStr = row.getCell(6).text?.trim() || '2010-01-01';
    const standardName = row.getCell(7).text?.trim() || 'Standard 10';
    const divisionName = row.getCell(8).text?.trim() || 'A';
    const fatherName = row.getCell(9).text?.trim() || '';
    const motherName = row.getCell(10).text?.trim() || '';
    const parentPhone = row.getCell(11).text?.trim() || '';
    const parentEmail = row.getCell(12).text?.trim() || '';
    const address = row.getCell(13).text?.trim() || 'Bhavnagar, Gujarat';
    const previousSchool = row.getCell(14).text?.trim() || null;

    rawRows.push({
      rowNumber,
      grNumber,
      rollNumber,
      firstName,
      lastName,
      gender,
      dobStr,
      standardName,
      divisionName,
      fatherName,
      motherName,
      parentPhone,
      parentEmail,
      address,
      previousSchool,
    });
  });

  // Fetch divisions and standards from DB
  const divisions = await prisma.division.findMany({
    include: { standard: true },
  });

  // Fetch existing GR numbers to detect duplicates
  const existingStudents = await prisma.student.findMany({
    select: { grNumber: true },
  });
  const existingGrSet = new Set(existingStudents.map((s) => s.grNumber));

  const validRows = [];
  const invalidRows = [];
  const duplicateRows = [];

  for (const item of rawRows) {
    const errors = [];

    if (!item.firstName) errors.push('First name is mandatory');
    if (!item.lastName) errors.push('Last name is mandatory');
    if (!item.parentPhone || item.parentPhone.length < 10) errors.push('Valid 10-digit parent contact number is required');

    // Duplicate GR Number check
    if (item.grNumber && existingGrSet.has(item.grNumber)) {
      duplicateRows.push({
        ...item,
        reason: `GR Number ${item.grNumber} already exists in database. Duplicate row rejected.`,
      });
      continue;
    }

    // Match division from DB
    const matchedDivision = divisions.find(
      (d) =>
        (d.standard.name.toLowerCase() === item.standardName.toLowerCase() ||
         d.standard.name.toLowerCase().includes(item.standardName.toLowerCase())) &&
        d.name.toLowerCase() === item.divisionName.toLowerCase()
    ) || divisions[0];

    if (errors.length > 0) {
      invalidRows.push({
        ...item,
        reason: errors.join('; '),
      });
    } else {
      validRows.push({
        ...item,
        divisionId: matchedDivision?.id || null,
        divisionLabel: matchedDivision ? `${matchedDivision.standard.name} — Div ${matchedDivision.name}` : 'Default Division',
      });
    }
  }

  // Create an ImportJob record in PostgreSQL
  const importJob = await prisma.importJob.create({
    data: {
      entity: 'STUDENT',
      status: 'PROCESSING',
      importedById: adminUserId || 'system',
      successCount: validRows.length,
      failedCount: invalidRows.length + duplicateRows.length,
    },
  });

  return {
    importJobId: importJob.id,
    totalRows: rawRows.length,
    validRows,
    invalidRows,
    duplicateRows,
  };
};

module.exports = {
  exportToExcel,
  parseStudentBulkImport,
};
