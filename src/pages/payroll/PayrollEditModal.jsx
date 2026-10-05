import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Sparkles,
  User,
  Calendar,
  DollarSign,
  TrendingDown,
  Building,
  AlertCircle,
  CheckCircle,
  Search,
  Check,
  CreditCard,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { fmt } from './payrollConstants';

// Clean reusable field input
const EditField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  unit,
  badge,
  hint,
  placeholder,
  highlight,
  error,
}) => (
  <div className={`flex flex-col gap-1 rounded-xl p-2.5 transition-all duration-150 ${highlight ? 'bg-indigo-50/70 border border-indigo-200/80 shadow-xs' : 'bg-slate-50/80 border border-slate-200/70 hover:border-slate-300'}`}>
    <div className="flex items-center justify-between gap-1">
      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
        <span>{label}</span>
        {badge && (
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 font-semibold lowercase">
            {badge}
          </span>
        )}
      </label>
      {unit && <span className="text-[10px] font-extrabold text-slate-400">{unit}</span>}
    </div>
    {hint && <p className="text-[10px] text-slate-400 -mt-0.5">{hint}</p>}
    <div className="relative flex items-center mt-0.5">
      <input
        type={type}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder || (type === 'number' ? '0' : '')}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 'any' : undefined}
        className={`w-full bg-white border rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all
          ${error ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 shadow-xs'}`}
      />
    </div>
    {error && <span className="text-[10px] text-rose-500 font-semibold">{error}</span>}
  </div>
);

// Readonly or auto-reference card
const SummaryBadge = ({ label, value, highlight, subtitle }) => (
  <div className={`px-3 py-2 rounded-2xl flex flex-col justify-center border transition-all ${
    highlight
      ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-xs'
      : 'bg-white border-slate-200 shadow-xs'
  }`}>
    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={`text-sm font-black mt-0.5 ${highlight ? 'text-indigo-700' : 'text-slate-800'}`}>
      {value}
    </span>
    {subtitle && <span className="text-[9px] text-slate-400">{subtitle}</span>}
  </div>
);

