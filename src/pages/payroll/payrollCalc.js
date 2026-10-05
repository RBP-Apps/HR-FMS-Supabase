

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

  // If gross salary has changed from an old stored override, discard stale component overrides
  const hasGrossChanged = edits.grossReal !== undefined && Number(edits.grossReal) !== Number(grossReal);

  const basicReal      = (!hasGrossChanged && isSet(edits.basicReal)) ? Number(edits.basicReal) : (grossReal * 0.50);
  const hraReal        = (!hasGrossChanged && isSet(edits.hraReal)) ? Number(edits.hraReal) : (grossReal * 0.20);
  const convReal       = (!hasGrossChanged && isSet(edits.convReal)) ? Number(edits.convReal) : (grossReal * 0.10);
  const medReal        = (!hasGrossChanged && isSet(edits.medReal)) ? Number(edits.medReal) : (grossReal * 0.15);
  const specialReal    = (!hasGrossChanged && isSet(edits.specialReal)) ? Number(edits.specialReal) : (grossReal * 0.05);

  // Prorate weekly offs and holidays based on worked/paid days relative to working days in month
  const totalPaidDays = presentDays;
  const calendarDays = totalDaysInMonth || 30;

  // --- EARNED (paid-day prorated) ---
  const autoBasicEarned    = calendarDays ? (basicReal   / calendarDays) * totalPaidDays : 0;
  const basicEarned        = (!hasGrossChanged && isSet(edits.basicEarned)) ? Number(edits.basicEarned) : autoBasicEarned;

  const autoHraEarned      = calendarDays ? (hraReal     / calendarDays) * totalPaidDays : 0;
  const hraEarned          = (!hasGrossChanged && isSet(edits.hraEarned)) ? Number(edits.hraEarned) : autoHraEarned;

  const autoConvEarned     = calendarDays ? (convReal    / calendarDays) * totalPaidDays : 0;
  const convEarned         = (!hasGrossChanged && isSet(edits.convEarned)) ? Number(edits.convEarned) : autoConvEarned;

  const autoMedEarned      = calendarDays ? (medReal     / calendarDays) * totalPaidDays : 0;
  const medEarned          = (!hasGrossChanged && isSet(edits.medEarned)) ? Number(edits.medEarned) : autoMedEarned;

  const autoSpecialEarned  = calendarDays ? (specialReal / calendarDays) * totalPaidDays : 0;
  const specialEarned      = (!hasGrossChanged && isSet(edits.specialEarned)) ? Number(edits.specialEarned) : autoSpecialEarned;

  const autoGrossEarned    = basicEarned + hraEarned + convEarned + medEarned + specialEarned;
  const grossEarned        = (!hasGrossChanged && isSet(edits.grossEarned)) ? Number(edits.grossEarned) : autoGrossEarned;

  // --- OT ---
  const perDaySalary   = totalDaysInMonth ? grossReal / totalDaysInMonth : 0;
  const autoOtAmount   = otDays * perDaySalary;
  const otAmount       = numOr(edits.otAmount, autoOtAmount);

  // --- HR POLICY / PF & ESIC CHECK ---
  // PF: If Yes -> EPF 12% and Employer EPF 13% apply; If No -> strictly 0
  const pfVal = edits?.company_pf_provided !== undefined ? edits.company_pf_provided : emp?.company_pf_provided;
  const isPfProvided = pfVal !== undefined
    ? (pfVal === 'Yes' || pfVal === true || pfVal === 'TRUE' || pfVal === 'true')
    : (emp?.company_pf_provided === 'Yes' || emp?.company_pf_provided === true);

  // ESIC: If Yes -> ESIC 0.75% and Employer ESIC 3.25% apply; If No -> strictly 0
  const esicVal = edits?.company_esic_provided !== undefined ? edits.company_esic_provided : emp?.company_esic_provided;
  const isEsicProvided = esicVal !== undefined
    ? (esicVal === 'Yes' || esicVal === true || esicVal === 'TRUE' || esicVal === 'true')
    : (emp?.company_esic_provided === 'Yes' || emp?.company_esic_provided === true);

  // --- DEDUCTIONS ---
  // If company does not provide PF, deduction is strictly 0
  const autoEpfDed     = isPfProvided ? basicEarned * 0.12 : 0;
  const epfDed         = isPfProvided ? numOr(edits.epfDed, autoEpfDed) : 0;

  // If company does not provide ESIC, deduction is strictly 0
  const autoEsicDed    = isEsicProvided ? grossEarned * 0.0075 : 0;
  const esicDed        = isEsicProvided ? numOr(edits.esicDed, autoEsicDed) : 0;

  const advance        = Number(edits.advance        ?? 0);
  const securityDep    = Number(edits.security_deposit ?? 0);
  const autoLateDed    = 0; // Late deduction is already subtracted in present_days (Paid Days)
  const lateDeduction  = numOr(edits.late_deduction, autoLateDed);
  const otherDed       = Number(edits.other_deduction  ?? 0);

  const autoTotalDed   = epfDed + esicDed + advance + securityDep + lateDeduction + otherDed;
  const totalDed       = autoTotalDed;

  // --- EXTRAS ---
  const reimbursement  = Number(edits.reimbursement   ?? 0);
  const salaryArrears  = Number(edits.salary_arrears   ?? 0);
  const taDA           = Number(edits.ta_da            ?? 0);
  const remark         = edits.remark ?? '';
  const inHand         = edits.in_hand !== undefined ? edits.in_hand : (emp?.in_hand || '');

  // --- NET ---
  const autoNetSalary  = Math.max(0, grossEarned - totalDed);
  const netSalary      = autoNetSalary;

  const autoTotalPayable = netSalary + taDA + reimbursement + salaryArrears;
  const totalPayable   = autoTotalPayable;

  // --- EMPLOYER ---
  const autoEmployerEPF  = isPfProvided ? basicEarned * 0.13 : 0;
  const employerEPF      = isPfProvided ? numOr(edits.employerEPF, autoEmployerEPF) : 0;

  const autoEmployerESIC = isEsicProvided ? basicEarned * 0.0325 : 0;
  const employerESIC     = isEsicProvided ? numOr(edits.employerESIC, autoEmployerESIC) : 0;

  const autoCtc          = grossEarned + employerEPF + employerESIC;
  const ctc              = autoCtc;

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


