import React from "react";

export default function HolidayManager({
  holidays,
  setEditingHoliday,
  setHolidayForm,
  setShowHolidayModal,
  handleDeleteHoliday
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Holiday Master</h3>
          <p className="text-xs text-slate-400">Manage organizational holidays which auto-reflect in the attendance processing engine.</p>
        </div>
        <button
          onClick={() => {
            setEditingHoliday(null);
            setHolidayForm({ holiday_name: "", holiday_date: "", holiday_type: "National" });
            setShowHolidayModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all"
        >
          ➕ Add New Holiday
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="p-4">Holiday Name</th>
              <th className="p-4">Holiday Date</th>
              <th className="p-4">Holiday Type</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {holidays.map(h => (
              <tr key={h.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-850">{h.holiday_name}</td>
                <td className="p-4 font-mono text-slate-500">{h.holiday_date}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${h.holiday_type === "National" ? "bg-red-50 text-red-700" : "bg-indigo-50 text-indigo-700"
                    }`}>
                    {h.holiday_type}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => {
                      setEditingHoliday(h);
                      setHolidayForm({ holiday_name: h.holiday_name, holiday_date: h.holiday_date, holiday_type: h.holiday_type });
                      setShowHolidayModal(true);
                    }}
                    className="text-slate-500 hover:text-indigo-600 font-bold text-xs transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-xs transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400 italic">No holidays configured.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
