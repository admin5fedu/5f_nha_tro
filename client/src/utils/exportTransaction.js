import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Export transaction to PDF (A5 size)
export const exportToPDF = async (transaction, elementId = 'transaction-content') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // A5 size: 148 x 210 mm (in points: 420 x 595)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    // Capture element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 148; // A5 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Generate filename
    const filename = `${transaction.transaction_number || 'transaction'}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

// Export transaction to DOCS (using HTML format that can be opened in Word)
export const exportToDOCS = async (transaction, elementId = 'transaction-content') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Get HTML content
    const htmlContent = element.innerHTML;
    
    // Create a complete HTML document
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${transaction.transaction_number || 'Phiếu thu chi'}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              margin: 20mm;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .info-table td {
              padding: 8px;
              border: 1px solid #000;
            }
            .info-table td:first-child {
              font-weight: bold;
              width: 30%;
              background-color: #f0f0f0;
            }
            .amount {
              font-size: 16pt;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${transaction.transaction_number || 'transaction'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to DOCS:', error);
    throw error;
  }
};

