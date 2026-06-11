import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unydjalszyszoxvgocmx.supabase.co';
const supabaseKey = 'sb_publishable_kgJM40embkgUsOEY3LOiAw_jTGiX7Js';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const month = 4; // May
  const year = 2026;
  const monthNum = month + 1;
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const prefix = `${year}-${String(monthNum).padStart(2, '0')}`;

  const { data: joiningData } = await supabase
    .from('joining')
    .select('id, name_as_per_aadhar, rbp_joining_id, employee_category')
    .eq('status', 'Active');

  const empList = (joiningData || []).map(emp => ({
    id: emp.id,
    rbp_joining_id: emp.rbp_joining_id || '',
    employee_name: emp.name_as_per_aadhar || '',
    employee_category: emp.employee_category ? emp.employee_category.trim() : '',
  }));

  const [{ data: bioLogs }, { data: attLogs }] = await Promise.all([
    supabase.from('offline_biometric_punch')
      .select('employee_id,employee_name,attendance_date,in_time,out_time')
      .gte('attendance_date', `${prefix}-01`)
      .lte('attendance_date', `${prefix}-${daysInMonth}`),
    supabase.from('attendance')
      .select('person_name,employee_code,date,status,approved_status')
      .gte('date', `${prefix}-01`)
      .lte('date', `${prefix}-${daysInMonth}`),
  ]);

  const results = empList.map(emp => {
    let presentDays = 0, weekOffCount = 0, paidLeaves = 0, absentDays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${prefix}-${String(d).padStart(2, '0')}`;
      const isSunday = new Date(year, month, d).getDay() === 0;
      let status = isSunday ? 'WO' : 'A';

      const manual = (attLogs || []).find(a =>
        (a.person_name?.toLowerCase() === emp.employee_name?.toLowerCase() ||
         a.employee_code === emp.rbp_joining_id) &&
        a.date === dayStr && a.approved_status === 'corrected'
      );
      if (manual) {
        status = (manual.status === 'P' || manual.status === 'IN') ? 'P' : 'A';
      } else {
        const leave = (attLogs || []).find(a =>
          (a.person_name?.toLowerCase() === emp.employee_name?.toLowerCase() ||
           a.employee_code === emp.rbp_joining_id) &&
          a.date === dayStr && a.status === 'CL'
        );
        if (leave) {
          status = 'CL';
        } else {
          const bio = (bioLogs || []).some(b =>
            (b.employee_id === emp.rbp_joining_id ||
             b.employee_name?.trim().toLowerCase() === emp.employee_name?.trim().toLowerCase()) &&
            b.attendance_date === dayStr &&
            (b.in_time || b.out_time)
          );
          if (bio) {
            status = 'P';
          } else {
            const field = (attLogs || []).some(a =>
              (a.person_name?.toLowerCase() === emp.employee_name?.toLowerCase() ||
                a.employee_code === emp.rbp_joining_id) &&
              a.date === dayStr && a.status !== 'CL'
            );
            if (field) status = 'P';
          }
        }
      }

      if (status === 'P') presentDays++;
      else if (status === 'WO') weekOffCount++;
      else if (status === 'CL') paidLeaves++;
      else absentDays++;
    }

    return {
      name: emp.employee_name,
      category: emp.employee_category,
      code: emp.rbp_joining_id,
      present_days: presentDays,
    };
  });

  const sample = results.filter(r => r.present_days > 0);
  console.log('Total active employees:', results.length);
  console.log('Employees with present_days > 0 in May 2026:', sample.length);
  console.log('Sample of matched employees:', sample.slice(0, 10));
}

main();
