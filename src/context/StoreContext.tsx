import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured, setSupabaseCredentials, consumePreloadPromises } from '../lib/supabase';
import {
  INITIAL_SETTINGS,
  INITIAL_PROMO_BANNER
} from '../data/mockData';
import {
  Category,
  Coupon,
  CustomerProfile,
  MockSMSLog,
  Order,
  OrderItem,
  Product,
  StoreSettings,
  TeamMember,
  HeroSlide,
  PromoBannerConfig
} from '../types';
import { trackPurchase, injectGTM, injectGA4, injectMetaPixel } from '../lib/dataLayer';

interface StoreContextType {
  // Navigation & View
  viewMode: 'client' | 'admin';
  setViewMode: (mode: 'client' | 'admin') => void;
  activeClientPage: 'home' | 'products' | 'product-detail' | 'order-success' | 'order-track' | 'customer-profile' | 'about' | 'contact';
  setActiveClientPage: (page: 'home' | 'products' | 'product-detail' | 'order-success' | 'order-track' | 'customer-profile' | 'about' | 'contact') => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Selected Product & Modals
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  quickOrderProduct: Product | null;
  setQuickOrderProduct: (product: Product | null) => void;
  isQuickOrderOpen: boolean;
  setIsQuickOrderOpen: (open: boolean) => void;

  // Customer Account
  customerUser: CustomerProfile | null;
  isCustomerLoginModalOpen: boolean;
  setIsCustomerLoginModalOpen: (open: boolean) => void;
  loginCustomer: (phone: string, name?: string) => boolean;
  logoutCustomer: () => void;
  updateCustomerProfile: (name: string, address: string) => void;

  // Active Order Success
  completedOrder: Order | null;
  setCompletedOrder: (order: Order | null) => void;

  // Data Loading & Error
  isDataLoading: boolean;
  dataError: string | null;

  // Data Collections
  products: Product[];
  categories: Category[];
  orders: Order[];
  coupons: Coupon[];
  team: TeamMember[];
  settings: StoreSettings;
  heroSlides: HeroSlide[];
  promoBanner: PromoBannerConfig;

  // Mock SMS Notifications
  mockSmsLogs: MockSMSLog[];
  latestSmsToast: MockSMSLog | null;
  dismissSmsToast: () => void;
  triggerMockSMS: (order: Order, customMessage?: string) => MockSMSLog;
  clearSmsLogs: () => void;

  // Admin Controls
  isAdminLoggedIn: boolean;
  isAdminAuthenticated: boolean;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  loginAdmin: (username: string, pass: string) => boolean;
  logoutAdmin: () => void;
  activeAdminTab: 'orders' | 'products' | 'categories' | 'coupons' | 'team' | 'banners' | 'settings';
  setActiveAdminTab: (tab: 'orders' | 'products' | 'categories' | 'coupons' | 'team' | 'banners' | 'settings') => void;

  // Actions
  createOrder: (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'callStatus'>) => Order;
  updateOrderStatus: (orderId: string, status: Order['status'], callStatus?: Order['callStatus'], customSmsMsg?: string, sendSms?: boolean, notes?: string) => Promise<boolean>;
  deleteOrder: (orderId: string) => void;
  
  saveProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  saveCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;

  saveCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;

  saveTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (memberId: string) => void;

  saveHeroSlide: (slide: HeroSlide) => void;
  deleteHeroSlide: (slideId: string | number) => void;
  reorderHeroSlides: (slides: HeroSlide[]) => void;
  resetHeroSlides: () => void;
  savePromoBanner: (config: PromoBannerConfig) => void;

  saveSettings: (settings: StoreSettings) => void;
  validateCoupon: (code: string, subtotal: number) => { valid: boolean; discount: number; message: string };
  
  refreshSupabaseData: (options?: { full?: boolean; force?: boolean }) => Promise<void>;
  resetToDefaults: () => void;
  rlsWarning: string | null;
  dismissRlsWarning: () => void;
}

const safeGetStorage = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === 'undefined') return fallback;
    const saved = localStorage.getItem(key);
    if (!saved || saved === 'undefined' || saved === 'null') return fallback;
    return JSON.parse(saved);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return fallback;
  }
};

