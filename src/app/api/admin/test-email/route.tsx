import { NextResponse } from 'next/server';
import { Text } from '@react-email/components';
import { getAdminUser } from '@/lib/server/requireAdmin';
import { hit } from '@/lib/server/rateLimit';
import { sendEmail } from '@/lib/server/email/send';
import { EmailLayout, emailStyles, type EmailLang } from '@/lib/server/email/layout';

export const runtime = 'nodejs';

/**
 * FND-02: admin-only deliverability test. Sends a test message to the
 * authenticated admin's OWN address (no arbitrary recipient).
 * Goes through sendEmail(): only really sends in production or with ALLOW_EMAIL_SEND=1.
 * Body (optional JSON): { "lang": "fr" | "en" }
 */
export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const allowed = await hit(`test-email:${user.id}`, 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let lang: EmailLang = 'fr';
  try {
    const body = (await request.json()) as { lang?: string };
    if (body?.lang === 'en') lang = 'en';
  } catch {
    // empty body is fine
  }

  const subject = lang === 'fr' ? 'Test d’envoi — ghjulianucodani.com' : 'Delivery test — ghjulianucodani.com';
  const line =
    lang === 'fr'
      ? 'Ceci est un email de test. Vérifiez dans les en-têtes que SPF, DKIM et DMARC sont « pass ».'
      : 'This is a test email. Check the headers show SPF, DKIM and DMARC as “pass”.';

  const result = await sendEmail({
    to: user.email,
    subject,
    text: line,
    react: (
      <EmailLayout lang={lang} preview={subject}>
        <Text style={emailStyles.h1}>{subject}</Text>
        <Text style={emailStyles.p}>{line}</Text>
      </EmailLayout>
    ),
    tags: [{ name: 'category', value: 'admin_test' }],
  });

  return NextResponse.json(result, { status: result.sent || result.reason === 'guard' ? 200 : 502 });
}
