

/**
 * Payroll Calculation Engine
 * 
 * REAL SALARY (fixed by gross):
 *   BASIC+DA   = gross * 50%
 *   HRA        = gross * 20%
 *   Conveyance = gross * 10%
 *   Medical    = gross * 15%
 *   Special    = gross *  5%
 *
 * EARNED (pro-rated by present days):
 *   component_earned = (component_real / workingDays) * presentDays
 *   GROSS = sum of all earned components
 *
 * OT:
 *   perDaySalary = gross / totalDaysInMonth
 *   OT Amount    = otDays * perDaySalary
 *
 * DEDUCTIONS:
 *   EPF  = BASIC+DA_earned * 12%
 *   ESIC = GROSS_earned * 0.75%
 *   TOTAL = EPF + ESIC + advance + security + otherDed
 *
 * NET SALARY PAYABLE = GROSS - TOTAL DEDUCTION
 * TOTAL SALARY PAYABLE = NET + taDA + reimbursement + salaryArrears
 *
 * EMPLOYER:
 *   Employer EPF  = BASIC+DA_earned * 13%
 *   Employer ESIC = BASIC+DA_earned * 3.25%
 *   CTC = GROSS + Employer EPF + Employer ESIC
 */
export function calcSalary(grossSalary, attendance, edits = {}, month, year) {
  const workingDays = attendance?.working_days || 26;
  const presentDays = attendance?.present_days || 0;
  const weekOff = attendance?.week_off || 0;
  const paidLeave = attendance?.paid_leave || 0;
  const holidays = attendance?.holidays || 0;
  const lateDays = attendance?.late_days || 0;

  const monthNum = (month ?? new Date().getMonth()) + 1;
  const totalDaysInMonth = new Date(year ?? new Date().getFullYear(), monthNum, 0).getDate();
  const otDays = Number(edits.ot ?? 0);

  // --- REAL salary components ---
  const basicReal      = grossSalary * 0.50;
  const hraReal        = grossSalary * 0.20;
  const convReal       = grossSalary * 0.10;
  const medReal        = grossSalary * 0.15;
  const specialReal    = grossSalary * 0.05;
  const grossReal      = grossSalary;

  // Prorate weekly offs and holidays based on worked/paid days relative to working days in month
  const totalPaidDays = presentDays;
  const calendarDays = totalDaysInMonth || 30;

  // --- EARNED (paid-day prorated) ---
  const basicEarned    = calendarDays ? (basicReal   / calendarDays) * totalPaidDays : 0;
  const hraEarned      = calendarDays ? (hraReal     / calendarDays) * totalPaidDays : 0;
  const convEarned     = calendarDays ? (convReal    / calendarDays) * totalPaidDays : 0;
  const medEarned      = calendarDays ? (medReal     / calendarDays) * totalPaidDays : 0;
  const specialEarned  = calendarDays ? (specialReal / calendarDays) * totalPaidDays : 0;
  const grossEarned    = basicEarned + hraEarned + convEarned + medEarned + specialEarned;

  // --- OT ---
  const perDaySalary   = totalDaysInMonth ? grossSalary / totalDaysInMonth : 0;
  const otAmount       = otDays * perDaySalary;

  // --- DEDUCTIONS ---
  const epfDed         = basicEarned * 0.12;
  const esicDed        = grossEarned * 0.0075;
  const advance        = Number(edits.advance        ?? 0);
  const securityDep    = Number(edits.security_deposit ?? 0);
  const autoLateDed    = 0; // Late deduction is already subtracted in present_days (Paid Days)
  const lateDeduction  = edits.late_deduction !== undefined && edits.late_deduction !== ''
    ? Number(edits.late_deduction)
    : autoLateDed;
  const otherDed       = Number(edits.other_deduction  ?? 0);
  const totalDed       = epfDed + esicDed + advance + securityDep + lateDeduction + otherDed;

  // --- EXTRAS ---
  const reimbursement  = Number(edits.reimbursement   ?? 0);
  const salaryArrears  = Number(edits.salary_arrears   ?? 0);
  const taDA           = Number(edits.ta_da            ?? 0);
  const remark         = edits.remark ?? '';

  // --- NET ---
  const netSalary      = grossEarned - totalDed;
  const totalPayable   = netSalary + taDA + reimbursement + salaryArrears;

  // --- EMPLOYER ---
  const employerEPF    = basicEarned * 0.13;
  const employerESIC   = basicEarned * 0.0325;
  const ctc            = grossEarned + employerEPF + employerESIC;

  return {
    basicReal, hraReal, convReal, medReal, specialReal, grossReal,
    basicEarned, hraEarned, convEarned, medEarned, specialEarned, grossEarned,
    otAmount, epfDed, esicDed,
    advance, securityDep, lateDeduction, otherDed, totalDed,
    reimbursement, salaryArrears, taDA, remark,
    netSalary, totalPayable,
    employerEPF, employerESIC, ctc,
  };
}


