import { createGeminiClient, type GeminiClient, type RawReview, type RawProfessor, type SanitizationResult } from '@profaganda/shared';
import { createDatabaseQueries, type DatabaseQueries } from '@profaganda/database';
import type { Db } from 'mongodb';

export class SanitizationProcessor {
  private geminiClient: GeminiClient;
  private dbQueries: DatabaseQueries;

  constructor(
    geminiApiKey: string,
    database: Db
  ) {
    this.geminiClient = createGeminiClient(geminiApiKey);
    this.dbQueries = createDatabaseQueries(database);
  }

  async processBatch(reviews: RawReview[], professors: RawProfessor[], batchSize: number = 20): Promise<void> {
    // First, create all professors
    await this.createProfessors(professors);
    
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

  async createProfessors(professors: RawProfessor[]): Promise<void> {
    console.log(`Creating ${professors.length} professors...`);
    
    for (const rawProfessor of professors) {
      try {
        const professorInternalCode = this.generateInternalCode(rawProfessor.id, rawProfessor.source);
        
        // Check if professor already exists
        const existingProfessor = await this.dbQueries.findProfessorByInternalCode(professorInternalCode);
        if (existingProfessor) {
          console.log(`Professor ${rawProfessor.name} already exists with code: ${professorInternalCode}`);
          continue;
        }

        // Create new professor with full information
        const professor = await this.dbQueries.createProfessor(
          professorInternalCode,
          rawProfessor.name,
          rawProfessor.school,
          rawProfessor.source,
          rawProfessor.department
        );
        
        console.log(`Created professor: ${professor.name} (${professor.department}) with code: ${professorInternalCode}`);
        
      } catch (error) {
        console.error(`Failed to create professor ${rawProfessor.name}:`, error);
      }
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
        console.error(`Professor not found with internal code: ${professorInternalCode}`);
        return;
      }

      const savedReview = await this.dbQueries.createReview(
        professor._id!,
        sanitizationResult.sanitized_text,
        rawReview.source,
        rawReview.rating
      );

      console.log(`Saved review ${savedReview._id} (${sanitizationResult.was_redacted ? 'redacted' : 'clean'})`);
      
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
