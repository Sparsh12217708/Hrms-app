import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db, Employee } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'hrms-super-secret-key-123';
const COOKIE_NAME = 'hrms-session-token';

export interface JWTPayload {
  id: string;
  email: string;
  role: Employee['role'];
  name: string;
  department: string;
}

export function generateToken(employee: Employee): string {
  const payload: JWTPayload = {
    id: employee.id,
    email: employee.email,
    role: employee.role,
    name: employee.name,
    department: employee.department
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(): Promise<Employee | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(COOKIE_NAME);
    
    if (!tokenCookie || !tokenCookie.value) {
      return null;
    }

    const decoded = verifyToken(tokenCookie.value);
    if (!decoded) {
      return null;
    }

    // Retrieve fresh employee record from database
    return db.getEmployeeById(decoded.id);
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

export async function loginUser(email: string): Promise<{ success: boolean; token?: string; employee?: Employee }> {
  // Simple passwordless login for demo convenience: just check if email exists in DB
  const employee = db.getEmployeeByEmail(email);
  if (!employee) {
    return { success: false };
  }

  const token = generateToken(employee);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/'
  });

  return { success: true, token, employee };
}

export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
