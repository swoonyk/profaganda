import { Db, Collection, ObjectId } from 'mongodb';
import type { Professor, Review } from '@profaganda/shared';

export class DatabaseQueries {
  private professorsCollection: Collection<Professor>;
  private reviewsCollection: Collection<Review>;

  constructor(private db: Db) {
    this.professorsCollection = db.collection<Professor>('professors');
    this.reviewsCollection = db.collection<Review>('reviews');
  }

  get database(): Db {
    return this.db;
  }

  // Professor operations
  async createProfessor(
    internalCode: string, 
    name: string, 
    school: string, 
    source: 'rmp' | 'cureviews',
    department?: string
  ): Promise<Professor> {
    const professor: Omit<Professor, '_id'> = {
      internal_code: internalCode,
      name,
      school,
      department,
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
      const professor = await this.professorsCollection.findOne({ _id: new ObjectId(id) } as any);
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
    source: 'rmp' | 'cureviews' | 'ai_generated',
    rating?: number,
    isAiGenerated?: boolean
  ): Promise<Review> {
    const review: Omit<Review, '_id'> = {
      professor_id: professorId,
      sanitized_text: sanitizedText,
      source,
      rating,
      sanitized_at: new Date(),
      is_ai_generated: isAiGenerated || source === 'ai_generated',
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
    })) as Review[];
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

  // Game-specific queries
  async getProfessorsByDepartment(department: string, limit?: number): Promise<Professor[]> {
    const query = department ? { department } : {};
    const cursor = this.professorsCollection.find(query);
    
    if (limit) {
      cursor.limit(limit);
    }
    
    const professors = await cursor.toArray();
    
    return professors.map(professor => ({
      ...professor,
      _id: professor._id?.toString(),
    }));
  }

  async getRandomProfessorWithReviews(): Promise<{professor: Professor, reviews: Review[]} | null> {
    // Get a random professor who has reviews
    const professorsWithReviews = await this.professorsCollection.aggregate([
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'professor_id',
          as: 'reviews'
        }
      },
      {
        $match: {
          'reviews.0': { $exists: true } // Only professors with at least one review
        }
      },
      { $sample: { size: 1 } }
    ]).toArray();

    if (professorsWithReviews.length === 0) {
      return null;
    }

    const professorData = professorsWithReviews[0];
    const professor: Professor = {
      ...professorData,
      _id: professorData._id?.toString(),
    } as Professor;

    // Get all reviews for this professor
    const reviews = await this.getReviewsByProfessorId(professor._id!);

    return { professor, reviews };
  }

  async getProfessorsExcluding(excludeIds: string[], department?: string, limit: number = 10): Promise<Professor[]> {
    const query: any = {
      _id: { $nin: excludeIds.map(id => new ObjectId(id)) }
    };
    
    if (department) {
      query.department = department;
    }

    const professors = await this.professorsCollection
      .find(query)
      .limit(limit)
      .toArray();
    
    return professors.map(professor => ({
      ...professor,
      _id: professor._id?.toString(),
    }));
  }

  async getRandomReviewWithProfessor(): Promise<{review: Review, professor: Professor} | null> {
    // Get a random review with its associated professor
    const reviewsWithProfessor = await this.reviewsCollection.aggregate([
      { $sample: { size: 1 } },
      {
        $lookup: {
          from: 'professors',
          localField: 'professor_id',
          foreignField: '_id',
          as: 'professor'
        }
      },
      {
        $match: {
          'professor.0': { $exists: true } // Ensure professor exists
        }
      }
    ]).toArray();

    if (reviewsWithProfessor.length === 0) {
      return null;
    }

    const data = reviewsWithProfessor[0];
    const review: Review = {
      ...data,
      _id: data._id?.toString(),
    } as Review;

    const professor: Professor = {
      ...data.professor[0],
      _id: data.professor[0]._id?.toString(),
    } as Professor;

    return { review, professor };
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
