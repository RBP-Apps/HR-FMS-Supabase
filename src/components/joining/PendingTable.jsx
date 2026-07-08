import React from 'react';
import { XCircle } from 'lucide-react';
import { getCompletionStats, getProgressColor, visibleColumnsPending } from '../../utils/joiningUtils';

const renderField = (value) => {
  if (value) {
    return <span>{value}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium">
      <XCircle size={14} />
      Missing
    </span>
  );
};

const PendingTable = ({
  tableLoading,
  error,
  filteredJoiningData,
  fetchJoiningData,
  handleJoiningClick
}) => {
  return (
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto rounded-2xl border border-slate-200/60 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-[#0F766E]/5 sticky top-0 z-10 text-nowrap border-b border-slate-200">
          <tr>
            <th className="sticky top-0 left-0 z-30 bg-slate-100 px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider min-w-[160px] border-r border-slate-200">
              Progress
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Action
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Indent No.
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Candidate Enquiry No.
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Applying For Post
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Department
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Candidate Name
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Phone
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Email
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Resume
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100 text-center">
          {tableLoading ? (
            <tr>
              <td colSpan="11" className="px-6 py-12 text-center">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-6 h-6 border-4 border-[#0F766E] border-dashed rounded-full animate-spin mb-2"></div>
                  <span className="text-slate-550 text-sm">
                    Loading pending joinings...
                  </span>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan="11" className="px-6 py-12 text-center">
                <p className="text-red-500">Error: {error}</p>
                <button
                  onClick={fetchJoiningData}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-[#065F46] to-[#0F766E] text-white rounded-xl"
                >
                  Retry
                </button>
              </td>
            </tr>
          ) : filteredJoiningData.length === 0 ? (
            <tr>
              <td colSpan="11" className="px-6 py-12 text-center">
                <p className="text-slate-500">
                  No pending joinings found.
                </p>
              </td>
            </tr>
          ) : (
            filteredJoiningData.map((item) => (
              <tr key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 px-6 py-4 whitespace-nowrap text-sm border-r border-slate-150">
                  {(() => {
                    const stats = getCompletionStats(item, visibleColumnsPending);
                    return (
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] font-semibold text-slate-700 mb-1">
                          {stats.filled}/{stats.total} ({stats.percent}%)
                        </div>
                        <div className="w-24 bg-slate-100 rounded-full h-1.5 border border-slate-200">
                          <div className={`${getProgressColor(stats.percent)} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${stats.percent}%` }}></div>
                        </div>
                        <div className="text-[10px] mt-1 space-x-1">
                          <span className="text-slate-600 font-medium">{stats.filled} Filled</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-500 font-medium">{stats.unfilled} Missing</span>
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleJoiningClick(item)}
                    className="px-3 py-1.5 text-white bg-gradient-to-r from-[#065F46] to-[#0F766E] hover:from-[#054f3a] hover:to-[#0c625b] rounded-xl text-xs font-semibold shadow-sm transition-all duration-205"
                  >
                    Joining
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {renderField(item.indentNo || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {renderField(item.candidateEnquiryNo || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {renderField(item.applyingForPost || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                  {renderField(item.department || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold">
                  {renderField(item.candidateName || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {renderField(item.candidatePhone || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {renderField(item.candidateEmail || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {renderField(item.candidateResume ? (
                    <a
                      href={item.candidateResume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0F766E] hover:underline font-semibold"
                    >
                      View
                    </a>
                  ) : (
                    ""
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-yellow-50 text-yellow-600 border border-yellow-100">
                    Pending Joining
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PendingTable;
