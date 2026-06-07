import { NextRequest, NextResponse } from 'next/server';
import { loginUser, logoutUser, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (err) {
    console.error('Session retrieval error:', err);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password !== 'password123') {
      return NextResponse.json({ error: 'Invalid password. Use "password123"' }, { status: 401 });
    }

    // Demo mapping: Resolve dynamic seeded email based on role selection fallback
    let targetEmail = email;
    if (email === 'admin@fwc.com') {
      const result = db.getEmployees({ role: 'admin', page: 1, limit: 1 });
      if (result.employees && result.employees.length > 0) {
        targetEmail = result.employees[0].email;
      }
    } else if (email === 'manager.eng@fwc.com') {
      const result = db.getEmployees({ role: 'manager', page: 1, limit: 1 });
      if (result.employees && result.employees.length > 0) {
        targetEmail = result.employees[0].email;
      }
    } else if (email === 'recruiter.neha@fwc.com') {
      const result = db.getEmployees({ role: 'recruiter', page: 1, limit: 1 });
      if (result.employees && result.employees.length > 0) {
        targetEmail = result.employees[0].email;
      }
    } else if (email === 'meghna.kothari.1@fwc.com' || email === 'liam.smith.1@fwc.com' || email === 'employee.liam@fwc.com') {
      const result = db.getEmployees({ role: 'employee', page: 1, limit: 1 });
      if (result.employees && result.employees.length > 0) {
        targetEmail = result.employees[0].email;
      }
    }

    const { success, token, employee } = await loginUser(targetEmail);
    if (!success || !employee) {
      return NextResponse.json({ error: 'Employee not found with this email. Please run seed script.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await logoutUser();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}
