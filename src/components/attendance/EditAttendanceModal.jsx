import React from "react";

export default function EditAttendanceModal({
  showEditModal,
  editModalData,
  setShowEditModal,
  setEditModalData,
  editRemark,
  setEditRemark,
  editFilePreview,
  setEditFilePreview,
  setEditFile,
  selectedYear,
  selectedMonth,
  getMonthNumber,
  isFutureDate,
  generateMonthlyAttendance,
  handleFileUpload,
  updateAttendanceStatus
}) {
  if (!showEditModal || !editModalData.employee) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            Edit Attendance - {editModalData.employee.name}
          </h3>
          <button 
            onClick={() => {
              setShowEditModal(false);
              setEditModalData({ employee: null, date: null, currentStatus: null, dayIndex: null });
              setEditRemark("");
              setEditFile(null);
              setEditFilePreview(null);
            }} 
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Date</label>
            <select
              value={editModalData.date || ""}
              onChange={(e) => {
                const [year, month, day] = e.target.value.split("-");
                const dayIndex = parseInt(day) - 1;
                const attendanceArray = generateMonthlyAttendance(editModalData.employee, selectedYear, selectedMonth);
                setEditModalData({
                  ...editModalData,
                  date: e.target.value,
                  dayIndex: dayIndex,
                  currentStatus: attendanceArray[dayIndex]
                });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select a date</option>
              {Array.from({ length: new Date(parseInt(selectedYear), getMonthNumber(selectedMonth) + 1, 0).getDate() }, (_, i) => {
                const dateNum = i + 1;
                const dateStr = `${selectedYear}-${String(getMonthNumber(selectedMonth) + 1).padStart(2, "0")}-${String(dateNum).padStart(2, "0")}`;
                const isFuture = isFutureDate(selectedYear, selectedMonth, dateNum);
                const attendanceArray = generateMonthlyAttendance(editModalData.employee, selectedYear, selectedMonth);
                const status = attendanceArray[i];

                return (
                  <option key={dateStr} value={dateStr} disabled={isFuture}>
                    {dateStr} - Current: {status} {isFuture ? "(Future Date - Cannot Edit)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Current Status Display */}
          {editModalData.currentStatus && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-slate-700">Current Status:</p>
              <p className="text-lg font-bold mt-1">
                {editModalData.currentStatus === "P" ? "✅ Present" :
                  editModalData.currentStatus === "A" ? "❌ Absent" :
                    editModalData.currentStatus === "WO" ? "📅 Week Off" :
                      editModalData.currentStatus === "CL" ? "🌴 Casual Leave" : editModalData.currentStatus}
              </p>
            </div>
          )}

          {/* New Status Selection */}
          {editModalData.date && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Change To</label>
              <select
                id="newStatusSelect"
                defaultValue={editModalData.currentStatus || "P"}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="P">P (Present)</option>
                <option value="A">A (Absent)</option>
                <option value="HD">HD (Half Day)</option>
                <option value="CL">CL (Casual Leave)</option>
                <option value="LWP">LWP (Leave Without Pay)</option>
                <option value="WO">WO (Weekly Off)</option>
                <option value="H">H (Holiday)</option>
                <option value="PM">PM (Punch Missing)</option>
              </select>
            </div>
          )}

          {/* Remark Field */}
          <div>
            <label className="block text-sm font-medium text-red-600 mb-1">Remark *</label>
            <textarea
              value={editRemark}
              onChange={(e) => setEditRemark(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter reason for attendance correction..."
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Attachment (Optional)</label>
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.xlsx,.xls"
              className="w-full text-sm"
            />
            {editFilePreview && (
              <div className="mt-2">
                <img src={editFilePreview} alt="Preview" className="w-20 h-20 object-cover rounded border" />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={async () => {
                if (!editModalData.date) {
                  alert("Please select a date first!");
                  return;
                }
                if (!editRemark.trim()) {
                  alert("Remark is mandatory when editing attendance!");
                  return;
                }

                const newStatus = document.getElementById("newStatusSelect")?.value ||
                  (editModalData.currentStatus === "P" ? "A" : "P");

                await updateAttendanceStatus(editModalData.employee, editModalData.date, newStatus);
                setShowEditModal(false);
                setEditModalData({ employee: null, date: null, currentStatus: null, dayIndex: null });
              }}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditModalData({ employee: null, date: null, currentStatus: null, dayIndex: null });
                setEditRemark("");
                setEditFile(null);
                setEditFilePreview(null);
              }}
              className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
