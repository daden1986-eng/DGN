import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, SubscriptionType, Transaction, TransactionType, PaymentMethod } from '../types';
import { MessageCircle, CreditCard, Trash2, Edit2, FileText, Plus, CheckCircle, Search } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const Customers: React.FC = () => {
  const { customers, setCustomers, addTransaction, settings } = useApp();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditMode, setEditMode] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({});

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({ status: 'unpaid', monthlyFee: 0, dueDate: 1 });
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
      const newCustomer = { ...formData, id: `C${Date.now()}`, status: 'unpaid' } as Customer;
      setCustomers(prev => [...prev, newCustomer]);
    }
    setAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus pelanggan ini?')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleGenerateBills = () => {
    if (confirm('Generate tagihan baru untuk semua pelanggan? Status akan direset menjadi Belum Bayar.')) {
      setCustomers(prev => prev.map(c => ({ ...c, status: 'unpaid' })));
      alert('Tagihan bulan baru berhasil digenerate!');
    }
  };

  const sendWhatsApp = (customer: Customer) => {
    const message = `Halo kak ${customer.name}, ini adalah notifikasi tagihan internet bulan ini sebesar Rp ${customer.monthlyFee.toLocaleString('id-ID')}. Mohon segera melakukan pembayaran ya. Terima kasih! - ${settings.name}`;
    const url = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const openPayment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setPaymentModalOpen(true);
  };

  const processPayment = (method: PaymentMethod) => {
    if (!selectedCustomer) return;

    const newTransaction: Transaction = {
      id: `T${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description: `Pembayaran Tagihan Internet - ${selectedCustomer.name}`,
      amount: selectedCustomer.monthlyFee,
      type: TransactionType.INCOME,
      method: method,
      category: 'Bill Payment',
      customerId: selectedCustomer.id
    };

    addTransaction(newTransaction);
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, status: 'paid', lastPaymentDate: newTransaction.date } : c));
    setPaymentModalOpen(false);
    alert('Pembayaran Berhasil!');
  };

  const generateInvoicePDF = (customer: Customer) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(settings.name, 14, 20);
    doc.setFontSize(10);
    doc.text(settings.address, 14, 26);
    doc.text(`Phone: ${settings.phone}`, 14, 32);
    
    // Title
    doc.setFontSize(16);
    doc.text("INVOICE TAGIHAN", 14, 50);
    
    // Details
    doc.setFontSize(12);
    doc.text(`Pelanggan: ${customer.name}`, 14, 65);
    doc.text(`No HP: ${customer.phone}`, 14, 72);
    doc.text(`Paket: ${customer.type}`, 14, 79);
    doc.text(`Bulan: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 86);
    
    doc.setLineWidth(0.5);
    doc.line(14, 95, 196, 95);

    doc.text("Deskripsi", 14, 105);
    doc.text("Nominal", 160, 105, { align: "right" });

    doc.line(14, 110, 196, 110);

    doc.text(`Tagihan Internet ${customer.type}`, 14, 120);
    doc.text(`Rp ${customer.monthlyFee.toLocaleString('id-ID')}`, 160, 120, { align: "right" });

    // Footer Info
    doc.text("Silahkan transfer ke:", 14, 150);
    doc.text(`${settings.bankName} - ${settings.accountNumber}`, 14, 157);
    doc.text(`a.n ${settings.accountHolder}`, 14, 164);

    doc.save(`Invoice_${customer.name}.pdf`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Data Pelanggan</h2>
        <div className="flex flex-wrap gap-3">
           <button onClick={handleGenerateBills} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
             + Tagihan Bulan Baru
           </button>
           <button onClick={handleOpenAdd} className="bg-accent hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition">
             <Plus size={16} /> <span>Tambah Pelanggan</span>
           </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg leading-5 bg-slate-800 text-slate-300 placeholder-slate-400 focus:outline-none focus:bg-slate-900 focus:border-accent sm:text-sm transition duration-150 ease-in-out"
          placeholder="Cari nama pelanggan atau nomor HP..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-900 text-slate-100 uppercase text-xs font-bold">
              <tr>
                <th className="p-4">No</th>
                <th className="p-4">Nama</th>
                <th className="p-4">No HP</th>
                <th className="p-4">Jenis</th>
                <th className="p-4">Tgl Jatuh Tempo</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-slate-700/50 transition">
                    <td className="p-4">{idx + 1}</td>
                    <td className="p-4 font-medium text-white">{c.name}</td>
                    <td className="p-4">{c.phone}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-slate-700 rounded text-xs">{c.type}</span></td>
                    <td className="p-4">Tgl {c.dueDate}</td>
                    <td className="p-4 text-right">Rp {c.monthlyFee.toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      {c.status === 'paid' ? (
                        <span className="text-green-400 flex items-center space-x-1 text-sm"><CheckCircle size={14} /> <span>Lunas</span></span>
                      ) : (
                        <span className="text-red-400 text-sm">Belum Bayar</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button onClick={() => sendWhatsApp(c)} title="Kirim WA" className="p-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition"><MessageCircle size={16} /></button>
                        {c.status === 'unpaid' && (
                          <button onClick={() => openPayment(c)} title="Bayar" className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition"><CreditCard size={16} /></button>
                        )}
                        <button onClick={() => generateInvoicePDF(c)} title="Invoice PDF" className="p-2 bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white transition"><FileText size={16} /></button>
                        <button onClick={() => handleOpenEdit(c)} title="Edit" className="p-2 bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600 hover:text-white transition"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(c.id)} title="Hapus" className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Tidak ada data pelanggan yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-sm w-full border border-slate-600">
            <h3 className="text-xl font-bold text-white mb-4">Metode Pembayaran</h3>
            <p className="text-slate-300 mb-6">Pilih metode bayar untuk <span className="font-bold text-white">{selectedCustomer.name}</span> sebesar <span className="text-accent font-bold">Rp {selectedCustomer.monthlyFee.toLocaleString('id-ID')}</span></p>
            <div className="space-y-3">
              <button onClick={() => processPayment(PaymentMethod.TRANSFER)} className="w-full p-3 bg-slate-700 hover:bg-accent text-white rounded-lg transition flex justify-between items-center">
                <span>Transfer Bank</span> <CreditCard size={18}/>
              </button>
              <button onClick={() => processPayment(PaymentMethod.CASH)} className="w-full p-3 bg-slate-700 hover:bg-green-600 text-white rounded-lg transition flex justify-between items-center">
                <span>Tunai (Cash)</span> <FileText size={18}/>
              </button>
            </div>
            <button onClick={() => setPaymentModalOpen(false)} className="mt-6 w-full py-2 text-slate-400 hover:text-white text-sm">Batal</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-800 p-6 rounded-xl shadow-2xl max-w-md w-full border border-slate-600 my-10">
            <h3 className="text-xl font-bold text-white mb-4">{isEditMode ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</h3>
            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nama Pelanggan</label>
                <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">No HP (Format: 628...)</label>
                <input required type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Jenis Langganan</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as SubscriptionType})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-accent focus:outline-none">
                  {Object.values(SubscriptionType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tgl Jatuh Tempo (1-31)</label>
                  <input required type="number" min="1" max="31" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-accent focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nominal Bulanan</label>
                  <input required type="number" value={formData.monthlyFee || ''} onChange={e => setFormData({...formData, monthlyFee: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-accent focus:outline-none" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Batal</button>
                <button type="submit" className="px-4 py-2 bg-accent hover:bg-sky-600 text-white rounded">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};