import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TransactionType } from '../types';
import { Download, Plus, Trash, PieChart, ArrowUp, ArrowDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ProfitSharing: React.FC = () => {
  const { transactions, settings, investors, setInvestors } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const summary = useMemo(() => {
    const income = monthlyTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, profit: income - expense };
  }, [monthlyTransactions]);

  const handleAddInvestor = () => {
    const name = prompt("Nama Anggota:");
    if (name) {
      const percent = prompt("Persentase Bagi Hasil (%):");
      if (percent) setInvestors(prev => [...prev, { id: `INV${Date.now()}`, name, sharePercentage: parseFloat(percent) }]);
    }
  };

  const generateLabulPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text(settings.name.toUpperCase(), 105, 20, { align: "center" });
    doc.setFontSize(12); doc.text(`Periode: ${selectedMonth}`, 105, 30, { align: "center" });
    // ... (Simple PDF logic retained for brevity, style updated in UI)
    autoTable(doc, {
       startY: 40,
       head: [['Uraian', 'Nominal']],
       body: [
           ['Total Pemasukan', `Rp ${summary.income.toLocaleString()}`],
           ['Total Pengeluaran', `Rp ${summary.expense.toLocaleString()}`],
           ['LABA BERSIH', `Rp ${summary.profit.toLocaleString()}`]
       ]
    });
    doc.save('Laporan_Bulanan.pdf');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-white tracking-tight">Laporan & Bagi Hasil</h2>
        <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-white border-none focus:ring-0 text-sm p-2" />
            <button onClick={generateLabulPDF} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg">
                <Download size={16}/> PDF
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2 text-emerald-400"><ArrowUp size={20}/> <span className="font-medium">Pemasukan</span></div>
            <p className="text-2xl font-bold text-white">Rp {summary.income.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2 text-rose-400"><ArrowDown size={20}/> <span className="font-medium">Pengeluaran</span></div>
            <p className="text-2xl font-bold text-white">Rp {summary.expense.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-gradient-to-br from-sky-600/20 to-blue-600/20 border border-sky-500/30 p-6 rounded-2xl backdrop-blur-sm shadow-lg shadow-sky-900/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><PieChart size={64} className="text-sky-400"/></div>
            <div className="flex items-center gap-3 mb-2 text-sky-400"><PieChart size={20}/> <span className="font-medium">Laba Bersih</span></div>
            <p className="text-3xl font-bold text-white">Rp {summary.profit.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Simulasi Bagi Hasil</h3>
            <button onClick={handleAddInvestor} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition flex items-center gap-2">
                <Plus size={14} /> Tambah Anggota
            </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5">
            <table className="w-full text-left text-slate-300">
                <thead className="bg-black/20 text-xs uppercase font-bold text-slate-500">
                    <tr><th className="p-4">Nama</th><th className="p-4">Persentase</th><th className="p-4">Nominal</th><th className="p-4 text-right"></th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {investors.map(inv => (
                        <tr key={inv.id} className="hover:bg-white/5 transition">
                            <td className="p-4 font-medium text-white">{inv.name}</td>
                            <td className="p-4"><span className="bg-white/10 px-2 py-1 rounded text-xs">{inv.sharePercentage}%</span></td>
                            <td className="p-4 text-emerald-400 font-bold font-mono">Rp {((summary.profit * inv.sharePercentage) / 100).toLocaleString('id-ID')}</td>
                            <td className="p-4 text-right"><button onClick={() => setInvestors(prev => prev.filter(i => i.id !== inv.id))} className="text-rose-400 hover:text-rose-300"><Trash size={16} /></button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};