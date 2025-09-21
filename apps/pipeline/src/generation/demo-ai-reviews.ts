import { config } from 'dotenv';
import { createGeminiClient } from '@profaganda/shared';
import type { GenerateReviewRequest, ProfessorCharacteristics } from '@profaganda/shared';

config({ path: '../../../../.env' });

const DEMO_PROFESSORS: ProfessorCharacteristics[] = [
  {
    name: 'CS Professor Demo',
    department: 'Computer Science',
    teaching_style: 'interactive coding sessions with real-world projects',
    difficulty_level: 'challenging but manageable',
    personality_traits: ['enthusiastic', 'helpful', 'industry experience'],
    course_examples: ['intro programming', 'web development', 'software engineering']
  },
  {
    name: 'Math Professor Demo',
    department: 'Mathematics',
    teaching_style: 'theorem-proof approach with visual explanations',
    difficulty_level: 'very rigorous',
    personality_traits: ['brilliant', 'expects perfection', 'intimidating at first'],
    course_examples: ['calculus', 'abstract algebra', 'real analysis']
  },
  {
    name: 'Biology Professor Demo',
    department: 'Biology',
    teaching_style: 'field work and lab-intensive learning',
    difficulty_level: 'moderate',
    personality_traits: ['passionate about research', 'environmentally conscious', 'encouraging'],
    course_examples: ['ecology', 'marine biology', 'conservation']
  },
  {
    name: 'Physics Professor Demo',
    department: 'Physics',
    teaching_style: 'mathematical derivations with conceptual understanding',
    difficulty_level: 'extremely challenging',
    personality_traits: ['theoretical focus', 'Nobel prize winner', 'expects deep thinking'],
    course_examples: ['quantum mechanics', 'particle physics', 'cosmology']
  }
];

export async function demoAIReviewGeneration(apiKey: string): Promise<void> {
  console.log('AI Review Generation Demo\n');
  console.log('This demo shows the variety and realism of AI-generated professor reviews\n');
  
  const geminiClient = createGeminiClient(apiKey);
  
  for (const professor of DEMO_PROFESSORS) {
    console.log(`\n ${professor.department} Professor`);
    console.log(`   Teaching Style: ${professor.teaching_style}`);
    console.log(`   Difficulty: ${professor.difficulty_level}`);
    console.log(`   Traits: ${professor.personality_traits?.join(', ')}\n`);
    
    const reviewTypes: Array<{type: 'positive' | 'negative' | 'mixed', rating: number, label: string}> = [
      { type: 'positive', rating: 5, label: 'Positive Review (5/5)' },
      { type: 'mixed', rating: 3, label: 'Mixed Review (3/5)' },
      { type: 'negative', rating: 2, label: 'Negative Review (2/5)' }
    ];
    
    for (const reviewType of reviewTypes) {
      const request: GenerateReviewRequest = {
        professor,
        review_type: reviewType.type,
        target_rating: reviewType.rating
      };
      
      try {
        console.log(`   ${reviewType.label}:`);
        const result = await geminiClient.generateReview(request);
        console.log(`   "${result.review_text}"`);
        console.log(`   (Generated Rating: ${result.rating}/5, Sentiment: ${result.sentiment})\n`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.log(`    Failed to generate review: ${error}\n`);
      }
    }
    
    console.log('   ' + '─'.repeat(80) + '\n');
  }
  
  console.log('Demo completed! These AI-generated reviews will be used in your game.');
  console.log('Notice how each review reflects the professor\'s characteristics and department.');
  console.log('The reviews vary in tone, length, and style to simulate different students.');
}

if (process.argv[2] === 'demo') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable not set');
    process.exit(1);
  }
  
  demoAIReviewGeneration(apiKey).catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}
