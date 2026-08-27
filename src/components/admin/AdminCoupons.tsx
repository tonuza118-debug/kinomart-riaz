import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Coupon } from '../../types';
import { Ticket, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

export const AdminCoupons: React.FC = () => {
  const { coupons, saveCoupon, deleteCoupon } = useStore();

  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingCoupon({
      id: `coup-${Date.now()}`,
      code: '',
      type: 'PERCENTAGE',
      value: 10,
      minOrderAmount: 1000,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon({ ...c });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCoupon && editingCoupon.code) {
      saveCoupon({
        ...editingCoupon,
        code: editingCoupon.code.toUpperCase()
      } as Coupon);
      setIsModalOpen(false);
      setEditingCoupon(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#181B26] border border-[#2B3042] p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#2563EB]" />
            <span>ডিসকাউন্ট কুপন ম্যানেজমেন্ট</span>
          </h2>
          <p className="text-xs text-[#94A3B8]">কাস্টমারদের জন্য প্রোমো ও ডিসকাউন্ট কুপন তৈরি করুন</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন কুপন</span>
        </button>
      </div>

      {/* KPI Metric Cards (Image 5 demo) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#181B26] border border-[#2B3042] rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs text-[#94A3B8] font-bold">মোট কুপন কোড</p>
            <h3 className="text-2xl font-black text-white mt-1">{coupons.length} টি</h3>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#181B26] border border-[#2B3042] rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs text-[#94A3B8] font-bold">সক্রিয় (Active) কুপন</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              {coupons.filter((c) => c.isActive).length} টি
            </h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Check className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#181B26] border border-[#2B3042] rounded-2xl p-4 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs text-[#94A3B8] font-bold">মোট কুপন ব্যবহার</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">54 বার</h3>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Ticket className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-[#181B26] border border-[#2B3042] rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#CBD5E1]">
            <thead className="bg-[#11131A] text-[#94A3B8] font-bold uppercase tracking-wider border-b border-[#2B3042]">
              <tr>
                <th className="p-3">COUPON CODE</th>
                <th className="p-3">DISCOUNT TYPE</th>
                <th className="p-3">VALUE</th>
                <th className="p-3">MIN ORDER AMOUNT</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B3042]">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#1E2330] transition-colors">
                  <td className="p-3 font-extrabold text-[#A5DD28] text-sm">
                    {c.code}
                  </td>
                  <td className="p-3">{c.type === 'PERCENTAGE' ? 'শতাংশ (%)' : 'ফ্ল্যাট BDT (৳)'}</td>
                  <td className="p-3 font-bold text-white">
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : `৳${c.value}`}
                  </td>
                  <td className="p-3 text-[#94A3B8]">
                    {c.minOrderAmount ? `৳${c.minOrderAmount}` : 'কোনো সীমাবদ্ধতা নেই'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 bg-[#2563EB]/20 text-blue-400 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this coupon?')) deleteCoupon(c.id);
                        }}
                        className="p-1.5 bg-red-500/10 text-red-400 rounded-lg"
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

      {/* Add / Edit Modal */}
      {isModalOpen && editingCoupon && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#181B26] border border-[#2B3042] rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 text-white my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#2B3042] pb-3">
              <h3 className="font-extrabold text-base">কুপন তৈরি / এডিট</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#94A3B8] font-bold mb-1">কুপন কোড (যেমন: KINO10) *</label>
                <input
                  type="text"
                  required
                  value={editingCoupon.code || ''}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value })}
                  className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] font-bold mb-1">ডিসকাউন্ট টাইপ</label>
                  <select
                    value={editingCoupon.type || 'PERCENTAGE'}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, type: e.target.value as 'PERCENTAGE' | 'FIXED' })
                    }
                    className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
                  >
                    <option value="PERCENTAGE">পার্সেন্টেজ (%)</option>
                    <option value="FIXED">ফ্ল্যাট টাকা (৳)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-bold mb-1">ডিসকাউন্ট মান</label>
                  <input
                    type="number"
                    required
                    value={editingCoupon.value || 0}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                    className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94A3B8] font-bold mb-1">ন্যূনতম অর্ডার মূল্য (BDT)</label>
                <input
                  type="number"
                  value={editingCoupon.minOrderAmount || 0}
                  onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrderAmount: Number(e.target.value) })}
                  className="w-full bg-[#11131A] border border-[#33384B] rounded-xl p-3 text-white"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={editingCoupon.isActive || false}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })}
                    className="accent-[#2563EB]"
                  />
                  <span>কুপনটি অ্যাক্টিভ রাখুন</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#2B3042]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 text-white font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold flex items-center gap-1"
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
