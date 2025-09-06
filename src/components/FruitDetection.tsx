/**
 * Fruit Detection Component with Overlay Visualization
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Settings, AlertCircle, Loader, X } from 'lucide-react';
import { FruitDetectionResult } from '../types/fruitDetection';

interface FruitDetectionProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
  detectionResults: FruitDetectionResult | null;
  error: string | null;
  isProcessing: boolean;
  detectFruits: (base64Image: string) => Promise<void>;
  initializeDetector: (apiKey: string) => void;
  clearResults: () => void;
  isDetectorReady: boolean;
  detailPopupResult: FruitDetectionResult | null;
  onCloseDetailPopup: () => void;
}

export const FruitDetection: React.FC<FruitDetectionProps> = ({
  videoRef,
  isActive,
  onToggle,
  className = '',
  detectionResults,
  error,
  isProcessing,
  detectFruits,
  initializeDetector,
  clearResults,
  isDetectorReady,
  detailPopupResult,
  onCloseDetailPopup
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);
  
  // Get stored API key from localStorage on mount
  useEffect(() => {
    const envApiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envApiKey) {
      setApiKey(envApiKey);
      initializeDetector(envApiKey);
      return;
    }
    const storedApiKey = localStorage.getItem('gemini-api-key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      initializeDetector(storedApiKey);
    }
  }, [initializeDetector]);

  // Handle API key submission
  const handleApiKeySubmit = useCallback(() => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini-api-key', apiKey.trim());
      initializeDetector(apiKey.trim());
      setShowSettings(false);
    }
  }, [apiKey, initializeDetector]);

  // Capture frame from video and process for real-time detection
  const captureAndDetect = useCallback(async () => {
    if (!videoRef?.current || !canvasRef.current || !isDetectorReady) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.8);
    
    // Detect fruits
    await detectFruits(base64Image);
  }, [videoRef, isDetectorReady, detectFruits]);

  // Start/stop real-time detection loop
  useEffect(() => {
    if (isActive && isDetectorReady) {
      intervalRef.current = window.setInterval(captureAndDetect, 1000); // Every 1 second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      clearResults();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isDetectorReady, captureAndDetect, clearResults]);

  return (
    <div className={`relative ${className}`}>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Control Panel */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Detection Toggle */}
        <button
          onClick={onToggle}
          disabled={!isDetectorReady && isActive}
          className={`p-3 rounded-full backdrop-blur-xl border transition-all ${
            isActive
              ? 'bg-green-500/20 border-green-400 text-green-400'
              : 'bg-zinc-900/80 border-zinc-600 text-zinc-400 hover:text-white'
          } ${!isDetectorReady ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          title={isActive ? 'Disable Fruit Detection' : 'Enable Fruit Detection'}
        >
          {isActive ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>

        {/* Settings Toggle (only show if API key is not from env) */}
        {!import.meta.env.VITE_GEMINI_API_KEY && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-600 text-zinc-400 hover:text-white hover:scale-105 transition-all"
            title="Detection Settings"
          >
            <Settings size={20} />
          </button>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-3 rounded-full bg-blue-500/20 border-blue-400 text-blue-400">
            <Loader size={20} className="animate-spin" />
          </div>
        )}

        {/* Error Indicator */}
        {error && (
          <div className="p-3 rounded-full bg-red-500/20 border border-red-400 text-red-400">
            <AlertCircle size={20} />
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-4 right-20 z-20 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl p-4 w-80">
          <h3 className="text-white font-semibold mb-3">Fruit Detection Settings</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-zinc-300 text-sm mb-2">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:border-blue-400 focus:outline-none"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleApiKeySubmit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save & Initialize
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Status Information */}
          <div className="mt-4 pt-3 border-t border-zinc-700">
            <div className="text-xs text-zinc-400 space-y-1">
              <div>Status: {isDetectorReady ? 'Ready' : 'Not Initialized'}</div>
              {detectionResults && (
                <div>Detected: {detectionResults.fruits.length} fruit(s)</div>
              )}
              {error && (
                <div className="text-red-400">Error: {error}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Detection Pop-up */}
      {isActive && detectionResults && detectionResults.fruits.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-lg border border-zinc-700 rounded-xl p-4 w-11/12 max-w-md shadow-2xl">
          <h3 className="text-white text-center font-bold mb-2">
            Detected Fruits ({detectionResults.fruits.length})
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {detectionResults.fruits.map((fruit, index) => (
              <div key={index} className="text-sm text-zinc-200 bg-zinc-800/50 p-2 rounded-lg text-center">
                <span className="font-semibold capitalize">{fruit.name}</span>
                <span className="text-xs text-zinc-400 ml-2">
                  ({Math.round(fruit.confidence * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Pop-up on Capture */}
      {detailPopupResult && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-11/12 max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Detection Results</h2>
              <button
                onClick={onCloseDetailPopup}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            {detailPopupResult.fruits.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {detailPopupResult.fruits.map((fruit, index) => (
                  <div key={index} className="bg-zinc-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold capitalize text-white">{fruit.name}</span>
                      <span className="text-sm font-medium text-green-400">
                        {Math.round(fruit.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400 text-center py-8">No fruits detected in this photo.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
