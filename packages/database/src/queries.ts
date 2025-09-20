import { Db, Collection, ObjectId } from 'mongodb';
import type { Professor, Review } from '@profaganda/shared';

export class DatabaseQueries {
  private professorsCollection: Collection<Professor>;
  private reviewsCollection: Collection<Review>;

  constructor(private db: Db) {
    this.professorsCollection = db.collection<Professor>('professors');
    this.reviewsCollection = db.collection<Review>('reviews');
  }

  // Professor operations
  async createProfessor(internalCode: string, source: 'rmp' | 'cureviews'): Promise<Professor> {
    const professor: Omit<Professor, '_id'> = {
      internal_code: internalCode,
      source,
      created_at: new Date(),
    };

    const result = await this.professorsCollection.insertOne(professor as Professor);
    
    return {
      _id: result.insertedId.toString(),
      ...professor,
    };
  }

  async findProfessorByInternalCode(internalCode: string): Promise<Professor | null> {
    const professor = await this.professorsCollection.findOne({ internal_code: internalCode });
    if (!professor) return null;
    
    return {
      ...professor,
      _id: professor._id?.toString(),
    };
  }

  async findProfessorById(id: string): Promise<Professor | null> {
    try {
      const professor = await this.professorsCollection.findOne({ _id: new ObjectId(id) });
      if (!professor) return null;
      
      return {
        ...professor,
        _id: professor._id?.toString(),
      };
    } catch (error) {
      // Invalid ObjectId format
      return null;
    }
  }

  // Review operations
  async createReview(
    professorId: string,
    sanitizedText: string,
    source: 'rmp' | 'cureviews',
    rating?: number
  ): Promise<Review> {
    const review: Omit<Review, '_id'> = {
      professor_id: professorId,
      sanitized_text: sanitizedText,
      source,
      rating,
      sanitized_at: new Date(),
    };

    const result = await this.reviewsCollection.insertOne(review as Review);
    
    return {
      _id: result.insertedId.toString(),
      ...review,
    };
  }

  async getRandomReviews(count: number): Promise<Review[]> {
    const reviews = await this.reviewsCollection
      .aggregate([{ $sample: { size: count } }])
      .toArray();
    
    return reviews.map(review => ({
      ...review,
      _id: review._id?.toString(),
    }));
  }

  async getReviewsByProfessorId(professorId: string): Promise<Review[]> {
    const reviews = await this.reviewsCollection
      .find({ professor_id: professorId })
      .sort({ sanitized_at: -1 })
      .toArray();
    
    return reviews.map(review => ({
      ...review,
      _id: review._id?.toString(),
    }));
  }

  async getReviewCount(): Promise<number> {
    return await this.reviewsCollection.countDocuments();
  }

  async getProfessorCount(): Promise<number> {
    return await this.professorsCollection.countDocuments();
  }

  // Index creation for performance
  async createIndexes(): Promise<void> {
    await Promise.all([
      this.professorsCollection.createIndex({ internal_code: 1 }, { unique: true }),
      this.professorsCollection.createIndex({ source: 1 }),
      this.reviewsCollection.createIndex({ professor_id: 1 }),
      this.reviewsCollection.createIndex({ source: 1 }),
      this.reviewsCollection.createIndex({ sanitized_at: -1 }),
    ]);
    console.log('✅ Database indexes created');
  }
}

export function createDatabaseQueries(db: Db): DatabaseQueries {
  return new DatabaseQueries(db);
}
