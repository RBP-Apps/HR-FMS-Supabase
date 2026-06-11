import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import supabase from '../utils/supabase';

export default function PayrollPage() {
    const [allSheets, setAllSheets] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState(null);
    const [sheetData, setSheetData] = useState([]);
    const [loading, setLoading] = useState(false);

    // FILTERS
    const [dateFilter, setDateFilter] = useState('');
    const [search, setSearch] = useState('');

    // =========================================
    // FETCH SHEETS
    // =========================================

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

            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const uniqueUploadId =
                Date.now().toString() +
                '-' +
                Math.random().toString(36).substring(2, 9);

            const formattedData = jsonData.map((item) => ({
                upload_id: uniqueUploadId,
                sheet_name: file.name,
                excel_row: item,
            }));

            const { error } = await supabase
                .from('after_payment_work')
                .insert(formattedData);

            if (error) {
                console.log(error);
                alert('Upload Failed');
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

        return Object.keys(
            sheetData[0]?.excel_row || {}
        );
    }, [sheetData]);


    const filteredRows = useMemo(() => {
        return sheetData.filter((row) => {
            return JSON.stringify(row.excel_row)
                .toLowerCase()
                .includes(search.toLowerCase());
        });
    }, [sheetData, search]);

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

                <div className="lg:col-span-3 bg-white rounded-3xl shadow-lg overflow-hidden">
                    <div className="overflow-auto h-[80vh]">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-gray-100 z-10">
                                <tr>
                                    {columns.map((column) => (
                                        <th
                                            key={column}
                                            className="border px-4 py-3 text-left whitespace-nowrap"
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
                                            colSpan={columns.length}
                                            className="text-center py-10"
                                        >
                                            Loading...
                                        </td>
                                    </tr>
                                ) : filteredRows.length > 0 ? (
                                    filteredRows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-gray-50"
                                        >
                                            {columns.map((column) => (
                                                <td
                                                    key={column}
                                                    className="border p-2"
                                                >
                                                    <input
                                                        value={
                                                            row?.excel_row?.[
                                                            column
                                                            ] || ''
                                                        }
                                                        onChange={(e) =>
                                                            handleCellEdit(
                                                                row.id,
                                                                column,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full outline-none bg-transparent"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={columns.length || 1}
                                            className="text-center py-10 text-gray-500"
                                        >
                                            No Data Found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}