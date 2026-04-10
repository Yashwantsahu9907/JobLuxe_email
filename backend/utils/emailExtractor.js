const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const csvParser = require('csv-parser');
const stream = require('stream');

/**
 * Extracts emails from a string using regex
 * @param {string} text 
 * @returns {string[]}
 */
const extractEmailsFromText = (text) => {
  if (!text) return [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  return matches ? [...new Set(matches.map(email => email.toLowerCase()))] : [];
};

/**
 * Parses a PDF buffer and returns the text content
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const parsePDF = async (buffer) => {
  const data = await pdf(buffer);
  return data.text;
};

/**
 * Parses a DOCX buffer and returns the text content
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const parseDOCX = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

/**
 * Parses an Excel buffer and returns all text content from all sheets
 * @param {Buffer} buffer 
 * @returns {string}
 */
const parseExcel = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  let text = '';
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    text += xlsx.utils.sheet_to_txt(sheet) + ' ';
  });
  return text;
};

/**
 * Parses a CSV buffer and returns the text content
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const parseCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    bufferStream
      .pipe(csvParser())
      .on('data', (data) => {
        // Collect all values into a single string for regex extraction
        Object.values(data).forEach(val => results.push(val));
      })
      .on('end', () => {
        resolve(results.join(' '));
      })
      .on('error', reject);
  });
};

/**
 * Main function to extract emails from a file buffer based on mimetype
 * @param {Buffer} buffer 
 * @param {string} mimetype 
 * @param {string} originalname 
 * @returns {Promise<string[]>}
 */
const extractEmailsFromFile = async (buffer, mimetype, originalname) => {
  let text = '';
  const extension = originalname.split('.').pop().toLowerCase();

  try {
    if (mimetype === 'application/pdf' || extension === 'pdf') {
      text = await parsePDF(buffer);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx') {
      text = await parseDOCX(buffer);
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || extension === 'xlsx' || extension === 'xls') {
      text = parseExcel(buffer);
    } else if (mimetype === 'text/csv' || extension === 'csv') {
      text = await parseCSV(buffer);
    } else {
      // Fallback: treat as plain text
      text = buffer.toString('utf8');
    }

    return extractEmailsFromText(text);
  } catch (error) {
    console.error(`Error parsing file ${originalname}:`, error);
    throw new Error(`Failed to extract emails from ${originalname}`);
  }
};

module.exports = {
  extractEmailsFromFile,
  extractEmailsFromText
};
