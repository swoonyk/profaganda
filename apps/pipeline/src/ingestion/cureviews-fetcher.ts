import axios from 'axios';
import type { RawReview, RawProfessor } from '@profaganda/shared';

interface CUReviewsData {
  professors: RawProfessor[];
  reviews: RawReview[];
}

interface CUReviewsCourse {
  _id: string;
  subject: string;
  number: string;
  title: string;
  classRating: number;
  classDifficulty: number;
  classWorkload: number;
  professors?: string[];
}

interface CUReviewsReview {
  _id: string;
  class: string;
  professor: string;
  rating: number;
  difficulty: number;
  workload: number;
  text: string;
  date: string;
  semester: string;
  liked: number;
}

interface CUReviewsSubject {
  subject: string;
  courses: string[];
}

export class CUReviewsFetcher {
  private baseUrl = 'https://www.cureviews.org/api';
  private readonly headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  private readonly commonSubjects = [
    'CS', 'MATH', 'PHYS', 'CHEM', 'BIOL', 'BIOG', 'ECON', 'PSYC', 
    'ENGL', 'HIST', 'PHIL', 'ECE', 'CEE', 'MAE', 'CHEME', 'AEM',
    'GOVT', 'SOC', 'ANTH', 'LING', 'SPAN', 'FREN', 'GERM'
  ];

  /**
   * Fetch courses by subject using the real CUReviews API
   */
  async fetchCoursesBySubject(subject: string): Promise<CUReviewsCourse[]> {
    try {
      console.log(`🔍 Fetching courses for subject: ${subject}`);
      
      // Use the real CUReviews API endpoint
      const response = await axios.post(`${this.baseUrl}/courses/get-by-subject`, {
        subject: subject.toLowerCase()
      }, {
        headers: this.headers,
        timeout: 10000
      });

      if (response.data && response.data.result) {
        const courses = response.data.result as CUReviewsCourse[];
        console.log(`✅ Found ${courses.length} courses for ${subject}`);
        return courses;
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error fetching courses for subject ${subject}:`, error);
      return [];
    }
  }

  /**
   * Fetch course details using course subject and number
   */
  async fetchCourseByInfo(subject: string, number: string): Promise<CUReviewsCourse | null> {
    try {
      const response = await axios.post(`${this.baseUrl}/courses/get-by-info`, {
        subject: subject.toLowerCase(),
        number: number
      }, {
        headers: this.headers,
        timeout: 10000
      });

      if (response.data && response.data.result) {
        return response.data.result as CUReviewsCourse;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error fetching course ${subject} ${number}:`, error);
      return null;
    }
  }

  /**
   * Fetch reviews for a specific course
   */
  async fetchReviewsForCourse(courseId: string): Promise<CUReviewsReview[]> {
    try {
      const response = await axios.post(`${this.baseUrl}/courses/get-reviews`, {
        courseId: courseId
      }, {
        headers: this.headers,
        timeout: 10000
      });

      if (response.data && response.data.result) {
        return response.data.result as CUReviewsReview[];
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error fetching reviews for course ${courseId}:`, error);
      return [];
    }
  }

  /**
   * Main method to fetch professors and reviews from CUReviews
   */
  async fetchProfessorsAndReviews(maxCoursesPerSubject: number = 10): Promise<CUReviewsData> {
    console.log('🏫 Starting CUReviews API data fetch...');
    
    const allProfessors = new Map<string, RawProfessor>();
    const allReviews: RawReview[] = [];
    
    try {
      for (const subject of this.commonSubjects) {
        try {
          console.log(`📚 Processing subject: ${subject}`);
          
          // Get courses for this subject
          const courses = await this.fetchCoursesBySubject(subject);
          const limitedCourses = courses.slice(0, maxCoursesPerSubject);
          
          for (const course of limitedCourses) {
            try {
              // Get reviews for this course
              const reviews = await this.fetchReviewsForCourse(course._id);
              
              // Process each review to extract professor information
              for (const review of reviews) {
                if (review.professor && review.professor.trim()) {
                  const professorName = review.professor.trim();
                  const professorKey = `${professorName}_${subject}`;
                  
                  // Create or update professor entry
                  if (!allProfessors.has(professorKey)) {
                    const professor: RawProfessor = {
                      id: `cureviews_${professorKey}`,
                      name: professorName,
                      school: 'Cornell University',
                      department: this.extractDepartmentFromSubject(subject),
                      source: 'cureviews',
                      metadata: {
                        subject: subject,
                        courseId: course._id,
                        courseTitle: course.title
                      }
                    };
                    
                    allProfessors.set(professorKey, professor);
                    console.log(`  ✅ Added professor: ${professorName} (${subject})`);
                  }
                  
                  // Convert CUReviews review to our format
                  const rawReview: RawReview = {
                    id: `cureviews_${review._id}`,
                    professorId: `cureviews_${professorKey}`,
                    text: review.text || 'No review text provided',
                    rating: Math.round(review.rating || 3),
                    source: 'cureviews',
                    metadata: {
                      courseId: course._id,
                      courseSubject: course.subject,
                      courseNumber: course.number,
                      courseTitle: course.title,
                      semester: review.semester,
                      date: review.date,
                      difficulty: review.difficulty,
                      workload: review.workload,
                      liked: review.liked
                    }
                  };
                  
                  allReviews.push(rawReview);
                }
              }
              
              // Add delay to be respectful to the API
              await new Promise(resolve => setTimeout(resolve, 500));
              
            } catch (error) {
              console.error(`❌ Error processing course ${course.subject} ${course.number}:`, error);
              continue;
            }
          }
          
          // Add delay between subjects
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error processing subject ${subject}:`, error);
          continue;
        }
      }
      
      const professors = Array.from(allProfessors.values());
      console.log(`✅ CUReviews fetch complete: ${professors.length} professors, ${allReviews.length} reviews`);
      
      return { professors, reviews: allReviews };
      
    } catch (error) {
      console.error('❌ Error fetching from CUReviews API:', error);
      
      // Return empty data instead of fallback mock data
      console.log('⚠️  Returning empty dataset due to API errors');
      return { professors: [], reviews: [] };
    }
  }

  /**
   * Extract department from subject code (e.g., "CS" -> "Computer Science")
   */
  private extractDepartmentFromSubject(subject: string): string {
    const departmentMap: Record<string, string> = {
      'CS': 'Computer Science',
      'MATH': 'Mathematics', 
      'PHYS': 'Physics',
      'CHEM': 'Chemistry',
      'BIOL': 'Biology',
      'BIOG': 'Biology',
      'ECON': 'Economics',
      'PSYC': 'Psychology',
      'ENGL': 'English',
      'HIST': 'History',
      'PHIL': 'Philosophy',
      'GOVT': 'Government',
      'SOC': 'Sociology',
      'ANTH': 'Anthropology',
      'ECE': 'Electrical and Computer Engineering',
      'CEE': 'Civil and Environmental Engineering',
      'MAE': 'Mechanical and Aerospace Engineering',
      'CHEME': 'Chemical Engineering',
      'AEM': 'Applied Economics and Management',
      'LING': 'Linguistics',
      'SPAN': 'Spanish',
      'FREN': 'French',
      'GERM': 'German'
    };
    
    return departmentMap[subject.toUpperCase()] || subject;
  }
}
