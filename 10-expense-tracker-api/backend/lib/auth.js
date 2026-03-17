import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// ─── Password Utilities ───────────────────────────────────────────────────────

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password against a bcrypt hash
 * @param {string} password - Plain text password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── JWT Utilities ────────────────────────────────────────────────────────────

/**
 * Generate a JWT token for a user
 * @param {{ id: number, email: string }} payload
 * @returns {string} - Signed JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {{ id: number, email: string } | null}
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header
 * @param {Request} request
 * @returns {string | null}
 */
export function extractToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Middleware helper: validate token and return user payload
 * @param {Request} request
 * @returns {{ id: number, email: string } | null}
 */
export function authenticate(request) {
  const token = extractToken(request);
  if (!token) return null;
  return verifyToken(token);
}
