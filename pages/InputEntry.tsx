import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { UploadCloud } from 'lucide-react';

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
      const file = e.target.files[0];
      // Create fake local URL for preview since no backend
      const url = URL.createObjectURL(file);
      setProof(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: `TX${Date.now()}`,
      date,
      description,
      amount,
      type,
      method,
      proofImage: proof || undefined,
      category: 'General'
    };
    addTransaction(newTx);
    alert('Transaksi berhasil disimpan!');
    setDescription('');
    setAmount(0);
    setProof(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Input Transaksi</h2>
      
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Toggle Type */}
          <div className="flex p-1 bg-slate-900 rounded-lg w-fit">
            <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`px-6 py-2 rounded-md font-medium transition ${type === TransactionType.INCOME ? 'bg-green-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Pemasukan</button>
            <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`px-6 py-2 rounded-md font-medium transition ${type === TransactionType.EXPENSE ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Pengeluaran</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Tanggal</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Metode Pembayaran</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-accent outline-none">
                <option value={PaymentMethod.TRANSFER}>Transfer</option>
                <option value={PaymentMethod.CASH}>Tunai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Deskripsi</label>
            <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Contoh: Beli kabel LAN 1 roll" className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white focus:border-accent outline-none"></textarea>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Nominal (Rp)</label>
            <input required type="number" min="0" value={amount} onChange={e => setAmount(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-600 rounded p-3 text-white text-xl font-bold focus:border-accent outline-none" />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Upload Bukti Transaksi</label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:border-accent hover:text-accent transition cursor-pointer relative">
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              {proof ? (
                <div className="text-center">
                  <p className="text-green-400 mb-2">File terpilih!</p>
                  <img src={proof} alt="Preview" className="h-24 object-contain mx-auto border border-slate-500 rounded" />
                </div>
              ) : (
                <>
                  <UploadCloud size={32} className="mb-2" />
                  <p className="text-sm">Klik untuk upload gambar</p>
                </>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-accent hover:bg-sky-600 text-white font-bold py-4 rounded-lg shadow-lg transition transform active:scale-95">
            Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
};