import { useState, useEffect } from "react";
import { Select } from "antd";
import supabase from "../../utils/supabase";

export default function SalaryDeductions({ employees }) {
  const [deductionForm, setDeductionForm] = useState({
    employee_id: "",
    employee_name: "",
    employee_code: "",
    deduction_date: "",
    deducted_days: 1.0,
    deducted_amount: "",
    reason: "",
    file: null,
    file_preview: null
  });
  const [deductionsList, setDeductionsList] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch salary deductions
  const fetchDeductions = async () => {
    try {
      const { data, error } = await supabase
        .from("salary_deduction")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("salary_deduction table may not exist yet:", error);
      } else {
        setDeductionsList(data || []);
      }
    } catch (err) {
      console.error("Error fetching salary deductions:", err);
    }
  };

  useEffect(() => {
    fetchDeductions();
  }, []);

  // Save deduction
  const handleSaveDeduction = async (e) => {
    e.preventDefault();
    if (!deductionForm.employee_id) {
      alert("Please select an employee!");
      return;
    }
    if (!deductionForm.deduction_date) {
      alert("Please select the deduction date!");
      return;
    }

    setIsSaving(true);
    try {
      let fileUrl = null;

      if (deductionForm.file) {
        const fileName = `${deductionForm.employee_code}_deduct_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(`salary_deductions/${fileName}`, deductionForm.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(`salary_deductions/${fileName}`);

        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("salary_deduction")
        .insert({
          employee_id: deductionForm.employee_id,
          employee_code: deductionForm.employee_code,
          employee_name: deductionForm.employee_name,
          deduction_date: deductionForm.deduction_date,
          deducted_days: Number(deductionForm.deducted_days) || 0,
          deducted_amount: deductionForm.deducted_amount ? Number(deductionForm.deducted_amount) : null,
          reason: deductionForm.reason || null,
          file_url: fileUrl
        });

      if (error) throw error;

      alert("Salary deduction recorded successfully!");
      setDeductionForm({
        employee_id: "",
        employee_name: "",
        employee_code: "",
        deduction_date: "",
        deducted_days: 1.0,
        deducted_amount: "",
        reason: "",
        file: null,
        file_preview: null
      });
      await fetchDeductions();
    } catch (err) {
      console.error("Error saving salary deduction:", err);
      alert("Failed to save deduction: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDeductionForm(prev => ({
        ...prev,
        file: file,
        file_preview: file.name
      }));
    }
  };

  const handleDeleteDeduction = async (id) => {
    if (!confirm("Are you sure you want to delete this deduction record?")) return;
    try {
      const { error } = await supabase
        .from("salary_deduction")
        .delete()
        .eq("id", id);
      if (error) throw error;
      alert("Deduction record deleted.");
      await fetchDeductions();
    } catch (err) {
      console.error("Error deleting deduction:", err);
      alert("Failed to delete record: " + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* FORM CARD */}
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>💸</span> Record Salary Deduction
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Apply salary/day deductions for a specific date (e.g. LWP, penalties, etc.).
          </p>
        </div>

        <form onSubmit={handleSaveDeduction} className="space-y-4">
          {/* Employee Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-550 mb-1">
              Select Employee <span className="text-red-500">*</span>
            </label>
            <Select
              showSearch
              placeholder="Search Employee"
              value={deductionForm.employee_id || undefined}
              onChange={(value) => {
                const selected = employees.find(e => e.id === value);
                setDeductionForm({
                  ...deductionForm,
                  employee_id: value,
                  employee_name: selected ? selected.name : "",
                  employee_code: selected ? selected.code : ""
                });
              }}
              className="w-full h-9"
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

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-550 mb-1">
              Deduction Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={deductionForm.deduction_date}
              onChange={e => setDeductionForm({ ...deductionForm, deduction_date: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Deducted Days & Deducted Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1">
                Deducted Days <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={deductionForm.deducted_days}
                onChange={e => setDeductionForm({ ...deductionForm, deducted_days: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1">
                Amount (Rs. Optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={deductionForm.deducted_amount}
                onChange={e => setDeductionForm({ ...deductionForm, deducted_amount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reason / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-550 mb-1">
              Reason / Remarks
            </label>
            <textarea
              rows="3"
              required
              placeholder="Provide reason for salary deduction (e.g. Unapproved absence, discipline, etc.)"
              value={deductionForm.reason}
              onChange={e => setDeductionForm({ ...deductionForm, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-550 mb-1">
              Upload Proof / Document
            </label>
            <div className="relative border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-medium">
                {deductionForm.file_preview ? `📄 ${deductionForm.file_preview}` : "📁 Click or drag file to upload"}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>💾 Record Deduction</>
            )}
          </button>
        </form>
      </div>

      {/* LIST HISTORY */}
      <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">
            📋 Salary Deductions Registry
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Registered salary deductions. These deductions will be integrated into the monthly payroll processing.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Employee</th>
                <th className="p-3">Deduction Date</th>
                <th className="p-3">Deducted Days</th>
                <th className="p-3">Amount (Rs)</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Doc</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {deductionsList.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{item.employee_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.employee_code}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{item.deduction_date}</td>
                  <td className="p-3 font-mono text-slate-700">
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded font-bold">
                      -{item.deducted_days} Days
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-650">
                    {item.deducted_amount ? `₹${item.deducted_amount}` : "-"}
                  </td>
                  <td className="p-3 text-slate-500 max-w-[150px] truncate" title={item.reason}>
                    {item.reason || "-"}
                  </td>
                  <td className="p-3">
                    {item.file_url ? (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        📄 Doc
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteDeduction(item.id)}
                      className="text-red-500 hover:text-red-700 font-bold hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {deductionsList.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 italic">No salary deductions recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
