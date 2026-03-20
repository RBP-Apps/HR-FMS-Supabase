import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle, X, Upload } from 'lucide-react';
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
    const { data, error } = await supabase
      .from("follow_up")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const processedData = (data || []).map((row) => ({
      timestamp: row.created_at,
      enquiryNo: row.enquiry_number,
      status: row.status,
      candidateSays: row.candidate_says,
      nextDate: row.next_call_date,
    }));

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

  const formatDOB = (dateString) => {
    if (!dateString) return '';

    // Handle different date formats that might come from the input
    let date;

    // If it's already a Date object
    if (dateString instanceof Date) {
      date = dateString;
    }
    // If it's in the format "1/11/2021" (mm/dd/yyyy or dd/mm/yyyy)
    else if (typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        if (parseInt(parts[0]) > 12) {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        } else {
          date = new Date(parts[2], parts[0] - 1, parts[1]);
        }
      }
    }
    else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.candidateSays || !formData.status) {
      toast.error('Please fill all required fields');
      setSubmitting(false);
      return;
    }

    try {
      // For ALL statuses including Joining, submit to Follow-Up sheet first
      // const now = new Date();
      // const formattedTimestamp = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

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
        formatDOB(formData.nextDate) || '',
      ];

      await postToSheet(rowData);

      // Update ENQUIRY sheet Column Y with the selected status
      // Extract only English part before any bracket/special character
      
      // const statusForSheet = formData.status.split('(')[0].trim();
      // await updateEnquirySheet(selectedItem.candidateEnquiryNo, statusForSheet);

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

  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateEnquiryNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = item.enquiryNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateSays?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Call Tracker</h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by candidate name or enquiry number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-400 border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 opacity-60"
            />
          </div>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Enquiry No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applying For Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resume
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCallClick(item)}
                            className="px-3 py-1 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 text-sm"
                          >
                            Call
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEnquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.applyingForPost}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidatePhoto ? (
                            <a
                              href={item.candidatePhoto}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateResume ? (
                            <a
                              href={item.candidateResume}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* {activeTab === "history" && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enquiry No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Says
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
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
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No call history found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.enquiryNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${item.status === "Joining"
                              ? "bg-green-100 text-green-800"
                              : item.status === "Reject"
                                ? "bg-red-100 text-red-800"
                                : "bg-blue-100 text-blue-800"
                              }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.candidateSays}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.nextDate || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.timestamp || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )} */}

    {activeTab === "history" && (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Action
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Enquiry No
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Candidate Says
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Next Date
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Timestamp
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {tableLoading ? (
          <tr>
            <td colSpan="6" className="px-6 py-12 text-center">
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
            <td colSpan="6" className="px-6 py-12 text-center">
              <p className="text-gray-500">No call history found.</p>
            </td>
          </tr>
        ) : (
          filteredHistoryData.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => handleEditClick(item)}
                  className="px-3 py-1 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-xs"
                >
                  Edit
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.enquiryNo}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    item.status === "Joining"
                      ? "bg-green-100 text-green-800"
                      : item.status === "Reject"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.candidateSays}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.nextDate || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.timestamp || "-"}
              </td>
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
                        ? "When the candidate will join the company *"
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
