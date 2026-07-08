import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "stockpilot_secret_key_67890";

/**
 * Hash a password using SHA-256
 */
export function hashPassword(password: string): string {
  return crypto.createHmac("sha256", JWT_SECRET).update(password).digest("hex");
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Generate a JWT token (header.payload.signature)
 */
export function generateToken(payload: object, expiryHours = 24): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiryHours * 60 * 60;
  
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signatureInput)
    .digest("base64url");
    
  return `${signatureInput}.${signature}`;
}

/**
 * Verify a JWT token and return its payload
 */
export function verifyToken(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [header, payload, signature] = parts;
    const signatureInput = `${header}.${payload}`;
    
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(signatureInput)
      .digest("base64url");
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
      return null; // Expired
    }
    
    return decodedPayload;
  } catch (err) {
    return null;
  }
}
