import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { UploadCloud, Check, Calendar, FileText, DollarSign } from 'lucide-react';

export const InputEntry: React.FC = () => {
  const { addTransaction } = useApp();
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);
  const [proof, setProof] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProof(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: `TX${Date.now()}`,
      date, description, amount, type, method, proofImage: proof || undefined, category: 'General'
    };
    addTransaction(newTx);
    alert('Transaksi Berhasil Disimpan!');
    setDescription(''); setAmount(0); setProof(null);
  };

  return (
    <div className="p-6 flex justify-center items-center min-h-[80vh]">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5 bg-black/10 text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">Input Transaksi Baru</h2>
          <p className="text-slate-400 text-sm mt-1">Catat arus kas masuk dan keluar dengan rapi.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Segmented Control */}
          <div className="flex p-1 bg-black/20 rounded-xl border border-white/5">
            <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${type === TransactionType.INCOME ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Pemasukan</button>
            <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${type === TransactionType.EXPENSE ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Pengeluaran</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1 flex items-center gap-1"><Calendar size={12}/> Tanggal</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1">Metode Pembayaran</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all appearance-none">
                <option value={PaymentMethod.TRANSFER} className="bg-slate-800">Transfer Bank</option>
                <option value={PaymentMethod.CASH} className="bg-slate-800">Tunai (Cash)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 ml-1 flex items-center gap-1"><FileText size={12}/> Keterangan</label>
            <input required type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Contoh: Pembayaran WiFi" className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all" />
          </div>

          <div className="space-y-2">
             <label className="text-xs font-medium text-slate-400 ml-1 flex items-center gap-1"><DollarSign size={12}/> Nominal (Rp)</label>
             <div className="relative">
                <input required type="number" min="0" value={amount} onChange={e => setAmount(parseInt(e.target.value))} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 pl-4 text-white text-2xl font-bold focus:border-sky-500/50 outline-none transition-all" />
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 ml-1">Bukti Transaksi (Opsional)</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-sky-500 hover:bg-white/5 transition-all group">
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {proof ? (
                 <div className="flex items-center text-emerald-400 gap-2"><Check size={20}/> <span className="text-sm">File Terupload</span></div>
              ) : (
                 <div className="flex flex-col items-center text-slate-500 group-hover:text-sky-400">
                    <UploadCloud size={24} className="mb-1" />
                    <span className="text-xs">Klik untuk upload gambar</span>
                 </div>
              )}
            </label>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-sky-500/20 transition-all transform active:scale-[0.98]">
            SIMPAN TRANSAKSI
          </button>
        </form>
      </div>
    </div>
  );
};