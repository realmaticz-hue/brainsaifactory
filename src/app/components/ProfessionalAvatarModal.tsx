// Modal wrapper for Professional Avatar Generator
import { X } from 'lucide-react';
import { HeyGenProAvatarStudio } from './HeyGenProAvatarStudio';

interface ProfessionalAvatarModalProps {
  isopen: boolean;
  onClose: () => void;
}

export function ProfessionalAvatarModal({ isopen, onClose }: ProfessionalAvatarModalProps) {
  if (!isopen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Professional Avatar Studio - HeyGen Level</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <HeyGenProAvatarStudio />
        </div>
      </div>
    </div>
  );
}