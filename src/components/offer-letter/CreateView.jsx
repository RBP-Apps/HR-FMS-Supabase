import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Info,
  FileCheck,
  Briefcase,
  Search,
} from "lucide-react";
import OfferLetterPreview from "./OfferLetterPreview";
import ConfirmationLetterPreview from "./ConfirmationLetterPreview";

const CreateView = ({
  isConfirmationMode,
  currentStep,
  setCurrentStep,
  setCurrentView,
  setIsConfirmationMode,
  formData,
  handleInputChange,
  selectionSearch,
  setSelectionSearch,
  pendingForCreate,
  selectPendingConfirmationCandidate,
  joiningHistory,
  selectEmployee,
  saveConfirmationLetter,
  generateConfirmationPDF,
  downloadPreviewAsPDF,
  downloadConfirmationPreviewAsPDF,
  handleGenerateAndSend,
  handleGenerateAndSendConfirmation,
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => {
              setCurrentView("list");
              setIsConfirmationMode(false);
            }}
            className="group flex items-center gap-2 bg-gradient-to-r from-black to-gray-800 text-white px-5 py-2.5 rounded-xl shadow-md hover:from-gray-900 hover:to-black hover:shadow-xl transition-all duration-300 mb-2"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-semibold tracking-wide">Back to List</span>
          </button>
          <h1 className="text-2xl font-bold text-orange-500">
            {isConfirmationMode ? "Create Confirmation Letter" : "Create New Offer Letter"}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          Step {currentStep} of 4
          <div className="w-32 h-2 bg-gray-100 rounded-full ml-3 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Wizard Steps */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
        {/* Step 1: Selection */}
        {currentStep === 1 && (
          <div className="p-8 space-y-6 flex-1">
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Step 1: Select {isConfirmationMode ? "Candidate (Offer Sent)" : "Employee"}
              </h2>
              <p className="text-gray-500">
                {isConfirmationMode
                  ? "Select candidates whose offer letter has been sent"
                  : "Search for candidates from joining history to auto-fill details"}
              </p>

              <div className="relative mt-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={isConfirmationMode ? "Search by name or department..." : "Search by name or joining ID..."}
                  value={selectionSearch}
                  onChange={(e) => setSelectionSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg shadow-inner"
                />
              </div>

              <div className="mt-8 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {isConfirmationMode ? (
                  pendingForCreate.filter((candidate) => {
                    const term = selectionSearch.toLowerCase();
                    return (
                      candidate.employee_name?.toLowerCase().includes(term) ||
                      candidate.department?.toLowerCase().includes(term) ||
                      candidate.designation?.toLowerCase().includes(term)
                    );
                  }).length === 0 ? (
                    <div className="p-8 text-gray-400">No candidates with sent offer letters found</div>
                  ) : (
                    pendingForCreate
                      .filter((candidate) => {
                        const term = selectionSearch.toLowerCase();
                        return (
                          candidate.employee_name?.toLowerCase().includes(term) ||
                          candidate.department?.toLowerCase().includes(term) ||
                          candidate.designation?.toLowerCase().includes(term)
                        );
                      })
                      .map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => selectPendingConfirmationCandidate(candidate)}
                          className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition group"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center font-bold">
                              {candidate.employee_name?.charAt(0) || "C"}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{candidate.employee_name}</p>
                              <p className="text-xs text-gray-500">
                                {candidate.department} | {candidate.designation} | ₹{candidate.salary?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition" size={24} />
                        </button>
                      ))
                  )
                ) : (
                  joiningHistory.filter((emp) => {
                    const term = selectionSearch.toLowerCase();
                    return (
                      emp.name_as_per_aadhar?.toLowerCase().includes(term) ||
                      emp.rbp_joining_id?.toLowerCase().includes(term) ||
                      emp.designation?.toLowerCase().includes(term)
                    );
                  }).length === 0 ? (
                    <div className="p-8 text-gray-400">No matching employees found in history</div>
                  ) : (
                    joiningHistory
                      .filter((emp) => {
                        const term = selectionSearch.toLowerCase();
                        return (
                          emp.name_as_per_aadhar?.toLowerCase().includes(term) ||
                          emp.rbp_joining_id?.toLowerCase().includes(term) ||
                          emp.designation?.toLowerCase().includes(term)
                        );
                      })
                      .map((emp) => (
                        <button
                          key={emp.id}
                          onClick={() => selectEmployee(emp)}
                          className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition group"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                              {emp.name_as_per_aadhar?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-800">{emp.name_as_per_aadhar}</p>
                              <p className="text-xs text-gray-500">
                                {emp.rbp_joining_id} | {emp.designation}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition" size={24} />
                        </button>
                      ))
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Employee Details */}
        {currentStep === 2 && (
          <div className="p-8 space-y-8 flex-1">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <Info size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Step 2: Employee Details</h2>
                <p className="text-sm text-gray-500">Verify and update basic information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Department *</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Designation *</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email ID *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation Details (for confirmation letter mode) */}
        {isConfirmationMode && currentStep === 3 && (
          <div className="p-8 space-y-8 flex-1">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <FileCheck size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Step 3: Confirmation Details</h2>
                <p className="text-sm text-gray-500">Enter confirmation letter details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Confirmation Date</label>
                <input
                  type="date"
                  name="confirmationDate"
                  value={formData.confirmationDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Effective Date</label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
           
          </div>
        )}

        {/* Step 3: Offer Details (for offer letter mode) */}
        {!isConfirmationMode && currentStep === 3 && (
          <div className="p-8 space-y-8 flex-1">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <Briefcase size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Step 3: Offer Letter Conditions</h2>
                <p className="text-sm text-gray-500">Specify work terms and policies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Offer Letter Date</label>
                <input
                  type="date"
                  name="offerDate"
                  value={formData.offerDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Date of Joining *</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Reporting To *</label>
                <input
                  type="text"
                  name="reportingTo"
                  value={formData.reportingTo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter reporting manager name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Place of Posting *</label>
                <input
                  type="text"
                  name="placeOfPosting"
                  value={formData.placeOfPosting}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter work location"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Probation Period</label>
                <select
                  name="probationPeriod"
                  value={formData.probationPeriod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option>3 Months</option>
                  <option>6 Months</option>
                  <option>1 Year</option>
                  <option>None</option>
                </select>
              </div>
              {formData.probationPeriod !== "None" && formData.probationEndDate && (
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">Probation End Date</label>
                  <input
                    type="text"
                    value={formData.probationEndDate}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Notice Period</label>
                <input
                  type="text"
                  name="noticePeriod"
                  value={formData.noticePeriod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview (only for offer letter) */}
        {!isConfirmationMode && currentStep === 4 && <OfferLetterPreview formData={formData} />}

        {/* Preview for Confirmation Letter */}
        {isConfirmationMode && currentStep === 4 && <ConfirmationLetterPreview formData={formData} />}

        {/* Action Bar */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition ${
              currentStep === 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-white shadow-sm"
            }`}
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="flex items-center gap-3">
            {isConfirmationMode ? (
              currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-bold"
                >
                  Next Step
                  <ChevronRight size={20} />
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadConfirmationPreviewAsPDF}
                    className="bg-white text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-50 transition border border-gray-200 font-bold shadow-sm"
                  >
                    Download Draft
                  </button>
                  <button
                    onClick={handleGenerateAndSendConfirmation}
                    className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-bold"
                  >
                    Generate & Send
                  </button>
                </div>
              )
            ) : currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-bold"
              >
                Next Step
                <ChevronRight size={20} />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={downloadPreviewAsPDF}
                  className="bg-white text-gray-700 px-6 py-2.5 rounded-xl hover:bg-gray-50 transition border border-gray-200 font-bold shadow-sm"
                >
                  Download Draft
                </button>
                <button
                  onClick={handleGenerateAndSend}
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-bold"
                >
                  Generate & Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateView;
