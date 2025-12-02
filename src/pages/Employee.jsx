import React, { useEffect, useState } from "react";
import { Filter, Search, Clock, CheckCircle, ImageIcon } from "lucide-react";
import useDataStore from "../store/dataStore";

const Employee = () => {
  const [activeTab, setActiveTab] = useState("joining");
  const [searchTerm, setSearchTerm] = useState("");
  const [joiningData, setJoiningData] = useState([]);
  const [leavingData, setLeavingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const formatDOB = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return as-is if not a valid date
    }

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // const fetchJoiningData = async () => {
  //   setLoading(true);
  //   setTableLoading(true);
  //   setError(null);

  //   try {
  //     const response = await fetch(
  //       "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=JOINING&action=fetch"
  //     );

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const result = await response.json();
  //     console.log("Raw JOINING API response:", result);

  //     if (!result.success) {
  //       throw new Error(
  //         result.error || "Failed to fetch data from JOINING sheet"
  //       );
  //     }

  //     // Handle both array formats (direct data or result.data)
  //     const rawData = result.data || result;

  //     if (!Array.isArray(rawData)) {
  //       throw new Error("Expected array data not received");
  //     }

  //     // Get headers from row 6 (index 5 in 0-based array)
  //     const headers = rawData[5];

  //     // Process data starting from row 7 (index 6)
  //     const dataRows = rawData.length > 6 ? rawData.slice(6) : [];

  //     const getIndex = (headerName) => {
  //       const index = headers.findIndex(
  //         (h) =>
  //           h && h.toString().trim().toLowerCase() === headerName.toLowerCase()
  //       );
  //       if (index === -1) {
  //         console.warn(`Column "${headerName}" not found in sheet`);
  //       }
  //       return index;
  //     };

  //     const processedData = dataRows.map((row) => ({
  //       employeeId: row[1] || "", // Column B (index 1)
  //       candidateName: row[2] || "", // Column C (index 2)
  //       fatherName: row[3] || "", // Column D (index 3)
  //       dateOfJoining: row[4] || "", // Column E (index 4)
  //       designation: row[5] || "", // Column F (index 5)
  //       aadharPhoto: row[6] || "", // Column G (index 6)
  //       candidatePhoto: row[7] || "", // Column H (index 7)
  //       address: row[8] || "", // Column I (index 8)
  //       dateOfBirth: row[9] || "", // Column J (index 9)
  //       gender: row[10] || "", // Column K (index 10)
  //       mobileNo: row[11] || "", // Column L (index 11)
  //       familyNo: row[12] || "", // Column M (index 12)
  //       relationshipWithFamily: row[13] || "", // Column N (index 13)
  //       accountNo: row[14] || "", // Column O (index 14)
  //       ifsc: row[15] || "", // Column P (index 15)
  //       branch: row[16] || "", // Column Q (index 16)
  //       passbook: row[17] || "", // Column R (index 17)
  //       emailId: row[18] || "", // Column S (index 18)
  //       department: row[20] || "", // Column U (index 20)
  //       equipment: row[21] || "", // Column V (index 21)
  //       aadharNo: row[22] || "", // Column W (index 22) - Fixed index
  //       // Keep existing filter fields
  //       columnAA: row[26] || "",
  //       columnY: row[24] || "",
  //     }));

  //     // Filter logic: Column AQ has value AND Column AO is null/empty
  //     const activeEmployees = processedData.filter(
  //       (employee) => employee.columnAA && !employee.columnY
  //     );

  //     setJoiningData(activeEmployees);
  //   } catch (error) {
  //     console.error("Error fetching joining data:", error);
  //     setError(error.message);
  //     toast.error(`Failed to load joining data: ${error.message}`);
  //   } finally {
  //     setLoading(false);
  //     setTableLoading(false);
  //   }
  // };


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
      console.log("Raw JOINING API response:", result);

      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch data from JOINING sheet"
        );
      }

      // Handle both array formats (direct data or result.data)
      const rawData = result.data || result;

      if (!Array.isArray(rawData)) {
        throw new Error("Expected array data not received");
      }

      // Get headers from row 6 (index 5 in 0-based array)
      const headers = rawData[5];

      // Process data starting from row 7 (index 6)
      const dataRows = rawData.length > 6 ? rawData.slice(6) : [];

      const getIndex = (headerName) => {
        const index = headers.findIndex(
          (h) =>
            h && h.toString().trim().toLowerCase() === headerName.toLowerCase()
        );
        if (index === -1) {
          console.warn(`Column "${headerName}" not found in sheet`);
        }
        return index;
      };

      const processedData = dataRows.map((row) => ({
        // Column B to AI according to your table headers sequence
        employeeId: row[1] || "", // Column B (index 1) - Employee ID
        status: row[2] || "", // Column C (index 2) - Status
        firmName: row[3] || "", // Column D (index 3) - Firm Name
        nameAsPerAadhar: row[4] || "", // Column E (index 4) - Name As Per Aadhar
        bloodGroup: row[5] || "", // Column F (index 5) - Blood Group
        fatherName: row[6] || "", // Column G (index 6) - Father Name
        dateOfJoining: row[7] || "", // Column H (index 7) - Date Of Joining
        workLocation: row[8] || "", // Column I (index 8) - Work Location
        designation: row[9] || "", // Column J (index 9) - Designation
        salary: row[10] || "", // Column K (index 10) - Salary
        aadharFrontPhoto: row[11] || "", // Column L (index 11) - Aadhar Frontside photo
        aadharBackPhoto: row[12] || "", // Column M (index 12) - Aadhar Backside photo
        panCard: row[13] || "", // Column N (index 13) - Pan Card
        relationshipWithFamily: row[14] || "", // Column O (index 14) - Relationship with family Person
        currentAddress: row[15] || "", // Column P (index 15) - Current Address
        aadharAddress: row[16] || "", // Column Q (index 16) - Address as per aadhar card
        dateOfBirth: row[17] || "", // Column R (index 17) - Date of birth aadhar card
        gender: row[18] || "", // Column S (index 18) - Gender
        mobileNumber: row[19] || "", // Column T (index 19) - Mobile Number
        familyNumber: row[20] || "", // Column U (index 20) - Family Number
        pastPfId: row[21] || "", // Column V (index 21) - Past PF Id No.
        pastEsicNumber: row[22] || "", // Column W (index 22) - Past Esic Number
        currentBankAcNo: row[23] || "", // Column X (index 23) - Current Bank Ac No.
        ifscCode: row[24] || "", // Column Y (index 24) - IFSC Code
        branchName: row[25] || "", // Column Z (index 25) - Branch Name
        personalEmail: row[26] || "", // Column AA (index 26) - Personal Email-Id
        companyProvidesPf: row[27] || "", // Column AB (index 27) - Does Company Provide PF
        companyProvidesEsic: row[28] || "", // Column AC (index 28) - Does Company Provide ESIC
        companyProvidesEmail: row[29] || "", // Column AD (index 29) - Does Company Provide Mail-Id
        attendanceType: row[30] || "", // Column AE (index 30) - Attendance Type
        validateCandidate: row[31] || "", // Column AF (index 31) - Validate the Candidate
        issueGmailId: row[32] || "", // Column AG (index 32) - Issue Gmail id
        issueJoiningLetter: row[33] || "", // Column AH (index 33) - Issue Joining letter
        attendanceRegistration: row[34] || "", // Column AI (index 34) - Attendance Registration
      }));

      // NEW FILTER LOGIC: Only fetch records where Status is "Active"
      const activeEmployees = processedData.filter(
        (employee) => employee.status && employee.status.toLowerCase() === "active"
      );

      console.log("Active employees count:", activeEmployees.length);
      console.log("Sample active employee:", activeEmployees[0]);

      setJoiningData(activeEmployees);
    } catch (error) {
      console.error("Error fetching joining data:", error);
      setError(error.message);
      toast.error(`Failed to load joining data: ${error.message}`);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };


  // const fetchLeavingData = async () => {
  //   setLoading(true);
  //   setTableLoading(true);
  //   setError(null);

  //   try {
  //     const response = await fetch(
  //       "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec?sheet=LEAVING&action=fetch"
  //     );

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const result = await response.json();

  //     if (!result.success) {
  //       throw new Error(
  //         result.error || "Failed to fetch data from LEAVING sheet"
  //       );
  //     }

  //     const rawData = result.data || result;

  //     if (!Array.isArray(rawData)) {
  //       throw new Error("Expected array data not received");
  //     }

  //     // Process data starting from row 7 (index 6) - skip headers
  //     const dataRows = rawData.length > 6 ? rawData.slice(6) : [];

  //     const processedData = dataRows.map((row) => ({
  //       timestamp: row[0] || "",
  //       employeeId: row[1] || "",
  //       name: row[2] || "",
  //       dateOfLeaving: row[3] || "",
  //       mobileNo: row[4] || "",
  //       reasonOfLeaving: row[5] || "",
  //       firmName: row[6] || "",
  //       fatherName: row[7] || "",
  //       dateOfJoining: row[8] || "",
  //       workingLocation: row[9] || "",
  //       designation: row[10] || "",
  //       salary: row[11] || "",
  //       plannedDate: row[12] || "", // Column M (index 12)
  //       actual: row[13] || "",
  //     }));

  //     // Filter logic: plannedDate (Column M) has value
  //     const leavingEmployees = processedData.filter(
  //       (employee) => employee.plannedDate
  //     );

  //     setLeavingData(leavingEmployees);
  //   } catch (error) {
  //     console.error("Error fetching leaving data:", error);
  //     setError(error.message);
  //     toast.error(`Failed to load leaving data: ${error.message}`);
  //   } finally {
  //     setLoading(false);
  //     setTableLoading(false);
  //   }
  // };

  const fetchLeavingData = async () => {
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

    // Get headers from row 6 (index 5 in 0-based array)
    const headers = rawData[5];

    // Process data starting from row 7 (index 6)
    const dataRows = rawData.length > 6 ? rawData.slice(6) : [];

    const processedData = dataRows.map((row) => ({
      employeeId: row[1] || "",
      status: row[2] || "",
      name: row[4] || "", // nameAsPerAadhar
      dateOfJoining: row[7] || "",
      dateOfLeaving: row[37] || "", // You can add a separate leaving date column if available
      mobileNo: row[19] || "",
      fatherName: row[6] || "",
      designation: row[9] || "",
      salary: row[10] || "",
      reasonOfLeaving: row[38] || "" // Add if you have this column
    }));

    // Filter for inactive employees
    const inactiveEmployees = processedData.filter(
      (employee) => employee.status && employee.status.toLowerCase() === "inactive"
    );

    setLeavingData(inactiveEmployees);
  } catch (error) {
    console.error("Error fetching leaving data:", error);
    setError(error.message);
    toast.error(`Failed to load leaving data: ${error.message}`);
  } finally {
    setLoading(false);
    setTableLoading(false);
  }
};

  useEffect(() => {
    fetchJoiningData();
    fetchLeavingData();
  }, []);

  const filteredJoiningData = joiningData.filter((item) => {
    const matchesSearch =
      item.candidateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.emailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobileNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredLeavingData = leavingData.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold ">Employee</h1>
      </div>

      {/* Filter and Search - This section won't scroll */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name, employee ID, or designation..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300   rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white  text-gray-500 "
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 "
            />
          </div>
        </div>
      </div>

      {/* Tabs - This section won't scroll */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-300 ">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "joining"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("joining")}
            >
              <CheckCircle size={16} className="inline mr-2" />
              Active ({filteredJoiningData.length})
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${activeTab === "leaving"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              onClick={() => setActiveTab("leaving")}
            >
              <Clock size={16} className="inline mr-2" />
              In-Active ({filteredLeavingData.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "joining" && (
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                {" "}
                {/* Added scroll container */}
                <table className="min-w-full divide-y divide-white">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Firm Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name As Per Aadhaar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Blood Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Father Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Of Joining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Work Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aadhaar Frontside photo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aadhaar Backside photo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pan Card
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Relationship with family Person
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address as per aadhaar card
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date of birth aadhaar card
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gender
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobile Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Family Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Past PF Id No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Past Esic Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Bank Ac No.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IFSC Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personal Email-Id
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Does Company Provide PF
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Does Company Provide ESIC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Does Company Provide Mail-Id
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validate the Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Gmail id
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Joining letter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Registration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white ">
                    {tableLoading ? (
                      <tr>
                        <td colSpan="34" className="px-6 py-12 text-center">
                          <div className="flex justify-center flex-col items-center">
                            <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                            <span className="text-gray-600 text-sm">
                              Loading employees...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="34" className="px-6 py-12 text-center">
                          <p className="text-red-500">Error: {error}</p>
                          <button
                            onClick={fetchJoiningData}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Retry
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredJoiningData.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-white hover:bg-opacity-5"
                        >
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.employeeId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.status}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.firmName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.nameAsPerAadhar}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.bloodGroup}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.fatherName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.dateOfJoining ? formatDOB(item.dateOfJoining) : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.workLocation}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.designation}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.salary}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.aadharFrontPhoto ? (
                              <a
                                href={item.aadharFrontPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <ImageIcon size={20} />
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.aadharBackPhoto ? (
                              <a
                                href={item.aadharBackPhoto}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <ImageIcon size={20} />
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.panCard ? (
                              <a
                                href={item.panCard}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800"
                              >
                                <ImageIcon size={20} />
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.relationshipWithFamily}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.currentAddress}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.aadharAddress}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.dateOfBirth ? formatDOB(item.dateOfBirth) : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.gender}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.mobileNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.familyNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.pastPfId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.pastEsicNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.currentBankAcNo}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.ifscCode}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.branchName}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.personalEmail}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.companyProvidesPf}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.companyProvidesEsic}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.companyProvidesEmail}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.attendanceType}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.validateCandidate}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.issueGmailId}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.issueJoiningLetter}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.attendanceRegistration}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {!tableLoading && filteredJoiningData.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 ">
                      No joining employees found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "leaving" && (
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                {" "}
                {/* Added scroll container */}
                <table className="min-w-full divide-y divide-white ">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    {" "}
                    {/* Made header sticky */}
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Of Joining
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Of Leaving
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobile Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Father Name
                      </th>
                      {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Work Location</th> */}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason Of Leaving
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white ">
                    {tableLoading ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-center">
                          <div className="flex justify-center flex-col items-center">
                            <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                            <span className="text-gray-600 text-sm">
                              Loading leaving employees...
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-center">
                          <p className="text-red-500">Error: {error}</p>
                          <button
                            onClick={fetchLeavingData}
                            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            Retry
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredLeavingData.map((item, index) => (
                        <tr key={index} className="hover:bg-white ">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.employeeId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.dateOfJoining
                              ? formatDOB(item.dateOfJoining)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.dateOfLeaving
                              ? formatDOB(item.dateOfLeaving)
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.mobileNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.fatherName}
                          </td>
                          {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.workingLocation || '-'}</td> */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.designation}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.salary}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.reasonOfLeaving}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {!tableLoading && filteredLeavingData.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 ">
                      No leaving employees found.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Employee;
