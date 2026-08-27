import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Phone, LogOut, Package, CheckCircle2, Clock, Truck, AlertCircle, ShoppingBag, MapPin, ChevronRight } from 'lucide-react';

export const CustomerProfileView: React.FC = () => {
  const { customerUser, logoutCustomer, updateCustomerProfile, orders, setActiveClientPage, setCompletedOrder } = useStore();

  const [name, setName] = useState(customerUser?.name || '');
  const [address, setAddress] = useState(customerUser?.address || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!customerUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-[#E8E3D9] rounded-3xl p-8 space-y-4">
          <p className="text-gray-600 font-bold">আপনি অ্যাকাউন্টে প্রবেশ করেননি।</p>
          <button
            onClick={() => setActiveClientPage('home')}
            className="bg-[#5E6A45] text-white font-bold py-2.5 px-6 rounded-xl text-xs hover:bg-[#4d5838] transition-colors"
          >
            হোম পেজে যান
          </button>
        </div>
      </div>
    );
  }

  // Find orders matching this customer's phone number
  const customerOrders = orders.filter(
    (o) => o.customerPhone.trim() === customerUser.phone.trim()
  );

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerProfile(name, address);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ডেলিভার্ড</span>;
      case 'Shipped':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1"><Truck className="w-3 h-3" /> শিপড</span>;
      case 'Confirmed':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> কনফার্মড</span>;
      case 'Cancelled':
        return <span className="bg-rose-100 text-rose-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3" /> বাতিল</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> পেন্ডিং</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Profile Header Hero Card */}
      <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#5E7A3B] flex items-center justify-center text-white text-2xl font-black capitalize shadow-sm">
            {customerUser.name.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1F241E] capitalize">
              {customerUser.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7264] font-bold flex items-center gap-1.5 mt-1">
              <Phone className="w-3.5 h-3.5 text-[#5E7A3B]" />
              <span>মোবাইল: {customerUser.phone}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logoutCustomer}
          className="px-4 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
          <span>সাইন আউট</span>
        </button>
      </div>

      {/* Main Grid: Left Edit Profile & Right Order History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Info Form */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-black text-[#1F241E] border-b border-[#E8E3D9] pb-3">
              প্রোফাইল তথ্য সংশোধন
            </h3>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>আপনার তথ্য সফলভাবে আপডেট হয়েছে!</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-[#1F241E] mb-1.5 font-bold">আপনার নাম:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="আপনার পূর্ণ নাম"
                  className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl p-3 text-sm text-[#1F241E] font-medium focus:outline-none focus:border-[#5E7A3B]"
                />
              </div>

              <div>
                <label className="block text-[#1F241E] mb-1.5 font-bold">পছন্দের ঠিকানা:</label>
                <textarea
                  rows={4}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="যেমন: বাসা নং, রোড নং, এলাকা, থানা, জেলা..."
                  className="w-full bg-[#FAF8F5] border border-[#E8E3D9] rounded-xl p-3 text-sm text-[#1F241E] font-medium focus:outline-none focus:border-[#5E7A3B] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#5E7A3B] hover:bg-[#4d662f] text-white font-extrabold py-3 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                তথ্য আপডেট করুন
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-8">
          <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 shadow-xs min-h-[380px]">
            <div className="flex items-center justify-between border-b border-[#E8E3D9] pb-3 mb-4">
              <div className="flex items-center gap-2 text-base font-black text-[#1F241E]">
                <Package className="w-5 h-5 text-[#5E7A3B]" />
                <span>পূর্ববর্তী অর্ডার হিস্ট্রি ({customerOrders.length})</span>
              </div>
            </div>

            {customerOrders.length === 0 ? (
              <div className="py-20 text-center text-[#888888] text-xs sm:text-sm font-medium">
                এই মোবাইল নম্বরে কোনো অর্ডার হিস্ট্রি পাওয়া যায়নি।
              </div>
            ) : (
              <div className="space-y-4">
                {customerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-[#E8E3D9] rounded-2xl p-4 bg-[#FAF8F5] hover:border-[#D5CEBF] transition-all space-y-3"
                  >
                    {/* Order Meta Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E3D9] pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#1F241E]">{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-[11px] text-[#6B7264] font-semibold mt-0.5">
                          তারিখ: {order.createdAt}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setCompletedOrder(order);
                          setActiveClientPage('order-success');
                        }}
                        className="text-xs font-extrabold text-[#5E7A3B] hover:underline flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-[#E8E3D9]"
                      >
                        <span>বিস্তারিত ও ট্র্যাক</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Items Overview */}
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 text-xs bg-white p-2.5 rounded-xl border border-[#E8E3D9]">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product.thumbnail}
                              alt={item.product.name}
                              className="w-10 h-10 object-cover rounded-lg border border-[#E8E3D9] shrink-0"
                            />
                            <div>
                              <p className="font-bold text-[#1F241E] line-clamp-1">{item.product.name}</p>
                              <p className="text-[11px] text-[#6B7264]">
                                পরিমাণ: {item.quantity} টি {item.selectedColor ? `(${item.selectedColor})` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="font-extrabold text-[#1F241E] shrink-0">
                            ৳{((item.product.discountPrice || item.product.price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer summary */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-[#E8E3D9]/60">
                      <div className="flex items-center gap-1 text-[#6B7264]">
                        <MapPin className="w-3.5 h-3.5 text-[#5E7A3B]" />
                        <span className="line-clamp-1">{order.shippingAddress} ({order.deliveryArea})</span>
                      </div>
                      <div className="font-extrabold text-[#1F241E] text-sm">
                        সর্বমোট: <span className="text-[#5E7A3B]">৳{order.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
