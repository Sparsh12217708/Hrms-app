import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const department = searchParams.get('department') || undefined;
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Measure database query execution speed precisely
    const start = performance.now();
    const result = db.getEmployees({
      search,
      department,
      role,
      status,
      page,
      limit
    });
    const end = performance.now();
    const queryTimeMs = parseFloat((end - start).toFixed(4));

    const todayStr = new Date().toISOString().split('T')[0];
    const enrichedEmployees = result.employees.map(emp => {
      const logs = db.getAttendanceLogs(emp.id, todayStr);
      const log = logs.length > 0 ? logs[0] : null;
      let dutyStatus: 'On Duty' | 'Off Duty' = 'Off Duty';
      let clockInTime: string | null = null;
      let clockOutTime: string | null = null;

      if (log) {
        clockInTime = log.clockIn;
        clockOutTime = log.clockOut;
        if (log.clockIn && !log.clockOut) {
          dutyStatus = 'On Duty';
        }
      }

      return {
        ...emp,
        dutyStatus,
        clockInTime,
        clockOutTime
      };
    });

    return NextResponse.json({
      success: true,
      employees: enrichedEmployees,
      totalCount: result.totalCount,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      queryTimeMs
    });
  } catch (err) {
    console.error('Employees GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve employee directory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const empData = await req.json();
    const { name, email, role, department, designation, salary, skills } = empData;

    if (!name || !email || !role || !department || !designation || salary === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify uniqueness of email
    const existing = db.getEmployeeByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An employee with this email already exists' }, { status: 409 });
    }

    const employee = db.createEmployee({
      name,
      email,
      role,
      department,
      designation,
      joiningDate: new Date().toISOString().split('T')[0],
      salary: Number(salary),
      performanceScore: 3, // default
      attendanceRate: 100.0, // default
      skills: skills || [],
      status: 'Active',
      managerId: null,
      burnoutRisk: 'Low',
      retentionAction: 'None'
    });

    return NextResponse.json({ success: true, employee });
  } catch (err) {
    console.error('Employees POST error:', err);
    return NextResponse.json({ error: 'Failed to add employee record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admins can edit anything; managers can edit certain details of their department
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Manager/Admin access required' }, { status: 403 });
    }

    const { id, updates } = await req.json();
    if (!id || !updates) {
      return NextResponse.json({ error: 'Employee ID and updates parameters required' }, { status: 400 });
    }

    const emp = db.getEmployeeById(id);
    if (!emp) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Manager authority validation: can only edit employees in their own department
    if (currentUser.role === 'manager' && emp.department !== currentUser.department) {
      return NextResponse.json({ error: 'Forbidden: Cannot edit employee in other department' }, { status: 403 });
    }

    const updated = db.updateEmployee(id, updates);
    return NextResponse.json({ success: true, employee: updated });
  } catch (err) {
    console.error('Employees PUT error:', err);
    return NextResponse.json({ error: 'Failed to update employee details' }, { status: 500 });
  }
}
