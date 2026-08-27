import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Truck, X, Plus, Minus, Check, Tag, ShieldCheck, Copy, Zap } from 'lucide-react';
import { BundleSelector } from './BundleSelector';
import { FlavorSelector } from './FlavorSelector';
import { getEffectiveBundles, calculateProductPrice } from '../lib/bundleUtils';
import { trackBeginCheckout, trackPurchase } from '../lib/dataLayer';

interface QuickOrderModalProps {
  product: Product;
  onClose: () => void;
}

const DIVISIONS = [
  { name: 'Dhaka (Dhaka)', area: 'Inside Dhaka', fee: 60 },
  { name: 'Chattogram (Chattogram)', area: 'Outside Dhaka', fee: 120 },
  { name: 'Rajshahi (Rajshahi)', area: 'Outside Dhaka', fee: 120 },
  { name: 'Khulna (Khulna)', area: 'Outside Dhaka', fee: 120 },
  { name: 'Barishal (Barishal)', area: 'Outside Dhaka', fee: 120 },
  { name: 'Sylhet (Sylhet)', area: 'Outside Dhaka', fee: 120 },
  { name: 'Rangpur (Rangpur)', area: 'Outside Dhaka', fee: 120 },
  { name: 'Mymensingh (Mymensingh)', area: 'Outside Dhaka', fee: 120 },
];

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({ product, onClose }) => {
  const { createOrder, validateCoupon, settings } = useStore();

  const effectiveBundles = getEffectiveBundles(product);
  const defaultBundle = effectiveBundles.find((b) => b.isPopular) || effectiveBundles[0];

  const [selectedBundleId, setSelectedBundleId] = useState<string>(defaultBundle?.id || '');
  const [quantity, setQuantity] = useState<number>(defaultBundle?.quantity || 1);
  const [selectedFlavors, setSelectedFlavors] = useState<{ [flavorName: string]: number }>(() => {
    if (product.hasFlavors && product.flavors && product.flavors.length > 0) {
      const firstFlv = product.flavors[0]?.name || 'Grape';
      return { [firstFlv]: defaultBundle?.quantity || 1 };
    }
    return {};
  });

  const handleFlavorsChange = (newFlavors: { [flavorName: string]: number }, totalCount: number) => {
    setSelectedFlavors(newFlavors);
    const newQty = Math.max(1, totalCount);
    setQuantity(newQty);
    const matched = effectiveBundles.find((b) => b.quantity === newQty);
    if (matched) {
      setSelectedBundleId(matched.id);
    } else {
      setSelectedBundleId('');
    }
  };

  // Dynamic price calculation
  const priceResult = calculateProductPrice(product, quantity, selectedBundleId);
  const selectedBundle = priceResult.activeBundle;
  const activeBundleId = priceResult.activeBundleId;
  const subtotal = priceResult.totalPrice;
  const customerNameInitial = '';
  const [customerName, setCustomerName] = useState<string>(customerNameInitial);
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('Dhaka (Dhaka)');
  const [deliveryArea, setDeliveryArea] = useState<'Inside Dhaka' | 'Outside Dhaka'>('Inside Dhaka');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad'>('COD');

  const handleDivisionChange = (divisionName: string) => {
    setSelectedDivision(divisionName);
    const matched = DIVISIONS.find((d) => d.name === divisionName);
    if (matched) {
      setDeliveryArea(matched.area as 'Inside Dhaka' | 'Outside Dhaka');
    } else if (divisionName.toLowerCase().includes('dhaka')) {
      setDeliveryArea('Inside Dhaka');
    } else {
      setDeliveryArea('Outside Dhaka');
    }
  };

  // Payment inputs for bKash & Nagad
  const [senderPhone, setSenderPhone] = useState<string>('');
  const [trxId, setTrxId] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const unitPrice = product.discountPrice || product.price;
  const deliveryFee = deliveryArea === 'Inside Dhaka' ? 60 : 120;
  const totalPrice = Math.max(0, subtotal - discountAmount + deliveryFee);

  // Trigger begin_checkout event when modal opens
  useEffect(() => {
    trackBeginCheckout(
      [{ product, quantity, selectedColor: selectedBundle ? selectedBundle.title : undefined }],
      totalPrice,
      appliedCoupon || undefined
    );
  }, []);

  const handleCopyNumber = (num: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCodeInput.trim()) return;
    const result = validateCoupon(couponCodeInput, subtotal);
    if (result.valid) {
      setDiscountAmount(result.discount);
      setAppliedCoupon(couponCodeInput.trim().toUpperCase());
      setCouponMessage({ text: result.message, isError: false });
    } else {
      setCouponMessage({ text: result.message, isError: true });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 11) {
      setErrorMsg('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন');
      return;
    }
    if (!shippingAddress.trim()) {
      setErrorMsg('অনুগ্রহ করে আপনার ডেলিভারি ঠিকানা লিখুন');
      return;
    }

    if (paymentMethod !== 'COD') {
      if (!senderPhone.trim()) {
        setErrorMsg(`অনুগ্রহ করে ${paymentMethod === 'bKash' ? 'বিকাশ' : 'নগদ'} প্রেরক নম্বরটি লিখুন`);
        return;
      }
      if (!trxId.trim()) {
        setErrorMsg('অনুগ্রহ করে ট্রানজেকশন আইডি (TrxID) প্রদান করুন');
        return;
      }
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const flavorSummary = Object.entries(selectedFlavors)
        .filter(([_, q]) => q > 0)
        .map(([name, q]) => `${name} (${q})`)
        .join(', ');

      const createdOrder = createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: `[বিভাগ: ${selectedDivision}] ${shippingAddress.trim()}`,
        deliveryArea,
        deliveryFee,
        paymentMethod,
        senderPhone: paymentMethod !== 'COD' ? senderPhone.trim() : undefined,
        trxId: paymentMethod !== 'COD' ? trxId.trim() : undefined,
        items: [
          {
            product,
            quantity,
            selectedFlavors: product.hasFlavors ? selectedFlavors : undefined,
            flavorSummary: product.hasFlavors ? flavorSummary : undefined,
            selectedBundle: selectedBundle?.title
          }
        ],
        subtotal,
        discount: discountAmount,
        couponCode: appliedCoupon || undefined,
        totalPrice
      });

      // Fire purchase event
      if (createdOrder) {
        trackPurchase(createdOrder);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-[#D5CEBF] my-auto animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-[#5E6A45] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
            <Truck className="w-5 h-5 text-amber-200" />
            <span>সহজ অর্ডার ফরম</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {errorMsg && (
            <div className="bg-red-50 text-red-600 text-xs sm:text-sm p-3 rounded-xl border border-red-200 font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Ordered Item Card */}
          <div className="bg-[#F7F5F0] border border-[#E8E3D9] p-3 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={product.thumbnail}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-[#E8E3D9] bg-[#FFDC33]"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-[#1F241E] line-clamp-1 max-w-[200px]">
                  {product.name}
                </h4>
                <p className="text-xs font-bold text-[#5E7A3B]">
                  একক দাম: ৳{unitPrice.toLocaleString('bn-BD')}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-extrabold text-[#1F241E] bg-white border border-[#D5CEBF] px-3 py-1.5 rounded-xl">
                {selectedBundle ? selectedBundle.title : `${quantity} Pcs`}
              </span>
            </div>
          </div>

          {/* Flavor Selection Section if product has flavors */}
          {product.hasFlavors && product.flavors && product.flavors.length > 0 && (
            <div className="pt-1">
              <FlavorSelector
                flavors={product.flavors}
                title={product.flavorTitle || 'ফ্লেভার নির্বাচন করুন'}
                selectedFlavors={selectedFlavors}
                onChange={handleFlavorsChange}
              />
            </div>
          )}

          {/* Bundle Package Deals Selection */}
          <BundleSelector
            bundles={effectiveBundles}
            selectedBundleId={activeBundleId}
            styleMode={product.bundleStyle || 'radio_cards'}
            bannerTitle={product.bundleBannerTitle}
            bannerSubtitle={product.bundleBannerSubtitle}
            onSelectBundle={(b) => {
              setSelectedBundleId(b.id);
              setQuantity(b.quantity);
            }}
          />

          {/* Quantity Selector & Total Price matching demo image */}
          <div className="space-y-1.5 py-1">
            <label className="block text-xs sm:text-sm font-extrabold text-[#1F241E]">
              পরিমাণ (Quantity):
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Quantity Pill Box */}
              <div className="flex items-center justify-between w-32 sm:w-36 bg-[#F5F4EE] border-2 border-[#D5DCBF] rounded-full px-3.5 py-1.5 sm:py-2 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    const newQty = Math.max(1, quantity - 1);
                    setQuantity(newQty);
                    const matched = effectiveBundles.find(b => b.quantity === newQty);
                    if (matched) setSelectedBundleId(matched.id);
                    else setSelectedBundleId('');
                  }}
                  disabled={quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center text-[#3D472B] hover:text-black font-black text-xl transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer select-none"
                >
                  −
                </button>
                <span className="font-black text-[#1F241E] text-base sm:text-lg select-none min-w-[20px] text-center">
                  {quantity.toLocaleString('bn-BD')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newQty = quantity + 1;
                    setQuantity(newQty);
                    const matched = effectiveBundles.find(b => b.quantity === newQty);
                    if (matched) setSelectedBundleId(matched.id);
                    else setSelectedBundleId('');
                  }}
                  className="w-7 h-7 flex items-center justify-center text-[#3D472B] hover:text-black font-black text-xl transition-all active:scale-90 cursor-pointer select-none"
                >
                  +
                </button>
              </div>

              {/* Total Price Right Beside */}
              <div className="text-sm sm:text-base text-[#1F241E] flex items-center gap-1.5">
                <span className="font-bold text-gray-700">মোট দাম:</span>
                <span className="font-black text-[#1F241E] text-base sm:text-lg">
                  ৳{subtotal.toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-[#1F241E] mb-1">
                আপনার পূর্ণ নাম <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="যেমন: মো: রহিম উল্লাহ"
                className="w-full bg-[#FAF8F5] border border-[#D5CEBF] rounded-xl p-3 text-[#1F241E] focus:outline-none focus:ring-1 focus:ring-[#5E7A3B] focus:border-[#5E7A3B]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1F241E] mb-1">
                মোবাইল নম্বর (অর্ডার কনফার্মেশনের জন্য) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="যেমন: 01700000000"
                className="w-full bg-[#FAF8F5] border border-[#D5CEBF] rounded-xl p-3 text-[#1F241E] focus:outline-none focus:ring-1 focus:ring-[#5E7A3B] focus:border-[#5E7A3B]"
              />
            </div>

            {/* Division Dropdown */}
            <div>
              <label className="block font-bold text-[#1F241E] mb-1">
                বিভাগ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#D5CEBF] rounded-xl p-3 text-[#1F241E] font-semibold text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#5E7A3B] focus:border-[#5E7A3B] cursor-pointer appearance-none pr-8"
                >
                  {DIVISIONS.map((div) => (
                    <option key={div.name} value={div.name}>
                      {div.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#1F241E]">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1F241E] mb-1">
                সম্পূর্ণ ঠিকানা (বাসা/রোড/এলাকা/জেলা) <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="যেমন: বাসা ১২, রোড ৫, সেক্টর ৩, উত্তরা"
                className="w-full bg-[#FAF8F5] border border-[#D5CEBF] rounded-xl p-3 text-[#1F241E] focus:outline-none focus:ring-1 focus:ring-[#5E7A3B] focus:border-[#5E7A3B]"
              />
            </div>
          </div>

          {/* Delivery Area Selection */}
          <div className="space-y-2">
            <label className="block font-bold text-[#1F241E] text-xs sm:text-sm">
              ডেলিভারি এরিয়া সিলেক্ট করুন
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setDeliveryArea('Inside Dhaka')}
                className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition-all ${
                  deliveryArea === 'Inside Dhaka'
                    ? 'bg-[#F2F7EC] border-[#5E7A3B] font-bold text-[#2E3B2B]'
                    : 'bg-[#FAF8F5] border-[#D5CEBF] text-[#555]'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryArea"
                  checked={deliveryArea === 'Inside Dhaka'}
                  onChange={() => setDeliveryArea('Inside Dhaka')}
                  className="accent-[#5E7A3B]"
                />
                <span className="text-xs sm:text-sm">ঢাকা শহর (৳৬০)</span>
              </label>

              <label
                onClick={() => setDeliveryArea('Outside Dhaka')}
                className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition-all ${
                  deliveryArea === 'Outside Dhaka'
                    ? 'bg-[#F2F7EC] border-[#5E7A3B] font-bold text-[#2E3B2B]'
                    : 'bg-[#FAF8F5] border-[#D5CEBF] text-[#555]'
                }`}
              >
                <input
                  type="radio"
                  name="deliveryArea"
                  checked={deliveryArea === 'Outside Dhaka'}
                  onChange={() => setDeliveryArea('Outside Dhaka')}
                  className="accent-[#5E7A3B]"
                />
                <span className="text-xs sm:text-sm">ঢাকার বাইরে (৳১২০)</span>
              </label>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="block font-bold text-[#1F241E] text-xs sm:text-sm">
              পেমেন্ট পদ্ধতি
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'COD'
                    ? 'bg-[#5E6A45] text-white border-[#5E6A45] shadow-xs'
                    : 'bg-[#FAF8F5] border-[#D5CEBF] text-[#2E3B2B] hover:bg-[#F0EDE6]'
                }`}
              >
                ক্যাশ অন ডেলিভারি
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bKash')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'bKash'
                    ? 'bg-[#D12053] text-white border-[#D12053] shadow-xs'
                    : 'bg-[#FAF8F5] border-[#D5CEBF] text-[#2E3B2B] hover:bg-[#F0EDE6]'
                }`}
              >
                বিকাশ (bKash)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Nagad')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === 'Nagad'
                    ? 'bg-[#EA580C] text-white border-[#EA580C] shadow-xs'
                    : 'bg-[#FAF8F5] border-[#D5CEBF] text-[#2E3B2B] hover:bg-[#F0EDE6]'
                }`}
              >
                নগদ (Nagad)
              </button>
            </div>

            {/* bKash Payment Box (Matching Demo Image) */}
            {paymentMethod === 'bKash' && (
              <div className="bg-[#FDF2F8] border border-[#FBCFE8] rounded-2xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-[#831843] text-xs sm:text-sm">
                    বিকাশ পার্সোনাল নম্বর:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyNumber(settings.bkashNumber || '01700123456')}
                    className="bg-[#FCE7F3] border border-[#F472B6]/40 hover:bg-[#FBCFE8] px-3 py-1 rounded-xl font-black text-xs sm:text-sm text-[#9D174D] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    title="কপি করতে ক্লিক করুন"
                  >
                    <span className="underline decoration-1 underline-offset-2">
                      {settings.bkashNumber || '01700123456'}
                    </span>
                    {copiedNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-[#9D174D] font-medium leading-relaxed">
                  মোট ৳{totalPrice.toLocaleString('bn-BD')} টাকা সেন্ড মানি করে আপনার নম্বর ও ট্রানজেকশন আইডি প্রদান করুন:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="প্রেরক নম্বর"
                    className="w-full bg-white border border-[#F472B6]/60 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F241E] focus:outline-none focus:ring-2 focus:ring-[#D12053]/30 focus:border-[#D12053] placeholder:text-gray-400 font-medium"
                  />
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="TrxID (ট্রানজেকশন আইডি)"
                    className="w-full bg-white border border-[#F472B6]/60 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F241E] focus:outline-none focus:ring-2 focus:ring-[#D12053]/30 focus:border-[#D12053] placeholder:text-gray-400 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Nagad Payment Box (Matching Demo Image) */}
            {paymentMethod === 'Nagad' && (
              <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-2xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-[#9A3412] text-xs sm:text-sm">
                    নগদ পার্সোনাল নম্বর:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyNumber(settings.nagadNumber || '01700123456')}
                    className="bg-[#FFEDD5] border border-[#FB923C]/40 hover:bg-[#FED7AA] px-3 py-1 rounded-xl font-black text-xs sm:text-sm text-[#C2410C] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    title="কপি করতে ক্লিক করুন"
                  >
                    <span className="underline decoration-1 underline-offset-2">
                      {settings.nagadNumber || '01700123456'}
                    </span>
                    {copiedNumber ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-[#C2410C] font-medium leading-relaxed">
                  মোট ৳{totalPrice.toLocaleString('bn-BD')} টাকা সেন্ড মানি করে আপনার নম্বর ও ট্রানজেকশন আইডি প্রদান করুন:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="প্রেরক নম্বর"
                    className="w-full bg-white border border-[#FB923C]/60 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F241E] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] placeholder:text-gray-400 font-medium"
                  />
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="TrxID (ট্রানজেকশন আইডি)"
                    className="w-full bg-white border border-[#FB923C]/60 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-[#1F241E] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:border-[#EA580C] placeholder:text-gray-400 font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Discount Coupon Code Box */}
          <div className="bg-[#F7F5F0] border border-[#E8E3D9] p-3 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E3B2B]">
              <Tag className="w-3.5 h-3.5 text-[#5E7A3B]" />
              <span>ডিসকাউন্ট কুপন কোড (Promo / Coupon Code)</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
                placeholder="যেমন: KINO10, SAVE100"
                className="flex-1 bg-white border border-[#D5CEBF] rounded-xl px-3 py-2 text-xs text-[#1F241E] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="bg-[#D5D8DC] hover:bg-[#BFC3C9] text-[#2E3B2B] text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                এপ্লাই করুন
              </button>
            </div>
            {couponMessage && (
              <p
                className={`text-[11px] font-semibold ${
                  couponMessage.isError ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                {couponMessage.text}
              </p>
            )}
          </div>

          {/* Price Summary Calculation */}
          <div className="bg-[#FAF8F5] border border-[#5E7A3B]/30 rounded-2xl p-4 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-[#555]">
              <span>প্রোডাক্ট সাবটোটাল:</span>
              <span className="font-bold text-[#1F241E]">
                ৳{subtotal.toLocaleString('bn-BD')}
              </span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>কুপন ডিসকাউন্ট:</span>
                <span>-৳{discountAmount.toLocaleString('bn-BD')}</span>
              </div>
            )}

            <div className="flex justify-between text-[#555]">
              <span>ডেলিভারি চার্জ ({deliveryArea === 'Inside Dhaka' ? 'ঢাকা' : 'ঢাকার বাইরে'}):</span>
              <span className="font-bold text-[#1F241E]">
                ৳{deliveryFee.toLocaleString('bn-BD')}
              </span>
            </div>

            <div className="border-t border-dashed border-[#D5CEBF] pt-2 flex justify-between items-center">
              <span className="font-extrabold text-[#1F241E] text-base">মোট দাম:</span>
              <span className="font-black text-lg text-[#5E7A3B] border border-[#5E7A3B] bg-white px-3 py-1 rounded-xl shadow-2xs">
                ৳{totalPrice.toLocaleString('bn-BD')}
              </span>
            </div>
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative overflow-hidden w-full bg-[#485539] hover:bg-[#3C472E] active:scale-[0.98] text-white text-base sm:text-lg font-black py-3.5 sm:py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#485539]/25 hover:shadow-xl border border-[#586847] transition-all disabled:opacity-50 cursor-pointer animate-order-btn"
          >
            {/* Shimmer Light Bar */}
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-order-shimmer" />

            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-[#FACC15] text-[#FACC15] animate-zap-pop shrink-0" />
            <span className="relative z-10 tracking-wide font-extrabold text-white">
              {isSubmitting
                ? 'অর্ডার প্রসেস হচ্ছে...'
                : `এখনই অর্ডার কনফার্ম করুন (৳${totalPrice.toLocaleString('bn-BD')})`}
            </span>
          </button>

          <p className="text-[11px] text-[#6B7264] text-center flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5E7A3B]" />
            পণ্য হাতে পেয়ে মূল্য পরিশোধের নিরাপদ সুবিধা
          </p>
        </form>
      </div>
    </div>
  );
};
