#!/usr/bin/env node
// GPT-Live appointment test fixture for the Vapi docs.
//
// TEST DATA ONLY. This server keeps a fictional calendar in memory. Nothing it
// does books, changes, or cancels a real appointment, and all data is lost when
// the process stops. It exists so you can connect a GPT-Live assistant to a real
// tool handler and check what actually happened on each call. It is not a
// production scheduling service.
//
// Requirements: Node.js 22 or later. No dependencies.
//
// Run:
//   node appointment-server.mjs
//
// Optional environment variables:
//   PORT               Webhook port for Vapi tool calls (default 3000). Expose
//                      only this port through your HTTPS tunnel.
//   ADMIN_PORT         Local-only port for state and test controls (default 3001).
//                      Never expose this port through a tunnel.
//   FIXTURE_TOKEN      If set, every webhook request must include
//                      "Authorization: Bearer <FIXTURE_TOKEN>". Configure the same
//                      value as a Bearer Token credential in Vapi.
//   FIXTURE_TIME_ZONE  IANA time zone of the fictional business
//                      (default America/New_York).
//
// Webhook (tunnel this):  POST http://127.0.0.1:3000/vapi/tools
// Local checks (never tunnel):
//   GET  http://127.0.0.1:3001/health
//   GET  http://127.0.0.1:3001/state
//   POST http://127.0.0.1:3001/test/take-slot   {"slotId":"..."}
//   POST http://127.0.0.1:3001/test/fail-next   {"tool":"bookAppointment"}
//   POST http://127.0.0.1:3001/test/delay-next  {"tool":"lookupAvailability","seconds":8}
//   POST http://127.0.0.1:3001/test/reset

import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 3000);
const ADMIN_PORT = Number(process.env.ADMIN_PORT ?? 3001);
const TOKEN = process.env.FIXTURE_TOKEN ?? '';
const TIME_ZONE = process.env.FIXTURE_TIME_ZONE ?? 'America/New_York';
const CALENDAR_DAYS = 14;
const MAX_BODY_BYTES = 1024 * 1024;
const MAX_DELAY_SECONDS = 15;
const TOOL_NAMES = [
  'lookupAvailability',
  'bookAppointment',
  'cancelAppointment',
  'getServiceInfo',
];

