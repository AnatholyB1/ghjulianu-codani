import 'server-only';
import type { ReactElement } from 'react';
import { Resend } from 'resend';

export interface SendEmailInput {
  to: string;
  subject: string;
  /** React Email element (preferred). Either `react` or `html` is required. */
  react?: ReactElement;
  html?: string;
  /** Plain-text alternative (strongly recommended for deliverability). */
  text?: string;
  headers?: Record<string, string>;
  tags?: { name: string; value: string }[];
}

export type SendEmailResult =
  | { sent: true; id: string | null }
  | { sent: false; reason: 'guard' | 'config' | 'error' };

/** D-13: real sending only in production, or when explicitly forced for a local test. */
export function emailSendingEnabled(): boolean {
  return process.env.VERCEL_ENV === 'production' || process.env.ALLOW_EMAIL_SEND === '1';
}

/** a***@domain.tld — never log full addresses. */
function redact(email: string): string {
  const [local, domain] = email.split('@');
  return domain ? `${local.slice(0, 1)}***@${domain}` : '***';
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!emailSendingEnabled()) {
    console.info(`[email] guard: not sent (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}) to=${redact(input.to)} subject="${input.subject}"`);
    return { sent: false, reason: 'guard' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    console.warn('[email] RESEND_API_KEY / RESEND_FROM missing');
    return { sent: false, reason: 'config' };
  }
  if (!input.react && !input.html) {
    throw new Error('sendEmail: react or html is required');
  }

  try {
    const resend = new Resend(apiKey);
    const payload = {
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      headers: input.headers,
      tags: input.tags,
      ...(input.react ? { react: input.react } : { html: input.html as string }),
    };
    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.warn(`[email] resend error: ${error.name} to=${redact(input.to)}`);
      return { sent: false, reason: 'error' };
    }
    return { sent: true, id: data?.id ?? null };
  } catch (e) {
    console.warn(`[email] send failure: ${e instanceof Error ? e.message : 'unknown'} to=${redact(input.to)}`);
    return { sent: false, reason: 'error' };
  }
}
