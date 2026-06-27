import { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (imageSrc: string) => void;
  userId: string | null;
}

export default function ReceiptScanner({ isOpen, onClose, onScan, userId }: ReceiptScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera feed when modal opens or facingMode changes
  useEffect(() => {
    if (!isOpen) return;

    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        setCameraError(null);
        // Clean up any existing stream first
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.warn('Failed to access camera:', err);
        setCameraError(err.message || 'Camera blocked or not found.');
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  // Toggle between front and rear cameras
  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Trigger manual photo upload from file picker
  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Helper function to compress images
  const compressImage = (
    source: HTMLVideoElement | HTMLImageElement,
    callback: (result: string | Blob) => void,
    mode: 'base64' | 'blob'
  ) => {
    const canvas = document.createElement('canvas');
    const maxDim = mode === 'base64' ? 450 : 1280; // smaller for offline to fit local storage limit

    let width = 0;
    let height = 0;
    if (source instanceof HTMLVideoElement) {
      width = source.videoWidth || 640;
      height = source.videoHeight || 480;
    } else {
      width = source.naturalWidth || 640;
      height = source.naturalHeight || 480;
    }

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(source, 0, 0, width, height);
    }

    if (mode === 'base64') {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      callback(dataUrl);
    } else {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            callback(blob);
          } else {
            callback(canvas.toDataURL('image/jpeg', 0.8));
          }
        },
        'image/jpeg',
        0.85
      );
    }
  };

  // Direct Supabase storage file upload routine
  const performUpload = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const fileExt = 'jpg';
      // Use a cryptographically-strong unguessable id so receipt URLs can't be enumerated
      const uniqueId = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
      const folder = userId || 'anonymous';
      const fileName = `${folder}/${Date.now()}-${uniqueId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      if (!data.publicUrl) throw new Error('Failed to get public URL');

      onScan(data.publicUrl);
      onClose();
    } catch (err) {
      console.error('Failed to upload receipt to Supabase Storage:', err);
      alert('Failed to upload receipt to Supabase Storage. Storing locally as compressed fallback.');

      // Backup fallback: read blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        onScan(reader.result as string);
        onClose();
      };
      reader.readAsDataURL(blob);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle take picture button press
  const takePhoto = () => {
    if (cameraError || !videoRef.current || isUploading) return;

    setFlashOn(true);
    setTimeout(() => {
      setFlashOn(false);

      const video = videoRef.current;
      if (!video) return;

      const isOnline = userId && userId !== 'demo-local-user';

      if (isOnline) {
        compressImage(
          video,
          async (result) => {
            if (result instanceof Blob) {
              await performUpload(result);
            } else {
              // fallback if blob was converted to dataurl string
              onScan(result);
              onClose();
            }
          },
          'blob'
        );
      } else {
        compressImage(
          video,
          (result) => {
            onScan(result as string);
            onClose();
          },
          'base64'
        );
      }
    }, 150);
  };

  // Handle choosing a file from gallery
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const isOnline = userId && userId !== 'demo-local-user';

        if (isOnline) {
          compressImage(
            img,
            async (result) => {
              if (result instanceof Blob) {
                await performUpload(result);
              } else {
                onScan(result);
                onClose();
              }
            },
            'blob'
          );
        } else {
          compressImage(
            img,
            (result) => {
              onScan(result as string);
              onClose();
            },
            'base64'
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="absolute inset-0 z-[60] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
      {/* Top Header controls */}
      <div className="flex justify-between items-center p-5 pt-safe text-white z-10 shrink-0">
        <button 
          onClick={onClose} 
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full active:scale-95 transition-all cursor-pointer shadow-lg"
          disabled={isUploading}
        >
          <X className="w-5 h-5" />
        </button>
        <span className="font-bold text-sm tracking-wider uppercase drop-shadow">Scan Receipt</span>
        <div className="w-10"></div> {/* Spacer to keep title centered */}
      </div>

      {/* Hidden file input */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Preview Viewport */}
      <div className="flex-1 flex items-center justify-center p-6 relative min-h-0 bg-neutral-950">
        {!cameraError ? (
          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black flex items-center justify-center">
            {/* Live Video */}
            <video 
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Glowing Laser Scan Line Overlay */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_12px_#10b981] animate-scan pointer-events-none" />

            {/* Viewport Scanner target guide */}
            <div className="absolute inset-8 border-2 border-white/20 rounded-2xl pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 -mt-1 -ml-1 rounded-tl-xl"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 -mt-1 -mr-1 rounded-tr-xl"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 -mb-1 -ml-1 rounded-bl-xl"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 -mb-1 -mr-1 rounded-br-xl"></div>
            </div>
            
            {/* Live indicator tag */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur rounded-full text-[10px] font-bold text-white tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Live
            </div>
          </div>
        ) : (
          /* Camera Blocked/Error Fallback View */
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl space-y-5 shadow-2xl animate-in fade-in-50 duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-bold text-base">Camera Access Restricted</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Permission was denied, or camera is not available on this device. You can still scan by uploading an image.
              </p>
            </div>
            <button
              onClick={triggerFilePicker}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-95 shadow-md hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Select Photo from Gallery
            </button>
          </div>
        )}
      </div>

      {/* Shutter controls footer */}
      <div className="h-36 pb-safe flex items-center justify-around bg-black/60 backdrop-blur-md border-t border-white/5 shrink-0 z-10">
        {/* Upload from gallery */}
        <button 
          onClick={triggerFilePicker}
          disabled={isUploading}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full active:scale-95 transition-all text-white cursor-pointer shadow-lg disabled:opacity-40"
          title="Upload from gallery"
        >
          <Upload className="w-5 h-5" />
        </button>

        {/* Big Shutter capture button */}
        <button 
          onClick={takePhoto}
          disabled={!!cameraError || isUploading}
          className="w-20 h-20 rounded-full border-4 border-white/40 hover:border-white/60 flex items-center justify-center active:scale-90 hover:scale-105 transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:pointer-events-none"
        >
          <div className="w-[66px] h-[66px] bg-white rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-black" />
          </div>
        </button>

        {/* Switch camera toggle */}
        <button 
          onClick={toggleCamera}
          disabled={!!cameraError || isUploading}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full active:scale-95 active:rotate-180 transition-all duration-300 text-white cursor-pointer shadow-lg disabled:opacity-40 disabled:pointer-events-none"
          title="Switch Camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Uploading Loading Glass Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="flex flex-col items-center gap-4 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl text-center shadow-2xl max-w-[80%]">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-white">Uploading Receipt...</h4>
              <p className="text-[11px] text-neutral-400">Saving and optimizing receipt image to Supabase Storage</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen flash snapshot effect */}
      {flashOn && <div className="absolute inset-0 bg-white z-[70] animate-out fade-out duration-150"></div>}
    </div>
  );
}
