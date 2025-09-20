import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiSanitizationRequest, GeminiSanitizationResponse, SanitizationResult } from './types/index.js';

const SANITIZATION_PROMPT = `You are a data sanitization system for a hackathon game.

Your task:
- Input is a raw student review of a professor from RateMyProfessor or Cureviews.
- You must REMOVE or REDACT any personally identifying information (PII), including:
  - Full names of professors
  - Initials of professors
  - Emails, phone numbers, office locations
  - Course codes that uniquely identify a professor
- Keep the original style, tone, and approximate length of the review.
- Do not invent new facts or change the sentiment. If a phrase cannot be safely preserved, replace it with "[REDACTED]".
- Return output strictly as JSON, no extra text.

Output JSON format:
{
  "sanitized_text": "string — the sanitized review text",
  "was_redacted": true | false
}

Examples:

INPUT:
"Professor Smith is an amazing teacher, but avoid his CS 4410 class because it's brutal."

OUTPUT:
{
  "sanitized_text": "[REDACTED] is an amazing teacher, but avoid [REDACTED] class because it's brutal.",
  "was_redacted": true
}

INPUT:
"Great lectures, clear grading, would take again!"

OUTPUT:
{
  "sanitized_text": "Great lectures, clear grading, would take again!",
  "was_redacted": false
}`;

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async sanitizeReview(request: GeminiSanitizationRequest): Promise<SanitizationResult> {
    try {
      const prompt = `${SANITIZATION_PROMPT}\n\nINPUT:\n"${request.text}"\n\nOUTPUT:`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let parsedResponse: GeminiSanitizationResponse;
      try {
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error(`Invalid JSON response from Gemini: ${parseError}`);
      }

      if (!parsedResponse.sanitized_text || typeof parsedResponse.was_redacted !== 'boolean') {
        throw new Error('Invalid response structure from Gemini');
      }

      return {
        sanitized_text: parsedResponse.sanitized_text,
        was_redacted: parsedResponse.was_redacted,
      };
    } catch (error) {
      console.error('Gemini sanitization error:', error);
      return {
        sanitized_text: '[SANITIZATION ERROR]',
        was_redacted: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sanitizeBatch(reviews: GeminiSanitizationRequest[]): Promise<SanitizationResult[]> {
    const results: SanitizationResult[] = [];
    
    for (const review of reviews) {
      const result = await this.sanitizeReview(review);
      results.push(result);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

export function createGeminiClient(apiKey: string): GeminiClient {
  return new GeminiClient(apiKey);
}
