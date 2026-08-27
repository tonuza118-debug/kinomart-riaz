import React, { useState, Suspense, lazy } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { HeroSlider } from './components/HeroSlider';
import { ProductCard } from './components/ProductCard';
import { PromoBanner } from './components/PromoBanner';
import { BenefitsGrid } from './components/BenefitsGrid';
import { FloatingContacts } from './components/FloatingContacts';
import { Footer } from './components/Footer';
import { trackPageView, trackViewItemList } from './lib/dataLayer';
import { getProductSlug, findProductBySlugOrId } from './lib/slugUtils';
import { Filter, ShoppingBag, Phone, Mail, MapPin, Sparkles, Flame, ArrowRight } from 'lucide-react';

// Lazy-loaded routes & heavy admin / modal components for instant initial visitor render
const ProductDetailsModal = lazy(() => import('./components/ProductDetailsModal').then(m => ({ default: m.ProductDetailsModal })));
const QuickOrderModal = lazy(() => import('./components/QuickOrderModal').then(m => ({ default: m.QuickOrderModal })));
const OrderSuccessView = lazy(() => import('./components/OrderSuccessView').then(m => ({ default: m.OrderSuccessView })));
const OrderTrackView = lazy(() => import('./components/OrderTrackView').then(m => ({ default: m.OrderTrackView })));
const ContactView = lazy(() => import('./components/ContactView').then(m => ({ default: m.ContactView })));
const AboutView = lazy(() => import('./components/AboutView').then(m => ({ default: m.AboutView })));
const CustomerProfileView = lazy(() => import('./components/CustomerProfileView').then(m => ({ default: m.CustomerProfileView })));
const CustomerLoginModal = lazy(() => import('./components/CustomerLoginModal').then(m => ({ default: m.CustomerLoginModal })));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminLoginModal = lazy(() => import('./components/admin/AdminLoginModal').then(m => ({ default: m.AdminLoginModal })));

const ViewLoadingSpinner = () => (
  <div className="max-w-7xl mx-auto px-4 py-16 text-center">
    <div className="animate-spin w-8 h-8 border-3 border-[#5E7A3B] border-t-transparent rounded-full mx-auto mb-2.5" />
    <p className="text-xs text-gray-500 font-bold">তথ্য লোড হচ্ছে...</p>
  </div>
);

