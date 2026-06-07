import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const targetEmpId = currentUser.role === 'employee' ? currentUser.id : employeeId;
    const goals = db.getPerformanceGoals(targetEmpId);

    return NextResponse.json({ goals });
  } catch (err) {
    console.error('Performance GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve performance goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employeeId, title, description, type, dueDate, weight } = body;

    if (!employeeId || !title || !type || !dueDate || weight === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Role safety check: Employees can only assign goals to themselves (or managers to team members)
    if (currentUser.role === 'employee' && currentUser.id !== employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const goal = db.createPerformanceGoal({
      employeeId,
      title,
      description: description || '',
      type,
      dueDate,
      progress: 0,
      status: 'Not Started',
      weight: Number(weight)
    });

    return NextResponse.json({ success: true, goal });
  } catch (err) {
    console.error('Performance POST error:', err);
    return NextResponse.json({ error: 'Failed to create performance goal' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, progress, status, title, description, performanceScore } = body;

    // Check if it's an appraisal rating update on an employee (Manager/Admin action)
    if (performanceScore !== undefined && body.employeeId) {
      if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
        return NextResponse.json({ error: 'Forbidden: Managers or admins only' }, { status: 403 });
      }
      
      const updatedEmp = db.updateEmployee(body.employeeId, {
        performanceScore: Number(performanceScore)
      });
      
      if (!updatedEmp) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true, employee: updatedEmp });
    }

    // Otherwise, it is a standard Goal update
    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (progress !== undefined) updates.progress = Number(progress);
    if (status) updates.status = status;
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;

    const updatedGoal = db.updatePerformanceGoal(id, updates);
    if (!updatedGoal) {
      return NextResponse.json({ error: 'Performance goal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, goal: updatedGoal });
  } catch (err) {
    console.error('Performance PUT error:', err);
    return NextResponse.json({ error: 'Failed to update performance parameters' }, { status: 500 });
  }
}
