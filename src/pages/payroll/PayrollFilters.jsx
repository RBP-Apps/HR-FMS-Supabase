import React from 'react';
import {
  Search, Calendar, RotateCcw, Download, FileSpreadsheet, FileText, ChevronDown
} from 'lucide-react';
import { MONTHS, DEPARTMENTS, PAYROLL_STATUSES, DESIGNATIONS } from './payrollConstants';

const years = [2023, 2024, 2025, 2026, 2027];

const SelectField = ({ label, value, onChange, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-3 py-2 pr-8 text-sm text-gray-700 shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          hover:border-blue-400 transition-all duration-200"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  </div>
);

export default function PayrollFilters({ filters, companies = [], onChange, onReset, onExcelExport, onPdfExport, onDownloadPayslip }) {
  const set = (key) => (e) => onChange(key, e.target.value);
  const [localSearch, setLocalSearch] = React.useState(filters.search || '');

  React.useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    onChange('search', val);
  };

  return (
    <div className="bg-white/80 backdrop-blur border border-white/60 rounded-2xl shadow-sm p-4 space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        <SelectField label="Month" value={filters.month} onChange={set('month')}>
          {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </SelectField>

        <SelectField label="Year" value={filters.year} onChange={set('year')}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </SelectField>

        <SelectField label="Company" value={filters.company || 'All'} onChange={set('company')}>
          <option value="All">All Companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </SelectField>

        <SelectField label="Department" value={filters.department} onChange={set('department')}>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </SelectField>

        <SelectField label="Designation" value={filters.designation} onChange={set('designation')}>
          {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
        </SelectField>

        <SelectField label="Status" value={filters.payrollStatus} onChange={set('payrollStatus')}>
          {PAYROLL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </SelectField>

        <SelectField label="PF Enabled" value={filters.pfEnabled} onChange={set('pfEnabled')}>
          <option value="All">All</option>
          <option value="yes">PF Employees</option>
          <option value="no">No PF</option>
        </SelectField>

        <SelectField label="ESIC Enabled" value={filters.esicEnabled} onChange={set('esicEnabled')}>
          <option value="All">All</option>
          <option value="yes">ESIC Employees</option>
          <option value="no">No ESIC</option>
        </SelectField>

        <SelectField label="Advance" value={filters.hasAdvance} onChange={set('hasAdvance')}>
          <option value="All">All</option>
          <option value="yes">Has Advance</option>
          <option value="no">No Advance</option>
        </SelectField>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-end">
        {/* Search */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Name, Code, UAN, ESIC..."
              value={localSearch}
              onChange={handleSearchChange}
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                hover:border-blue-400 transition-all duration-200"
            />
          </div>
        </div>

        {/* Min Gross Salary */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Gross</label>
          <input
            type="number"
            placeholder="₹ Min"
            value={filters.minGross}
            onChange={set('minGross')}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all duration-200"
          />
        </div>

        {/* Max Gross Salary */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Max Gross</label>
          <input
            type="number"
            placeholder="₹ Max"
            value={filters.maxGross}
            onChange={set('maxGross')}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all duration-200"
          />
        </div>

        {/* Min Present Days */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Min Present</label>
          <input
            type="number"
            placeholder="Days"
            value={filters.minPresent}
            onChange={set('minPresent')}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all duration-200"
          />
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold
            hover:bg-gray-200 transition-all duration-200 hover:scale-105"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Filters
        </button>

        <button
          onClick={onExcelExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold
            shadow-md shadow-green-300/50 hover:shadow-lg hover:scale-105 transition-all duration-200"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Excel
        </button>
      </div>
    </div>
  );
}
