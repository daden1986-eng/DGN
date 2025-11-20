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
    `flex items-center space-x-3 p-3 mx-2 rounded-xl transition-all duration-300 ease-in-out ${
      isActive 
        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-500/20 translate-x-1' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
    }`;

  return (
    <div className="w-72 h-screen bg-slate-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col fixed left-0 top-0 z-50 shadow-2xl">
      {/* Header */}
      <div className="p-8 flex flex-col items-center relative">
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-sky-500/10 to-transparent pointer-events-none"></div>
         {settings.logoUrl ? (
           <img src={settings.logoUrl} alt="Logo" className="h-16 w-16 mb-4 object-cover rounded-2xl shadow-lg ring-2 ring-white/10" />
         ) : (
           <div className="h-16 w-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-sky-500/20 ring-2 ring-white/10">
             {settings.name.substring(0, 2)}
           </div>
         )}
         <h1 className="text-white font-bold tracking-wide text-xl text-center">{settings.name}</h1>
         <p className="text-xs text-slate-500 font-medium tracking-wider mt-1">FINANCIAL SYSTEM</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="px-6 pb-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">Menu Utama</div>
        <NavLink to="/dashboard" className={navClass}>
          <LayoutDashboard size={20} strokeWidth={1.5} /> <span className="font-medium">Dashboard</span>
        </NavLink>
        <NavLink to="/customers" className={navClass}>
          <Users size={20} strokeWidth={1.5} /> <span className="font-medium">Data Pelanggan</span>
        </NavLink>
        <NavLink to="/input" className={navClass}>
          <PenTool size={20} strokeWidth={1.5} /> <span className="font-medium">Input Transaksi</span>
        </NavLink>
        
        <div className="px-6 pb-2 pt-6 text-xs font-semibold text-slate-600 uppercase tracking-wider">Laporan</div>
        <NavLink to="/recap" className={navClass}>
          <ClipboardList size={20} strokeWidth={1.5} /> <span className="font-medium">Rekapitulasi</span>
        </NavLink>
        <NavLink to="/labul" className={navClass}>
          <PieChart size={20} strokeWidth={1.5} /> <span className="font-medium">Laba & Bagi Hasil</span>
        </NavLink>
        <NavLink to="/invoice" className={navClass}>
          <FileText size={20} strokeWidth={1.5} /> <span className="font-medium">Buat Invoice</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 mx-2 mb-2 border-t border-white/5">
        <NavLink to="/settings" className={navClass}>
          <Settings size={20} strokeWidth={1.5} /> <span className="font-medium">Pengaturan</span>
        </NavLink>
        <button onClick={handleLogout} className="flex items-center space-x-3 p-3 w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-300 mt-2 group">
          <LogOut size={20} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" /> <span className="font-medium">Keluar</span>
        </button>
      </div>
    </div>
  );
};