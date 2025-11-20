import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, Upload, Building, CreditCard, User } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useApp();
  const [form, setForm] = useState(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, logoUrl: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(form);
    alert('Pengaturan Tersimpan!');
  };

  const SectionTitle = ({ icon: Icon, title }: any) => (
    <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
      <Icon size={18} className="text-sky-400"/> {title}
    </h3>
  );

  const Input = ({ label, name }: any) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">{label}</label>
      <input name={name} value={(form as any)[name]} onChange={handleChange} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-sky-500/50 outline-none transition-all text-sm" />
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8 tracking-tight">Pengaturan</h2>
      
      <form onSubmit={saveSettings} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl space-y-8">
        
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-black/30 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 shadow-inner">
            {form.logoUrl ? <img src={form.logoUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-500">No Logo</span>}
          </div>
          <div>
            <label className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2">
              <Upload size={16} /> Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden"/>
            </label>
            <p className="text-xs text-slate-500 mt-2">Format: PNG, JPG (Max 2MB)</p>
          </div>
        </div>

        {/* Company Info */}
        <div>
          <SectionTitle icon={Building} title="Profil Perusahaan" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nama Perusahaan" name="name" />
            <Input label="Nomor Telepon" name="phone" />
            <div className="md:col-span-2">
              <Input label="Alamat Lengkap" name="address" />
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div>
          <SectionTitle icon={CreditCard} title="Rekening Pembayaran" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Nama Bank" name="bankName" />
            <Input label="No Rekening" name="accountNumber" />
            <Input label="Atas Nama" name="accountHolder" />
          </div>
        </div>

        {/* Director Info */}
        <div>
          <SectionTitle icon={User} title="Penandatangan" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Nama Direktur" name="directorName" />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-sky-500/20 transition-all transform hover:-translate-y-1 flex items-center gap-2">
            <Save size={18}/> Simpan Perubahan
          </button>
        </div>

      </form>
    </div>
  );
};