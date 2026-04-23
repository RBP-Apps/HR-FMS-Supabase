import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  CheckCircle,
  Eye,
  X,
  UserPlus,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";

const Joining = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [joiningData, setJoiningData] = useState([]);
  const [historyJoiningData, setHistoryJoiningData] = useState([]);
  const [error, setError] = useState(null);
  const [followUpData, setFollowUpData] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [joiningRecords, setJoiningRecords] = useState([]);
  const [shareFormData, setShareFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    subject: "Candidate Joining Details",
    message: "Please find the candidate joining details attached below.",
  });
  const [firmNames, setFirmNames] = useState([]);
  const [formData, setFormData] = useState({
    candidateSays: "",
    status: "",
    nextDate: "",
  });
  const [nextJoiningId, setNextJoiningId] = useState("");
  const [relationshipOptions, setRelationshipOptions] = useState([]);
  const [attendanceTypeOptions, setAttendanceTypeOptions] = useState([]);

  const [filterIndentNo, setFilterIndentNo] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [filterName, setFilterName] = useState("");

  const [showEditJoiningModal, setShowEditJoiningModal] = useState(false);
  const [editJoiningFormData, setEditJoiningFormData] = useState({});

// Progress column ke liye helper functions
const getCompletionStats = (rowData, visibleColumns, joiningRecord = null) => {
  const columnsToCheck = visibleColumns.filter(col => 
    col !== 'Action' && col !== 'Status'
  );
  
  const total = columnsToCheck.length;
  let filled = 0;
  
  columnsToCheck.forEach(column => {
    let value;
    switch(column) {
      case 'Indent No.': 
      case 'Indent Number': value = rowData.indentNo; break;
      case 'Candidate Enquiry No.': value = rowData.candidateEnquiryNo; break;
      case 'Applying For Post': value = rowData.applyingForPost; break;
      case 'Designation': value = joiningRecord ? joiningRecord.designation : rowData.applyingForPost; break;
      case 'Department': value = joiningRecord ? joiningRecord.department : rowData.department; break;
      case 'Candidate Name': value = rowData.candidateName; break;
      case 'Name': value = joiningRecord ? joiningRecord.name_as_per_aadhar : rowData.candidateName; break;
      case 'Phone': value = rowData.candidatePhone; break;
      case 'Mobile Number': value = joiningRecord ? joiningRecord.mobile_number : rowData.candidatePhone; break;
      case 'Email': value = rowData.candidateEmail; break;
      case 'Personal Email': value = joiningRecord ? joiningRecord.personal_email : rowData.candidateEmail; break;
      case 'Photo': value = rowData.candidatePhoto; break;
      case 'Resume': value = rowData.candidateResume; break;
      
      // History Specific
      case 'Father Name': value = joiningRecord?.father_name; break;
      case 'Date of Joining': value = joiningRecord?.date_of_joining; break;
      case 'Salary': value = joiningRecord?.salary; break;
      case 'Aadhar Address': value = joiningRecord?.aadhar_address; break;
      case 'Current Address': value = joiningRecord?.current_address; break;
      case 'Bank Account': value = joiningRecord?.bank_account_number; break;
      case 'IFSC Code': value = joiningRecord?.ifsc_code; break;
      case 'PF ID': value = joiningRecord?.past_pf_id; break;
      case 'ESIC No': value = joiningRecord?.past_esic_number; break;
      case 'Company PF': value = joiningRecord?.company_pf_provided; break;
      case 'Company ESIC': value = joiningRecord?.company_esic_provided; break;
      case 'Attendance Type': value = joiningRecord?.attendance_type; break;
      case 'Aadhar Front': value = joiningRecord?.aadhar_front_photo; break;
      case 'Aadhar Back': value = joiningRecord?.aadhar_back_photo; break;
      case 'PAN Card': value = joiningRecord?.pan_card; break;
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

const visibleColumnsPending = [
  'Indent No.', 'Candidate Enquiry No.', 'Applying For Post', 
  'Department', 'Candidate Name', 'Phone', 'Email', 'Photo', 'Resume'
];

const visibleColumnsHistory = [
  'Indent Number', 'Name', 'Father Name', 'Date of Joining', 'Designation', 
  'Department', 'Salary', 'Mobile Number', 'Personal Email', 'Aadhar Address', 
  'Current Address', 'Bank Account', 'IFSC Code', 'PF ID', 'ESIC No', 'Company PF', 
  'Company ESIC', 'Attendance Type', 'Aadhar Front', 'Aadhar Back', 'PAN Card'
];

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

  // Add these functions
  const handleEditClick = async (item, record) => {
    setSelectedItem(item);
    let joiningRecord = record;

    try {
      if (!joiningRecord) {
        // Fallback: Fetch existing joining data for this candidate using candidate_enquiry_number or matching RBP ID
        const { data, error } = await supabase
          .from("joining")
          .select("*")
          .or(`rbp_joining_id.ilike.%${item.candidateEnquiryNo}%,name_as_per_aadhar.eq.${item.candidateName}`)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) {
          joiningRecord = data[0];
        }
      }

      if (joiningRecord) {
        // Helper to handle Boolean/String "TRUE"/"FALSE" from backend
        const formatSelection = (val) => {
          if (val === true || val === "TRUE" || val === "true") return "Yes";
          if (val === false || val === "FALSE" || val === "false") return "No";
          return "";
        };

        // Populate form with existing joining data
        setEditJoiningFormData({
          joiningId: joiningRecord.rbp_joining_id || "",
          firmName: joiningRecord.firm_name || "",
          nameAsPerAadhar: joiningRecord.name_as_per_aadhar || item.candidateName || "",
          bloodGroup: joiningRecord.blood_group || "",
          fatherName: joiningRecord.father_name || "",
          dateOfJoining: joiningRecord.date_of_joining ? joiningRecord.date_of_joining.split('T')[0] : "",
          workLocation: joiningRecord.work_location || "",
          designation: joiningRecord.designation || item.applyingForPost || "",
          salary: joiningRecord.salary || "",
          aadharFrontPhoto: joiningRecord.aadhar_front_photo || null,
          aadharBackPhoto: joiningRecord.aadhar_back_photo || null,
          panCard: joiningRecord.pan_card || null,
          candidatePhoto: null,
          relationship: joiningRecord.family_relationship || "",
          familyPersonName: joiningRecord.family_person_name || "",
          currentAddress: joiningRecord.current_address || item.presentAddress || "",
          aadharAddress: joiningRecord.aadhar_address || "",
          dobAsPerAadhar: joiningRecord.date_of_birth ? joiningRecord.date_of_birth.split('T')[0] : item.candidateDOB || "",
          gender: joiningRecord.gender || "",
          mobileNumber: joiningRecord.mobile_number || item.candidatePhone || "",
          familyNumber: joiningRecord.family_number || "",
          pastPfId: joiningRecord.past_pf_id || "",
          pastEsicNumber: joiningRecord.past_esic_number || "",
          currentBankAcNo: joiningRecord.bank_account_number || "",
          ifscCode: joiningRecord.ifsc_code || "",
          branchName: joiningRecord.branch_name || "",
          personalEmail: joiningRecord.personal_email || item.candidateEmail || "",
          companyProvidesPf: formatSelection(joiningRecord.company_pf_provided),
          companyProvidesEsic: formatSelection(joiningRecord.company_esic_provided),
          companyProvidesEmail: formatSelection(joiningRecord.company_mail_provided),
          attendanceType: joiningRecord.attendance_type || "",
          validateCandidate: !!joiningRecord.candidate_validated,
          issueGmailId: !!joiningRecord.gmail_id_issued,
          issueJoiningLetter: !!joiningRecord.joining_letter_issued,
          attendanceRegistration: !!joiningRecord.attendance_registration,
          pfRegistration: !!joiningRecord.pf_registration,
          esicRegistration: !!joiningRecord.esic_registration,
          department: joiningRecord.department || item.department || "",
          equipment: joiningRecord.equipment || "",

          // Store existing file URLs
          existingAadharFrontUrl: joiningRecord.aadhar_front_photo || null,
          existingAadharBackUrl: joiningRecord.aadhar_back_photo || null,
          existingPanUrl: joiningRecord.pan_card || null,
          existingBankPassbookUrl: joiningRecord.bank_passbook_photo || null,
        });
      } else {
        // If no joining record found, populate with enquiry data
        setEditJoiningFormData({
          joiningId: "", // Should not happen in edit mode for history
          firmName: "",
          nameAsPerAadhar: item.candidateName || "",
          bloodGroup: "",
          fatherName: "",
          dateOfJoining: "",
          workLocation: "",
          designation: item.applyingForPost || "",
          salary: "",
          aadharFrontPhoto: null,
          aadharBackPhoto: null,
          panCard: null,
          candidatePhoto: null,
          relationship: "",
          familyPersonName: "",
          currentAddress: item.presentAddress || "",
          aadharAddress: "",
          dobAsPerAadhar: item.candidateDOB || "",
          gender: "",
          mobileNumber: item.candidatePhone || "",
          familyNumber: "",
          pastPfId: "",
          pastEsicNumber: "",
          currentBankAcNo: "",
          ifscCode: "",
          branchName: "",
          bankPassbookPhoto: null,
          personalEmail: item.candidateEmail || "",
          companyProvidesPf: "",
          companyProvidesEsic: "",
          companyProvidesEmail: "",
          attendanceType: "",
          validateCandidate: false,
          issueGmailId: false,
          issueJoiningLetter: false,
          attendanceRegistration: false,
          pfRegistration: false,
          esicRegistration: false,
          department: item.department || "",
          equipment: "",
        });
      }

      setShowEditJoiningModal(true);
    } catch (err) {
      console.error("Error setting up edit modal:", err);
      toast.error("Failed to load joining data");
    }
  };


  // Add this unified refresh function after your existing functions
  const refreshAllData = async () => {
    setTableLoading(true);
    try {
      // Fetch both enquiry and joining data simultaneously
      await Promise.all([
        fetchJoiningData(), // This updates joiningData and historyJoiningData
        fetchJoiningDataForHistory() // This updates joiningRecords
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setTableLoading(false);
    }
  };


  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload only the required files if new files are selected
      const uploadPromises = {};
      const fileFields = [
        "aadharFrontPhoto",
        "aadharBackPhoto",
        "panCard",
        "bankPassbookPhoto",
      ];

      for (const field of fileFields) {
        if (editJoiningFormData[field] && editJoiningFormData[field] instanceof File) {
          uploadPromises[field] = uploadFileToDrive(editJoiningFormData[field]);
        } else {
          uploadPromises[field] = Promise.resolve(null); // Keep existing URLs
        }
      }

      // Wait for all uploads to complete
      const uploadedUrls = await Promise.all(
        Object.values(uploadPromises).map((promise) =>
          promise.catch((error) => {
            console.error("Upload failed:", error);
            return null;
          }),
        ),
      );

      // Map uploaded URLs to their respective fields
      const fileUrls = {};
      Object.keys(uploadPromises).forEach((field, index) => {
        fileUrls[field] = uploadedUrls[index];
      });

      // Update JOINING table
      const { error: updateError } = await supabase
        .from("joining")
        .update({
          firm_name: editJoiningFormData.firmName,
          name_as_per_aadhar: editJoiningFormData.nameAsPerAadhar,
          blood_group: editJoiningFormData.bloodGroup,
          father_name: editJoiningFormData.fatherName,
          date_of_joining: editJoiningFormData.dateOfJoining ? new Date(editJoiningFormData.dateOfJoining) : null,
          work_location: editJoiningFormData.workLocation,
          designation: editJoiningFormData.designation,
          salary: editJoiningFormData.salary ? parseFloat(editJoiningFormData.salary) : null,
          aadhar_front_photo: fileUrls.aadharFrontPhoto || editJoiningFormData.existingAadharFrontUrl,
          aadhar_back_photo: fileUrls.aadharBackPhoto || editJoiningFormData.existingAadharBackUrl,
          pan_card: fileUrls.panCard || editJoiningFormData.existingPanUrl,
          family_relationship: editJoiningFormData.relationship,
          family_person_name: editJoiningFormData.familyPersonName,
          current_address: editJoiningFormData.currentAddress,
          aadhar_address: editJoiningFormData.aadharAddress,
          date_of_birth: editJoiningFormData.dobAsPerAadhar ? new Date(editJoiningFormData.dobAsPerAadhar) : null,
          gender: editJoiningFormData.gender,
          mobile_number: editJoiningFormData.mobileNumber,
          family_number: editJoiningFormData.familyNumber,
          past_pf_id: editJoiningFormData.pastPfId,
          past_esic_number: editJoiningFormData.pastEsicNumber,
          bank_account_number: editJoiningFormData.currentBankAcNo,
          ifsc_code: editJoiningFormData.ifscCode,
          branch_name: editJoiningFormData.branchName,
          bank_passbook_photo: fileUrls.bankPassbookPhoto || editJoiningFormData.existingBankPassbookUrl,
          personal_email: editJoiningFormData.personalEmail,
          company_pf_provided: editJoiningFormData.companyProvidesPf === "Yes",
          company_esic_provided: editJoiningFormData.companyProvidesEsic === "Yes",
          company_mail_provided: editJoiningFormData.companyProvidesEmail === "Yes",
          attendance_type: editJoiningFormData.attendanceType,
          candidate_validated: editJoiningFormData.validateCandidate,
          gmail_id_issued: editJoiningFormData.issueGmailId,
          joining_letter_issued: editJoiningFormData.issueJoiningLetter,
          attendance_registration: editJoiningFormData.attendanceRegistration,
          pf_registration: editJoiningFormData.pfRegistration,
          esic_registration: editJoiningFormData.esicRegistration,
          department: editJoiningFormData.department,
          // equipment: editJoiningFormData.equipment,
        })
        .eq("rbp_joining_id", editJoiningFormData.joiningId);

      if (updateError) throw updateError;

      // Update ENQUIRY table
      const { error: enquiryUpdateError } = await supabase
        .from("enquiry")
        .update({
          candidate_name: editJoiningFormData.nameAsPerAadhar,
          candidate_phone: editJoiningFormData.mobileNumber,
          candidate_email: editJoiningFormData.personalEmail,
          applying_post: editJoiningFormData.designation,
          department: editJoiningFormData.department,
        })
        .eq("candidate_enquiry_number", selectedItem.candidateEnquiryNo);

      if (enquiryUpdateError) throw enquiryUpdateError;

      toast.success("Joining details updated successfully!");
      setShowEditJoiningModal(false);
      setSelectedItem(null);

      await refreshAllData();

      // Refresh data
      await fetchJoiningData();
    } catch (error) {
      console.error("Error updating joining details:", error);
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };


  const handleEditJoiningInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditJoiningFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Update handleEditJoiningFileChange function
  const handleEditJoiningFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setEditJoiningFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };


  const [joiningFormData, setJoiningFormData] = useState({
    joiningId: "",
    firmName: "",
    nameAsPerAadhar: "",
    bloodGroup: "",
    fatherName: "",
    dateOfJoining: "",
    workLocation: "",
    designation: "",
    salary: "",
    aadharFrontPhoto: null,
    aadharBackPhoto: null,
    panCard: null,
    candidatePhoto: null,
    relationship: "",
    familyPersonName: "", // Add this new field
    currentAddress: "",
    aadharAddress: "",
    dobAsPerAadhar: "",
    gender: "",
    mobileNumber: "",
    familyNumber: "",
    pastPfId: "",
    pastEsicNumber: "",
    currentBankAcNo: "",
    ifscCode: "",
    branchName: "",
    bankPassbookPhoto: null,
    personalEmail: "",
    companyProvidesPf: "",
    companyProvidesEsic: "",
    companyProvidesEmail: "",
    attendanceType: "",
    validateCandidate: false,
    issueGmailId: false,
    issueJoiningLetter: false,
    attendanceRegistration: false,
    pfRegistration: false,
    esicRegistration: false,
    department: "",
    equipment: "",
    isNewEmployee: false,
  });


  // Actual working version with real data fetching
  const fetchLastJoiningId = async () => {
    try {
      console.log("Fetching last joining ID from Supabase...");

      // Get ALL joining IDs to find the maximum number
      const { data, error } = await supabase
        .from("joining")
        .select("rbp_joining_id");

      if (error) throw error;

      let maxId = 0;

      if (data && data.length > 0) {
        // Loop through all records to find the maximum ID number
        data.forEach((record) => {
          const joiningId = record.rbp_joining_id;

          if (joiningId && joiningId.includes('-')) {
            const numberPart = joiningId.split('-')[1];
            const num = parseInt(numberPart);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          } else if (joiningId && joiningId.startsWith('RBP')) {
            const numberPart = joiningId.replace('RBP', '');
            const num = parseInt(numberPart);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          }
        });
      }

      // Increment by 1
      const nextIdNumber = maxId + 1;
      const nextId = `RBP-${nextIdNumber}`;

      console.log("Current Max ID:", maxId);
      console.log("Next Joining ID:", nextId);

      setNextJoiningId(nextId);
      setJoiningFormData((prev) => ({
        ...prev,
        joiningId: nextId,
      }));

    } catch (error) {
      console.error("Error fetching joining IDs:", error);
      // Fallback to RBP-1
      const fallbackId = "RBP-1";
      setNextJoiningId(fallbackId);
      setJoiningFormData((prev) => ({
        ...prev,
        joiningId: fallbackId,
      }));
    }
  };


  const fetchMasterData = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("family_relationship, attendance_type");

      if (error) throw error;

      const relationships = [];
      const attendanceTypes = [];

      if (data && data.length > 0) {
        data.forEach((row) => {
          if (
            row.family_relationship &&
            row.family_relationship.trim() !== "" &&
            !relationships.includes(row.family_relationship.trim())
          ) {
            relationships.push(row.family_relationship.trim());
          }

          if (
            row.attendance_type &&
            row.attendance_type.trim() !== "" &&
            !attendanceTypes.includes(row.attendance_type.trim())
          ) {
            attendanceTypes.push(row.attendance_type.trim());
          }
        });
      }

      setRelationshipOptions(relationships);
      setAttendanceTypeOptions(attendanceTypes);

      return {
        success: true,
        relationships: relationships,
        attendanceTypes: attendanceTypes,
      };
    } catch (error) {
      console.error("Error fetching master data:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  };


  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create shareable link
      const shareLink = `${window.location.origin}/?enquiry=${selectedItem.candidateEnquiryNo || ""}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);

      // You can also send email using a service like EmailJS or your backend
      // For now, just show success message with the link
      toast.success(`Link copied to clipboard: ${shareLink}`);
      setShowShareModal(false);
    } catch (error) {
      console.error("Error sharing details:", error);
      toast.error(`Failed to share details: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareInputChange = (e) => {
    const { name, value } = e.target;
    setShareFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      // Fetch from enquiry table
      const { data: enquiryData, error: enquiryError } = await supabase
        .from("enquiry")
        .select("*")
        .order("created_at", { ascending: false });

      if (enquiryError) throw enquiryError;

      // Fetch from follow_up table
      const { data: followUpData, error: followUpError } = await supabase
        .from("follow_up")
        .select("enquiry_number, status");

      if (followUpError) throw followUpError;

      // Process enquiry data
      const allProcessedEnquiryData = enquiryData
        .map((row) => ({
          id: row.id,
          indentNo: row.indent_number,
          candidateEnquiryNo: row.candidate_enquiry_number,
          applyingForPost: row.applying_post,
          department: row.department || "",
          candidateName: row.candidate_name,
          candidateDOB: row.dob,
          candidatePhone: row.candidate_phone,
          candidateEmail: row.candidate_email,
          previousCompany: row.previous_company_name,
          jobExperience: row.job_experience || "",
          lastSalary: "", // Not in new schema
          previousPosition: row.previous_position || "",
          reasonForLeaving: row.reason_of_leaving || "",
          maritalStatus: row.marital_status || "",
          lastEmployerMobile: row.last_employer_mobile || "",
          candidatePhoto: row.candidate_photo || "",
          candidateResume: row.resume_copy || "",
          referenceBy: row.reference_by || "",
          presentAddress: row.present_address || "",
          aadharNo: row.aadhar_number || "",
          designation: row.applying_post || "",
          actualDate: row.actual_1 || "", // Column AA equivalent
          joiningDate: row.actual_2 || "", // Column AB equivalent
        }))
        // Filter out items with null/empty values in actual_1
        .filter(
          (item) => item.actualDate && item.actualDate.toString().trim() !== "",
        );

      setFollowUpData(followUpData || []);

      // Items where candidate is selected for Joining
      const itemsWithJoiningStatus = allProcessedEnquiryData.filter((item) => {
        return followUpData?.some(
          (followUp) =>
            followUp.enquiry_number === item.candidateEnquiryNo &&
            followUp.status?.includes("Joining"),
        );
      });

      // Filter out items with non-null values in actual_2 (Pending)
      const pendingItems = itemsWithJoiningStatus.filter(
        (item) =>
          !item.joiningDate || item.joiningDate.toString().trim() === "",
      );

      // Filter out items with null/empty values in actual_2 (History)
      const historyItems = itemsWithJoiningStatus.filter(
        (item) => item.joiningDate && item.joiningDate.toString().trim() !== "",
      );

      setJoiningData(pendingItems);
      setHistoryJoiningData(historyItems);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };


  // Add this function to fetch joining data for history items
  const fetchJoiningDataForHistory = async () => {
    try {
      const { data: joiningData, error } = await supabase
        .from("joining")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Update the state
      setJoiningRecords(joiningData || []);
      return joiningData;
    } catch (error) {
      console.error("Error fetching joining data:", error);
      return [];
    }
  };

  // Modify your useEffect to also fetch joining data
  useEffect(() => {
    const loadData = async () => {
      await fetchJoiningData();
      const joiningRecords = await fetchJoiningDataForHistory();
      setJoiningRecords(joiningRecords); // Store in a new state
    };
    loadData();
    fetchFirmNames();
    fetchLastJoiningId();
    fetchMasterData();
  }, []);


  const fetchFirmNames = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("firm_name")
        .not("firm_name", "is", null)
        .order("firm_name");

      if (error) throw error;

      const firms = data
        .map((row) => row.firm_name)
        .filter((firm) => firm && firm.trim() !== "")
        .sort();

      setFirmNames(firms);
    } catch (error) {
      console.error("Error fetching firm names:", error);
      toast.error("Failed to load firm names");
    }
  };

  useEffect(() => {
    fetchJoiningData();
    fetchFirmNames();
    fetchLastJoiningId();
    fetchMasterData();
  }, []);


  const handleJoiningClick = (item) => {
    setSelectedItem(item);
    const isNewEmployee = !item.id || !item.candidateEnquiryNo;


    setJoiningFormData({
      joiningId: nextJoiningId,
      firmName: "",
      // nameAsPerAadhar: item.candidateName || "",
      nameAsPerAadhar: isNewEmployee ? "" : (item.candidateName || ""),
      bloodGroup: "",
      fatherName: "",
      dateOfJoining: "",
      workLocation: "",
      // designation: item.designation || "",
      designation: isNewEmployee ? "" : (item.designation || ""),
      salary: "",
      aadharFrontPhoto: null,
      aadharBackPhoto: null,
      panCard: null,
      candidatePhoto: null,
      relationship: "",
      familyPersonName: "", // Add this new field
      // currentAddress: item.presentAddress || "",
      currentAddress: isNewEmployee ? "" : (item.presentAddress || ""),
      aadharAddress: "",
      dobAsPerAadhar: formatDOB(item.candidateDOB) || "",
      gender: "",
      // mobileNumber: item.candidatePhone || "",
      mobileNumber: isNewEmployee ? "" : (item.candidatePhone || ""),
      familyNumber: "",
      pastPfId: "",
      pastEsicNumber: "",
      currentBankAcNo: "",
      ifscCode: "",
      branchName: "",
      bankPassbookPhoto: null,
      // personalEmail: item.candidateEmail || "",
      personalEmail: isNewEmployee ? "" : (item.candidateEmail || ""),
      companyProvidesPf: "",
      companyProvidesEsic: "",
      companyProvidesEmail: "",
      attendanceType: "",
      validateCandidate: false,
      issueGmailId: false,
      issueJoiningLetter: false,
      attendanceRegistration: false,
      pfRegistration: false,
      esicRegistration: false,
      // department: item.department || "",
      department: isNewEmployee ? "" : (item.department || ""),
      equipment: "",
      isNewEmployee: isNewEmployee, // 👈 Store this flag
    });
    setShowJoiningModal(true);
  };




  const formatDate = (dateString) => {
    if (!dateString) return "";

    let date;

    if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === "string") {
      if (dateString.includes("/")) {
        const parts = dateString.split("/");
        if (parts.length === 3) {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        date = new Date(dateString);
      }
    }

    if (!date || isNaN(date.getTime())) {
      return dateString || "";
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    // If it's already in dd/mm/yyyy format, return as is
    if (typeof dateString === "string" && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        // Check if it's already in dd/mm/yyyy format
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        if (day > 0 && day <= 31 && month > 0 && month <= 12) {
          // If day is greater than 12, it's likely dd/mm/yyyy format
          if (day > 12) {
            return dateString; // Return as is (dd/mm/yyyy)
          }
          // If month is greater than 12, it's likely mm/dd/yyyy format
          else if (month > 12) {
            return `${parts[1]}/${parts[0]}/${parts[2]}`; // Swap day and month
          }
        }
      }
    }

    // For other cases, try to parse as Date object
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if can't parse
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Add a function to format date for storage (mm/dd/yyyy)
  const formatDateForStorage = (dateString) => {
    if (!dateString) return "";

    // If it's in dd/mm/yyyy format, convert to mm/dd/yyyy
    if (typeof dateString === "string" && dateString.includes("/")) {
      const parts = dateString.split("/");
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);

        // If it's already in dd/mm/yyyy format, swap day and month
        if (day > 0 && day <= 31 && month > 0 && month <= 12 && day > 12) {
          return `${parts[1]}/${parts[0]}/${parts[2]}`;
        }
      }
    }

    // For other cases, try to parse as Date object
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const handleJoiningInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setJoiningFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setJoiningFormData((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };

  const postToJoiningSheet = async (rowData) => {
    try {
      console.log("Attempting to insert into joining table:", rowData);

      // Convert array to object with column names
      const joiningRecord = {
        timestamp_date: rowData[0] ? new Date(rowData[0]) : new Date(),
        rbp_joining_id: rowData[1],
        status: rowData[2],
        firm_name: rowData[3],
        name_as_per_aadhar: rowData[4],
        blood_group: rowData[5],
        father_name: rowData[6],
        date_of_joining: rowData[7] ? new Date(rowData[7]) : null,
        work_location: rowData[8],
        designation: rowData[9],
        salary: rowData[10] ? parseFloat(rowData[10]) : null,
        aadhar_front_photo: rowData[11],
        aadhar_back_photo: rowData[12],
        pan_card: rowData[13],
        family_relationship: rowData[14],
        current_address: rowData[15],
        aadhar_address: rowData[16],
        date_of_birth: rowData[17] ? new Date(rowData[17]) : null,
        gender: rowData[18],
        mobile_number: rowData[19],
        family_number: rowData[20],
        past_pf_id: rowData[21],
        past_esic_number: rowData[22],
        bank_account_number: rowData[23],
        ifsc_code: rowData[24],
        branch_name: rowData[25],
        personal_email: rowData[26],
        company_pf_provided: rowData[27] === "Yes",
        company_esic_provided: rowData[28] === "Yes",
        company_mail_provided: rowData[29] === "Yes",
        attendance_type: rowData[30],
        candidate_validated: rowData[31] === "Yes",
        gmail_id_issued: rowData[32] === "Yes",
        joining_letter_issued: rowData[33] === "Yes",
        attendance_registration: rowData[34] === "Yes",
        pf_registration: rowData[35] === "Yes",
        esic_registration: rowData[36] === "Yes",
        department: rowData[37], // Added from selectedItem
        created_at: new Date(),
      };

      const { data, error } = await supabase
        .from("joining")
        .insert([joiningRecord])
        .select();

      if (error) throw error;

      console.log("Supabase response:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Full error details:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to insert into joining table: ${error.message}`);
    }
  };

  const uploadFileToDrive = async (file, bucketName = "joining-documents") => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `joining/${fileName}`;

      const { data, error } = await supabase.storage
        .from("joining-documents")
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("joining-documents").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  };

  const updateEnquirySheet = async (enquiryNo, timestamp) => {
    try {
      // First find the enquiry record
      const { data: enquiryRecords, error: findError } = await supabase
        .from("enquiry")
        .select("id")
        .eq("candidate_enquiry_number", enquiryNo)
        .limit(1);

      if (findError) throw findError;

      if (!enquiryRecords || enquiryRecords.length === 0) {
        throw new Error(`Enquiry number ${enquiryNo} not found`);
      }

      // Update the actual_2 field (Column AB equivalent)
      const { error: updateError } = await supabase
        .from("enquiry")
        .update({ actual_2: timestamp })
        .eq("candidate_enquiry_number", enquiryNo);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error("Error updating enquiry table:", error);
      throw new Error(`Failed to update enquiry table: ${error.message}`);
    }
  };

  const handleJoiningSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload only the required files
      const uploadPromises = {};
      const fileFields = [
        "aadharFrontPhoto",
        "aadharBackPhoto",
        "panCard",
        "bankPassbookPhoto",
      ];

      for (const field of fileFields) {
        if (joiningFormData[field]) {
          uploadPromises[field] = uploadFileToDrive(joiningFormData[field]);
        } else {
          uploadPromises[field] = Promise.resolve("");
        }
      }

      // Wait for all uploads to complete
      const uploadedUrls = await Promise.all(
        Object.values(uploadPromises).map((promise) =>
          promise.catch((error) => {
            console.error("Upload failed:", error);
            return ""; // Return empty string if upload fails
          }),
        ),
      );

      // Map uploaded URLs to their respective fields
      const fileUrls = {};
      Object.keys(uploadPromises).forEach((field, index) => {
        fileUrls[field] = uploadedUrls[index];
      });

      const now = new Date();
      const formattedTimestamp = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

      const formatDateForStorage = (dateString) => {
        if (!dateString) return "";

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();

        return `${month}/${day}/${year}`;
      };

      // Format DOB for storage (mm/dd/yyyy)
      const formatDOBForStorage = (dateString) => {
        if (!dateString) return "";

        // If it's in dd/mm/yyyy format, convert to mm/dd/yyyy
        if (typeof dateString === "string" && dateString.includes("/")) {
          const parts = dateString.split("/");
          if (parts.length === 3) {
            return `${parts[1]}/${parts[0]}/${parts[2]}`;
          }
        }

        // For other cases, try to parse as Date object
        let date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString;
        }

        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();

        return `${month}/${day}/${year}`;
      };

      // Create an array with all column values in order
      // पुराने rowData array को replace करें इससे:

      const rowData = [];
      rowData[0] = formattedTimestamp; // Column A: Timestamp
      rowData[1] = joiningFormData.joiningId; // Column B: Joining ID
      rowData[2] = "Active"; // Column AD: Status
      rowData[3] = joiningFormData.firmName; // Column C: Firm Name
      rowData[4] = joiningFormData.nameAsPerAadhar; // Column D: Name As Per Aadhar
      rowData[5] = joiningFormData.bloodGroup; // Column E: Blood Group
      rowData[6] = joiningFormData.fatherName; // Column F: Father Name
      rowData[7] = formatDateForStorage(joiningFormData.dateOfJoining); // Column G: Date Of Joining
      rowData[8] = joiningFormData.workLocation; // Column H: Work Location
      rowData[9] = joiningFormData.designation; // Column I: Designation
      rowData[10] = joiningFormData.salary; // Column J: Salary
      rowData[11] = fileUrls.aadharFrontPhoto; // Column K: Aadhar Frontside Photo
      rowData[12] = fileUrls.aadharBackPhoto; // Column L: Aadhar Backside Photo
      rowData[13] = fileUrls.panCard; // Column M: PAN Card
      rowData[14] = joiningFormData.relationship; // Column N: Relationship with Family Person
      rowData[15] = joiningFormData.currentAddress; // Column O: Current Address
      rowData[16] = joiningFormData.aadharAddress; // Column P: Address as per Aadhar Card
      rowData[17] = formatDOBForStorage(joiningFormData.dobAsPerAadhar); // Column Q: Date Of Birth
      rowData[18] = joiningFormData.gender; // Column R: Gender
      rowData[19] = joiningFormData.mobileNumber; // Column S: Mobile Number
      rowData[20] = joiningFormData.familyNumber; // Column T: Family Number
      rowData[21] = joiningFormData.pastPfId || ""; // Column U: Past PF Id No.
      rowData[22] = joiningFormData.pastEsicNumber || ""; // Column V: Past Esic Number
      rowData[23] = joiningFormData.currentBankAcNo; // Column W: Current Bank Account Number
      rowData[24] = joiningFormData.ifscCode; // Column X: IFSC Code
      rowData[25] = joiningFormData.branchName; // Column Y: Branch Name
      rowData[26] = joiningFormData.personalEmail; // Column Z: Personal Email ID
      rowData[27] = joiningFormData.companyProvidesPf; // Column AA: Company Provide PF?
      rowData[28] = joiningFormData.companyProvidesEsic; // Column AB: Company Provide ESIC?
      rowData[29] = joiningFormData.companyProvidesEmail; // Column AC: Company Provide Email?
      rowData[30] = joiningFormData.attendanceType; // Column AE: Attendance Type
      // rowData[31] = formatDateForStorage(joiningFormData.plannedDate); // Column AF: Planned Date
      rowData[31] = joiningFormData.validateCandidate ? "Yes" : "No"; // Column AG: Validate Candidate
      rowData[32] = joiningFormData.issueGmailId ? "Yes" : "No"; // Column AH: Issue Gmail ID
      rowData[33] = joiningFormData.issueJoiningLetter ? "Yes" : "No"; // Column AI: Issue Joining Letter
      rowData[34] = joiningFormData.attendanceRegistration ? "Yes" : "No"; // Column AJ: Attendance Registration
      rowData[35] = joiningFormData.pfRegistration ? "Yes" : "No"; // Column AK: PF Registration
      rowData[36] = joiningFormData.esicRegistration ? "Yes" : "No"; // Column AL: ESIC Registration
      rowData[40] = ""; // Column AO: Actual Date (Empty - will be set by After Joining Work)

      await postToJoiningSheet(rowData);

      // Update ENQUIRY sheet Column AB with the timestamp
      await updateEnquirySheet(
        selectedItem.candidateEnquiryNo,
        formattedTimestamp,
      );

      console.log("Joining Form Data:", rowData);

      toast.success("Employee added successfully!");
      setShowJoiningModal(false);
      setSelectedItem(null);
      await refreshAllData();
    } catch (error) {
      console.error("Error submitting joining form:", error);
      toast.error(`Failed to submit joining form: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueIndents = Array.from(new Set([...joiningData, ...historyJoiningData].map(i => i.indentNo).filter(Boolean)));
  const uniquePosts = Array.from(new Set([...joiningData, ...historyJoiningData].map(i => i.applyingForPost).filter(Boolean)));

  const uniqueNames = Array.from(new Set([...joiningData, ...historyJoiningData].map(i => {
    const record = joiningRecords.find(r => r.mobile_number === i.candidatePhone);
    return record?.name_as_per_aadhar || i.candidateName;
  }).filter(Boolean)));

  const filteredJoiningData = joiningData.filter((item) => {
    const record = joiningRecords.find(r => r.mobile_number === item.candidatePhone);
    const itemAadhaarName = record?.name_as_per_aadhar || item.candidateName || "";

    const matchesSearch = searchTerm === "" ||
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidatePhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemAadhaarName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.indentNo === filterIndentNo;
    const matchesPost = filterPost === "" || item.applyingForPost === filterPost;
    const matchesName = filterName === "" || itemAadhaarName === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  const filteredHistoryData = historyJoiningData.filter((item) => {
    const record = joiningRecords.find(r => r.mobile_number === item.candidatePhone);
    const itemAadhaarName = record?.name_as_per_aadhar || item.candidateName || "";

    const matchesSearch = searchTerm === "" ||
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.applyingForPost?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.candidatePhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.indentNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemAadhaarName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.indentNo === filterIndentNo;
    const matchesPost = filterPost === "" || item.applyingForPost === filterPost;
    const matchesName = filterName === "" || itemAadhaarName === filterName;

    return matchesSearch && matchesIndent && matchesPost && matchesName;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Joining Management</h1>
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
                list="joiningIndentList"
                placeholder="Select/Search Indent"
                value={filterIndentNo}
                onChange={(e) => setFilterIndentNo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="joiningIndentList">
                {uniqueIndents.map(indent => (
                  <option key={indent} value={indent} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Post Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Applying For Post</label>
            <div className="relative">
              <input
                type="text"
                list="joiningPostList"
                placeholder="Select/Search Post"
                value={filterPost}
                onChange={(e) => setFilterPost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="joiningPostList">
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
                list="joiningNameList"
                placeholder="Select/Search Name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="joiningNameList">
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

        {/* Actions Button */}
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setFilterIndentNo("");
              setFilterPost("");
              setFilterName("");
              setSearchTerm("");
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <X size={16} />
            Clear Filters
          </button>

          {/* 👇 New Employee Joining Button */}
          <button
            onClick={() => {
              // Create a dummy/empty item object for new employee
              const emptyItem = {
                id: null,
                indentNo: "",
                candidateEnquiryNo: "",
                applyingForPost: "",
                department: "",
                candidateName: "",
                candidateDOB: "",
                candidatePhone: "",
                candidateEmail: "",
                presentAddress: "",
                designation: "",
                actualDate: "",
                joiningDate: ""
              };
              handleJoiningClick(emptyItem);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap text-sm"
          >
            <UserPlus size={16} />
            New Employee Joining
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
              Pending Joinings ({filteredJoiningData.length})
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
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-center">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading pending joinings...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: ${error}</p>
                        <button
                          onClick={fetchJoiningData}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredJoiningData.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <p className="text-gray-500">
                          No pending joinings found.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredJoiningData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                          {(() => {
                            const stats = getCompletionStats(item, visibleColumnsPending);
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
                            onClick={() => handleJoiningClick(item)}
                            className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-opacity-90 text-sm"
                          >
                            Joining
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.indentNo || "")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidateEnquiryNo || "")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.applyingForPost || "")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.department || "")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidateName || "")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidatePhone || "")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {renderField(item.candidateEmail || "")}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                            Pending Joining
                          </span>
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
                <thead className="bg-gray-50 sticky text-center top-0 z-10 text-nowrap">
                  <tr>
                    <th className="sticky left-0 z-30 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px] border-r">
                      Progress
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indent Number
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Father Name
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date of Joining
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mobile Number
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personal Email
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aadhar Address
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Address
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank Account
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IFSC Code
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PF ID
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ESIC No
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company PF
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company ESIC
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Type
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aadhar Front
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aadhar Back
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PAN Card
                    </th>
                    <th className="px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-center">
                  {tableLoading ? (
                    <tr>
                      <td colSpan="23" className="px-6 py-12 text-center">
                        <div className="flex justify-center flex-col items-center">
                          <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                          <span className="text-gray-600 text-sm">
                            Loading history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="23" className="px-6 py-12 text-center">
                        <p className="text-red-500">Error: {error}</p>
                        <button
                          onClick={() => {
                            fetchJoiningData();
                            fetchJoiningDataForHistory();
                          }}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : filteredHistoryData.length === 0 ? (
                    <tr>
                      <td colSpan="23" className="px-6 py-12 text-center">
                        <p className="text-gray-500">No history found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryData.map((item) => {
                      // Find matching joining record
                      const joiningRecord = joiningRecords.find(
                        (record) => record.mobile_number === item.candidatePhone
                      );

                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                            {(() => {
                              const stats = getCompletionStats(item, visibleColumnsHistory, joiningRecord);
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleEditClick(item, joiningRecord)}
                              className="px-3 py-1 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-xs"
                            >
                              Edit
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.rbp_joining_id || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.name_as_per_aadhar || item.candidateName || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.father_name || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.date_of_joining ? formatDate(joiningRecord.date_of_joining) : "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.designation || item.applyingForPost || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.department || item.department || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.salary || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.mobile_number || item.candidatePhone || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.personal_email || item.candidateEmail || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.aadhar_address ? (
                              <div className="max-w-[150px] truncate" title={joiningRecord.aadhar_address}>
                                {joiningRecord.aadhar_address}
                              </div>
                            ) : "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.current_address ? (
                              <div className="max-w-[150px] truncate" title={joiningRecord.current_address}>
                                {joiningRecord.current_address}
                              </div>
                            ) : "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.bank_account_number || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.ifsc_code || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.past_pf_id || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.past_esic_number || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs rounded-full ${joiningRecord?.company_pf_provided ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {joiningRecord?.company_pf_provided ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`px-2 py-1 text-xs rounded-full ${joiningRecord?.company_esic_provided ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {joiningRecord?.company_esic_provided ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.attendance_type || "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.aadhar_front_photo ? (
                              <a href={joiningRecord.aadhar_front_photo} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                View
                              </a>
                            ) : "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.aadhar_back_photo ? (
                              <a href={joiningRecord.aadhar_back_photo} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                View
                              </a>
                            ) : "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {renderField(joiningRecord?.pan_card ? (
                              <a href={joiningRecord.pan_card} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                                View
                              </a>
                            ) : "")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Completed
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {showEditJoiningModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-300">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Employee Joining Form
                </h3>
                <button
                  onClick={() => {
                    setShowEditJoiningModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                {/* Section 1: Basic Information */}
                <div className="space-y-6">
                  {/* ====================== Section 1: Basic Details ====================== */}
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-4 text-purple-700">
                      Basic Details (मूल जानकारी)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          RBP-Joining ID (जॉइनिंग आईडी) *
                        </label>
                        <input
                          type="text"
                          name="joiningId"
                          value={editJoiningFormData.joiningId || ""}
                          readOnly
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-700 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Joining ID (cannot be edited)
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Firm Name (फर्म का नाम) *
                        </label>
                        <select
                          name="firmName"
                          value={editJoiningFormData.firmName || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                          required
                        >
                          <option value="">Select Firm Name</option>
                          {firmNames.map((firm, index) => (
                            <option key={index} value={firm}>
                              {firm}
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name As Per Aadhar (नाम आधार के अनुसार)
                        </label>
                        <input
                          type="text"
                          name="nameAsPerAadhar"
                          value={editJoiningFormData.nameAsPerAadhar || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div> */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name As Per Aadhar (नाम आधार के अनुसार)
                        </label>
                        <input
                          type="text"
                          name="nameAsPerAadhar"
                          value={editJoiningFormData.nameAsPerAadhar || ""}  // ✅ editJoiningFormData use करें
                          onChange={handleEditJoiningInputChange}  // ✅ handleEditJoiningInputChange use करें
                          disabled={false}  // Edit modal में हमेशा enabled रहेगा (क्योंकि यह edit mode है)
                          placeholder="Enter name as per Aadhar card"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Blood Group (ब्लड ग्रुप)
                        </label>
                        <input
                          type="text"
                          name="bloodGroup"
                          value={editJoiningFormData.bloodGroup || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter blood group (A+, B+, O+ etc.)"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Father Name (पिता का नाम)
                        </label>
                        <input
                          type="text"
                          name="fatherName"
                          value={editJoiningFormData.fatherName || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Joining (जॉइनिंग की तारीख)
                        </label>
                        <input
                          type="date"
                          name="dateOfJoining"
                          value={editJoiningFormData.dateOfJoining || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ====================== Section 2: Work & Designation ====================== */}
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-4 text-purple-700">
                      Work Details (कार्य विवरण)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Work Location (कार्य स्थान)
                        </label>
                        <input
                          type="text"
                          name="workLocation"
                          value={editJoiningFormData.workLocation || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Designation (पदनाम)
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={editJoiningFormData.designation || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Salary (वेतन)
                        </label>
                        <input
                          type="number"
                          name="salary"
                          value={editJoiningFormData.salary || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter salary"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ====================== Section 3: Documents ====================== */}
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-4 text-purple-700">
                      Documents (दस्तावेज़)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aadhar Frontside Photo (आधार कार्ड फ्रंट फोटो)
                        </label>
                        <input
                          type="file"
                          name="aadharFrontPhoto"
                          accept="image/*"
                          onChange={(e) =>
                            handleEditJoiningFileChange(e, "aadharFrontPhoto")
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                        {editJoiningFormData.aadharFrontPhoto && !(editJoiningFormData.aadharFrontPhoto instanceof File) && (
                          <p className="text-xs text-green-600 mt-1">Existing file kept (upload new to replace)</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Aadhar Backside Photo (आधार कार्ड बैक फोटो)
                        </label>
                        <input
                          type="file"
                          name="aadharBackPhoto"
                          accept="image/*"
                          onChange={(e) => handleEditJoiningFileChange(e, "aadharBackPhoto")}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                        {editJoiningFormData.aadharBackPhoto && !(editJoiningFormData.aadharBackPhoto instanceof File) && (
                          <p className="text-xs text-green-600 mt-1">Existing file kept (upload new to replace)</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PAN Card (पैन कार्ड)
                        </label>
                        <input
                          type="file"
                          name="panCard"
                          accept="image/*"
                          onChange={(e) => handleEditJoiningFileChange(e, "panCard")}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                        {editJoiningFormData.panCard && !(editJoiningFormData.panCard instanceof File) && (
                          <p className="text-xs text-green-600 mt-1">Existing file kept (upload new to replace)</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ====================== Section 4: Family & Address ====================== */}
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-4 text-purple-700">
                      Family & Address (परिवार और पता)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Relationship with Family Person (परिवार के सदस्य से संबंध)
                        </label>
                        <select
                          name="relationship"
                          value={editJoiningFormData.relationship || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        >
                          <option value="">Select Relationship</option>
                          {relationshipOptions.map((relationship, index) => (
                            <option key={index} value={relationship}>
                              {relationship}
                            </option>
                          ))}
                        </select>
                      </div> */}

                      {/* NEW FIELD: Family Person Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Family Person Name (परिवार के सदस्य का नाम)
                        </label>
                        <input
                          type="text"
                          name="familyPersonName"
                          value={editJoiningFormData.familyPersonName || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter family person name"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Address (वर्तमान पता)
                        </label>
                        <textarea
                          name="currentAddress"
                          value={editJoiningFormData.currentAddress || ""}
                          onChange={handleEditJoiningInputChange}
                          rows={3}
                          placeholder="Enter current address"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address as per Aadhar Card (आधार कार्ड के अनुसार पता)
                        </label>
                        <textarea
                          name="aadharAddress"
                          value={editJoiningFormData.aadharAddress || ""}
                          onChange={handleEditJoiningInputChange}
                          rows={3}
                          placeholder="Enter address as per Aadhar Card"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ====================== Section 5: Personal Info ====================== */}
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-4 text-purple-700">
                      Personal Info (व्यक्तिगत जानकारी)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Of Birth As per Aadhar (जन्मतिथि आधार के अनुसार)
                        </label>
                        <input
                          type="date"
                          name="dobAsPerAadhar"
                          value={editJoiningFormData.dobAsPerAadhar || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender (लिंग)
                        </label>
                        <select
                          name="gender"
                          value={editJoiningFormData.gender || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        >
                          <option value="">Select Gender (लिंग चुनें)</option>
                          <option value="Male">Male (पुरुष)</option>
                          <option value="Female">Female (महिला) </option>
                          <option value="Other">Other (अन्य)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile Number (मोबाइल नंबर)
                        </label>
                        <input
                          type="tel"
                          name="mobileNumber"
                          value={editJoiningFormData.mobileNumber || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter 10-digit mobile number"
                          maxLength={10}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Family Number (परिवार का नंबर)
                        </label>
                        <input
                          type="tel"
                          name="familyNumber"
                          value={editJoiningFormData.familyNumber || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter 10-digit family number"
                          maxLength={10}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ====================== Section 6: Bank Details ====================== */}
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-4 text-purple-700">
                      Bank Details (बैंक विवरण)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Past PF / New PF Id No. (पिछला पीएफ आईडी नंबर)
                        </label>
                        <input
                          type="text"
                          name="pastPfId"
                          value={editJoiningFormData.pastPfId || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter past PF ID number"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Past ESIC / New ESIC Number (पिछला ईएसआईसी नंबर)
                        </label>
                        <input
                          type="text"
                          name="pastEsicNumber"
                          value={editJoiningFormData.pastEsicNumber || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter past ESIC number"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Current Bank Account Number (वर्तमान बैंक खाता नंबर)
                        </label>
                        <input
                          type="text"
                          name="currentBankAcNo"
                          value={editJoiningFormData.currentBankAcNo || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter current bank account number"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          IFSC Code (आईएफएससी कोड)
                        </label>
                        <input
                          type="text"
                          name="ifscCode"
                          value={editJoiningFormData.ifscCode || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter IFSC code"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Branch Name (शाखा का नाम)
                        </label>
                        <input
                          type="text"
                          name="branchName"
                          value={editJoiningFormData.branchName || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter branch name"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Bank Passbook Photo (बैंक पासबुक फोटो)
                        </label>
                        <input
                          type="file"
                          name="bankPassbookPhoto"
                          accept="image/*"
                          onChange={(e) => handleEditJoiningFileChange(e, "bankPassbookPhoto")}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                        {editJoiningFormData.bankPassbookPhoto && !(editJoiningFormData.bankPassbookPhoto instanceof File) && (
                          <p className="text-xs text-green-600 mt-1">Existing file kept (upload new to replace)</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ====================== Section 7: Company & Employment Info ====================== */}
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-4 text-purple-700">
                      Company & Employment Info (कंपनी और रोजगार जानकारी)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Personal Email ID (व्यक्तिगत ईमेल आईडी)
                        </label>
                        <input
                          type="email"
                          name="personalEmail"
                          value={editJoiningFormData.personalEmail || ""}
                          onChange={handleEditJoiningInputChange}
                          placeholder="Enter personal email ID"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Does Company Provide PF? (क्या कंपनी PF प्रदान करती है?)
                        </label>
                        <select
                          name="companyProvidesPf"
                          value={editJoiningFormData.companyProvidesPf || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes (हाँ)</option>
                          <option value="No">No (नहीं)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Does Company Provide ESIC? (क्या कंपनी ESIC प्रदान करती है?)
                        </label>
                        <select
                          name="companyProvidesEsic"
                          value={editJoiningFormData.companyProvidesEsic || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes (हाँ)</option>
                          <option value="No">No (नहीं)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Does Company Provide Email ID? (क्या कंपनी ईमेल आईडी प्रदान करती है?)
                        </label>
                        <select
                          name="companyProvidesEmail"
                          value={editJoiningFormData.companyProvidesEmail || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes (हाँ)</option>
                          <option value="No">No (नहीं)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Attendance Type (उपस्थिति प्रकार)
                        </label>
                        <select
                          name="attendanceType"
                          value={editJoiningFormData.attendanceType || ""}
                          onChange={handleEditJoiningInputChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        >
                          <option value="">Select Attendance Type</option>
                          {attendanceTypeOptions.map((type, index) => (
                            <option key={index} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ====================== Section 8: Candidate Actions ====================== */}
                  <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <h2 className="text-lg font-semibold mb-4 text-purple-700">
                      Candidate Actions (उम्मीदवार क्रियाएँ)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="validateCandidate"
                          checked={editJoiningFormData.validateCandidate || false}
                          onChange={handleEditJoiningInputChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          Validate the Candidate (उम्मीदवार का सत्यापन)
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="issueGmailId"
                          checked={editJoiningFormData.issueGmailId || false}
                          onChange={handleEditJoiningInputChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          Issue Gmail ID (जीमेल आईडी जारी करना)
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="issueJoiningLetter"
                          checked={editJoiningFormData.issueJoiningLetter || false}
                          onChange={handleEditJoiningInputChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          Issue Joining Letter (जॉइनिंग लेटर जारी करना)
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="attendanceRegistration"
                          checked={editJoiningFormData.attendanceRegistration || false}
                          onChange={handleEditJoiningInputChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          Attendance Registration (उपस्थिति पंजीकरण)
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="pfRegistration"
                          checked={editJoiningFormData.pfRegistration || false}
                          onChange={handleEditJoiningInputChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          PF Registration (पीएफ पंजीकरण)
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="esicRegistration"
                          checked={editJoiningFormData.esicRegistration || false}
                          onChange={handleEditJoiningInputChange}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <label className="text-sm text-gray-700">
                          ESIC Registration (ईएसआईसी पंजीकरण)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditJoiningModal(false);
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 flex items-center justify-center min-h-[42px] ${submitting ? "opacity-90 cursor-not-allowed" : ""
                      }`}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
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
        )}
      </div>

      {/* Joining Modal */}
      {showJoiningModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-300">
              <h3 className="text-lg font-medium text-gray-900">
                Employee Joining Form
              </h3>
              <button
                onClick={() => setShowJoiningModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleJoiningSubmit} className="p-6 space-y-6">
              {/* Section 1: Basic Information */}
              <div className="space-y-6">
                {/* ====================== Section 1: Basic Details ====================== */}
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <h2 className="text-lg font-semibold mb-4 text-purple-700">
                    Basic Details (मूल जानकारी)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RBP-Joining ID (जॉइनिंग आईडी) *
                      </label>
                      <input
                        type="text"
                        name="joiningId"
                        value={joiningFormData.joiningId}
                        readOnly
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-700 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Auto-generated joining ID
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Firm Name (फर्म का नाम) *
                      </label>
                      <select
                        name="firmName"
                        value={joiningFormData.firmName}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                        required
                      >
                        <option value="">Select Firm Name</option>
                        {firmNames.map((firm, index) => (
                          <option key={index} value={firm}>
                            {firm}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name As Per Aadhar (नाम आधार के अनुसार)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={selectedItem.candidateName}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div> */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name As Per Aadhar (नाम आधार के अनुसार)
                      </label>
                      <input
                        type="text"
                        name="nameAsPerAadhar"
                        value={joiningFormData.nameAsPerAadhar}
                        onChange={handleJoiningInputChange}
                        disabled={!joiningFormData.isNewEmployee}  // 👈 ये condition
                        placeholder="Enter name as per Aadhar card"
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!joiningFormData.isNewEmployee
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                          : "bg-white text-gray-700"
                          }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Blood Group (ब्लड ग्रुप)
                      </label>
                      <input
                        type="text"
                        name="bloodGroup" // इसे enable करना होगा
                        value={joiningFormData.bloodGroup}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter blood group (A+, B+, O+ etc.)"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Father Name (पिता का नाम)
                      </label>
                      <input
                        type="text"
                        name="fatherName"
                        value={joiningFormData.fatherName}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Joining (जॉइनिंग की तारीख)
                      </label>
                      <input
                        type="date"
                        name="dateOfJoining"
                        value={joiningFormData.dateOfJoining}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* ====================== Section 2: Work & Designation ====================== */}
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <h2 className="text-lg font-semibold mb-4 text-purple-700">
                    Work Details (कार्य विवरण)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Work Location (कार्य स्थान)
                      </label>
                      <input
                        type="text"
                        name="workLocation"
                        value={joiningFormData.workLocation}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Designation (पदनाम)
                      </label>
                      <input
                        type="text"
                        name="designation"
                        value={joiningFormData.designation}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salary (वेतन)
                      </label>
                      <input
                        type="number"
                        name="salary"
                        value={joiningFormData.salary}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter salary"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* ====================== Section 3: Documents ====================== */}
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <h2 className="text-lg font-semibold mb-4 text-purple-700">
                    Documents (दस्तावेज़)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aadhar Frontside Photo (आधार कार्ड फ्रंट फोटो)
                      </label>
                      <input
                        type="file"
                        name="aadharFrontPhoto"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(e, "aadharFrontPhoto")
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aadhar Backside Photo (आधार कार्ड बैक फोटो)
                      </label>
                      <input
                        type="file"
                        name="aadharBackPhoto"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "aadharBackPhoto")}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PAN Card (पैन कार्ड)
                      </label>
                      <input
                        type="file"
                        name="panCard"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "panCard")}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* ====================== Section 4: Family & Address ====================== */}
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <h2 className="text-lg font-semibold mb-4 text-purple-700">
                    Family & Address (परिवार और पता)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship with Family Person (परिवार के सदस्य से
                        संबंध)
                      </label>
                      <select
                        name="relationship"
                        value={joiningFormData.relationship}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      >
                        <option value="">Select Relationship</option>
                        {relationshipOptions.map((relationship, index) => (
                          <option key={index} value={relationship}>
                            {relationship}
                          </option>
                        ))}
                      </select>
                    </div> */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Address (वर्तमान पता)
                      </label>
                      <textarea
                        name="currentAddress"
                        value={joiningFormData.currentAddress}
                        onChange={handleJoiningInputChange}
                        rows={3}
                        placeholder="Enter current address"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address as per Aadhar Card (आधार कार्ड के अनुसार पता)
                      </label>
                      <textarea
                        name="aadharAddress"
                        value={joiningFormData.aadharAddress}
                        onChange={handleJoiningInputChange}
                        rows={3}
                        placeholder="Enter address as per Aadhar Card"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* ====================== Section 5: Personal Info ====================== */}
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <h2 className="text-lg font-semibold mb-4 text-purple-700">
                    Personal Info (व्यक्तिगत जानकारी)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date Of Birth As per Aadhar (जन्मतिथि आधार के अनुसार)
                      </label>
                      <input
                        type="date" // या type="text" भी रख सकते हैं
                        name="dobAsPerAadhar"
                        value={joiningFormData.dobAsPerAadhar}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender (लिंग)
                      </label>
                      <select
                        name="gender"
                        value={joiningFormData.gender}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      >
                        <option value="">Select Gender (लिंग चुनें)</option>
                        <option value="Male">Male (पुरुष)</option>
                        <option value="Female">Female (महिला) </option>
                        <option value="Other">Other (अन्य)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number (मोबाइल नंबर)
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={joiningFormData.mobileNumber}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter 10-digit mobile number"
                        maxLength={10}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Family Number (परिवार का नंबर)
                      </label>
                      <input
                        type="tel"
                        name="familyNumber"
                        value={joiningFormData.familyNumber}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter 10-digit family number"
                        maxLength={10}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* ====================== Section 6: Bank Details ====================== */}
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <h2 className="text-lg font-semibold mb-4 text-purple-700">
                    Bank Details (बैंक विवरण)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Past PF / New PF Id No. (पिछला पीएफ आईडी नंबर)
                      </label>
                      <input
                        type="text"
                        name="pastPfId"
                        value={joiningFormData.pastPfId}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter past PF ID number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>

                    {/* Past ESIC Number - यह नया field है */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Past ESIC / New ESIC Number (पिछला ईएसआईसी नंबर)
                      </label>
                      <input
                        type="text"
                        name="pastEsicNumber"
                        value={joiningFormData.pastEsicNumber}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter past ESIC number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Bank Account Number (वर्तमान बैंक खाता नंबर)
                      </label>
                      <input
                        type="text"
                        name="currentBankAcNo"
                        value={joiningFormData.currentBankAcNo}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter current bank account number"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code (आईएफएससी कोड)
                      </label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={joiningFormData.ifscCode}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter IFSC code"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch Name (शाखा का नाम)
                      </label>
                      <input
                        type="text"
                        name="branchName"
                        value={joiningFormData.branchName}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter branch name"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>
                  </div>
                </div>

                {/* ====================== Section 7: Company & Employment Info ====================== */}
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <h2 className="text-lg font-semibold mb-4 text-purple-700">
                    Company & Employment Info (कंपनी और रोजगार जानकारी)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Personal Email ID (व्यक्तिगत ईमेल आईडी)
                      </label>
                      <input
                        type="email"
                        name="personalEmail"
                        value={joiningFormData.personalEmail}
                        onChange={handleJoiningInputChange}
                        placeholder="Enter personal email ID"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Does Company Provide PF? (क्या कंपनी PF प्रदान करती है?)
                      </label>
                      <select
                        name="companyProvidesPf"
                        value={joiningFormData.companyProvidesPf}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes (हाँ)</option>
                        <option value="No">No (नहीं)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Does Company Provide ESIC? (क्या कंपनी ESIC प्रदान करती
                        है?)
                      </label>
                      <select
                        name="companyProvidesEsic"
                        value={joiningFormData.companyProvidesEsic}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes (हाँ)</option>
                        <option value="No">No (नहीं)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Does Company Provide Email ID? (क्या कंपनी ईमेल आईडी
                        प्रदान करती है?)
                      </label>
                      <select
                        name="companyProvidesEmail"
                        value={joiningFormData.companyProvidesEmail}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes (हाँ)</option>
                        <option value="No">No (नहीं)</option>
                      </select>
                    </div>


                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Attendance Type (उपस्थिति प्रकार)
                      </label>
                      <select
                        name="attendanceType"
                        value={joiningFormData.attendanceType}
                        onChange={handleJoiningInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                      >
                        <option value="">Select Attendance Type</option>
                        {attendanceTypeOptions.map((type, index) => (
                          <option key={index} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>






                    
                  </div>
                </div>

                {/* ====================== Section 8: Candidate Actions ====================== */}
                <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
                  <h2 className="text-lg font-semibold mb-4 text-purple-700">
                    Candidate Actions (उम्मीदवार क्रियाएँ)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="validateCandidate"
                        checked={joiningFormData.validateCandidate || false}
                        onChange={handleJoiningInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        Validate the Candidate (उम्मीदवार का सत्यापन)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="issueGmailId"
                        checked={joiningFormData.issueGmailId || false}
                        onChange={handleJoiningInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        Issue Gmail ID (जीमेल आईडी जारी करना)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="issueJoiningLetter"
                        checked={joiningFormData.issueJoiningLetter || false}
                        onChange={handleJoiningInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        Issue Joining Letter (जॉइनिंग लेटर जारी करना)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="attendanceRegistration"
                        checked={
                          joiningFormData.attendanceRegistration || false
                        }
                        onChange={handleJoiningInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        Attendance Registration (उपस्थिति पंजीकरण)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="pfRegistration"
                        checked={joiningFormData.pfRegistration || false}
                        onChange={handleJoiningInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        PF Registration (पीएफ पंजीकरण)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="esicRegistration"
                        checked={joiningFormData.esicRegistration || false}
                        onChange={handleJoiningInputChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                      <label className="text-sm text-gray-700">
                        ESIC Registration (ईएसआईसी पंजीकरण)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJoiningModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 flex items-center justify-center min-h-[42px] ${submitting ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
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

      {showShareModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-300">
              <h3 className="text-lg font-medium text-gray-900">
                Share Candidate Details
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleShareSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={shareFormData.recipientName}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={shareFormData.recipientEmail}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={shareFormData.subject}
                  onChange={handleShareInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={shareFormData.message}
                  onChange={handleShareInputChange}
                  rows={5}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attached Links
                </label>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <a
                      href="https://joining-from-employee.vercel.app//"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Joining Form Link
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 flex items-center justify-center min-h-[42px] ${submitting ? "opacity-90 cursor-not-allowed" : ""
                    }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
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
                      Sending...
                    </>
                  ) : (
                    "Send Email"
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

export default Joining;
