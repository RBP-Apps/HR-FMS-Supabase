import React, { useState, useEffect } from "react";
import supabase from "../utils/supabase";



const LeavingApproval = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRows, setProcessingRows] = useState(new Set());

  

  useEffect(() => {
    fetchData();
  }, []);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);

    const { data: leavingData, error: fetchError } = await supabase
      .from('employee_leaving')
      .select('*')
      .order('timestamp', { ascending: false });

    if (fetchError) throw fetchError;

    // Transform the data to match the existing structure
    const transformedData = leavingData.map((record, index) => ({
      rowIndex: record.id, // Using the actual database ID
      employeeId: record.employee_id || '',
      name: record.name || '',
      dateOfLeaving: record.date_of_leaving || '',
      mobileNumber: record.mobile_number || '',
      reasonOfLeaving: record.reason_of_leaving || '',
      firmName: record.firm_name || '',
      fatherName: record.father_name || '',
      dateOfJoining: record.date_of_joining || '',
      workLocation: record.work_location || '',
      designation: record.designation || '',
      department: record.department || '',
      approvalStatus: record.resignation_acceptance ? 'Approved' : 'Pending', // Map to your status field
    }));

    // Sort: Pending first, then Approved
    const sortedRows = transformedData.sort((a, b) => {
      if (a.approvalStatus === 'Approved' && b.approvalStatus !== 'Approved') return 1;
      if (a.approvalStatus !== 'Approved' && b.approvalStatus === 'Approved') return -1;
      return 0;
    });

    setData(sortedRows);
  } catch (err) {
    console.error("Error fetching data:", err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};




 const handleApprove = async (rowId) => {
  try {
    setProcessingRows((prev) => new Set([...prev, rowId]));

    // Update the approval status in employee_leaving table
    const { error: updateError } = await supabase
      .from('employee_leaving')
      .update({ 
        resignation_acceptance: true,
        actual: new Date().toISOString().split('T')[0] // Set actual date if needed
      })
      .eq('id', rowId);

    if (updateError) throw updateError;

    // Get the current row data to get employee_id
    const currentRow = data.find((row) => row.rowIndex === rowId);
    
    if (currentRow && currentRow.employeeId) {
      // Update the joining table status to Inactive
      const { error: joiningError } = await supabase
        .from('joining')
        .update({ status: 'Inactive' })
        .eq('rbp_joining_id', currentRow.employeeId);

      if (joiningError) throw joiningError;
    }

    // Update local state
    setData((prevData) =>
      prevData.map((row) =>
        row.rowIndex === rowId
          ? { ...row, approvalStatus: "Approved" }
          : row
      )
    );
    
    alert("Successfully approved!");
  } catch (err) {
    console.error("Error approving:", err);
    alert("Failed to approve: " + err.message);
  } finally {
    setProcessingRows((prev) => {
      const newSet = new Set(prev);
      newSet.delete(rowId);
      return newSet;
    });
  }
};



  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ fontSize: "20px" }}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ fontSize: "20px", color: "#dc2626" }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f9fafb",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "30px",
            fontWeight: "bold",
            color: "#1f2937",
            margin: 0,
          }}
        >
          Leaving Approval
        </h1>
        <p style={{ color: "#6b7280", marginTop: "8px" }}>
          Total Records: {data.length}
        </p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <div style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "1200px",
            }}
          >
            <thead
              style={{
                backgroundColor: "#2563eb",
                color: "white",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <tr>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Action
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Employee ID
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Date Of Leaving
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Mobile Number
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Reason Of Leaving
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Firm Name
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Father Name
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Date Of Joining
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Work Location
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Designation
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Department
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: "600",
                    borderBottom: "2px solid #1d4ed8",
                    whiteSpace: "nowrap",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: index % 2 === 0 ? "white" : "#f9fafb",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f3f4f6")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? "white" : "#f9fafb")
                  }
                >
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <button
                      onClick={() => handleApprove(row.rowIndex)}
                      disabled={
                        row.approvalStatus === "Approved" ||
                        processingRows.has(row.rowIndex)
                      }
                      style={{
                        padding: "8px 16px",
                        borderRadius: "4px",
                        fontWeight: "600",
                        border: "none",
                        cursor:
                          row.approvalStatus === "Approved" ||
                          processingRows.has(row.rowIndex)
                            ? "not-allowed"
                            : "pointer",
                        backgroundColor:
                          row.approvalStatus === "Approved"
                            ? "#d1fae5"
                            : processingRows.has(row.rowIndex)
                            ? "#d1d5db"
                            : "#2563eb",
                        color:
                          row.approvalStatus === "Approved"
                            ? "#065f46"
                            : processingRows.has(row.rowIndex)
                            ? "#6b7280"
                            : "white",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          row.approvalStatus !== "Approved" &&
                          !processingRows.has(row.rowIndex)
                        ) {
                          e.currentTarget.style.backgroundColor = "#1d4ed8";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          row.approvalStatus !== "Approved" &&
                          !processingRows.has(row.rowIndex)
                        ) {
                          e.currentTarget.style.backgroundColor = "#2563eb";
                        }
                      }}
                    >
                      {processingRows.has(row.rowIndex)
                        ? "Processing..."
                        : row.approvalStatus === "Approved"
                        ? "Approved"
                        : "Approve"}
                    </button>
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.employeeId}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.name}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.dateOfLeaving}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.mobileNumber}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      maxWidth: "200px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.reasonOfLeaving}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.firmName}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.fatherName}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.dateOfJoining}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.workLocation}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.designation}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    {row.department}
                  </td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontSize: "14px",
                        fontWeight: "600",
                        backgroundColor:
                          row.approvalStatus === "Approved"
                            ? "#d1fae5"
                            : "#fef3c7",
                        color:
                          row.approvalStatus === "Approved"
                            ? "#065f46"
                            : "#92400e",
                      }}
                    >
                      {row.approvalStatus || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.length === 0 && (
            <div
              style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}
            >
              No records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeavingApproval;
