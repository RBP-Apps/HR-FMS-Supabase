

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
export function calcSalary(grossSalary, attendance, edits = {}, month, year, emp = {}) {
  const isSet = (v) => v !== undefined && v !== null && v !== '' && !isNaN(Number(v));
  const numOr = (v, fallback) => isSet(v) ? Number(v) : fallback;

  // Working / Present days can also come from edits
  const workingDays = numOr(edits.working_days, attendance?.working_days || 26);
  const presentDays = numOr(edits.present_days, attendance?.present_days || 0);
  const weekOff = attendance?.week_off || 0;
  const paidLeave = attendance?.paid_leave || 0;
  const holidays = attendance?.holidays || 0;
  const lateDays = attendance?.late_days || 0;

  const monthNum = (month ?? new Date().getMonth()) + 1;
  const totalDaysInMonth = new Date(year ?? new Date().getFullYear(), monthNum, 0).getDate();
  const otDays = Number(edits.ot ?? 0);

  // --- REAL salary components ---
  const effectiveGross = numOr(edits.grossReal, numOr(edits.gross_salary, grossSalary));
  const grossReal      = effectiveGross;
  const basicReal      = numOr(edits.basicReal, grossReal * 0.50);
  const hraReal        = numOr(edits.hraReal, grossReal * 0.20);
  const convReal       = numOr(edits.convReal, grossReal * 0.10);
  const medReal        = numOr(edits.medReal, grossReal * 0.15);
  const specialReal    = numOr(edits.specialReal, grossReal * 0.05);

  // Prorate weekly offs and holidays based on worked/paid days relative to working days in month
  const totalPaidDays = presentDays;
  const calendarDays = totalDaysInMonth || 30;

  // --- EARNED (paid-day prorated) ---
  const autoBasicEarned    = calendarDays ? (basicReal   / calendarDays) * totalPaidDays : 0;
  const basicEarned        = numOr(edits.basicEarned, autoBasicEarned);

  const autoHraEarned      = calendarDays ? (hraReal     / calendarDays) * totalPaidDays : 0;
  const hraEarned          = numOr(edits.hraEarned, autoHraEarned);

  const autoConvEarned     = calendarDays ? (convReal    / calendarDays) * totalPaidDays : 0;
  const convEarned         = numOr(edits.convEarned, autoConvEarned);

  const autoMedEarned      = calendarDays ? (medReal     / calendarDays) * totalPaidDays : 0;
  const medEarned          = numOr(edits.medEarned, autoMedEarned);

  const autoSpecialEarned  = calendarDays ? (specialReal / calendarDays) * totalPaidDays : 0;
  const specialEarned      = numOr(edits.specialEarned, autoSpecialEarned);

  const autoGrossEarned    = basicEarned + hraEarned + convEarned + medEarned + specialEarned;
  const grossEarned        = numOr(edits.grossEarned, autoGrossEarned);

  // --- OT ---
  const perDaySalary   = totalDaysInMonth ? grossReal / totalDaysInMonth : 0;
  const autoOtAmount   = otDays * perDaySalary;
  const otAmount       = numOr(edits.otAmount, autoOtAmount);

  // --- HR POLICY / PF & ESIC CHECK ---
  // PF: If Yes -> EPF 12% and Employer EPF 13% apply; If No -> 0
  const pfVal = edits?.company_pf_provided || emp?.company_pf_provided;
  const isPfProvided = pfVal !== undefined
    ? (pfVal === 'Yes' || pfVal === true || pfVal === 'TRUE' || pfVal === 'true')
    : true;

  // ESIC: If Yes -> ESIC 0.75% and Employer ESIC 3.25% apply; If No -> 0
  const esicVal = edits?.company_esic_provided || emp?.company_esic_provided;
  const isEsicProvided = esicVal !== undefined
    ? (esicVal === 'Yes' || esicVal === true || esicVal === 'TRUE' || esicVal === 'true')
    : true;

  // --- DEDUCTIONS ---
  const autoEpfDed     = isPfProvided ? basicEarned * 0.12 : 0;
  const epfDed         = numOr(edits.epfDed, autoEpfDed);

  const autoEsicDed    = isEsicProvided ? grossEarned * 0.0075 : 0;
  const esicDed        = numOr(edits.esicDed, autoEsicDed);

  const advance        = Number(edits.advance        ?? 0);
  const securityDep    = Number(edits.security_deposit ?? 0);
  const autoLateDed    = 0; // Late deduction is already subtracted in present_days (Paid Days)
  const lateDeduction  = numOr(edits.late_deduction, autoLateDed);
  const otherDed       = Number(edits.other_deduction  ?? 0);

  const autoTotalDed   = epfDed + esicDed + advance + securityDep + lateDeduction + otherDed;
  const totalDed       = numOr(edits.totalDed, autoTotalDed);

  // --- EXTRAS ---
  const reimbursement  = Number(edits.reimbursement   ?? 0);
  const salaryArrears  = Number(edits.salary_arrears   ?? 0);
  const taDA           = Number(edits.ta_da            ?? 0);
  const remark         = edits.remark ?? '';
  const inHand         = edits.in_hand !== undefined ? edits.in_hand : (emp?.in_hand || '');

  // --- NET ---
  const autoNetSalary  = grossEarned - totalDed;
  const netSalary      = numOr(edits.netSalary, autoNetSalary);

  const autoTotalPayable = netSalary + taDA + reimbursement + salaryArrears;
  const totalPayable   = numOr(edits.totalPayable, autoTotalPayable);

  // --- EMPLOYER ---
  const autoEmployerEPF  = isPfProvided ? basicEarned * 0.13 : 0;
  const employerEPF      = numOr(edits.employerEPF, autoEmployerEPF);

  const autoEmployerESIC = isEsicProvided ? basicEarned * 0.0325 : 0;
  const employerESIC     = numOr(edits.employerESIC, autoEmployerESIC);

  const autoCtc          = grossEarned + employerEPF + employerESIC;
  const ctc              = numOr(edits.ctc, autoCtc);

  return {
    basicReal, hraReal, convReal, medReal, specialReal, grossReal,
    basicEarned, hraEarned, convEarned, medEarned, specialEarned, grossEarned,
    otAmount, epfDed, esicDed,
    advance, securityDep, lateDeduction, otherDed, totalDed,
    reimbursement, salaryArrears, taDA, remark, inHand,
    netSalary, totalPayable,
    employerEPF, employerESIC, ctc,
  };
}


