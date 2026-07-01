import React from "react";

export default function LeaveLedgerDashboard({
  filtered,
  leaveBalances,
  leaveLedger,
  employees,
  setShowAdjustModal
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Leave Ledger Dashboard</h3>
          <p className="text-xs text-slate-400">Total Credits, Used leaves, LWP counts and Balances dynamically calculated from transactions ledger.</p>
        </div>
        <button
          onClick={() => setShowAdjustModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all"
        >
          ➕ Manual HR Adjustment
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-4">Employee Code</th>
              <th className="p-4">Employee Name</th>
              <th className="p-4">CL Credits</th>
              <th className="p-4">CL Used</th>
              <th className="p-4">CL Balance</th>
              <th className="p-4">EL Credits</th>
              <th className="p-4">EL Used</th>
              <th className="p-4">EL Balance</th>
              <th className="p-4">LWP (Current Month)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filtered.map(emp => {
              const bal = leaveBalances[emp.id] || { earnedCL: 0, usedCL: 0, remainingCL: 0, earnedEL: 0, usedEL: 0, remainingEL: 0, lwpCount: 0 };
              return (
                <tr key={emp.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-mono font-bold text-slate-500">{emp.code}</td>
                  <td className="p-4 font-bold text-slate-800">{emp.name}</td>
                  <td className="p-4 text-violet-600 font-semibold">{bal.earnedCL}</td>
                  <td className="p-4 text-slate-500">{bal.usedCL}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${bal.remainingCL > 0 ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-500"}`}>
                      {bal.remainingCL}
                    </span>
                  </td>
                  <td className="p-4 text-emerald-600 font-semibold">{bal.earnedEL}</td>
                  <td className="p-4 text-slate-500">{bal.usedEL}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded font-bold ${bal.remainingEL > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {bal.remainingEL}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-red-600">{bal.lwpCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Transactions History */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-3">
        <h4 className="font-bold text-slate-800 text-sm">Recent Ledger Transactions</h4>
        <div className="overflow-y-auto max-h-[300px] border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Transaction</th>
                <th className="p-3">Earned (Credits)</th>
                <th className="p-3">Used (Debits)</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {leaveLedger.slice(0, 100).map(row => {
                const emp = employees.find(e => e.id === row.employee_id);
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{emp ? emp.name : `ID: ${row.employee_id}`}</td>
                    <td className="p-3 font-mono">{row.ledger_date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.leave_type === "CL" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                        {row.leave_type}
                      </span>
                    </td>
                    <td className="p-3 font-bold">
                      <span className={`text-[10px] uppercase font-black ${row.transaction_type === "CREDIT" ? "text-emerald-600" : "text-red-500"
                        }`}>
                        {row.transaction_type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-600">{row.earned || 0}</td>
                    <td className="p-3 font-bold text-red-500">{row.used || 0}</td>
                    <td className="p-3 text-slate-500 italic">{row.remarks}</td>
                  </tr>
                );
              })}
              {leaveLedger.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 italic">No ledger transaction logs found. Please run DDL.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
