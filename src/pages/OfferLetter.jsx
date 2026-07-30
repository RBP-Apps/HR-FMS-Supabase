import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import supabase from "../utils/supabase";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import emailjs from "@emailjs/browser";

// Sub-components
import ListView from "../components/offer-letter/ListView";
import CreateView from "../components/offer-letter/CreateView";
import SendEmailModal from "../components/offer-letter/SendEmailModal";
import SendConfirmationModal from "../components/offer-letter/SendConfirmationModal";
import SendOfferModal from "../components/offer-letter/SendOfferModal";

const OfferLetter = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState("list"); // list, create, details, confirmation
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // pending, pendingConfirmation, history

  const [departmentOptions, setDepartmentOptions] = useState([]);

  // Data State
  const [offers, setOffers] = useState([]);
  const [confirmationLetters, setConfirmationLetters] = useState([]);
  const [joiningHistory, setJoiningHistory] = useState([]);
  const [pendingConfirmationCandidates, setPendingConfirmationCandidates] = useState([]); // NEW: Candidates whose offer letter sent but confirmation not sent
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    pendingConfirmation: 0,
  });

  // Filter State
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    status: "",
    dateRange: "",
  });

  // Selection search state for wizard Step 1
  const [selectionSearch, setSelectionSearch] = useState("");

  const [dynamicOptions, setDynamicOptions] = useState({
    departments: [],
    designations: [],
    statuses: [],
    workLocations: [],
    probationPeriods: ["3 Months", "6 Months", "1 Year", "None"],
    weeklyOffs: ["Sunday", "Monday", "Saturday", "Friday"],
    shiftTimings: ["9:30 AM - 6:30 PM"],
    leavePolicies: [],
    noticePeriods: ["15 Days", "30 Days", "45 Days", "60 Days", "90 Days"]
  });

  // Send Email State
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [emailTargetOffer, setEmailTargetOffer] = useState(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  // Add these states after other modal states
  const [showSendOfferModal, setShowSendOfferModal] = useState(false);
  const [sendOfferEmail, setSendOfferEmail] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);

  // Send Confirmation Email State
  const [showSendConfirmationModal, setShowSendConfirmationModal] = useState(false);
  const [confirmationTarget, setConfirmationTarget] = useState(null);
  const [confirmationEmailAddress, setConfirmationEmailAddress] = useState("");
  const [confirmationEmailSending, setConfirmationEmailSending] = useState(false);

  // Form State (for Create/Edit)
  const [currentStep, setCurrentStep] = useState(1);
  const [isConfirmationMode, setIsConfirmationMode] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Selection
    joiningId: "",
    // Step 2: Employee Details
    employeeName: "",
    fatherName: "",
    department: "",
    designation: "",
    workLocation: "",
    joiningDate: "",
    salary: "",
    mobileNumber: "",
    email: "",
    companyName: "",
    // Step 3: Offer Details
    offerId: "",
    offerDate: new Date().toISOString().split("T")[0],
    reportingTo: "",
    placeOfPosting: "",
    ctcType: "Monthly",
    grossSalary: "",
    probationPeriod: "6 Months",
    probationEndDate: "",
    reportingManager: "",
    shiftTiming: "9:30 AM - 6:30 PM",
    weeklyOff: "Sunday",
    noticePeriod: "30 Days",
    workingHours: "9 Hours",
    leavePolicy: "As per company policy",
    bondPeriod: "None",
    remarks: "",
    enquiryNumber: "",
    terms: "",
    confirmationDate: new Date().toISOString().split("T")[0],
    effectiveDate: "",
    confirmationRemarks: "",
  });

  // Fetch Data
  useEffect(() => {
    fetchOffers();
    fetchFollowUpHistory();
    fetchConfirmationLetters();
    fetchPendingConfirmationCandidates();
    fetchDepartmentOptions();
  }, []);

  const fetchDepartmentOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("department");
      if (error) throw error;
      const departments = [...new Set((data || []).map(d => d.department).filter(Boolean))];
      setDepartmentOptions(departments);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchOffers = async () => {
    setTableLoading(true);
    try {
      const { data: followUpData, error: followUpError } = await supabase
        .from("follow_up")
        .select("*")
        .eq("status", "Joining")
        .order("created_at", { ascending: false });

      if (followUpError) throw followUpError;

      const { data: enquiryData, error: enquiryError } = await supabase
        .from("enquiry")
        .select("*");

      if (enquiryError) throw enquiryError;

      const { data: offerData, error: offerError } = await supabase
        .from("offer_letters")
        .select("*");

      if (offerError) throw offerError;

      const { data: confData, error: confError } = await supabase
        .from("confirmation_letters")
        .select("follow_up_id");

      if (confError) throw confError;
      const confIds = new Set((confData || []).map(c => c.follow_up_id));

      const mergedData = (followUpData || []).map((followUp) => {
        const offer = (offerData || []).find((o) => o.follow_up_id === followUp.id);
        const enquiry = (enquiryData || []).find((e) => e.candidate_enquiry_number === followUp.enquiry_number);
        const confExists = confIds.has(followUp.id);

        return {
          id: offer?.id || followUp.id,
          offerId: offer?.offerId || "N/A",
          follow_up_id: followUp.id,
          enquiry_number: followUp.enquiry_number,
          candidate_says: followUp.candidate_says,
          next_call_date: followUp.next_call_date,
          employee_name: enquiry?.candidate_name || followUp.candidate_says || "N/A",
          department: enquiry?.department,
          designation: enquiry?.applying_post,
          salary: enquiry?.salary || 0,
          mobileNumber: enquiry?.candidate_phone || "",
          mobile_number: enquiry?.candidate_phone || "",
          email: enquiry?.candidate_email || "",
          personalEmail: enquiry?.candidate_email || "",
          dob: enquiry?.dob || "",
          presentAddress: enquiry?.present_address || "",
          workLocation: enquiry?.present_address || "Office",
          aadharNo: enquiry?.aadhar_number || "",
          candidatePhoto: enquiry?.candidate_photo || "",
          companyName: enquiry?.company_name || "",
          candidateResume: enquiry?.resume_copy || "",
          offer_date: offer?.offer_date || "Not Generated",
          status: offer?.status || "Pending",
          ...offer,
          confirmation_sent: confExists,
        };
      });

      setOffers(mergedData);
      calculateStats(mergedData);
    } catch (err) {
      console.error("Error fetching offers:", err);
      toast.error("Error loading follow-up data. Please check your connection.");
    } finally {
      setTableLoading(false);
    }
  };

  const fetchPendingConfirmationCandidates = async () => {
    try {
      const { data: offerData, error: offerError } = await supabase
        .from("offer_letters")
        .select("*")
        .eq("status", "Sent");

      if (offerError) throw offerError;

      if (!offerData || offerData.length === 0) {
        setPendingConfirmationCandidates([]);
        return;
      }

      const { data: confData, error: confError } = await supabase
        .from("confirmation_letters")
        .select("follow_up_id");

      if (confError) throw confError;
      const confIds = new Set((confData || []).map(c => c.follow_up_id));

      const { data: enquiryData, error: enquiryError } = await supabase
        .from("enquiry")
        .select("*");

      if (enquiryError) throw enquiryError;

      const mergedCandidates = (offerData || [])
        .filter(offer => !confIds.has(offer.follow_up_id))
        .map((offer) => {
          const enquiry = (enquiryData || []).find((e) => e.candidate_enquiry_number === offer.enquiry_number);
          return {
            ...offer,
            id: offer.id,
            follow_up_id: offer.follow_up_id,
            enquiry_number: offer.enquiry_number,
            employee_name: offer.employee_name,
            department: offer.department,
            designation: offer.designation,
            company_name: enquiry?.company_name || offer.employee_name || "Candidate",
            mobile_number: enquiry?.candidate_phone || "",
            email: enquiry?.candidate_email || offer.email || "",
            presentAddress: enquiry?.present_address || "",
            aadhar_number: enquiry?.aadhar_number || "",
            salary: offer.salary,
            joining_date: offer.joining_date,
          };
        });

      console.log("Pending confirmation candidates:", mergedCandidates);
      setPendingConfirmationCandidates(mergedCandidates);
    } catch (err) {
      console.error("Error fetching pending confirmation candidates:", err);
    }
  };

  const fetchConfirmationLetters = async () => {
    try {
      const { data, error } = await supabase
        .from("confirmation_letters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConfirmationLetters(data || []);
    } catch (err) {
      console.error("Error fetching confirmation letters:", err);
    }
  };

  const fetchFollowUpHistory = async () => {
    try {
      const { data: followUpData, error } = await supabase
        .from("follow_up")
        .select("*")
        .eq("status", "Joining")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: enquiryData, error: enquiryError } = await supabase
        .from("enquiry")
        .select("*");

      if (enquiryError) throw enquiryError;

      // Fetch existing offer letters to filter out candidates who already have one
      const { data: offerLetters, error: offerError } = await supabase
        .from("offer_letters")
        .select("follow_up_id");

      if (offerError) throw offerError;
      const existingOfferIds = new Set((offerLetters || []).map(o => o.follow_up_id));

      const mergedHistory = (followUpData || [])
        .filter((followUp) => !existingOfferIds.has(followUp.id))
        .map((followUp) => {
          const enquiry = (enquiryData || []).find((e) => e.candidate_enquiry_number === followUp.enquiry_number);
          return {
            ...followUp,
            name_as_per_aadhar: enquiry?.candidate_name || followUp.candidate_says || "Candidate",
            rbp_joining_id: followUp.enquiry_number || `ENQ-${followUp.id}`,
            designation: enquiry?.applying_post,
            department: enquiry?.department,
            company_name: enquiry?.company_name,
            mobile_number: enquiry?.candidate_phone || "",
            email: enquiry?.candidate_email || "",
            next_call_date: followUp.next_call_date || "",
            present_address: enquiry?.present_address || "",
            aadhar_number: enquiry?.aadhar_number || "",
            salary: enquiry?.salary || 0,
          };
        });

      setJoiningHistory(mergedHistory);
    } catch (err) {
      console.error("Error fetching follow-up history:", err);
    }
  };

  const calculateStats = (data) => {
    const s = {
      total: data.length,
      draft: data.filter((o) => o.status === "Pending" || o.status === "Draft").length,
      sent: data.filter((o) => o.status === "Sent" && !o.confirmation_sent).length,
      accepted: data.filter((o) => o.status === "Accepted").length,
      pendingConfirmation: data.filter((o) => o.status === "Sent" && !o.confirmation_sent).length,
    };
    setStats(s);
  };

  const sendEmailViaEmailJS = async ({
    toEmail,
    toName,
    subject,
    companyName,
    letterType,
    messageText,
    pdfUrl,
    departmentName,
    portalName = "RBP HR Portal"
  }) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || serviceId === "your_service_id" || !templateId || !publicKey) {
      console.warn("EmailJS credentials not configured in .env. Skipping actual API call.");
      toast.error("EmailJS credentials not configured in .env file!", { id: "emailjs-err" });
      return false;
    }

    try {
      console.log("EMAIL PARAMS", {
        toEmail,
        toName,
        subject,
        companyName,
        pdfUrl,
      });


      const templateParams = {
        to_email: toEmail,
        to_name: toName,
        subject: subject,
        company_name: companyName,
        letter_type: letterType,
        message: messageText,
        pdf_url: pdfUrl,
        department_name: departmentName,
        portal_name: portalName,
      };


      const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
      console.log("EmailJS Success:", response);
      return true;
    } catch (err) {
      console.error("EmailJS Error:", err);
      toast.error(`EmailJS error: ${err.text || err.message || err}`);
      return false;
    }
  };

  const uploadConfirmationPDF = async (letterData) => {
    const page = document.getElementById("confirmation-page");
    if (!page) {
      toast.error("Confirmation preview page not found in DOM");
      return null;
    }

    try {
      const canvas = await html2canvas(page, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

      const pdfBlob = pdf.output("blob");
      const followUpId = letterData.follow_up_id || letterData.joiningId || letterData.id;
      const empName = letterData.employee_name || letterData.employeeName || "Employee";
      const fileName = `Confirmation_${followUpId}_${empName}.pdf`;
      const pdfUrl = await uploadPDFToStorage(pdfBlob, fileName, "confirmation");
      return pdfUrl;
    } catch (err) {
      console.error("Error generating/uploading confirmation PDF:", err);
      return null;
    }
  };


  // Upload PDF to Supabase Storage
  const uploadPDFToStorage = async (
    pdfBlob,
    fileName,
    folder = "offer"
  ) => {
    try {
      const filePath = `${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from("letter")
        .upload(filePath, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("letter")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const downloadPreviewAsPDF = async () => {
    const page1 = document.getElementById("offer-page-1");
    const page2 = document.getElementById("offer-page-2");

    if (!page1 || !page2) {
      toast.error("Preview pages not found");
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-gen" });

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // ===== PAGE 1 =====
      const canvas1 = await html2canvas(page1, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData1 = canvas1.toDataURL("image/png");

      pdf.addImage(
        imgData1,
        "PNG",
        0,
        0,
        210,
        297
      );

      // ===== PAGE 2 =====
      const canvas2 = await html2canvas(page2, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData2 = canvas2.toDataURL("image/png");

      pdf.addPage();

      pdf.addImage(
        imgData2,
        "PNG",
        0,
        0,
        210,
        297
      );

      pdf.save(
        `Offer_Letter_${formData.employeeName || "Candidate"}.pdf`
      );

      toast.success("PDF downloaded successfully!", {
        id: "pdf-gen",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);

      toast.error("Failed to generate PDF", {
        id: "pdf-gen",
      });
    }
  };

  // Calculate Probation End Date
  useEffect(() => {
    if (formData.joiningDate && formData.probationPeriod) {
      const joiningDate = new Date(formData.joiningDate);
      let monthsToAdd = 0;

      switch (formData.probationPeriod) {
        case "3 Months":
          monthsToAdd = 3;
          break;
        case "6 Months":
          monthsToAdd = 6;
          break;
        case "1 Year":
          monthsToAdd = 12;
          break;
        case "None":
          monthsToAdd = 0;
          break;
        default:
          monthsToAdd = 6;
      }

      if (monthsToAdd > 0) {
        const endDate = new Date(joiningDate);
        endDate.setMonth(endDate.getMonth() + monthsToAdd);
        setFormData(prev => ({
          ...prev,
          probationEndDate: endDate.toISOString().split("T")[0]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          probationEndDate: "No probation period"
        }));
      }
    }
  }, [formData.joiningDate, formData.probationPeriod]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectEmployee = (followUp) => {
    setFormData((prev) => ({
      ...prev,
      joiningId: followUp.follow_up_id || followUp.id,
      enquiryNumber: followUp.enquiry_number || "",
      employeeName: followUp.employee_name || followUp.name_as_per_aadhar || followUp.candidate_says || "Candidate",
      fatherName: "",
      department: followUp.department || "",
      designation: followUp.designation || "",
      workLocation: followUp.presentAddress || followUp.present_address || "Office",
      joiningDate: followUp.next_call_date || new Date().toISOString().split("T")[0],
      salary: followUp.salary || 0,
      mobileNumber: followUp.mobile_number || followUp.mobileNumber || "",
      email: followUp.email || followUp.personalEmail || "",
      companyName: followUp.company_name || "",
      grossSalary: followUp.salary || 0,
      reportingTo: followUp.reporting_to || "HR Manager",
      placeOfPosting: followUp.presentAddress || followUp.present_address || "Raipur",
      effectiveDate: followUp.next_call_date || new Date().toISOString().split("T")[0],
    }));
    setCurrentStep(2);
  };

  // NEW: Select from pending confirmation candidates
  const selectPendingConfirmationCandidate = (candidate) => {
    console.log("Selected candidate:", candidate);
    setFormData((prev) => ({
      ...prev,
      joiningId: candidate.follow_up_id,
      enquiryNumber: candidate.enquiry_number,
      employeeName: candidate.employee_name,
      department: candidate.department,
      designation: candidate.designation,
      companyName: candidate.company_name || candidate.employee_name,
      workLocation: candidate.work_location || "Office",
      joiningDate: candidate.joining_date || new Date().toISOString().split("T")[0],
      salary: candidate.salary || 0,
      mobileNumber: candidate.mobile_number || "",
      email: candidate.email || "",
      grossSalary: candidate.salary || 0,
      effectiveDate: new Date().toISOString().split("T")[0],
    }));
    setCurrentStep(2);
  };

  const saveOffer = async (status = "Draft", emailToSend = null) => {
    setLoading(true);
    try {
      const payload = {
        follow_up_id: formData.joiningId,
        enquiry_number: formData.enquiryNumber,
        employee_name: formData.employeeName,
        department: formData.department,
        designation: formData.designation,
        salary: formData.grossSalary,
        offer_date: formData.offerDate,
        joining_date: formData.joiningDate,
        work_location: formData.placeOfPosting,
        probation_period: formData.probationPeriod,
        probation_end_date: formData.probationEndDate,
        reporting_manager: formData.reportingTo,
        notice_period: formData.noticePeriod,
        working_hours: formData.workingHours,
        leave_policy: formData.leavePolicy,
        status: status,
        confirmation_sent: false,
        email: formData.email,
        mobile_number: formData.mobileNumber,
      };

      // Add email fields only if sending
      if (emailToSend) {
        payload.sent_email = emailToSend;
        payload.sent_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("offer_letters")
        .insert([payload])
        .select();

      if (error) throw error;

      return data?.[0]; // Return the saved record
    } catch (err) {
      console.error("Error saving offer:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndSend = async () => {
    setShowSendOfferModal(true);
    setSendOfferEmail(formData.email || ""); // Auto-fill email
  };

  const handleGenerateAndSendConfirmation = async () => {
    setConfirmationTarget(formData);
    setConfirmationEmailAddress(formData.email || "");
    setShowSendConfirmationModal(true);
  };

  const downloadConfirmationPreviewAsPDF = async () => {
    const page = document.getElementById("confirmation-page");
    if (!page) {
      toast.error("Confirmation preview page not found");
      return;
    }

    toast.loading("Generating PDF...", { id: "pdf-gen" });

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const canvas = await html2canvas(page, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

      pdf.save(
        `Confirmation_Letter_${formData.employeeName || "Employee"}.pdf`
      );

      toast.success("Confirmation PDF downloaded successfully!", {
        id: "pdf-gen",
      });
    } catch (error) {
      console.error("Error generating Confirmation PDF:", error);
      toast.error("Failed to generate Confirmation PDF", {
        id: "pdf-gen",
      });
    }
  };

  const processSendWithPDF = async () => {
    if (!sendOfferEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSendingOffer(true);
    toast.loading("Generating PDF and sending email...", { id: "offer-send" });

    try {
      // Step 1: Generate PDF from preview
      const page1 = document.getElementById("offer-page-1");
      const page2 = document.getElementById("offer-page-2");

      if (!page1 || !page2) {
        throw new Error("Preview pages not found");
      }

      const canvas1 = await html2canvas(page1, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });
      const canvas2 = await html2canvas(page2, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Page 1
      const imgData1 = canvas1.toDataURL("image/png");
      pdf.addImage(imgData1, "PNG", 0, 0, 210, 297);

      // Page 2
      pdf.addPage();
      const imgData2 = canvas2.toDataURL("image/png");
      pdf.addImage(imgData2, "PNG", 0, 0, 210, 297);

      // Step 2: Save to database first
      toast.loading("Saving offer letter to database...", { id: "offer-send" });
      const savedOffer = await saveOffer("Sent", sendOfferEmail);

      if (!savedOffer) throw new Error("Failed to save offer");

      // Step 3: Generate PDF blob for email
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], `Offer_Letter_${formData.employeeName}.pdf`, { type: "application/pdf" });

      // Step 4: Upload PDF to storage (optional)
      let pdfUrl = null;
      try {
        // const fileName = `offer_${savedOffer.id}_${Date.now()}.pdf`;
        const fileName =
          `OfferLetter_${savedOffer.id}_${formData.employeeName}.pdf`;
        // pdfUrl = await uploadPDFToStorage(pdfBlob, fileName);
        pdfUrl = await uploadPDFToStorage(
          pdfBlob,
          fileName,
          "offer"
        );

        // Update offer with PDF URL
        if (pdfUrl) {
          await supabase
            .from("offer_letters")
            .update({
              pdf_generated: true,
              pdf_url: pdfUrl
            })
            .eq("id", savedOffer.id);
        }
      } catch (storageError) {
        console.warn("Storage upload failed, continuing without PDF URL:", storageError);
      }

      // Step 5: Send email using EmailJS
      toast.loading("Sending email to candidate...", { id: "offer-send" });

      const empName = formData.employeeName;
      const company = formData.companyName;
      const designation = formData.designation;
      const joiningDate = formData.joiningDate || new Date().toISOString().split("T")[0];
      const dept = formData.department;
      const loc = formData.placeOfPosting;

      const offerText = `Dear ${empName},

Congratulations!

We are pleased to offer you the position of ${designation} at ${company}. The terms and conditions governing this offer are detailed below.

A. EMPLOYMENT DETAILS
- Designation: ${designation}
- Date of Joining: ${joiningDate}
- Department: ${dept}
- Reporting To: ${formData.reportingTo || "-"}
- Place of Posting: ${loc}

B. PROBATION PERIOD
You will be on a probation period of ${formData.probationPeriod || "6 Months"} from your date of joining.

C. TERMS & CONDITIONS
1. You will be designated as ${designation}.
2. Your date of commencement of employment is ${joiningDate}.
3. A notice period of ${formData.noticePeriod || "30 Days"} will be applicable from either side upon separation from the company.
4. No leave will be permitted during due dates or critical reporting periods, unless specifically approved by management.

Sincerely,
For ${company}
Authorised Signatory`;

      const emailResult = await sendEmailViaEmailJS({
        toEmail: sendOfferEmail,
        toName: empName,
        subject: `Offer Letter - ${company}`,
        companyName: company,
        letterType: "Offer Letter",
        messageText: offerText,
        pdfUrl: pdfUrl || "",
        departmentName: dept,
        portalName: "RBP HRMS System",
      });

      console.log("Email sent successfully:", emailResult);

      // Step 6: Download PDF locally
      // pdf.save(`Offer_Letter_${formData.employeeName}.pdf`);

      toast.success(`Offer letter sent successfully to ${sendOfferEmail}!`, { id: "offer-send" });

      // Close modal and reset
      setShowSendOfferModal(false);
      setSendOfferEmail("");
      setCurrentView("list");

      // Refresh data
      fetchOffers();
      fetchPendingConfirmationCandidates();

    } catch (err) {
      console.error("Error in process:", err);
      toast.error("Failed to send offer letter: " + err.message, { id: "offer-send" });
    } finally {
      setSendingOffer(false);
    }
  };

  // Confirmation Letter PDF Generation
  const generateConfirmationPDF = (data) => {
    const doc = new jsPDF();
    const letterData = data || formData;
    const currentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    // Company Header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 210, 50, "F");

    doc.setTextColor(33, 33, 33);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RBP ENERGY INDIA PVT LTD", 105, 20, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Corporate Office: G-01, Ground Floor, Plot No. 7,", 105, 30, { align: "center" });
    doc.text("Village- Churiyari, District- Raipur, Chhattisgarh - 493890", 105, 37, { align: "center" });
    doc.text("Phone: +91 9981999444 | Email: careers@rbpenergy.com | CIN: U40107CT2024PTC016622", 105, 44, { align: "center" });

    doc.setDrawColor(220, 53, 69);
    doc.setLineWidth(1.5);
    doc.line(20, 50, 190, 50);

    doc.setTextColor(33, 33, 33);
    doc.setFontSize(10);
    doc.text(`Date: ${currentDate}`, 150, 60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Subject: Confirmation of Employment", 20, 75);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Dear ${letterData.employee_name || letterData.employeeName},`, 20, 87);

    const effectiveDate = letterData.effective_date || letterData.effectiveDate || new Date().toLocaleDateString();

    const confirmationText = `We are pleased to inform you that you have successfully completed your probation period, effective from ${effectiveDate}. Based on your performance, behavior, and contribution to the organization, we are happy to confirm your appointment as a ${letterData.designation} at RBP Energy India Pvt Ltd.

You are now a permanent employee of the organization and will be entitled to all benefits as per the company's policies applicable to confirmed employees, including:

• Provident Fund (PF) as per statutory norms
• Employee State Insurance (ESI) where applicable
• Gratuity as per Payment of Gratuity Act
• Medical Insurance coverage
• Performance-linked incentives as per company policy

We value your hard work and commitment. We trust that you will continue to perform your duties with the same level of dedication and professionalism, contributing to the growth and success of the organization.

Wishing you a successful career with us.`;

    const splitText = doc.splitTextToSize(confirmationText, 170);
    doc.text(splitText, 20, 100);

    const finalY = 100 + splitText.length * 6 + 20;

    doc.text("Sincerely,", 20, finalY);
    doc.text("For RBP Energy India Pvt Ltd", 20, finalY + 10);
    doc.text("Authorized Signatory", 20, finalY + 20);
    doc.text("(Seal)", 20, finalY + 28);

    // doc.save(`Confirmation_Letter_${letterData.employee_name || letterData.employeeName}_${currentDate}.pdf`);
  };

  // Helper: Status Color
  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-600";
      case "Sent":
        return "bg-blue-100 text-blue-600";
      case "Accepted":
        return "bg-green-100 text-green-600";
      case "Rejected":
        return "bg-red-100 text-red-600";
      case "Pending":
        return "bg-yellow-100 text-yellow-600";
      case "Pending Confirmation":
        return "bg-orange-100 text-orange-600";
      case "Confirmed":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Clear Filters
  const clearFilters = () => {
    setFilters({
      search: "",
      department: "",
      status: "",
      dateRange: "",
    });
    toast.success("Filters cleared!");
  };

  // Filtered offers based on active tab
  const getFilteredOffers = () => {
    let filtered = [...offers];

    if (activeTab === "pending") {
      filtered = filtered.filter(o => o.status === "Pending" || o.status === "Draft");
    } else if (activeTab === "pendingConfirmation") {
      filtered = filtered.filter(o => o.status === "Sent" && !o.confirmation_sent);
    } else if (activeTab === "history") {
      filtered = filtered.filter(o => o.confirmation_sent === true || o.status === "Accepted");
    }

    if (filters.search) {
      filtered = filtered.filter(o =>
        o.employee_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        o.department?.toLowerCase().includes(filters.search.toLowerCase()) ||
        o.designation?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.department) {
      filtered = filtered.filter(o => o.department === filters.department);
    }

    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }

    return filtered;
  };

  const filteredOffers = getFilteredOffers();

  // NEW: Get pending confirmation candidates for Create Confirmation Letter
  const getPendingConfirmationForCreate = () => {
    if (activeTab === "pendingConfirmation") {
      return pendingConfirmationCandidates;
    }
    return [];
  };

  const handleSendEmail = async () => {
    if (!emailAddress) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setEmailSending(true);
    try {
      // Construct Offer Letter Text
      const empName = emailTargetOffer.employee_name || emailTargetOffer.employeeName || "Candidate";
      const company = emailTargetOffer.companyName || emailTargetOffer.company_name || "RBP Energy India Pvt Ltd";
      const designation = emailTargetOffer.designation;
      const joiningDate = emailTargetOffer.joining_date || emailTargetOffer.next_call_date || new Date().toISOString().split("T")[0];
      const dept = emailTargetOffer.department;
      const loc = emailTargetOffer.work_location || emailTargetOffer.presentAddress || "Raipur";

      const offerText = `Dear ${empName},

Congratulations!

We are pleased to offer you the position of ${designation} at ${company}. The terms and conditions governing this offer are detailed below.

A. EMPLOYMENT DETAILS
- Designation: ${designation}
- Date of Joining: ${joiningDate}
- Department: ${dept}
- Place of Posting: ${loc}

B. PROBATION PERIOD
You will be on a probation period of 6 Months from your date of joining.

C. TERMS & CONDITIONS
1. You will be designated as ${designation}.
2. Your date of commencement of employment is ${joiningDate}.
3. A notice period of 30 Days will be applicable from either side upon separation from the company.
4. No leave will be permitted during due dates or critical reporting periods, unless specifically approved by management.

Sincerely,
For ${company}
Authorised Signatory`;

      // Send email via EmailJS
      await sendEmailViaEmailJS({
        toEmail: emailAddress,
        toName: empName,
        subject: `Offer Letter - ${company}`,
        companyName: company,
        letterType: "Letter of Offer",
        messageText: offerText,
        pdfUrl: emailTargetOffer.pdf_url || "",
        departmentName: "Human Resources",
        portalName: "RBP HRMS System",
      });

      console.log("Email sent successfully", sendEmailViaEmailJS);

      // Generate PDF first
      downloadPreviewAsPDF();

      const isExistingOffer = emailTargetOffer.offer_date && emailTargetOffer.offer_date !== "Not Generated";

      if (isExistingOffer) {
        const { error } = await supabase
          .from("offer_letters")
          .update({ status: "Sent", email: emailAddress })
          .eq("id", emailTargetOffer.id);

        if (error) {
          const { error: error2 } = await supabase
            .from("offer_letters")
            .update({ status: "Sent" })
            .eq("id", emailTargetOffer.id);
          if (error2) throw error2;
        }
      } else {
        const payload = {
          follow_up_id: emailTargetOffer.follow_up_id || emailTargetOffer.id,
          enquiry_number: emailTargetOffer.enquiry_number,
          employee_name: emailTargetOffer.employee_name,
          department: emailTargetOffer.department,
          designation: emailTargetOffer.designation,
          salary: emailTargetOffer.salary || 0,
          joining_date: emailTargetOffer.joining_date || emailTargetOffer.next_call_date || new Date().toISOString().split("T")[0],
          work_location: emailTargetOffer.presentAddress || "Office",
          probation_period: "6 Months",
          reporting_manager: "HR Manager",
          notice_period: "30 Days",
          working_hours: "9 Hours",
          leave_policy: "12 CL per annum",
          offer_date: new Date().toISOString().split("T")[0],
          status: "Sent",
          confirmation_sent: false,
          salary_structure: {
            basic: ((emailTargetOffer.salary || 0) * 0.5).toFixed(2),
            hra: ((emailTargetOffer.salary || 0) * 0.2).toFixed(2),
            special: ((emailTargetOffer.salary || 0) * 0.3).toFixed(2),
            pf: "0.00",
            esic: "0.00",
            net: (emailTargetOffer.salary || 0).toFixed(2),
          },
          terms_conditions: "Standard Company Terms & Conditions apply..."
        };

        const { error } = await supabase.from("offer_letters").insert([{ ...payload, email: emailAddress }]);
        if (error) {
          const { error: error2 } = await supabase.from("offer_letters").insert([payload]);
          if (error2) throw error2;
        }
      }

      toast.success(`Offer letter sent successfully to ${emailAddress}!`);
      setShowSendEmailModal(false);
      setEmailTargetOffer(null);
      setEmailAddress("");
      fetchOffers();
      fetchPendingConfirmationCandidates();
    } catch (err) {
      console.error("Error sending email:", err);
      toast.error(`Failed to update offer letter: ${err.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  const handleSendConfirmation = async () => {
    if (!confirmationEmailAddress) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setConfirmationEmailSending(true);
    const loadingToastId = toast.loading("Generating confirmation letter PDF and sending email...");
    try {
      // Construct Confirmation Letter Text
      const empName = confirmationTarget.employee_name || confirmationTarget.employeeName || "Employee";
      const company = confirmationTarget.company_name || confirmationTarget.companyName || "RBP Energy India Pvt Ltd";
      const designation = confirmationTarget.designation;
      const effectiveDate = confirmationTarget.effective_date || confirmationTarget.effectiveDate || new Date().toLocaleDateString();

      const confirmationText = `Dear ${empName},

Subject: Confirmation of Employment

We are pleased to inform you that you have successfully completed your probation period, effective from ${effectiveDate}. Based on your performance, behavior, and contribution to the organization, we are happy to confirm your appointment as a ${designation} at ${company}.

You are now a permanent employee of the organization and will be entitled to all benefits as per the company's policies applicable to confirmed employees, including:
- Provident Fund (PF) as per statutory norms
- Employee State Insurance (ESI) where applicable
- Gratuity as per Payment of Gratuity Act
- Medical Insurance coverage
- Performance-linked incentives as per company policy

We value your hard work and commitment. We trust that you will continue to perform your duties with the same level of dedication and professionalism, contributing to the growth and success of the organization.

Wishing you a successful career with us.

Sincerely,
For ${company}
Authorized Signatory`;

      const targetFollowUpId = confirmationTarget.follow_up_id || confirmationTarget.joiningId;

      // Check if confirmation letter already exists
      const { data: existing } = await supabase
        .from("confirmation_letters")
        .select("*")
        .eq("follow_up_id", targetFollowUpId)
        .maybeSingle();

      let pdfUrl = existing?.pdf_url;
      if (!pdfUrl) {
        pdfUrl = await uploadConfirmationPDF(confirmationTarget);
      }

      if (!pdfUrl) {
        throw new Error("Failed to generate and upload PDF.");
      }

      // Send email via EmailJS
      await sendEmailViaEmailJS({
        toEmail: confirmationEmailAddress,
        toName: empName,
        subject: `Confirmation of Employment - ${company}`,
        companyName: company,
        letterType: "Confirmation of Employment",
        messageText: confirmationText,
        pdfUrl: pdfUrl || "",
        departmentName: confirmationTarget.department || "Human Resources",
        portalName: "RBP HRMS System",
      });

      // Generate confirmation letter in database
      const payload = {
        follow_up_id: targetFollowUpId,
        enquiry_number: confirmationTarget.enquiry_number || confirmationTarget.enquiryNumber,
        employee_name: empName,
        department: confirmationTarget.department,
        designation: designation,
        confirmation_date: new Date().toISOString().split("T")[0],
        effective_date: effectiveDate,
        status: "Sent",
        sent_email: confirmationEmailAddress,
        sent_date: new Date().toISOString(),
        pdf_url: pdfUrl,
      };

      if (existing) {
        const { error } = await supabase
          .from("confirmation_letters")
          .update({
            status: "Sent",
            sent_email: confirmationEmailAddress,
            sent_date: new Date().toISOString(),
            pdf_url: pdfUrl,
          })
          .eq("follow_up_id", targetFollowUpId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("confirmation_letters").insert([payload]);
        if (error) throw error;
      }

      // Update offer letter to mark confirmation as sent
      const { error: updateError } = await supabase
        .from("offer_letters")
        .update({ confirmation_sent: true, confirmation_date: new Date().toISOString().split("T")[0] })
        .eq("follow_up_id", targetFollowUpId);

      if (updateError) console.error("Error updating offer:", updateError);

      toast.success(`Confirmation letter sent successfully to ${confirmationEmailAddress}!`, { id: loadingToastId });
      setShowSendConfirmationModal(false);
      setConfirmationTarget(null);
      setConfirmationEmailAddress("");
      fetchOffers();
      fetchConfirmationLetters();
      fetchPendingConfirmationCandidates();
      setCurrentView("list");
    } catch (err) {
      console.error("Error sending confirmation letter:", err);
      toast.error(`Failed to send confirmation letter: ${err.message}`, { id: loadingToastId });
    } finally {
      setConfirmationEmailSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentView === "list" && (
          <ListView
            stats={stats}
            filters={filters}
            setFilters={setFilters}
            clearFilters={clearFilters}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filteredOffers={filteredOffers}
            tableLoading={tableLoading}
            getStatusColor={getStatusColor}
            setIsConfirmationMode={setIsConfirmationMode}
            setCurrentView={setCurrentView}
            setCurrentStep={setCurrentStep}
            confirmationLettersCount={confirmationLetters.length}
            confirmationLetters={confirmationLetters}
            departmentOptions={departmentOptions}
            onSendOfferEmail={(offer) => {
              setIsConfirmationMode(false);
              setCurrentView("create");
              selectEmployee(offer);
            }}
            onSendConfirmationEmail={(offer) => {
              setIsConfirmationMode(true);
              setCurrentView("create");
              selectPendingConfirmationCandidate(offer);
            }}
          />
        )}
        {currentView === "create" && (
          <CreateView
            isConfirmationMode={isConfirmationMode}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            setCurrentView={setCurrentView}
            setIsConfirmationMode={setIsConfirmationMode}
            formData={formData}
            handleInputChange={handleInputChange}
            selectionSearch={selectionSearch}
            setSelectionSearch={setSelectionSearch}
            pendingForCreate={getPendingConfirmationForCreate()}
            selectPendingConfirmationCandidate={selectPendingConfirmationCandidate}
            joiningHistory={joiningHistory}
            selectEmployee={selectEmployee}
            downloadPreviewAsPDF={downloadPreviewAsPDF}
            downloadConfirmationPreviewAsPDF={downloadConfirmationPreviewAsPDF}
            handleGenerateAndSend={handleGenerateAndSend}
            handleGenerateAndSendConfirmation={handleGenerateAndSendConfirmation}
          />
        )}
      </div>

      {/* Send Email Modal for Offer Letter */}
      {showSendEmailModal && emailTargetOffer && (
        <SendEmailModal
          emailTargetOffer={emailTargetOffer}
          emailAddress={emailAddress}
          setEmailAddress={setEmailAddress}
          emailSending={emailSending}
          onClose={() => {
            setShowSendEmailModal(false);
            setEmailTargetOffer(null);
            setEmailAddress("");
          }}
          onSend={handleSendEmail}
        />
      )}

      {/* Send Confirmation Letter Modal */}
      {showSendConfirmationModal && confirmationTarget && (
        <SendConfirmationModal
          confirmationTarget={confirmationTarget}
          confirmationEmailAddress={confirmationEmailAddress}
          setConfirmationEmailAddress={setConfirmationEmailAddress}
          confirmationEmailSending={confirmationEmailSending}
          onClose={() => {
            setShowSendConfirmationModal(false);
            setConfirmationTarget(null);
            setConfirmationEmailAddress("");
          }}
          onSend={handleSendConfirmation}
        />
      )}

      {/* Send Offer Letter Email Modal */}
      {showSendOfferModal && (
        <SendOfferModal
          formData={formData}
          sendOfferEmail={sendOfferEmail}
          setSendOfferEmail={setSendOfferEmail}
          sendingOffer={sendingOffer}
          onClose={() => {
            setShowSendOfferModal(false);
            setSendOfferEmail("");
          }}
          onSend={processSendWithPDF}
        />
      )}
    </div>
  );
};

export default OfferLetter;