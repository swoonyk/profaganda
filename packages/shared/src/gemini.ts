import { GoogleGenerativeAI } from '@google/generative-ai';
import type { 
  GeminiSanitizationRequest, 
  GeminiSanitizationResponse, 
  SanitizationResult,
  GenerateReviewRequest,
  GenerateReviewResponse
} from './types/index.js';

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
"Professor Smith is a good teacher, but avoid his CS 4410 class because it's brutal."

OUTPUT:
{
  "sanitized_text": "[REDACTED] is a good teacher, but avoid [REDACTED] class because it's brutal.",
  "was_redacted": true
}

INPUT:
"Great lectures, clear grading!"

OUTPUT:
{
  "sanitized_text": "Great lectures, clear grading!",
  "was_redacted": false
}`;

const REVIEW_GENERATION_PROMPT = `You are a review generation system for a Cornell professor guessing game.

Your task:
- Generate realistic student reviews for Cornell professors
- Reviews should sound like they come from actual students on RateMyProfessor or Cureviews
- Include slightly realistic details about teaching style, course difficulty, and student experiences
- Vary writing style, tone, and length to simulate different students
- Include appropriate college slang and casual language where natural
- DO NOT include specific professor names, course codes, or identifying information that would make the game too easy
- Return output strictly as JSON, no extra text

You will receive:
- Professor department and general characteristics
- Desired sentiment (positive/negative/mixed)
- Target rating (1-5 scale)

Output JSON format:
{
  "review_text": "string — the generated review text",
  "rating": number, // 1-5 scale, should match target_rating closely
  "sentiment": "positive" | "negative" | "mixed"
}

Examples:

INPUT: Department: Computer Science, Sentiment: positive, Rating: 5
OUTPUT:
{
  "review_text": "This professor is absolutely amazing! Their teaching style is so clear and engaging. The assignments are challenging but fair, and they really care about students understanding the material. Office hours are super helpful and they're always willing to explain concepts again. Definitely recommend taking any class with them!",
  "rating": 5,
  "sentiment": "positive"
}

INPUT: Department: Mathematics, Sentiment: negative, Rating: 2  
OUTPUT:
{
  "review_text": "Not the best teacher tbh. Lectures are pretty dry and hard to follow. The exams are way harder than what we covered in class. They seem to know their stuff but aren't great at explaining it to students. Would probably look for a different professor if you can.",
  "rating": 2,
  "sentiment": "negative"
}`;

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

  async generateReview(request: GenerateReviewRequest): Promise<GenerateReviewResponse> {
    try {
      const prompt = `${REVIEW_GENERATION_PROMPT}

INPUT: Department: ${request.professor.department}, Sentiment: ${request.review_type}, Rating: ${request.target_rating}

Additional context:
- Teaching style: ${request.professor.teaching_style || 'varies'}
- Difficulty level: ${request.professor.difficulty_level || 'moderate'}
- Personality traits: ${request.professor.personality_traits?.join(', ') || 'professional'}

OUTPUT:`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      let parsedResponse: GenerateReviewResponse;
      try {
        // Clean the response text and extract the first JSON object
        let cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        
        // If there are multiple JSON objects, take only the first one
        const jsonStart = cleanedText.indexOf('{');
        const jsonEnd = cleanedText.indexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          cleanedText = cleanedText.substring(jsonStart, jsonEnd);
        }
        
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error(`Invalid JSON response from Gemini: ${parseError}`);
      }

      if (!parsedResponse.review_text || !parsedResponse.rating || !parsedResponse.sentiment) {
        throw new Error('Invalid response structure from Gemini');
      }

      return parsedResponse;
    } catch (error) {
      console.error('Gemini review generation error:', error);
      // Return a fallback review
      return {
        review_text: 'This professor was okay. Average teaching style and fair grading.',
        rating: request.target_rating,
        sentiment: request.review_type,
      };
    }
  }

  async generateReviewBatch(requests: GenerateReviewRequest[]): Promise<GenerateReviewResponse[]> {
    const results: GenerateReviewResponse[] = [];
    
    for (const request of requests) {
      const result = await this.generateReview(request);
      results.push(result);
      
      // Rate limiting to avoid hitting API limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }
}

export function createGeminiClient(apiKey: string): GeminiClient {
  return new GeminiClient(apiKey);
}
