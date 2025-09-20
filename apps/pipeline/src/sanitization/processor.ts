import { createGeminiClient, type GeminiClient, type RawReview, type SanitizationResult } from '@profaganda/shared';
import { createDatabaseQueries, type DatabaseQueries } from '@profaganda/database';
import type { Pool } from 'pg';

export class SanitizationProcessor {
  private geminiClient: GeminiClient;
  private dbQueries: DatabaseQueries;

  constructor(
    geminiApiKey: string,
    dbPool: Pool
  ) {
    this.geminiClient = createGeminiClient(geminiApiKey);
    this.dbQueries = createDatabaseQueries(dbPool);
  }

  async processBatch(reviews: RawReview[], batchSize: number = 20): Promise<void> {
    console.log(`Processing ${reviews.length} reviews in batches of ${batchSize}`);
    
    for (let i = 0; i < reviews.length; i += batchSize) {
      const batch = reviews.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(reviews.length / batchSize)}`);
      
      await this.processSingleBatch(batch);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async processSingleBatch(reviews: RawReview[]): Promise<void> {
    const sanitizationPromises = reviews.map(review => 
      this.geminiClient.sanitizeReview({ text: review.text })
    );
    
    const sanitizationResults = await Promise.all(sanitizationPromises);
  
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const result = sanitizationResults[i];
      
      await this.saveReview(review, result);
    }
  }

  private async saveReview(rawReview: RawReview, sanitizationResult: SanitizationResult): Promise<void> {
    try {
      if (sanitizationResult.error) {
        console.error(`Sanitization failed for review ${rawReview.id}: ${sanitizationResult.error}`);
        return;
      }
      const professorInternalCode = this.generateInternalCode(rawReview.professorId, rawReview.source);
      
      let professor = await this.dbQueries.findProfessorByInternalCode(professorInternalCode);
      if (!professor) {
        professor = await this.dbQueries.createProfessor(professorInternalCode, rawReview.source);
        console.log(`Created new professor with internal code: ${professorInternalCode}`);
      }

      const savedReview = await this.dbQueries.createReview(
        professor.id,
        sanitizationResult.sanitized_text,
        rawReview.source,
        rawReview.rating
      );

      console.log(`Saved review ${savedReview.id} (${sanitizationResult.was_redacted ? 'redacted' : 'clean'})`);
      
    } catch (error) {
      console.error(`Failed to save review ${rawReview.id}:`, error);
    }
  }

  private generateInternalCode(professorId: string, source: string): string {
    const hash = this.simpleHash(`${source}_${professorId}`);
    return `${source}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  async getProcessingStats(): Promise<{ professors: number; reviews: number }> {
    const [professorCount, reviewCount] = await Promise.all([
      this.dbQueries.getProfessorCount(),
      this.dbQueries.getReviewCount()
    ]);

    return {
      professors: professorCount,
      reviews: reviewCount
    };
  }
}
