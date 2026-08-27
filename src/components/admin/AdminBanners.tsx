import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { HeroSlide, PromoBannerConfig } from '../../types';
import { processImageForPlaceholder, processAndUploadImage } from '../../lib/imageUtils';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Upload,
  Link,
  Sparkles,
  Check,
  RefreshCw,
  Palette,
  Megaphone,
  Layers,
  Flame,
  ArrowRight,
  Clock,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

const PRESET_BANNER_IMAGES = [
  {
    name: 'Tech Gadgets Yellow Banner',
    url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1600&auto=format&fit=crop&q=85',
    title: 'প্রিমিয়াম স্মার্ট গ্যাজেটস ও এক্সেসরিজ',
    subtitle: 'সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি'
  },
  {
    name: 'Wireless Earbuds Dark Green Banner',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=1600&auto=format&fit=crop&q=85',
    title: 'লেটেস্ট ট্রু ওয়্যারলেস ইয়ারবাডস কালেকশন',
    subtitle: 'অরিজিনাল সাউন্ড ও অ্যাক্টিভ নয়েজ ক্যান্সেলেশন'
  },
  {
    name: 'Smartwatch Lifestyle Banner',
    url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1600&auto=format&fit=crop&q=85',
    title: 'স্মার্ট লাইফস্টাইল ও ফিটনেস ট্র্যাকার',
    subtitle: 'সেরা ব্র্যান্ডের অফিসিয়াল গ্যাজেট'
  },
  {
    name: 'Essential Oil Nasal Inhaler Banner',
    url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1600&auto=format&fit=crop&q=85',
    title: 'Energy Booster Essential Oil Nasal Inhaler',
    subtitle: 'ইনস্ট্যান্ট এনার্জি ও রিফ্রেশিং ফ্লেভার ফিল'
  },
  {
    name: 'Gaming Headset Banner',
    url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1600&auto=format&fit=crop&q=85',
    title: 'গেমিং হেডসেট ও অ্যাকোস্টিক অডিও',
    subtitle: 'আল্ট্রা লো লেটেন্সি ও ক্লিয়ার মাইক্রোফোন'
  }
];

const PRESET_BG_COLORS = [
  { name: 'Forest Green (Default)', hex: '#434F33' },
  { name: 'Deep Navy', hex: '#0F172A' },
  { name: 'Royal Blue', hex: '#1E3A8A' },
  { name: 'Warm Amber', hex: '#78350F' },
  { name: 'Crimson Wine', hex: '#881337' },
  { name: 'Emerald', hex: '#064E3B' },
  { name: 'Charcoal Dark', hex: '#18181B' }
];

