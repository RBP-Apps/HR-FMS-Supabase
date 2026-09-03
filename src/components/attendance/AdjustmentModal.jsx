import React from "react";
import { Select } from "antd";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = ["2024", "2025", "2026", "2027", "2028"];

export default function AdjustmentModal({
  showAdjustModal,
  setShowAdjustModal,
  adjustForm,
  setAdjustForm,
  employees,
  handleAddAdjustment
}) {
  if (!showAdjustModal) return null;

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[450px] shadow-xl border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-4">➕ Manual HR Adjustment</h3>
        <form onSubmit={handleAddAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Select Employee <span className="text-red-500">*</span>
            </label>

            <Select
              showSearch
              placeholder="Search Employee"
              value={adjustForm.employee_id || undefined}
              onChange={(value) =>
                setAdjustForm({ ...adjustForm, employee_id: value })
              }
              className="w-full"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children
                  ?.toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {employees.map((e) => (
                <Select.Option key={e.id} value={e.id}>
                  {e.code} - {e.name}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Leave Type</label>
              <select
                value={adjustForm.leave_type || "CL"}
                onChange={e => setAdjustForm({ ...adjustForm, leave_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
              >
                <option value="CL">Casual Leave (CL)</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Adjustment Type</label>
              <select
                value={adjustForm.transaction_type || "CREDIT"}
                onChange={e => setAdjustForm({ ...adjustForm, transaction_type: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
              >
                <option value="CREDIT">Credit (Add)</option>
                <option value="DEBIT">Debit (Subtract)</option>
              </select>
            </div>
          </div>

          {/* Month & Year Selection Fields */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Select Month <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={adjustForm.month || ""}
                onChange={e => setAdjustForm({ ...adjustForm, month: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              >
                <option value="">Choose Month</option>
                {MONTHS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-1/3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Select Year <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={adjustForm.year || ""}
                onChange={e => setAdjustForm({ ...adjustForm, year: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              >
                <option value="">Year</option>
                {YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Amount (Days)</label>
            <input
              type="number"
              required
              min="0.5"
              step="0.5"
              value={adjustForm.amount}
              onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Adjustment Remarks</label>
            <textarea
              required
              rows="2"
              value={adjustForm.remarks}
              onChange={e => setAdjustForm({ ...adjustForm, remarks: e.target.value })}
              placeholder="e.g. Crediting compensation leave or correction of errors"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition-all"
            >
              Apply Adjustment
            </button>
            <button
              type="button"
              onClick={() => setShowAdjustModal(false)}
              className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
