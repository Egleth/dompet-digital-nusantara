'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function ReportPdfButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    const reportElement = document.getElementById('report-print-area');
    if (!reportElement) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imageData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save('laporan-keuangan.pdf');
    } catch (error) {
      console.error('Gagal mengunduh laporan PDF:', error);
      alert('Tidak dapat mengunduh laporan PDF. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button type="button" className="button" onClick={handleDownload} disabled={isExporting}>
      {isExporting ? 'Membuat PDF...' : 'Unduh Laporan PDF'}
    </button>
  );
}
