import React from 'react';
import { Product } from '../types';
import { useStore } from '../context/StoreContext';
import { Star, Zap, BellRing } from 'lucide-react';
import { trackAddToCart, trackSelectItem } from '../lib/dataLayer';
import { getOptimizedImageUrl } from '../lib/imageUtils';

interface ProductCardProps {
  product: Product;
  index?: number;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, index = 0, priority = false }) => {
  const { setSelectedProduct, setQuickOrderProduct, setIsQuickOrderOpen, setActiveClientPage } = useStore();

  const isOutOfStock = product.stock <= 0 || product.status === 'INACTIVE';
  const isHighPriority = priority || index < 4;

  const rawImageUrl = product.thumbnail || product.gallery?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
  const optimizedSrc = getOptimizedImageUrl(rawImageUrl, { width: 440, quality: 82 });

  const handleCardClick = () => {
    trackSelectItem(product, 'Product Grid', index + 1);
    setSelectedProduct(product);
    setActiveClientPage('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      handleCardClick();
      return;
    }
    trackAddToCart(product, 1);
    setQuickOrderProduct(product);
    setIsQuickOrderOpen(true);
  };

  // Calculate discount percentage if discountPrice exists
  const discountPercent = product.discountPrice && product.price
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const displayPrice = (product.discountPrice || product.price || 0);

  const reviewCount = (product.reviews && product.reviews.length > 0)
    ? product.reviews.length
    : (typeof product.reviewsCount === 'number' && product.reviewsCount > 0 ? product.reviewsCount : ((product.reviews && product.reviews.length > 0) ? product.reviews.length : 1));

  const productRating = (product.reviews && product.reviews.length > 0)
    ? Number((product.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / product.reviews.length).toFixed(1))
    : (product.rating || 5.0);

  const formatPrice = (val: number) => {
    try {
      return (val || 0).toLocaleString('bn-BD');
    } catch {
      return (val || 0).toString();
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    // If the optimized render URL failed (e.g. Supabase Free tier without image transformation), revert to original raw URL
    if (target.src.includes('/render/image/public/')) {
      target.src = rawImageUrl;
    } else {
      target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-[#FAF9F5] rounded-2xl border-2 border-[#D5DCBF] hover:border-[#627048] p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      {/* Image Area */}
      <div>
        <div className="relative w-full aspect-square bg-[#EFECE6] rounded-xl overflow-hidden flex items-center justify-center mb-3 border border-[#E8E3D9]">
          <img
            src={optimizedSrc}
            alt={product.name || 'প্রোডাক্ট'}
            loading={isHighPriority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={isHighPriority ? 'high' : 'auto'}
            onError={handleImageError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />

          {/* Left Corner Badge */}
          <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none flex flex-col gap-1">
            {isOutOfStock ? (
              <span className="bg-red-600 text-white text-[8.5px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap inline-flex items-center">
                আউট অব স্টক
              </span>
            ) : discountPercent > 0 ? (
              <span className="bg-[#CB6532] text-white text-[8.5px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap inline-flex items-center">
                {discountPercent}% ছাড়
              </span>
            ) : null}
          </div>

          {/* Right Corner Badge */}
          <div className="absolute top-1.5 right-1.5 z-10 pointer-events-none flex flex-col items-end gap-1">
            {product.isBestSeller && !isOutOfStock && (
              <span className="bg-[#1F241E]/80 text-amber-300 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs whitespace-nowrap inline-flex items-center">
                বেস্ট সেলার
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-[#7C8573] tracking-wide block truncate">
            {product.category || 'গ্যাজেট'}
            {product.subCategory && (
              <span className="text-[#5E7A3B] font-bold"> • {product.subCategory}</span>
            )}
          </span>

          <h3
            className="text-xs sm:text-sm font-extrabold text-[#1F241E] truncate group-hover:text-[#5E7A3B] transition-colors leading-snug"
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 text-[11px] text-[#6B7264] pt-0.5">
            <div className="flex items-center text-[#F59E0B]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(productRating)
                      ? 'fill-[#F59E0B]'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="font-semibold text-gray-700 ml-1">
              {productRating.toFixed(1)} ({reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-sm sm:text-lg font-black text-[#5E7A3B]">
              ৳{formatPrice(displayPrice)}
            </span>
            {Boolean(product.discountPrice && product.price) && (
              <span className="text-xs text-gray-400 line-through">
                ৳{formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Order / Notify Me Button */}
      <div className="pt-3">
        {isOutOfStock ? (
          <button
            onClick={handleCardClick}
            className="w-full bg-[#374151] hover:bg-[#1F241E] active:scale-[0.98] text-white text-xs sm:text-sm font-bold py-2 sm:py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-300" />
            <span>স্টকে ফিরলে জানান</span>
          </button>
        ) : (
          <button
            onClick={handleQuickOrder}
            className="relative overflow-hidden w-full bg-[#485539] hover:bg-[#3C472E] active:scale-[0.98] text-white text-xs sm:text-sm font-black py-2 sm:py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg border border-[#586847] cursor-pointer group animate-order-btn"
          >
            {/* Shimmer Light Bar */}
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-order-shimmer" />

            <Zap className="w-4 h-4 fill-[#FACC15] text-[#FACC15] animate-zap-pop shrink-0" />
            <span className="relative z-10 tracking-wide font-extrabold text-white">অর্ডার করুন</span>
          </button>
        )}
      </div>
    </div>
  );
});

