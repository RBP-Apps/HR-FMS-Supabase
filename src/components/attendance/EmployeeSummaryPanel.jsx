import React from "react";

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

export default function EmployeeSummaryPanel({
  selEmp,
  selectedEmp,
  selectedYear,
  selectedMonth,
  generateMonthlyAttendance,
  calcSummary,
  paidDays,
  leaveBalances,
  MAX_CL_DAYS,
  setSelectedLeaveEmp,
  setShowLeaveModal,
  biometricAttendance,
  fieldAttendance,
  setEditModalData,
  setShowEditModal
}) {
  if (!selEmp) return null;

  const attendance = generateMonthlyAttendance(selEmp, selectedYear, selectedMonth);
  const summary = calcSummary(attendance);

  return (
    <div className="w-52 shrink-0 flex flex-col gap-3">
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Employee Summary</p>
        <div className="flex items-center gap-2 mb-3">
          <Avatar initials={selEmp.avatar} idx={selectedEmp} size="w-10 h-10" />
          <div>
            <p className="font-bold text-sm text-slate-800 leading-tight">{selEmp.name}</p>
            <p className="text-[10px] text-slate-400">{selEmp.code} · {selEmp.role}</p>
            <span className="inline-flex items-center gap-1 mt-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full px-2 py-0.5 text-[9px] font-bold">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Active
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between py-1">
            <span className="text-[11px] text-slate-500">Present Days</span>
            <span className="text-[11px] font-bold text-emerald-600">{summary.P}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[11px] text-slate-500">Absent Days</span>
            <span className="text-[11px] font-bold text-red-500">{summary.A}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[11px] text-slate-500">Casual Leave</span>
            <span className="text-[11px] font-bold text-violet-600">{summary.CL}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[11px] text-slate-500">Week Off</span>
            <span className="text-[11px] font-bold text-slate-400">{summary.WO}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 mt-1 pt-2">
            <span className="text-[11px] font-bold text-slate-600">Total Paid Days</span>
            <span className="text-[11px] font-bold text-indigo-700">{paidDays(summary)}</span>
          </div>
        </div>

        {(selEmp.attendanceType === "Office" || selEmp.dept === "Office") && (
          <div className="mt-3 p-2 bg-violet-50 rounded-lg">
            <p className="text-[9px] font-semibold text-violet-600">CL Balance (12 days/year)</p>
            <p className="text-sm font-black text-violet-700">
              {leaveBalances[selEmp.id]?.remainingCL ?? MAX_CL_DAYS} / {MAX_CL_DAYS} days left
            </p>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditModalData({
              employee: selEmp,
              date: null,
              currentStatus: null,
              dayIndex: null
            });
            setShowEditModal(true);
          }}
          className="mt-3 w-full text-[10px] bg-emerald-600 text-white rounded-lg py-1.5 hover:bg-emerald-700"
        >
          ✅ Edit Attendance
        </button>
      </div>

      {/* Biometric vs Field Stats */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Attendance Source</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500">👆 Biometric</span>
            <span className="text-[10px] font-bold text-violet-600">
              {biometricAttendance.filter(b => 
                b.employeeCode?.trim().toLowerCase() === selEmp.code?.trim().toLowerCase() ||
                b.employeeName?.trim().toLowerCase() === selEmp.name?.trim().toLowerCase()
              ).length} records
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500">📍 Field</span>
            <span className="text-[10px] font-bold text-blue-600">
              {fieldAttendance.filter(f => f.employeeName === selEmp.name).length} visits
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
