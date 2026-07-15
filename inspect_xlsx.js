import XLSX from 'xlsx';
import fs from 'fs';

const filePath = './data/BIC.xlsx';

if (fs.existsSync(filePath)) {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('--- Columns detected ---');
  if (data.length > 0) {
    console.log(Object.keys(data[0]));
    console.log('--- Sample Row ---');
    console.log(data.slice(0, 5));
    console.log('--- Total Rows ---');
    console.log(data.length);
  } else {
    console.log('No data found in sheet.');
  }
} else {
  console.error('File not found: ' + filePath);
}
