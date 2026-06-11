import React from "react";
import { FileCheck, Send } from "lucide-react";

const SendConfirmationModal = ({
  confirmationTarget,
  confirmationEmailAddress,
  setConfirmationEmailAddress,
  confirmationEmailSending,
  onClose,
  onSend,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-100 transform transition-all duration-300 scale-100">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <FileCheck size={20} className="text-green-600" />
          Send Confirmation Letter
        </h3>

        <p className="text-sm text-gray-500 mb-4">
          Enter the employee's email address to send the confirmation letter for <strong>{confirmationTarget.employee_name}</strong>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="employee@example.com"
              value={confirmationEmailAddress}
              onChange={(e) => setConfirmationEmailAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold"
            disabled={confirmationEmailSending}
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition shadow-md font-semibold"
            disabled={confirmationEmailSending}
          >
            {confirmationEmailSending ? (
              <div className="w-5 h-5 border-2 border-white border-dashed rounded-full animate-spin"></div>
            ) : (
              <>
                <Send size={16} />
                Send Confirmation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendConfirmationModal;
