import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TicketData {
  ticketNumber: string;
  saleDate: string;
  storeId: string;
  transactionTotal: number;
  lineItems: {
    item_number?: string;
    product_name?: string;
    qty_sold?: number;
    selling_unit?: string;
    gross_profit?: string;
  }[];
}

interface RepPerformanceExport {
  repName: string;
  dateRange: { start: string; end: string };
  avgTicketSize: number;
  totalRevenue: number;
  ticketCount: number;
  underperformingDays: {
    date: string;
    avgTicketSize: number;
    ticketCount: number;
  }[];
  tickets: TicketData[];
}

export function generateRepPerformancePDF(data: RepPerformanceExport) {
  try {
    console.log('Starting PDF generation for:', data.repName);
    console.log('PDF data:', data);
    const doc = new jsPDF();
    let yPosition = 20;
  
  // Add subtle header background
  doc.setFillColor(248, 249, 250);
  doc.rect(0, 0, 210, 45, 'F');
  
  // Company/App branding area
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(127, 140, 141);
  doc.text("SuppTraq Analytics", 20, 15);
  
  yPosition = 30;
  
  // Main title with better hierarchy
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(44, 62, 80);
  doc.text("Sales Performance Review", 20, yPosition);
  yPosition += 20;
  
  // Rep info in professional card-like layout
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 221, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPosition - 5, 170, 25, 3, 3, 'FD');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(44, 62, 80);
  doc.text(`${data.repName}`, 30, yPosition + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(127, 140, 141);
  doc.text(`Review Period: ${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}`, 30, yPosition + 12);
  
  yPosition += 35;
  
  // Performance summary with visual cards
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text("Performance Summary", 20, yPosition);
  yPosition += 12;
  
  // Enhanced metrics with visual cards
  const metrics = [
    { 
      label: "Average Ticket Size", 
      value: `$${data.avgTicketSize.toFixed(2)}`,
      color: data.avgTicketSize < 70 ? [239, 68, 68] : [34, 197, 94]
    },
    { 
      label: "Total Revenue", 
      value: `$${data.totalRevenue.toLocaleString()}`,
      color: [59, 130, 246]
    },
    { 
      label: "Total Tickets", 
      value: data.ticketCount.toString(),
      color: [139, 69, 19]
    },
    { 
      label: "Days Below $70", 
      value: data.underperformingDays.length.toString(),
      color: data.underperformingDays.length > 0 ? [239, 68, 68] : [34, 197, 94]
    }
  ];
  
  metrics.forEach((metric, index) => {
    const xPos = 20 + (index % 2) * 85;
    const yPos = yPosition + Math.floor(index / 2) * 25;
    
    // Metric card background with subtle border
    doc.setFillColor(252, 252, 252);
    doc.setDrawColor(220, 221, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(xPos, yPos - 3, 80, 20, 2, 2, 'FD');
    
    // Icon and label
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text(metric.label, xPos + 4, yPos + 2);
    
    // Value with color coding
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.text(metric.value, xPos + 4, yPos + 10);
  });
  
  yPosition += 50;
  
  // Enhanced underperforming days section
  if (data.underperformingDays.length > 0) {
    // Section header with visual indicator
    doc.setFillColor(254, 226, 226);
    doc.rect(20, yPosition - 5, 170, 18, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28);
    doc.text("UNDERPERFORMING DAYS ANALYSIS", 25, yPosition + 5);
    yPosition += 20;
    
    // Add contextual note
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text("Days with average ticket size below $70 threshold", 25, yPosition);
    yPosition += 10;
    
    const daysTableData = data.underperformingDays.map(day => [
      new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      `$${day.avgTicketSize.toFixed(2)}`,
      day.ticketCount.toString(),
      `$${(day.avgTicketSize * day.ticketCount).toFixed(0)}`
    ]);
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Daily Avg', 'Tickets', 'Day Total']],
      body: daysTableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [239, 68, 68],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [220, 221, 225]
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [44, 62, 80]
      },
      alternateRowStyles: {
        fillColor: [254, 242, 242]
      },
      margin: { left: 25, right: 20 },
      styles: {
        lineWidth: 0.3,
        lineColor: [220, 221, 225]
      },
      columnStyles: {
        1: { textColor: [185, 28, 28], fontStyle: 'bold' }, // Highlight avg ticket in red
        3: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 20;
  } else {
    // Show positive message when no underperforming days
    doc.setFillColor(220, 252, 231);
    doc.rect(20, yPosition - 5, 170, 18, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(22, 163, 74);
    doc.text("ALL DAYS ABOVE THRESHOLD", 25, yPosition + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    doc.text("No days with average ticket below $70 in this period", 25, yPosition + 15);
    
    yPosition += 30;
  }
  
  // Enhanced transaction details section header
  doc.setFillColor(239, 246, 255);
  doc.rect(20, yPosition - 5, 170, 18, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(59, 130, 246);
  doc.text("DETAILED TRANSACTION ANALYSIS", 25, yPosition + 5);
  yPosition += 20;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(127, 140, 141);
  doc.text("Complete breakdown of all transactions from underperforming days", 25, yPosition);
  yPosition += 10;
  
  // Group tickets by day for clean organization
  const ticketsByDay = new Map();
  data.tickets.forEach(ticket => {
    const dateKey = ticket.saleDate.split('T')[0];
    if (!ticketsByDay.has(dateKey)) {
      ticketsByDay.set(dateKey, []);
    }
    ticketsByDay.get(dateKey).push(ticket);
  });

  // Process each underperforming day with clean design
  data.underperformingDays.forEach((day, dayIndex) => {
    const dayTickets = ticketsByDay.get(day.date) || [];
    if (dayTickets.length === 0) return;
    
    // New page for each day (except first if space allows)
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 25;
    }
    
    // Enhanced day header with visual card
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.5);
    doc.roundedRect(25, yPosition - 3, 160, 14, 2, 2, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(185, 28, 28);
    doc.text(`${new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`, 30, yPosition + 4);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text(`Average: $${day.avgTicketSize.toFixed(2)} • Transactions: ${day.ticketCount} • Total: $${(day.avgTicketSize * day.ticketCount).toFixed(0)}`, 30, yPosition + 9);
    yPosition += 20;
    
    // Process each ticket with minimal, clean design
    dayTickets.forEach((ticket: TicketData, ticketIndex: number) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 25;
      }
      
      // Enhanced ticket header with visual styling
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(30, yPosition - 2, 150, 10, 1, 1, 'FD');
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 58, 138);
      doc.text(`#${ticket.ticketNumber}`, 35, yPosition + 3);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      doc.text(`Store ${ticket.storeId}`, 80, yPosition + 3);
      
      doc.setFont("helvetica", "bold");
      if (ticket.transactionTotal < 70) {
        doc.setTextColor(185, 28, 28);
      } else {
        doc.setTextColor(34, 197, 94);
      }
      doc.text(`$${ticket.transactionTotal.toFixed(2)}`, 130, yPosition + 3);
      yPosition += 12;
      
      // Clean line items using only schema fields
      if (ticket.lineItems && ticket.lineItems.length > 0) {
        const lineItemsData = ticket.lineItems.map((item: any) => [
          item.item_number || '',
          (item.product_name || '').substring(0, 30),
          (item.qty_sold || 0).toString(),
          item.selling_unit || '',
          item.gross_profit || ''
        ]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Item Number', 'Product Name', 'Quantity', 'Unit', 'Gross Profit']],
          body: lineItemsData,
          theme: 'plain',
          headStyles: { 
            fillColor: [248, 249, 250],
            textColor: [44, 62, 80],
            fontSize: 8,
            fontStyle: 'bold',
            lineWidth: 0.3,
            lineColor: [220, 221, 225]
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [44, 62, 80],
            lineWidth: 0.2,
            lineColor: [220, 221, 225]
          },
          margin: { left: 30, right: 20 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 60 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' }
          }
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 8;
        
        // Add subtle separator between tickets
        if (ticketIndex < dayTickets.length - 1) {
          doc.setDrawColor(220, 221, 225);
          doc.setLineWidth(0.2);
          doc.line(30, yPosition, 170, yPosition);
          yPosition += 4;
        }
      } else {
        yPosition += 6;
      }
    });
    
    // Clean day summary aligned with content
    const dayTotal = dayTickets.reduce((sum: number, t: TicketData) => sum + t.transactionTotal, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text(`Day total: $${dayTotal.toFixed(2)}`, 30, yPosition);
    yPosition += 20;
  });
  
  // Add professional summary section
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 25;
  }
  
  // Summary section header
  doc.setFillColor(241, 245, 249);
  doc.rect(20, yPosition - 5, 170, 18, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text("PERFORMANCE ANALYSIS SUMMARY", 25, yPosition + 7);
  yPosition += 25;
  
  // Key insights
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(44, 62, 80);
  doc.text("Key Insights", 25, yPosition);
  yPosition += 8;
  
  const insights = [
    `Overall average ticket: $${data.avgTicketSize.toFixed(2)} ${data.avgTicketSize < 70 ? '(Below target)' : '(Above target)'}`,
    `${data.underperformingDays.length} out of ${data.underperformingDays.length > 0 ? Math.ceil(data.ticketCount / 10) : 'N/A'} days below $70 threshold`,
    `Total revenue impact: $${data.totalRevenue.toLocaleString()}`,
    `Transaction volume: ${data.ticketCount} tickets processed`
  ];
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  
  insights.forEach((insight, index) => {
    doc.text(`• ${insight}`, 30, yPosition);
    yPosition += 6;
  });
  
  yPosition += 10;
  
  // Recommendations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(44, 62, 80);
  doc.text("Recommendations", 25, yPosition);
  yPosition += 8;
  
  const recommendations = [];
  
  if (data.avgTicketSize < 70) {
    recommendations.push("Focus on upselling techniques and product bundling strategies");
    recommendations.push("Review pricing strategy for better margin optimization");
    recommendations.push("Provide additional sales training on high-value items");
  } else {
    recommendations.push("Maintain current performance levels with consistent training");
    recommendations.push("Explore opportunities for premium product positioning");
  }
  
  if (data.underperformingDays.length > 0) {
    recommendations.push("Analyze patterns in underperforming days for process improvements");
    recommendations.push("Implement daily performance monitoring and feedback");
  }
  
  recommendations.push("Schedule regular performance reviews to track improvement");
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  
  recommendations.forEach((rec, index) => {
    doc.text(`${index + 1}. ${rec}`, 30, yPosition);
    yPosition += 6;
  });
  
  yPosition += 15;
  
  // Report generation info
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 25, yPosition);
  doc.text("SuppTraq Analytics Platform - Performance Intelligence", 25, yPosition + 5);
  
  // Clean footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    doc.text(
      `${data.repName} Performance Report • Page ${i} of ${pageCount} • Generated ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
    // Save the PDF
    console.log('Saving PDF for:', data.repName);
    doc.save(`${data.repName.replace(/\s+/g, '_')}_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    console.log('PDF generation completed successfully');
  } catch (error) {
    console.error('Error in PDF generation:', error);
    throw error;
  }
}