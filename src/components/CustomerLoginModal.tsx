import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User, Phone, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface CustomerLoginModalProps {
  onClose: () => void;
}

export const CustomerLoginModal: React.FC<CustomerLoginModalProps> = ({ onClose }) => {
  const { loginCustomer, setIsAdminModalOpen, setActiveClientPage } = useStore();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('অনুগ্রহ করে সঠিক মোবাইল নম্বর লিখুন');
      return;
    }

    const success = loginCustomer(phone.trim(), name.trim());
    if (success) {
      setActiveClientPage('customer-profile');
      onClose();
    } else {
      setError('অ্যাকাউন্টে প্রবেশ করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8E3D9] relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-gray-400 hover:text-gray-700 bg-[#FAF8F5] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[#5E7A3B]/10 rounded-2xl flex items-center justify-center text-[#5E7A3B] mx-auto">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-[#1F241E]">
            আমার অ্যাকাউন্ট
          </h2>
          <p className="text-xs text-[#6B7264] font-medium">
            আপনার আগের ও বর্তমান অর্ডার হিস্ট্রি দেখতে আপনার মোবাইল নম্বর দিন
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div>
            <label className="block text-[#1F241E] mb-1.5 font-bold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#5E7A3B]" />
              <span>মোবাইল নম্বর (আবশ্যক):</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError('');
              }}
              placeholder="017XXXXXXXX"
              required
              className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl p-3.5 text-sm text-[#1F241E] font-extrabold focus:outline-none focus:border-[#5E7A3B]"
            />
          </div>

          <div>
            <label className="block text-[#1F241E] mb-1.5 font-bold">
              আপনার নাম (ঐচ্ছিক):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: মোঃ রাকিবুল হাসান"
              className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl p-3.5 text-sm text-[#1F241E] font-medium focus:outline-none focus:border-[#5E7A3B]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#5E7A3B] hover:bg-[#4d662f] text-white font-black py-3.5 px-4 rounded-2xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>অ্যাকাউন্টে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Admin Login Alternative Link */}
        <div className="pt-4 border-t border-[#E8E3D9] text-center">
          <button
            onClick={() => {
              onClose();
              setIsAdminModalOpen(true);
            }}
            className="text-xs font-bold text-[#6B7264] hover:text-[#1F241E] flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#5E7A3B]" />
            <span>অ্যাডমিন প্যানেলে লগইন করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
