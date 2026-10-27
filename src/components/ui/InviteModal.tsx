import React, { useState } from 'react';
import { Copy, Check, Users, Sparkles, ExternalLink, X, Heart, Shield } from 'lucide-react';
import { RemotePlayer } from '../../types/multiplayer';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  remotePlayers: RemotePlayer[];
  localPlayerName: string;
  localAvatar: 'kai' | 'mira';
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  roomId,
  remotePlayers,
  localPlayerName,
  localAvatar,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  // Generate partner-specific invite link that works on both local dev and published cloud run domains
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/$/, '') : '';
  const shareUrl = `${origin}${pathname}/?room=${encodeURIComponent(roomId)}&role=partner`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpenSecondTab = () => {
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <div className="w-full max-w-md bg-[#161619] border border-white/10 rounded-3xl p-6 sm:p-7 text-stone-100 shadow-2xl animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-white flex items-center gap-1.5">
                <span>Invite Your Partner</span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
              </h3>
              <p className="text-[11px] text-stone-400">Exclusively for 2 members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room Code & Connection Pill */}
        <div className="bg-stone-900/90 border border-white/10 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-stone-400 uppercase tracking-wider font-mono">
              Room: <span className="text-white font-bold">{roomId}</span>
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Limit: 2 Members Max</span>
            </div>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed mb-3">
            Share this link with your special someone. When they open it, you will both explore in real-time. Only you (Admin) can curate images and videos.
          </p>

          {/* Shareable URL input with Copy button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-stone-200 font-mono select-all focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white hover:bg-stone-200 text-stone-950 shadow-md'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Players in Room */}
        <div className="mb-5 bg-white/5 border border-white/10 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2 font-medium">
            <span>Members Present</span>
            <span className="text-stone-300 font-mono">{1 + remotePlayers.length} / 2 Present</span>
          </div>

          <div className="space-y-2">
            {/* Local Player */}
            <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{localAvatar === 'kai' ? '🤵' : '💃'}</span>
                <span className="font-medium text-stone-200">{localPlayerName || 'You'}</span>
                <span className="text-[10px] text-amber-400 uppercase font-mono flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" /> Admin Curator
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">In Sanctuary</span>
            </div>

            {/* Remote Partner */}
            {remotePlayers.length > 0 ? (
              remotePlayers.map((player) => (
                <div key={player.id} className="flex items-center justify-between px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{player.avatar === 'kai' ? '🤵' : '💃'}</span>
                    <span className="font-medium text-rose-200">{player.name || 'Partner'}</span>
                    <span className="text-[10px] text-rose-400 uppercase font-mono">(Partner)</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-rose-300">
                    <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                    <span>In Sanctuary</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 bg-white/5 rounded-xl text-xs text-stone-400 italic text-center flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-stone-500" />
                <span>Waiting for partner to join link...</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Dual-Test Button */}
        <div className="space-y-2">
          <button
            onClick={handleOpenSecondTab}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-stone-200 border border-white/15 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Test Partner View in New Tab</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-medium transition-colors"
          >
            Return to Museum
          </button>
        </div>
      </div>
    </div>
  );
};
