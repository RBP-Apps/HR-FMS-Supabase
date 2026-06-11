import React from "react";

export default function LeaveModal({
  showLeaveModal,
  selectedLeaveEmp,
  setShowLeaveModal,
  leaveType,
  setLeaveType,
  leaveDays,
  setLeaveDays,
  leaveReason,
  setLeaveReason,
  leaveBalances,
  MAX_CL_DAYS,
  applyLeave
}) {
  if (!showLeaveModal || !selectedLeaveEmp) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Apply Leave for {selectedLeaveEmp.name}</h3>
          <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="CL">Casual Leave (CL) - Max 12 days/year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Number of Days</label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={leaveDays}
              onChange={(e) => setLeaveDays(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            {leaveType === "CL" && (
              <p className="text-xs text-slate-400 mt-1">
                Remaining CL: {leaveBalances[selectedLeaveEmp.id]?.remainingCL ?? MAX_CL_DAYS} days
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
            <textarea
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Enter reason for leave..."
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              onClick={applyLeave}
              className="flex-1 bg-violet-600 text-white py-2 rounded-lg font-semibold hover:bg-violet-700"
            >
              Apply Leave
            </button>
            <button
              onClick={() => setShowLeaveModal(false)}
              className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
