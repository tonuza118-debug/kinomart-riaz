import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

export const BenefitsGrid: React.FC = () => {
  const benefits = [
    {
      icon: Truck,
      title: 'দ্রুত হোম ডেলিভারি',
      subtitle: 'ঢাকা ১ দিনে, বাইরে ২-৩ দিনে'
    },
    {
      icon: ShieldCheck,
      title: 'ক্যাশ অন ডেলিভারি',
      subtitle: 'পণ্য দেখে টাকা পরিশোধের সুবিধা'
    },
    {
      icon: RotateCcw,
      title: '১০০% অরিজিনাল পণ্য',
      subtitle: '৭ দিনের সহজ রিটার্ন পলিসি'
    },
    {
      icon: Headphones,
      title: '২৪/৭ কাস্টমার কেয়ার',
      subtitle: 'যেকোনো প্রয়োজনে কল করুন'
    }
  ];

  return (
    <div className="bg-white border-y border-[#E8E3D9] py-10 my-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {benefits.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex flex-col items-center text-center space-y-2 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FAF8F5] border border-[#E8E3D9] flex items-center justify-center text-[#5E7A3B] group-hover:scale-110 transition-transform shadow-2xs">
                <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h4 className="font-extrabold text-[#1F241E] text-xs sm:text-sm">
                {item.title}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#6B7264] max-w-[180px]">
                {item.subtitle}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
