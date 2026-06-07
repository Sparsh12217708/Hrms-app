import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiService } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'recruiter') {
      return NextResponse.json({ error: 'Forbidden: Recruiter access required' }, { status: 403 });
    }

    const { name, email, resumeText, jobDescription } = await req.json();

    if (!name || !email || !resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing required parameters (name, email, resumeText, jobDescription)' }, { status: 400 });
    }

    // 1. Create candidate record in database
    const candidate = db.createCandidate({ name, email, resumeText });

    // 2. Call AI Service to evaluate resume
    const aiResult = await aiService.evaluateResume(resumeText, jobDescription);

    // 3. Update candidate with AI scoring
    const updatedCandidate = db.updateCandidate(candidate.id, {
      fitmentScore: aiResult.fitmentScore,
      evaluationText: aiResult.evaluationText,
      skillsMatched: aiResult.skillsMatched,
      skillsMissing: aiResult.skillsMissing,
      customQuestions: aiResult.customQuestions,
      interviewStatus: aiResult.fitmentScore >= 45 ? 'Not Screened' : 'Rejected'
    });

    return NextResponse.json({
      success: true,
      candidate: updatedCandidate,
      isSimulated: aiResult.isSimulated
    });
  } catch (err) {
    console.error('AI Resume Screening API error:', err);
    return NextResponse.json({ error: 'Failed to process resume screening' }, { status: 500 });
  }
}
