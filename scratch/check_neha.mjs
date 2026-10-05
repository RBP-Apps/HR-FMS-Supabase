import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Check employee
  const { data: emp, error: empErr } = await supabase
    .from('joining')
    .select('*')
    .ilike('name_as_per_aadhar', '%neha%gedam%');
  console.log('Employee:', emp, empErr);

  if (!emp || emp.length === 0) return;
  const neha = emp[0];
  console.log('Neha id:', neha.id, 'code:', neha.rbp_joining_id, 'name:', neha.name_as_per_aadhar, 'category:', neha.employee_category);

  // Check attendance_finalization_log for month 9, year 2026
  const { data: finLog } = await supabase
    .from('attendance_finalization_log')
    .select('*')
    .eq('month', 9)
    .eq('year', 2026);
  console.log('Finalization log for Sep 2026:', finLog);

  // Check final_attendance for Sep 2026
  const { data: finalAtt } = await supabase
    .from('final_attendance')
    .select('*')
    .eq('month', 9)
    .eq('year', 2026)
    .or(`employee_id.eq.${neha.id},employee_id.eq.${neha.rbp_joining_id}`);
  console.log('Final attendance count:', finalAtt ? finalAtt.length : 0);

  // Check offline_biometric_punch for Sep 2026
  const { data: bioPunch } = await supabase
    .from('offline_biometric_punch')
    .select('*')
    .gte('attendance_date', '2026-09-01')
    .lte('attendance_date', '2026-09-30')
    .or(`employee_id.eq.${neha.rbp_joining_id},employee_id.eq.${neha.id},employee_name.ilike.%neha%gedam%`);
  console.log('Bio punch count:', bioPunch ? bioPunch.length : 0);

  // Check attendance table for Sep 2026
  const { data: attData } = await supabase
    .from('attendance')
    .select('*')
    .gte('date', '2026-09-01')
    .lte('date', '2026-09-30')
    .or(`employee_code.eq.${neha.rbp_joining_id},person_name.ilike.%neha%gedam%`);
  console.log('Attendance logs count:', attData ? attData.length : 0);
  if (attData && attData.length > 0) {
    console.log('Attendance logs:', attData.map(a => ({ date: a.date, status: a.status, approved_status: a.approved_status, time: a.time, remark: a.remark })));
  }

  // Check payroll_history for Sep 2026
  const { data: payHist } = await supabase
    .from('payroll_history')
    .select('*')
    .eq('month', 9)
    .eq('year', 2026)
    .or(`employee_id.eq.${neha.id},employee_code.eq.${neha.rbp_joining_id}`);
  console.log('Payroll history for Neha:', payHist);

  // Check leave_ledger for Neha
  const { data: ledger } = await supabase
    .from('leave_ledger')
    .select('*')
    .eq('employee_id', neha.id);
  console.log('Leave ledger count for Neha:', ledger ? ledger.length : 0);
  if (ledger) {
    console.log('Leave ledger entries:', ledger);
  }

  // Check late approvals for Neha
  const { data: lateAppr } = await supabase
    .from('late_attendance_approval')
    .select('*')
    .or(`employee_id.eq.${neha.id},employee_code.eq.${neha.rbp_joining_id}`);
  console.log('Late approvals count for Neha:', lateAppr ? lateAppr.length : 0);
}

run();
