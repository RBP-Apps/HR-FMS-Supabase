import React from "react";

const STATUS_STYLE = {
  P: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "P" },
  A: { bg: "bg-red-100 text-red-600 border-red-200", label: "A" },
  CL: { bg: "bg-violet-100 text-violet-700 border-violet-200", label: "CL" },
  HD: { bg: "bg-orange-100 text-orange-700 border-orange-200", label: "HD" },
  WO: { bg: "bg-slate-100 text-slate-500 border-slate-200", label: "WO" },
  LWP: { bg: "bg-rose-100 text-rose-700 border-rose-200", label: "LWP" },
  H: { bg: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "H" },
  PM: { bg: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "PM" },
};

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-cyan-500 to-sky-600",
  "from-fuchsia-500 to-pink-600",
  "from-lime-500 to-green-600",
];

function Avatar({ initials, idx, size = "w-8 h-8" }) {
  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
      {initials}
    </div>
  );
}

function StatBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: "bg-slate-50 text-slate-400 border-slate-100", label: status || "-" };
  return (
    <span className={`inline-flex items-center justify-center w-7 h-6 rounded text-[10px] font-bold border ${s.bg} leading-none`}>
      {s.label}
    </span>
  );
}

export default function AttendanceTable({
  selectedMonth,
  selectedYear,
  activeTab,
  setActiveTab,
  daysOfWeek,
  weekendCols,
  pageRows,
  generateMonthlyAttendance,
  calcSummary,
  expandedRow,
  setExpandedRow,
  setSelectedEmp,
  employees,
  leaveBalances,
  MAX_CL_DAYS,
  editingCell,
  setEditingCell,
  editRemark,
  setEditRemark,
  editFilePreview,
  setEditFilePreview,
  setEditFile,
  isFutureDate,
  updateAttendanceStatus,
  handleFileUpload,
  biometricAttendance,
  fieldAttendance,
  setSelectedLeaveEmp,
  setShowLeaveModal,
  setEditModalData,
  setShowEditModal,
  currentPage,
  setCurrentPage,
  totalPages,
  filtered,
  ROWS_PER_PAGE,
  paidDays,
  getMonthNumber,
  setShowDayDetailModal,
  setDayDetailData
}) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-violet-600">📅</span>
          <span className="font-bold text-slate-800 text-sm">{selectedMonth} {selectedYear} - Monthly Attendance View</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { key: "P", label: "Present", cls: "bg-emerald-100 text-emerald-700" },
            { key: "A", label: "Absent", cls: "bg-red-100 text-red-600" },
            { key: "CL", label: "Casual Leave", cls: "bg-violet-100 text-violet-700" },
            { key: "HD", label: "Half Day", cls: "bg-orange-100 text-orange-700" },
            { key: "WO", label: "Week Off", cls: "bg-slate-100 text-slate-500" },
            { key: "LWP", label: "LWP", cls: "bg-rose-100 text-rose-700" },
            { key: "H", label: "Holiday", cls: "bg-indigo-100 text-indigo-700" },
            { key: "PM", label: "Punch Missing", cls: "bg-yellow-100 text-yellow-700" },
          ].map(({ key, label, cls }) => (
            <span key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${cls}`}>
              <span className="font-black">{key}</span> {label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-100">
        {["biometric", "field"].map(t => (
          <button key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${activeTab === t ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
          >
            {t === "monthly" ? "📅 Monthly" : t === "biometric" ? "👆 Biometric" : t === "field" ? "📍 Field" : "✏️ Manual"}
          </button>
        ))}
      </div>

      {/* Scrollable grid */}
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] relative">
        <table className="w-full border-collapse text-[11px]" style={{ minWidth: 1200 }}>
          <thead>
            <tr className="text-white">
              <th className="sticky left-0 top-0 z-30 bg-indigo-600 text-center px-2 py-2 font-semibold whitespace-nowrap w-10 min-w-[40px] max-w-[40px] border-b border-indigo-700">
                S.No.
              </th>
              <th className="sticky left-10 top-0 z-30 bg-indigo-600 text-left px-3 py-2 font-semibold whitespace-nowrap w-40 min-w-[160px] max-w-[160px] border-b border-indigo-700">
                Employee
              </th>
              {daysOfWeek.map((day, i) => (
                <th key={i} className={`sticky top-0 z-20 bg-indigo-600 px-1 py-1.5 text-center w-8 font-bold border-b border-indigo-700 ${weekendCols.has(i) ? "bg-indigo-700/50" : ""}`}>
                  <div className="text-white">{i + 1}</div>
                  <div className="text-indigo-200 text-[9px] font-normal">{day}</div>
                </th>
              ))}
              {["P", "A", "CL", "WO", "Paid Days", "Actions"].map(h => (
                <th key={h} className="sticky top-0 z-20 bg-indigo-600 px-2 py-2 whitespace-nowrap font-semibold border-b border-indigo-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((emp, ri) => {
              const attendanceArray = generateMonthlyAttendance(emp, selectedYear, selectedMonth);
              const summary = calcSummary(attendanceArray);
              const isExpanded = expandedRow === emp.id;
              const remainingCL = leaveBalances[emp.id]?.remainingCL ?? MAX_CL_DAYS;

              return (
                <React.Fragment key={emp.id}>
                  <tr
                    className={`group border-b border-slate-100 hover:bg-violet-50/30 transition-colors cursor-pointer ${isExpanded ? "bg-violet-50/40" : ri % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                    onClick={() => { setExpandedRow(isExpanded ? null : emp.id); setSelectedEmp(employees.findIndex(e => e.id === emp.id)); }}
                  >
                    <td className={`sticky left-0 z-10 px-2 py-2 text-center text-slate-500 font-medium w-10 min-w-[40px] max-w-[40px] transition-colors ${isExpanded ? "bg-[#f0edff]" : ri % 2 === 0 ? "bg-white group-hover:bg-[#f5f3ff]" : "bg-slate-50 group-hover:bg-[#f5f3ff]"}`}>
                      {(currentPage - 1) * ROWS_PER_PAGE + ri + 1}
                    </td>
                    <td className={`sticky left-10 z-10 px-3 py-2 w-40 min-w-[160px] max-w-[160px] transition-colors ${isExpanded ? "bg-[#f0edff]" : ri % 2 === 0 ? "bg-white group-hover:bg-[#f5f3ff]" : "bg-slate-50 group-hover:bg-[#f5f3ff]"}`}>
                      <div className="flex items-center gap-2">
                        <Avatar initials={emp.avatar} idx={ri} size="w-7 h-7" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-700 leading-tight truncate" title={emp.name}>{emp.name}</div>
                          <div className="text-slate-400 text-[9px] truncate">{emp.code} · {emp.dept}</div>
                          {emp.company !== "N/A" && (
                            <div className="text-[8px] text-indigo-500 truncate">{emp.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {attendanceArray.map((status, di) => {
                      const dateStr = `${selectedYear}-${String(getMonthNumber(selectedMonth) + 1).padStart(2, "0")}-${String(di + 1).padStart(2, "0")}`;
                      const isEditing = editingCell && editingCell.emp?.id === emp.id && editingCell.dayIndex === di;
                      const futureDate = isFutureDate(selectedYear, selectedMonth, di + 1);

                      return (
                        <td
                          key={di}
                          className={`px-0.5 py-2 text-center transition-all duration-150 ${weekendCols.has(di) ? "bg-slate-50/60 group-hover:bg-violet-100/50" : "group-hover:bg-violet-50/30"
                            } ${futureDate ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-indigo-50 hover:scale-110 active:scale-95"}`}
                          onClick={(e) => {
                            if (futureDate) return;
                            e.stopPropagation();
                            setDayDetailData({
                              employee: emp,
                              date: dateStr,
                              status: status
                            });
                            setShowDayDetailModal(true);
                          }}
                        >
                          <StatBadge status={status} />
                        </td>
                      );
                    })}
                    <td className="px-2 py-2 text-center font-bold text-emerald-600">{summary.P}</td>
                    <td className="px-2 py-2 text-center font-bold text-red-500">{summary.A}</td>
                    <td className="px-2 py-2 text-center font-bold text-violet-600">{summary.CL}</td>

                    <td className="px-2 py-2 text-center font-bold text-slate-400">{summary.WO}</td>
                    <td className="px-2 py-2 text-center font-bold text-indigo-700">{paidDays(summary)}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeaveEmp(emp);
                            setShowLeaveModal(true);
                          }}
                          className="w-6 h-6 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 text-xs"
                          title="Apply Leave"
                        >
                          🌴
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditModalData({
                              employee: emp,
                              date: null,
                              currentStatus: null,
                              dayIndex: null
                            });
                            setShowEditModal(true);
                          }}
                          className="w-6 h-6 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 text-xs"
                          title="Edit Attendance"
                        >
                          ✏️
                        </button>
                        <button onClick={e => e.stopPropagation()} className="w-6 h-6 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 text-xs">
                          {isExpanded ? "▲" : "▼"}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED DETAIL ROW */}
                  {isExpanded && (
                    <tr className="bg-gradient-to-r from-violet-50 to-indigo-50">
                      <td colSpan={40} className="px-4 py-3">
                        <div className="grid grid-cols-4 gap-3">
                          <div className="bg-white rounded-xl border border-emerald-100 p-3 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">IN</div>
                              <span className="font-bold text-xs text-slate-700">Biometric Check-In</span>
                            </div>
                            <div className="text-lg font-black text-emerald-600">
                              {biometricAttendance.find(b =>
                                b.employeeCode?.trim().toLowerCase() === emp.code?.trim().toLowerCase() ||
                                b.employeeName?.trim().toLowerCase() === emp.name?.trim().toLowerCase()
                              )?.inTime || "Not Available"}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">📍 Head Office</div>
                          </div>

                          <div className="bg-white rounded-xl border border-blue-100 p-3 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px]">📍</div>
                              <span className="font-bold text-xs text-slate-700">Field Visits</span>
                            </div>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {fieldAttendance.filter(f => f.employeeName === emp.name).slice(0, 3).map((visit, vi) => (
                                <div key={vi} className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                  {visit.date} - {visit.inTime || "No check-in"}
                                </div>
                              ))}
                              {fieldAttendance.filter(f => f.employeeName === emp.name).length === 0 && (
                                <div className="text-[10px] text-slate-400">No field visits</div>
                              )}
                            </div>
                          </div>

                          <div className="bg-white rounded-xl border border-orange-100 p-3 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px]">OUT</div>
                              <span className="font-bold text-xs text-slate-700">Check-Out</span>
                            </div>
                            <div className="text-lg font-black text-orange-600">
                              {biometricAttendance.find(b =>
                                b.employeeCode?.trim().toLowerCase() === emp.code?.trim().toLowerCase() ||
                                b.employeeName?.trim().toLowerCase() === emp.name?.trim().toLowerCase()
                              )?.outTime || "Not Available"}
                            </div>
                          </div>

                          <div className="bg-white rounded-xl border border-violet-100 p-3 shadow-sm">
                            <div className="flex items-center gap-1.5 mb-2">
                              <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-white text-[9px]">📊</div>
                              <span className="font-bold text-xs text-slate-700">Monthly Summary</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px]">
                                <span>Present:</span>
                                <span className="font-bold text-emerald-600">{summary.P} days</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span>Absent:</span>
                                <span className="font-bold text-red-500">{summary.A} days</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span>Leave:</span>
                                <span className="font-bold text-violet-600">{summary.CL} days</span>
                              </div>
                            </div>
                            {(emp.attendanceType === "Office" || emp.dept === "Office") && (
                              <div className="mt-2 text-[9px] text-slate-500 border-t pt-1">
                                CL Remaining: {remainingCL} / {MAX_CL_DAYS} days
                              </div>
                            )}
                            <button
                              onClick={() => { setSelectedLeaveEmp(emp); setShowLeaveModal(true); }}
                              className="mt-2 w-full text-[9px] bg-violet-600 text-white rounded-lg py-1 hover:bg-violet-700"
                            >
                              Apply Leave
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
        <span className="text-xs text-slate-400">
          {totalPages <= 1
            ? `Showing all ${filtered.length} employees`
            : `Showing ${(currentPage - 1) * ROWS_PER_PAGE + 1}–${Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of ${filtered.length} employees`
          }
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-500 disabled:opacity-40 hover:bg-slate-50">
              ← Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)}
                className={`w-7 h-7 text-xs rounded-lg font-semibold transition-colors ${currentPage === i + 1 ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow" : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-500 disabled:opacity-40 hover:bg-slate-50">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
