import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, UserCheck, Package, ShoppingBag, ArrowRight } from 'lucide-react';

export const OrderSuccessView: React.FC = () => {
  const { completedOrder, setActiveClientPage } = useStore();

  if (!completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500 text-sm">কোনো অর্ডার তথ্য পাওয়া যায়নি।</p>
        <button
          onClick={() => setActiveClientPage('home')}
          className="mt-4 bg-[#5E7A3B] text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          হোম পেজে যান
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Main Success Greeting Card */}
      <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-sm relative overflow-hidden">
        {/* Top Checkmark */}
        <div className="w-16 h-16 bg-[#E2F0D9] text-[#2E5E1E] rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="inline-block bg-[#F2F7EC] text-[#2E5E1E] text-xs font-bold px-4 py-1.5 rounded-full border border-[#C6E0B4]">
          🎉 আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে!
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#1F241E]">
          ধন্যবাদ! আপনার অর্ডার নম্বর:{' '}
          <span className="text-[#5E7A3B]">{completedOrder.orderNumber}</span>
        </h1>

        <p className="text-xs sm:text-sm text-[#555] max-w-lg mx-auto leading-relaxed">
          আমাদের প্রতিনিধি শীঘ্রই আপনার সাথে কল করে অর্ডারটি কনফার্ম করবে এবং পণ্যটি দ্রুত ডেলিভারির জন্য পাঠানো হবে।
        </p>

        {/* Auto Account Notice Box */}
        <div className="bg-[#FAF8F5] border border-[#E8E3D9] p-4 rounded-2xl text-left flex items-start gap-3 mt-4">
          <div className="p-2 bg-white rounded-full text-[#5E7A3B] border border-[#E8E3D9]">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#3D4738] space-y-1">
            <h4 className="font-extrabold text-[#1F241E]">স্বয়ংক্রিয় গ্রাহক অ্যাকাউন্ট তৈরি হয়েছে!</h4>
            <p className="leading-relaxed">
              আপনার মোবাইল নম্বর (<strong>{completedOrder.customerPhone}</strong>) দিয়ে একটি কাস্টমার অ্যাকাউন্ট তৈরি হয়ে গেছে। যেকোনো সময় আপনি 'অর্ডার ট্র্যাক' পেজে গিয়ে স্ট্যাটাস ট্র্যাকিং করতে পারবেন।
            </p>
          </div>
        </div>
      </div>

      {/* Order Details Breakdown Card */}
      <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex justify-between items-center border-b border-[#E8E3D9] pb-4">
          <h3 className="font-extrabold text-[#1F241E] text-base sm:text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-[#5E7A3B]" />
            অর্ডারের বিস্তারিত
          </h3>
          <span className="text-xs text-[#6B7264] font-medium">{completedOrder.createdAt}</span>
        </div>

        {/* Customer & Shipping Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm bg-[#FAF8F5] p-4 rounded-2xl border border-[#E8E3D9]">
          <div className="space-y-1">
            <p className="font-extrabold text-[#1F241E]">গ্রাহকের তথ্য:</p>
            <p className="text-[#4A5343]">👤 {completedOrder.customerName}</p>
            <p className="text-[#4A5343]">📞 {completedOrder.customerPhone}</p>
            <p className="text-[#4A5343]">📍 {completedOrder.shippingAddress}</p>
          </div>
          <div className="space-y-1">
            <p className="font-extrabold text-[#1F241E]">ডেলিভারি ও পেমেন্ট:</p>
            <p className="text-[#4A5343]">
              🚚 এরিয়া: {completedOrder.deliveryArea === 'Inside Dhaka' ? 'ঢাকা শহর (৳৬০)' : 'ঢাকার বাইরে (৳১২০)'}
            </p>
            <p className="text-[#4A5343]">
              💳 পেমেন্ট মেথড: {completedOrder.paymentMethod}
            </p>
            <p className="text-[#4A5343]">
              📌 অবস্থা: <span className="font-bold text-amber-600">{completedOrder.status}</span>
            </p>
          </div>
        </div>

        {/* Product Items */}
        <div className="space-y-3">
          {completedOrder.items.map((item, idx) => (
            <div key={idx} className="bg-[#FAF8F5] border border-[#E8E3D9] p-3 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={item.product.thumbnail}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#E8E3D9] bg-[#FFDC33]"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#1F241E]">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-[#6B7264]">পরিমাণ: {item.quantity} টি</p>
                </div>
              </div>
              <span className="font-bold text-[#5E7A3B] text-xs sm:text-sm">
                ৳{(item.product.discountPrice || item.product.price) * item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Total Cost Box */}
        <div className="bg-[#F2F7EC] border border-[#C6E0B4] p-4 rounded-2xl flex justify-between items-center text-sm font-extrabold text-[#2E3B2B]">
          <span>সর্বমোট দেয়া টাকা (ডেলিভারিসহ):</span>
          <span className="text-lg text-[#5E7A3B] font-black">
            ৳{completedOrder.totalPrice.toLocaleString('bn-BD')}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setActiveClientPage('order-track')}
          className="flex-1 bg-[#5E6A45] hover:bg-[#485333] text-white text-xs sm:text-sm font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Package className="w-4 h-4" />
          <span>আমার অ্যাকাউন্টে অর্ডারের অবস্থা দেখুন</span>
        </button>

        <button
          onClick={() => setActiveClientPage('home')}
          className="flex-1 bg-white hover:bg-[#F2EFE8] border border-[#D5CEBF] text-[#2E3B2B] text-xs sm:text-sm font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-[#5E7A3B]" />
          <span>আরও প্রোডাক্ট দেখুন</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
