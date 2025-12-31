import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  userId: string;
  username: string;
  role: string;
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try cookie first (for web app)
    const cookieToken = request.cookies.get('token')?.value;
    
    // Try Authorization header (for desktop app) - check both lowercase and capitalized
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const headerToken = authHeader?.replace(/^Bearer\s+/i, '');
    
    const token = cookieToken || headerToken;

    if (!token) {
      console.log('No token found in request - cookies:', !!cookieToken, 'header:', !!authHeader);
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function requireAuth(user: AuthUser | null): void {
  if (!user) {
    throw new Error('Unauthorized');
  }
}

export function requireAdmin(user: AuthUser | null): void {
  requireAuth(user);
  if (user.role !== 'ROLE_ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
}

