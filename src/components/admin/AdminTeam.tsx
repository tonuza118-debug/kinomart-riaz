import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Users, Phone, Mail, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { TeamMember } from '../../types';

export const AdminTeam: React.FC = () => {
  const { team, saveTeamMember, deleteTeamMember } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);

  const handleOpenAdd = () => {
    setEditingMember({
      id: `team-${Date.now()}`,
      name: '',
      role: 'Support Manager',
      phone: '',
      email: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember && editingMember.name && editingMember.phone) {
      saveTeamMember(editingMember as TeamMember);
      setIsModalOpen(false);
      setEditingMember(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#181B26] border border-[#2B3042] p-4 rounded-2xl flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2563EB]" />
            <span>টিম মেম্বারস (Team Management)</span>
          </h2>
          <p className="text-xs text-[#94A3B8]">এডমিন ও সাপোর্ট টিমের তালিকা (Supabase Database Synced)</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ নতুন সদস্য যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.map((member) => (
          <div
            key={member.id}
            className="bg-[#181B26] border border-[#2B3042] rounded-2xl p-5 space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-white text-base">{member.name}</h3>
                <span className="text-xs bg-[#2563EB]/20 text-blue-300 px-2.5 py-0.5 rounded font-bold">
                  {member.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(member)}
                  className="p-1.5 bg-[#2563EB]/20 text-blue-400 hover:bg-[#2563EB]/40 rounded-lg transition-colors cursor-pointer"
                  title="Edit Member"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this team member?')) {
                      deleteTeamMember(member.id);
                    }
                  }}
                  className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors cursor-pointer"
                  title="Delete Member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-[#CBD5E1] pt-2 border-t border-[#2B3042]">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#A5DD28]" />
                <span>{member.phone}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#A5DD28]" />
                <span>{member.email}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Team Member Edit/Add Modal */}
      {isModalOpen && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
          <div className="bg-[#181B26] border border-[#2B3042] rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#2B3042] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>{editingMember.id ? 'টিম সদস্য এডিট করুন' : 'নতুন সদস্য যুক্ত করুন'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-[#2B3042] text-[#94A3B8] hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">নাম *</label>
                <input
                  type="text"
                  required
                  value={editingMember.name || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  placeholder="সদস্যের পূর্ণ নাম"
                  className="w-full bg-[#0F111A] border border-[#2B3042] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">পদবী (Role) *</label>
                <input
                  type="text"
                  required
                  value={editingMember.role || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                  placeholder="e.g. Senior Support Lead / Admin"
                  className="w-full bg-[#0F111A] border border-[#2B3042] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">ফোন নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={editingMember.phone || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-[#0F111A] border border-[#2B3042] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-bold mb-1">ইমেইল *</label>
                <input
                  type="email"
                  required
                  value={editingMember.email || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  placeholder="email@kinomart.com"
                  className="w-full bg-[#0F111A] border border-[#2B3042] rounded-xl p-2.5 text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#2B3042]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#0F111A] hover:bg-[#2B3042] text-[#CBD5E1] font-bold rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-600 text-white font-black rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
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
