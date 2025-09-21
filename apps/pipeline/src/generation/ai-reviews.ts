import { connectToMongoDB, createDatabaseQueries } from '@profaganda/database';
import { createGeminiClient } from '@profaganda/shared';
import type { 
  Professor, 
  ProfessorCharacteristics, 
  GenerateReviewRequest, 
  GenerateReviewResponse,
  PipelineConfig 
} from '@profaganda/shared';

// Professor characteristics for Cornell departments
const PROFESSOR_TEMPLATES: Record<string, ProfessorCharacteristics[]> = {
  'Computer Science': [
    {
      name: 'CS Professor A',
      department: 'Computer Science',
      teaching_style: 'highly technical, code-heavy lectures',
      difficulty_level: 'challenging',
      personality_traits: ['approachable', 'passionate about algorithms'],
      course_examples: ['data structures', 'algorithms', 'systems programming']
    },
    {
      name: 'CS Professor B', 
      department: 'Computer Science',
      teaching_style: 'theoretical focus with practical examples',
      difficulty_level: 'moderate to hard',
      personality_traits: ['detail-oriented', 'helpful in office hours'],
      course_examples: ['machine learning', 'artificial intelligence', 'databases']
    }
  ],
  'Mathematics': [
    {
      name: 'Math Professor A',
      department: 'Mathematics',
      teaching_style: 'proof-based, rigorous approach',
      difficulty_level: 'very challenging',
      personality_traits: ['brilliant', 'expects high standards'],
      course_examples: ['calculus', 'linear algebra', 'analysis']
    },
    {
      name: 'Math Professor B',
      department: 'Mathematics', 
      teaching_style: 'intuitive explanations with visual aids',
      difficulty_level: 'moderate',
      personality_traits: ['patient', 'encouraging'],
      course_examples: ['statistics', 'discrete math', 'applied mathematics']
    }
  ],
  'Biology': [
    {
      name: 'Bio Professor A',
      department: 'Biology',
      teaching_style: 'lab-heavy with field work',
      difficulty_level: 'moderate',
      personality_traits: ['enthusiastic', 'research-focused'],
      course_examples: ['cell biology', 'genetics', 'ecology']
    },
    {
      name: 'Bio Professor B',
      department: 'Biology',
      teaching_style: 'lecture-based with interactive discussions',
      difficulty_level: 'fair',
      personality_traits: ['organized', 'clear communicator'],
      course_examples: ['molecular biology', 'biochemistry', 'evolution']
    }
  ],
  'Physics': [
    {
      name: 'Physics Professor A',
      department: 'Physics',
      teaching_style: 'mathematical rigor with conceptual focus',
      difficulty_level: 'challenging',
      personality_traits: ['intellectually demanding', 'thought-provoking'],
      course_examples: ['mechanics', 'electromagnetism', 'quantum physics']
    },
    {
      name: 'Physics Professor B',
      department: 'Physics',
      teaching_style: 'hands-on experiments and demonstrations',
      difficulty_level: 'moderate',
      personality_traits: ['engaging', 'practical approach'],
      course_examples: ['intro physics', 'thermodynamics', 'optics']
    }
  ]
};

export class AIReviewGenerator {
  constructor(
    private geminiClient: ReturnType<typeof createGeminiClient>,
    private dbQueries: ReturnType<typeof createDatabaseQueries>
  ) {}

  private getRandomTemplate(department: string): ProfessorCharacteristics {
    const templates = PROFESSOR_TEMPLATES[department];
    if (!templates || templates.length === 0) {
      // Fallback for unknown departments
      return {
        name: 'Professor',
        department,
        teaching_style: 'varies',
        difficulty_level: 'moderate',
        personality_traits: ['professional'],
        course_examples: ['introductory courses', 'advanced topics']
      };
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateReviewVariations(professor: Professor, template: ProfessorCharacteristics): GenerateReviewRequest[] {
    const variations: GenerateReviewRequest[] = [];
    
    // Generate a mix of positive, negative, and mixed reviews with different ratings
    const reviewTypes: Array<{type: 'positive' | 'negative' | 'mixed', rating: number}> = [
      { type: 'positive', rating: 5 },
      { type: 'positive', rating: 4 }, 
      { type: 'mixed', rating: 4 },
      { type: 'mixed', rating: 3 },
      { type: 'negative', rating: 3 },
      { type: 'negative', rating: 2 },
      { type: 'negative', rating: 1 }
    ];

    // Select 3-5 random review types for variety
    const numReviews = 3 + Math.floor(Math.random() * 3); // 3-5 reviews
    const selectedTypes = reviewTypes.sort(() => 0.5 - Math.random()).slice(0, numReviews);

    for (const reviewType of selectedTypes) {
      variations.push({
        professor: template,
        review_type: reviewType.type,
        target_rating: reviewType.rating
      });
    }

    return variations;
  }

  async generateReviewsForProfessor(professor: Professor): Promise<void> {
    try {
      console.log(`Generating AI reviews for professor ${professor.internal_code}...`);
      
      // Determine department from professor data or use a default
      const department = professor.department || 'Computer Science';
      const template = this.getRandomTemplate(department);
      
      const reviewRequests = this.generateReviewVariations(professor, template);
      console.log(`  Generating ${reviewRequests.length} reviews...`);
      
      const generatedReviews = await this.geminiClient.generateReviewBatch(reviewRequests);
      
      // Save generated reviews to database
      for (const review of generatedReviews) {
        await this.dbQueries.createReview(
          professor._id!,
          review.review_text,
          'ai_generated',
          review.rating,
          true
        );
      }
      
      console.log(`  ✅ Successfully generated and saved ${generatedReviews.length} AI reviews`);
      
    } catch (error) {
      console.error(`❌ Error generating reviews for professor ${professor.internal_code}:`, error);
    }
  }

  async generateAllAIReviews(): Promise<void> {
    try {
      console.log('🤖 Starting AI review generation for all professors...\n');
      
      // Get all professors from the database
      const db = this.dbQueries.database;
      const professors = await db.collection<Professor>('professors').find({}).toArray();
      
      if (professors.length === 0) {
        console.log('⚠️  No professors found in database. Please run the ingestion pipeline first.');
        return;
      }
      
      console.log(`Found ${professors.length} professors to generate reviews for:\n`);
      
      let totalGenerated = 0;
      for (const professor of professors) {
        const professorWithId = {
          ...professor,
          _id: professor._id?.toString()
        };
        
        await this.generateReviewsForProfessor(professorWithId);
        
        // Count reviews generated for this professor
        const count = await this.dbQueries.database.collection('reviews').countDocuments({
          professor_id: professorWithId._id,
          is_ai_generated: true
        });
        totalGenerated += count;
        
        // Small delay between professors to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`\n🎉 AI review generation complete!`);
      console.log(`📊 Total AI reviews generated: ${totalGenerated}`);
      
    } catch (error) {
      console.error('❌ Error in AI review generation:', error);
      throw error;
    }
  }
}

export async function generateAIReviews(config: PipelineConfig): Promise<void> {
  console.log('🔌 Connecting to database...');
  const db = await connectToMongoDB(config.mongodbUri);
  const dbQueries = createDatabaseQueries(db);
  
  console.log('🧠 Initializing Gemini client...');
  const geminiClient = createGeminiClient(config.geminiApiKey);
  
  const generator = new AIReviewGenerator(geminiClient, dbQueries);
  await generator.generateAllAIReviews();
}
