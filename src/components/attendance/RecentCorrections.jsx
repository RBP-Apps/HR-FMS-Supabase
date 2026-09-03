import React, { useState } from "react";

const formatDateTime = (dateStr) => {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = hours.toString().padStart(2, "0");

  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
};

export default function RecentCorrections({
  manualCorrections = [],
  biometricAttendance = [],
  fieldAttendance = [],
  employees = []
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCorrections = (manualCorrections || []).filter(row => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const formattedOn = formatDateTime(row.on).toLowerCase();
    return (
      (row.emp && row.emp.toLowerCase().includes(q)) ||
      (row.code && row.code.toLowerCase().includes(q)) ||
      (row.date && row.date.toLowerCase().includes(q)) ||
      (row.prev && row.prev.toLowerCase().includes(q)) ||
      (row.next && row.next.toLowerCase().includes(q)) ||
      (row.reason && row.reason.toLowerCase().includes(q)) ||
      (row.by && row.by.toLowerCase().includes(q)) ||
      (row.on && row.on.toLowerCase().includes(q)) ||
      formattedOn.includes(q)
    );
  });

  return (
    <div className="flex gap-4">
      {/* Manual Corrections table with Remark and Attachment columns */}
      <div className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-violet-600 text-sm">✏️</span>
            <span className="font-bold text-slate-800 text-sm">Recent Manual Corrections</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredCorrections.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search corrections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-6 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 w-52 bg-slate-50/50 focus:bg-white transition-all"
              />
              <span className="absolute left-0.5 top-2 text-slate-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
           
          </div>
        </div>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto relative">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Employee", "Date", "Previous Status", "New Status", "Remark", "Updated By", "Updated On", "Attachment"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-slate-400 font-semibold whitespace-nowrap bg-slate-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCorrections.map((row, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-violet-50/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-700">{row.emp}</div>
                    <div className="text-slate-400 text-[9px]">{row.code}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{row.date}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-100 text-red-600 border-red-200">{row.prev}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-100 text-emerald-700 border-emerald-200">{row.next}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate" title={row.reason}>{row.reason}</td>
                  <td className="px-4 py-2.5 text-slate-500">{row.by}</td>
                  <td className="px-4 py-2.5 text-slate-500 font-medium whitespace-nowrap">{formatDateTime(row.on)}</td>
                  <td className="px-4 py-2.5">
                    {row.attachment && (
                      <a href={row.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">📎 View</a>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCorrections.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    {searchQuery ? `No manual corrections matching "${searchQuery}"` : "No manual corrections yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Source Summary */}
      <div className="w-52 shrink-0 bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Data Source Summary</p>
        <div className="flex flex-col gap-2.5">
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl">👆</span>
            <div>
              <div className="text-lg font-black text-violet-700">{biometricAttendance.length}</div>
              <div className="text-[10px] text-slate-500 leading-tight">Biometric Records</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl">📍</span>
            <div>
              <div className="text-lg font-black text-blue-700">{fieldAttendance.length}</div>
              <div className="text-[10px] text-slate-500 leading-tight">Field Records</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl">👥</span>
            <div>
              <div className="text-lg font-black text-amber-700">{employees.length}</div>
              <div className="text-[10px] text-slate-500 leading-tight">Total Employees</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
