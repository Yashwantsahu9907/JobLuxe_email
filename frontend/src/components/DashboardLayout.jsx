import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, History, FileText, Send, User, LogOut } from 'lucide-react';
import { useAccount } from '../context/AccountContext';
import ActiveCampaignPanel from './ActiveCampaignPanel';
import AccountSwitcherModal from './AccountSwitcherModal';

const DashboardLayout = ({ children }) => {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const { activeAccount, refreshAccounts } = useAccount();

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64  bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl  font-bold text-slate-800 flex items-center gap-2">
            <Send className=" text-green-600" />
            JobLuxe
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Mail size={20} />
            New Campaign
          </NavLink>
          <NavLink
            to="/templates"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <FileText size={20} />
            Templates
          </NavLink>
          <NavLink
            to="/logs"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <History size={20} />
            History Logs
          </NavLink>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => {
              localStorage.removeItem('adminToken');
              window.location.href = '/login';
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0">
          <h2 className="text-lg font-medium text-slate-800">Admin Panel</h2>
          
          <button 
            onClick={() => setIsAccountModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all font-medium text-sm shadow-sm ${
              !activeAccount ? 'animate-pulse shadow-md border-blue-400 ring-2 ring-blue-500/20' : ''
            }`}
          >
            <User size={18} className="text-blue-600" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Active Account</span>
              <span className="max-w-[150px] truncate">{activeAccount?.email || 'Setup Account'}</span>
            </div>
          </button>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-6xl mx-auto space-y-8">
            <ActiveCampaignPanel />
            {children}
          </div>
        </div>
      </main>
      
      <AccountSwitcherModal 
        isOpen={isAccountModalOpen} 
        onClose={() => {
          setIsAccountModalOpen(false);
          refreshAccounts();
        }} 
      />
    </div>
  );
};

export default DashboardLayout;
