import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, SubscriptionType, Transaction, TransactionType, PaymentMethod } from '../types';
import { MessageCircle, CreditCard, Trash2, Edit2, FileText, Plus, CheckCircle, Search, AlertCircle, RefreshCw, X, Banknote } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Customers: React.FC = () => {
  const { customers, setCustomers, addTransaction, settings, generateNewBillingCycle } = useApp();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditMode, setEditMode] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (formData.monthlyFee && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        remainingAnnualBalance: (prev.monthlyFee || 0) * 12
      }));
    }
  }, [formData.monthlyFee, isEditMode]);

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({ id: '', status: 'unpaid', monthlyFee: 0, accumulatedDebt: 0, remainingAnnualBalance: 0, dueDate: 1 });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditMode(true);
    setFormData(customer);
    setAddModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode && formData.id) {
      setCustomers(prev => prev.map(c => c.id === formData.id ? { ...c, ...formData } as Customer : c));
    } else {
      const finalId = formData.id && formData.id.trim() !== '' ? formData.id : `C${Date.now()}`;
      if (customers.some(c => c.id === finalId)) {
        alert(`ID Pelanggan "${finalId}" sudah digunakan!`);
        return;
      }
      const newCustomer = { 
        ...formData, 
        id: finalId, 
        status: 'unpaid',
        accumulatedDebt: 0,
        remainingAnnualBalance: formData.remainingAnnualBalance || (formData.monthlyFee || 0) * 12
      } as Customer;
      setCustomers(prev => [...prev, newCustomer]);
    }
    setAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data pelanggan ini?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleGenerateBills = () => {
    if (confirm('Mulai Siklus Tagihan Baru?')) {
      generateNewBillingCycle();
      alert('Siklus Baru Diterapkan!');
    }
  };

  const sendWhatsApp = (customer: Customer) => {
    const totalTagihan = customer.monthlyFee + customer.accumulatedDebt;
    const message = `Halo kak ${customer.name}, tagihan internet bulan ini:\nTotal: Rp ${totalTagihan.toLocaleString('id-ID')}\nMohon segera dibayar ya. Terima kasih! - ${settings.name}`;
    window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentModalOpen(true);
  };

  const processPayment = (method: PaymentMethod) => {
    if (!selectedCustomer) return;
    const totalAmount = selectedCustomer.monthlyFee + selectedCustomer.accumulatedDebt;
    const newTransaction: Transaction = {
      id: `T${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Pembayaran Internet - ${selectedCustomer.name} (${method})`,
      amount: totalAmount,
      type: TransactionType.INCOME,
      method: method,
      category: 'Bill Payment',
      customerId: selectedCustomer.id
    };
    addTransaction(newTransaction);
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { 
        ...c, status: 'paid', accumulatedDebt: 0, lastPaymentDate: newTransaction.date 
    } : c));
    setPaymentModalOpen(false);
  };

  const generateInvoicePDF = (customer: Customer) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const totalAmount = customer.monthlyFee + customer.accumulatedDebt;

    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text(settings.name.toUpperCase(), pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(settings.address, pageWidth / 2, 27, { align: "center" });
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 35, pageWidth - 15, 35);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("INVOICE", 15, 45);
    
    doc.setFontSize(10);
    doc.text(`ID: ${customer.id}`, 15, 52);
    doc.text(`Nama: ${customer.name}`, 15, 57);
    doc.text(`Tgl: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 15, 45, { align: "right" });

    const tableRows = [
      ["1", "Iuran Bulanan", `Rp ${customer.monthlyFee.toLocaleString('id-ID')}`],
      ...(customer.accumulatedDebt > 0 ? [["2", "Tunggakan", `Rp ${customer.accumulatedDebt.toLocaleString('id-ID')}`]] : [])
    ];

    autoTable(doc, {
      startY: 65,
      head: [['#', 'Deskripsi', 'Nominal']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 4 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total: Rp ${totalAmount.toLocaleString('id-ID')}`, pageWidth - 15, finalY, { align: "right" });
    
    doc.save(`Invoice_${customer.name}.pdf`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Data Pelanggan</h2>
          <p className="text-slate-400 text-sm mt-1">Kelola data langganan dan tagihan.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={handleGenerateBills} className="bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/50 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2">
             <RefreshCw size={16} /> Siklus Tagihan
           </button>
           <button onClick={handleOpenAdd} className="bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-500/25 px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 transform hover:-translate-y-1">
             <Plus size={18} /> <span>Tambah Baru</span>
           </button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-sky-400 transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white/10 transition-all duration-300"
          placeholder="Cari pelanggan berdasarkan ID, Nama, atau No HP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-black/20 text-slate-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-5 font-medium">ID</th>
                <th className="p-5 font-medium">Pelanggan</th>
                <th className="p-5 font-medium">Tagihan</th>
                <th className="p-5 font-medium">Status</th>
                <th className="p-5 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => {
                  const totalBill = c.monthlyFee + c.accumulatedDebt;
                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors duration-200 group">
                      <td className="p-5 font-mono text-xs text-slate-500">{c.id}</td>
                      <td className="p-5">
                        <div className="font-bold text-white text-base">{c.name}</div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                           <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{c.type}</span>
                           <span>{c.phone}</span>
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="font-bold text-slate-200">Rp {totalBill.toLocaleString('id-ID')}</div>
                        {c.accumulatedDebt > 0 && (
                            <div className="text-xs text-rose-400 flex items-center mt-1 bg-rose-400/10 px-2 py-1 rounded-lg w-fit">
                                <AlertCircle size={10} className="mr-1"/> Menunggak
                            </div>
                        )}
                      </td>
                      <td className="p-5">
                        {c.status === 'paid' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={12} className="mr-1.5" /> Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/20">
                            Belum Bayar
                          </span>
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => sendWhatsApp(c)} className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={18} /></button>
                          {c.status === 'unpaid' && (
                            <button onClick={() => openPayment(c)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><CreditCard size={18} /></button>
                          )}
                          <button onClick={() => generateInvoicePDF(c)} className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all"><FileText size={18} /></button>
                          <button onClick={() => handleOpenEdit(c)} className="p-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-white transition-all"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals with Glassmorphism */}
      {(isPaymentModalOpen || isAddModalOpen) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animation-fade-in relative">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-white">
                {isPaymentModalOpen ? 'Pembayaran Tagihan' : (isEditMode ? 'Edit Pelanggan' : 'Tambah Pelanggan')}
              </h3>
              <button onClick={() => { setPaymentModalOpen(false); setAddModalOpen(false); }} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {isPaymentModalOpen && selectedCustomer ? (
                 <div className="space-y-4">
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between text-sm text-slate-400"><span>Tagihan:</span> <span>Rp {selectedCustomer.monthlyFee.toLocaleString()}</span></div>
                        <div className="flex justify-between text-sm text-rose-400"><span>Tunggakan:</span> <span>Rp {selectedCustomer.accumulatedDebt.toLocaleString()}</span></div>
                        <div className="border-t border-white/10 pt-2 flex justify-between text-lg font-bold text-sky-400"><span>Total:</span> <span>Rp {(selectedCustomer.monthlyFee + selectedCustomer.accumulatedDebt).toLocaleString()}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => processPayment(PaymentMethod.TRANSFER)} className="p-4 bg-white/5 hover:bg-sky-600 hover:text-white rounded-xl border border-white/10 transition-all flex flex-col items-center gap-2 text-slate-300">
                        <CreditCard size={24}/> <span className="text-sm font-medium">Transfer</span>
                      </button>
                      <button onClick={() => processPayment(PaymentMethod.CASH)} className="p-4 bg-white/5 hover:bg-emerald-600 hover:text-white rounded-xl border border-white/10 transition-all flex flex-col items-center gap-2 text-slate-300">
                        <Banknote size={24}/> <span className="text-sm font-medium">Tunai</span>
                      </button>
                    </div>
                 </div>
              ) : (
                <form onSubmit={handleSaveCustomer} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1 ml-1">ID (Opsional)</label>
                            <input type="text" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} disabled={isEditMode} placeholder="Auto" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 focus:bg-black/40 outline-none transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1 ml-1">Jatuh Tempo (Tgl)</label>
                            <input required type="number" min="1" max="31" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: parseInt(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">Nama Lengkap</label>
                        <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 ml-1">No WhatsApp</label>
                        <input required type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1 ml-1">Paket</label>
                            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as SubscriptionType})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all text-sm appearance-none">
                                {Object.values(SubscriptionType).map(t => <option key={t} value={t} className="bg-slate-800">{t}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs text-slate-400 mb-1 ml-1">Iuran (Rp)</label>
                             <input required type="number" value={formData.monthlyFee || ''} onChange={e => setFormData({...formData, monthlyFee: parseInt(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all text-sm" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-sky-500/20 transition-all transform active:scale-95 mt-2">Simpan Data</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};