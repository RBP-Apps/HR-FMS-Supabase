export function calcSummary(data) {
  return {
    P: data.filter(d => d === "P").length,
    A: data.filter(d => d === "A").length,
    CL: data.filter(d => d === "CL").length,
    WO: data.filter(d => d === "WO").length,
    HD: data.filter(d => d === "HD").length,
    EL: data.filter(d => d === "EL").length,
    LWP: data.filter(d => d === "LWP").length,
    H: data.filter(d => d === "H").length,
    PM: data.filter(d => d === "PM").length,
  };
}

export function paidDays(s) {
  return s.P + s.CL + s.EL + s.WO + s.H + s.HD * 0.5;
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
