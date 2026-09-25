import { useState, useRef } from 'react';
import { Play, Video, ShieldCheck, AlertCircle } from 'lucide-react';

interface ProjectVideoPlayerProps {
  videoUrl: string;
  posterImage?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
}

/**
 * Normalizes common video hosting links (YouTube, Vimeo, Loom) into embeddable iframe URLs.
 * If it's a direct video link or Base64/Blob data, returns null so a native <video> tag is used.
 */
function getEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // YouTube standard or short links
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  // Loom
  const loomMatch = trimmed.match(/(?:loom\.com\/(?:share|embed)\/)([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`;
  }

  return null;
}

export default function ProjectVideoPlayer({
  videoUrl,
  posterImage,
  title = 'Proof of Work Demo',
  className = '',
  autoPlay = false,
}: ProjectVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!videoUrl || !videoUrl.trim()) return null;

  const embedUrl = getEmbedUrl(videoUrl);

  const handleStartPlay = () => {
    setIsPlaying(true);
    if (!embedUrl && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Auto playback prevented:', err);
      });
    }
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group ${className}`}>
      {/* Proof of Work Verified Badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-teal-500/40 text-teal-300 text-[11px] font-semibold tracking-wide shadow-md pointer-events-none">
        <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
        <span>Proof of Work Video</span>
      </div>

      {embedUrl ? (
        // External Embed (YouTube, Vimeo, Loom)
        <div className="relative w-full aspect-video">
          {isPlaying ? (
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div 
              className="relative w-full h-full cursor-pointer flex items-center justify-center group"
              onClick={handleStartPlay}
            >
              {posterImage ? (
                <img
                  src={posterImage}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                  <Video className="w-12 h-12 text-slate-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-teal-500/90 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 ml-1 fill-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Native HTML5 Video (MP4, WebM, MOV, Data URL)
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterImage}
            controls
            playsInline
            onError={() => setHasError(true)}
            className="w-full h-full object-contain"
          >
            Your browser does not support playing this video demonstration.
          </video>

          {hasError && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-xs text-slate-300">
                Unable to play this video format directly.
              </p>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs text-teal-400 underline hover:text-teal-300"
              >
                Open video in new tab
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
