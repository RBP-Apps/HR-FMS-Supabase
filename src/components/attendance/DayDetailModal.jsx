import React from "react";

const STATUS_STYLE = {
  P: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "✅ Present" },
  A: { bg: "bg-red-100 text-red-600 border-red-200", label: "❌ Absent" },
  CL: { bg: "bg-violet-100 text-violet-700 border-violet-200", label: "🌴 Casual Leave" },
  HD: { bg: "bg-orange-100 text-orange-700 border-orange-200", label: "⏰ Half Day" },
  WO: { bg: "bg-slate-100 text-slate-500 border-slate-200", label: "📅 Week Off" },
  EL: { bg: "bg-teal-100 text-teal-700 border-teal-200", label: "🌴 Earned Leave" },
  LWP: { bg: "bg-rose-100 text-rose-700 border-rose-200", label: "💸 Leave Without Pay" },
  H: { bg: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "🎉 Holiday" },
  PM: { bg: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "⚠️ Punch Missing (PM)" },
};

export default function DayDetailModal({
  show,
  onClose,
  employee,
  date,
  status,
  biometricAttendance,
  fieldAttendance,
  onEdit
}) {
  if (!show || !employee) return null;

  // Format date to readable format: e.g., "Saturday, 09 May 2026"
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // Find biometric records for the specific date
  const bioRecord = biometricAttendance.find(b =>
    (b.employeeCode?.trim().toLowerCase() === employee.code?.trim().toLowerCase() ||
     b.employeeName?.trim().toLowerCase() === employee.name?.trim().toLowerCase()) &&
    b.date === date
  );

  // Find field records for the specific date
  const fieldRecord = fieldAttendance.find(f =>
    (f.employeeCode?.trim().toLowerCase() === employee.code?.trim().toLowerCase() ||
     f.employeeName?.trim().toLowerCase() === employee.name?.trim().toLowerCase()) &&
    f.date === date
  );

  // Helper variables for biometric logs
  const hasBioIn = bioRecord && bioRecord.inTime;
  const hasBioOut = bioRecord && bioRecord.outTime;
  
  // Calculate expected status based on Biometric Logic
  let bioExpectedStatus = "Absent";
  if (hasBioIn && hasBioOut) bioExpectedStatus = "Present";
  else if (hasBioIn || hasBioOut) bioExpectedStatus = "Half Day / Punch Missing";

  // Helper variables for field logs
  const hasFieldIn = fieldRecord && fieldRecord.inTime;
  const hasFieldOut = fieldRecord && fieldRecord.outTime;
  const fieldMids = fieldRecord?.midEntries || [];
  const hasFieldMid = fieldMids.length > 0;

  // Calculate expected status based on Field Logic
  let fieldExpectedStatus = "Absent";
  if (hasFieldIn && hasFieldMid && hasFieldOut) {
    fieldExpectedStatus = "Present";
  } else if ((hasFieldIn && hasFieldMid && !hasFieldOut) || 
             (hasFieldIn && !hasFieldMid && hasFieldOut) || 
             (!hasFieldIn && hasFieldMid && hasFieldOut)) {
    fieldExpectedStatus = "Half Day";
  } else if ((hasFieldIn && !hasFieldMid && !hasFieldOut) ||
             (!hasFieldIn && hasFieldMid && !hasFieldOut) ||
             (!hasFieldIn && !hasFieldMid && hasFieldOut)) {
    fieldExpectedStatus = "Partial / Punch Missing";
  }

  const sStyle = STATUS_STYLE[status] || { bg: "bg-slate-50 text-slate-400 border-slate-100", label: status || "Unknown" };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] transition-opacity">
      <div className="bg-white border border-slate-100 rounded-3xl p-6 w-[550px] shadow-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-5">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block mb-1">Attendance Details</span>
          <h3 className="text-xl font-extrabold text-slate-800 leading-tight">
            {employee.name}
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Code: {employee.code} · Dept: {employee.dept} · Category: {employee.employeeCategory || "N/A"}
          </p>
        </div>

        {/* Date and Current Status */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Selected Date</span>
            <span className="text-xs font-bold text-slate-700">{formattedDate}</span>
          </div>
          <div className={`${sStyle.bg.replace("bg-", "bg-Opacity-5 bg-")} rounded-2xl p-4 border border-current/10 flex flex-col justify-center`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Grid Status</span>
            <span className={`text-sm font-black ${sStyle.bg.includes("text-") ? sStyle.bg.split(" ").find(x => x.startsWith("text-")) : "text-slate-800"}`}>
              {sStyle.label}
            </span>
          </div>
        </div>

        {/* Punch Details Section */}
        <div className="space-y-4 mb-6">
          {/* Biometric Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">👆</span>
              <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Biometric Machine Logs</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Check-In</span>
                <span className={`text-xs font-bold ${hasBioIn ? "text-slate-800" : "text-red-500 font-semibold"}`}>
                  {hasBioIn ? bioRecord.inTime : "❌ Missing Punch"}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Check-Out</span>
                <span className={`text-xs font-bold ${hasBioOut ? "text-slate-800" : "text-red-500 font-semibold"}`}>
                  {hasBioOut ? bioRecord.outTime : "❌ Missing Punch"}
                </span>
              </div>
            </div>

            {bioRecord ? (
              <div className="text-[10px] text-slate-500 bg-indigo-50/50 border border-indigo-100/30 rounded-xl px-3 py-2 flex items-center justify-between">
                <span>Expected Biometric Status:</span>
                <span className="font-bold text-indigo-600">{bioExpectedStatus}</span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 text-center py-1">No biometric record uploaded for this date</div>
            )}
          </div>

          {/* Field Visit Section */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📍</span>
              <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">Field Visit App Logs</h4>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Check-In</span>
                <span className={`text-[11px] font-bold ${hasFieldIn ? "text-slate-800" : "text-slate-400 font-medium"}`}>
                  {hasFieldIn ? fieldRecord.inTime : "—"}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Mid-Visits</span>
                <span className={`text-[11px] font-bold ${hasFieldMid ? "text-slate-800" : "text-slate-400 font-medium"}`}>
                  {hasFieldMid ? `${fieldMids.length} points` : "—"}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100/50">
                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Check-Out</span>
                <span className={`text-[11px] font-bold ${hasFieldOut ? "text-slate-800" : "text-slate-400 font-medium"}`}>
                  {hasFieldOut ? fieldRecord.outTime : "—"}
                </span>
              </div>
            </div>

            {hasFieldMid && (
              <div className="text-[9px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-2 mb-3 max-h-16 overflow-y-auto">
                <span className="font-semibold block mb-0.5">Mid Punch Times:</span>
                {fieldMids.join(" , ")}
              </div>
            )}

            {fieldRecord ? (
              <div className="text-[10px] text-slate-500 bg-blue-50/50 border border-blue-100/30 rounded-xl px-3 py-2 flex items-center justify-between">
                <span>Expected Field Status:</span>
                <span className="font-bold text-blue-600">{fieldExpectedStatus}</span>
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 text-center py-1">No field GPS check-in data found for this date</div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              onEdit(employee, date, status);
              onClose();
            }}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-violet-100"
          >
            ✏️ Correct / Update Attendance
          </button>
          <button
            onClick={onClose}
            className="px-6 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
