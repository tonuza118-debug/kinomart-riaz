import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Specification, ProductBundle, Review, ProductFlavor } from '../../types';
import { getDefaultBundles, generateDemoSixTiers, generateRadioCardBundles } from '../../lib/bundleUtils';
import { BundleSelector, RadioCardBundleSection, BannerTableOfferSection } from '../BundleSelector';
import { FlavorSelector } from '../FlavorSelector';
import { processImageForPlaceholder, compressImageFile, isDataUrl, isHttpUrl, processAndUploadImage } from '../../lib/imageUtils';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  Star,
  Layers,
  Upload,
  Video,
  Clock,
  PackageCheck,
  Zap,
  Loader2,
  UploadCloud,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const { products, categories, saveProduct, deleteProduct } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [imageCompressionProgress, setImageCompressionProgress] = useState<string | null>(null);
  const [newOnlineUrl, setNewOnlineUrl] = useState('');

  // Filtered products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImageFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsCompressingImage(true);
    setImageCompressionProgress(`১/${fileList.length} ছবি প্রসেস ও আপলোড হচ্ছে...`);

    try {
      const files = Array.from(fileList);
      const processedImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        setImageCompressionProgress(`${i + 1}/${files.length} ছবি অপ্টিমাইজ ও R2 ক্লাউডে আপলোড হচ্ছে...`);
        const resultUrl = await processAndUploadImage(files[i], 'product_cover', 'products');
        processedImages.push(resultUrl);
      }

      setEditingProduct((prev) => {
        if (!prev) return prev;
        let thumb = prev.thumbnail || '';
        const gallery = [...(prev.gallery || [])];

        for (const img of processedImages) {
          if (!thumb) {
            thumb = img;
          } else {
            gallery.push(img);
          }
        }

        return {
          ...prev,
          thumbnail: thumb,
          gallery
        };
      });
    } catch (err) {
      console.error('Image processing failed:', err);
    } finally {
      setIsCompressingImage(false);
      setImageCompressionProgress(null);
      e.target.value = '';
    }
  };

  const handleReviewImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsCompressingImage(true);
    setImageCompressionProgress('রিভিউ স্ক্রিনশট প্রসেস ও আপলোড হচ্ছে...');

    try {
      const files = Array.from(fileList);
      const processedImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const resultUrl = await processAndUploadImage(files[i], 'review_screenshot', 'reviews');
        processedImages.push(resultUrl);
      }

      setEditingProduct((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          reviewImages: [...(prev.reviewImages || []), ...processedImages]
        };
      });
    } catch (err) {
      console.error('Review image processing failed:', err);
    } finally {
      setIsCompressingImage(false);
      setImageCompressionProgress(null);
      e.target.value = '';
    }
  };

  const handleAddOnlineImageUrl = () => {
    if (!newOnlineUrl.trim() || !editingProduct) return;
    const url = newOnlineUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      alert('সঠিক ইমেজ URL দিন (https://...)');
      return;
    }

    if (!editingProduct.thumbnail) {
      setEditingProduct({ ...editingProduct, thumbnail: url });
    } else {
      setEditingProduct({
        ...editingProduct,
        gallery: [...(editingProduct.gallery || []), url]
      });
    }
    setNewOnlineUrl('');
  };

  const handleOpenAdd = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      price: 1000,
      discountPrice: undefined,
      category: categories[0]?.name || 'গ্যাজেট',
      subCategory: categories[0]?.subCategories[0] || '',
      stock: 10,
      limitedStockThreshold: 10,
      colors: ['BLACK'],
      thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      gallery: [],
      shortDescription: '',
      longDescription: '',
      specifications: [{ key: '', value: '' }],
      bundles: [],
      hasTimer: false,
      isBestSeller: false,
      isFeatured: false,
      rating: 5.0,
      reviewsCount: 1,
      status: 'ACTIVE'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct && editingProduct.name) {
      const validReviews = (editingProduct.reviews || []).filter(
        (r) => r && (r.userName?.trim() || r.comment?.trim())
      );
      const totalCount = validReviews.length > 0 ? validReviews.length : (editingProduct.reviewsCount || 0);
      const avgRating = validReviews.length > 0
        ? Number((validReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / validReviews.length).toFixed(1))
        : (editingProduct.rating || 5.0);

      saveProduct({
        ...editingProduct,
        reviews: validReviews,
        reviewsCount: totalCount,
        rating: avgRating
      } as Product);
      setIsModalOpen(false);
      setEditingProduct(null);
    }
  };

  // Specification row handlers
  const handleAddSpecRow = () => {
    if (editingProduct) {
      const specs = editingProduct.specifications || [];
      setEditingProduct({
        ...editingProduct,
        specifications: [...specs, { key: '', value: '' }]
      });
    }
  };

  const handleUpdateSpecRow = (index: number, key: string, value: string) => {
    if (editingProduct) {
      const specs = [...(editingProduct.specifications || [])];
      specs[index] = { key, value };
      setEditingProduct({ ...editingProduct, specifications: specs });
    }
  };

  const handleRemoveSpecRow = (index: number) => {
    if (editingProduct) {
      const specs = (editingProduct.specifications || []).filter((_, i) => i !== index);
      setEditingProduct({ ...editingProduct, specifications: specs });
    }
  };

  // Bundle package handlers
  const handleGenerateImage1Style = () => {
    if (editingProduct) {
      const price = editingProduct.discountPrice || editingProduct.price || 989;
      const gen = generateRadioCardBundles(price);
      setEditingProduct({
        ...editingProduct,
        bundleStyle: 'radio_cards',
        bundles: gen
      });
    }
  };

  const handleGenerateImage2Style = () => {
    if (editingProduct) {
      const price = editingProduct.discountPrice || editingProduct.price || 850;
      const gen = getDefaultBundles(price);
      setEditingProduct({
        ...editingProduct,
        bundleStyle: 'banner_table',
        bundles: gen,
        bundleBannerSubtitle: editingProduct.bundleBannerSubtitle || 'একসাথে বেশি কিনুন – বেশি সাশ্রয় করুন!',
        bundleBannerTitle: editingProduct.bundleBannerTitle || 'একাধিক পণ্য কিনলে পাবেন বিশেষ ছাড়'
      });
    }
  };

  const handleGenerateDefaultBundles = () => {
    if (editingProduct) {
      const price = editingProduct.discountPrice || editingProduct.price || 1000;
      const gen = getDefaultBundles(price);
      setEditingProduct({
        ...editingProduct,
        bundles: gen
      });
    }
  };

  const handleGenerateSixTiers = () => {
    if (editingProduct) {
      const price = editingProduct.discountPrice || editingProduct.price || 390;
      const gen = generateDemoSixTiers(price);
      setEditingProduct({
        ...editingProduct,
        bundleStyle: 'banner_table',
        bundles: gen,
        bundleBannerSubtitle: editingProduct.bundleBannerSubtitle || 'একসাথে বেশি কিনুন – বেশি সাশ্রয় করুন!',
        bundleBannerTitle: editingProduct.bundleBannerTitle || 'একাধিক ফ্লেভার কিনলে পাবেন বিশেষ ছাড়'
      });
    }
  };

  const handleAddBundleRow = () => {
    if (editingProduct) {
      const bundles = editingProduct.bundles || [];
      const newB: ProductBundle = {
        id: `b-${Date.now()}`,
        title: '1 Pc',
        quantity: 1,
        price: editingProduct.discountPrice || editingProduct.price || 1000,
        originalPrice: Math.round((editingProduct.discountPrice || editingProduct.price || 1000) * 1.3),
        badgeText: '',
        tagText: 'ক্যাশ অন ডেলিভারী',
        isPopular: false
      };
      setEditingProduct({ ...editingProduct, bundles: [...bundles, newB] });
    }
  };

  const handleUpdateBundleRow = (index: number, field: keyof ProductBundle, value: any) => {
    if (editingProduct) {
      const bundles = [...(editingProduct.bundles || [])];
      bundles[index] = { ...bundles[index], [field]: value };
      setEditingProduct({ ...editingProduct, bundles });
    }
  };

  const handleRemoveBundleRow = (index: number) => {
    if (editingProduct) {
      const bundles = (editingProduct.bundles || []).filter((_, i) => i !== index);
      setEditingProduct({ ...editingProduct, bundles });
    }
  };

  // Flavor management handlers
  const handleLoadInhalerFlavors = () => {
    if (editingProduct) {
      const defaultPrice = editingProduct.discountPrice || editingProduct.price || 390;
      const demoFlavors: ProductFlavor[] = [
        {
          id: `flv-${Date.now()}-1`,
          name: 'Grape',
          icon: '🍇',
          bgColor: '#F3E8FF',
          textColor: '#7E22CE',
          price: defaultPrice,
          inStock: true
        },
        {
          id: `flv-${Date.now()}-2`,
          name: 'Watermelon',
          icon: '🍉',
          bgColor: '#FFE4E6',
          textColor: '#BE123C',
          price: defaultPrice,
          inStock: true
        },
        {
          id: `flv-${Date.now()}-3`,
          name: 'Mint',
          icon: '🌿',
          bgColor: '#DCFCE7',
          textColor: '#15803D',
          price: defaultPrice,
          inStock: true
        },
        {
          id: `flv-${Date.now()}-4`,
          name: 'Peace',
          icon: '🍑',
          bgColor: '#FFEDD5',
          textColor: '#C2410C',
          price: defaultPrice,
          inStock: true
        },
        {
          id: `flv-${Date.now()}-5`,
          name: 'Lemon',
          icon: '🍋',
          bgColor: '#FEF9C3',
          textColor: '#A16207',
          price: defaultPrice,
          inStock: true
        },
        {
          id: `flv-${Date.now()}-6`,
          name: 'RedBull',
          icon: '🐂',
          bgColor: '#FEE2E2',
          textColor: '#B91C1C',
          price: defaultPrice,
          inStock: true
        }
      ];

      setEditingProduct({
        ...editingProduct,
        hasFlavors: true,
        flavorTitle: editingProduct.flavorTitle || 'ফ্লেভার নির্বাচন করুন',
        flavors: demoFlavors
      });
    }
  };

  const handleAddFlavorRow = () => {
    if (editingProduct) {
      const current = editingProduct.flavors || [];
      const newFlv: ProductFlavor = {
        id: `flv-${Date.now()}`,
        name: `নতুন ফ্লেভার ${current.length + 1}`,
        icon: '🌿',
        bgColor: '#DCFCE7',
        textColor: '#15803D',
        price: editingProduct.discountPrice || editingProduct.price || 390,
        inStock: true
      };
      setEditingProduct({
        ...editingProduct,
        hasFlavors: true,
        flavors: [...current, newFlv]
      });
    }
  };

  const handleUpdateFlavorRow = (index: number, field: keyof ProductFlavor, value: any) => {
    if (editingProduct) {
      const list = [...(editingProduct.flavors || [])];
      list[index] = { ...list[index], [field]: value };
      setEditingProduct({ ...editingProduct, flavors: list });
    }
  };

  const handleRemoveFlavorRow = (index: number) => {
    if (editingProduct) {
      const list = (editingProduct.flavors || []).filter((_, i) => i !== index);
      setEditingProduct({ ...editingProduct, flavors: list });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#181B26] border border-[#2B3042] p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2563EB]" />
            <span>প্রোডাক্ট ম্যানেজমেন্ট</span>
          </h2>
          <p className="text-xs text-[#94A3B8]">নতুন প্রোডাক্ট যোগ করুন বা বিদ্যমান প্রোডাক্ট সম্পাদনা করুন</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন প্রোডাক্ট যোগ করুন</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-[#181B26] border border-[#2B3042] rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#11131A] text-[#94A3B8] font-bold uppercase tracking-wider border-b border-[#2B3042]">
              <tr>
                <th className="p-3">IMAGE</th>
                <th className="p-3">PRODUCT NAME</th>
                <th className="p-3">CATEGORY</th>
                <th className="p-3">PRICE</th>
                <th className="p-3">STOCK</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3042]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#1E2330] transition-colors">
                  <td className="p-3">
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-[#FFDC33]"
                      referrerPolicy="no-referrer"
                    />
                  </td>
                  <td className="p-3 font-bold text-white max-w-xs">
                    <p className="line-clamp-1">{p.name}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      {p.isBestSeller && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 rounded">
                          Best Seller
                        </span>
                      )}
                      {p.isFeatured && (
                        <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-[#94A3B8]">
                    {p.category}
                    {p.subCategory && <span className="block text-[10px] opacity-70">{p.subCategory}</span>}
                  </td>
                  <td className="p-3 font-extrabold text-[#A5DD28]">
                    ৳{(p.discountPrice || p.price).toLocaleString('bn-BD')}
                    {p.discountPrice && (
                      <span className="block text-[10px] text-gray-400 line-through">
                        ৳{p.price.toLocaleString('bn-BD')}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] ${
                        p.stock <= 0
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : p.stock <= (p.limitedStockThreshold || 10)
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {p.stock <= 0 ? 'Stock Out (0)' : `${p.stock} pcs`}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                      ACTIVE
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 bg-[#2563EB]/20 text-blue-400 hover:bg-[#2563EB]/40 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Add / Edit Modal (Matching Image 2) */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#0B1329] border border-[#1E293B] rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 text-white my-auto max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <h3 className="font-extrabold text-base sm:text-lg text-white">
                {editingProduct.id && editingProduct.name ? 'প্রোডাক্ট এডিট করুন' : 'নতুন প্রোডাক্ট যোগ করুন'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1.5">
                  প্রোডাক্ট নাম (বাংলা) *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="যেমন: African Organic Wild Honey 500g..."
                  className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Price & Offer Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1.5">মূল্য (Price) ৳ *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1.5">অফার মূল্য (Discount Price) ৳</label>
                  <input
                    type="number"
                    value={editingProduct.discountPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discountPrice: e.target.value ? Number(e.target.value) : undefined
                      })
                    }
                    placeholder="ঐচ্ছিক"
                    className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              {/* Category, Subcategory, Stock, Limited Threshold */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1.5">ক্যাটাগরি *</label>
                  <select
                    value={editingProduct.category || ''}
                    onChange={(e) => {
                      const newCatName = e.target.value;
                      const foundCat = categories.find((c) => c.name.trim().toLowerCase() === newCatName.trim().toLowerCase());
                      const currentSub = editingProduct.subCategory || '';
                      const subs = foundCat?.subCategories || [];
                      setEditingProduct({
                        ...editingProduct,
                        category: newCatName,
                        subCategory: subs.includes(currentSub) ? currentSub : ''
                      });
                    }}
                    className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1.5">সাব-ক্যাটাগরি</label>
                  <select
                    value={editingProduct.subCategory || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subCategory: e.target.value })}
                    className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">-- বাছাই সাব-ক্যাটাগরি --</option>
                    {(
                      categories.find((c) => c.name.trim().toLowerCase() === (editingProduct.category || '').trim().toLowerCase())?.subCategories || []
                    ).map((sc, i) => (
                      <option key={i} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#CBD5E1] font-bold mb-1.5">বর্তমান স্টক সংখ্যা</label>
                  <input
                    type="number"
                    value={editingProduct.stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-bold mb-1.5">লিমিটেড স্টক সীমা</label>
                  <input
                    type="number"
                    value={editingProduct.limitedStockThreshold || 10}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        limitedStockThreshold: Number(e.target.value)
                      })
                    }
                    className="w-full bg-[#050B18] border border-amber-500/40 rounded-xl p-3 text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1.5">
                <span>💡 স্টক এই সংখ্যার নিচে বা সমান হলে (যেমন ≤ 10) প্রোডাক্ট পেজে অটোমেটিক "লিমিটেড স্টক / Limited Stock" ব্যাজ দেখাবে</span>
              </p>

              {/* Color/Variants */}
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1.5">
                  কালার/ভেরিয়েন্ট অপশন (কমা দিয়ে লিখুন)
                </label>
                <input
                  type="text"
                  value={editingProduct.colors?.join(', ') || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      colors: e.target.value.split(',').map((s) => s.trim())
                    })
                  }
                  placeholder="MINT, PEACE, WATERMELON, GRAPE"
                  className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Product Images (Square Format) */}
              <div className="space-y-3 bg-[#0A101D] border border-[#1E293B] rounded-2xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="block text-[#CBD5E1] font-bold text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                      <span>প্রোডাক্ট ছবিসমূহ (১০৮০ × ১০৮০ স্কয়ার ফরম্যাট)</span>
                    </label>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      ছবি স্বয়ংক্রিয়ভাবে অপ্টিমাইজ হয়ে যাবে, কোনো ল্যাগ বা হ্যাং হবে না
                    </p>
                  </div>

                  {isCompressingImage && (
                    <div className="flex items-center gap-2 bg-blue-950/80 border border-blue-500/50 text-blue-300 text-xs px-3 py-1.5 rounded-xl font-bold animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      <span>{imageCompressionProgress || 'ছবি দ্রুত প্রসেস হচ্ছে...'}</span>
                    </div>
                  )}
                </div>

                {/* Custom Upload Area */}
                <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  isCompressingImage 
                    ? 'border-blue-500/60 bg-blue-950/20' 
                    : 'border-[#1E293B] hover:border-[#2563EB] bg-[#050B18]/60'
                }`}>
                  <label className="cursor-pointer flex flex-col items-center justify-center gap-2 select-none">
                    {isCompressingImage ? (
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="font-extrabold text-blue-400 hover:underline text-sm">
                      {isCompressingImage ? 'ছবি অপ্টিমাইজ করা হচ্ছে...' : 'ডিভাইস থেকে ছবি আপলোড করুন (Device Image Upload)'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      JPG, PNG, WebP (একাধিক ছবি একসাথে নির্বাচন করতে পারেন)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={isCompressingImage}
                      className="hidden"
                      onChange={handleImageFilesUpload}
                    />
                  </label>
                </div>

                {/* Thumbnail Previews & Gallery Cards */}
                {(editingProduct.thumbnail || (editingProduct.gallery && editingProduct.gallery.length > 0)) && (
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-bold text-gray-300">
                      বর্তমান প্রোডাক্ট ছবিসমূহ (গ্যালারি):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {/* Main Cover Image */}
                      {editingProduct.thumbnail && (
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-500 bg-black/40 group shadow-md">
                          <img
                            src={editingProduct.thumbnail}
                            alt="Cover Thumbnail"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
                            ★ মূল কভার
                          </div>
                          <button
                            type="button"
                            title="ছবিটি ডিলিট করুন"
                            onClick={() => {
                              const gallery = editingProduct.gallery || [];
                              if (gallery.length > 0) {
                                setEditingProduct({
                                  ...editingProduct,
                                  thumbnail: gallery[0],
                                  gallery: gallery.slice(1)
                                });
                              } else {
                                setEditingProduct({ ...editingProduct, thumbnail: '' });
                              }
                            }}
                            className="absolute top-1.5 right-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full p-1 transition-transform hover:scale-110 cursor-pointer shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Other Gallery Images */}
                      {(editingProduct.gallery || []).map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#2B3042] bg-black/40 group hover:border-gray-400 transition-all shadow-sm">
                          <img
                            src={img}
                            alt={`Gallery ${idx}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          
                          {/* Hover Overlay with actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                            <button
                              type="button"
                              title="মূল কভার হিসেবে সেট করুন"
                              onClick={() => {
                                const prevCover = editingProduct.thumbnail || '';
                                const newGallery = (editingProduct.gallery || []).filter((_, i) => i !== idx);
                                if (prevCover) newGallery.push(prevCover);
                                setEditingProduct({
                                  ...editingProduct,
                                  thumbnail: img,
                                  gallery: newGallery
                                });
                              }}
                              className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded shadow hover:bg-emerald-500 self-start"
                            >
                              ★ কভার বানান
                            </button>
                            <button
                              type="button"
                              title="ছবিটি ডিলিট করুন"
                              onClick={() => {
                                const newGallery = (editingProduct.gallery || []).filter((_, i) => i !== idx);
                                setEditingProduct({ ...editingProduct, gallery: newGallery });
                              }}
                              className="bg-red-600 text-white rounded-full p-1 hover:bg-red-700 self-end transition-transform hover:scale-110"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safe Online Image URL Adder */}
                <div className="pt-2 border-t border-[#1E293B]">
                  <label className="block text-[11px] text-[#94A3B8] font-bold mb-1.5">
                    অথবা অনলাইন ইমেজ লিঙ্ক (URL) যোগ করুন:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newOnlineUrl}
                      onChange={(e) => setNewOnlineUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOnlineImageUrl();
                        }
                      }}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 bg-[#050B18] border border-[#1E293B] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#2563EB]"
                    />
                    <button
                      type="button"
                      onClick={handleAddOnlineImageUrl}
                      className="bg-[#1E293B] hover:bg-[#2563EB] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>URL যোগ করুন</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-1">
                    টিপস: যেকোনো ওয়েব ইমেজের ডিরেক্ট লিংক (যেমন: Unsplash, Imgur, বা CDN) পেস্ট করে যোগ করতে পারেন
                  </p>
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">
                  ভিডিও লিঙ্ক (16:9 Video URL / YouTube Link)
                </label>
                <input
                  type="text"
                  value={editingProduct.videoUrl || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, videoUrl: e.target.value })}
                  placeholder="যেমন: https://www.youtube.com/watch?v=VIDEO_ID"
                  className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                />
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  ইউটিউব বা ভিডিওর লিংক দিলে প্রোডাক্ট পেজে ১০৮০p ভিডিও টিউটোরিয়াল দেখাবে
                </p>
              </div>

              {/* Customer Review Cards Manager for Slideshow */}
              <div className="space-y-4 border-t border-[#1E293B] pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-[#CBD5E1] font-bold">
                    কাস্টমার রিভিউ স্লাইডশো (Customer Review Cards)
                  </label>
                  <span className="text-xs text-amber-400 font-bold">
                    {(editingProduct.reviews || []).length} টি রিভিউ কার্ড
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  প্রোডাক্ট পেজে ভিডিও এবং অর্ডারের মাঝখানে ডার্ক কার্ডের সুন্দর স্লাইডশো আকারে দেখাবে।
                </p>

                {/* Existing Review Cards */}
                {(editingProduct.reviews || []).length > 0 && (
                  <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(editingProduct.reviews || []).map((rev, idx) => (
                        <div key={rev.id || idx} className="bg-[#050B18] border border-[#1E293B] hover:border-emerald-500/40 rounded-xl p-3 space-y-2 relative group transition-all">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (editingProduct.reviews || []).filter((_, i) => i !== idx);
                              const updatedRating = updated.length > 0
                                ? Number((updated.reduce((sum, r) => sum + (r.rating || 5), 0) / updated.length).toFixed(1))
                                : 5.0;
                              setEditingProduct({
                                ...editingProduct,
                                reviews: updated,
                                reviewsCount: updated.length,
                                rating: updatedRating
                              });
                            }}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-300 bg-red-950/60 p-1 rounded-lg cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-center gap-1 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                            ))}
                            <span className="text-[10px] text-slate-400 font-bold ml-1">{rev.rating}★</span>
                          </div>
                          <p className="text-xs text-slate-200 italic line-clamp-3">
                            "{rev.comment}"
                          </p>
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800 text-[11px]">
                            {rev.image ? (
                              <img src={rev.image} alt={rev.userName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                                {rev.userName.charAt(0)}
                              </div>
                            )}
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">{rev.userName}</span>
                              {rev.userRole && <span className="text-[9px] text-slate-400 block truncate">{rev.userRole}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Review Card Form */}
                <div className="bg-[#050B18] border border-[#1E293B] rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-extrabold text-amber-400 flex items-center gap-1">
                    <Plus className="w-4 h-4" />
                    <span>নতুন কাস্টমার রিভিউ যুক্ত করুন</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-[#CBD5E1] font-bold mb-1">কাস্টমারের নাম *</label>
                      <input
                        type="text"
                        id="new-rev-name"
                        placeholder="যেমন: তানভীর আহমেদ / Rahat Islam"
                        className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#CBD5E1] font-bold mb-1">পদবী/সাবটাইটেল (Optional)</label>
                      <input
                        type="text"
                        id="new-rev-role"
                        placeholder="যেমন: VERIFIED BUYER / ঢাকা"
                        className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#CBD5E1] font-bold mb-1">রিভিউ বক্তব্য / কমেন্ট *</label>
                    <textarea
                      id="new-rev-comment"
                      rows={2}
                      placeholder="যেমন: প্রোডাক্টটি পেয়ে আমি খুব সন্তুষ্ট। ক্রিস্টাল ক্লিয়ার সাউন্ড ও ফাস্ট ডেলিভারি পেয়েছি!"
                      className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Customer Image (1:1 Ratio) URL or File Upload */}
                  <div>
                    <label className="block text-[10px] text-[#CBD5E1] font-bold mb-1">
                      কাস্টমার ছবি / প্রোডাক্ট রিভিউ ছবি (1:1 Aspect Ratio Image):
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        id="new-rev-image"
                        placeholder="যেমন: https://images.unsplash.com/... (ইমেজ URL)"
                        className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <label className="shrink-0 cursor-pointer bg-[#1E293B] hover:bg-[#334155] text-emerald-400 border border-emerald-500/40 font-bold text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>ছবি আপলোড</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressed = await processImageForPlaceholder(file, 'review_avatar');
                              const imgEl = document.getElementById('new-rev-image') as HTMLInputElement;
                              if (imgEl) imgEl.value = compressed;
                            } catch (err) {
                              console.error('Review avatar processing error:', err);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const imgEl = document.getElementById('new-rev-image') as HTMLInputElement;
                          if (imgEl && editingProduct.thumbnail) {
                            imgEl.value = editingProduct.thumbnail;
                          }
                        }}
                        className="shrink-0 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-1.5 rounded-xl font-bold hover:bg-amber-500/30 cursor-pointer"
                        title="প্রোডাক্টের থাম্বনেইল ব্যবহার করুন"
                      >
                        প্রোডাক্ট ছবি নিন
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-[#CBD5E1] font-bold">রেটিং:</label>
                      <select
                        id="new-rev-rating"
                        defaultValue="5"
                        className="bg-[#0F172A] border border-[#1E293B] text-amber-400 text-xs font-bold rounded-lg px-2 py-1"
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5 Star)</option>
                        <option value="4">⭐⭐⭐⭐ (4 Star)</option>
                        <option value="3">⭐⭐⭐ (3 Star)</option>
                        <option value="2">⭐⭐ (2 Star)</option>
                        <option value="1">⭐ (1 Star)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const nameEl = document.getElementById('new-rev-name') as HTMLInputElement;
                        const roleEl = document.getElementById('new-rev-role') as HTMLInputElement;
                        const commentEl = document.getElementById('new-rev-comment') as HTMLTextAreaElement;
                        const imageEl = document.getElementById('new-rev-image') as HTMLInputElement;
                        const ratingEl = document.getElementById('new-rev-rating') as HTMLSelectElement;

                        if (!nameEl?.value.trim() || !commentEl?.value.trim()) {
                          alert('দয়া করে কাস্টমারের নাম এবং রিভিউ কমেন্ট লিখুন');
                          return;
                        }

                        const newRev: Review = {
                          id: `rev-${Date.now()}`,
                          userName: nameEl.value.trim(),
                          userRole: roleEl?.value.trim() || 'VERIFIED BUYER',
                          comment: commentEl.value.trim(),
                          rating: Number(ratingEl?.value || 5),
                          image: imageEl?.value.trim() || undefined,
                          date: new Date().toLocaleDateString('bn-BD'),
                          isVerifiedPurchase: true
                        };

                        const updatedReviews = [...(editingProduct.reviews || []), newRev];
                        const updatedRating = Number((updatedReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / updatedReviews.length).toFixed(1));

                        setEditingProduct({
                          ...editingProduct,
                          reviews: updatedReviews,
                          reviewsCount: updatedReviews.length,
                          rating: updatedRating
                        });

                        nameEl.value = '';
                        if (roleEl) roleEl.value = '';
                        commentEl.value = '';
                        if (imageEl) imageEl.value = '';
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>রিভিউ যোগ করুন</span>
                    </button>
                  </div>
                </div>

                {/* Also General Review Image Upload */}
                <div className="pt-2">
                  <label className="block text-xs text-[#CBD5E1] font-bold mb-1">
                    অথবা কাস্টমার মেসেজ/রিভিউ এর স্ক্রিনশট ছবি আপলোড করুন:
                  </label>
                  <div className="border border-dashed border-[#1E293B] hover:border-emerald-500/60 rounded-xl p-3 text-center bg-[#050B18]/50 transition-colors">
                    <label className="cursor-pointer flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold hover:underline select-none">
                      <Upload className="w-4 h-4" />
                      <span>{isCompressingImage ? 'রিভিউ স্ক্রিনশট প্রসেস হচ্ছে...' : 'রিভিউ স্ক্রিনশট আপলোড করুন'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isCompressingImage}
                        className="hidden"
                        onChange={handleReviewImagesUpload}
                      />
                    </label>
                  </div>
                  {(editingProduct.reviewImages || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(editingProduct.reviewImages || []).map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/40 bg-black group">
                          <img src={img} alt={`Review ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            title="মুছে ফেলুন"
                            onClick={() => {
                              const newImgs = (editingProduct.reviewImages || []).filter((_, i) => i !== idx);
                              setEditingProduct({ ...editingProduct, reviewImages: newImgs });
                            }}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">
                  সংক্ষিপ্ত বিবরণ (Short Description) - <span className="text-[#64748B] font-normal">(হেডিং/টাইটেল এর নিচে এবং কালার/ভেরিয়েন্ট এর উপরে দেখাবে)</span>
                </label>
                <textarea
                  rows={2}
                  value={editingProduct.shortDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  placeholder="যেমন: প্রিমিয়াম এইচডি সাউন্ড, ফাস্ট চার্জিং, ও ৩০ ঘণ্টা ব্যাটারি ব্যাকআপ"
                  className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Long Description */}
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">
                  বিস্তারিত বিবরণ (Long Description) - <span className="text-[#64748B] font-normal">(প্রোডাক্ট বিবরণ ট্যাবে এই দীর্ঘ বিবরণটি দেখাবে)</span>
                </label>
                <textarea
                  rows={3}
                  value={editingProduct.longDescription || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, longDescription: e.target.value })}
                  placeholder="এখানে প্রোডাক্টের সম্পূর্ণ বিস্তারিত বিবরণ লিখুন..."
                  className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Specifications Table */}
              <div className="space-y-2 border-t border-[#1E293B] pt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-[#CBD5E1] font-bold block">পণ্যের স্পেসিফিকেশন (Specifications)</label>
                    <span className="text-[11px] text-[#64748B]">প্রোডাক্টের স্পেসিফিকেশন ট্যাবে এই তথ্যটি দেখাবে</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSpecRow}
                    className="bg-[#2563EB] hover:bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    + নতুন রো যোগ করুন
                  </button>
                </div>

                <div className="space-y-2">
                  {(editingProduct.specifications || []).map((spec, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="ব্লুটুথ ভার্সন"
                        value={spec.key}
                        onChange={(e) => handleUpdateSpecRow(i, e.target.value, spec.value)}
                        className="flex-1 bg-[#050B18] border border-[#1E293B] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#2563EB]"
                      />
                      <input
                        type="text"
                        placeholder="v5.2"
                        value={spec.value}
                        onChange={(e) => handleUpdateSpecRow(i, spec.key, e.target.value)}
                        className="flex-1 bg-[#050B18] border border-[#1E293B] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#2563EB]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecRow(i)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package Offers / Quantity Deals Section */}
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-2xl p-4 text-white space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <PackageCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                        <span>প্যাকেজ অফার / বান্ডেল ডিল (Tiered Pricing Offers)</span>
                      </h3>
                      <p className="text-xs text-gray-400">
                        গ্রাহক একাধিক পণ্য বা ফ্লেভার একসাথে কিনলে বিশেষ ছাড়ের অপশন দেখতে পাবে
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateImage1Style}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ ইমেজ ১ স্টাইল (1 Pc, 2 Pc, 4 Pc)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateImage2Style}
                      className="bg-[#5E6A45] hover:bg-[#4B5637] text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ ইমেজ ২ স্টাইল (ব্যানার টেবিল)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateSixTiers}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ ১-৬টি প্যাকেজ ডিল</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddBundleRow}
                      className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ নতুন প্যাকেজ</span>
                    </button>
                  </div>
                </div>

                {/* Bundle Display Style Choice Selector */}
                {editingProduct.bundles && editingProduct.bundles.length > 0 && (
                  <div className="bg-[#050B18] border border-[#1E293B] rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block text-xs font-bold text-gray-200">
                        লেআউট ডিসপ্লে স্টাইল নির্বাচন করুন (যেটি নির্বাচন করবেন শুধুমাত্র সেটিই কাস্টমার পেজে দেখাবে):
                      </label>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
                        বর্তমান সক্রিয়: {
                          (editingProduct.bundleStyle === 'banner_table')
                            ? 'ইমেজ ২ স্টাইল (ব্যানার টেবিল)'
                            : (editingProduct.bundleStyle === 'both')
                            ? 'উভয় স্টাইল একসাথে'
                            : 'ইমেজ ১ স্টাইল (Radio Cards)'
                        }
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div
                        onClick={() => setEditingProduct({ ...editingProduct, bundleStyle: 'radio_cards' })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          (editingProduct.bundleStyle || 'radio_cards') === 'radio_cards'
                            ? 'border-indigo-500 bg-indigo-950/50 text-white shadow-md ring-1 ring-indigo-500'
                            : 'border-[#1E293B] bg-[#0B1220] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                            (editingProduct.bundleStyle || 'radio_cards') === 'radio_cards' ? 'border-indigo-400 bg-indigo-500' : 'border-gray-500'
                          }`}>
                            {(editingProduct.bundleStyle || 'radio_cards') === 'radio_cards' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="text-indigo-300">ইমেজ ১ স্টাইল (Radio Cards)</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 pl-5">
                          1 Pc, 2 Pc, 4 Pc + ক্যাশ অন ডেলিভারী + 🔥 SAVE TK ব্যাজ
                        </p>
                      </div>

                      <div
                        onClick={() => setEditingProduct({ ...editingProduct, bundleStyle: 'banner_table' })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          editingProduct.bundleStyle === 'banner_table'
                            ? 'border-emerald-500 bg-emerald-950/50 text-white shadow-md ring-1 ring-emerald-500'
                            : 'border-[#1E293B] bg-[#0B1220] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                            editingProduct.bundleStyle === 'banner_table' ? 'border-emerald-400 bg-emerald-500' : 'border-gray-500'
                          }`}>
                            {editingProduct.bundleStyle === 'banner_table' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="text-emerald-300">ইমেজ ২ স্টাইল (Banner Table)</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 pl-5">
                          সবুজ অফার ব্যানার ও ডিল টেবিল তালিকা
                        </p>
                      </div>

                      <div
                        onClick={() => setEditingProduct({ ...editingProduct, bundleStyle: 'both' })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          editingProduct.bundleStyle === 'both'
                            ? 'border-amber-500 bg-amber-950/50 text-white shadow-md ring-1 ring-amber-500'
                            : 'border-[#1E293B] bg-[#0B1220] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <span className={`w-3 h-3 rounded-full flex items-center justify-center border ${
                            editingProduct.bundleStyle === 'both' ? 'border-amber-400 bg-amber-500' : 'border-gray-500'
                          }`}>
                            {editingProduct.bundleStyle === 'both' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="text-amber-300">উভয় স্টাইল একসাথে (Both)</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 pl-5">
                          রেডিও কার্ড ও সবুজ ব্যানার ডিল উভয়ই প্রদর্শিত হবে
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dedicated Banner Customization Fields */}
                {editingProduct.bundles && editingProduct.bundles.length > 0 && (
                  <div className="bg-[#050B18] border border-emerald-800/40 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-emerald-400">
                      <span className="flex items-center gap-1.5">
                        <span>🎨 বিশেষ ছাড় অফার ব্যানার কাস্টমাইজেশন (Green Header Banner)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleGenerateImage2Style}
                        className="text-xs bg-emerald-700/60 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        <span>১-ক্লিকে ডেমো ব্যানার টেক্সট ও ছাড় লোড করুন</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-gray-300 font-bold mb-1">
                          ব্যানার সাব-টাইটেল (উপরের ছোট লেখা)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.bundleBannerSubtitle || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, bundleBannerSubtitle: e.target.value })}
                          placeholder="একসাথে বেশি কিনুন – বেশি সাশ্রয় করুন!"
                          className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-white focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 font-bold mb-1">
                          ব্যানার মূল টাইটেল (বড় বোল্ড লেখা)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.bundleBannerTitle || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, bundleBannerTitle: e.target.value })}
                          placeholder="একাধিক পণ্য কিনলে পাবেন বিশেষ ছাড়"
                          className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-white focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Bundle Rows */}
                {(!editingProduct.bundles || editingProduct.bundles.length === 0) ? (
                  <div className="text-center py-6 px-4 bg-[#050B18] rounded-xl border border-dashed border-[#1E293B] text-gray-400 text-xs space-y-2.5">
                    <div className="inline-flex items-center gap-2 bg-gray-800/80 text-gray-300 text-xs px-3.5 py-1.5 rounded-full font-bold">
                      ⚪ প্যাকেজ অফার: বন্ধ (Regular Single-Item Flow)
                    </div>
                    <p className="font-medium text-gray-300">
                      এই প্রোডাক্টে কোনো প্যাকেজ যোগ করা নেই। ওয়েবসাইটে প্রোডাক্ট পেইজে এই অফার সেকশন প্রদর্শিত হবে না।
                    </p>
                    <p className="text-gray-400 text-[11px]">
                      যদি আপনি প্রোডাক্টে একাধিক পণ্য/ফ্লেভার ক্রয়ের ছাড় অফার দেখাতে চান, তবে নিচের যেকোনো বাটনে ক্লিক করে চালু করুন:
                    </p>
                    <div className="pt-2 flex items-center justify-center flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={handleGenerateImage1Style}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Zap className="w-4 h-4" />
                        <span>১-ক্লিকে ইমেজ ১ স্টাইল তৈরি করুন (1 Pc, 2 Pc, 4 Pc)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateImage2Style}
                        className="bg-[#5E6A45] hover:bg-[#4B5637] text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>ইমেজ ২ স্টাইল (সবুজ ব্যানার)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateSixTiers}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>১-৬টি ফুল প্যাকেজ</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddBundleRow}
                        className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ম্যানুয়ালি যোগ করুন</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl text-emerald-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        🟢 প্যাকেজ অফার: চালু রয়েছে ({editingProduct.bundles.length} টি প্যাকেজ সক্রিয়)
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, bundles: [] })}
                        className="text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>সব মুছে প্যাকেজ অফ করুন</span>
                      </button>
                    </div>
                    {editingProduct.bundles.map((bundle, idx) => (
                      <div
                        key={bundle.id || idx}
                        className="bg-[#050B18] border border-[#1E293B] rounded-xl p-3.5 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-gray-300 border-b border-[#1E293B] pb-2">
                          <span className="text-emerald-400 flex items-center gap-2">
                            <span>প্যাকেজ #{idx + 1}</span>
                            <span className="text-gray-400 font-normal">({bundle.quantity} টি পণ্য)</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-amber-300 text-[11px]">
                              <input
                                type="checkbox"
                                checked={bundle.isPopular || false}
                                onChange={(e) => handleUpdateBundleRow(idx, 'isPopular', e.target.checked)}
                                className="accent-amber-500 rounded cursor-pointer"
                              />
                              <span>ডিফল্ট সিলেক্টেড (Popular Deal)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleRemoveBundleRow(idx)}
                              className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          {/* Title */}
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">টাইটেল (Title)</label>
                            <input
                              type="text"
                              value={bundle.title}
                              onChange={(e) => handleUpdateBundleRow(idx, 'title', e.target.value)}
                              placeholder="1 Pc / ২টি পণ্য"
                              className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-white focus:border-[#2563EB]"
                            />
                          </div>

                          {/* Quantity */}
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">পরিমাণ (Quantity)</label>
                            <input
                              type="number"
                              value={bundle.quantity}
                              onChange={(e) => handleUpdateBundleRow(idx, 'quantity', Number(e.target.value))}
                              placeholder="1"
                              className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-white focus:border-[#2563EB]"
                            />
                          </div>

                          {/* Price */}
                          <div>
                            <label className="block text-emerald-400 mb-1 font-bold">প্যাকেজ মূল্য (Price ৳)</label>
                            <input
                              type="number"
                              value={bundle.price}
                              onChange={(e) => handleUpdateBundleRow(idx, 'price', Number(e.target.value))}
                              placeholder="989"
                              className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-emerald-300 font-bold focus:border-[#2563EB]"
                            />
                          </div>

                          {/* Original Price */}
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">পূর্বের মূল্য (Old Price ৳)</label>
                            <input
                              type="number"
                              value={bundle.originalPrice || ''}
                              onChange={(e) => handleUpdateBundleRow(idx, 'originalPrice', Number(e.target.value))}
                              placeholder="1300"
                              className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-gray-300 focus:border-[#2563EB]"
                            />
                          </div>

                          {/* Save Badge Text */}
                          <div>
                            <label className="block text-red-400 mb-1 font-bold">ছাড়ের ব্যাজ (Badge)</label>
                            <input
                              type="text"
                              value={bundle.badgeText || ''}
                              onChange={(e) => handleUpdateBundleRow(idx, 'badgeText', e.target.value)}
                              placeholder="🔥 SAVE 179 TK / 18% ছাড়"
                              className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-red-300 focus:border-[#2563EB]"
                            />
                          </div>

                          {/* Tag Text */}
                          <div>
                            <label className="block text-emerald-400 mb-1 font-bold">ট্যাগ লেখা (Tag)</label>
                            <input
                              type="text"
                              value={bundle.tagText || ''}
                              onChange={(e) => handleUpdateBundleRow(idx, 'tagText', e.target.value)}
                              placeholder="ক্যাশ অন ডেলিভারী / (বেশি বিক্রিত)"
                              className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-emerald-300 focus:border-[#2563EB]"
                            />
                          </div>

                          {/* Icon Type Selection */}
                          <div>
                            <label className="block text-gray-400 mb-1 font-bold">আইকন বা ডট</label>
                            <select
                              value={bundle.iconType || (idx >= 3 ? 'fire' : idx === 0 ? 'green_dot' : 'gold_dot')}
                              onChange={(e) => handleUpdateBundleRow(idx, 'iconType', e.target.value)}
                              className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-white focus:border-[#2563EB]"
                            >
                              <option value="green_dot">🟢 সবুজ ডট (Green Dot)</option>
                              <option value="gold_dot">🟡 গোল্ড ডট (Gold Dot)</option>
                              <option value="fire">🔥 ফায়ার আইকন (Fire Flame)</option>
                              <option value="star">⭐ স্পার্কল স্টার (Star)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Live Preview Box */}
                    <div className="bg-[#FAF8F5] border-2 border-dashed border-[#D5DCBF] rounded-2xl p-4 mt-4">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-2 border-b border-gray-200 pb-2">
                        <span className="flex items-center gap-1.5 text-[#5E6A45]">
                          <span>👁️ লাইভ প্রিভিউ (গ্রাহক যেভাবে দেখবে)</span>
                        </span>
                        <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                          স্টাইল: {editingProduct.bundleStyle || 'radio_cards'}
                        </span>
                      </div>
                      <BundleSelector
                        bundles={editingProduct.bundles}
                        selectedBundleId={editingProduct.bundles.find(b => b.isPopular)?.id || editingProduct.bundles[0]?.id || ''}
                        onSelectBundle={() => {}}
                        styleMode={editingProduct.bundleStyle || 'radio_cards'}
                        bannerTitle={editingProduct.bundleBannerTitle}
                        bannerSubtitle={editingProduct.bundleBannerSubtitle}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Product Flavors & Pricing Management Section (New Feature) */}
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-2xl p-4 text-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                        <span>ফ্লেভার ও ভ্যারিয়েন্ট ম্যানেজমেন্ট (Flavors & Pricing)</span>
                        {editingProduct.hasFlavors && (
                          <span className="text-[10px] bg-purple-600 text-white font-black px-2 py-0.5 rounded-full">
                            {(editingProduct.flavors || []).length} টি ফ্লেভার সক্রিয়
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-gray-400">
                        ইনহেলার বা অন্যান্য পণ্যের আলাদা ফ্লেভার, আইকন ও দাম কাস্টমাইজ করুন
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-xs text-gray-300 font-bold">
                      {editingProduct.hasFlavors ? 'চালু আছে' : 'বন্ধ আছে'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newHas = !editingProduct.hasFlavors;
                        if (newHas && (!editingProduct.flavors || editingProduct.flavors.length === 0)) {
                          handleLoadInhalerFlavors();
                        } else {
                          setEditingProduct({ ...editingProduct, hasFlavors: newHas });
                        }
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                        editingProduct.hasFlavors ? 'bg-purple-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          editingProduct.hasFlavors ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sub-section when Flavors is Active */}
                {editingProduct.hasFlavors && (
                  <div className="space-y-4">
                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#050B18] p-3 rounded-xl border border-[#1E293B]">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-[11px] text-gray-400 font-bold mb-1">
                          ফ্লেভার সেকশন টাইটেল (Section Title):
                        </label>
                        <input
                          type="text"
                          value={editingProduct.flavorTitle || 'ফ্লেভার নির্বাচন করুন'}
                          onChange={(e) => setEditingProduct({ ...editingProduct, flavorTitle: e.target.value })}
                          placeholder="ফ্লেভার নির্বাচন করুন"
                          className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={handleLoadInhalerFlavors}
                          className="bg-purple-700/60 hover:bg-purple-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          title="ডেমো ৬টি ইনহেলার ফ্লেভার লোড করুন"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>⚡ ৬টি ইনহেলার ফ্লেভার লোড করুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddFlavorRow}
                          className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ নতুন ফ্লেভার</span>
                        </button>
                      </div>
                    </div>

                    {/* Flavors List */}
                    {(!editingProduct.flavors || editingProduct.flavors.length === 0) ? (
                      <div className="text-center py-6 px-4 bg-[#050B18] rounded-xl border border-dashed border-[#1E293B] text-gray-400 text-xs space-y-2">
                        <p>কোনো ফ্লেভার যোগ করা হয়নি।</p>
                        <button
                          type="button"
                          onClick={handleLoadInhalerFlavors}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs cursor-pointer"
                        >
                          ইনহেলার ৬টি ফ্লেভার লোড করুন
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {editingProduct.flavors.map((flv, idx) => (
                            <div
                              key={flv.id || idx}
                              className="bg-[#050B18] border border-[#1E293B] hover:border-purple-500/40 rounded-xl p-3 space-y-2.5 transition-all relative group"
                            >
                              <div className="flex items-center justify-between border-b border-[#1E293B] pb-1.5 text-xs font-bold">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                                    style={{ backgroundColor: flv.bgColor || '#F3E8FF' }}
                                  >
                                    {flv.icon || '🌿'}
                                  </span>
                                  <span className="text-white">ফ্লেভার #{idx + 1}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-gray-400">
                                    <input
                                      type="checkbox"
                                      checked={flv.inStock !== false}
                                      onChange={(e) => handleUpdateFlavorRow(idx, 'inStock', e.target.checked)}
                                      className="accent-emerald-500 rounded cursor-pointer"
                                    />
                                    <span>স্টকে আছে</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFlavorRow(idx)}
                                    className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <label className="block text-[10px] text-gray-400 font-bold mb-1">
                                    ফ্লেভারের নাম (Name)
                                  </label>
                                  <input
                                    type="text"
                                    value={flv.name}
                                    onChange={(e) => handleUpdateFlavorRow(idx, 'name', e.target.value)}
                                    placeholder="যেমন: Grape / Mint"
                                    className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-white text-xs focus:border-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] text-gray-400 font-bold mb-1">
                                    আইকন বা ইমোজি (Emoji)
                                  </label>
                                  <input
                                    type="text"
                                    value={flv.icon || '🌿'}
                                    onChange={(e) => handleUpdateFlavorRow(idx, 'icon', e.target.value)}
                                    placeholder="🍇, 🍉, 🌿, 🍑, 🍋, 🐂"
                                    className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-white text-xs focus:border-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] text-emerald-400 font-bold mb-1">
                                    প্রতিটির মূল্য (৳ Price)
                                  </label>
                                  <input
                                    type="number"
                                    value={flv.price || editingProduct.discountPrice || editingProduct.price || 390}
                                    onChange={(e) => handleUpdateFlavorRow(idx, 'price', Number(e.target.value))}
                                    placeholder="390"
                                    className="w-full bg-[#0B1220] border border-[#1E293B] rounded-lg p-2 text-emerald-300 font-bold text-xs focus:border-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] text-gray-400 font-bold mb-1">
                                    ব্যাজ কালার (Bg Tint)
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="color"
                                      value={flv.bgColor || '#F3E8FF'}
                                      onChange={(e) => handleUpdateFlavorRow(idx, 'bgColor', e.target.value)}
                                      className="w-7 h-7 rounded border border-gray-600 cursor-pointer bg-transparent"
                                    />
                                    <input
                                      type="text"
                                      value={flv.bgColor || '#F3E8FF'}
                                      onChange={(e) => handleUpdateFlavorRow(idx, 'bgColor', e.target.value)}
                                      placeholder="#F3E8FF"
                                      className="flex-1 bg-[#0B1220] border border-[#1E293B] rounded-lg p-1.5 text-white font-mono text-[11px]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Live Preview Box for Flavor Selector */}
                        <div className="bg-[#FAF8F5] border-2 border-dashed border-[#D5DCBF] rounded-2xl p-4 mt-3">
                          <div className="flex items-center justify-between text-xs font-bold text-gray-600 mb-2 border-b border-gray-200 pb-2">
                            <span className="flex items-center gap-1.5 text-purple-700">
                              <span>👁️ ফ্লেভার সিলেক্টর লাইভ প্রিভিউ (Customer View):</span>
                            </span>
                            <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500">
                              ডেমো মোড
                            </span>
                          </div>
                          <FlavorSelector
                            flavors={editingProduct.flavors}
                            title={editingProduct.flavorTitle || 'ফ্লেভার নির্বাচন করুন'}
                            selectedFlavors={{ [editingProduct.flavors[0]?.name || 'Grape']: 1 }}
                            onChange={() => {}}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Offer Timer Section (Matching Demo Image) */}
              <div className="bg-[#0B1220] border border-[#1E293B] rounded-2xl p-4 text-white space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm sm:text-base text-white">
                        অফার কাউন্টডাউন টাইমার (Offer Timer)
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        এই সুইচ অন করলে এই প্রোডাক্টের পেজে কাউন্টডাউন টাইমার শো করবে
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingProduct({ ...editingProduct, hasTimer: !editingProduct.hasTimer })
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                      editingProduct.hasTimer ? 'bg-[#658238]' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        editingProduct.hasTimer ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Sub-inputs when Offer Timer is toggled ON */}
                {editingProduct.hasTimer && (
                  <div className="border-t border-[#1E293B] pt-3.5 mt-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Timer Title */}
                      <div>
                        <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                          টাইমার টাইটেল (Timer Title)
                        </label>
                        <input
                          type="text"
                          value={editingProduct.timerTitle ?? 'অফারটি শেষ হবে:'}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, timerTitle: e.target.value })
                          }
                          placeholder="অফারটি শেষ হবে:"
                          className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB] text-xs font-medium"
                        />
                      </div>

                      {/* Target End Time */}
                      <div>
                        <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5">
                          অফার শেষ হওয়ার তারিখ ও সময় (Target End Time)
                        </label>
                        <input
                          type="datetime-local"
                          value={editingProduct.timerEndTime || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, timerEndTime: e.target.value })
                          }
                          className="w-full bg-[#050B18] border border-[#1E293B] rounded-xl p-3 text-white focus:outline-none focus:border-[#2563EB] text-xs font-medium [color-scheme:dark]"
                        />
                        <span className="text-[11px] text-[#64748B] mt-1.5 block">
                          ফাঁকা রাখলে ২৪ ঘণ্টার স্ট্যান্ডার্ড কাউন্টডাউন চলবে
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6 border-t border-[#1E293B] pt-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={editingProduct.isBestSeller || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                    className="w-4 h-4 accent-[#2563EB] rounded cursor-pointer"
                  />
                  <span>বেস্ট সেলার (Best Seller)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="w-4 h-4 accent-[#2563EB] rounded cursor-pointer"
                  />
                  <span>ফিচারড (Featured)</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#1E293B] hover:bg-gray-700 text-white font-bold cursor-pointer transition-colors"
                >
                  ক্যানসেল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>প্রোডাক্ট সেভ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
