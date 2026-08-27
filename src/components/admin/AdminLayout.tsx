import React, { useState, Suspense, lazy } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingBag,
  Package,
  Tags,
  Ticket,
  Users,
  Image as ImageIcon,
  Settings,
  ExternalLink,
  LogOut,
  Save,
  X,
  ShieldAlert
} from 'lucide-react';

const AdminOrders = lazy(() => import('./AdminOrders').then(m => ({ default: m.AdminOrders })));
const AdminProducts = lazy(() => import('./AdminProducts').then(m => ({ default: m.AdminProducts })));
const AdminCategories = lazy(() => import('./AdminCategories').then(m => ({ default: m.AdminCategories })));
const AdminCoupons = lazy(() => import('./AdminCoupons').then(m => ({ default: m.AdminCoupons })));
const AdminTeam = lazy(() => import('./AdminTeam').then(m => ({ default: m.AdminTeam })));
const AdminBanners = lazy(() => import('./AdminBanners').then(m => ({ default: m.AdminBanners })));
const AdminSettings = lazy(() => import('./AdminSettings').then(m => ({ default: m.AdminSettings })));

const AdminTabLoader = () => (
  <div className="py-20 text-center text-gray-400">
    <div className="animate-spin w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full mx-auto mb-3" />
    <p className="text-xs font-semibold">লোড হচ্ছে...</p>
  </div>
);

export const AdminLayout: React.FC = () => {
  const {
    activeAdminTab,
    setActiveAdminTab,
    setViewMode,
    logoutAdmin,
    settings,
    rlsWarning,
    dismissRlsWarning
  } = useStore();

  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  const handleManualSave = () => {
    setSavedSuccessMsg(true);
    setTimeout(() => setSavedSuccessMsg(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#E2E8F0] font-sans relative">
      {/* Top Admin Header */}
      <header className="bg-[#161922] border-b border-[#2A2E3D] px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center border border-[#333]">
              <span className="font-black text-[#A5DD28] text-lg">Km</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <span>{settings.websiteTitle}</span>
                <span className="text-[10px] bg-[#222736] text-[#A3C676] px-2 py-0.5 rounded font-mono border border-[#3B4358]">
                  Admin Panel
                </span>
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto text-xs font-semibold py-1">
            <button
              onClick={() => setActiveAdminTab('orders')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeAdminTab === 'orders'
                  ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:bg-[#222736] hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>অর্ডারস (Orders)</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('products')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeAdminTab === 'products'
                  ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:bg-[#222736] hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>প্রোডাক্টস (Products)</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('categories')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeAdminTab === 'categories'
                  ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:bg-[#222736] hover:text-white'
              }`}
            >
              <Tags className="w-4 h-4" />
              <span>ক্যাটাগরি (Categories)</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('coupons')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeAdminTab === 'coupons'
                  ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:bg-[#222736] hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>কুপনস (Coupons)</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('team')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeAdminTab === 'team'
                  ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:bg-[#222736] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>টিম (Team)</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('banners')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeAdminTab === 'banners'
                  ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:bg-[#222736] hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>ব্যানার ও স্লাইডার (Banners)</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeAdminTab === 'settings'
                  ? 'bg-[#2563EB] text-white font-bold shadow-sm'
                  : 'text-[#94A3B8] hover:bg-[#222736] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>সেটিংস (Settings)</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSave}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccessMsg ? 'সেভ হয়েছে!' : 'ডাটা সেভ'}</span>
            </button>

            <button
              onClick={() => setViewMode('client')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>সাইট দেখুন ↗</span>
            </button>

            <button
              onClick={logoutAdmin}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all cursor-pointer"
              title="লগআউট"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {rlsWarning && (
          <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-4 mb-6 text-amber-200 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fadeIn">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 text-xs">
                <h4 className="font-extrabold text-amber-300 text-sm">
                  ⚠️ Supabase Row Level Security (RLS) সক্রিয় রয়েছে!
                </h4>
                <p className="text-amber-200/90 leading-relaxed">
                  Supabase ডাটাবেসের টেবিলগুলোতে RLS অন থাকায় নতুন ডিভাইস ও ওয়েবসাইট থেকে সরাসরি ডাটা সেভ ব্লকড হয়ে আছে।
                </p>
                <p className="text-amber-300 font-bold">
                  👉 <strong>সমাধান:</strong> <strong>'সেটিংস (Settings)'</strong> ট্যাবে গিয়ে <strong>'SQL সেটআপ স্ক্রিপ্ট কপি'</strong> করে Supabase -&gt; SQL Editor এ পেস্ট করে Run করুন।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveAdminTab('settings')}
                className="bg-amber-500 text-black px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-amber-400 cursor-pointer shadow-md"
              >
                সেটিংস এ যান
              </button>
              <button
                onClick={dismissRlsWarning}
                className="p-1 text-amber-400 hover:text-white rounded-lg cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <Suspense fallback={<AdminTabLoader />}>
          {activeAdminTab === 'orders' && <AdminOrders />}
          {activeAdminTab === 'products' && <AdminProducts />}
          {activeAdminTab === 'categories' && <AdminCategories />}
          {activeAdminTab === 'coupons' && <AdminCoupons />}
          {activeAdminTab === 'team' && <AdminTeam />}
          {activeAdminTab === 'banners' && <AdminBanners />}
          {activeAdminTab === 'settings' && <AdminSettings />}
        </Suspense>
      </main>
    </div>
  );
};
