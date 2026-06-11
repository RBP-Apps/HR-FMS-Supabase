import { useState, useEffect } from "react";
import supabase from "../utils/supabase";

// Sub-components
import AttendancePDF from "../components/attendance/AttendancePDF";
import AttendanceExcel from "../components/attendance/AttendanceExcel";
import LeaveModal from "../components/attendance/LeaveModal";
import EditAttendanceModal from "../components/attendance/EditAttendanceModal";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import AttendanceTable from "../components/attendance/AttendanceTable";
import EmployeeSummaryPanel from "../components/attendance/EmployeeSummaryPanel";
import RecentCorrections from "../components/attendance/RecentCorrections";

// Helper Functions
function calcSummary(data) {
  return {
    P: data.filter(d => d === "P").length,
    A: data.filter(d => d === "A").length,
    CL: data.filter(d => d === "CL").length,
    WO: data.filter(d => d === "WO").length,
    HD: data.filter(d => d === "HD").length,
  };
}

function paidDays(s) {
  return s.P + s.CL + s.HD * 0.5;
}

const getMonthNumber = (monthName) => {
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];
  return months.indexOf(monthName);
};

export default function HRMSAttendanceDashboard() {
  // States for real data
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [fieldAttendance, setFieldAttendance] = useState([]);
  const [biometricAttendance, setBiometricAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manualCorrections, setManualCorrections] = useState([]);

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalData, setEditModalData] = useState({
    employee: null,
    date: null,
    currentStatus: null,
    dayIndex: null
  });

  // UI States
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("biometric");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString("default", { month: "long" }));
  const [selectedCompany, setSelectedCompany] = useState("All Companies");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  // Edit States
  const [editingCell, setEditingCell] = useState(null);
  const [editRemark, setEditRemark] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);

  // Leave Management (CL = 12 days/year)
  const [leaveBalances, setLeaveBalances] = useState({});
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedLeaveEmp, setSelectedLeaveEmp] = useState(null);
  const [leaveType, setLeaveType] = useState("CL");
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveReason, setLeaveReason] = useState("");

  const ROWS_PER_PAGE = 1000;
  const MAX_CL_DAYS = 12;

  const getCurrentDate = () => {
    const date = new Date();
    return `${date.toLocaleDateString("en-US", { weekday: "long" })}, ${date.getDate()} ${date.toLocaleDateString("en-US", { month: "long" })} ${date.getFullYear()}`;
  };

  const fetchEmployees = async () => {
    try {
      // Fetch active joining data
      const { data: joiningData, error: joiningError } = await supabase
        .from("joining")
        .select("id, name_as_per_aadhar, firm_name, attendance_type, rbp_joining_id, department, designation, status, employee_category")
        .eq("status", "Active");

      if (joiningError) throw joiningError;

      // Get unique companies from joining data
      const uniqueCompanies = [...new Set((joiningData || []).map(j => j.firm_name).filter(Boolean))];
      setCompanies(uniqueCompanies);

      const empList = (joiningData || []).map((join, idx) => {
        return {
          id: join.id,
          code: join.rbp_joining_id || `EMP${idx + 1}`,
          name: join.name_as_per_aadhar || `Employee ${idx + 1}`,
          dept: join.department || (join.attendance_type === "Field" ? "Field" : "Office"),
          role: join.designation || "Staff",
          avatar: (join.name_as_per_aadhar || "EM").substring(0, 2).toUpperCase(),
          userId: join.id,
          company: join.firm_name || "N/A",
          attendanceType: join.attendance_type || "Field",
          joiningId: join.rbp_joining_id,
          employeeCategory: join.employee_category || ""
        };
      });

      setEmployees(empList);
      return empList;
    } catch (err) {
      console.error("Error fetching employees:", err);
      return [];
    }
  };

  // Format time to 12hr AM/PM format
  const formatTime12hr = (timeStr) => {
    if (!timeStr) return null;
    if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
      return timeStr;
    }
    const parts = timeStr.split(":");
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Fetch biometric attendance from offline_biometric_punch
  const fetchBiometricAttendance = async () => {
    try {
      let allData = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error: err } = await supabase
          .from("offline_biometric_punch")
          .select("*")
          .order("attendance_date", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (err) throw err;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      const formatted = allData.map(record => {
        const isPresent = record.in_time || record.out_time;
        return {
          employeeCode: record.employee_id,
          employeeName: record.employee_name,
          date: record.attendance_date,
          inTime: formatTime12hr(record.in_time),
          outTime: formatTime12hr(record.out_time),
          status: isPresent ? "P" : "A",
          records: [record]
        };
      });

      setBiometricAttendance(formatted);
      return formatted;
    } catch (err) {
      console.error("Error fetching biometric:", err);
      return [];
    }
  };

  // Fetch field attendance from attendance table
  const fetchFieldAttendance = async () => {
    try {
      const { data, error: err } = await supabase
        .from("attendance")
        .select("*")
        .order("date", { ascending: false });

      if (err) throw err;

      const grouped = {};
      (data || []).forEach(record => {
        const key = `${record.person_name}_${record.date}`;

        if (!grouped[key]) {
          grouped[key] = {
            employeeName: record.person_name,
            employeeCode: record.employee_code,
            date: record.date,
            inTime: null,
            outTime: null,
            midEntries: [],
            status: "A",
            records: [],
            images: record.images,
            address: record.address,
            mapLink: record.map_link,
            latitude: record.latitude,
            longitude: record.longitude,
            reason: record.reason,
            approvedStatus: record.approved_status,
            remark: record.remark,
            attachment: record.attachment
          };
        }

        grouped[key].records.push(record);

        if (record.status === "IN") {
          grouped[key].inTime = record.time;
          grouped[key].status = "P";
        } else if (record.status === "OUT") {
          grouped[key].outTime = record.time;
        } else if (record.status === "MID") {
          grouped[key].midEntries.push(record.time);
        } else if (record.status === "CL") {
          grouped[key].status = "CL";
        }
      });

      setFieldAttendance(Object.values(grouped));
      return Object.values(grouped);
    } catch (err) {
      console.error("Error fetching field attendance:", err);
      return [];
    }
  };

  // Fetch manual corrections
  const fetchManualCorrections = async () => {
    try {
      const { data, error: err } = await supabase
        .from("attendance")
        .select("*")
        .eq("approved_status", "corrected")
        .order("date", { ascending: false })
        .limit(10);

      if (err) throw err;

      const corrections = (data || []).map(record => ({
        emp: record.person_name,
        code: record.employee_code,
        date: record.date,
        prev: record.status === "P" ? "Absent" : "Present",
        next: record.status === "P" ? "Present" : "Absent",
        reason: record.remark || record.reason || "Manual correction",
        by: "Admin",
        on: record.timestamp || new Date().toLocaleDateString(),
        attachment: record.attachment
      }));

      setManualCorrections(corrections);
    } catch (err) {
      console.error("Error fetching corrections:", err);
    }
  };

  // Fetch leave balances from attendance table (CL count for Office employees)
  const fetchLeaveBalances = async () => {
    try {
      const currentYear = new Date().getFullYear().toString();

      // Get all office employees
      const officeEmployees = employees.filter(e => e.attendanceType === "Office" || e.dept === "Office");

      const balances = {};
      for (const emp of officeEmployees) {
        // Count CL taken this year
        const { data, error: err } = await supabase
          .from("attendance")
          .select("date")
          .eq("person_name", emp.name)
          .eq("status", "CL")
          .ilike("date", `${currentYear}%`);

        if (!err) {
          balances[emp.id] = {
            usedCL: data?.length || 0,
            remainingCL: MAX_CL_DAYS - (data?.length || 0)
          };
        }
      }

      setLeaveBalances(balances);
    } catch (err) {
      console.error("Error fetching leave balances:", err);
    }
  };

  // Apply leave
  const applyLeave = async () => {
    if (!selectedLeaveEmp || leaveDays <= 0) return;

    const remainingCL = leaveBalances[selectedLeaveEmp.id]?.remainingCL || MAX_CL_DAYS;

    if (leaveType === "CL" && leaveDays > remainingCL) {
      alert(`Insufficient CL balance! Available: ${remainingCL} days`);
      return;
    }

    try {
      const dates = [];
      const today = new Date();
      for (let i = 0; i < leaveDays; i++) {
        const leaveDate = new Date(today);
        leaveDate.setDate(today.getDate() + i);
        dates.push(leaveDate.toISOString().split("T")[0]);
      }

      for (const date of dates) {
        const { error: err } = await supabase
          .from("attendance")
          .insert({
            person_name: selectedLeaveEmp.name,
            employee_code: selectedLeaveEmp.code,
            date: date,
            status: leaveType === "CL",
            approved_status: "approved",
            remark: leaveReason || `${leaveType} Leave applied`,
            timestamp: new Date().toISOString()
          });

        if (err) throw err;
      }

      alert(`${leaveDays} day(s) ${leaveType} leave applied for ${selectedLeaveEmp.name}`);
      setShowLeaveModal(false);
      setSelectedLeaveEmp(null);
      setLeaveDays(1);
      setLeaveReason("");

      await fetchFieldAttendance();
      await fetchManualCorrections();
      await fetchLeaveBalances();
    } catch (err) {
      console.error("Error applying leave:", err);
      alert("Failed to apply leave");
    }
  };

  const getDaysOfWeek = (year, month) => {
    const monthNum = getMonthNumber(month);
    const daysInMonth = new Date(parseInt(year), monthNum + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(parseInt(year), monthNum, i);
      days.push(date.toLocaleDateString("en-US", { weekday: "short" }));
    }
    return days;
  };

  // Add this helper function near your other helper functions
  const isFutureDate = (year, month, day) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(parseInt(year), getMonthNumber(month), day);
    return checkDate > today;
  };

  // Generate monthly attendance matrix
  const generateMonthlyAttendance = (employee, year, month) => {
    const monthNum = getMonthNumber(month);
    const daysInMonth = new Date(parseInt(year), monthNum + 1, 0).getDate();

    // Initialize with "A" (Absent) by default
    const attendanceArray = new Array(daysInMonth).fill("A");

    // First, mark Sundays as "WO" (Week Off) - BUT attendance can override this
    for (let i = 0; i < daysInMonth; i++) {
      const date = new Date(parseInt(year), monthNum, i + 1);
      if (date.getDay() === 0) { // Sunday = 0
        attendanceArray[i] = "WO";
      }
    }

    // 1. MANUAL CORRECTIONS (override WO if present)
    const manualEntries = manualCorrections.filter(m => m.emp === employee.name);
    manualEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate.getFullYear().toString() === year &&
        entryDate.toLocaleString("default", { month: "long" }) === month) {
        const day = entryDate.getDate() - 1;
        if (day >= 0 && day < daysInMonth) {
          attendanceArray[day] = entry.next === "Present" ? "P" : "A";
        }
      }
    });

    // 2. LEAVE ENTRIES (override WO)
    const leaveEntries = fieldAttendance.filter(f =>
      f.employeeName === employee.name &&
      (f.status === "CL")
    );
    leaveEntries.forEach(entry => {
      if (entry.date) {
        const day = parseInt(entry.date.split("-")[2]) - 1;
        if (day >= 0 && day < daysInMonth) {
          attendanceArray[day] = entry.status; // Override WO
        }
      }
    });

    // 3. BIOMETRIC DATA - ONLY IF activeTab IS "monthly" OR "biometric"
    if (activeTab === "monthly" || activeTab === "biometric") {
      const empBiometric = biometricAttendance.filter(b =>
        (b.employeeCode?.trim().toLowerCase() === employee.code?.trim().toLowerCase() ||
         b.employeeName?.trim().toLowerCase() === employee.name?.trim().toLowerCase()) &&
        b.date && b.date.startsWith(`${year}-${String(monthNum + 1).padStart(2, "0")}`)
      );

      empBiometric.forEach(att => {
        if (att.date) {
          const day = parseInt(att.date.split("-")[2]) - 1;
          if (day >= 0 && day < daysInMonth) {
            attendanceArray[day] = att.status === "P" ? "P" : "A"; // Override WO
          }
        }
      });
    }

    // 4. FIELD DATA - ONLY IF activeTab IS "monthly" OR "field"
    if (activeTab === "monthly" || activeTab === "field") {
      const empField = fieldAttendance.filter(f =>
        (f.employeeName === employee.name || f.employeeCode === employee.code) &&
        f.date && f.date.startsWith(`${year}-${String(monthNum + 1).padStart(2, "0")}`) &&
        f.status !== "CL"
      );

      empField.forEach(att => {
        if (att.date) {
          const day = parseInt(att.date.split("-")[2]) - 1;
          if (day >= 0 && day < daysInMonth) {
            attendanceArray[day] = "P"; // Override WO with Present if they worked
          }
        }
      });
    }

    return attendanceArray;
  };

  // Update attendance status with remark and file
  const updateAttendanceStatus = async (employee, date, newStatus) => {
    // Add future date check
    const [year, month, day] = date.split("-");
    if (isFutureDate(year, month, parseInt(day))) {
      alert("Cannot edit future dates!");
      return;
    }

    if (!editRemark.trim()) {
      alert("Remark is mandatory when editing attendance!");
      return;
    }

    try {
      let attachmentUrl = null;

      if (editFile) {
        const fileName = `${employee.code}_${date}_${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("attachments")
          .upload(`attendance/${fileName}`, editFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("attachments")
          .getPublicUrl(`attendance/${fileName}`);

        attachmentUrl = urlData.publicUrl;
      }

      const { error: err } = await supabase
        .from("attendance")
        .insert({
          person_name: employee.name,
          employee_code: employee.code,
          date: date,
          status: newStatus === "P" ? "IN" : "OUT",
          approved_status: "corrected",
          remark: editRemark,
          attachment: attachmentUrl,
          timestamp: new Date().toISOString()
        });

      if (err) throw err;

      await fetchFieldAttendance();
      await fetchManualCorrections();

      alert(`Attendance updated to ${newStatus === "P" ? "Present" : "Absent"} for ${employee.name} on ${date}`);

      // Reset form
      setEditRemark("");
      setEditFile(null);
      setEditFilePreview(null);
    } catch (err) {
      console.error("Error updating attendance:", err);
      alert("Failed to update attendance");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load all data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchEmployees();
        await fetchBiometricAttendance();
        await fetchFieldAttendance();
        await fetchManualCorrections();
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fetch leave balances after employees loaded
  useEffect(() => {
    if (employees.length > 0) {
      fetchLeaveBalances();
    }
  }, [employees]);

  // Filter employees
  let filtered = employees.filter(e =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.code?.toLowerCase().includes(search.toLowerCase())
  );

  // Company filter
  if (selectedCompany !== "All Companies") {
    filtered = filtered.filter(e => e.company === selectedCompany);
  }

  // Department filter
  if (selectedDept !== "All Departments") {
    filtered = filtered.filter(e => e.dept === selectedDept);
  }

  // Active tab filter based on employee category
  if (activeTab === "biometric") {
    filtered = filtered.filter(e => e.employeeCategory?.trim() === "Office Staff");
  } else if (activeTab === "field") {
    filtered = filtered.filter(e => e.employeeCategory?.trim() === "Field Staff");
  }

  // Selected Type filter based on employee category
  if (selectedType === "Biometric") {
    filtered = filtered.filter(e => e.employeeCategory?.trim() === "Office Staff");
  } else if (selectedType === "Field") {
    filtered = filtered.filter(e => e.employeeCategory?.trim() === "Field Staff");
  }


  const calculateStats = () => {
    let present = 0;
    let absent = 0;
    let onLeave = 0;

    filtered.forEach(emp => {
      const attendance = generateMonthlyAttendance(emp, selectedYear, selectedMonth);
      const summary = calcSummary(attendance);
      present += summary.P;
      absent += summary.A;
      onLeave += summary.CL;
    });

    return {
      totalEmployees: filtered.length,
      present,
      absent,
      onLeave,
      lateArrivals: Math.floor(Math.random() * 10),
      manualCorrections: manualCorrections.length
    };
  };

  const stats = calculateStats();
  const totalPages = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pageRows = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);
  const selEmp = employees[selectedEmp];
  const daysOfWeek = getDaysOfWeek(selectedYear, selectedMonth);
  const weekendCols = new Set(daysOfWeek.map((d, i) => (d === "Sat" || d === "Sun") ? i : -1).filter(i => i >= 0));

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight">Attendance Management (Monthly)</h1>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-medium">
              <span>📅</span> {getCurrentDate()}
            </div>
            
            <AttendanceExcel
              pageRows={pageRows}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              generateMonthlyAttendance={generateMonthlyAttendance}
              calcSummary={calcSummary}
              paidDays={paidDays}
              getMonthNumber={getMonthNumber}
              stats={stats}
            />

            <AttendancePDF
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              getCurrentDate={getCurrentDate}
              stats={stats}
              selectedCompany={selectedCompany}
              selectedDept={selectedDept}
              selectedType={selectedType}
              selectedStatus={selectedStatus}
              filtered={filtered}
              generateMonthlyAttendance={generateMonthlyAttendance}
              calcSummary={calcSummary}
              paidDays={paidDays}
              getMonthNumber={getMonthNumber}
            />
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* SUMMARY CARDS */}

          {/* FILTER BAR */}
          <AttendanceFilters
            search={search}
            setSearch={setSearch}
            setCurrentPage={setCurrentPage}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            companies={companies}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
          />

          {/* ATTENDANCE GRID + RIGHT PANEL */}
          <div className="flex gap-4">
            <AttendanceTable
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              daysOfWeek={daysOfWeek}
              weekendCols={weekendCols}
              pageRows={pageRows}
              generateMonthlyAttendance={generateMonthlyAttendance}
              calcSummary={calcSummary}
              expandedRow={expandedRow}
              setExpandedRow={setExpandedRow}
              setSelectedEmp={setSelectedEmp}
              employees={employees}
              leaveBalances={leaveBalances}
              MAX_CL_DAYS={MAX_CL_DAYS}
              editingCell={editingCell}
              setEditingCell={setEditingCell}
              editRemark={editRemark}
              setEditRemark={setEditRemark}
              editFilePreview={editFilePreview}
              setEditFilePreview={setEditFilePreview}
              setEditFile={setEditFile}
              isFutureDate={isFutureDate}
              updateAttendanceStatus={updateAttendanceStatus}
              handleFileUpload={handleFileUpload}
              biometricAttendance={biometricAttendance}
              fieldAttendance={fieldAttendance}
              setSelectedLeaveEmp={setSelectedLeaveEmp}
              setShowLeaveModal={setShowLeaveModal}
              setEditModalData={setEditModalData}
              setShowEditModal={setShowEditModal}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              filtered={filtered}
              ROWS_PER_PAGE={ROWS_PER_PAGE}
              paidDays={paidDays}
              getMonthNumber={getMonthNumber}
            />

            <EmployeeSummaryPanel
              selEmp={selEmp}
              selectedEmp={selectedEmp}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              generateMonthlyAttendance={generateMonthlyAttendance}
              calcSummary={calcSummary}
              paidDays={paidDays}
              leaveBalances={leaveBalances}
              MAX_CL_DAYS={MAX_CL_DAYS}
              setSelectedLeaveEmp={setSelectedLeaveEmp}
              setShowLeaveModal={setShowLeaveModal}
              biometricAttendance={biometricAttendance}
              fieldAttendance={fieldAttendance}
              setEditModalData={setEditModalData}
              setShowEditModal={setShowEditModal}
            />
          </div>

          {/* MANUAL CORRECTIONS + DATA SOURCE */}
          <RecentCorrections
            manualCorrections={manualCorrections}
            biometricAttendance={biometricAttendance}
            fieldAttendance={fieldAttendance}
            employees={employees}
          />
        </div>
      </main>

      {/* LEAVE MODAL */}
      <LeaveModal
        showLeaveModal={showLeaveModal}
        selectedLeaveEmp={selectedLeaveEmp}
        setShowLeaveModal={setShowLeaveModal}
        leaveType={leaveType}
        setLeaveType={setLeaveType}
        leaveDays={leaveDays}
        setLeaveDays={setLeaveDays}
        leaveReason={leaveReason}
        setLeaveReason={setLeaveReason}
        leaveBalances={leaveBalances}
        MAX_CL_DAYS={MAX_CL_DAYS}
        applyLeave={applyLeave}
      />

      {/* EDIT ATTENDANCE MODAL */}
      <EditAttendanceModal
        showEditModal={showEditModal}
        editModalData={editModalData}
        setShowEditModal={setShowEditModal}
        setEditModalData={setEditModalData}
        editRemark={editRemark}
        setEditRemark={setEditRemark}
        editFilePreview={editFilePreview}
        setEditFilePreview={setEditFilePreview}
        setEditFile={setEditFile}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        getMonthNumber={getMonthNumber}
        isFutureDate={isFutureDate}
        generateMonthlyAttendance={generateMonthlyAttendance}
        handleFileUpload={handleFileUpload}
        updateAttendanceStatus={updateAttendanceStatus}
      />
    </div>
  );
}