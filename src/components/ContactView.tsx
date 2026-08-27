import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Send, PhoneCall, MessageCircle, MapPin, Clock, CheckCircle2 } from 'lucide-react';

export const ContactView: React.FC = () => {
  const { settings } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) {
      alert('অনুগ্রহ করে সবগুলো তথ্য পূরণ করুন।');
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Title & Subtitle */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#1F241E] tracking-tight">
          যোগাযোগ করুন
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-xl mx-auto leading-relaxed">
          কীনোমার্ট সংক্রান্ত যেকোনো জিজ্ঞাসা বা সহযোগিতার জন্য সরাসরি মেসেজ দিন অথবা কল করুন
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Direct Message Form */}
        <div className="lg:col-span-7 bg-white border border-[#E8E3D9] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1F241E]">
            আমাদের সরাসরি মেসেজ পাঠান
          </h2>

          {isSubmitted ? (
            <div className="bg-[#E8FAF0] border border-[#A7F3D0] rounded-2xl p-6 text-center space-y-3 my-4">
              <CheckCircle2 className="w-12 h-12 text-[#057A3A] mx-auto" />
              <h3 className="text-base font-extrabold text-[#057A3A]">
                আপনার মেসেজটি সফলভাবে পাঠানো হয়েছে!
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                আমাদের কাস্টমার কেয়ার টিম অতি শীঘ্রই আপনার সাথে যোগাযোগ করবে। ধন্যবাদ!
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', phone: '', message: '' });
                }}
                className="mt-2 text-xs font-bold text-[#596B43] underline cursor-pointer hover:text-[#485635]"
              >
                আরেকটি মেসেজ পাঠান
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-900">
                  আপনার নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="আপনার নাম লিখুন"
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#596B43] focus:ring-1 focus:ring-[#596B43] transition-all shadow-2xs"
                />
              </div>

              {/* Phone Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-900">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="যেমন: 01700000000"
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#596B43] focus:ring-1 focus:ring-[#596B43] transition-all shadow-2xs"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-900">
                  বার্তা বা জিজ্ঞাসা <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="আপনার মেসেজ বিস্তারিত লিখুন..."
                  required
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#596B43] focus:ring-1 focus:ring-[#596B43] transition-all shadow-2xs resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#596B43] hover:bg-[#485635] text-white font-extrabold text-sm sm:text-base py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98 mt-2"
              >
                <Send className="w-4 h-4 text-white fill-current" />
                <span>বার্তা পাঠান</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Office & Shop Info */}
        <div className="lg:col-span-5 bg-white border border-[#E8E3D9] rounded-3xl p-6 sm:p-8 shadow-2xs space-y-5">
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1F241E]">
            অফিস ও শপ তথ্য
          </h2>

          <div className="space-y-3.5">
            {/* Box 1: Hotline Support */}
            <div className="bg-[#F6F5EE] rounded-2xl p-4 flex items-center gap-3.5 border border-[#ECE8DC]">
              <div className="w-11 h-11 bg-[#596B43] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-gray-700 leading-snug">
                  হটলাইন সাপোর্ট:
                </p>
                <p className="text-xs sm:text-sm font-black text-gray-900 mt-0.5">
                  {settings.phone || '01700000000'}
                </p>
              </div>
            </div>

            {/* Box 2: WhatsApp Chat */}
            <div className="bg-[#ECFDF5] rounded-2xl p-4 flex items-center gap-3.5 border border-[#D1FAE5]">
              <div className="w-11 h-11 bg-[#25D366] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-[#057A3A] leading-snug">
                  হোয়াটসঅ্যাপে চ্যাট:
                </p>
                <p className="text-xs sm:text-sm font-black text-[#057A3A] mt-0.5">
                  {settings.phone || '01700000000'}
                </p>
              </div>
            </div>

            {/* Box 3: Showroom / Delivery Hub */}
            <div className="bg-[#F6F5EE] rounded-2xl p-4 flex items-center gap-3.5 border border-[#ECE8DC]">
              <div className="w-11 h-11 bg-[#1F241E] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-gray-700 leading-snug">
                  শো-রুম / ডেলিভারি হাব:
                </p>
                <p className="text-xs sm:text-sm font-black text-gray-900 mt-0.5">
                  {settings.address || 'ঢাকা, বাংলাদেশ'}
                </p>
              </div>
            </div>

            {/* Box 4: Office & Support Schedule */}
            <div className="bg-[#F6F5EE] rounded-2xl p-4 flex items-center gap-3.5 border border-[#ECE8DC]">
              <div className="w-11 h-11 bg-[#D97706] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-gray-700 leading-snug">
                  অফিস ও সাপোর্ট সময়সূচী:
                </p>
                <p className="text-xs sm:text-sm font-bold text-gray-700 mt-0.5">
                  প্রতিদিন সকাল ১০:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
