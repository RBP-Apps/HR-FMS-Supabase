import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X, Upload, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import supabase from "../utils/supabase";

const CallTracker = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    candidateSays: '',
    status: '',
    nextDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [enquiryData, setEnquiryData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState([]);


  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    candidateSays: '',
    status: '',
    nextDate: ''
  });

  // Add these state declarations near your other useState declarations
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  // const [editFormData, setEditFormData] = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [filterIndentNo, setFilterIndentNo] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [filterName, setFilterName] = useState("");

  // Add these functions
  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditFormData({
      status: item.status || '',
      candidateSays: item.candidateSays || '',
      nextDate: item.nextDate || ''
    });
    setShowEditModal(true);
  };


  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Progress column ke liye helper functions
  const getCompletionStats = (rowData, visibleColumns) => {
    const columnsToCheck = visibleColumns.filter(col =>
      col !== 'Action'
    );

    const total = columnsToCheck.length;
    let filled = 0;

    columnsToCheck.forEach(column => {
      let value;
      switch (column) {
        case 'Indent No.': value = rowData.indentNo; break;
        case 'Candidate Enquiry No.': value = rowData.candidateEnquiryNo; break;
        case 'Applying For Post': value = rowData.applyingForPost; break;
        case 'Department': value = rowData.department; break;
        case 'Candidate Name': value = rowData.candidateName; break;
        case 'Phone': value = rowData.candidatePhone; break;
        case 'Email': value = rowData.candidateEmail; break;
        case 'Photo': value = rowData.candidatePhoto; break;
        case 'Resume': value = rowData.candidateResume; break;
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


  const visibleColumns = [
    'Indent No.', 'Candidate Enquiry No.', 'Applying For Post',
    'Department', 'Candidate Name', 'Phone', 'Email', 'Photo', 'Resume'
  ];

  const formatDateForDB = (dateStr) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) return null;

    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); // Reuse existing submitting state

    try {
      const { error } = await supabase
        .from("follow_up")
        .update({
          status: editFormData.status,
          candidate_says: editFormData.candidateSays,
          next_call_date: editFormData.nextDate || null,
        })
        .eq("enquiry_number", selectedItem.enquiryNo)
        .eq("candidate_says", selectedItem.candidateSays);

      if (error) throw error;

      const updatedHistoryData = historyData.map((h) =>
        h.enquiryNo === selectedItem.enquiryNo && h.candidateSays === selectedItem.candidateSays
          ? { ...h, ...editFormData }
          : h
      );

      setHistoryData(updatedHistoryData);
      setFollowUpData(updatedHistoryData);

      toast.success("Follow-up updated successfully!");
      setShowEditModal(false);
      setSelectedItem(null);

      await fetchFollowUpData();
    } catch (error) {
      console.error("Error updating:", error);
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };



  const fetchMasterData = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("call_tracker_status");

      if (error) throw error;

      const statusList = [
        ...new Set(
          (data || [])
            .map((row) => row.call_tracker_status)
            .filter(Boolean)
        ),
      ];

      setStatus(statusList);

      return {
        success: true,
        departments: statusList,
      };
    } catch (error) {
      console.error("Error fetching master data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setTableLoading(true);

      await fetchMasterData();
      await fetchEnquiryData();
      await fetchFollowUpData();

      setTableLoading(false);
    };

    loadData();
  }, []);




  const fetchEnquiryData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const { data: enquiryRows, error } = await supabase
        .from("enquiry")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedEnquiryData = (enquiryRows || [])
        .filter((row) => row.planned_1 && !row.actual_1)
        .map((row) => ({
          id: row.timestamp,
          indentNo: row.indent_number,
          candidateEnquiryNo: row.candidate_enquiry_number,
          applyingForPost: row.applying_post,
          department: row.department,
          candidateName: row.candidate_name,
          candidateDOB: row.dob,
          candidatePhone: row.candidate_phone,
          candidateEmail: row.candidate_email,
          previousCompany: row.previous_company_name,
          jobExperience: row.job_experience,
          previousPosition: row.previous_position,
          reasonForLeaving: row.reason_of_leaving,
          maritalStatus: row.marital_status,
          lastEmployerMobile: row.last_employer_mobile,
          candidatePhoto: row.candidate_photo,
          candidateResume: row.resume_copy,
          referenceBy: row.reference_by,
          presentAddress: row.present_address,
          aadharNo: row.aadhar_number,
          designation: row.applying_post,
          status: row.tracker_status || "",
        }));

      setEnquiryData(processedEnquiryData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchFollowUpData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      // 🔹 Step 1: follow_up data
      const { data: followData, error: err1 } = await supabase
        .from("follow_up")
        .select("*")
        .order("created_at", { ascending: false });

      if (err1) throw err1;

      // 🔹 Step 2: enquiry data
      const { data: enquiryData, error: err2 } = await supabase
        .from("enquiry")
        .select("*");

      if (err2) throw err2;

      // 🔹 Step 3: map + join manually
      const processedData = (followData || []).map((row) => {
        const enquiry = enquiryData.find(
          (e) => e.candidate_enquiry_number === row.enquiry_number
        );

        return {
          timestamp: row.created_at,
          enquiryNo: row.enquiry_number,
          status: row.status,
          candidateSays: row.candidate_says,
          nextDate: row.next_call_date,

          // join data
          indentNo: enquiry?.indent_number || "",
          candidateEnquiryNo: enquiry?.candidate_enquiry_number || "",
          applyingForPost: enquiry?.applying_post || "",
          department: enquiry?.department || "",
          candidateName: enquiry?.candidate_name || "",
          candidatePhone: enquiry?.candidate_phone || "",
          candidateEmail: enquiry?.candidate_email || "",
          candidatePhoto: enquiry?.candidate_photo || "",
          candidateResume: enquiry?.resume_copy || "",
        };
      });

      setFollowUpData(processedData);
      setHistoryData(processedData);

    } catch (error) {
      console.error("Error fetching follow up:", error);
      setError(error.message);
      toast.error("Failed to load follow-ups");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };


  useEffect(() => {
    fetchEnquiryData();
    fetchFollowUpData();
  }, []);

  const pendingData = enquiryData.filter(item => {
    const hasFinalStatus = followUpData.some(followUp =>
      followUp.enquiryNo === item.candidateEnquiryNo &&
      (followUp.status.includes('Joining') || followUp.status.includes('Reject'))
    );
    return !hasFinalStatus;
  });

  const handleCallClick = (item) => {
    setSelectedItem(item);
    setFormData({
      candidateSays: '',
      status: '',
      nextDate: ''
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'status' && value.includes('Joining')) {
      // Remove from pending tab immediately
      setEnquiryData(prev => prev.filter(item => item.candidateEnquiryNo !== selectedItem.candidateEnquiryNo));
    }
  };


  const postToSheet = async (rowData) => {
    try {
      const { error } = await supabase.from("follow_up").insert([
        {
          enquiry_number: rowData[1],
          status: rowData[2],
          candidate_says: rowData[3],
          next_call_date: rowData[4] || null,
        },
      ]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Insert error:", error);
      throw new Error(`Failed to insert follow up: ${error.message}`);
    }
  };


  const updateEnquirySheet = async (enquiryNo, statusValue) => {
    try {
      const { error } = await supabase
        .from("enquiry")
        .update({
          tracker_status: statusValue,
        })
        .eq("candidate_enquiry_number", enquiryNo);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Error updating enquiry:", error);
      throw new Error(`Failed to update enquiry: ${error.message}`);
    }
  };

  // utils/dateFormatter.js
  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.candidateSays || !formData.status) {
      toast.error('Please fill all required fields');
      setSubmitting(false);
      return;
    }

    try {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

      const rowData = [
        formattedTimestamp,
        selectedItem.candidateEnquiryNo || '',
        formData.status,
        formData.candidateSays,
        formatDateForDB(formData.nextDate)
      ];

      await postToSheet(rowData);

      toast.success('Update successful!');
      setShowModal(false);
      fetchEnquiryData();
      fetchFollowUpData();

    } catch (error) {
      console.error('Submission failed:', error);
      toast.error(`Failed to update: ${error.message}`);
      if (error.message.includes('appendRow')) {
        toast('Please verify the "Follow-Up" sheet exists', {
          icon: 'ℹ️',
          duration: 8000
        });
      }
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

  const uniqueIndents = Array.from(new Set([...pendingData.map(i => i.indentNo), ...historyData.map(i => i.indentNo)].filter(Boolean)));
  const uniquePosts = Array.from(new Set([...pendingData.map(i => i.applyingForPost), ...historyData.map(i => i.applyingForPost)].filter(Boolean)));
  const uniqueNames = Array.from(new Set([...pendingData.map(i => i.candidateName), ...historyData.map(i => i.candidateName)].filter(Boolean)));

  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = searchTerm === "" ||
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateEnquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.indentNo === filterIndentNo;
    const matchesPost = filterPost === "" || item.applyingForPost === filterPost;
    const matchesName = filterName === "" || item.candidateName === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = searchTerm === "" ||
      item.enquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateSays?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.indentNo === filterIndentNo;
    const matchesPost = filterPost === "" || item.applyingForPost === filterPost;
    const matchesName = filterName === "" || item.candidateName === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Call Tracker</h1>
      </div>

      {/* Dynamic Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Indent Number Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Indent Number</label>
            <div className="relative">
              <input
                type="text"
                list="callIndentList"
                placeholder="Select/Search Indent"
                value={filterIndentNo}
                onChange={(e) => setFilterIndentNo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="callIndentList">
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
                list="callPostList"
                placeholder="Select/Search Post"
                value={filterPost}
                onChange={(e) => setFilterPost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="callPostList">
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
                list="callNameList"
                placeholder="Select/Search Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="callNameList">
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
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setFilterIndentNo("");
              setFilterPost("");
              setFilterName("");
              setSearchTerm("");
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300 border-opacity-20">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "pending"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "history"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("history")}
            >
              <CheckCircle size={16} className="inline mr-2" />
              History ({filteredHistoryData.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "pending" && (

            <div className="overflow-auto max-h-[400px]">
              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50 sticky text-center top-0 z-10 text-nowrap">
                  <tr>
                    <th className="sticky left-0 z-30 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px] border-r">
                      Progress
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent No.
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Enquiry No.
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applying For Post
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resume
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-center">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading pending calls...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchEnquiryData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredPendingData.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No pending calls found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                          {(() => {
                            const stats = getCompletionStats(item, visibleColumns);
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCallClick(item)}
                            className="px-3 py-1 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 text-sm"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.indentNo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidateEnquiryNo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.applyingForPost)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.department)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidateName)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidatePhone)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidateEmail)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidatePhoto ? (
                            <a
                              href={item.candidatePhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            ""
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidateResume ? (
                            <a
                              href={item.candidateResume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            ""
                          ))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}


          {activeTab === "history" && (

            <div className="overflow-auto max-h-[400px]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-50 text-center text-nowrap">
                  <tr>
                    <th className="sticky top-0 left-0 z-50 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500 uppercase min-w-[160px] border-r">
                      Progress
                    </th>
                    <th className="sticky top-0 left-[160px] z-50 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500 uppercase min-w-[100px] border-r">
                      Action
                    </th>                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Indent No.</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Candidate Enquiry No.</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Applying For Post</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Candidate Name</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Photo</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Resume</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Candidate Says</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Next Date</th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  </tr>
                </thead>

                {/* 🔹 TBODY */}
                <tbody className="bg-white divide-y divide-gray-200 text-center text-nowrap">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="14" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading call history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="14" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No call history found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">

                        <td className="sticky left-0 z-30 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                          {(() => {
                            const stats = getCompletionStats(item, visibleColumns);
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

                        {/* Action */}
                        <td className="sticky left-[160px] z-30 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="px-3 py-1 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-xs"
                          >
                            Edit
                          </button>
                        </td>

                        {/* Pending wale fields */}
                        <td className="px-6 py-4 text-sm">{renderField(item.indentNo)}</td>
                        <td className="px-6 py-4 text-sm">{renderField(item.candidateEnquiryNo)}</td>
                        <td className="px-6 py-4 text-sm">{renderField(item.applyingForPost)}</td>
                        <td className="px-6 py-4 text-sm">{renderField(item.department)}</td>
                        <td className="px-6 py-4 text-sm">{renderField(item.candidateName)}</td>
                        <td className="px-6 py-4 text-sm">{renderField(item.candidatePhone)}</td>
                        <td className="px-6 py-4 text-sm">{renderField(item.candidateEmail)}</td>

                        {/* Photo */}
                        <td className="px-6 py-4 text-sm">
                          {renderField(item.candidatePhoto ? (
                            <a
                              href={item.candidatePhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600"
                            >
                              View
                            </a>
                          ) : "")}
                        </td>

                        {/* Resume */}
                        <td className="px-6 py-4 text-sm">
                          {renderField(item.candidateResume ? (
                            <a
                              href={item.candidateResume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600"
                            >
                              View
                            </a>
                          ) : "")}
                        </td>

                        {/* Old fields */}
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${item.status === "Joining"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Reject"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                              }`}
                          >
                            {renderField(item.status)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm">{renderField(item.candidateSays)}</td>
                        <td className="px-6 py-4 text-sm">{renderField(item.nextDate)}</td>
                        <td className="px-6 py-4 text-sm">{renderField(formatDateTime(item.timestamp))}</td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Edit Modal */}
        {showEditModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b border-gray-300">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Follow-up
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Enquiry No.
                  </label>
                  <input
                    type="text"
                    value={selectedItem.enquiryNo}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Status</option>
                    {status.map((dept, index) => (
                      <option key={index} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate Says *
                  </label>
                  <textarea
                    name="candidateSays"
                    value={editFormData.candidateSays}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Date
                  </label>
                  <input
                    type="date"
                    name="nextDate"
                    value={editFormData.nextDate}
                    onChange={handleEditInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 min-h-[42px] flex items-center justify-center ${submitting ? "opacity-90 cursor-not-allowed" : ""
                      }`}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin h-4 w-4 text-white mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Call Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-300">
              <h3 className="text-lg font-medium text-gray-900">
                Call Tracker
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate Enquiry No. ((उम्मीदवार इन्क्वायरी संख्या))
                </label>
                <input
                  type="text"
                  value={selectedItem.candidateEnquiryNo}
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status (स्थिति) *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Status</option>
                  {status.map((dept, index) => (
                    <option key={index} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Label for Candidate Says Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.status === "Negotiation"
                    ? "What's Customer Requirement * ()"
                    : formData.status === "On Hold"
                      ? "Reason For Holding the Candidate *"
                      : formData.status === "Joining"
                        ? "Remark *"
                        : formData.status === "Reject"
                          ? "Reason for Rejecting the Candidate *"
                          : "Remark *"}
                </label>
                <textarea
                  name="candidateSays"
                  value={formData.candidateSays}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              {/* Dynamic Label for Next Date Field */}
              {formData.status &&
                !["Joining", "Reject"].includes(formData.status) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.status === "Interview"
                        ? "Schedule Date (निर्धारित तिथि) *"
                        : formData.status === "On Hold"
                          ? "ReCalling Date (वापसी की तिथि) *"
                          : "Next Date (अगली तारीख) *"}
                    </label>
                    <input
                      type="date"
                      name="nextDate"
                      value={formData.nextDate}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      required
                    />
                  </div>
                )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 min-h-[42px] flex items-center justify-center ${submitting ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin h-4 w-4 text-white mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallTracker;
