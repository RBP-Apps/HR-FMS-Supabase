export function calcSummary(data) {
  return {
    P: data.filter(d => d === "P").length,
    A: data.filter(d => d === "A").length,
    CL: data.filter(d => d === "CL").length,
    WO: data.filter(d => d === "WO").length,
    HD: data.filter(d => d === "HD").length,
    LWP: data.filter(d => d === "LWP").length,
    H: data.filter(d => d === "H").length,
    PM: data.filter(d => d === "PM").length,
  };
}

export function paidDays(s, lateCount = 0) {
  const count = lateCount || s.lateCount || s.lateDays || 0;
  const lateDeductionDays = Math.floor(count / 4) * 0.5;
  const basePaidDays = (s.P || 0) + (s.CL || 0) + (s.WO || 0) + (s.H || 0) + (s.HD || 0) * 0.5;
  return Math.max(0, basePaidDays - lateDeductionDays);
}

export const getMonthNumber = (monthName) => {
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];
  return months.indexOf(monthName);
};

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  timeStr = timeStr.trim().toUpperCase();

  let hours = 0;
  let minutes = 0;

  if (timeStr.includes("AM") || timeStr.includes("PM")) {
    const isPM = timeStr.includes("PM");
    const cleanTime = timeStr.replace(/[AP]M/, "").trim();
    const parts = cleanTime.split(":");
    hours = parseInt(parts[0], 10);
    minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;

    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  } else {
    const parts = timeStr.split(":");
    hours = parseInt(parts[0], 10);
    minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  }

  return hours * 60 + minutes;
};

export const formatLateDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

export function isLateApproved(emp, dateStr, lateApprovals = []) {
  if (!emp || !dateStr || !lateApprovals || !lateApprovals.length) return false;

  const cleanDateStr = dateStr.toString().split("T")[0].split(" ")[0].trim();
  const empCode = (emp.code || emp.rbp_joining_id || "").toString().trim().toLowerCase();
  const empName = (emp.name || emp.employee_name || "").toString().trim().toLowerCase();
  const empId = (emp.id || emp.employee_id || "").toString().trim().toLowerCase();

  return lateApprovals.some(app => {
    const status = (app.approved_status || "").toString().trim().toLowerCase();
    const isApproved = status === "approved" || app.approved === true;
    if (!isApproved) return false;

    const appEmpId = (app.employee_id || "").toString().trim().toLowerCase();
    const appEmpCode = (app.employee_code || "").toString().trim().toLowerCase();
    const appEmpName = (app.employee_name || "").toString().trim().toLowerCase();

    const matchesEmp =
      (appEmpId && (appEmpId === empId || appEmpId === empCode)) ||
      (appEmpCode && (appEmpCode === empCode || appEmpCode === empId)) ||
      (appEmpName && empName && (appEmpName === empName || empName.includes(appEmpName) || appEmpName.includes(empName)));

    if (!matchesEmp) return false;

    const startDate = (app.start_date || app.date || "").toString().split("T")[0].split(" ")[0].trim();
    const endDate = (app.end_date || app.start_date || app.date || "").toString().split("T")[0].split(" ")[0].trim();

    if (startDate && endDate) {
      return cleanDateStr >= startDate && cleanDateStr <= endDate;
    } else if (startDate) {
      return cleanDateStr === startDate;
    }
    return false;
  });
}

export function getLateHistoryForEmp(emp, attendanceArray, selectedYear, selectedMonth, biometricAttendance = [], fieldAttendance = [], lateApprovals = []) {
  if (!emp || !attendanceArray) return [];

  const monthNum = getMonthNumber(selectedMonth);
  const daysInMonth = attendanceArray.length;
  const empCodeLower = emp.code?.toString().trim().toLowerCase();
  const empNameLower = emp.name?.toString().trim().toLowerCase();

  const biometricMap = new Map();
  (biometricAttendance || []).forEach(b => {
    if (b && b.date) {
      if (b.employeeCode) biometricMap.set(`${b.employeeCode.toString().trim().toLowerCase()}_${b.date}`, b);
      if (b.employeeName) biometricMap.set(`${b.employeeName.toString().trim().toLowerCase()}_${b.date}`, b);
    }
  });

  const fieldMap = new Map();
  (fieldAttendance || []).forEach(f => {
    if (f && f.date) {
      if (f.employeeCode) fieldMap.set(`${f.employeeCode.toString().trim().toLowerCase()}_${f.date}`, f);
      if (f.employeeName) fieldMap.set(`${f.employeeName.toString().trim().toLowerCase()}_${f.date}`, f);
    }
  });

  const genuineLateEntries = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const status = attendanceArray[d - 1];
    if (!status || ["A", "WO", "H", "CL", "LWP"].includes(status)) {
      continue;
    }

    const dateStr = `${selectedYear}-${String(monthNum + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const codeKey = `${empCodeLower}_${dateStr}`;
    const nameKey = `${empNameLower}_${dateStr}`;

    const bioRecord = biometricMap.get(codeKey) || biometricMap.get(nameKey);
    const fieldRecord = fieldMap.get(codeKey) || fieldMap.get(nameKey);

    const inTime = bioRecord?.inTime || fieldRecord?.inTime;
    const outTime = bioRecord?.outTime || fieldRecord?.outTime;
    if (!inTime) continue;

    const inMins = parseTimeToMinutes(inTime);
    if (inMins !== null && inMins >= 586 && inMins <= 750) {
      // Check if HR granted permission in Late Approvals
      if (isLateApproved(emp, dateStr, lateApprovals)) {
        continue;
      }

      genuineLateEntries.push({
        dateStr,
        formattedDate: formatLateDate(dateStr),
        inTime: inTime,
        outTime: outTime || "--:--"
      });
    }
  }

  return genuineLateEntries;
}
