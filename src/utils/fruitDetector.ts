/**
 * Fruit Detection Utility using Gemini Vision API
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FruitDetectionResult, FruitDetectionError } from '../types/fruitDetection';

export class FruitDetector {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private isInitialized = false;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.initializeAPI(apiKey);
    }
  }

  /**
   * Initialize the Gemini API with the provided API key
   */
  initializeAPI(apiKey: string): void {
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json"
        }
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error);
      throw new Error('Failed to initialize Gemini API');
    }
  }

  /**
   * Detection prompt for structured fruit identification
   */
  private getDetectionPrompt(): string {
    return `
Analyze this image and identify all fruits present. For each fruit detected, provide:
1. The name of the fruit (e.g., "apple", "banana", "orange")
2. A confidence score between 0 and 1 (where 1 is most confident)
3. Bounding box coordinates as normalized values (0-1) in the format: ymin, xmin, ymax, xmax

Return the results as a JSON object with this exact structure:
{
  "fruits": [
    {
      "name": "apple",
      "confidence": 0.95,
      "boundingBox": {
        "ymin": 0.2,
        "xmin": 0.3,
        "ymax": 0.8,
        "xmax": 0.7
      }
    }
  ]
}

If no fruits are detected, return: {"fruits": []}
Only detect actual fruits, not fruit-flavored items, pictures of fruits, or cartoon fruits.
`;
  }

  /**
   * Preprocess image data for optimal Gemini processing
   */
  private preprocessImage(base64Image: string): { mimeType: string; data: string } {
    // Remove data URL prefix if present
    let imageData = base64Image;
    let mimeType = 'image/jpeg';

    if (base64Image.startsWith('data:')) {
      const [header, data] = base64Image.split(',');
      imageData = data;
      const mimeMatch = header.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    return { mimeType, data: imageData };
  }

  /**
   * Detect fruits in the provided image
   */
  async detectFruits(base64Image: string): Promise<FruitDetectionResult> {
    if (!this.isInitialized || !this.model) {
      throw new FruitDetectionError('Gemini API not initialized. Please provide an API key.');
    }

    try {
      const { mimeType, data } = this.preprocessImage(base64Image);
      
      const prompt = this.getDetectionPrompt();
      
      const result = await this.model.generateContent([
        {
          inlineData: {
            mimeType,
            data
          }
        },
        prompt
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Parse the JSON response
      const detectionResult: FruitDetectionResult = JSON.parse(text);
      
      // Validate the response structure
      if (!detectionResult.fruits || !Array.isArray(detectionResult.fruits)) {
        throw new Error('Invalid response format from Gemini API');
      }

      // Validate each fruit detection
      detectionResult.fruits = detectionResult.fruits.filter(fruit => {
        return (
          fruit.name && 
          typeof fruit.confidence === 'number' && 
          fruit.confidence >= 0 && 
          fruit.confidence <= 1 &&
          fruit.boundingBox &&
          typeof fruit.boundingBox.ymin === 'number' &&
          typeof fruit.boundingBox.xmin === 'number' &&
          typeof fruit.boundingBox.ymax === 'number' &&
          typeof fruit.boundingBox.xmax === 'number'
        );
      });

      return detectionResult;

    } catch (error) {
      console.error('Fruit detection error:', error);
      
      if (error instanceof SyntaxError) {
        throw new FruitDetectionError('Failed to parse detection results');
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('API key')) {
        throw new FruitDetectionError('Invalid API key or API quota exceeded');
      }
      
      throw new FruitDetectionError(
        errorMessage || 'Unknown error occurred during fruit detection'
      );
    }
  }

  /**
   * Check if the detector is ready to use
   */
  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Get current model information
   */
  getModelInfo(): { model: string; initialized: boolean } {
    return {
      model: 'gemini-1.5-flash',
      initialized: this.isInitialized
    };
  }
}
