import React, { useState } from 'react';
import { MuseumConfig, UserRole } from '../../types/museum';
import { Heart, ChevronRight, Users, Sparkles, Shield } from 'lucide-react';
import { soundtrack } from '../../services/soundtrack';

interface WelcomeModalProps {
  isOpen: boolean;
  onEnterMuseum: (customConfig?: MuseumConfig) => void;
  defaultConfig: MuseumConfig;
  userRole?: UserRole;
  isRoomFull?: boolean;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onEnterMuseum,
  defaultConfig,
  userRole = 'admin',
  isRoomFull = false,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<'intro' | 'character' | 'loading'>('intro');
  const [selectedAvatar, setSelectedAvatar] = useState<'kai' | 'mira'>(
    defaultConfig.selectedAvatar || (userRole === 'partner' ? 'mira' : 'kai')
  );
  const [height, setHeight] = useState<'Short' | 'Average' | 'Tall'>('Average');
  const [playerName, setPlayerName] = useState(() => {
    if (userRole === 'partner') {
      return (
        defaultConfig.partner2 ||
        (defaultConfig.partnerName && defaultConfig.partnerName !== 'James'
          ? defaultConfig.partnerName
          : 'Emily')
      );
    }
    return defaultConfig.playerName || 'James';
  });
  const [partnerName, setPartnerName] = useState(() => {
    if (userRole === 'partner') {
      return (
        defaultConfig.partner1 ||
        (defaultConfig.playerName && defaultConfig.playerName !== 'Emily'
          ? defaultConfig.playerName
          : 'James')
      );
    }
    return defaultConfig.partnerName || 'Emily';
  });
  const [progress, setProgress] = useState(0);

  // Synchronize when remote config from Firestore arrives
  React.useEffect(() => {
    if (userRole === 'partner') {
      const adminCreator =
        defaultConfig.partner1 ||
        (defaultConfig.playerName && defaultConfig.playerName !== 'Emily'
          ? defaultConfig.playerName
          : 'James');
      const partnerInvited =
        defaultConfig.partner2 ||
        (defaultConfig.partnerName && defaultConfig.partnerName !== 'James'
          ? defaultConfig.partnerName
          : 'Emily');

      setPlayerName(partnerInvited);
      setPartnerName(adminCreator);
      setSelectedAvatar('mira'); // Girl Sophia by default for invited partner
    } else {
      if (defaultConfig.playerName) setPlayerName(defaultConfig.playerName);
      if (defaultConfig.partnerName) setPartnerName(defaultConfig.partnerName);
      if (defaultConfig.selectedAvatar) setSelectedAvatar(defaultConfig.selectedAvatar);
    }
  }, [
    defaultConfig.partner1,
    defaultConfig.partner2,
    defaultConfig.playerName,
    defaultConfig.partnerName,
    defaultConfig.selectedAvatar,
    userRole,
  ]);

