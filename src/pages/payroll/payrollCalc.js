
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
 *   ESIC = BASIC+DA_earned * 0.75%
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
  const monthNum = (month ?? new Date().getMonth()) + 1;
  const totalDaysInMonth = new Date(year ?? new Date().getFullYear(), monthNum, 0).getDate();
  const otDays = Number(edits.ot ?? 0);

  // --- REAL salary components ---
  const basicReal      = Math.round(grossSalary * 0.50);
  const hraReal        = Math.round(grossSalary * 0.20);
  const convReal       = Math.round(grossSalary * 0.10);
  const medReal        = Math.round(grossSalary * 0.15);
  const specialReal    = Math.round(grossSalary * 0.05);
  const grossReal      = grossSalary;

  // --- EARNED (present-day prorated) ---
  const basicEarned    = workingDays ? Math.round((basicReal   / workingDays) * presentDays) : 0;
  const hraEarned      = workingDays ? Math.round((hraReal     / workingDays) * presentDays) : 0;
  const convEarned     = workingDays ? Math.round((convReal    / workingDays) * presentDays) : 0;
  const medEarned      = workingDays ? Math.round((medReal     / workingDays) * presentDays) : 0;
  const specialEarned  = workingDays ? Math.round((specialReal / workingDays) * presentDays) : 0;
  const grossEarned    = basicEarned + hraEarned + convEarned + medEarned + specialEarned;

  // --- OT ---
  const perDaySalary   = totalDaysInMonth ? Math.round(grossSalary / totalDaysInMonth) : 0;
  const otAmount       = Math.round(otDays * perDaySalary);

  // --- DEDUCTIONS ---
  const epfDed         = Math.round(basicEarned * 0.12);
  const esicDed        = Math.round(basicEarned * 0.0075);
  const advance        = Number(edits.advance        ?? 0);
  const securityDep    = Number(edits.security_deposit ?? 0);
  const otherDed       = Number(edits.other_deduction  ?? 0);
  const totalDed       = epfDed + esicDed + advance + securityDep + otherDed;

  // --- EXTRAS ---
  const reimbursement  = Number(edits.reimbursement   ?? 0);
  const salaryArrears  = Number(edits.salary_arrears   ?? 0);
  const taDA           = Number(edits.ta_da            ?? 0);
  const remark         = edits.remark ?? '';

  // --- NET ---
  const netSalary      = grossEarned - totalDed;
  const totalPayable   = netSalary + taDA + reimbursement + salaryArrears;

  // --- EMPLOYER ---
  const employerEPF    = Math.round(basicEarned * 0.13);
  const employerESIC   = Math.round(basicEarned * 0.0325);
  const ctc            = grossEarned + employerEPF + employerESIC;

  return {
    basicReal, hraReal, convReal, medReal, specialReal, grossReal,
    basicEarned, hraEarned, convEarned, medEarned, specialEarned, grossEarned,
    otAmount, epfDed, esicDed,
    advance, securityDep, otherDed, totalDed,
    reimbursement, salaryArrears, taDA, remark,
    netSalary, totalPayable,
    employerEPF, employerESIC, ctc,
  };
}
