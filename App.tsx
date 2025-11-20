import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { InputEntry } from './pages/InputEntry';
import { ProfitSharing } from './pages/ProfitSharing';
import { SettingsPage } from './pages/Settings';
import { TransactionType, PaymentMethod } from './types';
import { useApp } from './context/AppContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// -- Inline Simple Components for brevity --

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      localStorage.setItem('dgn_auth', 'true');
      navigate('/dashboard');
    } else {
      setError('Username atau password salah!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070')] bg-cover bg-center opacity-20"></div>
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 relative z-10 backdrop-blur-md bg-opacity-80">
        <h1 className="text-3xl font-bold text-white text-center mb-2">DGN FINANCE</h1>
        <p className="text-slate-400 text-center mb-8">Silahkan login untuk melanjutkan</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-accent outline-none transition" />
          </div>
          <div>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-accent outline-none transition" />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full bg-accent hover:bg-sky-600 text-white font-bold py-3 rounded-lg transition shadow-lg">MASUK</button>
        </form>
      </div>
    </div>
  );
};

const ProtectedLayout: React.FC = () => {
  const auth = localStorage.getItem('dgn_auth');
  if (!auth) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans relative">
      {/* Background Image Global */}
      <div className="fixed inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069')] bg-cover bg-center opacity-10"></div>
      
      <Sidebar />
      <main className="flex-1 ml-64 relative z-10 overflow-y-auto h-screen">
        <Outlet />
      </main>
    </div>
  );
};

// Recap Transaction Page
const RecapPage: React.FC = () => {
  const { transactions } = useApp();
  const [filter, setFilter] = useState('');
  
  const filtered = transactions.filter(t => t.description.toLowerCase().includes(filter.toLowerCase()) || t.amount.toString().includes(filter));

  return (
    <div className="p-6">
       <h2 className="text-2xl font-bold text-white mb-6">Rekap Transaksi</h2>
       <div className="mb-4">
         <input type="text" placeholder="Cari transaksi..." value={filter} onChange={e => setFilter(e.target.value)} className="bg-slate-800 border border-slate-600 p-2 rounded w-full md:w-1/3 text-white" />
       </div>
       <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
         <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Deskripsi</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Metode</th>
                <th className="p-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-700/50">
                  <td className="p-3 text-xs text-slate-500">{t.id}</td>
                  <td className="p-3">{t.date}</td>
                  <td className="p-3">{t.description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${t.type === TransactionType.INCOME ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>{t.type}</span>
                  </td>
                  <td className="p-3">{t.method}</td>
                  <td className={`p-3 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
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

// Invoice Generator Page
const InvoicePage: React.FC = () => {
  const { settings } = useApp();
  const [to, setTo] = useState('');
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const handlePrint = () => {
    const total = qty * price;
    const doc = new jsPDF();
    
    // Simple Invoice Layout
    doc.setFontSize(20);
    doc.text("INVOICE", 160, 20);
    
    doc.setFontSize(16);
    doc.text(settings.name, 14, 20);
    doc.setFontSize(10);
    doc.text(settings.address, 14, 26);
    
    doc.text("Kepada Yth:", 14, 50);
    doc.setFontSize(12);
    doc.text(to, 14, 56);
    
    autoTable(doc, {
       startY: 70,
       head: [['Deskripsi', 'Qty', 'Harga Satuan', 'Total']],
       body: [[desc, qty, `Rp ${price.toLocaleString('id-ID')}`, `Rp ${total.toLocaleString('id-ID')}`]],
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Tagihan: Rp ${total.toLocaleString('id-ID')}`, 140, finalY, { align: 'left' });
    
    doc.text("Transfer ke:", 14, finalY + 20);
    doc.text(`${settings.bankName} - ${settings.accountNumber} (a.n ${settings.accountHolder})`, 14, finalY + 26);

    doc.save(`Invoice_Custom_${Date.now()}.pdf`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Buat Invoice Manual</h2>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm">Ditujukan Kepada</label>
            <input value={to} onChange={e => setTo(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
          </div>
          <div>
            <label className="text-slate-400 text-sm">Deskripsi Item</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-slate-400 text-sm">Qty</label>
              <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="text-slate-400 text-sm">Harga Satuan (Rp)</label>
              <input type="number" value={price} onChange={e => setPrice(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
            </div>
          </div>
          <div className="pt-4">
            <p className="text-white font-bold text-xl mb-4">Total: Rp {(qty * price).toLocaleString('id-ID')}</p>
            <button onClick={handlePrint} className="bg-accent hover:bg-sky-600 text-white px-6 py-2 rounded w-full">Cetak Invoice PDF</button>
          </div>
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