/**
 * Fruit Detection Component with Overlay Visualization
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Settings, AlertCircle, Loader } from 'lucide-react';
import { useFruitDetection } from '../hooks/useFruitDetection';
import { DetectedFruit } from '../types/fruitDetection';

interface FruitDetectionProps {
  videoRef?: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  onToggle: () => void;
  className?: string;
}

export const FruitDetection: React.FC<FruitDetectionProps> = ({
  videoRef,
  isActive,
  onToggle,
  className = ''
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);
  
  const {
    detectionResults,
    status,
    error,
    isProcessing,
    detectFruits,
    initializeDetector,
    clearResults,
    isDetectorReady
  } = useFruitDetection();

  // Get stored API key from localStorage on mount
  useEffect(() => {
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

  // Capture frame from video and process
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

  // Start/stop detection loop
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

  // Render bounding box overlay
  const renderBoundingBoxes = () => {
    if (!detectionResults?.fruits || !videoRef?.current) return null;

    const video = videoRef.current;
    const videoRect = video.getBoundingClientRect();

    return detectionResults.fruits.map((fruit: DetectedFruit, index: number) => {
      const { boundingBox, name, confidence } = fruit;
      
      // Convert normalized coordinates to pixel coordinates
      const left = boundingBox.xmin * videoRect.width;
      const top = boundingBox.ymin * videoRect.height;
      const width = (boundingBox.xmax - boundingBox.xmin) * videoRect.width;
      const height = (boundingBox.ymax - boundingBox.ymin) * videoRect.height;

      return (
        <div
          key={index}
          className="absolute border-2 border-green-400 bg-green-400/10 backdrop-blur-sm"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
            pointerEvents: 'none'
          }}
        >
          <div className="absolute -top-8 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {name} ({Math.round(confidence * 100)}%)
          </div>
        </div>
      );
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Bounding box overlays */}
      {isActive && renderBoundingBoxes()}
      
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

        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-600 text-zinc-400 hover:text-white hover:scale-105 transition-all"
          title="Detection Settings"
        >
          <Settings size={20} />
        </button>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-3 rounded-full bg-blue-500/20 border border-blue-400 text-blue-400">
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

      {/* Results Summary */}
      {isActive && detectionResults && detectionResults.fruits.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl p-3">
          <div className="text-white text-sm font-semibold mb-2">
            Detected Fruits ({detectionResults.fruits.length})
          </div>
          <div className="space-y-1">
            {detectionResults.fruits.map((fruit, index) => (
              <div key={index} className="text-xs text-zinc-300">
                {fruit.name} - {Math.round(fruit.confidence * 100)}%
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
