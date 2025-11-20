import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, SubscriptionType, Transaction, TransactionType, PaymentMethod } from '../types';
import { MessageCircle, CreditCard, Trash2, Edit2, FileText, Plus, CheckCircle, Search, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const Customers: React.FC = () => {
  const { customers, setCustomers, addTransaction, settings } = useApp();
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditMode, setEditMode] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({});

  // Auto calculate annual balance when monthly fee changes in form
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
    setFormData({ 
      status: 'unpaid', 
      monthlyFee: 0, 
      accumulatedDebt: 0,
      remainingAnnualBalance: 0,
      dueDate: 1 
    });
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
      const newCustomer = { 
        ...formData, 
        id: `C${Date.now()}`, 
        status: 'unpaid',
        accumulatedDebt: 0,
        // Ensure remaining balance is set if not already
        remainingAnnualBalance: formData.remainingAnnualBalance || (formData.monthlyFee || 0) * 12
      } as Customer;
      setCustomers(prev => [...prev, newCustomer]);
    }
    setAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    // Prevent default browser behavior if called from a link/form context
    if (window.confirm('Apakah Anda yakin ingin menghapus pelanggan ini? Data tidak bisa dikembalikan.')) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleGenerateBills = () => {
    if (confirm('Generate tagihan baru untuk semua pelanggan?\n\n- Status akan menjadi Belum Bayar\n- Tagihan yang belum lunas akan diakumulasikan\n- Sisa nominal tahunan akan berkurang')) {
      setCustomers(prev => prev.map(c => {
        // Logic:
        // 1. Decrease remaining annual balance by monthly fee (floor at 0)
        const newAnnualBalance = Math.max(0, c.remainingAnnualBalance - c.monthlyFee);
        
        // 2. Accumulate debt if previous month was unpaid
        let newDebt = c.accumulatedDebt;
        if (c.status === 'unpaid') {
            newDebt += c.monthlyFee;
        }

        return { 
          ...c, 
          status: 'unpaid',
          remainingAnnualBalance: newAnnualBalance,
          accumulatedDebt: newDebt
        };
      }));
      alert('Tagihan bulan baru berhasil digenerate!');
    }
  };

  const sendWhatsApp = (customer: Customer) => {
    const totalTagihan = customer.monthlyFee + customer.accumulatedDebt;
    const message = `Halo kak ${customer.name}, tagihan internet Anda bulan ini:\n\nIuran Bulan Ini: Rp ${customer.monthlyFee.toLocaleString('id-ID')}\nTunggakan: Rp ${customer.accumulatedDebt.toLocaleString('id-ID')}\n*Total Tagihan: Rp ${totalTagihan.toLocaleString('id-ID')}*\n\nMohon segera melakukan pembayaran ya. Terima kasih! - ${settings.name}`;
    const url = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
      description: `Pembayaran Tagihan Internet - ${selectedCustomer.name} (${method})`,
      amount: totalAmount,
      type: TransactionType.INCOME,
      method: method,
      category: 'Bill Payment',
      customerId: selectedCustomer.id
    };

    addTransaction(newTransaction);
    
    // Reset status to paid and clear accumulated debt
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { 
        ...c, 
        status: 'paid', 
        accumulatedDebt: 0, // Debt is cleared upon payment
        lastPaymentDate: newTransaction.date 
    } : c));

    setPaymentModalOpen(false);
    alert('Pembayaran Berhasil Disimpan!');
  };

  const generateInvoicePDF = (customer: Customer) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const centerX = pageWidth / 2;
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(settings.name.toUpperCase(), centerX, 20, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(settings.address, centerX, 27, { align: "center" });
    doc.text(`Telp: ${settings.phone}`, centerX, 32, { align: "center" });
    
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.5);
    doc.line(15, 38, pageWidth - 15, 38);

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("INVOICE TAGIHAN", pageWidth - 15, 55, { align: "right" });

    const dateNow = new Date();
    const currentMonth = dateNow.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const totalAmount = customer.monthlyFee + customer.accumulatedDebt;

    // Info
    doc.setFontSize(10);
    doc.text("Kepada Yth:", 15, 55);
    doc.setFont("helvetica", "bold");
    doc.text(customer.name, 15, 61);
    doc.setFont("helvetica", "normal");
    doc.text(customer.phone, 15, 66);
    doc.text(`Paket: ${customer.type}`, 15, 71);

    doc.setFontSize(9);
    doc.text(`No. Invoice: INV/${dateNow.getFullYear()}/${dateNow.getTime().toString().substr(-5)}`, pageWidth - 15, 61, { align: "right" });
    doc.text(`Tanggal: ${dateNow.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}`, pageWidth - 15, 66, { align: "right" });
    doc.text(`Status: ${customer.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}`, pageWidth - 15, 71, { align: "right" });

    // Table
    const tableRows = [
      ["1", `Iuran Internet Bulan ${currentMonth}`, `Rp ${customer.monthlyFee.toLocaleString('id-ID')}`],
    ];

    if (customer.accumulatedDebt > 0) {
        tableRows.push(["2", "Tunggakan Bulan Sebelumnya", `Rp ${customer.accumulatedDebt.toLocaleString('id-ID')}`]);
    }

    autoTable(doc, {
      startY: 80,
      head: [['No', 'Deskripsi', 'Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [15, 23, 42],
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // Payment Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252); 
    doc.roundedRect(15, finalY, 90, 50, 2, 2, 'FD');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Metode Pembayaran", 20, finalY + 8);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Silahkan melakukan pembayaran transfer ke:", 20, finalY + 16);
    
    doc.setFont("helvetica", "bold");
    doc.text(`${settings.bankName}`, 20, finalY + 24);
    doc.setFont("helvetica", "normal");
    doc.text(`${settings.accountNumber}`, 20, finalY + 30);
    doc.text(`a.n ${settings.accountHolder}`, 20, finalY + 36);

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Total Tagihan", pageWidth - 15, finalY + 8, { align: "right" });
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text(`Rp ${totalAmount.toLocaleString('id-ID')}`, pageWidth - 15, finalY + 18, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Hormat Kami,", pageWidth - 40, finalY + 35, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(settings.directorName, pageWidth - 40, finalY + 55, { align: "center" });

    doc.save(`Invoice_${customer.name.replace(/\s+/g, '_')}.pdf`);
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
                <th className="p-4">Nama / Paket</th>
                <th className="p-4">No HP</th>
                <th className="p-4">Iuran Bulanan</th>
                <th className="p-4">Total Tagihan</th>
                <th className="p-4">Sisa 1 Tahun</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => {
                  const totalBill = c.monthlyFee + c.accumulatedDebt;
                  return (
                    <tr key={c.id} className="hover:bg-slate-700/50 transition">
                      <td className="p-4">
                        <div className="font-bold text-white">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.type} - Tgl {c.dueDate}</div>
                      </td>
                      <td className="p-4 text-sm">{c.phone}</td>
                      <td className="p-4 text-sm">Rp {c.monthlyFee.toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <div className="font-bold text-accent">Rp {totalBill.toLocaleString('id-ID')}</div>
                        {c.accumulatedDebt > 0 && (
                            <div className="text-xs text-red-400 flex items-center mt-1">
                                <AlertCircle size={10} className="mr-1"/> Menunggak Rp {c.accumulatedDebt.toLocaleString('id-ID')}
                            </div>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-400">Rp {c.remainingAnnualBalance.toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        {c.status === 'paid' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" /> Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Belum Bayar
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button type="button" onClick={() => sendWhatsApp(c)} title="Kirim WA" className="p-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition"><MessageCircle size={16} /></button>
                          {c.status === 'unpaid' && (
                            <button type="button" onClick={() => openPayment(c)} title="Bayar" className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition"><CreditCard size={16} /></button>
                          )}
                          <button type="button" onClick={() => generateInvoicePDF(c)} title="Invoice PDF" className="p-2 bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white transition"><FileText size={16} /></button>
                          <button type="button" onClick={() => handleOpenEdit(c)} title="Edit" className="p-2 bg-yellow-600/20 text-yellow-400 rounded hover:bg-yellow-600 hover:text-white transition"><Edit2 size={16} /></button>
                          <button type="button" onClick={() => handleDelete(c.id)} title="Hapus" className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
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
            <h3 className="text-xl font-bold text-white mb-4">Pembayaran Tagihan</h3>
            
            <div className="mb-6 bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                    <span>Iuran Bulan Ini:</span>
                    <span>Rp {selectedCustomer.monthlyFee.toLocaleString('id-ID')}</span>
                </div>
                {selectedCustomer.accumulatedDebt > 0 && (
                    <div className="flex justify-between text-sm text-red-400 mb-2">
                        <span>Tunggakan:</span>
                        <span>Rp {selectedCustomer.accumulatedDebt.toLocaleString('id-ID')}</span>
                    </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between text-white font-bold">
                    <span>Total Bayar:</span>
                    <span className="text-accent">Rp {(selectedCustomer.monthlyFee + selectedCustomer.accumulatedDebt).toLocaleString('id-ID')}</span>
                </div>
            </div>

            <p className="text-slate-300 text-sm mb-4 text-center">Pilih metode pembayaran:</p>
            
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
                  <label className="block text-xs text-slate-400 mb-1">Iuran Bulanan (Rp)</label>
                  <input required type="number" value={formData.monthlyFee || ''} onChange={e => setFormData({...formData, monthlyFee: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-accent focus:outline-none" />
                </div>
              </div>
              
              {/* New Annual Calculation Display */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900 p-3 rounded border border-slate-700">
                 <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Nominal 1 Tahun</label>
                    <div className="text-white font-mono text-sm">Rp {((formData.monthlyFee || 0) * 12).toLocaleString('id-ID')}</div>
                 </div>
                 <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Sisa Nominal Tahun Ini</label>
                     {isEditMode ? (
                         <input 
                           type="number" 
                           value={formData.remainingAnnualBalance} 
                           onChange={e => setFormData({...formData, remainingAnnualBalance: parseInt(e.target.value)})}
                           className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm focus:outline-none"
                         />
                     ) : (
                        <div className="text-accent font-mono text-sm">Rp {((formData.monthlyFee || 0) * 12).toLocaleString('id-ID')}</div>
                     )}
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