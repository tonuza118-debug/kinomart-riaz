import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const HeroSlider: React.FC = () => {
  const { heroSlides, settings, isDataLoading, setActiveClientPage, setSelectedCategory } = useStore();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeSlides = useMemo(() => {
    const list = Array.isArray(heroSlides) ? heroSlides : [];
    return list.filter((s) => s.isActive !== false && s.image);
  }, [heroSlides]);

  const slideInterval = settings.heroSliderInterval || 5000;

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, slideInterval);
    return () => clearInterval(timer);
  }, [activeSlides.length, slideInterval]);

  // Reset currentSlide if it exceeds length
  useEffect(() => {
    if (currentSlide >= activeSlides.length) {
      setCurrentSlide(0);
    }
  }, [activeSlides.length, currentSlide]);

  if (activeSlides.length === 0) {
    if (isDataLoading) {
      return (
        <div className="w-full max-w-7xl mx-auto px-4 mt-3 mb-6">
          <div className="h-44 sm:h-72 md:h-96 lg:h-[420px] w-full rounded-2xl sm:rounded-3xl bg-[#E8E3D9]/60 animate-pulse" />
        </div>
      );
    }
    return null;
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const handleSlideClick = (slide: typeof activeSlides[0]) => {
    if (slide.linkType === 'category' && slide.linkValue) {
      setSelectedCategory(slide.linkValue);
      setActiveClientPage('products');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (slide.linkType === 'custom_url' && slide.linkValue) {
      if (slide.linkValue.startsWith('http')) {
        window.open(slide.linkValue, '_blank');
      } else {
        window.location.href = slide.linkValue;
      }
    } else {
      setActiveClientPage('products');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 mt-3 mb-6">
      <div className="relative h-44 sm:h-72 md:h-96 lg:h-[420px] w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-[#FFDC33] group select-none">
        {/* Slide Images */}
        {activeSlides.map((slide, index) => (
          <div
            key={slide.id}
            onClick={() => handleSlideClick(slide)}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title || `Slide ${index + 1}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading={index === 0 ? 'eager' : 'lazy'}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              decoding="async"
            />
          </div>
        ))}

        {/* Navigation Arrows (Show only if more than 1 slide) */}
        {activeSlides.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#5E5000]/80 hover:bg-[#5E5000] text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-[#5E5000]/80 hover:bg-[#5E5000] text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Capsule Pagination Indicator Bar (Exact as Screenshot) */}
        {activeSlides.length > 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(index);
                }}
                className={`transition-all duration-300 cursor-pointer ${
                  index === currentSlide
                    ? 'w-6 h-2 bg-[#FFC107] rounded-full'
                    : 'w-2 h-2 bg-white/60 hover:bg-white rounded-full'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
            {/* Decorative additional dots to match screenshot design */}
            {activeSlides.length < 5 && (
              <>
                <span className="w-2 h-2 bg-white/40 rounded-full" />
                <span className="w-2 h-2 bg-white/40 rounded-full" />
                <span className="w-2 h-2 bg-white/40 rounded-full" />
                <span className="w-2 h-2 bg-white/40 rounded-full" />
                <span className="w-2 h-2 bg-white/40 rounded-full" />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
