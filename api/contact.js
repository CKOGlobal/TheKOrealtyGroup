// POST /api/contact  — website forms -> GoHighLevel
//
// Env (Production + Preview):
//   GHL_API_KEY       Private Integration token
//   GHL_LOCATION_ID   sub-account location id
//   GHL_PIPELINE      optional, defaults to "KO Website Leads"
//   GHL_STAGE         optional, defaults to "New Lead"
//
// Contract: always returns JSON. { ok: true } on success. Never leaks the
// upstream response to the browser.

const BASE = 'https://services.leadconnectorhq.com';
const VERSION = '2021-07-28';

let pipelineCache = null; // survives warm invocations

function headers() {
  return {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    Version: VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function pick(body, keys) {
  for (const k of keys) {
    const v = body[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function splitName(full) {
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// "email or phone" single field — figure out which it is
function classifyContact(v) {
  if (!v) return {};
  if (v.includes('@')) return { email: v };
  const digits = v.replace(/\D/g, '');
  return digits.length >= 10 ? { phone: v } : {};
}

async function ghl(path, init) {
  const res = await fetch(BASE + path, { ...init, headers: headers() });
  let json = null;
  try { json = await res.json(); } catch { /* empty body is fine */ }
  return { ok: res.ok, status: res.status, json };
}

async function upsertContact(payload) {
  // Preferred path.
  const up = await ghl('/contacts/upsert', { method: 'POST', body: JSON.stringify(payload) });
  if (up.ok) return up.json?.contact?.id || up.json?.id || null;

  // Fall back to search-then-create/update if upsert isn't available on this
  // account, or the contact already exists as a duplicate.
  if (![404, 405, 400, 422].includes(up.status)) {
    throw new Error(`upsert failed ${up.status}`);
  }

  let existingId = null;
  if (payload.email) {
    const q = new URLSearchParams({ locationId: payload.locationId, query: payload.email });
    const found = await ghl(`/contacts/search/duplicate?${q}`, { method: 'GET' });
    existingId = found.json?.contact?.id || null;
  }

  if (existingId) {
    const { locationId, ...rest } = payload;
    const upd = await ghl(`/contacts/${existingId}`, { method: 'PUT', body: JSON.stringify(rest) });
    if (!upd.ok) throw new Error(`update failed ${upd.status}`);
    return existingId;
  }

  const created = await ghl('/contacts/', { method: 'POST', body: JSON.stringify(payload) });
  if (!created.ok) throw new Error(`create failed ${created.status}`);
  return created.json?.contact?.id || created.json?.id || null;
}

async function resolveStage(locationId) {
  if (pipelineCache) return pipelineCache;
  const wantPipeline = (process.env.GHL_PIPELINE || 'KO Website Leads').toLowerCase();
  const wantStage = (process.env.GHL_STAGE || 'New Lead').toLowerCase();

  const res = await ghl(`/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`, { method: 'GET' });
  if (!res.ok) return null;

  const pipelines = res.json?.pipelines || [];
  const pipeline =
    pipelines.find(p => (p.name || '').toLowerCase() === wantPipeline) || pipelines[0];
  if (!pipeline) return null;

  const stages = pipeline.stages || [];
  const stage = stages.find(s => (s.name || '').toLowerCase() === wantStage) || stages[0];
  if (!stage) return null;

  pipelineCache = { pipelineId: pipeline.id, stageId: stage.id };
  return pipelineCache;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});

  // Honeypot: bots fill hidden fields. Look successful so they don't retry.
  if (typeof body.website === 'string' && body.website.trim()) {
    return res.status(200).json({ ok: true });
  }

  if (!process.env.GHL_API_KEY || !process.env.GHL_LOCATION_ID) {
    console.error('contact: missing GHL_API_KEY or GHL_LOCATION_ID');
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }
  const locationId = process.env.GHL_LOCATION_ID;

  // ---- field mapping: accept whatever the form called things ----
  let firstName = pick(body, ['firstName', 'first_name', 'fname']);
  let lastName = pick(body, ['lastName', 'last_name', 'lname']);
  const fullName = pick(body, ['name', 'fullName', 'full_name']);
  if (!firstName && fullName) ({ firstName, lastName } = splitName(fullName));

  let email = pick(body, ['email', 'Email', 'emailAddress', 'email_address']);
  let phone = pick(body, ['phone', 'Phone', 'tel', 'telephone', 'phoneNumber']);

  // single "email or phone" input
  const combined = pick(body, ['contact', 'emailOrPhone']);
  if (combined) {
    const c = classifyContact(combined);
    if (c.email && !email) email = c.email;
    if (c.phone && !phone) phone = c.phone;
  }

  const message = pick(body, ['message', 'comments', 'notes', 'question']);
  const address = pick(body, ['address', 'propertyAddress', 'property_address']);
  const source = pick(body, ['source', 'form', 'guide']) || 'website';
  const timeline = pick(body, ['timeline', 'when']);
  const doctype = pick(body, ['doctype', 'documentType']);
  const titleco = pick(body, ['titleco', 'titleCompany']);
  const neighborhood = pick(body, ['neighborhood']);

  if (!email && !phone) {
    return res.status(400).json({ ok: false, error: 'missing_contact' });
  }

  const tags = ['website-lead'];
  if (source && source !== 'website') tags.push(`src:${source}`.slice(0, 60));

  const contactPayload = {
    locationId,
    firstName: firstName || 'Website',
    lastName: lastName || 'Lead',
    source: `thekorealtygroup.com${source !== 'website' ? ` / ${source}` : ''}`,
    tags,
  };
  if (email) contactPayload.email = email;
  if (phone) contactPayload.phone = phone;
  if (address) contactPayload.address1 = address;

  let contactId;
  try {
    contactId = await upsertContact(contactPayload);
  } catch (err) {
    console.error('contact: upsert failed —', err.message);
    return res.status(502).json({ ok: false, error: 'upstream' });
  }

  // ---- everything below is best-effort; the lead is already saved ----

  const detailLines = [
    address && `Property address: ${address}`,
    timeline && `Timeline: ${timeline}`,
    doctype && `Document type: ${doctype}`,
    titleco && `Title company: ${titleco}`,
    neighborhood && `Neighborhood: ${neighborhood}`,
    source && `Submitted from: ${source}`,
    message && `\n${message}`,
  ].filter(Boolean);

  if (contactId && detailLines.length) {
    try {
      const note = await ghl(`/contacts/${contactId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body: detailLines.join('\n'), userId: undefined }),
      });
      if (!note.ok) console.warn('contact: note skipped, status', note.status);
    } catch (err) {
      console.warn('contact: note skipped —', err.message);
    }
  }

  if (contactId) {
    try {
      const stage = await resolveStage(locationId);
      if (!stage) {
        console.warn('contact: pipeline not found, opportunity skipped');
      } else {
        const title = address
          ? `${address} — ${firstName || 'Website'} ${lastName || 'Lead'}`.trim()
          : `${firstName || 'Website'} ${lastName || 'Lead'}`.trim();
        const opp = await ghl('/opportunities/', {
          method: 'POST',
          body: JSON.stringify({
            pipelineId: stage.pipelineId,
            pipelineStageId: stage.stageId,
            locationId,
            contactId,
            name: title,
            status: 'open',
            source: source || 'website',
          }),
        });
        if (!opp.ok) {
          console.warn('contact: opportunity skipped, status', opp.status);
          if (opp.status === 404) pipelineCache = null; // stale cache, retry next time
        }
      }
    } catch (err) {
      console.warn('contact: opportunity skipped —', err.message);
    }
  }

  return res.status(200).json({ ok: true });
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
