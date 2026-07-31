import { useState, useEffect } from "react";
import { Select } from "antd";
import supabase from "../../utils/supabase";

export default function LateApprovals({ employees }) {
  const [lateForm, setLateForm] = useState({
    employee_id: "",
    employee_name: "",
    employee_code: "",
    actual_in_time: "",
    changed_in_time: "",
    actual_out_time: "",
    changed_out_time: "",
    duration: "",
    start_date: "",
    end_date: "",
    file: null,
    file_preview: null,
    approved: true
  });
  const [lateApprovalsList, setLateApprovalsList] = useState([]);
  const [isSavingLateApproval, setIsSavingLateApproval] = useState(false);

  // Fetch late approvals
  const fetchLateApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from("late_attendance_approval")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("late_attendance_approval table may not exist yet:", error);
      } else {
        setLateApprovalsList(data || []);
      }
    } catch (err) {
      console.error("Error fetching late approvals:", err);
    }
  };

  useEffect(() => {
    fetchLateApprovals();
  }, []);

  // Save late approval
  const handleSaveLateApproval = async (e) => {
    e.preventDefault();
    if (!lateForm.employee_id) {
      alert("Please select an employee!");
      return;
    }
    if (!lateForm.start_date || !lateForm.end_date) {
      alert("Please select both start date and end date!");
      return;
    }

    setIsSavingLateApproval(true);
    try {
      let fileUrl = null;

      if (lateForm.file) {
        const fileName = `${lateForm.employee_code}_late_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(`late_approvals/${fileName}`, lateForm.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(`late_approvals/${fileName}`);

        fileUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("late_attendance_approval")
        .insert({
          employee_id: lateForm.employee_id,
          employee_code: lateForm.employee_code,
          employee_name: lateForm.employee_name,
          actual_in_time: lateForm.actual_in_time || null,
          changed_in_time: lateForm.changed_in_time || null,
          actual_out_time: lateForm.actual_out_time || null,
          changed_out_time: lateForm.changed_out_time || null,
          duration: lateForm.duration || null,
          start_date: lateForm.start_date,
          end_date: lateForm.end_date,
          file_url: fileUrl,
          approved_status: lateForm.approved ? "Approved" : "Pending"
        });

      if (error) throw error;

      alert("Late attendance approval saved successfully!");
      setLateForm({
        employee_id: "",
        employee_name: "",
        employee_code: "",
        actual_in_time: "",
        changed_in_time: "",
        actual_out_time: "",
        changed_out_time: "",
        duration: "",
        start_date: "",
        end_date: "",
        file: null,
        file_preview: null,
        approved: true
      });
      await fetchLateApprovals();
    } catch (err) {
      console.error("Error saving late approval:", err);
      alert("Failed to save late approval: " + err.message);
    } finally {
      setIsSavingLateApproval(false);
    }
  };

  const handleLateFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLateForm(prev => ({
        ...prev,
        file: file,
        file_preview: file.name
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* FORM CARD */}
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>⏰</span> Late Attendance Approval Form
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Approve late arrivals for a date range to automatically mark full day present.
          </p>
        </div>

        <form onSubmit={handleSaveLateApproval} className="space-y-4">
          {/* Employee Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-550 mb-1">
              Select Active Employee <span className="text-red-500">*</span>
            </label>
            <Select
              showSearch
              placeholder="Search Employee"
              value={lateForm.employee_id || undefined}
              onChange={(value) => {
                const selected = employees.find(e => e.id === value);
                const genderVal = (selected?.gender || "").toString().trim().toLowerCase();
                const isFemale = genderVal === "female" || genderVal === "f";

                const defaultIn = "09:30";
                const defaultOut = isFemale ? "18:00" : "18:30";

                setLateForm({
                  ...lateForm,
                  employee_id: value,
                  employee_name: selected ? selected.name : "",
                  employee_code: selected ? selected.code : "",
                  actual_in_time: defaultIn,
                  actual_out_time: defaultOut
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
              {employees.filter(e => e.status === "Active").map((e) => (
                <Select.Option key={e.id} value={e.id}>
                  {e.code} - {e.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* In Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1">
                In Time (Actual)
              </label>
              <input
                type="time"
                value={lateForm.actual_in_time}
                onChange={e => setLateForm({ ...lateForm, actual_in_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1">
                In Time (Change)
              </label>
              <input
                type="time"
                value={lateForm.changed_in_time}
                onChange={e => setLateForm({ ...lateForm, changed_in_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Out Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1">
                Out Time (Actual)
              </label>
              <input
                type="time"
                value={lateForm.actual_out_time}
                onChange={e => setLateForm({ ...lateForm, actual_out_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1">
                Out Time (Change)
              </label>
              <input
                type="time"
                value={lateForm.changed_out_time}
                onChange={e => setLateForm({ ...lateForm, changed_out_time: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-550 mb-1">
              Duration (Manual)
            </label>
            <input
              type="text"
              placeholder="e.g. 8 Hours"
              value={lateForm.duration}
              onChange={e => setLateForm({ ...lateForm, duration: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={lateForm.start_date}
                onChange={e => setLateForm({ ...lateForm, start_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={lateForm.end_date}
                onChange={e => setLateForm({ ...lateForm, end_date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-550 mb-1">
              Upload Approval File / Document
            </label>
            <div className="relative border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer">
              <input
                type="file"
                onChange={handleLateFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-xs text-slate-600 font-medium">
                {lateForm.file_preview ? `📄 ${lateForm.file_preview}` : "📁 Click or drag file to upload"}
              </span>
            </div>
          </div>

          {/* Approved Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="late-approved-checkbox"
              checked={lateForm.approved}
              onChange={e => setLateForm({ ...lateForm, approved: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="late-approved-checkbox" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
              Mark as Approved Immediately
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSavingLateApproval}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSavingLateApproval ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>💾 Save Approval</>
            )}
          </button>
        </form>
      </div>

      {/* LIST HISTORY */}
      <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">
            📋 Late Approvals History
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            List of configured approvals. These dates will override biometric/field defaults for full-day presence.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Employee</th>
                <th className="p-3">In Times</th>
                <th className="p-3">Out Times</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Date Range</th>
                <th className="p-3">Doc</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {lateApprovalsList.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{item.employee_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{item.employee_code}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-500 font-mono text-[10px]">Act: {item.actual_in_time || "--:--"}</div>
                    <div className="text-indigo-600 font-mono text-[10px]">Chg: {item.changed_in_time || "--:--"}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-slate-500 font-mono text-[10px]">Act: {item.actual_out_time || "--:--"}</div>
                    <div className="text-indigo-600 font-mono text-[10px]">Chg: {item.changed_out_time || "--:--"}</div>
                  </td>
                  <td className="p-3 font-mono text-slate-600">{item.duration || "--"}</td>
                  <td className="p-3 text-[10px]">
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">{item.start_date}</span>
                    <span className="text-slate-400 mx-1">to</span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-bold">{item.end_date}</span>
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
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      item.approved_status === "Approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-250" : "bg-amber-50 text-amber-700 border border-amber-250"
                    }`}>
                      {item.approved_status}
                    </span>
                  </td>
                </tr>
              ))}
              {lateApprovalsList.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 italic">No late approvals configured yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
