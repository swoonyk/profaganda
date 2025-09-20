import rmp from 'ratemyprofessor-api';
import type { RawReview, RawProfessor } from '@profaganda/shared';

interface RMPSchool {
  node: {
    id: string;
    name: string;
  };
}

interface RMPProfessor {
  node: {
    id: string;
    firstName: string;
    lastName: string;
    school: {
      name: string;
    };
    department: string;
    numRatings: number;
    avgRating: number;
  };
}

interface RMPReview {
  node: {
    id: string;
    comment: string;
    helpfulRating: number;
    clarityRating: number;
    difficultyRating: number;
    date: string;
    class: string;
    grade: string;
    wouldTakeAgain: boolean;
  };
}

export class RMPFetcher {
  private schoolCache = new Map<string, string>();

  /**
   * Search for a school and get its RMP ID
   */
  async getSchoolId(schoolName: string): Promise<string | null> {
    if (this.schoolCache.has(schoolName)) {
      return this.schoolCache.get(schoolName)!;
    }

    try {
      console.log(`🏫 Searching for school: ${schoolName}`);
      const schools = await rmp.searchSchool(schoolName) as RMPSchool[];
      
      if (!schools || schools.length === 0) {
        console.log(`❌ No schools found for: ${schoolName}`);
        return null;
      }

      // Try to find exact match first, otherwise take the first result
      const exactMatch = schools.find(school => 
        school.node.name.toLowerCase().includes(schoolName.toLowerCase())
      );
      
      const selectedSchool = exactMatch || schools[0];
      const schoolId = selectedSchool.node.id;
      
      console.log(`✅ Found school: ${selectedSchool.node.name} (ID: ${schoolId})`);
      this.schoolCache.set(schoolName, schoolId);
      
      return schoolId;
    } catch (error) {
      console.error(`❌ Error searching for school ${schoolName}:`, error);
      return null;
    }
  }

  /**
   * Fetch professors from a school
   */
  async fetchProfessorsFromSchool(schoolName: string, maxProfessors: number = 50): Promise<RawProfessor[]> {
    const schoolId = await this.getSchoolId(schoolName);
    if (!schoolId) {
      return [];
    }

    try {
      console.log(`👨‍🏫 Fetching professors from ${schoolName}...`);
      
      // Since we can't get all professors directly, we'll search by common terms
      const searchTerms = [
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
        'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
      ];

      const allProfessors = new Map<string, RawProfessor>();

      for (const term of searchTerms) {
        try {
          console.log(`🔍 Searching professors with term: ${term}`);
          const professors = await rmp.searchProfessorsAtSchoolId(term, schoolId) as RMPProfessor[];
          
          if (professors && professors.length > 0) {
            for (const prof of professors.slice(0, 10)) { // Limit per search to avoid overwhelming
              const professorId = `rmp_${prof.node.id}`;
              
              if (!allProfessors.has(professorId)) {
                const rawProfessor: RawProfessor = {
                  id: professorId,
                  name: `${prof.node.firstName} ${prof.node.lastName}`,
                  school: prof.node.school.name,
                  department: prof.node.department,
                  source: 'rmp',
                  metadata: {
                    rmpId: prof.node.id,
                    numRatings: prof.node.numRatings,
                    avgRating: prof.node.avgRating
                  }
                };
                
                allProfessors.set(professorId, rawProfessor);
                console.log(`  ✅ Added professor: ${rawProfessor.name} (${rawProfessor.department})`);
              }
            }
          }

          // Stop if we have enough professors
          if (allProfessors.size >= maxProfessors) {
            break;
          }

          // Add delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Error searching professors with term ${term}:`, error);
          continue;
        }
      }

      const professors = Array.from(allProfessors.values());
      console.log(`✅ Found ${professors.length} unique professors from ${schoolName}`);
      return professors;

    } catch (error) {
      console.error(`❌ Error fetching professors from ${schoolName}:`, error);
      return [];
    }
  }

  /**
   * Fetch reviews for a specific professor
   */
  async fetchReviewsForProfessor(professor: RawProfessor, maxReviews: number = 20): Promise<RawReview[]> {
    if (!professor.metadata?.rmpId) {
      console.log(`⚠️  No RMP ID found for professor: ${professor.name}`);
      return [];
    }

    try {
      console.log(`📝 Fetching reviews for professor: ${professor.name}`);
      // Note: The actual API method might be different - check the documentation
      const reviews = await (rmp as any).getRatings(professor.metadata.rmpId) as RMPReview[];
      
      if (!reviews || reviews.length === 0) {
        console.log(`📝 No reviews found for: ${professor.name}`);
        return [];
      }

      const rawReviews: RawReview[] = reviews.slice(0, maxReviews).map((review, index) => {
        // Calculate overall rating from clarity and helpfulness
        const overallRating = Math.round((review.node.clarityRating + review.node.helpfulRating) / 2);
        
        return {
          id: `rmp_review_${professor.metadata!.rmpId}_${index}`,
          professorId: professor.id,
          text: review.node.comment || 'No comment provided',
          rating: overallRating,
          source: 'rmp',
          metadata: {
            date: review.node.date,
            class: review.node.class,
            grade: review.node.grade,
            wouldTakeAgain: review.node.wouldTakeAgain,
            clarityRating: review.node.clarityRating,
            difficultyRating: review.node.difficultyRating,
            helpfulRating: review.node.helpfulRating
          }
        };
      });

      console.log(`✅ Found ${rawReviews.length} reviews for: ${professor.name}`);
      return rawReviews;

    } catch (error) {
      console.error(`❌ Error fetching reviews for professor ${professor.name}:`, error);
      return [];
    }
  }

  /**
   * Fetch all data from RMP for a school
   */
  async fetchAllData(schoolName: string, maxProfessors: number = 50, maxReviewsPerProfessor: number = 20): Promise<{ professors: RawProfessor[], reviews: RawReview[] }> {
    console.log(`🚀 Starting RMP data fetch for ${schoolName}...`);
    
    const professors = await this.fetchProfessorsFromSchool(schoolName, maxProfessors);
    
    if (professors.length === 0) {
      console.log(`❌ No professors found for ${schoolName}`);
      return { professors: [], reviews: [] };
    }

    console.log(`👨‍🏫 Fetching reviews for ${professors.length} professors...`);
    const allReviews: RawReview[] = [];

    for (const professor of professors) {
      try {
        const reviews = await this.fetchReviewsForProfessor(professor, maxReviewsPerProfessor);
        allReviews.push(...reviews);
        
        // Add delay between professor requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error fetching reviews for ${professor.name}:`, error);
        continue;
      }
    }

    console.log(`✅ RMP fetch complete: ${professors.length} professors, ${allReviews.length} reviews`);
    return { professors, reviews: allReviews };
  }
}