try {
  new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE });
} catch {
  console.error(`FIXTURE_TIME_ZONE "${TIME_ZONE}" is not a valid IANA time zone.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fictional business (test data)
// ---------------------------------------------------------------------------

const BUSINESS = {
  name: 'Example Service Studio',
  timeZone: TIME_ZONE,
  locations: {
    downtown: { name: 'Downtown', address: '100 Example Street (fictional)' },
    riverside: { name: 'Riverside', address: '200 Sample Avenue (fictional)' },
  },
  services: {
    consultation: {
      name: 'Consultation',
      minutes: 30,
      bring: 'Nothing is required. Bring any questions you want to cover.',
    },
    'standard-visit': {
      name: 'Standard visit',
      minutes: 60,
      bring: 'Bring the reference number from any previous visit, if you have one.',
    },
  },
  policies: {
    arrival: 'Please arrive five minutes early.',
    changes:
      'Appointments can be changed or cancelled up to 24 hours ahead at no charge.',
    hours: 'Monday to Saturday, 9:00 to 17:00 local time. Closed Sunday.',
  },
};

const DAY_TIMES = ['09:00', '10:30', '13:00', '14:30', '16:00'];

// ---------------------------------------------------------------------------
// Calendar state
// ---------------------------------------------------------------------------

let slots = new Map(); // slotId -> slot
let bookings = new Map(); // bookingId -> booking
let calls = new Map(); // callId -> { offeredSlotIds: Set, bookingIds: Set }
let toolOutcomes = new Map(); // `${callId}:${toolCallId}` -> Promise of { result } or { error }
let toolLog = []; // recent tool calls, newest last
let testControls = { failNext: new Set(), delayNext: new Map() };

function todayInZone() {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(date, days) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function weekdayOf(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

// Own-property lookup, so names like "toString" never match a service, location, or tool.
function own(dictionary, key) {
  return typeof key === 'string' && Object.hasOwn(dictionary, key) ? dictionary[key] : undefined;
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
}

// A small deterministic hash, so some slots start out taken by "other customers".
function preTaken(slotId) {
  let hash = 0;
  for (const char of slotId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 3 === 0;
}

function buildCalendar() {
  slots = new Map();
  bookings = new Map();
  calls = new Map();
  toolOutcomes = new Map();
  toolLog = [];
  testControls = { failNext: new Set(), delayNext: new Map() };

  const today = todayInZone();
  for (let offset = 1; offset <= CALENDAR_DAYS; offset += 1) {
    const date = addDays(today, offset);
    if (weekdayOf(date) === 'Sunday') continue;
    for (const locationId of Object.keys(BUSINESS.locations)) {
      for (const time of DAY_TIMES) {
        const slotId = `${locationId}-${date}-${time.replace(':', '')}`;
        slots.set(slotId, {
          slotId,
          locationId,
          date,
          time,
          status: preTaken(slotId) ? 'taken' : 'open',
          bookingId: null,
        });
      }
    }
  }
  return { firstDate: addDays(today, 1), lastDate: addDays(today, CALENDAR_DAYS) };
}

let calendarWindow = buildCalendar();

function callStateFor(callId) {
  if (!calls.has(callId)) calls.set(callId, { offeredSlotIds: new Set(), bookingIds: new Set() });
  return calls.get(callId);
}

function bookingId() {
  return `TEST-${randomBytes(3).toString('hex').toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Tool implementations
//
// Each returns { result } or { error }. Both are flat strings, as Vapi requires.
// Results say what did NOT happen as well as what did, so the assistant has no
// reason to overstate an outcome.
// ---------------------------------------------------------------------------

function ok(payload) {
  return { result: JSON.stringify({ testData: true, ...payload }) };
}

function fail(message) {
  return { error: `${message} (Test fixture. No real appointment was changed.)` };
}

function lookupAvailability(args, callId) {
  const service = String(args.service ?? '').trim();
  const location = String(args.location ?? '').trim().toLowerCase();
  const date = String(args.date ?? '').trim();

  if (!own(BUSINESS.services, service)) {
    return fail(`Unknown service "${service}". Valid services: ${Object.keys(BUSINESS.services).join(', ')}.`);
  }
  if (!own(BUSINESS.locations, location)) {
    return fail(`Unknown location "${location}". Valid locations: ${Object.keys(BUSINESS.locations).join(', ')}.`);
  }
  if (!isValidDate(date)) {
    return fail(`Date "${date}" is not a valid YYYY-MM-DD date.`);
  }
  if (date < calendarWindow.firstDate || date > calendarWindow.lastDate) {
    return fail(
      `Today is ${todayInZone()} (${weekdayOf(todayInZone())}). The test calendar only covers ${calendarWindow.firstDate} to ${calendarWindow.lastDate}. Ask the caller for a date in that range.`,
    );
  }
  if (weekdayOf(date) === 'Sunday') {
    return ok({
      status: 'closed',
      date,
      weekday: 'Sunday',
      location: BUSINESS.locations[location].name,
      slots: [],
      note: 'Closed on Sundays. Nothing has been booked.',
    });
  }

  const open = [...slots.values()].filter(
    (slot) => slot.date === date && slot.locationId === location && slot.status === 'open',
  );
  const state = callStateFor(callId);
  for (const slot of open) state.offeredSlotIds.add(slot.slotId);

  return ok({
    status: open.length ? 'available' : 'none-available',
    date,
    weekday: weekdayOf(date),
    timeZone: TIME_ZONE,
    location: BUSINESS.locations[location].name,
    service: BUSINESS.services[service].name,
    slots: open.map((slot) => ({ slotId: slot.slotId, time: slot.time })),
    note: 'This lists every open time for that day and location. Availability only. Nothing has been booked or held.',
  });
}

function bookAppointment(args, callId) {
  const slotId = String(args.slotId ?? '').trim();
  const service = String(args.service ?? '').trim();
  const customerName = String(args.customerName ?? '').trim();
  const state = callStateFor(callId);

  if (!own(BUSINESS.services, service)) {
    return fail(`Unknown service "${service}". Nothing was booked.`);
  }
  if (!customerName) {
    return fail('A customer name is required. Nothing was booked.');
  }
  const slot = slots.get(slotId);
  if (!slot) {
    return fail(`Slot "${slotId}" does not exist. Use a slotId returned by lookupAvailability. Nothing was booked.`);
  }
  // Prerequisite the service can check: the slot came from a real lookup in this
  // call. It cannot check that the caller heard this time or agreed to it. The
  // conversation establishes that, and a production service may need its own
  // confirmation step.
  if (!state.offeredSlotIds.has(slotId)) {
    return fail('That slot was not returned by a lookup in this call. Look up availability first. Nothing was booked.');
  }

  // Duplicate request for a booking this call already made: return it, don't book twice.
  if (slot.status === 'booked' && state.bookingIds.has(slot.bookingId)) {
    const existing = bookings.get(slot.bookingId);
    return ok({
      status: 'already-booked',
      bookingId: existing.bookingId,
      date: existing.date,
      time: existing.time,
      timeZone: TIME_ZONE,
      location: existing.location,
      service: existing.service,
      customerName: existing.customerName,
      note: 'This call already booked this slot. No second booking was made.',
    });
  }

  const activeInCall = [...state.bookingIds]
    .map((id) => bookings.get(id))
    .find((booking) => booking && booking.status === 'booked');
  if (activeInCall) {
    return fail(
      `This call already booked ${activeInCall.date} at ${activeInCall.time} (booking ${activeInCall.bookingId}). To move it, confirm the new time is open and the caller agrees, then cancel this booking with cancelAppointment and book the new slot. Nothing new was booked.`,
    );
  }

  if (slot.status !== 'open') {
    return fail('That time is no longer available. Look up availability again. Nothing was booked.');
  }

  const booking = {
    bookingId: bookingId(),
    status: 'booked',
    slotId,
    date: slot.date,
    time: slot.time,
    location: BUSINESS.locations[slot.locationId].name,
    service: BUSINESS.services[service].name,
    customerName,
    callId,
    createdAt: new Date().toISOString(),
  };
  bookings.set(booking.bookingId, booking);
  slot.status = 'booked';
  slot.bookingId = booking.bookingId;
  state.bookingIds.add(booking.bookingId);

  return ok({
    status: 'booked',
    bookingId: booking.bookingId,
    date: booking.date,
    weekday: weekdayOf(booking.date),
    time: booking.time,
    timeZone: TIME_ZONE,
    location: booking.location,
    service: booking.service,
    customerName,
    note: 'Booked in the test calendar only. No real appointment exists.',
  });
}

function cancelAppointment(args, callId) {
  const id = String(args.bookingId ?? '').trim().toUpperCase();
  const state = callStateFor(callId);
  const booking = bookings.get(id);

  if (!booking || !state.bookingIds.has(id)) {
    return fail(`No booking "${id}" was made in this call. Nothing was cancelled.`);
  }
  if (booking.status === 'cancelled') {
    return ok({ status: 'already-cancelled', bookingId: id, note: 'This booking was already cancelled. Nothing else changed.' });
  }

  booking.status = 'cancelled';
  const slot = slots.get(booking.slotId);
  if (slot && slot.bookingId === id) {
    slot.status = 'open';
    slot.bookingId = null;
  }
  return ok({
    status: 'cancelled',
    bookingId: id,
    date: booking.date,
    time: booking.time,
    note: 'Cancelled in the test calendar. The time is open again.',
  });
}

function getServiceInfo() {
  const today = todayInZone();
  return ok({
    business: BUSINESS.name,
    today,
    todayWeekday: weekdayOf(today),
    bookableDates: `${calendarWindow.firstDate} to ${calendarWindow.lastDate}`,
    timeZone: TIME_ZONE,
    hours: BUSINESS.policies.hours,
    arrival: BUSINESS.policies.arrival,
    changes: BUSINESS.policies.changes,
    locations: Object.values(BUSINESS.locations),
    services: Object.entries(BUSINESS.services).map(([id, service]) => ({
      id,
      name: service.name,
      minutes: service.minutes,
      whatToBring: service.bring,
    })),
    note: 'Fictional business information for testing.',
  });
}

const TOOLS = { lookupAvailability, bookAppointment, cancelAppointment, getServiceInfo };

// These tools read or change per-call state, so they need a call ID.
const CALL_SCOPED_TOOLS = new Set(['lookupAvailability', 'bookAppointment', 'cancelAppointment']);

// ---------------------------------------------------------------------------
// Vapi webhook
// ---------------------------------------------------------------------------

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseArguments(raw) {
  if (isPlainObject(raw)) return raw;
  if (typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function execute(name, args, callId) {
  const tool = own(TOOLS, name);
  if (!tool) return fail(`Unknown tool "${name}".`);

  // Consume test controls before waiting, so a duplicate delivery can't reuse them.
  const delay = testControls.delayNext.get(name);
  testControls.delayNext.delete(name);
  const failNow = testControls.failNext.delete(name);

  if (delay) await sleep(delay * 1000);
  if (failNow) return fail('Test outage: the scheduling service did not respond');
  return tool(args, callId);
}

async function runToolCall(toolCall, callId) {
  const toolCallId = typeof toolCall?.id === 'string' && toolCall.id ? toolCall.id : null;
  const name = toolCall?.function?.name;
  const args = parseArguments(toolCall?.function?.arguments);

  if (!toolCallId) {
    log(name, args, callId, 'rejected: missing tool call ID');
    return { toolCallId: null, ...fail('Missing tool call ID. Nothing was run') };
  }
  if (CALL_SCOPED_TOOLS.has(name) && !callId) {
    log(name, args, callId, 'rejected: missing call ID');
    return { toolCallId, ...fail('Missing call ID. Nothing was run') };
  }

  // Duplicate delivery of the same tool call in the same call returns the original
  // outcome. The promise is stored before it settles, so concurrent duplicates
  // share one execution.
  const key = `${callId ?? 'no-call'}:${toolCallId}`;
  if (toolOutcomes.has(key)) {
    const outcome = await toolOutcomes.get(key);
    log(name, args, callId, 'duplicate delivery, returned original outcome');
    return { toolCallId, ...outcome };
  }

  const pending = execute(name, args, callId).catch((error) =>
    fail(`Unexpected fixture error: ${error.message}`),
  );
  toolOutcomes.set(key, pending);
  const outcome = await pending;
  log(name, args, callId, outcome.error ? `error: ${outcome.error}` : outcome.result);
  return { toolCallId, ...outcome };
}

function log(name, args, callId, outcome) {
  const entry = { at: new Date().toISOString(), callId, tool: name, arguments: args, outcome };
  toolLog.push(entry);
  if (toolLog.length > 100) toolLog.shift();
  console.log(`[tool] ${name} ${JSON.stringify(args)}\n       -> ${outcome}`);
}

function authorized(req) {
  if (!TOKEN) return true;
  const expected = Buffer.from(`Bearer ${TOKEN}`);
  const received = Buffer.from(String(req.headers.authorization ?? ''));
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Body too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function send(res, status, body) {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(text);
}

const webhook = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return send(res, 200, { ok: true, service: 'gpt-live appointment test fixture' });
    }
    if (req.method !== 'POST' || req.url !== '/vapi/tools') {
      return send(res, 404, { error: 'Not found' });
    }
    if (!authorized(req)) {
      return send(res, 401, { error: 'Unauthorized' });
    }

    const body = await readJson(req);
    const message = isPlainObject(body) && isPlainObject(body.message) ? body.message : {};
    if (message.type !== 'tool-calls' || !Array.isArray(message.toolCallList)) {
      // Other server messages are acknowledged and ignored.
      return send(res, 200, {});
    }

    const callId = typeof message.call?.id === 'string' && message.call.id ? message.call.id : null;
    const results = [];
    for (const toolCall of message.toolCallList) {
      results.push(await runToolCall(toolCall, callId));
    }
    // Always HTTP 200. Failures are reported per call with "error".
    return send(res, 200, { results });
  } catch (error) {
    return send(res, error.status ?? 500, { error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Local-only state and test controls
// ---------------------------------------------------------------------------

const admin = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      return send(res, 200, { ok: true, calendar: calendarWindow, timeZone: TIME_ZONE });
    }
    if (req.method === 'GET' && req.url === '/state') {
      return send(res, 200, {
        testData: true,
        calendar: calendarWindow,
        timeZone: TIME_ZONE,
        bookings: [...bookings.values()],
        pendingTestControls: {
          failNext: [...testControls.failNext],
          delayNext: Object.fromEntries(testControls.delayNext),
        },
        recentToolCalls: toolLog,
      });
    }
    if (req.method !== 'POST') return send(res, 404, { error: 'Not found' });

    const raw = await readJson(req);
    const body = isPlainObject(raw) ? raw : {};
    if (req.url === '/test/reset') {
      calendarWindow = buildCalendar();
      return send(res, 200, { ok: true, calendar: calendarWindow });
    }
    if (req.url === '/test/take-slot') {
      const slot = slots.get(String(body.slotId ?? ''));
      if (!slot) return send(res, 404, { error: 'Unknown slotId' });
      if (slot.status === 'booked') return send(res, 409, { error: 'Slot is booked by a test call' });
      slot.status = 'taken';
      return send(res, 200, { ok: true, slot });
    }
    if (req.url === '/test/fail-next') {
      if (!TOOL_NAMES.includes(body.tool)) return send(res, 400, { error: `tool must be one of ${TOOL_NAMES.join(', ')}` });
      testControls.failNext.add(body.tool);
      return send(res, 200, { ok: true, failNext: body.tool });
    }
    if (req.url === '/test/delay-next') {
      const seconds = Number(body.seconds);
      if (!TOOL_NAMES.includes(body.tool)) return send(res, 400, { error: `tool must be one of ${TOOL_NAMES.join(', ')}` });
      if (!(seconds > 0 && seconds <= MAX_DELAY_SECONDS)) {
        return send(res, 400, { error: `seconds must be between 1 and ${MAX_DELAY_SECONDS}` });
      }
      testControls.delayNext.set(body.tool, seconds);
      return send(res, 200, { ok: true, delayNext: { tool: body.tool, seconds } });
    }
    return send(res, 404, { error: 'Not found' });
  } catch (error) {
    return send(res, error.status ?? 500, { error: error.message });
  }
});

// Both listeners bind to the loopback interface. Tunnel only PORT.
webhook.listen(PORT, '127.0.0.1', () => {
  console.log(`Webhook:     http://127.0.0.1:${PORT}/vapi/tools  (tunnel this port)`);
});
admin.listen(ADMIN_PORT, '127.0.0.1', () => {
  console.log(`Local state: http://127.0.0.1:${ADMIN_PORT}/state  (do not tunnel)`);
  console.log(`Test calendar ${calendarWindow.firstDate} to ${calendarWindow.lastDate}, ${TIME_ZONE}. Test data only.`);
  if (!TOKEN) {
    console.log('FIXTURE_TOKEN is not set, so the webhook accepts unauthenticated requests. Set it before sharing the tunnel URL.');
  }
});
