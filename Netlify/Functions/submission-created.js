// Netlify Function: submission-created
// Fires automatically when a Netlify Form submission is verified.
// Sends the user an auto-reply containing their business plan + a soft workshop CTA.
//
// Environment variables required (set in Netlify UI):
//   RESEND_API_KEY  — your Resend API key (starts with "re_")
//
// Setup checklist:
//   1. Sign up at resend.com
//   2. Verify mindandmethodacademy.com as a domain in Resend (adds SPF/DKIM/DMARC to Cloudflare)
//   3. Create an API key in Resend → add as RESEND_API_KEY env var in Netlify
//   4. Deploy. Function runs automatically on every business-plan form submission.

const { Resend } = require('resend');

const FROM_ADDRESS = 'Mind & Method Academy <hello@mindandmethodacademy.com>';
const WORKSHOP_URL = 'https://mindandmethodacademy.com/workshop/';

// The 7 questions in the same order as the form. Kept here (not relying on form data) so the
// email is well-structured even if a user leaves blanks.
const QUESTIONS = [
  'What problem do you solve?',
  'Who has this problem?',
  'What is your solution — and how do you deliver it?',
  'Why are you the right person to deliver this?',
  'What will you charge — and why is that fair value?',
  'How will you find your first 5 customers?',
  'What does success look like in 90 days?'
];

// Parses the plain-text "plan" field from the form back into structured Q&A.
// Form sends: "Plan owner: X\n\nQ1: answer\n\nQ2: answer\n\n..."
// Markers (Q1:, Q2:, ...) only count when they appear at the start of a line, so a user
// typing "Q5:" inside an answer body won't confuse the parser.
function parsePlan(planText) {
  if (!planText) return ['','','','','','',''];
  const answers = ['','','','','','',''];
  for (let i = 1; i <= 7; i++) {
    const re = new RegExp(`(?:^|\\n)Q${i}:`);
    const match = re.exec(planText);
    if (!match) continue;
    const contentStart = match.index + match[0].length;
    let endIdx;
    if (i < 7) {
      const nextRe = new RegExp(`\\n\\nQ${i + 1}:`);
      const nextMatch = nextRe.exec(planText.substring(contentStart));
      endIdx = nextMatch ? contentStart + nextMatch.index : planText.length;
    } else {
      endIdx = planText.length;
    }
    answers[i - 1] = planText.substring(contentStart, endIdx).trim();
  }
  return answers;
}

