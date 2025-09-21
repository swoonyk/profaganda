import type { NextApiRequest, NextApiResponse } from 'next';

// Mock data for development/testing
const mockProfessors = [
  { _id: "1", name: "Dr. Smith", department: "Computer Science" },
  { _id: "2", name: "Prof. Johnson", department: "Computer Science" }
];

const mockReviews = [
  {
    _id: "r1",
    review_text: "Great professor! Very knowledgeable and explains concepts clearly. The assignments are challenging but fair.",
    rating: 4.5,
    course_code: "CS101",
    is_ai_generated: false
  },
  {
    _id: "r2", 
    review_text: "This instructor demonstrates exceptional pedagogical skills and maintains high academic standards throughout the curriculum.",
    rating: 4.2,
    course_code: "CS201", 
    is_ai_generated: true
  },
  {
    _id: "r3",
    review_text: "Amazing lecturer with real-world experience. Makes complex topics easy to understand.",
    rating: 5.0,
    course_code: "CS301",
    is_ai_generated: false
  },
  {
    _id: "r4",
    review_text: "The coursework is comprehensive and well-structured, facilitating optimal learning outcomes for students.",
    rating: 4.1,
    course_code: "CS401",
    is_ai_generated: true
  }
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock game mode 2 logic - guess if review is AI-generated or real
    const randomProfessor = mockProfessors[Math.floor(Math.random() * mockProfessors.length)];
    const randomReview = mockReviews[Math.floor(Math.random() * mockReviews.length)];
    
    const response = {
      professor: randomProfessor,
      review: randomReview,
      isRealReview: !randomReview.is_ai_generated // true if real, false if AI
    };

    res.json(response);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Error generating game mode 2 question' });
  }
}
