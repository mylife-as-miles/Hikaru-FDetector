/**
 * React hook for fruit detection functionality
 */
import { useState, useCallback, useRef } from 'react';
import { FruitDetector } from '../utils/fruitDetector';
import { FruitDetectionResult, DetectionStatus, FruitDetectionError } from '../types/fruitDetection';

interface UseFruitDetectionOptions {
  processingInterval?: number; // ms between detections
  apiKey?: string;
}

interface UseFruitDetectionReturn {
  detectionResults: FruitDetectionResult | null;
  status: DetectionStatus;
  error: string | null;
  isProcessing: boolean;
  detectFruits: (base64Image: string) => Promise<void>;
  initializeDetector: (apiKey: string) => void;
  clearResults: () => void;
  isDetectorReady: boolean;
}

export const useFruitDetection = (options: UseFruitDetectionOptions = {}): UseFruitDetectionReturn => {
  const { processingInterval = 500, apiKey } = options;
  
  const [detectionResults, setDetectionResults] = useState<FruitDetectionResult | null>(null);
  const [status, setStatus] = useState<DetectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isDetectorReady, setIsDetectorReady] = useState(false);
  
  const detectorRef = useRef<FruitDetector | null>(null);
  const lastProcessingTimeRef = useRef<number>(0);
  
  // Initialize detector
  const initializeDetector = useCallback((newApiKey: string) => {
    try {
      detectorRef.current = new FruitDetector(newApiKey);
      setIsDetectorReady(detectorRef.current.isReady());
      setError(null);
      setStatus('idle');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize detector';
      setError(errorMessage);
      setStatus('error');
      setIsDetectorReady(false);
    }
  }, []);
  
  // Initialize on mount if API key provided
  useState(() => {
    if (apiKey) {
      initializeDetector(apiKey);
    }
  });
  
  // Check if we should process a new frame (debouncing)
  const shouldProcessFrame = useCallback((): boolean => {
    const now = Date.now();
    if (now - lastProcessingTimeRef.current > processingInterval) {
      lastProcessingTimeRef.current = now;
      return true;
    }
    return false;
  }, [processingInterval]);
  
  // Detect fruits in image
  const detectFruits = useCallback(async (base64Image: string): Promise<void> => {
    if (!detectorRef.current || !detectorRef.current.isReady()) {
      setError('Detector not initialized. Please provide an API key.');
      setStatus('error');
      return;
    }
    
    if (!shouldProcessFrame()) {
      return; // Skip processing to avoid overwhelming the API
    }
    
    setStatus('processing');
    setError(null);
    
    try {
      const results = await detectorRef.current.detectFruits(base64Image);
      setDetectionResults(results);
      setStatus('success');
    } catch (err) {
      let errorMessage = 'Detection failed';
      
      if (err instanceof FruitDetectionError) {
        errorMessage = err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setStatus('error');
      setDetectionResults(null);
    }
  }, [shouldProcessFrame]);
  
  // Clear results
  const clearResults = useCallback(() => {
    setDetectionResults(null);
    setStatus('idle');
    setError(null);
  }, []);
  
  return {
    detectionResults,
    status,
    error,
    isProcessing: status === 'processing',
    detectFruits,
    initializeDetector,
    clearResults,
    isDetectorReady
  };
};