export default function PayrollEditModal({ record, month, year, onClose, onSave }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form state with every single column
  const initialForm = useMemo(() => {
    if (!record) return {};
    const emp = record.employee || {};
    const att = record.attendance || {};
    const c = record.calc || {};
    const ed = record.edits || {};

    const pfRaw = ed.company_pf_provided || emp.company_pf_provided || record.company_pf_provided;
    const isPfYes = pfRaw === 'Yes' || pfRaw === true || pfRaw === 'TRUE' || pfRaw === 'true';
    const esicRaw = ed.company_esic_provided || emp.company_esic_provided || record.company_esic_provided;
    const isEsicYes = esicRaw === 'Yes' || esicRaw === true || esicRaw === 'TRUE' || esicRaw === 'true';

    const grossVal = emp.gross_salary || ed.gross_salary || ed.grossReal || c.grossReal || 0;
    const epfVal = isPfYes ? (ed.epfDed ?? c.epfDed ?? 0) : 0;
    const esicVal = isEsicYes ? (ed.esicDed ?? c.esicDed ?? 0) : 0;
    const empEpfVal = isPfYes ? (ed.employerEPF ?? c.employerEPF ?? 0) : 0;
    const empEsicVal = isEsicYes ? (ed.employerESIC ?? c.employerESIC ?? 0) : 0;

    return {
      // 1. Employee Profile
      employee_name: ed.employee_name ?? emp.employee_name ?? '',
      rbp_joining_id: ed.rbp_joining_id ?? emp.rbp_joining_id ?? '',
      bank_account_number: ed.bank_account_number ?? emp.bank_account_number ?? '',
      ifsc_code: ed.ifsc_code ?? emp.ifsc_code ?? '',
      company_pf_provided: isPfYes ? 'Yes' : 'No',
      company_esic_provided: isEsicYes ? 'Yes' : 'No',
      uan_number: ed.uan_number ?? emp.uan_number ?? '',
      esic_number: ed.esic_number ?? emp.esic_number ?? '',
      designation: ed.designation ?? emp.designation ?? '',
      in_hand: ed.in_hand ?? emp.in_hand ?? c.inHand ?? '',

      // 2. Attendance
      present_days: ed.present_days ?? att.present_days ?? 0,
      working_days: ed.working_days ?? att.working_days ?? 26,
      ot: ed.ot ?? 0,

      // 3. Real Salary Structure
      gross_salary: grossVal,
      basicReal: ed.basicReal ?? c.basicReal ?? Math.round(grossVal * 0.50),
      hraReal: ed.hraReal ?? c.hraReal ?? Math.round(grossVal * 0.20),
      convReal: ed.convReal ?? c.convReal ?? Math.round(grossVal * 0.10),
      medReal: ed.medReal ?? c.medReal ?? Math.round(grossVal * 0.15),
      specialReal: ed.specialReal ?? c.specialReal ?? Math.round(grossVal * 0.05),

      // 4. Earned Components
      grossEarned: ed.grossEarned ?? c.grossEarned ?? 0,
      basicEarned: ed.basicEarned ?? c.basicEarned ?? 0,
      hraEarned: ed.hraEarned ?? c.hraEarned ?? 0,
      convEarned: ed.convEarned ?? c.convEarned ?? 0,
      medEarned: ed.medEarned ?? c.medEarned ?? 0,
      specialEarned: ed.specialEarned ?? c.specialEarned ?? 0,
      otAmount: ed.otAmount ?? c.otAmount ?? 0,

      // 5. Deductions
      epfDed: epfVal,
      esicDed: esicVal,
      advance: ed.advance ?? c.advance ?? 0,
      security_deposit: ed.security_deposit ?? c.securityDep ?? 0,
      late_deduction: ed.late_deduction ?? c.lateDeduction ?? 0,
      other_deduction: ed.other_deduction ?? c.otherDed ?? 0,
      totalDed: ed.totalDed ?? c.totalDed ?? 0,

      // 6. Net & Allowances
      reimbursement: ed.reimbursement ?? c.reimbursement ?? 0,
      salary_arrears: ed.salary_arrears ?? c.salaryArrears ?? 0,
      ta_da: ed.ta_da ?? c.taDA ?? 0,
      netSalary: ed.netSalary ?? c.netSalary ?? 0,
      totalPayable: ed.totalPayable ?? c.totalPayable ?? 0,

      // 7. Employer & Remarks
      employerEPF: empEpfVal,
      employerESIC: empEsicVal,
      ctc: ed.ctc ?? c.ctc ?? 0,
      remark: ed.remark ?? c.remark ?? '',
    };
  }, [record]);

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [initialForm]);

  if (!record) return null;
  const emp = record.employee || {};

  // Pure formula calculator from base gross, attendance, and policy settings
  const calculateAll = (baseForm) => {
    const m = Number(month ?? new Date().getMonth());
    const y = Number(year ?? new Date().getFullYear());
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const calendarDays = daysInMonth || 30;

    const gross = Number(baseForm.gross_salary || 0);
    const present = Number(baseForm.present_days || 0);
    const otDays = Number(baseForm.ot || 0);

    // 1. Real Structure
    const basicReal = Math.round(gross * 0.50);
    const hraReal = Math.round(gross * 0.20);
    const convReal = Math.round(gross * 0.10);
    const medReal = Math.round(gross * 0.15);
    const specialReal = Math.round(gross * 0.05);

    // 2. Earned Components
    const basicEarned = calendarDays ? Math.round((basicReal / calendarDays) * present) : 0;
    const hraEarned = calendarDays ? Math.round((hraReal / calendarDays) * present) : 0;
    const convEarned = calendarDays ? Math.round((convReal / calendarDays) * present) : 0;
    const medEarned = calendarDays ? Math.round((medReal / calendarDays) * present) : 0;
    const specialEarned = calendarDays ? Math.round((specialReal / calendarDays) * present) : 0;
    const grossEarned = basicEarned + hraEarned + convEarned + medEarned + specialEarned;

    // 3. OT
    const perDay = calendarDays ? gross / calendarDays : 0;
    const otAmount = Math.round(otDays * perDay);

    // 4. Deductions
    const isPf = baseForm.company_pf_provided === 'Yes';
    const isEsic = baseForm.company_esic_provided === 'Yes';

    const epfDed = isPf ? Math.round(basicEarned * 0.12) : 0;
    const esicDed = isEsic ? Math.round(grossEarned * 0.0075) : 0;
    const advance = Number(baseForm.advance || 0);
    const secDep = Number(baseForm.security_deposit || 0);
    const lateDed = Number(baseForm.late_deduction || 0);
    const otherDed = Number(baseForm.other_deduction || 0);
    const totalDed = epfDed + esicDed + advance + secDep + lateDed + otherDed;

    // 5. Net & Payable
    const reimb = Number(baseForm.reimbursement || 0);
    const arrears = Number(baseForm.salary_arrears || 0);
    const taDa = Number(baseForm.ta_da || 0);
    const netSalary = Math.max(0, grossEarned - totalDed);
    const totalPayable = netSalary + reimb + arrears + taDa;

    // 6. Employer & CTC
    const empEpf = isPf ? Math.round(basicEarned * 0.13) : 0;
    const empEsic = isEsic ? Math.round(basicEarned * 0.0325) : 0;
    const ctc = grossEarned + empEpf + empEsic;

    return {
      ...baseForm,
      gross_salary: gross,
      basicReal,
      hraReal,
      convReal,
      medReal,
      specialReal,
      basicEarned,
      hraEarned,
      convEarned,
      medEarned,
      specialEarned,
      grossEarned,
      otAmount,
      epfDed,
      esicDed,
      totalDed,
      netSalary,
      totalPayable,
      employerEPF: empEpf,
      employerESIC: empEsic,
      ctc,
    };
  };

  // Handle generic input change with live auto-recalculations
  const handleChange = (e) => {
    const { name, value } = e.target;
    const isText = ['employee_name', 'rbp_joining_id', 'bank_account_number', 'ifsc_code', 'uan_number', 'esic_number', 'designation', 'company_pf_provided', 'company_esic_provided', 'remark', 'in_hand'].includes(name);

    setForm(prev => {
      const nextVal = isText ? value : (value === '' ? '' : Number(value));
      const updated = { ...prev, [name]: nextVal };

      // Automatic full recalculation when gross salary, attendance, or PF/ESIC policy changes
      if (['gross_salary', 'present_days', 'ot', 'working_days', 'company_pf_provided', 'company_esic_provided'].includes(name)) {
        return calculateAll(updated);
      }

      // Live auto-synchronize dependent deductions & net if changing deduction/allowance components directly
      if (['advance', 'security_deposit', 'late_deduction', 'other_deduction', 'epfDed', 'esicDed'].includes(name)) {
        const isPf = updated.company_pf_provided === 'Yes';
        const isEsic = updated.company_esic_provided === 'Yes';
        const epf = isPf ? Number(name === 'epfDed' ? nextVal : updated.epfDed || 0) : 0;
        const esic = isEsic ? Number(name === 'esicDed' ? nextVal : updated.esicDed || 0) : 0;
        const adv = Number(name === 'advance' ? nextVal : updated.advance || 0);
        const sec = Number(name === 'security_deposit' ? nextVal : updated.security_deposit || 0);
        const late = Number(name === 'late_deduction' ? nextVal : updated.late_deduction || 0);
        const oth = Number(name === 'other_deduction' ? nextVal : updated.other_deduction || 0);
        const totDed = epf + esic + adv + sec + late + oth;
        updated.epfDed = epf;
        updated.esicDed = esic;
        updated.totalDed = totDed;

        // Auto update net and total payable
        const grossEarn = Number(updated.grossEarned || 0);
        const net = Math.max(0, grossEarn - totDed);
        updated.netSalary = net;
        updated.totalPayable = net + Number(updated.reimbursement || 0) + Number(updated.salary_arrears || 0) + Number(updated.ta_da || 0);
      }

      if (['reimbursement', 'salary_arrears', 'ta_da'].includes(name)) {
        const net = Number(updated.netSalary || 0);
        updated.totalPayable = net + Number(name === 'reimbursement' ? nextVal : updated.reimbursement || 0)
          + Number(name === 'salary_arrears' ? nextVal : updated.salary_arrears || 0)
          + Number(name === 'ta_da' ? nextVal : updated.ta_da || 0);
      }

      return updated;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Re-calculate all standard formulas from base Gross + Present Days
  const handleAutoRecalculate = () => {
    setForm(prev => calculateAll(prev));
  };

  // Reset to default (clears all manual overrides)
  const handleResetToMaster = () => {
    if (window.confirm('Reset all custom overrides for this employee back to original calculated values?')) {
      onSave(record.id, null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 200));
    onSave(record.id, form);
    setSaving(false);
  };

  // Categories definitions
  const categories = [
    { id: 'all', label: 'All Columns', count: 38 },
    { id: 'emp', label: 'Employee Profile', icon: User, count: 10 },
    { id: 'att', label: 'Attendance & OT', icon: Calendar, count: 3 },
    { id: 'real', label: 'Real Salary', icon: Briefcase, count: 6 },
    { id: 'earned', label: 'Earned Salary', icon: DollarSign, count: 7 },
    { id: 'ded', label: 'Deductions', icon: TrendingDown, count: 7 },
    { id: 'net', label: 'Net & Payables', icon: CreditCard, count: 5 },
    { id: 'employer', label: 'Employer & Remarks', icon: Building, count: 4 },
  ];

  const matchesSearch = (text) => {
    if (!searchFilter.trim()) return true;
    return text.toLowerCase().includes(searchFilter.toLowerCase().trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-3 sm:p-5 transition-all"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col border border-slate-200 transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 px-6 py-4 flex items-center justify-between text-white shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-sm">
              #{record.id?.replace('PR', '') || 'PR'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">{form.employee_name || emp.employee_name || 'Employee Payroll'}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-white/15 text-indigo-100 font-bold">
                  {form.rbp_joining_id || emp.rbp_joining_id || 'ID'}
                </span>
              </div>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                {form.designation || emp.designation || 'Designation'} · {emp.department || 'Department'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoRecalculate}
              title="Recalculate all formulas from Gross & Attendance"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl text-xs font-black shadow-sm transition-transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>⚡ Auto-Recalculate</span>
            </button>
            <button
              onClick={handleResetToMaster}
              title="Reset all custom overrides back to defaults"
              className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Top Real-Time KPI Ribbon ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-slate-50 border-b border-slate-200/80 shrink-0">
          <SummaryBadge label="Gross (Real)" value={fmt(form.gross_salary)} />
          <SummaryBadge label="Gross Earned" value={fmt(form.grossEarned)} />
          <SummaryBadge label="Total Deductions" value={fmt(form.totalDed)} />
          <SummaryBadge label="Net Salary" value={fmt(form.netSalary)} highlight />
          <SummaryBadge label="Total Payable" value={fmt(form.totalPayable)} highlight />
          <SummaryBadge label="CTC" value={fmt(form.ctc)} />
        </div>

        {/* ── Filter / Navigation Bar ── */}
        <div className="px-6 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {/* Categories Tab Pill Selector */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full" style={{ scrollbarWidth: 'none' }}>
            {categories.map(cat => {
              const active = activeCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-48 sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search column..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* ── Main Scrollable Columns Form ── */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}>
          
          {/* 1. EMPLOYEE PROFILE SECTION */}
          {(activeCategory === 'all' || activeCategory === 'emp') && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Employee Profile & Bank Info
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {matchesSearch('Employee Name name') && (
                  <EditField label="Employee Name" name="employee_name" value={form.employee_name} onChange={handleChange} placeholder="Full name" />
                )}
                {matchesSearch('EMP Code rbp code') && (
                  <EditField label="EMP Code" name="rbp_joining_id" value={form.rbp_joining_id} onChange={handleChange} placeholder="e.g. RBP001" />
                )}
                {matchesSearch('Account Number bank account') && (
                  <EditField label="Account No" name="bank_account_number" value={form.bank_account_number} onChange={handleChange} placeholder="Account number" />
                )}
                {matchesSearch('IFSC Code bank ifsc') && (
                  <EditField label="IFSC Code" name="ifsc_code" value={form.ifsc_code} onChange={handleChange} placeholder="e.g. SBIN0001234" />
                )}
                {matchesSearch('Company Provides PF pf') && (
                  <div className="flex flex-col gap-1 rounded-xl p-2.5 bg-amber-50/60 border border-amber-200/80">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Company Provides PF
                    </label>
                    <select
                      name="company_pf_provided"
                      value={form.company_pf_provided}
                      onChange={handleChange}
                      className="w-full bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Yes">Yes (Deduct EPF 12%)</option>
                      <option value="No">No (0% EPF)</option>
                    </select>
                  </div>
                )}
                {matchesSearch('Company Provides ESIC esic') && (
                  <div className="flex flex-col gap-1 rounded-xl p-2.5 bg-teal-50/60 border border-teal-200/80">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Company Provides ESIC
                    </label>
                    <select
                      name="company_esic_provided"
                      value={form.company_esic_provided}
                      onChange={handleChange}
                      className="w-full bg-white border border-teal-200 rounded-lg px-3 py-1.5 text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Yes">Yes (Deduct ESIC 0.75%)</option>
                      <option value="No">No (0% ESIC)</option>
                    </select>
                  </div>
                )}
                {matchesSearch('UAN Number pf uan') && (
                  <EditField label="UAN Number" name="uan_number" value={form.uan_number} onChange={handleChange} placeholder="12-digit UAN" />
                )}
                {matchesSearch('ESIC Number esic') && (
                  <EditField label="ESIC Number" name="esic_number" value={form.esic_number} onChange={handleChange} placeholder="17-digit ESIC" />
                )}
                {matchesSearch('Designation role') && (
                  <EditField label="Designation" name="designation" value={form.designation} onChange={handleChange} placeholder="e.g. Sales Officer" />
                )}
                {matchesSearch('In Hand inhand salary') && (
                  <EditField label="In Hand (Manual)" name="in_hand" value={form.in_hand} onChange={handleChange} placeholder="Optional In Hand" />
                )}
              </div>
            </div>
          )}

          {/* 2. ATTENDANCE & OT */}
          {(activeCategory === 'all' || activeCategory === 'att') && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Attendance & Overtime Days
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {matchesSearch('Present Days paid days attendance') && (
                  <EditField
                    label="Present Days (Paid Days)"
                    name="present_days"
                    type="number"
                    value={form.present_days}
                    onChange={handleChange}
                    unit="days"
                    highlight
                    hint="Prorates earned salary components"
                  />
                )}
                {matchesSearch('Working Days calendar days month') && (
                  <EditField
                    label="Working Days in Month"
                    name="working_days"
                    type="number"
                    value={form.working_days}
                    onChange={handleChange}
                    unit="days"
                    hint="Total calendar / scheduled working days"
                  />
                )}
                {matchesSearch('OT Days overtime days') && (
                  <EditField
                    label="Overtime (OT Days)"
                    name="ot"
                    type="number"
                    value={form.ot}
                    onChange={handleChange}
                    unit="days"
                    hint="Days worked overtime"
                  />
                )}
              </div>
            </div>
          )}

          {/* 3. REAL SALARY STRUCTURE */}
          {(activeCategory === 'all' || activeCategory === 'real') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Real Salary Structure (Monthly Fixed)
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Formula: Basic 50% | HRA 20% | Conv 10% | Med 15% | Special 5%</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {matchesSearch('Gross Real fixed salary gross') && (
                  <EditField
                    label="GROSS (Real)"
                    name="gross_salary"
                    type="number"
                    value={form.gross_salary}
                    onChange={handleChange}
                    unit="₹"
                    highlight
                    badge="Base"
                  />
                )}
                {matchesSearch('Basic+DA Real basic') && (
                  <EditField label="BASIC+DA (Real)" name="basicReal" type="number" value={form.basicReal} onChange={handleChange} unit="₹" badge="50%" />
                )}
                {matchesSearch('HRA Real hra') && (
                  <EditField label="HRA (Real)" name="hraReal" type="number" value={form.hraReal} onChange={handleChange} unit="₹" badge="20%" />
                )}
                {matchesSearch('Conveyance Real conv') && (
                  <EditField label="CONV (Real)" name="convReal" type="number" value={form.convReal} onChange={handleChange} unit="₹" badge="10%" />
                )}
                {matchesSearch('Medical Real med') && (
                  <EditField label="MEDICAL (Real)" name="medReal" type="number" value={form.medReal} onChange={handleChange} unit="₹" badge="15%" />
                )}
                {matchesSearch('Special Real special') && (
                  <EditField label="SPECIAL (Real)" name="specialReal" type="number" value={form.specialReal} onChange={handleChange} unit="₹" badge="5%" />
                )}
              </div>
            </div>
          )}

          {/* 4. EARNED SALARY COMPONENTS */}
          {(activeCategory === 'all' || activeCategory === 'earned') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-pink-200 pb-1.5">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-pink-600" />
                  <h3 className="text-xs font-black text-pink-900 uppercase tracking-wider">
                    Earned Salary Components (Pink Category)
                  </h3>
                </div>
                <span className="text-[10px] text-pink-600 font-semibold">Pro-rated by Present Days</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {matchesSearch('Gross Salary Earned gross earned') && (
                  <EditField
                    label="GROSS SALARY (Earned)"
                    name="grossEarned"
                    type="number"
                    value={form.grossEarned}
                    onChange={handleChange}
                    unit="₹"
                    highlight
                    badge="Total Earned"
                  />
                )}
                {matchesSearch('BASIC+DA Earned basic earned') && (
                  <EditField label="BASIC+DA (Earned)" name="basicEarned" type="number" value={form.basicEarned} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('HRA Earned') && (
                  <EditField label="HRA (Earned)" name="hraEarned" type="number" value={form.hraEarned} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Conveyance Earned conv') && (
                  <EditField label="CONVEYANCE (Earned)" name="convEarned" type="number" value={form.convEarned} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Medical Earned med') && (
                  <EditField label="MEDICAL (Earned)" name="medEarned" type="number" value={form.medEarned} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Special Earned special') && (
                  <EditField label="SPECIAL (Earned)" name="specialEarned" type="number" value={form.specialEarned} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('OT Amount overtime amount') && (
                  <EditField label="OT Amount" name="otAmount" type="number" value={form.otAmount} onChange={handleChange} unit="₹" />
                )}
              </div>
            </div>
          )}

          {/* 5. DEDUCTIONS */}
          {(activeCategory === 'all' || activeCategory === 'ded') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-yellow-300 pb-1.5">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Deductions (Yellow Category)
                  </h3>
                </div>
                <span className="text-[10px] text-amber-700 font-semibold">Subtracted from Gross Earned</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {matchesSearch('EPF 12% epf ded') && (
                  <EditField label="EPF 12%" name="epfDed" type="number" value={form.epfDed} onChange={handleChange} unit="₹" badge="12% Basic" />
                )}
                {matchesSearch('ESIC 0.75% esic ded') && (
                  <EditField label="ESIC 0.75%" name="esicDed" type="number" value={form.esicDed} onChange={handleChange} unit="₹" badge="0.75% Gross" />
                )}
                {matchesSearch('Advance adv deduction') && (
                  <EditField label="ADVANCE" name="advance" type="number" value={form.advance} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Security Deposit sec dep') && (
                  <EditField label="SECURITY DEP." name="security_deposit" type="number" value={form.security_deposit} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Late Deduction late ded') && (
                  <EditField label="LATE DEDUCTION" name="late_deduction" type="number" value={form.late_deduction} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Other Deduction other ded') && (
                  <EditField label="OTHER DED." name="other_deduction" type="number" value={form.other_deduction} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Total Deduction total ded') && (
                  <EditField
                    label="TOTAL DED."
                    name="totalDed"
                    type="number"
                    value={form.totalDed}
                    onChange={handleChange}
                    unit="₹"
                    highlight
                    badge="Total"
                  />
                )}
              </div>
            </div>
          )}

          {/* 6. NET SALARY & ALLOWANCES */}
          {(activeCategory === 'all' || activeCategory === 'net') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Net Salary & Additions
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">Total Payable = Net + Reimbursement + Arrears + TA/DA</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {matchesSearch('Reimbursement reimb') && (
                  <EditField label="REIMBURSEMENT" name="reimbursement" type="number" value={form.reimbursement} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Salary Arrears arrears') && (
                  <EditField label="SALARY ARREARS" name="salary_arrears" type="number" value={form.salary_arrears} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('TA DA ta da travel') && (
                  <EditField label="TA DA" name="ta_da" type="number" value={form.ta_da} onChange={handleChange} unit="₹" />
                )}
                {matchesSearch('Net Salary net salary') && (
                  <EditField
                    label="NET SALARY"
                    name="netSalary"
                    type="number"
                    value={form.netSalary}
                    onChange={handleChange}
                    unit="₹"
                    highlight
                    badge="Gross - Ded"
                  />
                )}
                {matchesSearch('Total Payable total payable final') && (
                  <EditField
                    label="TOTAL PAYABLE"
                    name="totalPayable"
                    type="number"
                    value={form.totalPayable}
                    onChange={handleChange}
                    unit="₹"
                    highlight
                    badge="Final Payout"
                  />
                )}
              </div>
            </div>
          )}

          {/* 7. EMPLOYER CONTRIBUTIONS & REMARK */}
          {(activeCategory === 'all' || activeCategory === 'employer') && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between border-b border-green-200 pb-1.5">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-green-700" />
                  <h3 className="text-xs font-black text-green-900 uppercase tracking-wider">
                    Employer Contributions (Green Category) & Remark
                  </h3>
                </div>
                <span className="text-[10px] text-green-700 font-semibold">CTC = Gross Earned + Emp EPF + Emp ESIC</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {matchesSearch('EMP EPF 13% employer epf') && (
                  <EditField label="EMP EPF 13%" name="employerEPF" type="number" value={form.employerEPF} onChange={handleChange} unit="₹" badge="13% Basic" />
                )}
                {matchesSearch('EMP ESIC 3.25% employer esic') && (
                  <EditField label="EMP ESIC 3.25%" name="employerESIC" type="number" value={form.employerESIC} onChange={handleChange} unit="₹" badge="3.25% Basic" />
                )}
                {matchesSearch('CTC ctc company cost') && (
                  <EditField
                    label="CTC"
                    name="ctc"
                    type="number"
                    value={form.ctc}
                    onChange={handleChange}
                    unit="₹"
                    highlight
                    badge="Company Cost"
                  />
                )}
                {matchesSearch('Remark remarks note') && (
                  <div className="col-span-1 sm:col-span-2 md:col-span-1">
                    <EditField label="REMARK" name="remark" type="text" value={form.remark} onChange={handleChange} placeholder="Add note or remark..." />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-semibold hidden sm:block">
            All 38 columns editable · Overrides will take immediate effect in payroll table & export
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 text-xs font-extrabold text-white
                bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700
                rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all duration-150 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
