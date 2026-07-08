import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Header = ({ children }) => {
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm flex-shrink-0">
      <div className="flex justify-between items-center py-3 px-4 sm:px-6">
        <div className="flex items-center">
          {children}
          <div className="ml-4 max-w-md hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full py-2 pl-10 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] bg-slate-50 text-slate-800 placeholder-slate-400 text-sm transition-all"
              />
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Bell size={20} className="text-slate-500 hover:text-[#0F766E] cursor-pointer transition-colors" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </div>
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <User size={20} className="text-[#0F766E]" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-700">{user?.name || user?.Username || 'Guest'}</p>
              <p className="text-xs text-slate-500 font-medium">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Employee'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;