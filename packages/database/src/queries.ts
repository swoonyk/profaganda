import { Pool } from 'pg';
import type { Professor, Review } from '@profaganda/shared';

export class DatabaseQueries {
  constructor(private pool: Pool) {}

  // Professor operations
  async createProfessor(internalCode: string, source: 'rmp' | 'cureviews'): Promise<Professor> {
    const result = await this.pool.query(
      'INSERT INTO professors (internal_code, source) VALUES ($1, $2) RETURNING *',
      [internalCode, source]
    );
    return this.mapProfessorRow(result.rows[0]);
  }

  async findProfessorByInternalCode(internalCode: string): Promise<Professor | null> {
    const result = await this.pool.query(
      'SELECT * FROM professors WHERE internal_code = $1',
      [internalCode]
    );
    return result.rows.length > 0 ? this.mapProfessorRow(result.rows[0]) : null;
  }

  async findProfessorById(id: string): Promise<Professor | null> {
    const result = await this.pool.query(
      'SELECT * FROM professors WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? this.mapProfessorRow(result.rows[0]) : null;
  }

  // Review operations
  async createReview(
    professorId: string,
    sanitizedText: string,
    source: 'rmp' | 'cureviews',
    rating?: number
  ): Promise<Review> {
    const result = await this.pool.query(
      'INSERT INTO reviews (professor_id, sanitized_text, source, rating) VALUES ($1, $2, $3, $4) RETURNING *',
      [professorId, sanitizedText, source, rating]
    );
    return this.mapReviewRow(result.rows[0]);
  }

  async getRandomReviews(count: number): Promise<Review[]> {
    const result = await this.pool.query(
      'SELECT * FROM reviews ORDER BY RANDOM() LIMIT $1',
      [count]
    );
    return result.rows.map(row => this.mapReviewRow(row));
  }

  async getReviewsByProfessorId(professorId: string): Promise<Review[]> {
    const result = await this.pool.query(
      'SELECT * FROM reviews WHERE professor_id = $1 ORDER BY sanitized_at DESC',
      [professorId]
    );
    return result.rows.map(row => this.mapReviewRow(row));
  }

  async getReviewCount(): Promise<number> {
    const result = await this.pool.query('SELECT COUNT(*) as count FROM reviews');
    return parseInt(result.rows[0].count);
  }

  async getProfessorCount(): Promise<number> {
    const result = await this.pool.query('SELECT COUNT(*) as count FROM professors');
    return parseInt(result.rows[0].count);
  }

  // Utility methods for mapping database rows to TypeScript interfaces
  private mapProfessorRow(row: any): Professor {
    return {
      id: row.id,
      internal_code: row.internal_code,
      source: row.source,
      created_at: row.created_at,
    };
  }

  private mapReviewRow(row: any): Review {
    return {
      id: row.id,
      professor_id: row.professor_id,
      sanitized_text: row.sanitized_text,
      source: row.source,
      rating: row.rating,
      sanitized_at: row.sanitized_at,
    };
  }
}

export function createDatabaseQueries(pool: Pool): DatabaseQueries {
  return new DatabaseQueries(pool);
}
