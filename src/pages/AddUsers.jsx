"use client";
import { useEffect, useState } from "react";
import { Search, X, XCircle, UserPlus, Users, Key, Shield, CheckCircle, Smartphone } from "lucide-react";
import supabase from "../utils/supabase";

export default function UserRegistration() {
  // ========== TAB STATE ==========
  const [activeTab, setActiveTab] = useState("hr_users"); // "hr_users" | "employee_users"

  // ========== HR USERS STATE (`users_hr` table) ==========
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [masterData, setMasterData] = useState([]);
  const [masterForm, setMasterForm] = useState({
    department: "",
    given_by: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndentNo, setFilterIndentNo] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [filterName, setFilterName] = useState("");

  const [pageOptions, setPageOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pageAccess, setPageAccess] = useState([]);
  const [openPageBox, setOpenPageBox] = useState(false);

  const [formData, setFormData] = useState({
    department: "",
    given_by: "",
    doer_name: "",
    email_id: "",
    wa_number: "",
    password: "",
    role: "USER",
    page: "",
  });

  const [editData, setEditData] = useState(formData);

  // ========== USERS EMPLOYEE STATE (`users_employee` table) ==========
  const [employeeUsers, setEmployeeUsers] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [openEmpModal, setOpenEmpModal] = useState(false);
  const [editEmpId, setEditEmpId] = useState(null);
  const [empSearchTerm, setEmpSearchTerm] = useState("");
  const [joiningEmployees, setJoiningEmployees] = useState([]);

  const [empFormData, setEmpFormData] = useState({
    employee_id: "",
    emp_name: "",
    password: "",
    access: "True",
    field: "",
  });

  const [editEmpData, setEditEmpData] = useState({
    employee_id: "",
    emp_name: "",
    password: "",
    access: "",
    field: "",
  });

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

  const togglePage = (page) => {
    setPageAccess((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page],
    );
  };

  const toggleAllPages = () => {
    if (pageAccess.length === pageOptions.length) {
      setPageAccess([]);
    } else {
      setPageAccess([...pageOptions]);
    }
  };

  // ================= FETCH FUNCTIONS =================
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users_hr")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMasterData = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMasterData(data || []);
      setLoading(false);

      const departments = [...new Set(data.map((item) => item.department))];
      setPageOptions(departments.sort());
    } catch (error) {
      console.error("Error fetching master data:", error);
      setLoading(false);
    }
  };

  const fetchEmployeeUsers = async () => {
    try {
      setEmpLoading(true);
      const { data, error } = await supabase
        .from("users_employee")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      setEmployeeUsers(data || []);
    } catch (error) {
      console.error("Error fetching employee users:", error);
    } finally {
      setEmpLoading(false);
    }
  };

  const fetchJoiningEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("joining")
        .select("id, rbp_joining_id, name_as_per_aadhar, department")
        .order("name_as_per_aadhar", { ascending: true });
      if (!error && data) {
        setJoiningEmployees(data || []);
      }
    } catch (err) {
      console.error("Error fetching joining employees:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMasterData();
    fetchEmployeeUsers();
    fetchJoiningEmployees();
  }, []);

  // ================= HR USERS HANDLERS =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "wa_number") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length <= 10) {
        setFormData((prev) => ({
          ...prev,
          wa_number: digitsOnly,
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

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setEditData(user);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username: formData.doer_name,
      password: formData.password,
      name: formData.doer_name,
      department: formData.department,
      given_by: formData.given_by,
      email_id: formData.email_id,
      wa_number: formData.wa_number,
      role: formData.role,
      page:
        pageAccess.length === pageOptions.length ? "ALL" : pageAccess.join(","),
      access: true,
    };

    try {
      const { error } = await supabase.from("users_hr").insert([payload]);
      if (error) throw error;

      setOpen(false);
      setFormData({
        department: "",
        given_by: "",
        doer_name: "",
        email_id: "",
        wa_number: "",
        password: "",
        role: "USER",
        page: "",
      });

      setPageAccess([]);
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      if (error.code === "23505") {
        alert("⚠️ Username already exists! Please use a different username.");
      } else {
        alert(error.message || "Something went wrong!");
      }
    }
  };

  const handleUpdate = async (id) => {
    const payload = {};
    Object.keys(editData).forEach((key) => {
      if (editData[key] !== "" && editData[key] !== undefined) {
        if (key === "doer_name") {
          payload.username = editData[key];
          payload.name = editData[key];
        } else {
          payload[key] = editData[key];
        }
      }
    });

    try {
      const { error } = await supabase
        .from("users_hr")
        .update(payload)
        .eq("id", id);

      if (error) throw error;
      setEditUserId(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      const { error } = await supabase.from("users_hr").delete().eq("id", id);
      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  // ================= USERS EMPLOYEE HANDLERS =================
  const handleEmpChange = (e) => {
    const { name, value } = e.target;
    setEmpFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectJoiningEmp = (e) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;
    const emp = joiningEmployees.find(
      (j) => (j.rbp_joining_id || j.id?.toString()) === selectedCode
    );
    if (emp) {
      setEmpFormData((prev) => ({
        ...prev,
        employee_id: emp.rbp_joining_id || emp.id?.toString() || "",
        emp_name: emp.name_as_per_aadhar || "",
        field: emp.department || prev.field || "",
      }));
    }
  };

  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    if (!empFormData.employee_id || !empFormData.emp_name) {
      alert("Employee ID and Employee Name are required!");
      return;
    }

    const payload = {
      employee_id: empFormData.employee_id.trim(),
      emp_name: empFormData.emp_name.trim(),
      password: empFormData.password,
      access: empFormData.access || "True",
      field: empFormData.field || "",
      timestamp: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("users_employee").insert([payload]);
      if (error) throw error;

      alert("Employee user registered successfully!");
      setOpenEmpModal(false);
      setEmpFormData({
        employee_id: "",
        emp_name: "",
        password: "",
        access: "True",
        field: "",
      });
      fetchEmployeeUsers();
    } catch (error) {
      console.error("Error adding employee user:", error);
      if (error.code === "23505") {
        alert("⚠️ Employee ID already exists! Please use a unique Employee ID.");
      } else {
        alert(error.message || "Failed to create employee user!");
      }
    }
  };

  const handleEmpEdit = (empUser) => {
    setEditEmpId(empUser.id);
    setEditEmpData(empUser);
  };

  const handleEmpEditChange = (e) => {
    setEditEmpData({ ...editEmpData, [e.target.name]: e.target.value });
  };

  const handleEmpUpdate = async (id) => {
    const payload = {
      employee_id: editEmpData.employee_id,
      emp_name: editEmpData.emp_name,
      password: editEmpData.password,
      access: editEmpData.access,
      field: editEmpData.field,
      timestamp: new Date().toISOString(),
    };

    try {
      const { error } = await supabase
        .from("users_employee")
        .update(payload)
        .eq("id", id);

      if (error) throw error;

      setEditEmpId(null);
      fetchEmployeeUsers();
    } catch (error) {
      console.error("Error updating employee user:", error);
      alert(error.message || "Failed to update employee user!");
    }
  };

  const handleEmpDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this employee user?")) return;

    try {
      const { error } = await supabase.from("users_employee").delete().eq("id", id);
      if (error) throw error;
      fetchEmployeeUsers();
    } catch (error) {
      console.error("Error deleting employee user:", error);
      alert(error.message || "Failed to delete employee user!");
    }
  };

  // ================= FILTERS =================
  const uniqueIndents = Array.from(new Set(users.map((u) => u.id).filter(Boolean)));
  const uniquePosts = Array.from(new Set(users.map((u) => u.role).filter(Boolean)));
  const uniqueNames = Array.from(new Set(users.map((u) => u.username).filter(Boolean)));

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchTerm === "" ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent =
      filterIndentNo === "" || u.id?.toString() === filterIndentNo?.toString();
    const matchesPost = filterPost === "" || u.role === filterPost;
    const matchesName = filterName === "" || u.username === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  const filteredEmpUsers = employeeUsers.filter((u) => {
    const term = empSearchTerm.toLowerCase();
    return (
      empSearchTerm === "" ||
      u.emp_name?.toLowerCase().includes(term) ||
      u.employee_id?.toLowerCase().includes(term) ||
      u.field?.toLowerCase().includes(term) ||
      u.access?.toLowerCase().includes(term)
    );
  });

  // ================= UI =================
  return (
    <div className="p-4 md:p-6 space-y-6 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#065F46] to-[#0F766E] tracking-tight">
            User Registration & Access Management
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
            Manage HR App Credentials (`users_hr`) and Employee App Accounts (`users_employee`)
          </p>
        </div>

        <div className="flex gap-3">
          {activeTab === "hr_users" ? (
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
              Add New HR User
            </button>
          ) : (
            <button
              onClick={() => setOpenEmpModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-emerald-950/10 hover:shadow-lg transition-all duration-200"
            >
              <UserPlus className="h-5 w-5" />
              Add Employee User
            </button>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="flex border-b border-slate-200 gap-2 font-bold text-sm bg-white rounded-t-2xl px-3 pt-2 border border-slate-200/60 shadow-sm">
        <button
          onClick={() => setActiveTab("hr_users")}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition-all rounded-t-xl ${
            activeTab === "hr_users"
              ? "border-[#0F766E] text-[#0F766E] bg-emerald-50/60"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span>👥</span>
          <span>HR App Users (users_hr)</span>
          <span className="bg-emerald-100 text-[#0F766E] text-xs px-2 py-0.5 rounded-full ml-1 font-extrabold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("employee_users")}
          className={`py-3 px-5 border-b-2 flex items-center gap-2 transition-all rounded-t-xl ${
            activeTab === "employee_users"
              ? "border-[#0F766E] text-[#0F766E] bg-emerald-50/60"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span>🪪</span>
          <span>Employee Users (users_employee)</span>
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full ml-1 font-extrabold">
            {employeeUsers.length}
          </span>
        </button>
      </div>

      {/* ================= TAB 1: HR USERS (users_hr) ================= */}
      {activeTab === "hr_users" && (
        <div className="space-y-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Total HR Users
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">{users.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-[#0F766E]">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Admin Role
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {users.filter((u) => u.role === "ADMIN").length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    User Role
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {users.filter((u) => u.role === "USER").length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-[#065F46]">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Active Departments
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {pageOptions.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Filters Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Indent Number (ID)
                </label>
                <input
                  type="text"
                  list="auIndentList"
                  placeholder="Select/Search ID"
                  value={filterIndentNo}
                  onChange={(e) => setFilterIndentNo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                />
                <datalist id="auIndentList">
                  {uniqueIndents.map((indent) => (
                    <option key={indent} value={indent} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Filter by Role
                </label>
                <input
                  type="text"
                  list="auPostList"
                  placeholder="Select/Search Role"
                  value={filterPost}
                  onChange={(e) => setFilterPost(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                />
                <datalist id="auPostList">
                  {uniquePosts.map((post) => (
                    <option key={post} value={post} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-450 mb-1.5">
                  Filter by Username
                </label>
                <input
                  type="text"
                  list="auNameList"
                  placeholder="Select/Search Name"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-355"
                />
                <datalist id="auNameList">
                  {uniqueNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={() => {
                    setFilterIndentNo("");
                    setFilterPost("");
                    setFilterName("");
                    setSearchTerm("");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <X size={16} /> Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hidden md:block">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                HR User Accounts Directory
              </h2>
              <span className="bg-emerald-50 border border-emerald-100 text-[#0F766E] text-xs font-bold px-3 py-1 rounded-xl">
                {filteredUsers.length} Users
              </span>
            </div>

            <div className="max-h-[400px] overflow-auto border-t border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="px-6 py-3.5 bg-slate-100">User Info</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Password</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Contact Details</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Role</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Department</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Page Access</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#0F766E]/10 border border-[#0F766E]/20 flex items-center justify-center font-bold text-[#0F766E]">
                            {u.username ? u.username.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            {editUserId === u.id ? (
                              <input
                                name="doer_name"
                                value={editData.doer_name || editData.username || ""}
                                onChange={handleEditChange}
                                className="px-2 py-1 rounded-lg border border-slate-200 text-sm font-semibold"
                              />
                            ) : (
                              <span className="font-bold text-slate-800 block">
                                {u.username}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              ID: #{u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center font-mono">
                        {editUserId === u.id ? (
                          <input
                            name="password"
                            value={editData.password || ""}
                            onChange={handleEditChange}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-sm font-mono text-center"
                          />
                        ) : (
                          <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600">
                            {u.password}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center text-xs">
                        {editUserId === u.id ? (
                          <div className="space-y-1">
                            <input
                              name="email_id"
                              value={editData.email_id || ""}
                              onChange={handleEditChange}
                              placeholder="Email"
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs w-full"
                            />
                            <input
                              name="wa_number"
                              value={editData.wa_number || ""}
                              onChange={handleEditChange}
                              placeholder="WhatsApp"
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs w-full"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-700">{u.email_id || "-"}</div>
                            <div className="text-slate-400 text-[11px]">{u.wa_number || "-"}</div>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {editUserId === u.id ? (
                          <select
                            name="role"
                            value={editData.role}
                            onChange={handleEditChange}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              u.role === "ADMIN"
                                ? "bg-emerald-50 text-[#0F766E] border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center font-semibold text-xs">
                        {editUserId === u.id ? (
                          <input
                            name="department"
                            value={editData.department || ""}
                            onChange={handleEditChange}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-xs text-center"
                          />
                        ) : (
                          u.department || "-"
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {editUserId === u.id ? (
                          <input
                            name="page"
                            value={editData.page || ""}
                            onChange={handleEditChange}
                            className="px-2 py-1 rounded-lg border border-slate-200 text-xs text-center"
                          />
                        ) : (
                          <span className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-xs font-semibold text-slate-600 truncate max-w-[150px] inline-block">
                            {u.page || "Not set"}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        {editUserId === u.id ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleUpdate(u.id)}
                              className="bg-gradient-to-r from-[#065F46] to-[#0F766E] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditUserId(null)}
                              className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(u)}
                              className="bg-emerald-50 text-[#0F766E] border border-emerald-250/60 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="bg-red-50 text-red-600 border border-red-200/60 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: EMPLOYEE USERS (users_employee) ================= */}
      {activeTab === "employee_users" && (
        <div className="space-y-6">
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Total Employee Users
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {employeeUsers.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                  <Smartphone className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Access Granted
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {
                      employeeUsers.filter(
                        (u) =>
                          u.access?.toString().toLowerCase() === "true" ||
                          u.access?.toString().toLowerCase() === "yes" ||
                          u.access?.toString().toLowerCase() === "full"
                      ).length
                    }
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 text-[#0F766E]">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Fields / Departments
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {[...new Set(employeeUsers.map((u) => u.field).filter(Boolean))].length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Joining System Sync
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {joiningEmployees.length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                  <Shield className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Employee Name, ID, Field..."
                value={empSearchTerm}
                onChange={(e) => setEmpSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] text-sm bg-slate-50"
              />
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Showing {filteredEmpUsers.length} of {employeeUsers.length} employee accounts
            </div>
          </div>

          {/* DESKTOP TABLE VIEW FOR `users_employee` */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hidden md:block">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">
                Employee Users Directory (`users_employee`)
              </h2>
              <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-xl">
                {filteredEmpUsers.length} Accounts
              </span>
            </div>

            <div className="max-h-[400px] overflow-auto border-t border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="px-6 py-3.5 bg-slate-100">ID</th>
                    <th className="px-4 py-3.5 bg-slate-100">Employee ID</th>
                    <th className="px-4 py-3.5 bg-slate-100">Employee Name</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Password</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Field / Dept</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Access Status</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Timestamp</th>
                    <th className="px-4 py-3.5 text-center bg-slate-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {empLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        Loading employee users...
                      </td>
                    </tr>
                  ) : filteredEmpUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400">
                        No employee users found. Click "+ Add Employee User" to register one.
                      </td>
                    </tr>
                  ) : (
                    filteredEmpUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
                          #{u.id}
                        </td>

                        <td className="px-4 py-4 font-bold text-indigo-700">
                          {editEmpId === u.id ? (
                            <input
                              name="employee_id"
                              value={editEmpData.employee_id || ""}
                              onChange={handleEmpEditChange}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold w-full"
                            />
                          ) : (
                            u.employee_id || "-"
                          )}
                        </td>

                        <td className="px-4 py-4 font-semibold text-slate-800">
                          {editEmpId === u.id ? (
                            <input
                              name="emp_name"
                              value={editEmpData.emp_name || ""}
                              onChange={handleEmpEditChange}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold w-full"
                            />
                          ) : (
                            u.emp_name || "-"
                          )}
                        </td>

                        <td className="px-4 py-4 text-center font-mono">
                          {editEmpId === u.id ? (
                            <input
                              name="password"
                              value={editEmpData.password || ""}
                              onChange={handleEmpEditChange}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-center w-full"
                            />
                          ) : (
                            <span className="bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600">
                              {u.password || "-"}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center text-xs font-semibold">
                          {editEmpId === u.id ? (
                            <input
                              name="field"
                              value={editEmpData.field || ""}
                              onChange={handleEmpEditChange}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs text-center w-full"
                            />
                          ) : (
                            <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-slate-700">
                              {u.field || "-"}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center">
                          {editEmpId === u.id ? (
                            <select
                              name="access"
                              value={editEmpData.access || "True"}
                              onChange={handleEmpEditChange}
                              className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold"
                            >
                              <option value="True">True / Granted</option>
                              <option value="False">False / Denied</option>
                              <option value="Full">Full Access</option>
                              <option value="Read">Read Only</option>
                            </select>
                          ) : (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                u.access?.toString().toLowerCase() === "true" ||
                                u.access?.toString().toLowerCase() === "yes" ||
                                u.access?.toString().toLowerCase() === "full"
                                  ? "bg-emerald-50 text-[#0F766E] border border-emerald-200"
                                  : "bg-red-50 text-red-600 border border-red-200"
                              }`}
                            >
                              {u.access || "True"}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-center text-[11px] text-slate-400">
                          {u.timestamp ? new Date(u.timestamp).toLocaleString() : "-"}
                        </td>

                        <td className="px-4 py-4 text-center">
                          {editEmpId === u.id ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEmpUpdate(u.id)}
                                className="bg-gradient-to-r from-[#065F46] to-[#0F766E] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditEmpId(null)}
                                className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleEmpEdit(u)}
                                className="bg-emerald-50 text-[#0F766E] border border-emerald-250/60 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleEmpDelete(u.id)}
                                className="bg-red-50 text-red-600 border border-red-200/60 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                              >
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
          </div>

          {/* MOBILE CARD VIEW FOR `users_employee` */}
          <div className="md:hidden space-y-4">
            {filteredEmpUsers.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800">{u.emp_name}</h3>
                    <span className="text-xs font-bold text-indigo-600">ID: {u.employee_id}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold border ${
                      u.access?.toString().toLowerCase() === "true"
                        ? "bg-emerald-50 border-emerald-100 text-[#0F766E]"
                        : "bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    Access: {u.access || "True"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Password:</span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded font-bold">
                      {u.password}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Field / Dept:</span>
                    <span className="font-semibold">{u.field || "-"}</span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleEmpEdit(u)}
                    className="px-3 py-1 bg-emerald-50 text-[#0F766E] text-xs font-bold rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleEmpDelete(u.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD HR USER (`users_hr`) ================= */}
      {open && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[#065F46] to-[#0F766E] p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Add New HR User</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-white hover:text-emerald-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mt-1">
                Create system login for HR / Admin staff
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                  Username
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm"
                  name="doer_name"
                  placeholder="Enter username"
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                  Email Address
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm"
                  name="email_id"
                  type="email"
                  placeholder="user@example.com"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="wa_number"
                    placeholder="10 digit number"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm"
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Password
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm"
                    name="password"
                    placeholder="Enter password"
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Department
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 text-sm font-semibold"
                    name="department"
                    onChange={handleChange}
                    value={formData.department}
                  >
                    <option value="">Select Department</option>
                    {Array.from(new Set(masterData.map((item) => item.department))).map(
                      (dept, index) => (
                        <option key={index} value={dept}>
                          {dept}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                    Given By
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 text-sm font-semibold"
                    name="given_by"
                    onChange={handleChange}
                    value={formData.given_by}
                  >
                    <option value="">Select Given By</option>
                    {Array.from(new Set(masterData.map((item) => item.given_by))).map(
                      (given, index) => (
                        <option key={index} value={given}>
                          {given}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-455 mb-1.5">
                  User Role
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 text-sm font-semibold"
                  name="role"
                  onChange={handleChange}
                >
                  <option value="USER">Regular User</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] text-white rounded-xl font-bold shadow-md text-sm"
                >
                  Create User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD EMPLOYEE USER (`users_employee`) ================= */}
      {openEmpModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-[#065F46] to-[#0F766E] p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Add Employee User Account</h2>
                <button
                  type="button"
                  onClick={() => setOpenEmpModal(false)}
                  className="text-white hover:text-emerald-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider mt-1">
                Registers new entry in `users_employee` table
              </p>
            </div>

            <form onSubmit={handleEmpSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Select from existing employees */}
              {joiningEmployees.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    ⚡ Quick Select Employee (Joining Table)
                  </label>
                  <select
                    onChange={handleSelectJoiningEmp}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white"
                  >
                    <option value="">-- Choose Employee to Auto-fill --</option>
                    {joiningEmployees.map((j) => (
                      <option key={j.id} value={j.rbp_joining_id || j.id?.toString()}>
                        {j.name_as_per_aadhar} ({j.rbp_joining_id || `ID:${j.id}`}) - {j.department || "No Dept"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Employee ID (Unique Key) *
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm font-semibold"
                  name="employee_id"
                  value={empFormData.employee_id}
                  placeholder="e.g. EMP001 or RBP001"
                  onChange={handleEmpChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Employee Name *
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm"
                  name="emp_name"
                  value={empFormData.emp_name}
                  placeholder="Enter full employee name"
                  onChange={handleEmpChange}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm font-mono"
                  name="password"
                  value={empFormData.password}
                  placeholder="Enter app login password"
                  onChange={handleEmpChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Field / Department
                  </label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm"
                    name="field"
                    value={empFormData.field}
                    placeholder="e.g. Field / Office"
                    onChange={handleEmpChange}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Access Status
                  </label>
                  <select
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 text-sm font-semibold"
                    name="access"
                    value={empFormData.access}
                    onChange={handleEmpChange}
                  >
                    <option value="True">True (Granted)</option>
                    <option value="False">False (Denied)</option>
                    <option value="Full">Full Access</option>
                    <option value="Read">Read Only</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenEmpModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] text-white rounded-xl font-bold shadow-md text-sm"
                >
                  Save Employee Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
