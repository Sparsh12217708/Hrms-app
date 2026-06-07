import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Query message is required' }, { status: 400 });
    }

    const result = await aiService.getPolicyAnswer(message);
    return NextResponse.json({
      success: true,
      answer: result.answer,
      referencedPolicies: result.referencedPolicies,
      isSimulated: result.isSimulated
    });
  } catch (err) {
    console.error('AI Policy Assistant API error:', err);
    return NextResponse.json({ error: 'Failed to retrieve policy details' }, { status: 500 });
  }
}
