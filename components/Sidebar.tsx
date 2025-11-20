import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, PenTool, ClipboardList, PieChart, FileText, Settings, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useApp();

  const handleLogout = () => {
    localStorage.removeItem('dgn_auth');
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-accent text-white shadow-lg' 
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="w-64 h-screen bg-primary bg-opacity-95 backdrop-blur-md border-r border-slate-700 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-slate-700 flex flex-col items-center">
         {settings.logoUrl ? (
           <img src={settings.logoUrl} alt="Logo" className="h-12 mb-2 object-contain" />
         ) : (
           <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
             {settings.name.substring(0, 2)}
           </div>
         )}
         <h1 className="text-white font-bold tracking-wider text-lg">{settings.name}</h1>
         <p className="text-xs text-slate-400">Financial System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard size={20} /> <span>Dashboard</span>
        </NavLink>
        <NavLink to="/customers" className={navClass}>
          <Users size={20} /> <span>Data Pelanggan</span>
        </NavLink>
        <NavLink to="/input" className={navClass}>
          <PenTool size={20} /> <span>Inputan</span>
        </NavLink>
        <NavLink to="/recap" className={navClass}>
          <ClipboardList size={20} /> <span>Rekap Transaksi</span>
        </NavLink>
        <NavLink to="/labul" className={navClass}>
          <PieChart size={20} /> <span>Labul (Profit)</span>
        </NavLink>
        <NavLink to="/invoice" className={navClass}>
          <FileText size={20} /> <span>Invoice</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <NavLink to="/settings" className={navClass}>
          <Settings size={20} /> <span>Pengaturan</span>
        </NavLink>
        <button onClick={handleLogout} className="flex items-center space-x-3 p-3 w-full text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-lg transition-all mt-2">
          <LogOut size={20} /> <span>Keluar</span>
        </button>
      </div>
    </div>
  );
};