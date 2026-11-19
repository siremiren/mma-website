// Netlify verified-form event. Netlify Forms is the durable plan/consent record.
// Email wording is provisional. Provider acceptance is not inbox delivery.
// Required: RESEND_API_KEY, BUSINESS_PLAN_FROM (verified Resend identity),
// BUSINESS_PLAN_ACADEMY_EMAIL (monitored inbox). No marketing list is subscribed.
const { Resend } = require('resend');
const QUESTIONS = [
  "What problem do you solve?",
  "Who has this problem?",
  "What is your solution — and how do you deliver it?",
  "Why are you the right person to deliver this?",
  "What will you charge — and why is that fair value?",
  "How will you find your first five customers — or your next five?",
  "What does success look like in 90 days?"
];
const CONSENT_VERSION = "business-plan-marketing-2026-11-18";
const CONSENT_TEXT = "I'd like to receive emails from Mind and Method Academy with practical business advice, information about training and coaching, and updates on programmes such as Business Builder.";

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


function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function buildPlainText(name, answers) {
  return [
    'Your 1-Hour Business Plan',
    'Prepared by: ' + name,
    '',
    ...QUESTIONS.flatMap((question, i) => [(i + 1) + '. ' + question, answers[i] || 'Not answered yet.', '']),
    'Mind & Method Academy',
    'mindandmethodacademy.com'
  ].join('\n');
}
function buildHtml(name, answers) {
  return '<!doctype html><html lang="en"><meta charset="utf-8"><body style="font-family:Arial,sans-serif;color:#1B263B">' +
    '<h1>Your 1-Hour Business Plan</h1><p>Prepared by: ' + escapeHtml(name) + '</p>' +
    QUESTIONS.map((question, i) => '<h2 style="font-size:18px">' + (i + 1) + '. ' + escapeHtml(question) +
      '</h2><div style="white-space:pre-wrap;overflow-wrap:anywhere">' + escapeHtml(answers[i] || 'Not answered yet.') + '</div>').join('') +
    '<p>Mind &amp; Method Academy<br>mindandmethodacademy.com</p></body></html>';
}
// Netlify and Resend operational IDs only; never log arbitrary event/provider text.
function safeLogId(value) {
  return typeof value === 'string' && /^(?:[a-f0-9]{24}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.test(value) ? value : 'unavailable';
}
exports.handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== 'POST') return {statusCode:405, body:'Method not allowed'};
  let submission;
  try { submission = JSON.parse(event.body || '').payload; } catch (_) {
    return {statusCode:400, body:'Invalid submission'};
  }
  if (!submission || submission.form_name !== 'business-plan') return {statusCode:200, body:'Ignored'};
  const data = submission.data || {};
  if (data['bot-field']) return {statusCode:200, body:'Ignored'};
  // Stable Netlify identity and server timestamp, never client-provided receipt time.
  if (!submission.id || !submission.created_at || !Number.isFinite(Date.parse(submission.created_at))) {
    return {statusCode:400, body:'Missing verified receipt metadata'};
  }
  const email = String(data.email || '').trim();
  const name = String(data.name || '').trim();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {statusCode:400, body:'Invalid participant'};
  let answers;
  if (data.schema_version === '2') {
    answers = QUESTIONS.map((_, i) => data['answer_' + (i + 1)] === undefined ? '' : data['answer_' + (i + 1)]);
    if (!answers.every(answer => typeof answer === 'string')) return {statusCode:400, body:'Missing answers'};
    if (!['true','false'].includes(data.marketing_opt_in) || data.consent_version !== CONSENT_VERSION || data.consent_text !== CONSENT_TEXT || data.source !== '/businessplan/') {
      return {statusCode:400, body:'Invalid consent record'};
    }
  } else {
    answers = parsePlan(data.plan || '');
  }
  const from = process.env.BUSINESS_PLAN_FROM;
  const academy = process.env.BUSINESS_PLAN_ACADEMY_EMAIL;
  if (!process.env.RESEND_API_KEY || !from || !academy || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(academy)) {
    console.error('business-plan configuration missing', {submissionReference:safeLogId(submission.id)});
    return {statusCode:503, body:'Delivery configuration unavailable'};
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const reference = submission.id;
  const context = [
    'Participant email: ' + email,
    'Netlify received at: ' + submission.created_at,
    'Submission reference: ' + reference,
    'Marketing opt-in: ' + (data.schema_version === '2' ? data.marketing_opt_in : 'not recorded'),
    'Consent version: ' + (data.schema_version === '2' ? CONSENT_VERSION : 'legacy'),
    'Consent wording: ' + (data.schema_version === '2' ? CONSENT_TEXT : 'not recorded'),
    'Source: /businessplan/',
    'No marketing subscription has been created.'
  ].join('\n');
  const planHtml = buildHtml(name, answers);
  const planText = buildPlainText(name, answers);
  // Each role gets its own attempts and stable key. Provider acceptance is not delivery.
  // The form remains in Netlify on failure; do not assume event responses trigger replay.
  const messages = [
    {role:'academy', to:academy, html:planHtml.replace('</body>', '<pre style="white-space:pre-wrap">' + escapeHtml(context) + '</pre></body>'), text:planText + '\n\n' + context, subject:'Business Plan Review — completed plan'},
    {role:'participant', to:email, html:planHtml, text:planText, subject:'Your 1-Hour Business Plan'}
  ];
  const outcomes = {};
  for (const message of messages) {
    let accepted = false;
    let attempts = 0;
    for (let attempt = 0; attempt < 3 && !accepted; attempt++) {
      attempts = attempt + 1;
      let errorClass = 'sdk_exception';
      try {
        const result = await resend.emails.send({
          from, to:[message.to], replyTo:'info@mindandmethodacademy.com',
          subject:message.subject, html:message.html, text:message.text
        }, {idempotencyKey:'business-plan/' + reference + '/' + message.role});
        if (!result || result.error || !result.data || !result.data.id) {
          errorClass = result && result.error ? 'provider_rejected' : 'invalid_provider_response';
          throw new Error('Provider did not confirm acceptance');
        }
        console.info('business-plan delivery attempt', {submissionReference:safeLogId(reference), role:message.role, attempt:attempts, outcome:'accepted', messageId:safeLogId(result.data.id)});
        accepted = true;
      } catch (_) {
        console.error('business-plan delivery attempt', {submissionReference:safeLogId(reference), role:message.role, attempt:attempts, outcome:'failed', errorClass});
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
          continue;
        }
      }
    }
    outcomes[message.role] = {accepted, attempts};
  }
  const providerAccepted = outcomes.academy.accepted && outcomes.participant.accepted;
  const partialFailure = !providerAccepted && (outcomes.academy.accepted || outcomes.participant.accepted);
  return {statusCode:providerAccepted ? 200 : 502, body:JSON.stringify({providerAccepted, partialFailure, outcomes})};
};
