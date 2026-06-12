import React from "react";
import {
  Search,
  Plus,
  Filter,
  FileText,
  Clock,
  Send,
  CheckCircle,
  FileCheck,
} from "lucide-react";

const ListView = ({
  stats,
  filters,
  setFilters,
  clearFilters,
  activeTab,
  setActiveTab,
  filteredOffers,
  tableLoading,
  getStatusColor,
  setIsConfirmationMode,
  setCurrentView,
  departmentOptions,
  setCurrentStep,
  confirmationLettersCount,
  confirmationLetters = [],
  onSendOfferEmail,
  onSendConfirmationEmail,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-600">Offer  & Confirmation Letter Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsConfirmationMode(false);
              setCurrentView("create");
              setCurrentStep(1);
            }}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition shadow-md font-semibold"
          >
            <Plus size={20} />
            Create Offer Letter
          </button>
          <button
            onClick={() => {
              setActiveTab("pendingConfirmation");
              setIsConfirmationMode(true);
              setCurrentView("create");
              setCurrentStep(1);
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md font-semibold"
          >
            <FileCheck size={20} />
            Create Confirmation Letter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Candidates", value: stats.total, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Pending Offer", value: stats.draft, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Sent Offers", value: stats.sent, icon: Send, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Confirmed Employees", value: confirmationLettersCount, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search employee..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>

          {departmentOptions?.map((dept, index) => (
            <option key={index} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <button
          onClick={clearFilters}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 font-semibold"
        >
          <Filter size={18} />
          Clear Filters
        </button>
      </div>

      {/* Tabs - Pending, Pending Confirmation, and History */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-4 text-sm font-bold border-b-2 transition ${activeTab === "pending"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            Pending Offer Letter  ({stats.draft})
          </button>
          <button
            onClick={() => setActiveTab("pendingConfirmation")}
            className={`py-4 text-sm font-bold border-b-2 transition ${activeTab === "pendingConfirmation"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            Pending Confirmation Letter ({stats.pendingConfirmation})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 text-sm font-bold border-b-2 transition ${activeTab === "history"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
          >
            History  ({confirmationLettersCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-center">
            <thead className="bg-indigo-600 text-white sticky top-0 z-10 text-center">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">Employee Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">Department</th>
                <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">Designation</th>
                <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">Mobile No</th>
                <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">Email</th>
                <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">Offer Date</th>
                <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">Status</th>
                {activeTab !== "pending" && (
                  <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">
                    Letter
                  </th>
                )}
                {activeTab !== "history" && (
                  <th className="px-6 py-4 text-sm font-semibold text-white bg-indigo-600 text-center">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tableLoading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                  </td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-10 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4 font-medium text-indigo-600">
                      #{offer.id || offer.offerId || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase">
                          {offer.employee_name?.charAt(0) || "U"}
                        </div>
                        <span className="font-semibold text-gray-800 text-left">{offer.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{offer.department || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{offer.designation || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{offer.mobile_number || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{offer.email || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{offer.offer_date || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(offer.status)}`}>
                        {activeTab === "pendingConfirmation" ? "Pending Confirmation" : offer.status}
                      </span>
                    </td>

                    {activeTab !== "pending" && (
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center justify-center gap-2">

                          {offer.pdf_url && (
                            <a
                              href={offer.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
          bg-indigo-50 text-indigo-700 border border-indigo-200
          hover:bg-indigo-100 hover:shadow-sm transition-all duration-200
          text-xs font-semibold"
                            >
                              <FileText size={14} />
                              Offer Letter
                            </a>
                          )}

                          {(() => {
                            const confLetter = confirmationLetters.find(
                              c => c.follow_up_id === offer.follow_up_id
                            );

                            if (confLetter?.pdf_url) {
                              return (
                                <a
                                  href={confLetter.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg
              bg-green-50 text-green-700 border border-green-200
              hover:bg-green-100 hover:shadow-sm transition-all duration-200
              text-xs font-semibold"
                                >
                                  <FileCheck size={14} />
                                  Confirmation
                                </a>
                              );
                            }

                            return null;
                          })()}

                          {!offer.pdf_url &&
                            !confirmationLetters.some(
                              c => c.follow_up_id === offer.follow_up_id
                            ) && (
                              <span
                                className="inline-flex items-center px-3 py-1.5 rounded-lg
            bg-gray-100 text-gray-500 text-xs font-medium"
                              >
                                No Letter
                              </span>
                            )}
                        </div>
                      </td>
                    )}
                    {activeTab !== "history" && (
                      <td className="px-6 py-4">
                        {/* {activeTab === "pending" && (offer.status === "Draft" || offer.status === "Pending") && (
                          <button
                            onClick={() => onSendOfferEmail && onSendOfferEmail(offer)}
                            className="inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            <Plus size={12} />
                            Create Offer
                          </button>
                        )}
                        {activeTab === "pendingConfirmation" && (
                          <button
                            onClick={() => onSendConfirmationEmail && onSendConfirmationEmail(offer)}
                            className="inline-flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            <Plus size={12} />
                            Create Conf
                          </button>
                        )} */}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListView;
