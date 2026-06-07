import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const hasLiveAPI = API_KEY.length > 0;

let genAI: GoogleGenerativeAI | null = null;
if (hasLiveAPI) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

// Define the response formats
export interface ResumeEvaluationResult {
  fitmentScore: number;
  skillsMatched: string[];
  skillsMissing: string[];
  evaluationText: string;
  customQuestions: string[];
  isSimulated: boolean;
}

export interface InterviewBotResponse {
  replyText: string;
  isCompleted: boolean;
  evaluationSummary?: string;
  suggestedRating?: number;
  isSimulated: boolean;
}

export interface PerformancePredictionResult {
  performanceScore: number; // 1-5 predicted
  burnoutRisk: 'Low' | 'Medium' | 'High';
  attritionProbability: number; // 0-100%
  retentionRecommendation: string;
  justification: string;
  isSimulated: boolean;
}

export interface PolicyAssistantResponse {
  answer: string;
  referencedPolicies: string[];
  isSimulated: boolean;
}

// --- LOCAL SIMULATION DATA & ENGINES ---
// Standard HR Policies for local QA
const HR_POLICIES = [
  {
    title: 'Leave Policy',
    content: 'Employees receive 20 days of paid annual leave, 10 days of sick leave, and 5 days of casual leave per calendar year. Leave requests must be submitted through the portal and approved by the reporting manager at least 5 days in advance, except for sick emergencies.'
  },
  {
    title: 'Work from Home (WFH) & Hybrid Model',
    content: 'FWC operates on a hybrid model. Employees are expected to work from the office 3 days a week (Tuesday, Wednesday, and Thursday). Monday and Friday are optional WFH days. Manager approval is required for full-time remote settings.'
  },
  {
    title: 'Training and Certifications Reimbursement',
    content: 'FWC encourages professional development. Up to 100% of certification course fees and exam fees are reimbursed upon successful completion (passing mark or certificate obtained). Approval from the department head is required before enrolling.'
  },
  {
    title: 'Working Hours and Core Time',
    content: 'Standard working hours are 9 hours per day (including 1 hour lunch break), totaling 45 hours per week. Core collaboration hours are 10:00 AM to 4:00 PM, during which all employees must be online or in office.'
  },
  {
    title: 'Performance Appraisal and Bonuses',
    content: 'Performance reviews are conducted bi-annually in June and December. Ratings range from 1 (unsatisfactory) to 5 (outstanding). Annual performance bonuses are tied to individual ratings and company-wide targets.'
  }
];

