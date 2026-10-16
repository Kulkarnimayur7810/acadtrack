import React, { useState, useEffect } from 'react'
import { Modal, Button, Input, Badge } from '@/components/ui'
import { AVATAR_COLLECTION, getAvatarDataUrl, type AvatarOption } from '@/lib/avatars'
import { useAuthStore, toast } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { Check, Bot, Flame, Zap, Sparkles, Heart, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarPickerModalProps {
  open: boolean
  onClose: () => void
}

type CategoryTab = 'all' | 'robot' | 'demon' | 'cyber' | 'abstract' | 'cute'

const CATEGORY_TABS: { id: CategoryTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'All Avatars', icon: Sparkles },
  { id: 'robot', label: 'Robots & AI', icon: Bot },
  { id: 'demon', label: 'Devil & Fantasy', icon: Flame },
  { id: 'cyber', label: 'Cyber & Sci-Fi', icon: Zap },
  { id: 'abstract', label: 'Abstract', icon: Sparkles },
  { id: 'cute', label: 'Cute & Pets', icon: Heart },
]

export function AvatarPickerModal({ open, onClose }: AvatarPickerModalProps) {
  const { user, profile, setProfile } = useAuthStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [activeTab, setActiveTab] = useState<CategoryTab>('all')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedId(profile?.avatar_url || 'bot-neon')
      setDisplayName(profile?.full_name || '')
    }
  }, [open, profile])

  const filteredAvatars = activeTab === 'all'
    ? AVATAR_COLLECTION
    : AVATAR_COLLECTION.filter(a => a.category === activeTab)

  const selectedAvatar = AVATAR_COLLECTION.find(a => a.id === selectedId) || AVATAR_COLLECTION[0]
  const previewDataUrl = getAvatarDataUrl(selectedId)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updates = {
        avatar_url: selectedId,
        full_name: displayName.trim() || profile?.full_name || 'Anonymous User',
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
      } else {
        // Fallback local update
        setProfile({
          ...profile!,
          avatar_url: selectedId,
          full_name: displayName.trim() || profile?.full_name || 'Anonymous User',
          updated_at: new Date().toISOString(),
        })
      }

      toast('Profile & avatar updated successfully!', 'success')
      onClose()
    } catch (err: any) {
      console.error('[AvatarPickerModal] save error:', err)
      toast(err?.message || 'Failed to save avatar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customize Profile Avatar"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Live Preview Header Card */}
        <div className="bg-[#F7F7F5] border border-[#E5E7EB] rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-2 border-[#4338CA] p-1 bg-white shadow-sm flex items-center justify-center shrink-0">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt={selectedAvatar.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#EEF2FF] text-[#4338CA] font-bold text-xl flex items-center justify-center">
                  {displayName?.slice(0, 1) || 'U'}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#4338CA] text-white p-1 rounded-full shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 w-full space-y-2 text-center sm:text-left">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded-full inline-block mb-1">
                Selected: {selectedAvatar.name}
              </span>
              <p className="text-xs text-[#6B7280]">
                Choose your persona from robots, fantasy demons, cyber operatives, or cute companions.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#202124] block mb-1">
                Display Name
              </label>
              <Input
                placeholder="Enter your name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E5E7EB] scrollbar-none">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  active
                    ? 'bg-[#EEF2FF] text-[#4338CA] font-semibold border border-[#4338CA]/20'
                    : 'text-[#6B7280] hover:bg-[#F7F7F5] hover:text-[#202124]'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', active ? 'text-[#4338CA]' : 'text-[#9CA3AF]')} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-1">
          {filteredAvatars.map(avatar => {
            const isSelected = selectedId === avatar.id
            const avatarUrl = getAvatarDataUrl(avatar.id)

            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedId(avatar.id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer relative group',
                  isSelected
                    ? 'bg-[#EEF2FF]/60 border-[#4338CA] ring-2 ring-[#4338CA]/20 shadow-xs'
                    : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F7F7F5]'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#4338CA] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}

                <div className="w-14 h-14 rounded-full overflow-hidden border border-[#E5E7EB] bg-white group-hover:scale-105 transition-transform shrink-0">
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 w-full">
                  <p className="text-xs font-semibold text-[#202124] truncate">
                    {avatar.name}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] capitalize truncate">
                    {avatar.category}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