  // If room has reached capacity
  if (isRoomFull) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-sans">
        <div className="w-full max-w-md bg-[#141417] border border-rose-500/30 rounded-3xl p-8 text-stone-100 shadow-2xl flex flex-col items-center text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-normal text-white mb-2">
            Sanctuary Capacity Reached
          </h2>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-6">
            This private museum is exclusively reserved for <strong>2 members only</strong>, and both visitors are already inside exploring.
          </p>
          <span className="text-[11px] text-stone-400 font-mono">
            Limit: 2 / 2 Members Present
          </span>
        </div>
      </div>
    );
  }

  const handleStartCharacterSelect = () => {
    soundtrack.play();
    setStep('character');
  };

  const handleEnterWorld = (e: React.FormEvent) => {
    e.preventDefault();
    soundtrack.play();
    setStep('loading');

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const newConfig: MuseumConfig = {
            ...defaultConfig,
            selectedAvatar,
            playerName: playerName.trim() || (selectedAvatar === 'kai' ? 'Kai' : 'Mira'),
            partnerName: partnerName.trim() || (selectedAvatar === 'kai' ? 'Emily' : 'James'),
            coupleNames: `${playerName.trim() || 'James'} & ${partnerName.trim() || 'Emily'}`,
            userRole,
          };
          onEnterMuseum(newConfig);
        }, 300);
      } else {
        setProgress(current);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/95 backdrop-blur-md font-sans">
      
      {/* ============================================================== */}
      {/* SCREEN 1: "Explore Our Museum" (Romantic Private Sanctuary)   */}
      {/* ============================================================== */}
      {step === 'intro' && (
        <div className="w-full max-w-lg bg-[#141416] border border-white/10 rounded-3xl p-8 sm:p-10 text-stone-100 shadow-2xl flex flex-col items-center text-center animate-in fade-in duration-300">
          
          {/* Logo / Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            </div>
            <span className="font-serif italic text-2xl tracking-wide text-white">Our Museum</span>
          </div>

          <div className="text-[11px] text-stone-400 mb-3 flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            <span>Private Sanctuary · 2 Members Only</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white mb-3">
            Explore Our Museum
          </h1>

          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-md">
            {userRole === 'partner'
              ? `Welcome to your private 3D couple sanctuary, curated for you with love by ${partnerName}. Walk together through illuminated art halls, explore your shared memories, and enjoy your private cinema suite.`
              : 'Welcome to your private 3D couple sanctuary. Walk together through illuminated art halls, revisit your most precious photographs, and sit side-by-side in your private cinema suite.'}
          </p>

          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-6 text-left">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>{userRole === 'admin' ? 'Curator Admin Mode' : 'Partner Explorer Mode'}</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-normal">
              {userRole === 'admin'
                ? 'You have curator permissions to mount photos to frames, choose soundtrack songs, and configure cinema videos.'
                : `You are entering as the invited partner to explore the museum created by ${partnerName} and share moments together in real time.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={handleStartCharacterSelect}
              className="w-full sm:w-1/2 py-3 px-6 bg-white hover:bg-stone-200 text-stone-950 font-medium text-xs rounded-full transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              <span>Explore Museum</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleStartCharacterSelect}
              className="w-full sm:w-1/2 py-3 px-6 bg-white/10 hover:bg-white/15 text-stone-200 font-medium text-xs rounded-full border border-white/15 transition-all text-center"
            >
              Customize Look
            </button>
          </div>

          <span className="text-[11px] text-stone-500 mt-5">Exclusively for {userRole === 'admin' ? 'you and your partner' : 'the two of you'}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCREEN 2: "Choose who walks in" (Character & Name Customizer)  */}
      {/* ============================================================== */}
      {step === 'character' && (
        <div className="w-full max-w-2xl bg-[#f7f5ef] border border-stone-300 rounded-3xl overflow-hidden shadow-2xl text-stone-800 animate-in fade-in duration-300 flex flex-col md:flex-row">
          
          {/* Left Preview: Museum Entrance Gate & Character Figure */}
          <div className="md:w-1/2 bg-[#ece8de] p-8 flex flex-col items-center justify-center relative min-h-[340px] border-b md:border-b-0 md:border-r border-stone-300">
            <span className="font-serif text-xs uppercase tracking-widest text-stone-500 mb-2">Our Museum Entrance</span>
            
            {/* Visual Portrait Graphic for Selected Avatar */}
            <div className="relative w-44 h-60 rounded-2xl bg-gradient-to-b from-stone-100 to-stone-200 border-2 border-stone-300 shadow-lg flex flex-col items-center justify-center p-4 overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-stone-300/80 mb-3 flex items-center justify-center text-4xl shadow-inner">
                {selectedAvatar === 'kai' ? '🤵' : '👗'}
              </div>
              <span className="font-serif text-xl font-medium text-stone-900 capitalize">
                {selectedAvatar === 'kai' ? 'Kai (Boy)' : 'Mira (Girl)'}
              </span>
              <span className="text-xs text-stone-600 text-center mt-1 leading-tight">
                {selectedAvatar === 'kai'
                  ? 'Tailored navy suit · Silk tie · Gold watch · Oxford shoes'
                  : 'Rose blush gown · Flared skirt · Long wavy hair · Ankle heels'}
              </span>
            </div>

            <span className="text-xs text-stone-500 mt-3 italic font-serif">
              Ready to explore your museum
            </span>
          </div>

          {/* Right Column: Character Customization Options */}
          <form onSubmit={handleEnterWorld} className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-serif text-stone-500 uppercase tracking-widest block mb-1">
                Choose who walks in.
              </span>
              <h2 className="font-serif text-2xl text-stone-900 font-medium mb-4">Your look</h2>

              {/* Kai / Mira Switcher */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAvatar('kai');
                    if (userRole === 'admin') setPlayerName('James');
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedAvatar === 'kai'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-stone-700 text-white flex items-center justify-center text-xs">
                    K
                  </span>
                  <span>Kai</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAvatar('mira');
                    if (userRole === 'partner') setPlayerName('Emily');
                  }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    selectedAvatar === 'mira'
                      ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                      : 'bg-white text-stone-700 border-stone-300 hover:border-stone-400'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-stone-700 text-white flex items-center justify-center text-xs">
                    M
                  </span>
                  <span>Mira</span>
                </button>
              </div>

              {/* Height Options */}
              <div className="mb-4">
                <span className="text-xs text-stone-500 block mb-1.5">Height</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Short', 'Average', 'Tall'] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHeight(h)}
                      className={`py-1.5 text-xs rounded-lg border transition-all ${
                        height === h
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-300'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Your Name Input */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-stone-500 block">
                    {userRole === 'partner' ? 'Your name' : 'Your name (Curator)'}
                  </label>
                  {userRole === 'partner' && (
                    <span className="text-[10px] text-rose-700 bg-rose-100/70 border border-rose-300/50 font-medium px-2 py-0.5 rounded-full">
                      Entered by {partnerName}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Emily"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-stone-600 shadow-sm"
                />
              </div>

              {/* Partner Name Input */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-stone-500 block">
                    {userRole === 'partner'
                      ? 'Sanctuary Creator (Admin)'
                      : 'Partner name (special someone)'}
                  </label>
                  {userRole === 'partner' && (
                    <span className="text-[10px] text-amber-800 bg-amber-100/70 border border-amber-300/50 font-medium px-2 py-0.5 rounded-full">
                      Museum Creator
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. James"
                  readOnly={userRole === 'partner'}
                  className={`w-full px-3 py-2 border rounded-xl text-sm text-stone-900 focus:outline-none focus:border-stone-600 shadow-sm ${
                    userRole === 'partner'
                      ? 'bg-stone-100/90 text-stone-700 font-medium border-stone-300 cursor-default'
                      : 'bg-white border-stone-300'
                  }`}
                />
                {userRole === 'partner' && (
                  <p className="text-[11px] text-stone-500 mt-1 italic font-serif">
                    {partnerName} created and personalized this entire private sanctuary for you.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs rounded-full shadow-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Enter Museum</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* SCREEN 3: "Entering Our Museum"                                */}
      {/* ============================================================== */}
      {step === 'loading' && (
        <div className="w-full max-w-md bg-[#121214] border border-white/10 rounded-3xl p-8 text-stone-100 shadow-2xl flex flex-col items-center text-center animate-in fade-in duration-200">
          <h2 className="font-serif text-3xl font-normal text-white mb-2">
            Our Museum
          </h2>
          <p className="font-serif italic text-xs text-stone-400 mb-8">
            {userRole === 'partner'
              ? `Entering private sanctuary with ${partnerName}`
              : `From ${playerName} | To ${partnerName}`}
          </p>

          {/* Smooth Loading Bar */}
          <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden mb-3">
            <div
              className="bg-white h-full transition-all duration-150 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between w-full text-xs text-stone-400 font-sans">
            <span>Entering sanctuary</span>
            <span className="font-mono">{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
