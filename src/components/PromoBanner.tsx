import React from 'react';
import { useStore } from '../context/StoreContext';
import { Flame, ArrowRight } from 'lucide-react';

export const PromoBanner: React.FC = () => {
  const { promoBanner, setActiveClientPage, setSelectedCategory } = useStore();
  const config = promoBanner;

  if (!config || config.isEnabled === false || !config.title) {
    return null;
  }

  const handleClick = () => {
    if (config.linkType === 'category' && config.linkValue) {
      setSelectedCategory(config.linkValue);
      setActiveClientPage('products');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (config.linkType === 'custom_url' && config.linkValue) {
      if (config.linkValue.startsWith('http')) {
        window.open(config.linkValue, '_blank');
      } else {
        window.location.href = config.linkValue;
      }
    } else {
      setActiveClientPage('products');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 my-8">
      <div
        className="text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden flex flex-col items-start gap-4"
        style={{
          backgroundColor: config.bgColor || '#434F33',
          backgroundImage: config.bgImageUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${config.bgImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Background Subtle Accent */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top Badge */}
        {config.badgeText && (
          <div className="inline-flex items-center gap-1.5 bg-[#FF6B35] text-white text-xs font-black px-4 py-1.5 rounded-full shadow-xs">
            <Flame className="w-4 h-4 fill-white animate-bounce" />
            <span>{config.badgeText}</span>
          </div>
        )}

        {/* Headline */}
        <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold max-w-2xl leading-tight">
          {config.title || 'আজকের যেকোনো ২ টি গ্যাজেট অর্ডারে সম্পূর্ণ ফ্রি সারা দেশ ডেলিভারি!'}
        </h2>

        {/* Subtitle */}
        {config.subtitle && (
          <p className="text-xs sm:text-base text-amber-100 font-medium max-w-xl">
            {config.subtitle}
          </p>
        )}

        {/* CTA Button */}
        <button
          onClick={handleClick}
          className="mt-2 bg-white text-[#2E3B2B] hover:bg-amber-100 active:scale-95 text-xs sm:text-sm font-extrabold py-3 px-6 rounded-full flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>{config.buttonText || 'অফারটি লুফে নিন'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
