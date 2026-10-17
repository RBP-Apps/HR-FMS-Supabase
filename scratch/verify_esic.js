import { calcSalary } from './src/pages/payroll/payrollCalc.js';

console.log('--- Testing calcSalary for EMP ESIC 3.25% ---');

// Test Case 1: Standard Employee with Gross = 20,000 and 30 present days (full month in April / 30 days)
const emp1 = { company_pf_provided: 'Yes', company_esic_provided: 'Yes', gross_salary: 20000 };
const att1 = { present_days: 30, working_days: 26 };
const res1 = calcSalary(20000, att1, {}, 3, 2026, emp1); // Month 3 = April (30 days)

console.log('Test 1 (Gross ₹20,000, full month):');
console.log('  grossReal:', res1.grossReal);
console.log('  grossEarned:', res1.grossEarned);
console.log('  basicEarned:', res1.basicEarned);
console.log('  esicDed (0.75% gross):', res1.esicDed, 'Expected:', 20000 * 0.0075);
console.log('  employerESIC (3.25% gross):', res1.employerESIC, 'Expected: 650');
console.log('  employerEPF (13% basic):', res1.employerEPF, 'Expected:', 10000 * 0.13);
console.log('  ctc:', res1.ctc, 'Expected:', res1.grossEarned + res1.employerEPF + 650);

if (res1.employerESIC === 650) {
  console.log('  PASS: employerESIC is 650 (GROSS * 3.25%) and NOT 325 (BASIC * 3.25%)');
} else {
  console.error('  FAIL: expected 650, got', res1.employerESIC);
  process.exit(1);
}

// Test Case 2: ESIC not provided
const emp2 = { company_pf_provided: 'Yes', company_esic_provided: 'No', gross_salary: 20000 };
const res2 = calcSalary(20000, att1, {}, 3, 2026, emp2);
console.log('\nTest 2 (ESIC No):');
console.log('  employerESIC:', res2.employerESIC, 'Expected: 0');
if (res2.employerESIC === 0) {
  console.log('  PASS: employerESIC is 0 when ESIC not provided');
} else {
  console.error('  FAIL: expected 0, got', res2.employerESIC);
  process.exit(1);
}

// Test Case 3: Stale legacy basic calculation override passed in edits (325 = basicEarned * 3.25%)
const editsWithStale = { employerESIC: 325 };
const res3 = calcSalary(20000, att1, editsWithStale, 3, 2026, emp1);
console.log('\nTest 3 (Legacy basic-based override 325 passed in edits):');
console.log('  employerESIC:', res3.employerESIC, 'Expected: 650');
if (res3.employerESIC === 650) {
  console.log('  PASS: Legacy basic override discarded and recomputed to 650');
} else {
  console.error('  FAIL: expected 650, got', res3.employerESIC);
  process.exit(1);
}

// Test Case 4: Deliberate custom manual override passed in edits (e.g. 700)
const editsWithCustom = { employerESIC: 700 };
const res4 = calcSalary(20000, att1, editsWithCustom, 3, 2026, emp1);
console.log('\nTest 4 (Custom manual override 700 passed in edits):');
console.log('  employerESIC:', res4.employerESIC, 'Expected: 700');
if (res4.employerESIC === 700) {
  console.log('  PASS: Custom manual override preserved as 700');
} else {
  console.error('  FAIL: expected 700, got', res4.employerESIC);
  process.exit(1);
}

// Test Case 5: OT added to NET SALARY
const res5WithoutOt = calcSalary(20000, att1, { ot: 0 }, 3, 2026, emp1);
const res5WithOt = calcSalary(20000, att1, { ot: 3 }, 3, 2026, emp1);
console.log('\nTest 5 (OT added to Net Salary):');
console.log('  Net without OT:', res5WithoutOt.netSalary);
console.log('  Net with OT (3 days):', res5WithOt.netSalary);
console.log('  OT Amount:', res5WithOt.otAmount);
if (Math.abs(res5WithOt.netSalary - (res5WithoutOt.netSalary + res5WithOt.otAmount)) < 0.01) {
  console.log('  PASS: OT Amount is correctly added to NET SALARY');
} else {
  console.error('  FAIL: OT Amount not added to NET SALARY');
  process.exit(1);
}

console.log('\nALL TESTS PASSED SUCCESSFULLY!');
