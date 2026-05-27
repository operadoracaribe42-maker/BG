const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const chromium = require('@sparticuz/chromium');
const puppeteerDev = require('puppeteer'); // local puppeteer
const puppeteerCore = require('puppeteer-core'); // Vercel puppeteer

/**
 * Genera un buffer de PDF a partir de un string de HTML usando Puppeteer
 * 
 * @param {string} htmlContent 
 * @returns {Promise<Buffer>}
 */
async function generatePDFBuffer(htmlContent) {
  const isLocal = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;
  let browser;

  try {
    if (isLocal) {
      browser = await puppeteerDev.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } else {
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    }
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const buffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '12mm',
        right: '12mm'
      }
    });
    
    return buffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Guarda un archivo PDF en el sistema de archivos
 * 
 * @param {string|Buffer} htmlContentOrBuffer 
 * @param {'voucher' | 'contrato'} tipo 
 * @param {string} codigoReserva 
 * @param {string} fechaEmision 
 * @returns {Promise<string>} Ruta absoluta del archivo guardado
 */
async function savePDF(htmlContentOrBuffer, tipo, codigoReserva, fechaEmision) {
  const buffer = Buffer.isBuffer(htmlContentOrBuffer)
    ? htmlContentOrBuffer
    : await generatePDFBuffer(htmlContentOrBuffer);
  
  // Format fechaEmision as YYYYMMDD
  // Input fechaEmision is ISO format (e.g. 2026-05-26T10:00:00)
  let fechaStr = '';
  try {
    const dateObj = new Date(fechaEmision);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    fechaStr = `${yyyy}${mm}${dd}`;
  } catch (e) {
    fechaStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
  }

  // Sanitize codigoReserva for file name (remove spaces, etc.)
  const cleanCode = codigoReserva.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${tipo}_${cleanCode}_${fechaStr}.pdf`;
  
  const outputDir = path.resolve(process.env.OUTPUT_DIR || './output/pdfs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filePath = path.join(outputDir, fileName);
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

module.exports = {
  generatePDFBuffer,
  savePDF
};
