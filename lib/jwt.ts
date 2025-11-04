import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';

// const JWT_SECRET = process.env.JWT_SECRET || "c3c46e192542e7db438d8522b5bd843f";
const JWT_SECRET = "c3c46e192542e7db438d8522b5bd843f";

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

const ALGORITHM = 'HS256';
const ISSUER = 'diasporabase';
const AUDIENCE = 'diasporabase-user';

/**
 * Encrypts user data into a UNIQUE, signed JWT
 * @param payload - Must include userId and purpose
 * @param expiresIn - e.g., '15m', '1h'
 */
export async function encryptUserToJWT(
  payload: { userId: string; email: string; purpose: string; [key: string]: any },
  expiresIn: string = '15m'
): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);

  // ENSURE UNIQUENESS: jti + issuedAt
  const jti = uuidv4(); // Unique ID per token
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({
    ...payload,
    jti,
    iat: now,
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(expiresIn)
    .sign(secret);

  return jwt;
}

/**
 * Decrypts and verifies JWT
 * @param token - JWT string
 * @returns Decoded payload
 */
export async function decryptJWT(token: string): Promise<{
  userId: string;
  email: string;
  purpose: string;
  jti: string;
  iat: number;
  exp: number;
}> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    // Type assertion with validation
    if (!payload.userId || !payload.email || !payload.purpose) {
      throw new Error('Invalid payload: missing required fields');
    }

    return payload as any;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw new Error(`Invalid or expired token: ${(error as Error).message}`);
  }
}