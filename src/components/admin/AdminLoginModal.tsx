import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Shield, Lock, User, X, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose }) => {
  const { loginAdmin } = useStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(username.trim(), password.trim());
    if (!success) {
      setErrorMsg('⚠️ ভুল ইউজারনেম অথবা পাসওয়ার্ড!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070C18]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-3xl max-w-md w-full p-8 space-y-6 text-white shadow-2xl relative animate-scaleUp">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-[#2563EB]/15 border border-[#2563EB]/40 text-[#2563EB] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8 text-[#3B82F6]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">KinoMart Admin</h2>
          <p className="text-xs font-semibold text-[#94A3B8]">অর্ডার ম্যানেজমেন্ট ও সাইট অ্যাডমিন প্যানেল</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-3 rounded-xl text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#CBD5E1] font-extrabold mb-1.5">এডমিন আইডি (ID)</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="এডমিন আইডি দিন"
                className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl py-3 px-3.5 pl-10 text-white text-sm focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-[#CBD5E1] font-extrabold mb-1.5">পাসওয়ার্ড (Password)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="পাসওয়ার্ড দিন"
                className="w-full bg-[#0B1329] border border-[#1E293B] rounded-xl py-3 px-3.5 pl-10 pr-11 text-white text-sm focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
                title={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
              >
                {showPassword ? <EyeOff className="w-4 h-4 text-blue-400" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-black py-3.5 px-6 rounded-2xl text-sm transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer mt-2"
          >
            প্যানেলে প্রবেশ করুন
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#1E293B] hover:bg-[#334155] text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            ← প্রধান ওয়েবসাইটে ফিরে যান
          </button>
        </form>
      </div>
    </div>
  );
};
