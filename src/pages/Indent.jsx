import React, { useEffect, useState } from 'react';
import { HistoryIcon, Plus, X, Search, XCircle } from 'lucide-react';
import useDataStore from '../store/dataStore';
import toast from 'react-hot-toast';
import supabase from "../utils/supabase";


const Indent = () => {
  const { addIndent } = useDataStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    post: '',
    gender: '',
    department: '',
    prefer: '',
    numberOfPost: '',
    competitionDate: '',
    socialSite: '',
    indentNumber: '',
    timestamp: '',
    experience: '', // New field for experience input
    socialSiteTypes: [], // New field for social site types
  });
  const [indentData, setIndentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [socialSiteOptions, setSocialSiteOptions] = useState([]);

  const [filterIndentNo, setFilterIndentNo] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterPost, setFilterPost] = useState("");
  const [searchTerm, setSearchTerm] = useState("");



  useEffect(() => {
    const loadData = async () => {
      setTableLoading(true);

      await fetchMasterData();

      const result = await fetchIndentData();
      if (result.success) {
        console.log("Indent data loaded");
      } else {
        console.error("Error:", result.error);
      }

      setTableLoading(false);
    };

    loadData();
  }, []);


  useEffect(() => {
    const loadData = async () => {
      setTableLoading(true);

      // Fetch master data first
      await fetchMasterData();

      // Then fetch indent data
      const result = await fetchIndentData();
      if (result.success) {
        console.log('Data from row 7:', result.data);
      } else {
        console.error('Error:', result.error);
      }
      setTableLoading(false);
    };
    loadData();
  }, []);


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


  // Progress column ke liye helper functions
  const getCompletionStats = (rowData, visibleColumns) => {
    const columnsToCheck = visibleColumns.filter(col =>
      col !== 'Action' && col !== 'Indent Number'
    );

    const total = columnsToCheck.length;
    let filled = 0;

    columnsToCheck.forEach(column => {
      let value;
      switch (column) {
        case 'Post': value = rowData.post; break;
        case 'Gender': value = rowData.gender; break;
        case 'Department': value = rowData.department; break;
        case 'Prefer': value = rowData.prefer; break;
        case 'Experience': value = rowData.experience; break;
        case 'No. of Post': value = rowData.noOfPost; break;
        case 'Completion Date': value = rowData.completionDate; break;
        case 'Social Site': value = rowData.socialSite; break;
        case 'Social Site Types': value = rowData.socialSiteTypes; break;
        default: value = rowData[column.toLowerCase().replace(/ /g, '')];
      }

      if (value !== null && value !== undefined && String(value).trim() !== '') {
        filled++;
      }
    });

    const unfilled = total - filled;
    const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { total, filled, unfilled, percent };
  };

  const getProgressColor = (percent) => {
    if (percent < 40) return "bg-red-500";
    if (percent <= 70) return "bg-yellow-500";
    return "bg-green-500";
  };


  const visibleColumns = [
    'Post', 'Gender', 'Department', 'Prefer', 'Experience',
    'No. of Post', 'Completion Date', 'Social Site', 'Social Site Types'
  ];


  const fetchMasterData = async () => {
    try {
      const { data, error } = await supabase
        .from("master_hr")
        .select("department, social_site");

      if (error) throw error;

      const departments = [
        ...new Set(data.map((item) => item.department).filter(Boolean)),
      ];

      const socialSites = [
        ...new Set(data.map((item) => item.social_site).filter(Boolean)),
      ];

      setDepartmentOptions(departments);
      setSocialSiteOptions(socialSites);

      return {
        success: true,
        departments,
        socialSites,
      };
    } catch (error) {
      console.error("Error fetching master data:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  };


  const fetchIndentData = async () => {
    try {
      const { data, error } = await supabase
        .from("indent")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processedData = data.map((row) => ({
        timestamp: row.created_at,
        indentNumber: row.indent_number,
        post: row.post,
        gender: row.gender,
        department: row.department,
        prefer: row.prefer,
        noOfPost: row.number_of_posts,
        completionDate: row.completion_date
          ? new Date(row.completion_date)
          : null,
        socialSite: row.social_site,
        experience: row.experience,
        socialSiteTypes: row.social_site_types,
      }));

      setIndentData(processedData);

      return {
        success: true,
        data: processedData,
      };
    } catch (error) {
      console.error("Error fetching indent:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  };


  const generateIndentNumber = async () => {
    try {
      const { data, error } = await supabase
        .from("indent")
        .select("indent_number")
        .order("id", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) return "REC-01";

      const last = data[0].indent_number;
      const num = parseInt(last.split("-")[1]) + 1;

      return `REC-${String(num).padStart(2, "0")}`;
    } catch (error) {
      console.error(error);
      return "REC-01";
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSocialSiteTypeChange = (e) => {
    const { value, checked } = e.target;

    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          socialSiteTypes: [...prev.socialSiteTypes, value]
        };
      } else {
        return {
          ...prev,
          socialSiteTypes: prev.socialSiteTypes.filter(type => type !== value)
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.post ||
      !formData.gender ||
      !formData.numberOfPost ||
      !formData.competitionDate ||
      !formData.socialSite
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.prefer === "Experience" && !formData.experience) {
      toast.error("Please enter experience details");
      return;
    }

    if (formData.socialSite === "Yes" && formData.socialSiteTypes.length === 0) {
      toast.error("Please select at least one social site type");
      return;
    }

    try {
      setSubmitting(true);

      const indentNumber = await generateIndentNumber();

      const { error } = await supabase.from("indent").insert([
        {
          indent_number: indentNumber,
          post: formData.post,
          gender: formData.gender,
          prefer: formData.prefer,
          number_of_posts: formData.numberOfPost,
          completion_date: formData.competitionDate,
          social_site: formData.socialSite,
          status: "NeedMore",
          experience:
            formData.prefer === "Experience" ? formData.experience : "",
          social_site_types:
            formData.socialSite === "Yes"
              ? formData.socialSiteTypes.join(", ")
              : "",
          department: formData.department,
        },
      ]);

      if (error) throw error;

      toast.success("Indent submitted successfully!");

      setFormData({
        post: "",
        gender: "",
        department: "",
        prefer: "",
        numberOfPost: "",
        competitionDate: "",
        socialSite: "",
        indentNumber: "",
        timestamp: "",
        experience: "",
        socialSiteTypes: [],
      });

      setShowModal(false);

      setTableLoading(true);
      await fetchIndentData();
      setTableLoading(false);
    } catch (error) {
      console.error("Insert error:", error);
      toast.error("Something went wrong!");
    } finally {
      setSubmitting(false);
    }
  };


  const handleCancel = () => {
    setFormData({
      post: '',
      gender: '',
      department: '',
      prefer: '',
      numberOfPost: '',
      competitionDate: '',
      socialSite: '',
      indentNumber: '',
      timestamp: '',
      experience: '',
      socialSiteTypes: [],
    });
    setShowModal(false);
  };

  const uniqueIndents = Array.from(new Set(indentData.map(i => i.indentNumber).filter(Boolean)));
  const uniquePosts = Array.from(new Set(indentData.map(i => i.post).filter(Boolean)));
  const uniqueGenders = ["Male", "Female", "Any"];

  const filteredIndentData = indentData.filter((item) => {
    const matchesSearch = searchTerm === "" ||
      item.indentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.post?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.gender?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesIndent = filterIndentNo === "" || item.indentNumber === filterIndentNo;
    const matchesPost = filterPost === "" || item.post === filterPost;
    const matchesGender = filterGender === "" || item.gender?.toLowerCase() === filterGender.toLowerCase();

    return matchesSearch && matchesIndent && matchesPost && matchesGender;
  });

  return (
    <div className="space-y-6 page-content p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Indent</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <Plus size={16} className="mr-2" />
              Create Indent
            </>
          )}
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-800">
                Create New Indent
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post (पद)*
                </label>
                <input
                  type="text"
                  name="post"
                  value={formData.post}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender (लिंग) *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Any">Any</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department (विभाग)
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departmentOptions.map((dept, index) => (
                    <option key={index} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prefer (प्राथमिकता)
                </label>
                <select
                  name="prefer"
                  value={formData.prefer}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Any</option>
                  <option value="Experience">Experience</option>
                  <option value="Fresher">Fresher</option>
                </select>
              </div>

              {/* Experience input field - only show when prefer is Experience */}
              {formData.prefer === "Experience" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (अनुभव) *
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter experience details"
                    required={formData.prefer === "Experience"}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number Of Post (पद की संख्या) *
                </label>
                <input
                  type="number"
                  name="numberOfPost"
                  value={formData.numberOfPost}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter number of posts"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completion Date (समापन तिथि) *
                </label>
                <input
                  type="date"
                  name="competitionDate"
                  value={formData.competitionDate}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Site (सोशल साइट) *
                </label>
                <select
                  name="socialSite"
                  value={formData.socialSite}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Social Site Types checklist - only show when socialSite is Yes */}
              {formData.socialSite === "Yes" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Social Site Types (सोशल साइट प्रकार) *
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {socialSiteOptions.map((option) => (
                      <div key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          id={option}
                          value={option}
                          checked={formData.socialSiteTypes.includes(option)}
                          onChange={handleSocialSiteTypeChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={option}
                          className="ml-2 block text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all duration-200 flex items-center justify-center"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <h2 className="text-lg font-bold text-gray-800">
          Indent Management
        </h2>
      </div>

      {/* Dynamic Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Indent Number Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Indent Number</label>
            <div className="relative">
              <input
                type="text"
                list="indentList"
                placeholder="Select/Search Indent"
                value={filterIndentNo}
                onChange={(e) => setFilterIndentNo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="indentList">
                {uniqueIndents.map(indent => (
                  <option key={indent} value={indent} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Gender Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Gender</label>
            <div className="relative">
              <input
                type="text"
                list="genderList"
                placeholder="Select/Search Gender"
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="genderList">
                {uniqueGenders.map(gender => (
                  <option key={gender} value={gender} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Post Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Post</label>
            <div className="relative">
              <input
                type="text"
                list="postList"
                placeholder="Select/Search Post"
                value={filterPost}
                onChange={(e) => setFilterPost(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              />
              <datalist id="postList">
                {uniquePosts.map(post => (
                  <option key={post} value={post} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Global Search */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">Global Search</label>
            <div className="relative h-full flex items-center">
              <input
                type="text"
                placeholder="Search all fields..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                size={16}
                className="absolute left-3 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end pt-2 mt-2 border-t border-gray-100">
          <button
            onClick={() => {
              setFilterIndentNo("");
              setFilterGender("");
              setFilterPost("");
              setSearchTerm("");
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {/* <div className="max-h-[calc(100vh-300px)] overflow-y-auto"> */}
          <div className="max-h-[calc(100vh-300px)] overflow-auto">

            <table className="min-w-full divide-y divide-gray-200 shadow text-nowrap">
              <thead className="bg-gray-50 sticky top-0 z-10 text-nowrap text-center">
                <tr>
                  <th className="sticky left-0 z-30 bg-gray-50 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px] border-r">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Indent Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prefer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No. of Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Social Site
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Social Site Types
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white text-center">
                {tableLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center flex-col items-center">
                        <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-2"></div>
                        <span className="text-gray-600 text-sm">
                          Loading indent data...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : indentData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <p className="text-gray-500">No indent data found.</p>
                    </td>
                  </tr>
                ) : filteredIndentData.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <p className="text-gray-500">No matching indent records found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredIndentData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="sticky left-0 z-20 bg-white group-hover:bg-gray-50 px-6 py-4 whitespace-nowrap text-sm border-r">
                        {(() => {
                          const stats = getCompletionStats(item, visibleColumns);
                          return (
                            <div className="flex flex-col items-center">
                              <div className="text-[10px] font-semibold text-gray-700 mb-1">
                                {stats.filled}/{stats.total} ({stats.percent}%)
                              </div>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`${getProgressColor(stats.percent)} h-1.5 rounded-full transition-all duration-300`}
                                  style={{ width: `${stats.percent}%` }}
                                ></div>
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
                        {item.indentNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renderField(item.post)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.gender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.prefer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renderField(item.experience)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.noOfPost}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-sm text-gray-900 break-words">
                          {item.completionDate
                            ? (() => {
                              const date = new Date(item.completionDate);
                              if (!date || isNaN(date.getTime()))
                                return "Invalid date";
                              const day = date
                                .getDate()
                                .toString()
                                .padStart(2, "0");
                              const month = (date.getMonth() + 1)
                                .toString()
                                .padStart(2, "0");
                              const year = date.getFullYear();
                              const hours = date
                                .getHours()
                                .toString()
                                .padStart(2, "0");
                              const minutes = date
                                .getMinutes()
                                .toString()
                                .padStart(2, "0");
                              const seconds = date
                                .getSeconds()
                                .toString()
                                .padStart(2, "0");
                              return (
                                <div>
                                  <div className="font-medium break-words">
                                    {`${day}/${month}/${year}`}
                                  </div>
                                  <div className="text-xs text-gray-500 break-words">
                                    {`${hours}:${minutes}:${seconds}`}
                                  </div>
                                </div>
                              );
                            })()
                            : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renderField(item.socialSite)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renderField(item.socialSiteTypes)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Indent;