const safeSetStorage = (key: string, value: any): void => {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to write ${key} to localStorage:`, err);
  }
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [viewMode, setViewMode] = useState<'client' | 'admin'>('client');
  const [activeClientPage, setActiveClientPage] = useState<'home' | 'products' | 'product-detail' | 'order-success' | 'order-track' | 'customer-profile' | 'about' | 'contact'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Customer Account state
  const [customerProfiles, setCustomerProfiles] = useState<Record<string, CustomerProfile>>(() => {
    return safeGetStorage('kinomart_customer_profiles', {});
  });

  const [customerUser, setCustomerUser] = useState<CustomerProfile | null>(() => {
    return safeGetStorage('kinomart_current_customer', null);
  });

  const [isCustomerLoginModalOpen, setIsCustomerLoginModalOpen] = useState<boolean>(false);

  // Selected Product & Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Admin state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      return sessionStorage.getItem('kinomart_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const isAdminAuthenticated = isAdminLoggedIn;
  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'products' | 'categories' | 'coupons' | 'team' | 'banners' | 'settings'>('orders');

  // Data Loading & Error States
  const [isDataLoading, setIsDataLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const cached = safeGetStorage('kinomart_products', []);
      return !Array.isArray(cached) || cached.length === 0;
    }
    return true;
  });
  const [dataError, setDataError] = useState<string | null>(null);

  // Persistent States
  const [products, setProducts] = useState<Product[]>(() => {
    return safeGetStorage('kinomart_products', []);
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    return safeGetStorage('kinomart_categories', []);
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    return safeGetStorage('kinomart_orders', []);
  });

  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    return safeGetStorage('kinomart_coupons', []);
  });

  const [team, setTeam] = useState<TeamMember[]>(() => {
    return safeGetStorage('kinomart_team', []);
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    return safeGetStorage('kinomart_settings', INITIAL_SETTINGS);
  });

  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    return safeGetStorage('kinomart_hero_slides', []);
  });

  const [promoBanner, setPromoBanner] = useState<PromoBannerConfig>(() => {
    return safeGetStorage('kinomart_promo_banner', INITIAL_PROMO_BANNER);
  });

  // Cross-tab broadcast channel for instantaneous zero-latency synchronization
  const broadcastSync = (type: string, payload: any) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('kinomart_sync_channel');
        bc.postMessage({ type, payload, timestamp: Date.now() });
        bc.close();
      }
    } catch {
      // Ignore in restricted environments
    }
  };

  // Supabase RLS Warning State
  const [rlsWarning, setRlsWarning] = useState<string | null>(null);
  const dismissRlsWarning = () => setRlsWarning(null);

  // Mock SMS Notification State
  const [mockSmsLogs, setMockSmsLogs] = useState<MockSMSLog[]>(() => {
    return safeGetStorage('kinomart_mock_sms_logs', []);
  });
  const [latestSmsToast, setLatestSmsToast] = useState<MockSMSLog | null>(null);

  useEffect(() => {
    safeSetStorage('kinomart_mock_sms_logs', mockSmsLogs);
  }, [mockSmsLogs]);

  const dismissSmsToast = () => setLatestSmsToast(null);

  const clearSmsLogs = () => setMockSmsLogs([]);

  const triggerMockSMS = (order: Order, customMessage?: string): MockSMSLog => {
    const statusText = order.status;
    let defaultMsg = `প্রিয় ${order.customerName}, আপনার ${order.orderNumber} নম্বর অর্ডারটির স্ট্যাটাস পরিবর্তিত হয়ে '${statusText}' হয়েছে। মোট মূল্য: ৳${order.totalPrice}। ধন্যবাদ - ${settings.websiteTitle}`;

    if (order.status === 'Confirmed') {
      defaultMsg = `প্রিয় ${order.customerName}, আপনার ${order.orderNumber} নম্বর অর্ডারটি নিশ্চিত (Confirmed) করা হয়েছে। মোট মূল্য: ৳${order.totalPrice}। দ্রুত ডেলিভারি দেওয়া হবে। - ${settings.websiteTitle}`;
    } else if (order.status === 'Shipped') {
      defaultMsg = `প্রিয় ${order.customerName}, আপনার ${order.orderNumber} অর্ডারটি ডেলিভারির জন্য কুরিয়ারে পাঠানো হয়েছে। ডেলিভারিতে পরিশোধ করুন: ৳${order.totalPrice}। - ${settings.websiteTitle}`;
    } else if (order.status === 'Delivered') {
      defaultMsg = `প্রিয় ${order.customerName}, আপনার ${order.orderNumber} অর্ডারটি সফলভাবে ডেলিভারি হয়েছে। কেনাকাটার জন্য ধন্যবাদ! - ${settings.websiteTitle}`;
    } else if (order.status === 'Cancelled') {
      defaultMsg = `প্রিয় ${order.customerName}, আপনার ${order.orderNumber} অর্ডারটি বাতিল (Cancelled) করা হয়েছে। যেকোনো প্রয়োজনে কল করুন: ${settings.phone}। - ${settings.websiteTitle}`;
    }

    const finalMsg = customMessage || defaultMsg;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newLog: MockSMSLog = {
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      message: finalMsg,
      status: 'DELIVERED',
      sentAt: timeStr,
      gateway: 'GreenWeb BD SMS API (Simulated)',
      messageId: `SMS-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setMockSmsLogs((prev) => [newLog, ...prev]);
    setLatestSmsToast(newLog);

    return newLog;
  };

  // Sync LocalStorage for all core state collections
  useEffect(() => { safeSetStorage('kinomart_products', products); }, [products]);
  useEffect(() => { safeSetStorage('kinomart_categories', categories); }, [categories]);
  useEffect(() => { safeSetStorage('kinomart_orders', orders); }, [orders]);
  useEffect(() => { safeSetStorage('kinomart_coupons', coupons); }, [coupons]);
  useEffect(() => { safeSetStorage('kinomart_team', team); }, [team]);
  useEffect(() => { safeSetStorage('kinomart_settings', settings); }, [settings]);
  useEffect(() => { safeSetStorage('kinomart_customer_profiles', customerProfiles); }, [customerProfiles]);
  useEffect(() => { safeSetStorage('kinomart_hero_slides', heroSlides); }, [heroSlides]);
  useEffect(() => { safeSetStorage('kinomart_promo_banner', promoBanner); }, [promoBanner]);

  useEffect(() => {
    if (customerUser) {
      safeSetStorage('kinomart_current_customer', customerUser);
    } else {
      try {
        localStorage.removeItem('kinomart_current_customer');
      } catch (e) {
        console.warn(e);
      }
    }
  }, [customerUser]);

  // Safe JSON Parser helper
  const safeParseJson = (val: any): Record<string, any> => {
    if (!val) return {};
    if (typeof val === 'object') return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch {
        return {};
      }
    }
    return {};
  };

  // Resilient Smart Delete Helper for Supabase
  const smartDelete = async (tableName: string, id: string): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
      const { error: err1 } = await supabase.from(tableName).delete().eq('id', id);
      if (!err1) {
        setRlsWarning(null);
        return true;
      }

      const numId = Number(id);
      if (!isNaN(numId)) {
        const { error: err2 } = await supabase.from(tableName).delete().eq('id', numId);
        if (!err2) {
          setRlsWarning(null);
          return true;
        }
      }

      const errMsg = String(err1?.message || JSON.stringify(err1));
      console.warn(`Delete failed on table ${tableName} for id ${id}:`, errMsg);
      if (err1?.code === '42501' || errMsg.toLowerCase().includes('row-level security') || errMsg.toLowerCase().includes('policy')) {
        setRlsWarning(`Supabase RLS Error: Row Level Security is active on table "${tableName}". Delete is blocked. Please run the SQL setup script in Admin Settings.`);
      }
    } catch (err) {
      console.warn(`Exception during smartDelete on ${tableName}:`, err);
    }
    return false;
  };

  // Resilient Smart Upsert, Update & Insert Helper for Supabase
  const smartUpsert = async (
    tableName: string,
    primaryPayload: Record<string, any>,
    fallbackPayloads: Record<string, any>[] = []
  ): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn(`[Supabase] Client not initialized. Cannot save to "${tableName}".`);
      return false;
    }

    const payloadsToTry = [primaryPayload, ...fallbackPayloads];

    for (let i = 0; i < payloadsToTry.length; i++) {
      const payload = payloadsToTry[i];
      try {
        // Attempt 1: Upsert with explicit onConflict if id exists
        const upsertOptions = payload.id ? { onConflict: 'id' } : undefined;
        const { error: upsertErr } = await supabase.from(tableName).upsert(payload, upsertOptions);
        if (!upsertErr) {
          console.log(`[Supabase] Successfully upserted record to "${tableName}" (attempt ${i + 1})`);
          setRlsWarning(null);
          return true;
        }

        const errMsg = String(upsertErr.message || JSON.stringify(upsertErr));
        console.warn(`[Supabase] Upsert attempt ${i + 1} on "${tableName}" failed:`, errMsg);

        if (upsertErr.code === '42501' || errMsg.toLowerCase().includes('row-level security') || errMsg.toLowerCase().includes('policy')) {
          setRlsWarning(`Supabase RLS Error: Row Level Security is active on table "${tableName}". Writes are blocked. Please run the SQL setup script in Admin Settings.`);
        }

        // Attempt 2: Direct Update if id or order_number exists
        if (payload.id) {
          const { error: updateErr } = await supabase.from(tableName).update(payload).eq('id', payload.id);
          if (!updateErr) {
            console.log(`[Supabase] Successfully updated record in "${tableName}" by id ${payload.id}`);
            setRlsWarning(null);
            return true;
          }
        }
        if (payload.order_number) {
          const { error: updateErr2 } = await supabase.from(tableName).update(payload).eq('order_number', payload.order_number);
          if (!updateErr2) {
            console.log(`[Supabase] Successfully updated record in "${tableName}" by order_number ${payload.order_number}`);
            setRlsWarning(null);
            return true;
          }
        }

        // Attempt 3: Direct Insert fallback
        const { error: insertErr } = await supabase.from(tableName).insert(payload);
        if (!insertErr) {
          console.log(`[Supabase] Successfully inserted record to "${tableName}" (attempt ${i + 1})`);
          setRlsWarning(null);
          return true;
        }
        console.warn(`[Supabase] Direct insert attempt ${i + 1} on "${tableName}" failed:`, insertErr.message);
      } catch (err) {
        console.warn(`[Supabase] Exception during save on "${tableName}" (attempt ${i + 1}):`, err);
      }
    }
    return false;
  };

  // Customer Actions
  const loginCustomer = (phone: string, name?: string): boolean => {
    const cleaned = phone.trim();
    if (!cleaned) return false;

    let profile = customerProfiles[cleaned];

    // Search in orders if not found in profiles dictionary
    if (!profile) {
      const existingOrder = orders.find((o) => o.customerPhone.trim() === cleaned);
      if (existingOrder) {
        profile = {
          name: existingOrder.customerName,
          phone: cleaned,
          address: existingOrder.shippingAddress
        };
      } else if (name) {
        profile = {
          name: name,
          phone: cleaned,
          address: ''
        };
      } else {
        // Fallback default name using phone
        profile = {
          name: `Customer-${cleaned.slice(-4)}`,
          phone: cleaned,
          address: ''
        };
      }
    }

    setCustomerUser(profile);
    setCustomerProfiles((prev) => ({ ...prev, [cleaned]: profile }));
    return true;
  };

  const logoutCustomer = () => {
    setCustomerUser(null);
    if (activeClientPage === 'customer-profile') {
      setActiveClientPage('home');
    }
  };

  const updateCustomerProfile = (name: string, address: string) => {
    if (!customerUser) return;
    const updated: CustomerProfile = {
      ...customerUser,
      name,
      address
    };
    setCustomerUser(updated);
    setCustomerProfiles((prev) => ({ ...prev, [updated.phone]: updated }));

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('customer_profiles').upsert({
        phone: updated.phone,
        name: updated.name,
        address: updated.address,
        data: updated
      }).then(({ error }) => {
        if (error && supabase) {
          supabase.from('customer_profiles').upsert({ phone: updated.phone, data: updated }).then();
        }
      });
    }
  };

  // Supabase Data Refresh Function (Optimized Tiered Strategy)
  const isFetchingRef = React.useRef(false);
  const lastFetchTimeRef = React.useRef(0);

  const refreshSupabaseData = async (options?: { full?: boolean; force?: boolean }) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsDataLoading(false);
      setDataError('সুপাবেস কানেকশন সেটআপ করা নেই।');
      return;
    }

    const now = Date.now();
    // Prevent overlapping concurrent requests unless forced
    if (isFetchingRef.current && !options?.force) {
      return;
    }
    // Throttle duplicate requests within 1.5 seconds unless forced
    if (!options?.force && now - lastFetchTimeRef.current < 1500) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    const isSessionAdmin = typeof window !== 'undefined' && sessionStorage.getItem('kinomart_admin_auth') === 'true';
    const shouldFetchFull = Boolean(options?.full || isAdminLoggedIn || isSessionAdmin || viewMode === 'admin');

    try {
      const isInitialFetch = !options?.force && isDataLoading;
      const { products: preloadProds, categories: preloadCats, settings: preloadStg } = isInitialFetch 
        ? consumePreloadPromises() 
        : { products: null, categories: null, settings: null };

      // 1. Independent Streaming Products Query
      const prodsPromise = Promise.resolve(preloadProds || supabase.from('products').select('*'))
        .then(res => {
          if (!res.error && Array.isArray(res.data)) {
            const prods = res.data;
            const fetchedProducts = prods.map(r => {
              const dataObj = safeParseJson(r.data);
              const rawStatus = dataObj.status || r.status;
              return {
                ...dataObj,
                id: String(r.id || dataObj.id),
                name: String(dataObj.name || r.name || ''),
                price: Number(dataObj.price ?? r.price ?? 0),
                discountPrice: dataObj.discountPrice !== undefined ? Number(dataObj.discountPrice) : undefined,
                category: String(dataObj.category || r.category || 'গ্যাজেট'),
                subCategory: String(dataObj.subCategory || r.sub_category || r.subCategory || r.subcategory || ''),
                stock: Number(dataObj.stock ?? r.stock ?? 0),
                limitedStockThreshold: Number(dataObj.limitedStockThreshold ?? 10),
                colors: Array.isArray(dataObj.colors) ? dataObj.colors : ['BLACK'],
                thumbnail: dataObj.thumbnail || r.thumbnail || (Array.isArray(dataObj.gallery) && dataObj.gallery[0]) || '',
                gallery: Array.isArray(dataObj.gallery) ? dataObj.gallery : [],
                videoUrl: dataObj.videoUrl || '',
                shortDescription: dataObj.shortDescription || '',
                longDescription: dataObj.longDescription || '',
                specifications: Array.isArray(dataObj.specifications) ? dataObj.specifications : [],
                bundles: Array.isArray(dataObj.bundles) ? dataObj.bundles : [],
                hasTimer: Boolean(dataObj.hasTimer ?? false),
                isBestSeller: Boolean(dataObj.isBestSeller ?? false),
                isFeatured: Boolean(dataObj.isFeatured ?? false),
                rating: Number(dataObj.rating ?? 5.0),
                reviewsCount: Number(dataObj.reviewsCount ?? 1),
                status: (rawStatus === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE'
              } as Product;
            });
            setProducts(fetchedProducts);
            safeSetStorage('kinomart_products', fetchedProducts);
            setIsDataLoading(false);

            // Preload top product thumbnails in browser cache for instantaneous render
            if (typeof window !== 'undefined' && fetchedProducts.length > 0) {
              setTimeout(() => {
                fetchedProducts.slice(0, 8).forEach(p => {
                  const url = p.thumbnail || p.gallery?.[0];
                  if (url) {
                    const img = new Image();
                    img.src = url;
                  }
                });
              }, 20);
            }
          }
        })
        .catch(err => {
          console.warn('Error fetching products:', err);
        });

      // 2. Independent Streaming Categories Query
      const catsPromise = Promise.resolve(preloadCats || supabase.from('categories').select('*'))
        .then(res => {
          if (!res.error && Array.isArray(res.data)) {
            const cats = res.data;
            const fetchedCats = cats.map(r => {
              const dataObj = safeParseJson(r.data);
              const dataSub = dataObj.subCategories;
              const colSub = r.sub_categories ?? r.subCategories ?? r.subcategories;
              let rawSub: any = dataSub || colSub;

              let parsedSub: string[] = [];
              if (Array.isArray(rawSub)) {
                parsedSub = rawSub.map(s => String(s).trim()).filter(Boolean);
              } else if (typeof rawSub === 'string') {
                try {
                  const p = JSON.parse(rawSub);
                  if (Array.isArray(p)) {
                    parsedSub = p.map(s => String(s).trim()).filter(Boolean);
                  }
                } catch {
                  parsedSub = [];
                }
              }

              return {
                ...dataObj,
                id: String(r.id || dataObj.id),
                name: String(dataObj.name || r.name || ''),
                image: dataObj.image || r.image || '',
                position: Number(dataObj.position ?? r.position ?? 1),
                isVisibleOnHome: Boolean(dataObj.isVisibleOnHome ?? r.is_visible_on_home ?? true),
                subCategories: parsedSub
              } as Category;
            });
            setCategories(fetchedCats);
            safeSetStorage('kinomart_categories', fetchedCats);
          }
        })
        .catch(err => {
          console.warn('Error fetching categories:', err);
        });

      // 3. Independent Streaming Settings & Hero Banner Query
      const stgPromise = Promise.resolve(preloadStg || supabase.from('settings').select('*'))
        .then(res => {
          if (!res.error && Array.isArray(res.data) && res.data.length > 0) {
            res.data.forEach((r: any) => {
              const parsed = safeParseJson(r.data);
              if (!parsed) return;

              if (r.id === 'hero_slides' && Array.isArray(parsed)) {
                setHeroSlides(parsed as HeroSlide[]);
                safeSetStorage('kinomart_hero_slides', parsed);
                // Preload hero slide images immediately
                if (typeof window !== 'undefined') {
                  parsed.forEach((s: any) => {
                    if (s.image) {
                      const img = new Image();
                      img.src = s.image;
                    }
                  });
                }
              } else if (r.id === 'promo_banner' && typeof parsed === 'object') {
                setPromoBanner(parsed as PromoBannerConfig);
                safeSetStorage('kinomart_promo_banner', parsed);
              } else if (typeof parsed === 'object') {
                if (Array.isArray(parsed.heroSlides)) {
                  setHeroSlides(parsed.heroSlides as HeroSlide[]);
                  safeSetStorage('kinomart_hero_slides', parsed.heroSlides);
                }
                if (parsed.promoBanner && typeof parsed.promoBanner === 'object') {
                  setPromoBanner(parsed.promoBanner as PromoBannerConfig);
                  safeSetStorage('kinomart_promo_banner', parsed.promoBanner);
                }
                setSettings(prev => {
                  const merged = { ...prev, ...parsed };
                  safeSetStorage('kinomart_settings', merged);
                  return merged;
                });
              }
            });
          }
        })
        .catch(err => {
          console.warn('Error fetching settings:', err);
        });

      // Wait for all critical tier queries to finish settling
      await Promise.allSettled([prodsPromise, catsPromise, stgPromise]);

      // Immediate UI unblock
      setIsDataLoading(false);
      setDataError(null);

      // Process Tier 2: Deferred / Admin Data (Only fetch when in admin mode or explicitly requested)
      const secondaryPromises = shouldFetchFull
        ? [
            supabase.from('coupons').select('*'),
            supabase.from('team').select('*'),
            supabase.from('orders').select('*'),
            supabase.from('customer_profiles').select('*')
          ]
        : [];

      if (secondaryPromises.length > 0) {
        const [cpnRes, tmRes, ordsRes, profsRes] = await Promise.allSettled(secondaryPromises);

        // 4. Coupons
        if (cpnRes && cpnRes.status === 'fulfilled' && !cpnRes.value.error && Array.isArray(cpnRes.value.data)) {
          const cpn = cpnRes.value.data;
          const fetchedCoupons = cpn.map(r => {
            const dataObj = safeParseJson(r.data);
            return {
              ...dataObj,
              id: String(r.id || dataObj.id),
              code: String(dataObj.code || r.code || ''),
              type: (dataObj.type || r.discount_type || 'FIXED') as 'PERCENTAGE' | 'FIXED',
              value: Number(dataObj.value ?? r.discount_amount ?? 0),
              minOrderAmount: dataObj.minOrderAmount,
              isActive: Boolean(dataObj.isActive ?? true)
            } as Coupon;
          });
          setCoupons(fetchedCoupons);
        }

        // 5. Team
        if (tmRes && tmRes.status === 'fulfilled' && !tmRes.value.error && Array.isArray(tmRes.value.data)) {
          const tm = tmRes.value.data;
          const fetchedTeam = tm.map(r => {
            const dataObj = safeParseJson(r.data);
            return {
              ...dataObj,
              id: String(r.id || dataObj.id),
              name: String(dataObj.name || r.name || ''),
              role: String(dataObj.role || r.role || ''),
              image: dataObj.image || '',
              phone: dataObj.phone || '',
              email: dataObj.email || ''
            } as TeamMember;
          });
          setTeam(fetchedTeam);
        }

        // 6. Orders
        if (ordsRes && ordsRes.status === 'fulfilled' && !ordsRes.value.error && Array.isArray(ordsRes.value.data)) {
          const ords = ordsRes.value.data;
          const fetchedOrders = ords.map(r => {
            const dataObj = safeParseJson(r.data);
            
            // Prioritize updated values from dataObj or non-default column values
            const statusVal = (dataObj.status && dataObj.status !== 'Pending')
              ? dataObj.status
              : (r.status && r.status !== 'Pending')
              ? r.status
              : (dataObj.status || r.status || 'Pending');

            const callStatusVal = (dataObj.callStatus && dataObj.callStatus !== 'Not Called')
              ? dataObj.callStatus
              : (dataObj.call_status && dataObj.call_status !== 'Not Called')
              ? dataObj.call_status
              : (r.call_status && r.call_status !== 'Not Called')
              ? r.call_status
              : (r.callStatus && r.callStatus !== 'Not Called')
              ? r.callStatus
              : (dataObj.callStatus || dataObj.call_status || r.call_status || r.callStatus || 'Not Called');

            return {
              ...dataObj,
              id: String(r.id || dataObj.id),
              orderNumber: String(r.order_number || dataObj.orderNumber || r.orderNumber || r.id),
              customerName: String(r.customer_name || dataObj.customerName || r.customerName || ''),
              customerPhone: String(r.customer_phone || dataObj.customerPhone || r.customerPhone || ''),
              shippingAddress: String(r.shipping_address || dataObj.shippingAddress || ''),
              deliveryArea: dataObj.deliveryArea || 'Inside Dhaka',
              deliveryFee: Number(dataObj.deliveryFee ?? 0),
              paymentMethod: dataObj.paymentMethod || 'COD',
              items: Array.isArray(dataObj.items) ? dataObj.items : [],
              subtotal: Number(dataObj.subtotal ?? 0),
              discount: Number(dataObj.discount ?? 0),
              totalPrice: Number(r.total_price ?? dataObj.totalPrice ?? 0),
              status: statusVal as Order['status'],
              callStatus: callStatusVal as Order['callStatus'],
              notes: dataObj.notes !== undefined ? dataObj.notes : (r.notes || ''),
              createdAt: r.created_at || dataObj.createdAt || new Date().toISOString()
            } as Order;
          });

          const parseTime = (ord: Order) => {
            if (ord.id && ord.id.startsWith('ord-')) {
              const num = Number(ord.id.replace('ord-', ''));
              if (!isNaN(num) && num > 1000000) return num;
            }
            if (ord.createdAt) {
              const parsed = Date.parse(ord.createdAt);
              if (!isNaN(parsed)) return parsed;
            }
            return 0;
          };

          setOrders(prevLocalOrders => {
            const fetchedMap = new Map<string, Order>();
            fetchedOrders.forEach(o => {
              if (o.id) fetchedMap.set(o.id, o);
              if (o.orderNumber) fetchedMap.set(o.orderNumber, o);
            });

            // Map through fetched orders and retain local changes if they are more recent / non-default
            const merged = fetchedOrders.map(fetchedOrd => {
              const localMatch = prevLocalOrders.find(l => 
                (l.id && l.id === fetchedOrd.id) || 
                (l.orderNumber && l.orderNumber === fetchedOrd.orderNumber)
              );
              if (localMatch) {
                const finalStatus = (localMatch.status && localMatch.status !== 'Pending' && fetchedOrd.status === 'Pending')
                  ? localMatch.status
                  : fetchedOrd.status;
                const finalCallStatus = (localMatch.callStatus && localMatch.callStatus !== 'Not Called' && fetchedOrd.callStatus === 'Not Called')
                  ? localMatch.callStatus
                  : fetchedOrd.callStatus;
                const finalNotes = localMatch.notes || fetchedOrd.notes || '';

                return {
                  ...fetchedOrd,
                  ...localMatch,
                  status: finalStatus,
                  callStatus: finalCallStatus,
                  notes: finalNotes
                };
              }
              return fetchedOrd;
            });

            // Add local orders that are not in fetchedOrders at all (e.g. freshly created)
            prevLocalOrders.forEach(localOrd => {
              const hasById = localOrd.id && fetchedMap.has(localOrd.id);
              const hasByNum = localOrd.orderNumber && fetchedMap.has(localOrd.orderNumber);
              if (!hasById && !hasByNum) {
                merged.push(localOrd);
              }
            });

            merged.sort((a, b) => parseTime(b) - parseTime(a));
            safeSetStorage('kinomart_orders', merged);
            return merged;
          });
        }

        // 7. Customer Profiles
        if (profsRes && profsRes.status === 'fulfilled' && !profsRes.value.error && profsRes.value.data) {
          const profs = profsRes.value.data;
          setCustomerProfiles(prev => {
            const map: Record<string, CustomerProfile> = { ...prev };
            profs.forEach(p => {
              const dataObj = safeParseJson(p.data);
              const phone = String(p.phone || dataObj.phone || '');
              if (phone) {
                map[phone] = {
                  name: dataObj.name || p.name || prev[phone]?.name || '',
                  phone: phone,
                  address: dataObj.address || p.address || prev[phone]?.address || ''
                };
              }
            });
            safeSetStorage('kinomart_customer_profiles', map);
            return map;
          });
        }
      }
    } catch (e: any) {
      console.warn('Error refreshing Supabase data:', e);
      setDataError(e?.message || 'সুপাবেস ডাটাবেস থেকে তথ্য লোড করতে ত্রুটি ঘটেছে।');
    } finally {
      isFetchingRef.current = false;
      setIsDataLoading(false);
    }
  };

  // Auto sync credentials from settings if provided
  useEffect(() => {
    if (settings.supabaseUrl || settings.supabaseKey) {
      setSupabaseCredentials(settings.supabaseUrl || '', settings.supabaseKey || '');
    }
  }, [settings.supabaseUrl, settings.supabaseKey]);

  // Auto initialize GTM, GA4, and Meta Pixel if configured
  useEffect(() => {
    if (settings.gtmId) {
      injectGTM(settings.gtmId);
    }
    if (settings.gaMeasurementId) {
      injectGA4(settings.gaMeasurementId);
    }
    if (settings.facebookPixelId) {
      injectMetaPixel(settings.facebookPixelId);
    }
  }, [settings.gtmId, settings.gaMeasurementId, settings.facebookPixelId]);

  // Initial Fetch & Real-time Auto-Sync across devices
  useEffect(() => {
    const isSessionAdmin = typeof window !== 'undefined' && sessionStorage.getItem('kinomart_admin_auth') === 'true';
    // Immediate Fast-Path Initial Load
    refreshSupabaseData({ full: isAdminLoggedIn || isSessionAdmin, force: true });

    // Cross-tab broadcast receiver for instantaneous UI sync
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('kinomart_sync_channel');
        bc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'PRODUCTS_MUTATION' && Array.isArray(payload)) {
            setProducts(payload);
          } else if (type === 'CATEGORIES_MUTATION' && Array.isArray(payload)) {
            setCategories(payload);
          } else if (type === 'SETTINGS_MUTATION' && typeof payload === 'object') {
            setSettings(prev => ({ ...prev, ...payload }));
          } else if (type === 'HERO_SLIDES_MUTATION' && Array.isArray(payload)) {
            setHeroSlides(payload as HeroSlide[]);
          } else if (type === 'PROMO_BANNER_MUTATION' && typeof payload === 'object') {
            setPromoBanner(payload as PromoBannerConfig);
          } else if (type === 'ORDERS_MUTATION' && Array.isArray(payload)) {
            setOrders(payload);
          }
        };
      }
    } catch {
      // Ignore
    }

    // Multi-tab cross-synchronization listener (StorageEvent fallback)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'kinomart_products' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) setProducts(updated);
        } catch {
          // Ignore parse errors
        }
      }
      if (e.key === 'kinomart_orders' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) setOrders(updated);
        } catch {
          // Ignore parse errors
        }
      }
      if (e.key === 'kinomart_categories' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) setCategories(updated);
        } catch {
          // Ignore parse errors
        }
      }
      if (e.key === 'kinomart_settings' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (updated && typeof updated === 'object') setSettings(updated);
        } catch {
          // Ignore parse errors
        }
      }
      if (e.key === 'kinomart_hero_slides' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) setHeroSlides(updated);
        } catch {
          // Ignore parse errors
        }
      }
      if (e.key === 'kinomart_promo_banner' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (updated && typeof updated === 'object') setPromoBanner(updated);
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // Window focus refresh (only if stale > 30s)
    const handleFocus = () => {
      if (Date.now() - lastFetchTimeRef.current > 30000) {
        refreshSupabaseData({ full: isAdminLoggedIn || isSessionAdmin });
      }
    };
    window.addEventListener('focus', handleFocus);

    // Low-frequency gentle background fallback sync (every 30s)
    const interval = setInterval(() => {
      refreshSupabaseData({ full: isAdminLoggedIn || isSessionAdmin });
    }, 30000);

    // Real-time Postgres Changes via Supabase Channel
    let channel: any;
    const client = getSupabaseClient();
    if (client) {
      try {
        channel = client.channel('store-live-updates')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            refreshSupabaseData({ full: false, force: true });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
            refreshSupabaseData({ full: false, force: true });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
            refreshSupabaseData({ full: false, force: true });
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            refreshSupabaseData({ full: true, force: true });
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime channel subscription error:', err);
      }
    }

    return () => {
      clearInterval(interval);
      if (bc) {
        try { bc.close(); } catch {}
      }
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('focus', handleFocus);
      const activeClient = getSupabaseClient();
      if (channel && activeClient) {
        activeClient.removeChannel(channel);
      }
    };
  }, [isAdminLoggedIn]);

  // Admin Auth
  const loginAdmin = (username: string, pass: string): boolean => {
    if (username === settings.adminUsername && pass === settings.adminPasswordHash) {
      setIsAdminLoggedIn(true);
      try {
        sessionStorage.setItem('kinomart_admin_auth', 'true');
      } catch (e) {
        console.error(e);
      }
      setViewMode('admin');
      setIsAdminModalOpen(false);
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin')) {
        window.history.pushState({}, '', '/admin');
      }
      // Immediately fetch all latest DB records (including orders) upon admin login
      refreshSupabaseData({ full: true, force: true });
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    try {
      sessionStorage.removeItem('kinomart_admin_auth');
    } catch (e) {
      console.error(e);
    }
    setViewMode('client');
    setIsAdminModalOpen(false);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  // Order Operations
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'status' | 'callStatus'>): Order => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderNum = `KM-${randomNum}`;
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      status: 'Pending',
      callStatus: 'Not Called',
      createdAt: dateStr
    };

    // Update stock levels locally & in Supabase
    orderData.items.forEach((item: OrderItem) => {
      setProducts(prev =>
        prev.map(p => {
          if (p.id === item.product.id) {
            const updatedP = { ...p, stock: Math.max(0, p.stock - item.quantity) };
            smartUpsert('products', {
              id: updatedP.id,
              name: updatedP.name,
              category: updatedP.category,
              sub_category: updatedP.subCategory,
              price: updatedP.price,
              stock: updatedP.stock,
              data: updatedP
            }, [
              { id: updatedP.id, name: updatedP.name, category: updatedP.category, price: updatedP.price, stock: updatedP.stock, data: updatedP },
              { id: updatedP.id, data: updatedP },
              { id: updatedP.id, name: updatedP.name, price: updatedP.price, stock: updatedP.stock }
            ]);
            return updatedP;
          }
          return p;
        })
      );
    });

    // Auto create & login customer profile
    const phoneKey = orderData.customerPhone.trim();
    if (phoneKey) {
      const autoProfile: CustomerProfile = {
        name: orderData.customerName,
        phone: phoneKey,
        address: orderData.shippingAddress
      };
      setCustomerUser(autoProfile);
      setCustomerProfiles((prev) => ({ ...prev, [phoneKey]: autoProfile }));
      smartUpsert('customer_profiles', {
        phone: autoProfile.phone,
        name: autoProfile.name,
        address: autoProfile.address,
        data: autoProfile
      }, [
        { phone: autoProfile.phone, data: autoProfile },
        { phone: autoProfile.phone, name: autoProfile.name, address: autoProfile.address }
      ]);
    }

    setOrders(prev => {
      const updated = [newOrder, ...prev.filter(o => o.id !== newOrder.id && o.orderNumber !== newOrder.orderNumber)];
      safeSetStorage('kinomart_orders', updated);
      broadcastSync('ORDERS_MUTATION', updated);
      return updated;
    });
    setCompletedOrder(newOrder);
    setIsQuickOrderOpen(false);
    setQuickOrderProduct(null);
    setSelectedProduct(null);
    
    if (viewMode === 'client') {
      setActiveClientPage('order-success');
    }

    // Fire dataLayer purchase event
    trackPurchase(newOrder);

    // Save order to Supabase asynchronously
    (async () => {
      const cleanOrder: Order = JSON.parse(JSON.stringify(newOrder));
      const primary = {
        id: cleanOrder.id,
        order_number: cleanOrder.orderNumber || '',
        customer_name: cleanOrder.customerName || '',
        customer_phone: cleanOrder.customerPhone || '',
        shipping_address: cleanOrder.shippingAddress || '',
        delivery_area: cleanOrder.deliveryArea || 'Inside Dhaka',
        total_price: Number(cleanOrder.totalPrice || 0),
        status: cleanOrder.status || 'Pending',
        call_status: cleanOrder.callStatus || 'Not Called',
        data: cleanOrder
      };
      const fallbacks = [
        {
          id: cleanOrder.id,
          order_number: cleanOrder.orderNumber || '',
          customer_name: cleanOrder.customerName || '',
          customer_phone: cleanOrder.customerPhone || '',
          total_price: Number(cleanOrder.totalPrice || 0),
          status: cleanOrder.status || 'Pending',
          call_status: cleanOrder.callStatus || 'Not Called',
          data: cleanOrder
        },
        {
          id: cleanOrder.id,
          order_number: cleanOrder.orderNumber || '',
          status: cleanOrder.status || 'Pending',
          data: cleanOrder
        },
        { id: cleanOrder.id, data: cleanOrder },
        { id: cleanOrder.id, order_number: cleanOrder.orderNumber || '', data: cleanOrder }
      ];

      await smartUpsert('orders', primary, fallbacks);
    })();

    window.scrollTo({ top: 0, behavior: 'smooth' });
    return newOrder;
  };

  const updateOrderStatus = async (
    orderId: string,
    status: Order['status'],
    callStatus?: Order['callStatus'],
    customSmsMsg?: string,
    sendSms: boolean = true,
    notes?: string
  ): Promise<boolean> => {
    // 1. Locate the existing order synchronously from current state
    const currentOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    // 2. Build the updated order object with exact status, callStatus, notes & data
    const updatedOrder: Order = currentOrder
      ? {
          ...currentOrder,
          status: status || currentOrder.status,
          callStatus: callStatus !== undefined ? callStatus : currentOrder.callStatus,
          notes: notes !== undefined ? notes : currentOrder.notes
        }
      : {
          id: orderId,
          orderNumber: orderId,
          customerName: '',
          customerPhone: '',
          shippingAddress: '',
          deliveryArea: 'Inside Dhaka',
          deliveryFee: 0,
          subtotal: 0,
          discount: 0,
          items: [],
          totalPrice: 0,
          paymentMethod: 'COD',
          status: status || 'Pending',
          callStatus: callStatus || 'Not Called',
          createdAt: new Date().toISOString(),
          notes: notes || ''
        };

    // 3. Update React state, localStorage, and broadcast across tabs
    setOrders((prev) => {
      const exists = prev.some((o) => o.id === orderId || o.orderNumber === orderId);
      const updated = exists
        ? prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? updatedOrder : o))
        : [updatedOrder, ...prev];
      safeSetStorage('kinomart_orders', updated);
      broadcastSync('ORDERS_MUTATION', updated);
      return updated;
    });

    // 4. Send SMS if requested
    if (sendSms) {
      triggerMockSMS(updatedOrder, customSmsMsg);
    }

    // 5. Persist to Supabase Database with full multi-strategy resilience
    const cleanOrd: Order = JSON.parse(JSON.stringify(updatedOrder));
    const targetId = String(cleanOrd.id || orderId || '').trim();
    const targetOrderNumber = String(cleanOrd.orderNumber || orderId || '').trim();

    const primaryPayload: Record<string, any> = {
      status: cleanOrd.status || 'Pending',
      call_status: cleanOrd.callStatus || 'Not Called',
      data: cleanOrd
    };

    if (targetId) primaryPayload.id = targetId;
    if (targetOrderNumber) primaryPayload.order_number = targetOrderNumber;
    if (cleanOrd.customerName) primaryPayload.customer_name = cleanOrd.customerName;
    if (cleanOrd.customerPhone) primaryPayload.customer_phone = cleanOrd.customerPhone;
    if (cleanOrd.shippingAddress) primaryPayload.shipping_address = cleanOrd.shippingAddress;
    if (cleanOrd.deliveryArea) primaryPayload.delivery_area = cleanOrd.deliveryArea;
    if (cleanOrd.totalPrice !== undefined) primaryPayload.total_price = Number(cleanOrd.totalPrice || 0);

    const fallbackPayloads = [
      {
        id: targetId,
        order_number: targetOrderNumber,
        status: cleanOrd.status || 'Pending',
        call_status: cleanOrd.callStatus || 'Not Called',
        data: cleanOrd
      },
      {
        status: cleanOrd.status || 'Pending',
        call_status: cleanOrd.callStatus || 'Not Called',
        data: cleanOrd
      },
      {
        status: cleanOrd.status || 'Pending',
        call_status: cleanOrd.callStatus || 'Not Called'
      },
      {
        status: cleanOrd.status || 'Pending'
      },
      {
        call_status: cleanOrd.callStatus || 'Not Called'
      },
      {
        data: cleanOrd
      }
    ];

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        console.log(`[Supabase] Updating order status & call status in Supabase:`, { 
          id: targetId, 
          orderNumber: targetOrderNumber, 
          status: cleanOrd.status, 
          callStatus: cleanOrd.callStatus 
        });

        let updatedInDb = false;
        let lastErrorMsg = '';

        // Payloads to try for updating status and call_status
        const updatePayloads = [
          { status: cleanOrd.status, call_status: cleanOrd.callStatus, data: cleanOrd },
          { status: cleanOrd.status, call_status: cleanOrd.callStatus },
          { status: cleanOrd.status, callStatus: cleanOrd.callStatus, data: cleanOrd },
          { status: cleanOrd.status, callStatus: cleanOrd.callStatus },
          { status: cleanOrd.status, data: cleanOrd },
          { status: cleanOrd.status },
          { call_status: cleanOrd.callStatus },
          { data: cleanOrd }
        ];

        // Step A: Find existing matching row ID directly from Supabase DB to get exact primary key
        let matchedDbId: any = null;
        try {
          const { data: foundRows, error: searchErr } = await supabase
            .from('orders')
            .select('*')
            .limit(20);

          if (!searchErr && Array.isArray(foundRows) && foundRows.length > 0) {
            const matched = foundRows.find((r: any) => {
              const rId = String(r.id || '').trim();
              const rNum = String(r.order_number || r.orderNumber || '').trim();
              const rPhone = String(r.customer_phone || r.customerPhone || '').trim();
              const rData = safeParseJson(r.data);

              return (
                (targetId && rId === targetId) ||
                (targetOrderNumber && rNum === targetOrderNumber) ||
                (targetOrderNumber && rId === targetOrderNumber) ||
                (targetId && rNum === targetId) ||
                (rData.id && String(rData.id) === targetId) ||
                (rData.orderNumber && String(rData.orderNumber) === targetOrderNumber) ||
                (cleanOrd.customerPhone && rPhone && rPhone === cleanOrd.customerPhone.trim())
              );
            });

            if (matched) {
              matchedDbId = matched.id;
              console.log(`[Supabase] Found matching DB row with exact id:`, matchedDbId);
            }
          }
        } catch (sErr) {
          console.warn(`[Supabase] Order lookup search note:`, sErr);
        }

        // Step B: Update using exact matchedDbId if found
        if (matchedDbId !== null && matchedDbId !== undefined) {
          for (const p of updatePayloads) {
            const { error: errMatch, count } = await supabase
              .from('orders')
              .update(p, { count: 'exact' })
              .eq('id', matchedDbId);

            if (!errMatch) {
              if (count === null || count > 0) {
                updatedInDb = true;
                console.log(`[Supabase] Successfully updated order via matchedDbId ${matchedDbId}`);
                setRlsWarning(null);
                break;
              }
            } else {
              lastErrorMsg = errMatch.message;
              if (errMatch.code === '42501' || errMatch.message.toLowerCase().includes('row-level security') || errMatch.message.toLowerCase().includes('policy')) {
                setRlsWarning(`Supabase RLS Error: Row Level Security is blocking UPDATE on "orders" table. Please run the SQL fix script.`);
              }
            }
          }
        }

        // Step C: If not updated yet, try updating by targetId (as string and as number)
        if (!updatedInDb && targetId) {
          for (const p of updatePayloads) {
            const { error: errId, count } = await supabase
              .from('orders')
              .update(p, { count: 'exact' })
              .eq('id', targetId);

            if (!errId && (count === null || count > 0)) {
              updatedInDb = true;
              console.log(`[Supabase] Successfully updated order status by string id ${targetId}`);
              setRlsWarning(null);
              break;
            }

            const numId = Number(targetId);
            if (!isNaN(numId)) {
              const { error: errNumId, count: countNum } = await supabase
                .from('orders')
                .update(p, { count: 'exact' })
                .eq('id', numId);

              if (!errNumId && (countNum === null || countNum > 0)) {
                updatedInDb = true;
                console.log(`[Supabase] Successfully updated order status by numeric id ${numId}`);
                setRlsWarning(null);
                break;
              }
            }
          }
        }

        // Step D: Try updating by order_number
        if (!updatedInDb && targetOrderNumber) {
          for (const p of updatePayloads) {
            const { error: errNum, count } = await supabase
              .from('orders')
              .update(p, { count: 'exact' })
              .eq('order_number', targetOrderNumber);

            if (!errNum && (count === null || count > 0)) {
              updatedInDb = true;
              console.log(`[Supabase] Successfully updated order status by order_number ${targetOrderNumber}`);
              setRlsWarning(null);
              break;
            }
          }
        }

        // Step E: Try updating by matching targetOrderNumber as id or targetId as order_number
        if (!updatedInDb) {
          for (const p of updatePayloads) {
            const { error: errCross, count } = await supabase
              .from('orders')
              .update(p, { count: 'exact' })
              .eq('id', targetOrderNumber);

            if (!errCross && (count === null || count > 0)) {
              updatedInDb = true;
              console.log(`[Supabase] Successfully updated order by cross-id ${targetOrderNumber}`);
              setRlsWarning(null);
              break;
            }
          }
        }

        // Step F: Try updating by customer_phone if unique
        if (!updatedInDb && cleanOrd.customerPhone) {
          for (const p of updatePayloads) {
            const { error: errPhone, count } = await supabase
              .from('orders')
              .update(p, { count: 'exact' })
              .eq('customer_phone', cleanOrd.customerPhone.trim());

            if (!errPhone && (count === null || count > 0)) {
              updatedInDb = true;
              console.log(`[Supabase] Successfully updated order by customer_phone ${cleanOrd.customerPhone}`);
              setRlsWarning(null);
              break;
            }
          }
        }

        // Step G: If direct update didn't find the row, perform resilient upsert so it gets created/saved with the new status
        if (!updatedInDb) {
          console.warn(`[Supabase] Direct update did not match any row. Running resilient upsert with Status = "${cleanOrd.status}", CallStatus = "${cleanOrd.callStatus}"...`);
          const upsertSuccess = await smartUpsert('orders', primaryPayload, fallbackPayloads);
          if (!upsertSuccess && lastErrorMsg) {
            console.error(`[Supabase] Final update failed. Last error:`, lastErrorMsg);
          }
        }
      } catch (err) {
        console.warn(`[Supabase] Exception during direct order update:`, err);
        await smartUpsert('orders', primaryPayload, fallbackPayloads);
      }
    } else {
      await smartUpsert('orders', primaryPayload, fallbackPayloads);
    }

    return true;
  };

  const deleteOrder = async (orderId: string) => {
    setOrders(prev => {
      const updated = prev.filter(o => o.id !== orderId);
      safeSetStorage('kinomart_orders', updated);
      return updated;
    });
    const ok = await smartDelete('orders', orderId);
    if (ok) {
      await refreshSupabaseData({ full: true, force: true });
    }
  };

  // Product CRUD
  const saveProduct = (product: Product) => {
    const cleanProduct: Product = JSON.parse(JSON.stringify(product));

    setProducts(prev => {
      const exists = prev.some(p => p.id === cleanProduct.id);
      let updated: Product[];
      if (exists) {
        updated = prev.map(p => (p.id === cleanProduct.id ? cleanProduct : p));
      } else {
        updated = [cleanProduct, ...prev];
      }
      safeSetStorage('kinomart_products', updated);
      broadcastSync('PRODUCTS_MUTATION', updated);
      return updated;
    });

    (async () => {
      const primary = {
        id: cleanProduct.id,
        name: cleanProduct.name || '',
        category: cleanProduct.category || '',
        sub_category: cleanProduct.subCategory || '',
        price: Number(cleanProduct.price || 0),
        stock: Number(cleanProduct.stock || 0),
        data: cleanProduct
      };

      const fallbacks = [
        {
          id: cleanProduct.id,
          name: cleanProduct.name || '',
          category: cleanProduct.category || '',
          sub_category: cleanProduct.subCategory || '',
          price: Number(cleanProduct.price || 0),
          stock: Number(cleanProduct.stock || 0),
          data: JSON.stringify(cleanProduct)
        },
        {
          id: cleanProduct.id,
          name: cleanProduct.name || '',
          category: cleanProduct.category || '',
          price: Number(cleanProduct.price || 0),
          stock: Number(cleanProduct.stock || 0),
          data: cleanProduct
        },
        {
          id: cleanProduct.id,
          name: cleanProduct.name || '',
          category: cleanProduct.category || '',
          price: Number(cleanProduct.price || 0),
          stock: Number(cleanProduct.stock || 0),
          data: JSON.stringify(cleanProduct)
        },
        {
          id: cleanProduct.id,
          name: cleanProduct.name || '',
          data: cleanProduct
        },
        {
          id: cleanProduct.id,
          name: cleanProduct.name || '',
          data: JSON.stringify(cleanProduct)
        },
        { id: cleanProduct.id, data: cleanProduct },
        { id: cleanProduct.id, data: JSON.stringify(cleanProduct) },
        {
          id: cleanProduct.id,
          name: cleanProduct.name || '',
          category: cleanProduct.category || '',
          price: Number(cleanProduct.price || 0),
          stock: Number(cleanProduct.stock || 0)
        }
      ];

      const ok = await smartUpsert('products', primary, fallbacks);
      if (ok) {
        await refreshSupabaseData({ force: true });
      }
    })();
  };

  const deleteProduct = async (productId: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== productId);
      safeSetStorage('kinomart_products', updated);
      broadcastSync('PRODUCTS_MUTATION', updated);
      return updated;
    });
    const ok = await smartDelete('products', productId);
    if (ok) {
      await refreshSupabaseData({ force: true });
    }
  };

  // Category CRUD
  const saveCategory = async (category: Category) => {
    const rawSubs = Array.isArray(category.subCategories) ? category.subCategories : [];
    const subList = Array.from(new Set(rawSubs.map(s => String(s).trim()).filter(Boolean)));
    
    const cleanCategory: Category = {
      ...category,
      subCategories: subList
    };

    setCategories(prev => {
      const exists = prev.some(c => c.id === cleanCategory.id);
      let updated: Category[];
      if (exists) {
        updated = prev.map(c => (c.id === cleanCategory.id ? cleanCategory : c));
      } else {
        updated = [...prev, cleanCategory];
      }
      safeSetStorage('kinomart_categories', updated);
      broadcastSync('CATEGORIES_MUTATION', updated);
      return updated;
    });

    const primary = {
      id: cleanCategory.id,
      name: cleanCategory.name,
      image: cleanCategory.image || '',
      position: cleanCategory.position ?? 1,
      is_visible_on_home: cleanCategory.isVisibleOnHome ?? true,
      sub_categories: subList,
      data: cleanCategory
    };

    const fallbacks = [
      { id: cleanCategory.id, name: cleanCategory.name, image: cleanCategory.image || '', position: cleanCategory.position ?? 1, is_visible_on_home: cleanCategory.isVisibleOnHome ?? true, sub_categories: subList, data: JSON.stringify(cleanCategory) },
      { id: cleanCategory.id, name: cleanCategory.name, image: cleanCategory.image || '', position: cleanCategory.position ?? 1, is_visible_on_home: cleanCategory.isVisibleOnHome ?? true, sub_categories: JSON.stringify(subList), data: cleanCategory },
      { id: cleanCategory.id, name: cleanCategory.name, image: cleanCategory.image || '', position: cleanCategory.position ?? 1, sub_categories: subList, data: cleanCategory },
      { id: cleanCategory.id, name: cleanCategory.name, image: cleanCategory.image || '', position: cleanCategory.position ?? 1, sub_categories: JSON.stringify(subList), data: JSON.stringify(cleanCategory) },
      { id: cleanCategory.id, name: cleanCategory.name, image: cleanCategory.image || '', data: cleanCategory },
      { id: cleanCategory.id, name: cleanCategory.name, image: cleanCategory.image || '', data: JSON.stringify(cleanCategory) },
      { id: cleanCategory.id, name: cleanCategory.name, data: cleanCategory },
      { id: cleanCategory.id, name: cleanCategory.name, data: JSON.stringify(cleanCategory) },
      { id: cleanCategory.id, data: cleanCategory },
      { id: cleanCategory.id, data: JSON.stringify(cleanCategory) },
      { id: cleanCategory.id, name: cleanCategory.name }
    ];

    const ok = await smartUpsert('categories', primary, fallbacks);
    if (ok) {
      await refreshSupabaseData();
    }
  };

  const deleteCategory = async (categoryId: string) => {
    setCategories(prev => {
      const updated = prev.filter(c => c.id !== categoryId);
      safeSetStorage('kinomart_categories', updated);
      broadcastSync('CATEGORIES_MUTATION', updated);
      return updated;
    });
    const ok = await smartDelete('categories', categoryId);
    if (ok) {
      await refreshSupabaseData();
    }
  };

  // Coupon CRUD
  const saveCoupon = (coupon: Coupon) => {
    const cleanCoupon: Coupon = JSON.parse(JSON.stringify(coupon));

    setCoupons(prev => {
      const exists = prev.some(c => c.id === cleanCoupon.id);
      let updated: Coupon[];
      if (exists) {
        updated = prev.map(c => (c.id === cleanCoupon.id ? cleanCoupon : c));
      } else {
        updated = [...prev, cleanCoupon];
      }
      safeSetStorage('kinomart_coupons', updated);
      return updated;
    });

    (async () => {
      const primary = {
        id: cleanCoupon.id,
        code: cleanCoupon.code || '',
        discount_amount: Number(cleanCoupon.value || 0),
        discount_type: cleanCoupon.type || 'FIXED',
        data: cleanCoupon
      };
      const fallbacks = [
        { id: cleanCoupon.id, code: cleanCoupon.code || '', data: cleanCoupon },
        { id: cleanCoupon.id, code: cleanCoupon.code || '', data: JSON.stringify(cleanCoupon) },
        { id: cleanCoupon.id, data: cleanCoupon },
        { id: cleanCoupon.id, data: JSON.stringify(cleanCoupon) },
        { id: cleanCoupon.id, code: cleanCoupon.code || '', discount_amount: Number(cleanCoupon.value || 0) }
      ];

      const ok = await smartUpsert('coupons', primary, fallbacks);
      if (ok) {
        await refreshSupabaseData();
      }
    })();
  };

  const deleteCoupon = async (couponId: string) => {
    setCoupons(prev => {
      const updated = prev.filter(c => c.id !== couponId);
      safeSetStorage('kinomart_coupons', updated);
      return updated;
    });
    const ok = await smartDelete('coupons', couponId);
    if (ok) {
      await refreshSupabaseData();
    }
  };

  // Team Member CRUD
  const saveTeamMember = (member: TeamMember) => {
    const cleanMember: TeamMember = JSON.parse(JSON.stringify(member));

    setTeam(prev => {
      const exists = prev.some(t => t.id === cleanMember.id);
      let updated: TeamMember[];
      if (exists) {
        updated = prev.map(t => (t.id === cleanMember.id ? cleanMember : t));
      } else {
        updated = [...prev, cleanMember];
      }
      safeSetStorage('kinomart_team', updated);
      return updated;
    });

    (async () => {
      const primary = {
        id: cleanMember.id,
        name: cleanMember.name || '',
        role: cleanMember.role || '',
        data: cleanMember
      };
      const fallbacks = [
        { id: cleanMember.id, data: cleanMember },
        { id: cleanMember.id, data: JSON.stringify(cleanMember) },
        { id: cleanMember.id, name: cleanMember.name || '', role: cleanMember.role || '' }
      ];

      const ok = await smartUpsert('team', primary, fallbacks);
      if (ok) {
        await refreshSupabaseData();
      }
    })();
  };

  const deleteTeamMember = async (memberId: string) => {
    setTeam(prev => {
      const updated = prev.filter(t => t.id !== memberId);
      safeSetStorage('kinomart_team', updated);
      return updated;
    });
    const ok = await smartDelete('team', memberId);
    if (ok) {
      await refreshSupabaseData();
    }
  };

  // Settings
  const saveSettings = (newSettings: StoreSettings) => {
    const cleanSettings: StoreSettings = JSON.parse(JSON.stringify(newSettings));
    setSettings(cleanSettings);
    safeSetStorage('kinomart_settings', cleanSettings);
    broadcastSync('SETTINGS_MUTATION', cleanSettings);

    if (cleanSettings.supabaseUrl || cleanSettings.supabaseKey) {
      setSupabaseCredentials(cleanSettings.supabaseUrl || '', cleanSettings.supabaseKey || '');
    }

    (async () => {
      const primary = {
        id: 'site_settings',
        data: cleanSettings
      };
      const fallbacks = [
        { id: 'site_settings', data: JSON.stringify(cleanSettings) },
        { id: 'site_settings', data: cleanSettings }
      ];

      const ok = await smartUpsert('settings', primary, fallbacks);
      if (ok) {
        await refreshSupabaseData();
      }
    })();
  };

  // Banner / Slider Handlers
  const saveHeroSlide = (slide: HeroSlide) => {
    setHeroSlides(prev => {
      const idx = prev.findIndex(s => String(s.id) === String(slide.id));
      let updated: HeroSlide[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = slide;
      } else {
        updated = [...prev, { ...slide, order: prev.length + 1 }];
      }
      safeSetStorage('kinomart_hero_slides', updated);
      broadcastSync('HERO_SLIDES_MUTATION', updated);

      // Persist to Supabase settings table so all devices and visitors get it immediately
      smartUpsert('settings', { id: 'hero_slides', data: updated }, [
        { id: 'hero_slides', data: JSON.stringify(updated) }
      ]);

      return updated;
    });
  };

  const deleteHeroSlide = (slideId: string | number) => {
    setHeroSlides(prev => {
      const updated = prev.filter(s => String(s.id) !== String(slideId));
      safeSetStorage('kinomart_hero_slides', updated);
      broadcastSync('HERO_SLIDES_MUTATION', updated);

      smartUpsert('settings', { id: 'hero_slides', data: updated }, [
        { id: 'hero_slides', data: JSON.stringify(updated) }
      ]);

      return updated;
    });
  };

  const reorderHeroSlides = (slides: HeroSlide[]) => {
    setHeroSlides(slides);
    safeSetStorage('kinomart_hero_slides', slides);
    broadcastSync('HERO_SLIDES_MUTATION', slides);

    smartUpsert('settings', { id: 'hero_slides', data: slides }, [
      { id: 'hero_slides', data: JSON.stringify(slides) }
    ]);
  };

  const resetHeroSlides = () => {
    setHeroSlides([]);
    safeSetStorage('kinomart_hero_slides', []);
    broadcastSync('HERO_SLIDES_MUTATION', []);

    smartUpsert('settings', { id: 'hero_slides', data: [] }, [
      { id: 'hero_slides', data: JSON.stringify([]) }
    ]);
  };

  const savePromoBanner = (config: PromoBannerConfig) => {
    setPromoBanner(config);
    safeSetStorage('kinomart_promo_banner', config);
    broadcastSync('PROMO_BANNER_MUTATION', config);

    smartUpsert('settings', { id: 'promo_banner', data: config }, [
      { id: 'promo_banner', data: JSON.stringify(config) }
    ]);
  };

  // Validate Coupon
  const validateCoupon = (code: string, subtotal: number) => {
    const cleanCode = code.trim().toUpperCase();
    const found = coupons.find(c => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!found) {
      return { valid: false, discount: 0, message: 'অবৈধ বা মেয়ারোত্তীর্ণ কুপন কোড' };
    }

    if (found.minOrderAmount && subtotal < found.minOrderAmount) {
      return { valid: false, discount: 0, message: `ন্যূনতম ৳${found.minOrderAmount} অর্ডারে কুপনটি প্রযোজ্য` };
    }

    let discount = 0;
    if (found.type === 'PERCENTAGE') {
      discount = Math.round((subtotal * found.value) / 100);
    } else {
      discount = found.value;
    }

    return { valid: true, discount, message: `কুপন সফলভাবে যুক্ত হয়েছে (৳${discount} ছাড়)!` };
  };

  const resetToDefaults = () => {
    setProducts([]);
    setCategories([]);
    setOrders([]);
    setCoupons([]);
    setTeam([]);
    setHeroSlides([]);
    setPromoBanner(INITIAL_PROMO_BANNER);
    setSettings(INITIAL_SETTINGS);
    try {
      localStorage.clear();
    } catch {
      // Ignore
    }
    refreshSupabaseData({ force: true });
  };

  return (
    <StoreContext.Provider
      value={{
        isDataLoading,
        dataError,
        viewMode,
        setViewMode,
        activeClientPage,
        setActiveClientPage,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        selectedProduct,
        setSelectedProduct,
        quickOrderProduct,
        setQuickOrderProduct,
        isQuickOrderOpen,
        setIsQuickOrderOpen,
        completedOrder,
        setCompletedOrder,
        customerUser,
        isCustomerLoginModalOpen,
        setIsCustomerLoginModalOpen,
        loginCustomer,
        logoutCustomer,
        updateCustomerProfile,
        products,
        categories,
        orders,
        coupons,
        team,
        settings,
        heroSlides,
        promoBanner,
        mockSmsLogs,
        latestSmsToast,
        dismissSmsToast,
        triggerMockSMS,
        clearSmsLogs,
        isAdminLoggedIn,
        isAdminAuthenticated,
        isAdminModalOpen,
        setIsAdminModalOpen,
        loginAdmin,
        logoutAdmin,
        activeAdminTab,
        setActiveAdminTab,
        createOrder,
        updateOrderStatus,
        deleteOrder,
        saveProduct,
        deleteProduct,
        saveCategory,
        deleteCategory,
        saveCoupon,
        deleteCoupon,
        saveTeamMember,
        deleteTeamMember,
        saveHeroSlide,
        deleteHeroSlide,
        reorderHeroSlides,
        resetHeroSlides,
        savePromoBanner,
        saveSettings,
        validateCoupon,
        refreshSupabaseData,
        resetToDefaults,
        rlsWarning,
        dismissRlsWarning
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
