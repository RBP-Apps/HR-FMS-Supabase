import supabase from "./supabase";

export const visibleColumnsPending = [
  'Indent No.', 'Candidate Enquiry No.', 'Applying For Post',
  'Department', 'Candidate Name', 'Phone', 'Email', 'Photo', 'Resume'
];

export const visibleColumnsHistory = [
  'Indent Number', 'Name', 'Father Name', 'Date of Joining', 'Designation',
  'Department', 'Salary', 'Mobile Number', 'Personal Email', 'Aadhar Address',
  'Current Address', 'Bank Account', 'IFSC Code', 'PF ID', 'ESIC No', 'Company PF',
  'Company ESIC', 'Attendance Type', 'Aadhar Front', 'Aadhar Back', 'PAN Card'
];

export const getCompletionStats = (rowData, visibleColumns, joiningRecord = null) => {
  const columnsToCheck = visibleColumns.filter(col =>
    col !== 'Action' && col !== 'Status'
  );

  const total = columnsToCheck.length;
  let filled = 0;

  columnsToCheck.forEach(column => {
    let value;
    switch (column) {
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

export const getProgressColor = (percent) => {
  if (percent < 40) return "bg-red-500";
  if (percent <= 70) return "bg-yellow-500";
  return "bg-green-500";
};

export const formatDate = (dateString) => {
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

export const formatDOB = (dateString) => {
  if (!dateString) return "";

  if (typeof dateString === "string" && dateString.includes("/")) {
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);

      if (day > 0 && day <= 31 && month > 0 && month <= 12) {
        if (day > 12) {
          return dateString;
        } else if (month > 12) {
          return `${parts[1]}/${parts[0]}/${parts[2]}`;
        }
      }
    }
  }

  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatDateForStorage = (dateString) => {
  if (!dateString) return "";

  if (typeof dateString === "string" && dateString.includes("/")) {
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);

      if (day > 0 && day <= 31 && month > 0 && month <= 12 && day > 12) {
        return `${parts[1]}/${parts[0]}/${parts[2]}`;
      }
    }
  }

  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return dateString;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

export const uploadFileToDrive = async (file, bucketName = "joining-documents") => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `joining/${fileName}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
