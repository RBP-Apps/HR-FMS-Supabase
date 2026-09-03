import React, { useState, useEffect } from "react";
import supabase from "../../utils/supabase";
import { parseTimeToMinutes } from "../../utils/attendanceHelpers";

const STATUS_STYLE = {
  P: { bg: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "✅ Present" },
  A: { bg: "bg-red-100 text-red-600 border-red-200", label: "❌ Absent" },
  CL: { bg: "bg-violet-100 text-violet-700 border-violet-200", label: "🌴 Casual Leave" },
  HD: { bg: "bg-orange-100 text-orange-700 border-orange-200", label: "⏰ Half Day" },
  WO: { bg: "bg-slate-100 text-slate-500 border-slate-200", label: "📅 Week Off" },
  LWP: { bg: "bg-rose-100 text-rose-700 border-rose-200", label: "💸 Leave Without Pay" },
  H: { bg: "bg-indigo-100 text-indigo-700 border-indigo-200", label: "🎉 Holiday" },
  PM: { bg: "bg-yellow-100 text-yellow-700 border-yellow-200", label: "⚠️ Punch Missing (PM)" },
};

const formatTimeToHHMM = (timeStr) => {
  if (!timeStr) return "";
  const str = timeStr.toString().trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(":");
    return `${parts[0].padStart(2, "0")}:${parts[1]}`;
  }
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const modifier = match12[3] ? match12[3].toUpperCase() : null;
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }
  return str;
};