const MainAppContent: React.FC = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    selectedProduct,
    setSelectedProduct,
    quickOrderProduct,
    setQuickOrderProduct,
    activeClientPage,
    setActiveClientPage,
    viewMode,
    setViewMode,
    isAdminAuthenticated,
    isAdminModalOpen,
    setIsAdminModalOpen,
    isCustomerLoginModalOpen,
    setIsCustomerLoginModalOpen,
    settings,
    isDataLoading,
    dataError,
    refreshSupabaseData
  } = useStore();

  const isInitialRouteRef = React.useRef(true);

  React.useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/admin') || hash.includes('admin')) {
        setViewMode('admin');
      } else {
        setViewMode('client');
        if (path.startsWith('/product/')) {
          const param = path.replace('/product/', '').trim();
          const found = findProductBySlugOrId(products, param);
          if (found) {
            setSelectedProduct(found);
            setActiveClientPage('product-detail');
          } else if (products.length > 0 && activeClientPage === 'product-detail') {
            setActiveClientPage('home');
          }
        } else if (path === '/products') {
          setActiveClientPage('products');
        } else if (path === '/about') {
          setActiveClientPage('about');
        } else if (path === '/contact') {
          setActiveClientPage('contact');
        } else if (path === '/order-track') {
          setActiveClientPage('order-track');
        } else if (path === '/order-success') {
          setActiveClientPage('order-success');
        } else if (path === '/customer-profile') {
          setActiveClientPage('customer-profile');
        } else if (path === '/' || path === '') {
          setActiveClientPage('home');
        }
      }
    };

    if (isInitialRouteRef.current) {
      isInitialRouteRef.current = false;
      handleUrlChange();
    } else if (activeClientPage === 'product-detail' && !selectedProduct && window.location.pathname.startsWith('/product/')) {
      handleUrlChange();
    }

    const onPopState = () => handleUrlChange();
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onPopState);
    };
  }, [products, setViewMode, setSelectedProduct, setActiveClientPage, activeClientPage, selectedProduct]);

  // Push state to browser address bar when active view changes
  React.useEffect(() => {
    let targetPath = '/';
    if (viewMode === 'admin') {
      targetPath = '/admin';
    } else if (activeClientPage === 'product-detail' && selectedProduct) {
      const slug = getProductSlug(selectedProduct);
      targetPath = `/product/${encodeURIComponent(slug)}`;
    } else if (activeClientPage === 'products') {
      targetPath = '/products';
    } else if (activeClientPage === 'about') {
      targetPath = '/about';
    } else if (activeClientPage === 'contact') {
      targetPath = '/contact';
    } else if (activeClientPage === 'order-track') {
      targetPath = '/order-track';
    } else if (activeClientPage === 'order-success') {
      targetPath = '/order-success';
    } else if (activeClientPage === 'customer-profile') {
      targetPath = '/customer-profile';
    } else {
      targetPath = '/';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }

    // Trigger GA4 page_view event
    trackPageView(document.title, window.location.href, targetPath);

    // Trigger GA4 view_item_list when on home or products list
    if ((activeClientPage === 'home' || activeClientPage === 'products') && products.length > 0) {
      trackViewItemList(products, activeClientPage === 'home' ? 'Homepage Popular Gadgets' : 'All Products Grid');
    }
  }, [viewMode, activeClientPage, selectedProduct, products]);

  // Scroll to top of window whenever product is selected, view mode changes, or page changes
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [selectedProduct?.id, activeClientPage, viewMode, selectedCategory]);

  // Trigger Admin Login when user searches "admin"
  React.useEffect(() => {
    if (searchQuery.trim().toLowerCase() === 'admin') {
      setViewMode('admin');
      if (!window.location.pathname.includes('/admin')) {
        window.history.pushState({}, '', '/admin');
      }
      setSearchQuery('');
    }
  }, [searchQuery, setViewMode, setSearchQuery]);

  // Dynamically update site title & browser favicon when settings change
  React.useEffect(() => {
    if (settings.websiteTitle) {
      document.title = settings.websiteTitle;
    }

    if (settings.faviconUrl) {
      let iconLink: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.type = 'image/x-icon';
        iconLink.rel = 'shortcut icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = settings.faviconUrl;

      let appleIconLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (!appleIconLink) {
        appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleIconLink);
      }
      appleIconLink.href = settings.faviconUrl;
    }
  }, [settings.faviconUrl, settings.websiteTitle]);

  // Find parent category object if selectedCategory is set (either as category name or subcategory name)
  const activeParentCategory = categories.find((c) => {
    const catName = c.name.trim().toLowerCase();
    const selCat = (selectedCategory || '').trim().toLowerCase();
    if (catName === selCat) return true;
    return c.subCategories?.some((s) => s.trim().toLowerCase() === selCat);
  });

  // Filter products by category & search query
  const displayedProducts = products.filter((product) => {
    const selCat = (selectedCategory || '').trim().toLowerCase();
    const pCat = (product.category || '').trim().toLowerCase();
    const pSubCat = (product.subCategory || '').trim().toLowerCase();

    const matchesCategory =
      !selectedCategory ||
      pCat === selCat ||
      pSubCat === selCat;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      product.name.toLowerCase().includes(q) ||
      pCat.includes(q) ||
      pSubCat.includes(q);

    return matchesCategory && matchesSearch;
  });

  // If in Admin Mode
  if (viewMode === 'admin') {
    if (isAdminAuthenticated) {
      return (
        <Suspense fallback={<ViewLoadingSpinner />}>
          <AdminLayout />
        </Suspense>
      );
    }
    return (
      <div className="min-h-screen bg-[#070C18] text-white flex flex-col items-center justify-center p-4">
        <Suspense fallback={<ViewLoadingSpinner />}>
          <AdminLoginModal
            onClose={() => {
              setIsAdminModalOpen(false);
              setViewMode('client');
              if (window.location.pathname.includes('/admin')) {
                window.history.pushState({}, '', '/');
              }
            }}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1F241E] flex flex-col font-sans selection:bg-[#5E7A3B] selection:text-white">

      {/* Main Header */}
      <Header />

      {/* Main Page Routing Switcher */}
      <main className="flex-1">
        {/* HOME PAGE */}
        {activeClientPage === 'home' && (
          <div className="animate-fadeIn">
            {/* Hero Banner Slider */}
            <HeroSlider />





            {/* Product Section Header */}
            <div className="max-w-7xl mx-auto px-4 my-4">
              <div className="flex flex-wrap items-end justify-between border-b border-[#E8E3D9] pb-2.5 gap-2">
                <div>
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#A85D32] mb-0.5">
                    <Flame className="w-3.5 h-3.5 text-[#E65100] fill-[#FF9800]" />
                    <span>জনপ্রিয় পণ্যসমূহ</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-[#1F241E]">
                    {selectedCategory ? `${selectedCategory} গ্যাজেট` : 'বেস্ট সেলিং গ্যাজেট'}
                  </h2>
                </div>

                {selectedCategory ? (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs sm:text-sm font-bold text-[#5E7A3B] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ✕ ফিল্টার রিমুভ করুন
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const el = document.getElementById('product-grid');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs sm:text-sm font-bold text-[#3B4D28] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>সব দেখুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Subcategories Pills (When category is selected) */}
              {activeParentCategory && activeParentCategory.subCategories && activeParentCategory.subCategories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
                  <span className="text-xs font-extrabold text-[#5E7A3B] shrink-0">সাব-ক্যাটাগরি:</span>
                  <button
                    onClick={() => setSelectedCategory(activeParentCategory.name)}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === activeParentCategory.name
                        ? 'bg-[#5E7A3B] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#2E3B2B] border border-[#E8E3D9] hover:bg-[#EFECE6]'
                    }`}
                  >
                    সকল {activeParentCategory.name}
                  </button>

                  {activeParentCategory.subCategories.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(sub)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedCategory === sub
                          ? 'bg-[#5E7A3B] text-white font-extrabold shadow-2xs'
                          : 'bg-white text-[#4A5343] border border-[#E8E3D9] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {/* Product Cards Grid */}
              {isDataLoading && products.length === 0 ? (
                <div id="product-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div key={n} className="bg-[#FAF9F5] rounded-2xl border-2 border-[#E8E3D9] p-3 flex flex-col justify-between animate-pulse">
                      <div>
                        <div className="w-full aspect-square bg-[#E8E3D9] rounded-xl mb-3" />
                        <div className="space-y-2">
                          <div className="h-3 bg-[#E8E3D9] rounded-md w-1/3" />
                          <div className="h-4 bg-[#E8E3D9] rounded-md w-3/4" />
                          <div className="h-3 bg-[#E8E3D9] rounded-md w-1/2" />
                          <div className="h-5 bg-[#E8E3D9] rounded-md w-2/5 mt-2" />
                        </div>
                      </div>
                      <div className="pt-3">
                        <div className="h-9 bg-[#E8E3D9] rounded-xl w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : dataError && products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-red-200 p-6 my-6">
                  <p className="text-red-600 font-bold text-sm mb-1">ডাটাবেস কানেকশন ত্রুটি</p>
                  <p className="text-gray-500 text-xs mb-4">{dataError}</p>
                  <button onClick={() => refreshSupabaseData()} className="px-5 py-2.5 bg-[#5E7A3B] text-white rounded-xl text-xs font-bold hover:bg-[#4d6530] transition-colors cursor-pointer">
                    পুনরায় চেষ্টা করুন
                  </button>
                </div>
              ) : (
                <>
                  <div id="product-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 mt-6">
                    {displayedProducts.map((product, index) => (
                      <ProductCard key={product.id} product={product} index={index} priority={index < 8} />
                    ))}
                  </div>

                  {displayedProducts.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-3xl border border-[#E8E3D9] my-6">
                      <p className="text-gray-500 text-sm">
                        দুঃখিত! এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি।
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Promotional Banner */}
            <PromoBanner />

            {/* Benefits & Trust Badges Grid */}
            <BenefitsGrid />
          </div>
        )}

        {/* PRODUCT DETAIL PAGE */}
        {activeClientPage === 'product-detail' && (
          selectedProduct ? (
            <Suspense fallback={<ViewLoadingSpinner />}>
              <ProductDetailsModal
                key={selectedProduct.id}
                product={selectedProduct}
              />
            </Suspense>
          ) : isDataLoading ? (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-[#5E7A3B] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-xs text-gray-500 font-bold">প্রোডাক্টের তথ্য লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 py-12 text-center bg-white rounded-3xl border border-[#E8E3D9] my-6">
              <p className="text-gray-500 text-sm font-bold">দুঃখিত! এই প্রোডাক্টটি পাওয়া যায়নি।</p>
              <button onClick={() => setActiveClientPage('home')} className="mt-4 px-4 py-2 bg-[#5E7A3B] text-white rounded-xl text-xs font-bold hover:bg-[#4d6530] transition-colors cursor-pointer">
                হোম পেজে ফিরুন
              </button>
            </div>
          )
        )}

        {/* PRODUCTS PAGE */}
        {activeClientPage === 'products' && (
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
            <div className="border-b border-[#E8E3D9] pb-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black text-[#1F241E]">
                    {selectedCategory ? `${selectedCategory} গ্যাজেট` : 'সব প্রোডাক্টস'}
                  </h1>
                  <p className="text-xs text-[#6B7264]">সকল অরিজিনাল ও গ্যাজেট ক্যাটাগরি</p>
                </div>

                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs sm:text-sm font-bold text-[#5E7A3B] hover:underline cursor-pointer"
                  >
                    ✕ ফিল্টার রিমুভ করুন
                  </button>
                )}
              </div>

              {/* All Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                    !selectedCategory
                      ? 'bg-[#1F241E] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] text-[#2E3B2B] border border-[#E8E3D9] hover:bg-[#EFECE6]'
                  }`}
                >
                  সব গ্যাজেট
                </button>

                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.name || cat.subCategories?.includes(selectedCategory || '');
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[#5E7A3B] text-white shadow-2xs'
                          : 'bg-white text-[#2E3B2B] border border-[#E8E3D9] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>

              {/* Subcategories Pills */}
              {activeParentCategory && activeParentCategory.subCategories && activeParentCategory.subCategories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none bg-[#F8F7F2] p-2.5 rounded-2xl border border-[#E8E3D9]">
                  <span className="text-[11px] font-extrabold text-[#5E7A3B] shrink-0">সাব-ক্যাটাগরি:</span>
                  <button
                    onClick={() => setSelectedCategory(activeParentCategory.name)}
                    className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                      selectedCategory === activeParentCategory.name
                        ? 'bg-[#5E7A3B] text-white shadow-2xs'
                        : 'bg-white text-[#2E3B2B] border border-[#E8E3D9] hover:bg-[#EFECE6]'
                    }`}
                  >
                    সকল {activeParentCategory.name}
                  </button>

                  {activeParentCategory.subCategories.map((sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(sub)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        selectedCategory === sub
                          ? 'bg-[#5E7A3B] text-white font-extrabold shadow-2xs'
                          : 'bg-white text-[#4A5343] border border-[#E8E3D9] hover:bg-[#F2EFE8]'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isDataLoading && products.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="bg-[#FAF9F5] rounded-2xl border-2 border-[#E8E3D9] p-3 flex flex-col justify-between animate-pulse">
                    <div>
                      <div className="w-full aspect-square bg-[#E8E3D9] rounded-xl mb-3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-[#E8E3D9] rounded-md w-1/3" />
                        <div className="h-4 bg-[#E8E3D9] rounded-md w-3/4" />
                        <div className="h-3 bg-[#E8E3D9] rounded-md w-1/2" />
                        <div className="h-5 bg-[#E8E3D9] rounded-md w-2/5 mt-2" />
                      </div>
                    </div>
                    <div className="pt-3">
                      <div className="h-9 bg-[#E8E3D9] rounded-xl w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dataError && products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-red-200 p-6 my-6">
                <p className="text-red-600 font-bold text-sm mb-1">ডাটাবেস কানেকশন ত্রুটি</p>
                <p className="text-gray-500 text-xs mb-4">{dataError}</p>
                <button onClick={() => refreshSupabaseData()} className="px-5 py-2.5 bg-[#5E7A3B] text-white rounded-xl text-xs font-bold hover:bg-[#4d6530] transition-colors cursor-pointer">
                  পুনরায় চেষ্টা করুন
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                  {displayedProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} priority={index < 8} />
                  ))}
                </div>

                {displayedProducts.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-3xl border border-[#E8E3D9] my-6">
                    <p className="text-gray-500 text-sm">
                      দুঃখিত! এই ক্যাটাগরিতে কোনো পণ্য পাওয়া যায়নি।
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ORDER SUCCESS PAGE */}
        {activeClientPage === 'order-success' && (
          <Suspense fallback={<ViewLoadingSpinner />}>
            <OrderSuccessView />
          </Suspense>
        )}

        {/* ORDER TRACK PAGE */}
        {activeClientPage === 'order-track' && (
          <Suspense fallback={<ViewLoadingSpinner />}>
            <OrderTrackView />
          </Suspense>
        )}

        {/* CUSTOMER PROFILE PAGE */}
        {activeClientPage === 'customer-profile' && (
          <Suspense fallback={<ViewLoadingSpinner />}>
            <CustomerProfileView />
          </Suspense>
        )}

        {/* ABOUT US PAGE */}
        {activeClientPage === 'about' && (
          <Suspense fallback={<ViewLoadingSpinner />}>
            <AboutView />
          </Suspense>
        )}

        {/* CONTACT US PAGE */}
        {activeClientPage === 'contact' && (
          <Suspense fallback={<ViewLoadingSpinner />}>
            <ContactView />
          </Suspense>
        )}
      </main>

      {/* Main Footer */}
      <Footer />

      {/* Floating WhatsApp & Call Buttons */}
      <FloatingContacts />

      {/* Customer Login Modal */}
      {isCustomerLoginModalOpen && (
        <Suspense fallback={null}>
          <CustomerLoginModal onClose={() => setIsCustomerLoginModalOpen(false)} />
        </Suspense>
      )}

      {/* Quick Order Modal */}
      {quickOrderProduct && (
        <Suspense fallback={null}>
          <QuickOrderModal
            product={quickOrderProduct}
            onClose={() => setQuickOrderProduct(null)}
          />
        </Suspense>
      )}

      {/* Admin Login Modal */}
      {isAdminModalOpen && (
        <Suspense fallback={null}>
          <AdminLoginModal
            onClose={() => {
              setIsAdminModalOpen(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
};

export default App;
