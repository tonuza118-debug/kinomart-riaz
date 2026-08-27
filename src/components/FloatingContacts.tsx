import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { MessageCircle, Phone, X } from 'lucide-react';

export const FloatingContacts: React.FC = () => {
  const { settings } = useStore();
  const [isOpenCall, setIsOpenCall] = useState(false);

  const handleWhatsappClick = () => {
    const cleanNum = settings.whatsapp.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNum || '8801700000000'}?text=হ্যালো!%20কীনোমার্ট%20থেকে%20তথ্য%20জানতে%20চাই।`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-5 sm:bottom-5 right-3 sm:right-5 z-40 flex flex-col items-end gap-2.5 sm:gap-3 pointer-events-auto">
      {/* Phone Call Modal Popup */}
      {isOpenCall && (
        <div className="bg-white border border-[#E8E3D9] p-4 rounded-2xl shadow-2xl mb-2 text-xs text-[#1F241E] w-60 animate-scaleUp">
          <div className="flex justify-between items-center font-bold mb-2 pb-1 border-b">
            <span>📞 হটলাইন নম্বর</span>
            <button onClick={() => setIsOpenCall(false)} className="text-gray-400 hover:text-black">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-gray-600 mb-3">যেকোনো প্রয়োজনে সরাসরি আমাদের কল করুন:</p>
          <a
            href={`tel:${settings.phone}`}
            className="block text-center bg-[#5E6A45] text-white font-extrabold py-2 rounded-xl text-sm hover:bg-[#485333]"
          >
            {settings.phone}
          </a>
        </div>
      )}

      {/* WhatsApp Button (Bright Neon Green with pulse ring & icon wobble) */}
      <button
        onClick={handleWhatsappClick}
        className="w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group relative animate-whatsapp-pulse cursor-pointer"
        title="২৪/৭ হোয়াটসঅ্যাপ সাপোর্ট"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white animate-icon-wobble" />
        <span className="absolute right-full mr-3 bg-black/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
          ২৪/৭ হোয়াটসঅ্যাপ
        </span>
      </button>

      {/* Phone Call Button (Dark Olive Green with pulse ring & icon wobble) */}
      <button
        onClick={() => setIsOpenCall(!isOpenCall)}
        className="w-12 h-12 sm:w-14 sm:h-14 bg-[#5E6A45] hover:bg-[#485333] text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group relative animate-call-pulse cursor-pointer"
        title="সরাসরি কল করুন"
      >
        <Phone className="w-5 h-5 sm:w-6 sm:h-6 animate-icon-wobble" />
        <span className="absolute right-full mr-3 bg-black/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md">
          হটলাইন কল
        </span>
      </button>
    </div>
  );
};
