import { AlertTriangle, X, FileVideo, Image as ImageIcon, ArrowRight, ShieldAlert } from 'lucide-react';
import { MAX_MEDIA_SIZE_MB } from '../../utils/storageClient';

export interface FileSizeAlertDetails {
  fileName: string;
  fileSizeBytes: number;
  fileType: 'video' | 'image' | 'media';
  actionContext?: string; // e.g. "Project Cover Image", "Proof of Work Video", "Client Avatar"
}

interface FileSizeAlertModalProps {
  details: FileSizeAlertDetails | null;
  onClose: () => void;
}

export default function FileSizeAlertModal({ details, onClose }: FileSizeAlertModalProps) {
  if (!details) return null;

  const sizeMb = (details.fileSizeBytes / (1024 * 1024)).toFixed(1);
  const excessMb = (parseFloat(sizeMb) - MAX_MEDIA_SIZE_MB).toFixed(1);
  const isVideo = details.fileType === 'video';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-size-alert-title"
    >
      <div 
        className="w-full max-w-lg bg-slate-950 border border-amber-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl shadow-amber-500/10 relative text-slate-100 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Close warning alert"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                File Size Limit Exceeded
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Max: {MAX_MEDIA_SIZE_MB}MB
              </span>
            </div>
            <h3 id="file-size-alert-title" className="text-lg sm:text-xl font-bold text-white font-['Outfit',sans-serif] mt-1">
              File Exceeds Fixed 50MB Limit
            </h3>
            {details.actionContext && (
              <p className="text-xs text-slate-400 mt-0.5">
                Target: <strong className="text-slate-200">{details.actionContext}</strong>
              </p>
            )}
          </div>
        </div>

        {/* File Metrics Comparison Box */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5 truncate pr-2">
              {isVideo ? <FileVideo className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              <span className="truncate font-medium text-slate-200">{details.fileName}</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-red-950/60 border border-red-800/60 text-red-300 shrink-0">
              {sizeMb} MB
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-red-500/30">
              <div className="text-[10px] font-mono uppercase text-slate-400">Uploaded File Size</div>
              <div className="text-lg font-bold font-mono text-red-400 mt-0.5">
                {sizeMb} <span className="text-xs">MB</span>
              </div>
              <div className="text-[10px] text-red-400/80 font-mono mt-0.5">
                +{excessMb} MB over limit
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-teal-500/30">
              <div className="text-[10px] font-mono uppercase text-slate-400">Allowed Fixed Limit</div>
              <div className="text-lg font-bold font-mono text-teal-400 mt-0.5">
                {MAX_MEDIA_SIZE_MB} <span className="text-xs">MB</span>
              </div>
              <div className="text-[10px] text-teal-400/80 font-mono mt-0.5">
                Fixed Max Payload
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Guidance */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 space-y-1.5 leading-relaxed">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>How to resolve this:</span>
          </div>
          {isVideo ? (
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] sm:text-xs pt-1">
              <li>
                <strong>Option 1:</strong> Compress this video file below <strong>50MB</strong> (MP4 format with H.264 video codec recommended).
              </li>
              <li>
                <strong>Option 2:</strong> Paste an external video link from <strong>YouTube</strong>, <strong>Loom</strong>, or <strong>Vimeo</strong> directly into the Video URL field for instant zero-storage streaming.
              </li>
            </ul>
          ) : (
            <p className="text-slate-300 text-[11px] sm:text-xs">
              Please downscale or compress this image below <strong>50MB</strong>. Standard high-definition web photographs are typically between <strong>1MB and 5MB</strong>.
            </p>
          )}
        </div>

        {/* Dismiss Button */}
        <div className="pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            id="file-size-alert-dismiss-btn"
          >
            <span>Got It — Choose a File Under 50MB</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
