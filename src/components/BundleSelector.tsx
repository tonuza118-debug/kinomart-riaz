import React from 'react';
import { ProductBundle } from '../types';
import { Sparkles } from 'lucide-react';

interface BundleSelectorProps {
  bundles: ProductBundle[];
  selectedBundleId: string;
  onSelectBundle: (bundle: ProductBundle) => void;
  styleMode?: 'radio_cards' | 'banner_table' | 'both';
  bannerTitle?: string;
  bannerSubtitle?: string;
  className?: string;
}

// 1. Radio Cards Style (Image 1 Demo)
export const RadioCardBundleSection: React.FC<Omit<BundleSelectorProps, 'styleMode'>> = ({
  bundles,
  selectedBundleId,
  onSelectBundle,
  className = ''
}) => {
  if (!bundles || bundles.length === 0) return null;

  return (
    <div className={`space-y-3 my-3 ${className}`}>
      {bundles.map((bundle, idx) => {
        const isSelected = selectedBundleId === bundle.id;

        let saveBadge = bundle.badgeText;
        if (!saveBadge && bundle.originalPrice && bundle.originalPrice > bundle.price) {
          const savedTk = bundle.originalPrice - bundle.price;
          saveBadge = `🔥 SAVE ${savedTk.toLocaleString('en-US')} TK`;
        }

        return (
          <div
            key={bundle.id || idx}
            onClick={() => onSelectBundle(bundle)}
            className={`group relative flex items-center justify-between gap-3 px-4 py-3.5 sm:py-4 rounded-2xl cursor-pointer transition-all select-none bg-white ${
              isSelected
                ? 'border-2 border-black shadow-sm ring-1 ring-black/5'
                : 'border border-gray-200 hover:border-gray-400 shadow-2xs'
            }`}
          >
            {/* Floating Save Badge on Top-Right */}
            {saveBadge && (
              <div className="absolute -top-3 right-4 bg-[#E11D48] text-white text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 z-10 tracking-wide">
                <span>{saveBadge}</span>
              </div>
            )}

            {/* Left Column: Radio Button + Title + Tag Pill */}
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'border-2 border-black bg-white'
                    : 'border-2 border-gray-300 bg-white group-hover:border-gray-400'
                }`}
              >
                {isSelected && (
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-black animate-scale-in" />
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                  {bundle.title}
                </span>

                {bundle.tagText && (
                  <span className="bg-[#EEF2F6] text-[#475569] text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {bundle.tagText}
                  </span>
                )}
              </div>
            </div>

            {/* Right Column: Price & Strikethrough Original Price */}
            <div className="text-right shrink-0">
              <span className="font-black text-base sm:text-lg text-gray-900 block leading-tight">
                ৳ {bundle.price.toLocaleString('en-US')}
              </span>

              {bundle.originalPrice && bundle.originalPrice > bundle.price && (
                <span className="text-[11px] sm:text-xs text-gray-400 font-semibold line-through block mt-0.5">
                  ৳ {bundle.originalPrice.toLocaleString('en-US')}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// 2. Special Discount Offer Banner Table Section (Image 2 Demo)
export const BannerTableOfferSection: React.FC<Omit<BundleSelectorProps, 'styleMode'>> = ({
  bundles,
  selectedBundleId,
  onSelectBundle,
  bannerTitle,
  bannerSubtitle,
  className = ''
}) => {
  if (!bundles || bundles.length === 0) return null;

  const defaultSub = 'একসাথে বেশি কিনুন – বেশি সাশ্রয় করুন!';
  const defaultTitle = 'একাধিক পণ্য কিনলে পাবেন বিশেষ ছাড়';

  return (
    <div className={`my-4 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-[#5E6A45] bg-white shadow-md ${className}`}>
      {/* Top Signature Olive Green Banner */}
      <div className="bg-gradient-to-r from-[#5E6A45] via-[#4B5637] to-[#5E6A45] text-white py-3.5 px-4 text-center select-none shadow-inner">
        <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-[#E7EFE0] flex items-center justify-center gap-1.5 opacity-95">
          <span>🎉</span>
          <span>{bannerSubtitle || defaultSub}</span>
        </p>
        <h3 className="text-sm sm:text-lg font-black tracking-tight text-white mt-0.5 leading-snug">
          {bannerTitle || defaultTitle}
        </h3>
      </div>

      {/* List of Bundle Tiers */}
      <div className="divide-y divide-[#E8E3D9]">
        {bundles.map((bundle, idx) => {
          const isSelected = selectedBundleId === bundle.id;

          let discountText = bundle.badgeText;
          if (!discountText && bundle.originalPrice && bundle.originalPrice > bundle.price) {
            const pct = Math.round(((bundle.originalPrice - bundle.price) / bundle.originalPrice) * 100);
            if (pct > 0) {
              discountText = `${pct}% ছাড়`;
            }
          }

          const isFireIcon = bundle.iconType === 'fire' || (!bundle.iconType && idx >= 2);
          const isGoldDot = bundle.iconType === 'gold_dot' || (!bundle.iconType && idx === 1);
          const isGreenDot = bundle.iconType === 'green_dot' || (!bundle.iconType && idx === 0);
          const isStarIcon = bundle.iconType === 'star';

          return (
            <div
              key={bundle.id || idx}
              onClick={() => onSelectBundle(bundle)}
              className={`flex items-center justify-between gap-3 px-3 sm:px-4 py-3 cursor-pointer transition-all select-none ${
                isSelected
                  ? 'bg-[#F2F7EC] border-l-4 border-l-[#5E6A45]'
                  : 'bg-white hover:bg-[#FAF8F5]'
              }`}
            >
              {/* Left Column: Icon + Title & Tag + Subtitle */}
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                <div className="shrink-0 flex items-center justify-center w-6 h-6">
                  {isFireIcon ? (
                    <span className="text-lg leading-none" role="img" aria-label="fire">
                      🔥
                    </span>
                  ) : isStarIcon ? (
                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
                  ) : isGoldDot ? (
                    <span className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#B45309] shadow-sm border border-amber-300 block" />
                  ) : (
                    <span className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-[#8FA36B] via-[#5E6A45] to-[#434D31] shadow-sm border border-[#A8BC85] block" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-extrabold text-xs sm:text-sm ${isSelected ? 'text-[#1F241E]' : 'text-gray-900'}`}>
                      {bundle.title}
                    </span>
                    {bundle.tagText && (
                      <span className="text-[#5E6A45] text-[11px] sm:text-xs font-black">
                        {bundle.tagText}
                      </span>
                    )}
                  </div>

                  {bundle.originalPrice && bundle.originalPrice > bundle.price && (
                    <div className="text-[10px] sm:text-[11px] text-gray-400 font-medium line-through mt-0.5">
                      আগের দাম: ৳{bundle.originalPrice.toLocaleString('bn-BD')}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Price + Discount Badge */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="font-black text-sm sm:text-base text-[#5E6A45] tracking-tight">
                  ৳{bundle.price.toLocaleString('bn-BD')}
                </span>

                {discountText && (
                  <span className="bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] text-[10px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-md whitespace-nowrap">
                    {discountText}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Export Component
export const BundleSelector: React.FC<BundleSelectorProps> = ({
  bundles,
  selectedBundleId,
  onSelectBundle,
  styleMode = 'radio_cards',
  bannerTitle,
  bannerSubtitle,
  className = ''
}) => {
  if (!bundles || bundles.length === 0) return null;

  if (styleMode === 'both') {
    return (
      <div className={`space-y-4 my-3 ${className}`}>
        <RadioCardBundleSection
          bundles={bundles}
          selectedBundleId={selectedBundleId}
          onSelectBundle={onSelectBundle}
        />
        <BannerTableOfferSection
          bundles={bundles}
          selectedBundleId={selectedBundleId}
          onSelectBundle={onSelectBundle}
          bannerTitle={bannerTitle}
          bannerSubtitle={bannerSubtitle}
        />
      </div>
    );
  }

  if (styleMode === 'banner_table') {
    return (
      <BannerTableOfferSection
        bundles={bundles}
        selectedBundleId={selectedBundleId}
        onSelectBundle={onSelectBundle}
        bannerTitle={bannerTitle}
        bannerSubtitle={bannerSubtitle}
        className={className}
      />
    );
  }

  return (
    <RadioCardBundleSection
      bundles={bundles}
      selectedBundleId={selectedBundleId}
      onSelectBundle={onSelectBundle}
      className={className}
    />
  );
};
