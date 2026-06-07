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

    // Role-based scoping
    const targetEmpId = currentUser.role === 'employee' ? currentUser.id : employeeId;
    const records = db.getPayrollRecords(targetEmpId);
    
    return NextResponse.json({ records });
  } catch (err) {
    console.error('Payroll GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve payroll history' }, { status: 500 });
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

    const body = await req.json();
    const { employeeId, month, baseSalary, allowances, deductions } = body;

    if (!employeeId || !month || baseSalary === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate tax (15% flat rate for simplicity) and net pay
    const gross = Number(baseSalary) + Number(allowances || 0) - Number(deductions || 0);
    const tax = Math.round(gross * 0.15);
    const netPay = gross - tax;

    const record = db.createPayrollRecord({
      employeeId,
      month,
      baseSalary: Number(baseSalary),
      allowances: Number(allowances || 0),
      deductions: Number(deductions || 0),
      tax,
      netPay,
      status: 'Paid', // Paid immediately in mock
      paymentDate: new Date().toISOString().split('T')[0]
    });

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error('Payroll POST error:', err);
    return NextResponse.json({ error: 'Failed to create payroll record' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const updated = db.updatePayrollStatus(id, status);
    if (!updated) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, record: updated });
  } catch (err) {
    console.error('Payroll PUT error:', err);
    return NextResponse.json({ error: 'Failed to update payroll status' }, { status: 500 });
  }
}
