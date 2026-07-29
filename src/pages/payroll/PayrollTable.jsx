import React, { useState } from 'react';
import { Eye, Edit2, Download, Printer, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { fmt } from './payrollConstants';

const TH = ({ children, sticky, stickyLeft, leftOffset = 0, className = '' }) => (
  <th
    style={stickyLeft ? { left: leftOffset } : {}}
    className={`px-3 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wide whitespace-nowrap
    ${sticky ? 'sticky right-0 bg-indigo-600 z-20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}
    ${stickyLeft ? 'sticky left-0 z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}
    ${className}`}
  >
    {children}
  </th>
);

const TD = ({ children, className = '', sticky, stickyLeft, leftOffset = 0, even }) => (
  <td
    style={stickyLeft ? { left: leftOffset } : {}}
    className={`px-3 py-2.5 whitespace-nowrap text-center text-sm
    ${sticky ? 'sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]' : ''}
    ${stickyLeft ? 'sticky left-0 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.06)]' : ''}
    ${even ? 'bg-slate-50/80' : 'bg-white'}
    ${sticky ? (even ? '!bg-slate-50/80' : '!bg-white') : ''}
    ${stickyLeft ? (even ? '!bg-slate-50/80' : '!bg-white') : ''}
    ${className}`}
  >
    {children}
  </td>
);

const Badge = ({ label, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${colors[color] || colors.gray}`}>
      {label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = { Processed: 'blue', Approved: 'green', Paid: 'green', Pending: 'yellow', Hold: 'red' };
  return <Badge label={status || 'Pending'} color={map[status] || 'gray'} />;
};

const ActionBtn = ({ icon: Icon, label, onClick, color }) => {
  const colors = {
    blue: 'text-blue-600 hover:bg-blue-50 hover:text-blue-700',
    green: 'text-green-600 hover:bg-green-50 hover:text-green-700',
    purple: 'text-purple-600 hover:bg-purple-50 hover:text-purple-700',
    orange: 'text-orange-600 hover:bg-orange-50 hover:text-orange-700',
    slate: 'text-slate-600 hover:bg-slate-50 hover:text-slate-700',
  };
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${colors[color] || colors.blue}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
};

const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 12 }).map((_, i) => (
      <td key={i} className="px-3 py-3">
        <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%`, margin: '0 auto' }} />
      </td>
    ))}
  </tr>
);

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 animate-pulse shadow-sm">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-gray-200" />
      <div className="space-y-1.5 flex-1">
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 py-2">
      <div className="h-12 bg-gray-100 rounded-xl" />
      <div className="h-12 bg-gray-100 rounded-xl" />
    </div>
    <div className="h-20 bg-gray-100 rounded-xl" />
    <div className="h-8 bg-gray-100 rounded-xl" />
  </div>
);

