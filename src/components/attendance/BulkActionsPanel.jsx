import React from "react";

export default function BulkActionsPanel({
  isFinalized,
  bulkAction,
  setBulkAction,
  handleApplyBulkAction
}) {
  if (isFinalized) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-indigo-600 font-bold text-base">⚡</span>
        <div>
          <h4 className="font-bold text-slate-800 text-sm">Bulk Attendance Actions</h4>
          <p className="text-[10px] text-slate-400">Override status for all filtered employees in a date range</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <input
          type="date"
          value={bulkAction.startDate}
          onChange={e => setBulkAction({ ...bulkAction, startDate: e.target.value })}
          className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
        />
        <span className="text-slate-400">to</span>
        <input
          type="date"
          value={bulkAction.endDate}
          onChange={e => setBulkAction({ ...bulkAction, endDate: e.target.value })}
          className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
        />
        <select
          value={bulkAction.status}
          onChange={e => setBulkAction({ ...bulkAction, status: e.target.value })}
          className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50 font-semibold text-slate-700"
        >
          <option value="P">Present (P)</option>
          <option value="A">Absent (A)</option>
          <option value="CL">Casual Leave (CL)</option>
          <option value="EL">Earned Leave (EL)</option>
          <option value="LWP">Leave Without Pay (LWP)</option>
          <option value="WO">Weekly Off (WO)</option>
          <option value="H">Holiday (H)</option>
        </select>
        <button
          onClick={handleApplyBulkAction}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-4 rounded-xl transition-all shadow-sm"
        >
          Apply Bulk Override
        </button>
      </div>
    </div>
  );
}
