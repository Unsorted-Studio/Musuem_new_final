import React, { useState } from 'react';
import { MuseumConfig } from '../../types/museum';
import { X, Edit3, Check } from 'lucide-react';

interface DedicationModalProps {
  config: MuseumConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveConfig: (updated: Partial<MuseumConfig>) => void;
}

export const DedicationModal: React.FC<DedicationModalProps> = ({
  config,
  isOpen,
  onClose,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [partner1, setPartner1] = useState(
    config.partner1 || (config.userRole === 'admin' ? config.playerName : config.partnerName) || 'James'
  );
  const [partner2, setPartner2] = useState(
    config.partner2 || (config.userRole === 'admin' ? config.partnerName : config.playerName) || 'Emily'
  );
  const [letter, setLetter] = useState(config.dedicationLetter);
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    setPartner1(
      config.partner1 ||
        (config.userRole === 'admin' ? config.playerName : config.partnerName) ||
        'James'
    );
    setPartner2(
      config.partner2 ||
        (config.userRole === 'admin' ? config.partnerName : config.playerName) ||
        'Emily'
    );
    setLetter(config.dedicationLetter);
  }, [
    config.partner1,
    config.partner2,
    config.playerName,
    config.partnerName,
    config.dedicationLetter,
    config.userRole,
  ]);

  const authorName =
    config.partner1 ||
    (config.userRole === 'admin' ? config.playerName : config.partnerName) ||
    'James';
  const recipientName =
    config.partner2 ||
    (config.userRole === 'admin' ? config.partnerName : config.playerName) ||
    'Emily';

  const handleSave = () => {
    onSaveConfig({
      partner1: partner1.trim() || authorName,
      partner2: partner2.trim() || recipientName,
      playerName: partner1.trim() || authorName,
      partnerName: partner2.trim() || recipientName,
      coupleNames: `${partner1.trim() || authorName} & ${partner2.trim() || recipientName}`,
      subtitle: `A Permanent Collection for ${partner2.trim() || recipientName}`,
      dedicationLetter: letter.trim(),
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsEditing(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      
      {/* Exact GiftVera Floating Plaque Card */}
      <div className="relative w-full max-w-xl bg-[#141416] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-stone-100 flex flex-col">
        
        {/* Top Bar with "Viewing" badge & "Close" button */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="w-16" />
          <span className="px-3.5 py-1 rounded-full bg-white/10 text-xs text-stone-300 font-serif italic">
            Viewing
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 sm:p-12 text-center">
          {!isEditing ? (
            <div>
              <span className="text-xs uppercase tracking-widest text-stone-400 font-sans block mb-3 text-[11px]">
                A PERMANENT COLLECTION
              </span>

              <h2 className="font-serif italic text-4xl sm:text-5xl font-medium text-white mb-6">
                For {recipientName}
              </h2>

              <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto whitespace-pre-line font-sans">
                {(() => {
                  let text = (config.dedicationLetter || 'A private 3D sanctuary created for our timeless love story.').trim();
                  if (text.toLowerCase().includes('love,')) {
                    text = text.substring(0, text.toLowerCase().lastIndexOf('love,')).trim();
                  }
                  return text;
                })()}
              </p>

              <p className="font-serif italic text-base text-amber-300/80 mb-6">
                Love, {authorName}
              </p>

              {config.userRole === 'admin' && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white text-xs rounded-full transition-colors border border-white/10"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Customize dedication</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stone-400 block mb-1">To (Partner Name)</label>
                  <input
                    type="text"
                    value={partner2}
                    onChange={(e) => setPartner2(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-white focus:outline-none focus:border-stone-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-stone-400 block mb-1">From (Your Name)</label>
                  <input
                    type="text"
                    value={partner1}
                    onChange={(e) => setPartner1(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-white focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-400 block mb-1">Your Personal Message</label>
                <textarea
                  rows={4}
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-white focus:outline-none focus:border-stone-500 leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-stone-800 text-stone-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 bg-white hover:bg-stone-200 text-stone-950 font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5" /> : 'Save words'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
