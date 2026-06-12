import React from "react";

const OfferLetterPreview = ({ formData }) => {
  const formatDate = (dateString) => {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};



  return (
    <div id="offer-letter-preview" className="bg-[#d9d9d9] min-h-screen p-10 overflow-auto">
      {/* ================= PAGE 1 ================= */}
      <div
        id="offer-page-1"
        className="bg-white mx-auto shadow-md mb-10 relative"
        style={{
          width: "794px",
          height: "1123px",
          overflow: "hidden",
          padding: "45px 55px",
          fontFamily: "Arial",
          color: "#000",
        }}
      >
        {/* HEADER */}
        <div>
          <h1 style={{ color: "#482971", fontSize: "26px", fontWeight: "bold", letterSpacing: "0.3px", textAlign: "center" }}>
            {formData.companyName}
          </h1>

          <div
            style={{
              borderBottom: "1px solid #5b6f9a",
              marginTop: "6px",
              marginBottom: "10px",
            }}
          ></div>
        </div>

        {/* DATE */}
        {/* <div className="flex justify-between mt-4">
          <div>

          </div>

          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            Date: {formData.offerDate || formData.joiningDate || ""}
          </div>
        </div> */}

        <div className="flex justify-between mt-4">
  <div></div>

  <div
    style={{
      fontSize: "13px",
      fontWeight: 700,
    }}
  >
    Date: {formatDate(formData.offerDate || formData.joiningDate)}
  </div>
</div>

        {/* TITLE */}
        <div className="mt-8 text-center">
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#1d3d73",
              borderBottom: "1px solid #1d3d73",
              display: "inline-block",
              paddingBottom: "8px",
              width: "100%",
            }}
          >
            LETTER OF OFFER
          </h2>
        </div>

        {/* BODY */}
        <div
          className="mt-10"
          style={{
            fontSize: "13px",
            lineHeight: "1.35",

          }}
        >
          <p>Dear<span style={{
            fontWeight: 700,

          }}> {formData.employeeName || formData.employee_name || "Candidate"}</span>,</p>

          <br />

          <p
            style={{
              fontWeight: 700,
              color: "#1d3d73",
            }}
          >
            Congratulations!
          </p>

          <p className="mt-2 text-justify">
            We are pleased to offer you the position of <b>{formData.designation}</b> at {formData.companyName}{" "}
            This offer is extended based on the outcome of your interview discussions and the
            credentials submitted by you. The terms and conditions governing this offer are detailed below.
          </p>

          {/* EMPLOYMENT */}
          <div className="mt-8">
            <h3
              style={{
                color: "#1d3d73",
                fontWeight: 700,
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              A. EMPLOYMENT DETAILS
            </h3>

            <div className="mt-2 space-y-1">
              <p>
                <b>Designation:</b> {formData.designation || "-"}
              </p>

              <p>
                <b>Date of Joining:</b> {formatDate(formData.joiningDate || formData.joining_date)}
              </p>

              <p>
                <b>Department:</b> {formData.department || "-"}
              </p>

              <p>
                <b>Reporting To:</b> {formData.reportingTo || formData.reporting_to || "-"}
              </p>

              <p>
                <b>Place of Posting:</b> {formData.placeOfPosting || formData.place_of_posting || "-"}
              </p>
            </div>
          </div>

          {/* PROBATION */}
          <div className="mt-8">
            <h3
              style={{
                color: "#1d3d73",
                fontWeight: 700,
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              B. PROBATION PERIOD
            </h3>

            <p className="mt-2 text-justify">
              You will be on a probation period of{" "}
              <b>{formData.probationPeriod || formData.probation_period || "Six (6) months"}</b> from your date of
              joining, i.e., from <b>{formatDate(formData.joiningDate || formData.joining_date)}</b> to{" "}
              <b>{formatDate(formData.probationEndDate || "-")}</b>. During this period, your performance will be evaluated
              regularly.
            </p>

            <ul
              className="mt-3"
              style={{
                paddingLeft: "35px",
                listStyleType: "disc",
              }}
            >
              <li>
                Upon successful completion of the probation period and satisfactory performance review, you will be
                confirmed as a Permanent / Full-Time Employee of {formData.companyName}{" "}
              </li>

              <li>
              You will be eligible for all HR benefits and facilities provided by the Company, including Provident Fund (PF), Employee State Insurance (ESI), paid leaves, and any other company-provided benefits and perquisites, in accordance with Company policies and statutory regulations.
              </li>

              <li>
                During the probation period, the company reserves the right to extend or terminate the probation at its
                sole discretion, based on performance and conduct, with due notice.
              </li>

              <li>
                The probation period may be extended by up to Three (3) months if performance is not found satisfactory.
              </li>
            </ul>
          </div>

          {/* TERMS */}
          <div className="mt-8">
            <h3
              style={{
                color: "#1d3d73",
                fontWeight: 700,
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              C. TERMS & CONDITIONS
            </h3>

            <p className="mt-2">Your employment shall be governed by the following terms:</p>

            <ol
              style={{
                paddingLeft: "35px",
                marginTop: "8px",
              }}
            >
              <li>You will be designated as {formData.designation || "-"}.</li>

              <li className="mt-1">
                Your date of commencement of employment is {formatDate(formData.joiningDate || formData.joining_date || "-")}.
              </li>

              <li className="mt-1">
                A notice period of {formData.noticePeriod || formData.notice_period || "Three (3) months"} will be
                applicable from either side upon separation from the company.
              </li>

              <li className="mt-1">
                No leave will be permitted during due dates or critical reporting periods, unless specifically approved
                by management.
              </li>
            </ol>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "55px",
            right: "55px",
            borderTop: "1px solid #5b6f9a",
            paddingTop: "5px",
            fontSize: "10px",
            color: "#999",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {formData.companyName} | Confidential Document | Page 1
        </div>
      </div>

      {/* ================= PAGE 2 ================= */}
      <div
        id="offer-page-2"
        className="bg-white mx-auto shadow-md relative"
        style={{
          width: "794px",
          height: "1123px",
          overflow: "hidden",
          padding: "45px 55px",
          fontFamily: "Arial",
          color: "#000",
        }}
      >
        {/* HEADER */}
        <div>
          <h1
            style={{
              color: "#5b6f9a",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.3px",
            }}
          >
            {formData.companyName}.
          </h1>

          <div
            style={{
              borderBottom: "1px solid #5b6f9a",
              marginTop: "6px",
              marginBottom: "10px",
            }}
          ></div>
        </div>

        {/* CONTENT */}
        <div
          className="mt-8"
          style={{
            fontSize: "13px",
            lineHeight: "1.35",
          }}
        >
          <ol
            start={5}
            style={{
              paddingLeft: "35px",
            }}
          >
            <li>
              You will be required to abide by all service rules, regulations, and policies of {formData.companyName}{" "} as amended from time to time.
            </li>
          </ol>

          {/* DOCUMENTS */}
          <div className="mt-10">
            <h3
              style={{
                color: "#1d3d73",
                fontWeight: 700,
                textDecoration: "underline",
                fontSize: "14px",
              }}
            >
              D. DOCUMENTS REQUIRED AT THE TIME OF JOINING
            </h3>

            <p className="mt-2">Please carry the following documents on your date of joining:</p>

            <div
              className="mt-2"
              style={{
                paddingLeft: "35px",
              }}
            >
              <p>a) Date of Birth proof (Copy of Passport / Birth Certificate / SSC Marksheet)</p>

              <p className="mt-1">
                b) Xerox copies of all Academic Certificates (10th standard onwards to the highest qualification)
              </p>

              <p className="mt-1">c) Resignation Letter with acknowledgement from previous employer (if applicable)</p>

              <p className="mt-1">d) Relieving Letter from previous employer (if applicable)</p>

              <p className="mt-1">e) Proof of last drawn compensation / salary slips (if applicable)</p>

              <p className="mt-1">f) Two recent passport-size photographs</p>

              <p className="mt-1">g)  Copy of Bank Passbook / Cancelled Cheque for bank account details</p>

              <p className="mt-1">h) Aadhar Card and PAN Card (original and photocopy)</p>

              <p className="mt-1">i) One Cheque for Security Purpose.</p>
            </div>
          </div>

          {/* FINAL */}
          <div className="mt-10 text-justify">
            <p>
              Kindly sign and return a copy of this letter as a token of your acceptance of the above terms and
              conditions. We look forward to welcoming you to our team and wish you a rewarding career at {formData.companyName}{" "}
            </p>
          </div>

          {/* SIGN */}
          <div className="mt-14">
            <p
              style={{
                fontWeight: 700,
              }}
            >
              For {formData.companyName}.
            </p>

            <div className="mt-16">
              <div
                style={{
                  borderTop: "1px solid #555",
                  width: "100%",
                  marginBottom: "5px",
                }}
              ></div>

              <p>Authorised Signatory</p>

              <p>Name: __________________</p>

              <p>Designation: __________________</p>

              <p>Date: __________________</p>
            </div>
          </div>

          {/* ACCEPTANCE */}
          <div className="mt-14">
            <p
              style={{
                fontWeight: 700,
              }}
            >
              Candidate Acceptance
            </p>

            <p className="mt-3">
              I, Mr. {formData.employeeName || formData.employee_name || ""} hereby accept the terms and conditions of this
              offer of employment.
            </p>

            <div className="mt-8">
              <div
                style={{
                  borderTop: "1px solid #555",
                  width: "100%",
                  marginBottom: "5px",
                }}
              ></div>

              <p>Signature of Candidate</p>

              <p>Date: __________________</p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "55px",
            right: "55px",
            borderTop: "1px solid #5b6f9a",
            paddingTop: "5px",
            fontSize: "10px",
            color: "#999",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {formData.companyName}. | Confidential Document | Page 2
        </div>
      </div>
    </div>
  );
};

export default OfferLetterPreview;
