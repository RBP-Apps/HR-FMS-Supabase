import React from "react";
import useAttendanceData from "../hooks/useAttendanceData";

// Sub-components
import AttendancePDF from "../components/attendance/AttendancePDF";
import AttendanceExcel from "../components/attendance/AttendanceExcel";
import LeaveModal from "../components/attendance/LeaveModal";
import EditAttendanceModal from "../components/attendance/EditAttendanceModal";
import AttendanceFilters from "../components/attendance/AttendanceFilters";
import AttendanceTable from "../components/attendance/AttendanceTable";
import EmployeeSummaryPanel from "../components/attendance/EmployeeSummaryPanel";
import RecentCorrections from "../components/attendance/RecentCorrections";
import DayDetailModal from "../components/attendance/DayDetailModal";
import LateApprovals from "../components/attendance/LateApprovals";
import SalaryDeductions from "../components/attendance/SalaryDeductions";
import LeaveLedgerDashboard from "../components/attendance/LeaveLedgerDashboard";
import HolidayManager from "../components/attendance/HolidayManager";
import FinalizationLogs from "../components/attendance/FinalizationLogs";
import HolidayModal from "../components/attendance/HolidayModal";
import AdjustmentModal from "../components/attendance/AdjustmentModal";
import BulkActionsPanel from "../components/attendance/BulkActionsPanel";

// Helper Functions
import {
  calcSummary,
  paidDays,
  getMonthNumber,
  getLateHistoryForEmp
} from "../utils/attendanceHelpers";

