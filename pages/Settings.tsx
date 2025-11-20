import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useApp();
  const [form, setForm] = useState(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setForm({ ...form, logoUrl: url });
    }
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(form);
    alert('Pengaturan berhasil disimpan!');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Pengaturan Perusahaan</h2>
      
      <form onSubmit={saveSettings} className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6 shadow-lg">
        
        <div className="flex items-center space-x-6 border-b border-slate-700 pb-6">
          <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-500">
            {form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400 text-xs">No Logo</span>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Upload Logo</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-sky-600"/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nama Perusahaan</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Nomor Telepon</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Alamat Lengkap</label>
            <input name="address" value={form.address} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <h3 className="text-white font-semibold mb-4">Informasi Pembayaran (Bank)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Nama Bank</label>
              <input name="bankName" value={form.bankName} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">No Rekening</label>
              <input name="accountNumber" value={form.accountNumber} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Atas Nama</label>
              <input name="accountHolder" value={form.accountHolder} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
           <label className="block text-sm text-slate-400 mb-1">Nama Direktur (Untuk Tanda Tangan)</label>
           <input name="directorName" value={form.directorName} onChange={handleChange} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white" />
        </div>

        <div className="pt-4">
          <button type="submit" className="bg-accent hover:bg-sky-600 text-white px-6 py-2 rounded shadow transition">Simpan Pengaturan</button>
        </div>

      </form>
    </div>
  );
};