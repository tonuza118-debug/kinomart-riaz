import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { motion } from 'motion/react';

interface CustomerScreenshotCarouselProps {
  images: string[];
  toBnNum: (n: number | string, padZero?: boolean) => string;
}

export const CustomerScreenshotCarousel: React.FC<CustomerScreenshotCarouselProps> = ({
  images,
  toBnNum,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = images.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Slideshow auto-advance timer
  useEffect(() => {
    if (!isAutoPlay || total <= 1) return;

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoPlay, total, nextSlide]);

  if (!images || images.length === 0) return null;

  // Compute 3 visible cards in loop for desktop perspective
  const getVisibleIndices = () => {
    if (total === 1) return [0];
    if (total === 2) return [currentIndex, (currentIndex + 1) % total];
    return [
      currentIndex,
      (currentIndex + 1) % total,
      (currentIndex + 2) % total,
    ];
  };

  const visibleIndices = getVisibleIndices();

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsAutoPlay(false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    setTouchStartX(null);
    setTimeout(() => setIsAutoPlay(true), 3000);
  };

  return (
    <div
      className="space-y-3 sm:space-y-4 select-none"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E3D9] pb-2.5 sm:pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#5E6A45]/10 text-[#5E6A45] flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-[#1F241E] text-xs sm:text-base flex items-center gap-1.5 sm:gap-2">
              <span>কাস্টমার চ্যাট ও ফিডব্যাক স্ক্রিনশট</span>
              <span className="text-[10px] sm:text-xs font-bold text-[#5E6A45] bg-[#5E6A45]/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                ({toBnNum(total)} টি)
              </span>
            </h4>
            <p className="text-[10px] sm:text-[11px] text-[#6B7565]">
              গ্রাহকদের বাস্তব প্রতিক্রিয়া ও ম্যাসেঞ্জার চ্যাট রিভিউ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {total > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous screenshot"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#E8E3D9] shadow-xs hover:shadow-md flex items-center justify-center text-[#1F241E] hover:bg-[#FAF8F5] transition-all cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next screenshot"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-[#E8E3D9] shadow-xs hover:shadow-md flex items-center justify-center text-[#1F241E] hover:bg-[#FAF8F5] transition-all cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Carousel Container */}
      <div
        className="relative overflow-hidden pt-1 pb-1 sm:pb-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Single Item Centered Layout */}
        {total === 1 ? (
          <div className="flex justify-center">
            <div
              className="max-w-xs sm:max-w-sm w-full bg-white rounded-xl sm:rounded-2xl md:rounded-3xl border border-[#E8E3D9] shadow-xs overflow-hidden relative"
            >
              <div className="h-[340px] sm:h-[420px] md:h-[480px] w-full bg-[#FAF8F5] relative overflow-hidden flex items-center justify-center p-1.5 sm:p-2">
                <img
                  src={images[0]}
                  alt="Customer Review Screenshot"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Multi-card Carousel: 2 items on Mobile, 3 items on Desktop */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3.5 md:gap-4.5 items-stretch px-1">
            {visibleIndices.map((imgIdx, position) => {
              const imgUrl = images[imgIdx];
              return (
                <motion.div
                  key={`${imgIdx}-${position}`}
                  initial={{ opacity: 0.5, scale: 0.96, x: 12 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className={`bg-white rounded-xl sm:rounded-2xl md:rounded-3xl border border-[#E8E3D9] shadow-xs transition-all duration-300 overflow-hidden flex flex-col ${
                    position === 2 ? 'hidden md:flex' : 'flex'
                  }`}
                >
                  {/* Image Display Card - full image visible without cutting */}
                  <div className="relative h-[280px] sm:h-[380px] md:h-[460px] w-full bg-[#FAF8F5] overflow-hidden flex items-center justify-center p-1 sm:p-2">
                    <img
                      src={imgUrl}
                      alt={`Customer Review Screenshot ${imgIdx + 1}`}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Side Floating Next/Prev Arrow Buttons */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous"
              className="absolute left-0.5 sm:left-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/95 hover:bg-white text-[#1F241E] shadow-md border border-[#E8E3D9] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#1F241E]" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next"
              className="absolute right-0.5 sm:right-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/95 hover:bg-white text-[#1F241E] shadow-md border border-[#E8E3D9] flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#1F241E]" />
            </button>
          </>
        )}
      </div>

      {/* Pagination Indicators (Pill for active slide) */}
      {total > 1 && (
        <div className="flex justify-center pt-1 sm:pt-2">
          <div className="bg-[#FAF8F5] border border-[#E8E3D9] px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full inline-flex items-center gap-1.5 sm:gap-2 shadow-2xs">
            {images.map((_, dotIdx) => {
              const isActive = dotIdx === currentIndex;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  className={`transition-all duration-300 cursor-pointer rounded-full ${
                    isActive
                      ? 'w-5 sm:w-7 h-2 sm:h-2.5 bg-[#5E6A45] shadow-xs'
                      : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[#D8D2C5] hover:bg-[#B8B1A0]'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
