import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { PackageSearch, Search, Clock, CheckCircle2, Truck, XCircle, ChevronRight } from 'lucide-react';

export const OrderTrackView: React.FC = () => {
  const { orders, setActiveClientPage } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [searchedOrders, setSearchedOrders] = useState<typeof orders | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const term = searchInput.trim().toLowerCase();
    const matches = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(term) ||
        o.customerPhone.includes(term)
    );
    setSearchedOrders(matches);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Search Header Box */}
      <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs">
        <div className="w-14 h-14 bg-[#F2F7EC] text-[#5E7A3B] rounded-2xl flex items-center justify-center mx-auto border border-[#C6E0B4]">
          <PackageSearch className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-[#1F241E]">
          আমার অর্ডার ট্র্যাক করুন
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7264] max-w-md mx-auto">
          আপনার অর্ডার নাম্বার (যেমন: KM-74646) অথবা মোবাইল নম্বর দিয়ে অর্ডারের সর্বশেষ স্ট্যাটাস জানুন।
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto pt-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="অর্ডার # বা ফোন নম্বর..."
            className="flex-1 bg-[#FAF8F5] border border-[#D5CEBF] rounded-2xl px-4 py-3 text-xs sm:text-sm text-[#1F241E] focus:outline-none focus:border-[#5E7A3B]"
          />
          <button
            type="submit"
            className="bg-[#5E6A45] hover:bg-[#485333] text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Search className="w-4 h-4" />
            <span>খুঁজুন</span>
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchedOrders !== null && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-[#1F241E] text-base">
            ফলাফল ({searchedOrders.length} টি পাওয়া গেছে)
          </h3>

          {searchedOrders.length === 0 ? (
            <div className="bg-white border border-[#E8E3D9] rounded-3xl p-8 text-center text-xs sm:text-sm text-[#6B7264]">
              কোনো অর্ডার তথ্য পাওয়া যায়নি। অনুগ্রহ করে সঠিক অর্ডার নম্বর বা ফোন নম্বরটি দিন।
            </div>
          ) : (
            searchedOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-[#E8E3D9] rounded-3xl p-5 space-y-4 shadow-2xs"
              >
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-[#E8E3D9] pb-3">
                  <div>
                    <span className="text-xs text-[#6B7264]">অর্ডার নাম্বার:</span>
                    <h4 className="font-extrabold text-[#1F241E] text-lg text-[#5E7A3B]">
                      {ord.orderNumber}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#6B7264]">{ord.createdAt}</span>
                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold mt-0.5 ${
                          ord.status === 'Confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : ord.status === 'Shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : ord.status === 'Delivered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        স্ট্যাটাস: {ord.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-[#3D4738] space-y-1 bg-[#FAF8F5] p-3 rounded-2xl border border-[#E8E3D9]">
                  <p>👤 গ্রাহক: {ord.customerName} ({ord.customerPhone})</p>
                  <p>📍 ঠিকানা: {ord.shippingAddress}</p>
                  <p>💳 পেমেন্ট: {ord.paymentMethod}</p>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {ord.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs sm:text-sm bg-white p-2.5 rounded-xl border border-[#E8E3D9]"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={item.product.thumbnail}
                          alt={item.product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-[#FFDC33]"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-bold text-[#1F241E] line-clamp-1">
                          {item.product.name} (x{item.quantity})
                        </span>
                      </div>
                      <span className="font-extrabold text-[#5E7A3B]">
                        ৳{(item.product.discountPrice || item.product.price) * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs font-extrabold text-[#1F241E] pt-2 border-t border-[#E8E3D9]">
                  <span>মোট মূল্যে (ডেলিভারিসহ):</span>
                  <span className="text-base text-[#5E7A3B]">
                    ৳{ord.totalPrice.toLocaleString('bn-BD')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
