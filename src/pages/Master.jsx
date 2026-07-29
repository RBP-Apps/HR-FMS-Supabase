"use client";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import supabase from "../utils/supabase";
import { XCircle } from "lucide-react";

export default function MasterDataManagement() {
  const [masterData, setMasterData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterFirmName, setFilterFirmName] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [filterName, setFilterName] = useState("");

  const [formData, setFormData] = useState({
    hod_name: "",
    firm_name: "",
    department: "",
    social_site: "",
    call_tracker_status: "",
    family_relationship: "",
    attendance_type: "",
    employee_name: "",
    mobile_no: "",
    designation: ""
  });

  const [editData, setEditData] = useState(formData);

  // ================= FETCH MASTER DATA =================
  const fetchMasterData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("master_hr")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMasterData(data || []);
    } catch (error) {
      console.error("Error fetching master data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // ================= HANDLE FORM INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Mobile number validation
    if (name === "mobile_no") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 15) {
        setFormData((prev) => ({
          ...prev,
          mobile_no: digitsOnly,
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setEditData(item);
  };

  // ================= HANDLE SUBMIT (CREATE) =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("master_hr").insert([formData]);

      if (error) throw error;

      setOpen(false);
      setFormData({
        hod_name: "",
        firm_name: "",
        department: "",
        social_site: "",
        call_tracker_status: "",
        family_relationship: "",
        attendance_type: "",
        employee_name: "",
        mobile_no: "",
        designation: ""
      });

      fetchMasterData();
    } catch (error) {
      console.error("Error adding master data:", error);
      alert("Error adding data: " + error.message);
    }
  };

  // ================= HANDLE UPDATE =================
  const handleUpdate = async (id) => {
    try {
      // Remove id and created_at so primary key and system fields are not updated
      const { id: _id, created_at: _created_at, ...updatePayload } = editData;

      const { error } = await supabase
        .from("master_hr")
        .update(updatePayload)
        .eq("id", id);

      if (error) throw error;

      setEditId(null);
      fetchMasterData();
    } catch (error) {
      console.error("Error updating master data:", error);
      alert("Error updating data: " + error.message);
    }
  };

  // ================= HANDLE DELETE =================
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await supabase.from("master_hr").delete().eq("id", id);

      if (error) throw error;

      fetchMasterData();
    } catch (error) {
      console.error("Error deleting master data:", error);
      alert("Error deleting data: " + error.message);
    }
  };

  // ================= STATS CALCULATIONS =================
  const uniqueDepartments = [...new Set(masterData.map(item => item.department).filter(Boolean))];
  const uniqueFirms = [...new Set(masterData.map(item => item.firm_name).filter(Boolean))];

  const filteredData = masterData.filter(item => {
    const matchesSearch = searchTerm === "" ||
      item.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterFirmName === "" || item.firm_name?.toString() === filterFirmName?.toString();
    const matchesPost = filterPost === "" || item.designation === filterPost;
    const matchesName = filterName === "" || item.employee_name === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  const uniqueIndents = Array.from(new Set(masterData.map(i => i.id).filter(Boolean)));
  const uniquePosts = Array.from(new Set(masterData.map(i => i.designation).filter(Boolean)));
  const uniqueNames = Array.from(new Set(masterData.map(i => i.employee_name).filter(Boolean)));


 const renderField = (value) => {
  if (value) {
    return <span>{value}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium">
      <XCircle size={14} />
      Missing
    </span>
  );
};

  // ================= UI =================
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#065F46] to-[#0F766E] tracking-tight">
            Master HR Management
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            Manage global directory configuration and HOD allocations
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-950/10 hover:shadow-lg transition-all duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Add New Record
        </button>
      </div>

      {/* Dynamic Filters Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
          <div className="flex flex-col">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">Company Name</label>
            <div className="relative">
              <input
                type="text"
                list="masterFirmList"
                placeholder="Select/Search Firm"
                value={filterFirmName}
                onChange={(e) => setFilterFirmName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-350"
              />
              <datalist id="masterFirmList">
                {uniqueFirms.map(firm => (
                  <option key={firm} value={firm} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Post Filter (Mapped to Designation) */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">Post (Designation)</label>
            <div className="relative">
              <input
                type="text"
                list="masterPostList"
                placeholder="Select/Search Post"
                value={filterPost}
                onChange={(e) => setFilterPost(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
              />
              <datalist id="masterPostList">
                {uniquePosts.map(post => (
                  <option key={post} value={post} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Name As Per Aadhaar Filter (Mapped to Employee Name) */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">Employee Name</label>
            <div className="relative">
              <input
                type="text"
                list="masterNameList"
                placeholder="Select/Search Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
              />
              <datalist id="masterNameList">
                {uniqueNames.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Global Search */}
          <div className="flex flex-col">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">Global Search</label>
            <div className="relative h-full flex items-center">
              <input
                type="text"
                placeholder="Search all fields..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
             
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              setFilterFirmName("");
              setFilterPost("");
              setFilterName("");
              setSearchTerm("");
            }}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Directory Records</h2>
            {loading && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#0F766E] border-t-transparent"></div>
                Loading...
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-30">
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-semibold">S.No</th>
                <th className="px-4 py-3 text-left font-semibold">HOD Name</th>
                <th className="px-4 py-3 text-left font-semibold">Firm Name</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">Mobile</th>
                <th className="px-4 py-3 text-left font-semibold">Designation</th>
                <th className="px-4 py-3 text-left font-semibold">Attendance</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="flex flex-col justify-center items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0F766E] border-t-transparent"></div>
                      <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Loading records...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">No records found.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-all duration-150"
                  >
                    <td className="px-4 py-4 text-slate-400 font-semibold">{index + 1}</td>

                    {/* HOD Name */}
                    <td className="px-4 py-4">
                      {editId === item.id ? (
                        <input
                          name="hod_name"
                          value={editData.hod_name || ""}
                          onChange={handleEditChange}
                          className="border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <span className="font-semibold text-slate-700">{renderField(item.hod_name)}</span>
                      )}
                    </td>

                    {/* Firm Name */}
                    <td className="px-4 py-4 text-slate-650 font-medium">
                      {editId === item.id ? (
                        <input
                          name="firm_name"
                          value={editData.firm_name || ""}
                          onChange={handleEditChange}
                          className="border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <span>{renderField(item.firm_name)}</span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="px-4 py-4">
                      {editId === item.id ? (
                        <input
                          name="department"
                          value={editData.department || ""}
                          onChange={handleEditChange}
                          className="border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-[#0F766E] rounded-full text-xs font-bold">
                          {renderField(item.department)}
                        </span>
                      )}
                    </td>

                    {/* Employee Name */}
                    <td className="px-4 py-4 text-slate-750 font-semibold">
                      {editId === item.id ? (
                        <input
                          name="employee_name"
                          value={editData.employee_name || ""}
                          onChange={handleEditChange}
                          className="border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <span>
                          {renderField(item.employee_name)}
                        </span>
                      )}
                    </td>

                    {/* Mobile No */}
                    <td className="px-4 py-4 text-slate-550 font-semibold">
                      {editId === item.id ? (
                        <input
                          name="mobile_no"
                          value={editData.mobile_no || ""}
                          onChange={handleEditChange}
                          className="border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <span>{renderField(item.mobile_no)}</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-4 text-slate-600 font-medium">
                      {editId === item.id ? (
                        <input
                          name="designation"
                          value={editData.designation || ""}
                          onChange={handleEditChange}
                          className="border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <span>{renderField(item.designation)}</span>
                      )}
                    </td>

                    {/* Attendance Type */}
                    <td className="px-4 py-4">
                      {editId === item.id ? (
                        <select
                          name="attendance_type"
                          value={editData.attendance_type || ""}
                          onChange={handleEditChange}
                          className="border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] font-semibold text-slate-700"
                        >
                          <option value="">Select</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half Day">Half Day</option>
                          <option value="Leave">Leave</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.attendance_type === "Present" ? "bg-emerald-50 text-emerald-700 border border-emerald-100/60" :
                          item.attendance_type === "Absent" ? "bg-red-50 text-red-700 border border-red-100/60" :
                          item.attendance_type === "Half Day" ? "bg-amber-50 text-amber-700 border border-amber-100/60" :
                          item.attendance_type === "Leave" ? "bg-slate-100 text-slate-700 border border-slate-200" :
                          "bg-slate-50 text-slate-400"
                        }`}>
                          {renderField(item.attendance_type)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-center">
                      {editId === item.id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleUpdate(item.id)}
                            className="flex items-center gap-1 bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:opacity-90 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-[#0F766E] border border-emerald-200/60 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 text-sm text-gray-500">
          Showing {filteredData.length} of {masterData.length} records
        </div>
      </div>

      {/* ================= MOBILE CARD VIEW ================= */}
      <div className="md:hidden space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">
              Master Data Records
            </h2>
            <span className="bg-emerald-50 border border-emerald-100 text-[#0F766E] text-xs font-bold px-3 py-1 rounded-full">
              {filteredData.length} records
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0F766E] border-t-transparent mx-auto"></div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-2 animate-pulse">Loading records...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">No records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-slate-200/60 rounded-2xl p-4 hover:border-emerald-250 transition-all duration-200 bg-slate-50/20"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-400 text-xs font-semibold">#{index + 1}</span>
                        <h3 className="font-semibold text-slate-800">
                          {item.employee_name || item.hod_name || "Unnamed"}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          item.attendance_type === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-100/60" :
                          item.attendance_type === "Absent" ? "bg-red-50 text-red-700 border-red-100/60" :
                          item.attendance_type === "Half Day" ? "bg-amber-50 text-amber-700 border-amber-100/60" :
                          item.attendance_type === "Leave" ? "bg-slate-100 text-slate-700 border-slate-200" :
                          "bg-slate-50 text-slate-400"
                        }`}>
                          {item.attendance_type || "N/A"}
                        </span>
                        {item.department && (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[#0F766E] rounded-full text-xs font-bold">
                            {item.department}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {editId === item.id ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdate(item.id)}
                          className="p-2 bg-[#0F766E]/10 text-[#0F766E] rounded-xl hover:bg-[#0F766E]/20 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-2 bg-slate-150 text-slate-650 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-[#0F766E] border border-emerald-100 rounded-xl transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-650 border border-red-100 rounded-xl transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">HOD Name</p>
                      {editId === item.id ? (
                        <input
                          name="hod_name"
                          value={editData.hod_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-700">{item.hod_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Firm Name</p>
                      {editId === item.id ? (
                        <input
                          name="firm_name"
                          value={editData.firm_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-600">{item.firm_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Department</p>
                      {editId === item.id ? (
                        <input
                          name="department"
                          value={editData.department || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-700">{item.department || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Employee Name</p>
                      {editId === item.id ? (
                        <input
                          name="employee_name"
                          value={editData.employee_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <p className="text-sm font-bold text-slate-800">{item.employee_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Mobile No</p>
                      {editId === item.id ? (
                        <input
                          name="mobile_no"
                          value={editData.mobile_no || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-700">{item.mobile_no || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Designation</p>
                      {editId === item.id ? (
                        <input
                          name="designation"
                          value={editData.designation || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-600">{item.designation || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Social Site</p>
                      {editId === item.id ? (
                        <input
                          name="social_site"
                          value={editData.social_site || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-655">{item.social_site || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Family Relationship</p>
                      {editId === item.id ? (
                        <input
                          name="family_relationship"
                          value={editData.family_relationship || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                        />
                      ) : (
                        <p className="text-sm font-medium text-slate-600">{item.family_relationship || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Call Tracker Status</p>
                      {editId === item.id ? (
                        <select
                          name="call_tracker_status"
                          value={editData.call_tracker_status || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] font-semibold text-slate-700"
                        >
                          <option value="">Select</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Pending">Pending</option>
                        </select>
                      ) : (
                        <p className="text-sm font-semibold text-slate-700">{item.call_tracker_status || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Attendance Type</p>
                      {editId === item.id ? (
                        <select
                          name="attendance_type"
                          value={editData.attendance_type || ""}
                          onChange={handleEditChange}
                          className="w-full border border-slate-200 bg-slate-55 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] font-semibold text-slate-700"
                        >
                          <option value="">Select</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half Day">Half Day</option>
                          <option value="Leave">Leave</option>
                        </select>
                      ) : (
                        <p className="text-sm font-semibold text-slate-700">{item.attendance_type || "-"}</p>
                      )}
                    </div>

                    {editId === item.id && (
                      <>
                        <div className="col-span-2">
                          <p className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Created At</p>
                          <p className="text-sm text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD RECORD MODAL ================= */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#065F46] to-[#0F766E] p-6 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Record</h2>
                  <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mt-1">
                    Fill in all the details below
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white hover:text-emerald-100 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    HOD Name *
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                    name="hod_name"
                    placeholder="Enter HOD name"
                    onChange={handleChange}
                    value={formData.hod_name}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Firm Name *
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                    name="firm_name"
                    placeholder="Enter firm name"
                    onChange={handleChange}
                    value={formData.firm_name}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Department *
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                    name="department"
                    placeholder="Enter department"
                    onChange={handleChange}
                    value={formData.department}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Social Site
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                    name="social_site"
                    placeholder="LinkedIn, Facebook, etc."
                    onChange={handleChange}
                    value={formData.social_site}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Call Tracker Status
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 text-sm transition-all hover:border-slate-355 appearance-none font-semibold text-slate-700"
                    name="call_tracker_status"
                    onChange={handleChange}
                    value={formData.call_tracker_status}
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Family Relationship
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                    name="family_relationship"
                    placeholder="e.g., Father, Mother, etc."
                    onChange={handleChange}
                    value={formData.family_relationship}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Attendance Type *
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 text-sm transition-all hover:border-slate-355 appearance-none font-semibold text-slate-700"
                    name="attendance_type"
                    onChange={handleChange}
                    value={formData.attendance_type}
                  >
                    <option value="">Select Attendance Type</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Leave">Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Employee Name *
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                    name="employee_name"
                    placeholder="Enter employee name"
                    onChange={handleChange}
                    value={formData.employee_name}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile_no"
                    placeholder="Enter mobile number"
                    maxLength={15}
                    inputMode="numeric"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                    onChange={handleChange}
                    value={formData.mobile_no}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Designation *
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-205 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                    name="designation"
                    placeholder="Enter designation"
                    onChange={handleChange}
                    value={formData.designation}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] text-white rounded-xl font-bold shadow-md shadow-emerald-950/10 hover:shadow-lg transition-all text-sm"
                >
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}