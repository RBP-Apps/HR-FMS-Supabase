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
              Employee Code
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Punch ID
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Father Name
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Date of Joining
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Designation
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Department
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Salary
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Mobile Number
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Personal Email
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Aadhar Address
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Current Address
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Bank Account
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              IFSC Code
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              PF ID
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              ESIC No
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Company PF
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Company ESIC
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Attendance Type
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Aadhar Front
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Aadhar Back
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              PAN Card
            </th>
            <th className="px-6 py-3 text-xs font-medium text-white uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 text-center">
          {tableLoading ? (
            <tr>
              <td colSpan="25" className="px-6 py-12 text-center">
                <div className="flex justify-center flex-col items-center">
                  <div className="w-6 h-6 border-4 border-indigo-500 border-dashed rounded-full animate-spin mb-2"></div>
                  <span className="text-gray-600 text-sm">
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
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Retry
                </button>
              </td>
            </tr>
          ) : filteredHistoryData.length === 0 ? (
            <tr>
              <td colSpan="25" className="px-6 py-12 text-center">
                <p className="text-gray-500">No history found.</p>
              </td>
            </tr>
          ) : (
            filteredHistoryData.map((item) => {
              // Find matching joining record
              const joiningRecord = joiningRecords.find(
                (record) => record.mobile_number === item.candidatePhone
              );

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                    {(() => {
                      const stats = getCompletionStats(item, visibleColumnsHistory, joiningRecord);
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEditClick(item, joiningRecord)}
                      className="px-3 py-1 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-xs"
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
