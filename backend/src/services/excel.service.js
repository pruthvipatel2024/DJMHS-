const ExcelJS = require('exceljs');
const prisma = require('../config/db');

/**
 * Create a styled Excel workbook for exported institutional grids
 */
/**
 * Create a styled Excel workbook for exported institutional grids with auto-adjusted column width and row height
 */
const exportToExcel = async (sheetName, columns, rows) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DJMHS High School ERP';
  workbook.lastModifiedBy = 'DJMHS High School ERP';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet(sheetName, {
    properties: { tabColor: { argb: 'FF1E3A8A' } },
    views: [{ state: 'frozen', ySplit: 1 }], // Freeze header row
  });

  // Assign column definitions
  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
  }));

  // Style Header Row (Row 1)
  const headerRow = sheet.getRow(1);
  headerRow.height = 28; // Comfortable header height
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }, // Deep institutional navy blue
    };
    cell.font = {
      name: 'Calibri',
      family: 2,
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });

  // Insert and style Data Rows
  rows.forEach((rowData, index) => {
    const r = sheet.addRow(rowData);
    r.height = 22; // Comfortable data row height
    const isEven = (index + 2) % 2 === 0;

    r.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = {
        name: 'Calibri',
        size: 10,
        color: { argb: 'FF1E293B' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: false,
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' }, // Subtle zebra striping
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // Dynamically calculate and adjust column widths based on maximum content length
  sheet.columns.forEach((column) => {
    let maxLen = column.header ? column.header.toString().length : 10;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value !== undefined && cell.value !== null ? cell.value.toString() : '';
      if (val.length > maxLen) {
        maxLen = val.length;
      }
    });
    // Set auto-adjusted width with comfortable padding (bounded min: 14, max: 48)
    column.width = Math.min(Math.max(maxLen + 5, 14), 48);
  });

  return await workbook.xlsx.writeBuffer();
};

/**
 * Create a rich multi-sheet Excel workbook with customized tab colors and auto-dimensioned columns/rows
 * @param {Array<{ sheetName: string, tabColor?: string, columns: Array<{header: string, key: string}>, rows: Array<any> }>} sheets
 */
const exportMultiSheetExcel = async (sheets) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DJMHS High School ERP';
  workbook.lastModifiedBy = 'DJMHS High School ERP';
  workbook.created = new Date();
  workbook.modified = new Date();

  sheets.forEach(({ sheetName, tabColor, columns, rows }) => {
    // Sanitize sheet name (Excel limits sheet names to 31 chars and no / \ ? * : [ ])
    const safeSheetName = (sheetName || 'Sheet').replace(/[/\\?*:[\]]/g, '_').substring(0, 31);
    const colorHex = tabColor ? (tabColor.startsWith('FF') ? tabColor : `FF${tabColor.replace('#', '')}`) : 'FF1E3A8A';

    const sheet = workbook.addWorksheet(safeSheetName, {
      properties: { tabColor: { argb: colorHex } },
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = (columns || []).map((col) => ({
      header: col.header,
      key: col.key,
    }));

    // Format Header Row
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorHex },
      };
      cell.font = {
        name: 'Calibri',
        family: 2,
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF334155' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        right: { style: 'thin', color: { argb: 'FF334155' } },
      };
    });

    // Format Data Rows
    (rows || []).forEach((rowData, index) => {
      const r = sheet.addRow(rowData);
      r.height = 22;
      const isEven = (index + 2) % 2 === 0;

      r.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = {
          name: 'Calibri',
          size: 10,
          color: { argb: 'FF1E293B' },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: false,
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // Dynamically calculate and adjust column widths
    sheet.columns.forEach((column) => {
      let maxLen = column.header ? column.header.toString().length : 10;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const val = cell.value !== undefined && cell.value !== null ? cell.value.toString() : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      column.width = Math.min(Math.max(maxLen + 5, 14), 48);
    });
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
  exportMultiSheetExcel,
  parseStudentBulkImport,
};
