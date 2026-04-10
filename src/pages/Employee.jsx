import React, { useEffect, useState } from "react";
import { Filter, Search, Clock, CheckCircle, ImageIcon, X } from "lucide-react";
import useDataStore from "../store/dataStore";
import supabase from "../utils/supabase";

const Employee = () => {
  const [activeTab, setActiveTab] = useState("joining");
  const [searchTerm, setSearchTerm] = useState("");
  const [joiningData, setJoiningData] = useState([]);
  const [leavingData, setLeavingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "joining" | "leaving"

  const [editingLeavingRow, setEditingLeavingRow] = useState(null);
  const [editLeavingData, setEditLeavingData] = useState({});

  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  const [filterIndentNo, setFilterIndentNo] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [filterName, setFilterName] = useState("");

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if not a valid date
    }

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const renderLeavingCell = (value, field, index) => {
    // agar edit mode me hai
    if (editingLeavingRow === index) {
      return (
        <input
          value={editLeavingData[field] || ""}
          onChange={(e) => handleLeavingChange(field, e.target.value)}
          className="border px-2 py-1 rounded w-full text-xs"
        />
      );
    }

    // normal view mode
    return value || "-";
  };

  const handleLeavingEditClick = (item, index) => {
    setEditingLeavingRow(index);
    setEditLeavingData({ ...item });
    setModalType("leaving");
    setShowModal(true);
  };

  const handleLeavingChange = (field, value) => {
    setEditLeavingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLeavingSave = async () => {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("joining")
        .update({
          name_as_per_aadhar: editLeavingData.name,
          designation: editLeavingData.designation,
          salary: editLeavingData.salary,
          mobile_number: editLeavingData.mobileNo,
          father_name: editLeavingData.fatherName,
          leaving_date: editLeavingData.dateOfLeaving,
          leaving_reason: editLeavingData.reasonOfLeaving,
          status: "Inactive",
        })
        .eq("rbp_joining_id", editLeavingData.employeeId);

      if (error) throw error;

      setEditingLeavingRow(null);
      setEditLeavingData({});
      fetchLeavingData();
    } catch (err) {
      console.error("Error saving leaving data:", err);
      toast.error("Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeavingCancel = () => {
    setEditingLeavingRow(null);
    setEditLeavingData({});
  };

  const handleEditClick = (item, index) => {
    setEditingRow(index);
    setEditData({ ...item });
    setModalType("joining");
    setShowModal(true);
  };

  const handleChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      const { error } = await supabase
        .from("joining")
        .update({
          name_as_per_aadhar: editData.nameAsPerAadhar,
          designation: editData.designation,
          salary: editData.salary,
          mobile_number: editData.mobileNumber,
          father_name: editData.fatherName,
        })
        .eq("rbp_joining_id", editData.employeeId);

      if (error) throw error;

      setEditingRow(null);
      fetchJoiningData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData({});
  };

  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("joining")
        .select("*")
        .eq("status", "Active"); // same filter logic

      if (error) throw error;

      const processedData = data.map((row) => ({
        employeeId: row.rbp_joining_id || "",
        status: row.status || "",
        firmName: row.firm_name || "",
        nameAsPerAadhar: row.name_as_per_aadhar || "",
        bloodGroup: row.blood_group || "",
        fatherName: row.father_name || "",
        dateOfJoining: row.date_of_joining || "",
        workLocation: row.work_location || "",
        designation: row.designation || "",
        salary: row.salary || "",

        aadharFrontPhoto: row.aadhar_front_photo || "",
        aadharBackPhoto: row.aadhar_back_photo || "",
        panCard: row.pan_card || "",

        relationshipWithFamily: row.family_relationship || "",
        currentAddress: row.current_address || "",
        aadharAddress: row.aadhar_address || "",

        dateOfBirth: row.date_of_birth || "",
        gender: row.gender || "",

        mobileNumber: row.mobile_number || "",
        familyNumber: row.family_number || "",

        pastPfId: row.past_pf_id || "",
        pastEsicNumber: row.past_esic_number || "",

        currentBankAcNo: row.bank_account_number || "",
        ifscCode: row.ifsc_code || "",
        branchName: row.branch_name || "",

        personalEmail: row.personal_email || "",

        companyProvidesPf: row.company_pf_provided ? "Yes" : "No",
        companyProvidesEsic: row.company_esic_provided ? "Yes" : "No",
        companyProvidesEmail: row.company_mail_provided ? "Yes" : "No",

        attendanceType: row.attendance_type || "",

        validateCandidate: row.candidate_validated ? "Yes" : "No",
        issueGmailId: row.gmail_id_issued ? "Yes" : "No",
        issueJoiningLetter: row.joining_letter_issued ? "Yes" : "No",

        attendanceRegistration: row.attendance_registration ? "Yes" : "No",
      }));

      setJoiningData(processedData);
    } catch (error) {
      console.error("Error fetching joining data:", error);
      setError(error.message);
      toast.error(`Failed to load joining data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchLeavingData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("joining")
        .select("*")
        .eq("status", "Inactive"); // same logic

      if (error) throw error;

      const processedData = data.map((row) => ({
        employeeId: row.rbp_joining_id || "",
        status: row.status || "",
        name: row.name_as_per_aadhar || "",
        dateOfJoining: row.date_of_joining || "",
        dateOfLeaving: row.leaving_date || "",
        mobileNo: row.mobile_number || "",
        fatherName: row.father_name || "",
        designation: row.designation || "",
        salary: row.salary || "",
        reasonOfLeaving: row.leaving_reason || "",
      }));

      setLeavingData(processedData);
    } catch (error) {
      console.error("Error fetching leaving data:", error);
      setError(error.message);
      toast.error(`Failed to load leaving data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };
  useEffect(() => {
    fetchJoiningData();
    fetchLeavingData();
  }, []);

  const uniqueIndents = Array.from(new Set([...joiningData, ...leavingData].map(i => i.employeeId).filter(Boolean)));
  const uniquePosts = Array.from(new Set([...joiningData, ...leavingData].map(i => i.designation).filter(Boolean)));
  const uniqueNames = Array.from(new Set([...joiningData.map(i => i.nameAsPerAadhar), ...leavingData.map(i => i.name)].filter(Boolean)));

  const filteredJoiningData = joiningData.filter((item) => {
    const matchesSearch = searchTerm === "" || 
      item.nameAsPerAadhar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobileNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.employeeId === filterIndentNo;
    const matchesPost = filterPost === "" || item.designation === filterPost;
    const matchesName = filterName === "" || item.nameAsPerAadhar === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  const filteredLeavingData = leavingData.filter((item) => {
    const matchesSearch = searchTerm === "" || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.employeeId === filterIndentNo;
    const matchesPost = filterPost === "" || item.designation === filterPost;
    const matchesName = filterName === "" || item.name === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold ">Employee</h1>
      </div>

      {/* Filter and Search - This section won't scroll */}
      {/* Dynamic Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Indent Number Filter (Mapped to Emp ID for this page) */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Indent Number</label>
            <div className="relative">
              <input
                type="text"
                list="empIndentList"
                placeholder="Select/Search Indent/ID"
                value={filterIndentNo}
                onChange={(e) => setFilterIndentNo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="empIndentList">
                {uniqueIndents.map(indent => (
                  <option key={indent} value={indent} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Post Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Post</label>
            <div className="relative">
              <input
                type="text"
                list="empPostList"
                placeholder="Select/Search Post"
                value={filterPost}
                onChange={(e) => setFilterPost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="empPostList">
                {uniquePosts.map(post => (
                  <option key={post} value={post} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Name As Per Aadhaar Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Name As Per Aadhaar</label>
            <div className="relative">
              <input
                type="text"
                list="empNameList"
                placeholder="Select/Search Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="empNameList">
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
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
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
        <div className="flex justify-end pt-2 mt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setFilterIndentNo("");
              setFilterPost("");
              setFilterName("");
              setSearchTerm("");
            }}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Tabs - This section won't scroll */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300 ">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "joining"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("joining")}
            >
              <CheckCircle size={16} className="inline mr-2" />
              Active ({filteredJoiningData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "leaving"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("leaving")}
            >
              <Clock size={16} className="inline mr-2" />
              In-Active ({filteredLeavingData.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "joining" && (
            <div className="overflow-x-auto max-[500px] overflow-y-auto">
              <div className="max-h-96 overflow-y-auto">
                {" "}
                {/* Added scroll container */}
                <table className="min-w-full divide-y divide-white">
                  <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Firm Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name As Per Aadhaar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blood Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Father Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Of Joining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Work Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aadhaar Frontside photo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aadhaar Backside photo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pan Card
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Relationship with family Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address as per aadhaar card
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date of birth aadhaar card
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobile Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Family Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Past PF Id No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Past Esic Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Bank Ac No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IFSC Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personal Email-Id
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Does Company Provide PF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Does Company Provide ESIC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Does Company Provide Mail-Id
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validate the Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Gmail id
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Joining letter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Registration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white ">
                    {tableLoading ? (
                      <tr>
                        <td colSpan="34" className="px-6 py-12 text-center">
                          <div className="flex justify-center flex-col items-center">
                            <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                            <span className="text-gray-600 text-sm">
                              Loading employees...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="34" className="px-6 py-12 text-center">
                          <p className="text-red-500">Error: {error}</p>
                          <button
                            onClick={fetchJoiningData}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Retry
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredJoiningData.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-white hover:bg-opacity-5"
                        >
                          <td className="px-6 py-4 text-sm">
                            {editingRow === index ? (
                              <div className="flex space-x-2">
                                {/* SAVE BUTTON */}
                                <button
                                  onClick={handleSave}
                                  disabled={submitting}
                                  className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-green-700 text-xs flex items-center"
                                >
                                  {submitting ? (
                                    <>
                                      <svg
                                        className="animate-spin h-3 w-3 mr-1"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="white"
                                          strokeWidth="4"
                                          fill="none"
                                        />
                                      </svg>
                                      Save
                                    </>
                                  ) : (
                                    "Save"
                                  )}
                                </button>

                                {/* CANCEL BUTTON */}
                                <button
                                  onClick={handleCancel}
                                  disabled={submitting}
                                  className="px-3 py-1 text-white bg-gray-600 rounded-md hover:bg-gray-700 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditClick(item, index)}
                                className="px-3 py-1 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-xs"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.employeeId || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.status || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.firmName || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.nameAsPerAadhar || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.bloodGroup || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.fatherName || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.dateOfJoining
                              ? formatDOB(item.dateOfJoining)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.workLocation}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.designation || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.salary || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.aadharFrontPhoto ? (
                              <a
                                href={item.aadharFrontPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <ImageIcon size={20} />
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.aadharBackPhoto ? (
                              <a
                                href={item.aadharBackPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <ImageIcon size={20} />
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.panCard ? (
                              <a
                                href={item.panCard}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <ImageIcon size={20} />
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.relationshipWithFamily}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.currentAddress}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.aadharAddress}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.dateOfBirth
                              ? formatDOB(item.dateOfBirth)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.gender}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.mobileNumber || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.familyNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.pastPfId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.pastEsicNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.currentBankAcNo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.ifscCode}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.branchName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.personalEmail}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.companyProvidesPf}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.companyProvidesEsic}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.companyProvidesEmail}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.attendanceType}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.validateCandidate}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.issueGmailId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.issueJoiningLetter}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.attendanceRegistration}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {!tableLoading && filteredJoiningData.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 ">
                      No joining employees found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "leaving" && (
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-white">
                  <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Of Joining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Of Leaving
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobile Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Father Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason Of Leaving
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white">
                    {tableLoading ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-center">
                          <div className="flex justify-center flex-col items-center">
                            <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                            <span className="text-gray-600 text-sm">
                              Loading leaving employees...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-center">
                          <p className="text-red-500">Error: {error}</p>
                          <button
                            onClick={fetchLeavingData}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Retry
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredLeavingData.map((item, index) => (
                        <tr key={index} className="hover:bg-white">
                          <td className="px-6 py-4 text-sm">
                            {editingLeavingRow === index ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleLeavingSave}
                                  disabled={submitting}
                                  className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-green-700 text-xs flex items-center"
                                >
                                  {submitting ? (
                                    <>
                                      <svg
                                        className="animate-spin h-3 w-3 mr-1"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="white"
                                          strokeWidth="4"
                                          fill="none"
                                        />
                                      </svg>
                                      Save
                                    </>
                                  ) : (
                                    "Save"
                                  )}
                                </button>
                                <button
                                  onClick={handleLeavingCancel}
                                  disabled={submitting}
                                  className="px-3 py-1 text-white bg-gray-600 rounded-md hover:bg-gray-700 text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  handleLeavingEditClick(item, index)
                                }
                                className="px-3 py-1 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-xs"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderLeavingCell(
                              item.employeeId,
                              "employeeId",
                              index,
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderLeavingCell(item.name, "name", index)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.dateOfJoining
                              ? formatDOB(item.dateOfJoining)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderLeavingCell(
                              item.dateOfLeaving
                                ? formatDOB(item.dateOfLeaving)
                                : "-",
                              "dateOfLeaving",
                              index,
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderLeavingCell(
                              item.mobileNo,
                              "mobileNo",
                              index,
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderLeavingCell(
                              item.fatherName,
                              "fatherName",
                              index,
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderLeavingCell(
                              item.designation,
                              "designation",
                              index,
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderLeavingCell(item.salary, "salary", index)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderLeavingCell(
                              item.reasonOfLeaving,
                              "reasonOfLeaving",
                              index,
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {!tableLoading && filteredLeavingData.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500">No leaving employees found.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg w-[800px] max-h-[85vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {modalType === "joining"
                  ? "Edit Joining Employee"
                  : "Edit Leaving Employee"}
              </h2>

              {/* ================= JOINING FORM ================= */}
              {modalType === "joining" && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(editData).map((key) => (
                    <div key={key}>
                      <label className="text-xs font-medium capitalize">
                        {key}
                      </label>

                      <input
                        value={editData[key] || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="border p-2 rounded w-full"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* ================= LEAVING FORM ================= */}
              {Object.keys(editLeavingData).map((key) => (
                <div key={key}>
                  <label className="text-xs font-medium capitalize">
                    {key}
                  </label>

                  <input
                    value={editLeavingData[key] || ""}
                    onChange={(e) => handleLeavingChange(key, e.target.value)}
                    className="border p-2 rounded w-full"
                  />
                </div>
              ))}
              {/* ================= BUTTONS ================= */}
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleCancel();
                    handleLeavingCancel();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    if (modalType === "joining") {
                      await handleSave();
                    } else {
                      await handleLeavingSave();
                    }
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employee;
