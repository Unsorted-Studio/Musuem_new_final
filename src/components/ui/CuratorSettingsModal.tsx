import React, { useState } from 'react';
import { SOUNDTRACK_OPTIONS, soundtrack } from '../../services/soundtrack';
import { Music, Video, X, Check, Upload, Disc, Play, Pause, RefreshCw, Loader2 } from 'lucide-react';
import { uploadMediaAsset } from '../../services/museumStorage';

interface CuratorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSongId: string;
  customAudioUrl?: string;
  cinemaVideoUrl?: string;
  initialTab?: 'music' | 'video';
  onSaveSettings: (settings: {
    selectedSongId: string;
    customAudioUrl?: string;
    cinemaVideoUrl?: string;
  }) => void;
}

export const CuratorSettingsModal: React.FC<CuratorSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedSongId,
  customAudioUrl = '',
  cinemaVideoUrl = '',
  initialTab = 'music',
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'music' | 'video'>(
    initialTab === 'video' ? 'video' : 'music'
  );
  const [songId, setSongId] = useState(selectedSongId);
  const [customAudio, setCustomAudio] = useState(customAudioUrl);
  const [videoUrl, setVideoUrl] = useState(cinemaVideoUrl);
  const [isPlayingPreview, setIsPlayingPreview] = useState(soundtrack.getIsPlaying());
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Handle local song file upload (MP3/WAV) with persistent database storage
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAudio(true);
      try {
        const permanentUrl = await uploadMediaAsset(file);
        if (permanentUrl) {
          setCustomAudio(permanentUrl);
          setSongId('custom');
          soundtrack.setTrack('custom', permanentUrl);
        }
      } catch (err) {
        console.error('Audio upload failed:', err);
      } finally {
        setIsUploadingAudio(false);
      }
    }
  };

  const handleSelectTrack = (id: string) => {
    setSongId(id);
    soundtrack.setTrack(id, customAudio);
  };

  const handleTogglePlay = () => {
    const playing = soundtrack.toggle();
    setIsPlayingPreview(playing);
  };

  const handleApply = () => {
    onSaveSettings({
      selectedSongId: songId,
      customAudioUrl: customAudio,
      cinemaVideoUrl: videoUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
      <div className="w-full max-w-lg bg-[#151518] border border-white/10 rounded-3xl p-6 sm:p-7 text-stone-100 shadow-2xl animate-in fade-in duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-white">Curator Studio</h3>
              <p className="text-[11px] text-stone-400">Soundtrack and cinema room screen settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: 2 tabs (Soundtrack & Cinema Video) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-xl mb-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('music')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'music'
                ? 'bg-white/15 text-white shadow-sm font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Soundtrack</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'video'
                ? 'bg-white/15 text-white shadow-sm font-semibold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Cinema Video</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: MUSIC & SOUNDTRACK SELECTION                            */}
        {/* ============================================================== */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePlay}
                  className="w-9 h-9 rounded-full bg-amber-400 hover:bg-amber-300 text-stone-950 flex items-center justify-center transition-all shadow-md"
                >
                  {isPlayingPreview ? (
                    <Pause className="w-4 h-4 fill-stone-950" />
                  ) : (
                    <Play className="w-4 h-4 fill-stone-950 ml-0.5" />
                  )}
                </button>
                <div>
                  <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider block">
                    Now Playing
                  </span>
                  <span className="text-xs font-medium text-stone-100">
                    {songId === 'custom'
                      ? 'Custom Uploaded Soundtrack'
                      : SOUNDTRACK_OPTIONS.find((t) => t.id === songId)?.title || 'Romantic Melody'}
                  </span>
                </div>
              </div>
            </div>

            {/* Curated Track Options List */}
            <div className="space-y-2">
              <span className="text-xs text-stone-400 block mb-1 font-medium">Curated Classical Repertoire:</span>
              {SOUNDTRACK_OPTIONS.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    songId === track.id
                      ? 'bg-amber-500/15 border-amber-500/40 text-white shadow-sm'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-stone-300'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-semibold text-stone-100">{track.title}</h4>
                    <p className="text-[10px] text-stone-400">
                      {track.composer} · <span className="italic">{track.description}</span>
                    </p>
                  </div>
                  {songId === track.id && (
                    <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Song Audio File Upload */}
            <div className="pt-2 border-t border-white/10">
              <label className="text-xs text-stone-400 block mb-2 font-medium">
                Or Upload Your Own Romantic Song (MP3 / WAV / AAC):
              </label>
              <label className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-amber-400/50 rounded-xl cursor-pointer text-xs text-stone-300 transition-all">
                {isUploadingAudio ? (
                  <>
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Saving soundtrack to database...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload Song from Computer (Saved in DB)</span>
                  </>
                )}
                <input
                  type="file"
                  accept="audio/*"
                  disabled={isUploadingAudio}
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CINEMA ROOM VIDEO CUSTOMIZATION                         */}
        {/* ============================================================== */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-200 leading-relaxed flex items-center gap-2.5">
              <Video className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Customize the video playing on the cinema room screen.
              </span>
            </div>

            {/* Upload Video File */}
            <div>
              <label className="text-xs text-stone-300 block mb-1.5 font-medium">
                Upload Romantic Video File (MP4, WebM, MOV):
              </label>
              <label className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-rose-400/50 rounded-2xl cursor-pointer text-xs text-stone-300 transition-all">
                {isUploadingVideo ? (
                  <>
                    <Loader2 className="w-6 h-6 text-rose-400 mb-1 animate-spin" />
                    <span className="font-medium text-rose-300">Uploading and saving video to database...</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">Please wait a moment while it finishes</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-rose-400 mb-1" />
                    <span className="font-medium text-stone-200">Click to Select Video from Device</span>
                    <span className="text-[10px] text-stone-400 mt-0.5">MP4, WebM, QuickTime (.mov) supported</span>
                  </>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  disabled={isUploadingVideo}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploadingVideo(true);
                      try {
                        const permanentUrl = await uploadMediaAsset(file);
                        if (permanentUrl) {
                          setVideoUrl(permanentUrl);
                        }
                      } catch (err) {
                        console.error('Video upload failed:', err);
                      } finally {
                        setIsUploadingVideo(false);
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* Direct Video URL Link Input */}
            <div>
              <label className="text-xs text-stone-300 block mb-1 font-medium">
                Or Paste Direct Video URL (MP4 / WebM Link)
              </label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://.../video.mp4"
                className="w-full px-3 py-2 bg-black/50 border border-white/15 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-rose-400 font-mono"
              />
            </div>

            {/* Current screen mode / Reset to celestial cinema */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <span className="text-xs font-medium text-stone-200 block">
                    {videoUrl ? 'Custom Video Loaded' : 'Celestial Cinema Reel Active'}
                  </span>
                  <span className="text-[10px] text-stone-400 block mt-0.5">
                    {videoUrl
                      ? 'Playing your custom video on the cinema screen.'
                      : 'Playing animated romantic cosmic nebula and starlight projection.'}
                  </span>
                </div>
                {videoUrl && (
                  <button
                    type="button"
                    onClick={() => setVideoUrl('')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white text-xs transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset to Celestial</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-stone-300 text-xs rounded-xl transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs rounded-xl font-semibold transition-colors shadow-lg"
          >
            Save & Sync Museum
          </button>
        </div>
      </div>
    </div>
  );
};
