import type { NextApiRequest, NextApiResponse } from 'next';

// Mock data for development/testing
const mockProfessors = [
  { _id: "1", name: "Dr. Smith", department: "Computer Science" },
  { _id: "2", name: "Prof. Johnson", department: "Computer Science" },
  { _id: "3", name: "Dr. Williams", department: "Computer Science" },
  { _id: "4", name: "Prof. Brown", department: "Computer Science" }
];

const mockReviews = [
  {
    _id: "r1",
    review_text: "Great professor! Very knowledgeable and explains concepts clearly. The assignments are challenging but fair.",
    rating: 4.5,
    course_code: "CS101"
  },
  {
    _id: "r2", 
    review_text: "Difficult class but you learn a lot. Professor is helpful during office hours.",
    rating: 4.0,
    course_code: "CS201"
  },
  {
    _id: "r3",
    review_text: "Amazing lecturer with real-world experience. Makes complex topics easy to understand.",
    rating: 5.0,
    course_code: "CS301"
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
    // Mock game mode 1 logic
    const randomReview = mockReviews[Math.floor(Math.random() * mockReviews.length)];
    const correctProfessor = mockProfessors[0]; // First professor is "correct"
    const wrongProfessors = mockProfessors.slice(1); // Rest are wrong options
    
    // Shuffle professor options
    const professorOptions = [correctProfessor, ...wrongProfessors];
    for (let i = professorOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [professorOptions[i], professorOptions[j]] = [professorOptions[j], professorOptions[i]];
    }

    const response = {
      review: randomReview,
      professorOptions,
      correctProfessorId: correctProfessor._id
    };

    res.json(response);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Error generating game mode 1 question' });
  }
}