export const AdminBanners: React.FC = () => {
  const {
    heroSlides,
    promoBanner,
    categories,
    settings,
    saveHeroSlide,
    deleteHeroSlide,
    reorderHeroSlides,
    resetHeroSlides,
    savePromoBanner,
    saveSettings
  } = useStore();

  const slides = Array.isArray(heroSlides) ? heroSlides : [];
  const promo = promoBanner || {
    isEnabled: false,
    badgeText: '',
    title: '',
    subtitle: '',
    buttonText: 'অফারটি দেখুন',
    linkType: 'all_products',
    bgColor: '#434F33'
  };

  // Slide Edit / Modal State
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Promo Banner Local Edit State
  const [promoForm, setPromoForm] = useState<PromoBannerConfig>(promo);
  const [isPromoSaved, setIsPromoSaved] = useState(false);

  // Top Announcement Bar State
  const [topBannerText, setTopBannerText] = useState(settings.topBannerText || '');
  const [topBannerEnabled, setTopBannerEnabled] = useState(settings.topBannerEnabled ?? true);
  const [sliderInterval, setSliderInterval] = useState(settings.heroSliderInterval || 5000);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Open modal to add new slide
  const handleAddNewSlide = () => {
    setEditingSlide({
      id: `slide-${Date.now()}`,
      image: '',
      title: '',
      subtitle: '',
      linkType: 'all_products',
      linkValue: '',
      isActive: true,
      order: slides.length + 1
    });
    setIsSlideModalOpen(true);
  };

  // Open modal to edit existing slide
  const handleEditSlide = (slide: HeroSlide) => {
    setEditingSlide({ ...slide });
    setIsSlideModalOpen(true);
  };

  // Handle image upload from file
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const processed = await processAndUploadImage(file, 'banner', 'banners');
      setEditingSlide(prev => prev ? { ...prev, image: processed } : null);
      showToast('ব্যানার ছবি সফলভাবে প্রসেস ও আপলোড হয়েছে!');
    } catch (err) {
      console.error(err);
      alert('ছবি প্রসেসিং করতে সমস্যা হয়েছে।');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Save Slide
  const handleSaveSlideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide || !editingSlide.image) {
      alert('দয়া করে ব্যানারের ছবি আপলোড করুন বা ইমেজ লিংক দিন।');
      return;
    }

    const slideToSave: HeroSlide = {
      id: editingSlide.id || `slide-${Date.now()}`,
      image: editingSlide.image,
      title: editingSlide.title || '',
      subtitle: editingSlide.subtitle || '',
      linkType: editingSlide.linkType || 'all_products',
      linkValue: editingSlide.linkValue || '',
      isActive: editingSlide.isActive !== false,
      order: editingSlide.order || slides.length + 1
    };

    saveHeroSlide(slideToSave);
    setIsSlideModalOpen(false);
    setEditingSlide(null);
    showToast('ব্যানার স্লাইড সফলভাবে সংরক্ষণ করা হয়েছে!');
  };

  // Delete Slide
  const handleDeleteSlide = (id: string | number) => {
    if (slides.length <= 1) {
      alert('কমপক্ষে একটি স্লাইড থাকা আবশ্যক।');
      return;
    }
    if (confirm('আপনি কি নিশ্চিত যে এই ব্যানারটি মুছে ফেলতে চান?')) {
      deleteHeroSlide(id);
      showToast('ব্যানার স্লাইড মুছে ফেলা হয়েছে।');
    }
  };

  // Toggle Slide Active Status
  const handleToggleSlideActive = (slide: HeroSlide) => {
    saveHeroSlide({ ...slide, isActive: !slide.isActive });
    showToast(slide.isActive ? 'ব্যানার নিষ্ক্রিয় করা হয়েছে।' : 'ব্যানার সক্রিয় করা হয়েছে।');
  };

  // Move Slide Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[index - 1];
    newSlides[index - 1] = temp;
    reorderHeroSlides(newSlides);
  };

  // Move Slide Down
  const handleMoveDown = (index: number) => {
    if (index === slides.length - 1) return;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[index + 1];
    newSlides[index + 1] = temp;
    reorderHeroSlides(newSlides);
  };

  // Save Promo Banner Config
  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    savePromoBanner(promoForm);
    setIsPromoSaved(true);
    setTimeout(() => setIsPromoSaved(false), 2500);
    showToast('প্রোমো ব্যানার সফলভাবে আপডেট হয়েছে!');
  };

  // Save Top Announcement & Slider Interval Settings
  const handleSaveGeneralBannerSettings = () => {
    saveSettings({
      ...settings,
      topBannerText,
      topBannerEnabled,
      heroSliderInterval: Number(sliderInterval)
    });
    showToast('ঘোষণা বার ও স্লাইডার স্পিড সেটিংস সংরক্ষণ করা হয়েছে!');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0D9488] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-bold animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Header & Quick Stats */}
      <div className="bg-[#1E2230] border border-[#2D3348] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FFC107]/10 text-[#FFC107] rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">ব্যানার ও স্লাইডার ম্যানেজমেন্ট</h1>
              <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                ওয়েবসাইটের হোমপেজের হিরো স্লাইডার, মাঝের প্রোমো ব্যানার এবং টপ নোটিশ পরিবর্তন করুন
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              if (confirm('সকল ব্যানারকে কি খালি / রিসেট করতে চান?')) {
                resetHeroSlides();
                savePromoBanner({
                  isEnabled: false,
                  badgeText: '',
                  title: '',
                  subtitle: '',
                  buttonText: 'অফারটি দেখুন',
                  linkType: 'all_products',
                  bgColor: '#434F33'
                });
                showToast('ব্যানারসমূহ রিসেট করা হয়েছে।');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-[#222736] hover:bg-[#2D3348] text-[#94A3B8] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-[#2D3348]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ডিফল্ট রিসেট</span>
          </button>

          <button
            onClick={handleAddNewSlide}
            className="px-4 py-2 rounded-xl bg-[#FFC107] hover:bg-[#FFB300] text-black text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন স্লাইড যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: HERO SLIDER MANAGEMENT */}
      <div className="bg-[#1E2230] border border-[#2D3348] rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D3348] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#FFC107]" />
              <span>হোমপেজ হিরো স্লাইডার ব্যানার ({slides.length} টি)</span>
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              স্লাইডার ব্যানারের ছবি, টেক্সট, ক্লিক করলে কোন পেজে যাবে তা নির্ধারণ করুন
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8]">অটো স্লাইড স্পিড:</span>
            <select
              value={sliderInterval}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSliderInterval(val);
                saveSettings({ ...settings, heroSliderInterval: val });
                showToast('স্লাইডার স্পিড পরিবর্তন করা হয়েছে!');
              }}
              className="bg-[#151824] border border-[#2D3348] text-white text-xs rounded-lg px-2.5 py-1.5 font-medium focus:border-[#FFC107] outline-hidden cursor-pointer"
            >
              <option value={3000}>৩ সেকেন্ড (Fast)</option>
              <option value={5000}>৫ সেকেন্ড (Default)</option>
              <option value={7000}>৭ সেকেন্ড</option>
              <option value={10000}>১০ সেকেন্ড (Slow)</option>
            </select>
          </div>
        </div>

        {/* Slides Grid / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`bg-[#151824] border rounded-xl overflow-hidden transition-all flex flex-col ${
                slide.isActive !== false ? 'border-[#2D3348] hover:border-[#FFC107]/50' : 'border-red-900/40 opacity-75'
              }`}
            >
              {/* Image Preview */}
              <div className="relative h-44 sm:h-52 w-full bg-[#222736] overflow-hidden group">
                <img
                  src={slide.image}
                  alt={slide.title || 'Slide'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />

                {/* Badge Overlay */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span className="bg-black/70 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md border border-white/10">
                    #{index + 1} স্লাইড
                  </span>
                  {slide.isActive !== false ? (
                    <span className="bg-[#10B981]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Eye className="w-3 h-3" /> সক্রিয়
                    </span>
                  ) : (
                    <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <EyeOff className="w-3 h-3" /> বন্ধ
                    </span>
                  )}
                </div>

                {/* Quick Action Overlay */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-xs p-1 rounded-lg border border-white/10">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    className="p-1 text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:hover:text-[#94A3B8] cursor-pointer"
                    title="উপরে নিন"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === slides.length - 1}
                    onClick={() => handleMoveDown(index)}
                    className="p-1 text-[#94A3B8] hover:text-white disabled:opacity-30 disabled:hover:text-[#94A3B8] cursor-pointer"
                    title="নিচে নিন"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-white line-clamp-1">
                    {slide.title || 'শিরোনাম নেই (কাস্টম ব্যানার)'}
                  </h3>
                  {slide.subtitle && (
                    <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-1">{slide.subtitle}</p>
                  )}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#CBD5E1]">
                    <Link className="w-3 h-3 text-[#FFC107]" />
                    <span>গন্তব্য:</span>
                    <span className="font-semibold text-[#FFC107]">
                      {slide.linkType === 'all_products' || !slide.linkType
                        ? 'সব প্রোডাক্ট পেজ'
                        : slide.linkType === 'category'
                        ? `ক্যাটাগরি: ${categories.find(c => c.id === slide.linkValue)?.name || slide.linkValue}`
                        : `কাস্টম লিংক: ${slide.linkValue}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#222736]">
                  <button
                    onClick={() => handleToggleSlideActive(slide)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                      slide.isActive !== false
                        ? 'bg-[#222736] text-[#94A3B8] hover:text-white hover:bg-[#2D3348]'
                        : 'bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/30'
                    }`}
                  >
                    {slide.isActive !== false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{slide.isActive !== false ? 'হাইড করুন' : 'সক্রিয় করুন'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSlide(slide)}
                      className="px-3 py-1.5 rounded-lg bg-[#2563EB]/20 hover:bg-[#2563EB] text-[#60A5FA] hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>এডিট</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white transition-all cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: PROMO BANNER CUSTOMIZER */}
      <div className="bg-[#1E2230] border border-[#2D3348] rounded-2xl p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D3348] pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#FF6B35]" />
              <span>মাঝের প্রোমো ব্যানার (Promo Banner Section)</span>
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              হোমপেজের গ্যাজেট সেকশনের মাঝে থাকা আকর্ষণীয় প্রোমোশনাল ব্যানারটি কাস্টমাইজ করুন
            </p>
          </div>

          {/* Active Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-bold text-white">ব্যানার চালু রাখুন</span>
            <input
              type="checkbox"
              checked={promoForm.isEnabled !== false}
              onChange={(e) => setPromoForm(prev => ({ ...prev, isEnabled: e.target.checked }))}
              className="w-4 h-4 accent-[#FFC107] rounded cursor-pointer"
            />
          </label>
        </div>

        <form onSubmit={handleSavePromo} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Badge Text */}
            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                টপ ব্যাজ টেক্সট (Badge Text)
              </label>
              <input
                type="text"
                value={promoForm.badgeText || ''}
                onChange={(e) => setPromoForm(prev => ({ ...prev, badgeText: e.target.value }))}
                placeholder="যেমন: লিমিটেড টাইম ধামাকা অফার"
                className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-hidden"
              />
            </div>

            {/* Button CTA Text */}
            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                বাটন টেক্সট (CTA Button Text)
              </label>
              <input
                type="text"
                value={promoForm.buttonText || ''}
                onChange={(e) => setPromoForm(prev => ({ ...prev, buttonText: e.target.value }))}
                placeholder="যেমন: অফারটি লুফে নিন"
                className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-hidden"
              />
            </div>

            {/* Headline Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                ব্যানার মূল শিরোনাম (Main Headline Title) *
              </label>
              <input
                type="text"
                required
                value={promoForm.title || ''}
                onChange={(e) => setPromoForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="যেমন: আজকের যেকোনো ২ টি গ্যাজেট অর্ডারে সম্পূর্ণ ফ্রি সারা দেশ ডেলিভারি!"
                className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-hidden font-bold"
              />
            </div>

            {/* Subtitle */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                সাবটাইটেল বা অফারের বিস্তারিত (Subtitle / Description)
              </label>
              <textarea
                rows={2}
                value={promoForm.subtitle || ''}
                onChange={(e) => setPromoForm(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="যেমন: আপনার পছন্দের ইয়ারবাডস, স্মার্টওয়াচ বা পাওয়ার ব্যাংক এখনই অর্ডার করুন। স্টক সীমিত!"
                className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2 outline-hidden resize-none"
              />
            </div>

            {/* Destination Link */}
            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                ক্লিক করলে কোথায় যাবে (Action Target)
              </label>
              <select
                value={promoForm.linkType || 'all_products'}
                onChange={(e) => setPromoForm(prev => ({ ...prev, linkType: e.target.value as any }))}
                className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-hidden cursor-pointer"
              >
                <option value="all_products">সকল প্রোডাক্টস পেজ (All Products)</option>
                <option value="category">নির্দিষ্ট ক্যাটাগরি পেজ</option>
                <option value="custom_url">কাস্টম লিংক বা ওয়েবসাইটের লিঙ্ক</option>
              </select>
            </div>

            {/* Specific Category or URL */}
            {promoForm.linkType === 'category' ? (
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                  টার্গেট ক্যাটাগরি বেছে নিন
                </label>
                <select
                  value={promoForm.linkValue || ''}
                  onChange={(e) => setPromoForm(prev => ({ ...prev, linkValue: e.target.value }))}
                  className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-hidden cursor-pointer"
                >
                  <option value="">ক্যাটাগরি সিলেক্ট করুন...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : promoForm.linkType === 'custom_url' ? (
              <div>
                <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                  কাস্টম লিঙ্ক (URL)
                </label>
                <input
                  type="text"
                  value={promoForm.linkValue || ''}
                  onChange={(e) => setPromoForm(prev => ({ ...prev, linkValue: e.target.value }))}
                  placeholder="যেমন: https://yourdomain.com/special-deal"
                  className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-hidden"
                />
              </div>
            ) : (
              <div />
            )}

            {/* Background Color Palette */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#CBD5E1] mb-2 flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-[#FFC107]" />
                <span>ব্যানারের ব্যাকগ্রাউন্ড কালার (Background Theme Color)</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {PRESET_BG_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => setPromoForm(prev => ({ ...prev, bgColor: col.hex }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      promoForm.bgColor === col.hex
                        ? 'border-white text-white shadow-md scale-105'
                        : 'border-[#2D3348] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: col.hex }} />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={promoForm.bgColor || '#434F33'}
                  onChange={(e) => setPromoForm(prev => ({ ...prev, bgColor: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-[#2D3348] cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={promoForm.bgColor || '#434F33'}
                  onChange={(e) => setPromoForm(prev => ({ ...prev, bgColor: e.target.value }))}
                  className="w-32 bg-[#151824] border border-[#2D3348] text-white text-xs rounded-lg px-3 py-2 uppercase font-mono"
                />
              </div>
            </div>

            {/* Background Image (Optional) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                ঐচ্ছিক ব্যাকগ্রাউন্ড ইমেজ (Optional Background Image URL)
              </label>
              <input
                type="text"
                value={promoForm.bgImageUrl || ''}
                onChange={(e) => setPromoForm(prev => ({ ...prev, bgImageUrl: e.target.value }))}
                placeholder="যেমন: https://images.unsplash.com/photo-..."
                className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-hidden"
              />
            </div>
          </div>

          {/* Live Preview of Promo Banner */}
          <div>
            <label className="block text-xs font-bold text-[#CBD5E1] mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#FFC107]" />
              <span>হোমপেজ লাইভ প্রিভিউ (Live Preview):</span>
            </label>
            <div
              className="text-white rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden flex flex-col items-start gap-3 transition-all"
              style={{
                backgroundColor: promoForm.bgColor || '#434F33',
                backgroundImage: promoForm.bgImageUrl ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${promoForm.bgImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {promoForm.badgeText && (
                <div className="inline-flex items-center gap-1.5 bg-[#FF6B35] text-white text-[11px] font-black px-3.5 py-1 rounded-full shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                  <span>{promoForm.badgeText}</span>
                </div>
              )}

              <h3 className="text-lg sm:text-2xl font-extrabold max-w-2xl leading-tight">
                {promoForm.title || 'ব্যানার শিরোনাম'}
              </h3>

              {promoForm.subtitle && (
                <p className="text-xs sm:text-sm text-amber-100 font-medium max-w-xl">
                  {promoForm.subtitle}
                </p>
              )}

              <div className="mt-1 bg-white text-[#2E3B2B] text-xs font-extrabold py-2.5 px-5 rounded-full flex items-center gap-2 shadow-md">
                <span>{promoForm.buttonText || 'অফারটি লুফে নিন'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{isPromoSaved ? 'সংরক্ষিত হয়েছে!' : 'প্রোমো ব্যানার সেভ করুন'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: TOP ANNOUNCEMENT NOTICE BAR */}
      <div className="bg-[#1E2230] border border-[#2D3348] rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2D3348] pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#FFC107]" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              ওয়েবসাইটের একদম উপরের ঘোষণা বার (Top Announcement Bar)
            </h2>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-bold text-white">চালু রাখুন</span>
            <input
              type="checkbox"
              checked={topBannerEnabled}
              onChange={(e) => setTopBannerEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#FFC107] rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-[#CBD5E1]">
            ঘোষণা মেসেজ টেক্সট (Announcement Message)
          </label>
          <input
            type="text"
            value={topBannerText}
            onChange={(e) => setTopBannerText(e.target.value)}
            placeholder="যেমন: আজকের যেকোনো ২ টি গ্যাজেট অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি সারা বাংলাদেশে!"
            className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 outline-hidden"
          />

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSaveGeneralBannerSettings}
              className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>ঘোষণা বার সেভ করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT HERO SLIDE */}
      {isSlideModalOpen && editingSlide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1E2230] border border-[#2D3348] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#151824] border-b border-[#2D3348] flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#FFC107]" />
                <span>
                  {slides.some(s => s.id === editingSlide.id) ? 'ব্যানার স্লাইড এডিট করুন' : 'নতুন ব্যানার স্লাইড যোগ করুন'}
                </span>
              </h3>
              <button
                onClick={() => setIsSlideModalOpen(false)}
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSlideSubmit} className="p-6 space-y-5">
              {/* Image Upload & URL Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#CBD5E1]">
                  ব্যানার ছবি (Banner Image) *
                </label>

                {/* Preview Box */}
                {editingSlide.image ? (
                  <div className="relative h-48 sm:h-56 w-full rounded-xl overflow-hidden bg-[#151824] border border-[#2D3348]">
                    <img
                      src={editingSlide.image}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingSlide(prev => prev ? { ...prev, image: '' } : null)}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ছবি রিমুভ</span>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#2D3348] hover:border-[#FFC107] rounded-xl p-6 text-center bg-[#151824]/50 transition-all">
                    <Upload className="w-10 h-10 text-[#FFC107] mx-auto mb-2 opacity-80" />
                    <p className="text-xs sm:text-sm font-bold text-white mb-1">
                      মোবাইল বা পিসি থেকে ব্যানার ছবি সিলেক্ট করুন
                    </p>
                    <p className="text-[11px] text-[#94A3B8] mb-3">
                      সুপারিশকৃত সাইজ: 1920x800 বা 1600x600 পিক্সেল (JPG, PNG, WebP)
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC107] hover:bg-[#FFB300] text-black text-xs font-black rounded-xl cursor-pointer shadow-md active:scale-95 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'প্রসেসিং হচ্ছে...' : 'ছবি আপলোড করুন'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Direct Image URL input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-[#94A3B8]">অথবা ছবির সরাসরি ওয়েব লিঙ্ক (Image URL) পেস্ট করুন:</span>
                  </div>
                  <input
                    type="text"
                    value={editingSlide.image || ''}
                    onChange={(e) => setEditingSlide(prev => prev ? { ...prev, image: e.target.value } : null)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs rounded-xl px-3.5 py-2 outline-hidden"
                  />
                </div>

                {/* Sample Presets */}
                <div>
                  <span className="text-[11px] text-[#94A3B8] block mb-1.5">
                    অথবা রেডিমেড স্যাম্পল ব্যানার থেকে বেছে নিন:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_BANNER_IMAGES.map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => {
                          setEditingSlide(prev => prev ? {
                            ...prev,
                            image: preset.url,
                            title: prev.title || preset.title,
                            subtitle: prev.subtitle || preset.subtitle
                          } : null);
                        }}
                        className="p-2 rounded-lg bg-[#151824] border border-[#2D3348] hover:border-[#FFC107] text-left transition-all cursor-pointer flex items-center gap-2 group"
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-10 h-8 rounded object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[11px] text-[#CBD5E1] group-hover:text-white line-clamp-1 font-medium">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                    ব্যানার শিরোনাম (Title)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.title || ''}
                    onChange={(e) => setEditingSlide(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="যেমন: প্রিমিয়াম স্মার্ট গ্যাজেটস"
                    className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2 outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                    সাবটাইটেল (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={editingSlide.subtitle || ''}
                    onChange={(e) => setEditingSlide(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
                    placeholder="যেমন: ক্যাশ অন ডেলিভারি সারা দেশে"
                    className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2 outline-hidden"
                  />
                </div>
              </div>

              {/* Link Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                    ক্লিক করলে কোথায় যাবে (Target Action)
                  </label>
                  <select
                    value={editingSlide.linkType || 'all_products'}
                    onChange={(e) => setEditingSlide(prev => prev ? { ...prev, linkType: e.target.value as any } : null)}
                    className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs rounded-xl px-3.5 py-2.5 outline-hidden cursor-pointer"
                  >
                    <option value="all_products">সকল প্রোডাক্টস পেজ</option>
                    <option value="category">নির্দিষ্ট ক্যাটাগরি</option>
                    <option value="custom_url">কাস্টম লিংক বা এক্সটার্নাল URL</option>
                  </select>
                </div>

                {editingSlide.linkType === 'category' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                      টার্গেট ক্যাটাগরি
                    </label>
                    <select
                      value={editingSlide.linkValue || ''}
                      onChange={(e) => setEditingSlide(prev => prev ? { ...prev, linkValue: e.target.value } : null)}
                      className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs rounded-xl px-3.5 py-2.5 outline-hidden cursor-pointer"
                    >
                      <option value="">ক্যাটাগরি বেছে নিন...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : editingSlide.linkType === 'custom_url' ? (
                  <div>
                    <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                      কাস্টম লিঙ্ক
                    </label>
                    <input
                      type="text"
                      value={editingSlide.linkValue || ''}
                      onChange={(e) => setEditingSlide(prev => prev ? { ...prev, linkValue: e.target.value } : null)}
                      placeholder="https://..."
                      className="w-full bg-[#151824] border border-[#2D3348] focus:border-[#FFC107] text-white text-xs rounded-xl px-3.5 py-2 outline-hidden"
                    />
                  </div>
                ) : (
                  <div />
                )}
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editingSlide.isActive !== false}
                    onChange={(e) => setEditingSlide(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                    className="w-4 h-4 accent-[#FFC107] rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-white">এই ব্যানারটি ওয়েবসাইটে সক্রিয় রাখুন</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2D3348]">
                <button
                  type="button"
                  onClick={() => setIsSlideModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#222736] hover:bg-[#2D3348] text-[#94A3B8] hover:text-white text-xs font-bold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#FFC107] hover:bg-[#FFB300] text-black text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
