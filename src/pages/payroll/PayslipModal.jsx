import React from 'react';
import { X, Printer, Building2 } from 'lucide-react';
import { MONTHS, fmt } from './payrollConstants';

export default function PayslipModal({ record, selectedMonth, selectedYear, onClose }) {
  if (!record) return null;
  const emp = record.employee;
  const att = record.attendance;
  const c = record.calc || {};

  const handlePrint = () => window.print();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-indigo-700 to-blue-700 px-6 py-4 flex items-center justify-between print:hidden">
          <h2 className="text-white font-bold text-lg">Salary Payslip</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition-all duration-200"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Company + Employee Header */}
          <div className="text-center border-b pb-4">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <h3 className="font-extrabold text-lg text-gray-800">{emp?.employee_name}</h3>
            <p className="text-gray-500 text-sm">{emp?.designation} · {emp?.department}</p>
            <p className="text-gray-400 text-xs mt-0.5">EMP Code: {emp?.rbp_joining_id || '—'} &nbsp;|&nbsp; UAN: {emp?.uan_number || '—'}</p>
          </div>

          {/* Pay Period & Attendance */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pay Period', value: `${MONTHS[selectedMonth]} ${selectedYear}` },
              { label: 'Present Days', value: att?.present_days ?? 0 },
              { label: 'Working Days', value: att?.working_days ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-xs text-gray-400 font-semibold uppercase">{label}</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Earnings + Deductions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Earnings */}
            <div className="rounded-2xl border border-green-100 overflow-hidden">
              <div className="bg-green-50 px-4 py-2 font-bold text-green-700 text-xs uppercase tracking-wide">Earnings</div>
              <div className="p-3 space-y-1.5 text-sm">
                {[
                  ['BASIC+DA (Real)', c.basicReal],
                  ['BASIC+DA (Earned)', c.basicEarned],
                  ['HRA (Earned)', c.hraEarned],
                  ['Conveyance', c.convEarned],
                  ['Medical Allowance', c.medEarned],
                  ['Special Allowance', c.specialEarned],
                  ['OT Amount', c.otAmount],
                  ['Reimbursement', c.reimbursement],
                  ['Salary Arrears', c.salaryArrears],
                  ['TA / DA', c.taDA],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-gray-800">{fmt(val)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t pt-1.5 text-green-700">
                  <span>Gross Salary</span>
                  <span>{fmt(c.grossEarned)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="rounded-2xl border border-red-100 overflow-hidden">
              <div className="bg-red-50 px-4 py-2 font-bold text-red-700 text-xs uppercase tracking-wide">Deductions</div>
              <div className="p-3 space-y-1.5 text-sm">
                {[
                  ['EPF (12%)', c.epfDed],
                  ['ESIC (0.75%)', c.esicDed],
                  ['Advance', c.advance],
                  ['Security Deposit', c.securityDep],
                  ['Late Deduction', c.lateDeduction],
                  ['Other Deduction', c.otherDed],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-semibold text-red-500">{fmt(val)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold border-t pt-1.5 text-red-600">
                  <span>Total Deductions</span>
                  <span>{fmt(c.totalDed)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-4 flex items-center justify-between text-white">
            <div>
              <p className="text-indigo-200 text-xs font-semibold uppercase">Net Salary Payable</p>
              <p className="text-2xl font-extrabold">{fmt(c.netSalary)}</p>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs font-semibold uppercase">Total Salary Payable</p>
              <p className="text-2xl font-extrabold">{fmt(c.totalPayable)}</p>
            </div>
          </div>

          {/* Employer contribution */}
          <div className="bg-purple-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Employer Contribution</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Employer EPF (13%)</p>
                <p className="font-bold text-purple-700">{fmt(c.employerEPF)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Employer ESIC (3.25%)</p>
                <p className="font-bold text-purple-700">{fmt(c.employerESIC)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">CTC</p>
                <p className="font-bold text-purple-900">{fmt(c.ctc)}</p>
              </div>
            </div>
          </div>

          {c.remark && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
              <span className="font-semibold">Remark:</span> {c.remark}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 border-t pt-3">
            This is a computer generated payslip. No signature is required.
          </p>
        </div>
      </div>
    </div>
  );
}
