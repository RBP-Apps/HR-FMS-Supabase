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
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#065F46] to-[#0F766E] tracking-tight">Offer & Confirmation Letter Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsConfirmationMode(false);
              setCurrentView("create");
              setCurrentStep(1);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] text-white px-4 py-2.5 rounded-xl shadow-md shadow-emerald-950/10 transition-all font-semibold text-sm"
          >
            <Plus size={18} />
            Create Offer Letter
          </button>
          <button
            onClick={() => {
              setActiveTab("pendingConfirmation");
              setIsConfirmationMode(true);
              setCurrentView("create");
              setCurrentStep(1);
            }}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-sm transition-all font-semibold text-sm"
          >
            <FileCheck size={18} />
            Create Confirmation Letter
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Candidates", value: stats.total, icon: FileText, color: "text-[#0F766E]", bg: "bg-emerald-50 border border-emerald-100" },
          { label: "Pending Offer", value: stats.draft, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 border border-yellow-100" },
          { label: "Sent Offers", value: stats.sent, icon: Send, color: "text-[#0F766E]", bg: "bg-teal-50 border border-teal-100" },
          { label: "Confirmed Employees", value: confirmationLettersCount, icon: CheckCircle, color: "text-[#0F766E]", bg: "bg-emerald-50 border border-emerald-100" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" size={16} />
          <input
            type="text"
            placeholder="Search employee..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all hover:border-slate-350"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="relative">
          <select
            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 text-sm transition-all hover:border-slate-350 appearance-none font-semibold text-slate-700"
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
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 text-xs">
            ▼
          </div>
        </div>

        <div></div> {/* Spacer */}

        <button
          onClick={clearFilters}
          className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-100 rounded-xl px-4 py-2.5 transition flex items-center justify-center gap-2 font-semibold text-sm"
        >
          <Filter size={16} />
          Clear Filters
        </button>
      </div>

      {/* Tabs - Pending, Pending Confirmation, and History */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`py-4 text-sm font-bold border-b-2 transition ${activeTab === "pending"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-450 hover:text-slate-700"
              }`}
          >
            Pending Offer Letter ({stats.draft})
          </button>
          <button
            onClick={() => setActiveTab("pendingConfirmation")}
            className={`py-4 text-sm font-bold border-b-2 transition ${activeTab === "pendingConfirmation"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-450 hover:text-slate-700"
              }`}
          >
            Pending Confirmation Letter ({stats.pendingConfirmation})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-4 text-sm font-bold border-b-2 transition ${activeTab === "history"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-450 hover:text-slate-700"
              }`}
          >
            History ({confirmationLettersCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="sticky top-0 bg-[#0F766E]/5 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">ID</th>
                <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">Employee Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">Department</th>
                <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">Designation</th>
                <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">Mobile No</th>
                <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">Email</th>
                <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">Offer Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">Status</th>
                {activeTab !== "pending" && (
                  <th className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap bg-slate-50/50 text-center">
                    Letter
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {tableLoading ? (
                <tr>
                  <td colSpan="11" className="px-6 py-10 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#0F766E] border-t-transparent"></div>
                  </td>
                </tr>
              ) : filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-10 text-center text-slate-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-emerald-50/20 transition-colors group">
                    <td className="px-6 py-4 font-bold text-[#0F766E] whitespace-nowrap text-center">
                      {offer.enquiry_number || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center gap-3 justify-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-[#0F766E] flex items-center justify-center text-xs font-bold uppercase">
                          {offer.employee_name?.charAt(0) || "U"}
                        </div>
                        <span className="font-semibold text-slate-800 text-left">{offer.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 text-center">{offer.department || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 text-center">{offer.designation || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">{offer.mobile_number || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">{offer.email || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-center">{offer.offer_date || "N/A"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getStatusColor(offer.status)}`}>
                        {activeTab === "pendingConfirmation" ? "Pending Confirmation" : offer.status}
                      </span>
                    </td>

                    {activeTab !== "pending" && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {offer.pdf_url && (
                            <a
                              href={offer.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                bg-emerald-50 text-[#0F766E] border border-emerald-150
                                hover:bg-emerald-100/50 transition-all duration-200
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                    bg-[#0F766E]/5 text-[#0F766E] border border-[#0F766E]/15
                                    hover:bg-[#0F766E]/10 transition-all duration-200
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
                                className="inline-flex items-center px-3 py-1.5 rounded-xl
                                  bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200"
                              >
                                No Letter
                              </span>
                            )}
                        </div>
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
