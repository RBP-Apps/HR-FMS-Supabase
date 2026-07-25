import React from "react";

export default function BulkActionsPanel({
  isFinalized,
  bulkAction,
  setBulkAction,
  handleApplyBulkAction,
  filteredEmployees = [],
  loading = false
}) {
  if (isFinalized) return null;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-indigo-600 font-bold text-base">⚡</span>
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Bulk Attendance Actions</h4>
            <p className="text-[10px] text-slate-400">Select employee, date range, status & remark to save directly to Database</p>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-2.5 flex-wrap text-xs">
        {/* Employee Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500">Employee</label>
          <select
            value={bulkAction.employeeId || "ALL"}
            onChange={e => setBulkAction({ ...bulkAction, employeeId: e.target.value })}
            className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium text-slate-700 max-w-[200px]"
          >
            <option value="ALL">All Filtered Employees ({filteredEmployees.length})</option>
            {filteredEmployees.map(emp => (
              <option key={emp.id} value={emp.code}>
                {emp.name} ({emp.code})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range: Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500">From Date</label>
          <input
            type="date"
            value={bulkAction.startDate || ""}
            onChange={e => setBulkAction({ ...bulkAction, startDate: e.target.value })}
            className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700"
          />
        </div>

        {/* Date Range: End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500">To Date</label>
          <input
            type="date"
            value={bulkAction.endDate || ""}
            onChange={e => setBulkAction({ ...bulkAction, endDate: e.target.value })}
            className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700"
          />
        </div>

        {/* Status Selection */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold text-slate-500">Status</label>
          <select
            value={bulkAction.status || "P"}
            onChange={e => setBulkAction({ ...bulkAction, status: e.target.value })}
            className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-semibold text-slate-700"
          >
            <option value="P">Present (P)</option>
            <option value="A">Absent (A)</option>
            <option value="CL">Casual Leave (CL)</option>
            <option value="EL">Earned Leave (EL)</option>
            <option value="LWP">Leave Without Pay (LWP)</option>
            <option value="WO">Weekly Off (WO)</option>
            <option value="H">Holiday (H)</option>
          </select>
        </div>

        {/* Remark Input */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-[10px] font-semibold text-slate-500">Remark (Required)</label>
          <input
            type="text"
            placeholder="e.g. Bulk Leave / Site Work"
            value={bulkAction.remark || ""}
            onChange={e => setBulkAction({ ...bulkAction, remark: e.target.value })}
            className="px-2.5 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 text-slate-700 w-full"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleApplyBulkAction}
          disabled={loading}
          className="bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] disabled:opacity-50 text-white font-bold py-1.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-950/10 flex items-center gap-1.5 h-[34px]"
        >
          {loading ? (
            <span>Saving to DB...</span>
          ) : (
            <>
              <span>💾</span>
              <span>Save to Database</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

