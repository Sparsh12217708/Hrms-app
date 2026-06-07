import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiService } from '@/lib/ai';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get('candidateId');
    if (!candidateId) {
      const candidates = db.getCandidates();
      return NextResponse.json({ candidates });
    }

    const candidate = db.getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ candidate });
  } catch (err) {
    console.error('Interview Chat GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve candidate record' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { candidateId, message } = await req.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const candidate = db.getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const transcript = [...(candidate.interviewTranscript || [])];

    // 1. If candidate sent a message, append it
    if (message) {
      transcript.push({
        role: 'candidate',
        text: message,
        timestamp: new Date().toISOString()
      });
      db.updateCandidate(candidateId, {
        interviewTranscript: transcript,
        interviewStatus: 'Screening'
      });
    }

    // 2. Call AI Service to get Bot response
    // Format transcript for AI service (only need role and text)
    const formattedTranscript = transcript.map(t => ({ role: t.role, text: t.text }));
    const aiResponse = await aiService.getInterviewBotResponse(formattedTranscript, candidate.name);

    // 3. Append bot response to transcript
    transcript.push({
      role: 'bot',
      text: aiResponse.replyText,
      timestamp: new Date().toISOString()
    });

    // 4. If complete, save scorecard details and finalize status
    const updates: any = {
      interviewTranscript: transcript
    };

    if (aiResponse.isCompleted) {
      updates.interviewStatus = (aiResponse.suggestedRating && aiResponse.suggestedRating >= 3) ? 'Shortlisted' : 'Rejected';
      updates.evaluationText = aiResponse.evaluationSummary || 'Completed screening.';
      updates.fitmentScore = aiResponse.suggestedRating ? (aiResponse.suggestedRating * 20) : candidate.fitmentScore;
    }

    const updatedCandidate = db.updateCandidate(candidateId, updates);

    return NextResponse.json({
      success: true,
      botReply: aiResponse.replyText,
      isCompleted: aiResponse.isCompleted,
      candidate: updatedCandidate
    });
  } catch (err) {
    console.error('AI Interview Chat API error:', err);
    return NextResponse.json({ error: 'Failed to process interview message' }, { status: 500 });
  }
}
