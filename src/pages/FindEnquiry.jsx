import React, { useState, useEffect } from "react";
import { Search, Clock, CheckCircle, X, Upload } from "lucide-react";
import useDataStore from "../store/dataStore";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";

const FindEnquiry = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [indentData, setIndentData] = useState([]);
  const [enquiryData, setEnquiryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [generatedCandidateNo, setGeneratedCandidateNo] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({});


  const [showEditModal, setShowEditModal] = useState(false);


  const getColumnIndexFromLetter = (column) => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let index = 0;
    for (let i = 0; i < column.length; i++) {
      index = index * 26 + (letters.indexOf(column[i]) + 1);
    }
    return index.toString();
  };


  

const handleEditClick = (item) => {
  setSelectedItem(item);
  setEditFormData({
    applyingForPost: item.applyingForPost || "",
    candidateName: item.candidateName || "",
    candidateDOB: item.candidateDOB || "",
    candidatePhone: item.candidatePhone || "",
    candidateEmail: item.candidateEmail || "",
    previousCompany: item.previousCompany || "",
    jobExperience: item.jobExperience || "",
    department: item.department || "",
    previousPosition: item.previousPosition || "",
    maritalStatus: item.maritalStatus || "",
    presentAddress: item.presentAddress || "",
    aadharNo: item.aadharNo || "",
    status: item.status || "NeedMore",
  });
  setShowEditModal(true);
};

  // Add this function to handle edit input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add this function to save edited data
 const handleSaveEdit = async (e) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    const { error } = await supabase
      .from("enquiry")
      .update({
        applying_post: editFormData.applyingForPost,
        candidate_name: editFormData.candidateName,
        dob: editFormData.candidateDOB,
        candidate_phone: editFormData.candidatePhone,
        candidate_email: editFormData.candidateEmail,
        previous_company_name: editFormData.previousCompany,
        job_experience: editFormData.jobExperience,
        department: editFormData.department,
        previous_position: editFormData.previousPosition,
        marital_status: editFormData.maritalStatus,
        present_address: editFormData.presentAddress,
        aadhar_number: editFormData.aadharNo,
        tracker_status: editFormData.status,
      })
      .eq("timestamp", selectedItem.id);

    if (error) throw error;

    const updatedData = enquiryData.map((item) =>
      item.id === selectedItem.id ? { ...item, ...editFormData } : item,
    );

    setEnquiryData(updatedData);
    setShowEditModal(false);
    setSelectedItem(null);

    toast.success("Enquiry updated successfully!");

    await fetchAllData();
  } catch (error) {
    console.error("Error updating enquiry:", error);
    toast.error(error.message);
  } finally {
    setSubmitting(false);
  }
};

  const [formData, setFormData] = useState({
    candidateName: "",
    candidateDOB: "",
    candidatePhone: "",
    candidateEmail: "",
    previousCompany: "",
    jobExperience: "",
    department: "", // Add this line
    previousPosition: "",
    maritalStatus: "",
    candidatePhoto: null,
    candidateResume: null,
    presentAddress: "",
    aadharNo: "",
  });



  const fetchAllData = async () => {
  setLoading(true);
  setTableLoading(true);
  setError(null);

  try {
    // ===== FETCH INDENT DATA =====
    const { data: indentRows, error: indentError } = await supabase
      .from("indent")
      .select("*");

    if (indentError) throw indentError;

    const processedIndent = indentRows
      .filter((row) => row.status === "NeedMore")
      .map((row) => ({
        id: row.id,
        indentNo: row.indent_number,
        post: row.post,
        department: row.department,
        gender: row.gender,
        prefer: row.prefer,
        numberOfPost: row.number_of_posts,
        competitionDate: row.completion_date,
        socialSite: row.social_site,
        status: row.status,
        plannedDate: row.planned_2,
        actual: row.actual_2,
        experience: row.experience,
      }));

    // ===== FETCH ENQUIRY DATA =====
    const { data: enquiryRows, error: enquiryError } = await supabase
      .from("enquiry")
      .select("*");

    if (enquiryError) throw enquiryError;

    const processedEnquiry = enquiryRows.map((row) => ({
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
      status: row.tracker_status,
      planned_1: row.planned_1, // Add this field
      actual_1: row.actual_1,   // Add this field
    }));

    // ===== RECRUITMENT COUNT LOGIC =====
    const indentRecruitmentCount = {};

    processedEnquiry.forEach((row) => {
      const indentNo = row.indentNo;
      if (indentNo) {
        if (!indentRecruitmentCount[indentNo]) {
          indentRecruitmentCount[indentNo] = 0;
        }
        indentRecruitmentCount[indentNo]++;
      }
    });


    const pendingTasks = processedIndent.filter((task) => {
  const requiredPosts = parseInt(task.numberOfPost) || 0;
  // Count only COMPLETED enquiries (where status is "Complete")
  const completed = processedEnquiry.filter(
    (enquiry) => enquiry.indentNo === task.indentNo && enquiry.status === "Complete"
  ).length;
  return completed < requiredPosts;
});




    setIndentData(pendingTasks);
    setEnquiryData(processedEnquiry);
  } catch (error) {
    console.error("Error fetching data:", error);
    setError(error.message);
    toast.error("Failed to fetch data");
  } finally {
    setLoading(false);
    setTableLoading(false);
  }
};


  const generateNextAAPIndentNumber = () => {
    // Extract all indent numbers from both indentData and enquiryData
    const allIndentNumbers = [
      ...indentData.map((item) => item.indentNo),
      ...enquiryData.map((item) => item.indentNo),
    ].filter(Boolean); // Remove empty/null values

    // Find the highest AAP number
    let maxAAPNumber = 0;

    allIndentNumbers.forEach((indentNo) => {
      const match = indentNo.match(/^AAP-(\d+)$/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxAAPNumber) {
          maxAAPNumber = num;
        }
      }
    });

    // Return the next AAP number
    const nextNumber = maxAAPNumber + 1;
    return `AAP-${String(nextNumber).padStart(2, "0")}`;
  };

  // Generate candidate number based on existing enquiries
  const generateCandidateNumber = () => {
    if (enquiryData.length === 0) {
      return "ENQ-01";
    }

    // Find the highest existing candidate number
    const lastNumber = enquiryData.reduce((max, enquiry) => {
      if (!enquiry.candidateEnquiryNo) return max;

      const match = enquiry.candidateEnquiryNo.match(/ENQ-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const nextNumber = lastNumber + 1;
    return `ENQ-${String(nextNumber).padStart(2, "0")}`;
  };


  // Upload file to Google Drive
  const uploadFileToSupabase = async (file, type) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${generatedCandidateNo}_${type}_${Date.now()}.${fileExt}`;
      const filePath = `candidates/${fileName}`;

      const { error } = await supabase.storage
        .from("candidate-files")
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("candidate-files")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

const historyData = enquiryData.filter(
  (item) => item.planned_1 !== null && 
            item.actual_1 !== null &&
            item.planned_1 !== undefined && 
            item.actual_1 !== undefined &&
            item.planned_1 !== "" && 
            item.actual_1 !== ""
);

  const handleEnquiryClick = (item = null) => {
    let indentNo = "";
    let isNewAAP = false;

    if (item) {
      setSelectedItem(item);
      indentNo = item.indentNo;
    } else {
      // Generate a new AAP indent number for new enquiries
      indentNo = generateNextAAPIndentNumber();
      isNewAAP = true;

      // Create a default empty item for new enquiry
      setSelectedItem({
        indentNo: indentNo,
        post: "",
        gender: "",
        prefer: "",
        numberOfPost: "",
        competitionDate: "",
        socialSite: "",
        status: "NeedMore",
        plannedDate: "",
        actual: "",
        experience: "",
      });
    }

    const candidateNo = generateCandidateNumber();
    setGeneratedCandidateNo(candidateNo);
    setFormData({
      candidateName: "",
      candidateDOB: "",
      candidatePhone: "",
      candidateEmail: "",
      previousCompany: "",
      jobExperience: "",
      department: item ? item.department : "",
      lastSalary: "",
      previousPosition: "",
      reasonForLeaving: "",
      maritalStatus: "",
      lastEmployerMobile: "",
      candidatePhoto: null,
      candidateResume: null,
      referenceBy: "",
      presentAddress: "",
      aadharNo: "",
      status: "NeedMore",
    });
    setShowModal(true);
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if not a valid date
    }

    const day = date.getDate();
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear().toString().slice(-2);

    return `${day}-${month}-${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let photoUrl = "";
      let resumeUrl = "";

      if (formData.candidatePhoto) {
        setUploadingPhoto(true);
        photoUrl = await uploadFileToSupabase(formData.candidatePhoto, "photo");
        setUploadingPhoto(false);
      }

      if (formData.candidateResume) {
        setUploadingResume(true);
        resumeUrl = await uploadFileToSupabase(
          formData.candidateResume,
          "resume",
        );
        setUploadingResume(false);
      }

      const now = new Date();

      const { error } = await supabase.from("enquiry").insert([
        {
          timestamp: now,
          indent_number: selectedItem.indentNo,
          candidate_enquiry_number: generatedCandidateNo,
          applying_post: selectedItem.post,
          candidate_name: formData.candidateName,
          dob: formData.candidateDOB || null,
          candidate_phone: formData.candidatePhone,
          candidate_email: formData.candidateEmail,
          previous_company_name: formData.previousCompany,
          job_experience: formData.jobExperience,
          department: formData.department,
          previous_position: formData.previousPosition,
          marital_status: formData.maritalStatus,
          candidate_photo: photoUrl,
          present_address: formData.presentAddress,
          aadhar_number: formData.aadharNo,
          resume_copy: resumeUrl,
          tracker_status: formData.status || "NeedMore",
        },
      ]);

      if (error) throw error;

      toast.success("Enquiry submitted successfully");

      setShowModal(false);
      fetchAllData();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
      setUploadingPhoto(false);
      setUploadingResume(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [field]: file,
      }));
    }
  };

  const filteredPendingData = indentData.filter((item) => {
    const matchesSearch =
      item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidateEnquiryNo
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Find Enquiry</h1>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-400 border-opacity-30 rounded-lg focus:outline-none focus:ring-2  bg-white bg-opacity-10 focus:ring-indigo-500 text-gray-600  "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 opacity-60"
            />
          </div>
        </div>
        <button
          onClick={() => handleEnquiryClick()}
          className="px-3 py-2 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 text-sm"
        >
          New Enquiry
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300 border-opacity-20">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "pending"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} className="inline mr-2" />
              Pending ({filteredPendingData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                activeTab === "history"
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
              <table className="min-w-full divide-y divide-gray-200 text-nowrap">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Indent No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Prefer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Number Of Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Competition Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading pending enquiries...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPendingData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending enquiries found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPendingData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEnquiryClick(item)}
                            className="px-3 py-1 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 text-sm"
                          >
                            Enquiry
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.indentNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.post}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.gender}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.prefer || "-"} {item.experience}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.numberOfPost}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.competitionDate
                            ? new Date(
                                item.competitionDate,
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

{activeTab === "history" && (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50 text-nowrap">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Action
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Indent No.
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Enquiry No.
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Post
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Department
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Candidate Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            DOB
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Phone
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Prev. Company
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Experience
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Prev. Position
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Marital Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Address
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Aadhar No.
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Photo
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Resume
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {tableLoading ? (
          <tr>
            <td colSpan="18" className="px-6 py-12 text-center">
              <div className="flex justify-center flex-col items-center">
                <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                <span className="text-gray-600 text-sm">
                  Loading enquiry history...
                </span>
              </div>
            </td>
          </tr>
        ) : filteredHistoryData.length === 0 ? (
          <tr>
            <td colSpan="18" className="px-6 py-12 text-center">
              <p className="text-gray-500">
                No enquiry history found.
              </p>
            </td>
          </tr>
        ) : (
          filteredHistoryData.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => handleEditClick(item)}
                  disabled={submitting}
                  className="px-3 py-1 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-xs"
                >
                  Edit
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
                {item.candidateDOB ? new Date(item.candidateDOB).toLocaleDateString() : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.candidatePhone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.candidateEmail}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.previousCompany || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.jobExperience || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.previousPosition || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.maritalStatus || "-"}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {item.presentAddress ? (
                  <div className="max-w-xs truncate" title={item.presentAddress}>
                    {item.presentAddress}
                  </div>
                ) : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.aadharNo || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.candidatePhoto ? (
                  item.candidatePhoto.endsWith(".jpg") ||
                  item.candidatePhoto.endsWith(".jpeg") ||
                  item.candidatePhoto.endsWith(".png") ? (
                    <img
                      src={item.candidatePhoto}
                      alt="candidate"
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <a
                      href={item.candidatePhoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View File
                    </a>
                  )
                ) : "-"}
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
                ) : "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.status === "Complete"
                      ? "bg-green-100 text-green-800"
                      : item.status === "NeedMore"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {item.status === "NeedMore"
                    ? "Need More"
                    : item.status || "-"}
                </span>
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
  <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Edit Enquiry</h2>
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
        
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Indent No. (इंडेंट नंबर)
              </label>
              <input
                type="text"
                value={selectedItem.indentNo}
                disabled
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Candidate Enquiry No. (उम्मीदवार इन्क्वायरी संख्या)
              </label>
              <input
                type="text"
                value={selectedItem.candidateEnquiryNo}
                disabled
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-gray-100 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Applying For Post (पद के लिए आवेदन)
              </label>
              <input
                type="text"
                name="applyingForPost"
                value={editFormData.applyingForPost}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Department (विभाग)
              </label>
              <input
                type="text"
                name="department"
                value={editFormData.department}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Candidate Name (उम्मीदवार का नाम) *
              </label>
              <input
                type="text"
                name="candidateName"
                value={editFormData.candidateName}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Candidate DOB (उम्मीदवार की जन्मतिथि)
              </label>
              <input
                type="date"
                name="candidateDOB"
                value={editFormData.candidateDOB}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Candidate Phone (उम्मीदवार का फ़ोन) *
              </label>
              <input
                type="tel"
                name="candidatePhone"
                value={editFormData.candidatePhone}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Candidate Email (उम्मीदवार ईमेल)
              </label>
              <input
                type="email"
                name="candidateEmail"
                value={editFormData.candidateEmail}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Previous Company (पिछली कंपनी)
              </label>
              <input
                type="text"
                name="previousCompany"
                value={editFormData.previousCompany}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Job Experience (काम का अनुभव)
              </label>
              <input
                type="text"
                name="jobExperience"
                value={editFormData.jobExperience}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Previous Position (पिछला पद)
              </label>
              <input
                type="text"
                name="previousPosition"
                value={editFormData.previousPosition}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Marital Status (वैवाहिक स्थिति)
              </label>
              <select
                name="maritalStatus"
                value={editFormData.maritalStatus}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Current Address (वर्त्तमान पता)
            </label>
            <textarea
              name="presentAddress"
              value={editFormData.presentAddress}
              onChange={handleEditInputChange}
              rows={3}
              className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Aadhar Number (आधार नंबर)
              </label>
              <input
                type="text"
                name="aadharNo"
                value={editFormData.aadharNo}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Status (स्थिति) *
              </label>
              <select
                name="status"
                value={editFormData.status}
                onChange={handleEditInputChange}
                className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                required
              >
                <option value="NeedMore">Need More</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedItem(null);
              }}
              className="px-4 py-2 border border-gray-300 border-opacity-30 rounded-md text-gray-500 hover:bg-gray-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 flex items-center justify-center min-w-[100px]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 flex right-4"
              >
                <X size={20} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Indent No. (इंडेंट नंबर)
                  </label>
                  <input
                    type="text"
                    value={selectedItem.indentNo}
                    disabled
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-white bg-opacity-5 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Enquiry No. (उम्मीदवार इन्क्वायरी संख्या)
                  </label>
                  <input
                    type="text"
                    value={generatedCandidateNo}
                    disabled
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 bg-white bg-opacity-5 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Applying For Post (पद के लिए आवेदन)
                  </label>
                  <input
                    type="text"
                    value={selectedItem.post}
                    onChange={(e) => {
                      setSelectedItem((prev) => ({
                        ...prev,
                        post: e.target.value,
                      }));
                    }}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Department (विभाग)
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Name (उम्मीदवार का नाम) *
                  </label>
                  <input
                    type="text"
                    name="candidateName"
                    value={formData.candidateName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate DOB (उम्मीदवार की जन्मतिथि)
                  </label>
                  <input
                    type="date"
                    name="candidateDOB"
                    value={formData.candidateDOB}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Phone (उम्मीदवार का फ़ोन) *
                  </label>
                  <input
                    type="tel"
                    name="candidatePhone"
                    value={formData.candidatePhone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Email (उम्मीदवार ईमेल)
                  </label>
                  <input
                    type="email"
                    name="candidateEmail"
                    value={formData.candidateEmail}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Previous Company (पिछली कंपनी)
                  </label>
                  <input
                    type="text"
                    name="previousCompany"
                    value={formData.previousCompany}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Job Experience (काम का अनुभव)
                  </label>
                  <input
                    type="text"
                    name="jobExperience"
                    value={formData.jobExperience}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Previous Position (पिछला पद)
                  </label>
                  <input
                    type="text"
                    name="previousPosition"
                    value={formData.previousPosition}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Marital Status (वैवाहिक स्थिति)
                  </label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Current Address (वर्त्तमान पता)
                </label>
                <textarea
                  name="presentAddress"
                  value={formData.presentAddress}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500 placeholder-white placeholder-opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Photo (उम्मीदवार फोटो)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e, "candidatePhoto")}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 border-opacity-30 rounded-md cursor-pointer hover:bg-white hover:bg-opacity-10 text-gray-500"
                    >
                      <Upload size={16} className="mr-2" />
                      {uploadingPhoto ? "Uploading..." : "Upload File"}
                    </label>
                    {formData.candidatePhoto && !uploadingPhoto && (
                      <span className="text-sm text-gray-500 opacity-80">
                        {formData.candidatePhoto.name}
                      </span>
                    )}
                    {uploadingPhoto && (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-dashed rounded-full animate-spin mr-2"></div>
                        <span className="text-sm text-gray-500">
                          Uploading photo...
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Max 10MB. Supports: JPG, JPEG, PNG, PDF, DOC, DOCX
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Candidate Resume (उम्मीदवार का बायोडाटा)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, "candidateResume")}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="flex items-center px-4 py-2 border border-gray-300 border-opacity-30 rounded-md cursor-pointer hover:bg-white hover:bg-opacity-10 text-gray-500"
                    >
                      <Upload size={16} className="mr-2" />
                      {uploadingResume ? "Uploading..." : "Upload File"}
                    </label>
                    {formData.candidateResume && !uploadingResume && (
                      <span className="text-sm text-gray-500 opacity-80">
                        {formData.candidateResume.name}
                      </span>
                    )}
                    {uploadingResume && (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-indigo-500 border-dashed rounded-full animate-spin mr-2"></div>
                        <span className="text-sm text-gray-500">
                          Uploading resume...
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Max 10MB. Supports: PDF, DOC, DOCX, JPG, JPEG, PNG
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Status (स्थिति) *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 border-opacity-30 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white bg-white bg-opacity-10 text-gray-500"
                    
                  >
                    <option value="NeedMore">Need More </option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 border-opacity-30 rounded-md text-gray-500 hover:bg-white hover:bg-opacity-10"
                  disabled={submitting || uploadingPhoto || uploadingResume}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-opacity-90 flex items-center justify-center"
                  disabled={submitting || uploadingPhoto || uploadingResume}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Submitting...
                    </>
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

export default FindEnquiry;
