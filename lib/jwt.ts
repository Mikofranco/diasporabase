import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const ALGORITHM = 'HS256';
const EXPIRATION = '15m'; 

// Helper: Convert secret to Uint8Array
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

/**
 * Encrypts user data into a signed JWT
 * @param payload - User info to encode (e.g., { userId, email })
 * @param expiresIn - Optional expiration (default: 15m)
 * @returns Promise<string> - JWT token
 */
export async function encryptUserToJWT(
  payload: Record<string, any>,
  expiresIn: string = EXPIRATION
): Promise<string> {
  const secret = getSecretKey();

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  return jwt;
}

/**
 * Decrypts and verifies a JWT, returns the payload
 * @param token - JWT string
 * @returns Promise<Record<string, any>> - Decoded payload
 * @throws Error if invalid, expired, or tampered
 */
export async function decryptJWT(token: string): Promise<Record<string, any>> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [ALGORITHM],
    });

    return payload as Record<string, any>;
  } catch (error) {
    throw new Error(`Invalid or expired token: ${(error as Error).message}`);
  }
}