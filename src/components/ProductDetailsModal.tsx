import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Review } from '../types';
import { useStore } from '../context/StoreContext';
import {
  Star,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  ZoomIn,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Image as ImageIcon,
  PlayCircle,
  Flame,
  Bell,
  BellRing,
  AlertCircle,
  FileText,
  Maximize2,
  MessageSquareQuote,
  LayoutGrid,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ProductCard } from './ProductCard';
import { BundleSelector, RadioCardBundleSection, BannerTableOfferSection } from './BundleSelector';
import { FlavorSelector } from './FlavorSelector';
import { CustomerScreenshotCarousel } from './CustomerScreenshotCarousel';
import { getEffectiveBundles, calculateProductPrice } from '../lib/bundleUtils';
import { trackViewItem, trackAddToCart } from '../lib/dataLayer';

interface ProductDetailsModalProps {
  product: Product;
  onClose?: () => void;
}

const toBnNum = (n: number | string, padZero = false): string => {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const val = padZero ? String(n).padStart(2, '0') : String(n);
  return val
    .split('')
    .map((char) => {
      const parsed = parseInt(char, 10);
      return isNaN(parsed) ? char : (bn[parsed] ?? char);
    })
    .join('');
};

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product }) => {
  const {
    products,
    categories,
    setActiveClientPage,
    setSelectedProduct,
    setQuickOrderProduct,
    setIsQuickOrderOpen,
    setSelectedCategory
  } = useStore();

  const effectiveBundles = getEffectiveBundles(product);
  const defaultBundle = effectiveBundles.find((b) => b.isPopular) || effectiveBundles[0];

  const [selectedBundleId, setSelectedBundleId] = useState<string>(defaultBundle?.id || '');
  const [selectedImage, setSelectedImage] = useState<string>(product.thumbnail);
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0] : 'MINT'
  );
  const [quantity, setQuantity] = useState<number>(defaultBundle?.quantity || 1);
  const [selectedFlavors, setSelectedFlavors] = useState<{ [flavorName: string]: number }>({});

  // Calculate dynamic price and active bundle
  const priceResult = calculateProductPrice(product, quantity, selectedBundleId);
  const selectedBundle = priceResult.activeBundle;
  const displayPrice = priceResult.totalPrice;
  const displayOriginalPrice = priceResult.originalPrice;
  const activeBundleId = priceResult.activeBundleId;
  const totalPrice = displayPrice;

  // Sync state whenever product changes
  useEffect(() => {
    setSelectedImage(product.thumbnail || product.gallery?.[0] || '');
    setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : 'MINT');
    const eff = getEffectiveBundles(product);
    const def = eff.find((b) => b.isPopular) || eff[0];
    setSelectedBundleId(def?.id || '');
    const initialQty = def?.quantity || 1;
    setQuantity(initialQty);

    if (product.hasFlavors && product.flavors && product.flavors.length > 0) {
      const firstFlv = product.flavors[0]?.name || 'Grape';
      setSelectedFlavors({ [firstFlv]: initialQty });
    } else {
      setSelectedFlavors({});
    }

    // Track view_item event
    trackViewItem(product, def?.quantity || 1, product.colors && product.colors.length > 0 ? product.colors[0] : undefined);

    // Ensure page scrolls to top on product selection
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [product]);

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

  const [reviewSlideIdx, setReviewSlideIdx] = useState<number>(0);

  const reviewImagesList = (product.reviewImages && product.reviewImages.length > 0)
    ? product.reviewImages
    : [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&auto=format&fit=crop&q=80'
      ];

  // Hover Zoom State
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  // Reviews State
  const defaultReviewsList: Review[] = [
    {
      id: 'demo-rev-1',
      userName: 'Rahat Islam',
      userRole: 'CEO, AURORA TECH',
      rating: 5,
      comment: 'PixelCraft did an exceptional job rebuilding our marketing website and brand guides. Our conversion rate increased by 40% in the first month! Highly recommended.'
    },
    {
      id: 'demo-rev-2',
      userName: 'Nusrat Jahan',
      userRole: 'COURSE STUDENT',
      rating: 5,
      comment: 'The Web Development course is unbelievably structured. The manual bKash enrollment process was approved within 15 minutes, and I immediately got access to the Google Drive full of high-quality lessons. Best decision ever!'
    },
    {
      id: 'demo-rev-3',
      userName: 'Mahmudul Hasan',
      userRole: 'INDEPENDENT CONTENT CREATOR',
      rating: 5,
      comment: 'I bought their UI/UX secrets ebook. The design templates and spacing guidelines inside are gold. Totally worth every single taka!'
    },
    {
      id: 'demo-rev-4',
      userName: 'Tanvir Ahmed',
      userRole: 'VERIFIED BUYER',
      rating: 5,
      comment: 'কীনোমার্ট থেকে প্রোডাক্টটি অর্ডার করেছিলাম। প্রিমিয়াম কোয়ালিটি, আসল গ্যাজেট এবং অসাধারণ ফাস্ট সার্ভিস পেয়ে আমি খুবই সন্তুষ্ট!'
    }
  ];

  const activeReviewsList = (product.reviews && product.reviews.length > 0)
    ? product.reviews
    : defaultReviewsList;

  // Notify Me State for Out-of-Stock Products
  const [notifyContact, setNotifyContact] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);

  const isOutOfStock = product.stock <= 0 || product.status === 'INACTIVE';
  const isLowStock = !isOutOfStock && product.stock > 0 && product.stock <= 10;

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyContact.trim()) return;

    try {
      const existingStr = localStorage.getItem('stock_notifications');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.push({
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        contact: notifyContact.trim(),
        date: new Date().toISOString()
      });
      localStorage.setItem('stock_notifications', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setNotifySubmitted(true);
  };

  // Timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 1,
    hours: 23,
    minutes: 56,
    seconds: 43
  });

  useEffect(() => {
    const updateTime = () => {
      if (product.timerEndTime) {
        const target = new Date(product.timerEndTime).getTime();
        const now = new Date().getTime();
        const diff = Math.max(0, target - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateTime();

    const timer = setInterval(() => {
      if (product.timerEndTime) {
        updateTime();
      } else {
        setTimeLeft((prev) => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
          if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
          return prev;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [product.timerEndTime]);

  // Gallery list combining thumbnail and gallery array
  const allImages = Array.from(new Set([product.thumbnail, ...(product.gallery || [])]));
  const [currentThumbIdx, setCurrentThumbIdx] = useState<number>(0);

  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const unitPrice = product.discountPrice || product.price;
  const unitOriginalPrice = product.discountPrice ? product.price : null;

  // Variants list
  const variantList = (product.colors && Array.isArray(product.colors))
    ? product.colors.filter((c) => c && typeof c === 'string' && c.trim() !== '')
    : [];

  const hasShortDesc = Boolean(product.shortDescription && product.shortDescription.trim() !== '');
  const hasLongDesc = Boolean(product.longDescription && product.longDescription.trim() !== '');
  const hasDescription = hasShortDesc || hasLongDesc;

  const validSpecs = (product.specifications || []).filter(
    (s) => s && (s.key?.trim() || s.value?.trim())
  );
  const hasSpecs = validSpecs.length > 0;

  const validGallery = (product.gallery || []).filter(
    (img) => img && typeof img === 'string' && img.trim() !== ''
  );
  const hasGallery = validGallery.length > 0;

  const hasVideo = Boolean(product.videoUrl && product.videoUrl.trim() !== '');

  const productReviews = (product.reviews || []).filter(
    (r) => r && (r.userName?.trim() || r.comment?.trim())
  );
  const reviewScreenshots = (product.reviewImages || []).filter(
    (img) => img && typeof img === 'string' && img.trim() !== ''
  );
  const hasReviews = productReviews.length > 0 || reviewScreenshots.length > 0;

  const totalReviewsCount = productReviews.length > 0
    ? productReviews.length
    : (typeof product.reviewsCount === 'number' && product.reviewsCount > 0 ? product.reviewsCount : (productReviews.length > 0 ? productReviews.length : 1));

  const displayRating = productReviews.length > 0
    ? Number((productReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / productReviews.length).toFixed(1))
    : (product.rating || 5.0);

  const hasInfoContent = hasDescription || hasSpecs || hasGallery || hasVideo;
  const hasAnyDetails = hasInfoContent || hasReviews;

  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [reviewViewMode, setReviewViewMode] = useState<'slider' | 'grid'>('slider');
  const [expandedReviewImage, setExpandedReviewImage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentReviewIndex(0);
  }, [product.id]);

  useEffect(() => {
    if (productReviews.length <= 1 || reviewViewMode !== 'slider') return;
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % productReviews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [productReviews.length, reviewViewMode]);

  const handlePrevReview = () => {
    if (productReviews.length === 0) return;
    setCurrentReviewIndex((prev) => (prev - 1 + productReviews.length) % productReviews.length);
  };

  const handleNextReview = () => {
    if (productReviews.length === 0) return;
    setCurrentReviewIndex((prev) => (prev + 1) % productReviews.length);
  };

  // Handle order now
  const handleOrderNow = () => {
    const flavorSummary = Object.entries(selectedFlavors)
      .filter(([_, q]) => q > 0)
      .map(([name, q]) => `${name} (${q})`)
      .join(', ');

    trackAddToCart(product, quantity, flavorSummary || selectedColor);
    setQuickOrderProduct({
      ...product,
      colors: flavorSummary ? [flavorSummary] : [selectedColor]
    });
    setIsQuickOrderOpen(true);
  };

  // Helper to construct YouTube Embed URL safely
  const getEmbedUrl = (url?: string) => {
    if (!url) return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    if (url.includes('embed/')) return url;
    if (url.includes('watch?v=')) {
      const id = url.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  };

  const handlePrevThumb = () => {
    const nextIdx = (currentThumbIdx - 1 + allImages.length) % allImages.length;
    setCurrentThumbIdx(nextIdx);
    setSelectedImage(allImages[nextIdx]);
  };

  const handleNextThumb = () => {
    const nextIdx = (currentThumbIdx + 1) % allImages.length;
    setCurrentThumbIdx(nextIdx);
    setSelectedImage(allImages[nextIdx]);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-8 sm:pb-12 space-y-6 animate-fadeIn">
      {/* Category Sub Navigation Bar (Hidden on mobile) */}
      <div className="hidden lg:block bg-white border border-[#E8E3D9] rounded-2xl p-2.5 overflow-x-auto shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-bold whitespace-nowrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.name);
                setActiveClientPage('products');
              }}
              className={`px-3 py-1.5 rounded-full border transition-all ${
                product.category === cat.name
                  ? 'bg-[#5E6A45] text-white border-[#5E6A45]'
                  : 'bg-[#FAF8F5] text-[#2E3B2B] border-[#E8E3D9] hover:bg-[#EFECE6]'
              }`}
            >
              {cat.name}
            </button>
          ))}
          <button
            onClick={() => {
              setSelectedCategory(null);
              setActiveClientPage('products');
            }}
            className="px-3 py-1.5 rounded-full bg-[#1F241E] text-white border border-[#1F241E] hover:bg-black transition-all"
          >
            অল ক্যাটাগরি গ্যাজেট
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6B7264] px-1">
        <button onClick={() => setActiveClientPage('home')} className="hover:text-[#5E7A3B] font-semibold">
          হোম
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={() => {
            setSelectedCategory(product.category);
            setActiveClientPage('products');
          }}
          className="hover:text-[#5E7A3B] font-semibold"
        >
          {product.category || 'গ্যাজেট'}
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-extrabold text-[#1F241E] truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main Top Section Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 bg-white border border-[#E8E3D9] rounded-3xl p-4 sm:p-8 shadow-xs">
        {/* Left Column: Image Showcase & Gallery Slider */}
        <div className="space-y-4">
          <div
            className="relative aspect-square w-full bg-[#FFDC33] rounded-2xl overflow-hidden border border-[#E8E3D9] shadow-inner group cursor-crosshair"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-200 ease-out"
              style={{
                transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                transform: isHovered ? 'scale(2.4)' : 'scale(1)',
              }}
              referrerPolicy="no-referrer"
            />




          </div>

          {/* Thumbnail Slider Bar */}
          {allImages.length > 0 && (
            <div className="relative flex items-center gap-2 px-1">
              <button
                onClick={handlePrevThumb}
                className="p-2 rounded-full bg-[#FAF8F5] border border-[#E8E3D9] hover:bg-[#EFECE6] text-[#1F241E] shadow-2xs shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none w-full justify-center">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(img);
                      setCurrentThumbIdx(idx);
                    }}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                      selectedImage === img
                        ? 'border-[#5E6A45] ring-2 ring-[#5E6A45]/30 scale-105'
                        : 'border-[#E8E3D9] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextThumb}
                className="p-2 rounded-full bg-[#FAF8F5] border border-[#E8E3D9] hover:bg-[#EFECE6] text-[#1F241E] shadow-2xs shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Details & Ordering */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* Category & Stock Status Header */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#6B7264] uppercase tracking-wider">
                {product.category || 'স্মার্টওয়াচ'}
              </span>
              {isOutOfStock ? (
                <span className="bg-red-100 text-red-700 text-xs font-black px-3.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  আউট অব স্টক
                </span>
              ) : isLowStock ? (
                <span className="bg-[#D97706]/10 text-[#92400E] text-xs font-black px-3.5 py-1 rounded-full border border-[#D97706]/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                  লিমিটেড স্টক ({toBnNum(product.stock)} টি বাকি)
                </span>
              ) : (
                <span className="bg-[#627048]/12 text-[#3D472B] text-xs font-black px-3.5 py-1 rounded-full border border-[#627048]/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#627048] animate-pulse" />
                  ইন স্টক ({toBnNum(product.stock || 50)} টি এভেলেবল)
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F241E] leading-tight">
              {product.name}
            </h1>

            {/* Rating Stars & Reviews */}
            <div className="flex items-center gap-2 text-xs text-[#6B7264]">
              <div className="flex text-[#F59E0B]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(displayRating) ? 'fill-[#F59E0B]' : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="font-extrabold text-[#1F241E] text-sm">
                {displayRating.toFixed(1)}
              </span>
              <span className="text-gray-500 font-semibold">({toBnNum(totalReviewsCount)} টি রিভিউ)</span>
            </div>

            {/* Large Price Box */}
            <div className="bg-[#F4F4F5] rounded-2xl p-4 sm:p-5 border border-gray-200/60 flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-[#1F241E]">
                  ৳{displayPrice.toLocaleString('bn-BD')}
                </span>
                {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                  <span className="text-base sm:text-lg text-gray-400 line-through font-bold">
                    ৳{displayOriginalPrice.toLocaleString('bn-BD')}
                  </span>
                )}
              </div>
              {selectedBundle && (
                <span className="text-xs sm:text-sm font-extrabold bg-[#5E6A45]/15 text-[#5E6A45] px-3.5 py-1.5 rounded-xl border border-[#5E6A45]/20">
                  {selectedBundle.title}
                </span>
              )}
            </div>

            {/* Low Stock Alert Banner (Shows when stock <= 10) */}
            {isLowStock && (
              <div className="bg-[#FFFDF3] border border-[#FDE68A] rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] border border-[#FDE68A]/80 text-[#D97706] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-[#D97706]" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs sm:text-sm font-extrabold text-[#92400E] flex items-center gap-1">
                    <span>🔥</span>
                    <span>স্টক শেষ হওয়ার আগেই অর্ডার করুন! (Limited Stock)</span>
                  </div>
                  <div className="text-xs text-[#B45309] font-medium">
                    গুদামে আর মাত্র <strong className="font-black text-[#92400E]">{toBnNum(product.stock)} টি</strong> পিস রয়েছে।
                  </div>
                </div>
              </div>
            )}

            {/* Offer Countdown Banner (Shows only if enabled in Admin Panel) */}
            {Boolean(product.hasTimer) && (
              <div className="bg-[#FFF5F6] border border-[#FDE2E7] p-4 sm:p-5 rounded-3xl shadow-xs my-2">
                {/* Header Title with Exclamation Circle */}
                <div className="flex items-center justify-center gap-2 mb-3.5 sm:mb-4 text-center">
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#E60049] stroke-[2.5] shrink-0" />
                  <span className="font-black text-[#E60049] text-base sm:text-lg tracking-wide">
                    {product.timerTitle || 'অফারটি শেষ হবে:'}
                  </span>
                </div>

                {/* Countdown 4-Block Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 select-none">
                  {/* Days */}
                  <div className="w-14 sm:w-20 h-14 sm:h-20 bg-[#E60049] rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center shadow-md shadow-[#E60049]/20">
                    <span className="text-white font-black text-xl sm:text-2xl leading-none">
                      {toBnNum(timeLeft.days, true)}
                    </span>
                    <span className="text-white/95 text-[11px] sm:text-xs font-semibold mt-1 leading-tight">
                      দিন
                    </span>
                  </div>

                  <span className="text-[#E60049] font-black text-xl sm:text-2xl pb-1">
                    :
                  </span>

                  {/* Hours */}
                  <div className="w-14 sm:w-20 h-14 sm:h-20 bg-[#E60049] rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center shadow-md shadow-[#E60049]/20">
                    <span className="text-white font-black text-xl sm:text-2xl leading-none">
                      {toBnNum(timeLeft.hours, true)}
                    </span>
                    <span className="text-white/95 text-[11px] sm:text-xs font-semibold mt-1 leading-tight">
                      ঘণ্টা
                    </span>
                  </div>

                  <span className="text-[#E60049] font-black text-xl sm:text-2xl pb-1">
                    :
                  </span>

                  {/* Minutes */}
                  <div className="w-14 sm:w-20 h-14 sm:h-20 bg-[#E60049] rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center shadow-md shadow-[#E60049]/20">
                    <span className="text-white font-black text-xl sm:text-2xl leading-none">
                      {toBnNum(timeLeft.minutes, true)}
                    </span>
                    <span className="text-white/95 text-[11px] sm:text-xs font-semibold mt-1 leading-tight">
                      মিনিট
                    </span>
                  </div>

                  <span className="text-[#E60049] font-black text-xl sm:text-2xl pb-1">
                    :
                  </span>

                  {/* Seconds */}
                  <div className="w-14 sm:w-20 h-14 sm:h-20 bg-[#E60049] rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center shadow-md shadow-[#E60049]/20">
                    <span className="text-white font-black text-xl sm:text-2xl leading-none">
                      {toBnNum(timeLeft.seconds, true)}
                    </span>
                    <span className="text-white/95 text-[11px] sm:text-xs font-semibold mt-1 leading-tight">
                      সেকেন্ড
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Short Description Box */}
            {hasShortDesc && (
              <div className="bg-[#F4F4F5] rounded-2xl p-4 text-xs sm:text-sm text-[#374151] font-medium leading-relaxed border border-gray-200/50">
                {product.shortDescription}
              </div>
            )}

            {/* Flavor Selection Section (Matching Demo UI) */}
            {product.hasFlavors && product.flavors && product.flavors.length > 0 && (
              <div className="pt-1">
                <FlavorSelector
                  flavors={product.flavors}
                  title={product.flavorTitle || 'ফ্লেভার নির্বাচন করুন'}
                  selectedFlavors={selectedFlavors}
                  onChange={handleFlavorsChange}
                  toBnNum={toBnNum}
                />
              </div>
            )}

            {/* Color / Variant Selection (For products without flavors) */}
            {!product.hasFlavors && variantList.length > 0 && (
              <div className="space-y-2 pt-1">
                <label className="text-xs sm:text-sm font-extrabold text-[#1F241E] block">
                  কালার: <span className="text-[#5E6A45]">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {variantList.map((variant, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColor(variant)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer uppercase ${
                        selectedColor === variant
                          ? 'bg-[#5E6A45] text-white shadow-sm ring-2 ring-[#5E6A45]/40'
                          : 'bg-white border border-gray-300 text-[#1F241E] hover:bg-gray-100'
                      }`}
                    >
                      {variant}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Section: Notify Me (if out of stock) or Quantity + Order Button */}
            {isOutOfStock ? (
              <div id="notify-me-box" className="bg-[#FFFDF5] border border-[#E6DBBF] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs mt-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5E6A45]/15 text-[#5E6A45] flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5 text-[#5E6A45]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#1F241E] text-sm sm:text-base">
                      প্রোডাক্টটি আপাতত আউট অব স্টক!
                    </h3>
                    <p className="text-xs text-[#5D6656] font-medium mt-0.5">
                      স্টকে আসামাত্রই নোটিফিকেশন পেতে আপনার ইমেইল বা মোবাইল নম্বর দিন।
                    </p>
                  </div>
                </div>

                {notifySubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm p-3.5 rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>ধন্যবাদ! প্রোডাক্টটি স্টকে আসামাত্রই আপনাকে ইমেইল/মেসেজে নোটিফাই করা হবে।</span>
                  </div>
                ) : (
                  <form onSubmit={handleNotifySubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-[#1F241E] mb-1">
                        ইমেইল অথবা মোবাইল নম্বর <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={notifyContact}
                          onChange={(e) => setNotifyContact(e.target.value)}
                          placeholder="যেমন: 01700000000 বা email@example.com"
                          className="w-full bg-white border border-[#D5CEBF] rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1F241E] focus:outline-none focus:ring-2 focus:ring-[#5E6A45]/30 focus:border-[#5E6A45]"
                        />
                        <Bell className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#5E6A45] hover:bg-[#485333] active:scale-[0.98] text-white text-sm sm:text-base font-black py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <BellRing className="w-4.5 h-4.5 text-amber-300" />
                      <span>স্টকে ফিরলে জানান (Notify Me)</span>
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                {/* Bundle Deals Selector (Strictly respecting selected bundleStyle) */}
                {effectiveBundles && effectiveBundles.length > 0 && (
                  <div className="pt-2">
                    {product.bundleStyle === 'banner_table' ? (
                      <BannerTableOfferSection
                        bundles={effectiveBundles}
                        selectedBundleId={activeBundleId}
                        bannerTitle={product.bundleBannerTitle}
                        bannerSubtitle={product.bundleBannerSubtitle}
                        onSelectBundle={(b) => {
                          setSelectedBundleId(b.id);
                          setQuantity(b.quantity);
                        }}
                      />
                    ) : (
                      <RadioCardBundleSection
                        bundles={effectiveBundles}
                        selectedBundleId={activeBundleId}
                        onSelectBundle={(b) => {
                          setSelectedBundleId(b.id);
                          setQuantity(b.quantity);
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Quantity Selector & Total Price matching demo image */}
                <div className="space-y-1.5 pt-2 pb-1">
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
                        {toBnNum(quantity)}
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
                        ৳{displayPrice.toLocaleString('bn-BD')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Order Button */}
                <button
                  onClick={handleOrderNow}
                  className="relative overflow-hidden w-full bg-[#485539] hover:bg-[#3C472E] active:scale-[0.98] text-white text-base sm:text-lg font-black py-3.5 sm:py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-[#485539]/30 border border-[#586847] transition-all cursor-pointer mt-2 animate-order-btn"
                >
                  {/* Shimmer Light Bar */}
                  <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-order-shimmer" />

                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-[#FACC15] text-[#FACC15] animate-zap-pop shrink-0" />
                  <span className="relative z-10 tracking-wide font-extrabold text-white">অর্ডার করুন</span>
                </button>
              </>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-[#F4F4F5] p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#374151]">
                <Truck className="w-4 h-4 text-[#5E6A45] shrink-0" />
                <span>১-৩ দিনে হোম ডেলিভারি</span>
              </div>
              <div className="bg-[#F4F4F5] p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#374151]">
                <ShieldCheck className="w-4 h-4 text-[#5E6A45] shrink-0" />
                <span>ক্যাশ অন ডেলিভারি</span>
              </div>
              <div className="bg-[#F4F4F5] p-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-[#374151]">
                <RotateCcw className="w-4 h-4 text-[#5E6A45] shrink-0" />
                <span>৭ দিনের সহজ রিটার্ন</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Special Discount Offer Banner Table (Only in 'both' mode where both radio cards and lower banner table are shown) */}
      {effectiveBundles && effectiveBundles.length > 0 && !isOutOfStock && product.bundleStyle === 'both' && (
        <div className="w-full">
          <BannerTableOfferSection
            bundles={effectiveBundles}
            selectedBundleId={selectedBundleId}
            bannerTitle={product.bundleBannerTitle}
            bannerSubtitle={product.bundleBannerSubtitle}
            onSelectBundle={(b) => {
              setSelectedBundleId(b.id);
              setQuantity(b.quantity);
            }}
          />
        </div>
      )}

      {/* Customer Reviews & Ratings Section (Rendered Above Product Details) */}
      {hasReviews && (
        <div className="bg-white border border-[#E8E3D9] rounded-3xl p-4 sm:p-8 shadow-xs space-y-5">
          {/* Section Title & Rating Summary & View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E3D9] pb-4">
            <div>
              <h3 className="font-black text-[#1F241E] text-base sm:text-lg flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-[#5E6A45]" />
                <span>কাস্টমার রিভিউ ও ফিডব্যাক ({toBnNum(totalReviewsCount)})</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 font-medium">
                আমাদের সম্মানিত ক্রেতাদের বাস্তব অভিজ্ঞতা ও মতামত
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#E8E3D9] px-3 py-1.5 rounded-full text-xs font-bold text-[#1F241E]">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span>{displayRating.toFixed(1)} / 5.0</span>
              </div>

              {/* View Switcher if multiple reviews */}
              {productReviews.length > 1 && (
                <div className="flex items-center bg-[#FAF8F5] p-1 border border-[#E8E3D9] rounded-full text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setReviewViewMode('slider')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      reviewViewMode === 'slider'
                        ? 'bg-[#5E6A45] text-white shadow-xs'
                        : 'text-gray-600 hover:text-[#1F241E]'
                    }`}
                    title="স্লাইডার ভিউ"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">স্লাইডার</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewViewMode('grid')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      reviewViewMode === 'grid'
                        ? 'bg-[#5E6A45] text-white shadow-xs'
                        : 'text-gray-600 hover:text-[#1F241E]'
                    }`}
                    title="সকল রিভিউ একসাথে দেখুন"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>সকল রিভিউ ({toBnNum(productReviews.length)})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SLIDER VIEW MODE */}
          {reviewViewMode === 'slider' && productReviews.length > 0 && (
            <div className="relative bg-gradient-to-br from-[#FAF8F5] via-white to-[#F5F2EC] border border-[#E8E3D9] rounded-3xl p-4 sm:p-7 shadow-xs overflow-hidden">
              {/* Top counter for slider */}
              {productReviews.length > 1 && (
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-gray-500 px-2">
                  <span className="bg-white/80 border border-[#E8E3D9] px-2.5 py-0.5 rounded-full text-[11px] text-[#5E6A45]">
                    রিভিউ {toBnNum((currentReviewIndex % productReviews.length) + 1)} / {toBnNum(productReviews.length)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReviewViewMode('grid')}
                    className="text-[#5E6A45] hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                  >
                    সবগুলো একসাথে দেখুন
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Left Navigation Arrow */}
              {productReviews.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevReview}
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-[#5E6A45] hover:text-white text-[#1F241E] border border-[#E8E3D9] p-2 sm:p-2.5 rounded-full shadow-md transition-all active:scale-90 cursor-pointer"
                  aria-label="Previous Review"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 h-5" />
                </button>
              )}

              {/* Right Navigation Arrow */}
              {productReviews.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextReview}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-[#5E6A45] hover:text-white text-[#1F241E] border border-[#E8E3D9] p-2 sm:p-2.5 rounded-full shadow-md transition-all active:scale-90 cursor-pointer"
                  aria-label="Next Review"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 h-5" />
                </button>
              )}

              {/* Slide Content with Animation */}
              <div className="px-5 sm:px-10">
                <AnimatePresence mode="wait">
                  {(() => {
                    const activeRev = productReviews[currentReviewIndex % productReviews.length];
                    if (!activeRev) return null;

                    return (
                      <motion.div
                        key={`rev-card-${activeRev.id || currentReviewIndex}`}
                        initial={{ opacity: 0, x: 25 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -25 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="flex flex-col sm:flex-row gap-5 sm:gap-6 items-center sm:items-start"
                      >
                        {/* 1:1 Customer Image if present */}
                        {activeRev.image && (
                          <div className="shrink-0 relative group">
                            <div className="w-32 sm:w-40 md:w-44 aspect-square rounded-2xl overflow-hidden border-2 border-[#5E6A45]/30 bg-black/5 shadow-md">
                              <img
                                src={activeRev.image}
                                alt={activeRev.userName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setExpandedReviewImage(activeRev.image!)}
                              className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg text-xs opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1 shadow-md"
                              title="বড় করে দেখুন"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Review Details */}
                        <div className="flex-1 space-y-3 text-center sm:text-left">
                          {/* Rating Stars & Verified Badge */}
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <div className="flex items-center text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${s <= (activeRev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            {activeRev.isVerifiedPurchase !== false && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>ভেরিফাইড ক্রেতা</span>
                              </span>
                            )}
                          </div>

                          {/* Comment Quote */}
                          <blockquote className="text-xs sm:text-sm text-[#2C3328] font-semibold leading-relaxed italic relative">
                            "{activeRev.comment}"
                          </blockquote>

                          {/* Customer Info & Date */}
                          <div className="pt-2 border-t border-[#E8E3D9]/80 flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs">
                            <div>
                              <span className="font-extrabold text-[#1F241E] block text-sm">{activeRev.userName}</span>
                              {activeRev.userRole && (
                                <span className="text-[11px] text-[#5E6A45] font-medium">{activeRev.userRole}</span>
                              )}
                            </div>
                            {activeRev.date && (
                              <span className="text-[11px] text-[#6B7264] font-medium">{activeRev.date}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>

              {/* Dots Indicator */}
              {productReviews.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-4">
                  {productReviews.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentReviewIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === (currentReviewIndex % productReviews.length)
                          ? 'w-6 bg-[#5E6A45]'
                          : 'w-2 bg-[#D3CDC0] hover:bg-[#A39C8E]'
                      }`}
                      aria-label={`Go to review ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ALL REVIEWS GRID VIEW MODE */}
          {reviewViewMode === 'grid' && productReviews.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {productReviews.map((rev, idx) => (
                  <div
                    key={rev.id || idx}
                    className="bg-[#FAF8F5] border border-[#E8E3D9] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 hover:shadow-sm transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        {rev.isVerifiedPurchase !== false && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>ভেরিফাইড</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-[#2C3328] font-medium leading-relaxed italic">
                        "{rev.comment}"
                      </p>

                      {rev.image && (
                        <div className="pt-1">
                          <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#E8E3D9] relative group">
                            <img
                              src={rev.image}
                              alt={rev.userName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setExpandedReviewImage(rev.image!)}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-[#E8E3D9] flex items-center justify-between text-xs text-gray-500">
                      <div>
                        <span className="font-bold text-[#1F241E] block">{rev.userName}</span>
                        {rev.userRole && (
                          <span className="text-[10px] text-[#5E6A45] font-medium">{rev.userRole}</span>
                        )}
                      </div>
                      {rev.date && (
                        <span className="text-[10px] text-gray-400">{rev.date}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setReviewViewMode('slider')}
                  className="text-xs font-bold text-[#5E6A45] bg-[#FAF8F5] border border-[#E8E3D9] px-4 py-2 rounded-xl hover:bg-white transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>স্লাইডার আকারে দেখুন</span>
                </button>
              </div>
            </div>
          )}

          {/* Review Screenshot Images Gallery / Carousel Slideshow (from customer chat/messages) */}
          {reviewScreenshots.length > 0 && (
            <div className="pt-4 border-t border-[#E8E3D9]">
              <CustomerScreenshotCarousel
                images={reviewScreenshots}
                toBnNum={toBnNum}
              />
            </div>
          )}
        </div>
      )}

      {/* Product Details Tabs Container */}
      {hasInfoContent && (
        <div className="bg-white border border-[#E8E3D9] rounded-3xl p-4 sm:p-8 shadow-xs space-y-6">
          {/* Section Header */}
          <div className="border-b border-[#E8E3D9] pb-3">
            <h2 className="text-base sm:text-xl font-black text-[#1F241E] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#5E6A45]" />
              <span>প্রোডাক্টের বিস্তারিত তথ্য ও বিবরণ</span>
            </h2>
          </div>

          {/* Details Content */}
          <div className="space-y-8">
            {/* Main Description Text */}
            {hasDescription && (
              <div className="text-xs sm:text-sm text-[#3D4738] leading-relaxed whitespace-pre-line font-medium space-y-2">
                {hasShortDesc && <p>{product.shortDescription}</p>}
                {hasLongDesc && <p>{product.longDescription}</p>}
              </div>
            )}

            {/* Specifications Section */}
            {hasSpecs && (
              <div className="space-y-4 border-t border-[#E8E3D9] pt-6">
                <h3 className="font-black text-[#1F241E] text-base sm:text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#5E6A45]" />
                  <span>স্পেসিফিকেশন (Specifications)</span>
                </h3>

                <div className="border border-[#E8E3D9] rounded-2xl overflow-hidden divide-y divide-[#E8E3D9]">
                  {validSpecs.map((spec, i) => (
                    <div key={i} className="flex p-3 sm:p-4 text-xs sm:text-sm bg-white">
                      <span className="w-1/3 font-black text-[#1F241E]">{spec.key}</span>
                      <span className="w-2/3 text-[#4A5343] font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Video Review / Demo Frame */}
            {hasVideo && (
              <div className="space-y-4 border-t border-[#E8E3D9] pt-6">
                <h3 className="font-black text-[#1F241E] text-base sm:text-lg flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-red-600" />
                  <span>প্রোডাক্টের ভিডিও রিভিউ / ডেমো</span>
                </h3>

                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-[#E8E3D9] bg-black shadow-md">
                  <iframe
                    src={getEmbedUrl(product.videoUrl)}
                    title="Product Video Review"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Real Product Gallery Posters / Photos */}
            {hasGallery && (
              <div className="space-y-4 border-t border-[#E8E3D9] pt-6">
                <h3 className="font-black text-[#1F241E] text-base sm:text-lg flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#5E6A45]" />
                  <span>প্রোডাক্টের বাস্তব ছবিসমূহ (গ্যালারি)</span>
                </h3>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:gap-6 items-start">
                  {validGallery.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-full rounded-xl sm:rounded-2xl overflow-hidden border border-[#E8E3D9] bg-[#FAF8F5] shadow-xs"
                    >
                      <img
                        src={img}
                        alt={`Product Photo ${idx + 1}`}
                        className="w-full h-auto object-contain block mx-auto"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded Review & Gallery Image Modal / Lightbox */}
      {expandedReviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setExpandedReviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] w-full flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setExpandedReviewImage(null)}
              className="absolute -top-12 right-0 sm:top-2 sm:right-2 z-20 bg-black/70 hover:bg-black text-white p-2.5 rounded-full cursor-pointer transition-all shadow-lg border border-white/20"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full max-h-[85vh] overflow-auto flex items-center justify-center rounded-2xl p-1 bg-black/40 border border-white/10 shadow-2xl">
              <img
                src={expandedReviewImage}
                alt="Product Photo Full View"
                className="max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}

      {/* High-Converting CTA Banner matching KinoMart Theme and Demo Design */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F241E] via-[#283123] to-[#121611] p-8 sm:p-12 text-center text-white shadow-2xl border border-[#3E4935]/60 my-8">
        {/* Ambient Subtle Glows */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#5E6A45]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto space-y-3.5">
          {/* Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-sm">
            আজই অর্ডার করুন!
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm md:text-base text-gray-300/90 font-medium leading-relaxed">
            সীমিত স্টক — দেরি না করে এখনই নিশ্চিত করুন আপনার অর্ডার
          </p>

          {/* Golden Order Button */}
          <div className="pt-4">
            {isOutOfStock ? (
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('notify-me-box');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D4A359] to-[#C29248] hover:from-[#C29248] hover:to-[#B08137] text-[#1F241E] font-black text-sm sm:text-base py-3.5 px-8 rounded-2xl shadow-xl shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <BellRing className="w-5 h-5 text-[#1F241E]" />
                <span>স্টকে ফিরলে জানান (Notify Me)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOrderNow}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#D4A359] via-[#EAB308] to-[#C29248] hover:from-[#EAB308] hover:to-[#D4A359] text-[#1F241E] font-black text-base sm:text-lg py-4 px-10 sm:px-14 rounded-2xl sm:rounded-3xl shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-amber-300/40 group"
              >
                <span>৳{totalPrice.toLocaleString('bn-BD')} — এখনই কিনুন</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
