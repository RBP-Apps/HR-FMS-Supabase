import React, { useState } from "react";
import supabase from "../../utils/supabase";

export default function LeaveLedgerDashboard({
  filtered,
  leaveBalances,
  leaveLedger,
  employees,
  setShowAdjustModal,
  loadDynamicData
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");

  // Edit Ledger Transaction State
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editForm, setEditForm] = useState({
    employee_id: "",
    ledger_date: "",
    leave_type: "CL",
    transaction_type: "CREDIT",
    amount: 1,
    remarks: ""
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenEditModal = (row) => {
    setEditingTransaction(row);
    const isCredit = (row.transaction_type || "").toUpperCase() === "CREDIT";
    const amount = isCredit ? (row.earned || 0) : (row.used || 0);
    const dateStr = (row.ledger_date || "").split("T")[0];

    setEditForm({
      employee_id: row.employee_id || "",
      ledger_date: dateStr,
      leave_type: row.leave_type || "CL",
      transaction_type: row.transaction_type || "CREDIT",
      amount: amount || 1,
      remarks: row.remarks || ""
    });
  };

  const handleSaveEditTransaction = async (e) => {
    e.preventDefault();
    if (!editingTransaction) return;

    if (!editForm.employee_id || !editForm.ledger_date || !editForm.amount || !editForm.remarks.trim()) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      setIsUpdating(true);
      const isCredit = editForm.transaction_type === "CREDIT";
      const { error } = await supabase
        .from("leave_ledger")
        .update({
          employee_id: editForm.employee_id,
          ledger_date: editForm.ledger_date,
          leave_type: editForm.leave_type,
          transaction_type: editForm.transaction_type,
          earned: isCredit ? Number(editForm.amount) : 0,
          used: !isCredit ? Number(editForm.amount) : 0,
          remarks: editForm.remarks
        })
        .eq("id", editingTransaction.id);

      if (error) throw error;

      alert("Ledger transaction updated successfully!");
      setEditingTransaction(null);
      if (typeof loadDynamicData === "function") {
        await loadDynamicData();
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
      alert("Failed to update transaction: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ledger transaction? This will recalculate leave balances.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("leave_ledger")
        .delete()
        .eq("id", id);

      if (error) throw error;

      alert("Ledger transaction deleted successfully!");
      if (typeof loadDynamicData === "function") {
        await loadDynamicData();
      }
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction: " + err.message);
    }
  };

  const filteredBalances = filtered.filter(emp => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const bal = leaveBalances[emp.id] || leaveBalances[String(emp.id)] || { earnedCL: 0, usedCL: 0, remainingCL: 0, lwpCount: 0 };

    const code = (emp.code || "").toString().toLowerCase();
    const name = (emp.name || "").toString().toLowerCase();
    const earnedCL = (bal.earnedCL || 0).toString().toLowerCase();
    const usedCL = (bal.usedCL || 0).toString().toLowerCase();
    const remainingCL = (bal.remainingCL || 0).toString().toLowerCase();
    const lwpCount = (bal.lwpCount || 0).toString().toLowerCase();

    return (
      code.includes(term) ||
      name.includes(term) ||
      earnedCL.includes(term) ||
      usedCL.includes(term) ||
      remainingCL.includes(term) ||
      lwpCount.includes(term)
    );
  });

  // const filteredTransactions = leaveLedger.filter(row => {
  //   if (!searchTerm.trim()) return true;
  //   const term = searchTerm.toLowerCase().trim();
  //   const emp = employees.find(e => String(e.id) === String(row.employee_id));

  //   const empName = emp ? emp.name.toLowerCase() : `id: ${row.employee_id}`.toLowerCase();
  //   const empCode = emp && emp.code ? emp.code.toLowerCase() : "";
  //   const date = (row.ledger_date || "").toString().toLowerCase();
  //   const leaveType = (row.leave_type || "").toString().toLowerCase();
  //   const txType = (row.transaction_type || "").toString().toLowerCase();
  //   const earned = (row.earned || 0).toString().toLowerCase();
  //   const used = (row.used || 0).toString().toLowerCase();
  //   const remarks = (row.remarks || "").toString().toLowerCase();

  //   return (
  //     empName.includes(term) ||
  //     empCode.includes(term) ||
  //     date.includes(term) ||
  //     leaveType.includes(term) ||
  //     txType.includes(term) ||
  //     earned.includes(term) ||
  //     used.includes(term) ||
  //     remarks.includes(term)
  //   );
  // });



  const filteredTransactions = leaveLedger.filter(row => {
  if (!transactionSearchTerm.trim()) return true;

  const term = transactionSearchTerm.toLowerCase().trim();
  const emp = employees.find(e => String(e.id) === String(row.employee_id));

  const empName = emp
    ? (emp.name || "").toLowerCase()
    : `id: ${row.employee_id}`.toLowerCase();

  const empCode = emp && emp.code
    ? emp.code.toLowerCase()
    : "";

  const date = (row.ledger_date || "").toString().toLowerCase();
  const leaveType = (row.leave_type || "").toString().toLowerCase();
  const txType = (row.transaction_type || "").toString().toLowerCase();
  const earned = (row.earned || 0).toString().toLowerCase();
  const used = (row.used || 0).toString().toLowerCase();
  const remarks = (row.remarks || "").toString().toLowerCase();

  return (
    empName.includes(term) ||
    empCode.includes(term) ||
    date.includes(term) ||
    leaveType.includes(term) ||
    txType.includes(term) ||
    earned.includes(term) ||
    used.includes(term) ||
    remarks.includes(term)
  );
});



  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Leave Ledger Dashboard</h3>
          <p className="text-xs text-slate-400">Total Credits, Used leaves, LWP counts and Balances dynamically calculated from transactions ledger.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
            
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            ➕ Manual HR Adjustment
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">Employee Code</th>
                <th className="p-4">Employee Name</th>
                <th className="p-4">CL Credits</th>
                <th className="p-4">CL Used</th>
                <th className="p-4">CL Balance</th>
                <th className="p-4">LWP (Current Month)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredBalances.map(emp => {
                const bal = leaveBalances[emp.id] || { earnedCL: 0, usedCL: 0, remainingCL: 0, lwpCount: 0 };
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-slate-500">{emp.code}</td>
                    <td className="p-4 font-bold text-slate-800">{emp.name}</td>
                    <td className="p-4 text-violet-600 font-semibold">{bal.earnedCL}</td>
                    <td className="p-4 text-slate-500">{bal.usedCL}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold ${bal.remainingCL > 0 ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-500"}`}>
                        {bal.remainingCL}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-red-600">{bal.lwpCount}</td>
                  </tr>
                );
              })}
              {filteredBalances.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">No matching leave records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions History */}
     <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 space-y-3">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
    <div>
      <h4 className="font-bold text-slate-800 text-sm">
        Recent Ledger Transactions
      </h4>
      <p className="text-[10px] text-slate-400 mt-0.5">
        Search employee, date, leave type, transaction, credits, debits or remarks.
      </p>
    </div>

    <div className="relative w-full sm:w-72">
      <input
        type="text"
        placeholder="Search transactions..."
        value={transactionSearchTerm}
        onChange={(e) => setTransactionSearchTerm(e.target.value)}
        className="w-full pl-8 pr-8 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
      />

      <span className="absolute left-1.5 top-2 text-slate-400 text-xs">
        🔍
      </span>

      {transactionSearchTerm && (
        <button
          onClick={() => setTransactionSearchTerm("")}
          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
        >
          ✕
        </button>
      )}
    </div>
  </div>
        <div className="overflow-y-auto max-h-[300px] border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Employee</th>
                <th className="p-3">Date</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Transaction</th>
                <th className="p-3">Earned (Credits)</th>
                <th className="p-3">Used (Debits)</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {filteredTransactions.slice(0, 100).map(row => {
                const emp = employees.find(e => String(e.id) === String(row.employee_id));
                return (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{emp ? emp.name : `ID: ${row.employee_id}`}</td>
                    <td className="p-3 font-mono">{row.ledger_date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.leave_type === "CL" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                        {row.leave_type}
                      </span>
                    </td>
                    <td className="p-3 font-bold">
                      <span className={`text-[10px] uppercase font-black ${row.transaction_type === "CREDIT" ? "text-emerald-600" : "text-red-500"
                        }`}>
                        {row.transaction_type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-emerald-600">{row.earned || 0}</td>
                    <td className="p-3 font-bold text-red-500">{row.used || 0}</td>
                    <td className="p-3 text-slate-500 italic">{row.remarks}</td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(row)}
                        className="text-slate-500 hover:text-indigo-600 font-bold text-xs transition-colors"
                        title="Edit Transaction"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(row.id)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs transition-colors"
                        title="Delete Transaction"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400 italic">No ledger transaction logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Ledger Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 animate-fadeIn">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              ✏️ Edit Ledger Transaction
            </h3>
            <form onSubmit={handleSaveEditTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editForm.employee_id}
                  onChange={e => setEditForm({ ...editForm, employee_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.code} - {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editForm.ledger_date}
                  onChange={e => setEditForm({ ...editForm, ledger_date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Leave Type
                  </label>
                  <select
                    value={editForm.leave_type}
                    onChange={e => setEditForm({ ...editForm, leave_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="PL">Privilege Leave (PL)</option>
                    <option value="SL">Sick Leave (SL)</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={editForm.transaction_type}
                    onChange={e => setEditForm({ ...editForm, transaction_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="CREDIT">Credit (Add)</option>
                    <option value="DEBIT">Debit (Subtract)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Amount (Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.5"
                  step="0.5"
                  value={editForm.amount}
                  onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="2"
                  value={editForm.remarks}
                  onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="Enter remarks for this transaction..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-bold transition-all"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 border border-slate-200 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
