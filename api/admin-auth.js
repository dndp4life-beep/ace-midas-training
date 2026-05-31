import crypto from "crypto";

const cookieName = "ace_admin_session";
const sessionMaxAge = 8 * 60 * 60;

function getSessionSecret() {
  return process.env.BACK_OFFICE_SESSION_SECRET || process.env.BACK_OFFICE_ADMIN_CODE || (process.env.NODE_ENV !== "production" ? "ACEADMIN2026" : "");
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value) {
  const secret = getSessionSecret();
  if (!secret) throw new Error("Back Office server authentication is not configured.");
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createToken(role = "Admin") {
  const payload = encode(JSON.stringify({ role, expires_at: Date.now() + sessionMaxAge * 1000 }));
  return `${payload}.${sign(payload)}`;
}

function readCookie(req, name) {
  return String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === name)?.[1] || "";
}

function verifyToken(token) {
  const [payload, signature] = String(token || "").split(".");
  if (!payload || !signature) return null;
  let expected = "";
  try {
    expected = sign(payload);
  } catch {
    return null;
  }
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Number(session.expires_at || 0) > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const action = String(req.body?.action || "status");

  if (action === "login") {
    const configuredCode = process.env.BACK_OFFICE_ADMIN_CODE || (process.env.NODE_ENV !== "production" ? "ACEADMIN2026" : "");
    if (!configuredCode || !getSessionSecret()) return res.status(500).json({ error: "Back Office server authentication is not configured." });
    const suppliedCode = String(req.body?.code || "");
    const matches = suppliedCode.length === configuredCode.length
      && crypto.timingSafeEqual(Buffer.from(suppliedCode), Buffer.from(configuredCode));
    if (!matches) return res.status(401).json({ error: "Incorrect admin code." });
    res.setHeader("Set-Cookie", `${cookieName}=${createToken("Admin")}; Path=/; Max-Age=${sessionMaxAge}; HttpOnly; Secure; SameSite=Strict`);
    return res.status(200).json({ success: true, authenticated: true, role: "Admin" });
  }

  if (action === "logout") {
    res.setHeader("Set-Cookie", `${cookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`);
    return res.status(200).json({ success: true, authenticated: false });
  }

  const session = verifyToken(readCookie(req, cookieName));
  if (!session) return res.status(401).json({ authenticated: false });
  return res.status(200).json({ authenticated: true, role: session.role || "Admin" });
}
