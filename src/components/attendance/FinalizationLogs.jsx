import React from "react";

export default function FinalizationLogs({ finalizationLogs }) {
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-slate-800 text-base">Finalization Audit Logs</h3>
        <p className="text-xs text-slate-400">Lock history showing which company's attendance was finalized and by whom.</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-4">Company Name</th>
              <th className="p-4">Year</th>
              <th className="p-4">Month</th>
              <th className="p-4">Finalized By</th>
              <th className="p-4">Finalized On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {finalizationLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-800">{log.company}</td>
                <td className="p-4 font-mono">{log.year}</td>
                <td className="p-4">{months[log.month - 1]}</td>
                <td className="p-4 text-indigo-600">{log.finalized_by}</td>
                <td className="p-4 font-mono text-slate-500">{new Date(log.submitted_at).toLocaleString()}</td>
              </tr>
            ))}
            {finalizationLogs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400 italic">No finalization audit logs found. Please run DDL.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
