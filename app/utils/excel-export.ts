import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headers: string[];
  data: any[][];
  autoFit?: boolean;
  headerStyle?: boolean;
}

/**
 * Export data to Excel with auto-fitted columns and optional styling
 */
export function exportToExcel({
  filename,
  sheetName = 'Sheet1',
  headers,
  data,
  autoFit = true,
  headerStyle = true
}: ExcelExportOptions): void {
  // Combine headers and data
  const worksheetData = [headers, ...data];

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-fit columns if requested
  if (autoFit) {
    const columnWidths = headers.map((header, colIndex) => {
      // Start with header width
      let maxWidth = header.length;
      
      // Check all data rows for this column
      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const cellValue = data[rowIndex][colIndex];
        const cellLength = cellValue ? cellValue.toString().length : 0;
        maxWidth = Math.max(maxWidth, cellLength);
      }
      
      // Add padding and set reasonable min/max widths
      return { wch: Math.min(Math.max(maxWidth + 2, 10), 50) };
    });

    worksheet['!cols'] = columnWidths;
  }

  // Style header row if requested
  if (headerStyle && worksheet['!ref']) {
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E3F2FD" } },
        alignment: { horizontal: "center" }
      };
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Ensure filename has .xlsx extension
  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  // Generate and download Excel file
  XLSX.writeFile(workbook, finalFilename);
}

/**
 * Export multiple sheets to a single Excel file
 */
export function exportMultiSheetExcel(
  filename: string,
  sheets: Array<{
    name: string;
    headers: string[];
    data: any[][];
    autoFit?: boolean;
    headerStyle?: boolean;
  }>
): void {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const worksheetData = [sheet.headers, ...sheet.data];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Auto-fit columns
    if (sheet.autoFit !== false) {
      const columnWidths = sheet.headers.map((header, colIndex) => {
        let maxWidth = header.length;
        
        for (let rowIndex = 0; rowIndex < sheet.data.length; rowIndex++) {
          const cellValue = sheet.data[rowIndex][colIndex];
          const cellLength = cellValue ? cellValue.toString().length : 0;
          maxWidth = Math.max(maxWidth, cellLength);
        }
        
        return { wch: Math.min(Math.max(maxWidth + 2, 10), 50) };
      });

      worksheet['!cols'] = columnWidths;
    }

    // Style header row
    if (sheet.headerStyle !== false && worksheet['!ref']) {
      const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "E3F2FD" } },
          alignment: { horizontal: "center" }
        };
      }
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, finalFilename);
}

/**
 * Convert object array to 2D array for Excel export
 */
export function objectArrayToExcelData<T extends Record<string, any>>(
  objects: T[],
  keyMapping?: Record<keyof T, string>
): { headers: string[]; data: any[][] } {
  if (objects.length === 0) {
    return { headers: [], data: [] };
  }

  const keys = Object.keys(objects[0]) as (keyof T)[];
  const headers = keys.map(key => keyMapping?.[key] || String(key));
  
  const data = objects.map(obj => 
    keys.map(key => obj[key])
  );

  return { headers, data };
}