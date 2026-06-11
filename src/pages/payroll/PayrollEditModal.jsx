import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { fmt } from './payrollConstants';

const Field = ({ label, name, value, onChange, type = 'number', hint }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    {hint && <p className="text-xs text-gray-400 -mt-0.5">{hint}</p>}
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      min={type === 'number' ? 0 : undefined}
      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent
        transition-all duration-200"
    />
  </div>
);

const ReadonlyField = ({ label, value, highlight }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <p className={`text-sm font-bold px-3 py-2 rounded-xl ${highlight ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
      {value}
    </p>
  </div>
);

export default function PayrollEditModal({ record, onClose, onSave }) {
  const [form, setForm] = useState({
    advance: 0,
    security_deposit: 0,
    other_deduction: 0,
    reimbursement: 0,
    salary_arrears: 0,
    ta_da: 0,
    ot: 0,
    remark: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (record) {
      setForm({
        advance:          record.calc?.advance        ?? 0,
        security_deposit: record.calc?.securityDep    ?? 0,
        other_deduction:  record.calc?.otherDed       ?? 0,
        reimbursement:    record.calc?.reimbursement  ?? 0,
        salary_arrears:   record.calc?.salaryArrears  ?? 0,
        ta_da:            record.calc?.taDA           ?? 0,
        ot:               record.edits?.ot            ?? 0,
        remark:           record.calc?.remark         ?? '',
      });
    }
  }, [record]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'remark' ? value : Number(value) }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    const numFields = ['advance','security_deposit','other_deduction','reimbursement','salary_arrears','ta_da','ot'];
    numFields.forEach(f => {
      if (form[f] < 0) errs[f] = 'Cannot be negative';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400)); // simulate async save
    onSave(record.id, form);
    setSaving(false);
  };

  if (!record) return null;
  const emp = record.employee;
  const c = record.calc || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col transition-all duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Edit Payroll</h2>
            <p className="text-blue-200 text-sm">{emp?.employee_name} — {emp?.designation}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Calculated Summary */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Auto-Calculated Summary</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <ReadonlyField label="Gross (Real)" value={fmt(c.grossReal)} />
              <ReadonlyField label="Gross Earned" value={fmt(c.grossEarned)} />
              <ReadonlyField label="EPF 12%" value={fmt(c.epfDed)} />
              <ReadonlyField label="ESIC 0.75%" value={fmt(c.esicDed)} />
              <ReadonlyField label="Total Deduction" value={fmt(c.totalDed)} />
              <ReadonlyField label="Net Salary" value={fmt(c.netSalary)} highlight />
              <ReadonlyField label="Total Payable" value={fmt(c.totalPayable)} highlight />
              <ReadonlyField label="CTC" value={fmt(c.ctc)} />
            </div>
          </div>

          {/* Editable Fields */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Editable Fields</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="OT Days" name="ot" value={form.ot} onChange={handleChange}
                hint="Days worked overtime" />
              <Field label="Advance (₹)" name="advance" value={form.advance} onChange={handleChange} />
              <Field label="Security Deposit (₹)" name="security_deposit" value={form.security_deposit} onChange={handleChange} />
              <Field label="Other Deduction (₹)" name="other_deduction" value={form.other_deduction} onChange={handleChange} />
              <Field label="Reimbursement (₹)" name="reimbursement" value={form.reimbursement} onChange={handleChange} />
              <Field label="Salary Arrears (₹)" name="salary_arrears" value={form.salary_arrears} onChange={handleChange} />
              <Field label="TA / DA (₹)" name="ta_da" value={form.ta_da} onChange={handleChange} />
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remark</label>
                <input
                  type="text"
                  name="remark"
                  value={form.remark}
                  onChange={handleChange}
                  placeholder="Optional remark..."
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Error list */}
          {Object.values(errors).some(Boolean) && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Please fix: {Object.values(errors).filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-end gap-3 bg-gray-50 rounded-b-3xl">
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl
              hover:bg-gray-100 transition-all duration-200">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white
              bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md shadow-blue-400/30
              hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving...</>
              : <><CheckCircle className="w-4 h-4" />Save Changes</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
