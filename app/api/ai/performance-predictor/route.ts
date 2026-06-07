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

    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
    }

    const { employeeId } = await req.json();
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const emp = db.getEmployeeById(employeeId);
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Call AI service to run predictive diagnostics
    const result = await aiService.predictPerformanceAndAttrition({
      name: emp.name,
      department: emp.department,
      designation: emp.designation,
      salary: emp.salary,
      performanceScore: emp.performanceScore,
      attendanceRate: emp.attendanceRate,
      burnoutRisk: emp.burnoutRisk,
      skillsCount: emp.skills ? emp.skills.length : 0
    });

    // Update employee records in the DB with the updated burnout risk and retention action
    db.updateEmployee(employeeId, {
      burnoutRisk: result.burnoutRisk,
      retentionAction: result.retentionRecommendation
    });

    return NextResponse.json({
      success: true,
      prediction: result
    });
  } catch (err) {
    console.error('AI Performance Predictor API error:', err);
    return NextResponse.json({ error: 'Failed to evaluate performance/attrition analytics' }, { status: 500 });
  }
}
