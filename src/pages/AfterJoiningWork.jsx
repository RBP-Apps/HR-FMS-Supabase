import React, { useState, useEffect } from "react";
import { Filter, Search, Clock, CheckCircle, X } from "lucide-react";
import useDataStore from "../store/dataStore";
import toast from "react-hot-toast";

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

  // Google Drive folder ID for storing images
  const DRIVE_FOLDER_ID = "1JdzCqR_yEkUE3dfTVcc3oVi7SoPk2Dy7";

  const fetchJoiningData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=JOINING&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch data from JOINING sheet"
        );
      }

      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      const headers = rawData[5];
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];

      const getIndex = (headerName) => {
        const index = headers.findIndex(
          (h) =>
            h && h.toString().trim().toLowerCase() === headerName.toLowerCase()
        );
        return index;
      };

      const processedData = dataRows.map((row) => ({
        timestamp: row[getIndex("Timestamp")] || "",
        joiningNo: row[getIndex("RBP-Joining ID")] || "",
        indentNo: row[getIndex("Indent No")] || "",
        enquiryNo: row[getIndex("Enquiry No")] || "",
        candidateName: row[getIndex("Name As Per Aadhar")] || "",
        fatherName: row[getIndex("Father Name")] || "",
        dateOfJoining: row[getIndex("Date Of Joining")] || "",
        joiningPlace: row[getIndex("Joining Place")] || "",
        designation: row[getIndex("Designation")] || "",
        salary: row[getIndex("Department")] || "",
        aadharPhoto: row[getIndex("Aadhar Frontside Photo")] || "",
        panCard: row[getIndex("Pan card")] || "",
        candidatePhoto: row[getIndex("Candidate's Photo")] || "",
        currentAddress: row[getIndex("Current Address")] || "",
        addressAsPerAadhar: row[getIndex("Address As Per Aadhar Card")] || "",
        bodAsPerAadhar: row[getIndex("Date Of Birth As Per Aadhar Card")] || "",
        gender: row[getIndex("Gender")] || "",
        mobileNo: row[getIndex("Mobile No.")] || "",
        familyMobileNo: row[getIndex("Family Mobile No.")] || "",
        relationWithFamily:
          row[getIndex("Relationship With Family Person")] || "",
        pfId: row[getIndex("Past Pf Id No. (If Any)")] || "",
        accountNo: row[getIndex("Current Bank A.C No.")] || "",
        ifscCode: row[getIndex("Ifsc Code")] || "",
        branchName: row[getIndex("Branch Name")] || "",
        passbookPhoto: row[getIndex("Photo Of Front Bank Passbook")] || "",
        email: row[getIndex("Personal Email-Id")] || "",
        esicNo: row[getIndex("ESIC No (IF Any)")] || "",
        qualification: row[getIndex("Highest Qualification")] || "",
        pfEligible: row[getIndex("PF Eligible")] || "",
        esicEligible: row[getIndex("ESIC Eligible")] || "",
        companyName: row[getIndex("Joining Company Name")] || "",
        emailToBeIssue: row[getIndex("Email ID To Be Issue")] || "",
        issueMobile: row[getIndex("Issue Mobile")] || "",
        issueLaptop: row[getIndex("Issue Laptop")] || "",
        aadharNo: row[getIndex("Aadhar Card No")] || "",
        modeOfAttendance: row[getIndex("Mode Of Attendance")] || "",
        quaficationPhoto: row[getIndex("Quafication Photo")] || "",
        paymentMode: row[getIndex("Payment Mode")] || "",
        salarySlip: row[getIndex("Salary Slip")] || "",
        resumeCopy: row[getIndex("Resume Copy")] || "",
        plannedDate: row[getIndex("Planned Date")] || "",
        actual: row[getIndex("Actual")] || "",
        pdcCheckbox: row[52]?.toString().trim() === "YES" ? "YES" : "-",
      }));

      const pendingTasks = processedData.filter(
        (task) => task.plannedDate && !task.actual
      );
      setPendingData(pendingTasks);

      const historyTasks = processedData.filter(
        (task) => task.plannedDate && task.actual
      );
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

  // Fetch previous assets data from Assets sheet
  const fetchAssetsData = async (employeeId) => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=Assets&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        return null;
      }

      const data = result.data || result;
      if (!Array.isArray(data) || data.length < 2) {
        return null;
      }

      // Find the row with matching employee ID (column B, index 1)
      const matchingRow = data.find((row, index) => {
        if (index === 0) return false; // Skip header row
        return row[1]?.toString().trim() === employeeId?.toString().trim();
      });

      if (matchingRow) {
        return {
          punchCode: matchingRow[10] || "", // Column K (index 10)
          emailId: matchingRow[3] || "",
          emailPassword: matchingRow[4] || "",
          laptop: matchingRow[5] || "",
          mobile: matchingRow[6] || "",
          vehicle: matchingRow[7] || "",
          other: matchingRow[8] || "",
          manualImageUrl: matchingRow[9] || "",
          // punchCode: matchingRow[10] || "", // Column K (index 10)
          pfNumber: matchingRow[11] || "",
          esicNumber: matchingRow[12] || "",
          pdcFileUrl: matchingRow[13] || "", // Column N (index 13)
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching assets data:", error);
      return null;
    }
  };

  // Upload image to Google Drive
  const uploadImageToDrive = async (file, fileName) => {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result;
            const response = await fetch(
              "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                  action: "uploadFile",
                  base64Data: base64Data,
                  fileName: fileName,
                  mimeType: file.type,
                  folderId: DRIVE_FOLDER_ID,
                }).toString(),
              }
            );

            const result = await response.json();
            if (result.success) {
              resolve(result.fileUrl);
            } else {
              reject(new Error(result.error || "Upload failed"));
            }
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
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
      punchCode: "", // Initialize punch code
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
      // Fetch previous assets data first
      const assetsData = await fetchAssetsData(item.joiningNo);

      const fullDataResponse = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=JOINING&action=fetch"
      );

      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;

      // Look for header row with "RBP-Joining ID" instead of "Employee ID"
      let headerRowIndex = allData.findIndex((row) =>
        row.some((cell) =>
          cell?.toString().trim().toLowerCase().includes("rbp-joining id")
        )
      );
      if (headerRowIndex === -1) headerRowIndex = 5;

      const headers = allData[headerRowIndex].map((h) => h?.toString().trim());

      // Use "RBP-Joining ID" instead of "Employee ID"
      const employeeIdIndex = headers.findIndex(
        (h) => h?.toLowerCase() === "rbp-joining id"
      );
      if (employeeIdIndex === -1) {
        throw new Error("Could not find 'RBP-Joining ID' column");
      }

      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > headerRowIndex &&
          row[employeeIdIndex]?.toString().trim() ===
          item.joiningNo?.toString().trim()
      );

      if (rowIndex === -1)
        throw new Error(`Employee ${item.joiningNo} not found`);

      // Updated column indices
      const actualColumnIndex = 40; // Column AB (0-based index: 27)
      const startColumnIndex = 42; // Column AD (0-based index: 29)

      const currentValues = {
        checkSalarySlipResume:
          allData[rowIndex][startColumnIndex] // Column AD
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        offerLetterReceived:
          allData[rowIndex][startColumnIndex + 1] // Column AE
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        welcomeMeeting:
          allData[rowIndex][startColumnIndex + 2] // Column AF
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        biometricAccess:
          allData[rowIndex][startColumnIndex + 3] // Column AG
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        officialEmailId:
          allData[rowIndex][startColumnIndex + 4] // Column AH
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        assignAssets:
          allData[rowIndex][startColumnIndex + 5] // Column AI
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        pfEsic:
          allData[rowIndex][startColumnIndex + 6] // Column AJ
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        companyDirectory:
          allData[rowIndex][startColumnIndex + 7] // Column AK
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
        pdoCheckbox:
          allData[rowIndex][52] // Column BA (0-based index: 52)
            ?.toString()
            .trim()
            .toLowerCase() === "yes",
      };

      // Merge with assets data if available
      const finalFormData = {
        ...currentValues,
        punchCode: assetsData?.punchCode || "", // Add punch code
        emailId: assetsData?.emailId || "",
        emailPassword: assetsData?.emailPassword || "",
        laptop: assetsData?.laptop || "",
        mobile: assetsData?.mobile || "",
        vehicle: assetsData?.vehicle || "",
        other: assetsData?.other || "",
        manualImageUrl: assetsData?.manualImageUrl || "",
        pfNumber: assetsData?.pfNumber || "",
        esicNumber: assetsData?.esicNumber || "",
        pdcFileUrl: assetsData?.pdcFileUrl || "",
        manualImage: null,
        pdcFile: null,
        assets: [],
      };

      setFormData((prev) => ({
        ...prev,
        ...finalFormData,
      }));
    } catch (error) {
      console.error("Error fetching current values:", error);
      // Keep the default reset values if there's an error
      toast.error("Failed to load current values");
    } finally {
      setLoading(false);
    }
  };

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
      const now = new Date();
      const timestamp = `${now.getDate().toString().padStart(2, "0")}/${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${now.getFullYear()} ${now
          .getHours()
          .toString()
          .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now
            .getSeconds()
            .toString()
            .padStart(2, "0")}`;

      const rowData = [
        timestamp,
        employeeId,
        employeeName,
        assetsData.emailId || "",
        assetsData.emailPassword || "",
        assetsData.laptop || "", // Changed from image URL to text input
        assetsData.mobile || "", // Changed from image URL to text input
        assetsData.vehicle || "", // Changed from image URL to text input
        assetsData.other || "", // Changed from image URL to text input
        assetsData.manualImageUrl || "",
        assetsData.punchCode || "", // Add punch code to column K
        assetsData.pfNumber || "",
        assetsData.esicNumber || "",
        assetsData.pdcFileUrl || "", // Column N
      ];

      // First, check if record exists
      const existingData = await fetchAssetsData(employeeId);

      if (existingData) {
        // Update existing record - find the row and update it
        const fetchResponse = await fetch(
          "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=Assets&action=fetch"
        );
        const result = await fetchResponse.json();
        const data = result.data || result;

        const rowIndex = data.findIndex((row, index) => {
          if (index === 0) return false; // Skip header
          return row[1]?.toString().trim() === employeeId?.toString().trim();
        });

        if (rowIndex !== -1) {
          // Update existing row
          const response = await fetch(
            "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                sheetName: "Assets",
                action: "update",
                rowIndex: (rowIndex + 1).toString(),
                rowData: JSON.stringify(rowData),
              }).toString(),
            }
          );
          return await response.json();
        }
      }

      // Insert new record
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "Assets",
            action: "insert",
            rowData: JSON.stringify(rowData),
          }).toString(),
        }
      );

      return await response.json();
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
      // Upload manual image if new file selected (only for company directory)
      let manualImageUrl = formData.manualImageUrl;
      if (formData.manualImage) {
        try {
          manualImageUrl = await uploadImageToDrive(
            formData.manualImage,
            `${selectedItem.joiningNo
            }_manual_${Date.now()}.${formData.manualImage.name
              .split(".")
              .pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload manual image: ${error.message}`);
        }
      }

      // Upload PDC File if selected and checkbox is checked
      let finalPdcFileUrl = formData.pdcFileUrl;
      if (formData.pdoCheckbox && formData.pdcFile) {
        try {
          finalPdcFileUrl = await uploadImageToDrive(
            formData.pdcFile,
            `${selectedItem.joiningNo
            }_pdc_${Date.now()}.${formData.pdcFile.name
              .split(".")
              .pop()}`
          );
        } catch (error) {
          toast.error(`Failed to upload PDC file: ${error.message}`);
        }
      }

      // Save assets data (now with text inputs instead of images)
      await saveAssetsData(selectedItem.joiningNo, selectedItem.candidateName, {
        emailId: formData.emailId,
        emailPassword: formData.emailPassword,
        laptop: formData.laptop,
        mobile: formData.mobile,
        vehicle: formData.vehicle,
        other: formData.other,
        manualImageUrl: manualImageUrl,
        punchCode: formData.punchCode, // Include punch code
        pfNumber: formData.pfNumber, // ADD THIS
        esicNumber: formData.esicNumber, // ADD THIS
        pdcFileUrl: formData.pdoCheckbox ? finalPdcFileUrl : "", // Clear URL if unchecked
      });

      // Continue with existing logic for updating JOINING sheet
      const fullDataResponse = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=JOINING&action=fetch"
      );

      if (!fullDataResponse.ok) {
        throw new Error(`HTTP error! status: ${fullDataResponse.status}`);
      }

      const fullDataResult = await fullDataResponse.json();
      const allData = fullDataResult.data || fullDataResult;
      let headerRowIndex = allData.findIndex((row) =>
        row.some((cell) =>
          cell?.toString().trim().toLowerCase().includes("rbp-joining id")
        )
      );
      if (headerRowIndex === -1) headerRowIndex = 5;

      const headers = allData[headerRowIndex].map((h) => h?.toString().trim());
      const employeeIdIndex = headers.findIndex(
        (h) => h?.toLowerCase() === "rbp-joining id"
      );
      if (employeeIdIndex === -1) {
        throw new Error("Could not find 'RBP-Joining ID' column");
      }

      const rowIndex = allData.findIndex(
        (row, idx) =>
          idx > headerRowIndex &&
          row[employeeIdIndex]?.toString().trim() ===
          selectedItem.joiningNo?.toString().trim()
      );
      if (rowIndex === -1)
        throw new Error(`Employee ${selectedItem.joiningNo} not found`);

      // Updated column indices
      const actualColumnIndex = 40; // Column AB (0-based index: 27)
      const startColumnIndex = 42; // Column AD (0-based index: 29)

      console.log("Found row index:", rowIndex);
      console.log("Header row index:", headerRowIndex);
      console.log("Actual row number for update:", rowIndex + 1);
      console.log("Start column index:", startColumnIndex);
      console.log("Form data values:", {
        checkSalarySlipResume: formData.checkSalarySlipResume,
        offerLetterReceived: formData.offerLetterReceived,
        welcomeMeeting: formData.welcomeMeeting,
        biometricAccess: formData.biometricAccess,
        officialEmailId: formData.officialEmailId,
        assignAssets: formData.assignAssets,
        pfEsic: formData.pfEsic,
        companyDirectory: formData.companyDirectory,
        pdoCheckbox: formData.pdoCheckbox,
      });

      const now = new Date();
      // Format for display: DD/MM/YYYY
      const formattedTimestamp = `${now.getDate()}/${now.getMonth() + 1
        }/${now.getFullYear()}`;

      // Format for Google Sheets as a proper date object (YYYY-MM-DD format)
      const formattedDateForSheets = `${now.getFullYear()}-${(
        now.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

      const allFieldsYes =
        formData.checkSalarySlipResume &&
        formData.offerLetterReceived &&
        formData.welcomeMeeting &&
        formData.biometricAccess &&
        formData.officialEmailId &&
        formData.assignAssets &&
        formData.pfEsic &&
        formData.companyDirectory;

      // Prepare batch updates array
      const updates = [];

      // Add Actual date update if all fields are Yes
      if (allFieldsYes) {
        updates.push({
          rowIndex: rowIndex + 1,
          columnIndex: actualColumnIndex + 1,
          value: formattedDateForSheets,
        });
      }

      // Add all checkbox field updates
      const fields = [
        { value: formData.checkSalarySlipResume ? "Yes" : "No", offset: 0 },
        { value: formData.offerLetterReceived ? "Yes" : "No", offset: 1 },
        { value: formData.welcomeMeeting ? "Yes" : "No", offset: 2 },
        { value: formData.biometricAccess ? "Yes" : "No", offset: 3 },
        { value: formData.officialEmailId ? "Yes" : "No", offset: 4 },
        { value: formData.assignAssets ? "Yes" : "No", offset: 5 },
        { value: formData.pfEsic ? "Yes" : "No", offset: 6 },
        { value: formData.companyDirectory ? "Yes" : "No", offset: 7 },
      ];

      fields.forEach((field) => {
        updates.push({
          rowIndex: rowIndex + 1,
          columnIndex: startColumnIndex + field.offset + 1,
          value: field.value,
        });
      });

      // Explicitly update Column BA (1-based index: 53)
      updates.push({
        rowIndex: rowIndex + 1,
        columnIndex: 53,
        value: formData.pdoCheckbox ? "YES" : "",
      });

      console.log(
        "Sending batch update with",
        updates.length,
        "updates:",
        updates
      );

      // Send single batch update request
      const batchResponse = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            sheetName: "JOINING",
            action: "batchUpdate",
            updates: JSON.stringify(updates),
          }).toString(),
        }
      );

      const batchResult = await batchResponse.json();
      console.log("Batch update result:", batchResult);

      if (!batchResult.success) {
        throw new Error("Batch update failed: " + batchResult.error);
      }

      if (allFieldsYes) {
        toast.success(
          "All conditions met! Data saved and actual date updated successfully."
        );
      } else {
        toast.success(
          "Data saved successfully. Actual date will be updated when all conditions are met."
        );
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white">
                <thead className="bg-gray-100">
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y   divide-white  ">
                <thead className="bg-gray-100  ">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Designation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Date Of Joining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium  text-gray-500 uppercase tracking-wider">
                      PDC
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y   divide-white  ">
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
                      <tr key={index} className="hover:bg-white hover: ">
                        <td className="px-6 py-4 whitespace-nowrap text-sm  text-gray-500">
                          {item.joiningNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm  text-gray-500">
                          {item.candidateName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm  text-gray-500">
                          {item.designation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDOB(item.dateOfJoining)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm  text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500 font-semibold  text-white">
                            Completed
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold  text-gray-700">
                          {item.pdcCheckbox === "YES" ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 font-semibold text-indigo-800">
                              YES
                            </span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredHistoryData.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className=" text-gray-500  ">
                    No after joining work history found.
                  </p>
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
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">
                          ESIC Number
                        </label>
                        <input
                          type="text"
                          name="esicNumber"
                          value={formData.esicNumber}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter ESIC number"
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  )}
                </div>

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
                          Aggrement
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="file"
                              id="manualImage"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(e, "manualImage")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor="manualImage"
                              className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                              </svg>
                              {formData.manualImage
                                ? "Change Manual"
                                : formData.manualImageUrl
                                  ? "Replace Manual"
                                  : "Aggrement Upload"}
                            </label>
                          </div>
                          {/* Show existing manual image if available */}
                          {formData.manualImageUrl && !formData.manualImage && (
                            <div className="mt-2">
                              <img
                                src={formData.manualImageUrl}
                                alt="Existing Manual"
                                className="h-32 w-full object-contain rounded border"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Current manual image
                              </p>
                            </div>
                          )}
                          {/* Show new selected manual image preview */}
                          {formData.manualImage && (
                            <div className="mt-2">
                              <img
                                src={URL.createObjectURL(formData.manualImage)}
                                alt="New Manual"
                                className="h-32 w-full object-contain rounded border"
                              />
                              <p className="text-xs text-green-600 mt-1">
                                New manual image selected
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

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
                      PDC
                    </label>
                  </div>

                  {formData.pdoCheckbox && (
                    <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-md">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-500">
                          PDC Upload
                        </label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="file"
                              id="pdcFile"
                              onChange={(e) =>
                                handleImageUpload(e, "pdcFile")
                              }
                              className="hidden"
                            />
                            <label
                              htmlFor="pdcFile"
                              className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                ></path>
                              </svg>
                              {formData.pdcFile
                                ? "Change PDC File"
                                : formData.pdcFileUrl
                                  ? "Replace PDC File"
                                  : "Upload PDC File"}
                            </label>
                          </div>
                          {formData.pdcFileUrl && !formData.pdcFile && (
                            <div className="mt-2">
                              <a href={formData.pdcFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">
                                View Current PDC File
                              </a>
                            </div>
                          )}
                          {formData.pdcFile && (
                            <div className="mt-2 text-sm text-green-600">
                              Selected file: {formData.pdcFile.name}
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
