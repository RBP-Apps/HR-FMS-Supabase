import React, { useState, useEffect } from "react";

const LeavingApproval = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRows, setProcessingRows] = useState(new Set());

  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycby9QCly-0XBtGHUqanlO6mPWRn79e_XOYhYUG6irCL60WG96JJpDCc4iTOdLRuVeUOa/exec";
  const SHEET_NAME = "LEAVING";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`
      );
      const result = await response.json();

      if (result.success && result.data) {
        // Headers are at row 6 (index 5), so data starts from row 7 (index 6)
        const rows = result.data
          .slice(6)
          .filter((row) => row[1] && row[1].toString().trim() !== "")
          .map((row, index) => ({
            rowIndex: index + 7, // Row index in Google Sheets (starting from row 7)
            employeeId: row[1] || "", // Column B
            name: row[2] || "", // Column C
            dateOfLeaving: row[3] || "", // Column D
            mobileNumber: row[4] || "", // Column E
            reasonOfLeaving: row[5] || "", // Column F
            firmName: row[6] || "", // Column G
            fatherName: row[7] || "", // Column H
            dateOfJoining: row[8] || "", // Column I
            workLocation: row[9] || "", // Column J
            designation: row[10] || "", // Column K
            department: row[11] || "", // Column L
            approvalStatus: row[21] || "", // Column V (index 21)
          }));

        const sortedRows = rows.sort((a, b) => {
          if (
            a.approvalStatus === "Approved" &&
            b.approvalStatus !== "Approved"
          ) {
            return 1; // a goes after b
          }
          if (
            a.approvalStatus !== "Approved" &&
            b.approvalStatus === "Approved"
          ) {
            return -1; // a goes before b
          }
          return 0; // keep original order
        });

        setData(sortedRows);
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (rowIndex) => {
    try {
      setProcessingRows((prev) => new Set([...prev, rowIndex]));

      const formData = new URLSearchParams();
      formData.append("action", "updateCell");
      formData.append("sheetName", SHEET_NAME);
      formData.append("rowIndex", rowIndex);
      formData.append("columnIndex", 22); // Column V (1-based index)
      formData.append("value", "Approved");

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const currentRow = data.find((row) => row.rowIndex === rowIndex);
        const employeeId = currentRow.employeeId;

        const joiningFormData = new URLSearchParams();
        joiningFormData.append("action", "updateJoiningStatus");
        joiningFormData.append("employeeId", employeeId);
        joiningFormData.append("newStatus", "Inactive");

        await fetch(SCRIPT_URL, {
          method: "POST",
          body: joiningFormData,
        });

        setData((prevData) =>
          prevData.map((row) =>
            row.rowIndex === rowIndex
              ? { ...row, approvalStatus: "Approved" }
              : row
          )
        );
        alert("Successfully approved!");
      } else {
        throw new Error(result.error || "Failed to approve");
      }
    } catch (err) {
      console.error("Error approving:", err);
      alert("Failed to approve: " + err.message);
    } finally {
      setProcessingRows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rowIndex);
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
