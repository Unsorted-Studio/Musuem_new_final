import React, { useState, useEffect } from 'react';
import { PictureFrameItem, UserRole } from '../../types/museum';
import { X, Upload, Calendar, Edit3, Check, Lock, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { uploadMediaAsset } from '../../services/museumStorage';

interface PhotoLightboxModalProps {
  frame: PictureFrameItem | null;
  onClose: () => void;
  onSaveFrame: (updated: PictureFrameItem) => void;
  userRole?: UserRole;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  frame,
  onClose,
  onSaveFrame,
  userRole = 'admin',
}) => {
  if (!frame) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState(frame.title);
  const [date, setDate] = useState(frame.date);
  const [story, setStory] = useState(frame.story);
  const [imageUrl, setImageUrl] = useState(frame.imageUrl || '');
  const [frameWidth, setFrameWidth] = useState(frame.width);
  const [frameHeight, setFrameHeight] = useState(frame.height);
  const [isSaved, setIsSaved] = useState(false);
  const [isFullScreenBig, setIsFullScreenBig] = useState(false);

  // Sync state whenever selected frame changes
  useEffect(() => {
    if (frame) {
      setTitle(frame.title);
      setDate(frame.date);
      setStory(frame.story);
      setImageUrl(frame.imageUrl || '');
      setFrameWidth(frame.width);
      setFrameHeight(frame.height);
      setIsFullScreenBig(false);
      setIsEditing(false);
    }
  }, [frame]);

  // Handle local image upload with compression and database-ready permanent URL
  // Automatically measures the image's natural width/height and computes frame size matching exact photo ratio!
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (userRole !== 'admin') return;
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawUrl = event.target.result as string;

          // Measure image natural dimensions and calculate matching frame ratio
          const img = new Image();
          img.onload = async () => {
            const aspect = img.naturalWidth / img.naturalHeight;
            let targetWidth = 2.4;
            let targetHeight = 2.4 / aspect;

            if (aspect < 0.95) {
              // Portrait orientation
              targetHeight = 2.3;
              targetWidth = 2.3 * aspect;
            } else if (aspect > 2.0) {
              // Panoramic orientation
              targetWidth = 2.9;
              targetHeight = 2.9 / aspect;
            }

            const calculatedWidth = Math.round(targetWidth * 100) / 100;
            const calculatedHeight = Math.round(targetHeight * 100) / 100;

            setFrameWidth(calculatedWidth);
            setFrameHeight(calculatedHeight);

            // Compress to maximum 1600px dimension with high quality JPEG
            const canvas = document.createElement('canvas');
            const maxDimension = 1600;
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            if (w > maxDimension || h > maxDimension) {
              if (w > h) {
                h = Math.round((h * maxDimension) / w);
                w = maxDimension;
              } else {
                w = Math.round((w * maxDimension) / h);
                h = maxDimension;
              }
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
            }
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);

            // Upload permanently so image persists across refreshes
            try {
              const permanentUrl = await uploadMediaAsset({
                filename: file.name || 'photo.jpg',
                data: compressedDataUrl,
              });
              setImageUrl(permanentUrl || compressedDataUrl);
            } catch {
              setImageUrl(compressedDataUrl);
            } finally {
              setIsUploading(false);
            }
          };
          img.src = rawUrl;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (userRole !== 'admin') return;
    const updated: PictureFrameItem = {
      ...frame,
      title: title.trim() || 'Untitled Moment',
      date: date.trim() || 'Timeless',
      story: story.trim() || 'A cherished memory in our museum.',
      imageUrl: imageUrl,
      width: frameWidth,
      height: frameHeight,
      aspectRatio: frameWidth / frameHeight,
    };
    onSaveFrame(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsEditing(false);
    }, 800);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. MAIN LIGHTBOX MODAL (Dedicated Single Frame Presentation)   */}
      {/* ============================================================== */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-sans">
        <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col md:flex-row bg-[#151518] border border-white/10 rounded-2xl overflow-hidden shadow-2xl text-stone-100">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-stone-400 hover:text-white bg-black/60 hover:bg-black/90 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Artwork Visual Presentation */}
          <div className="relative md:w-3/5 bg-black/90 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/10 min-h-[340px]">
            {imageUrl ? (
              <div className="relative flex flex-col items-center justify-center group">
                <div
                  onClick={() => setIsFullScreenBig(true)}
                  className="relative p-2.5 bg-stone-900 border-2 border-white/15 rounded-sm shadow-2xl max-h-[72vh] cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
                  title="Click to view in full big size"
                >
                  <img
                    src={imageUrl}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="max-h-[62vh] w-auto object-contain rounded-xs select-none"
                  />
                  
                  {/* Subtle click-to-expand hover pill */}
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-xs">
                    <div className="px-3 py-1.5 bg-black/80 text-white text-xs font-medium rounded-full border border-white/20 flex items-center gap-1.5 shadow-xl">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Click for Full Big Size</span>
                    </div>
                  </div>
                </div>

                {/* Direct button to trigger Full Big Size */}
                <button
                  type="button"
                  onClick={() => setIsFullScreenBig(true)}
                  className="mt-3 text-xs text-stone-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>View in Full Big Size</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/20 rounded-xl max-w-sm">
                <div className="w-14 h-14 mb-3 rounded-full bg-white/5 flex items-center justify-center text-stone-400">
                  {userRole === 'admin' ? (
                    <Upload className="w-6 h-6 text-amber-400" />
                  ) : (
                    <Lock className="w-6 h-6 text-stone-500" />
                  )}
                </div>
                <h3 className="font-serif text-lg text-stone-200 mb-1">
                  {userRole === 'admin' ? 'Mount Your Photo' : 'Memory in Curating'}
                </h3>
                <p className="text-xs text-stone-400 mb-4 leading-relaxed">
                  {userRole === 'admin'
                    ? 'Upload a photo for this frame. The frame size will automatically adapt to match your photo ratio.'
                    : 'Your partner is currently curating this collection. Your memory will appear here.'}
                </p>
                {userRole === 'admin' && (
                  <label className="cursor-pointer px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold rounded-full transition-colors inline-flex items-center gap-2 shadow-lg disabled:opacity-50">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Photo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose Photo from Device</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Curatorial Description & Editor */}
          <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Museum Accession Header */}
              <div className="flex items-center justify-between text-[11px] text-amber-400 uppercase tracking-widest font-mono mb-3">
                <span>Gallery Collection</span>
                <span className="text-stone-500">REF-{frame.id.toUpperCase()}</span>
              </div>

              {!isEditing ? (
                <>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-100 mb-2 leading-tight">
                    {frame.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-stone-400 mb-5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>{frame.date}</span>
                    <span>·</span>
                    <span className="capitalize">{frame.roomId} Gallery</span>
                  </div>

                  <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-6 whitespace-pre-line font-sans">
                    {frame.story}
                  </p>

                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-stone-400 mb-4">
                    <span className="text-stone-300 font-medium block mb-0.5">Custom Frame Dimensions:</span>
                    <span>{frameWidth.toFixed(2)}m × {frameHeight.toFixed(2)}m (Ratio: {(frameWidth / frameHeight).toFixed(2)}:1)</span>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Title of Moment</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Under the Golden Maples"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Date / Season</label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="e.g. Autumn 2021"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Your Story & Reflection</label>
                    <textarea
                      rows={4}
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      placeholder="Tell the story behind this moment..."
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400 leading-relaxed resize-none"
                    />
                  </div>

                  {userRole === 'admin' && (
                    <div>
                      <label className="text-xs text-stone-400 block mb-1.5 font-medium">Replace Photo</label>
                      <label className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-amber-400/50 rounded-xl cursor-pointer text-xs text-stone-300 transition-all">
                        {isUploading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                            <span>Uploading and Sizing Frame...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>Upload New Photo (Auto-Sizes Frame)</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between">
              {userRole === 'admin' ? (
                !isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Curate Frame & Photo</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full justify-end">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-1.5 text-xs text-stone-400 hover:text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                      <span>{isSaved ? 'Saved to Wall' : 'Save & Mount'}</span>
                    </button>
                  </div>
                )
              ) : (
                <span className="text-[11px] text-stone-400 italic">
                  Mounted in your permanent sanctuary collection
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FULL BIG SIZE PHOTO IMMERSION VIEW                         */}
      {/* ============================================================== */}
      {isFullScreenBig && imageUrl && (
        <div
          onClick={() => setIsFullScreenBig(false)}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 cursor-zoom-out font-sans"
        >
          {/* Top Bar with title and Close button */}
          <div className="w-full max-w-6xl flex items-center justify-between pb-3 px-2 z-10 text-stone-200">
            <div className="flex items-center gap-3">
              <span className="font-serif italic text-lg sm:text-xl text-white">{title}</span>
              <span className="text-xs text-stone-400 font-mono">({date})</span>
            </div>
            <button
              onClick={() => setIsFullScreenBig(false)}
              className="p-2 text-stone-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all flex items-center gap-1.5 text-xs px-3"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Close Full Size</span>
            </button>
          </div>

          {/* Full High-Res Big Size Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[94vw] max-h-[85vh] p-2 bg-stone-950 border border-white/20 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden"
          >
            <img
              src={imageUrl}
              alt={title}
              referrerPolicy="no-referrer"
              className="max-h-[82vh] max-w-[92vw] w-auto h-auto object-contain rounded-xs shadow-2xl"
            />
          </div>

          {/* Bottom subtitle caption */}
          {story && (
            <p className="mt-3 text-stone-300 text-xs sm:text-sm text-center max-w-2xl px-4 line-clamp-2 italic font-serif">
              "{story}"
            </p>
          )}
        </div>
      )}
    </>
  );
};
