import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import supabase from '../utils/supabase';
import { Maximize2, X, FileSpreadsheet, Search } from 'lucide-react';

export const FIXED_COLUMNS = [
    'SL',
    'EMP CODE',
    'NAME',
    'ACCOUNT NO',
    'IFSC CODE',
    'COMPANY PROVIDES PF',
    'COMPANY PROVIDES ESIC',
    'DESIGNATION',
    'DEPARTMENT',
    'PRESENT',
    'WORKING DAYS',
    'GROSS (Real)',
    'BASIC+DA (Real)',
    'HRA (Real)',
    'GROSS EARNED',
    'OT',
    'EPF 12%',
    'ESIC 0.75%',
    'ADVANCE',
    'SECURITY DEP',
    'LATE DEDUCTION',
    'OTHER DED',
    'TOTAL DED',
    'REIMBURSEMENT',
    'SALARY ARREARS',
    'NET SALARY',
    'TA DA',
    'TOTAL PAYABLE',
    'EMPLOYER EPF 13%',
    'EMPLOYER ESIC 3.25%',
    'CTC',
    'REMARK'
];

export default function PayrollPage() {
    const [allSheets, setAllSheets] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [sheetData, setSheetData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // FILTERS
    const [dateFilter, setDateFilter] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                setIsModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

  

    const fetchSheets = async () => {
        setLoading(true);

        try {
            let query = supabase
                .from('after_payment_work')
                .select('*')
                .order('uploaded_at', { ascending: false });

            if (dateFilter) {
                query = query.eq('uploaded_date', dateFilter);
            }

            const { data, error } = await query;

            if (error) {
                console.log(error);
                return;
            }

            // GROUP BY upload_id
            const grouped = {};

            data.forEach((item) => {
                if (!grouped[item.upload_id]) {
                    grouped[item.upload_id] = {
                        upload_id: item.upload_id,
                        sheet_name: item.sheet_name,
                        uploaded_at: item.upload_at,
                        total_rows: 0,
                    };
                }

                grouped[item.upload_id].total_rows += 1;
            });

            setAllSheets(Object.values(grouped));
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSheets();
    }, [dateFilter]);

    // =========================================
    // FETCH SHEET DATA
    // =========================================

    const fetchSheetData = async (uploadId) => {
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('after_payment_work')
                .select('*')
                .eq('upload_id', uploadId)
                .order('id');

            if (error) {
                console.log(error);
                return;
            }

            setSelectedSheet(uploadId);
            setSheetData(data || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // UPLOAD EXCEL
    // =========================================

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = async (evt) => {
            const binaryStr = evt.target.result;

            const workbook = XLSX.read(binaryStr, {
                type: 'binary',
            });

            const sheetName = workbook.SheetNames[0];

            const worksheet = workbook.Sheets[sheetName];

            // Use defval: '' to ensure blank cells are preserved
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            const uniqueUploadId =
                Date.now().toString() +
                '-' +
                Math.random().toString(36).substring(2, 9);

            const formattedData = jsonData.map((item) => {
                const orderedRow = {};
                // Ensure all fixed columns are present in exact sequence
                FIXED_COLUMNS.forEach((col) => {
                    const matchingKey = Object.keys(item).find(
                        (k) => k.trim().toLowerCase() === col.trim().toLowerCase()
                    );
                    orderedRow[col] = (matchingKey && item[matchingKey] !== undefined)
                        ? item[matchingKey]
                        : (item[col] !== undefined ? item[col] : '');
                });

                // Also include any extra columns that might be in the excel
                Object.keys(item).forEach((k) => {
                    const isAlreadyIncluded = FIXED_COLUMNS.some(
                        (fc) => fc.trim().toLowerCase() === k.trim().toLowerCase()
                    );
                    if (!isAlreadyIncluded) {
                        orderedRow[k] = item[k];
                    }
                });

                return {
                    upload_id: uniqueUploadId,
                    sheet_name: file.name,
                    excel_row: orderedRow,
                };
            });

            const { error } = await supabase
                .from('after_payment_work')
                .insert(formattedData);

            if (error) {
                console.log(error);
                alert('Upload Failed: ' + (error.message || ''));
                return;
            }

            alert('Excel Uploaded Successfully');

            fetchSheets();
        };

        reader.readAsBinaryString(file);
    };

    // =========================================
    // DELETE FULL SHEET
    // =========================================

    const handleDeleteSheet = async (uploadId) => {
        const confirmDelete = window.confirm(
            'Delete Full Sheet ?'
        );

        if (!confirmDelete) return;

        const { error } = await supabase
            .from('after_payment_work')
            .delete()
            .eq('upload_id', uploadId);

        if (error) {
            console.log(error);
            return;
        }

        alert('Sheet Deleted');

        if (selectedSheet === uploadId) {
            setSelectedSheet(null);
            setSheetData([]);
        }

        fetchSheets();
    };

    const handleCellEdit = async (
        rowId,
        column,
        value
    ) => {
        const updatedRows = [...sheetData];

        const rowIndex = updatedRows.findIndex(
            (r) => r.id === rowId
        );

        if (rowIndex === -1) return;

        updatedRows[rowIndex].excel_row[column] = value;

        setSheetData(updatedRows);

        const { error } = await supabase
            .from('after_payment_work')
            .update({
                excel_row:
                    updatedRows[rowIndex].excel_row,
            })
            .eq('id', rowId);

        if (error) {
            console.log(error);
        }
    };


    const columns = useMemo(() => {
        if (sheetData.length === 0) return [];

        const allKeys = new Set();
        sheetData.forEach((row) => {
            if (row?.excel_row) {
                Object.keys(row.excel_row).forEach((k) => allKeys.add(k));
            }
        });

        const orderedCols = [];
        // 1. First add the user's fixed columns in the exact sequence
        FIXED_COLUMNS.forEach((col) => {
            const matchedKey = [...allKeys].find(
                (k) => k.trim().toLowerCase() === col.trim().toLowerCase()
            );
            if (matchedKey) {
                orderedCols.push(matchedKey);
                allKeys.delete(matchedKey);
            } else {
                orderedCols.push(col);
            }
        });

        // 2. Add any remaining extra columns found in the data
        allKeys.forEach((k) => {
            if (!orderedCols.includes(k)) {
                orderedCols.push(k);
            }
        });

        return orderedCols;
    }, [sheetData]);


    const filteredRows = useMemo(() => {
        return sheetData.filter((row) => {
            return JSON.stringify(row.excel_row)
                .toLowerCase()
                .includes(search.toLowerCase());
        });
    }, [sheetData, search]);

    const activeSheet = useMemo(() => {
        return allSheets.find((s) => s.upload_id === selectedSheet);
    }, [allSheets, selectedSheet]);

    const renderTable = (isModal = false) => (
        <table className="w-full border-collapse bg-white">
            <thead className={`sticky top-0 z-10 ${isModal ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                <tr>
                    <th
                        className={`border px-3 py-3 text-center text-xs font-bold uppercase tracking-wider w-12 sticky left-0 z-20 ${
                            isModal ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                    >
                        #
                    </th>
                    {columns.map((column) => (
                        <th
                            key={column}
                            className={`border px-4 py-3 text-left whitespace-nowrap text-xs font-bold uppercase tracking-wider ${
                                isModal ? 'text-white border-indigo-500' : 'text-gray-700 border-gray-200'
                            }`}
                        >
                            {column}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody>
                {loading ? (
                    <tr>
                        <td
                            colSpan={columns.length + 1 || 1}
                            className="text-center py-16 text-gray-500 font-semibold"
                        >
                            Loading sheet data...
                        </td>
                    </tr>
                ) : filteredRows.length > 0 ? (
                    filteredRows.map((row, idx) => (
                        <tr
                            key={row.id}
                            className="hover:bg-indigo-50/50 transition-colors group"
                        >
                            <td className="border p-2 text-center text-xs font-semibold text-gray-400 bg-gray-50/50 sticky left-0 group-hover:bg-indigo-50/50">
                                {idx + 1}
                            </td>
                            {columns.map((column) => (
                                <td
                                    key={column}
                                    className="border p-2 text-xs"
                                >
                                    <input
                                        value={
                                            row?.excel_row?.[column] !== undefined && row?.excel_row?.[column] !== null
                                                ? row.excel_row[column]
                                                : ''
                                        }
                                        onChange={(e) =>
                                            handleCellEdit(
                                                row.id,
                                                column,
                                                e.target.value
                                            )
                                        }
                                        className="w-full outline-none bg-transparent px-1.5 py-1 rounded hover:bg-white focus:bg-white focus:ring-1 focus:ring-indigo-400 transition-all font-medium text-gray-700"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td
                            colSpan={columns.length + 1 || 1}
                            className="text-center py-16 text-gray-500"
                        >
                            {selectedSheet ? 'No matching rows found' : 'Select a sheet from the sidebar to view data'}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-5">
            {/* HEADER */}

            <div className="bg-white rounded-3xl p-6 shadow-lg mb-5">
                <div className="flex flex-col lg:flex-row justify-between gap-5">
                    <div>
                        <h1 className="text-3xl font-bold text-indigo-600">
                            After Payment Report
                        </h1>

                    </div>

                    <div>
                        <label className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl cursor-pointer font-semibold shadow-lg transition-all">
                            Upload Excel

                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                className="hidden"
                                onChange={handleExcelUpload}
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* FILTERS */}

            <div className="bg-white rounded-3xl p-5 shadow-lg mb-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) =>
                            setDateFilter(e.target.value)
                        }
                        className="border rounded-2xl px-4 py-3"
                    />

                    <input
                        type="text"
                        placeholder="Search anything..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        className="border rounded-2xl px-4 py-3"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* LEFT SIDEBAR */}

                <div className="bg-white rounded-3xl shadow-lg p-4 h-[80vh] overflow-auto">
                    <h2 className="text-xl font-bold mb-4">
                        Uploaded Sheets
                    </h2>

                    <div className="space-y-3">
                        {allSheets.map((sheet) => (
                            <div
                                key={sheet.upload_id}
                                className={`border rounded-2xl p-4 cursor-pointer transition-all ${selectedSheet === sheet.upload_id
                                    ? 'bg-blue-50 border-blue-500'
                                    : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div
                                    onClick={() =>
                                        fetchSheetData(sheet.upload_id)
                                    }
                                >
                                    <h3 className="font-bold text-gray-800 break-all">
                                        {sheet.sheet_name}
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Rows : {sheet.total_rows}
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        handleDeleteSheet(
                                            sheet.upload_id
                                        )
                                    }
                                    className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm"
                                >
                                    Delete Sheet
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TABLE */}

                <div className="lg:col-span-3 bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col">
                    {/* Header bar above table */}
                    <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
                                <FileSpreadsheet className="w-5 h-5" />
                            </span>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-800 text-sm md:text-base truncate">
                                    {activeSheet?.sheet_name || (selectedSheet ? 'Active Sheet' : 'No Sheet Selected')}
                                </h3>
                                <p className="text-xs text-gray-500">
                                    {selectedSheet
                                        ? `${filteredRows.length} of ${sheetData.length} records · ${columns.length} columns`
                                        : 'Select a sheet from the sidebar to view data'}
                                </p>
                            </div>
                        </div>

                        {selectedSheet && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-150 active:scale-95"
                                title="Open table in full width modal"
                            >
                                <Maximize2 className="w-4 h-4" />
                                <span>Full Width Modal ⛶</span>
                            </button>
                        )}
                    </div>

                    <div className="overflow-auto h-[74vh]">
                        {renderTable(false)}
                    </div>
                </div>
            </div>

            {/* FULL WIDTH TABLE MODAL */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 md:p-6"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsModalOpen(false);
                    }}
                >
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[98vw] h-[95vh] flex flex-col overflow-hidden border border-gray-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-700 text-white flex items-center justify-between gap-4 shrink-0 shadow-md">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 bg-white/10 rounded-2xl shrink-0">
                                    <FileSpreadsheet className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base md:text-lg font-bold truncate">
                                        {activeSheet?.sheet_name || 'After Payment Sheet'}
                                    </h2>
                                    <p className="text-xs text-indigo-100 mt-0.5">
                                        Showing {filteredRows.length} of {sheetData.length} records &bull; {columns.length} columns &bull; Full Width View
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {/* Local Search Bar */}
                                <div className="relative hidden sm:block">
                                    <input
                                        type="text"
                                        placeholder="Search in table..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="bg-white/15 border border-white/25 rounded-xl px-3 py-1.5 text-xs text-white placeholder-indigo-200 outline-none focus:bg-white/25 focus:ring-1 focus:ring-white w-48 md:w-64"
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch('')}
                                            className="absolute right-2.5 top-1.5 text-indigo-200 hover:text-white text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all duration-150 active:scale-95"
                                    title="Close full view"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Table Content */}
                        <div className="flex-1 overflow-auto bg-slate-50">
                            {renderTable(true)}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-2.5 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 shrink-0">
                            <span>
                                💡 Tip: You can edit values directly inside this modal. Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono text-[10px]">Esc</kbd> to exit.
                            </span>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                            >
                                Back to Normal View
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}