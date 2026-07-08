import React from 'react';
import { XCircle } from 'lucide-react';
import { getCompletionStats, getProgressColor, visibleColumnsHistory, formatDate } from '../../utils/joiningUtils';

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

const HistoryTable = ({
  tableLoading,
  error,
  filteredHistoryData,
  joiningRecords,
  fetchJoiningData,
  fetchJoiningDataForHistory,
  handleEditClick
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
              Employee Code
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Punch ID
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Name
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Father Name
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Date of Joining
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Designation
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Department
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Salary
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Mobile Number
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Personal Email
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Aadhar Address
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Current Address
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Bank Account
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              IFSC Code
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              PF ID
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              ESIC No
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Company PF
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Company ESIC
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Attendance Type
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Aadhar Front
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Aadhar Back
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              PAN Card
            </th>
            <th className="px-6 py-3 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50/80">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100 text-center">
          {tableLoading ? (
            <tr>
              <td colSpan="25" className="px-6 py-12 text-center">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-6 h-6 border-4 border-[#0F766E] border-dashed rounded-full animate-spin mb-2"></div>
                  <span className="text-slate-550 text-sm">
                    Loading history...
                  </span>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan="25" className="px-6 py-12 text-center">
                <p className="text-red-500">Error: {error}</p>
                <button
                  onClick={() => {
                    fetchJoiningData();
                    fetchJoiningDataForHistory();
                  }}
                  className="mt-2 px-4 py-2 bg-gradient-to-r from-[#065F46] to-[#0F766E] text-white rounded-xl"
                >
                  Retry
                </button>
              </td>
            </tr>
          ) : filteredHistoryData.length === 0 ? (
            <tr>
              <td colSpan="25" className="px-6 py-12 text-center">
                <p className="text-slate-500">No history found.</p>
              </td>
            </tr>
          ) : (
            filteredHistoryData.map((item) => {
              // Find matching joining record
              const joiningRecord = joiningRecords.find(
                (record) => record.mobile_number === item.candidatePhone
              );

              return (
                <tr key={item.id} className="hover:bg-emerald-50/10 transition-colors">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 px-6 py-4 whitespace-nowrap text-sm border-r border-slate-150">
                    {(() => {
                      const stats = getCompletionStats(item, visibleColumnsHistory, joiningRecord);
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEditClick(item, joiningRecord)}
                      className="px-3 py-1.5 text-[#0F766E] bg-emerald-50 border border-emerald-100 hover:bg-emerald-100/50 rounded-xl text-xs font-semibold transition-all duration-200"
                    >
                      Edit
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.rbp_joining_id || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.punch_id || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.name_as_per_aadhar || item.candidateName || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.father_name || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.date_of_joining ? formatDate(joiningRecord.date_of_joining) : "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.designation || item.applyingForPost || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.department || item.department || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.salary || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.mobile_number || item.candidatePhone || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.personal_email || item.candidateEmail || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.aadhar_address ? (
                      <div className="max-w-[150px] truncate" title={joiningRecord.aadhar_address}>
                        {joiningRecord.aadhar_address}
                      </div>
                    ) : "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.current_address ? (
                      <div className="max-w-[150px] truncate" title={joiningRecord.current_address}>
                        {joiningRecord.current_address}
                      </div>
                    ) : "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.bank_account_number || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.ifsc_code || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.past_pf_id || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.past_esic_number || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded-full ${joiningRecord?.company_pf_provided ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {joiningRecord?.company_pf_provided ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs rounded-full ${joiningRecord?.company_esic_provided ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {joiningRecord?.company_esic_provided ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.attendance_type || "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.aadhar_front_photo ? (
                      <a href={joiningRecord.aadhar_front_photo} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                        View
                      </a>
                    ) : "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.aadhar_back_photo ? (
                      <a href={joiningRecord.aadhar_back_photo} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                        View
                      </a>
                    ) : "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {renderField(joiningRecord?.pan_card ? (
                      <a href={joiningRecord.pan_card} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">
                        View
                      </a>
                    ) : "")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryTable;
