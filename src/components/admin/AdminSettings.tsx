import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { getSupabaseConfig, isSupabaseConfigured, getSupabaseClient, setSupabaseCredentials } from '../../lib/supabase';
import { processImageForPlaceholder } from '../../lib/imageUtils';
import {
  getR2Config,
  setR2Config,
  testR2Connection,
  uploadToR2,
  DEFAULT_R2_CONFIG,
  isR2Url,
  isR2CredentialsConfigured,
  RECOMMENDED_R2_CORS_JSON
} from '../../lib/r2Storage';
import {
  Settings,
  Save,
  Check,
  ShieldAlert,
  Globe,
  Bell,
  CreditCard,
  Building,
  KeyRound,
  RotateCcw,
  Database,
  Copy,
  Code,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Cloud,
  UploadCloud,
  FileImage,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  HelpCircle,
  Lock
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { settings, saveSettings, resetToDefaults } = useStore();

  const currentSupabase = getSupabaseConfig();
  const currentR2 = getR2Config();
  const [formData, setFormData] = useState({
    ...settings,
    supabaseUrl: settings.supabaseUrl || currentSupabase.url || '',
    supabaseKey: settings.supabaseKey || currentSupabase.key || '',
    r2AccountId: settings.r2AccountId || currentR2.accountId || DEFAULT_R2_CONFIG.accountId,
    r2BucketName: settings.r2BucketName || currentR2.bucketName || DEFAULT_R2_CONFIG.bucketName,
    r2PublicUrl: settings.r2PublicUrl || currentR2.publicUrl || DEFAULT_R2_CONFIG.publicUrl,
    r2S3Endpoint: settings.r2S3Endpoint || currentR2.s3ApiUrl || DEFAULT_R2_CONFIG.s3ApiUrl,
    r2AccessKeyId: settings.r2AccessKeyId || currentR2.accessKeyId || '',
    r2SecretAccessKey: settings.r2SecretAccessKey || currentR2.secretAccessKey || ''
  });
  const [currentPass, setCurrentPass] = useState('');
  const [newAdminId, setNewAdminId] = useState(settings.adminUsername);
  const [newPass, setNewPass] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');

  // Supabase Testing & Diagnostic State
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { status: 'ok' | 'error' | 'missing'; msg: string }> | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Cloudflare R2 Media State
  const [isTestingR2, setIsTestingR2] = useState(false);
  const [r2TestResult, setR2TestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [r2UploadFolder, setR2UploadFolder] = useState<'products' | 'banners' | 'categories' | 'reviews' | 'general'>('products');
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);
  const [lastUploadedR2Url, setLastUploadedR2Url] = useState<string>('');
  const [r2UploadError, setR2UploadError] = useState<string>('');
  const [copiedR2Url, setCopiedR2Url] = useState(false);
  const [copiedCorsJson, setCopiedCorsJson] = useState(false);
  const [showR2Secret, setShowR2Secret] = useState(false);

  const sqlSetupScript = `-- ============================================================
-- KINOMART E-COMMERCE SUPABASE COMPLETE DATABASE SETUP SCRIPT
-- ============================================================
-- Copy and paste this script into Supabase -> SQL Editor -> Run

CREATE TABLE IF NOT EXISTS public.orders (
    id text PRIMARY KEY,
    order_number text,
    customer_name text,
    customer_phone text,
    shipping_address text,
    delivery_area text,
    total_price numeric,
    status text DEFAULT 'Pending',
    call_status text DEFAULT 'Not Called',
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Ensure all order columns exist if table was created previously
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS call_status text DEFAULT 'Not Called';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_area text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_price numeric;

CREATE TABLE IF NOT EXISTS public.products (
    id text PRIMARY KEY,
    name text,
    category text,
    sub_category text,
    price numeric,
    stock integer,
    data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
    id text PRIMARY KEY,
    name text,
    image text,
    position integer DEFAULT 1,
    is_visible_on_home boolean DEFAULT true,
    sub_categories jsonb,
    data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coupons (
    id text PRIMARY KEY,
    code text,
    discount_amount numeric,
    discount_type text,
    data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.settings (
    id text PRIMARY KEY,
    data jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team (
    id text PRIMARY KEY,
    name text,
    role text,
    data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_profiles (
    phone text PRIMARY KEY,
    name text,
    address text,
    data jsonb NOT NULL
);

-- Disable Row Level Security (RLS) so Client App can read & write freely
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles DISABLE ROW LEVEL SECURITY;

-- High-performance indexes for instant queries across all devices
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_categories_position ON public.categories (position ASC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (code);

-- Allow public access policies (In case RLS is forced on)
DO $$ BEGIN CREATE POLICY "Public All Orders" ON public.orders FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public All Products" ON public.products FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public All Categories" ON public.categories FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public All Coupons" ON public.coupons FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public All Settings" ON public.settings FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public All Team" ON public.team FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public All Customers" ON public.customer_profiles FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Grant permissions to public anon role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const runDatabaseTest = async () => {
    setIsTesting(true);
    if (formData.supabaseUrl || formData.supabaseKey) {
      setSupabaseCredentials(formData.supabaseUrl || '', formData.supabaseKey || '');
    }
    const client = getSupabaseClient();
    if (!client) {
      setIsTesting(false);
      setTestResults({
        config: { status: 'error', msg: 'Supabase URL অথবা Key সঠিকভাবে দেওয়া হয়নি!' }
      });
      return;
    }

    const tables = ['orders', 'products', 'categories', 'coupons', 'settings', 'team', 'customer_profiles'];
    const res: Record<string, { status: 'ok' | 'error' | 'missing'; msg: string }> = {};

    for (const t of tables) {
      try {
        const { error: selectErr } = await client.from(t).select('*').limit(1);
        if (selectErr) {
          const errStr = (selectErr.message || JSON.stringify(selectErr)).toLowerCase();
          if (errStr.includes('does not exist') || errStr.includes('42p01') || errStr.includes('relation')) {
            res[t] = { status: 'missing', msg: 'টেবিল তৈরি করা হয়নি' };
          } else if (errStr.includes('row-level security') || errStr.includes('42501') || errStr.includes('policy')) {
            res[t] = { status: 'error', msg: '⚠️ RLS এনাবল থাকায় ডাটা পড়া ও সেভ ব্লকড' };
          } else {
            res[t] = { status: 'error', msg: selectErr.message || 'Error querying table' };
          }
        } else {
          // Test write access
          const dummyId = `__perm_test_${Date.now()}`;
          const dummyPayload: any = t === 'customer_profiles' ? { phone: dummyId, name: 'test', data: {} } : { id: dummyId, name: 'test', data: {} };
          const { error: writeErr } = await client.from(t).upsert(dummyPayload);
          if (writeErr) {
            const errStr = (writeErr.message || JSON.stringify(writeErr)).toLowerCase();
            if (errStr.includes('row-level security') || errStr.includes('42501') || errStr.includes('policy') || errStr.includes('permission')) {
              res[t] = { status: 'error', msg: '⚠️ Read সফল হলেও RLS এর কারণে Write (ডাটা সেভ) ব্লকড!' };
            } else {
              res[t] = { status: 'ok', msg: 'টেবিল পাওয়া গেছে (Read OK)' };
            }
          } else {
            const deleteKey = t === 'customer_profiles' ? 'phone' : 'id';
            await client.from(t).delete().eq(deleteKey, dummyId);
            res[t] = { status: 'ok', msg: 'সবকিছু ঠিক আছে (Read & Write OK)' };
          }
        }
      } catch (e: any) {
        res[t] = { status: 'error', msg: e?.message || 'Connection error' };
      }
    }

    setTestResults(res);
    setIsTesting(false);
  };

  const handleTestR2 = async () => {
    setIsTestingR2(true);
    setR2TestResult(null);
    try {
      const res = await testR2Connection(formData.r2PublicUrl);
      setR2TestResult(res);
    } catch (err: any) {
      setR2TestResult({ success: false, message: 'Cloudflare R2 টেস্ট ব্যর্থ হয়েছে: ' + (err.message || '') });
    } finally {
      setIsTestingR2(false);
    }
  };

  const handleUploadR2Media = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingToR2(true);
    setR2UploadError('');
    setLastUploadedR2Url('');
    try {
      // If access keys are not set in state, check if they exist in formData
      setR2Config({
        accountId: formData.r2AccountId,
        bucketName: formData.r2BucketName,
        publicUrl: formData.r2PublicUrl,
        s3ApiUrl: formData.r2S3Endpoint,
        accessKeyId: formData.r2AccessKeyId,
        secretAccessKey: formData.r2SecretAccessKey
      });

      const result = await uploadToR2(file, { folder: r2UploadFolder, filename: file.name });
      setLastUploadedR2Url(result.cdnUrl);
      setSuccessMsg('ছবিটি সফলভাবে Cloudflare R2-তে আপলোড হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('R2 Media upload error:', err);
      setR2UploadError(err.message || 'Cloudflare R2 আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setIsUploadingToR2(false);
      e.target.value = '';
    }
  };

  const copyR2UrlToClipboard = () => {
    if (!lastUploadedR2Url) return;
    navigator.clipboard.writeText(lastUploadedR2Url);
    setCopiedR2Url(true);
    setTimeout(() => setCopiedR2Url(false), 3000);
  };

  const copyCorsJsonToClipboard = () => {
    navigator.clipboard.writeText(RECOMMENDED_R2_CORS_JSON);
    setCopiedCorsJson(true);
    setTimeout(() => setCopiedCorsJson(false), 3000);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    setR2Config({
      accountId: formData.r2AccountId,
      bucketName: formData.r2BucketName,
      publicUrl: formData.r2PublicUrl,
      s3ApiUrl: formData.r2S3Endpoint,
      accessKeyId: formData.r2AccessKeyId,
      secretAccessKey: formData.r2SecretAccessKey
    });
    setSuccessMsg('সকল সেটিংস এবং Cloudflare R2 কনফিগারেশন সফলভাবে সেভ হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPass !== settings.adminPasswordHash) {
      setPassMsg('⚠️ বর্তমান পাসওয়ার্ডটি ভুল!');
      return;
    }

    if (!newAdminId.trim()) {
      setPassMsg('⚠️ সঠিক ইউজারনেম দিন!');
      return;
    }

    const updated = {
      ...formData,
      adminUsername: newAdminId.trim(),
      adminPasswordHash: newPass.trim() || settings.adminPasswordHash
    };

    setFormData(updated);
    saveSettings(updated);
    setPassMsg('✓ এডমিন আইডি ও পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!');
    setCurrentPass('');
    setNewPass('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="bg-[#181B26] border border-[#2B3042] p-4 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#2563EB]" />
            <span>ওয়েবসাইট ও এডমিন সেটিংস</span>
          </h2>
          <p className="text-xs text-[#94A3B8]">সাইটের হেডার, পেমেন্ট নাম্বার, নোটিফিকেশন ও সিকিউরিটি পরিবর্তন করুন</p>
        </div>

        <button
          onClick={() => {
            if (confirm('রিসেট করলে সব ডাটা ডিফল্ট অবস্থায় ফিরে যাবে। আপনি কি নিশ্চিত?')) {
              resetToDefaults();
              window.location.reload();
            }
          }}
          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl flex items-center gap-1 font-bold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>রিসেট ডাটা</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Section 1: Logo & Favicon */}
        <div className="bg-[#181B26] border border-[#2B3042] p-5 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#2563EB]" />
            ওয়েবসাইট লোগো ও ফেভিকন (Website Logo & Favicon)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">ওয়েবসাইট লোগো (Brand Logo)</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors">
                    <span>⚓ ফাইল আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await processImageForPlaceholder(file, 'logo');
                            setFormData({ ...formData, logoUrl: compressed });
                          } catch (err) {
                            console.error('Logo upload error:', err);
                          }
                        }
                      }}
                    />
                  </label>
                  {formData.logoUrl && (
                    <img src={formData.logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain bg-[#11131A] p-1 rounded border border-[#33384B]" />
                  )}
                </div>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">ব্রাউজার আইকন (Favicon)</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors">
                    <span>⚓ ফাইল আপলোড</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await processImageForPlaceholder(file, 'favicon');
                            setFormData({ ...formData, faviconUrl: compressed });
                          } catch (err) {
                            console.error('Favicon upload error:', err);
                          }
                        }
                      }}
                    />
                  </label>
                  {formData.faviconUrl && (
                    <img src={formData.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain bg-[#11131A] p-1 rounded border border-[#33384B]" />
                  )}
                </div>
                <input
                  type="text"
                  value={formData.faviconUrl}
                  onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                  placeholder="https://example.com/favicon.ico"
                  className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Top Banner Ticker */}
        <div className="bg-[#181B26] border border-[#2B3042] p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#A5DD28]" />
              টপ ব্যানার নোটিফিকেশন ও মেসেজ বার (Top Banner Ticker)
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={formData.topBannerEnabled}
                onChange={(e) => setFormData({ ...formData, topBannerEnabled: e.target.checked })}
                className="accent-[#2563EB]"
              />
              <span>টপ বার চালু রাখুন</span>
            </label>
          </div>

          <div className="text-xs">
            <label className="block text-[#94A3B8] font-bold mb-1">ব্যানার বার বার্তা</label>
            <input
              type="text"
              value={formData.topBannerText}
              onChange={(e) => setFormData({ ...formData, topBannerText: e.target.value })}
              className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-medium"
            />
          </div>
        </div>

        {/* Section 3: Facebook Pixel & CAPI */}
        <div className="bg-[#181B26] border border-[#2B3042] p-5 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" />
            Facebook Pixel & Conversions API (CAPI)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Facebook Pixel ID</label>
              <input
                type="text"
                placeholder="e.g. 123456789012345"
                value={formData.facebookPixelId}
                onChange={(e) => setFormData({ ...formData, facebookPixelId: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">CAPI Access Token</label>
              <input
                type="text"
                placeholder="Meta Conversions API Token"
                value={formData.capiAccessToken}
                onChange={(e) => setFormData({ ...formData, capiAccessToken: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Google Tag Manager (GTM ID)</label>
              <input
                type="text"
                placeholder="e.g. GTM-XXXXXXX"
                value={formData.gtmId || ''}
                onChange={(e) => setFormData({ ...formData, gtmId: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
              <p className="text-[10px] text-gray-400 mt-1">Google Tag Manager কন্টেইনার স্বয়ংক্রিয়ভাবে লোড হবে</p>
            </div>
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Google Analytics 4 (GA4 Measurement ID)</label>
              <input
                type="text"
                placeholder="e.g. G-XXXXXXXXXX"
                value={formData.gaMeasurementId || ''}
                onChange={(e) => setFormData({ ...formData, gaMeasurementId: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
              <p className="text-[10px] text-gray-400 mt-1">GA4 মেজারমেন্ট আইডি দিলে gtag.js স্বয়ংক্রিয়ভাবে কানেক্ট হবে</p>
            </div>
          </div>
          <div className="bg-[#11131A] p-3 rounded-xl border border-emerald-900/40 text-[11px] text-emerald-400 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>DataLayer Active:</strong> window.dataLayer সক্রিয় এবং GA4 ইকমার্স ইভেন্ট (page_view, view_item_list, select_item, view_item, add_to_cart, begin_checkout, purchase) স্বয়ংক্রিয়ভাবে ট্র্যাক হচ্ছে।</span>
          </div>
        </div>

        {/* Section 4: Mobile Banking Numbers */}
        <div className="bg-[#181B26] border border-[#2B3042] p-5 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-pink-400" />
            মোবাইল ব্যাংকিং নম্বর (bKash & Nagad)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">বিকাশ পার্সোনাল নম্বর (bKash Number)</label>
              <input
                type="text"
                value={formData.bkashNumber}
                onChange={(e) => setFormData({ ...formData, bkashNumber: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">নগদ পার্সোনাল নম্বর (Nagad Number)</label>
              <input
                type="text"
                value={formData.nagadNumber}
                onChange={(e) => setFormData({ ...formData, nagadNumber: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Company Info */}
        <div className="bg-[#181B26] border border-[#2B3042] p-5 rounded-2xl space-y-4">
          <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
            <Building className="w-4 h-4 text-[#A5DD28]" />
            ফুটার ও কন্টাক্ট তথ্য
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">ওয়েবসাইট টাইটেল (Title)</label>
              <input
                type="text"
                value={formData.websiteTitle}
                onChange={(e) => setFormData({ ...formData, websiteTitle: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">ট্যাগলাইন (Tagline)</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">হটলাইন নম্বর</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">হোয়াটসঅ্যাপ নম্বর</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">ইমেইল</label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">শপ ঠিকানা</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-[#94A3B8] font-bold mb-1">ফুটার ডেসক্রিপশন / আমাদের সম্পর্কে</label>
            <textarea
              rows={2}
              value={formData.footerAbout}
              onChange={(e) => setFormData({ ...formData, footerAbout: e.target.value })}
              className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
            />
          </div>
        </div>

        {/* Section 6: Supabase Cloud Database Connection */}
        <div className="bg-[#181B26] border border-[#2B3042] p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              সুপাবেস ডাটাবেস সংযোগ (Supabase Database Credentials)
            </h3>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                isSupabaseConfigured()
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isSupabaseConfigured() ? 'ডাটাবেস কানেক্টেড (Connected)' : 'নট কানেক্টেড (Not Connected)'}
            </span>
          </div>

          <p className="text-xs text-[#94A3B8]">
            যেকোনো ডিভাইস থেকে ডাটা সেভ ও সিঙ্ক করতে আপনার Supabase Project URL এবং Anon Key প্রদান করুন। এটি সেভ করলে সকল ডিভাইসে লাইভ ডাটা শো করবে।
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={formData.supabaseUrl || ''}
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                placeholder="https://xyz.supabase.co"
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Supabase Anon Key</label>
              <input
                type="password"
                value={formData.supabaseKey || ''}
                onChange={(e) => setFormData({ ...formData, supabaseKey: e.target.value })}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono text-xs"
              />
            </div>
          </div>

          {/* Test & SQL Setup Tools */}
          <div className="pt-2 border-t border-[#2B3042] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={runDatabaseTest}
                disabled={isTesting}
                className="bg-[#2563EB]/20 hover:bg-[#2563EB]/30 text-blue-400 border border-[#2563EB]/40 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'টেস্ট করা হচ্ছে...' : '🧪 টেস্ট ডাটাবেস টেবিল ও কানেকশন (Test All Tables)'}</span>
              </button>

              <button
                type="button"
                onClick={copySqlToClipboard}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '✓ কপি হয়েছে!' : '📋 Supabase SQL সেটআপ কোড কপি করুন'}</span>
              </button>
            </div>

            {/* Test Results Banner */}
            {testResults && (
              <div className="bg-[#11131A] border border-[#33384B] p-4 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  ডাটাবেস টেবিল স্ট্যাটাস রিপোর্ট (Database Test Report):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(testResults).map(([tbl, info]) => (
                    <div
                      key={tbl}
                      className={`p-2.5 rounded-lg border flex items-center justify-between ${
                        info.status === 'ok'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : info.status === 'missing'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-mono font-bold">
                        {info.status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {info.status === 'missing' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {info.status === 'error' && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        <span>{tbl}</span>
                      </div>
                      <span className="text-[10px] font-sans text-slate-300">{info.msg}</span>
                    </div>
                  ))}
                </div>

                {Object.values(testResults).some(r => r.status !== 'ok') && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ডাটা সেভ না হওয়ার সমাধান (Solution):
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      আপনার Supabase ড্যাশবোর্ডে (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-bold text-amber-300">https://supabase.com/dashboard</a>) ঢুকুন, প্রজেক্টের <strong>SQL Editor</strong> সেকশনে যান। উপরের <strong>"📋 Supabase SQL সেটআপ কোড কপি করুন"</strong> বাটনে ক্লিক করে কপি করা SQL পেস্ট করে <strong>Run</strong> বাটনে ক্লিক করুন!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SQL Script Box */}
            <div className="bg-[#11131A] border border-[#2B3042] rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[#94A3B8] font-bold">
                <span className="flex items-center gap-1.5 text-white">
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  Supabase Database Auto-Setup Script (SQL)
                </span>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className="text-cyan-400 hover:underline text-[11px] font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedSql ? 'কপি হয়েছে' : 'কপি করুন'}
                </button>
              </div>
              <pre className="bg-[#0B0C10] border border-[#2B3042] p-3 rounded-lg text-[10px] font-mono text-cyan-300 max-h-40 overflow-y-auto leading-relaxed select-all">
                {sqlSetupScript}
              </pre>
            </div>
          </div>
        </div>

        {/* Section 7: Cloudflare R2 Media Storage & CDN Integration */}
        <div className="bg-[#181B26] border border-[#2B3042] p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
              <Cloud className="w-4 h-4 text-orange-400" />
              <span>ক্লাউডফ্লেয়ার R2 মিডিয়া স্টোরেজ ও সিডিএন (Cloudflare R2 Media Storage)</span>
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 border ${
              isR2CredentialsConfigured()
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isR2CredentialsConfigured() ? 'bg-emerald-400' : 'bg-orange-400 animate-pulse'}`}></span>
              <span>{isR2CredentialsConfigured() ? 'R2 ফুল আপলোড সক্রিয় (Ready)' : 'R2 CDN কানেক্টেড (API Token প্রয়োজন)'}</span>
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] leading-relaxed">
            প্রোডাক্টের ছবি, ব্যানার, আইকন ও মিডিয়া ফাইলগুলো সরাসরি <strong>Cloudflare R2 হাই-স্পিড গ্লোবাল CDN</strong> এর মাধ্যমে দ্রুত লোড হবে। ব্রাউজার থেকে সরাসরি R2-তে ছবি আপলোডের জন্য নিচে Cloudflare R2 API Token (Access Key & Secret Key) প্রদান করুন।
          </p>

          {/* R2 Config Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Cloudflare Account ID</label>
              <input
                type="text"
                value={formData.r2AccountId || ''}
                onChange={(e) => setFormData({ ...formData, r2AccountId: e.target.value })}
                placeholder="e731735be156543f033f2f9f611cb44c"
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">R2 Bucket Name</label>
              <input
                type="text"
                value={formData.r2BucketName || ''}
                onChange={(e) => setFormData({ ...formData, r2BucketName: e.target.value })}
                placeholder="kinomart"
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Public Development / CDN URL</label>
              <input
                type="text"
                value={formData.r2PublicUrl || ''}
                onChange={(e) => setFormData({ ...formData, r2PublicUrl: e.target.value })}
                placeholder="https://pub-5b578dfe75d2479c8a74e0953fe58b53.r2.dev"
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono text-xs"
              />
              <p className="text-[10px] text-gray-400 mt-1">ছবিগুলো এই ডোমেইন থেকে হাই-স্পিডে ব্রাউজারে প্রদর্শিত হবে</p>
            </div>

            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">S3 API Endpoint</label>
              <input
                type="text"
                value={formData.r2S3Endpoint || ''}
                onChange={(e) => setFormData({ ...formData, r2S3Endpoint: e.target.value })}
                placeholder="https://e731735be156543f033f2f9f611cb44c.r2.cloudflarestorage.com/kinomart"
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono text-xs"
              />
              <p className="text-[10px] text-gray-400 mt-1">S3 API ব্যাকএন্ড এন্ডপয়েন্ট</p>
            </div>

            {/* R2 Access Key ID */}
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1 flex items-center justify-between">
                <span>R2 Access Key ID (API Token)</span>
                <span className="text-[10px] text-amber-400">আপলোডের জন্য প্রয়োজনীয়</span>
              </label>
              <input
                type="text"
                value={formData.r2AccessKeyId || ''}
                onChange={(e) => setFormData({ ...formData, r2AccessKeyId: e.target.value })}
                placeholder="उदा. 4a123bc89... (R2 Token Access Key ID)"
                className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono text-xs focus:border-orange-500 transition-colors"
              />
            </div>

            {/* R2 Secret Access Key */}
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1 flex items-center justify-between">
                <span>R2 Secret Access Key</span>
                <button
                  type="button"
                  onClick={() => setShowR2Secret(!showR2Secret)}
                  className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                >
                  {showR2Secret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showR2Secret ? 'লুকান' : 'দেখান'}</span>
                </button>
              </label>
              <div className="relative">
                <input
                  type={showR2Secret ? 'text' : 'password'}
                  value={formData.r2SecretAccessKey || ''}
                  onChange={(e) => setFormData({ ...formData, r2SecretAccessKey: e.target.value })}
                  placeholder="उदा. 98fe76dc5ba4321... (R2 Secret Key)"
                  className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-mono text-xs focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Quick Setup Instructions & CORS Policy Box */}
          <div className="bg-[#11131A] border border-orange-500/30 rounded-xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-orange-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-orange-400" />
                <span>Cloudflare R2 থেকে Access Key বের করার ৩টি সহজ ধাপ:</span>
              </h4>
              <button
                type="button"
                onClick={copyCorsJsonToClipboard}
                className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCorsJson ? 'CORS JSON কপি হয়েছে!' : '📋 CORS Policy JSON কপি করুন'}</span>
              </button>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-gray-300 text-[11px] leading-relaxed">
              <li>
                <strong>Cloudflare Dashboard</strong> এ গিয়ে বামপাশের মেন্যু থেকে <strong>R2 Object Storage</strong> &gt; <strong>Manage R2 API Tokens</strong> এ ক্লিক করুন।
              </li>
              <li>
                <strong>Create API Token</strong> এ ক্লিক করে Permissions এ <strong>Object Read &amp; Write</strong> সিলেক্ট করুন এবং <strong>Create API Token</strong> বাটনে চাপুন।
              </li>
              <li>
                প্রদর্শিত <strong>Access Key ID</strong> এবং <strong>Secret Access Key</strong> কপি করে উপরের বক্সে পেস্ট করে <strong>"💾 সকল সেটিংস সেভ করুন"</strong> বাটনে ক্লিক করুন।
              </li>
              <li>
                <em>(জরুরি)</em> আপনার <strong>kinomart</strong> বাকেটের <strong>Settings &gt; CORS Policy</strong> তে উপরের <strong>CORS JSON</strong> টি পেস্ট করে দিন যাতে ব্রাউজার থেকে সরাসরি ছবি আপলোড করা যায়।
              </li>
            </ol>
          </div>

          {/* R2 Testing & Tool Actions */}
          <div className="pt-3 border-t border-[#2B3042] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestR2}
                disabled={isTestingR2}
                className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingR2 ? 'animate-spin' : ''}`} />
                <span>{isTestingR2 ? 'টেস্ট করা হচ্ছে...' : '🧪 টেস্ট R2 CDN কানেক্টিভিটি (Test R2 CDN)'}</span>
              </button>

              <a
                href={formData.r2PublicUrl || DEFAULT_R2_CONFIG.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1.5 underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>পাবলিক সিডিএন ইউআরএল ওপেন করুন ↗</span>
              </a>
            </div>

            {/* Test Result Message */}
            {r2TestResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  r2TestResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                {r2TestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{r2TestResult.message}</span>
              </div>
            )}

            {/* Interactive Media Upload & Instant CDN URL Generator */}
            <div className="bg-[#11131A] border border-[#2B3042] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-xs flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-orange-400" />
                  <span>মিডিয়া আপলোডার ও R2 CDN লিঙ্ক জেনারেটর (R2 CDN Media Generator)</span>
                </h4>
                <span className="text-[10px] text-gray-400">অটো অপ্টিমাইজড CDN লিঙ্ক</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#94A3B8] text-[11px] font-bold mb-1">টার্গেট ফোল্ডার (Target Folder)</label>
                  <select
                    value={r2UploadFolder}
                    onChange={(e) => setR2UploadFolder(e.target.value as any)}
                    className="w-full bg-[#181B26] border border-[#33384B] rounded-lg p-2 text-xs text-white"
                  >
                    <option value="products">products/ (প্রোডাক্ট ইমেজ)</option>
                    <option value="banners">banners/ (ব্যানার ও স্লাইডার)</option>
                    <option value="categories">categories/ (ক্যাটাগরি আইকন)</option>
                    <option value="reviews">reviews/ (রিভিউ ও স্ক্রিনশট)</option>
                    <option value="general">general/ (অন্যান্য মিডিয়া)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <label className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md">
                    <FileImage className="w-4 h-4" />
                    <span>{isUploadingToR2 ? 'আপলোড হচ্ছে...' : '📸 ছবি বা ফাইল সিলেক্ট করুন'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadR2Media}
                      disabled={isUploadingToR2}
                    />
                  </label>
                </div>
              </div>

              {/* Upload Error Box */}
              {r2UploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">{r2UploadError}</p>
                    <p className="text-[11px] text-red-200/80">
                      💡 সমাধান: উপরের সেকশনে Cloudflare <strong>R2 Access Key ID</strong> ও <strong>Secret Access Key</strong> দিন এবং Bucket-এর CORS Policy আপডেট করুন।
                    </p>
                  </div>
                </div>
              )}

              {/* Uploaded Link Box */}
              {lastUploadedR2Url && (
                <div className="mt-3 p-3 bg-[#181B26] border border-orange-500/30 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-300 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      R2 CDN লিঙ্ক প্রস্তুত:
                    </span>
                    <button
                      type="button"
                      onClick={copyR2UrlToClipboard}
                      className="bg-orange-500 hover:bg-orange-400 text-black px-2.5 py-1 rounded-md text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {copiedR2Url ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedR2Url ? 'কপি হয়েছে!' : 'লিঙ্ক কপি করুন'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={lastUploadedR2Url}
                      alt="Uploaded Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-[#33384B] shrink-0 bg-black/40"
                    />
                    <input
                      type="text"
                      readOnly
                      value={lastUploadedR2Url}
                      className="w-full bg-[#11131A] border border-[#33384B] rounded-lg p-2 text-orange-200 font-mono text-[11px] select-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">
                    💡 এই লিঙ্কটি কপি করে যেকোনো প্রোডাক্টের ফটো, ব্যানার বা ক্যাটাগরির ইমেজ ফিল্ডে পেস্ট করতে পারেন।
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Save Button */}
        <button
          type="submit"
          className="w-full bg-[#2563EB] hover:bg-blue-600 text-white font-extrabold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <Save className="w-5 h-5" />
          <span>💾 সকল সেটিংস সেভ করুন</span>
        </button>
      </form>

      {/* Section 6: Security & Password Update (Matching Image 13) */}
      <div className="bg-[#181B26] border border-[#2B3042] p-5 rounded-2xl space-y-4">
        <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          এডমিন আইডি ও পাসওয়ার্ড পরিবর্তন (Admin Credentials)
        </h3>

        {passMsg && (
          <p className="text-xs font-bold p-2.5 rounded-xl bg-[#11131A] border border-[#33384B] text-amber-300">
            {passMsg}
          </p>
        )}

        <form onSubmit={handleSaveSecurity} className="space-y-3 text-xs">
          <div>
            <label className="block text-[#94A3B8] font-bold mb-1">বর্তমান পাসওয়ার্ড (Current Password)</label>
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              placeholder="বর্তমান পাসওয়ার্ড দিন..."
              className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
            />
          </div>

          <div>
            <label className="block text-[#94A3B8] font-bold mb-1">নতুন এডমিন আইডি (New Admin ID)</label>
            <input
              type="text"
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white font-bold"
            />
          </div>

          <div>
            <label className="block text-[#94A3B8] font-bold mb-1">নতুন পাসওয়ার্ড (New Password)</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড দিন..."
              className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
            />
          </div>

          <button
            type="submit"
            className="bg-[#EA580C] hover:bg-orange-600 text-white font-extrabold py-2.5 px-5 rounded-xl text-xs transition-all shadow-md"
          >
            আইডি ও পাসওয়ার্ড আপডেট করুন
          </button>
        </form>
      </div>
    </div>
  );
};
