import React from "react";
import { Send, XCircle } from "lucide-react";

const SendOfferModal = ({
  formData,
  sendOfferEmail,
  setSendOfferEmail,
  sendingOffer,
  onClose,
  onSend,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Send size={20} className="text-indigo-600" />
            Send Offer Letter
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Send offer letter to <strong>{formData.employeeName}</strong>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="candidate@example.com"
              value={sendOfferEmail}
              onChange={(e) => setSendOfferEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              required
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600">
              <strong>Note:</strong> The offer letter PDF will be generated and sent to this email address.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold"
            disabled={sendingOffer}
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition shadow-md font-semibold"
            disabled={sendingOffer}
          >
            {sendingOffer ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={16} />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendOfferModal;
