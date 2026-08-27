import React from 'react';
import { useStore } from '../context/StoreContext';
import { MessageCircle, MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import { KinoMartLogo } from './KinoMartLogo';

export const Footer: React.FC = () => {
  const { settings, setActiveClientPage, setSelectedCategory } = useStore();

  const handleWhatsapp = () => {
    const cleanNum = settings.whatsapp.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum || '8801700000000'}`, '_blank');
  };

  return (
    <footer className="bg-[#151716] text-[#A2A9B5] pt-12 pb-8 border-t border-[#232724]">
      <div className="max-w-7xl mx-auto px-4 space-y-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <KinoMartLogo className="w-9 h-9" />
              <span className="text-xl font-black text-white tracking-tight">
                {settings.websiteTitle || 'KinoMart'}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-[#8E97A6]">
              কীনোমার্ট বাংলাদেশের একটি বিশ্বস্ত প্রিমিয়াম গ্যাজেট অনলাইন শপ। আমরা সরবরাহ করি ১০০% অরিজিনাল ও মানসম্মত ইলেকট্রনিক্স গ্যাজেট।
            </p>

            <button
              onClick={handleWhatsapp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#25D366]/30 bg-[#121E15] text-[#25D366] text-xs font-bold hover:bg-[#25D366] hover:text-black transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>২৪/৭ হোয়াটসঅ্যাপ সাপোর্ট</span>
            </button>
          </div>

          {/* Column 2: Important Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              গুরুত্বপূর্ণ লিংক
            </h3>
            <ul className="space-y-2 text-xs font-medium text-[#9EA6B5]">
              <li>
                <button
                  onClick={() => {
                    setActiveClientPage('home');
                    setSelectedCategory(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  হোম পেইজ
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveClientPage('products');
                    setSelectedCategory(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  সব প্রডাক্ট
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveClientPage('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  আমাদের সম্পর্কে
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveClientPage('contact');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  যোগাযোগ
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveClientPage('order-track');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  আমার অর্ডার ট্র্যাক করুন
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              কাস্টমার কেয়ার
            </h3>
            <ul className="space-y-2.5 text-xs text-[#9EA6B5]">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#5E7A3B] shrink-0" />
                <span>ঢাকা, বাংলাদেশ</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#5E7A3B] shrink-0" />
                <span>হটলাইন: {settings.phone || '01700000000'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#5E7A3B] shrink-0" />
                <span>ইমেইল: {settings.email || 'support@kinomart.com'}</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#5E7A3B] shrink-0" />
                <span>১০০% সেফ ক্যাশ অন ডেলিভারি</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment Methods */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-white tracking-wide">
              পেমেন্ট মাধ্যমসমূহ
            </h3>
            <p className="text-xs text-[#8E97A6] leading-relaxed">
              ক্যাশ অন ডেলিভারিতে পণ্য দেখে টাকা দিন। এছাড়াও বিকাশ ও নগদে অগ্রিম পেমেন্ট সুবিধা।
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {/* bKash Badge */}
              <span className="bg-[#D12053] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-md shadow-xs">
                bKash বিকাশ
              </span>
              {/* Nagad Badge */}
              <span className="bg-[#E65100] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-md shadow-xs">
                Nagad নগদ
              </span>
              {/* Cash On Delivery Badge */}
              <span className="bg-[#596B43] text-white text-[11px] font-extrabold px-3 py-1.5 rounded-md shadow-xs">
                ক্যাশ অন ডেলিভারি
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#232724] flex flex-col sm:flex-row items-center justify-between text-xs text-[#717A88] gap-2">
          <p>© 2026 KinoMart. সর্বস্বত্ব সংরক্ষিত।</p>
          <p>
            Developed by{' '}
            <a
              href="https://b2bfiy-com-two.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F57C00] font-extrabold hover:underline transition-all"
            >
              B2Bfly .
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
