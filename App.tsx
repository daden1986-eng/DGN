import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { InputEntry } from './pages/InputEntry';
import { ProfitSharing } from './pages/ProfitSharing';
import { SettingsPage } from './pages/Settings';
import { TransactionType } from './types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Search, FileText, ArrowRight, Lock, User } from 'lucide-react';

// -- Simplified Components --

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('dgn_auth', 'true');
      navigate('/dashboard');
    } else {
      alert('Login Gagal!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-slate-950"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/20 rounded-full blur-[100px]"></div>
      
      <div className="relative z-10 bg-white/5 backdrop-blur-2xl p-10 rounded-3xl border border-white/10 shadow-2xl w-full max-w-md mx-4 animation-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">DGN<span className="text-sky-400">.</span></h1>
          <p className="text-slate-400 text-sm">Financial Management System</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="relative">
             <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
             <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-sky-500/50 outline-none transition-all" />
          </div>
          <div className="relative">
             <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
             <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-sky-500/50 outline-none transition-all" />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-500/20 transition-all transform hover:-translate-y-1 flex justify-center items-center gap-2 group">
            Masuk Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </form>
      </div>
    </div>
  );
};

const ProtectedLayout: React.FC = () => {
  const auth = localStorage.getItem('dgn_auth');
  if (!auth) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30">
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-900/10 via-slate-950 to-slate-950 pointer-events-none"></div>
      <Sidebar />
      <main className="flex-1 ml-72 relative z-10 overflow-y-auto h-screen scrollbar-hide p-4">
        <Outlet />
      </main>
    </div>
  );
};

const RecapPage: React.FC = () => {
  const { transactions } = useApp();
  const [filter, setFilter] = useState('');
  const filtered = transactions.filter(t => t.description.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto">
       <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Rekapitulasi</h2>
          <div className="relative w-64">
             <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
             <input type="text" placeholder="Cari transaksi..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:bg-white/10 outline-none transition-all" />
          </div>
       </div>
       <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
         <table className="w-full text-left text-slate-300">
            <thead className="bg-black/20 text-slate-400 text-xs uppercase font-bold">
              <tr><th className="p-5">Tanggal</th><th className="p-5">Deskripsi</th><th className="p-5">Metode</th><th className="p-5 text-right">Nominal</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-white/5 transition">
                  <td className="p-5 text-sm">{t.date}</td>
                  <td className="p-5 font-medium text-white">{t.description}</td>
                  <td className="p-5 text-sm opacity-70">{t.method}</td>
                  <td className={`p-5 text-right font-bold font-mono ${t.type === TransactionType.INCOME ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
         </table>
       </div>
    </div>
  )
};

const InvoicePage: React.FC = () => {
  const { settings } = useApp();
  const [to, setTo] = useState('');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const handlePrint = () => {
    const total = qty * price;
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text("INVOICE", 160, 20);
    doc.setFontSize(16); doc.text(settings.name, 14, 20);
    doc.setFontSize(10); doc.text(`Kpd: ${to}`, 14, 40);
    autoTable(doc, { startY: 50, head: [['Item', 'Qty', 'Harga', 'Total']], body: [[desc, qty, price, total]] });
    doc.save(`INV_${Date.now()}.pdf`);
  };

  return (
    <div className="p-8 flex justify-center items-center min-h-[80vh]">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-xl w-full shadow-2xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-2">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><FileText size={24}/></div>
            <div>
                <h2 className="text-2xl font-bold text-white">Buat Invoice</h2>
                <p className="text-slate-400 text-xs">Generate dokumen tagihan manual</p>
            </div>
        </div>
        <div className="space-y-4">
           <input placeholder="Nama Penerima" value={to} onChange={e => setTo(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500/50 outline-none" />
           <input placeholder="Deskripsi Layanan/Barang" value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500/50 outline-none" />
           <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Qty" value={qty} onChange={e => setQty(parseInt(e.target.value))} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none" />
              <input type="number" placeholder="Harga Satuan" value={price} onChange={e => setPrice(parseInt(e.target.value))} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none" />
           </div>
           <div className="bg-black/30 p-4 rounded-xl flex justify-between items-center">
              <span className="text-slate-400">Total Estimasi</span>
              <span className="text-xl font-bold text-white">Rp {(qty * price).toLocaleString('id-ID')}</span>
           </div>
           <button onClick={handlePrint} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all">Unduh Invoice PDF</button>
        </div>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/input" element={<InputEntry />} />
            <Route path="/recap" element={<RecapPage />} />
            <Route path="/labul" element={<ProfitSharing />} />
            <Route path="/invoice" element={<InvoicePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;