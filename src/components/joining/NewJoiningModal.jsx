import React from 'react';
import { X } from 'lucide-react';

const NewJoiningModal = ({
  showJoiningModal,
  setShowJoiningModal,
  selectedItem,
  joiningFormData,
  handleJoiningInputChange,
  handleFileChange,
  handleJoiningSubmit,
  firmNames,
  attendanceTypeOptions,
  submitting
}) => {
  if (!showJoiningModal || !selectedItem) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-300">
          <h2 className="text-xl font-bold text-indigo-600">
            Employee Joining Form
          </h2>
          <button
            onClick={() => setShowJoiningModal(false)}
            className="text-gray-500 hover:text-white bg-gray-100 hover:bg-red-500 p-2 rounded-full transition-all duration-300"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleJoiningSubmit} className="p-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-6">
            {/* ====================== Section 1: Basic Details ====================== */}
            <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">
                Basic Details (मूल जानकारी)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RBP-Joining ID (जॉइनिंग आईडी) *
                  </label>
                  <input
                    type="text"
                    name="joiningId"
                    value={joiningFormData.joiningId}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-100 text-gray-700 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated joining ID
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name (कंपनी नाम)*
                  </label>
                  <select
                    name="firmName"
                    value={joiningFormData.firmName}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Company Name</option>
                    {firmNames.map((firm, index) => (
                      <option key={index} value={firm}>
                        {firm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name As Per Aadhar (नाम आधार के अनुसार)
                  </label>
                  <input
                    type="text"
                    name="nameAsPerAadhar"
                    value={joiningFormData.nameAsPerAadhar}
                    onChange={handleJoiningInputChange}
                    disabled={!joiningFormData.isNewEmployee}
                    placeholder="Enter name as per Aadhar card"
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!joiningFormData.isNewEmployee
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                      : "bg-white text-gray-700"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Father Name (पिता का नाम)
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={joiningFormData.fatherName}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Joining (जॉइनिंग की तारीख)
                  </label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={joiningFormData.dateOfJoining}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* ====================== Section 2: Work & Designation ====================== */}
            <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">
                Work Details (कार्य विवरण)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Location (कार्य स्थान)
                  </label>
                  <input
                    type="text"
                    name="workLocation"
                    value={joiningFormData.workLocation}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Designation (पदनाम)
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={joiningFormData.designation}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary(CTC) (वेतन)
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={joiningFormData.salary}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter salary"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* ====================== Section 3: Documents ====================== */}
            <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">
                Documents (दस्तावेज़)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Frontside Photo (आधार कार्ड फ्रंट फोटो)
                  </label>
                  <input
                    type="file"
                    name="aadharFrontPhoto"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "aadharFrontPhoto")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Backside Photo (आधार कार्ड बैक फोटो)
                  </label>
                  <input
                    type="file"
                    name="aadharBackPhoto"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "aadharBackPhoto")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Card (पैन कार्ड)
                  </label>
                  <input
                    type="file"
                    name="panCard"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "panCard")}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* ====================== Section 4: Family & Address ====================== */}
            <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">
                Family & Address (परिवार और पता)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Address (वर्तमान पता)
                  </label>
                  <textarea
                    name="currentAddress"
                    value={joiningFormData.currentAddress}
                    onChange={handleJoiningInputChange}
                    rows={3}
                    placeholder="Enter current address"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address as per Aadhar Card (आधार कार्ड के अनुसार पता)
                  </label>
                  <textarea
                    name="aadharAddress"
                    value={joiningFormData.aadharAddress}
                    onChange={handleJoiningInputChange}
                    rows={3}
                    placeholder="Enter address as per Aadhar Card"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* ====================== Section 5: Personal Info ====================== */}
            <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">
                Personal Info (व्यक्तिगत जानकारी)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Of Birth As per Aadhar (जन्मतिथि आधार के अनुसार)
                  </label>
                  <input
                    type="date"
                    name="dobAsPerAadhar"
                    value={joiningFormData.dobAsPerAadhar}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender (लिंग)
                  </label>
                  <select
                    name="gender"
                    value={joiningFormData.gender}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  >
                    <option value="">Select Gender (लिंग चुनें)</option>
                    <option value="Male">Male (पुरुष)</option>
                    <option value="Female">Female (महिला) </option>
                    <option value="Other">Other (अन्य)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number (मोबाइल नंबर)
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={joiningFormData.mobileNumber}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family Number (परिवार का नंबर)
                  </label>
                  <input
                    type="tel"
                    name="familyNumber"
                    value={joiningFormData.familyNumber}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter 10-digit family number"
                    maxLength={10}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* ====================== Section 6: Bank Details ====================== */}
            <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">
                Bank Details (बैंक विवरण)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Past PF / New PF Id No. (पिछला पीएफ आईडी नंबर)
                  </label>
                  <input
                    type="text"
                    name="pastPfId"
                    value={joiningFormData.pastPfId}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter past PF ID number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Past ESIC / New ESIC Number (पिछला ईएसआईसी नंबर)
                  </label>
                  <input
                    type="text"
                    name="pastEsicNumber"
                    value={joiningFormData.pastEsicNumber}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter past ESIC number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Bank Account Number (वर्तमान बैंक खाता नंबर)
                  </label>
                  <input
                    type="text"
                    name="currentBankAcNo"
                    value={joiningFormData.currentBankAcNo}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter current bank account number"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code (आईएफएससी कोड)
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={joiningFormData.ifscCode}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter IFSC code"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name (शाखा का नाम)
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={joiningFormData.branchName}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter branch name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* ====================== Section 7: Company & Employment Info ====================== */}
            <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">
                Company & Employment Info (कंपनी और रोजगार जानकारी)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Email ID (व्यक्तिगत ईमेल आईडी)
                  </label>
                  <input
                    type="email"
                    name="personalEmail"
                    value={joiningFormData.personalEmail}
                    onChange={handleJoiningInputChange}
                    placeholder="Enter personal email ID"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Does Company Provide PF? (क्या कंपनी PF प्रदान करती है?)
                  </label>
                  <select
                    name="companyProvidesPf"
                    value={joiningFormData.companyProvidesPf}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes (हाँ)</option>
                    <option value="No">No (नहीं)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Does Company Provide ESIC? (क्या कंपनी ESIC प्रदान करती है?)
                  </label>
                  <select
                    name="companyProvidesEsic"
                    value={joiningFormData.companyProvidesEsic}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes (हाँ)</option>
                    <option value="No">No (नहीं)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Does Company Provide Email ID? (क्या कंपनी ईमेल आईडी प्रदान करती है?)
                  </label>
                  <select
                    name="companyProvidesEmail"
                    value={joiningFormData.companyProvidesEmail}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes (हाँ)</option>
                    <option value="No">No (नहीं)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendance Type (उपस्थिति प्रकार)
                  </label>
                  <select
                    name="attendanceType"
                    value={joiningFormData.attendanceType}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                  >
                    <option value="">Select Attendance Type</option>
                    {attendanceTypeOptions.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Category (कर्मचारी श्रेणी) *
                  </label>
                  <select
                    name="employeeCategory"
                    value={joiningFormData.employeeCategory}
                    onChange={handleJoiningInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700"
                    required
                  >
                    <option value="">Select Employee Category</option>
                    <option value="Field Staff">Field Staff (फील्ड स्टाफ)</option>
                    <option value="Office Staff">Office Staff (कार्यालय स्टाफ)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ====================== Section 8: Candidate Actions ====================== */}
            <div className="p-4 border rounded-lg shadow-sm bg-gray-50">
              <h2 className="text-lg font-semibold mb-4 text-purple-700">
                Candidate Actions (उम्मीदवार क्रियाएँ)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="validateCandidate"
                    checked={joiningFormData.validateCandidate || false}
                    onChange={handleJoiningInputChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    Validate the Candidate (उम्मीदवार का सत्यापन)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="issueGmailId"
                    checked={joiningFormData.issueGmailId || false}
                    onChange={handleJoiningInputChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    Issue Gmail ID (जीमेल आईडी जारी करना)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="issueJoiningLetter"
                    checked={joiningFormData.issueJoiningLetter || false}
                    onChange={handleJoiningInputChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    Issue Joining Letter (जॉइनिंग लेटर जारी करना)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="attendanceRegistration"
                    checked={joiningFormData.attendanceRegistration || false}
                    onChange={handleJoiningInputChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    Attendance Registration (उपस्थिति पंजीकरण)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="pfRegistration"
                    checked={joiningFormData.pfRegistration || false}
                    onChange={handleJoiningInputChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    PF Registration (पीएफ पंजीकरण)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="esicRegistration"
                    checked={joiningFormData.esicRegistration || false}
                    onChange={handleJoiningInputChange}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">
                    ESIC Registration (ईएसआईसी पंजीकरण)
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={() => setShowJoiningModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-white bg-indigo-700 rounded-md hover:bg-indigo-800 flex items-center justify-center min-h-[42px] ${submitting ? "opacity-90 cursor-not-allowed" : ""
                }`}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white mr-2"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewJoiningModal;
