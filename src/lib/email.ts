import crypto from "crypto";
import path from "path";
import { readFile } from "fs/promises";
import nodemailer from "nodemailer";

type VerifyEmailPayload = {
  to: string;
  name: string;
  verifyUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function createEmailVerificationToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

export function hashEmailVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "https://verify.igire.vercel.app"
  );
}

export function buildVerifyUrl(rawToken: string) {
  return `${appBaseUrl()}/verify-email#token=${encodeURIComponent(rawToken)}`;
}

export function buildResetUrl(rawToken: string) {
  return `${appBaseUrl()}/auth/reset-password#token=${encodeURIComponent(rawToken)}`;
}

function getTransport() {
  const host = required("SMTP_HOST");
  const port = Number(required("SMTP_PORT"));
  const user = required("SMTP_USER");
  const pass = required("SMTP_PASS");

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendWelcomeVerificationEmail(payload: VerifyEmailPayload) {
  const from = process.env.SMTP_FROM || `Igire Verify <${required("SMTP_USER")}>`;
  const transport = getTransport();
  const base = appBaseUrl().replace(/\/+$/, "");
  const safeName = escapeHtml(payload.name);
  const fallbackVerifyPage = `${base}/verify-email`;

  const attachments: Array<{
    filename: string;
    content: Buffer;
    cid: string;
  }> = [];

  try {
    const igireLogo = await readFile(path.join(process.cwd(), "public", "logo-igire.webp"));
    attachments.push({
      filename: "logo-igire.webp",
      content: igireLogo,
      cid: "igire-logo",
    });
  } catch {}

  try {
    const hero = await readFile(path.join(process.cwd(), "public", "Real.png"));
    attachments.push({
      filename: "Real.png",
      content: hero,
      cid: "igire-hero",
    });
  } catch {}

  await transport.sendMail({
    from,
    to: payload.to,
    subject: "Welcome to Igire Verify - Verify your email address",
    text: `Hi ${payload.name},\n\nWelcome to Igire Verify.\nPlease verify your account by using the "Verify Email Address" button in this email.\nFallback page: ${fallbackVerifyPage}\n\nIf you did not create this account, ignore this email.`,
    html: `
<div style="margin:0;padding:0;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f5f7;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 18px 28px;background:linear-gradient(135deg,#F7FAF8 0%,#EDF7F0 100%);border-bottom:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="middle" style="width:70px;">
                    <img src="cid:igire-logo" width="58" height="58" alt="Igire Rwanda logo" style="display:block;border:0;outline:none;">
                  </td>
                  <td valign="middle">
                    <div style="font-size:30px;font-weight:800;line-height:1.1;">
                      <span style="color:#C47D0E;">Igire</span><span style="color:#2E7D32;">Verify</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 8px 28px;color:#111827;">
              <div style="font-size:20px;font-weight:700;margin-bottom:10px;">Welcome, ${safeName}</div>
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#374151;">
                Thank you for creating your account on <strong>Igire Verify</strong>.
                To activate your profile and continue, please verify your email address.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 28px 18px 28px;">
              <a href="${payload.verifyUrl}" style="display:inline-block;background:#2E7D32;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:10px;">
                Verify Email Address
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 14px 28px;">
              <p style="margin:0;font-size:13px;line-height:1.6;color:#6b7280;">
                If the button does not work, open this page and paste the verification token from your email client URL bar:
              </p>
              <p style="margin:6px 0 0 0;font-size:13px;line-height:1.6;word-break:break-all;">
                <a href="${fallbackVerifyPage}" style="color:#1d4ed8;text-decoration:underline;">${fallbackVerifyPage}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:10px 28px 8px 28px;">
              <img src="cid:igire-hero" width="180" alt="Igire Verify visual identity" style="display:block;border:0;outline:none;">
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 24px 28px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                If you did not create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`,
    attachments,
  });
}

export async function sendPasswordResetEmail(payload: { to: string; name: string; resetUrl: string }) {
  const from = process.env.SMTP_FROM || `Igire Verify <${required("SMTP_USER")}>`;
  const transport = getTransport();
  const safeName = escapeHtml(payload.name);

  const attachments: Array<{
    filename: string;
    content: Buffer;
    cid: string;
  }> = [];

  try {
    const igireLogo = await readFile(path.join(process.cwd(), "public", "logo-igire.webp"));
    attachments.push({
      filename: "logo-igire.webp",
      content: igireLogo,
      cid: "igire-logo",
    });
  } catch {}

  await transport.sendMail({
    from,
    to: payload.to,
    subject: "Reset your Igire Verify password",
    text: `Hi ${payload.name},\n\nYou requested to reset your password. Please use the link below to set a new password:\n${payload.resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `
<div style="margin:0;padding:0;background:#f3f5f7;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f5f7;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px 18px 28px;background:linear-gradient(135deg,#F7FAF8 0%,#EDF7F0 100%);border-bottom:1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="middle" style="width:70px;">
                    <img src="cid:igire-logo" width="58" height="58" alt="Igire Rwanda logo" style="display:block;border:0;outline:none;">
                  </td>
                  <td valign="middle">
                    <div style="font-size:30px;font-weight:800;line-height:1.1;">
                      <span style="color:#C47D0E;">Igire</span><span style="color:#2E7D32;">Verify</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 8px 28px;color:#111827;">
              <div style="font-size:20px;font-weight:700;margin-bottom:10px;">Password Reset Request</div>
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#374151;">
                Hi ${safeName}, we received a request to reset your password. 
                Click the button below to choose a new password.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 28px 18px 28px;">
              <a href="${payload.resetUrl}" style="display:inline-block;background:#2E7D32;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;border-radius:10px;">
                Reset Password
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 24px 28px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                If you did not request a password reset, you can safely ignore this email. This link will expire in 1 hour.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`,
    attachments,
  });
}
