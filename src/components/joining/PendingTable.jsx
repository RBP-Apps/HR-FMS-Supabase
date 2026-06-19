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
    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-indigo-600 sticky text-center top-0 z-10 text-nowrap">
          <tr>
            <th className="sticky left-0 z-30 bg-indigo-600 px-6 py-3 text-xs font-medium text-white uppercase tracking-wider min-w-[160px] border-r">
              Progress
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Action
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Indent No.
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Candidate Enquiry No.
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Applying For Post
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Candidate Name
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Resume
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-center">
          {tableLoading ? (
            <tr>
              <td colSpan="11" className="px-6 py-12 text-center">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                  <span className="text-gray-600 text-sm">
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
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Retry
                </button>
              </td>
            </tr>
          ) : filteredJoiningData.length === 0 ? (
            <tr>
              <td colSpan="11" className="px-6 py-12 text-center">
                <p className="text-gray-500">
                  No pending joinings found.
                </p>
              </td>
            </tr>
          ) : (
            filteredJoiningData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                  {(() => {
                    const stats = getCompletionStats(item, visibleColumnsPending);
                    return (
                      <div className="flex flex-col items-center">
                        <div className="text-[10px] font-semibold text-gray-700 mb-1">
                          {stats.filled}/{stats.total} ({stats.percent}%)
                        </div>
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div className={`${getProgressColor(stats.percent)} h-1.5 rounded-full transition-all duration-300`} style={{ width: `${stats.percent}%` }}></div>
                        </div>
                        <div className="text-[10px] mt-1 space-x-1">
                          <span className="text-gray-600 font-medium">{stats.filled} Filled</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-gray-500 font-medium">{stats.unfilled} Missing</span>
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleJoiningClick(item)}
                    className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-opacity-90 text-sm"
                  >
                    Joining
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderField(item.indentNo || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderField(item.candidateEnquiryNo || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderField(item.applyingForPost || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderField(item.department || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderField(item.candidateName || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderField(item.candidatePhone || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderField(item.candidateEmail || "")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {renderField(item.candidateResume ? (
                    <a
                      href={item.candidateResume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View
                    </a>
                  ) : (
                    ""
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
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
