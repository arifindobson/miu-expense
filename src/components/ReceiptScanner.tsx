import { useState } from 'react';
import { X, ScanLine } from 'lucide-react';

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (imageSrc: string) => void;
}

const DUMMY_RECEIPT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="150" viewBox="0 0 100 150"><rect width="100" height="150" fill="%23f8fafc"/><rect x="10" y="10" width="80" height="20" fill="%23cbd5e1" rx="4"/><rect x="10" y="40" width="60" height="10" fill="%23e2e8f0" rx="2"/><rect x="10" y="60" width="40" height="10" fill="%23e2e8f0" rx="2"/><rect x="10" y="80" width="70" height="10" fill="%23e2e8f0" rx="2"/><line x1="10" y1="100" x2="90" y2="100" stroke="%2394a3b8" stroke-width="2" stroke-dasharray="4"/><rect x="50" y="110" width="40" height="15" fill="%2394a3b8" rx="4"/></svg>`;

export default function ReceiptScanner({ isOpen, onClose, onScan }: ReceiptScannerProps) {
  const [flashOn, setFlashOn] = useState(false);

  const takePhoto = () => {
    setFlashOn(true);
    setTimeout(() => {
      setFlashOn(false);
      onScan(DUMMY_RECEIPT);
      onClose();
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center p-5 pt-safe text-white">
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full active:scale-90 transition-transform cursor-pointer">
          <X className="w-6 h-6" />
        </button>
        <span className="font-medium text-sm">Scan Receipt</span>
        <div className="w-10"></div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white -mt-1 -mr-1 rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -mb-1 -ml-1 rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white -mb-1 -mr-1 rounded-br-xl"></div>
        </div>
        <ScanLine className="w-16 h-16 text-white/20 animate-pulse" />
      </div>

      <div className="h-32 pb-safe flex items-center justify-center bg-black/50">
        <button 
          onClick={takePhoto}
          className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
        >
          <div className="w-[68px] h-[68px] bg-white rounded-full"></div>
        </button>
      </div>

      {flashOn && <div className="absolute inset-0 bg-white z-50"></div>}
    </div>
  );
}
