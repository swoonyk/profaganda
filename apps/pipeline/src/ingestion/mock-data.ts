import type { RawReview, RawProfessor } from '@profaganda/shared';

export const mockProfessors: RawProfessor[] = [
  {
    id: 'prof_001',
    name: 'Dr. Sarah Johnson',
    school: 'Cornell University',
    department: 'Computer Science',
    source: 'rmp',
    metadata: { rmpId: '12345' }
  },
  {
    id: 'prof_002',
    name: 'Professor Michael Chen',
    school: 'Cornell University',
    department: 'Mathematics',
    source: 'rmp',
    metadata: { rmpId: '12346' }
  },
  {
    id: 'prof_003',
    name: 'Dr. Emily Rodriguez',
    school: 'Cornell University',
    department: 'Biology',
    source: 'cureviews',
    metadata: { courseId: 'BIOG1440' }
  },
  {
    id: 'prof_004',
    name: 'Prof. David Kim',
    school: 'Cornell University',
    department: 'Physics',
    source: 'cureviews',
    metadata: { courseId: 'PHYS2207' }
  }
];

export const mockReviews: RawReview[] = [
  {
    id: 'review_001',
    professorId: 'prof_001',
    text: 'Dr. Johnson is an amazing professor! Her CS 2110 class was challenging but really well structured. She explains algorithms clearly and her office hours are super helpful.',
    rating: 5,
    source: 'rmp',
    metadata: { date: '2024-01-15', helpfulCount: 23 }
  },
  {
    id: 'review_002',
    professorId: 'prof_001',
    text: 'Professor Johnson makes data structures actually interesting. Avoid taking CS 2110 with Smith though - Johnson is way better.',
    rating: 4,
    source: 'rmp',
    metadata: { date: '2024-02-10', helpfulCount: 15 }
  },
  {
    id: 'review_003',
    professorId: 'prof_002',
    text: 'Chen is okay for MATH 1920. His lectures can be dry but the exams are fair. Just make sure you do the homework.',
    rating: 3,
    source: 'rmp',
    metadata: { date: '2024-01-20', helpfulCount: 8 }
  },
  {
    id: 'review_004',
    professorId: 'prof_002',
    text: 'Professor Chen really knows his stuff. MATH 1920 was tough but I learned a lot. Go to his office hours at Malott 203.',
    rating: 4,
    source: 'rmp',
    metadata: { date: '2024-03-05', helpfulCount: 12 }
  },
  {
    id: 'review_005',
    professorId: 'prof_003',
    text: 'Dr. Rodriguez is the best bio professor I\'ve had. Her BIOG 1440 lectures are engaging and she really cares about students.',
    rating: 5,
    source: 'cureviews',
    metadata: { semester: 'Spring 2024', courseRating: 4.8 }
  },
  {
    id: 'review_006',
    professorId: 'prof_003',
    text: 'Emily Rodriguez makes biology fun! Take BIOG 1440 with her if you can. Her email is available for questions.',
    rating: 5,
    source: 'cureviews',
    metadata: { semester: 'Spring 2024', courseRating: 4.9 }
  },
  {
    id: 'review_007',
    professorId: 'prof_004',
    text: 'Prof Kim is really smart but his PHYS 2207 class moves fast. If you took AP Physics you should be fine.',
    rating: 3,
    source: 'cureviews',
    metadata: { semester: 'Fall 2023', courseRating: 3.5 }
  },
  {
    id: 'review_008',
    professorId: 'prof_004',
    text: 'David Kim explains physics concepts well. PHYS 2207 homework is time-consuming but helpful for exams.',
    rating: 4,
    source: 'cureviews',
    metadata: { semester: 'Fall 2023', courseRating: 4.1 }
  },
  // Additional reviews with various PII scenarios
  {
    id: 'review_009',
    professorId: 'prof_001',
    text: 'SJ is amazing! Definitely take CS 4410 with her. You can reach her at sarah.johnson@cornell.edu for questions.',
    rating: 5,
    source: 'rmp',
    metadata: { date: '2024-03-10', helpfulCount: 19 }
  },
  {
    id: 'review_010',
    professorId: 'prof_002',
    text: 'Great professor, clear explanations, would definitely recommend!',
    rating: 4,
    source: 'rmp',
    metadata: { date: '2024-02-28', helpfulCount: 7 }
  }
];

// Import utilities from the dedicated review-utils file
import { normalizeReview, isReviewUsable } from './review-utils.js';

// Re-export for backwards compatibility
export { normalizeReview, isReviewUsable };

export async function fetchMockReviews(): Promise<{ reviews: RawReview[], professors: RawProfessor[] }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const usableReviews = mockReviews.filter(review => 
    isReviewUsable(review.text)
  ).map(review => ({
    ...review,
    text: normalizeReview(review.text)
  }));
  
  console.log(`Fetched ${usableReviews.length} usable reviews out of ${mockReviews.length} total`);
  
  return {
    reviews: usableReviews,
    professors: mockProfessors
  };
}