export default function HRMSAttendanceDashboard() {
  const attendanceData = useAttendanceData();

  const {
    employees,
    companies,
    biometricAttendance,
    fieldAttendance,
    loading,
    manualCorrections,
    lateApprovals,
    currentMainTab,
    setCurrentMainTab,
    holidays,
    leaveLedger,
    finalizationLogs,
    isFinalized,
    showHolidayModal,
    setShowHolidayModal,
    editingHoliday,
    setEditingHoliday,
    holidayForm,
    setHolidayForm,
    showAdjustModal,
    setShowAdjustModal,
    adjustForm,
    setAdjustForm,
    bulkAction,
    setBulkAction,
    showEditModal,
    setShowEditModal,
    editModalData,
    setEditModalData,
    showDayDetailModal,
    setShowDayDetailModal,
    dayDetailData,
    setDayDetailData,
    expandedRow,
    setExpandedRow,
    selectedEmp,
    setSelectedEmp,
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    activeTab,
    setActiveTab,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    selectedCompany,
    setSelectedCompany,
    selectedDept,
    setSelectedDept,
    selectedType,
    setSelectedType,
    selectedStatus,
    setSelectedStatus,
    editingCell,
    setEditingCell,
    editRemark,
    setEditRemark,
    editFilePreview,
    setEditFilePreview,
    setEditFile,
    leaveBalances,
    showLeaveModal,
    setShowLeaveModal,
    selectedLeaveEmp,
    setSelectedLeaveEmp,
    leaveType,
    setLeaveType,
    leaveDays,
    setLeaveDays,
    leaveReason,
    setLeaveReason,
    ROWS_PER_PAGE,
    MAX_CL_DAYS,
    getCurrentDate,
    applyLeave,
    isFutureDate,
    generateMonthlyAttendance,
    updateAttendanceStatus,
    handleFileUpload,
    handleApplyBulkAction,
    handleFinalizeAttendance,
    handleSaveHoliday,
    handleDeleteHoliday,
    handleAddAdjustment,
    filtered,
    stats,
    totalPages,
    pageRows,
    selEmp,
    daysOfWeek,
    weekendCols
  } = attendanceData;



  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight">Attendance Management (Monthly)</h1>
            <p className="text-xs text-slate-500 font-medium">Centralized Processing, Leaves and Ledger Administration</p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-medium">
              <span>📅</span> {getCurrentDate()}
            </div>

            {!loading && currentMainTab === "attendance" && (
              <>
                <AttendanceExcel
                  pageRows={pageRows}
                  selectedYear={selectedYear}
                  selectedMonth={selectedMonth}
                  generateMonthlyAttendance={generateMonthlyAttendance}
                  calcSummary={calcSummary}
                  paidDays={paidDays}
                  getMonthNumber={getMonthNumber}
                  stats={stats}
                  biometricAttendance={biometricAttendance}
                  fieldAttendance={fieldAttendance}
                  lateApprovals={lateApprovals}
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
                  biometricAttendance={biometricAttendance}
                  fieldAttendance={fieldAttendance}
                  lateApprovals={lateApprovals}
                />
              </>
            )}
          </div>
        </header>

        {/* TAB BAR */}
        <div className="bg-white border-b border-slate-100 px-6 flex shrink-0">
          {[
            { id: "attendance", label: "Attendance Grid", icon: "📅" },
            { id: "ledger", label: "Leave Ledger Dashboard", icon: "🌴" },
            { id: "holidays", label: "Holiday Manager", icon: "🎉" },
            { id: "logs", label: "Finalization Logs", icon: "🔒" },
            { id: "late_approvals", label: "Late Approvals", icon: "⏰" },
            { id: "salary_deductions", label: "Salary Deductions", icon: "💸" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentMainTab(tab.id)}
              className={`py-3.5 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${currentMainTab === tab.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="space-y-6 animate-pulse">
              {/* Skeleton Banner */}
              <div className="h-16 bg-slate-200/60 rounded-2xl w-full"></div>
              
              {/* Skeleton Filters */}
              <div className="h-14 bg-slate-200/60 rounded-2xl w-full"></div>
              
              {/* Skeleton Grid */}
              <div className="flex gap-4">
                {/* Table Skeleton */}
                <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="h-5 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-5 bg-slate-200 rounded w-1/12"></div>
                  </div>
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="flex space-x-4 items-center py-3 border-b border-slate-50 last:border-0">
                      <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-20"></div>
                      <div className="h-4 bg-slate-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>

                {/* Right Panel Skeleton */}
                <div className="w-80 bg-white border border-slate-100 rounded-2xl p-5 space-y-6 shrink-0 hidden lg:block shadow-sm">
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3 mx-auto"></div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: ATTENDANCE GRID */}
              {currentMainTab === "attendance" && (
                <>
                  {/* LOCKING STATUS BANNER */}
                  {isFinalized ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔒</span>
                        <div>
                          <h4 className="font-bold text-sm">Attendance Finalized & Locked</h4>
                          <p className="text-xs text-emerald-600">The attendance for {selectedMonth} {selectedYear} ({selectedCompany}) is locked and ready for payroll processing.</p>
                        </div>
                      </div>
                      <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold py-1 px-2.5 rounded-full">Finalized</span>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✍️</span>
                        <div>
                          <h4 className="font-bold text-sm">Attendance Draft (Unsubmitted)</h4>
                          <p className="text-xs text-amber-600">You are reviewing live punches & leave calculations. Click 'Submit & Finalize' to lock records.</p>
                        </div>
                      </div>
                      {selectedCompany !== "All Companies" ? (
                        <button
                          onClick={handleFinalizeAttendance}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all"
                        >
                          🔒 Submit & Finalize
                        </button>
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold italic">Select a specific company to finalize</span>
                      )}
                    </div>
                  )}

                  {/* BULK ACTIONS PANEL (DRAFT ONLY) */}
                  <BulkActionsPanel
                    isFinalized={isFinalized}
                    bulkAction={bulkAction}
                    setBulkAction={setBulkAction}
                    handleApplyBulkAction={handleApplyBulkAction}
                    filteredEmployees={filtered}
                    loading={loading}
                  />

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
                      lateApprovals={lateApprovals}
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
                      setShowDayDetailModal={setShowDayDetailModal}
                      setDayDetailData={setDayDetailData}
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
                      lateApprovals={lateApprovals}
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
                </>
              )}

              {/* TAB 2: LEAVE LEDGER DASHBOARD */}
              {currentMainTab === "ledger" && (
                <LeaveLedgerDashboard
                  filtered={filtered}
                  leaveBalances={leaveBalances}
                  leaveLedger={leaveLedger}
                  employees={employees}
                  setShowAdjustModal={setShowAdjustModal}
                />
              )}

              {/* TAB 3: HOLIDAY MANAGER */}
              {currentMainTab === "holidays" && (
                <HolidayManager
                  holidays={holidays}
                  setEditingHoliday={setEditingHoliday}
                  setHolidayForm={setHolidayForm}
                  setShowHolidayModal={setShowHolidayModal}
                  handleDeleteHoliday={handleDeleteHoliday}
                />
              )}

              {/* TAB 4: FINALIZATION LOGS */}
              {currentMainTab === "logs" && (
                <FinalizationLogs finalizationLogs={finalizationLogs} />
              )}

              {/* TAB 5: LATE ATTENDANCE APPROVALS */}
              {currentMainTab === "late_approvals" && (
                <LateApprovals employees={employees} />
              )}

              {/* TAB 6: SALARY DEDUCTIONS */}
              {currentMainTab === "salary_deductions" && (
                <SalaryDeductions employees={employees} />
              )}
            </>
          )}
        </div>
      </main>

      {/* HOLIDAY MODAL */}
      <HolidayModal
        showHolidayModal={showHolidayModal}
        setShowHolidayModal={setShowHolidayModal}
        editingHoliday={editingHoliday}
        holidayForm={holidayForm}
        setHolidayForm={setHolidayForm}
        handleSaveHoliday={handleSaveHoliday}
      />

      {/* ADJUSTMENT MODAL */}
      <AdjustmentModal
        showAdjustModal={showAdjustModal}
        setShowAdjustModal={setShowAdjustModal}
        adjustForm={adjustForm}
        setAdjustForm={setAdjustForm}
        employees={employees}
        handleAddAdjustment={handleAddAdjustment}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />

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

      {/* DAY DETAIL MODAL */}
      <DayDetailModal
        show={showDayDetailModal}
        onClose={() => {
          setShowDayDetailModal(false);
          setDayDetailData({ employee: null, date: null, status: null });
        }}
        employee={dayDetailData.employee}
        date={dayDetailData.date}
        status={dayDetailData.status}
        biometricAttendance={biometricAttendance}
        fieldAttendance={fieldAttendance}
        onEdit={(emp, date, currentStatus) => {
          const [year, month, day] = date.split("-");
          const dayIndex = parseInt(day) - 1;
          setEditModalData({
            employee: emp,
            date: date,
            currentStatus: currentStatus,
            dayIndex: dayIndex
          });
          setShowEditModal(true);
        }}
      />
    </div>
  );
}