// Escape HTML so user input can't break the email template or inject markup.
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildHtml(name, answers) {
  const safeName = escapeHtml(name || 'there');
  const blocks = QUESTIONS.map((q, i) => {
    const answer = answers[i] || '<em style="color:#999;">Not completed.</em>';
    const safeAnswer = answers[i] ? escapeHtml(answer).replace(/\n/g, '<br>') : answer;
    return `
      <div style="margin-bottom:28px;">
        <div style="font-family:'Montserrat',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#C5A059;margin-bottom:6px;">
          Question ${i + 1}
        </div>
        <div style="font-family:Georgia,serif;font-size:16px;font-weight:600;color:#1B263B;margin-bottom:10px;line-height:1.4;">
          ${escapeHtml(q)}
        </div>
        <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#333;">
          ${safeAnswer}
        </div>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Business Plan</title></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f3ef;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">

        <tr><td style="background:#1B263B;padding:32px 40px;">
          <div style="font-family:'Montserrat',Arial,sans-serif;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:0.02em;">
            Mind <span style="color:#C5A059;">&amp;</span> Method Academy
          </div>
        </td></tr>

        <tr><td style="padding:40px 40px 20px 40px;">
          <h1 style="font-family:'Montserrat',Arial,sans-serif;font-size:24px;font-weight:800;color:#1B263B;margin:0 0 16px 0;line-height:1.2;">
            Your 1-Hour Business Plan
          </h1>
          <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#555;margin:0 0 8px 0;">
            Hi ${safeName},
          </p>
          <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#555;margin:0 0 24px 0;">
            Here is the plan you built. Keep it. Revisit it. Use it as the starting point — not the finish line.
          </p>
          <div style="height:2px;background:#C5A059;width:60px;margin:0 0 28px 0;"></div>
        </td></tr>

        <tr><td style="padding:0 40px 20px 40px;">
          ${blocks}
        </td></tr>

        <tr><td style="padding:20px 40px 40px 40px;">
          <div style="background:#1B263B;border-radius:8px;padding:32px;text-align:center;">
            <div style="font-family:'Montserrat',Arial,sans-serif;font-size:18px;font-weight:800;color:#ffffff;margin-bottom:12px;">
              You have a plan. Now build it.
            </div>
            <p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.7);margin:0 0 20px 0;">
              The Business Builder Workshop takes everything you just wrote and turns it into a real, operating business — with coaching, accountability, and a structured path to your first paying client.
            </p>
            <a href="${WORKSHOP_URL}" style="display:inline-block;background:#C5A059;color:#1B263B;font-family:'Montserrat',Arial,sans-serif;font-size:13px;font-weight:800;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:4px;">
              See the Workshop &rarr;
            </a>
          </div>
        </td></tr>

        <tr><td style="background:#f5f3ef;padding:24px 40px;text-align:center;border-top:1px solid #e5e0d6;">
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#999;margin:0;line-height:1.6;">
            Mind &amp; Method Academy &middot; <a href="https://mindandmethodacademy.com" style="color:#999;">mindandmethodacademy.com</a><br>
            You received this because you completed the free business plan tool.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPlainText(name, answers) {
  const lines = [
    `Hi ${name || 'there'},`,
    '',
    'Here is the plan you built. Keep it. Revisit it. Use it as the starting point — not the finish line.',
    '',
    '─────────────────────────────',
    'YOUR 1-HOUR BUSINESS PLAN',
    '─────────────────────────────',
    ''
  ];
  QUESTIONS.forEach((q, i) => {
    lines.push(`${i + 1}. ${q}`);
    lines.push('');
    lines.push(answers[i] || '(Not completed.)');
    lines.push('');
  });
  lines.push('─────────────────────────────');
  lines.push('');
  lines.push('You have a plan. Now build it.');
  lines.push('');
  lines.push('The Business Builder Workshop takes everything you just wrote and turns it into a real, operating business — with coaching, accountability, and a structured path to your first paying client.');
  lines.push('');
  lines.push(`See the Workshop: ${WORKSHOP_URL}`);
  lines.push('');
  lines.push('—');
  lines.push('Mind & Method Academy');
  lines.push('mindandmethodacademy.com');
  return lines.join('\n');
}

exports.handler = async (event) => {
  // Guard: only process POSTs with a body
  if (!event.body) {
    return { statusCode: 400, body: 'No payload' };
  }

  let submission;
  try {
    submission = JSON.parse(event.body).payload;
  } catch (err) {
    console.error('Failed to parse submission body:', err);
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  // Only handle the business-plan form. If you add other Netlify forms later, they'll
  // all hit this function — this check stops us emailing contact-form senders by mistake.
  if (submission.form_name !== 'business-plan') {
    console.log(`Ignoring submission from form: ${submission.form_name}`);
    return { statusCode: 200, body: 'Not business-plan form, ignored' };
  }

  const data = submission.data || {};
  const userEmail = (data.email || '').trim();
  const userName = (data.name || '').trim();
  const planText = data.plan || '';

  if (!userEmail || !userEmail.includes('@')) {
    console.error('No valid email on submission');
    return { statusCode: 400, body: 'No email' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set in Netlify environment variables');
    return { statusCode: 500, body: 'Email service not configured' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const answers = parsePlan(planText);

  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [userEmail],
      replyTo: 'hello@mindandmethodacademy.com',
      subject: 'Your 1-Hour Business Plan',
      html: buildHtml(userName, answers),
      text: buildPlainText(userName, answers)
    });

    if (error) {
      console.error('Resend returned error:', error);
      return { statusCode: 500, body: JSON.stringify(error) };
    }

    console.log(`Auto-reply sent to ${userEmail}, Resend ID: ${result && result.id}`);
    return { statusCode: 200, body: JSON.stringify({ sent: true, id: result && result.id }) };
  } catch (err) {
    console.error('Failed to send email:', err);
    return { statusCode: 500, body: err.message };
  }
};
