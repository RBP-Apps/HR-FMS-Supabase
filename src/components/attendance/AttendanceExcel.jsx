import React from "react";

export default function AttendanceExcel({
  pageRows,
  selectedYear,
  selectedMonth,
  generateMonthlyAttendance,
  calcSummary,
  paidDays,
  getMonthNumber,
  stats
}) {
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = [];
    
    pageRows.forEach(emp => {
      const attendanceArray = generateMonthlyAttendance(emp, selectedYear, selectedMonth);
      const summary = calcSummary(attendanceArray);
      
      // Create a row for each employee with their monthly data
      const row = {
        "Employee Name": emp.name,
        "Employee Code": emp.code,
        "Department": emp.dept,
        "Company": emp.company,
        "Present Days": summary.P,
        "Absent Days": summary.A,
        "Casual Leave": summary.CL,
        "Week Off": summary.WO,
        "Paid Days": paidDays(summary),
      };
      
      // Add daily attendance
      attendanceArray.forEach((status, index) => {
        const date = new Date(parseInt(selectedYear), getMonthNumber(selectedMonth), index + 1);
        const dateKey = `${date.getDate()}/${date.toLocaleString("default", { month: "short" })}`;
        row[`Day ${index + 1} (${dateKey})`] = status;
      });
      
      exportData.push(row);
    });
    
    // Add summary row
    exportData.push({
      "Employee Name": "TOTAL",
      "Employee Code": "",
      "Department": "",
      "Company": "",
      "Present Days": stats.present,
      "Absent Days": stats.absent,
      "Casual Leave": stats.onLeave,
      "Week Off": "",
      "Paid Days": "",
    });
    
    if (exportData.length === 0) return;

    // Convert to CSV
    const headers = Object.keys(exportData[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(","));
    
    // Add data rows
    for (const row of exportData) {
      const values = headers.map(header => {
        const value = row[header] || "";
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    
    // Create blob and download
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_${selectedYear}_${selectedMonth}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button 
      onClick={exportToExcel}
      className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
    >
      ⬇ Export Excel
    </button>
  );
}
