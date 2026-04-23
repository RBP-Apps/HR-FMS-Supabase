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
    const payload = {};

    Object.keys(editData).forEach((key) => {
      if (editData[key] !== "" && editData[key] !== undefined && editData[key] !== null) {
        payload[key] = editData[key];
      }
    });

    try {
      const { error } = await supabase
        .from("master_hr")
        .update(payload)
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
    <div className="p-2 md:p-4 lg:p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
      
        </div>

        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-5 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
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
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex flex-col space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Firm Name Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Firm Name</label>
            <div className="relative">
              <input
                type="text"
                list="masterFirmList"
                placeholder="Select/Search Firm"
                value={filterFirmName}
                onChange={(e) => setFilterFirmName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700 text-sm"
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
            <label className="text-xs font-medium text-gray-500 mb-1">Post (Designation)</label>
            <div className="relative">
              <input
                type="text"
                list="masterPostList"
                placeholder="Select/Search Post"
                value={filterPost}
                onChange={(e) => setFilterPost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700 text-sm"
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
            <label className="text-xs font-medium text-gray-500 mb-1">Employee Name</label>
            <div className="relative">
              <input
                type="text"
                list="masterNameList"
                placeholder="Select/Search Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700 text-sm"
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
            <label className="text-xs font-medium text-gray-500 mb-1">Global Search</label>
            <div className="relative h-full flex items-center">
              <input
                type="text"
                placeholder="Search all fields..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-700 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={16}
                className="absolute left-3 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setFilterFirmName("");
              setFilterPost("");
              setFilterName("");
              setSearchTerm("");
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* ================= DESKTOP TABLE ================= */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex justify-between items-center">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                Loading...
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <th className="px-4 py-3 text-left font-medium rounded-tl-xl">S.No</th>
                <th className="px-4 py-3 text-left font-medium">HOD Name</th>
                <th className="px-4 py-3 text-left font-medium">Firm Name</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-left font-medium">Mobile</th>
                <th className="px-4 py-3 text-left font-medium">Designation</th>
                <th className="px-4 py-3 text-left font-medium">Attendance</th>
                <th className="px-4 py-3 text-center font-medium rounded-tr-xl">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <p className="text-gray-500">Loading records...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8">
                    <p className="text-gray-500">No records found.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-purple-50 transition-all duration-150"
                  >
                    <td className="px-4 py-4 text-gray-500">{index + 1}</td>

                    {/* HOD Name */}
                    <td className="px-4 py-4">
                      {editId === item.id ? (
                        <input
                          name="hod_name"
                          value={editData.hod_name || ""}
                          onChange={handleEditChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <span className="font-medium">{renderField(item.hod_name)}</span>
                      )}
                    </td>

                    {/* Firm Name */}
                    <td className="px-4 py-4">
                      {editId === item.id ? (
                        <input
                          name="firm_name"
                          value={editData.firm_name || ""}
                          onChange={handleEditChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
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
                          className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                          {renderField(item.department)}
                        </span>
                      )}
                    </td>

                    {/* Employee Name */}
                    <td className="px-4 py-4">
                      {editId === item.id ? (
                        <input
                          name="employee_name"
                          value={editData.employee_name || ""}
                          onChange={handleEditChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        // <span>{item.employee_name || "-"}</span>
                        <span>
{renderField(item.employee_name)}
</span>
                      )}
                    </td>

                    {/* Mobile No */}
                    <td className="px-4 py-4">
                      {editId === item.id ? (
                        <input
                          name="mobile_no"
                          value={editData.mobile_no || ""}
                          onChange={handleEditChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <span>{renderField(item.mobile_no)}</span>
                      )}
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-4">
                      {editId === item.id ? (
                        <input
                          name="designation"
                          value={editData.designation || ""}
                          onChange={handleEditChange}
                          className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
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
                          className="border border-gray-300 rounded px-3 py-1 text-sm w-full focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half Day">Half Day</option>
                          <option value="Leave">Leave</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs ${item.attendance_type === "Present" ? "bg-green-100 text-green-700" :
                            item.attendance_type === "Absent" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
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
                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex items-center gap-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Master Data Records
            </h2>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full">
              {filteredData.length} records
            </span>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading records...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-400 text-xs">#{index + 1}</span>
                        <h3 className="font-semibold text-gray-900">
                          {item.employee_name || item.hod_name || "Unnamed"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${item.attendance_type === "Present" ? "bg-green-100 text-green-700" :
                            item.attendance_type === "Absent" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
                          }`}>
                          {item.attendance_type || "N/A"}
                        </span>
                        {item.department && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {item.department}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {editId === item.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdate(item.id)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="p-2 bg-gray-100 text-gray-600 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 bg-purple-100 text-purple-600 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">HOD Name</p>
                      {editId === item.id ? (
                        <input
                          name="hod_name"
                          value={editData.hod_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.hod_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Firm Name</p>
                      {editId === item.id ? (
                        <input
                          name="firm_name"
                          value={editData.firm_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.firm_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Department</p>
                      {editId === item.id ? (
                        <input
                          name="department"
                          value={editData.department || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.department || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Employee Name</p>
                      {editId === item.id ? (
                        <input
                          name="employee_name"
                          value={editData.employee_name || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.employee_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Mobile No</p>
                      {editId === item.id ? (
                        <input
                          name="mobile_no"
                          value={editData.mobile_no || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.mobile_no || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Designation</p>
                      {editId === item.id ? (
                        <input
                          name="designation"
                          value={editData.designation || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.designation || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Social Site</p>
                      {editId === item.id ? (
                        <input
                          name="social_site"
                          value={editData.social_site || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.social_site || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Family Relationship</p>
                      {editId === item.id ? (
                        <input
                          name="family_relationship"
                          value={editData.family_relationship || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="text-sm font-medium">{item.family_relationship || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Call Tracker Status</p>
                      {editId === item.id ? (
                        <select
                          name="call_tracker_status"
                          value={editData.call_tracker_status || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="">Select</option>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Pending">Pending</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium">{item.call_tracker_status || "-"}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Attendance Type</p>
                      {editId === item.id ? (
                        <select
                          name="attendance_type"
                          value={editData.attendance_type || ""}
                          onChange={handleEditChange}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="">Select</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half Day">Half Day</option>
                          <option value="Leave">Leave</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium">{item.attendance_type || "-"}</p>
                      )}
                    </div>

                    {editId === item.id && (
                      <>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Created At</p>
                          <p className="text-sm text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 sticky top-0">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white">Add New Record</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    Fill in all the details below
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white hover:text-gray-200"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HOD Name *
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="hod_name"
                    placeholder="Enter HOD name"
                    onChange={handleChange}
                    value={formData.hod_name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firm Name *
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="firm_name"
                    placeholder="Enter firm name"
                    onChange={handleChange}
                    value={formData.firm_name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="department"
                    placeholder="Enter department"
                    onChange={handleChange}
                    value={formData.department}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Social Site
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="social_site"
                    placeholder="LinkedIn, Facebook, etc."
                    onChange={handleChange}
                    value={formData.social_site}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Call Tracker Status
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family Relationship
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="family_relationship"
                    placeholder="e.g., Father, Mother, etc."
                    onChange={handleChange}
                    value={formData.family_relationship}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance Type *
                  </label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Name *
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="employee_name"
                    placeholder="Enter employee name"
                    onChange={handleChange}
                    value={formData.employee_name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobile_no"
                    placeholder="Enter mobile number"
                    maxLength={15}
                    inputMode="numeric"
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    onChange={handleChange}
                    value={formData.mobile_no}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation *
                  </label>
                  <input
                    className="border border-gray-300 rounded-lg px-4 py-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    name="designation"
                    placeholder="Enter designation"
                    onChange={handleChange}
                    value={formData.designation}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
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