class AIService {
  // 1. Resume Screening
  public async evaluateResume(resumeText: string, jobDescription: string): Promise<ResumeEvaluationResult> {
    if (hasLiveAPI && genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
          You are an AI recruiter screening resumes against a Job Description.
          
          Job Description:
          ${jobDescription}
          
          Resume Content:
          ${resumeText}
          
          Respond ONLY with a JSON object containing these keys:
          - fitmentScore: number (0-100)
          - skillsMatched: array of strings
          - skillsMissing: array of strings
          - evaluationText: string (detailed analysis of strengths and gaps, under 150 words)
          - customQuestions: array of strings (3 tailored interview questions based on candidate's gaps)
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        // Extract JSON block in case Gemini wraps it in markdown blocks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            fitmentScore: Number(parsed.fitmentScore) || 50,
            skillsMatched: parsed.skillsMatched || [],
            skillsMissing: parsed.skillsMissing || [],
            evaluationText: parsed.evaluationText || '',
            customQuestions: parsed.customQuestions || [],
            isSimulated: false
          };
        }
      } catch (err) {
        console.error('Gemini API resume screening failed, falling back to local simulation:', err);
      }
    }

    // --- FALLBACK ENGINE ---
    // Extract keywords to simulate matching
    const resumeLower = resumeText.toLowerCase();
    const jdKeywords = ['react', 'next.js', 'node.js', 'python', 'pytorch', 'tensorflow', 'aws', 'docker', 'postgresql', 'mongodb', 'typescript', 'javascript', 'generative ai', 'gemini api', 'rest apis', 'graphql'];
    
    const matched: string[] = [];
    const missing: string[] = [];
    
    jdKeywords.forEach(kw => {
      if (resumeLower.includes(kw)) {
        // Map to exact casing
        const exactCase = kw === 'react' ? 'React.js' : kw === 'next.js' ? 'Next.js' : kw === 'node.js' ? 'Node.js' : kw === 'pytorch' ? 'PyTorch' : kw === 'tensorflow' ? 'TensorFlow' : kw === 'aws' ? 'AWS' : kw === 'postgresql' ? 'PostgreSQL' : kw === 'mongodb' ? 'MongoDB' : kw === 'typescript' ? 'TypeScript' : kw === 'javascript' ? 'JavaScript' : kw === 'gemini api' ? 'Gemini API' : kw === 'rest apis' ? 'REST APIs' : kw === 'graphql' ? 'GraphQL' : kw.toUpperCase();
        matched.push(exactCase);
      } else {
        const exactCase = kw === 'react' ? 'React.js' : kw === 'next.js' ? 'Next.js' : kw === 'node.js' ? 'Node.js' : kw === 'pytorch' ? 'PyTorch' : kw === 'tensorflow' ? 'TensorFlow' : kw === 'aws' ? 'AWS' : kw === 'postgresql' ? 'PostgreSQL' : kw === 'mongodb' ? 'MongoDB' : kw === 'typescript' ? 'TypeScript' : kw === 'javascript' ? 'JavaScript' : kw === 'gemini api' ? 'Gemini API' : kw === 'rest apis' ? 'REST APIs' : kw === 'graphql' ? 'GraphQL' : kw.toUpperCase();
        missing.push(exactCase);
      }
    });

    const score = Math.min(100, Math.max(10, Math.round((matched.length / jdKeywords.length) * 100) + getRandomNumber(0, 10)));
    
    let evaluationText = '';
    let customQuestions: string[] = [];

    if (score >= 75) {
      evaluationText = `Excellent candidate demonstrating strong alignment with the technical requirements. Profile matches critical core skills, specifically in ${matched.slice(0, 3).join(', ')}. Candidate shows solid experience for the Fullstack + AI Engineer role.`;
      customQuestions = [
        `How do you handle state synchronization and SSR caching in a Next.js App Router setup?`,
        `Describe a scenario where you deployed a custom ML model and how you resolved latency issues.`,
        `How would you leverage the Gemini API to build a real-time analytics feature for a HR dashboard?`
      ];
    } else if (score >= 45) {
      evaluationText = `Moderate fit. The candidate exhibits solid fundamentals in web engineering (${matched.slice(0, 2).join(', ')}), but lacks core AI/ML experience such as ${missing.slice(0, 2).join(', ')}. Suitable for training alignment.`;
      customQuestions = [
        `What is your experience in setting up REST/GraphQL endpoints with Node.js/Express?`,
        `Are you familiar with the basic concepts of fine-tuning or prompt engineering for large language models?`,
        `How do you handle database migration and schema design in a production PostgreSQL database?`
      ];
    } else {
      evaluationText = `Low alignment. The candidate's background lacks the required fullstack and AI capabilities. Resume has insufficient mentions of core development frameworks like React, Next.js, or machine learning libraries.`;
      customQuestions = [
        `Can you describe a fullstack project you built and what technologies you selected?`,
        `What coding practices do you follow to ensure your React components are performant and accessible?`,
        `Are you willing to participate in a sponsored training program to align with our tech stack?`
      ];
    }

    return {
      fitmentScore: score,
      skillsMatched: matched,
      skillsMissing: missing,
      evaluationText,
      customQuestions,
      isSimulated: true
    };
  }

  // 2. Chat Candidate Interview Screening
  public async getInterviewBotResponse(
    transcript: { role: 'bot' | 'candidate'; text: string }[],
    candidateName: string
  ): Promise<InterviewBotResponse> {
    if (hasLiveAPI && genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
          You are an AI Recruiter conducting a screening chat interview for FWC IT Services.
          The candidate name is ${candidateName}.
          
          Here is the chat history:
          ${transcript.map(t => `${t.role.toUpperCase()}: ${t.text}`).join('\n')}
          
          Instructions:
          - If the interview has reached 4 rounds of candidate responses, conclude the interview.
          - Otherwise, ask the next relevant screening question (technical or behavioral about React, Next.js, AI APIs).
          
          Respond ONLY with a JSON object containing these keys:
          - replyText: string (your reply message to the candidate)
          - isCompleted: boolean (set to true if concluding)
          - evaluationSummary: string (null if not completed; detailed rating on technical, communication, and overall feedback if completed)
          - suggestedRating: number (null if not completed; 1 to 5 score if completed)
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            replyText: parsed.replyText,
            isCompleted: !!parsed.isCompleted,
            evaluationSummary: parsed.evaluationSummary || undefined,
            suggestedRating: parsed.suggestedRating ? Number(parsed.suggestedRating) : undefined,
            isSimulated: false
          };
        }
      } catch (err) {
        console.error('Gemini API interview response failed, falling back to local simulation:', err);
      }
    }

    // --- FALLBACK INTERVIEW BOT ---
    const userAnswers = transcript.filter(t => t.role === 'candidate');
    const questionIndex = userAnswers.length;

    const botQuestions = [
      `Welcome to FWC's automated candidate screening! Let's start. Can you describe a fullstack project you built using React or Next.js and how you managed the state?`,
      `Great. Now, tell me about your experience working with AI models or calling Generative AI APIs (like Gemini or OpenAI). How did you integrate them?`,
      `Excellent. For database management, how do you optimize slow query times when fetching data from databases like PostgreSQL or MongoDB?`,
      `Thank you. Finally, what interests you about joining FWC, and how do you handle working on teams with high-priority deliverables?`
    ];

    if (questionIndex === 0) {
      return {
        replyText: botQuestions[0],
        isCompleted: false,
        isSimulated: true
      };
    }

    if (questionIndex === 1) {
      return {
        replyText: `Interesting project! Let's move to AI. ${botQuestions[1]}`,
        isCompleted: false,
        isSimulated: true
      };
    }

    if (questionIndex === 2) {
      return {
        replyText: `Very solid integrations. ${botQuestions[2]}`,
        isCompleted: false,
        isSimulated: true
      };
    }

    if (questionIndex === 3) {
      return {
        replyText: `Excellent database practice. ${botQuestions[3]}`,
        isCompleted: false,
        isSimulated: true
      };
    }

    // If candidate has answered 4 questions, conclude
    const scores = userAnswers.map(ans => {
      const wordCount = ans.text.split(' ').length;
      return Math.min(5, Math.max(2, Math.round(wordCount / 10) + 1));
    });
    
    const avgScore = parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
    const suggestedRating = Math.round(avgScore);
    
    return {
      replyText: `Thank you for taking the time to complete this screening interview, ${candidateName}. Our hiring team has been notified, and they will review the chat logs. Have a great day!`,
      isCompleted: true,
      suggestedRating,
      evaluationSummary: `Technical Capability: ${suggestedRating}/5. Communication Skill: ${Math.min(5, suggestedRating + 1)}/5. Problem Solving: ${Math.max(1, suggestedRating - 1)}/5. Summary: Candidate answered all screening prompts. Demonstrated basic familiarity with React hooks and database optimization, showing active communication. Recommending for face-to-face discussions.`,
      isSimulated: true
    };
  }

  // 3. Performance & Attrition Predictor
  public async predictPerformanceAndAttrition(
    empData: {
      name: string;
      department: string;
      designation: string;
      salary: number;
      performanceScore: number;
      attendanceRate: number;
      burnoutRisk: 'Low' | 'Medium' | 'High';
      skillsCount: number;
    }
  ): Promise<PerformancePredictionResult> {
    if (hasLiveAPI && genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
          You are an HR Predictive Analytics AI. Analyze this employee's metrics:
          Name: ${empData.name}
          Department: ${empData.department}
          Designation: ${empData.designation}
          Salary: $${empData.salary}/year
          Current Performance Score: ${empData.performanceScore}/5
          Attendance Rate: ${empData.attendanceRate}%
          Burnout Risk Flag: ${empData.burnoutRisk}
          Number of Technical Skills: ${empData.skillsCount}
          
          Assess their performance outlook and attrition risk.
          Respond ONLY with a JSON object:
          - performanceScore: number (predicted next score 1-5)
          - burnoutRisk: "Low" | "Medium" | "High" (re-assessed status)
          - attritionProbability: number (0-100 percentage)
          - retentionRecommendation: string (action recommendation, e.g. "Conduct 1-on-1")
          - justification: string (a short, logical analytical paragraph, under 100 words)
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            performanceScore: Number(parsed.performanceScore) || 3,
            burnoutRisk: parsed.burnoutRisk || 'Low',
            attritionProbability: Number(parsed.attritionProbability) || 10,
            retentionRecommendation: parsed.retentionRecommendation || '',
            justification: parsed.justification || '',
            isSimulated: false
          };
        }
      } catch (err) {
        console.error('Gemini API performance predictor failed, falling back to local simulation:', err);
      }
    }

    // --- FALLBACK PREDICTOR ---
    let attritionProbability = 5;
    let predictedScore = empData.performanceScore;
    let retentionRecommendation = 'Maintain current operations.';

    if (empData.burnoutRisk === 'High') {
      attritionProbability = getRandomNumber(75, 95);
      predictedScore = Math.max(1, empData.performanceScore - 1);
      retentionRecommendation = 'Schedule immediate 1-on-1 discussion, rebalance project tasks, and offer WFH flexibility.';
    } else if (empData.burnoutRisk === 'Medium') {
      attritionProbability = getRandomNumber(35, 60);
      retentionRecommendation = 'Provide professional growth paths. Recommend sponsored certification learning tracks.';
    } else {
      attritionProbability = getRandomNumber(5, 20);
      if (empData.attendanceRate > 95 && empData.skillsCount > 4) {
        predictedScore = Math.min(5, empData.performanceScore + 1);
      }
    }

    // If attendance is extremely low, elevate risk
    if (empData.attendanceRate < 85) {
      attritionProbability = Math.min(100, attritionProbability + 20);
      predictedScore = Math.max(1, predictedScore - 1);
    }

    const justification = `Predicted performance is ${predictedScore}/5 based on an attendance rate of ${empData.attendanceRate}% and current ${empData.burnoutRisk} burnout risk. Attrition probability is evaluated at ${attritionProbability}% primarily driven by ${empData.burnoutRisk === 'High' ? 'overwork flags and performance degradation' : empData.burnoutRisk === 'Medium' ? 'lack of career development signals' : 'stable team alignment and satisfactory metrics'}.`;

    return {
      performanceScore: predictedScore,
      burnoutRisk: empData.burnoutRisk,
      attritionProbability,
      retentionRecommendation,
      justification,
      isSimulated: true
    };
  }

  // 4. Policy Assistant Chatbot
  public async getPolicyAnswer(userQuestion: string): Promise<PolicyAssistantResponse> {
    if (hasLiveAPI && genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
          You are an HR Policy Virtual Assistant for FWC IT Services.
          
          Here are our company policies:
          ${JSON.stringify(HR_POLICIES, null, 2)}
          
          Answer the user question accurately based ONLY on the policies above.
          User Question: "${userQuestion}"
          
          Respond ONLY with a JSON object containing:
          - answer: string (markdown formatted, professional, polite answer)
          - referencedPolicies: array of strings (policy titles referenced)
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            answer: parsed.answer,
            referencedPolicies: parsed.referencedPolicies || [],
            isSimulated: false
          };
        }
      } catch (err) {
        console.error('Gemini API policy assistant failed, falling back to local simulation:', err);
      }
    }

    // --- FALLBACK POLICY ASSISTANT ---
    const qLower = userQuestion.toLowerCase();
    const matchedPolicies: typeof HR_POLICIES = [];
    
    HR_POLICIES.forEach(p => {
      const titleWords = p.title.toLowerCase().split(' ');
      const matchesWord = titleWords.some(w => qLower.includes(w)) || qLower.includes(p.title.toLowerCase());
      const matchesContent = p.content.toLowerCase().split(' ').filter(w => w.length > 4).some(w => qLower.includes(w));
      
      if (matchesWord || (qLower.includes('leave') && p.title.includes('Leave')) || (qLower.includes('wfh') && p.title.includes('Home')) || (qLower.includes('certif') && p.title.includes('Training'))) {
        matchedPolicies.push(p);
      }
    });

    if (matchedPolicies.length === 0) {
      return {
        answer: `Hello! I couldn't find a specific company policy regarding that in our handbook. 

However, you can reach out to the **HR Support Team** at [hr.support@fwc.com](mailto:hr.support@fwc.com) or submit a query inside your employee dashboard. For general reference, standard collaboration hours are **10:00 AM to 4:00 PM** daily.`,
        referencedPolicies: [],
        isSimulated: true
      };
    }

    const answerLines = matchedPolicies.map(p => `### ${p.title}\n${p.content}`).join('\n\n');
    const answer = `Based on the FWC employee handbook:

${answerLines}

*If you need further details or exception approvals, please discuss with your reporting manager.*`;

    return {
      answer,
      referencedPolicies: matchedPolicies.map(p => p.title),
      isSimulated: true
    };
  }
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const aiService = new AIService();
export const isLiveAI = hasLiveAPI;
