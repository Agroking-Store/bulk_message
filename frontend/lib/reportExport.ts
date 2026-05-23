import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas-pro';

export const exportReportToPDF = async (data: {
  days: number;
  stats: any;
  topCampaigns: any[];
}) => {
  const { days, stats, topCampaigns } = data;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 15;

  // --- Header ---
  doc.setDrawColor(7, 94, 84); // Theme color
  doc.setLineWidth(1);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 10;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(7, 94, 84);
  doc.text('Campaign Performance Report', margin, currentY);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Company: Indux Technology`, pageWidth - margin, currentY, { align: 'right' });
  
  currentY += 10;
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleString()}`, margin, currentY);
  doc.text(`Range: Last ${days} days`, pageWidth - margin, currentY, { align: 'right' });

  currentY += 5;
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 15;

  // --- WHATSAPP SUMMARY Section ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('WHATSAPP SUMMARY', margin, currentY);
  currentY += 7;

  autoTable(doc, {
    startY: currentY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Attempted', stats.totalAttempted?.toLocaleString()],
      ['Successfully Sent', stats.totalSent?.toLocaleString()],
      ['Failed Messages', stats.totalFailed?.toLocaleString()],
      ['Success Rate', stats.engagementRate],
    ],
    theme: 'striped',
    headStyles: { fillColor: [7, 94, 84] },
    margin: { left: margin, right: (pageWidth / 2) + 5 },
  });

  // --- EMAIL SUMMARY Section (Side by side) ---
  autoTable(doc, {
    startY: currentY,
    head: [['Email Metric', 'Value']],
    body: [
      ['Total Attempted', stats.emailAttempted?.toLocaleString() || '0'],
      ['Successfully Sent', stats.emailSent?.toLocaleString() || '0'],
      ['Failed Emails', stats.emailFailed?.toLocaleString() || '0'],
      ['Open Rate', stats.openRate || '0.0%'],
      ['Click Rate', stats.clickRate || '0.0%'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 204] }, // Blue for Email
    margin: { left: (pageWidth / 2) + 5, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // --- Charts Section ---
  const captureChart = async (id: string, label: string) => {
    const el = document.getElementById(id);
    if (!el) return null;
    
    // Scroll element into view (sometimes helps with capture)
    el.scrollIntoView();
    
    // Small delay to ensure rendering is complete
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(label, margin, currentY);
      currentY += 5;
      
      const canvas = await html2canvas(el, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedEl = clonedDoc.getElementById(id);
          if (clonedEl) {
            clonedEl.style.width = '800px'; // Set explicit width for capture
            clonedEl.style.height = '400px';
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check for page break
      if (currentY + imgHeight > 280) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 15;
      return true;
    } catch (e) {
      console.error(`Failed to capture ${id}:`, e);
      return false;
    }
  };

  // Capture WhatsApp Trend
  await captureChart('messaging-trend-chart', 'WhatsApp Messaging Trends');

  // Capture Email Performance
  await captureChart('email-performance-chart', 'Email Performance Trend');

  // --- TOP PERFORMING CAMPAIGNS Section ---
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('TOP PERFORMING CAMPAIGNS', margin, currentY);
  currentY += 7;

  autoTable(doc, {
    startY: currentY,
    head: [['Campaign Name', 'Group', 'Sent', 'Success Rate']],
    body: topCampaigns.map(c => [
      c.name,
      c.group,
      c.totalSent?.toString(),
      c.successRate
    ]),
    theme: 'grid',
    headStyles: { fillColor: [7, 94, 84] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 70 },
      3: { halign: 'center', fontStyle: 'bold' }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;

  // --- GROUP DISTRIBUTION Section ---
  const groupDistributionImg = await document.getElementById('group-distribution-chart');
  if (groupDistributionImg) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    await captureChart('group-distribution-chart', 'Group Distribution');
  }

  // --- Footer ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, 285, { align: 'right' });
    doc.text('Generated by Bulk Messaging System', pageWidth / 2, 285, { align: 'center' });
  }

  doc.save(`Campaign_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
