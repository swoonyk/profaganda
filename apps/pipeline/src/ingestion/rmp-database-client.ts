import axios, { AxiosInstance } from 'axios';
import type { RawReview, RawProfessor } from '@profaganda/shared';



interface RMPProfessorRaw {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  school: {
    name: string;
    id: string;
  };
  avgRating: number;
  avgDifficulty: number;
  numRatings: number;
  wouldTakeAgainPercent: number;
}

interface RMPProfessorDetailed {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  school: {
    name: string;
    city: string;
    state: string;
  };
  avgRating: number;
  avgDifficulty: number;
  numRatings: number;
  wouldTakeAgainPercent: number;
  ratingsDistribution: {
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    r5: number;
    total: number;
  };
  courseCodes: Array<{
    courseCode: string;
    count: number;
  }>;
  ratings: Array<{
    comment: string;
    helpfulRating: number;
    clarityRating: number;
    difficultyRating: number;
    class: string;
    date: string;
    wouldTakeAgain?: boolean;
    grade?: string;
  }>;
}

interface RMPSchoolInfo {
  id: string;
  name: string;
  city: string;
  state: string;
  numProfessors: number;
  avgHappiness: number;
  avgRating: number;
}

export class RMPDatabaseClient {
  private client: AxiosInstance;
  private readonly baseUrl = 'https://www.ratemyprofessors.com';
  private readonly graphqlUrl = 'https://www.ratemyprofessors.com/graphql';

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
  }


  async getCornellSchoolId(): Promise<string> {
    return '298'; // Cornell University's RMP ID
  }

 
  async fetchAllProfessorsFromSchool(schoolId: string): Promise<RMPProfessorRaw[]> {
    console.log(` Fetching all professors from school ID: ${schoolId}`);
    
    const allProfessors: RMPProfessorRaw[] = [];
    let cursor = '';
    let hasNextPage = true;
    let pageCount = 0;

    try {
      while (hasNextPage && pageCount < 50) { // Safety limit
        pageCount++;
        console.log(` Fetching page ${pageCount}...`);

        const query = {
          query: `
            query TeacherSearchResultsPageQuery(
              $query: TeacherSearchQuery!
            ) {
              search: newSearch {
                teachers(query: $query, first: 100${cursor ? `, after: "${cursor}"` : ''}) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  edges {
                    node {
                      id
                      legacyId
                      firstName
                      lastName
                      department
                      school {
                        name
                        id
                      }
                      avgRating
                      avgDifficulty
                      numRatings
                      wouldTakeAgainPercent
                    }
                  }
                }
              }
            }
          `,
          variables: {
            query: {
              text: "",
              schoolID: btoa(`School-${schoolId}`), // Base64 encode school ID
              fallback: true
            }
          }
        };

        const response = await this.client.post(this.graphqlUrl, query);
        
        // Debug response
        if (response.data?.errors) {
          console.log('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        }
        
        if (!response.data?.data?.search?.teachers) {
          console.log(' No teacher data found in response');
          console.log('Response structure:', JSON.stringify(response.data, null, 2).substring(0, 500));
          break;
        }

        const teachers = response.data.data.search.teachers;
        const edges = teachers.edges || [];

        console.log(`   Found ${edges.length} professors on page ${pageCount}`);

        for (const edge of edges) {
          const node = edge.node;
          if (node && node.id) {
            allProfessors.push({
              id: node.legacyId || node.id,
              firstName: node.firstName || '',
              lastName: node.lastName || '',
              department: node.department || 'Unknown',
              school: {
                name: node.school?.name || 'Unknown',
                id: schoolId
              },
              avgRating: node.avgRating || 0,
              avgDifficulty: node.avgDifficulty || 0,
              numRatings: node.numRatings || 0,
              wouldTakeAgainPercent: node.wouldTakeAgainPercent || 0
            });
          }
        }

        // Check pagination
        hasNextPage = teachers.pageInfo?.hasNextPage || false;
        cursor = teachers.pageInfo?.endCursor || '';

        if (!cursor) {
          hasNextPage = false;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(` Total professors fetched: ${allProfessors.length}`);
      return allProfessors;

    } catch (error) {
      console.error(' Error fetching professors from school:', error);
      return [];
    }
  }

 
  async fetchProfessorDetails(professorId: string): Promise<RMPProfessorDetailed | null> {
    console.log(` Fetching detailed info for professor ID: ${professorId}`);

    try {
      const query = {
        query: `
          query TeacherRatingsPageQuery($id: ID!) {
            node(id: $id) {
              ... on Teacher {
                id
                legacyId
                firstName
                lastName
                department
                school {
                  name
                  city
                  state
                }
                avgRating
                avgDifficulty
                numRatings
                wouldTakeAgainPercent
                ratingsDistribution {
                  r1
                  r2
                  r3
                  r4
                  r5
                  total
                }
                courseCodes {
                  courseCode
                  count
                }
                ratings(first: 100) {
                  edges {
                    node {
                      comment
                      helpfulRating
                      clarityRating
                      difficultyRating
                      class
                      date
                      wouldTakeAgain
                      grade
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          id: btoa(`Teacher-${professorId}`) 
        }
      };

      const response = await this.client.post(this.graphqlUrl, query);
      
      if (response.data?.errors) {
        console.log('GraphQL Errors for professor details:', JSON.stringify(response.data.errors, null, 2));
      }
      
      if (!response.data?.data?.node) {
        console.log(` No data found for professor ${professorId}`);
        console.log(`   Encoded ID: ${btoa(`Teacher-${professorId}`)}`);
        return null;
      }

      const professor = response.data.data.node;
      const ratings = professor.ratings?.edges?.map((edge: any) => edge.node) || [];

      console.log(` Found ${ratings.length} ratings for ${professor.firstName} ${professor.lastName}`);

      return {
        id: professor.legacyId || professor.id,
        firstName: professor.firstName || '',
        lastName: professor.lastName || '',
        department: professor.department || 'Unknown',
        school: {
          name: professor.school?.name || 'Unknown',
          city: professor.school?.city || '',
          state: professor.school?.state || ''
        },
        avgRating: professor.avgRating || 0,
        avgDifficulty: professor.avgDifficulty || 0,
        numRatings: professor.numRatings || 0,
        wouldTakeAgainPercent: professor.wouldTakeAgainPercent || 0,
        ratingsDistribution: professor.ratingsDistribution || {
          r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, total: 0
        },
        courseCodes: professor.courseCodes || [],
        ratings: ratings
      };

    } catch (error) {
      console.error(` Error fetching professor details for ${professorId}:`, error);
      return null;
    }
  }

 
  convertToRawProfessor(rmpProf: RMPProfessorRaw): RawProfessor {
    return {
      id: `rmp_${rmpProf.id}`,
      name: `${rmpProf.firstName} ${rmpProf.lastName}`.trim(),
      school: rmpProf.school.name,
      department: this.normalizeDepartment(rmpProf.department),
      source: 'rmp',
      metadata: {
        rmpId: rmpProf.id,
        avgRating: rmpProf.avgRating,
        avgDifficulty: rmpProf.avgDifficulty,
        numRatings: rmpProf.numRatings,
        wouldTakeAgainPercent: rmpProf.wouldTakeAgainPercent
      }
    };
  }

 
  convertToRawReviews(professorId: string, rmpReviews: RMPProfessorDetailed['ratings']): RawReview[] {
    return rmpReviews.map((review, index) => {

      const overallRating = Math.round((review.clarityRating + review.helpfulRating) / 2);
      
      return {
        id: `rmp_review_${professorId}_${index}`,
        professorId: professorId,
        text: review.comment || 'No comment provided',
        rating: Math.max(1, Math.min(5, overallRating)), // Ensure 1-5 range
        source: 'rmp' as const,
        metadata: {
          date: review.date,
          class: review.class,
          grade: review.grade,
          wouldTakeAgain: review.wouldTakeAgain,
          clarityRating: review.clarityRating,
          difficultyRating: review.difficultyRating,
          helpfulRating: review.helpfulRating
        }
      };
    }).filter(review => review.text.length > 10); 
  }

 
  private normalizeDepartment(department: string): string {
    const departmentMap: Record<string, string> = {
      'Computer Science': 'Computer Science',
      'CS': 'Computer Science',
      'Math': 'Mathematics',
      'Mathematics': 'Mathematics',
      'Physics': 'Physics',
      'Chemistry': 'Chemistry',
      'Biology': 'Biology',
      'Economics': 'Economics',
      'Psychology': 'Psychology',
      'English': 'English',
      'History': 'History',
      'Philosophy': 'Philosophy',
      'Political Science': 'Political Science',
      'Sociology': 'Sociology',
      'Anthropology': 'Anthropology',
      'Engineering': 'Engineering',
      'Business': 'Business',
      'Education': 'Education'
    };
    
    if (departmentMap[department]) {
      return departmentMap[department];
    }
    
    
    for (const [key, value] of Object.entries(departmentMap)) {
      if (department.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(department.toLowerCase())) {
        return value;
      }
    }
    
    return department; 
  }

 
  async fetchCornellData(maxProfessors: number = 100, maxReviewsPerProfessor: number = 50): Promise<{ professors: RawProfessor[], reviews: RawReview[] }> {
    console.log('🚀 Starting comprehensive Cornell data fetch from RateMyProfessor...');
    
    try {
      
      const schoolId = await this.getCornellSchoolId();
      
      
      const allProfessors = await this.fetchAllProfessorsFromSchool(schoolId);
      
      if (allProfessors.length === 0) {
        console.log(' No professors found for Cornell');
        return { professors: [], reviews: [] };
      }

      
      const professorsWithRatings = allProfessors
        .filter(prof => prof.numRatings > 0)
        .sort((a, b) => b.numRatings - a.numRatings) 
        .slice(0, maxProfessors);

      console.log(` Found ${professorsWithRatings.length} professors with ratings (from ${allProfessors.length} total)`);

      
      const rawProfessors = professorsWithRatings.map(prof => this.convertToRawProfessor(prof));

      
      const allReviews: RawReview[] = [];
      let processedCount = 0;

      for (const professor of professorsWithRatings) {
        processedCount++;
        console.log(` [${processedCount}/${professorsWithRatings.length}] Fetching reviews for ${professor.firstName} ${professor.lastName} (${professor.numRatings} reviews)`);
        
        try {
          const detailed = await this.fetchProfessorDetails(professor.id);
          
          if (detailed && detailed.ratings.length > 0) {
            const professorId = `rmp_${professor.id}`;
            const reviews = this.convertToRawReviews(professorId, detailed.ratings.slice(0, maxReviewsPerProfessor));
            allReviews.push(...reviews);
            
            console.log(` Added ${reviews.length} reviews`);
          } else {
            console.log(` No reviews found`);
          }
          
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(` Error fetching reviews for ${professor.firstName} ${professor.lastName}:`, error);
          continue;
        }
      }

      console.log(` Cornell data fetch complete!`);
      console.log(` Total: ${rawProfessors.length} professors, ${allReviews.length} reviews`);
      
      return { professors: rawProfessors, reviews: allReviews };

    } catch (error) {
      console.error('Error in Cornell data fetch:', error);
      return { professors: [], reviews: [] };
    }
  }
}
