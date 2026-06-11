import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AttendancePDF({
  selectedMonth,
  selectedYear,
  getCurrentDate,
  stats,
  selectedCompany,
  selectedDept,
  selectedType,
  selectedStatus,
  filtered,           // ALL filtered employees (not just current page)
  generateMonthlyAttendance,
  calcSummary,
  paidDays,
  getMonthNumber,
}) {
  const downloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const monthNum = getMonthNumber(selectedMonth);
    const daysInMonth = new Date(parseInt(selectedYear), monthNum + 1, 0).getDate();

    // Build weekend set
    const weekendSet = new Set();
    const dayNames = [];
    for (let i = 0; i < daysInMonth; i++) {
      const d = new Date(parseInt(selectedYear), monthNum, i + 1);
      const dayCode = d.toLocaleDateString("en-US", { weekday: "short" }).substring(0, 2);
      dayNames.push(dayCode);
      if (d.getDay() === 0 || d.getDay() === 6) weekendSet.add(i);
    }

    // ── HEADER BANNER ──────────────────────────────────────────────────────────
    doc.setFillColor(67, 56, 202); // indigo-700
    doc.rect(0, 0, pageWidth, 22, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("ATTENDANCE REPORT", pageWidth / 2, 10, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      `${selectedMonth} ${selectedYear}   |   Generated: ${new Date().toLocaleString("en-IN")}`,
      pageWidth / 2,
      17,
      { align: "center" }
    );

    // ── FILTER INFO BAR ────────────────────────────────────────────────────────
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(0, 22, pageWidth, 8, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(0, 30, pageWidth, 30);

    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(7);
    const filterText =
      `Company: ${selectedCompany}  |  Dept: ${selectedDept}  |  Type: ${selectedType}  |  Status: ${selectedStatus}  |  Total Employees: ${filtered.length}  |  Present: ${stats.present}  |  Absent: ${stats.absent}  |  On Leave: ${stats.onLeave}`;
    doc.text(filterText, pageWidth / 2, 27, { align: "center" });

    // ── COLUMN WIDTHS ──────────────────────────────────────────────────────────
    const marginL = 8;
    const marginR = 8;
    const usable = pageWidth - marginL - marginR;

    const srW = 7;
    const nameW = 36;
    const codeW = 14;
    const deptW = 14;
    const summaryWs = [6.5, 6.5, 6.5, 6.5, 9]; // P, A, CL, WO, Paid
    const totalSummary = summaryWs.reduce((a, b) => a + b, 0);
    const usedFixed = srW + nameW + codeW + deptW + totalSummary;
    const dayW = Math.max(4, (usable - usedFixed) / daysInMonth);

    const columnStyles = {};
    columnStyles[0] = { cellWidth: srW, halign: "center" };
    columnStyles[1] = { cellWidth: nameW, halign: "left" };
    columnStyles[2] = { cellWidth: codeW, halign: "center" };
    columnStyles[3] = { cellWidth: deptW, halign: "center" };
    for (let i = 0; i < daysInMonth; i++) {
      columnStyles[4 + i] = { cellWidth: dayW, halign: "center" };
    }
    summaryWs.forEach((w, i) => {
      columnStyles[4 + daysInMonth + i] = { cellWidth: w, halign: "center" };
    });

    // ── TABLE HEAD ─────────────────────────────────────────────────────────────
    const dayHeaderCells = dayNames.map((dn, i) => ({
      content: `${i + 1}\n${dn}`,
      styles: {
        halign: "center",
        fillColor: weekendSet.has(i) ? [91, 75, 220] : [79, 70, 229],
      },
    }));

    const head = [
      [
        { content: "#", styles: { halign: "center" } },
        { content: "Employee Name", styles: { halign: "left" } },
        { content: "Code", styles: { halign: "center" } },
        { content: "Dept", styles: { halign: "center" } },
        ...dayHeaderCells,
        { content: "P", styles: { halign: "center" } },
        { content: "A", styles: { halign: "center" } },
        { content: "CL", styles: { halign: "center" } },
        { content: "WO", styles: { halign: "center" } },
        { content: "Paid\nDays", styles: { halign: "center" } },
      ],
    ];

    // ── STATUS CELL COLORS ─────────────────────────────────────────────────────
    const cellFillColors = {
      P:  [209, 250, 229], // emerald-100
      A:  [254, 226, 226], // red-100
      CL: [237, 233, 254], // violet-100
      WO: [241, 245, 249], // slate-100
      HD: [255, 237, 213], // orange-100
    };
    const cellTextColors = {
      P:  [4, 120, 87],    // emerald-700
      A:  [185, 28, 28],   // red-700
      CL: [109, 40, 217],  // violet-700
      WO: [100, 116, 139], // slate-500
      HD: [194, 65, 12],   // orange-700
    };

    // ── TABLE BODY ─────────────────────────────────────────────────────────────
    const body = filtered.map((emp, idx) => {
      const attendanceArray = generateMonthlyAttendance(emp, selectedYear, selectedMonth);
      const summary = calcSummary(attendanceArray);

      const dayCells = attendanceArray.map((status) => ({
        content: status,
        styles: {
          halign: "center",
          fillColor: cellFillColors[status] || [255, 255, 255],
          textColor: cellTextColors[status] || [30, 41, 59],
          fontStyle: "bold",
        },
      }));

      return [
        { content: idx + 1, styles: { halign: "center", textColor: [100, 116, 139] } },
        { content: emp.name, styles: { halign: "left", fontStyle: "bold", textColor: [30, 41, 59] } },
        { content: emp.code || "-", styles: { halign: "center", textColor: [100, 116, 139] } },
        { content: emp.dept || "-", styles: { halign: "center", textColor: [100, 116, 139] } },
        ...dayCells,
        { content: summary.P, styles: { halign: "center", textColor: [4, 120, 87], fontStyle: "bold" } },
        { content: summary.A, styles: { halign: "center", textColor: [185, 28, 28], fontStyle: "bold" } },
        { content: summary.CL, styles: { halign: "center", textColor: [109, 40, 217], fontStyle: "bold" } },
        { content: summary.WO, styles: { halign: "center", textColor: [100, 116, 139] } },
        { content: paidDays(summary), styles: { halign: "center", textColor: [67, 56, 202], fontStyle: "bold" } },
      ];
    });

    // ── DRAW TABLE ─────────────────────────────────────────────────────────────
    autoTable(doc, {
      head,
      body,
      startY: 32,
      margin: { left: marginL, right: marginR, bottom: 12 },
      styles: {
        fontSize: 6.2,
        cellPadding: { top: 1.5, bottom: 1.5, left: 1, right: 1 },
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        font: "helvetica",
        valign: "middle",
        overflow: "hidden",
        minCellHeight: 7,
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6.2,
        minCellHeight: 10,
        valign: "middle",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
      // Re-draw header banner on new pages
      didDrawPage(data) {
        if (data.pageNumber > 1) {
          doc.setFillColor(67, 56, 202);
          doc.rect(0, 0, pageWidth, 12, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.text(
            `ATTENDANCE REPORT — ${selectedMonth} ${selectedYear} (cont.)`,
            pageWidth / 2,
            8,
            { align: "center" }
          );
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}   |   HRMS Attendance System   |   ${new Date().toLocaleDateString("en-IN")}`,
          pageWidth / 2,
          pageHeight - 4,
          { align: "center" }
        );
      },
    });

    // ── SAVE ───────────────────────────────────────────────────────────────────
    doc.save(`Attendance_${selectedYear}_${selectedMonth}.pdf`);
  };

  return (
    <button
      onClick={downloadPDF}
      className="flex items-center gap-1.5 border border-violet-300 bg-violet-50 text-violet-700 rounded-xl px-3 py-2 text-xs font-semibold hover:bg-violet-100 transition-colors"
    >
      ⬇ PDF Download
    </button>
  );
}
