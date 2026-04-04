import React, { useState, useEffect } from "react";
import { Filter, Search, Clock, CheckCircle, X } from "lucide-react";
import useDataStore from "../store/dataStore";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";



const AfterJoiningWork = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);


  // Add these state declarations near your other useState declarations
const [editMode, setEditMode] = useState(false);
const [editingItem, setEditingItem] = useState(null);
const [editFormData, setEditFormData] = useState({});
const [editSubmitting, setEditSubmitting] = useState(false);

// Add these functions
const handleEditClick = (item) => {
  setEditMode(true);
  setEditingItem(item);
  setEditFormData({
    candidateName: item.candidateName || '',
    designation: item.designation || '',
    joiningNo: item.joiningNo || '',
    dateOfJoining: item.dateOfJoining || '',
    pdcCheckbox: item.pdcCheckbox || '-'
  });
};

const handleEditInputChange = (e) => {
  const { name, value } = e.target;
  setEditFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleEditSubmit = async (item) => {
  setEditSubmitting(true);

  try {
    const { error } = await supabase
      .from("joining")
      .update({
        name_as_per_aadhar: editFormData.candidateName,
        designation: editFormData.designation,
        date_of_joining: editFormData.dateOfJoining,
        pdc: editFormData.pdcCheckbox === "YES" ? "YES" : "-"
      })
      .eq("rbp_joining_id", item.joiningNo);

    if (error) throw error;

    const updatedHistoryData = historyData.map((h) =>
      h.joiningNo === item.joiningNo ? { ...h, ...editFormData } : h
    );

    setHistoryData(updatedHistoryData);

    toast.success("Record updated successfully!");
    setEditMode(false);
    setEditingItem(null);

    await fetchJoiningData();
  } catch (error) {
    console.error("Error updating:", error);
    toast.error(`Failed to update: ${error.message}`);
  } finally {
    setEditSubmitting(false);
  }
};


const updateJoiningRecord = async (joiningNo, formData) => {
  try {
    const allFieldsYes =
      formData.checkSalarySlipResume &&
      formData.offerLetterReceived &&
      formData.welcomeMeeting &&
      formData.biometricAccess &&
      formData.officialEmailId &&
      formData.assignAssets &&
      formData.pfEsic &&
      formData.companyDirectory;

    const updatePayload = {
      salary_slip_resume_checked: formData.checkSalarySlipResume,
      offer_letter_received: formData.offerLetterReceived,
      welcome_meeting: formData.welcomeMeeting,
      biometric_access: formData.biometricAccess,
      official_email_id: formData.officialEmailId,
      assets_assigned: formData.assignAssets,
      pf_esic_completed: formData.pfEsic,
      company_directory_added: formData.companyDirectory,
      pdc: formData.pdoCheckbox ? "YES" : "-"
    };

    if (allFieldsYes) {
      updatePayload.actual_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from("joining")
      .update(updatePayload)
      .eq("rbp_joining_id", joiningNo);

    if (error) throw error;

    toast.success("Data updated successfully");

    fetchJoiningData();
  } catch (error) {
    console.error(error);
    toast.error(error.message);
  }
};


  const [formData, setFormData] = useState({
    checkSalarySlipResume: false,
    offerLetterReceived: false,
    welcomeMeeting: false,
    biometricAccess: false,
    punchCode: "", // Add punch code field
    officialEmailId: false,
    emailId: "",
    emailPassword: "",
    assignAssets: false,
    // Remove image upload fields and replace with input fields
    laptop: "",
    mobile: "",
    vehicle: "",
    other: "",
    // Keep these for manual image upload
    manualImage: null,
    manualImageUrl: "",
    pfEsic: false,
    pfNumber: "",
    esicNumber: "",
    companyDirectory: false,
    pdoCheckbox: false,
    pdcFile: null,
    pdcFileUrl: "",
    assets: [],
  });



const fetchJoiningData = async () => {
  setLoading(true);
  setTableLoading(true);
  setError(null);

  try {
    const { data, error } = await supabase
      .from("joining")
      .select("*")
      .order("timestamp_date", { ascending: false });

    if (error) throw error;

    // Also fetch assets data for each employee
    const processedData = await Promise.all(data.map(async (row) => {
      // Fetch assets data for this employee
      const { data: assetsData } = await supabase
        .from("assets")
        .select("*")
        .eq("employee_id", row.rbp_joining_id)
        .order("timestamp", { ascending: false })
        .limit(1);
      
      const latestAsset = assetsData?.[0];

      return {
        timestamp: row.timestamp_date || "",
        joiningNo: row.rbp_joining_id || "",
        candidateName: row.name_as_per_aadhar || "",
        fatherName: row.father_name || "",
        dateOfJoining: row.date_of_joining || "",
        joiningPlace: row.work_location || "",
        designation: row.designation || "",
        salary: row.salary || "",
        aadharPhoto: row.aadhar_front_photo || "",
        panCard: row.pan_card || "",
        currentAddress: row.current_address || "",
        addressAsPerAadhar: row.aadhar_address || "",
        bodAsPerAadhar: row.date_of_birth || "",
        gender: row.gender || "",
        mobileNo: row.mobile_number || "",
        familyMobileNo: row.family_number || "",
        relationWithFamily: row.family_relationship || "",
        pfId: row.past_pf_id || "",
        accountNo: row.bank_account_number || "",
        ifscCode: row.ifsc_code || "",
        branchName: row.branch_name || "",
        email: row.personal_email || "",
        esicNo: row.past_esic_number || "",
        plannedDate: row.planned_date || "",
        actual: row.actual_date || "",
        pdcCheckbox: row.pdc === "YES" ? "YES" : "-",
        
        // Add all the new fields from the checklist
        salarySlipResume: row.salary_slip_resume_checked || false,
        offerLetterReceived: row.offer_letter_received || false,
        welcomeMeeting: row.welcome_meeting || false,
        biometricAccess: row.biometric_access || false,
        officialEmailId: row.official_email_id || false,
        assignAssets: row.assets_assigned || false,
        pfEsic: row.pf_esic_completed || false,
        companyDirectory: row.company_directory_added || false,
        
        // Fields from assets table
        punchCode: latestAsset?.punch_code || "",
        emailPassword: latestAsset?.email_password || "",
        laptop: latestAsset?.laptop || "",
        mobile: latestAsset?.mobile || "",
        vehicle: latestAsset?.vehicle || "",
        sim: latestAsset?.sim || "",
        agreementDocument: latestAsset?.manual || "",
        pfNumber: latestAsset?.pf || "",
        esicNumber: latestAsset?.esic || "",
        pdcFileUrl: latestAsset?.pdc_file || "",
      };
    }));

    const pendingTasks = processedData.filter(
      (task) => task.plannedDate && !task.actual
    );

    const historyTasks = processedData.filter(
      (task) => task.plannedDate && task.actual
    );

    setPendingData(pendingTasks);
    setHistoryData(historyTasks);
  } catch (error) {
    console.error("Error fetching joining data:", error);
    setError(error.message);
    toast.error(`Failed to load joining data: ${error.message}`);
  } finally {
    setLoading(false);
    setTableLoading(false);
  }
};

const fetchAssetsData = async (employeeId) => {
  try {
    if (!employeeId) return null;

    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("employee_id", employeeId)
      .order("timestamp", { ascending: false })
      .limit(1);

    if (error) throw error;

    const row = data?.[0];

    return {
      punchCode: row?.punch_code || "",
      emailId: row?.email_id || "",
      emailPassword: row?.email_password || "",
      laptop: row?.laptop || "",
      mobile: row?.mobile || "",
      vehicle: row?.vehicle || "",
      other: row?.sim || "",
      manualImageUrl: row?.manual || "",
      pfNumber: row?.pf || "",
      esicNumber: row?.esic || "",
      pdcFileUrl: row?.pdc_file || "",
    };
  } catch (error) {
    console.error("Assets fetch error:", error);
    return null;
  }
};



  useEffect(() => {
    fetchJoiningData();
  }, []);



const handleAfterJoiningClick = async (item) => {
  // Reset form data first
  setFormData({
    checkSalarySlipResume: false,
    offerLetterReceived: false,
    welcomeMeeting: false,
    biometricAccess: false,
    punchCode: "",
    officialEmailId: false,
    emailId: "",
    emailPassword: "",
    assignAssets: false,
    laptop: "",
    mobile: "",
    vehicle: "",
    other: "",
    manualImage: null,
    manualImageUrl: "",
    pfEsic: false,
    pfNumber: "",
    esicNumber: "",
    companyDirectory: false,
    pdoCheckbox: false,
    pdcFile: null,
    pdcFileUrl: "",
    assets: [],
  });

  setSelectedItem(item);
  setShowModal(true);
  setLoading(true);

  try {
    // Fetch from joining table
    const { data: joiningData, error: joiningError } = await supabase
      .from("joining")
      .select(`
        salary_slip_resume_checked,
        offer_letter_received,
        welcome_meeting,
        biometric_access,
        official_email_id,
        assets_assigned,
        pf_esic_completed,
        company_directory_added,
        pdc
      `)
      .eq("rbp_joining_id", item.joiningNo)
      .single();

    if (joiningError) throw joiningError;

    // Fetch from assets table
    const { data: assetsData, error: assetsError } = await supabase
      .from("assets")
      .select("*")
      .eq("employee_id", item.joiningNo)
      .order("timestamp", { ascending: false })
      .limit(1);

    if (assetsError) throw assetsError;

    const latestAsset = assetsData?.[0];

    console.log("Joining Data:", joiningData);
    console.log("Assets Data:", latestAsset);

    // IMPORTANT: Set the form data with all values
    const updatedFormData = {
      // Joining table checkboxes
      checkSalarySlipResume: joiningData?.salary_slip_resume_checked || false,
      offerLetterReceived: joiningData?.offer_letter_received || false,
      welcomeMeeting: joiningData?.welcome_meeting || false,
      biometricAccess: joiningData?.biometric_access || false,
      officialEmailId: !!(joiningData?.official_email_id && joiningData.official_email_id !== ""),
      assignAssets: joiningData?.assets_assigned || false,
      pfEsic: joiningData?.pf_esic_completed || false,
      companyDirectory: joiningData?.company_directory_added || false,
      pdoCheckbox: joiningData?.pdc === "YES",
      
      // Email from joining table
      emailId: joiningData?.official_email_id || latestAsset?.email_id || "",
      
      // All fields from assets table
      emailPassword: latestAsset?.email_password || "",
      punchCode: latestAsset?.punch_code || "",
      laptop: latestAsset?.laptop || "",
      mobile: latestAsset?.mobile || "",
      vehicle: latestAsset?.vehicle || "",
      other: latestAsset?.sim || "",
      manualImageUrl: latestAsset?.manual || "",
      pfNumber: latestAsset?.pf || "",
      esicNumber: latestAsset?.esic || "",
      pdcFileUrl: latestAsset?.pdc_file || "",
      
      // Reset file inputs
      manualImage: null,
      pdcFile: null,
    };

    console.log("Setting Form Data:", updatedFormData);
    
    setFormData(updatedFormData);
    
    toast.success("Data loaded successfully");
    
  } catch (error) {
    console.error("Error fetching data:", error);
    toast.error("Failed to load existing data");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  console.log("Current Form Data State:", {
    checkSalarySlipResume: formData.checkSalarySlipResume,
    offerLetterReceived: formData.offerLetterReceived,
    welcomeMeeting: formData.welcomeMeeting,
    biometricAccess: formData.biometricAccess,
    pfEsic: formData.pfEsic,
    companyDirectory: formData.companyDirectory,
    pdoCheckbox: formData.pdoCheckbox,
    punchCode: formData.punchCode,
    emailId: formData.emailId,
    laptop: formData.laptop,
    mobile: formData.mobile,
    pfNumber: formData.pfNumber,
    esicNumber: formData.esicNumber,
    pdcFileUrl: formData.pdcFileUrl,
    manualImageUrl: formData.manualImageUrl,
  });
}, [formData]);


  const handleCheckboxChange = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };

  // Save assets data to Assets sheet
const saveAssetsData = async (employeeId, employeeName, assetsData) => {
  try {
    // ✅ STEP 1: joining table update (same as before)
    const { error: joiningError } = await supabase
      .from("joining")
      .update({
        official_email_id: assetsData.emailId,
        pdc: assetsData.pdcFileUrl ? "YES" : "-",
      })
      .eq("rbp_joining_id", employeeId);

    if (joiningError) throw joiningError;

    // ✅ STEP 2: INSERT into assets table (NEW ADD)
    const { error: assetsError } = await supabase
      .from("assets")
      .insert([
        {
          employee_id: employeeId,
          employee_name: employeeName,
          email_id: assetsData.emailId,
          email_password: assetsData.emailPassword,
          laptop: assetsData.laptop,
          mobile: assetsData.mobile,
          vehicle: assetsData.vehicle,
          sim: assetsData.other,
          manual: assetsData.manualImageUrl,
          punch_code: assetsData.punchCode,
          pf: assetsData.pfNumber,
          esic: assetsData.esicNumber,
          pdc_file: assetsData.pdcFileUrl,
        },
      ]);

    if (assetsError) throw assetsError;

    console.log("✅ Assets data inserted successfully");

    return { success: true };
  } catch (error) {
    throw new Error(`Failed to save assets data: ${error.message}`);
  }
};




 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setSubmitting(true);

  if (!selectedItem.joiningNo || !selectedItem.candidateName) {
    toast.error("Please fill all required fields");
    setSubmitting(false);
    return;
  }

  try {
    // Upload manual image if new file selected
    let manualImageUrl = formData.manualImageUrl;
    if (formData.manualImage) {
      // You'll need to implement file upload to Supabase Storage
      const fileExt = formData.manualImage.name.split('.').pop();
      const fileName = `${selectedItem.joiningNo}_manual_${Date.now()}.${fileExt}`;
      const filePath = `company-directory/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('joining-documents')
        .upload(filePath, formData.manualImage);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('joining-documents')
        .getPublicUrl(filePath);
      
      manualImageUrl = publicUrl;
    }

    // Upload PDC File if selected
    let finalPdcFileUrl = formData.pdcFileUrl;
    if (formData.pdoCheckbox && formData.pdcFile) {
      const fileExt = formData.pdcFile.name.split('.').pop();
      const fileName = `${selectedItem.joiningNo}_pdc_${Date.now()}.${fileExt}`;
      const filePath = `pdc/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('joining-documents')
        .upload(filePath, formData.pdcFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('joining-documents')
        .getPublicUrl(filePath);
      
      finalPdcFileUrl = publicUrl;
    }

    const allFieldsYes =
      formData.checkSalarySlipResume &&
      formData.offerLetterReceived &&
      formData.welcomeMeeting &&
      formData.biometricAccess &&
      formData.officialEmailId &&
      formData.assignAssets &&
      formData.pfEsic &&
      formData.companyDirectory;

    // Update joining table
    const updatePayload = {
      salary_slip_resume_checked: formData.checkSalarySlipResume,
      offer_letter_received: formData.offerLetterReceived,
      welcome_meeting: formData.welcomeMeeting,
      biometric_access: formData.biometricAccess,
      official_email_id: formData.emailId,
      assets_assigned: formData.assignAssets,
      pf_esic_completed: formData.pfEsic,
      company_directory_added: formData.companyDirectory,
      pdc: formData.pdoCheckbox ? "YES" : "-",
    };

    if (allFieldsYes) {
      updatePayload.actual_date = new Date().toISOString().split('T')[0];
    }

    // If you have a separate assets table, you'd update it here
    // For now, we'll update only the joining table

    const { error: updateError } = await supabase
      .from("joining")
      .update(updatePayload)
      .eq("rbp_joining_id", selectedItem.joiningNo);

    if (updateError) throw updateError;

    // Save assets data (if you have a separate table)
    await saveAssetsData(selectedItem.joiningNo, selectedItem.candidateName, {
      emailId: formData.emailId,
      emailPassword: formData.emailPassword,
      laptop: formData.laptop,
      mobile: formData.mobile,
      vehicle: formData.vehicle,
      other: formData.other,
      manualImageUrl: manualImageUrl,
      punchCode: formData.punchCode,
      pfNumber: formData.pfNumber,
      esicNumber: formData.esicNumber,
      pdcFileUrl: formData.pdoCheckbox ? finalPdcFileUrl : "",
    });

    if (allFieldsYes) {
      toast.success("All conditions met! Data saved and actual date updated successfully.");
    } else {
      toast.success("Data saved successfully. Actual date will be updated when all conditions are met.");
    }

    setShowModal(false);
    fetchJoiningData();
  } catch (error) {
    console.error("Update error:", error);
    toast.error(`Update failed: ${error.message}`);
  } finally {
    setLoading(false);
    setSubmitting(false);
  }
};

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    // Handle the format "2021-11-01"
    if (dateString.includes("-")) {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        const day = parts[2];
        const month = parts[1];
        const year = parts[0].slice(-2); // Get last 2 digits of year
        return `${day}/${month}/${year}`;
      }
    }

    // Fallback for other formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed, so add 1
    const year = date.getFullYear().toString().slice(-2);

    return `${day}/${month}/${year}`;
  };

  const filteredPendingData = pendingData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.joiningNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredHistoryData = historyData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.joiningNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold  ">After Joining Work</h1>
      </div>

      <div className="bg-white  p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search Something..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300   rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white   text-gray-500    "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2  text-gray-500  "
            />
          </div>
        </div>
      </div>

      <div className="bg-white  rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300  ">
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

        <div className="p-6">
          {activeTab === "pending" && (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100 sticky top-0 z-10 text-nowrap">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RBP-Joining ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Father Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Of Joining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
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
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredPendingData.length > 0 ? (
                    filteredPendingData.map((item, index) => (
                      <tr key={index} className="hover:bg-white">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleAfterJoiningClick(item)}
                            className="px-3 py-1 bg-indigo-700 text-white rounded-md text-sm"
                          >
                            Process
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.joiningNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.candidateName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.fatherName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDOB(item.dateOfJoining)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.designation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.salary}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending after joining work found.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}


{activeTab === "history" && (
  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
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
            Designation
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date Of Joining
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Salary Slip & Resume
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Offer Letter
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Welcome Meeting
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Biometric Access
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Punch Code
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Official Email ID
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email Password
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Assets Assigned
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Laptop
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Mobile
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Vehicle
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            SIM
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            PF/ESIC
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            PF Number
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            ESIC Number
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Company Directory
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Agreement Document
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            PDC
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            PDC File
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white">
        {tableLoading ? (
          <tr>
            <td colSpan="25" className="px-6 py-12 text-center">
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
            <td colSpan="25" className="px-6 py-12 text-center">
              <p className="text-gray-500">No call history found.</p>
            </td>
          </tr>
        ) : (
          filteredHistoryData.map((item, index) => (
            <tr key={index} className="hover:bg-white hover:">
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {editMode && editingItem?.joiningNo === item.joiningNo ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditSubmit(item)}
                      disabled={editSubmitting}
                      className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-green-700 text-xs flex items-center justify-center min-w-[60px]"
                    >
                      {editSubmitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-1 h-3 w-3 text-white"
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
                          Save
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditingItem(null);
                      }}
                      disabled={editSubmitting}
                      className="px-3 py-1 text-white bg-gray-600 rounded-md hover:bg-gray-700 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEditClick(item)}
                    className="px-3 py-1 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-xs"
                  >
                    Edit
                  </button>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editMode && editingItem?.joiningNo === item.joiningNo ? (
                  <input
                    type="text"
                    name="joiningNo"
                    value={editFormData.joiningNo}
                    onChange={handleEditInputChange}
                    className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                ) : (
                  item.joiningNo
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editMode && editingItem?.joiningNo === item.joiningNo ? (
                  <input
                    type="text"
                    name="candidateName"
                    value={editFormData.candidateName}
                    onChange={handleEditInputChange}
                    className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                ) : (
                  item.candidateName
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editMode && editingItem?.joiningNo === item.joiningNo ? (
                  <input
                    type="text"
                    name="designation"
                    value={editFormData.designation}
                    onChange={handleEditInputChange}
                    className="w-32 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                ) : (
                  item.designation
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editMode && editingItem?.joiningNo === item.joiningNo ? (
                  <input
                    type="text"
                    name="dateOfJoining"
                    value={editFormData.dateOfJoining}
                    onChange={handleEditInputChange}
                    className="w-28 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                ) : (
                  formatDOB(item.dateOfJoining)
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${item.salarySlipResume ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.salarySlipResume ? '✓' : '✗'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${item.offerLetterReceived ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.offerLetterReceived ? '✓' : '✗'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${item.welcomeMeeting ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.welcomeMeeting ? '✓' : '✗'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${item.biometricAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.biometricAccess ? '✓' : '✗'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.punchCode || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${item.officialEmailId ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.officialEmailId ? '✓' : '✗'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.emailPassword ? '✓ Set' : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${item.assignAssets ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.assignAssets ? '✓' : '✗'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.laptop || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.mobile || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.vehicle || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.sim || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${item.pfEsic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.pfEsic ? '✓' : '✗'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.pfNumber || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.esicNumber || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className={`px-2 py-1 text-xs rounded-full ${item.companyDirectory ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {item.companyDirectory ? '✓' : '✗'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.agreementDocument ? (
                  <a href={item.agreementDocument} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View
                  </a>
                ) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {editMode && editingItem?.joiningNo === item.joiningNo ? (
                  <select
                    name="pdcCheckbox"
                    value={editFormData.pdcCheckbox}
                    onChange={handleEditInputChange}
                    className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="-">-</option>
                    <option value="YES">YES</option>
                  </select>
                ) : (
                  item.pdcCheckbox === "YES" ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 font-semibold text-indigo-800">
                      YES
                    </span>
                  ) : (
                    <span>-</span>
                  )
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.pdcFileUrl ? (
                  <a href={item.pdcFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View
                  </a>
                ) : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span className="px-2 py-1 text-xs rounded-full bg-green-500 font-semibold text-white">
                  Completed
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
    {filteredHistoryData.length === 0 && (
      <div className="px-6 py-12 text-center">
        <p className="text-gray-500">No after joining work history found.</p>
      </div>
    )}
  </div>
)}
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-500">
                After Joining Work Checklist
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Employee ID (कर्मचारी आईडी)
                  </label>
                  <input
                    type="text"
                    value={selectedItem.joiningNo}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Name (नाम)
                  </label>
                  <input
                    type="text"
                    value={selectedItem.candidateName}
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-500">
                  Checklist Items (चेकलिस्ट आइटम)
                </h4>
                {[
                  {
                    key: "checkSalarySlipResume",
                    label:
                      "Check Salary Slip & Resume Copy (वेतन पर्ची और बायोडाटा कॉपी)",
                  },
                  {
                    key: "offerLetterReceived",
                    label: "Offer Letter Received (प्रस्ताव पत्र प्राप्त हुआ)",
                  },
                  {
                    key: "welcomeMeeting",
                    label: "Welcome Meeting (स्वागत बैठक)",
                  },
                  {
                    key: "biometricAccess",
                    label: "Biometric Access बॉयोमीट्रिक ऐक्सेस",
                  },
                ].map((item) => (
                  <div key={item.key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={item.key}
                      checked={formData[item.key]}
                      onChange={() => handleCheckboxChange(item.key)}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor={item.key}
                      className="ml-2 text-sm text-gray-500"
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
         {formData.biometricAccess && (
  <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
    <div className="grid grid-cols-1 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">
          Punch Code
        </label>
        <input
          type="text"
          name="punchCode"
          value={formData.punchCode}
          onChange={handleInputChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder="Enter punch code"
        />
        {formData.punchCode && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Current: {formData.punchCode}
          </p>
        )}
      </div>
    </div>
  </div>
)}
                {/* Official Email ID Section */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="officialEmailId"
                      checked={formData.officialEmailId}
                      onChange={() => handleCheckboxChange("officialEmailId")}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="officialEmailId"
                      className="ml-2 text-sm text-gray-500"
                    >
                      Official Email ID (ऑफ़िशियल ईमेल आईडी)
                    </label>
                  </div>
{formData.officialEmailId && (
  <div className="mt-2 ml-6 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">
        Email ID
      </label>
      <input
        type="text"
        name="emailId"
        value={formData.emailId}
        onChange={handleInputChange}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        placeholder="Enter email ID"
      />
      {formData.emailId && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Current: {formData.emailId}
        </p>
      )}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">
        Password
      </label>
      <input
        type="password"
        name="emailPassword"
        value={formData.emailPassword}
        onChange={handleInputChange}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        placeholder="Enter password"
      />
      {formData.emailPassword && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Password set
        </p>
      )}
    </div>
  </div>
)}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="assignAssets"
                    checked={formData.assignAssets}
                    onChange={() => handleCheckboxChange("assignAssets")}
                    className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                  />
                  <label
                    htmlFor="assignAssets"
                    className="ml-2 text-sm text-gray-500"
                  >
                    Assign Assets (असाइन एसेट्स)
                  </label>
                </div>
{formData.assignAssets && (
  <div className="mt-2 ml-6 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
    {[
      { id: "laptop", label: "Laptop" },
      { id: "mobile", label: "Mobile" },
      { id: "vehicle", label: "Vehicle" },
      { id: "other", label: "SIM" },
    ].map((asset) => (
      <div key={asset.id} className="space-y-2">
        <label className="block text-sm font-medium text-gray-500">
          {asset.label}
        </label>
        <input
          type="text"
          name={asset.id}
          value={formData[asset.id]}
          onChange={handleInputChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          placeholder={`Enter ${asset.label} details`}
        />
        {formData[asset.id] && (
          <p className="text-xs text-green-600 mt-1">
            ✓ Current: {formData[asset.id]}
          </p>
        )}
      </div>
    ))}
  </div>
)}

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="pfEsic"
                      checked={formData.pfEsic}
                      onChange={() => handleCheckboxChange("pfEsic")}
                      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
                    />
                    <label
                      htmlFor="pfEsic"
                      className="ml-2 text-sm text-gray-500"
                    >
                      PF / ESIC (पी.एफ./ई.एस.आई.सी.)
                    </label>
                  </div>

       {formData.pfEsic && (
  <div className="mt-2 ml-6 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md">
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">
        PF Number
      </label>
      <input
        type="text"
        name="pfNumber"
        value={formData.pfNumber}
        onChange={handleInputChange}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        placeholder="Enter PF number"
      />
      {formData.pfNumber && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Current: {formData.pfNumber}
        </p>
      )}
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-500 mb-1">
        ESIC Number
      </label>
      <input
        type="text"
        name="esicNumber"
        value={formData.esicNumber}
        onChange={handleInputChange}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        placeholder="Enter ESIC number"
      />
      {formData.esicNumber && (
        <p className="text-xs text-green-600 mt-1">
          ✓ Current: {formData.esicNumber}
        </p>
      )}
    </div>
  </div>
)}
                </div>

                {/* Company Directory Section */}
                {/* Company Directory Section */}
<div className="space-y-3">
  <div className="flex items-center">
    <input
      type="checkbox"
      id="companyDirectory"
      checked={formData.companyDirectory}
      onChange={() => handleCheckboxChange("companyDirectory")}
      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
    />
    <label
      htmlFor="companyDirectory"
      className="ml-2 text-sm text-gray-500"
    >
      Company Directory (कंपनी निर्देशिका)
    </label>
  </div>

{formData.companyDirectory && (
  <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-500">
        Agreement Document
      </label>
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="file"
            id="manualImage"
            // accept="image/*"
            onChange={(e) => handleImageUpload(e, "manualImage")}
            className="hidden"
          />
          <label
            htmlFor="manualImage"
            className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            {formData.manualImage ? "Change Agreement" : formData.manualImageUrl ? "Replace Agreement" : "Upload Agreement"}
          </label>
        </div>
        
        {/* Show existing manual image */}
        {formData.manualImageUrl && !formData.manualImage && (
          <div className="mt-2">
            <img
              src={formData.manualImageUrl}
              alt="Existing Agreement"
              className="h-32 w-full object-contain rounded border"
              onError={(e) => e.target.style.display = "none"}
            />
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-green-600">✓ Agreement file exists</p>
              <a 
                href={formData.manualImageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 text-xs hover:underline"
              >
                View Full Image
              </a>
            </div>
          </div>
        )}
        
        {/* Show new selected image preview */}
        {formData.manualImage && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(formData.manualImage)}
              alt="New Agreement"
              className="h-32 w-full object-contain rounded border"
            />
            <p className="text-xs text-green-600 mt-1">
              New file selected: {formData.manualImage.name}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
</div>

                {/* PDC Checkbox Section */}
      {/* PDC Checkbox Section */}
<div className="space-y-3 pt-2">
  <div className="flex items-center">
    <input
      type="checkbox"
      id="pdoCheckbox"
      checked={formData.pdoCheckbox}
      onChange={() => handleCheckboxChange("pdoCheckbox")}
      className="h-4 w-4 text-gray-500 focus:ring-blue-500 border-gray-300 rounded bg-white"
    />
    <label
      htmlFor="pdoCheckbox"
      className="ml-2 text-sm text-gray-500"
    >
      PDC (Post Dated Cheque)
    </label>
  </div>

 {formData.pdoCheckbox && (
  <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-500">
        PDC Document Upload
      </label>
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            type="file"
            id="pdcFile"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleImageUpload(e, "pdcFile")}
            className="hidden"
          />
          <label
            htmlFor="pdcFile"
            className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            {formData.pdcFile ? "Change PDC File" : formData.pdcFileUrl ? "Replace PDC File" : "Upload PDC File"}
          </label>
        </div>
        
        {/* Show existing PDC file link */}
        {formData.pdcFileUrl && !formData.pdcFile && (
          <div className="mt-2">
            <a 
              href={formData.pdcFileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Existing PDC File
            </a>
            <p className="text-xs text-green-600 mt-1">✓ PDC file already uploaded</p>
          </div>
        )}
        
        {/* Show new selected PDC file info */}
        {formData.pdcFile && (
          <div className="mt-2 text-sm text-green-600">
            New file selected: {formData.pdcFile.name}
          </div>
        )}
      </div>
    </div>
  </div>
)}
</div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50"
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

export default AfterJoiningWork;
