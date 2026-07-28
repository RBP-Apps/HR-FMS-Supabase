import React, { useEffect, useState } from "react";
import { Filter, Search, Clock, CheckCircle, ImageIcon, X, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import useDataStore from "../store/dataStore";
import supabase from "../utils/supabase";
import { uploadFileToDrive } from "../utils/joiningUtils";

const Employee = () => {
  const [activeTab, setActiveTab] = useState("joining");
  const [searchTerm, setSearchTerm] = useState("");
  const [joiningData, setJoiningData] = useState([]);
  const [leavingData, setLeavingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [firmNames, setFirmNames] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "joining" | "leaving"

  const [editingLeavingRow, setEditingLeavingRow] = useState(null);
  const [editLeavingData, setEditLeavingData] = useState({});

  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});
  const [lightboxImage, setLightboxImage] = useState(null);

  const [filterEmployeeCategory, setFilterEmployeeCategory] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [filterName, setFilterName] = useState("");

  const visibleColumnsEmployeeJoining = [
    'Employee ID', 'Punch Id', 'Firm Name', 'Name As Per Aadhaar', 'Father Name',
    'Date Of Joining', 'Work Location', 'Designation', 'Salary', 'Aadhaar Frontside photo',
    'Aadhaar Backside photo', 'Pan Card', 'Relationship with family Person', 'Current Address',
    'Address as per aadhaar card', 'Date of birth aadhaar card', 'Gender', 'Mobile Number',
    'Family Number', 'Past PF Id No.', 'Past Esic Number', 'Current Bank Ac No.', 'IFSC Code',
    'Branch Name', 'Personal Email-Id', 'Does Company Provide PF', 'Does Company Provide ESIC',
    'Does Company Provide Mail-Id', 'Attendance Type', 'Employee Category', 'Validate the Candidate', 'Issue Gmail id',
    'Issue Joining letter', 'Attendance Registration'
  ];

  const visibleColumnsEmployeeLeaving = [
    'Employee ID', 'Punch Id', 'Name', 'Date Of Joining', 'Date Of Leaving', 'Mobile Number',
    'Father Name', 'Designation', 'Salary', 'Reason Of Leaving'
  ];

  const getCompletionStats = (rowData, visibleColumns) => {
    const total = visibleColumns.length;
    let filled = 0;

    visibleColumns.forEach(column => {
      let value;
      switch (column) {
        case 'Employee ID': value = rowData.employeeId; break;
        case 'Punch Id': value = rowData.punchId; break;
        case 'Firm Name': value = rowData.firmName; break;
        case 'Name As Per Aadhaar': value = rowData.nameAsPerAadhar; break;
        case 'Father Name': value = rowData.fatherName; break;
        case 'Date Of Joining': value = rowData.dateOfJoining; break;
        case 'Work Location': value = rowData.workLocation; break;
        case 'Designation': value = rowData.designation; break;
        case 'Salary': value = rowData.salary; break;
        case 'Aadhaar Frontside photo': value = rowData.aadharFrontPhoto; break;
        case 'Aadhaar Backside photo': value = rowData.aadharBackPhoto; break;
        case 'Pan Card': value = rowData.panCard; break;
        case 'Relationship with family Person': value = rowData.relationshipWithFamily; break;
        case 'Current Address': value = rowData.currentAddress; break;
        case 'Address as per aadhaar card': value = rowData.aadharAddress; break;
        case 'Date of birth aadhaar card': value = rowData.dateOfBirth; break;
        case 'Gender': value = rowData.gender; break;
        case 'Mobile Number': value = rowData.mobileNumber || rowData.mobileNo; break;
        case 'Family Number': value = rowData.familyNumber; break;
        case 'Past PF Id No.': value = rowData.pastPfId; break;
        case 'Past Esic Number': value = rowData.pastEsicNumber; break;
        case 'Current Bank Ac No.': value = rowData.currentBankAcNo; break;
        case 'IFSC Code': value = rowData.ifscCode; break;
        case 'Branch Name': value = rowData.branchName; break;
        case 'Personal Email-Id': value = rowData.personalEmail; break;
        case 'Does Company Provide PF': value = rowData.companyProvidesPf; break;
        case 'Does Company Provide ESIC': value = rowData.companyProvidesEsic; break;
        case 'Does Company Provide Mail-Id': value = rowData.companyProvidesEmail; break;
        case 'Attendance Type': value = rowData.attendanceType; break;
        case 'Employee Category': value = rowData.employeeCategory; break;
        case 'Validate the Candidate': value = rowData.validateCandidate; break;
        case 'Issue Gmail id': value = rowData.issueGmailId; break;
        case 'Issue Joining letter': value = rowData.issueJoiningLetter; break;
        case 'Attendance Registration': value = rowData.attendanceRegistration; break;

        // Leaving fields
        case 'Name': value = rowData.name; break;
        case 'Date Of Leaving': value = rowData.dateOfLeaving; break;
        case 'Reason Of Leaving': value = rowData.reasonOfLeaving; break;

        default: value = rowData[column.toLowerCase().replace(/ /g, '')];
      }

      if (value !== null && value !== undefined && String(value).trim() !== '') {
        filled++;
      }
    });

    const unfilled = total - filled;
    const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { total, filled, unfilled, percent };
  };

  const getProgressColor = (percent) => {
    if (percent < 40) return "bg-red-500";
    if (percent <= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    // If dateString is in YYYY-MM-DD format (like "2026-07-08")
    const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if not a valid date
    }

    // Fallback: format using UTC methods to avoid timezone shift for ISO strings
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();

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

      const updateData = {
        rbp_joining_id: editLeavingData.employeeId,
        punch_id: editLeavingData.punchId || null,
        name_as_per_aadhar: editLeavingData.name,
        date_of_joining: editLeavingData.dateOfJoining || null,
        leaving_date: editLeavingData.dateOfLeaving || null,
        mobile_number: editLeavingData.mobileNo || null,
        father_name: editLeavingData.fatherName || null,
        designation: editLeavingData.designation || null,
        salary: editLeavingData.salary === "" || editLeavingData.salary === null ? null : parseFloat(editLeavingData.salary),
        leaving_reason: editLeavingData.reasonOfLeaving || null,
        status: "Inactive",
      };

      const { error } = await supabase
        .from("joining")
        .update(updateData)
        .eq("id", editLeavingData.id);

      if (error) throw error;

      setEditingLeavingRow(null);
      setEditLeavingData({});
      fetchLeavingData();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving leaving data:", err);
      toast.error("Failed to save changes: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };



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

  const getDirectImageUrl = (url) => {
    if (!url) return "";
    if (typeof url !== "string") return url;
    
    // Check if it's a Google Drive URL
    if (url.includes("drive.google.com")) {
      let fileId = "";
      
      if (url.includes("open?id=")) {
        const match = url.match(/open\?id=([^&]+)/);
        if (match) fileId = match[1];
      } else if (url.includes("/file/d/")) {
        const match = url.match(/\/file\/d\/([^/]+)/);
        if (match) fileId = match[1];
      } else if (url.includes("id=")) {
        const match = url.match(/id=([^&]+)/);
        if (match) fileId = match[1];
      }
      
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    
    return url;
  };

  const renderImageThumbnail = (url, altText) => {
    if (!url) return "";
    const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
    if (isPdf) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center p-2 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 w-14 h-14"
        >
          <span className="text-[10px] font-bold text-indigo-600">PDF</span>
        </a>
      );
    }
    const imageUrl = getDirectImageUrl(url);
    return (
      <button
        type="button"
        onClick={() => setLightboxImage(url)}
        className="inline-block p-1 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 focus:outline-none"
      >
        <img
          src={imageUrl}
          alt={altText}
          className="w-12 h-12 object-cover rounded-md"
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              const iconDiv = document.createElement('div');
              iconDiv.className = "flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-500 rounded-md";
              iconDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
              parent.appendChild(iconDiv);
            }
          }}
        />
      </button>
    );
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

  const handleFileChange = (field, file) => {
    setEditData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);

      const uploadPromises = {};
      const fileFields = ["aadharFrontPhoto", "aadharBackPhoto", "panCard"];

      for (const field of fileFields) {
        if (editData[field] && editData[field] instanceof File) {
          uploadPromises[field] = uploadFileToDrive(editData[field]);
        } else {
          uploadPromises[field] = Promise.resolve(null);
        }
      }

      const uploadedUrls = await Promise.all(
        Object.values(uploadPromises).map((promise) => promise.catch(() => null))
      );

      const fileUrls = {};
      Object.keys(uploadPromises).forEach((field, index) => {
        fileUrls[field] = uploadedUrls[index];
      });

      const updateData = {
        rbp_joining_id: editData.employeeId,
        punch_id: editData.punchId || null,
        status: editData.status,
        firm_name: editData.firmName,
        name_as_per_aadhar: editData.nameAsPerAadhar,
        father_name: editData.fatherName,
        date_of_joining: editData.dateOfJoining || null,
        work_location: editData.workLocation,
        designation: editData.designation,
        salary: editData.salary === "" || editData.salary === null ? null : parseFloat(editData.salary),
        aadhar_front_photo: fileUrls.aadharFrontPhoto || (typeof editData.aadharFrontPhoto === "string" ? editData.aadharFrontPhoto : null),
        aadhar_back_photo: fileUrls.aadharBackPhoto || (typeof editData.aadharBackPhoto === "string" ? editData.aadharBackPhoto : null),
        pan_card: fileUrls.panCard || (typeof editData.panCard === "string" ? editData.panCard : null),
        family_relationship: editData.relationshipWithFamily,
        current_address: editData.currentAddress,
        aadhar_address: editData.aadharAddress,
        date_of_birth: editData.dateOfBirth || null,
        gender: editData.gender,
        mobile_number: editData.mobileNumber,
        family_number: editData.familyNumber,
        past_pf_id: editData.pastPfId,
        past_esic_number: editData.pastEsicNumber,
        bank_account_number: editData.currentBankAcNo,
        ifsc_code: editData.ifscCode,
        branch_name: editData.branchName,
        personal_email: editData.personalEmail,
        attendance_type: editData.attendanceType,
        employee_category: editData.employeeCategory,
        company_pf_provided: editData.companyProvidesPf === "Yes",
        company_esic_provided: editData.companyProvidesEsic === "Yes",
        company_mail_provided: editData.companyProvidesEmail === "Yes",
        candidate_validated: editData.validateCandidate === "Yes",
        gmail_id_issued: editData.issueGmailId === "Yes",
        joining_letter_issued: editData.issueJoiningLetter === "Yes",
        attendance_registration: editData.attendanceRegistration === "Yes",
      };

      const { error } = await supabase
        .from("joining")
        .update(updateData)
        .eq("id", editData.id);

      if (error) throw error;

      setEditingRow(null);
      fetchJoiningData();
      setShowModal(false);
    } catch (err) {
      console.error("Error saving joining data:", err);
      toast.error("Failed to save changes: " + (err.message || "Unknown error"));
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
        id: row.id,
        employeeId: row.rbp_joining_id || "",
        punchId: row.punch_id || "",
        status: row.status || "",
        firmName: row.firm_name || "",
        nameAsPerAadhar: row.name_as_per_aadhar || "",
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
        employeeCategory: row.employee_category ? row.employee_category.trim() : "",

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
        id: row.id,
        employeeId: row.rbp_joining_id || "",
        punchId: row.punch_id || "",
        status: row.status || "",
        name: row.name_as_per_aadhar || "",
        dateOfJoining: row.date_of_joining || "",
        dateOfLeaving: row.leaving_date || "",
        mobileNo: row.mobile_number || "",
        fatherName: row.father_name || "",
        designation: row.designation || "",
        salary: row.salary || "",
        reasonOfLeaving: row.leaving_reason || "",
        employeeCategory: row.employee_category ? row.employee_category.trim() : "",
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
  const fetchFirmNames = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("firm_name")
        .not("firm_name", "is", null)
        .order("firm_name");

      if (error) throw error;

      const firms = (data || [])
        .map((row) => row.firm_name)
        .filter((firm) => firm && firm.trim() !== "")
        .map((firm) => firm.trim());

      const uniqueFirms = [...new Set(firms)].sort();
      setFirmNames(uniqueFirms);
    } catch (error) {
      console.error("Error fetching firm names:", error);
    }
  };

  useEffect(() => {
    fetchJoiningData();
    fetchLeavingData();
    fetchFirmNames();
  }, []);

  const uniqueCategories = Array.from(new Set([...joiningData, ...leavingData].map(i => i.employeeCategory).filter(Boolean)));
  const uniquePosts = Array.from(new Set([...joiningData, ...leavingData].map(i => i.designation).filter(Boolean)));
  const uniqueNames = Array.from(new Set([...joiningData.map(i => i.nameAsPerAadhar), ...leavingData.map(i => i.name)].filter(Boolean)));

  const filteredJoiningData = joiningData.filter((item) => {
    const matchesSearch = searchTerm === "" ||
      item.nameAsPerAadhar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.punchId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobileNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterEmployeeCategory === "" || item.employeeCategory === filterEmployeeCategory;
    const matchesPost = filterPost === "" || item.designation === filterPost;
    const matchesName = filterName === "" || item.nameAsPerAadhar === filterName;

    return matchesSearch && matchesCategory && matchesPost && matchesName;
  });

  const filteredLeavingData = leavingData.filter((item) => {
    const matchesSearch = searchTerm === "" ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.punchId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterEmployeeCategory === "" || item.employeeCategory === filterEmployeeCategory;
    const matchesPost = filterPost === "" || item.designation === filterPost;
    const matchesName = filterName === "" || item.name === filterName;

    return matchesSearch && matchesCategory && matchesPost && matchesName;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-600">Employee</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Employee Category Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Employee Category</label>
            <div className="relative">
              <input
                type="text"
                list="empCategoryList"
                placeholder="Select/Search Category"
                value={filterEmployeeCategory}
                onChange={(e) => setFilterEmployeeCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="empCategoryList">
                {uniqueCategories.map(category => (
                  <option key={category} value={category} />
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
             
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end pt-2 mt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setFilterEmployeeCategory("");
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

      {/* Tabs - This section won't scroll */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300 ">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "joining"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("joining")}
            >
              <CheckCircle size={16} className="inline mr-2" />
              Active ({filteredJoiningData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "leaving"
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
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-indigo-600 text-white sticky top-0 z-40">
                    <tr>
                      <th className="sticky left-0 w-[160px] min-w-[160px] z-30 bg-indigo-600 px-6 py-3 text-xs font-medium text-white uppercase ">
                        Progress
                      </th>
                      <th className="sticky left-[160px] min-w-[100px] z-30 bg-indigo-600 px-6 py-3  text-xs font-medium text-white uppercase">
                        Action
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Punch ID
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Employee Category
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Firm Name
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Name As Per Aadhaar
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Father Name
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Date Of Joining
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Work Location
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Aadhaar Frontside photo
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Aadhaar Backside photo
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Pan Card
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Relationship with family Person
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Current Address
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Address as per aadhaar card
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Date of birth aadhaar card
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Mobile Number
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Family Number
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Past PF Id No.
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Past Esic Number
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Current Bank Ac No.
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        IFSC Code
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Branch Name
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Personal Email-Id
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Does Company Provide PF
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Does Company Provide ESIC
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Does Company Provide Mail-Id
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Attendance Type
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Employee Category
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Validate the Candidate
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Issue Gmail id
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Issue Joining letter
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Attendance Registration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white text-center">
                    {tableLoading ? (
                      <tr>
                        <td colSpan="36" className="px-6 py-12 text-center">
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
                        <td colSpan="36" className="px-6 py-12 text-center">
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
                          className="hover:bg-gray-50 group"
                        >
                          <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                            {(() => {
                              const stats = getCompletionStats(item, visibleColumnsEmployeeJoining);
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="text-[10px] font-semibold text-gray-700 mb-1">
                                    {stats.filled}/{stats.total} ({stats.percent}%)
                                  </div>
                                  <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                    <div className={`${getProgressColor(stats.percent)} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${stats.percent}%` }}></div>
                                  </div>
                                  <div className="text-[10px] mt-1 space-x-1">
                                    <span className="text-gray-600 font-medium">{stats.filled} Filled</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-500 font-medium">{stats.unfilled} Missing</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="sticky left-[160px] z-20 bg-white group-hover:bg-gray-50 px-6 py-4 text-sm border-r">
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
                            {renderField(item.employeeId)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.punchId)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.employeeCategory)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.firmName)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.nameAsPerAadhar)}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.fatherName)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.dateOfJoining
                              ? formatDOB(item.dateOfJoining)
                              : "-")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.workLocation)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.designation)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.salary)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.aadharFrontPhoto ? renderImageThumbnail(item.aadharFrontPhoto, "Aadhaar Front") : renderField("")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.aadharBackPhoto ? renderImageThumbnail(item.aadharBackPhoto, "Aadhaar Back") : renderField("")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.panCard ? renderImageThumbnail(item.panCard, "PAN Card") : renderField("")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.relationshipWithFamily)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.currentAddress)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.aadharAddress)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.dateOfBirth
                              ? formatDOB(item.dateOfBirth)
                              : "")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.gender)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.mobileNumber)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.familyNumber)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.pastPfId)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.pastEsicNumber)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.currentBankAcNo)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.ifscCode)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.branchName)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.personalEmail)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.companyProvidesPf)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.companyProvidesEsic)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.companyProvidesEmail)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.attendanceType)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.employeeCategory)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.validateCandidate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.issueGmailId)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.issueJoiningLetter)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {renderField(item.attendanceRegistration)}
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

                <table className="min-w-full">
                  <thead className="bg-indigo-600 text-white sticky top-0 z-40">
                    <tr>
                      <th className="sticky left-0 w-[160px] min-w-[160px] z-30 bg-indigo-600 px-6 py-3 text-xs font-medium text-white uppercase">
                        Progress
                      </th>
                      <th className="sticky left-[160px] min-w-[100px] z-30 bg-indigo-600 px-6 py-3  text-xs font-medium text-white uppercase">
                        Action
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Punch ID
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Date Of Joining
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Date Of Leaving
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Mobile Number
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Father Name
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3  text-xs font-medium  uppercase tracking-wider">
                        Reason Of Leaving
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white text-center">
                    {tableLoading ? (
                      <tr>
                        <td colSpan="11" className="px-6 py-12 text-center">
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
                        <td colSpan="11" className="px-6 py-12 text-center">
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
                        <tr key={index} className="hover:bg-gray-50 group">
                          <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                            {(() => {
                              const stats = getCompletionStats(item, visibleColumnsEmployeeLeaving);
                              return (
                                <div className="flex flex-col items-center">
                                  <div className="text-[10px] font-semibold text-gray-700 mb-1">
                                    {stats.filled}/{stats.total} ({stats.percent}%)
                                  </div>
                                  <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                    <div className={`${getProgressColor(stats.percent)} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${stats.percent}%` }}></div>
                                  </div>
                                  <div className="text-[10px] mt-1 space-x-1">
                                    <span className="text-gray-600 font-medium">{stats.filled} Filled</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-500 font-medium">{stats.unfilled} Missing</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="sticky left-[160px] z-20 bg-white group-hover:bg-gray-50 px-6 py-4 text-sm border-r">
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
                            {renderLeavingCell(
                              item.punchId,
                              "punchId",
                              index,
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderField(renderLeavingCell(item.name, "name", index))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderField(item.dateOfJoining
                              ? formatDOB(item.dateOfJoining)
                              : "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderField(renderLeavingCell(
                              item.dateOfLeaving
                                ? formatDOB(item.dateOfLeaving)
                                : "",
                              "dateOfLeaving",
                              index,
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderField(renderLeavingCell(
                              item.mobileNo,
                              "mobileNo",
                              index,
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderField(renderLeavingCell(
                              item.fatherName,
                              "fatherName",
                              index,
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderField(renderLeavingCell(
                              item.designation,
                              "designation",
                              index,
                            ))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderField(renderLeavingCell(item.salary, "salary", index))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {renderField(renderLeavingCell(
                              item.reasonOfLeaving,
                              "reasonOfLeaving",
                              index,
                            ))}
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-indigo-600 font-semibold">
                  {modalType === "joining"
                    ? "Edit Joining Employee"
                    : "Edit Leaving Employee"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    handleCancel();
                    handleLeavingCancel();
                  }}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>

              {/* ================= JOINING FORM ================= */}
              {modalType === "joining" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {Object.keys(editData).map((key) => {
                      if (key === "id" || key.toLowerCase().includes("photo") || key.toLowerCase().includes("card")) return null;
                      const isDateField = ["dateOfJoining", "dateOfBirth"].includes(key) || key.toLowerCase().includes("date");
                      const isSelectField = ["companyProvidesPf", "companyProvidesEsic", "companyProvidesEmail", "validateCandidate", "issueGmailId", "issueJoiningLetter", "attendanceRegistration"].includes(key);

                      // Format date for input: must be YYYY-MM-DD
                      let val = editData[key] || "";
                      if (isDateField && val) {
                        try {
                          const d = new Date(val);
                          if (!isNaN(d.getTime())) {
                            val = d.toISOString().split('T')[0];
                          }
                        } catch (e) {
                          console.error("Date parse error", e);
                        }
                      }

                      return (
                        <div key={key}>
                          <label className="text-xs font-medium text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          {key === "firmName" ? (
                            <select
                              value={editData[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="border p-2 rounded w-full text-sm focus:ring-1 focus:ring-indigo-500 outline-none mt-1 bg-white"
                            >
                              <option value="">Select Firm Name</option>
                              {firmNames.map((firm) => (
                                <option key={firm} value={firm}>
                                  {firm}
                                </option>
                              ))}
                              {editData[key] && !firmNames.includes(editData[key]) && (
                                <option value={editData[key]}>{editData[key]}</option>
                              )}
                            </select>
                          ) : key === "employeeCategory" ? (
                            <select
                              value={editData[key] || ""}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="border p-2 rounded w-full text-sm focus:ring-1 focus:ring-indigo-500 outline-none mt-1 bg-white"
                            >
                              <option value="">Select Category</option>
                              <option value="Field Staff">Field Staff</option>
                              <option value="Office Staff">Office Staff</option>
                            </select>
                          ) : isSelectField ? (
                            <select
                              value={editData[key] || "No"}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="border p-2 rounded w-full text-sm focus:ring-1 focus:ring-indigo-500 outline-none mt-1 bg-white"
                            >
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : (
                            <input
                              type={isDateField ? "date" : key === "salary" ? "number" : "text"}
                              value={val}
                              onChange={(e) => handleChange(key, e.target.value)}
                              className="border p-2 rounded w-full text-sm focus:ring-1 focus:ring-indigo-500 outline-none mt-1"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Documents Section */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold text-indigo-600 mb-3">Documents (दस्तावेज़)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Aadhaar Frontside Photo */}
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Aadhaar Frontside Photo (आधार कार्ड फ्रंट फोटो)
                        </label>
                        <input
                          key={editData.aadharFrontPhoto ? "front-present" : "front-empty"}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange("aadharFrontPhoto", e.target.files[0])}
                          className="border p-2 rounded w-full text-sm mt-1 bg-white"
                        />
                        {editData.aadharFrontPhoto && (
                          <div className="mt-1 flex items-center justify-between bg-indigo-50 p-1.5 rounded border border-indigo-100">
                            {editData.aadharFrontPhoto instanceof File ? (
                              <>
                                <span className="text-xs text-indigo-700 font-medium truncate max-w-[75%]">
                                  Selected: {editData.aadharFrontPhoto.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleFileChange("aadharFrontPhoto", null)}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <>
                                <a
                                  href={editData.aadharFrontPhoto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-700 hover:underline flex items-center gap-1 truncate max-w-[75%]"
                                >
                                  <ImageIcon size={14} /> View Existing Aadhaar Frontside
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleFileChange("aadharFrontPhoto", null)}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Aadhaar Backside Photo */}
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Aadhaar Backside Photo (आधार कार्ड बैक फोटो)
                        </label>
                        <input
                          key={editData.aadharBackPhoto ? "back-present" : "back-empty"}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange("aadharBackPhoto", e.target.files[0])}
                          className="border p-2 rounded w-full text-sm mt-1 bg-white"
                        />
                        {editData.aadharBackPhoto && (
                          <div className="mt-1 flex items-center justify-between bg-indigo-50 p-1.5 rounded border border-indigo-100">
                            {editData.aadharBackPhoto instanceof File ? (
                              <>
                                <span className="text-xs text-indigo-700 font-medium truncate max-w-[75%]">
                                  Selected: {editData.aadharBackPhoto.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleFileChange("aadharBackPhoto", null)}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <>
                                <a
                                  href={editData.aadharBackPhoto}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-700 hover:underline flex items-center gap-1 truncate max-w-[75%]"
                                >
                                  <ImageIcon size={14} /> View Existing Aadhaar Backside
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleFileChange("aadharBackPhoto", null)}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pan Card */}
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-500">
                          PAN Card (पैन कार्ड)
                        </label>
                        <input
                          key={editData.panCard ? "pan-present" : "pan-empty"}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange("panCard", e.target.files[0])}
                          className="border p-2 rounded w-full text-sm mt-1 bg-white"
                        />
                        {editData.panCard && (
                          <div className="mt-1 flex items-center justify-between bg-indigo-50 p-1.5 rounded border border-indigo-100">
                            {editData.panCard instanceof File ? (
                              <>
                                <span className="text-xs text-indigo-700 font-medium truncate max-w-[75%]">
                                  Selected: {editData.panCard.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleFileChange("panCard", null)}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <>
                                <a
                                  href={editData.panCard}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-700 hover:underline flex items-center gap-1 truncate max-w-[75%]"
                                >
                                  <ImageIcon size={14} /> View Existing PAN Card
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleFileChange("panCard", null)}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer"
                                >
                                  Remove
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= LEAVING FORM ================= */}
              {modalType === "leaving" && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(editLeavingData).map((key) => {
                    if (key === "id") return null;
                    const isDateField = ["dateOfJoining", "dateOfLeaving"].includes(key) || key.toLowerCase().includes("date");

                    let val = editLeavingData[key] || "";
                    if (isDateField && val) {
                      try {
                        const d = new Date(val);
                        if (!isNaN(d.getTime())) {
                          val = d.toISOString().split('T')[0];
                        }
                      } catch (e) {
                        console.error("Date parse error", e);
                      }
                    }

                    return (
                      <div key={key}>
                        <label className="text-xs font-medium text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <input
                          type={isDateField ? "date" : key === "salary" ? "number" : "text"}
                          value={val}
                          onChange={(e) => handleLeavingChange(key, e.target.value)}
                          className="border p-2 rounded w-full text-sm focus:ring-1 focus:ring-indigo-500 outline-none mt-1"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

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

        {lightboxImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-85 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none bg-white bg-opacity-10 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <img
                src={getDirectImageUrl(lightboxImage)}
                alt="Enlarged view"
                className="max-w-full max-h-[75vh] rounded-lg shadow-2xl object-contain border border-white border-opacity-10"
                onClick={(e) => e.stopPropagation()}
              />
              <a 
                href={lightboxImage}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                Open Original File / Link
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employee;
