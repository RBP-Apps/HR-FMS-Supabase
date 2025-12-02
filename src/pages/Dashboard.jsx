import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
} from "recharts";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  UserPlus,
  TrendingUp,
  FileText,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const [totalEmployee, setTotalEmployee] = useState(0);
  const [activeEmployee, setActiveEmployee] = useState(0);
  const [leftEmployee, setLeftEmployee] = useState(0);
  const [leaveThisMonth, setLeaveThisMonth] = useState(0);
  const [monthlyHiringData, setMonthlyHiringData] = useState([]);
  const [designationData, setDesignationData] = useState([]);
  const [leaveStatusData, setLeaveStatusData] = useState([]);
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [indentTableData, setIndentTableData] = useState([]);
  const [enquiryTableData, setEnquiryTableData] = useState([]);
  const [joiningTableData, setJoiningTableData] = useState([]);
  const [enquiryTableDatajoining, setEnquiryTableDatajoining] = useState([]);
  const [indentSearchTerm, setIndentSearchTerm] = useState("");
  const [enquirySearchTerm, setEnquirySearchTerm] = useState("");
  const [joiningSearchTerm, setJoiningSearchTerm] = useState("");

  // Function to export data to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    // Get headers from the first object's keys
    const headers = Object.keys(data[0]);

    // Create CSV header row
    let csvContent = headers.join(",") + "\n";

    // Add data rows
    data.forEach((row) => {
      const values = headers.map((header) => {
        // Escape quotes and wrap in quotes to handle commas in data
        const value = row[header] !== undefined ? row[header] : "";
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += values.join(",") + "\n";
    });

    // Create a download link
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${filename}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse DD/MM/YYYY format date
  const parseSheetDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month, day);
  };

  // Fetch Leave Management Data for New Analytics
  const fetchLeaveManagementAnalytics = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=Leave%20Management&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch data from Leave Management sheet"
        );
      }

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      const headers = rawData[0];
      const dataRows = rawData.slice(1);

      const statusIndex = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase().includes("status")
      );
      const leaveTypeIndex = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase().includes("leave type")
      );

      const statusCounts = {};
      const typeCounts = {};

      dataRows.forEach((row) => {
        const status = row[statusIndex]?.toString().trim() || "Unknown";
        if (statusCounts[status]) {
          statusCounts[status] += 1;
        } else {
          statusCounts[status] = 1;
        }

        const leaveType = row[leaveTypeIndex]?.toString().trim() || "Unknown";
        if (typeCounts[leaveType]) {
          typeCounts[leaveType] += 1;
        } else {
          typeCounts[leaveType] = 1;
        }
      });

      const statusArray = Object.keys(statusCounts).map((key) => ({
        status: key,
        count: statusCounts[key],
      }));

      const typeArray = Object.keys(typeCounts).map((key) => ({
        type: key,
        count: typeCounts[key],
      }));

      setLeaveStatusData(statusArray);
      setLeaveTypeData(typeArray);
    } catch (error) {
      console.error("Error fetching leave management analytics:", error);
      setLeaveStatusData([]);
      setLeaveTypeData([]);
    }
  };

  const fetchJoiningCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec"
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

      const statusIndex = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase() === "status"
      );

      const dateOfJoiningIndex = headers.findIndex(
        (h) =>
          h && h.toString().trim().toLowerCase().includes("date of joining")
      );

      const designationIndex = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase() === "designation"
      );

      let activeCount = 0;
      const monthlyHiring = {};
      const designationCounts = {};

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentDate.getMonth() - i + 12) % 12;
        const monthYear = `${months[monthIndex]} ${currentDate.getFullYear()}`;
        monthlyHiring[monthYear] = { hired: 0 };
      }

      if (statusIndex !== -1) {
        activeCount = dataRows.filter(
          (row) =>
            row[statusIndex]?.toString().trim().toLowerCase() === "active"
        ).length;
      }

      if (dateOfJoiningIndex !== -1) {
        dataRows.forEach((row) => {
          const dateStr = row[dateOfJoiningIndex];
          if (dateStr) {
            const date = parseSheetDate(dateStr);
            if (date) {
              const monthYear = `${
                months[date.getMonth()]
              } ${date.getFullYear()}`;
              if (monthlyHiring[monthYear]) {
                monthlyHiring[monthYear].hired += 1;
              } else {
                monthlyHiring[monthYear] = { hired: 1 };
              }
            }
          }
        });
      }

      if (designationIndex !== -1) {
        dataRows.forEach((row) => {
          const designation = row[designationIndex]?.toString().trim();
          if (designation) {
            if (designationCounts[designation]) {
              designationCounts[designation] += 1;
            } else {
              designationCounts[designation] = 1;
            }
          }
        });

        const designationArray = Object.keys(designationCounts).map((key) => ({
          designation: key,
          employees: designationCounts[key],
        }));

        setDesignationData(designationArray);
      }

      setActiveEmployee(dataRows.length);

      return {
        total: dataRows.length,
        active: activeCount,
        monthlyHiring,
      };
    } catch (error) {
      console.error("Error fetching joining count:", error);
      return { total: 0, active: 0, monthlyHiring: {} };
    }
  };

  const fetchDepartmentData = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec"
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

      const departmentIndex = 20;

      const departmentCounts = {};

      dataRows.forEach((row) => {
        const department = row[departmentIndex]?.toString().trim();
        if (department) {
          if (departmentCounts[department]) {
            departmentCounts[department] += 1;
          } else {
            departmentCounts[department] = 1;
          }
        }
      });

      const departmentArray = Object.keys(departmentCounts).map((key) => ({
        department: key,
        employees: departmentCounts[key],
      }));

      return departmentArray;
    } catch (error) {
      console.error("Error fetching department data:", error);
      return [];
    }
  };

  const fetchLeaveCount = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=LEAVING&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch data from LEAVING sheet"
        );
      }

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      const headers = rawData[5];
      const dataRows = rawData.slice(6);

      let thisMonthCount = 0;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (dataRows.length > 0) {
        thisMonthCount = dataRows.filter((row) => {
          const dateStr = row[3];
          if (dateStr) {
            const parsedDate = parseSheetDate(dateStr);
            return (
              parsedDate &&
              parsedDate.getMonth() === currentMonth &&
              parsedDate.getFullYear() === currentYear
            );
          }
          return false;
        }).length;
      }

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthlyLeaving = {};

      for (let i = 5; i >= 0; i--) {
        const monthIndex = (now.getMonth() - i + 12) % 12;
        const monthYear = `${months[monthIndex]} ${now.getFullYear()}`;
        monthlyLeaving[monthYear] = { left: 0 };
      }

      dataRows.forEach((row) => {
        const dateStr = row[3];
        if (dateStr) {
          const date = parseSheetDate(dateStr);
          if (date) {
            const monthYear = `${
              months[date.getMonth()]
            } ${date.getFullYear()}`;
            if (monthlyLeaving[monthYear]) {
              monthlyLeaving[monthYear].left += 1;
            } else {
              monthlyLeaving[monthYear] = { left: 1 };
            }
          }
        }
      });

      setLeftEmployee(dataRows.length);
      setLeaveThisMonth(thisMonthCount);

      return { total: dataRows.length, monthlyLeaving };
    } catch (error) {
      console.error("Error fetching leave count:", error);
      return { total: 0, monthlyLeaving: {} };
    }
  };

  const prepareMonthlyHiringData = (hiringData, leavingData) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentDate = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentDate.getMonth() - i + 12) % 12;
      const monthYear = `${months[monthIndex]} ${currentDate.getFullYear()}`;

      result.push({
        month: months[monthIndex],
        hired: hiringData[monthYear]?.hired || 0,
        left: leavingData[monthYear]?.left || 0,
      });
    }

    return result;
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: "#10B981",
      pending: "#F59E0B",
      rejected: "#EF4444",
      cancelled: "#6B7280",
    };
    return colors[status.toLowerCase()] || "#3B82F6";
  };

  const fetchIndentCount = async () => {
    try {
      console.log("🔍 Fetching data from INDENT sheet...");

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=INDENT&action=fetch"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch data from INDENT sheet"
        );
      }

      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      const headers = rawData[5];
      const dataRows = rawData.slice(6);

      const indentNumberIndex = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase() === "indent number"
      );

      if (indentNumberIndex === -1) {
        console.error("❌ 'Indent Number' column not found in headers");
        return 0;
      }

      const indentCount = dataRows.filter((row) => {
        const indentNumber = row[indentNumberIndex]?.toString().trim();
        const isValidIndent =
          indentNumber &&
          indentNumber !== "" &&
          !indentNumber.toLowerCase().includes("indent") &&
          !isNaN(parseInt(indentNumber.replace(/[^0-9]/g, "")));

        if (isValidIndent) {
          console.log("✅ Found valid Indent Number:", indentNumber);
        }
        return isValidIndent;
      }).length;

      console.log("📈 Final indentCount:", indentCount);
      return indentCount;
    } catch (error) {
      console.error("❌ Error fetching indent count:", error);
      return 0;
    }
  };

  const fetchEnquiryCount = async () => {
    try {
      console.log("🔍 Fetching data from ENQUIRY sheet...");

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=ENQUIRY&action=fetch"
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("🧾 Raw result from ENQUIRY API:", result);

      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch data from ENQUIRY sheet"
        );
      }

      const rawData = result.data || result;
      console.log(
        "📊 ENQUIRY Parsed rawData:",
        Array.isArray(rawData),
        rawData.length,
        rawData.slice(0, 5)
      );

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      const headers = rawData[0];

      const dataRows = rawData.slice(1).filter((row) => {
        const colC = row[2]?.toString().trim();
        return colC && colC.toLowerCase() !== "candidate enquiry number";
      });

      console.log("📋 ENQUIRY Headers:", headers);
      console.log("📋 ENQUIRY Data rows count:", dataRows.length);

      const columnCIndex = 2;

      const enquiryCount = dataRows.filter((row) => {
        const value = row[columnCIndex];
        const hasValue = value && value.toString().trim() !== "";
        if (hasValue) console.log("✅ Found Enquiry in Column C:", value);
        return hasValue;
      }).length;

      const columnYIndex = 24;
      const joiningCount = dataRows.filter((row) => {
        const value = row[columnYIndex];
        const hasValue = value && value.toString().trim() !== "";
        if (hasValue) console.log("✅ Found Joining in Column Y:", value);
        return hasValue;
      }).length;

      console.log("📈 Final enquiryCount:", enquiryCount);
      console.log("📈 Final joiningCount:", joiningCount);

      return {
        enquiryCount: enquiryCount,
        joiningCount: joiningCount,
      };
    } catch (error) {
      console.error("❌ Error fetching enquiry count:", error);
      return {
        enquiryCount: 0,
        joiningCount: 0,
      };
    }
  };

  const fetchEnquiryTableDataJoining = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=ENQUIRY&action=fetch"
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch ENQUIRY data");

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) throw new Error("Expected array data");

      const headers = rawData[0];
      const dataRows = rawData
        .slice(1)
        .filter(
          (row) =>
            row[2]?.toString().trim() &&
            row[2].toString().trim().toLowerCase() !==
              "candidate enquiry number"
        );

      const indentNumIdx = 1; // Column B
      const candidateEnqIdx = 2; // Column C
      const applyingForIdx = 3; // Column D
      const candidateNameIdx = 4; // Column E
      const jobExperienceIdx = 9; // Column J
      const departmentIdx = 10; // Column K
      const previousPositionIdx = 11; // Column L
      const maritalStatusIdx = 13; // Column N
      const trackerStatusIdx = 24; // Column Y

      const tableData = dataRows
        .filter((row) => {
          const trackerStatus = row[trackerStatusIdx]
            ?.toString()
            .trim()
            .toLowerCase();
          return trackerStatus === "joining";
        })
        .map((row) => ({
          indentNumber: row[indentNumIdx]?.toString().trim() || "-",
          candidateEnquiry: row[candidateEnqIdx]?.toString().trim() || "-",
          applyingFor: row[applyingForIdx]?.toString().trim() || "-",
          candidateName: row[candidateNameIdx]?.toString().trim() || "-",
          jobExperience: row[jobExperienceIdx]?.toString().trim() || "-",
          department: row[departmentIdx]?.toString().trim() || "-",
          previousPosition: row[previousPositionIdx]?.toString().trim() || "-",
          maritalStatus: row[maritalStatusIdx]?.toString().trim() || "-",
          trackerStatus: row[trackerStatusIdx]?.toString().trim() || "-",
        }));

      setEnquiryTableDatajoining(tableData);
    } catch (error) {
      console.error("Error fetching enquiry joining table data:", error);
      setEnquiryTableDatajoining([]);
    }
  };

  const fetchLiveEmployeeCount = async () => {
    try {
      console.log("🔍 Fetching live employee data from JOINING sheet...");

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=JOINING&action=fetch"
      );

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("🧾 Raw result from JOINING API:", result);

      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch data from JOINING sheet"
        );
      }

      const rawData = result.data || result;
      console.log(
        "📊 JOINING Parsed rawData:",
        Array.isArray(rawData),
        rawData.length,
        rawData.slice(0, 5)
      );

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      const headers = rawData[5];
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];

      console.log("📋 JOINING Headers:", headers);
      console.log("📋 JOINING Data rows count:", dataRows.length);

      const statusIndex = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase() === "status"
      );

      console.log("📍 Status column index:", statusIndex);

      if (statusIndex === -1) {
        console.error("❌ 'Status' column not found in headers");
        return 0;
      }

      const liveEmployeeCount = dataRows.filter((row) => {
        const status = row[statusIndex]?.toString().trim().toLowerCase();
        const isActive = status === "active";

        if (isActive) {
          console.log("✅ Found Active Employee:", row);
        }
        return isActive;
      }).length;

      console.log("📈 Final liveEmployeeCount:", liveEmployeeCount);
      return liveEmployeeCount;
    } catch (error) {
      console.error("❌ Error fetching live employee count:", error);
      return 0;
    }
  };

  // Fetch INDENT Table Data
  const fetchIndentTableData = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=INDENT&action=fetch"
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch INDENT data");

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) throw new Error("Expected array data");

      const headers = rawData[5];
      const dataRows = rawData.slice(6);

      const indentNumIdx = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase() === "indent number"
      );
      const postIdx = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase() === "post"
      );
      const preferIdx = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase() === "prefer"
      );
      const numPostsIdx = headers.findIndex(
        (h) =>
          h && h.toString().trim().toLowerCase().includes("number of posts")
      );

      const tableData = dataRows
        .filter((row) => row[indentNumIdx]?.toString().trim())
        .map((row) => ({
          indentNumber: row[indentNumIdx]?.toString().trim() || "-",
          post: row[postIdx]?.toString().trim() || "-",
          prefer: row[preferIdx]?.toString().trim() || "-",
          numberOfPosts: row[numPostsIdx]?.toString().trim() || "-",
        }));

      setIndentTableData(tableData);
    } catch (error) {
      console.error("Error fetching indent table data:", error);
      setIndentTableData([]);
    }
  };

  // Fetch ENQUIRY Table Data
  const fetchEnquiryTableData = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=ENQUIRY&action=fetch"
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch ENQUIRY data");

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) throw new Error("Expected array data");

      const headers = rawData[0];
      const dataRows = rawData
        .slice(1)
        .filter(
          (row) =>
            row[2]?.toString().trim() &&
            row[2].toString().trim().toLowerCase() !==
              "candidate enquiry number"
        );

      const indentNumIdx = 1;
      const candidateEnqIdx = 2;
      const applyingForIdx = 3;
      const candidateNameIdx = 4;
      const experienceIdx = 9;
      const maritalStatusIdx = 13;

      const tableData = dataRows.map((row) => ({
        indentNumber: row[indentNumIdx]?.toString().trim() || "-",
        candidateEnquiry: row[candidateEnqIdx]?.toString().trim() || "-",
        applyingFor: row[applyingForIdx]?.toString().trim() || "-",
        candidateName: row[candidateNameIdx]?.toString().trim() || "-",
        experience: row[experienceIdx]?.toString().trim() || "-",
        maritalStatus: row[maritalStatusIdx]?.toString().trim() || "-",
      }));

      setEnquiryTableData(tableData);
    } catch (error) {
      console.error("Error fetching enquiry table data:", error);
      setEnquiryTableData([]);
    }
  };

  // Fetch JOINING Table Data (Active only)
  const fetchJoiningTableData = async () => {
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=JOINING&action=fetch"
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Failed to fetch JOINING data");

      const rawData = result.data || result;
      if (!Array.isArray(rawData)) throw new Error("Expected array data");

      const headers = rawData[5];
      const dataRows = rawData.slice(6);

      const statusIdx = headers.findIndex(
        (h) => h && h.toString().trim().toLowerCase() === "status"
      );

      const rbpJoiningIdx = 1;
      const dateOfJoiningIdx = 7;
      const firmNameIdx = 3;
      const nameAadharIdx = 4;
      const workLocationIdx = 8;
      const designationIdx = 9;
      const genderIdx = 18;

      const tableData = dataRows
        .filter(
          (row) => row[statusIdx]?.toString().trim().toLowerCase() === "active"
        )
        .map((row) => ({
          rbpJoiningId: row[rbpJoiningIdx]?.toString().trim() || "-",
          status: row[statusIdx]?.toString().trim() || "-",
          firmName: row[firmNameIdx]?.toString().trim() || "-",
          nameAadhar: row[nameAadharIdx]?.toString().trim() || "-",
          dateOfJoining: row[dateOfJoiningIdx]?.toString().trim() || "-",
          workLocation: row[workLocationIdx]?.toString().trim() || "-",
          designation: row[designationIdx]?.toString().trim() || "-",
          gender: row[genderIdx]?.toString().trim() || "-",
        }));

      setJoiningTableData(tableData);
    } catch (error) {
      console.error("Error fetching joining table data:", error);
      setJoiningTableData([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          joiningResult,
          leavingResult,
          departmentResult,
          leaveAnalytics,
          indentResult,
          enquiryResult,
          liveEmployeeResult,
        ] = await Promise.all([
          fetchJoiningCount(),
          fetchLeaveCount(),
          fetchDepartmentData(),
          fetchLeaveManagementAnalytics(),
          fetchIndentCount(),
          fetchEnquiryCount(),
          fetchLiveEmployeeCount(),
        ]);

        // ✅ CORRECTED: Set proper values for each card
        setTotalEmployee(indentResult); // Total Indent = INDENT count
        setActiveEmployee(enquiryResult.enquiryCount); // Total Enquiry = ENQUIRY count
        setLeftEmployee(enquiryResult.joiningCount); // Total Joining = ENQUIRY joining count
        setLeaveThisMonth(liveEmployeeResult); // Live Employee = ACTIVE employees

        console.log("📊 Final Dashboard Values:");
        console.log("Total Indent:", indentResult);
        console.log("Total Enquiry:", enquiryResult.enquiryCount);
        console.log("Total Joining:", enquiryResult.joiningCount);
        console.log("Live Employee:", liveEmployeeResult);

        setDepartmentData(departmentResult);

        const monthlyData = prepareMonthlyHiringData(
          joiningResult.monthlyHiring,
          leavingResult.monthlyLeaving
        );

        setMonthlyHiringData(monthlyData);

        // Fetch table data
        await Promise.all([
          fetchIndentTableData(),
          fetchEnquiryTableData(),
          fetchJoiningTableData(),
          fetchEnquiryTableDataJoining(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-gray-50 page-content">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">HR Dashboard</h1>
      </div>

      {/* Summary Stats */}
      {/* Summary Stats - CORRECTED */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Indent */}
        <div className="flex items-start p-6 bg-white rounded-xl border shadow-lg">
          <div className="p-3 mr-4 bg-blue-100 rounded-full">
            <FileText size={24} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Indent</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {totalEmployee}
            </h3>
          </div>
        </div>

        {/* Total Enquiry */}
        <div className="flex items-start p-6 bg-white rounded-xl border shadow-lg">
          <div className="p-3 mr-4 bg-green-100 rounded-full">
            <UserCheck size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Enquiry</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {activeEmployee}
            </h3>
          </div>
        </div>

        {/* Total Joining */}
        <div className="flex items-start p-6 bg-white rounded-xl border shadow-lg">
          <div className="p-3 mr-4 bg-amber-100 rounded-full">
            <UserPlus size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Joining</p>
            <h3 className="text-2xl font-bold text-gray-800">{leftEmployee}</h3>
          </div>
        </div>

        {/* Live Employee */}
        <div className="flex items-start p-6 bg-white rounded-xl border shadow-lg">
          <div className="p-3 mr-4 bg-red-100 rounded-full">
            <Users size={24} className="text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Live Employee</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {leaveThisMonth}
            </h3>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-6">
        {/* INDENT Table */}
        <div style={{ display: "flex" }}>
          {" "}
          {/* Gap kam kiya 2px */}
          {/* INDENT Table - Left Side */}
          <div
            className="p-4 bg-white rounded-xl border shadow-lg"
            style={{ width: "520px", marginRight: "15px" }}
          >
            {" "}
            {/* Width 520px se 450px kar diya */}
            {/* ENQUIRY Table - Right Side */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-800">
                Indent Details
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search in all columns..."
                  className="py-2 pr-4 pl-8 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={indentSearchTerm}
                  onChange={(e) => setIndentSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="overflow-y-auto max-h-96">
                <table className="text-sm w-300">
                  <thead>
                    <tr className="sticky top-0 bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Indent Number
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Post
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Prefer
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Number of Posts
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {indentTableData.length > 0 ? (
                      indentTableData
                        .filter((row) => {
                          if (!indentSearchTerm) return true;
                          const searchTerm = indentSearchTerm.toLowerCase();
                          return (
                            row.indentNumber
                              ?.toString()
                              .toLowerCase()
                              .includes(searchTerm) ||
                            row.post?.toLowerCase().includes(searchTerm) ||
                            row.prefer?.toLowerCase().includes(searchTerm) ||
                            row.numberOfPosts
                              ?.toString()
                              .toLowerCase()
                              .includes(searchTerm)
                          );
                        })
                        .map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.indentNumber}
                            </td>
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.post}
                            </td>
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.prefer}
                            </td>
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.numberOfPosts}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-3 text-center text-gray-500"
                        >
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* ENQUIRY Table - Right Side */}
          <div
            className="p-4 bg-white rounded-xl border shadow-lg"
            style={{ width: "650px" }}
          >
            {" "}
            {/* Padding kam kiya */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-800">
                Enquiry Details
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search in all columns..."
                  className="py-2 pr-4 pl-8 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={enquirySearchTerm}
                  onChange={(e) => setEnquirySearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="overflow-y-auto max-h-96">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sticky top-0 bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Indent Number
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Candidate Enquiry
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Applying For
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Candidate Name
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Experience
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                        Marital Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiryTableData.length > 0 ? (
                      enquiryTableData
                        .filter((row) => {
                          if (!enquirySearchTerm) return true;
                          const searchTerm = enquirySearchTerm.toLowerCase();
                          return (
                            row.indentNumber
                              ?.toString()
                              .toLowerCase()
                              .includes(searchTerm) ||
                            row.candidateEnquiry
                              ?.toLowerCase()
                              .includes(searchTerm) ||
                            row.applyingFor
                              ?.toLowerCase()
                              .includes(searchTerm) ||
                            row.candidateName
                              ?.toLowerCase()
                              .includes(searchTerm) ||
                            row.experience
                              ?.toString()
                              .toLowerCase()
                              .includes(searchTerm) ||
                            row.maritalStatus
                              ?.toLowerCase()
                              .includes(searchTerm)
                          );
                        })
                        .map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.indentNumber}
                            </td>
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.candidateEnquiry}
                            </td>
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.applyingFor}
                            </td>
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.candidateName}
                            </td>
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.experience}
                            </td>
                            <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                              {row.maritalStatus}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-4 py-3 text-center text-gray-500"
                        >
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-4 bg-white rounded-xl border shadow-lg"
          style={{ width: "1100px", margin: "25px" }}
        >
          {" "}
          {/* Padding kam kiya */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-800">
              Enquiry Details (Tracker Status: Joining)
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search in all columns..."
                className="py-2 pr-4 pl-8 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={joiningSearchTerm}
                onChange={(e) => setJoiningSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="sticky top-0 bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Indent Number
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Candidate Enquiry
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Applying For
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Candidate Name
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Experience
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Department
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Previous Position
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Marital Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Tracker Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {enquiryTableDatajoining.length > 0 ? (
                    enquiryTableDatajoining
                      .filter((row) => {
                        if (!joiningSearchTerm) return true;
                        const searchTerm = joiningSearchTerm.toLowerCase();
                        return (
                          row.indentNumber
                            ?.toString()
                            .toLowerCase()
                            .includes(searchTerm) ||
                          row.candidateEnquiry
                            ?.toLowerCase()
                            .includes(searchTerm) ||
                          row.applyingFor?.toLowerCase().includes(searchTerm) ||
                          row.candidateName
                            ?.toLowerCase()
                            .includes(searchTerm) ||
                          row.experience
                            ?.toString()
                            .toLowerCase()
                            .includes(searchTerm) ||
                          row.department?.toLowerCase().includes(searchTerm) ||
                          row.previousPosition
                            ?.toLowerCase()
                            .includes(searchTerm) ||
                          row.maritalStatus
                            ?.toLowerCase()
                            .includes(searchTerm) ||
                          row.trackerStatus?.toLowerCase().includes(searchTerm)
                        );
                      })
                      .map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            {row.indentNumber}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            {row.candidateEnquiry}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            {row.applyingFor}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            {row.candidateName}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            {row.jobExperience}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            {row.department}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            {row.previousPosition}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            {row.maritalStatus}
                          </td>
                          <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded">
                              {row.trackerStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No data available with Tracker Status: Joining
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* JOINING Table */}
        <div className="p-6 bg-white rounded-xl border shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-800">
              Joining Details (Active Employees)
            </h2>
            <button
              onClick={() => exportToCSV(joiningTableData, "joining_details")}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={joiningTableData.length === 0}
            >
              <svg
                className="mr-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export to CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <div className="overflow-y-auto max-h-96">
              {" "}
              {/* Y-axis scroll */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="sticky top-0 bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      RBP ID
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Firm Name
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Name
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Date of Joining
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Work Location
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Designation
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-gray-700 whitespace-nowrap bg-gray-100">
                      Gender
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {joiningTableData.length > 0 ? (
                    joiningTableData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {row.rbpJoiningId}
                        </td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {row.firmName}
                        </td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {row.nameAadhar}
                        </td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {row.dateOfJoining}
                        </td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {row.workLocation}
                        </td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {row.designation}
                        </td>
                        <td className="px-4 py-3 text-gray-800 whitespace-nowrap">
                          {row.gender}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No active employees
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
