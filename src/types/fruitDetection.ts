/**
 * Types for fruit detection using Gemini Vision API
 */

export interface FruitBoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectedFruit {
  name: string;
  confidence: number;
  boundingBox: FruitBoundingBox;
}

export interface FruitDetectionResult {
  fruits: DetectedFruit[];
}

export class FruitDetectionError extends Error {
  code?: string;
  
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'FruitDetectionError';
    this.code = code;
  }
}

export type DetectionStatus = 'idle' | 'processing' | 'success' | 'error';
