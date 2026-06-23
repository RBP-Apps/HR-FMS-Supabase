import React from 'react';
import { Search, X, UserPlus } from 'lucide-react';

const JoiningFilters = ({
  filterIndentNo, setFilterIndentNo, uniqueIndents,
  filterPost, setFilterPost, uniquePosts,
  filterName, setFilterName, uniqueNames,
  searchTerm, setSearchTerm,
  onClearFilters, onNewJoining
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex flex-col space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">

        {/* Post Filter */}
        <div className="lg:col-span-3 flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Applying For Post
          </label>
          <div className="relative">
            <input
              type="text"
              list="joiningPostList"
              placeholder="Select/Search Post"
              value={filterPost}
              onChange={(e) => setFilterPost(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
            />
            <datalist id="joiningPostList">
              {uniquePosts.map((post, i) => (
                <option key={`post-${i}`} value={post} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Name Filter */}
        <div className="lg:col-span-3 flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Name As Per Aadhaar
          </label>
          <div className="relative">
            <input
              type="text"
              list="joiningNameList"
              placeholder="Select/Search Name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
            />
            <datalist id="joiningNameList">
              {uniqueNames.map((name, i) => (
                <option key={`name-${i}`} value={name} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Global Search */}
        <div className="lg:col-span-4 flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Global Search
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search all fields..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-700 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="lg:col-span-2">
          <button
            onClick={onClearFilters}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <X size={16} />
            Clear Filters
          </button>
        </div>

      </div>

      {/* Actions Button */}
      <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
        {/* New Employee Joining Button */}
        <button
          onClick={onNewJoining}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap text-sm"
        >
          <UserPlus size={16} />
          New Employee Joining
        </button>
      </div>
    </div>
  );
};

export default JoiningFilters;
