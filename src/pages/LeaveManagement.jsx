import React, { useState, useEffect } from 'react';
import { Search, X, Check, Clock, Calendar, Plus, Paperclip, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import supabase from '../utils/supabase';
import { Select } from "antd";

const LeaveManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [rejectedLeaves, setRejectedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [editableDates, setEditableDates] = useState({ from: '', to: '' });
  const [hodNames, setHodNames] = useState([]);

  // New state for leave request modal
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
    reason: ''
  });

  const fetchHodNames = async () => {
    try {
      const { data, error } = await supabase
        .from('master_hr')
        .select('hod_name')
        .order('hod_name', { ascending: true });

      if (error) {
        throw error;
      }

      // Extract HOD names and filter out duplicates
      const hodData = data?.map(row => row.hod_name?.toString().trim()).filter(name => name) || [];
      setHodNames([...new Set(hodData)]); // Remove duplicates
    } catch (error) {
      console.error('Error fetching HOD data:', error);
      toast.error(`Failed to load HOD data: ${error.message}`);

      // Fallback to default HOD names if fetch fails
      setHodNames(['Deepak', 'Vikas', 'Dharam', 'Pratap', 'Aubhav']);
    }
  };

  useEffect(() => {
    fetchLeaveData();
    fetchEmployees();
    fetchHodNames(); // Fetch HOD names on component mount
  }, []);

  const handleCheckboxChange = (leaveId, rowData) => {
    if (selectedRow?.serialNo === leaveId) {
      setSelectedRow(null);
      setEditableDates({ from: '', to: '' });
    } else {
      // Convert DD/MM/YYYY to YYYY-MM-DD for date input
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

  const handleDateChange = (field, value) => {
    setEditableDates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch employees from Supabase joining table
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('joining')
        .select('rbp_joining_id, name_as_per_aadhar, designation')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const employeeData = (data || []).map(emp => ({
        id: emp.rbp_joining_id || '', // Column B (Employee ID)
        name: emp.name_as_per_aadhar || '', // Column E (Employee Name)
        designation: emp.designation || '', // Column I (Designation)
      })).filter(emp => emp.name && emp.id); // Filter out empty entries

      setEmployees(employeeData);
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error(`Failed to load employee data: ${error.message}`);
    }
  };


  // Handle employee selection
  const handleEmployeeChange = (selectedName) => {
    const selectedEmployee = employees.find(emp => emp.name === selectedName);
    setFormData(prev => ({
      ...prev,
      employeeName: selectedName,
      employeeId: selectedEmployee ? selectedEmployee.id : '',
      designation: selectedEmployee ? selectedEmployee.designation : ''
    }));
  };

  // Handle form input changes
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

  // Calculate days between dates
  const calculateDays = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;

    let startDate, endDate;

    // Handle different date formats
    if (startDateStr.includes('/')) {
      const [startDay, startMonth, startYear] = startDateStr.split('/').map(Number);
      startDate = new Date(startYear, startMonth - 1, startDay);
    } else {
      if (startDateStr.includes('-')) {
        const [year, month, day] = startDateStr.split('-').map(Number);
        startDate = new Date(year, month - 1, day);
      } else {
        startDate = new Date(startDateStr);
      }
    }

    if (endDateStr.includes('/')) {
      const [endDay, endMonth, endYear] = endDateStr.split('/').map(Number);
      endDate = new Date(endYear, endMonth - 1, endDay);
    } else {
      if (endDateStr.includes('-')) {
        const [year, month, day] = endDateStr.split('-').map(Number);
        endDate = new Date(year, month - 1, day);
      } else {
        endDate = new Date(endDateStr);
      }
    }

    const diffTime = endDate - startDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employeeName || !formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason || !formData.hodName) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);

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
          status: 'Pending'
        }]);

      if (insertError) {
        throw insertError;
      }

      toast.success('Leave Request submitted successfully!');
      setFormData({
        employeeId: '',
        employeeName: '',
        designation: '',
        hodName: '',
        leaveType: '',
        fromDate: '',
        toDate: '',
        reason: ''
      });
      setShowModal(false);
      // Refresh the data
      fetchLeaveData();
    } catch (error) {
      console.error('Insert error:', error);
      toast.error(error.message || 'Something went wrong!');
    } finally {
      setSubmitting(false);
    }
  };

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
      }));

      // Case-insensitive filtering
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

  const filteredPendingLeaves = pendingLeaves.filter(item => {
    const matchesSearch = item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredApprovedLeaves = approvedLeaves.filter(item => {
    const matchesSearch = item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredRejectedLeaves = rejectedLeaves.filter(item => {
    const matchesSearch = item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const leaveTypes = [
    'Casual Leave',
    'Earned Leave',
    // 'Normal Leave',
  ];

  const renderPendingLeavesTable = () => (
    <table className="min-w-full divide-y divide-white">
      <thead className="bg-indigo-600 text-white">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Select
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Employee ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">From</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">To</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Days</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Reason</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Leave Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">HOD Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white">
        {filteredPendingLeaves.length > 0 ? (
          filteredPendingLeaves.map((item, index) => (
            <tr key={index} className="hover:bg-white">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedRow?.serialNo === item.serialNo}
                  onChange={() => handleCheckboxChange(item.serialNo, item)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeId}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {selectedRow?.serialNo === item.serialNo ? (
                  <input
                    type="date"
                    value={editableDates.from}
                    onChange={(e) => handleDateChange('from', e.target.value)}
                    className="border rounded p-1 text-sm"
                  />
                ) : (
                  formatDate(item.startDate)
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {selectedRow?.serialNo === item.serialNo ? (
                  <input
                    type="date"
                    value={editableDates.to}
                    onChange={(e) => handleDateChange('to', e.target.value)}
                    className="border rounded p-1 text-sm"
                  />
                ) : (
                  formatDate(item.endDate)
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {selectedRow?.serialNo === item.serialNo ?
                  calculateDays(editableDates.from, editableDates.to) :
                  item.days
                }
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.remark}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.leaveType}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hodName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleLeaveAction('accept')}
                    disabled={!selectedRow || selectedRow.serialNo !== item.serialNo || loading}
                    className={`px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 min-h-[42px] flex items-center justify-center ${!selectedRow || selectedRow.serialNo !== item.serialNo || loading ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                  >
                    {loading && selectedRow?.serialNo === item.serialNo && actionInProgress === 'accept' ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin h-4 w-4 text-white mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Accepting...</span>
                      </div>
                    ) : 'Accept'}
                  </button>
                  <button
                    onClick={() => handleLeaveAction('rejected')}
                    disabled={selectedRow?.serialNo !== item.serialNo || loading}
                    className={`px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 min-h-[42px] flex items-center justify-center ${selectedRow?.serialNo !== item.serialNo || (loading && actionInProgress === 'accept') ? 'opacity-75 cursor-not-allowed' : ''
                      }`}
                  >
                    {loading && selectedRow?.serialNo === item.serialNo && actionInProgress === 'rejected' ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin h-4 w-4 text-white mr-2"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Rejecting...</span>
                      </div>
                    ) : 'Reject'}
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="9" className="px-6 py-12 text-center">
              <p className="text-gray-500">No pending leave requests found.</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderApprovedLeavesTable = () => (
    <table className="min-w-full divide-y divide-white">
      <thead className="bg-indigo-600 text-white">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Employee ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">From</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">To</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Days</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Reason</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Leave Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">HOD Name</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white">
        {filteredApprovedLeaves.length > 0 ? (
          filteredApprovedLeaves.map((item, index) => (
            <tr key={index} className="hover:bg-white">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeId}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.startDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.endDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.days}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.remark}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.leaveType}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hodName}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="px-6 py-12 text-center">
              <p className="text-gray-500">No approved leave requests found.</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderRejectedLeavesTable = () => (
    <table className="min-w-full divide-y divide-white">
      <thead className="bg-indigo-600 text-white">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Employee ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">From</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">To</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Days</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Reason</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Leave Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">HOD Name</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white">
        {filteredRejectedLeaves.length > 0 ? (
          filteredRejectedLeaves.map((item, index) => (
            <tr key={index} className="hover:bg-white">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeId}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.employeeName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.startDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(item.endDate)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.days}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.remark}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.leaveType}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.hodName}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7" className="px-6 py-12 text-center">
              <p className="text-gray-500">No rejected leave requests found.</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderTable = () => {
    switch (activeTab) {
      case 'pending':
        return renderPendingLeavesTable();
      case 'approved':
        return renderApprovedLeavesTable();
      case 'rejected':
        return renderRejectedLeavesTable();
      default:
        return renderPendingLeavesTable();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-indigo-600">Leave Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={16} className="mr-2" />
          New Leave Request
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Pending Leaves ({pendingLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'approved'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Approved Leaves ({approvedLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'rejected'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Rejected Leaves ({rejectedLeaves.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            {tableLoading ? (
              <div className="px-6 py-12 text-center">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                  <span className="text-gray-600 text-sm">
                    {loading ? 'Processing request...' : 'Loading leave data...'}
                  </span>
                </div>
              </div>
            ) : error ? (
              <div className="px-6 py-12 text-center">
                <p className="text-red-500">Error: {error}</p>
                <button
                  onClick={fetchLeaveData}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Retry
                </button>
              </div>
            ) : (
              renderTable()
            )}
          </div>
        </div>
      </div>

      {/* Modal for new leave request */}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">

              {/* Employee Details */}
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

                {/* Employee ID */}
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

                {/* Designation */}
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

                {/* HOD */}
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
                      <option key={index} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Leave Category */}
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
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* From Date */}
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

                {/* To Date */}
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

              {/* Total Days */}
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

              {/* Reason */}
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

              {/* Support Documents */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-violet-600 mb-2">
                  Support Documents
                </label>

                <label className="border-2 border-dashed border-violet-200 hover:border-violet-400 rounded-3xl p-6 bg-gradient-to-r from-violet-50/40 to-purple-50/40 hover:from-violet-50 hover:to-purple-50 cursor-pointer transition-all flex flex-col items-center justify-center gap-3">
                  <Paperclip className="h-8 w-8 text-violet-500" />

                  <span className="text-sm font-bold text-gray-700">
                    Upload Supporting Documents
                  </span>

                  <span className="text-xs text-gray-400">
                    Medical Certificate, Approval Letter etc.
                  </span>

                  <input
                    type="file"
                    name="supportDocument"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Footer Buttons */}
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
                  className={`px-6 py-3 rounded-2xl text-white font-bold shadow-lg transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 ${submitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
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
    </div>
  );
};

export default LeaveManagement;