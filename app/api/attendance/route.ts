import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || undefined;
    const date = searchParams.get('date') || undefined;
    const fetchLeaves = searchParams.get('leaves') === 'true';

    // Verify session
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (fetchLeaves) {
      // If employee, restrict to their leaves; managers/admins can view all or specific
      const targetEmpId = currentUser.role === 'employee' ? currentUser.id : employeeId;
      const leaveRequests = db.getLeaveRequests(targetEmpId);
      return NextResponse.json({ leaveRequests });
    } else {
      const targetEmpId = currentUser.role === 'employee' ? currentUser.id : employeeId;
      const logs = db.getAttendanceLogs(targetEmpId, date);
      return NextResponse.json({ logs });
    }
  } catch (err) {
    console.error('Attendance GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'clockIn') {
      const { employeeId, date, time } = body;
      
      // Safety check: Employees can only clock in for themselves
      if (currentUser.role === 'employee' && currentUser.id !== employeeId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const log = db.clockIn(employeeId, date, time);
      return NextResponse.json({ success: true, log });
    }

    if (action === 'clockOut') {
      const { employeeId, date, time } = body;

      if (currentUser.role === 'employee' && currentUser.id !== employeeId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const log = db.clockOut(employeeId, date, time);
      if (!log) {
        return NextResponse.json({ error: 'No clock-in record found for today' }, { status: 404 });
      }
      return NextResponse.json({ success: true, log });
    }

    if (action === 'requestLeave') {
      const { employeeId, employeeName, startDate, endDate, type, reason } = body;

      if (currentUser.role === 'employee' && currentUser.id !== employeeId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const leave = db.createLeaveRequest({
        employeeId,
        employeeName,
        startDate,
        endDate,
        type,
        reason
      });
      return NextResponse.json({ success: true, leave });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Attendance POST error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }

    const { leaveRequestId, status } = await req.json();
    if (!leaveRequestId || !status || (status !== 'Approved' && status !== 'Rejected')) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 });
    }

    const updated = db.updateLeaveStatus(leaveRequestId, status, currentUser.name);
    if (!updated) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, leave: updated });
  } catch (err) {
    console.error('Attendance PUT error:', err);
    return NextResponse.json({ error: 'Failed to update leave status' }, { status: 500 });
  }
}
