import React, { useState, useEffect } from 'react';
import { Search, X, Check, Clock, Calendar, Plus, Paperclip, Send, UserCheck, UserX, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import supabase from '../utils/supabase';
import { Tabs, Table, Button, Input, Space, Tag, Pagination, Select, Badge } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const ApprovalManagement = () => {
  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState('leave');
  const [activeSubTab, setActiveSubTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [editableDates, setEditableDates] = useState({ from: '', to: '' });

  // Leave states
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [rejectedLeaves, setRejectedLeaves] = useState([]);

  // Attendance states
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [approvedAttendance, setApprovedAttendance] = useState([]);
  const [rejectedAttendance, setRejectedAttendance] = useState([]);

  // Resignation states
  const [pendingResignations, setPendingResignations] = useState([]);
  const [approvedResignations, setApprovedResignations] = useState([]);
  const [rejectedResignations, setRejectedResignations] = useState([]);
  const [showResignationModal, setShowResignationModal] = useState(false);



const [resignationFormData, setResignationFormData] = useState({
  employee_id: "",
  name: "",
  reason_of_leaving: "",
  mobile_number: "",
  firm_name: "",
  father_name: "",
  date_of_joining: "",
  work_location: "",
  designation: "",
  department: "",
});
const [resignationEmployeeOptions, setResignationEmployeeOptions] = useState([]);
const [resignationSubmitting, setResignationSubmitting] = useState(false);
const [resignationFetching, setResignationFetching] = useState(false);

  // Resignation approval modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [lastWorkingDate, setLastWorkingDate] = useState('');
  const [fnfDate, setFnfDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Support document preview state
  const [previewImage, setPreviewImage] = useState(null);

  // HOD names for leave
  const [hodNames, setHodNames] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state (keeping your existing logic)
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    designation: '',
    hodName: '',
    leaveType: '',
    fromDate: '',
    toDate: '',
    reason: '',
    supportDocument: null // Add this field
  });

  // Fetch HOD names (your existing logic)
  const fetchHodNames = async () => {
    try {
      const { data, error } = await supabase
        .from('master_hr')
        .select('hod_name')
        .order('hod_name', { ascending: true });

      if (error) throw error;

      const hodData = data?.map(row => row.hod_name?.toString().trim()).filter(name => name) || [];
      setHodNames([...new Set(hodData)]);
    } catch (error) {
      console.error('Error fetching HOD data:', error);
      toast.error(`Failed to load HOD data: ${error.message}`);
      setHodNames(['Deepak', 'Vikas', 'Dharam', 'Pratap', 'Aubhav']);
    }
  };

  // Your existing fetchLeaveData function
  const fetchLeaveData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('emp_leaving_holiday')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const processedData = (data || []).map(row => ({
        timestamp: row.created_at || '',
        serialNo: row.id,
        employeeId: row.employee_id || '',
        employeeName: row.employee_name || '',
        startDate: row.from_date || '',
        endDate: row.to_date || '',
        remark: row.reason || '',
        days: row.total_days || calculateDays(row.from_date, row.to_date),
        status: row.status,
        leaveType: row.leave_category,
        hodName: row.hod_name || '',
        supportDocument: row.support_document || '',
        key: row.id // For Ant Design Table
      }));

      

      setPendingLeaves(processedData.filter(leave =>
        leave.status?.toString().toLowerCase() === 'pending'
      ));
      setApprovedLeaves(processedData.filter(leave =>
        leave.status?.toString().toLowerCase() === 'approved'
      ));
      setRejectedLeaves(processedData.filter(leave =>
        leave.status?.toString().toLowerCase() === 'rejected'
      ));

    } catch (error) {
      console.error('Error fetching leave data:', error);
      setError(error.message);
      toast.error(`Failed to load leave data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };


  const fetchAttendanceData = async () => {

    const { data, error } = await supabase
      .from("offline_biometric_punch")
      .select("*")
      .not("approval_status", "is", null);

    if (error) {
      console.log(error);
      return;
    }

    const processedData = (data || []).map(row => ({
      ...row,

      key: row.id,
      serialNo: row.id,

      employeeId: row.employee_id,
      employeeName: row.employee_name,

      date: row.attendance_date,

      checkIn: row.in_time,
      checkOut: row.out_time,

      requestedIn: row.requested_in_time,
      requestedOut: row.requested_out_time,

      remark: row.correction_remark
    }));

    const uniqueData = Object.values(
  processedData.reduce((acc, item) => {
    const key = `${item.employeeId}_${item.date}`;
    acc[key] = item;
    return acc;
  }, {})
);

    setPendingAttendance(
  uniqueData.filter(x => x.approval_status === "pending")
);

setApprovedAttendance(
  uniqueData.filter(x => x.approval_status === "approved")
);

setRejectedAttendance(
  uniqueData.filter(x => x.approval_status === "rejected")
);
  };


  // Fetch resignation data from database
  const fetchResignationData = async () => {
    setLoading(true);
    setTableLoading(true);
    setError(null);

    try {
      const { data: leavingData, error: fetchError } = await supabase
        .from('employee_leaving')
        .select('*')
        .order('timestamp', { ascending: false });

      if (fetchError) throw fetchError;

      const processedData = (leavingData || []).map((record) => ({
        serialNo: record.id,
        key: record.id,
        employeeId: record.employee_id || '',
        employeeName: record.name || '',
        resignationDate: record.date_of_leaving || '',
        lastWorkingDay: record.last_working_date || '',
        fnfDate: record.fnf_date || '',
        mobileNumber: record.mobile_number || '',
        reason: record.reason_of_leaving || '',
        firmName: record.firm_name || '',
        fatherName: record.father_name || '',
        dateOfJoining: record.date_of_joining || '',
        workLocation: record.work_location || '',
        designation: record.designation || '',
        department: record.department || '',
        status: record.resignation_acceptance ? 'approved' : 'pending',
      }));

      setPendingResignations(processedData.filter(item =>
        item.status === 'pending'
      ));
      setApprovedResignations(processedData.filter(item =>
        item.status === 'approved'
      ));
      setRejectedResignations([]);

    } catch (error) {
      console.error('Error fetching resignation data:', error);
      setError(error.message);
      toast.error(`Failed to load resignation data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  // Calculate days (your existing function)
  const calculateDays = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;
    let startDate, endDate;

    if (startDateStr.includes('/')) {
      const [startDay, startMonth, startYear] = startDateStr.split('/').map(Number);
      startDate = new Date(startYear, startMonth - 1, startDay);
    } else if (startDateStr.includes('-')) {
      const [year, month, day] = startDateStr.split('-').map(Number);
      startDate = new Date(year, month - 1, day);
    } else {
      startDate = new Date(startDateStr);
    }

    if (endDateStr.includes('/')) {
      const [endDay, endMonth, endYear] = endDateStr.split('/').map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay);
    } else if (endDateStr.includes('-')) {
      const [year, month, day] = endDateStr.split('-').map(Number);
      endDate = new Date(year, month - 1, day);
    } else {
      endDate = new Date(endDateStr);
    }

    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  // Handle leave action (your existing logic)
  const handleLeaveAction = async (action) => {
    if (!selectedRow) {
      toast.error('Please select a leave request');
      return;
    }

    setActionInProgress(action);
    setLoading(true);

    try {
      const updateData = {
        status: action === 'accept' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      };

      const fromDate = editableDates.from || selectedRow.startDate;
      const toDate = editableDates.to || selectedRow.endDate;

      if (editableDates.from && editableDates.from !== selectedRow.startDate) {
        updateData.from_date = editableDates.from;
      }

      if (editableDates.to && editableDates.to !== selectedRow.endDate) {
        updateData.to_date = editableDates.to;
      }

      const { error: updateError } = await supabase
        .from('emp_leaving_holiday')
        .update(updateData)
        .eq('id', selectedRow.serialNo);

      if (updateError) throw updateError;

      // Connect with leave ledger: Insert a DEBIT entry on approval
      if (action === 'accept') {
        const { data: empData, error: empError } = await supabase
          .from('joining')
          .select('id')
          .eq('rbp_joining_id', selectedRow.employeeId)
          .maybeSingle();

        if (empError) throw empError;

        if (empData) {
          const daysNum = calculateDays(fromDate, toDate);
          let leaveAbbr = 'CL';
          if (selectedRow.leaveType === 'Earned Leave' || selectedRow.leaveType === 'EL') {
            leaveAbbr = 'EL';
          }

          const { error: ledgerError } = await supabase
            .from('leave_ledger')
            .insert({
              employee_id: empData.id,
              ledger_date: fromDate || new Date().toISOString().split('T')[0],
              leave_type: leaveAbbr,
              transaction_type: 'DEBIT',
              earned: 0,
              used: Number(daysNum || 1),
              remarks: `Approved Leave: ${selectedRow.leaveType} from ${formatDate(fromDate)} to ${formatDate(toDate)} (Request ID: ${selectedRow.serialNo})`
            });

          if (ledgerError) throw ledgerError;
        }
      }

      toast.success(`Leave ${action === 'accept' ? 'approved' : 'rejected'} for ${selectedRow.employeeName || 'employee'}`);
      fetchLeaveData();
      setSelectedRow(null);
      setEditableDates({ from: '', to: '' });
    } catch (error) {
      console.error('Update error:', error);
      toast.error(`Failed to ${action} leave: ${error.message}`);
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };

  // Handle attendance action
  const handleAttendanceAction = async (action, record) => {
    setActionInProgress(action);
    setLoading(true);

    try {

      if (action === "accept") {

        const { error } = await supabase
          .from("offline_biometric_punch")
          .update({
            in_time: record.requested_in_time,
            out_time: record.requested_out_time,
            approval_status: "approved"
          })
          .eq("id", record.id);

        if (error) throw error;

        toast.success("Attendance Approved");
      }

      if (action === "rejected") {

        const { error } = await supabase
          .from("offline_biometric_punch")
          .update({
            approval_status: "rejected"
          })
          .eq("id", record.id);

        if (error) throw error;

        toast.success("Attendance Rejected");
      }

      fetchAttendanceData();

    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
      setActionInProgress(null);
    }
  };


  // Handle resignation action
  const handleResignationAction = async (action, record) => {
    if (action === 'accept') {
      setSelectedRowId(record.serialNo);
      setLastWorkingDate('');
      setFnfDate('');
      setShowApproveModal(true);
    } else {
      toast.error('Rejection is not supported for resignation approval');
    }
  };

  // Confirm Resignation Approval
  const confirmResignationApprove = async () => {
    if (!lastWorkingDate || !fnfDate) {
      toast.error("Please fill both Last Working Date and F & F Date.");
      return;
    }

    try {
      setIsSubmitting(true);
      setActionInProgress('accept');

      const { error: updateError } = await supabase
        .from('employee_leaving')
        .update({
          resignation_acceptance: true,
          last_working_date: lastWorkingDate,
          fnf_date: fnfDate,
          actual: lastWorkingDate
        })
        .eq('id', selectedRowId);

      if (updateError) throw updateError;

      const currentRow = pendingResignations.find((row) => row.serialNo === selectedRowId);

      if (currentRow && currentRow.employeeId) {
        const { error: joiningError } = await supabase
          .from('joining')
          .update({
            status: 'Inactive',
            leaving_date: lastWorkingDate
          })
          .eq('rbp_joining_id', currentRow.employeeId);

        if (joiningError) throw joiningError;
      }

      toast.success("Successfully approved!");
      setShowApproveModal(false);
      fetchResignationData();
    } catch (err) {
      console.error("Error approving resignation:", err);
      toast.error("Failed to approve resignation: " + err.message);
    } finally {
      setIsSubmitting(false);
      setActionInProgress(null);
      setSelectedRowId(null);
    }
  };

  // Sync approved leaves to leave_ledger automatically
  const syncApprovedLeavesToLedger = async () => {
    try {
      const { data: approvedLeaves, error: leavesError } = await supabase
        .from('emp_leaving_holiday')
        .select('*')
        .eq('status', 'approved');

      if (leavesError) throw leavesError;
      if (!approvedLeaves || approvedLeaves.length === 0) return;

      const { data: ledgerEntries, error: ledgerError } = await supabase
        .from('leave_ledger')
        .select('remarks')
        .eq('transaction_type', 'DEBIT');

      if (ledgerError && !ledgerError.message?.includes("does not exist")) {
        throw ledgerError;
      }

      const existingRemarks = (ledgerEntries || []).map(entry => entry.remarks || '');

      const { data: employeesData, error: empError } = await supabase
        .from('joining')
        .select('id, rbp_joining_id');

      if (empError) throw empError;

      const empMap = {};
      (employeesData || []).forEach(emp => {
        if (emp.rbp_joining_id) {
          empMap[emp.rbp_joining_id] = emp.id;
        }
      });

      const missingEntries = [];

      for (const leave of approvedLeaves) {
        const expectedRemarkMarker = `(Request ID: ${leave.id})`;
        const alreadyExists = existingRemarks.some(rem => rem.includes(expectedRemarkMarker));

        if (!alreadyExists) {
          const numericEmpId = empMap[leave.employee_id];
          if (numericEmpId) {
            let leaveAbbr = 'CL';
            if (leave.leave_category === 'Earned Leave' || leave.leave_category === 'EL') {
              leaveAbbr = 'EL';
            }

            missingEntries.push({
              employee_id: numericEmpId,
              ledger_date: leave.from_date || new Date().toISOString().split('T')[0],
              leave_type: leaveAbbr,
              transaction_type: 'DEBIT',
              earned: 0,
              used: Number(leave.total_days || 1),
              remarks: `Approved Leave: ${leave.leave_category} from ${formatDate(leave.from_date)} to ${formatDate(leave.to_date)} ${expectedRemarkMarker}`
            });
          }
        }
      }

      if (missingEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('leave_ledger')
          .insert(missingEntries);

        if (insertError) {
          console.error("Error auto-syncing approved leaves to ledger:", insertError);
        } else {
          console.log(`Auto-synced ${missingEntries.length} approved leaves to leave_ledger.`);
        }
      }
    } catch (err) {
      console.error("Error in syncApprovedLeavesToLedger:", err);
    }
  };

  // Fetch employees (your existing logic)
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('joining')
        .select('rbp_joining_id, name_as_per_aadhar, designation')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const employeeData = (data || []).map(emp => ({
        id: emp.rbp_joining_id || '',
        name: emp.name_as_per_aadhar || '',
        designation: emp.designation || '',
      })).filter(emp => emp.name && emp.id);

      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error(`Failed to load employee data: ${error.message}`);
    }
  };

  // Handle checkbox change (your existing logic)
  const handleCheckboxChange = (leaveId, rowData) => {
    if (selectedRow?.serialNo === leaveId) {
      setSelectedRow(null);
      setEditableDates({ from: '', to: '' });
    } else {
      const formatForInput = (dateStr) => {
        if (!dateStr) return '';
        if (dateStr.includes('-')) return dateStr;
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };

      setSelectedRow(rowData);
      setEditableDates({
        from: formatForInput(rowData.startDate),
        to: formatForInput(rowData.endDate)
      });
    }
  };

  // Handle employee change (your existing logic)
  const handleEmployeeChange = (selectedName) => {
    const selectedEmployee = employees.find(emp => emp.name === selectedName);
    setFormData(prev => ({
      ...prev,
      employeeName: selectedName,
      employeeId: selectedEmployee ? selectedEmployee.id : '',
      designation: selectedEmployee ? selectedEmployee.designation : ''
    }));
  };

  // Handle form input (your existing logic)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'employeeName') {
      handleEmployeeChange(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeName || !formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason || !formData.hodName) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);

      // Upload file if selected
      let fileUrl = null;
      if (formData.supportDocument) {
        const file = formData.supportDocument;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${formData.employeeId}_leave.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('emp_leave_img')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('emp_leave_img')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from('emp_leaving_holiday')
        .insert([{
          employee_name: formData.employeeName,
          employee_id: formData.employeeId,
          designation: formData.designation,
          hod_name: formData.hodName,
          from_date: formData.fromDate,
          to_date: formData.toDate,
          reason: formData.reason,
          leave_category: formData.leaveType,
          support_document: fileUrl, // Store the URL
          status: 'Pending'
        }]);

      if (insertError) throw insertError;

      toast.success('Leave Request submitted successfully!');
      setFormData({
        employeeId: '',
        employeeName: '',
        designation: '',
        hodName: '',
        leaveType: '',
        fromDate: '',
        toDate: '',
        reason: '',
        supportDocument: null
      });
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = null;
      setShowModal(false);
      fetchLeaveData();
    } catch (error) {
      console.error('Insert error:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

  // Add this function to handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (optional)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image or PDF file');
        e.target.value = null;
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        e.target.value = null;
        return;
      }

      setFormData(prev => ({
        ...prev,
        supportDocument: file
      }));
    }
  };

  // Leave types
  const leaveTypes = ['Casual Leave'];

  // Filter functions
  const getFilteredData = (data, searchTerm) => {
    if (!searchTerm) return data;
    return data.filter(item =>
    (item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Main tab change handler
  const handleMainTabChange = (key) => {
    setActiveMainTab(key);
    setActiveSubTab('pending');
    setSelectedRow(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Sub tab change handler
  const handleSubTabChange = (key) => {
    setActiveSubTab(key);
    setSelectedRow(null);
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Get current data based on main tab and sub tab
  const getCurrentData = () => {
    const dataMap = {
      leave: {
        pending: pendingLeaves,
        approved: approvedLeaves,
        rejected: rejectedLeaves
      },
      attendance: {
        pending: pendingAttendance,
        approved: approvedAttendance,
        rejected: rejectedAttendance
      },
      resignation: {
        pending: pendingResignations,
        approved: approvedResignations,
        rejected: rejectedResignations
      }
    };

    return dataMap[activeMainTab]?.[activeSubTab] || [];
  };

  // Render action buttons
  const renderActionButtons = (record, type) => {
    const isSelected = selectedRow?.serialNo === record.serialNo || selectedRowId === record.serialNo;
    const isPending = activeSubTab === 'pending';

    if (!isPending) return null;

    const handleAccept = () => {
      if (type === 'leave') {
        handleLeaveAction('accept');
      } else if (type === 'attendance') {
        handleAttendanceAction('accept', record);
      } else {
        handleResignationAction('accept', record);
      }
    };

    const handleReject = () => {
      if (type === 'leave') {
        handleLeaveAction('rejected');
      } else if (type === 'attendance') {
        handleAttendanceAction('rejected', record);
      } else {
        handleResignationAction('rejected', record);
      }
    };

    return (
      <Space>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleAccept}
          loading={actionInProgress === 'accept' && isSelected}
          disabled={actionInProgress === 'rejected' || loading}
          size="small"
        >
          Approve
        </Button>
        {type !== 'resignation' && (
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={handleReject}
            loading={actionInProgress === 'rejected' && isSelected}
            disabled={actionInProgress === 'accept' || loading}
            size="small"
          >
            Reject
          </Button>
        )}
      </Space>
    );
  };

  // Get table columns based on main tab
  const getTableColumns = () => {
    const baseColumns = [
      {
        title: 'Employee ID',
        dataIndex: 'employeeId',
        key: 'employeeId',
        width: 120,
        render: (text) => <Tag color="blue">{text}</Tag>
      },
      {
        title: 'Employee Name',
        dataIndex: 'employeeName',
        key: 'employeeName',
        width: 150
      },
    ];

    const leaveColumns = [
      ...baseColumns,
      {
        title: 'From Date',
        dataIndex: 'startDate',
        key: 'startDate',
        width: 120,
        render: (text, record) => {
          if (selectedRow?.serialNo === record.serialNo && activeSubTab === 'pending') {
            return (
              <input
                type="date"
                value={editableDates.from}
                onChange={(e) => setEditableDates(prev => ({ ...prev, from: e.target.value }))}
                className="border rounded p-1 text-sm w-full"
              />
            );
          }
          return formatDate(text);
        }
      },
      {
        title: 'To Date',
        dataIndex: 'endDate',
        key: 'endDate',
        width: 120,
        render: (text, record) => {
          if (selectedRow?.serialNo === record.serialNo && activeSubTab === 'pending') {
            return (
              <input
                type="date"
                value={editableDates.to}
                onChange={(e) => setEditableDates(prev => ({ ...prev, to: e.target.value }))}
                className="border rounded p-1 text-sm w-full"
              />
            );
          }
          return formatDate(text);
        }
      },
      {
        title: 'Days',
        dataIndex: 'days',
        key: 'days',
        width: 80,
        render: (text, record) => {
          if (selectedRow?.serialNo === record.serialNo && activeSubTab === 'pending') {
            return calculateDays(editableDates.from, editableDates.to);
          }
          return text;
        }
      },
      {
        title: 'Leave Type',
        dataIndex: 'leaveType',
        key: 'leaveType',
        width: 120,
        render: (text) => <Tag color="purple">{text}</Tag>
      },
      {
        title: 'HOD',
        dataIndex: 'hodName',
        key: 'hodName',
        width: 120,
        render: (text) => <Tag color="orange">{text}</Tag>
      },
      {
        title: 'Support Document',
        dataIndex: 'supportDocument',
        key: 'supportDocument',
        width: 150,
        render: (text) => {
          if (!text) return '-';
          const isPdf = text.toLowerCase().split('?')[0].endsWith('.pdf');
          if (isPdf) {
            return (
              <a
                href={text}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all"
              >
                <Paperclip className="h-3 w-3" />
                View PDF
              </a>
            );
          }
          return (
            <button
              onClick={() => setPreviewImage(text)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-all cursor-pointer"
            >
              <Paperclip className="h-3 w-3" />
              View Image
            </button>
          );
        }
      },
      {
        title: 'Reason',
        dataIndex: 'remark',
        key: 'remark',
        width: 150,
        ellipsis: true
      }
    ];

    const attendanceColumns = [
      ...baseColumns,
      {
        title: 'Date',
        dataIndex: 'date',
        key: 'date',
        width: 120,
        render: (text) => formatDate(text)
      },



      {
        title: 'Current In',
        dataIndex: 'checkIn',
      },

      {
        title: 'Requested In',
        dataIndex: 'requestedIn',
      },

      {
        title: 'Current Out',
        dataIndex: 'checkOut',
      },

      {
        title: 'Requested Out',
        dataIndex: 'requestedOut',
      },

      {
        title: 'Remark',
        dataIndex: 'remark',
      },
    ];

    const resignationColumns = [
      ...baseColumns,
      {
        title: 'Designation',
        dataIndex: 'designation',
        key: 'designation',
        width: 120,
        render: (text) => text ? <Tag color="blue">{text}</Tag> : '-'
      },
      {
        title: 'Department',
        dataIndex: 'department',
        key: 'department',
        width: 120,
        render: (text) => text ? <Tag color="cyan">{text}</Tag> : '-'
      },
      {
        title: 'Resignation Date',
        dataIndex: 'resignationDate',
        key: 'resignationDate',
        width: 120,
        render: (text) => formatDate(text)
      },
      {
        title: 'Last Working Day',
        dataIndex: 'lastWorkingDay',
        key: 'lastWorkingDay',
        width: 120,
        render: (text) => formatDate(text)
      },
      {
        title: 'F & F Date',
        dataIndex: 'fnfDate',
        key: 'fnfDate',
        width: 120,
        render: (text) => formatDate(text)
      },
      {
        title: 'Mobile Number',
        dataIndex: 'mobileNumber',
        key: 'mobileNumber',
        width: 120
      },
      {
        title: 'Reason',
        dataIndex: 'reason',
        key: 'reason',
        width: 150,
        ellipsis: true
      },
      {
        title: 'Firm Name',
        dataIndex: 'firmName',
        key: 'firmName',
        width: 120
      },
      {
        title: 'Father Name',
        dataIndex: 'fatherName',
        key: 'fatherName',
        width: 120
      },
      {
        title: 'Date Of Joining',
        dataIndex: 'dateOfJoining',
        key: 'dateOfJoining',
        width: 120,
        render: (text) => formatDate(text)
      },
      {
        title: 'Work Location',
        dataIndex: 'workLocation',
        key: 'workLocation',
        width: 120
      }
    ];

    const columnsMap = {
      leave: leaveColumns,
      attendance: attendanceColumns,
      resignation: resignationColumns
    };

    const columns = columnsMap[activeMainTab] || leaveColumns;

    // Add selection and action columns for pending tab
    if (activeSubTab === 'pending') {
      return [
        {
          title: 'Select',
          key: 'select',
          width: 60,
          render: (_, record) => (
            <input
              type="checkbox"
              checked={selectedRow?.serialNo === record.serialNo}
              onChange={() => handleCheckboxChange(record.serialNo, record)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
          )
        },
        ...columns,
        {
          title: 'Actions',
          key: 'actions',
          width: 200,
          render: (_, record) => renderActionButtons(record, activeMainTab)
        }
      ];
    }

    return columns;
  };

  // Fetch employees for resignation form
const fetchResignationEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from("joining")
      .select("rbp_joining_id, name_as_per_aadhar, mobile_number, firm_name, father_name, date_of_joining, work_location, designation, department")
      .eq("status", "Active");

    if (!error && data) {
      setResignationEmployeeOptions(data);
    }
  } catch (error) {
    console.error('Error fetching employees for resignation:', error);
  }
};

  // Handle pagination change
  const handlePaginationChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
  };

  // Get filtered data
  const getFilteredDataForTab = () => {
    const currentData = getCurrentData();
    return getFilteredData(currentData, searchTerm);
  };

 // Handle resignation employee name selection
const handleResignationNameSelect = async (selectedName) => {
  if (!selectedName) return;

  const selectedEmp = resignationEmployeeOptions.find(
    (emp) => emp.name_as_per_aadhar === selectedName
  );

  if (!selectedEmp) {
    toast.error("Employee not found");
    return;
  }

  try {
    setResignationFetching(true);

    const { data, error } = await supabase
      .from("joining")
      .select("*")
      .eq("rbp_joining_id", selectedEmp.rbp_joining_id)
      .maybeSingle();

    if (error || !data) {
      toast.error("Employee details not found");
      return;
    }

    if (data.status === "Inactive") {
      toast.error("This employee is already inactive");
      setResignationFormData(prev => ({ ...prev, name: selectedName }));
      return;
    }

    setResignationFormData({
      employee_id: data.rbp_joining_id || "",
      name: data.name_as_per_aadhar || "",
      mobile_number: data.mobile_number || "",
      firm_name: data.firm_name || "",
      father_name: data.father_name || "",
      date_of_joining: data.date_of_joining || "",
      work_location: data.work_location || "",
      designation: data.designation || "",
      department: data.department || "",
      reason_of_leaving: resignationFormData.reason_of_leaving || "",
    });
  } catch (err) {
    toast.error("Fetch failed: " + err.message);
  } finally {
    setResignationFetching(false);
  }
};

// Handle resignation form change
const handleResignationChange = (e) => {
  const { name, value } = e.target;
  setResignationFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

// Handle resignation form submit
const handleResignationSubmit = async (e) => {
  e.preventDefault();

  if (!resignationFormData.employee_id || !resignationFormData.name || !resignationFormData.reason_of_leaving) {
    toast.error("Employee Name and Reason of Leaving are required");
    return;
  }

  try {
    setResignationSubmitting(true);

    const { error } = await supabase.from("employee_leaving").insert([
      {
        employee_id: resignationFormData.employee_id,
        name: resignationFormData.name,
        reason_of_leaving: resignationFormData.reason_of_leaving,
        mobile_number: resignationFormData.mobile_number,
        firm_name: resignationFormData.firm_name,
        father_name: resignationFormData.father_name,
        date_of_joining: resignationFormData.date_of_joining,
        work_location: resignationFormData.work_location,
        designation: resignationFormData.designation,
        department: resignationFormData.department,
        date_of_leaving: new Date().toISOString().split("T")[0],
        resignation_acceptance: false,
      },
    ]);

    if (error) throw error;

    toast.success("Resignation application submitted successfully!");
    setShowResignationModal(false);
    setResignationFormData({
      employee_id: "",
      name: "",
      reason_of_leaving: "",
      mobile_number: "",
      firm_name: "",
      father_name: "",
      date_of_joining: "",
      work_location: "",
      designation: "",
      department: "",
    });
    fetchResignationData();
  } catch (err) {
    toast.error(err.message || "Something went wrong");
  } finally {
    setResignationSubmitting(false);
  }
};

  // Fetch data on tab change
  useEffect(() => {
    if (activeMainTab === 'leave') {
      fetchLeaveData();
    } else if (activeMainTab === 'attendance') {
      fetchAttendanceData();
    } else if (activeMainTab === 'resignation') {
      fetchResignationData();
    }
  }, [activeMainTab]);

  useEffect(() => {
    fetchEmployees();
    fetchHodNames();
    fetchResignationEmployees();
    syncApprovedLeavesToLedger();
  }, []);

  // Get record count for sub tabs
  const getSubTabCount = (tabKey) => {
    const dataMap = {
      leave: {
        pending: pendingLeaves.length,
        approved: approvedLeaves.length,
        rejected: rejectedLeaves.length
      },
      attendance: {
        pending: pendingAttendance.length,
        approved: approvedAttendance.length,
        rejected: rejectedAttendance.length
      },
      resignation: {
        pending: pendingResignations.length,
        approved: approvedResignations.length,
        rejected: rejectedResignations.length
      }
    };
    return dataMap[activeMainTab]?.[tabKey] || 0;
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">Approval Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage leave, attendance, and resignation approvals</p>
        </div>
        {activeMainTab === 'leave' && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            New Leave Request
          </Button>
        )}
     {activeMainTab === 'resignation' && (
  <Button
    type="primary"
    icon={<Plus size={16} />}
    onClick={() => setShowResignationModal(true)}
    className="bg-red-600 hover:bg-red-700"
  >
    New Resignation Request
  </Button>
)}
      </div>

      {/* Main Tabs */}
      <Tabs
        activeKey={activeMainTab}
        onChange={handleMainTabChange}
        size="large"
        className="bg-white rounded-lg shadow-sm p-4"
        tabBarStyle={{ marginBottom: 24 }}
      >
        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <FileTextOutlined />
              Leave Approval
              <Badge count={getSubTabCount('pending')} offset={[10, 0]} />
            </span>
          }
          key="leave"
        >
          {/* Sub Tabs for Leave */}
          <Tabs
            activeKey={activeSubTab}
            onChange={handleSubTabChange}
            size="small"
            className="mt-4"
          >
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-yellow-500" />
                  Pending ({pendingLeaves.length})
                </span>
              }
              key="pending"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="pending"
              />
            </TabPane>
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-500" />
                  Approved ({approvedLeaves.length})
                </span>
              }
              key="approved"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="approved"
              />
            </TabPane>
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <CloseCircleOutlined className="text-red-500" />
                  Rejected ({rejectedLeaves.length})
                </span>
              }
              key="rejected"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="rejected"
              />
            </TabPane>
          </Tabs>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <UserOutlined />
              Attendance Approval
              <Badge count={getSubTabCount('pending')} offset={[10, 0]} />
            </span>
          }
          key="attendance"
        >
          <Tabs
            activeKey={activeSubTab}
            onChange={handleSubTabChange}
            size="small"
            className="mt-4"
          >
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-yellow-500" />
                  Pending ({pendingAttendance.length})
                </span>
              }
              key="pending"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="pending"
              />
            </TabPane>
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-500" />
                  Approved ({approvedAttendance.length})
                </span>
              }
              key="approved"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="approved"
              />
            </TabPane>
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <CloseCircleOutlined className="text-red-500" />
                  Rejected ({rejectedAttendance.length})
                </span>
              }
              key="rejected"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="rejected"
              />
            </TabPane>
          </Tabs>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2">
              <UserX />
              Resignation Approval
              <Badge count={getSubTabCount('pending')} offset={[10, 0]} />
            </span>
          }
          key="resignation"
        >
          <Tabs
            activeKey={activeSubTab}
            onChange={handleSubTabChange}
            size="small"
            className="mt-4"
          >
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-yellow-500" />
                  Pending ({pendingResignations.length})
                </span>
              }
              key="pending"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="pending"
              />
            </TabPane>
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-500" />
                  Approved ({approvedResignations.length})
                </span>
              }
              key="approved"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="approved"
              />
            </TabPane>
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <CloseCircleOutlined className="text-red-500" />
                  Rejected ({rejectedResignations.length})
                </span>
              }
              key="rejected"
            >
              <DataTable
                columns={getTableColumns()}
                data={getFilteredDataForTab()}
                loading={tableLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                currentPage={currentPage}
                pageSize={pageSize}
                onPaginationChange={handlePaginationChange}
                status="rejected"
              />
            </TabPane>
          </Tabs>
        </TabPane>
      </Tabs>

      {/* Leave Request Modal - Your existing modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto scrollbar-hide border border-gray-100">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-3xl">
              <div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Apply Leave Request
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Fill all required details for leave approval
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="h-10 w-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form - Your existing form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-blue-600 mb-2">
                    Employee Name *
                  </label>
                  <input
                    type="text"
                    list="employee-list"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    required
                    placeholder="Search Employee"
                    className="w-full rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <datalist id="employee-list">
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-purple-600 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    readOnly
                    className="w-full rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 text-sm font-bold text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-emerald-600 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-orange-600 mb-2">
                    HOD Name *
                  </label>
                  <select
                    name="hodName"
                    value={formData.hodName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  >
                    <option value="">Select HOD</option>
                    {hodNames.map((name, index) => (
                      <option key={index} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-indigo-600 mb-2">
                  Leave Category *
                </label>
                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-2xl border border-indigo-100 bg-gray-50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-blue-600 mb-2">
                    From Date *
                  </label>
                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wide text-pink-600 mb-2">
                    To Date *
                  </label>
                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-2xl border border-pink-100 bg-pink-50/40 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  />
                </div>
              </div>

              {formData.fromDate && formData.toDate && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                      Total Leave Days
                    </p>
                    <h2 className="text-2xl font-black text-blue-700 mt-1">
                      {calculateDays(formData.fromDate, formData.toDate)}
                    </h2>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg">
                    <Calendar size={24} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-rose-600 mb-2">
                  Reason *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Please provide reason for leave..."
                  required
                  className="w-full rounded-2xl border border-rose-100 bg-rose-50/30 px-4 py-3 text-sm font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-violet-600 mb-2">
                  Support Documents
                </label>
                <label className="border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-3xl p-6 bg-gradient-to-r from-violet-50/40 to-purple-50/40 hover:from-violet-50 hover:to-purple-50 cursor-pointer transition-all flex flex-col items-center justify-center gap-3">
                  <Paperclip className="h-8 w-8 text-violet-500" />
                  <span className="text-sm font-bold text-gray-700">
                    {formData.supportDocument ? formData.supportDocument.name : 'Upload Supporting Documents'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formData.supportDocument ? `${(formData.supportDocument.size / 1024).toFixed(2)} KB` : 'Medical Certificate, Approval Letter etc. (Max 5MB)'}
                  </span>
                  <input
                    type="file"
                    name="supportDocument"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                  />
                </label>
                {formData.supportDocument && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, supportDocument: null }))}
                    className="mt-2 text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove file
                  </button>
                )}
              </div>



              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-3 rounded-2xl text-white font-bold shadow-lg transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resignation Approval Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden transform transition-all duration-300">
            {/* Header */}
            <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Finalize Resignation Approval
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Specify the last working date and F&F settlement date
                </p>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="h-8 w-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wide text-blue-600">
                  Last Working Date *
                </label>
                <input
                  type="date"
                  value={lastWorkingDate}
                  onChange={(e) => setLastWorkingDate(e.target.value)}
                  className="w-full rounded-2xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wide text-indigo-600">
                  F & F Date *
                </label>
                <input
                  type="date"
                  value={fnfDate}
                  onChange={(e) => setFnfDate(e.target.value)}
                  className="w-full rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmResignationApprove}
                disabled={isSubmitting}
                className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-md transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-sm flex items-center gap-2 ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
              >
                {isSubmitting ? "Approving..." : "Complete Approval"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Resignation Request Modal */}
{showResignationModal && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto scrollbar-hide border border-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between rounded-t-3xl">
        <div>
          <h3 className="text-2xl font-black bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
            New Resignation Request
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Search employee and submit resignation application
          </p>
        </div>
        <button
          onClick={() => {
            setShowResignationModal(false);
            setResignationFormData({
              employee_id: "",
              name: "",
              reason_of_leaving: "",
              mobile_number: "",
              firm_name: "",
              father_name: "",
              date_of_joining: "",
              work_location: "",
              designation: "",
              department: "",
            });
          }}
          className="h-10 w-10 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleResignationSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Search Employee Name *
            </label>
            <input
              list="resignationEmployeeNames"
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 transition-all bg-gray-50"
              placeholder="Type to search employee..."
              value={resignationFormData.name}
              onChange={(e) => {
                setResignationFormData({ ...resignationFormData, name: e.target.value });
                handleResignationNameSelect(e.target.value);
              }}
            />
            <datalist id="resignationEmployeeNames">
              {resignationEmployeeOptions.map((emp, index) => (
                <option key={index} value={emp.name_as_per_aadhar} />
              ))}
            </datalist>
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Employee ID
            </label>
            <input
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 cursor-not-allowed"
              value={resignationFormData.employee_id}
              readOnly
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Mobile Number
            </label>
            <input
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 cursor-not-allowed"
              value={resignationFormData.mobile_number}
              readOnly
            />
          </div>

          {/* Firm Name */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Firm Name
            </label>
            <input
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 cursor-not-allowed"
              value={resignationFormData.firm_name}
              readOnly
            />
          </div>

          {/* Father Name */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Father Name
            </label>
            <input
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 cursor-not-allowed"
              value={resignationFormData.father_name}
              readOnly
            />
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Date of Joining
            </label>
            <input
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 cursor-not-allowed"
              value={resignationFormData.date_of_joining || '-'}
              readOnly
            />
          </div>

          {/* Work Location */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Work Location
            </label>
            <input
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 cursor-not-allowed"
              value={resignationFormData.work_location || '-'}
              readOnly
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Designation
            </label>
            <input
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 cursor-not-allowed"
              value={resignationFormData.designation || '-'}
              readOnly
            />
          </div>

          {/* Department */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-600 mb-2">
              Department
            </label>
            <input
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 bg-gray-50 cursor-not-allowed"
              value={resignationFormData.department || '-'}
              readOnly
            />
          </div>

          {/* Reason */}
          <div className="md:col-span-2">
            <label className="block text-xs font-extrabold uppercase tracking-wide text-red-600 mb-2">
              Reason of Leaving *
            </label>
            <textarea
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none min-h-[100px]"
              placeholder="Please provide reason for resignation..."
              name="reason_of_leaving"
              value={resignationFormData.reason_of_leaving}
              onChange={handleResignationChange}
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setShowResignationModal(false);
              setResignationFormData({
                employee_id: "",
                name: "",
                reason_of_leaving: "",
                mobile_number: "",
                firm_name: "",
                father_name: "",
                date_of_joining: "",
                work_location: "",
                designation: "",
                department: "",
              });
            }}
            className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={resignationSubmitting || resignationFetching}
            className={`px-6 py-3 rounded-2xl text-white font-bold shadow-lg transition-all bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 flex items-center gap-2 ${resignationSubmitting || resignationFetching ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {resignationSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Submitting...
              </>
            ) : resignationFetching ? (
              "Loading Data..."
            ) : (
              <>
                <Send size={18} />
                Submit Resignation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* Support Document Image Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[9999] p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 focus:outline-none bg-white/10 p-2 rounded-full transition-all"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Supporting Document"
              className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl object-contain border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
            <a
              href={previewImage}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              Open Original Document / Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Data Table Component
const DataTable = ({
  columns,
  data,
  loading,
  searchTerm,
  onSearchChange,
  currentPage,
  pageSize,
  onPaginationChange,
  status
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b">
        <Space>
          <Input
            placeholder="Search by name or ID..."
            prefix={<Search size={16} />}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64"
            allowClear
          />
          <Select
            placeholder="Filter"
            className="w-32"
            allowClear
          >
            <Option value="all">All</Option>
            <Option value="recent">Recent</Option>
            <Option value="old">Old</Option>
          </Select>
        </Space>
        <span className="text-sm text-gray-500">
          Total: <strong>{data.length}</strong> records
        </span>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: data.length,
          onChange: onPaginationChange,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`
        }}
        scroll={{ x: true }}
        rowKey="key"
        bordered={false}
        className="ant-table-custom"
      />
    </div>
  );
};

export default ApprovalManagement;