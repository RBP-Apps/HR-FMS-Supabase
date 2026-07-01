import React from "react";

export default function HolidayModal({
  showHolidayModal,
  setShowHolidayModal,
  editingHoliday,
  holidayForm,
  setHolidayForm,
  handleSaveHoliday
}) {
  if (!showHolidayModal) return null;

  return (
    <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[450px] shadow-xl border border-slate-100 animate-fadeIn">
        <h3 className="text-base font-bold text-slate-800 mb-4">{editingHoliday ? "✏️ Edit Holiday" : "🎉 Add New Holiday"}</h3>
        <form onSubmit={handleSaveHoliday} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Holiday Name</label>
            <input
              type="text"
              required
              value={holidayForm.holiday_name}
              onChange={e => setHolidayForm({ ...holidayForm, holiday_name: e.target.value })}
              placeholder="e.g. Independence Day"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Holiday Date</label>
            <input
              type="date"
              required
              value={holidayForm.holiday_date}
              onChange={e => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Holiday Type</label>
            <select
              value={holidayForm.holiday_type}
              onChange={e => setHolidayForm({ ...holidayForm, holiday_type: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none"
            >
              <option value="National">National Holiday</option>
              <option value="Festival">Festival Holiday</option>
              <option value="Special">Special Holiday</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-xs font-bold transition-all"
            >
              Save Holiday
            </button>
            <button
              type="button"
              onClick={() => setShowHolidayModal(false)}
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
