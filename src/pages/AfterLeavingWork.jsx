import React, { useState, useEffect } from 'react';
import { Search, X, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import supabase from "../utils/supabase";


const AfterLeavingWork = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    resignationLetterReceived: false,
    resignationAcceptance: false,
    handoverAssetsIdVisitingCard: false,
    cancellationEmailBiometric: false,
    finalReleaseDate: '',
    removeBenefitEnrollment: false
  });

  const [filterIndentNo, setFilterIndentNo] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [filterName, setFilterName] = useState("");

  const [activeTab, setActiveTab] = useState("pending");

  const fetchLeavingData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("employee_leaving")
        .select("*");

      if (error) throw error;

      const processedData = data.map((row) => ({
        timestamp: row.timestamp || "",
        employeeId: row.employee_id || "",
        name: row.name || "",
        dateOfLeaving: row.date_of_leaving || "",
        mobileNo: row.mobile_number || "",
        reasonOfLeaving: row.reason_of_leaving || "",
        firmName: row.firm_name || "",
        fatherName: row.father_name || "",
        dateOfJoining: row.date_of_joining || "",
        workingLocation: row.work_location || "",
        designation: row.designation || "",
        department: row.department || "",
        plannedDate: row.planned_date || "",
        actual: row.actual || "",

        // 👇 important fields add karo
        resignationLetterReceived: row.resignation_letter_received,
        resignationAcceptance: row.resignation_acceptance,
        handoverAssets: row.handover_of_assets,
        cancellationEmail: row.cancellation_of_email_id,
        removeBenefit: row.remove_benefit_enrollment,
        finalReleaseDate: row.final_release_date
      }));

      // ✅ Pending: checklist complete nahi hua
      const pendingTasks = processedData.filter(
        (task) =>
          !(
            task.resignationLetterReceived &&
            task.resignationAcceptance &&
            task.handoverAssets &&
            task.cancellationEmail &&
            task.removeBenefit &&
            task.finalReleaseDate
          )
      );

      // ✅ History: checklist complete ho gaya
      const historyTasks = processedData.filter(
        (task) =>
          task.resignationLetterReceived &&
          task.resignationAcceptance &&
          task.handoverAssets &&
          task.cancellationEmail &&
          task.removeBenefit &&
          task.finalReleaseDate
      );

      setPendingData(pendingTasks);
      setHistoryData(historyTasks);

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
    fetchLeavingData();
  }, []);

  const handleAfterLeavingClick = async (item) => {
    setFormData({
      resignationLetterReceived: false,
      resignationAcceptance: false,
      handoverAssetsIdVisitingCard: false,
      cancellationEmailBiometric: false,
      finalReleaseDate: '',
      removeBenefitEnrollment: false
    });

    setSelectedItem(item);
    setShowModal(true);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("employee_leaving")
        .select("*")
        .eq("employee_id", item.employeeId)
        .single();

      if (error) throw error;

      setFormData({
        resignationLetterReceived: data.resignation_letter_received || false,
        resignationAcceptance: data.resignation_acceptance || false,
        handoverAssetsIdVisitingCard: data.handover_of_assets || false,
        cancellationEmailBiometric: data.cancellation_of_email_id || false,
        finalReleaseDate: data.final_release_date || '',
        removeBenefitEnrollment: data.remove_benefit_enrollment || false
      });

    } catch (error) {
      console.error("Error fetching current values:", error);
      toast.error("Failed to load current values");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (name) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitting(true);

    if (!selectedItem.employeeId) {
      toast.error("Invalid employee");
      setSubmitting(false);
      return;
    }

    try {
      const now = new Date();
      const currentDateFormatted = now.toISOString().split("T")[0];

      const allConditionsMet =
        formData.resignationLetterReceived &&
        formData.resignationAcceptance &&
        formData.handoverAssetsIdVisitingCard &&
        formData.cancellationEmailBiometric &&
        formData.removeBenefitEnrollment &&
        formData.finalReleaseDate;

      const updatePayload = {
        resignation_letter_received: formData.resignationLetterReceived,
        resignation_acceptance: formData.resignationAcceptance,
        handover_of_assets: formData.handoverAssetsIdVisitingCard,
        cancellation_of_email_id: formData.cancellationEmailBiometric,
        final_release_date: formData.finalReleaseDate || null,
        remove_benefit_enrollment: formData.removeBenefitEnrollment
      };

      // Only update actual if all conditions met
      if (allConditionsMet) {
        updatePayload.actual = currentDateFormatted;
      }

      const { error } = await supabase
        .from("employee_leaving")
        .update(updatePayload)
        .eq("employee_id", selectedItem.employeeId);

      if (error) throw error;

      if (allConditionsMet) {
        toast.success("All conditions met! Actual date updated.");
      } else {
        toast.success("Updated successfully.");
      }

      setShowModal(false);
      fetchLeavingData();

    } catch (error) {
      console.error("Update error:", error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setLoading(false);
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


  const uniqueIndents = Array.from(new Set([...pendingData, ...historyData].map(i => i.employeeId).filter(Boolean)));
  const uniquePosts = Array.from(new Set([...pendingData, ...historyData].map(i => i.designation).filter(Boolean)));
  const uniqueNames = Array.from(new Set([...pendingData, ...historyData].map(i => i.name).filter(Boolean)));

  const filteredPendingData = pendingData.filter(item => {
    const matchesSearch = searchTerm === "" ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.employeeId === filterIndentNo;
    const matchesPost = filterPost === "" || item.designation === filterPost;
    const matchesName = filterName === "" || item.name === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  const filteredHistoryData = historyData.filter(item => {
    const matchesSearch = searchTerm === "" ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.employeeId === filterIndentNo;
    const matchesPost = filterPost === "" || item.designation === filterPost;
    const matchesName = filterName === "" || item.name === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  const displayData = activeTab === "pending" ? filteredPendingData : filteredHistoryData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">After Leaving Work</h1>
      </div>

      {/* Filter and Search */}
      {/* Dynamic Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Indent Number Filter (Mapped to RBP-Joining ID) */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Indent Number</label>
            <div className="relative">
              <input
                type="text"
                list="alwIndentList"
                placeholder="Select/Search Indent/ID"
                value={filterIndentNo}
                onChange={(e) => setFilterIndentNo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="alwIndentList">
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
                list="alwPostList"
                placeholder="Select/Search Post"
                value={filterPost}
                onChange={(e) => setFilterPost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="alwPostList">
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
                list="alwNameList"
                placeholder="Select/Search Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="alwNameList">
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

        {/* Action Buttons: Tabs and Clear Filters */}
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === "pending"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
                }`}
            >
              Pending ({filteredPendingData.length})
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === "history"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
                }`}
            >
              History ({filteredHistoryData.length})
            </button>
          </div>

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



      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white">
              <thead className="bg-gray-100 text-center text-nowrap">
                <tr>
                  {activeTab === "pending" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Joining</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Of Leaving</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason Of Leaving</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white">
                {tableLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center flex-col items-center">
                        <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                        <span className="text-gray-600 text-sm">Loading pending calls...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <p className="text-red-500">Error: {error}</p>
                      <button
                        onClick={fetchLeavingData}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : displayData.length > 0 ? (
                  displayData.map((item, index) => (
                    <tr key={index} className="hover:bg-white">
                      {activeTab === "pending" && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleAfterLeavingClick(item)}
                            className="px-3 py-1 text-white bg-indigo-700 rounded-md text-sm"
                          >
                            Process
                          </button>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{renderField(item.employeeId)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{renderField(item.name)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renderField(item.dateOfJoining ? new Date(item.dateOfJoining).toLocaleDateString() : '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renderField(item.dateOfLeaving ? new Date(item.dateOfLeaving).toLocaleDateString() : '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{renderField(item.designation)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{renderField(item.department)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{renderField(item.reasonOfLeaving)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <p className="text-gray-500">No pending after leaving work found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-700">After Leaving Work Checklist</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={selectedItem.employeeId}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (नाम) </label>
                  <input
                    type="text"
                    value={selectedItem.name}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-700">Checklist Items (चेकलिस्ट आइटम)</h4>

                {[
                  { key: 'resignationLetterReceived', label: 'Resignation Letter Received (त्याग पत्र प्राप्त हुआ)' },
                  { key: 'resignationAcceptance', label: 'Resignation Acceptance (इस्तीफा स्वीकार)' },
                  { key: 'handoverAssetsIdVisitingCard', label: 'Handover Of Assets, ID Card & Visiting Card (संपत्ति, आईडी कार्ड और विजिटिंग कार्ड सौंपना)' },
                  { key: 'cancellationEmailBiometric', label: 'Cancellation Of Email ID & Biometric Access (ईमेल आईडी और बायोमेट्रिक एक्सेस रद्द करना)' },
                  { key: 'removeBenefitEnrollment', label: 'Remove Benefit Enrollment (लाभ नामांकन हटाएँ)' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={item.key}
                      checked={formData[item.key]}
                      onChange={() => handleCheckboxChange(item.key)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={item.key} className="ml-2 text-sm text-gray-700">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Final Release Date (अंतिम रिलीज की तारीख) </label>
                <input
                  type="date"
                  name="finalReleaseDate"
                  value={formData.finalReleaseDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                />
              </div>

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
                  className={`px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 min-h-[42px] flex items-center justify-center ${submitting ? 'opacity-75 cursor-not-allowed' : ''
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Submitting...</span>
                    </div>
                  ) : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AfterLeavingWork;