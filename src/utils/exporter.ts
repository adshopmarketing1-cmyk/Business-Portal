import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

export const exportToExcel = (data: Record<string, any>[], filename: string = 'export.xlsx') => {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, filename);
};

export const exportToPDF = (elementId: string, filename: string = 'report.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#000000' },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
  };

  html2pdf().set(opt).from(element).save();
};