const PayrollCard = ({ record, idx, onView, onEdit, onDownloadPayslip, onPrint, onViewEmployee }) => {
  const emp = record.employee || {};
  const att = record.attendance || {};
  const c = record.calc || {};
  const rowNum = idx + 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group hover:-translate-y-1">
      {/* Top Banner & Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-blue-50/20 border-b border-gray-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center shadow-sm shrink-0">
              #{rowNum}
            </span>
            <div className="min-w-0">
              <h3 className="font-extrabold text-red-500 text-sm leading-tight tracking-wide group-hover:text-indigo-700 transition-colors truncate">
                {emp.employee_name || '—'}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="font-mono text-[11px] bg-indigo-100/80 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                  {emp.rbp_joining_id || '—'}
                </span>
                <span className="text-xs text-gray-500 font-medium truncate max-w-[130px]" title={emp.designation || '—'}>
                  {emp.designation || '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <StatusBadge status={record.payroll_status} />
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-3.5 space-y-3 flex-1 text-xs">
        {/* Highlight Stats Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100/80">
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Total Payable</span>
            <span className="text-sm font-extrabold text-indigo-700 block mt-0.5">{fmt(c.totalPayable)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Present / Work Days</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-sm font-extrabold text-emerald-800">
                {att.present_days ?? 0} <span className="text-xs font-normal text-emerald-600">/ {att.working_days ?? 0}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Earned Salary Section */}
        <div className="bg-pink-50/40 rounded-xl p-2.5 border border-pink-100/80 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-bold text-pink-900 border-b border-pink-200/50 pb-1">
            <span>EARNED SALARY</span>
            <span className="text-pink-700 font-extrabold">{fmt(c.grossEarned)}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div className="flex justify-between"><span className="text-gray-500">Basic+DA:</span> <span className="font-semibold text-gray-700">{fmt(c.basicEarned)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">HRA:</span> <span className="font-semibold text-gray-700">{fmt(c.hraEarned)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Conv:</span> <span className="font-semibold text-gray-700">{fmt(c.convEarned)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Special:</span> <span className="font-semibold text-gray-700">{fmt(c.specialEarned)}</span></div>
          </div>
        </div>

        {/* Deductions Section */}
        <div className="bg-yellow-50/40 rounded-xl p-2.5 border border-yellow-100/80 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-bold text-yellow-900 border-b border-yellow-200/50 pb-1">
            <span>DEDUCTIONS</span>
            <span className="text-red-600 font-extrabold">{fmt(c.totalDed)}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div className="flex justify-between"><span className="text-gray-500">EPF 12%:</span> <span className="font-semibold text-gray-700">{fmt(c.epfDed)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ESIC 0.75%:</span> <span className="font-semibold text-gray-700">{fmt(c.esicDed)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Advance:</span> <span className="font-semibold text-gray-700">{fmt(c.advance)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Other Ded:</span> <span className="font-semibold text-gray-700">{fmt(c.otherDed)}</span></div>
          </div>
        </div>

        {/* Net & CTC Details */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-gray-400 text-[10px] font-semibold">NET SALARY</span>
            <span className="font-bold text-green-700 text-xs">{fmt(c.netSalary)}</span>
          </div>
          <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="text-gray-400 text-[10px] font-semibold">CTC</span>
            <span className="font-bold text-purple-700 text-xs">{fmt(c.ctc)}</span>
          </div>
        </div>

        {/* Acc & Identifiers */}
        <div className="pt-1 border-t border-gray-100 flex flex-wrap justify-between items-center text-[10px] text-gray-500 gap-y-1">
          <div><span className="font-medium text-gray-400">A/C:</span> <span className="font-mono text-gray-700 font-semibold">{emp.bank_account_number || record.bank_account_number || '—'}</span></div>
          <div><span className="font-medium text-gray-400">IFSC:</span> <span className="font-mono text-gray-700 font-semibold">{emp.ifsc_code || record.ifsc_code || '—'}</span></div>
          <div><span className="font-medium text-gray-400">UAN:</span> <span className="text-gray-700">{emp.uan_number || '—'}</span></div>
        </div>

        {c.remark && (
          <div className="text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100 truncate" title={c.remark}>
            <span className="font-semibold text-gray-600">Remark:</span> {c.remark}
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="p-3 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-slate-500">
          Gross: <span className="text-slate-800 font-bold">{fmt(c.grossReal)}</span>
        </div>
        <div className="flex items-center gap-1">
          {onView && (
            <button
              onClick={() => onView(record)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-100/60 bg-white border border-blue-200 transition-all duration-200"
              title="View Payroll"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View</span>
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(record)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 hover:bg-emerald-100/60 bg-white border border-emerald-200 transition-all duration-200"
              title="Edit Payroll"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
          {onDownloadPayslip && (
            <ActionBtn icon={Download} label="Download Payslip" onClick={() => onDownloadPayslip(record)} color="purple" />
          )}
          {onPrint && (
            <ActionBtn icon={Printer} label="Print" onClick={() => onPrint(record)} color="orange" />
          )}
          {onViewEmployee && (
            <ActionBtn icon={User} label="View Employee" onClick={() => onViewEmployee(record)} color="slate" />
          )}
        </div>
      </div>
    </div>
  );
};

export default function PayrollTable({
  records = [], loading, onView, onEdit, onDownloadPayslip, onPrint, onViewEmployee
}) {
  const [viewMode, setViewMode] = useState('table');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
      {/* Top View Mode Switcher Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>📋</span> Table View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              viewMode === 'card'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🗂️</span> Card View
          </button>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-indigo-600 font-bold">{records.length}</span> records
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' ? (
        /* Table scroll wrapper with fixed max height of 600px */
        <div className="overflow-y-auto max-h-[600px] overflow-x-auto transition-all duration-300" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}>
          <table className="w-full text-sm border-collapse">
            {/* Gradient sticky header */}
            <thead>
              <tr className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 sticky top-0 z-20">
                <TH stickyLeft leftOffset={0} className="w-[48px] min-w-[48px] max-w-[48px] !bg-indigo-600 z-30">#</TH>
                <TH stickyLeft leftOffset={48} className="w-[180px] min-w-[180px] max-w-[180px] text-left !bg-indigo-600 z-30">NAME</TH>
                <TH className="!bg-indigo-600">EMP CODE</TH>
                <TH className="!bg-indigo-600">ACCOUNT NO</TH>
                <TH className="!bg-indigo-600">IFSC CODE</TH>
                <TH className="!bg-indigo-600">UAN</TH>
                <TH className="!bg-indigo-600">ESIC</TH>
                <TH className="!bg-indigo-600">DESIGNATION</TH>
                <TH className="!bg-indigo-600">IN HAND</TH>
                <TH className="!bg-indigo-600">PRESENT</TH>
                <TH className="!bg-indigo-600">WORKING DAY</TH>
                {/* Real salary columns */}
                <TH className="!bg-indigo-600">BASIC+DA (Real)</TH>
                <TH className="!bg-indigo-600">HRA (Real)</TH>
                <TH className="!bg-indigo-600">CONV (Real)</TH>
                <TH className="!bg-indigo-600">MEDICAL (Real)</TH>
                <TH className="!bg-indigo-600">SPECIAL (Real)</TH>
                <TH className="!bg-indigo-600">GROSS (Real)</TH>
                {/* Earned columns */}
                <TH className="!bg-pink-200 !text-pink-900 border-x border-pink-300">
                  BASIC+DA
                </TH>
                <TH className="!bg-pink-200 !text-pink-900 border-x border-pink-300">
                  HRA
                </TH>
                <TH className="!bg-pink-200 !text-pink-900 border-x border-pink-300">
                  CONVEYANCE
                </TH>
                <TH className="!bg-pink-200 !text-pink-900 border-x border-pink-300">
                  MEDICAL
                </TH>
                <TH className="!bg-pink-200 !text-pink-900 border-x border-pink-300">
                  SPECIAL
                </TH>
                <TH className="!bg-pink-300 !text-pink-950 border-x border-pink-400 shadow-inner">
                  GROSS SALARY
                </TH>
                {/* Deductions */}
                <TH className="!bg-indigo-600">OT</TH>
                <TH className="!bg-yellow-200 !text-yellow-900 border-x border-yellow-300">
                  EPF 12%
                </TH>
                <TH className="!bg-yellow-200 !text-yellow-900 border-x border-yellow-300">
                  ESIC 0.75%
                </TH>
                <TH className="!bg-yellow-200 !text-yellow-900 border-x border-yellow-300">
                  ADVANCE
                </TH>
                <TH className="!bg-yellow-200 !text-yellow-900 border-x border-yellow-300">
                  SECURITY DEP.
                </TH>
                <TH className="!bg-yellow-200 !text-yellow-900 border-x border-yellow-300">
                  OTHER DED.
                </TH>
                <TH className="!bg-yellow-300 !text-yellow-950 border-x border-yellow-400 shadow-inner">
                  TOTAL DED.
                </TH>
                {/* Net */}
                <TH className="!bg-indigo-600">REIMBURSEMENT</TH>
                <TH className="!bg-indigo-600">SALARY ARREARS</TH>
                <TH className="!bg-indigo-600">NET SALARY</TH>
                <TH className="!bg-indigo-600">TA DA</TH>
                <TH className="!bg-indigo-600">TOTAL PAYABLE</TH>
                <TH className="!bg-indigo-600">REMARK</TH>
                {/* Employer */}
                <TH className="!bg-green-200 !text-green-900 border-x border-green-300">
                  EMP EPF 13%
                </TH>
                <TH className="!bg-green-200 !text-green-900 border-x border-green-300">
                  EMP ESIC 3.25%
                </TH>
                <TH className="!bg-green-700 !text-white border-x border-green-800 shadow-inner">
                  CTC
                </TH>
                <TH sticky>ACTIONS</TH>
              </tr>
            </thead>

            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : records.length === 0
                  ? (
                    <tr>
                      <td colSpan={40} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <User className="w-8 h-8" />
                          </div>
                          <p className="font-semibold text-gray-500">No payroll records found</p>
                          <p className="text-sm">Try adjusting your filters</p>
                        </div>
                      </td>
                    </tr>
                  )
                  : records.map((record, idx) => {
                    const even = idx % 2 === 1;
                    const emp = record.employee;
                    const att = record.attendance;
                    const c = record.calc || {};
                    const rowNum = idx + 1;

                    return (
                      <tr
                        key={record.id || idx}
                        className={`group transition-colors duration-150 hover:!bg-indigo-50/60 ${even ? 'bg-slate-50/80' : 'bg-white'}`}
                      >
                        {/* SL */}
                        <TD even={even} stickyLeft leftOffset={0} className="w-[48px] min-w-[48px] max-w-[48px] z-10">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold
                            inline-flex items-center justify-center">
                            {rowNum}
                          </span>
                        </TD>

                        {/* NAME */}
                        <TD
                          even={even}
                          stickyLeft
                          leftOffset={48}
                          className="font-extrabold text-red-500 text-[14px] tracking-wide bg-indigo-50 w-[220px] min-w-[220px] max-w-[220px] z-10"
                        >
                          {emp?.employee_name || '—'}
                        </TD>

                        {/* EMP CODE */}
                        <TD even={even}>
                          <span className="font-mono text-xs text-indigo-600 font-semibold">
                            {emp?.rbp_joining_id || '—'}
                          </span>
                        </TD>

                        {/* ACCOUNT NO */}
                        <TD even={even}>
                          <span className="font-mono text-xs text-slate-700 font-semibold">
                            {emp?.bank_account_number || record?.bank_account_number || '—'}
                          </span>
                        </TD>

                        {/* IFSC CODE */}
                        <TD even={even}>
                          <span className="font-mono text-xs text-slate-700 font-semibold">
                            {emp?.ifsc_code || record?.ifsc_code || '—'}
                          </span>
                        </TD>

                        {/* UAN */}
                        <TD even={even}>
                          <span className="text-xs text-gray-600">{emp?.uan_number || '—'}</span>
                        </TD>

                        {/* ESIC */}
                        <TD even={even}>
                          <span className="text-xs text-gray-600">{emp?.esic_number || '—'}</span>
                        </TD>

                        {/* DESIGNATION */}
                        <TD even={even}>
                          <span className="text-xs text-gray-600 whitespace-normal max-w-[120px] inline-block leading-snug">
                            {emp?.designation || '—'}
                          </span>
                        </TD>

                        {/* IN HAND */}
                        <TD even={even} className="font-bold text-emerald-600">
                          {/* Remained blank as requested */}
                        </TD>

                        {/* PRESENT */}
                        <TD even={even}>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-400" />
                            {att?.present_days ?? 0}
                          </span>
                        </TD>

                        {/* WORKING DAY */}
                        <TD even={even}>{att?.working_days ?? 0}</TD>

                        {/* REAL SALARY COLUMNS */}
                        <TD even={even} className="text-gray-700">{fmt(c.basicReal)}</TD>
                        <TD even={even} className="text-gray-700">{fmt(c.hraReal)}</TD>
                        <TD even={even} className="text-gray-700">{fmt(c.convReal)}</TD>
                        <TD even={even} className="text-gray-700">{fmt(c.medReal)}</TD>
                        <TD even={even} className="text-gray-700">{fmt(c.specialReal)}</TD>
                        <TD even={even} className="font-semibold text-gray-800">{fmt(c.grossReal)}</TD>

                        {/* EARNED COLUMNS (Pink Category) */}
                        <TD even={even} className="!bg-pink-50/50 text-pink-900 font-semibold">{fmt(c.basicEarned)}</TD>
                        <TD even={even} className="!bg-pink-50/50 text-pink-900 font-semibold">{fmt(c.hraEarned)}</TD>
                        <TD even={even} className="!bg-pink-50/50 text-pink-900 font-semibold">{fmt(c.convEarned)}</TD>
                        <TD even={even} className="!bg-pink-50/50 text-pink-900 font-semibold">{fmt(c.medEarned)}</TD>
                        <TD even={even} className="!bg-pink-50/50 text-pink-900 font-semibold">{fmt(c.specialEarned)}</TD>
                        <TD even={even} className="font-semibold text-blue-700 !bg-pink-100/50">{fmt(c.grossEarned)}</TD>

                        {/* OT */}
                        <TD even={even}>{fmt(c.otAmount)}</TD>

                        {/* DEDUCTIONS (Yellow Category) */}
                        <TD even={even} className="text-yellow-900 font-semibold !bg-yellow-50/50">{fmt(c.epfDed)}</TD>
                        <TD even={even} className="text-yellow-900 font-semibold !bg-yellow-50/50">{fmt(c.esicDed)}</TD>
                        <TD even={even} className="text-yellow-900 font-semibold !bg-yellow-50/50">{fmt(c.advance)}</TD>
                        <TD even={even} className="text-yellow-900 font-semibold !bg-yellow-50/50">{fmt(c.securityDep)}</TD>
                        <TD even={even} className="text-yellow-900 font-semibold !bg-yellow-50/50">{fmt(c.otherDed)}</TD>
                        <TD even={even} className="font-bold text-red-600 !bg-yellow-100/50">{fmt(c.totalDed)}</TD>

                        {/* NET */}
                        <TD even={even} className="text-blue-600">{fmt(c.reimbursement)}</TD>
                        <TD even={even} className="text-blue-600">{fmt(c.salaryArrears)}</TD>
                        <TD even={even} className="font-bold text-green-700">{fmt(c.netSalary)}</TD>
                        <TD even={even}>{fmt(c.taDA)}</TD>
                        <TD even={even} className="font-extrabold text-indigo-700">{fmt(c.totalPayable)}</TD>

                        {/* REMARK */}
                        <TD even={even}>
                          <span className="text-xs text-gray-500 max-w-[100px] inline-block truncate"
                            title={c.remark || ''}>
                            {c.remark || '—'}
                          </span>
                        </TD>

                        {/* EMPLOYER (Green Category) */}
                        <TD even={even} className="text-green-900 font-semibold !bg-green-50/50">{fmt(c.employerEPF)}</TD>
                        <TD even={even} className="text-green-900 font-semibold !bg-green-50/50">{fmt(c.employerESIC)}</TD>
                        <TD even={even} className="font-bold text-purple-700 !bg-green-100/50">{fmt(c.ctc)}</TD>

                        {/* ACTIONS */}
                        <TD even={even} sticky className="!bg-white group-hover:!bg-indigo-50/60">
                          <div className="flex items-center gap-0.5">
                            <ActionBtn icon={Eye} label="View Payroll" onClick={() => onView(record)} color="blue" />
                            {onEdit && <ActionBtn icon={Edit2} label="Edit Payroll" onClick={() => onEdit(record)} color="green" />}
                            {/* <ActionBtn icon={Download} label="Download Payslip" onClick={() => onDownloadPayslip(record)} color="purple" />
                            <ActionBtn icon={Printer} label="Print" onClick={() => onPrint(record)} color="orange" />
                            <ActionBtn icon={User} label="View Employee" onClick={() => onViewEmployee(record)} color="slate" /> */}
                          </div>
                        </TD>
                      </tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      ) : (
        /* Card View Container */
        <div className="p-4 bg-slate-50/40 min-h-[400px] max-h-[600px] overflow-y-auto transition-all duration-300" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <p className="font-semibold text-gray-500">No payroll records found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {records.map((record, idx) => (
                <PayrollCard
                  key={record.id || idx}
                  record={record}
                  idx={idx}
                  onView={onView}
                  onEdit={onEdit}
                  onDownloadPayslip={onDownloadPayslip}
                  onPrint={onPrint}
                  onViewEmployee={onViewEmployee}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

