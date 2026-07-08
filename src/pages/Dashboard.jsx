import React, { useEffect, useState, useMemo } from "react";
import supabase from "../utils/supabase";
import { Users, UserCheck, UserPlus, FileText, } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, } from "recharts";

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

  // Fetch Leave Management Data for New Analytics
  const fetchLeaveManagementAnalytics = async () => {
    try {
      console.log("🔍 Fetching leave management analytics from Supabase...");

      const { data, error } = await supabase
        .from('employee_leaving')
        .select('reason_of_leaving, status');

      if (error) {
        throw new Error(error.message);
      }

      const dataRows = data || [];

      const statusCounts = {};
      const typeCounts = {};

      dataRows.forEach((row) => {
        // Status count (using status field)
        const status = row.status?.toString().trim() || "Unknown";
        if (statusCounts[status]) {
          statusCounts[status] += 1;
        } else {
          statusCounts[status] = 1;
        }

        // Leave type count (using reason_of_leaving as leave type)
        const leaveType = row.reason_of_leaving?.toString().trim() || "Unknown";
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
      console.log("🔍 Fetching joining data from Supabase...");

      const { data, error } = await supabase
        .from('joining')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      const dataRows = data || [];

      let activeCount = 0;
      const monthlyHiring = {};
      const designationCounts = {};

      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentDate.getMonth() - i + 12) % 12;
        const monthYear = `${months[monthIndex]} ${currentDate.getFullYear()}`;
        monthlyHiring[monthYear] = { hired: 0 };
      }

      // Count active employees - case insensitive
      activeCount = dataRows.filter(
        (row) => row.status?.toString().trim().toLowerCase() === "active"  // toLowerCase() add किया
      ).length;

      // Process monthly hiring data - सिर्फ उन्हीं को count करें जिनके पास valid date_of_joining है
      dataRows.forEach((row) => {
        const dateStr = row.date_of_joining;
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const monthYear = `${months[date.getMonth()]
              } ${date.getFullYear()}`;
            if (monthlyHiring[monthYear]) {
              monthlyHiring[monthYear].hired += 1;
            } else {
              monthlyHiring[monthYear] = { hired: 1 };
            }
          }
        }
      });

      // Process designation counts
      dataRows.forEach((row) => {
        const designation = row.designation?.toString().trim();
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
      console.log("🔍 Fetching department data from Supabase...");

      const { data, error } = await supabase
        .from('joining')
        .select('department');

      if (error) {
        throw new Error(error.message);
      }

      const dataRows = data || [];
      const departmentCounts = {};

      dataRows.forEach((row) => {
        const department = row.department?.toString().trim();
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
      console.log("🔍 Fetching leaving data from Supabase...");

      const { data, error } = await supabase
        .from('employee_leaving')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      const dataRows = data || [];

      let thisMonthCount = 0;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      if (dataRows.length > 0) {
        thisMonthCount = dataRows.filter((row) => {
          const dateStr = row.date_of_leaving;
          if (dateStr) {
            const parsedDate = new Date(dateStr);
            return (
              !isNaN(parsedDate.getTime()) &&
              parsedDate.getMonth() === currentMonth &&
              parsedDate.getFullYear() === currentYear
            );
          }
          return false;
        }).length;
      }

      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const monthlyLeaving = {};

      for (let i = 5; i >= 0; i--) {
        const monthIndex = (now.getMonth() - i + 12) % 12;
        const monthYear = `${months[monthIndex]} ${now.getFullYear()}`;
        monthlyLeaving[monthYear] = { left: 0 };
      }

      dataRows.forEach((row) => {
        const dateStr = row.date_of_leaving;
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const monthYear = `${months[date.getMonth()]
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


  const fetchIndentCount = async () => {
    try {
      console.log("🔍 Fetching data from INDENT table...");

      const { data, error } = await supabase
        .from('indent')
        .select('indent_number');

      if (error) {
        throw new Error(error.message);
      }

      const dataRows = data || [];

      const indentCount = dataRows.filter((row) => {
        const indentNumber = row.indent_number?.toString().trim();
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
      console.log("🔍 Fetching data from ENQUIRY table...");

      const { data, error } = await supabase
        .from('enquiry')
        .select('candidate_enquiry_number, tracker_status');

      if (error) {
        throw new Error(error.message);
      }

      const dataRows = data || [];

      console.log("📋 ENQUIRY Data rows count:", dataRows.length);

      // Count enquiries (non-empty candidate_enquiry_number)
      const enquiryCount = dataRows.filter((row) => {
        const value = row.candidate_enquiry_number;
        const hasValue = value && value.toString().trim() !== "";
        if (hasValue) console.log("✅ Found Enquiry:", value);
        return hasValue;
      }).length;

      // Count joining (tracker_status = 'joining')
      const joiningCount = dataRows.filter((row) => {
        const value = row.tracker_status;
        const isJoining = value && value.toString().trim().toLowerCase() === "joining";
        if (isJoining) console.log("✅ Found Joining in tracker_status");
        return isJoining;
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
      console.log("🔍 Fetching ENQUIRY joining data from Supabase...");

      const { data, error } = await supabase
        .from('enquiry')
        .select(
          'indent_number, candidate_enquiry_number, applying_post, candidate_name, job_experience, department, previous_position, marital_status, tracker_status'
        );

      if (error) {
        throw new Error(error.message);
      }

      // 🟢 SIRF MAP KARO - Koi filter nahi, koi condition nahi
      const tableData = (data || []).map((row) => ({
        indentNumber: row.indent_number?.toString().trim() || "-",
        candidateEnquiry: row.candidate_enquiry_number?.toString().trim() || "-",
        applyingFor: row.applying_post?.toString().trim() || "-",
        candidateName: row.candidate_name?.toString().trim() || "-",
        jobExperience: row.job_experience?.toString().trim() || "-",
        department: row.department?.toString().trim() || "-",
        previousPosition: row.previous_position?.toString().trim() || "-",
        maritalStatus: row.marital_status?.toString().trim() || "-",
        trackerStatus: row.tracker_status?.toString().trim() || "-",
      }));

      console.log("Total Enquiry Records (with all status):", tableData.length);
      setEnquiryTableDatajoining(tableData);
    } catch (error) {
      console.error("Error fetching enquiry joining table data:", error);
      setEnquiryTableDatajoining([]);
    }
  };


  const fetchLiveEmployeeCount = async () => {
    try {
      console.log("🔍 Fetching live employee data from JOINING table...");

      const { data, error } = await supabase
        .from('joining')
        .select('status');

      if (error) {
        throw new Error(error.message);
      }

      const dataRows = data || [];

      console.log("📋 JOINING Data rows count:", dataRows.length);

      const liveEmployeeCount = dataRows.filter((row) => {
        const status = row.status?.toString().trim().toLowerCase(); // toLowerCase() add किया
        const isActive = status === "active"; // "active" से compare करें

        if (isActive) {
          console.log("✅ Found Active Employee");
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

  const fetchIndentTableData = async () => {
    try {
      console.log("🔍 Fetching INDENT table data from Supabase...");

      const { data, error } = await supabase
        .from('indent')
        .select('indent_number, post, prefer, number_of_posts');

      if (error) {
        throw new Error(error.message);
      }

      const tableData = (data || [])
        .filter((row) => row.indent_number?.toString().trim())
        .map((row) => ({
          indentNumber: row.indent_number?.toString().trim() || "-",
          post: row.post?.toString().trim() || "-",
          prefer: row.prefer?.toString().trim() || "-",
          numberOfPosts: row.number_of_posts?.toString().trim() || "-",
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
      console.log("🔍 Fetching ENQUIRY table data from Supabase...");

      const { data, error } = await supabase
        .from('enquiry')
        .select(
          'indent_number, candidate_enquiry_number, applying_post, candidate_name, job_experience, marital_status'
        );

      if (error) {
        throw new Error(error.message);
      }

      // 🟢 BAS ITNA SIMPLE - Sirf map karo, koi condition nahi
      const tableData = (data || []).map((row) => ({
        indentNumber: row.indent_number?.toString().trim() || "-",
        candidateEnquiry: row.candidate_enquiry_number?.toString().trim() || "-",
        applyingFor: row.applying_post?.toString().trim() || "-",
        candidateName: row.candidate_name?.toString().trim() || "-",
        experience: row.job_experience?.toString().trim() || "-",
        maritalStatus: row.marital_status?.toString().trim() || "-",
      }));

      console.log("Total Enquiry Records:", tableData.length);
      setEnquiryTableData(tableData);
    } catch (error) {
      console.error("Error fetching enquiry table data:", error);
      setEnquiryTableData([]);
    }
  };

  // Fetch JOINING Table Data (Active only)
  const fetchJoiningTableData = async () => {
    try {
      console.log("🔍 Fetching JOINING table data from Supabase...");

      const { data, error } = await supabase
        .from('joining')
        .select(
          'rbp_joining_id, status, firm_name, name_as_per_aadhar, date_of_joining, work_location, designation, gender, employee_category'
        );

      if (error) {
        throw new Error(error.message);
      }

      // Case-insensitive status check
      const tableData = (data || [])
        .filter((row) => {
          const status = row.status?.toString().trim().toLowerCase();
          return status === "active"; // "active" से compare करें
        })
        .map((row) => ({
          rbpJoiningId: row.rbp_joining_id?.toString().trim() || "-",
          status: row.status?.toString().trim() || "-",
          firmName: row.firm_name?.toString().trim() || "-",
          nameAadhar: row.name_as_per_aadhar?.toString().trim() || "-",
          dateOfJoining: row.date_of_joining?.toString().trim() || "-",
          workLocation: row.work_location?.toString().trim() || "-",
          designation: row.designation?.toString().trim() || "-",
          gender: row.gender?.toString().trim() || "-",
          employeeCategory: row.employee_category?.toString().trim() || "-",
        }));

      console.log("Filtered Active Employees:", tableData.length);
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

  // Compute chart data for Active Employees (Designation-wise Count)
  const designationChartData = useMemo(() => {
    const counts = {};
    joiningTableData.forEach((emp) => {
      const designation = emp.designation || "Unknown";
      counts[designation] = (counts[designation] || 0) + 1;
    });

    const sortedData = Object.keys(counts)
      .map((key) => ({
        designation: key,
        count: counts[key],
      }))
      .sort((a, b) => b.count - a.count);

    if (sortedData.length <= 12) {
      return sortedData;
    }

    const top12 = sortedData.slice(0, 12);
    const rest = sortedData.slice(12);
    const restCount = rest.reduce((acc, curr) => acc + curr.count, 0);

    return [
      ...top12,
      {
        designation: "Others",
        count: restCount,
      },
    ];
  }, [joiningTableData]);

  // Compute chart data for Active Employees (Gender Distribution)
  const genderChartData = useMemo(() => {
    const counts = { Male: 0, Female: 0, Other: 0 };
    joiningTableData.forEach((emp) => {
      let gender = emp.gender || "Other";
      if (gender.toLowerCase() === "male") gender = "Male";
      else if (gender.toLowerCase() === "female") gender = "Female";
      else gender = "Other";

      counts[gender] = (counts[gender] || 0) + 1;
    });
    return Object.keys(counts)
      .map((key) => ({
        name: key,
        value: counts[key],
      }))
      .filter((item) => item.value > 0);
  }, [joiningTableData]);

  // Compute chart data for Active Employees (Staff Category Distribution)
  const staffTypeChartData = useMemo(() => {
    const counts = { "Office Staff": 0, "Field Staff": 0, "Other": 0 };
    joiningTableData.forEach((emp) => {
      const category = emp.employeeCategory || "Other";
      if (category.toLowerCase().includes("office")) {
        counts["Office Staff"] += 1;
      } else if (category.toLowerCase().includes("field")) {
        counts["Field Staff"] += 1;
      } else {
        counts["Other"] += 1;
      }
    });
    return Object.keys(counts)
      .map((key) => ({
        name: key,
        value: counts[key],
      }))
      .filter((item) => item.value > 0);
  }, [joiningTableData]);

  const GENDER_COLORS = {
    Male: "#3B82F6",    // Blue
    Female: "#EC4899",  // Pink
    Other: "#8B5CF6",   // Purple
  };

  const STAFF_TYPE_COLORS = {
    "Office Staff": "#10B981", // Green/Emerald
    "Field Staff": "#F59E0B",  // Amber
    Other: "#6B7280",          // Gray
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 page-content">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#065F46] to-[#0F766E] tracking-tight">HR Dashboard</h1>
      </div>

      {/* Summary Stats - CORRECTED */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

        {/* Total Indent */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                Total Indent
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-850">
                {totalEmployee}
              </h3>
            </div>

            <div className="rounded-xl bg-emerald-50 text-[#0F766E] p-3 border border-emerald-100">
              <FileText size={24} />
            </div>
          </div>
        </div>

        {/* Total Enquiry */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                Total Enquiry
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-850">
                {activeEmployee}
              </h3>
            </div>

            <div className="rounded-xl bg-teal-50 text-[#0F766E] p-3 border border-teal-100">
              <UserCheck size={24} />
            </div>
          </div>
        </div>

        {/* Total Joining */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                Total Joining
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-850">
                {leftEmployee}
              </h3>
            </div>

            <div className="rounded-xl bg-emerald-50 text-[#0F766E] p-3 border border-emerald-100">
              <UserPlus size={24} />
            </div>
          </div>
        </div>

        {/* Live Employee */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-slate-200/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 tracking-wide uppercase">
                Live Employee
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-slate-850">
                {leaveThisMonth}
              </h3>
            </div>

            <div className="rounded-xl bg-teal-50 text-[#0F766E] p-3 border border-teal-100">
              <Users size={24} />
            </div>
          </div>
        </div>

      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Designation-wise Employee Count Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">
            Designation-wise Employee Count
          </h2>
          <div className="h-96 w-full">
            {designationChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={designationChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="designation"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tick={{ fill: '#4B5563', fontSize: 10 }}
                    height={70}
                  />
                  <YAxis tick={{ fill: '#4B5563', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    cursor={{ fill: '#F3F4F6' }}
                  />
                  {/* <Bar dataKey="count" name="Employees" fill="#3B82F6" radius={[4, 4, 0, 0]} /> */}

                  <Bar dataKey="count" name="Employees" radius={[4, 4, 0, 0]}>
                    {designationChartData.map((entry, index) => {
                      let color = "#22C55E"; // Green

                      if (entry.count <= 2) {
                        color = "#EF4444"; // Red
                      } else if (entry.count <= 5) {
                        color = "#F97316"; // Orange
                      } else if (entry.count <= 10) {
                        color = "#EAB308"; // Yellow
                      }

                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No designation data available
              </div>
            )}
          </div>
        </div>

        {/* Gender and Staff Type Distribution Donuts */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-6">
              Employee Demographics & Classification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center">
            {/* Gender Chart */}
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Gender Distribution</h3>
              <div className="h-60 w-full flex items-center justify-center relative">
                {genderChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {genderChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name] || '#9CA3AF'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500">No gender data</div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {genderChartData.map((entry, idx) => (
                  <div key={idx} className="flex items-center text-xs">
                    <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: GENDER_COLORS[entry.name] }}></span>
                    <span className="text-gray-600 font-medium">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Type Chart */}
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-sm font-semibold text-gray-600 mb-4">Staff Type</h3>
              <div className="h-60 w-full flex items-center justify-center relative">
                {staffTypeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={staffTypeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {staffTypeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STAFF_TYPE_COLORS[entry.name] || '#9CA3AF'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500">No staff category data</div>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {staffTypeChartData.map((entry, idx) => (
                  <div key={idx} className="flex items-center text-xs">
                    <span className="w-3 h-3 rounded-full mr-1.5" style={{ backgroundColor: STAFF_TYPE_COLORS[entry.name] }}></span>
                    <span className="text-gray-600 font-medium">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="space-y-6">
        {/* INDENT Table */}
        <div style={{ display: "flex" }}>
          {" "}

          <div
            className="p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm"
            style={{ width: "520px", marginRight: "15px" }}
          >
            {" "}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Indent Details
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="py-2 pr-4 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all w-48 hover:border-slate-350"
                  value={indentSearchTerm}
                  onChange={(e) => setIndentSearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400"
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
                <table className="text-sm w-full">
                  <thead>
                    <tr className="sticky top-0 bg-[#0F766E]/5 border-b border-slate-200">
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                        Indent Number
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                        Post
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                        Prefer
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
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
                            className="border-b border-slate-100 hover:bg-emerald-50/20 transition-colors"
                          >
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.indentNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.post}
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.prefer}
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.numberOfPosts}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-3 text-center text-slate-500"
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
            className="p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm"
            style={{ width: "650px" }}
          >
            {" "}
            {/* Padding kam kiya */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                Enquiry Details
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="py-2 pr-4 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all w-48 hover:border-slate-350"
                  value={enquirySearchTerm}
                  onChange={(e) => setEnquirySearchTerm(e.target.value)}
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400"
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
                    <tr className="sticky top-0 bg-[#0F766E]/5 border-b border-slate-200">
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                        Indent Number
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                        Candidate Enquiry
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                        Applying For
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                        Candidate Name
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                        Experience
                      </th>
                      <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
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
                            className="border-b border-slate-100 hover:bg-emerald-50/20 transition-colors"
                          >
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.indentNumber}
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.candidateEnquiry}
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.applyingFor}
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.candidateName}
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.experience}
                            </td>
                            <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                              {row.maritalStatus}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="px-4 py-3 text-center text-slate-500"
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
          className="p-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm"
          style={{ width: "1100px", margin: "25px" }}
        >
          {" "}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Enquiry Details (Tracker Status: Joining)
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="py-2 pr-4 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all w-60 hover:border-slate-350"
                value={joiningSearchTerm}
                onChange={(e) => setJoiningSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400"
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
                  <tr className="sticky top-0 bg-[#0F766E]/5 border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Indent Number
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Candidate Enquiry
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Applying For
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Candidate Name
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Experience
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Department
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Previous Position
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Marital Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
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
                          className="border-b border-slate-100 hover:bg-emerald-50/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            {row.indentNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            {row.candidateEnquiry}
                          </td>
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            {row.applyingFor}
                          </td>
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            {row.candidateName}
                          </td>
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            {row.jobExperience}
                          </td>
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            {row.department}
                          </td>
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            {row.previousPosition}
                          </td>
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            {row.maritalStatus}
                          </td>
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-semibold text-[#0F766E] bg-emerald-50 border border-emerald-100 rounded-lg">
                              {row.trackerStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-4 py-3 text-center text-slate-500"
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
        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Joining Details (Active Employees)
            </h2>
            <button
              onClick={() => exportToCSV(joiningTableData, "joining_details")}
              className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] shadow-sm rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <tr className="sticky top-0 bg-[#0F766E]/5 border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      RBP ID
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Firm Name
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Name
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Date of Joining
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Work Location
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Designation
                    </th>
                    <th className="px-4 py-3 font-semibold text-left text-slate-700 whitespace-nowrap bg-slate-50/50">
                      Gender
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {joiningTableData.length > 0 ? (
                    joiningTableData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 hover:bg-emerald-50/20 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                          {row.rbpJoiningId}
                        </td>
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-xs font-semibold text-[#0F766E] bg-emerald-50 border border-emerald-100 rounded-lg">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                          {row.firmName}
                        </td>
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                          {row.nameAadhar}
                        </td>
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                          {row.dateOfJoining}
                        </td>
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                          {row.workLocation}
                        </td>
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                          {row.designation}
                        </td>
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                          {row.gender}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-3 text-center text-slate-500"
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
