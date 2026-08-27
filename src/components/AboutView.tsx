import React from 'react';
import { Award, ShieldCheck, Truck, Check } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Top Hero Card */}
      <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 sm:p-10 shadow-2xs text-center max-w-3xl mx-auto space-y-3">
        {/* Emblem Badge */}
        <div className="w-12 h-12 bg-[#596B43] rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-xs mx-auto mb-2">
          K
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-[#1F241E] tracking-tight">
          কীনোমার্ট (KinoMart) সম্পর্কে
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
          কীনোমার্ট বাংলাদেশের একটি বিশ্বস্ত প্রিমিয়াম গ্যাজেট অনলাইন শপ। আমরা সরবরাহ করি ১০০% অরিজিনাল ও মানসম্মত ইলেকট্রনিক্স গ্যাজেট।
        </p>
      </div>

      {/* 3 Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Mission */}
        <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 shadow-2xs space-y-3">
          <div className="w-10 h-10 bg-[#F2F5EC] text-[#596B43] rounded-2xl flex items-center justify-center border border-[#E2EAD6]">
            <Award className="w-5 h-5" />
          </div>
          <h2 className="text-base font-extrabold text-[#1F241E]">
            আমাদের লক্ষ্য (Mission)
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            বাংলাদেশের প্রতিটি মানুষের কাছে সঠিক মূল্যে আন্তর্জাতিক মানের গ্যাজেট পৌঁছে দেওয়া এবং সেরা কেনাকাটার অভিজ্ঞতা প্রদান করা।
          </p>
        </div>

        {/* Card 2: Quality Assurance */}
        <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 shadow-2xs space-y-3">
          <div className="w-10 h-10 bg-[#FFF7ED] text-[#EA580C] rounded-2xl flex items-center justify-center border border-[#FFEDD5]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-extrabold text-[#1F241E]">
            গুণমানের নিশ্চয়তা
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            আমরা কোনো কপি বা নিম্নমানের গ্যাজেট বিক্রি করি না। প্রতিটি প্রোডাক্ট ডেলিভারির আগে মান যাচাই করা হয়।
          </p>
        </div>

        {/* Card 3: Fastest Service */}
        <div className="bg-white border border-[#E8E3D9] rounded-3xl p-6 shadow-2xs space-y-3">
          <div className="w-10 h-10 bg-[#ECFDF5] text-[#057A3A] rounded-2xl flex items-center justify-center border border-[#D1FAE5]">
            <Truck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-extrabold text-[#1F241E]">
            দ্রুততম সার্ভিস
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            ঢাকা ও ঢাকার বাইরে দ্রুততম হোম ডেলিভারি সিস্টেম এবং আন্তরিক ২৪/৭ কাস্টমার কেয়ার সার্ভিস।
          </p>
        </div>
      </div>

      {/* Bottom Section: Why Choose KinoMart */}
      <div className="bg-[#F8F7F2] border border-[#E8E3D9] rounded-3xl p-6 sm:p-10 shadow-2xs space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-[#1F241E] text-center">
          কেন বেছে নেবেন কীনোমার্ট?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Feature 1 */}
          <div className="bg-white border border-[#E8E3D9] rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#057A3A] shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">
                ক্যাশ অন ডেলিভারি (COD)
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 font-medium mt-0.5">
                পণ্য আপনার দরজায় পৌঁছানোর পর চেক করে দেখে তারপর মূল্য পরিশোধ করুন।
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-[#E8E3D9] rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#057A3A] shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">
                ৭ দিনের রিপ্লেসমেন্ট ওয়ারেন্টি
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 font-medium mt-0.5">
                যেকোনো টেকনিক্যাল সমস্যা হলে সহজে ৭ দিনের মধ্যে রিপ্লেসমেন্ট পান।
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-[#E8E3D9] rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#057A3A] shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">
                স্বয়ংক্রিয় অর্ডার ট্র্যাকিং
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 font-medium mt-0.5">
                আপনার ফোন নম্বর দিয়েই ওয়েবসাইটে লগইন করে অর্ডারের লাইভ আপডেট দেখতে পারবেন।
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white border border-[#E8E3D9] rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#057A3A] shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-900">
                ২৪/৭ হোয়াটসঅ্যাপ হেল্পলাইন
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 font-medium mt-0.5">
                পণ্য সংক্রান্ত যেকোনো তথ্যের জন্য সার্বক্ষণিক কল অথবা চ্যাট সাপোর্ট।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
