import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TransactionType } from '../types';
import { Download, Plus, Trash } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ProfitSharing: React.FC = () => {
  const { transactions, settings, investors, setInvestors } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const summary = useMemo(() => {
    const income = monthlyTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const profit = income - expense;
    return { income, expense, profit };
  }, [monthlyTransactions]);

  const handleAddInvestor = () => {
    const name = prompt("Nama Anggota:");
    if (name) {
      const percent = prompt("Persentase Bagi Hasil (%):");
      if (percent) {
        setInvestors(prev => [...prev, { id: `INV${Date.now()}`, name, sharePercentage: parseFloat(percent) }]);
      }
    }
  };

  const handleRemoveInvestor = (id: string) => {
    setInvestors(prev => prev.filter(i => i.id !== id));
  };

  const generateLabulPDF = () => {
    const doc = new jsPDF();
    
    // KOP
    if (settings.logoUrl) {
       // Typically you'd addImage here, but cross-origin issues can occur in browsers. 
       // We'll simulate text layout.
    }
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(settings.name.toUpperCase(), 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(settings.address, 105, 28, { align: "center" });
    doc.text(`Telp: ${settings.phone}`, 105, 33, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(10, 38, 200, 38);

    // Title
    doc.setFontSize(16);
    doc.text("LAPORAN KEUANGAN BULANAN", 105, 50, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Periode: ${selectedMonth}`, 105, 56, { align: "center" });

    // Summary
    doc.text("RINGKASAN:", 14, 70);
    doc.text(`Total Pemasukan: Rp ${summary.income.toLocaleString('id-ID')}`, 14, 78);
    doc.text(`Total Pengeluaran: Rp ${summary.expense.toLocaleString('id-ID')}`, 14, 86);
    doc.setFont("helvetica", "bold");
    doc.text(`Laba Bersih: Rp ${summary.profit.toLocaleString('id-ID')}`, 14, 94);
    doc.setFont("helvetica", "normal");

    // Profit Sharing
    let yPos = 105;
    doc.text("ESTIMASI BAGI HASIL:", 14, yPos);
    yPos += 8;
    investors.forEach(inv => {
      const share = (summary.profit * inv.sharePercentage) / 100;
      doc.text(`- ${inv.name} (${inv.sharePercentage}%): Rp ${share.toLocaleString('id-ID')}`, 20, yPos);
      yPos += 6;
    });

    // Transactions Table
    yPos += 10;
    doc.text("RINCIAN TRANSAKSI:", 14, yPos);
    
    const tableData = monthlyTransactions.map((t, i) => [
      i + 1,
      t.date,
      t.description,
      t.type === TransactionType.INCOME ? `Rp ${t.amount.toLocaleString()}` : '-',
      t.type === TransactionType.EXPENSE ? `Rp ${t.amount.toLocaleString()}` : '-',
      t.method
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['No', 'Tgl', 'Deskripsi', 'Masuk', 'Keluar', 'Metode']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    // Footer Signature
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.text("Mengetahui,", 140, finalY);
    doc.text("Direktur Utama", 140, finalY + 5);
    doc.setFont("helvetica", "bold");
    doc.text(`( ${settings.directorName} )`, 140, finalY + 30);
    
    doc.save(`Labul_${settings.name}_${selectedMonth}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Laporan Bulanan (LABUL)</h2>
        <div className="flex items-center space-x-4">
            <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="bg-slate-800 text-white border border-slate-600 rounded p-2"
            />
            <button onClick={generateLabulPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center space-x-2">
                <Download size={18}/> <span>Unduh Laporan PDF</span>
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-sm">Pemasukan Bulan Ini</p>
            <p className="text-2xl font-bold text-green-400">Rp {summary.income.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-sm">Pengeluaran Bulan Ini</p>
            <p className="text-2xl font-bold text-red-400">Rp {summary.expense.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700">
            <p className="text-slate-300 text-sm">Saldo Akhir (Laba)</p>
            <p className="text-3xl font-bold text-accent">Rp {summary.profit.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Profit Sharing Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Estimasi Bagi Hasil</h3>
            <button onClick={handleAddInvestor} className="text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded flex items-center space-x-1">
                <Plus size={14} /> <span>Tambah Anggota</span>
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
                <thead className="bg-slate-900/50">
                    <tr>
                        <th className="p-3">Nama Anggota</th>
                        <th className="p-3">Persentase</th>
                        <th className="p-3">Estimasi Terima</th>
                        <th className="p-3 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                    {investors.map(inv => (
                        <tr key={inv.id}>
                            <td className="p-3">{inv.name}</td>
                            <td className="p-3">{inv.sharePercentage}%</td>
                            <td className="p-3 text-accent font-bold">
                                Rp {((summary.profit * inv.sharePercentage) / 100).toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 text-right">
                                <button onClick={() => handleRemoveInvestor(inv.id)} className="text-red-400 hover:text-red-300"><Trash size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};