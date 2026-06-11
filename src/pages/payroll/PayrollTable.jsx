import React from 'react';
import { Eye, Edit2, Download, Printer, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { fmt } from './payrollConstants';

const TH = ({ children, sticky, className = '' }) => (
  <th
    className={`px-3 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wide whitespace-nowrap
    ${sticky ? 'sticky right-0 bg-indigo-600 z-20 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.3)]' : ''}
    ${className}`}
  >
    {children}
  </th>
);

const TD = ({ children, className = '', sticky, even }) => (
  <td className={`px-3 py-2.5 whitespace-nowrap text-center text-sm
    ${sticky ? 'sticky right-0 z-10 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.06)]' : ''}
    ${even ? 'bg-slate-50/80' : 'bg-white'}
    ${sticky ? (even ? '!bg-slate-50/80' : '!bg-white') : ''}
    ${className}`}>
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

export default function PayrollTable({
  records, loading, currentPage, rowsPerPage, totalCount,
  onPageChange, onRowsChange, onView, onEdit, onDownloadPayslip, onPrint, onViewEmployee
}) {
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table scroll wrapper */}
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe #f1f5f9' }}>
        <table className="w-full text-sm border-collapse">
          {/* Gradient sticky header */}
          <thead>
            <tr className="bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 sticky top-0 z-10">
              <TH>#</TH>
              <TH>EMP CODE</TH>
              <TH>UAN</TH>
              <TH>ESIC</TH>
              <TH>NAME</TH>
              <TH>DESIGNATION</TH>
              <TH>IN HAND</TH>
              <TH>PRESENT</TH>
              <TH>WORKING DAY</TH>
              {/* Real salary columns */}
              <TH>BASIC+DA (Real)</TH>
              <TH>HRA (Real)</TH>
              <TH>CONV (Real)</TH>
              <TH>MEDICAL (Real)</TH>
              <TH>SPECIAL (Real)</TH>
              <TH>GROSS (Real)</TH>
              {/* Earned columns */}
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
              <TH>OT</TH>

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
              <TH>REIMBURSEMENT</TH>
              <TH>SALARY ARREARS</TH>
              <TH>NET SALARY</TH>
              <TH>TA DA</TH>
              <TH>TOTAL PAYABLE</TH>
              <TH>REMARK</TH>
              {/* Employer */}
              {/* EMPLOYER */}
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
                    <td colSpan={38} className="py-20 text-center">
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
                  const rowNum = startIdx + idx + 1;

                  return (
                    <tr
                      key={record.id}
                      className={`group transition-colors duration-150 hover:!bg-indigo-50/60 ${even ? 'bg-slate-50/80' : 'bg-white'}`}
                    >
                      {/* SL */}
                      <TD even={even}>
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold
                          inline-flex items-center justify-center">
                          {rowNum}
                        </span>
                      </TD>

                      {/* EMP CODE */}
                      <TD even={even}>
                        <span className="font-mono text-xs text-indigo-600 font-semibold">
                          {emp?.rbp_joining_id || '—'}
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

                      {/* NAME */}
                      <TD even={even} className="!text-left font-semibold text-gray-800 min-w-[150px]">
                        {emp?.employee_name || '—'}
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

                      {/* EARNED COLUMNS */}
                      <TD even={even}>{fmt(c.basicEarned)}</TD>
                      <TD even={even}>{fmt(c.hraEarned)}</TD>
                      <TD even={even}>{fmt(c.convEarned)}</TD>
                      <TD even={even}>{fmt(c.medEarned)}</TD>
                      <TD even={even}>{fmt(c.specialEarned)}</TD>
                      <TD even={even} className="font-semibold text-blue-700">{fmt(c.grossEarned)}</TD>

                      {/* OT */}
                      <TD even={even}>{fmt(c.otAmount)}</TD>

                      {/* DEDUCTIONS */}
                      <TD even={even} className="text-red-500">{fmt(c.epfDed)}</TD>
                      <TD even={even} className="text-red-500">{fmt(c.esicDed)}</TD>
                      <TD even={even} className="text-red-500">{fmt(c.advance)}</TD>
                      <TD even={even} className="text-red-500">{fmt(c.securityDep)}</TD>
                      <TD even={even} className="text-red-500">{fmt(c.otherDed)}</TD>
                      <TD even={even} className="font-bold text-red-600">{fmt(c.totalDed)}</TD>

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

                      {/* EMPLOYER */}
                      <TD even={even} className="text-purple-600">{fmt(c.employerEPF)}</TD>
                      <TD even={even} className="text-purple-600">{fmt(c.employerESIC)}</TD>
                      <TD even={even} className="font-bold text-purple-700">{fmt(c.ctc)}</TD>

                      {/* ACTIONS */}
                      <TD even={even} sticky className="!bg-white group-hover:!bg-indigo-50/60">
                        <div className="flex items-center gap-0.5">
                          <ActionBtn icon={Eye} label="View Payroll" onClick={() => onView(record)} color="blue" />
                          <ActionBtn icon={Edit2} label="Edit Payroll" onClick={() => onEdit(record)} color="green" />
                          <ActionBtn icon={Download} label="Download Payslip" onClick={() => onDownloadPayslip(record)} color="purple" />
                          <ActionBtn icon={Printer} label="Print" onClick={() => onPrint(record)} color="orange" />
                          <ActionBtn icon={User} label="View Employee" onClick={() => onViewEmployee(record)} color="slate" />
                        </div>
                      </TD>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          <div className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-700">{startIdx + 1}</span>
            {' '}–{' '}
            <span className="font-semibold text-gray-700">{Math.min(startIdx + rowsPerPage, totalCount)}</span>
            {' '}of{' '}
            <span className="font-semibold text-gray-700">{totalCount}</span> employees
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page;
              if (totalPages <= 7) page = i + 1;
              else if (currentPage <= 4) page = i + 1;
              else if (currentPage >= totalPages - 3) page = totalPages - 6 + i;
              else page = currentPage - 3 + i;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-xl text-sm font-semibold transition-all duration-200
                    ${currentPage === page
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-300/40'
                      : 'border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm'
                    }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 border border-gray-200 rounded-xl hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all duration-200"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>

            <select
              value={rowsPerPage}
              onChange={(e) => { onRowsChange(parseInt(e.target.value)); onPageChange(1); }}
              className="border border-gray-200 rounded-xl px-2 py-1.5 text-sm text-gray-600 bg-white hover:border-indigo-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[10, 20, 50, 100].map(r => <option key={r} value={r}>{r} / page</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
