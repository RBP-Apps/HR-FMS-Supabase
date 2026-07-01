import React, { useState, useEffect, useMemo } from "react";
import { Clock, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";

import JoiningFilters from "../components/joining/JoiningFilters";
import PendingTable from "../components/joining/PendingTable";
import HistoryTable from "../components/joining/HistoryTable";
import EditJoiningModal from "../components/joining/EditJoiningModal";
import NewJoiningModal from "../components/joining/NewJoiningModal";
import ShareDetailsModal from "../components/joining/ShareDetailsModal";

import { uploadFileToDrive, formatDOB, formatDateForStorage } from "../utils/joiningUtils";

const Joining = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showJoiningModal, setShowJoiningModal] = useState(false);
  const [showEditJoiningModal, setShowEditJoiningModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [joiningData, setJoiningData] = useState([]);
  const [historyJoiningData, setHistoryJoiningData] = useState([]);
  const [followUpData, setFollowUpData] = useState([]);
  const [joiningRecords, setJoiningRecords] = useState([]);
  const [firmNames, setFirmNames] = useState([]);
  const [relationshipOptions, setRelationshipOptions] = useState([]);
  const [attendanceTypeOptions, setAttendanceTypeOptions] = useState([]);

  const [filterIndentNo, setFilterIndentNo] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [filterName, setFilterName] = useState("");

  const [nextJoiningId, setNextJoiningId] = useState("");

  const [shareFormData, setShareFormData] = useState({
    recipientName: "",
    recipientEmail: "",
    subject: "Candidate Joining Details",
    message: "Please find the candidate joining details attached below.",
  });

  const [joiningFormData, setJoiningFormData] = useState({
    joiningId: "",
    punchId: "",
    firmName: "",
    nameAsPerAadhar: "",
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
    familyPersonName: "",
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
    employeeCategory: "",
  });

  const [editJoiningFormData, setEditJoiningFormData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      await fetchJoiningData();
      const records = await fetchJoiningDataForHistory();
      setJoiningRecords(records);
    };
    loadData();
    fetchFirmNames();
    fetchLastJoiningId();
    fetchMasterData();
  }, []);

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

      return { success: true, relationships, attendanceTypes };
    } catch (error) {
      console.error("Error fetching master data:", error);
      return { success: false, error: error.message };
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

  const fetchLastJoiningId = async () => {
    try {
      const { data, error } = await supabase
        .from("joining")
        .select("rbp_joining_id");

      if (error) throw error;

      let maxId = 0;
      if (data && data.length > 0) {
        data.forEach((record) => {
          const joiningId = record.rbp_joining_id;
          if (joiningId && joiningId.includes('-')) {
            const num = parseInt(joiningId.split('-')[1]);
            if (!isNaN(num) && num > maxId) maxId = num;
          } else if (joiningId && joiningId.startsWith('RBP')) {
            const num = parseInt(joiningId.replace('RBP', ''));
            if (!isNaN(num) && num > maxId) maxId = num;
          }
        });
      }

      const nextId = `RBP-${maxId + 1}`;
      setNextJoiningId(nextId);
      setJoiningFormData((prev) => ({ ...prev, joiningId: nextId }));
    } catch (error) {
      console.error("Error fetching joining IDs:", error);
      setNextJoiningId("RBP-1");
      setJoiningFormData((prev) => ({ ...prev, joiningId: "RBP-1" }));
    }
  };

  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const { data: enquiryData, error: enquiryError } = await supabase
        .from("enquiry")
        .select("*")
        .order("created_at", { ascending: false });

      if (enquiryError) throw enquiryError;

      const { data: followUpDataResp, error: followUpError } = await supabase
        .from("follow_up")
        .select("enquiry_number, status");

      if (followUpError) throw followUpError;

      const { data: indentDataResp } = await supabase
        .from("indent")
        .select("indent_number, company_name");

      const allProcessedEnquiryData = enquiryData
        .map((row) => {
          const matchedIndent = indentDataResp?.find(
            (ind) => ind.indent_number === row.indent_number
          );
          const compName = row.company_name || matchedIndent?.company_name || "";
          return {
            id: row.id,
            indentNo: row.indent_number,
            candidateEnquiryNo: row.candidate_enquiry_number,
            applyingForPost: row.applying_post,
            department: row.department || "",
            candidateName: row.candidate_name,
            candidateDOB: row.dob,
            candidatePhone: row.candidate_phone,
            candidateEmail: row.candidate_email,
            presentAddress: row.present_address || "",
            designation: row.applying_post || "",
            actualDate: row.actual_1 || "",
            joiningDate: row.actual_2 || "",
            candidateResume: row.resume_copy || "",
            companyName: compName,
          };
        })
        .filter((item) => item.actualDate && item.actualDate.toString().trim() !== "");

      setFollowUpData(followUpDataResp || []);

      const itemsWithJoiningStatus = allProcessedEnquiryData.filter((item) => {
        return followUpDataResp?.some(
          (followUp) =>
            followUp.enquiry_number === item.candidateEnquiryNo &&
            followUp.status?.includes("Joining"),
        );
      });

      const pendingItems = itemsWithJoiningStatus.filter(
        (item) => !item.joiningDate || item.joiningDate.toString().trim() === ""
      );

      const historyItems = itemsWithJoiningStatus.filter(
        (item) => item.joiningDate && item.joiningDate.toString().trim() !== ""
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

  const fetchJoiningDataForHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("joining")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJoiningRecords(data || []);
      return data;
    } catch (error) {
      console.error("Error fetching joining data:", error);
      return [];
    }
  };

  const refreshAllData = async () => {
    setTableLoading(true);
    try {
      await Promise.all([
        fetchJoiningData(),
        fetchJoiningDataForHistory()
      ]);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setTableLoading(false);
    }
  };

  const updateEnquirySheet = async (enquiryNo, timestamp) => {
    try {
      const { data, error } = await supabase
        .from("enquiry")
        .select("id")
        .eq("candidate_enquiry_number", enquiryNo)
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) throw new Error(`Enquiry number ${enquiryNo} not found`);

      const { error: updateError } = await supabase
        .from("enquiry")
        .update({ actual_2: timestamp })
        .eq("candidate_enquiry_number", enquiryNo);

      if (updateError) throw updateError;
      return true;
    } catch (error) {
      throw new Error(`Failed to update enquiry table: ${error.message}`);
    }
  };

  const postToJoiningSheet = async (rowData) => {
    try {
      const joiningRecord = {
        timestamp_date: rowData[0] ? new Date(rowData[0]) : new Date(),
        rbp_joining_id: rowData[1],
        status: rowData[2],
        firm_name: rowData[3],
        name_as_per_aadhar: rowData[4],
        punch_id: rowData[5],
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
        department: rowData[37],
        employee_category: rowData[38],
        created_at: new Date(),
      };

      const { data, error } = await supabase.from("joining").insert([joiningRecord]).select();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      throw new Error(`Failed to insert into joining table: ${error.message}`);
    }
  };

  const handleJoiningSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const uploadPromises = {};
      const fileFields = ["aadharFrontPhoto", "aadharBackPhoto", "panCard", "bankPassbookPhoto"];

      for (const field of fileFields) {
        if (joiningFormData[field]) {
          uploadPromises[field] = uploadFileToDrive(joiningFormData[field]);
        } else {
          uploadPromises[field] = Promise.resolve("");
        }
      }

      const uploadedUrls = await Promise.all(
        Object.values(uploadPromises).map((promise) => promise.catch(() => ""))
      );

      const fileUrls = {};
      Object.keys(uploadPromises).forEach((field, index) => {
        fileUrls[field] = uploadedUrls[index];
      });

      const now = new Date();
      const formattedTimestamp = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

      const rowData = [];
      rowData[0] = formattedTimestamp;
      rowData[1] = joiningFormData.joiningId;
      rowData[2] = "Active";
      rowData[3] = joiningFormData.firmName;
      rowData[4] = joiningFormData.nameAsPerAadhar;
      rowData[5] = joiningFormData.punchId;
      rowData[6] = joiningFormData.fatherName;
      rowData[7] = formatDateForStorage(joiningFormData.dateOfJoining);
      rowData[8] = joiningFormData.workLocation;
      rowData[9] = joiningFormData.designation;
      rowData[10] = joiningFormData.salary;
      rowData[11] = fileUrls.aadharFrontPhoto;
      rowData[12] = fileUrls.aadharBackPhoto;
      rowData[13] = fileUrls.panCard;
      rowData[14] = joiningFormData.relationship;
      rowData[15] = joiningFormData.currentAddress;
      rowData[16] = joiningFormData.aadharAddress;
      rowData[17] = formatDateForStorage(joiningFormData.dobAsPerAadhar);
      rowData[18] = joiningFormData.gender;
      rowData[19] = joiningFormData.mobileNumber;
      rowData[20] = joiningFormData.familyNumber;
      rowData[21] = joiningFormData.pastPfId || "";
      rowData[22] = joiningFormData.pastEsicNumber || "";
      rowData[23] = joiningFormData.currentBankAcNo;
      rowData[24] = joiningFormData.ifscCode;
      rowData[25] = joiningFormData.branchName;
      rowData[26] = joiningFormData.personalEmail;
      rowData[27] = joiningFormData.companyProvidesPf;
      rowData[28] = joiningFormData.companyProvidesEsic;
      rowData[29] = joiningFormData.companyProvidesEmail;
      rowData[30] = joiningFormData.attendanceType;
      rowData[31] = joiningFormData.validateCandidate ? "Yes" : "No";
      rowData[32] = joiningFormData.issueGmailId ? "Yes" : "No";
      rowData[33] = joiningFormData.issueJoiningLetter ? "Yes" : "No";
      rowData[34] = joiningFormData.attendanceRegistration ? "Yes" : "No";
      rowData[35] = joiningFormData.pfRegistration ? "Yes" : "No";
      rowData[36] = joiningFormData.esicRegistration ? "Yes" : "No";
      rowData[37] = joiningFormData.department;
      rowData[38] = joiningFormData.employeeCategory;
      rowData[40] = "";

      await postToJoiningSheet(rowData);
      if (selectedItem?.candidateEnquiryNo) {
        await updateEnquirySheet(selectedItem.candidateEnquiryNo, formattedTimestamp);
      }

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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const uploadPromises = {};
      const fileFields = ["aadharFrontPhoto", "aadharBackPhoto", "panCard", "bankPassbookPhoto"];

      for (const field of fileFields) {
        if (editJoiningFormData[field] && editJoiningFormData[field] instanceof File) {
          uploadPromises[field] = uploadFileToDrive(editJoiningFormData[field]);
        } else {
          uploadPromises[field] = Promise.resolve(null);
        }
      }

      const uploadedUrls = await Promise.all(
        Object.values(uploadPromises).map((p) => p.catch(() => null))
      );

      const fileUrls = {};
      Object.keys(uploadPromises).forEach((field, index) => {
        fileUrls[field] = uploadedUrls[index];
      });

      const { error: updateError } = await supabase
        .from("joining")
        .update({
          firm_name: editJoiningFormData.firmName,
          name_as_per_aadhar: editJoiningFormData.nameAsPerAadhar,
          punch_id: editJoiningFormData.punchId,
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
          employee_category: editJoiningFormData.employeeCategory,
        })
        .eq("rbp_joining_id", editJoiningFormData.joiningId);

      if (updateError) throw updateError;

      if (selectedItem?.candidateEnquiryNo) {
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
      }

      toast.success("Joining details updated successfully!");
      setShowEditJoiningModal(false);
      setSelectedItem(null);
      await refreshAllData();
    } catch (error) {
      console.error("Error updating joining details:", error);
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const shareLink = `${window.location.origin}/?enquiry=${selectedItem.candidateEnquiryNo || ""}`;
      await navigator.clipboard.writeText(shareLink);
      toast.success(`Link copied to clipboard: ${shareLink}`);
      setShowShareModal(false);
    } catch (error) {
      console.error("Error sharing details:", error);
      toast.error(`Failed to share details: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const findMatchingFirm = (searchName) => {
    if (!searchName) return "";
    const normalizedSearch = searchName.trim().toLowerCase();
    
    // 1. Exact match (case-insensitive)
    const exactMatch = firmNames.find(f => f.trim().toLowerCase() === normalizedSearch);
    if (exactMatch) return exactMatch;
    
    // 2. Substring match
    const substringMatch = firmNames.find(f => {
      const normalizedFirm = f.trim().toLowerCase();
      return normalizedFirm.includes(normalizedSearch) || normalizedSearch.includes(normalizedFirm);
    });
    if (substringMatch) return substringMatch;
    
    return searchName;
  };

  const handleJoiningClick = (item) => {
    setSelectedItem(item);
    const isNewEmployee = !item.id || !item.candidateEnquiryNo;
    setJoiningFormData({
      joiningId: nextJoiningId,
      punchId: "",
      firmName: isNewEmployee ? "" : (findMatchingFirm(item.companyName) || ""),
      nameAsPerAadhar: isNewEmployee ? "" : (item.candidateName || ""),
      fatherName: "",
      dateOfJoining: "",
      workLocation: "",
      designation: isNewEmployee ? "" : (item.designation || ""),
      salary: "",
      aadharFrontPhoto: null,
      aadharBackPhoto: null,
      panCard: null,
      candidatePhoto: null,
      relationship: "",
      familyPersonName: "",
      currentAddress: isNewEmployee ? "" : (item.presentAddress || ""),
      aadharAddress: "",
      dobAsPerAadhar: formatDOB(item.candidateDOB) || "",
      gender: "",
      mobileNumber: isNewEmployee ? "" : (item.candidatePhone || ""),
      familyNumber: "",
      pastPfId: "",
      pastEsicNumber: "",
      currentBankAcNo: "",
      ifscCode: "",
      branchName: "",
      bankPassbookPhoto: null,
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
      department: isNewEmployee ? "" : (item.department || ""),
      equipment: "",
      isNewEmployee,
      employeeCategory: "",
    });
    setShowJoiningModal(true);
  };

  const handleEditClick = async (item, record) => {
    setSelectedItem(item);
    let joinRec = record;

    try {
      if (!joinRec) {
        const { data, error } = await supabase
          .from("joining")
          .select("*")
          .or(`rbp_joining_id.ilike.%${item.candidateEnquiryNo}%,name_as_per_aadhar.eq.${item.candidateName}`)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        if (data && data.length > 0) joinRec = data[0];
      }

      const formatSelection = (val) => {
        if (val === true || val === "TRUE" || val === "true") return "Yes";
        if (val === false || val === "FALSE" || val === "false") return "No";
        return "";
      };

      if (joinRec) {
        setEditJoiningFormData({
          joiningId: joinRec.rbp_joining_id || "",
          punchId: joinRec.punch_id || "",
          firmName: joinRec.firm_name || findMatchingFirm(item.companyName) || "",
          nameAsPerAadhar: joinRec.name_as_per_aadhar || item.candidateName || "",
          fatherName: joinRec.father_name || "",
          dateOfJoining: joinRec.date_of_joining ? joinRec.date_of_joining.split('T')[0] : "",
          workLocation: joinRec.work_location || "",
          designation: joinRec.designation || item.applyingForPost || "",
          salary: joinRec.salary || "",
          aadharFrontPhoto: joinRec.aadhar_front_photo || null,
          aadharBackPhoto: joinRec.aadhar_back_photo || null,
          panCard: joinRec.pan_card || null,
          candidatePhoto: null,
          relationship: joinRec.family_relationship || "",
          familyPersonName: joinRec.family_person_name || "",
          currentAddress: joinRec.current_address || item.presentAddress || "",
          aadharAddress: joinRec.aadhar_address || "",
          dobAsPerAadhar: joinRec.date_of_birth ? joinRec.date_of_birth.split('T')[0] : item.candidateDOB || "",
          gender: joinRec.gender || "",
          mobileNumber: joinRec.mobile_number || item.candidatePhone || "",
          familyNumber: joinRec.family_number || "",
          pastPfId: joinRec.past_pf_id || "",
          pastEsicNumber: joinRec.past_esic_number || "",
          currentBankAcNo: joinRec.bank_account_number || "",
          ifscCode: joinRec.ifsc_code || "",
          branchName: joinRec.branch_name || "",
          personalEmail: joinRec.personal_email || item.candidateEmail || "",
          companyProvidesPf: formatSelection(joinRec.company_pf_provided),
          companyProvidesEsic: formatSelection(joinRec.company_esic_provided),
          companyProvidesEmail: formatSelection(joinRec.company_mail_provided),
          attendanceType: joinRec.attendance_type || "",
          validateCandidate: !!joinRec.candidate_validated,
          issueGmailId: !!joinRec.gmail_id_issued,
          issueJoiningLetter: !!joinRec.joining_letter_issued,
          attendanceRegistration: !!joinRec.attendance_registration,
          pfRegistration: !!joinRec.pf_registration,
          esicRegistration: !!joinRec.esic_registration,
          department: joinRec.department || item.department || "",
          equipment: joinRec.equipment || "",
          existingAadharFrontUrl: joinRec.aadhar_front_photo || null,
          existingAadharBackUrl: joinRec.aadhar_back_photo || null,
          existingPanUrl: joinRec.pan_card || null,
          existingBankPassbookUrl: joinRec.bank_passbook_photo || null,
          employeeCategory: joinRec.employee_category || "",
        });
      } else {
        setEditJoiningFormData({
          joiningId: "",
          punchId: "",
          firmName: findMatchingFirm(item.companyName) || "",
          nameAsPerAadhar: item.candidateName || "",
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
          employeeCategory: "",
        });
      }
      setShowEditJoiningModal(true);
    } catch (err) {
      console.error("Error setting up edit modal:", err);
      toast.error("Failed to load joining data");
    }
  };

  const handleInputChange = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFile = (setter) => (e, fieldName) => {
    const file = e.target.files[0];
    if (file) setter((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleJoiningInputChange = handleInputChange(setJoiningFormData);
  const handleEditJoiningInputChange = handleInputChange(setEditJoiningFormData);
  const handleShareInputChange = handleInputChange(setShareFormData);
  const handleFileChange = handleFile(setJoiningFormData);
  const handleEditJoiningFileChange = handleFile(setEditJoiningFormData);

  const uniqueIndents = useMemo(() => Array.from(new Set([...joiningData, ...historyJoiningData].map(i => i.indentNo).filter(Boolean))), [joiningData, historyJoiningData]);
  const uniquePosts = useMemo(() => Array.from(new Set([...joiningData, ...historyJoiningData].map(i => i.applyingForPost).filter(Boolean))), [joiningData, historyJoiningData]);
  const uniqueNames = useMemo(() => Array.from(new Set([...joiningData, ...historyJoiningData].map(i => {
    const record = joiningRecords.find(r => r.mobile_number === i.candidatePhone);
    return record?.name_as_per_aadhar || i.candidateName;
  }).filter(Boolean))), [joiningData, historyJoiningData, joiningRecords]);

  const filterData = (data) => data.filter((item) => {
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

  const filteredJoiningData = useMemo(() => filterData(joiningData), [joiningData, joiningRecords, searchTerm, filterIndentNo, filterPost, filterName]);
  const filteredHistoryData = useMemo(() => filterData(historyJoiningData), [historyJoiningData, joiningRecords, searchTerm, filterIndentNo, filterPost, filterName]);

  const handleClearFilters = () => {
    setFilterIndentNo("");
    setFilterPost("");
    setFilterName("");
    setSearchTerm("");
  };

  const handleNewJoining = () => {
    const emptyItem = {
      id: null, indentNo: "", candidateEnquiryNo: "", applyingForPost: "",
      department: "", candidateName: "", candidateDOB: "", candidatePhone: "",
      candidateEmail: "", presentAddress: "", designation: "", actualDate: "", joiningDate: ""
    };
    handleJoiningClick(emptyItem);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-600">Joining Management</h1>
      </div>
      

      <JoiningFilters
        filterIndentNo={filterIndentNo} setFilterIndentNo={setFilterIndentNo} uniqueIndents={uniqueIndents}
        filterPost={filterPost} setFilterPost={setFilterPost} uniquePosts={uniquePosts}
        filterName={filterName} setFilterName={setFilterName} uniqueNames={uniqueNames}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        onClearFilters={handleClearFilters} onNewJoining={handleNewJoining}
      />

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

        <div className="p-6">
          {activeTab === "pending" ? (
            <PendingTable
              tableLoading={tableLoading}
              error={error}
              filteredJoiningData={filteredJoiningData}
              fetchJoiningData={fetchJoiningData}
              handleJoiningClick={handleJoiningClick}
            />
          ) : (
            <HistoryTable
              tableLoading={tableLoading}
              error={error}
              filteredHistoryData={filteredHistoryData}
              joiningRecords={joiningRecords}
              fetchJoiningData={fetchJoiningData}
              fetchJoiningDataForHistory={fetchJoiningDataForHistory}
              handleEditClick={handleEditClick}
            />
          )}
        </div>
      </div>

      <EditJoiningModal
        showEditJoiningModal={showEditJoiningModal}
        setShowEditJoiningModal={setShowEditJoiningModal}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        editJoiningFormData={editJoiningFormData}
        handleEditJoiningInputChange={handleEditJoiningInputChange}
        handleEditJoiningFileChange={handleEditJoiningFileChange}
        handleEditSubmit={handleEditSubmit}
        firmNames={
          editJoiningFormData.firmName && !firmNames.includes(editJoiningFormData.firmName)
            ? [...firmNames, editJoiningFormData.firmName]
            : firmNames
        }
        attendanceTypeOptions={attendanceTypeOptions}
        submitting={submitting}
      />

      <NewJoiningModal
        showJoiningModal={showJoiningModal}
        setShowJoiningModal={setShowJoiningModal}
        selectedItem={selectedItem}
        joiningFormData={joiningFormData}
        handleJoiningInputChange={handleJoiningInputChange}
        handleFileChange={handleFileChange}
        handleJoiningSubmit={handleJoiningSubmit}
        firmNames={
          joiningFormData.firmName && !firmNames.includes(joiningFormData.firmName)
            ? [...firmNames, joiningFormData.firmName]
            : firmNames
        }
        attendanceTypeOptions={attendanceTypeOptions}
        submitting={submitting}
      />

      <ShareDetailsModal
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        selectedItem={selectedItem}
        shareFormData={shareFormData}
        handleShareInputChange={handleShareInputChange}
        handleShareSubmit={handleShareSubmit}
        submitting={submitting}
      />
    </div>
  );
};

export default Joining;
