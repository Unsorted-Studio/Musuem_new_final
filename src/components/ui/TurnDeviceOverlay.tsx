import React, { useState, useEffect } from 'react';

/**
 * Mobile Horizontal Orientation Overlay
 * When on mobile/tablet devices in portrait mode, prompts the user to rotate their phone sideways.
 * Strictly enforced with no bypass button as requested.
 */
export const TurnDeviceOverlay: React.FC = () => {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window === 'undefined') return;

      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;

      // Portrait check: height greater than width, and width indicates mobile/tablet viewport
      const isPortrait = window.innerHeight > window.innerWidth;
      const isSmallOrTouchScreen = isTouch || window.innerWidth <= 1024;

      setIsPortraitMobile(isPortrait && isSmallOrTouchScreen);
    };

    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortraitMobile) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-[#000000] text-white flex flex-col items-center justify-center p-6 text-center select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="flex flex-col items-center max-w-xs animate-in fade-in duration-300">
        
        {/* Sleek rotating phone animation matching reference */}
        <div className="relative w-24 h-40 flex items-center justify-center">
          <div className="w-16 h-28 border-2 border-stone-200/90 rounded-[22px] p-1 flex flex-col justify-between items-center shadow-2xl relative transition-transform duration-700 animate-[bounce_3s_ease-in-out_infinite]">
            {/* Top speaker / camera pill */}
            <div className="w-4 h-1 bg-stone-500 rounded-full mt-0.5" />

            {/* Subtle screen shine */}
            <div className="w-full flex-1 mx-1 my-1 rounded-[14px] bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-stone-400 animate-spin"
                style={{ animationDuration: '4s' }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>

            {/* Bottom home indicator bar */}
            <div className="w-6 h-0.5 bg-stone-500 rounded-full mb-0.5" />
          </div>
        </div>

        {/* Turn your device heading */}
        <h2 className="font-serif text-2xl sm:text-3xl font-light text-white tracking-normal mt-6 mb-2">
          Turn your device
        </h2>

        {/* Sideways prompt text */}
        <p className="text-stone-400 text-sm font-light">
          Sideways gives you the best experience.
        </p>

        {/* Strictly horizontal view only: no 'Continue anyway' button */}
      </div>
    </div>
  );
};
