import React from "react";

export default function AttendanceFilters({
  search,
  setSearch,
  setCurrentPage,
  selectedCompany,
  setSelectedCompany,
  companies,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDept,
  setSelectedDept,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus
}) {
  const handleClearFilters = () => {
    setSearch("");
    setSelectedCompany("All Companies");
    setSelectedDept("All Departments");
    setSelectedType("All");
    setSelectedStatus("All Status");
    setSelectedYear(new Date().getFullYear().toString());
    setSelectedMonth(new Date().toLocaleString("default", { month: "long" }));
    setCurrentPage(1);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-40">
        <input
          type="text"
          placeholder="Search by name, code…"
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
      </div>

      {/* Company Filter */}
      <select value={selectedCompany} onChange={e => { setSelectedCompany(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
        <option>All Companies</option>
        {(companies || []).map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
        <option>{new Date().getFullYear()}</option>
        <option>{new Date().getFullYear() - 1}</option>
        <option>{new Date().getFullYear() - 2}</option>
        <option>{new Date().getFullYear() - 3}</option>
      </select>

      <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
        <option>January</option><option>February</option><option>March</option><option>April</option>
        <option>May</option><option>June</option><option>July</option><option>August</option>
        <option>September</option><option>October</option><option>November</option><option>December</option>
      </select>

      <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
        <option>All Departments</option>
        <option>Management</option><option>Office</option><option>Field</option>
      </select>

      <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
        <option>All</option><option>Biometric</option><option>Field</option>
      </select>

      <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setCurrentPage(1); }} className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50">
        <option>All Status</option><option>Present</option><option>Absent</option>
      </select>

      <button
        onClick={handleClearFilters}
        className="px-3 py-2 text-xs border border-slate-200 rounded-xl text-white bg-red-600"
      >
        Clear Filters
      </button>
    </div>
  );
}