export default function DayDetailModal({
  show,
  onClose,
  employee,
  date,
  status,
  biometricAttendance = [],
  fieldAttendance = [],
  onEdit
}) {
  const [showLateForm, setShowLateForm] = useState(false);
  const [isSavingLate, setIsSavingLate] = useState(false);
  const [lateForm, setLateForm] = useState({
    actual_in_time: "09:30",
    changed_in_time: "",
    actual_out_time: "18:30",
    changed_out_time: "",
    duration: "8 Hours",
    start_date: "",
    end_date: "",
    remark: "",
    file: null,
    file_preview: null,
    approved: true
  });

  // Find biometric records for the specific date
  const bioRecord = (biometricAttendance || []).find(b =>
    (b.employeeCode?.trim().toLowerCase() === employee?.code?.trim().toLowerCase() ||
     b.employeeName?.trim().toLowerCase() === employee?.name?.trim().toLowerCase()) &&
    b.date === date
  );

  // Find field records for the specific date
  const fieldRecord = (fieldAttendance || []).find(f =>
    (f.employeeCode?.trim().toLowerCase() === employee?.code?.trim().toLowerCase() ||
     f.employeeName?.trim().toLowerCase() === employee?.name?.trim().toLowerCase()) &&
    f.date === date
  );

  useEffect(() => {
    if (date && employee) {
      const genderVal = (employee?.gender || "").toString().trim().toLowerCase();
      const isFemale = genderVal === "female" || genderVal === "f";
      const defaultActualOut = isFemale ? "18:00" : "18:30";

      // Changed In/Out comes from Biometric Machine Logs (or Field Logs)
      const rawIn = bioRecord?.inTime || fieldRecord?.inTime || "";
      const rawOut = bioRecord?.outTime || fieldRecord?.outTime || "";

      setLateForm({
        actual_in_time: "09:30",
        actual_out_time: defaultActualOut,
        changed_in_time: formatTimeToHHMM(rawIn),
        changed_out_time: formatTimeToHHMM(rawOut),
        duration: "8 Hours",
        start_date: date,
        end_date: date,
        remark: "",
        file: null,
        file_preview: null,
        approved: true
      });
      setShowLateForm(false);
    }
  }, [date, employee, bioRecord, fieldRecord]);


  if (!show || !employee) return null;

  // Format date to readable format: e.g., "Saturday, 09 May 2026"
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // Helper variables for biometric logs
  const hasBioIn = bioRecord && bioRecord.inTime;
  const hasBioOut = bioRecord && bioRecord.outTime;
  
  // Calculate expected status based on Biometric Logic
  let bioExpectedStatus = "Absent";
  if (hasBioIn && hasBioOut) {
    const outMins = parseTimeToMinutes(bioRecord.outTime);
    if (outMins !== null && outMins < 960) {
      bioExpectedStatus = "Half Day (Early Out)";
    } else {
      bioExpectedStatus = "Present";
    }
  } else if (hasBioIn || hasBioOut) {
    bioExpectedStatus = "Half Day / Punch Missing";
  }

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

  const handleLateFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLateForm(prev => ({
        ...prev,
        file: file,
        file_preview: file.name
      }));
    }
  };

  const handleSaveLateApproval = async (e) => {
    e.preventDefault();
    if (!employee?.id) {
      alert("Employee ID missing!");
      return;
    }
    if (!lateForm.start_date || !lateForm.end_date) {
      alert("Please select both start date and end date!");
      return;
    }
    if (!lateForm.remark || !lateForm.remark.trim()) {
      alert("Remark / Reason is mandatory!");
      return;
    }

    setIsSavingLate(true);
    try {
      let fileUrl = null;

      if (lateForm.file) {
        const fileName = `${employee.code || "emp"}_late_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(`late_approvals/${fileName}`, lateForm.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(`late_approvals/${fileName}`);

        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("late_attendance_approval")
        .insert({
          employee_id: employee.id,
          employee_code: employee.code || "",
          employee_name: employee.name || "",
          actual_in_time: lateForm.actual_in_time || null,
          changed_in_time: lateForm.changed_in_time || null,
          actual_out_time: lateForm.actual_out_time || null,
          changed_out_time: lateForm.changed_out_time || null,
          duration: lateForm.duration || null,
          start_date: lateForm.start_date,
          end_date: lateForm.end_date,
          remark: lateForm.remark.trim(),
          file_url: fileUrl,
          approved_status: lateForm.approved ? "Approved" : "Pending"
        });

      if (error) throw error;

      alert(`Late attendance approval saved successfully for ${employee.name}!`);
      setShowLateForm(false);
      onClose();
    } catch (err) {
      console.error("Error saving late approval:", err);
      alert("Failed to save late approval: " + err.message);
    } finally {
      setIsSavingLate(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] transition-opacity">
      <div className="bg-white border border-slate-100 rounded-3xl p-6 w-[580px] shadow-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
        
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
          <div className={`${sStyle.bg.replace("bg-", "bg-opacity-5 bg-")} rounded-2xl p-4 border border-current/10 flex flex-col justify-center`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Grid Status</span>
            <span className={`text-sm font-black ${sStyle.bg.includes("text-") ? sStyle.bg.split(" ").find(x => x.startsWith("text-")) : "text-slate-800"}`}>
              {sStyle.label}
            </span>
          </div>
        </div>

        {/* LATE APPROVAL FORM VIEW */}
        {showLateForm ? (
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-amber-200/60 pb-2.5">
              <h4 className="font-extrabold text-amber-900 text-sm flex items-center gap-1.5 uppercase tracking-wider">
                <span>⏰</span> Late Attendance Approval Form
              </h4>
              <button
                type="button"
                onClick={() => setShowLateForm(false)}
                className="text-xs font-bold text-amber-700 hover:underline"
              >
                ← Back to Logs
              </button>
            </div>

            <form onSubmit={handleSaveLateApproval} className="space-y-4 text-xs">
              {/* In Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">In Time (Actual)</label>
                  <input
                    type="time"
                    value={lateForm.actual_in_time}
                    onChange={e => setLateForm({ ...lateForm, actual_in_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">In Time (Change)</label>
                  <input
                    type="time"
                    value={lateForm.changed_in_time}
                    onChange={e => setLateForm({ ...lateForm, changed_in_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Out Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Out Time (Actual)</label>
                  <input
                    type="time"
                    value={lateForm.actual_out_time}
                    onChange={e => setLateForm({ ...lateForm, actual_out_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Out Time (Change)</label>
                  <input
                    type="time"
                    value={lateForm.changed_out_time}
                    onChange={e => setLateForm({ ...lateForm, changed_out_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Date Range & Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={lateForm.start_date}
                    onChange={e => setLateForm({ ...lateForm, start_date: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">End Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={lateForm.end_date}
                    onChange={e => setLateForm({ ...lateForm, end_date: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 8 Hours"
                    value={lateForm.duration}
                    onChange={e => setLateForm({ ...lateForm, duration: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Remark Field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Remark / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="2"
                  value={lateForm.remark}
                  onChange={e => setLateForm({ ...lateForm, remark: e.target.value })}
                  placeholder="Enter reason for late approval..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Upload Approval File / Document</label>
                <div className="relative border border-dashed border-slate-300 rounded-xl p-3 text-center bg-white hover:bg-slate-50 transition-all cursor-pointer">
                  <input
                    type="file"
                    onChange={handleLateFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    {lateForm.file_preview ? `📄 ${lateForm.file_preview}` : "📁 Click or drag file to upload"}
                  </span>
                </div>
              </div>

              {/* Approved Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modal-late-approved-checkbox"
                  checked={lateForm.approved}
                  onChange={e => setLateForm({ ...lateForm, approved: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="modal-late-approved-checkbox" className="text-xs font-bold text-slate-700 select-none cursor-pointer">
                  Mark as Approved Immediately
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingLate}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 text-xs"
                >
                  {isSavingLate ? "Saving..." : "💾 Save Late Approval"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLateForm(false)}
                  className="px-5 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Punch Details Section */
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
        )}

        {/* Action Buttons */}
        {!showLateForm && (
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                onEdit(employee, date, status);
                onClose();
              }}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-violet-100"
            >
              ✏️ Correct Attendance
            </button>

            <button
              onClick={() => setShowLateForm(true)}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-100"
            >
              ⏰ Late Approval
            </button>

            <button
              onClick={onClose}
              className="px-5 border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
