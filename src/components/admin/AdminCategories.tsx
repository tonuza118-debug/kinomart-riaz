import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';
import { processImageForPlaceholder, processAndUploadImage } from '../../lib/imageUtils';
import { Tags, Plus, Edit2, Trash2, X, Check, Eye } from 'lucide-react';

export const AdminCategories: React.FC = () => {
  const { categories, saveCategory, deleteCategory } = useStore();

  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');

  const handleOpenAdd = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      position: categories.length + 1,
      isVisibleOnHome: true,
      subCategories: []
    });
    setNewSubName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Category) => {
    setEditingCategory({ ...c });
    setNewSubName('');
    setIsModalOpen(true);
  };

  const handleAddSub = () => {
    if (newSubName.trim() && editingCategory) {
      const current = editingCategory.subCategories || [];
      setEditingCategory({
        ...editingCategory,
        subCategories: [...current, newSubName.trim()]
      });
      setNewSubName('');
    }
  };

  const handleRemoveSub = (index: number) => {
    if (editingCategory) {
      const current = editingCategory.subCategories || [];
      setEditingCategory({
        ...editingCategory,
        subCategories: current.filter((_, i) => i !== index)
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory && editingCategory.name) {
      let finalSubCategories = editingCategory.subCategories || [];
      if (newSubName.trim()) {
        finalSubCategories = [...finalSubCategories, newSubName.trim()];
      }
      saveCategory({
        ...editingCategory,
        subCategories: finalSubCategories,
      } as Category);
      setIsModalOpen(false);
      setEditingCategory(null);
      setNewSubName('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#181B26] border border-[#2B3042] p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Tags className="w-5 h-5 text-[#2563EB]" />
            <span>ক্যাটাগরি ও সাব-ক্যাটাগরি ম্যানেজমেন্ট</span>
          </h2>
          <p className="text-xs text-[#94A3B8]">
            মেনু ক্যাটাগরি তৈরি ও এডিট করুন এবং প্রতিটির নিচে সাব-ক্যাটাগরি যুক্ত করুন
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন ক্যাটাগরি</span>
        </button>
      </div>

      {/* Category Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-[#181B26] border border-[#2B3042] rounded-2xl p-4 space-y-3 relative group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <span>{cat.name}</span>
                  {cat.isVisibleOnHome && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      দৃশ্যমান (Visible)
                    </span>
                  )}
                </h3>
                <span className="text-xs text-[#64748B]">পজিশন: {cat.position}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 bg-[#2563EB]/20 text-blue-400 hover:bg-[#2563EB]/40 rounded-lg"
                  title="এডিট"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this category?')) {
                      deleteCategory(cat.id);
                    }
                  }}
                  className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg"
                  title="মুছে ফেলুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subcategories tags */}
            <div className="pt-2 border-t border-[#2B3042]">
              <p className="text-xs font-bold text-[#94A3B8] mb-1.5">
                সাব-ক্যাটাগরি সমূহ ({(cat.subCategories || []).length}টি):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(cat.subCategories || []).length === 0 ? (
                  <span className="text-xs text-gray-500 italic">কোনো সাব-ক্যাটাগরি নেই</span>
                ) : (
                  (cat.subCategories || []).map((sub, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-[#222736] text-[#CBD5E1] px-2.5 py-1 rounded-lg border border-[#33384B]"
                    >
                      {sub}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal (Matching Image 14) */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#181B26] border border-[#2B3042] rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 text-white my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#2B3042] pb-3">
              <h3 className="font-extrabold text-base">ক্যাটাগরি ও সাব-ক্যাটাগরি এডিট</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#94A3B8] font-bold mb-1">ক্যাটাগরি নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
                />
              </div>

              {/* Category Image Upload / URL */}
              <div>
                <label className="block text-[#94A3B8] font-bold mb-1">
                  ক্যাটাগরি ছবি / আইকন (Category Image/Icon)
                </label>
                <div className="space-y-2">
                  <label className="bg-[#2563EB] hover:bg-blue-600 text-white font-bold py-2 px-3.5 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer transition-colors shadow-sm">
                    <span>⚓ কম্পিউটার/মোবাইল থেকে ছবি আপলোড করুন</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const processed = await processAndUploadImage(file, 'category_icon', 'categories');
                            setEditingCategory({ ...editingCategory, image: processed });
                          } catch (err) {
                            console.error('Category image upload error:', err);
                          }
                        }
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={editingCategory.image || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                    placeholder="অথবা ছবির লিঙ্ক (URL) বসান: https://example.com/icon.png"
                    className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] font-bold mb-1">ডিসপ্লে ক্রম পজিশন</label>
                  <input
                    type="number"
                    value={editingCategory.position || 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, position: Number(e.target.value) })}
                    className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
                  />
                </div>

                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                    <input
                      type="checkbox"
                      checked={editingCategory.isVisibleOnHome || false}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, isVisibleOnHome: e.target.checked })
                      }
                      className="accent-[#2563EB]"
                    />
                    <span>হোম পেজে দেখাবে (Visible)</span>
                  </label>
                </div>
              </div>

              {/* Subcategories List Manager */}
              <div className="space-y-2 border-t border-[#2B3042] pt-3">
                <label className="block text-[#94A3B8] font-bold">
                  সাব-ক্যাটাগরি সমূহ ({(editingCategory.subCategories || []).length}টি)
                </label>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(editingCategory.subCategories || []).map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-[#11131A] border border-[#33384B] px-3 py-2 rounded-xl text-xs"
                    >
                      <span>
                        {i + 1}. {sub}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSub(i)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSub();
                      }
                    }}
                    placeholder="নতুন সাব-ক্যাটাগরির নাম লিখুন (যেমন: TWS এয়ারবাডস)..."
                    className="flex-1 bg-[#11131A] border border-[#33384B] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#2563EB]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSub}
                    className="bg-[#2563EB] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-colors shrink-0"
                  >
                    + যোগ করুন
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#2B3042]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-800 text-white font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-extrabold flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>সেভ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
