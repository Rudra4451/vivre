import crypto from "crypto";

export type UnsubscribeNotificationType = "comeback" | "weekly_recap" | "all";

interface UnsubscribePayload {
  userId: string;
  type: UnsubscribeNotificationType;
  exp: number; // unix timestamp in ms
}

function getSecretKey(): string {
  const secret =
    process.env.CRON_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    "vivre-unsubscribe-fallback-secret-2026";
  return secret;
}

/**
 * Creates a tamper-proof, server-controlled HMAC-SHA256 signed token
 * allowing users to securely unsubscribe with one click without logging in.
 */
export function createUnsubscribeToken(
  userId: string,
  type: UnsubscribeNotificationType = "all",
  expiresInDays: number = 90
): string {
  const exp = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;
  const payload: UnsubscribePayload = { userId, type, exp };
  
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecretKey())
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a tokenized unsubscribe request.
 * Guarantees that neither userId, type, nor expiration has been tampered with.
 */
export function verifyUnsubscribeToken(token: string): {
  valid: boolean;
  userId?: string;
  type?: UnsubscribeNotificationType;
  error?: string;
} {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, error: "Malformed token format" };
  }

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return { valid: false, error: "Incomplete token components" };
  }

  const expectedSignature = crypto
    .createHmac("sha256", getSecretKey())
    .update(payloadB64)
    .digest("base64url");

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { valid: false, error: "Invalid cryptographic signature" };
  }

  try {
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: UnsubscribePayload = JSON.parse(payloadJson);

    if (!payload.userId || !payload.type || !payload.exp) {
      return { valid: false, error: "Invalid token payload properties" };
    }

    if (Date.now() > payload.exp) {
      return { valid: false, error: "Token has expired" };
    }

    return {
      valid: true,
      userId: payload.userId,
      type: payload.type,
    };
  } catch {
    return { valid: false, error: "Failed to deserialize token payload" };
  }
}

/**
 * Generates the full unsubscribe URL for email footers.
 */
export function createUnsubscribeUrl(
  userId: string,
  type: UnsubscribeNotificationType = "all",
  appUrl: string = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
): string {
  const token = createUnsubscribeToken(userId, type);
  const cleanBaseUrl = appUrl.replace(/\/+$/, "");
  return `${cleanBaseUrl}/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`;
}
