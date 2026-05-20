import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const DEFAULT_SITE_SETTINGS = {
  businessName: "ACE MiDAS Training Ltd",
  contactEmail: "info@ace-midas-training.co.uk",
  phone: "Available upon request",
  address: "128 City Road, London, EC1V 2NX",
  companyNumber: "16005284",
  registeredJurisdiction: "England and Wales",
  contactDisplayText: "We would love to hear from you",
  stripeLink: import.meta.env?.VITE_STRIPE_PAYMENT_LINK || "https://buy.stripe.com/test_6oUeVd8KN1r57bLcgQdIA08",
  complianceAppBase: "https://journeytracker.manus.space/login?token=",
  privacyReview: "April 2026"
};
const SUBSCRIBE_CHECKOUT_API_URL = "/api/create-subscribe-checkout-session";
const COURSE_CHECKOUT_API_URL = "/api/create-checkout-session";
const SEND_LOGIN_CODE_API_URL = "/api/send-login-code";
const VERIFY_LOGIN_CODE_API_URL = "/api/verify-login-code";
const ADMIN_API_URL = "/api/admin";
const BOOKING_CONFIRMATION_API = "/api/send-booking-confirmation";
const USE_STRIPE_TEST_LINK = false;
const BACK_OFFICE_TAB_STORAGE_KEY = "ace_back_office_active_tab";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const CONTACT_FORM_FUNCTION_URL = import.meta.env.VITE_CONTACT_ENDPOINT;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const DEFAULT_AGENT_IDENTITIES = {
  ava: { name: "Ava", title: "Compliance Agent", tone: "Clear, concise, operational and risk-focused", signature: "Ava\nCompliance Agent\nACE MiDAS Training", avatar: "A" },
  mia: { name: "Mia", title: "Outreach Coordinator", tone: "Helpful, clear and professional", signature: "Mia\nOutreach Coordinator\nACE MiDAS Training", avatar: "M" },
  theo: { name: "Theo", title: "Training Bookings & Sales Coordinator", tone: "Enthusiastic, professional, helpful, confident, business-minded and non-pushy", signature: "Theo\nTraining Bookings & Sales Coordinator\nACE MiDAS Training", avatar: "T" },
  nia: { name: "Nia", title: "Content & Engagement", tone: "Warm, practical and brand-aware", signature: "Nia\nContent & Engagement\nACE MiDAS Training", avatar: "N" },
  ellis: { name: "Ellis", title: "Inbox Management", tone: "Concise, organised and selective", signature: "Ellis\nInbox Management\nACE MiDAS Training", avatar: "E" },
  rory: { name: "Rory", title: "Research & Partnerships", tone: "Curious, careful and public-data only", signature: "Rory\nResearch & Partnerships\nACE MiDAS Training", avatar: "R" }
};

const THEO_TEST_PROMPTS = [
  {
    label: "Booking process",
    subject: "How do I book MiDAS training?",
    message: "Hello, how do we book MiDAS Standard training and what information do you need from us?"
  },
  {
    label: "Group discount",
    subject: "Group booking for staff",
    message: "We have multiple staff who need MiDAS Standard refresher training. How do group discounts work?"
  },
  {
    label: "Pricing estimate",
    subject: "Estimate for 6 people",
    message: "How much would MiDAS Accessible be for 6 staff at our site in Birmingham?"
  },
  {
    label: "Date availability",
    subject: "Can you confirm a date?",
    message: "Can you confirm if you are available next Monday and book us in for PATS Standard?"
  },
  {
    label: "Payment link",
    subject: "Payment link request",
    message: "Please send me a Stripe payment link so I can pay for our booking today."
  }
];

const NIA_PLATFORM_OPTIONS = ["LinkedIn", "Facebook", "Instagram", "TikTok/Reels", "Short video", "Carousel"];
const NIA_CONTENT_TYPE_OPTIONS = ["Awareness post", "Promotional post", "Compliance reminder post", "Website traffic post", "CTA-focused post", "TikTok/Reels script", "Short video script", "Carousel post", "Weekly content plan"];
const NIA_TOPIC_OPTIONS = ["PATS training", "MiDAS training", "First Aid training", "refresher training", "training expiry awareness", "certificate record keeping", "compliance support", "group training", "schools", "councils", "SEND transport", "passenger assistants", "minibus drivers", "charities", "community transport providers", "training managers"];
const NIA_AUDIENCE_OPTIONS = ["schools", "academy trusts", "councils", "SEND transport providers", "charities", "care providers", "community transport providers", "training managers", "passenger assistants", "minibus drivers"];
const RORY_SEARCH_THEME_OPTIONS = ["First Aid training prospects", "PATS training prospects", "MiDAS training prospects", "refresher training prospects", "schools/trusts", "charities/community organisations", "care providers", "hospitality/businesses"];
const RORY_SERVICE_OPTIONS = ["First Aid", "PATS", "MiDAS", "Refresher Training", "Compliance Tracking Support", "Mixed Opportunity"];

async function safeReadJson(response, fallbackMessage = "Server error. Please try again.") {
  const text = await response.text();
  if (!text) return { error: fallbackMessage };
  try {
    return JSON.parse(text);
  } catch {
    return { error: fallbackMessage };
  }
}

async function callAdminAction(action, payload = {}) {
  const response = await fetch(ADMIN_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload })
  });
  const text = await response.text();
  let result = {};
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { error: "Server error. Please try again." };
  }
  return { response, result };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeText(value, fallback = "Not logged") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

function safeErrorText(value, fallback = "Something went wrong.") {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message || fallback;
  if (typeof value === "object") {
    if (typeof value.message === "string") return value.message;
    if (typeof value.error === "string") return value.error;
    if (typeof value.detail === "string") return value.detail;
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return String(value);
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normaliseImportHeader(value) {
  const key = String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const aliases = {
    organisation: "organisation_name",
    organization: "organisation_name",
    organisation: "organisation_name",
    company: "organisation_name",
    company_name: "organisation_name",
    business: "organisation_name",
    business_name: "organisation_name",
    name: "organisation_name",
    url: "website",
    site: "website",
    web: "website",
    email: "contact_email",
    generic_email: "contact_email",
    public_email: "contact_email",
    contact: "contact_email",
    contact_email_address: "contact_email",
    telephone: "phone",
    contact_number: "phone",
    decision_maker: "decision_maker_name",
    decision_maker_contact: "decision_maker_name",
    training_need: "likely_training_need",
    need: "likely_training_need",
    likely_need: "likely_training_need",
    service: "recommended_service",
    recommended_training: "recommended_service",
    recommended_offer: "recommended_service",
    source: "source_url",
    source_link: "source_url",
    source_url_link: "source_url",
    town_region: "location",
    town_or_region: "location",
    town: "location",
    prospect_reason: "notes",
    reason: "relevance_reason",
    relevance: "relevance_reason",
    why_relevant: "relevance_reason",
    brief: "outreach_brief",
    mia_brief: "outreach_brief",
    outreach_angle: "outreach_brief"
  };
  return aliases[key] || key;
}

function parseAiResearchBlock(block) {
  const lines = String(block || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const row = {};
  const notes = [];
  lines.forEach((line, index) => {
    const cleaned = line.replace(/^[-*•\d.)\s]+/, "").trim();
    const match = cleaned.match(/^([A-Za-z][A-Za-z\s/_-]{1,40})\s*[:\-]\s*(.+)$/);
    if (match) {
      const key = normaliseImportHeader(match[1]);
      row[key] = match[2].trim();
      return;
    }
    const url = cleaned.match(/https?:\/\/[^\s)]+/i)?.[0];
    const email = cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
    if (url && !row.website) row.website = url;
    if (email && !row.contact_email) row.contact_email = email;
    if (index === 0 && !row.organisation_name && !url && !email && cleaned.length <= 90) row.organisation_name = cleaned.replace(/^#+\s*/, "");
    notes.push(cleaned);
  });
  if (!row.source_url && row.website) row.source_url = row.website;
  if (!row.notes) row.notes = notes.join(" ").slice(0, 1200);
  return row.organisation_name || row.website || row.contact_email || row.source_url ? row : null;
}

function parseAiResearchReport(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  const blocks = text
    .replace(/\r/g, "")
    .split(/\n(?=(?:\d+[.)]\s+|#{1,4}\s+|[-*•]\s+(?:Organisation|Organization|Company|Business|Name)\s*:))/i)
    .flatMap((chunk) => chunk.split(/\n{2,}(?=(?:Organisation|Organization|Company|Business|Name)\s*:)/i))
    .map((block) => block.trim())
    .filter((block) => block.length > 20);
  const parsed = blocks.map(parseAiResearchBlock).filter(Boolean);
  if (parsed.length) return parsed;
  return parseAiResearchBlock(text) ? [parseAiResearchBlock(text)] : [];
}

function rowsToProspects(rows) {
  const table = asArray(rows).filter((row) => Array.isArray(row) && row.some((cell) => String(cell || "").trim()));
  if (!table.length) return [];
  const headerIndex = table.findIndex((row) => {
    const normalised = row.map(normaliseImportHeader);
    return normalised.includes("organisation_name") && (normalised.includes("website") || normalised.includes("contact_email") || normalised.includes("notes"));
  });
  if (headerIndex < 0) return [];
  const headers = table[headerIndex].map(normaliseImportHeader);
  return table.slice(headerIndex + 1).map((row) => {
    const record = headers.reduce((item, header, index) => {
      if (!header || header === "#") return item;
      return { ...item, [header]: String(row[index] || "").trim() };
    }, {});
    if (record.notes && !record.relevance_reason) record.relevance_reason = record.notes;
    if (record.website && !record.source_url) record.source_url = record.website;
    if (!record.recommended_service) record.recommended_service = "First Aid";
    return record;
  }).filter((row) => row.organisation_name && (row.website || row.source_url || row.contact_email));
}

function parseWorkbookProspects(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  return workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
    return rowsToProspects(rows).map((prospect) => ({ ...prospect, notes: prospect.notes ? `${prospect.notes} Source sheet: ${sheetName}.` : `Source sheet: ${sheetName}.` }));
  });
}

function parseProspectImportText(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.prospects)) return parsed.prospects;
    if (Array.isArray(parsed.value?.prospects)) return parsed.value.prospects;
  } catch {
    // Fall through to CSV parsing.
  }
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 2 && lines[0].includes(",")) {
    const headers = parseCsvLine(lines[0]).map(normaliseImportHeader);
    const rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      return headers.reduce((row, header, index) => ({ ...row, [header]: values[index] || "" }), {});
    }).filter((row) => row.organisation_name || row.name || row.website || row.source_url);
    if (rows.length) return rows;
  }
  return parseAiResearchReport(raw);
}

function SectionCrashPanel({ title, error }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
      <h2 className="text-xl font-black">{title || "Section"} could not load</h2>
      <p className="mt-2 text-sm font-semibold">This panel hit a rendering problem, but the rest of the Back Office is still available.</p>
      <p className="mt-2 break-words rounded-xl bg-white p-3 text-xs font-bold">{safeText(error?.message || error, "Unknown render error")}</p>
    </div>
  );
}

class SafeSectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || "This section could not be displayed." };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`${this.props.title || "Back Office section"} render error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
          <h2 className="text-xl font-black">{this.props.title || "Section"} could not load</h2>
          <p className="mt-2 text-sm font-semibold">This panel hit a rendering problem, but the rest of the site is still available.</p>
          <p className="mt-2 break-words rounded-xl bg-white p-3 text-xs font-bold">{this.state.errorMessage}</p>
          <button type="button" onClick={() => this.setState({ hasError: false, errorMessage: "" })} className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white">Try Again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log("SUPABASE_URL:", SUPABASE_URL ? "loaded" : "missing");
console.log("SUPABASE_KEY:", SUPABASE_KEY ? "loaded" : "missing");

const images = {
  logoHorizontal: "/images/logohorizontal.jpg",
  logoRound: "/images/logoround.png",
  minibusHero: "/images/headerpica.jpg",
  driverSeat: "/images/driversseat.jpg",
  vehicleLineup: "/images/headerpicb.jpg",
  firstAid: "/images/firstaid.png",
  interior: "/images/insidea.jpg",
  handshake: "/images/handshake.png"
};

const DEFAULT_MEDIA_SETTINGS = {
  homepageHero: { label: "Homepage hero image", imageUrl: images.vehicleLineup, altText: "Passenger transport fleet", x: 50, y: 50, zoom: 1 },
  midas_standard: { label: "MiDAS Standard", imageUrl: images.driverSeat, altText: "MiDAS Standard training", x: 50, y: 50, zoom: 1 },
  midas_accessible: { label: "MiDAS Accessible", imageUrl: "/images/accessible.png", altText: "MiDAS Accessible training", x: 50, y: 50, zoom: 1 },
  pats_standard: { label: "PATS Standard", imageUrl: "/images/pats.png", altText: "PATS Standard training", x: 50, y: 50, zoom: 1 },
  pats_accessible: { label: "PATS Accessible", imageUrl: images.interior, altText: "PATS Accessible training", x: 50, y: 50, zoom: 1 },
  children_transport_first_aid: { label: "Children's Transport First Aid", imageUrl: images.firstAid, altText: "Children's Transport First Aid training", x: 50, y: 50, zoom: 1 },
  first_aid_at_work: { label: "First Aid at Work", imageUrl: "/images/faw.png", altText: "First Aid at Work training", x: 50, y: 50, zoom: 1 },
  complianceCard: { label: "Compliance card image", imageUrl: images.interior, altText: "Compliance tracking support", x: 50, y: 50, zoom: 1 },
  blogDefault: { label: "Blog default image", imageUrl: images.minibusHero, altText: "ACE MiDAS Training blog", x: 50, y: 50, zoom: 1 },
  reviewDefault: { label: "Review/default image", imageUrl: images.handshake, altText: "ACE MiDAS Training review", x: 50, y: 50, zoom: 1 }
};

const MEDIA_MANAGER_SLOT_ORDER = [
  "homepageHero",
  "midas_standard",
  "midas_accessible",
  "pats_standard",
  "pats_accessible",
  "children_transport_first_aid",
  "first_aid_at_work",
  "complianceCard",
  "blogDefault",
  "reviewDefault"
];

function getMediaSlot(mediaSettings, slot) {
  return { ...DEFAULT_MEDIA_SETTINGS[slot], ...(mediaSettings?.[slot] || {}) };
}

function mediaImageProps(mediaSettings, slot) {
  const media = getMediaSlot(mediaSettings, slot);
  return {
    src: media.imageUrl || DEFAULT_MEDIA_SETTINGS[slot].imageUrl,
    alt: media.altText || DEFAULT_MEDIA_SETTINGS[slot].altText,
    style: {
      objectPosition: `${media.x ?? 50}% ${media.y ?? 50}%`,
      transform: `scale(${media.zoom ?? 1})`,
      transformOrigin: `${media.x ?? 50}% ${media.y ?? 50}%`
    }
  };
}

function mapMediaRow(row) {
  return {
    imageUrl: row.image_url || "",
    altText: row.alt_text || "",
    x: Number(row.object_position_x ?? 50),
    y: Number(row.object_position_y ?? 50),
    zoom: Number(row.zoom ?? 1)
  };
}

function generateAdminReference(length = 18) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%&*?";
  const all = `${upper}${lower}${numbers}${symbols}`;
  const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];
  const required = [pick(upper), pick(lower), pick(numbers), pick(symbols)];
  const remaining = Array.from({ length: Math.max(10, length - required.length) }, () => pick(all));
  return [...required, ...remaining].sort(() => Math.random() - 0.5).join("");
}

const trainingCourses = [
  { title: "MiDAS Standard", price: "£165", note: "Includes £40 CTA learner-pass charge", image: images.driverSeat, mediaSlot: "midas_standard" },
  { title: "MiDAS Accessible", price: "£210", note: "Includes £40 CTA learner-pass charge", image: images.driverSeat, mediaSlot: "midas_accessible" },
  { title: "PATS Standard", price: "£125", note: "Includes £30 CTA learner-pass charge", image: images.interior, mediaSlot: "pats_standard" },
  { title: "PATS Accessible", price: "£155-£185", note: "Attendance or proficiency routes", image: images.interior, mediaSlot: "pats_accessible" },
  { title: "First Aid at Work", price: "£205-£225", note: "Blended or 3-day classroom options", image: images.firstAid, mediaSlot: "first_aid_at_work" },
  { title: "Children's Transport First Aid", price: "£95-£135", note: "Optional epilepsy medication module", image: images.firstAid, mediaSlot: "children_transport_first_aid" }
];

const features = ["Journey reporting", "Medication logs", "Attendance tracking", "Wheelchair checks", "Incident records", "Audit-ready evidence"];
const complianceFeatureCards = [
  { title: "Journey reporting", subtitle: "Clear route and journey evidence" },
  { title: "Medication logs", subtitle: "Track doses, missed items and actions" },
  { title: "Attendance tracking", subtitle: "Record passengers with practical checks" },
  { title: "Wheelchair checks", subtitle: "Evidence safety checks before travel" },
  { title: "Incident records", subtitle: "Capture issues and escalation notes" },
  { title: "Audit-ready evidence", subtitle: "Keep records structured and exportable" }
];
const stats = [["MiDAS", "Driver training"], ["PATS", "Passenger assistant training"], ["CTFA", "Children's transport first aid"], ["Compliance", "Digital tracking support"]];
const initialPosts = [
  { tag: "Compliance", title: "Why transport compliance needs more than paper records", text: "A practical look at why daily evidence matters for SEND transport providers.", status: "Published" },
  { tag: "Training", title: "MiDAS, PATS and digital compliance", text: "How training and digital records work together to protect operators and passengers.", status: "Draft" }
];
const initialReviews = [
  { rating: "★★★★★", name: "Transport Manager", org: "SEND Transport Provider", text: "The system gives us a clearer way to evidence what happens on each journey.", status: "Published" },
  { rating: "★★★★★", name: "School Operations Lead", org: "Academy Trust", text: "The training and compliance approach feels practical, organised and relevant.", status: "Published" }
];

const initialOnboarding = [];

const initialMembers = [];

const initialActivity = [
  "Back Office opened",
  "Supabase tables created",
  "Privacy Policy added",
  "Member dashboard created"
];

function addMonthsToDate(dateValue, months) {
  if (!dateValue || !Number.isFinite(Number(months))) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + Number(months));
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value) {
  if (!value) return "";
  const text = String(value);
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function parseDisplayDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const ukDate = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukDate) {
    const [, day, month, year] = ukDate;
    const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const date = new Date(`${iso}T00:00:00`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso) return iso;
  }
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) return text;
  return "";
}

function formatDisplayDateTime(value) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return formatDisplayDate(value);
  return `${formatDisplayDate(value)} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

function getTrainingStatus(expiryDate) {
  if (!expiryDate) return "valid";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(`${expiryDate}T00:00:00`);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  if (daysUntilExpiry < 0) return "expired";
  if (daysUntilExpiry <= 30) return "expiring";
  return "valid";
}

function normaliseStatus(status) {
  return String(status || "valid").toLowerCase();
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatExportLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function htmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function fileSafeName(value) {
  return String(value || "all-organisations").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "all-organisations";
}

function runSelfTests() {
  console.assert(trainingCourses.length === 6, "Expected six training courses");
  console.assert(trainingCourses.some((course) => course.title === "Children's Transport First Aid"), "CTFA course should exist");
  console.assert(images.logoRound.startsWith("/images/"), "Images should load from public/images");
  console.assert(typeof SUPABASE_URL === "string", "Supabase URL should be a string");
}
runSelfTests();

function Header({ page, setPage, openBackOffice }) {
  const nav = ["Home", "Training", "Compliance", "Reviews", "Blog", "Contact"];
  const [menuOpen, setMenuOpen] = useState(false);
  function goToPage(nextPage) {
    setPage(nextPage);
    setMenuOpen(false);
  }
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 md:py-4">
        <button type="button" onClick={() => goToPage("Home")} className="flex min-w-0 items-center gap-2 text-left sm:gap-3">
          <img
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openBackOffice();
            }}
            src={images.logoRound}
            alt="ACE MiDAS Training logo"
            className="h-10 w-10 shrink-0 rounded-full object-contain sm:h-12 sm:w-12"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight text-slate-950 sm:text-lg">ACE MiDAS Training</p>
            <p className="hidden text-xs text-slate-500 sm:block">Training • Compliance • Passenger Transport</p>
          </div>
        </button>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {nav.map((item) => (
            <button key={item} type="button" onClick={() => goToPage(item)} className={page === item ? "text-emerald-600" : "hover:text-emerald-600"}>{item}</button>
          ))}
        </nav>
        <div className="hidden md:block"><button type="button" onClick={() => goToPage("Login")} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm">Member Login</button></div>
        <button type="button" onClick={() => setMenuOpen((current) => !current)} className="rounded-xl border border-slate-200 px-3 py-2 text-xl font-black text-slate-900 md:hidden" aria-label="Open menu">☰</button>
      </div>
      {menuOpen ? <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"><div className="grid gap-2">{nav.map((item) => <button key={item} type="button" onClick={() => goToPage(item)} className={`min-w-max rounded-xl px-4 py-3 text-left text-sm font-bold ${page === item ? "bg-emerald-50 text-emerald-700" : "text-slate-700"}`}>{item}</button>)}<button type="button" onClick={() => goToPage("Login")} className="rounded-xl bg-emerald-600 px-4 py-3 text-left text-sm font-black text-white">Member Login</button></div></div> : null}
    </header>
  );
}
function HomePage({ setPage, mediaSettings }) {
  const cards = [
    { title: "MiDAS Training", text: "Driver awareness training for minibus and passenger transport operations.", slot: "midas_standard" },
    { title: "PATS Training", text: "Passenger assistant training for staff supporting children and vulnerable passengers.", slot: "pats_standard" },
    { title: "First Aid & CTFA", text: "First Aid at Work and Children's Transport First Aid with practical scenarios.", slot: "first_aid_at_work" }
  ];
  return (
    <main className="overflow-hidden">
      <section className="relative overflow-hidden bg-slate-950 text-white md:min-h-[88vh]">
        <img {...mediaImageProps(mediaSettings, "homepageHero")} className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/30" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-400" />MiDAS • PATS • First Aid • Compliance Hub</div>
            <h1 className="mt-7 max-w-5xl text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">Safer passenger transport starts with better training and better evidence.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg md:text-xl md:leading-8">Practical transport-focused training for schools, councils and operators - supported by a digital compliance hub for journey reporting, medication logs, attendance, wheelchair checks and incident evidence.</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => setPage("Training")} className="w-full rounded-2xl bg-emerald-400 px-6 py-4 text-base font-black sm:w-auto sm:px-8 sm:text-lg text-slate-950 shadow-xl transition hover:-translate-y-1">Book Training</button>
              <button type="button" onClick={() => setPage("Compliance")} className="w-full rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-base font-bold sm:w-auto sm:px-8 sm:text-lg text-white shadow-xl backdrop-blur transition hover:-translate-y-1">Explore Compliance Hub</button>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
              {stats.map(([title, text]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-5 text-left shadow-sm backdrop-blur transition-all duration-200"><p className="text-xl font-black text-emerald-300">{title}</p><p className="mt-1 text-sm leading-relaxed text-slate-300">{text}</p></div>)}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative rotate-2 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur transition hover:rotate-0">
              <img src={images.minibusHero} alt="ACE MiDAS minibus training" className="h-[520px] w-full rounded-[2rem] object-cover" />
              <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-slate-950/85 p-6 shadow-xl backdrop-blur"><p className="text-sm font-semibold text-emerald-300">ACE MiDAS Training</p><p className="mt-1 text-2xl font-black sm:text-3xl">Training that matches real transport operations.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-white px-6 py-5"><div className="mx-auto grid max-w-7xl gap-3 text-center text-sm font-bold text-slate-600 md:grid-cols-4">{["Council & school transport focused", "SEND passenger safety", "Training + digital compliance", "Built for real operators"].map((point) => <div key={point} className="rounded-2xl bg-slate-50 px-4 py-3">✓ {point}</div>)}</div></section>
      <section className="bg-white px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"><div><img src={images.logoHorizontal} alt="ACE MiDAS Training" className="max-h-24 max-w-full object-contain" /><p className="mt-8 font-semibold text-emerald-700">Training services</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">One provider for training, booking and compliance evidence.</h2><p className="mt-5 max-w-2xl leading-8 text-slate-600">Keep the familiar ACE MiDAS Training identity, but present it with a stronger commercial journey.</p></div><div className="grid gap-5 md:grid-cols-3">{cards.map((course) => <button key={course.title} type="button" onClick={() => setPage("Training")} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><div className="h-48 overflow-hidden bg-slate-100"><img {...mediaImageProps(mediaSettings, course.slot || "first_aid_at_work")} className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105" /></div><div className="p-5"><h3 className="text-xl font-black">{course.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{course.text}</p><p className="mt-5 font-black text-emerald-700">View course →</p></div></button>)}</div></div></div></section>
      <section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center"><div className="h-64 overflow-hidden rounded-2xl sm:h-[440px]"><img {...mediaImageProps(mediaSettings, "complianceCard")} className="h-full w-full object-cover" /></div><div><p className="font-semibold text-emerald-300">Compliance Hub</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">Turn daily transport activity into audit-ready records.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Give depots, road staff and managers a controlled way to record what happens on transport services.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{complianceFeatureCards.map((item) => <div key={item.title} className="flex flex-col justify-center gap-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-left text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><h3 className="text-xl font-semibold leading-snug">{item.title}</h3><p className="text-sm leading-relaxed text-slate-300">{item.subtitle}</p></div>)}</div><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Compliance")} className="rounded-2xl bg-emerald-400 px-7 py-4 font-black text-slate-950">View Packages</button><button type="button" onClick={() => setPage("Membership")} className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Member Access</button></div></div></div></section>
      <section className="relative overflow-hidden bg-emerald-600 px-6 py-20 text-slate-950"><div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center"><div><p className="font-bold">Ready to replace paper-heavy processes?</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">Let's build safer transport practice together.</h2><p className="mt-5 max-w-2xl text-lg leading-8">Book training, request a compliance demo, or speak to us about a premium setup.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Training")} className="rounded-2xl bg-slate-950 px-7 py-4 font-black text-white">Book Training</button><button type="button" onClick={() => setPage("Contact")} className="rounded-2xl border border-slate-950/20 bg-white/30 px-7 py-4 font-black text-slate-950">Contact Us</button></div></div><img src={images.handshake} alt="Partnership handshake" className="h-64 w-full rounded-2xl object-cover sm:h-[360px] sm:rounded-[2rem]" /></div></section>
    </main>
  );
}

function TrainingPage({ startBooking, mediaSettings }) {
  return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="font-semibold text-emerald-700">Training Services</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl md:text-6xl">Book MiDAS, PATS, FAW or Children's Transport First Aid.</h1><p className="mt-5 leading-8 text-slate-600">Choose a course, select delegates, review the agreement, and continue to secure payment.</p></div><img src={images.vehicleLineup} alt="Passenger transport fleet" className="h-56 w-full rounded-2xl object-cover sm:h-[360px]" /></div><div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm"><p className="font-semibold text-emerald-700">Essential Training</p><h2 className="mt-2 text-3xl font-bold">Pay per course</h2><p className="mt-3 leading-relaxed text-slate-700">Book MiDAS, PATS, First Aid at Work or Children's Transport First Aid training for individuals or groups.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><p>✓ Course booking</p><p>✓ Certification support</p><p>✓ Group booking options</p></div></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{trainingCourses.map((course) => <button key={course.title} type="button" onClick={() => startBooking(course)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"><div className="h-44 overflow-hidden bg-slate-100"><img {...mediaImageProps(mediaSettings, course.mediaSlot)} className="h-full w-full object-cover object-center" /></div><div className="p-5"><p className="text-xl font-bold text-slate-950">{course.title}</p><p className="mt-3 text-2xl font-black sm:text-3xl text-emerald-700">{course.price}</p><p className="mt-3 text-sm leading-relaxed text-slate-600">{course.note}</p><p className="mt-5 font-bold text-emerald-700">Book this course →</p></div></button>)}</div></div></main>;
}

function BookingPage({ course, setPage }) {
  const [qty, setQty] = useState(1);
  const [outside, setOutside] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  if (!course) return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 text-center"><h1 className="text-3xl font-bold sm:text-4xl">No course selected</h1><button type="button" onClick={() => setPage("Training")} className="mt-8 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Training</button></main>;
  const nums = course.price.match(/\d+/g)?.map(Number) || [0];
  const low = nums[0];
  const high = nums[1] || nums[0];
  const max = course.title.includes("PATS Accessible") || course.title.includes("First Aid") || course.title.includes("Children") ? 12 : 20;
  const unit = nums.length > 1 ? (qty >= 9 ? low : qty >= 4 ? Math.round(high * 0.9) : high) : qty >= 9 ? Math.round(high * 0.8) : qty >= 4 ? Math.round(high * 0.9) : high;
  const saving = Math.max(0, high - unit);
  const travelFee = outside ? 75 : 0;
  const subtotal = unit * qty;
  const total = subtotal + travelFee;
  async function continueToPayment() {
    if (!agree) return;
    setIsLoading(true);
    setPaymentError("");
    try {
      const response = await fetch(COURSE_CHECKOUT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: course.title,
          quantity: qty,
          unitPrice: unit,
          subtotal,
          travelFee,
          total,
          outsideA406: outside,
          agreementAccepted: agree,
          productType: "training"
        })
      });
      const data = await safeReadJson(response, "Payment could not be started. Please try again.");
      if (!response.ok || !data.url) throw new Error(data.error || "Payment could not be started. Please try again.");
      window.location.href = data.url;
    } catch (error) {
      setIsLoading(false);
      setPaymentError(error.message || "Payment could not be started. Please try again.");
    }
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-5xl"><div className="text-center"><p className="font-semibold text-emerald-700">Course Booking</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl md:text-6xl">Confirm your booking</h1></div><div className="mt-12 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-2xl font-bold">{course.title}</h2><p className="mt-2 text-slate-500">{course.note}</p><label className="mt-6 block font-semibold">Number of delegates</label><input type="number" min="1" max={max} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} className="mt-2 w-full rounded-xl border p-3" /><p className="mt-2 text-xs text-slate-500">Maximum allowed: {max}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setOutside(false)} className={`rounded-xl px-4 py-3 font-bold ${!outside ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Inside A406</button><button type="button" onClick={() => setOutside(true)} className={`rounded-xl px-4 py-3 font-bold ${outside ? "bg-red-600 text-white" : "bg-slate-100"}`}>Outside A406</button></div></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-2xl font-bold">Price Breakdown</h2><div className="mt-6 space-y-4"><div className="flex justify-between"><span>Price per delegate</span><div className="text-right">{saving > 0 ? <p className="text-sm line-through text-slate-400">£{high}</p> : null}<b>£{unit}</b></div></div><div className="flex justify-between"><span>Delegates</span><b>{qty}</b></div><div className="flex justify-between"><span>Subtotal</span><b>£{subtotal}</b></div><div className="flex justify-between"><span>Travel fee</span><b>£{travelFee}</b></div><div className="flex justify-between border-t pt-4 text-2xl"><span>Total</span><b className="text-emerald-600">£{total}</b></div>{saving > 0 ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">You are saving £{saving * qty} with this group discount.</p> : null}<p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">Final payment is completed securely through Stripe. If your booking requires a group or custom price, we will confirm this before the final booking is accepted.</p></div></div></div><section className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-2xl font-bold">Booking Agreement</h2><p className="mt-4 text-sm leading-7 text-slate-700">By selecting Yes, I agree, you confirm this booking forms a binding agreement. Payment secures the booking request. After payment, you will be redirected to select your preferred training dates. Preferred dates are subject to availability, and ACE MiDAS Training Ltd will confirm the final agreed date. No refunds for non-attendance once a date has been confirmed. If a date is unavailable, ACE MiDAS Training Ltd will offer suitable alternatives.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => setAgree(true)} className={`rounded-xl p-4 font-bold ${agree ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"}`}>Yes, I agree</button><button type="button" onClick={() => setAgree(false)} className="rounded-xl bg-red-100 p-4 font-bold text-red-800">No, I do not agree</button></div><div className="mt-6 rounded-2xl bg-emerald-50 p-5"><h3 className="text-xl font-black text-emerald-900">What happens after payment</h3><div className="mt-4 grid gap-3 text-sm font-semibold text-emerald-900 sm:grid-cols-2"><p>✓ Payment secures the booking request</p><p>✓ Customer selects preferred dates after payment</p><p>✓ Dates are subject to availability</p><p>✓ Confirmation within 24 hours</p></div></div>{paymentError ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{paymentError}</p> : null}<button type="button" disabled={!agree || isLoading} onClick={continueToPayment} className={`mt-6 w-full rounded-xl p-4 font-bold ${agree && !isLoading ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"}`}>{isLoading ? "Opening secure Stripe payment..." : `Continue to Secure Payment - £${total}`}</button><p className="mt-3 text-center text-sm font-semibold text-slate-600">Training dates confirmed within 24 hours after payment</p><button type="button" onClick={() => setPage("Training")} className="mt-4 w-full rounded-xl border p-4 font-bold">Back to Training</button></section></div></main>;
}

function BookingConfirmationPage({ setPage }) {
  const [form, setForm] = useState({ name: "", organisation: "", email: "", phone: "", course: "", delegates: "", location: "", preferredDate1: "", preferredDate2: "", preferredDate3: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  function updateField(e) { const { name, value } = e.target; setForm((current) => ({ ...current, [name]: value })); }
  async function handleSubmit(e) { e.preventDefault(); setError(""); try { const response = await fetch(BOOKING_CONFIRMATION_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const data = await safeReadJson(response, "Your payment was received, but the form could not be submitted. Please email info@ace-midas-training.co.uk."); if (!response.ok) throw new Error(data.error || "Your payment was received, but the form could not be submitted. Please email info@ace-midas-training.co.uk."); setSubmitted(true); } catch (bookingError) { setError(bookingError.message || "Your payment was received, but the form could not be submitted. Please email info@ace-midas-training.co.uk."); } }
  return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-5xl"><div className="rounded-3xl bg-emerald-500 p-8 text-center text-slate-950"><p className="font-semibold">Payment received</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl md:text-6xl">Thank you for your booking. Your payment has been received. Please now complete your preferred training date request.</h1><p className="mx-auto mt-4 max-w-3xl text-lg">Your booking request is secured. Preferred dates are subject to availability and ACE MiDAS Training Ltd will confirm the final agreed date.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-black text-emerald-700">1. Check your email</p><p className="mt-2 text-sm text-slate-600">You may receive a Stripe receipt and booking follow-up email.</p></div><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-black text-emerald-700">2. Select dates</p><p className="mt-2 text-sm text-slate-600">Send your preferred dates using the form below.</p></div><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-black text-emerald-700">3. Confirmation within 24h</p><p className="mt-2 text-sm text-slate-600">Dates are subject to availability and will be confirmed by ACE MiDAS Training Ltd.</p></div></div><div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">{submitted ? <div className="py-10 text-center"><h2 className="text-2xl font-bold text-emerald-600">Preferred dates submitted</h2><p className="mt-3 text-slate-600">Thank you. Please check your email. We will review availability and confirm the agreed training date within 24 hours.</p><button type="button" onClick={() => setPage("Home")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div> : <form onSubmit={handleSubmit} className="grid gap-4"><h2 className="text-2xl font-bold">Select preferred dates</h2>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="name" value={form.name} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" required /></div><div className="grid gap-4 sm:grid-cols-2"><input name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email address" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone number" /></div><div className="grid gap-4 sm:grid-cols-2"><select name="course" value={form.course} onChange={updateField} className="rounded-xl border p-3" required><option value="">Course booked</option>{trainingCourses.map((item) => <option key={item.title}>{item.title}</option>)}</select><input name="delegates" value={form.delegates} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of delegates paid for" required /></div><input name="location" value={form.location} onChange={updateField} className="rounded-xl border p-3" placeholder="Training address / location" required /><div className="grid gap-4 sm:grid-cols-3"><input type="date" name="preferredDate1" value={form.preferredDate1} onChange={updateField} className="rounded-xl border p-3" required /><input type="date" name="preferredDate2" value={form.preferredDate2} onChange={updateField} className="rounded-xl border p-3" /><input type="date" name="preferredDate3" value={form.preferredDate3} onChange={updateField} className="rounded-xl border p-3" /></div><textarea name="notes" value={form.notes} onChange={updateField} className="rounded-xl border p-3" rows={4} placeholder="Any notes, access arrangements, parking details or preferred times." /><button type="submit" className="rounded-xl bg-slate-950 p-4 font-bold text-white">Submit Booking Details</button></form>}</div></div></main>;
}

function CompliancePage({ setPage, siteSettings }) {
  const packs = [
    { title: "Compliance Bundle", price: "From £495/month", text: "Training plus paid access to ACE Compliance Hub for daily compliance tracking.", points: ["Member/depot access", "Journey reporting", "Medication and attendance records", "Incident and wheelchair checklists"], cta: "Subscribe for Access" },
    { title: "Premium Compliance Partner", price: "From £1,200/month", text: "Bespoke SEND transport compliance support for councils and multi-provider oversight.", points: ["Council dashboard setup", "Provider onboarding", "Audit-ready reporting", "Ongoing compliance support"], cta: "Book a Council Consultation" }
  ];
  return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">ACE Compliance Hub</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl md:text-6xl">Compliance software and support for passenger transport teams.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Combine your training with live digital records for journeys, medication, attendance, wheelchair checks and incidents.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Subscribe")} className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</button><button type="button" onClick={() => setPage("PremiumCompliancePartner")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Book a Council Consultation</button></div></div><div className="grid gap-3 sm:grid-cols-2">{complianceFeatureCards.map((feature) => <div key={feature.title} className="flex flex-col justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><h3 className="text-xl font-semibold leading-snug">{feature.title}</h3><p className="text-sm leading-relaxed text-slate-300">{feature.subtitle}</p></div>)}</div></div></section><section className="px-6 py-20"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="font-semibold text-emerald-700">Compliance Packages</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl md:text-6xl">Choose SaaS access or full compliance partnership.</h2></div><div className="mt-12 grid gap-6 lg:grid-cols-2">{packs.map((pack, index) => <div key={pack.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><h3 className="text-2xl font-bold">{pack.title}</h3><p className="mt-3 leading-relaxed text-slate-600">{pack.text}</p><p className="mt-6 text-3xl font-bold text-emerald-600">{pack.price}</p><div className="mt-6 space-y-3">{pack.points.map((point) => <p key={point} className="text-sm leading-relaxed text-slate-700">✓ {point}</p>)}</div>{index === 0 ? <button type="button" onClick={() => setPage("Subscribe")} className="mt-8 block w-full rounded-xl bg-slate-950 py-3 text-center font-bold text-white">{pack.cta}</button> : <button type="button" onClick={() => setPage("PremiumCompliancePartner")} className="mt-8 w-full rounded-xl bg-slate-950 py-3 font-bold text-white">{pack.cta}</button>}</div>)}</div></div></section></main>;
}

function MembershipPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">Member Access</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl md:text-6xl">Secure access to your compliance platform.</h1><p className="mt-6 text-lg leading-8 text-slate-300">ACE Compliance Hub access is provided to approved member organisations only.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Subscribe")} className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</button><button type="button" onClick={() => setPage("Login")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Existing Member Login</button></div></div><div className="rounded-3xl border border-white/10 bg-white/10 p-7"><h2 className="text-2xl font-bold">Access is protected</h2><div className="mt-6 space-y-4 text-slate-200"><p>✓ Organisation-specific login credentials</p><p>✓ Depot/site access controlled per member</p><p>✓ Token-based access prepared in Manus</p><p>✓ Two-factor authentication recommended</p></div></div></div></section></main>; }
function SubscribePage({ siteSettings }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const valuePoints = ["Access to a complete compliance and tracking system", "Medication tracking system (Med-Tracking App)", "Full journey tracking and reporting system", "Incident logging and audit-ready records", "Centralised digital compliance hub"];
  const reasons = ["Stay compliant with council and regulatory expectations", "Protect your business with accurate, time-stamped records", "Reduce risk and liability with structured reporting", "Be fully prepared for audits and inspections", "Operate with confidence knowing nothing is missed"];
  const bespoke = ["Setup tailored to your business", "Guidance on how to use the system in real operations", "Support aligning your current processes into the system"];
  const support = ["Ongoing technical support", "Help implementing the system into your daily operations", "Assistance when issues arise or processes need adjusting"];
  async function proceedToPayment() {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(SUBSCRIBE_CHECKOUT_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productType: "onboarding" }) });
      const data = await safeReadJson(response, "Payment could not be started. Please try again.");
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to create Stripe checkout.");
      window.location.href = data.url;
    } catch (checkoutError) {
      setIsLoading(false);
      if (siteSettings.stripeLink) {
        setError(`${checkoutError.message || "Unable to create Stripe checkout."} The saved Payment Link is available as a fallback, but check its Stripe redirect before using it.`);
        return;
      }
      setError(checkoutError.message || "Unable to create Stripe checkout.");
    }
  }
  function Section({ title, items }) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-2xl font-black">{title}</h2><div className="mt-5 grid gap-3">{items.map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">✓ {item}</p>)}</div></section>;
  }
  return <main className="min-h-screen bg-slate-50 text-slate-950"><section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20"><div className="mx-auto max-w-5xl"><p className="font-semibold text-emerald-300">Subscribe for Access</p><h1 className="mt-4 text-2xl font-black sm:text-3xl tracking-tight sm:text-4xl md:text-6xl">Compliance & Tracking System - £495 Setup Access</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">Give your transport operation the tools, structure and confidence to meet compliance standards and operate with complete peace of mind.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><button type="button" onClick={proceedToPayment} disabled={isLoading} className="w-full rounded-2xl bg-emerald-400 px-6 py-4 text-base font-black sm:w-auto sm:px-8 sm:text-lg text-slate-950 shadow-xl disabled:opacity-60">{isLoading ? "Opening secure checkout..." : "Secure Access & Setup - £495"}</button><p className="text-sm font-semibold text-slate-300">Secure Stripe checkout. No hidden fees.</p></div>{error ? <p className="mt-5 rounded-xl bg-red-100 p-4 text-sm font-semibold text-red-800">{error}</p> : null}</div></section><div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-2"><Section title="What you get" items={valuePoints} /><Section title="Why this matters" items={reasons} /><Section title="Bespoke service" items={bespoke} /><Section title="Support and aftercare" items={support} /></div><section className="px-6 pb-20"><div className="mx-auto max-w-5xl rounded-3xl bg-emerald-500 p-8 text-center text-slate-950"><p className="text-2xl font-black md:text-4xl">Everything you need to run a compliant, accountable and professional transport operation - all in one place.</p><button type="button" onClick={proceedToPayment} disabled={isLoading} className="mt-8 rounded-2xl bg-slate-950 px-8 py-4 text-lg font-black text-white disabled:opacity-60">{isLoading ? "Opening secure checkout..." : "Proceed to Payment (£495)"}</button><p className="mt-3 text-sm font-semibold">Secure Stripe checkout. No hidden fees.</p></div></section></main>;
}

function PaymentSuccessPage({ setPage }) {
  const params = new URLSearchParams(window.location.search);
  const checkoutSessionId = params.get("session_id") || params.get("checkout_session_id") || "";
  const status = "confirmed";
  const details = null;
  const message = "";

  function continueToOnboarding() {
    const query = checkoutSessionId ? `?session_id=${encodeURIComponent(checkoutSessionId)}` : "";
    window.history.replaceState(null, "", `/${query}#member-welcome`);
    setPage("MemberWelcome");
  }

  return <main className="min-h-screen bg-slate-50 text-slate-950"><section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20"><div className="mx-auto max-w-5xl"><p className="font-semibold text-emerald-300">Payment Confirmation</p><h1 className="mt-4 text-3xl font-black sm:text-4xl md:text-6xl">Payment successful</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">Your £495 ACE Compliance Hub setup access has been received. Your subscription access is now ready to move into onboarding.</p></div></section><section className="px-6 py-16"><div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black sm:text-3xl text-emerald-700">✓</div><h2 className="mt-6 text-2xl font-black sm:text-3xl">Subscription access confirmed</h2>{status === "checking" ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">Checking Stripe payment status...</p> : null}{status === "confirmed" ? <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Payment received. Your Compliance Hub setup package is active and ready for onboarding.</p> : null}{status === "pending" ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Stripe has redirected you successfully. The payment is still finalising, so we will confirm it in the background.</p> : null}{status === "unverified" ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{message} You can still continue to onboarding if you arrived here after Stripe checkout.</p> : null}<div className="mt-6 space-y-3 text-sm text-slate-600">{details?.customer_email ? <p><strong>Email:</strong> {details.customer_email}</p> : null}{details?.amount_total ? <p><strong>Amount:</strong> £{(details.amount_total / 100).toFixed(2)}</p> : <p><strong>Amount:</strong> £495.00</p>}{checkoutSessionId ? <p className="break-all"><strong>Stripe session:</strong> {checkoutSessionId}</p> : <p><strong>Stripe session:</strong> Not supplied by Stripe redirect.</p>}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><p className="font-semibold text-emerald-700">Next step</p><h2 className="mt-3 text-2xl font-black sm:text-3xl">Complete your access setup</h2><p className="mt-4 leading-7 text-slate-600">We now need your organisation details so ACE MiDAS Training can configure the right compliance tools, prepare secure login access and set up the Medication Tracking and Journey Tracking gateways.</p><div className="mt-6 grid gap-3 text-sm font-semibold text-slate-700"><p className="rounded-2xl bg-slate-50 p-4">Secure login will use an email verification code or secure login link.</p><p className="rounded-2xl bg-slate-50 p-4">No plain text passwords will be emailed.</p><p className="rounded-2xl bg-slate-50 p-4">Your setup status starts as Pending while access is configured.</p></div><button type="button" onClick={continueToOnboarding} className="mt-8 w-full rounded-2xl bg-emerald-600 p-4 text-lg font-black text-white">Continue to Onboarding</button></div></div></section></main>;
}
function PremiumCompliancePartnerPage({ setPage }) {
  const councilFeatures = ["Multi-provider council dashboard", "Provider comparison and compliance scores", "Incident approval and escalation visibility", "Risk alerts for missed checks or overdue incidents", "Medication tracking exceptions", "Wheelchair and passenger safety checklist evidence", "End-of-journey vehicle check evidence", "Audit report generator", "Exportable PDF/CSV compliance reports", "GDPR-conscious attendance using initials only"];
  const included = ["Bespoke setup for the local authority", "Provider onboarding support", "Council dashboard configuration", "Training and implementation guidance", "Workflow mapping", "Technical support and aftercare", "Reporting and audit support", "Optional ongoing compliance review meetings"];
  const audiences = ["Local authorities commissioning SEND/home-to-school transport", "Transport teams managing multiple providers", "Council officers responsible for safeguarding/compliance oversight", "Providers who need stronger evidence for council contracts"];
  return <main className="min-h-screen bg-slate-50 text-slate-950"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto max-w-6xl"><p className="font-semibold text-emerald-300">SafeJourney Compliance</p><h1 className="mt-4 max-w-5xl text-2xl font-black sm:text-3xl tracking-tight sm:text-4xl md:text-6xl">Premium Compliance Partner for Local Authorities</h1><p className="mt-6 max-w-5xl text-lg leading-8 text-slate-300">Give your SEND transport team clear visibility across providers, journeys, incidents, medication records, wheelchair safety checks and safeguarding evidence - all in one compliance-focused platform.</p><p className="mt-6 max-w-4xl rounded-2xl border border-white/10 bg-white/10 p-5 text-slate-200">This is not just software. It is a bespoke compliance partnership for councils that need confidence, oversight and audit-ready evidence across SEND/home-to-school transport operations.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Contact")} className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-black text-slate-950">Book a Council Consultation</button><a href="/contact" className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-center font-bold text-white">Discuss SafeJourney Access</a></div><p className="mt-4 text-sm font-semibold text-slate-300">Speak to us about a bespoke local authority setup.</p></div></section><section className="px-6 py-16"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="font-semibold text-emerald-700">Why councils need this</p><h2 className="mt-3 text-2xl font-black sm:text-3xl md:text-5xl">Visibility, evidence and safeguarding oversight across SEND transport.</h2></div><div className="space-y-4 leading-7 text-slate-700"><p>SEND transport carries safeguarding, operational and reputational risk. Paper records and scattered emails make it difficult to evidence what happened, when it happened, and how issues were handled.</p><p>Councils need practical visibility across multiple providers. Missed medication records, incomplete wheelchair checks and unresolved incidents can create serious risk. SafeJourney Compliance helps councils evidence safer journeys and stronger provider oversight.</p></div></div></section><section className="bg-white px-6 py-16"><div className="mx-auto max-w-7xl"><p className="font-semibold text-emerald-700">Council dashboard capability</p><h2 className="mt-3 max-w-4xl text-2xl font-black sm:text-3xl md:text-5xl">What SafeJourney Compliance gives councils</h2><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{councilFeatures.map((item) => <div key={item} className="rounded-2xl border bg-slate-50 p-5 text-sm font-semibold text-slate-700">✓ {item}</div>)}</div></div></section><section className="px-6 py-16"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2"><div className="rounded-3xl bg-slate-950 p-8 text-white"><p className="font-semibold text-emerald-300">Built around real SEND transport practice</p><h2 className="mt-3 text-2xl font-black sm:text-3xl">Designed for the way transport teams actually work.</h2><p className="mt-5 leading-7 text-slate-300">SafeJourney Compliance is designed around the daily workflow of drivers, passenger assistants, office staff and council officers. Road staff get mobile-first screens for practical evidence capture, while office teams and council users get desktop dashboards for monitoring, escalation and reporting.</p></div><div className="rounded-3xl border bg-white p-8 shadow-sm"><p className="font-semibold text-emerald-700">Compliance and peace of mind</p><p className="mt-4 text-lg leading-8 text-slate-700">SafeJourney Compliance gives local authorities confidence that providers are completing the checks, logs and reports needed to evidence safe SEND journeys. It reduces blind spots, improves accountability and gives council teams a clearer picture of risk before issues escalate.</p></div></div></section><section className="bg-white px-6 py-16"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2"><div><p className="font-semibold text-emerald-700">Premium Compliance Partner includes</p><div className="mt-6 grid gap-3">{included.map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">✓ {item}</p>)}</div></div><div><p className="font-semibold text-emerald-700">Who it is for</p><div className="mt-6 grid gap-3">{audiences.map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">✓ {item}</p>)}</div></div></div></section><section className="px-6 py-16"><div className="mx-auto max-w-5xl rounded-3xl bg-emerald-500 p-8 text-center text-slate-950"><h2 className="text-2xl font-black sm:text-3xl md:text-5xl">Speak to us about a bespoke local authority setup.</h2><p className="mx-auto mt-4 max-w-3xl leading-7">We can discuss your provider landscape, safeguarding expectations, evidence requirements and the most practical route to implementation.</p><div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Contact")} className="rounded-xl bg-slate-950 px-7 py-4 font-black text-white">Book a Council Consultation</button><a href="/contact" className="rounded-xl border border-slate-950/20 bg-white/40 px-7 py-4 font-black text-slate-950">Discuss SafeJourney Access</a></div></div></section></main>;
}
function PrivacyPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-4xl"><div className="mb-6 flex items-center gap-4"><img src={images.logoRound} alt="logo" className="h-12 w-12 rounded-full" /><h1 className="text-4xl font-black">Privacy Policy</h1></div><p className="text-sm text-slate-500">Last updated: May 2026</p><div className="mt-8 space-y-7 text-slate-700 leading-7"><section><h2 className="text-2xl font-black text-slate-950">1. Who we are</h2><p className="mt-3">ACE MiDAS Training Ltd is registered in England and Wales under company number 16005284. Our registered office is {siteSettings.address || "128 City Road, London, EC1V 2NX"}. You can contact us at {siteSettings.contactEmail}.</p></section><section><h2 className="text-2xl font-black text-slate-950">2. Information we collect</h2><p className="mt-3">We may collect contact details, organisation details, booking information, course preferences, payment status, training records, website enquiry details, member onboarding details, compliance platform records and technical information such as browser, device and cookie data.</p></section><section><h2 className="text-2xl font-black text-slate-950">3. How we use information</h2><p className="mt-3">We use personal information to respond to enquiries, manage bookings, deliver training, process onboarding, provide member access, support compliance services, maintain records, meet legal obligations and improve our website and services.</p></section><section><h2 className="text-2xl font-black text-slate-950">4. Payments</h2><p className="mt-3">Payments are processed securely by Stripe. We do not store full card details on our website. Stripe may process payment, billing and fraud prevention information under its own privacy terms.</p></section><section><h2 className="text-2xl font-black text-slate-950">5. Lawful basis</h2><p className="mt-3">We process data where it is necessary to perform a contract, respond to pre-contract enquiries, comply with legal obligations, protect legitimate business interests, or where consent has been provided.</p></section><section><h2 className="text-2xl font-black text-slate-950">6. Sharing information</h2><p className="mt-3">We only share information where needed to provide services, including with payment processors, email/form providers, hosting providers, compliance software providers, professional advisers or authorities where required by law. We do not sell personal data.</p></section><section><h2 className="text-2xl font-black text-slate-950">7. Retention</h2><p className="mt-3">We keep personal information only for as long as needed for training, compliance, accounting, legal and operational purposes. Records may be retained where required for audit, safeguarding, insurance or statutory obligations.</p></section><section><h2 className="text-2xl font-black text-slate-950">8. Your rights</h2><p className="mt-3">You may request access, correction, deletion, restriction or portability of your personal data, or object to certain processing. To make a request, contact {siteSettings.contactEmail}.</p></section><section><h2 className="text-2xl font-black text-slate-950">9. Cookies</h2><p className="mt-3">We use cookies and similar technologies to operate the website, support security, measure performance and manage consent. You can find more information on our Cookie Policy page.</p></section><section><h2 className="text-2xl font-black text-slate-950">10. Updates</h2><p className="mt-3">We may update this policy when our services, systems or legal requirements change. The latest version will be published on this page.</p></section></div><button onClick={() => setPage("Home")} className="mt-10 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div></main>; }
function CookiePolicyPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-4xl"><h1 className="text-4xl font-black">Cookie Policy</h1><div className="mt-8 space-y-6 leading-7 text-slate-700"><p>ACE MiDAS Training Ltd uses cookies to make this website work, improve performance, remember consent choices and support secure services such as forms, payments and member access.</p><p><strong>Essential cookies</strong> are required for core website functionality and cannot usually be switched off.</p><p><strong>Analytics and performance cookies</strong> help us understand how visitors use the website so we can improve it.</p><p><strong>Third-party cookies</strong> may be set by providers such as Stripe, Supabase, Resend or CookieYes when their services are used.</p><p>You can manage cookie preferences through the CookieYes banner where available, or by changing your browser settings.</p><p>Contact: {siteSettings.contactEmail}</p></div><button onClick={() => setPage("Home")} className="mt-10 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div></main>; }
function TermsPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-4xl"><h1 className="text-4xl font-black">Terms & Conditions</h1><div className="mt-8 space-y-6 leading-7 text-slate-700"><p>These terms apply to use of the ACE MiDAS Training Ltd website and to enquiries, bookings and digital compliance access arranged through the website.</p><p><strong>Bookings:</strong> Payment secures a booking. After payment, customers select preferred training dates. Preferred dates are subject to availability and ACE MiDAS Training Ltd will confirm the final agreed date.</p><p><strong>Attendance:</strong> Customers are responsible for ensuring delegates attend the confirmed training date and meet any course requirements.</p><p><strong>Refunds:</strong> No refunds are provided for non-attendance once a date is confirmed, unless otherwise agreed in writing or required by law.</p><p><strong>Compliance Hub:</strong> Digital access and setup services are provided according to the package purchased. Member access is issued securely and may be withdrawn if misuse, non-payment or security risk is identified.</p><p><strong>Liability:</strong> Nothing in these terms excludes liability where it cannot legally be excluded. Otherwise, our liability is limited to the amount paid for the relevant service.</p><p><strong>Company details:</strong> ACE MiDAS Training Ltd, company number 16005284, registered office {siteSettings.address || "128 City Road, London, EC1V 2NX"}.</p></div><button onClick={() => setPage("Home")} className="mt-10 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div></main>; }
function Footer({ setPage, siteSettings }) { return <footer className="bg-slate-950 px-4 py-10 text-white sm:px-6"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr]"><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><img src={images.logoRound} alt="ACE logo" className="h-12 w-12 rounded-full bg-white object-contain" /><div className="space-y-1 text-sm text-slate-300"><p className="text-base font-black text-white">{siteSettings.businessName || "ACE MiDAS Training Ltd"}</p><p>Registered in {siteSettings.registeredJurisdiction || "England and Wales"}</p><p>Registered Office: {siteSettings.address || "128 City Road, London, EC1V 2NX"}</p><p>Company No: {siteSettings.companyNumber || "16005284"}</p><p>Email: {siteSettings.contactEmail}</p><p>Phone: {siteSettings.phone}</p><p>&copy; 2026 {siteSettings.businessName || "ACE MiDAS Training Ltd"}</p></div></div><div className="flex flex-col gap-3 text-sm font-semibold sm:flex-row sm:flex-wrap md:justify-end"><button onClick={() => setPage("Privacy")} className="hover:text-emerald-400">Privacy Policy</button><button onClick={() => setPage("CookiePolicy")} className="hover:text-emerald-400">Cookie Policy</button><button onClick={() => setPage("Terms")} className="hover:text-emerald-400">Terms & Conditions</button></div></div></footer>; }

function LoginPage({ setPage, setLoggedInMember }) {
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  async function handleCredentials(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/send-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: "Server error. Please try again." };
      }
      if (!response.ok) throw new Error(data.error || "Unable to send secure login code.");
      setNotice(data.message || "A secure login code has been sent to your email address.");
      setStep("verification");
    } catch (loginError) {
      setError(loginError.message || "Unable to send secure login code.");
    } finally {
      setIsLoading(false);
    }
  }
  async function handleVerification(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/verify-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code: code.trim() })
      });
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: "Server error. Please try again." };
      }
      if (!response.ok) throw new Error(data.error || "Unable to verify secure login code.");
      setLoggedInMember({ ...data.member, member_access: true });
      setIsLoading(false);
      setPage("MemberDashboard");
    } catch (verifyError) {
      setIsLoading(false);
      setError(verifyError.message || "Unable to verify secure login code.");
    }
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="font-semibold text-emerald-700">Secure Member Login</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">Access your organisation's compliance portal.</h1><p className="mt-5 leading-8 text-slate-600">Members sign in with a secure 6-digit code sent to their approved member email. Access is only available for active subscribed organisations.</p><div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm leading-7 text-emerald-900"><strong>Secure access:</strong> enter your approved email, then use the verification code sent to your inbox. No shared live passwords are used.</div></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">{step === "credentials" ? <form onSubmit={handleCredentials} className="grid gap-4"><h2 className="text-2xl font-black sm:text-3xl">Member Login</h2>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border p-4" placeholder="Approved member email" required /><button type="submit" disabled={isLoading} className="w-full rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isLoading ? "Sending..." : "Send Secure Login Code"}</button></form> : <form onSubmit={handleVerification} className="grid gap-4"><h2 className="text-2xl font-black sm:text-3xl">Enter verification code</h2><p className="text-sm text-slate-500">Check your email for the secure 6-digit login code. It expires after 10 minutes.</p>{notice ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{notice}</p> : null}{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="rounded-xl border p-4 text-center text-2xl tracking-[0.3em]" placeholder="Enter code" required /><button type="submit" disabled={isLoading} className="w-full rounded-xl bg-emerald-600 p-4 font-black text-white disabled:opacity-60">{isLoading ? "Verifying..." : "Verify & Enter Portal"}</button><button type="button" onClick={() => setStep("credentials")} className="w-full rounded-xl border p-4 font-bold text-slate-700">Back</button></form>}</div></div></main>;
}
function MemberDashboardPage({ member, setPage, session }) {
  const hasAccess = member?.member_access === true;
  useEffect(() => {
    if (!hasAccess) setPage("Login");
  }, [hasAccess, setPage]);
  if (!hasAccess) return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 text-center"><h1 className="text-3xl font-bold sm:text-4xl">Login required</h1><p className="mt-3 text-slate-600">Please use secure member login to access this dashboard.</p><button type="button" onClick={() => setPage("Login")} className="mt-8 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Go to Login</button></main>;
  const activeMed = member?.med_app_status === "Active" && member?.med_app_url;
  const activeJourney = member?.journey_app_status === "Active" && member?.journey_app_url;
  return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-7xl"><div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl"><p className="font-semibold text-emerald-300">Member Dashboard</p><h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-6xl">Welcome, {member?.organisation || "ACE Compliance Hub Member"}</h1><p className="mt-4 text-slate-300">Signed in as: {member?.email}</p></div><div className="mt-8 grid gap-4 md:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Contact</p><p className="mt-2 font-black">{member?.contact_name || "Not set"}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Subscription</p><p className="mt-2 font-black text-emerald-700">{member?.subscription_status || "Active"}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Onboarding</p><p className="mt-2 font-black">{member?.onboarding_status || member?.setup_status || "New"}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Username</p><p className="mt-2 font-black">{member?.username || "Email login"}</p></div></div><div className="mt-10 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><p className="font-semibold text-emerald-700">Medication Tracking App</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{member?.med_app_status || "Setup pending"}</h2><p className="mt-3 text-slate-600">Medication records, missed/refused doses and safeguarding evidence.</p>{activeMed ? <a href={member.med_app_url} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-emerald-600 p-4 text-center font-black text-white">Open Medication Tracking App</a> : <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Setup pending</p>}</div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><p className="font-semibold text-emerald-700">Journey Tracking App</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">{member?.journey_app_status || "Setup pending"}</h2><p className="mt-3 text-slate-600">Attendance, route activity, wheelchair checks, incidents and end-of-journey evidence.</p>{activeJourney ? <a href={member.journey_app_url} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-emerald-600 p-4 text-center font-black text-white">Open Journey Tracking App</a> : <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Setup pending</p>}</div></div><div className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><p className="font-semibold text-amber-700">Compliance portal</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Depot/site access</h2>{activeJourney ? <a href={member.journey_app_url} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-slate-950 p-4 text-center font-black text-white">Open Compliance Portal</a> : <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Portal URL will appear here once your setup is active.</p>}</div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><p className="font-semibold text-emerald-700">Support / Aftercare</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">We are here to help</h2><p className="mt-3 text-slate-600">Contact us if you need help implementing the system or adjusting your setup.</p><button type="button" onClick={() => setPage("Contact")} className="mt-6 w-full rounded-xl bg-emerald-600 p-4 font-black text-white">Contact Support</button></div></div></div></main>;
}
function MemberWelcomePage({ setPage, setLoggedInMember }) {
  const checkoutSessionId = new URLSearchParams(window.location.search).get("session_id") || new URLSearchParams(window.location.search).get("checkout_session_id") || "";
  const [form, setForm] = useState({ organisation: "", contact_name: "", email: "", phone: "", depots: "", road_staff: "", tools_required: "Both", preferred_login_method: "Email verification code", notes: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  function updateField(e) { const { name, value } = e.target; setForm((current) => ({ ...current, [name]: value })); }
  async function submitOnboarding(e) {
    e.preventDefault();
    setMessage("");
    if (!supabase) { setMessage("Supabase is not configured. Please contact support."); return; }
    setIsSubmitting(true);
    const onboarding = { ...form, status: "New", stripe_session_id: checkoutSessionId || null };
    const member = { organisation: form.organisation, contact_name: form.contact_name, email: form.email, username: form.email, phone: form.phone, plan: "Compliance Hub Setup", payment_status: "Paid", subscription_status: "Pending", onboarding_status: "New", is_active: false, setup_status: "Pending", med_app_status: "Pending", journey_app_status: "Pending", stripe_session_id: checkoutSessionId || null };
    const { error: onboardingError } = await supabase.from("member_onboarding").insert(onboarding);
    const { data: memberData, error: memberError } = await supabase.from("members").upsert(member, { onConflict: "email" }).select("id, organisation, contact_name, email, phone, plan, payment_status, setup_status, med_app_status, journey_app_status, med_app_url, journey_app_url").single();
    setIsSubmitting(false);
    if (onboardingError || memberError) { setMessage(onboardingError?.message || memberError?.message || "Unable to submit onboarding."); return; }
    setLoggedInMember(memberData);
    setMessage("Onboarding submitted. Your secure member access is now being prepared.");
  }
  const gatewayCards = [{ title: "Medication Tracking App", text: "Track medication due, administered, missed, refused or escalated. Keep clear records to support safeguarding, accountability and compliance." }, { title: "Journey Tracking App", text: "Record attendance, route activity, wheelchair safety checks, incidents, end-of-journey checks and audit-ready journey evidence." }];
  return <main className="min-h-screen bg-slate-50 text-slate-950"><section className="bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20"><div className="mx-auto max-w-5xl"><p className="font-semibold text-emerald-300">Member Welcome</p><h1 className="mt-4 text-3xl font-black sm:text-4xl md:text-6xl">Welcome to ACE Compliance Hub</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">Your access request has been received. You are now one step closer to running a safer, more compliant and better evidenced transport operation.</p><div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-6 leading-7 text-slate-200"><p>Payment has secured access to the £495 setup package. ACE MiDAS Training will configure your compliance access and send secure login instructions by email. For security, login uses a verification code or secure login link.</p></div></div></section><section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 lg:grid-cols-2">{gatewayCards.map((card) => <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><p className="font-semibold text-emerald-700">{card.title}</p><p className="mt-4 leading-7 text-slate-600">{card.text}</p><p className="mt-6 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">Status: Setup pending</p><button type="button" onClick={() => document.getElementById("member-onboarding")?.scrollIntoView({ behavior: "smooth" })} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Continue Onboarding</button></div>)}</section><section id="member-onboarding" className="px-6 pb-20"><form onSubmit={submitOnboarding} className="mx-auto grid max-w-5xl gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-2xl font-black sm:text-3xl">Access setup details</h2>{message ? <p className={`rounded-xl p-3 text-sm font-semibold ${message.startsWith("Onboarding submitted") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation name" required /><input name="contact_name" value={form.contact_name} onChange={updateField} className="rounded-xl border p-3" placeholder="Main contact name" required /></div><div className="grid gap-4 sm:grid-cols-2"><input type="email" name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email address" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone number" /></div><div className="grid gap-4 sm:grid-cols-2"><input name="depots" value={form.depots} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of depots/sites" /><input name="road_staff" value={form.road_staff} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of road staff" /></div><div className="grid gap-4 sm:grid-cols-2"><select name="tools_required" value={form.tools_required} onChange={updateField} className="rounded-xl border p-3"><option>Medication Tracking App</option><option>Journey Tracking App</option><option>Both</option></select><select name="preferred_login_method" value={form.preferred_login_method} onChange={updateField} className="rounded-xl border p-3"><option>Email verification code</option><option>Phone verification code</option></select></div><textarea name="notes" value={form.notes} onChange={updateField} className="rounded-xl border p-3" rows={5} placeholder="Any notes about your operation" /><button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-emerald-600 p-4 font-black text-white disabled:opacity-60">{isSubmitting ? "Submitting..." : "Request Access Setup"}</button><button type="button" onClick={() => setPage("Login")} className="w-full rounded-xl border p-4 font-bold text-slate-700">Go to Secure Member Login</button></form></section></main>;
}
function OnboardingPage({ setPage }) { const [submitted, setSubmitted] = useState(false); return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-5xl"><div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl"><p className="font-semibold text-emerald-300">Compliance Hub Onboarding</p><h1 className="mt-3 text-3xl font-black sm:text-4xl md:text-6xl">Tell us how your depot/site needs to be set up.</h1></div><div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">{submitted ? <div className="py-10 text-center"><h2 className="text-2xl font-black sm:text-3xl text-emerald-600">Onboarding details submitted ✓</h2><button type="button" onClick={() => setPage("MemberDashboard")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Dashboard</button></div> : <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="grid gap-4"><h2 className="text-2xl font-bold">Onboarding Form</h2><input className="rounded-xl border p-3" placeholder="Organisation name" required /><input className="rounded-xl border p-3" placeholder="Main contact name" required /><input className="rounded-xl border p-3" placeholder="Email address" required /><input className="rounded-xl border p-3" placeholder="How many depots/sites?" required /><textarea className="rounded-xl border p-3" rows={4} placeholder="Depot/site names, modules needed, notes." /><button type="submit" className="w-full rounded-xl bg-emerald-600 p-4 font-black text-white">Submit Onboarding Details</button></form>}</div></div></main>; }
function ReviewsPage({ reviews, setReviews }) {
  const visible = reviews.filter((r) => r.status === "Published");
  const [form, setForm] = useState({ name: "", organisation: "", rating: "★★★★★", content: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  function updateField(e) { const { name, value } = e.target; setForm((current) => ({ ...current, [name]: value })); }
  async function submitReview(e) {
    e.preventDefault();
    setMessage("");
    if (!supabase) {
      setMessage("Supabase is not configured. Please try again later.");
      return;
    }
    setIsSubmitting(true);
    const review = { rating: form.rating, name: form.name.trim(), organisation: form.organisation.trim(), content: form.content.trim(), status: "Draft" };
    const { data, error } = await supabase.from("reviews").insert(review).select("id, rating, name, organisation, content, status, created_at").single();
    setIsSubmitting(false);
    if (error) {
      setMessage(error.message || "Unable to submit review.");
      return;
    }
    const savedReview = data || review;
    setReviews((current) => [{ id: savedReview.id, rating: savedReview.rating || "★★★★★", name: savedReview.name || "Reviewer", org: savedReview.organisation || "Organisation", text: savedReview.content || "", status: savedReview.status || "Draft" }, ...current]);
    setForm({ name: "", organisation: "", rating: "★★★★★", content: "" });
    setMessage("Thank you. Your review has been submitted and will be reviewed before publishing.");
  }
  return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="font-semibold text-emerald-600">Reviews & Ratings</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl md:text-6xl">Trusted by transport and education teams</h1></div><div className="mt-12 grid gap-6 md:grid-cols-3">{visible.map((review) => <div key={review.id || `${review.name}-${review.org}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><p className="text-xl text-amber-500">{review.rating}</p><p className="mt-4 text-base leading-relaxed text-slate-700">“{review.text}”</p><p className="mt-6 text-xl font-bold">{review.name}</p><p className="text-sm leading-relaxed text-slate-500">{review.org}</p></div>)}</div><form onSubmit={submitReview} className="mx-auto mt-12 grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="text-2xl font-black">Submit a Review</h2>{message ? <p className={`rounded-xl p-3 text-sm font-semibold ${message.startsWith("Thank you") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="name" value={form.name} onChange={updateField} className="rounded-xl border p-3" placeholder="Name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" /></div><select name="rating" value={form.rating} onChange={updateField} className="rounded-xl border p-3"><option>★</option><option>★★</option><option>★★★</option><option>★★★★</option><option>★★★★★</option></select><textarea name="content" value={form.content} onChange={updateField} className="rounded-xl border p-3" rows={5} placeholder="Review message" required /><button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSubmitting ? "Submitting..." : "Submit Review"}</button></form></div></main>;
}
function createBlogSlug(post) {
  return (post.title || "blog-post")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "blog-post";
}

function createExcerpt(text, limit = 180) {
  const cleanText = (text || "").replace(/\s+/g, " ").trim();
  if (cleanText.length <= limit) return cleanText;
  return `${cleanText.slice(0, limit).replace(/\s+\S*$/, "")}...`;
}

function BlogPage({ posts, openBlogPost }) {
  const visible = posts.filter((p) => p.status === "Published");
  return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-7xl"><p className="font-semibold text-emerald-600">Blog</p><h1 className="mt-3 max-w-4xl text-3xl font-bold sm:text-4xl md:text-6xl">Insights for passenger transport training and compliance</h1><div className="mt-12 grid gap-6 md:grid-cols-3">{visible.map((post) => <article key={post.id || post.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><p className="text-sm font-semibold text-emerald-600">{post.tag}</p><h2 className="mt-3 text-2xl font-bold">{post.title}</h2><p className="mt-3 text-base leading-relaxed text-slate-600">{createExcerpt(post.text)}</p><button type="button" onClick={() => openBlogPost(post)} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Read More</button></article>)}</div></div></main>;
}

function BlogDetailPage({ post, setPage }) {
  if (!post) return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><p className="font-semibold text-emerald-600">Blog</p><h1 className="mt-3 text-2xl font-black sm:text-3xl">Blog post not found</h1><p className="mt-4 leading-relaxed text-slate-600">The post may have been unpublished or moved.</p><button type="button" onClick={() => setPage("Blog")} className="mt-8 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">← Back to Blogs</button></div></main>;
  return <main className="min-h-screen bg-slate-50 px-4 py-14 sm:px-6 sm:py-20"><article className="mx-auto max-w-3xl"><button type="button" onClick={() => setPage("Blog")} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm">← Back to Blogs</button><div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><p className="text-sm font-semibold text-emerald-600">{post.tag}</p><h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">{post.title}</h1><div className="mt-8 whitespace-pre-wrap text-base leading-8 text-slate-700">{post.text}</div></div></article></main>;
}
function ContactPage({ siteSettings }) {
  const [form, setForm] = useState({ fullName: "", organisation: "", email: "", phone: "", enquiryType: "Training", message: "" });
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  function updateField(e) { const { name, value } = e.target; setForm((current) => ({ ...current, [name]: value })); }
  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setErrorMessage("");
    setIsSubmitting(true);
    try {
      if (!CONTACT_FORM_FUNCTION_URL) throw new Error("Contact form is not configured.");
      const response = await fetch(CONTACT_FORM_FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.fullName,
          organisation: form.organisation,
          email: form.email,
          phone: form.phone,
          enquiryType: form.enquiryType,
          message: form.message,
          source: "website"
        })
      });
      const data = await safeReadJson(response, "Sorry, your enquiry could not be sent. Please email us directly.");
      if (!response.ok || data.error) throw new Error(data.error || "Unable to submit enquiry");
      setForm({ fullName: "", organisation: "", email: "", phone: "", enquiryType: "Training", message: "" });
      setStatus("success");
    } catch (contactError) {
      setErrorMessage(contactError.message || "Sorry, your enquiry could not be sent. Please email us directly.");
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <main id="contact" className="min-h-screen bg-emerald-500 px-4 py-14 text-slate-950 sm:px-6 sm:py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><h1 className="text-3xl font-black sm:text-4xl md:text-6xl">{siteSettings.contactDisplayText}</h1><p className="mt-4 text-lg">Email: {siteSettings.contactEmail}</p><p>Phone: {siteSettings.phone}</p><p>Address: {siteSettings.address}</p><img src={images.handshake} alt="Handshake" className="mt-8 h-56 w-full rounded-2xl object-cover sm:h-[300px] sm:rounded-[2rem]" /></div><form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-6"><h2 className="text-2xl font-black">Send an enquiry</h2>{status === "success" ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Thanks, your enquiry has been sent.</p> : null}{status === "error" ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{errorMessage || "Sorry, your enquiry could not be sent. Please email us directly."}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="fullName" value={form.fullName} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" /></div><div className="grid gap-4 sm:grid-cols-2"><input type="email" name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone" /></div><select name="enquiryType" value={form.enquiryType} onChange={updateField} className="rounded-xl border p-3"><option>Training</option><option>Compliance Hub</option><option>Membership</option><option>Booking</option><option>Other</option></select><textarea name="message" value={form.message} onChange={updateField} className="rounded-xl border p-3" rows={5} placeholder="Message" required /><button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSubmitting ? "Sending..." : "Send Enquiry"}</button></form></div></main>;
}

function BackOfficePage({ setPage, posts, setPosts, reviews, setReviews, siteSettings, setSiteSettings, mediaSettings, setMediaSettings, loginNonce }) {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [blogForm, setBlogForm] = useState({ tag: "", title: "", content: "", status: "Draft" });
  const [reviewForm, setReviewForm] = useState({ rating: "", name: "", organisation: "", content: "", status: "Draft" });
  const [memberForm, setMemberForm] = useState({ organisation: "", contact_name: "", email: "", username: "", subscription_status: "Pending", onboarding_status: "New", is_active: false, admin_password_reference: generateAdminReference(), med_app_url: "", journey_app_url: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [members, setMembers] = useState(initialMembers);
  const [activity, setActivity] = useState(initialActivity);
  const [tcOrganisations, setTcOrganisations] = useState([]);
  const [tcMembers, setTcMembers] = useState([]);
  const [tcCourses, setTcCourses] = useState([]);
  const [tcRecords, setTcRecords] = useState([]);
  const [trainingEvidence, setTrainingEvidence] = useState([]);
  const [trainingReminders, setTrainingReminders] = useState([]);
  const [trainingReminderLogs, setTrainingReminderLogs] = useState([]);
  const [agentActivityLogs, setAgentActivityLogs] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [followUpTasks, setFollowUpTasks] = useState([]);
  const [roryResearchRuns, setRoryResearchRuns] = useState([]);
  const [rorySearchTheme, setRorySearchTheme] = useState(RORY_SEARCH_THEME_OPTIONS[0]);
  const [roryLocationFocus, setRoryLocationFocus] = useState("London");
  const [roryImportText, setRoryImportText] = useState("");
  const [roryResearchBusy, setRoryResearchBusy] = useState(false);
  const [roryResearchStatus, setRoryResearchStatus] = useState(null);
  const [roryDuplicateWarnings, setRoryDuplicateWarnings] = useState([]);
  const [roryProspectServiceFilter, setRoryProspectServiceFilter] = useState("");
  const [roryProspectStatusFilter, setRoryProspectStatusFilter] = useState("");
  const [roryProspectLocationFilter, setRoryProspectLocationFilter] = useState("");
  const [selectedRoryProspectIds, setSelectedRoryProspectIds] = useState([]);
  const [miaEmailPreview, setMiaEmailPreview] = useState(null);
  const [miaEmailPreviewBusy, setMiaEmailPreviewBusy] = useState("");
  const defaultProspectForm = { organisation_name: "", website: "", location: "", region: "", sector: "schools", likely_training_need: "", recommended_service: "First Aid", contact_email: "", phone: "", decision_maker_name: "", source_url: "", notes: "", outreach_brief: "", priority: "medium", relevance_reason: "", review_status: "pending_review", status: "new", do_not_contact: false };
  const [prospectForm, setProspectForm] = useState(defaultProspectForm);
  const [contentDrafts, setContentDrafts] = useState([]);
  const [niaDraftForm, setNiaDraftForm] = useState({ platform: "LinkedIn", topic: "refresher training", target_audience: "schools and SEND transport providers", content_type: "Awareness post", tone: "confident, professional, warm, modern and non-pushy", call_to_action: "Visit the training page or contact ACE MiDAS Training to discuss training support." });
  const [niaCurrentDraft, setNiaCurrentDraft] = useState(null);
  const [niaBusy, setNiaBusy] = useState("");
  const [inboundMessages, setInboundMessages] = useState([]);
  const [manualInboundForm, setManualInboundForm] = useState({ from_name: "", from_email: "", organisation: "", subject: "", message_body: "" });
  const [replyIntake, setReplyIntake] = useState([]);
  const [replyForm, setReplyForm] = useState({ organisation_id: "", member_id: "", training_record_id: "", contact_name: "", contact_email: "", message: "", notes: "" });
  const [replyApprovalNotes, setReplyApprovalNotes] = useState({});
  const [theoDecisionFields, setTheoDecisionFields] = useState({});
  const [tcOrgForm, setTcOrgForm] = useState({ name: "", contact_name: "", contact_email: "", phone: "" });
  const [tcMemberForm, setTcMemberForm] = useState({ organisation_id: "", full_name: "", email: "", role: "" });
  const [tcRecordForm, setTcRecordForm] = useState({ organisation_id: "", member_id: "", course_id: "", date_completed: "", date_completed_display: "" });
  const [tcFilters, setTcFilters] = useState({ organisation_id: "", course_id: "", status: "", quick: "" });
  const [riskFilter, setRiskFilter] = useState("");
  const [selectedTheoTraceId, setSelectedTheoTraceId] = useState("");
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ lastSaveResponse: null, lastFetchCount: null, lastSavedSettingTimestamp: null });
  const [exportPreviewOpen, setExportPreviewOpen] = useState(false);
  const [reportStatusPanel, setReportStatusPanel] = useState(null);
  const [generatingReport, setGeneratingReport] = useState("");
  const [selectedReportOrganisationId, setSelectedReportOrganisationId] = useState("");
  const [reportHistory, setReportHistory] = useState([]);
  const [selectedReportHistory, setSelectedReportHistory] = useState(null);
  const [isRefreshingReports, setIsRefreshingReports] = useState(false);
  const [selectedEvidenceRecordId, setSelectedEvidenceRecordId] = useState("");
  const [evidenceBusyId, setEvidenceBusyId] = useState("");
  const [agentWorkflowRunning, setAgentWorkflowRunning] = useState(false);
  const [miaWorkflowStats, setMiaWorkflowStats] = useState(null);
  const [miaKbEntries, setMiaKbEntries] = useState([]);
  const [miaVisitorQuestions, setMiaVisitorQuestions] = useState([]);
  const [miaKbBusy, setMiaKbBusy] = useState("");
  const [miaKbEntryForm, setMiaKbEntryForm] = useState({ category: "", title: "", question: "", approved_answer: "", keywords: "", source: "Back Office", status: "approved", priority: 50, confidence_threshold: 35 });
  const [avaSummaryBusy, setAvaSummaryBusy] = useState("");
  const [avaSummaryResult, setAvaSummaryResult] = useState(null);
  const [avaDailySummaryResult, setAvaDailySummaryResult] = useState(null);
  const [avaWeeklySummaryResult, setAvaWeeklySummaryResult] = useState(null);
  const [avaCheckRunning, setAvaCheckRunning] = useState(false);
  const [avaCheckResult, setAvaCheckResult] = useState(null);
  const [agentIdentities, setAgentIdentities] = useState(DEFAULT_AGENT_IDENTITIES);
  const [aiRules, setAiRules] = useState({
    ava: { approvalRequired: false, allowedActions: "Internal-only compliance monitoring and concise admin summaries. Answer the main risk first, give one clear next step, and avoid repeating the same compliance instruction.", forbiddenActions: "Email customers, confirm bookings, alter training records, delete evidence, send payment links", escalationTriggers: "Expired training, missing certificates, failed reminders, urgent organisations, records expiring within 7 days" },
    mia: { approvalRequired: false, allowedActions: "Send standard refresher reminders and follow-up emails within approved wording. Keep replies warm and concise: answer first, ask for missing information once, and give one next step.", forbiddenActions: "Confirm dates, promise availability, change pricing, confirm bookings, send custom payment links", escalationTriggers: "Any booking/date/payment wording or non-standard customer request" },
    theo: { approvalRequired: false, allowedActions: "Answer safe booking process questions, qualify booking leads, explain group or onsite training, refer to the training page no more than once, and calculate indicative estimates only from configured pricing rules. Use one direct answer and one next step instead of repeating booking, pricing and information requests.", forbiddenActions: "Confirm training dates, promise availability, confirm bookings, change bookings, cancel bookings, agree custom prices, confirm final quotes, offer non-standard discounts, send/request custom Stripe links", escalationTriggers: "Exact dates, confirmed availability, booking confirmations, booking changes, cancellations, pricing exceptions, custom discounts, custom prices, final quote/payment amount, payment links" },
    nia: { approvalRequired: false, allowedActions: "Create promotional content ideas, draft posts and summarise opportunities in natural concise language with one practical next step.", forbiddenActions: "Publish public pages without review, change pricing, alter legal copy", escalationTriggers: "Legal wording, safeguarding wording, council-facing claims" },
    ellis: { approvalRequired: false, allowedActions: "Categorise emails, summarise useful leads and ignore low-value B2B spam. Keep internal notes concise and avoid repeating routing rationale.", forbiddenActions: "Send replies, confirm bookings, attach private files", escalationTriggers: "Complaint, safeguarding concern, payment dispute, booking confirmation" },
    rory: { approvalRequired: false, allowedActions: "Research publicly available UK organisations, organise structured prospect records and explain relevance briefly with one clear review next step.", forbiddenActions: "Scrape private data, buy lead lists, send outreach, collect personal data that is not publicly available", escalationTriggers: "Unclear data source, personal contact details, outreach request, high-priority council or safeguarding prospect" }
  });
  const [exportOptions, setExportOptions] = useState({
    type: "full_compliance",
    includeStats: true,
    fields: {
      organisation_name: true,
      contact_name: true,
      contact_email: true,
      phone: true,
      full_name: true,
      email: true,
      role: true,
      organisation: true,
      course_name: true,
      date_completed: true,
      expiry_date: true,
      status: true
    },
    filters: {
      organisation_id: "",
      member_id: "",
      course_id: "",
      status: "",
      quick: "",
      completed_from: "",
      completed_to: "",
      expiry_from: "",
      expiry_to: ""
    }
  });
  const settings = siteSettings;

  const tabs = ["Dashboard", "Blogs", "Reviews", "Onboarding", "Members", "Training Compliance", "Reports & Exports", "Export Centre", "Depot Tokens", "Activity", "AI Operations", "Mia Knowledge Base", "Ava Compliance Centre", "Nia Content Studio", "Rory Prospecting Centre", "Workflow Debug Trace", "Media Manager", "Settings"];
  const statusOptions = ["Pending", "In Progress", "Active", "Complete", "Paused"];
  const subscriptionStatusOptions = ["Active", "Pending", "Suspended", "Cancelled"];
  const onboardingStatusOptions = ["New", "In Progress", "Completed"];
  const depotTokens = members.filter((member) => member.journey_app_url || member.med_app_url).map((member) => ({
    organisation: member.organisation,
    token: (member.journey_app_url || member.med_app_url).split("token=")[1] || member.journey_app_url || member.med_app_url,
    url: member.journey_app_url || member.med_app_url
  }));
  const tcOrganisationMap = Object.fromEntries(tcOrganisations.map((org) => [org.id, org]));
  const tcMemberMap = Object.fromEntries(tcMembers.map((member) => [member.id, member]));
  const tcCourseMap = Object.fromEntries(tcCourses.map((course) => [course.id, course]));
  const trainingEvidenceMap = trainingEvidence.reduce((map, evidence) => {
    const recordId = evidence.training_record_id || "";
    if (!recordId) return map;
    if (!map[recordId]) map[recordId] = [];
    map[recordId].push(evidence);
    return map;
  }, {});
  const enrichedTrainingRecords = tcRecords.map((record) => {
    const staffMember = tcMemberMap[record.member_id];
    const organisation = tcOrganisationMap[staffMember?.organisation_id];
    const course = tcCourseMap[record.course_id];
    const expiryDate = record.expiry_date || addMonthsToDate(record.date_completed, course?.validity_months);
    return { ...record, organisation, staffMember, organisation_id: staffMember?.organisation_id || "", course, expiry_date: expiryDate, status: normaliseStatus(record.status || getTrainingStatus(expiryDate)) };
  });
  const todayForReports = new Date();
  todayForReports.setHours(0, 0, 0, 0);
  const filteredTrainingRecords = enrichedTrainingRecords.filter((record) => {
    if (tcFilters.organisation_id && record.staffMember?.organisation_id !== tcFilters.organisation_id) return false;
    if (tcFilters.course_id && record.course_id !== tcFilters.course_id) return false;
    if (tcFilters.status && record.status !== tcFilters.status) return false;
    if (tcFilters.quick === "expiring" && record.status !== "expiring") return false;
    if (tcFilters.quick === "expired" && record.status !== "expired") return false;
    if (riskFilter === "expired" && record.status !== "expired") return false;
    if (riskFilter === "expiring7") {
      if (!record.expiry_date) return false;
      const expiry = new Date(`${record.expiry_date}T00:00:00`);
      if (Number.isNaN(expiry.getTime())) return false;
      const daysUntilExpiry = Math.ceil((expiry.getTime() - todayForReports.getTime()) / 86400000);
      if (daysUntilExpiry < 0 || daysUntilExpiry > 7) return false;
    }
    if (riskFilter === "expiring30" && record.status !== "expiring") return false;
    if (riskFilter === "expiring60") {
      if (!record.expiry_date) return false;
      const expiry = new Date(`${record.expiry_date}T00:00:00`);
      if (Number.isNaN(expiry.getTime())) return false;
      const daysUntilExpiry = Math.ceil((expiry.getTime() - todayForReports.getTime()) / 86400000);
      if (daysUntilExpiry < 0 || daysUntilExpiry > 60) return false;
    }
    if (riskFilter === "expiring90") {
      if (!record.expiry_date) return false;
      const expiry = new Date(`${record.expiry_date}T00:00:00`);
      if (Number.isNaN(expiry.getTime())) return false;
      const daysUntilExpiry = Math.ceil((expiry.getTime() - todayForReports.getTime()) / 86400000);
      if (daysUntilExpiry < 0 || daysUntilExpiry > 90) return false;
    }
    if (riskFilter === "certMissing" && evidenceForRecord(record.id).length) return false;
    if (riskFilter === "certAttached" && !evidenceForRecord(record.id).length) return false;
    if (riskFilter === "reminderFailures" && !trainingReminders.some((reminder) => reminder.training_record_id === record.id && reminder.status === "failed") && !trainingReminderLogs.some((log) => log.training_record_id === record.id && log.status === "failed")) return false;
    return true;
  });
  const trainingSummary = {
    organisations: tcOrganisations.length,
    members: tcMembers.length,
    valid: enrichedTrainingRecords.filter((record) => record.status === "valid").length,
    expiring: enrichedTrainingRecords.filter((record) => record.status === "expiring").length,
    expired: enrichedTrainingRecords.filter((record) => record.status === "expired").length
  };
  const staffWithRecords = new Set(enrichedTrainingRecords.map((record) => record.member_id).filter(Boolean));
  const expiredTrainingRecords = enrichedTrainingRecords.filter((record) => record.status === "expired");
  const expiringWithinSevenDays = enrichedTrainingRecords.filter((record) => {
    if (!record.expiry_date) return false;
    const expiry = new Date(`${record.expiry_date}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return false;
    const daysUntilExpiry = Math.ceil((expiry.getTime() - todayForReports.getTime()) / 86400000);
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  });
  const expiringWithinThirtyDays = enrichedTrainingRecords.filter((record) => record.status === "expiring");
  const expiringWithinSixtyDays = enrichedTrainingRecords.filter((record) => {
    if (!record.expiry_date) return false;
    const expiry = new Date(`${record.expiry_date}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return false;
    const daysUntilExpiry = Math.ceil((expiry.getTime() - todayForReports.getTime()) / 86400000);
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 60;
  });
  const expiringWithinNinetyDays = enrichedTrainingRecords.filter((record) => {
    if (!record.expiry_date) return false;
    const expiry = new Date(`${record.expiry_date}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return false;
    const daysUntilExpiry = Math.ceil((expiry.getTime() - todayForReports.getTime()) / 86400000);
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
  });
  const missingTrainingMembers = tcMembers.filter((member) => !staffWithRecords.has(member.id));
  const fullyCompliantStaff = tcMembers.filter((member) => {
    const records = enrichedTrainingRecords.filter((record) => record.member_id === member.id);
    return records.length > 0 && records.every((record) => record.status === "valid");
  });
  const compliancePercentage = enrichedTrainingRecords.length ? Math.round((trainingSummary.valid / enrichedTrainingRecords.length) * 100) : 0;
  const certificateMissingRecords = enrichedTrainingRecords.filter((record) => !evidenceForRecord(record.id).length);
  const certificateAttachedRecords = enrichedTrainingRecords.filter((record) => evidenceForRecord(record.id).length);
  const reminderFailureRecordIds = new Set([
    ...trainingReminders.filter((reminder) => reminder.status === "failed").map((reminder) => reminder.training_record_id).filter(Boolean),
    ...trainingReminderLogs.filter((log) => log.status === "failed").map((log) => log.training_record_id).filter(Boolean)
  ]);
  const reminderFailureRecords = enrichedTrainingRecords.filter((record) => reminderFailureRecordIds.has(record.id));
  const urgentOrganisationNames = [...new Set([...expiredTrainingRecords, ...expiringWithinSevenDays, ...certificateMissingRecords].map((record) => record.organisation?.name).filter(Boolean))];

  function applyRiskFilter(filter) {
    setRiskFilter(filter);
    setActivity((current) => [`Risk dashboard filter applied: ${filter}`, ...current]);
  }

  function clearRiskFilter() {
    setRiskFilter("");
    setTcFilters({ organisation_id: "", course_id: "", status: "", quick: "" });
    showMessage("success", "Training compliance filters cleared.");
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const safeAgentActivityLogs = asArray(agentActivityLogs).map((log) => ({ ...asObject(log), metadata: asObject(asObject(log).metadata) }));
  const safeInboundMessages = asArray(inboundMessages).map((message) => asObject(message));
  const safeReplyIntake = asArray(replyIntake).map((reply) => asObject(reply));
  const safeProspects = asArray(prospects).map((prospect) => asObject(prospect));
  const safeFollowUpTasks = asArray(followUpTasks).map((task) => asObject(task));
  const safeRoryResearchRuns = asArray(roryResearchRuns).map((run) => asObject(run));
  const safeContentDrafts = asArray(contentDrafts).map((draft) => asObject(draft));
  const safeMiaKbEntries = asArray(miaKbEntries).map((entry) => asObject(entry));
  const safeMiaVisitorQuestions = asArray(miaVisitorQuestions).map((question) => ({ ...asObject(question), matched_knowledge_base_entries: asArray(asObject(question).matched_knowledge_base_entries) }));
  const miaNeedsReviewQuestions = safeMiaVisitorQuestions.filter((question) => question.needs_review || question.status === "Needs admin review");
  const miaLeadQuestions = safeMiaVisitorQuestions.filter((question) => question.email || question.phone || question.organisation);
  const safeOnboarding = asArray(onboarding).map((item) => asObject(item));
  const agentLogsToday = safeAgentActivityLogs.filter((log) => String(log.created_at || "").startsWith(todayKey));
  const agentLogsFor = (agentKey) => safeAgentActivityLogs.filter((log) => log.agent_key === agentKey);
  const agentLogsTodayFor = (agentKey) => agentLogsToday.filter((log) => log.agent_key === agentKey);
  const pendingProspects = safeProspects.filter((prospect) => (prospect.review_status || "pending_review") === "pending_review");
  const highPriorityProspects = safeProspects.filter((prospect) => prospect.priority === "high" && !prospect.do_not_contact && !["rejected", "do_not_contact"].includes(prospect.status || prospect.review_status || ""));
  const qualifiedProspectsForMia = highPriorityProspects.filter((prospect) => !prospect.assigned_to && !["ready_for_outreach", "contacted"].includes(prospect.status || ""));
  const readyForMiaProspects = safeProspects.filter((prospect) => prospect.status === "ready_for_outreach" || prospect.assigned_to === "Mia");
  const contactedProspects = safeProspects.filter((prospect) => prospect.status === "contacted" || prospect.last_contacted_at);
  const doNotContactProspects = safeProspects.filter((prospect) => prospect.do_not_contact || prospect.status === "do_not_contact");
  const prospectMatchesServiceFilter = (prospect) => {
    if (!roryProspectServiceFilter) return true;
    const filter = roryProspectServiceFilter.toLowerCase();
    const service = String(prospect.recommended_service || "").toLowerCase();
    const need = String(prospect.likely_training_need || "").toLowerCase();
    const notes = String(prospect.notes || "").toLowerCase();
    return service === filter || need.includes(filter) || notes.includes(filter);
  };
  const prospectMatchesOutreachStatusFilter = (prospect) => {
    if (!roryProspectStatusFilter) return true;
    const status = String(prospect.status || prospect.review_status || "new").toLowerCase();
    if (roryProspectStatusFilter === "not_contacted") return !prospect.last_contacted_at && !prospect.assigned_to && !["contacted", "ready_for_outreach", "pending_outreach", "pending_outreach_approval", "do_not_contact"].includes(status);
    if (roryProspectStatusFilter === "ready_for_outreach") return status === "ready_for_outreach" || status === "pending_outreach" || status === "pending_outreach_approval" || prospect.assigned_to === "Mia";
    if (roryProspectStatusFilter === "contacted") return status === "contacted" || Boolean(prospect.last_contacted_at);
    if (roryProspectStatusFilter === "follow_up_due") return Boolean(nextFollowUpForProspect(prospect));
    if (roryProspectStatusFilter === "do_not_contact") return prospect.do_not_contact || status === "do_not_contact";
    if (roryProspectStatusFilter === "high_priority") return prospect.priority === "high" && !prospect.do_not_contact;
    return true;
  };
  const prospectMatchesLocationFilter = (prospect) => {
    const filter = roryProspectLocationFilter.trim().toLowerCase();
    if (!filter) return true;
    const locationText = `${prospect.location || ""} ${prospect.region || ""} ${prospect.notes || ""}`.toLowerCase();
    return locationText.includes(filter);
  };
  const prospectMatchesLibraryFilters = (prospect) => prospectMatchesServiceFilter(prospect) && prospectMatchesOutreachStatusFilter(prospect) && prospectMatchesLocationFilter(prospect);
  const filteredProspects = safeProspects.filter(prospectMatchesLibraryFilters);
  const filteredHighPriorityProspects = highPriorityProspects.filter(prospectMatchesLibraryFilters);
  const filteredQualifiedProspectsForMia = qualifiedProspectsForMia.filter(prospectMatchesLibraryFilters);
  const roryProspectKey = (prospect) => String(prospect.id || prospect.organisation_name || "");
  const selectedRoryProspects = safeProspects.filter((prospect) => selectedRoryProspectIds.includes(roryProspectKey(prospect)));
  const visibleRoryProspectIds = filteredProspects.map(roryProspectKey).filter(Boolean);
  const selectedVisibleRoryProspects = filteredProspects.filter((prospect) => selectedRoryProspectIds.includes(roryProspectKey(prospect)));
  const allVisibleRoryProspectsSelected = Boolean(visibleRoryProspectIds.length) && visibleRoryProspectIds.every((id) => selectedRoryProspectIds.includes(id));
  const latestRoryResearchRun = safeRoryResearchRuns[0] || null;
  const theoReplyApprovals = safeReplyIntake.filter((reply) => reply.approval_required && (reply.approval_status || "pending") === "pending");
  const aiAgentCards = [
    { key: "ava", role: "Compliance Agent", status: "Active monitoring", actionsToday: agentLogsTodayFor("ava").length, pendingTasks: expiringWithinThirtyDays.length, approvalsRequired: 0, lastActivity: agentLogsFor("ava")[0]?.created_at ? formatDisplayDateTime(agentLogsFor("ava")[0].created_at) : "No activity yet" },
    { key: "mia", role: "Outreach Agent", status: "Approved reminders", actionsToday: agentLogsTodayFor("mia").length, pendingTasks: expiringWithinThirtyDays.length, approvalsRequired: 0, lastActivity: agentLogsFor("mia")[0]?.created_at ? formatDisplayDateTime(agentLogsFor("mia")[0].created_at) : "No reminders sent yet" },
    { key: "theo", role: "Training Bookings & Sales Coordinator", status: "Sales support with approval guardrails", actionsToday: agentLogsTodayFor("theo").length, pendingTasks: safeOnboarding.filter((item) => (item.status || "New") !== "Completed").length + theoReplyApprovals.length, approvalsRequired: safeOnboarding.length + theoReplyApprovals.length, lastActivity: agentLogsFor("theo")[0]?.created_at ? formatDisplayDateTime(agentLogsFor("theo")[0].created_at) : "Awaiting booking enquiry" },
    { key: "nia", role: "Content Agent", status: "Premium draft studio", actionsToday: agentLogsTodayFor("nia").length, pendingTasks: safeContentDrafts.filter((draft) => (draft.status || "draft") !== "used").length, approvalsRequired: 0, lastActivity: agentLogsFor("nia")[0]?.created_at ? formatDisplayDateTime(agentLogsFor("nia")[0].created_at) : "Ready for content drafts" },
    { key: "ellis", role: "Email Agent", status: "Structured placeholder", actionsToday: agentLogsTodayFor("ellis").length, pendingTasks: trainingReminderLogs.length, approvalsRequired: 0, lastActivity: agentLogsFor("ellis")[0]?.created_at ? formatDisplayDateTime(agentLogsFor("ellis")[0].created_at) : "Ready for inbox filtering" },
    { key: "rory", role: "Research Agent", status: "Prospect research", actionsToday: agentLogsTodayFor("rory").length, pendingTasks: pendingProspects.length, approvalsRequired: pendingProspects.length, lastActivity: agentLogsFor("rory")[0]?.created_at ? formatDisplayDateTime(agentLogsFor("rory")[0].created_at) : "Ready to organise prospects" }
  ].map((agent) => ({
    ...agent,
    name: agentIdentities[agent.key]?.name || DEFAULT_AGENT_IDENTITIES[agent.key]?.name || agent.key,
    title: agentIdentities[agent.key]?.title || DEFAULT_AGENT_IDENTITIES[agent.key]?.title || agent.role,
    tone: agentIdentities[agent.key]?.tone || "",
    signature: agentIdentities[agent.key]?.signature || "",
    avatar: agentIdentities[agent.key]?.avatar || agent.key.slice(0, 1).toUpperCase()
  }));
  const aiApprovalQueue = [
    { id: "theo-booking-date-approval", agent: "Theo", task: "Review preferred training dates before sending final confirmation", risk: "Theo cannot confirm dates automatically", count: safeOnboarding.length },
    { id: "theo-payment-link-approval", agent: "Theo", task: "Review any custom payment link or custom price request", risk: "Custom pricing/payment decisions require human approval", count: safeOnboarding.filter((item) => String(item.notes || "").toLowerCase().includes("price") || String(item.notes || "").toLowerCase().includes("payment")).length },
    { id: "failed-reminder-review", agent: "Mia", task: "Review failed reminder notifications before retry", risk: "Failed emails may need manual contact", count: reminderFailureRecords.length },
    { id: "rory-prospect-review", agent: "Rory", task: "Review high-priority researched prospects before outreach", risk: "Rory organises leads only and never sends outreach automatically", count: highPriorityProspects.length },
    { id: "theo-reply-approval", agent: "Theo", task: "Review customer replies asking for dates, booking, pricing or payment actions", risk: "Theo cannot confirm dates, availability, pricing or payment links automatically", count: theoReplyApprovals.length }
  ].filter((item) => item.count > 0);

  const remindersSentToday = agentLogsTodayFor("mia").filter((log) => log.action_type === "mia_refresher_sent").length;
  const avaDailySummariesToday = agentLogsTodayFor("ava").filter((log) => ["ava_daily_summary_generated", "ava_daily_summary_sent"].includes(log.action_type)).length;
  const avaWeeklySummariesToday = agentLogsTodayFor("ava").filter((log) => ["ava_weekly_summary_generated", "ava_weekly_summary_sent"].includes(log.action_type)).length;
  const avaComplianceChecksToday = agentLogsTodayFor("ava").filter((log) => log.action_type === "ava_compliance_check_completed").length;
  const latestAvaCheckLog = agentLogsFor("ava").find((log) => log.action_type === "ava_compliance_check_completed");
  const latestAvaDailyLog = agentLogsFor("ava").find((log) => ["ava_daily_summary_sent", "ava_daily_summary_generated"].includes(log.action_type));
  const latestAvaWeeklyLog = agentLogsFor("ava").find((log) => ["ava_weekly_summary_sent", "ava_weekly_summary_generated"].includes(log.action_type));
  const latestAvaDailySummary = asObject(avaDailySummaryResult?.summary || latestAvaDailyLog?.metadata?.summary);
  const latestAvaWeeklySummary = asObject(avaWeeklySummaryResult?.summary || latestAvaWeeklyLog?.metadata?.summary);
  const emailsFilteredToday = agentLogsTodayFor("ellis").filter((log) => log.action_type === "email_filtered").length;
  const contentDraftsToday = agentLogsTodayFor("nia").filter((log) => ["content_draft_created", "content_draft_saved"].includes(log.action_type)).length;
  const contentDraftsUsedToday = agentLogsTodayFor("nia").filter((log) => log.action_type === "content_draft_marked_used").length;
  const weeklyPlansGeneratedToday = agentLogsTodayFor("nia").filter((log) => log.action_type === "weekly_content_plan_generated").length;
  const prospectsAddedToday = agentLogsTodayFor("rory").filter((log) => ["prospect_added", "prospect_updated"].includes(log.action_type)).length;
  const prospectsPassedToMiaToday = agentLogsTodayFor("rory").filter((log) => log.action_type === "prospect_sent_to_mia").length;
  const roryResearchRunsToday = agentLogsTodayFor("rory").filter((log) => log.action_type === "rory_research_run_completed").length;
  const roryProviderIssuesToday = agentLogsTodayFor("rory").filter((log) => ["rory_research_provider_not_configured", "rory_research_error"].includes(log.action_type)).length;
  const roryProspectsFoundToday = agentLogsTodayFor("rory").filter((log) => log.action_type === "rory_prospect_saved").length;
  const prospectOutreachSentToday = agentLogsTodayFor("mia").filter((log) => log.action_type === "mia_prospect_outreach_sent").length;
  const prospectFollowUpsScheduledToday = agentLogsTodayFor("mia").filter((log) => log.action_type === "follow_up_scheduled").length;
  const prospectDoNotContactToday = agentLogsTodayFor("mia").filter((log) => log.action_type === "prospect_do_not_contact_marked").length;
  const repliesClassifiedToday = agentLogsToday.filter((log) => ["reply_classified", "reply_requires_approval"].includes(log.action_type)).length;
  const theoResponsesSentToday = agentLogsTodayFor("theo").filter((log) => ["theo_response_sent", "theo_auto_response_sent"].includes(log.action_type)).length;
  const theoBookingEnquiriesHandledToday = agentLogsTodayFor("theo").filter((log) => log.action_type === "theo_enquiry_received").length;
  const theoEstimatesProvidedToday = agentLogsTodayFor("theo").filter((log) => log.action_type === "theo_pricing_estimate_calculated").length;
  const theoTrainingPageReferralsToday = agentLogsTodayFor("theo").filter((log) => log.action_type === "theo_training_page_referred").length;
  const inboundToday = safeInboundMessages.filter((item) => String(item.created_at || "").startsWith(todayKey));
  const messagesReceivedToday = inboundToday.length;
  const messagesRoutedToday = inboundToday.filter((item) => item.status === "routed" || item.status === "pending_approval").length;
  const spamFilteredToday = inboundToday.filter((item) => item.classification === "spam/B2B irrelevant" || item.status === "archived").length;
  const theoApprovalsCreatedToday = inboundToday.filter((item) => item.assigned_agent === "theo" && item.approval_required).length;
  const bookingApprovalsNeeded = aiApprovalQueue.filter((item) => item.agent === "Theo").reduce((total, item) => total + item.count, 0);
  const theoDecisionTraceLogs = safeAgentActivityLogs.filter((log) => log.agent_key === "theo" && (log.action_type === "theo_decision_trace" || asObject(log.metadata).theo_trace));
  const theoTraceForInbound = (inboundId) => theoDecisionTraceLogs.find((log) => (asObject(asObject(log.metadata).theo_trace).inbound_message_id || asObject(log.metadata).inbound_message_id) === inboundId);
  const selectedTheoTraceLog = selectedTheoTraceId ? theoTraceForInbound(selectedTheoTraceId) : theoDecisionTraceLogs[0];
  const selectedTheoTrace = asObject(asObject(selectedTheoTraceLog?.metadata).theo_trace);
  const hasSelectedTheoTrace = Boolean(selectedTheoTraceLog && Object.keys(selectedTheoTrace).length);
  const selectedTheoInbound = hasSelectedTheoTrace ? safeInboundMessages.find((message) => message.id === selectedTheoTrace.inbound_message_id) : null;

  function openTheoDecisionTrace(inboundId) {
    setSelectedTheoTraceId(inboundId);
    setActiveTab("Workflow Debug Trace");
  }

  function updateAiRule(agentKey, field, value) {
    setAiRules((current) => ({ ...current, [agentKey]: { ...current[agentKey], [field]: value } }));
  }

  function updateAgentIdentity(agentKey, field, value) {
    setAgentIdentities((current) => ({ ...current, [agentKey]: { ...current[agentKey], [field]: value } }));
  }

  function simulateAiApproval(item, decision) {
    setActivity((current) => [`AI Operations: ${decision} simulated for ${item.agent} - ${item.task}`, ...current]);
    showMessage("success", `${decision} recorded in simulation mode. No live action was sent.`);
  }

  async function runAvaMiaWorkflow() {
    setAgentWorkflowRunning(true);
    try {
      const { response, result } = await callAdminAction("run-ava-mia-workflow");
      if (!response.ok) {
        console.error("Ava/Mia workflow error:", result);
        showMessage("error", result.error || "Ava/Mia workflow could not run.");
        return;
      }
      await loadTrainingComplianceData({ quiet: true });
      setMiaWorkflowStats(result);
      setActivity((current) => [`Mia auto-send complete: ${result.remindersFound || 0} found, ${result.emailsSent || 0} sent, ${result.skippedDuplicates || 0} duplicate(s), ${result.failedSends || 0} failed`, ...current]);
      showMessage("success", `Mia auto-send complete. ${result.emailsSent || 0} email(s) sent.`);
    } catch (error) {
      console.error("Ava/Mia workflow error:", error);
      showMessage("error", "Ava/Mia workflow could not run.");
    } finally {
      setAgentWorkflowRunning(false);
    }
  }

  async function sendAvaSummary(type) {
    setAvaSummaryBusy(`send-${type}`);
    try {
      const { response, result } = await callAdminAction("send-ava-summary", { type });
      if (!response.ok) {
        console.error("Ava summary error:", result);
        showMessage("error", result.error || "Ava summary could not be sent.");
        return;
      }
      setAvaSummaryResult(result);
      if (type === "weekly") setAvaWeeklySummaryResult(result);
      else setAvaDailySummaryResult(result);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setActivity((current) => [`Ava sent ${type} internal compliance summary to ${result.recipient || "admin"}`, ...current]);
      showMessage("success", `Ava ${type} summary sent to admin.`);
    } catch (error) {
      console.error("Ava summary error:", error);
      showMessage("error", "Ava summary could not be sent.");
    } finally {
      setAvaSummaryBusy("");
    }
  }

  async function generateAvaSummary(type) {
    setAvaSummaryBusy(`generate-${type}`);
    try {
      const { response, result } = await callAdminAction("generate-ava-summary", { type });
      if (!response.ok) {
        console.error("Ava summary generation error:", result);
        showMessage("error", result.error || "Ava summary could not be generated.");
        return;
      }
      if (type === "weekly") setAvaWeeklySummaryResult(result);
      else setAvaDailySummaryResult(result);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setActivity((current) => [`Ava generated ${type} internal compliance summary`, ...current]);
      showMessage("success", `Ava ${type} summary generated.`);
    } catch (error) {
      console.error("Ava summary generation error:", error);
      showMessage("error", "Ava summary could not be generated.");
    } finally {
      setAvaSummaryBusy("");
    }
  }

  async function runAvaComplianceCheck() {
    setAvaCheckRunning(true);
    try {
      const { response, result } = await callAdminAction("run-ava-compliance-check");
      if (!response.ok) {
        console.error("Ava compliance check error:", result);
        showMessage("error", result.error || "Ava compliance check could not run.");
        return;
      }
      setAvaCheckResult(result);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setActivity((current) => [`Ava compliance check complete: ${result.summary?.expired_training || 0} expired, ${result.summary?.certificates_missing || 0} missing certificates`, ...current]);
      showMessage("success", "Ava compliance check completed.");
    } catch (error) {
      console.error("Ava compliance check error:", error);
      showMessage("error", "Ava compliance check could not run.");
    } finally {
      setAvaCheckRunning(false);
    }
  }

  function updateProspectForm(field, value) {
    setProspectForm((current) => ({ ...current, [field]: value }));
  }

  function scoreProspectLocally(prospect) {
    const text = `${prospect.organisation_name || ""} ${prospect.sector || ""} ${prospect.likely_training_need || ""} ${prospect.notes || ""}`.toLowerCase();
    const highSignals = ["local authority", "council", "academy trust", "send", "special school", "community transport", "care provider", "supported living", "minibus", "compliance"];
    const mediumSignals = ["school", "charity", "nursery", "childcare", "sports", "gym", "warehouse", "construction", "security", "facilities", "hotel", "restaurant", "office"];
    const recommendedService = text.includes("first aid") || text.includes("nursery") || text.includes("gym") || text.includes("warehouse") || text.includes("construction") || text.includes("hospitality")
      ? "First Aid"
      : text.includes("pats") || text.includes("passenger assistant") || text.includes("send")
        ? "PATS"
        : text.includes("midas") || text.includes("minibus") || text.includes("driver")
          ? "MiDAS"
          : text.includes("compliance") || text.includes("tracking")
            ? "Compliance tracking/support"
            : text.includes("refresher") || text.includes("expiry")
              ? "Refresher training"
              : prospect.recommended_service || "First Aid";
    const priority = highSignals.some((word) => text.includes(word)) ? "high" : mediumSignals.some((word) => text.includes(word)) ? "medium" : prospect.priority || "medium";
    const relevanceReason = priority === "high"
      ? "High relevance because this organisation appears to match ACE MiDAS Training's transport, safeguarding, compliance or staff training audience."
      : "Relevant because this organisation may need staff training, refresher planning or First Aid support.";
    return { recommendedService, priority, relevanceReason };
  }

  function prepareRoryResearchFromForm() {
    const scored = scoreProspectLocally(prospectForm);
    const sector = prospectForm.sector || "organisation";
    const need = prospectForm.likely_training_need || scored.recommendedService;
    setProspectForm((current) => ({
      ...current,
      recommended_service: scored.recommendedService,
      priority: scored.priority,
      relevance_reason: current.relevance_reason || scored.relevanceReason,
      outreach_brief: `Lead with ${scored.recommendedService} for this ${sector}. Likely need: ${need}. Keep the message warm, concise and sector-aware. Include the opt-out line.`
    }));
    showMessage("success", "Rory prepared a prospect score and outreach brief.");
  }

  function nextFollowUpForProspect(prospect) {
    const directDates = [prospect.follow_up_1_scheduled_for, prospect.follow_up_2_scheduled_for].filter(Boolean);
    const taskDates = safeFollowUpTasks.filter((task) => task.prospect_id === prospect.id && ["pending", "pending_approval"].includes(task.status)).map((task) => task.scheduled_for).filter(Boolean);
    const dates = [...directDates, ...taskDates].sort();
    return dates[0] || "";
  }

  async function saveRoryProspect() {
    if (!prospectForm.organisation_name.trim() || (!prospectForm.source_url.trim() && !prospectForm.website.trim())) {
      showMessage("error", "Organisation name and a public source URL or website are required.");
      return;
    }
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("save-prospect", { prospect: prospectForm });
      if (!response.ok) {
        console.error("Rory prospect save error:", result);
        showMessage("error", result.error || "Could not save prospect.");
        return;
      }
      setProspects(result.prospects || []);
      setFollowUpTasks(result.followUps || followUpTasks);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setProspectForm(defaultProspectForm);
      setActivity((current) => [`Rory added prospect: ${result.prospect?.organisation_name || "Prospect"}`, ...current]);
      showMessage("success", "Prospect added to Rory's review list.");
    } catch (error) {
      console.error("Rory prospect save error:", error);
      showMessage("error", "Could not save prospect.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateRoryProspectStatus(prospect, reviewStatus) {
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("update-prospect-status", { id: prospect.id, review_status: reviewStatus });
      if (!response.ok) {
        console.error("Rory prospect status error:", result);
        showMessage("error", result.error || "Could not update prospect.");
        return;
      }
      setProspects(result.prospects || []);
      setFollowUpTasks(result.followUps || followUpTasks);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", `Prospect marked ${reviewStatus.replace("_", " ")}.`);
    } catch (error) {
      console.error("Rory prospect status error:", error);
      showMessage("error", "Could not update prospect.");
    } finally {
      setIsSaving(false);
    }
  }

  async function scoreRoryProspect(prospect) {
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("score-prospect", { id: prospect.id });
      if (!response.ok) {
        console.error("Rory prospect score error:", result);
        showMessage("error", result.error || "Could not score prospect.");
        return;
      }
      setProspects(result.prospects || []);
      setFollowUpTasks(result.followUps || followUpTasks);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", `Prospect scored at ${result.prospect?.score ?? "review"}/100 and outreach brief updated.`);
    } catch (error) {
      console.error("Rory prospect score error:", error);
      showMessage("error", "Could not score prospect.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateRoryProspectWorkflow(prospect, updates, successText) {
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("save-prospect", { prospect: { ...prospect, ...updates } });
      if (!response.ok) {
        console.error("Rory prospect update error:", result);
        showMessage("error", result.error || "Could not update prospect.");
        return;
      }
      setProspects(result.prospects || []);
      setFollowUpTasks(result.followUps || followUpTasks);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", successText);
    } catch (error) {
      console.error("Rory prospect update error:", error);
      showMessage("error", "Could not update prospect.");
    } finally {
      setIsSaving(false);
    }
  }

  async function sendProspectToMia(prospect) {
    if (prospect.do_not_contact) {
      showMessage("error", "This prospect is marked do not contact.");
      return;
    }
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("send-prospect-to-mia", { id: prospect.id });
      if (!response.ok) {
        console.error("Mia prospect handoff error:", result);
        showMessage("error", result.error || "Could not send prospect to Mia.");
        return;
      }
      setProspects(result.prospects || []);
      setFollowUpTasks(result.followUps || followUpTasks);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      const statusText = result.emailStatus === "sent" ? "Mia sent the outreach email and scheduled follow-ups." : "Mia prepared outreach and follow-ups for approval.";
      showMessage("success", statusText);
    } catch (error) {
      console.error("Mia prospect handoff error:", error);
      showMessage("error", "Could not send prospect to Mia.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleRoryProspectSelection(prospect) {
    const id = roryProspectKey(prospect);
    if (!id) return;
    setSelectedRoryProspectIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function selectVisibleRoryProspects() {
    if (!visibleRoryProspectIds.length) return;
    setSelectedRoryProspectIds((current) => {
      const next = new Set(current);
      visibleRoryProspectIds.forEach((id) => next.add(id));
      return [...next];
    });
    showMessage("success", `${visibleRoryProspectIds.length} visible prospect(s) selected.`);
  }

  function clearRoryProspectSelection() {
    setSelectedRoryProspectIds([]);
    showMessage("success", "Prospect selection cleared.");
  }

  function getRoryScoreExplanation(prospect = {}) {
    const text = `${prospect.organisation_name || ""} ${prospect.sector || ""} ${prospect.likely_training_need || ""} ${prospect.notes || ""} ${prospect.contact_email || ""} ${prospect.website || ""}`.toLowerCase();
    const highSignals = ["local authority", "council", "academy trust", "send", "special school", "community transport", "care provider", "supported living", "minibus", "training manager", "compliance manager", "health and safety"].filter((word) => text.includes(word));
    const mediumSignals = ["school", "charity", "nursery", "childcare", "sports club", "gym", "warehouse", "construction", "security", "facilities", "hotel", "restaurant", "office"].filter((word) => text.includes(word));
    const sourceItems = [
      prospect.website ? "website" : "",
      prospect.source_url ? "source URL" : "",
      prospect.contact_email ? "public email" : "",
      prospect.phone ? "phone" : "",
      prospect.location ? "location" : ""
    ].filter(Boolean);
    const publicEmailType = prospect.contact_email
      ? /(^|[^\w])(info|enquiries|admin|office|training|hr|hello|contact)@/i.test(prospect.contact_email)
        ? "Generic business email found"
        : "Email found"
      : "No public email found";
    return {
      service: safeText(prospect.recommended_service, "Not scored yet"),
      sectorFit: highSignals.length ? `Strong fit: ${highSignals.slice(0, 3).join(", ")}` : mediumSignals.length ? `Useful fit: ${mediumSignals.slice(0, 3).join(", ")}` : "No strong sector keyword match yet",
      contactQuality: publicEmailType,
      sourceQuality: sourceItems.length ? `${sourceItems.length}/5 source details: ${sourceItems.join(", ")}` : "No source details recorded",
      priority: safeText(prospect.priority, "medium"),
      score: prospect.score !== undefined && prospect.score !== null ? `${prospect.score}/100` : "Not scored yet"
    };
  }

  async function previewMiaProspectEmail(prospect) {
    if (!prospect?.id) {
      showMessage("error", "Prospect must be saved before Mia can preview an email.");
      return;
    }
    setMiaEmailPreviewBusy(prospect.id);
    try {
      const { response, result } = await callAdminAction("preview-prospect-mia-email", { id: prospect.id });
      if (!response.ok) {
        console.error("Mia email preview error:", result);
        showMessage("error", result.error || "Could not preview Mia's email.");
        return;
      }
      setMiaEmailPreview(result);
      showMessage("success", "Mia email preview generated.");
    } catch (error) {
      console.error("Mia email preview error:", error);
      showMessage("error", "Could not preview Mia's email.");
    } finally {
      setMiaEmailPreviewBusy("");
    }
  }

  async function sendQualifiedProspectsToMia() {
    const prospectsToSend = filteredQualifiedProspectsForMia.slice(0, 10);
    if (!prospectsToSend.length) {
      showMessage("error", roryProspectServiceFilter ? `No qualified high-priority ${roryProspectServiceFilter} prospects are ready for Mia.` : "No qualified high-priority prospects are ready for Mia.");
      return;
    }
    setIsSaving(true);
    let sent = 0;
    let failed = 0;
    try {
      for (const prospect of prospectsToSend) {
        const { response, result } = await callAdminAction("send-prospect-to-mia", { id: prospect.id });
        if (!response.ok) {
          failed += 1;
          console.error("Mia prospect handoff error:", result);
        } else {
          sent += 1;
          setProspects(result.prospects || []);
          setFollowUpTasks(result.followUps || followUpTasks);
          setAgentActivityLogs(result.agentLogs || agentActivityLogs);
        }
      }
      await loadTrainingComplianceData({ quiet: true });
      showMessage(sent ? "success" : "error", sent ? `${sent} qualified prospect(s) sent to Mia${failed ? `, ${failed} failed` : ""}.` : "Could not send qualified prospects to Mia.");
    } catch (error) {
      console.error("Mia qualified prospect handoff error:", error);
      showMessage("error", "Could not send qualified prospects to Mia.");
    } finally {
      setIsSaving(false);
    }
  }

  async function sendSelectedProspectsToMia() {
    const prospectsToSend = selectedRoryProspects.filter((prospect) => prospect.id && !prospect.do_not_contact);
    const skipped = selectedRoryProspects.length - prospectsToSend.length;
    if (!selectedRoryProspects.length) {
      showMessage("error", "Select at least one prospect before sending to Mia.");
      return;
    }
    if (!prospectsToSend.length) {
      showMessage("error", "No selected prospects can be sent to Mia. Check do-not-contact status or saved prospect records.");
      return;
    }
    setIsSaving(true);
    let sent = 0;
    let failed = 0;
    const successfulIds = [];
    try {
      for (const prospect of prospectsToSend) {
        const { response, result } = await callAdminAction("send-prospect-to-mia", { id: prospect.id });
        if (!response.ok) {
          failed += 1;
          console.error("Selected Mia prospect handoff error:", result);
        } else {
          sent += 1;
          successfulIds.push(roryProspectKey(prospect));
          setProspects(result.prospects || []);
          setFollowUpTasks(result.followUps || followUpTasks);
          setAgentActivityLogs(result.agentLogs || agentActivityLogs);
        }
      }
      await loadTrainingComplianceData({ quiet: true });
      if (successfulIds.length) {
        setSelectedRoryProspectIds((current) => current.filter((id) => !successfulIds.includes(id)));
      }
      showMessage(sent ? "success" : "error", sent ? `${sent} selected prospect(s) sent to Mia${failed ? `, ${failed} failed` : ""}${skipped ? `, ${skipped} skipped` : ""}.` : "Could not send selected prospects to Mia.");
    } catch (error) {
      console.error("Selected Mia prospect handoff error:", error);
      showMessage("error", "Could not send selected prospects to Mia.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runRoryResearchNow() {
    setRoryResearchBusy(true);
    setRoryResearchStatus(null);
    setRoryDuplicateWarnings([]);
    try {
      const { response, result } = await callAdminAction("run-rory-prospect-research", { searchTheme: rorySearchTheme, runType: "manual", locationFocus: roryLocationFocus });
      if (!response.ok) {
        console.error("Rory research run error:", result);
        setRoryResearchStatus(result);
        showMessage("error", result.error || "Rory research could not run.");
        return;
      }
      setRoryResearchStatus(result);
      setRoryDuplicateWarnings(result.duplicate_details || []);
      setProspects(result.prospects || prospects);
      setFollowUpTasks(result.followUps || followUpTasks);
      setRoryResearchRuns(result.roryRuns || roryResearchRuns);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      if (result.status === "provider_not_configured") {
        showMessage("error", "Rory research provider is not configured yet.");
      } else {
        showMessage("success", `Rory research completed: ${result.prospects_saved || 0} prospect(s) saved.`);
      }
    } catch (error) {
      console.error("Rory research run error:", error);
      setRoryResearchStatus({ error: error.message || "Rory research could not run." });
      showMessage("error", "Rory research could not run.");
    } finally {
      setRoryResearchBusy(false);
    }
  }

  async function importRoryResearchResults() {
    const importedProspects = parseProspectImportText(roryImportText);
    if (!importedProspects.length) {
      showMessage("error", "No valid prospects found. Paste Manus JSON with a prospects array, or upload a CSV with organisation_name and source_url/website.");
      return;
    }
    setRoryResearchBusy(true);
    setRoryResearchStatus(null);
    setRoryDuplicateWarnings([]);
    try {
      const { response, result } = await callAdminAction("import-rory-prospects", { searchTheme: `${rorySearchTheme}${roryLocationFocus ? ` - ${roryLocationFocus}` : ""}`, prospects: importedProspects });
      if (!response.ok) {
        console.error("Rory research import error:", result);
        setRoryResearchStatus(result);
        showMessage("error", result.error || "Could not import Rory research results.");
        return;
      }
      setRoryResearchStatus(result);
      setRoryDuplicateWarnings(result.duplicate_details || []);
      setProspects(result.prospects || prospects);
      setFollowUpTasks(result.followUps || followUpTasks);
      setRoryResearchRuns(result.roryRuns || roryResearchRuns);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setRoryImportText("");
      showMessage("success", `Imported ${result.prospects_saved || 0} prospect(s). ${result.duplicates_skipped || 0} duplicate(s) skipped.`);
    } catch (error) {
      console.error("Rory research import error:", error);
      showMessage("error", "Could not import Rory research results.");
    } finally {
      setRoryResearchBusy(false);
    }
  }

  async function handleRoryImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const fileName = String(file.name || "").toLowerCase();
      if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        const prospectsFromWorkbook = parseWorkbookProspects(await file.arrayBuffer());
        setRoryImportText(JSON.stringify({ prospects: prospectsFromWorkbook }, null, 2));
        showMessage(prospectsFromWorkbook.length ? "success" : "error", prospectsFromWorkbook.length ? `Loaded ${prospectsFromWorkbook.length} prospect(s) from spreadsheet. Review, then import them.` : "No valid prospects were found in that spreadsheet.");
      } else {
        const text = await file.text();
        setRoryImportText(text);
      }
    } catch (error) {
      console.error("Rory file import error:", error);
      showMessage("error", "Could not read that prospect file.");
    } finally {
      event.target.value = "";
    }
  }

  async function checkRoryResearchRun(run) {
    if (!run?.id) return;
    setRoryResearchBusy(true);
    setRoryResearchStatus(null);
    try {
      const { response, result } = await callAdminAction("check-rory-research-run", { id: run.id });
      if (!response.ok) {
        console.error("Rory research check error:", result);
        setRoryResearchStatus(result);
        showMessage("error", result.error || "Could not check Rory research result.");
        return;
      }
      setRoryResearchStatus(result);
      setProspects(result.prospects || prospects);
      setRoryResearchRuns(result.roryRuns || roryResearchRuns);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage(result.status === "waiting_for_result" ? "error" : "success", result.status === "waiting_for_result" ? "Manus results are not ready yet." : "Rory research result checked.");
    } catch (error) {
      console.error("Rory research check error:", error);
      setRoryResearchStatus({ error: error.message || "Could not check Rory research result." });
      showMessage("error", "Could not check Rory research result.");
    } finally {
      setRoryResearchBusy(false);
    }
  }

  async function markProspectDoNotContact(prospect) {
    if (!window.confirm(`Mark ${prospect.organisation_name || "this prospect"} as do not contact?`)) return;
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("mark-prospect-do-not-contact", { id: prospect.id });
      if (!response.ok) {
        console.error("Prospect do not contact error:", result);
        showMessage("error", result.error || "Could not update prospect.");
        return;
      }
      setProspects(result.prospects || []);
      setFollowUpTasks(result.followUps || followUpTasks);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", "Prospect marked do not contact.");
    } catch (error) {
      console.error("Prospect do not contact error:", error);
      showMessage("error", "Could not update prospect.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRoryProspect(prospect) {
    if (!window.confirm(`Delete ${prospect.organisation_name || "this prospect"}?`)) return;
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("delete-prospect", { id: prospect.id });
      if (!response.ok) {
        console.error("Prospect delete error:", result);
        showMessage("error", result.error || "Could not delete prospect.");
        return;
      }
      setProspects(result.prospects || []);
      setFollowUpTasks(result.followUps || followUpTasks);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", "Prospect deleted.");
    } catch (error) {
      console.error("Prospect delete error:", error);
      showMessage("error", "Could not delete prospect.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateNiaDraftForm(field, value) {
    setNiaDraftForm((current) => ({ ...current, [field]: value }));
  }

  function updateNiaCurrentDraft(field, value) {
    setNiaCurrentDraft((current) => ({ ...asObject(current), [field]: value }));
  }

  function formatNiaDraftText(draft) {
    const safeDraft = asObject(draft);
    return [
      safeText(safeDraft.title, "Untitled draft"),
      "",
      `Platform: ${safeText(safeDraft.platform, "Not recorded")}`,
      `Audience: ${safeText(safeDraft.target_audience, "Not recorded")}`,
      `Topic: ${safeText(safeDraft.topic, "Not recorded")}`,
      "",
      safeText(safeDraft.content, ""),
      "",
      `Suggested visual: ${safeText(safeDraft.suggested_visual, "Not recorded")}`,
      safeDraft.image_prompt ? `Image prompt: ${safeDraft.image_prompt}` : "",
      `CTA: ${safeText(safeDraft.call_to_action, "Not recorded")}`,
      safeDraft.hashtags ? `Hashtags: ${safeDraft.hashtags}` : ""
    ].filter(Boolean).join("\n");
  }

  async function generateNiaDraft(weeklyPlan = false) {
    setNiaBusy(weeklyPlan ? "weekly" : "generate");
    try {
      const payload = {
        ...niaDraftForm,
        content_type: weeklyPlan ? "Weekly content plan" : niaDraftForm.content_type
      };
      const { response, result } = await callAdminAction("generate-content-draft", payload);
      if (!response.ok) {
        console.error("Nia draft generation error:", result);
        showMessage("error", result.error || "Nia could not generate the content draft.");
        return;
      }
      setNiaCurrentDraft(result.draft || null);
      setContentDrafts(result.contentDrafts || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setActivity((current) => [`Nia generated: ${result.draft?.title || "content draft"}`, ...current]);
      showMessage("success", weeklyPlan ? "Weekly content plan generated and saved." : "Premium content draft generated and saved.");
    } catch (error) {
      console.error("Nia draft generation error:", error);
      showMessage("error", "Nia could not generate the content draft.");
    } finally {
      setNiaBusy("");
    }
  }

  async function saveNiaDraft(draft = niaCurrentDraft) {
    const safeDraft = asObject(draft);
    if (!safeDraft.title || !safeDraft.content) {
      showMessage("error", "Draft title and body are required.");
      return;
    }
    setNiaBusy("save");
    try {
      const { response, result } = await callAdminAction("save-content-draft", { draft: safeDraft });
      if (!response.ok) {
        console.error("Nia draft save error:", result);
        showMessage("error", result.error || "Could not save content draft.");
        return;
      }
      setNiaCurrentDraft(result.draft || safeDraft);
      setContentDrafts(result.contentDrafts || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", "Content draft saved.");
    } catch (error) {
      console.error("Nia draft save error:", error);
      showMessage("error", "Could not save content draft.");
    } finally {
      setNiaBusy("");
    }
  }

  async function copyNiaDraft(draft) {
    const safeDraft = asObject(draft);
    try {
      await navigator.clipboard.writeText(formatNiaDraftText(safeDraft));
      const { response, result } = await callAdminAction("log-content-draft-copy", { id: safeDraft.id, title: safeDraft.title });
      if (response.ok) setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", "Content draft copied.");
    } catch (error) {
      console.error("Nia copy error:", error);
      showMessage("error", "Unable to copy draft. Select the text and copy it manually.");
    }
  }

  async function generateNiaImagePrompt(draft = niaCurrentDraft) {
    const safeDraft = asObject(draft);
    if (!safeDraft.id) {
      showMessage("error", "Save the draft before generating an image prompt.");
      return;
    }
    setNiaBusy(`image-prompt-${safeDraft.id}`);
    try {
      const { response, result } = await callAdminAction("generate-content-image-prompt", { id: safeDraft.id, draft: safeDraft });
      if (!response.ok) {
        console.error("Nia image prompt error:", result);
        showMessage("error", result.error || "Could not generate image prompt.");
        return;
      }
      setNiaCurrentDraft((current) => current?.id === safeDraft.id ? (result.contentDrafts || []).find((item) => item.id === safeDraft.id) || result.draft : current);
      setContentDrafts(result.contentDrafts || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", "Image prompt generated.");
    } catch (error) {
      console.error("Nia image prompt error:", error);
      showMessage("error", "Could not generate image prompt.");
    } finally {
      setNiaBusy("");
    }
  }

  async function copyNiaImagePrompt(draft = niaCurrentDraft) {
    const safeDraft = asObject(draft);
    if (!safeDraft.image_prompt) {
      showMessage("error", "Generate an image prompt first.");
      return;
    }
    try {
      await navigator.clipboard.writeText(safeDraft.image_prompt);
      showMessage("success", "Image prompt copied.");
    } catch (error) {
      console.error("Nia image prompt copy error:", error);
      showMessage("error", "Unable to copy image prompt. Select and copy it manually.");
    }
  }

  async function uploadNiaImage(draft, file) {
    const safeDraft = asObject(draft);
    if (!safeDraft.id || !file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showMessage("error", "Only JPG, PNG and WebP images are allowed.");
      return;
    }
    setNiaBusy(`upload-image-${safeDraft.id}`);
    try {
      const fileData = await fileToBase64(file);
      const { response, result } = await callAdminAction("upload-content-draft-image", {
        image: {
          content_draft_id: safeDraft.id,
          file_name: file.name,
          file_type: file.type,
          file_data: fileData
        }
      });
      if (!response.ok) {
        console.error("Nia image upload error:", result);
        showMessage("error", result.error || "Could not upload finished image.");
        return;
      }
      setNiaCurrentDraft((current) => current?.id === safeDraft.id ? (result.contentDrafts || []).find((item) => item.id === safeDraft.id) || result.draft : current);
      setContentDrafts(result.contentDrafts || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", "Finished image uploaded.");
    } catch (error) {
      console.error("Nia image upload error:", error);
      showMessage("error", "Could not upload finished image.");
    } finally {
      setNiaBusy("");
    }
  }

  async function openNiaImage(draft, download = false) {
    const safeDraft = asObject(draft);
    if (!safeDraft.id || !safeDraft.image_path) {
      showMessage("error", "No finished image is attached to this draft.");
      return;
    }
    setNiaBusy(`${download ? "download" : "view"}-image-${safeDraft.id}`);
    try {
      const { response, result } = await callAdminAction("get-content-draft-image-url", { id: safeDraft.id, download });
      if (!response.ok || !result.url) {
        console.error("Nia image URL error:", result);
        showMessage("error", result.error || "Could not open image.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Nia image URL error:", error);
      showMessage("error", "Could not open image.");
    } finally {
      setNiaBusy("");
    }
  }

  async function deleteNiaImage(draft) {
    const safeDraft = asObject(draft);
    if (!safeDraft.id || !safeDraft.image_path) {
      showMessage("error", "No finished image is attached to this draft.");
      return;
    }
    if (!window.confirm("Delete the finished image for this draft?")) return;
    setNiaBusy(`delete-image-${safeDraft.id}`);
    try {
      const { response, result } = await callAdminAction("delete-content-draft-image", { id: safeDraft.id });
      if (!response.ok) {
        console.error("Nia image delete error:", result);
        showMessage("error", result.error || "Could not delete finished image.");
        return;
      }
      setNiaCurrentDraft((current) => current?.id === safeDraft.id ? (result.contentDrafts || []).find((item) => item.id === safeDraft.id) || result.draft : current);
      setContentDrafts(result.contentDrafts || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", "Finished image deleted.");
    } catch (error) {
      console.error("Nia image delete error:", error);
      showMessage("error", "Could not delete finished image.");
    } finally {
      setNiaBusy("");
    }
  }

  async function markNiaDraftUsed(draft) {
    const safeDraft = asObject(draft);
    if (!safeDraft.id) return;
    setNiaBusy(`used-${safeDraft.id}`);
    try {
      const { response, result } = await callAdminAction("mark-content-draft-used", { id: safeDraft.id });
      if (!response.ok) {
        console.error("Nia mark used error:", result);
        showMessage("error", result.error || "Could not mark draft as used.");
        return;
      }
      setContentDrafts(result.contentDrafts || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setNiaCurrentDraft((current) => current?.id === safeDraft.id ? result.draft : current);
      showMessage("success", "Content draft marked as used.");
    } catch (error) {
      console.error("Nia mark used error:", error);
      showMessage("error", "Could not mark draft as used.");
    } finally {
      setNiaBusy("");
    }
  }

  async function deleteNiaDraft(draft) {
    const safeDraft = asObject(draft);
    if (!safeDraft.id) return;
    if (!window.confirm("Delete this Nia content draft?")) return;
    setNiaBusy(`delete-${safeDraft.id}`);
    try {
      const { response, result } = await callAdminAction("delete-content-draft", { id: safeDraft.id });
      if (!response.ok) {
        console.error("Nia delete error:", result);
        showMessage("error", result.error || "Could not delete content draft.");
        return;
      }
      setContentDrafts(result.contentDrafts || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setNiaCurrentDraft((current) => current?.id === safeDraft.id ? null : current);
      showMessage("success", "Content draft deleted.");
    } catch (error) {
      console.error("Nia delete error:", error);
      showMessage("error", "Could not delete content draft.");
    } finally {
      setNiaBusy("");
    }
  }

  function updateReplyForm(field, value) {
    setReplyForm((current) => ({ ...current, [field]: value }));
  }

  function updateManualInboundForm(field, value) {
    setManualInboundForm((current) => ({ ...current, [field]: value }));
  }

  function applyTheoTestPrompt(prompt) {
    setManualInboundForm({
      from_name: "Theo Test Contact",
      from_email: "theo.test@example.com",
      organisation: "Example Training Customer",
      subject: prompt.subject,
      message_body: prompt.message
    });
    setActiveTab("AI Operations");
  }

  async function saveManualInboundMessage() {
    if (!manualInboundForm.message_body.trim()) {
      showMessage("error", "Message body is required.");
      return;
    }
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("save-inbound-message", { message: { ...manualInboundForm, source: "manual" } });
      if (!response.ok) {
        console.error("Inbound message error:", result);
        showMessage("error", result.error || "Could not route inbound message.");
        return;
      }
      setInboundMessages(result.inboundMessages || []);
      setReplyIntake(result.replies || replyIntake);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setManualInboundForm({ from_name: "", from_email: "", organisation: "", subject: "", message_body: "" });
      showMessage("success", `Inbound message routed to ${result.inboundMessage?.assigned_agent || "agent"}.`);
    } catch (error) {
      console.error("Inbound message error:", error);
      showMessage("error", "Could not route inbound message.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveReplyIntake() {
    if (!replyForm.message.trim()) {
      showMessage("error", "Reply message is required.");
      return;
    }
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("save-reply-intake", { reply: replyForm });
      if (!response.ok) {
        console.error("Reply intake error:", result);
        showMessage("error", result.error || "Could not classify reply.");
        return;
      }
      setReplyIntake(result.replies || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      setReplyForm({ organisation_id: "", member_id: "", training_record_id: "", contact_name: "", contact_email: "", message: "", notes: "" });
      showMessage("success", result.reply?.approval_required ? "Reply routed to Theo for approval." : "Reply classified for safe follow-up.");
    } catch (error) {
      console.error("Reply intake error:", error);
      showMessage("error", "Could not classify reply.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateReplyApproval(reply, approvalStatus) {
    setIsSaving(true);
    try {
      const decision = theoDecisionFields[reply.id] || {};
      const { response, result } = await callAdminAction("update-reply-approval", { id: reply.id, approval_status: approvalStatus, notes: replyApprovalNotes[reply.id] || "", ...decision });
      if (!response.ok) {
        console.error("Reply approval error:", result);
        showMessage("error", result.error || "Could not update Theo approval item.");
        return;
      }
      setReplyIntake(result.replies || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", `Theo approval item ${approvalStatus}.`);
    } catch (error) {
      console.error("Reply approval error:", error);
      showMessage("error", "Could not update Theo approval item.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateTheoDecisionField(replyId, field, value) {
    setTheoDecisionFields((current) => ({ ...current, [replyId]: { ...(current[replyId] || {}), [field]: value } }));
  }

  async function sendTheoApprovedResponse(reply) {
    setIsSaving(true);
    try {
      const { response, result } = await callAdminAction("send-theo-approved-response", { id: reply.id });
      if (!response.ok) {
        console.error("Theo send error:", result);
        showMessage("error", result.error || "Theo response could not be sent.");
        return;
      }
      setReplyIntake(result.replies || []);
      setAgentActivityLogs(result.agentLogs || agentActivityLogs);
      showMessage("success", "Theo approved response sent.");
    } catch (error) {
      console.error("Theo send error:", error);
      showMessage("error", "Theo response could not be sent.");
    } finally {
      setIsSaving(false);
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text: safeErrorText(text, "") });
  }

  useEffect(() => {
    if (!unlocked || !supabase) return;
    async function loadMemberAdminData() {
      const { data: onboardingData, error: onboardingError } = await supabase
        .from("member_onboarding")
        .select("id, organisation, contact_name, email, phone, depots, road_staff, tools_required, preferred_login_method, notes, status, stripe_session_id, created_at")
        .order("created_at", { ascending: false });
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("id, organisation, contact_name, email, username, admin_password_reference, subscription_status, onboarding_status, is_active, phone, plan, payment_status, setup_status, med_app_status, journey_app_status, med_app_url, journey_app_url, stripe_session_id, created_at")
        .order("created_at", { ascending: false });

      if (onboardingError || memberError) {
        showMessage("error", onboardingError?.message || memberError?.message || "Unable to load member data.");
        return;
      }
      if (onboardingData) setOnboarding(onboardingData);
      if (memberData) setMembers(memberData);
      setActivity((current) => ["Loaded member onboarding records", ...current]);
    }
    loadMemberAdminData();
  }, [unlocked]);

  async function loadTrainingComplianceData({ quiet = false } = {}) {
    try {
      const { response, result } = await callAdminAction("get-training-compliance");
      setDebugInfo((current) => ({ ...current, lastSaveResponse: { ...current.lastSaveResponse, complianceLoad: result }, lastFetchCount: result.counts?.organisations ?? current.lastFetchCount }));
      if (!response.ok) {
        console.error("Training compliance load error:", result);
        if (!quiet) showMessage("error", result.error || "Could not load training compliance data.");
        return null;
      }
      setTcOrganisations(result.organisations || []);
      setTcMembers(result.members || []);
      setTcCourses(result.courses || []);
      setTcRecords(result.records || []);
      setTrainingEvidence(result.evidence || []);
      setTrainingReminders(result.reminders || []);
      setTrainingReminderLogs(result.reminderLogs || []);
      setAgentActivityLogs(result.agentLogs || []);
      setProspects(result.prospects || []);
      setFollowUpTasks(result.followUps || []);
      setRoryResearchRuns(result.roryRuns || []);
      setContentDrafts(result.contentDrafts || []);
      setInboundMessages(result.inboundMessages || []);
      setReplyIntake(result.replies || []);
      if (!quiet) setActivity((current) => ["Loaded training compliance records", ...current]);
      return result;
    } catch (error) {
      console.error("Training compliance load error:", error);
      if (!quiet) showMessage("error", "Could not load training compliance data.");
      return null;
    }
  }

  async function loadMiaKnowledgeBase({ quiet = false } = {}) {
    setMiaKbBusy("loading");
    try {
      const { response, result } = await callAdminAction("get-mia-knowledge-base");
      setDebugInfo((current) => ({ ...current, lastSaveResponse: { ...current.lastSaveResponse, miaKnowledgeBaseLoad: result }, lastFetchCount: result.counts?.questions ?? current.lastFetchCount }));
      if (!response.ok) {
        console.error("Mia knowledge base load error:", result);
        if (!quiet) showMessage("error", result.error || "Could not load Mia knowledge base.");
        return null;
      }
      setMiaKbEntries(result.entries || []);
      setMiaVisitorQuestions(result.questions || []);
      if (!quiet) showMessage("success", "Mia knowledge base refreshed.");
      return result;
    } catch (error) {
      console.error("Mia knowledge base load error:", error);
      if (!quiet) showMessage("error", "Could not load Mia knowledge base.");
      return null;
    } finally {
      setMiaKbBusy("");
    }
  }

  async function syncMiaKnowledgeBase() {
    setMiaKbBusy("sync");
    try {
      const { response, result } = await callAdminAction("sync-mia-knowledge-base");
      if (!response.ok) {
        console.error("Mia knowledge base sync error:", result);
        showMessage("error", result.error || "Could not sync Mia knowledge base.");
        return;
      }
      setMiaKbEntries(result.entries || []);
      setMiaVisitorQuestions(result.questions || []);
      showMessage("success", "Mia knowledge base synced from approved seed.");
    } catch (error) {
      console.error("Mia knowledge base sync error:", error);
      showMessage("error", "Could not sync Mia knowledge base.");
    } finally {
      setMiaKbBusy("");
    }
  }

  function updateMiaKbEntryField(field, value) {
    setMiaKbEntryForm((current) => ({ ...current, [field]: value }));
  }

  function editMiaKbEntry(entry) {
    setMiaKbEntryForm({
      id: entry.id,
      category: entry.category || "",
      title: entry.title || "",
      question: entry.question || "",
      approved_answer: entry.approved_answer || "",
      keywords: Array.isArray(entry.keywords) ? entry.keywords.join(", ") : entry.keywords || "",
      source: entry.source || "Back Office",
      status: entry.status || "approved",
      priority: entry.priority || 50,
      confidence_threshold: entry.confidence_threshold || 35
    });
  }

  async function saveMiaKnowledgeEntry(event) {
    event?.preventDefault?.();
    setMiaKbBusy("save-entry");
    try {
      const { response, result } = await callAdminAction("save-mia-knowledge-entry", { entry: miaKbEntryForm });
      if (!response.ok) {
        console.error("Mia knowledge entry save error:", result);
        showMessage("error", result.error || "Could not save Mia knowledge entry.");
        return;
      }
      setMiaKbEntries(result.entries || []);
      setMiaVisitorQuestions(result.questions || []);
      setMiaKbEntryForm({ category: "", title: "", question: "", approved_answer: "", keywords: "", source: "Back Office", status: "approved", priority: 50, confidence_threshold: 35 });
      showMessage("success", "Mia knowledge entry saved.");
    } catch (error) {
      console.error("Mia knowledge entry save error:", error);
      showMessage("error", "Could not save Mia knowledge entry.");
    } finally {
      setMiaKbBusy("");
    }
  }

  async function updateMiaVisitorQuestion(question, updates, successMessage = "Visitor question updated.") {
    setMiaKbBusy(question.id);
    try {
      const { response, result } = await callAdminAction("update-mia-visitor-question", { id: question.id, ...updates });
      if (!response.ok) {
        console.error("Mia visitor question update error:", result);
        showMessage("error", result.error || "Could not update visitor question.");
        return;
      }
      setMiaKbEntries(result.entries || []);
      setMiaVisitorQuestions(result.questions || []);
      showMessage("success", successMessage);
    } catch (error) {
      console.error("Mia visitor question update error:", error);
      showMessage("error", "Could not update visitor question.");
    } finally {
      setMiaKbBusy("");
    }
  }

  async function createMiaEntryFromQuestion(question) {
    setMiaKbBusy(question.id);
    try {
      const { response, result } = await callAdminAction("create-mia-kb-entry-from-question", { id: question.id });
      if (!response.ok) {
        console.error("Create Mia KB entry from question error:", result);
        showMessage("error", result.error || "Could not add this answer to the knowledge base.");
        return;
      }
      setMiaKbEntries(result.entries || []);
      setMiaVisitorQuestions(result.questions || []);
      showMessage("success", "Visitor answer added to Mia knowledge base.");
    } catch (error) {
      console.error("Create Mia KB entry from question error:", error);
      showMessage("error", "Could not add this answer to the knowledge base.");
    } finally {
      setMiaKbBusy("");
    }
  }

  async function loadReportHistory({ quiet = false } = {}) {
    setIsRefreshingReports(true);
    try {
      const { response, result } = await callAdminAction("get-report-history");
      if (!response.ok) {
        console.error("Report history load error:", result);
        if (!quiet) showMessage("error", result.error || "Could not load recent reports.");
        return [];
      }
      const reports = result.reports || [];
      setReportHistory(reports);
      if (!quiet) showMessage("success", "Recent reports refreshed.");
      return reports;
    } catch (error) {
      console.error("Report history load error:", error);
      if (!quiet) showMessage("error", "Could not load recent reports.");
      return [];
    } finally {
      setIsRefreshingReports(false);
    }
  }

  async function saveReportHistoryEntry(report, fileName) {
    const { response, result } = await callAdminAction("save-report-history", {
      report: {
        organisation_id: report.type === "council" ? selectedReportOrganisationId || null : null,
        report_type: report.title,
        file_name: fileName,
        generated_by: "Back Office",
        status: "generated"
      }
    });
    if (!response.ok) {
      console.error("Report history save error:", result);
      throw new Error(result.error || "Report history could not be saved.");
    }
    setReportHistory((current) => [result.report, ...current.filter((item) => item.id !== result.report?.id)].filter(Boolean).slice(0, 25));
    return result.report;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(new Error("File could not be read."));
      reader.readAsDataURL(file);
    });
  }

  function evidenceForRecord(recordId) {
    return trainingEvidenceMap[recordId] || [];
  }

  async function uploadTrainingEvidence(record, file) {
    if (!file) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showMessage("error", "Only PDF and image uploads are allowed.");
      return;
    }
    setEvidenceBusyId(record.id);
    try {
      const fileData = await fileToBase64(file);
      const { response, result } = await callAdminAction("upload-training-evidence", {
        evidence: {
          organisation_id: record.organisation_id,
          member_id: record.member_id,
          training_record_id: record.id,
          file_name: file.name,
          file_type: file.type,
          file_data: fileData
        }
      });
      if (!response.ok) {
        console.error("Evidence upload error:", result);
        showMessage("error", result.error || "Could not upload certificate.");
        return;
      }
      await loadTrainingComplianceData({ quiet: true });
      setSelectedEvidenceRecordId(record.id);
      showMessage("success", "Certificate uploaded successfully.");
    } catch (error) {
      console.error("Evidence upload error:", error);
      showMessage("error", "Could not upload certificate.");
    } finally {
      setEvidenceBusyId("");
    }
  }

  async function viewTrainingEvidence(record) {
    const evidence = evidenceForRecord(record.id);
    if (!evidence.length) {
      showMessage("error", "No certificate is attached to this training record.");
      return;
    }
    const certificate = evidence[0];
    setEvidenceBusyId(certificate.id);
    try {
      const { response, result } = await callAdminAction("get-training-evidence-url", { id: certificate.id, download: false });
      if (!response.ok || !result.url) {
        console.error("Certificate view error:", result);
        showMessage("error", result.error || "Could not open certificate.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
      showMessage("success", "Certificate opened.");
    } catch (error) {
      console.error("Certificate view error:", error);
      showMessage("error", error.message || "Could not open certificate.");
    } finally {
      setEvidenceBusyId("");
    }
  }

  async function downloadTrainingEvidence(evidence) {
    setEvidenceBusyId(evidence.id);
    try {
      const { response, result } = await callAdminAction("get-training-evidence-url", { id: evidence.id });
      if (!response.ok || !result.url) {
        console.error("Evidence download error:", result);
        showMessage("error", result.error || "Could not prepare certificate download.");
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
      showMessage("success", "Certificate download opened.");
    } catch (error) {
      console.error("Evidence download error:", error);
      showMessage("error", "Could not prepare certificate download.");
    } finally {
      setEvidenceBusyId("");
    }
  }

  async function downloadLatestTrainingEvidence(record) {
    const evidence = evidenceForRecord(record.id)[0];
    if (!evidence) {
      showMessage("error", "No certificate is attached to this record.");
      return;
    }
    await downloadTrainingEvidence(evidence);
  }

  async function deleteTrainingEvidence(evidence) {
    if (!window.confirm(`Delete certificate file "${evidence.file_name}"?`)) return;
    setEvidenceBusyId(evidence.id);
    try {
      const { response, result } = await callAdminAction("delete-training-evidence", { id: evidence.id });
      if (!response.ok) {
        console.error("Evidence delete error:", result);
        showMessage("error", result.error || "Could not delete certificate.");
        return;
      }
      await loadTrainingComplianceData({ quiet: true });
      showMessage("success", "Certificate deleted successfully.");
    } catch (error) {
      console.error("Evidence delete error:", error);
      showMessage("error", "Could not delete certificate.");
    } finally {
      setEvidenceBusyId("");
    }
  }

  async function deleteLatestTrainingEvidence(record) {
    const evidence = evidenceForRecord(record.id)[0];
    if (!evidence) {
      showMessage("error", "No certificate is attached to this record.");
      return;
    }
    await deleteTrainingEvidence(evidence);
  }

  useEffect(() => {
    try {
      const savedTab = window.localStorage.getItem(BACK_OFFICE_TAB_STORAGE_KEY);
      window.localStorage.removeItem("ace_back_office_unlocked");
      if (tabs.includes(savedTab)) setActiveTab(savedTab);
    } catch (error) {
      console.warn("Back Office tab restore unavailable:", error);
    }
  }, []);

  useEffect(() => {
    setUnlocked(false);
    setCode("");
    setMessage("");
    try {
      window.localStorage.removeItem("ace_back_office_unlocked");
    } catch (error) {
      console.warn("Back Office unlock reset unavailable:", error);
    }
  }, [loginNonce]);

  useEffect(() => {
    if (!unlocked) return;
    try {
      window.localStorage.setItem(BACK_OFFICE_TAB_STORAGE_KEY, activeTab);
    } catch (error) {
      console.warn("Back Office session save unavailable:", error);
    }
  }, [unlocked, activeTab]);

  useEffect(() => {
    const dataDrivenBackOfficeTabs = [
      "Training Compliance",
      "Export Centre",
      "Reports & Exports",
      "AI Operations",
      "Ava Compliance Centre",
      "Nia Content Studio",
      "Rory Prospecting Centre",
      "Workflow Debug Trace",
    ];
    if (!unlocked || !dataDrivenBackOfficeTabs.includes(activeTab)) return;
    loadTrainingComplianceData();
  }, [unlocked, activeTab]);

  useEffect(() => {
    if (!unlocked || activeTab !== "Reports & Exports") return;
    loadReportHistory({ quiet: true });
  }, [unlocked, activeTab]);

  useEffect(() => {
    if (!unlocked || activeTab !== "Mia Knowledge Base") return;
    loadMiaKnowledgeBase({ quiet: true });
  }, [unlocked, activeTab]);

  function unlockBackOffice(e) {
    e.preventDefault();
    if (code.trim() !== "ACEADMIN2026") {
      showMessage("error", "Incorrect admin code.");
      return;
    }
    setUnlocked(true);
    try {
      window.localStorage.setItem(BACK_OFFICE_TAB_STORAGE_KEY, activeTab);
    } catch (error) {
      console.warn("Back Office session save unavailable:", error);
    }
    showMessage("success", "Back Office unlocked.");
    setActivity((current) => ["Admin unlocked Back Office", ...current]);
  }

  function updateBlogField(e) {
    const { name, value } = e.target;
    setBlogForm((current) => ({ ...current, [name]: value }));
  }

  function updateReviewField(e) {
    const { name, value } = e.target;
    setReviewForm((current) => ({ ...current, [name]: value }));
  }

  function updateMemberFormField(e) {
    const { name, value, type, checked } = e.target;
    setMemberForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function saveBlog(e) {
    e.preventDefault();
    if (!blogForm.title.trim() || !blogForm.content.trim()) {
      showMessage("error", "Blog title and content are required.");
      return;
    }
    if (!supabase) {
      showMessage("error", "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setIsSaving(true);
    const blog = {
      tag: blogForm.tag.trim() || "Update",
      title: blogForm.title.trim(),
      content: blogForm.content.trim(),
      status: blogForm.status
    };
    const { data, error } = await supabase.from("blog_posts").insert(blog).select("id, tag, title, content, status, created_at").single();
    setIsSaving(false);
    if (error) {
      showMessage("error", error.message || "Unable to save blog.");
      return;
    }
    const savedPost = data || blog;
    setPosts((current) => [
      { id: savedPost.id, tag: savedPost.tag || "Update", title: savedPost.title || "Untitled", text: savedPost.content || "", status: savedPost.status || "Draft" },
      ...current
    ]);
    setBlogForm({ tag: "", title: "", content: "", status: "Draft" });
    setActivity((current) => [`Blog saved: ${blog.title}`, ...current]);
    showMessage("success", "Blog saved to Supabase.");
  }

  async function saveReview(e) {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.content.trim()) {
      showMessage("error", "Reviewer name and review content are required.");
      return;
    }
    if (!supabase) {
      showMessage("error", "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setIsSaving(true);
    const review = {
      rating: reviewForm.rating.trim() || "5",
      name: reviewForm.name.trim(),
      organisation: reviewForm.organisation.trim(),
      content: reviewForm.content.trim(),
      status: reviewForm.status
    };
    const { data, error } = await supabase.from("reviews").insert(review).select("id, rating, name, organisation, content, status, created_at").single();
    setIsSaving(false);
    if (error) {
      showMessage("error", error.message || "Unable to save review.");
      return;
    }
    const savedReview = data || review;
    setReviews((current) => [
      { id: savedReview.id, rating: savedReview.rating || "5", name: savedReview.name || "Reviewer", org: savedReview.organisation || "Organisation", text: savedReview.content || "", status: savedReview.status || "Draft" },
      ...current
    ]);
    setReviewForm({ rating: "", name: "", organisation: "", content: "", status: "Draft" });
    setActivity((current) => [`Review saved: ${review.name}`, ...current]);
    showMessage("success", "Review saved to Supabase.");
  }

  async function updateBlogStatus(post, status) {
    if (!post.id) {
      setPosts((current) => current.map((item) => (item === post ? { ...item, status } : item)));
      showMessage("success", `Local blog marked as ${status}.`);
      return;
    }
    if (!supabase) {
      showMessage("error", "Supabase is not configured. Unable to update blog status.");
      return;
    }
    const { error } = await supabase.from("blog_posts").update({ status }).eq("id", post.id);
    if (error) {
      showMessage("error", error.message || "Unable to update blog status.");
      return;
    }
    setPosts((current) => current.map((item) => (item.id === post.id ? { ...item, status } : item)));
    setActivity((current) => [`Blog ${status.toLowerCase()}: ${post.title}`, ...current]);
    showMessage("success", `Blog updated to ${status}.`);
  }

  async function deleteBlog(post) {
    if (post.id && supabase) {
      const { error } = await supabase.from("blog_posts").delete().eq("id", post.id);
      if (error) {
        showMessage("error", error.message || "Unable to delete blog.");
        return;
      }
    } else if (post.id && !supabase) {
      showMessage("error", "Supabase is not configured. Unable to delete blog.");
      return;
    }
    setPosts((current) => current.filter((item) => (post.id ? item.id !== post.id : item !== post)));
    setActivity((current) => [`Blog deleted: ${post.title}`, ...current]);
    showMessage("success", "Blog deleted.");
  }

  async function updateReviewStatus(review, status) {
    if (!review.id) {
      setReviews((current) => current.map((item) => (item === review ? { ...item, status } : item)));
      showMessage("success", `Local review marked as ${status}.`);
      return;
    }
    if (!supabase) {
      showMessage("error", "Supabase is not configured. Unable to update review status.");
      return;
    }
    const { error } = await supabase.from("reviews").update({ status }).eq("id", review.id);
    if (error) {
      showMessage("error", error.message || "Unable to update review status.");
      return;
    }
    setReviews((current) => current.map((item) => (item.id === review.id ? { ...item, status } : item)));
    setActivity((current) => [`Review ${status.toLowerCase()}: ${review.name}`, ...current]);
    showMessage("success", `Review updated to ${status}.`);
  }

  async function deleteReview(review) {
    if (review.id && supabase) {
      const { error } = await supabase.from("reviews").delete().eq("id", review.id);
      if (error) {
        showMessage("error", error.message || "Unable to delete review.");
        return;
      }
    } else if (review.id && !supabase) {
      showMessage("error", "Supabase is not configured. Unable to delete review.");
      return;
    }
    setReviews((current) => current.filter((item) => (review.id ? item.id !== review.id : item !== review)));
    setActivity((current) => [`Review deleted: ${review.name}`, ...current]);
    showMessage("success", "Review deleted.");
  }

  function editMemberField(memberId, field, value) {
    setMembers((current) => current.map((member) => (member.id === memberId ? { ...member, [field]: value } : member)));
  }

  function editLocalMemberField(member, field, value) {
    setMembers((current) => current.map((item) => (item === member ? { ...item, [field]: value } : item)));
  }

  function updateExistingMember(member, field, value) {
    if (member.id) editMemberField(member.id, field, value);
    else editLocalMemberField(member, field, value);
  }

  async function createMemberAccount(e) {
    e.preventDefault();
    const newMember = {
      organisation: memberForm.organisation.trim(),
      contact_name: memberForm.contact_name.trim(),
      email: memberForm.email.trim().toLowerCase(),
      username: memberForm.username.trim() || memberForm.email.trim().toLowerCase(),
      admin_password_reference: memberForm.admin_password_reference || generateAdminReference(),
      subscription_status: memberForm.subscription_status,
      onboarding_status: memberForm.onboarding_status,
      is_active: memberForm.is_active,
      med_app_status: "Pending",
      journey_app_status: "Pending",
      med_app_url: memberForm.med_app_url,
      journey_app_url: memberForm.journey_app_url
    };
    if (!newMember.organisation || !newMember.email) {
      showMessage("error", "Organisation and approved login email are required.");
      return;
    }
    if (!supabase) {
      setMembers((current) => [{ ...newMember, id: `local-${Date.now()}` }, ...current]);
      showMessage("success", "Member created locally. Supabase is not configured yet.");
      return;
    }
    const { data, error } = await supabase.from("members").upsert(newMember, { onConflict: "email" }).select("id, organisation, contact_name, email, username, admin_password_reference, subscription_status, onboarding_status, is_active, med_app_status, journey_app_status, med_app_url, journey_app_url, created_at").single();
    if (error) {
      showMessage("error", error.message || "Unable to create member.");
      return;
    }
    setMembers((current) => [data, ...current.filter((member) => member.email !== data.email)]);
    setMemberForm({ organisation: "", contact_name: "", email: "", username: "", subscription_status: "Pending", onboarding_status: "New", is_active: false, admin_password_reference: generateAdminReference(), med_app_url: "", journey_app_url: "" });
    setActivity((current) => [`Member account created: ${data.organisation}`, ...current]);
    showMessage("success", "Member account created.");
  }

  async function saveMemberSettings(member) {
    if (!member.id) {
      showMessage("error", "This member record has not been saved to Supabase yet.");
      return;
    }
    if (!supabase) {
      showMessage("error", "Supabase is not configured. Unable to update member settings.");
      return;
    }
    const updates = {
      organisation: member.organisation || "",
      contact_name: member.contact_name || "",
      email: member.email || "",
      username: member.username || "",
      admin_password_reference: member.admin_password_reference || "",
      subscription_status: member.subscription_status || "Pending",
      onboarding_status: member.onboarding_status || "New",
      is_active: member.is_active === true,
      setup_status: member.setup_status || "Pending",
      med_app_status: member.med_app_status || "Pending",
      journey_app_status: member.journey_app_status || "Pending",
      med_app_url: member.med_app_url || "",
      journey_app_url: member.journey_app_url || "",
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("members").update(updates).eq("id", member.id);
    if (error) {
      showMessage("error", error.message || "Unable to update member settings.");
      return;
    }
    setActivity((current) => [`Member settings updated: ${member.organisation || member.email}`, ...current]);
    showMessage("success", "Member settings updated.");
  }

  function regenerateMemberReference(member) {
    const reference = generateAdminReference();
    if (member.id) editMemberField(member.id, "admin_password_reference", reference);
    else editLocalMemberField(member, "admin_password_reference", reference);
    showMessage("success", "New admin reference generated. Save member settings to keep it.");
  }

  async function copyReference(reference) {
    try {
      await navigator.clipboard.writeText(reference || "");
      showMessage("success", "Reference copied to clipboard.");
    } catch {
      showMessage("error", "Unable to copy reference. Select and copy it manually.");
    }
  }

  function updateSettingsField(e) {
    const { name, value } = e.target;
    setSiteSettings((current) => ({ ...current, [name]: value }));
  }

  function settingsMatch(savedSettings, attemptedSettings) {
    if (!savedSettings || !attemptedSettings) return false;
    return Object.entries(attemptedSettings).every(([key, value]) => String(savedSettings[key] ?? "") === String(value ?? ""));
  }

  async function saveSiteSettings() {
    try {
      const { response, result } = await callAdminAction("save-settings", { settings });
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastSavedSettingTimestamp: result.updated_at || current.lastSavedSettingTimestamp }));
      if (!response.ok) {
        console.error("Settings save error:", result);
        showMessage("error", result.error || "Could not save changes. Please try again.");
        return;
      }

      const { response: verifyResponse, result: verifyResult } = await callAdminAction("get-settings");
      setDebugInfo((current) => ({ ...current, lastSaveResponse: { save: result, verify: verifyResult }, lastSavedSettingTimestamp: verifyResult.updated_at || result.updated_at || current.lastSavedSettingTimestamp }));
      if (!verifyResponse.ok || !verifyResult.settings || !settingsMatch(verifyResult.settings, settings)) {
        console.error("Settings verification error:", verifyResult);
        showMessage("error", "Save could not be verified.");
        return;
      }

      setSiteSettings((current) => ({ ...current, ...verifyResult.settings }));
      setActivity((current) => ["Site settings saved", ...current]);
      showMessage("success", "Settings saved successfully");
    } catch (error) {
      console.error("Settings save error:", error);
      showMessage("error", "Could not save changes. Please try again.");
    }
  }

  async function refreshTrainingOrganisations() {
    const result = await loadTrainingComplianceData({ quiet: true });
    return result?.organisations || [];
  }

  function updateTcOrgForm(e) {
    const { name, value } = e.target;
    setTcOrgForm((current) => ({ ...current, [name]: value }));
  }

  function updateTcMemberForm(e) {
    const { name, value } = e.target;
    setTcMemberForm((current) => ({ ...current, [name]: value }));
  }

  function updateTcRecordForm(e) {
    const { name, value } = e.target;
    setTcRecordForm((current) => {
      if (name === "date_completed_display") {
        return { ...current, date_completed_display: value, date_completed: parseDisplayDate(value) };
      }
      const next = { ...current, [name]: value };
      if (name === "organisation_id") next.member_id = "";
      return next;
    });
  }

  function updateTcFilter(e) {
    const { name, value } = e.target;
    setTcFilters((current) => ({ ...current, [name]: value }));
  }

  async function saveTrainingOrganisation(e) {
    e.preventDefault();
    const organisation = {
      name: tcOrgForm.name.trim(),
      contact_name: tcOrgForm.contact_name.trim(),
      contact_email: tcOrgForm.contact_email.trim(),
      phone: tcOrgForm.phone.trim()
    };
    if (!organisation.name) {
      showMessage("error", "Organisation name is required.");
      return;
    }
    try {
      const { response, result } = await callAdminAction("save-organisation", { organisation });
      if (!response.ok) {
        console.error("Organisation save error:", result);
        showMessage("error", result.error || "Could not save changes. Please try again.");
        return;
      }
      let fetchedOrganisations = await refreshTrainingOrganisations();
      if (fetchedOrganisations.length === 0 && Array.isArray(result.organisations)) {
        fetchedOrganisations = result.organisations;
        setTcOrganisations(fetchedOrganisations);
        setDebugInfo((current) => ({ ...current, lastFetchCount: fetchedOrganisations.length }));
      }
      const verified = fetchedOrganisations.some((org) => org.id === result.organisation?.id || (org.name === result.organisation?.name && org.contact_email === result.organisation?.contact_email));
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastFetchCount: fetchedOrganisations.length }));
      if (!verified) {
        showMessage("error", "Organisation saved but could not be verified.");
        return;
      }
      setTcOrgForm({ name: "", contact_name: "", contact_email: "", phone: "" });
      setActivity((current) => [`Organisation added: ${result.organisation?.name || organisation.name}`, ...current]);
      showMessage("success", "Organisation saved successfully");
    } catch (error) {
      console.error("Organisation save error:", error);
      showMessage("error", "Could not save changes. Please try again.");
    }
  }

  function updateTrainingOrganisation(orgId, field, value) {
    setTcOrganisations((current) => current.map((org) => (org.id === orgId ? { ...org, [field]: value } : org)));
  }

  async function saveTrainingOrganisationRow(org) {
    try {
      const { response, result } = await callAdminAction("save-organisation", { organisation: org });
      if (!response.ok) {
        console.error("Organisation update error:", result);
        showMessage("error", result.error || "Could not save changes. Please try again.");
        return;
      }
      let fetchedOrganisations = await refreshTrainingOrganisations();
      if (fetchedOrganisations.length === 0 && Array.isArray(result.organisations)) {
        fetchedOrganisations = result.organisations;
        setTcOrganisations(fetchedOrganisations);
      }
      const verified = fetchedOrganisations.some((item) => item.id === result.organisation?.id);
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastFetchCount: fetchedOrganisations.length }));
      if (!verified) {
        showMessage("error", "Organisation saved but could not be verified.");
        return;
      }
      showMessage("success", "Organisation saved successfully");
    } catch (error) {
      console.error("Organisation update error:", error);
      showMessage("error", "Could not save changes. Please try again.");
    }
  }

  async function saveTrainingMember(e) {
    e.preventDefault();
    const member = {
      organisation_id: tcMemberForm.organisation_id,
      full_name: tcMemberForm.full_name.trim(),
      email: tcMemberForm.email.trim(),
      role: tcMemberForm.role.trim()
    };
    if (!member.organisation_id || !member.full_name || !member.email || !member.role) {
      showMessage("error", "Organisation, staff name, email and role are required.");
      return;
    }
    try {
      const { response, result } = await callAdminAction("save-member", { member });
      if (!response.ok) {
        console.error("Staff member save error:", result);
        showMessage("error", result.error || "Could not save changes. Please try again.");
        return;
      }
      const refreshed = await loadTrainingComplianceData({ quiet: true });
      const verified = (refreshed?.members || []).some((item) => item.id === result.member?.id);
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastFetchCount: refreshed?.members?.length ?? current.lastFetchCount }));
      if (!verified) {
        showMessage("error", "Staff member saved but could not be verified.");
        return;
      }
      setTcMemberForm({ organisation_id: "", full_name: "", email: "", role: "" });
      setActivity((current) => [`Staff member added: ${result.member?.full_name || member.full_name}`, ...current]);
      showMessage("success", "Staff member saved successfully");
    } catch (error) {
      console.error("Staff member save error:", error);
      showMessage("error", "Could not save changes. Please try again.");
    }
  }

  function updateTrainingMember(memberId, field, value) {
    setTcMembers((current) => current.map((member) => (member.id === memberId ? { ...member, [field]: value } : member)));
  }

  async function saveTrainingMemberRow(member) {
    try {
      const { response, result } = await callAdminAction("save-member", { member });
      if (!response.ok) {
        console.error("Staff member update error:", result);
        showMessage("error", result.error || "Could not save changes. Please try again.");
        return;
      }
      const refreshed = await loadTrainingComplianceData({ quiet: true });
      const verified = (refreshed?.members || []).some((item) => item.id === result.member?.id);
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastFetchCount: refreshed?.members?.length ?? current.lastFetchCount }));
      showMessage(verified ? "success" : "error", verified ? "Staff member saved successfully" : "Staff member saved but could not be verified.");
    } catch (error) {
      console.error("Staff member update error:", error);
      showMessage("error", "Could not save changes. Please try again.");
    }
  }

  async function saveTrainingRecord(e) {
    e.preventDefault();
    const course = tcCourseMap[tcRecordForm.course_id];
    const expiryDate = addMonthsToDate(tcRecordForm.date_completed, course?.validity_months);
    const record = {
      member_id: tcRecordForm.member_id,
      course_id: tcRecordForm.course_id,
      date_completed: tcRecordForm.date_completed,
      expiry_date: expiryDate,
      status: getTrainingStatus(expiryDate)
    };
    if (!tcRecordForm.organisation_id || !record.member_id || !record.course_id || !record.date_completed) {
      showMessage("error", "Organisation, staff member, course and completed date are required.");
      return;
    }
    try {
      const { response, result } = await callAdminAction("save-training-record", { record });
      if (!response.ok) {
        console.error("Training record save error:", result);
        showMessage("error", result.error || "Could not save changes. Please try again.");
        return;
      }
      const refreshed = await loadTrainingComplianceData({ quiet: true });
      const verified = (refreshed?.records || []).some((item) => item.id === result.record?.id);
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastFetchCount: refreshed?.records?.length ?? current.lastFetchCount }));
      if (!verified) {
        showMessage("error", "Training record saved but could not be verified.");
        return;
      }
      setTcRecordForm({ organisation_id: "", member_id: "", course_id: "", date_completed: "", date_completed_display: "" });
      setActivity((current) => [`Training record saved: ${tcMemberMap[result.record.member_id]?.full_name || "staff member"}`, ...current]);
      showMessage("success", "Training record saved successfully");
    } catch (error) {
      console.error("Training record save error:", error);
      showMessage("error", "Could not save changes. Please try again.");
    }
  }

  async function deleteTrainingOrganisation(org) {
    if (!window.confirm(`Delete organisation "${org.name}"?`)) return;
    try {
      const { response, result } = await callAdminAction("delete-organisation", { id: org.id });
      if (!response.ok) {
        console.error("Organisation delete error:", result);
        showMessage("error", result.error || "Could not delete organisation. Check whether staff members still exist.");
        return;
      }
      const refreshed = await loadTrainingComplianceData({ quiet: true });
      const verified = !(refreshed?.organisations || []).some((item) => item.id === org.id);
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastFetchCount: refreshed?.organisations?.length ?? current.lastFetchCount }));
      showMessage(verified ? "success" : "error", verified ? "Organisation deleted successfully" : "Organisation delete could not be verified.");
    } catch (error) {
      console.error("Organisation delete error:", error);
      showMessage("error", "Could not delete organisation. Please try again.");
    }
  }

  async function deleteTrainingMember(member) {
    if (!window.confirm(`Delete staff member "${member.full_name}"?`)) return;
    try {
      const { response, result } = await callAdminAction("delete-member", { id: member.id });
      if (!response.ok) {
        console.error("Staff member delete error:", result);
        showMessage("error", result.error || "Could not delete staff member. Check whether training records still exist.");
        return;
      }
      const refreshed = await loadTrainingComplianceData({ quiet: true });
      const verified = !(refreshed?.members || []).some((item) => item.id === member.id);
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastFetchCount: refreshed?.members?.length ?? current.lastFetchCount }));
      showMessage(verified ? "success" : "error", verified ? "Staff member deleted successfully" : "Staff member delete could not be verified.");
    } catch (error) {
      console.error("Staff member delete error:", error);
      showMessage("error", "Could not delete staff member. Please try again.");
    }
  }

  async function deleteTrainingRecord(record) {
    if (!window.confirm("Delete this training record?")) return;
    try {
      const { response, result } = await callAdminAction("delete-training-record", { id: record.id });
      if (!response.ok) {
        console.error("Training record delete error:", result);
        showMessage("error", result.error || "Could not delete training record.");
        return;
      }
      const refreshed = await loadTrainingComplianceData({ quiet: true });
      const verified = !(refreshed?.records || []).some((item) => item.id === record.id);
      setDebugInfo((current) => ({ ...current, lastSaveResponse: result, lastFetchCount: refreshed?.records?.length ?? current.lastFetchCount }));
      showMessage(verified ? "success" : "error", verified ? "Training record deleted successfully" : "Training record delete could not be verified.");
    } catch (error) {
      console.error("Training record delete error:", error);
      showMessage("error", "Could not delete training record. Please try again.");
    }
  }

  function updateExportOption(name, value) {
    setExportOptions((current) => ({ ...current, [name]: value }));
    setExportPreviewOpen(false);
  }

  function updateExportFilter(e) {
    const { name, value } = e.target;
    setExportOptions((current) => ({
      ...current,
      filters: {
        ...current.filters,
        [name]: value,
        ...(name === "organisation_id" ? { member_id: "" } : {})
      }
    }));
    setExportPreviewOpen(false);
  }

  function updateExportField(field) {
    setExportOptions((current) => ({ ...current, fields: { ...current.fields, [field]: !current.fields[field] } }));
    setExportPreviewOpen(false);
  }

  function clearExportFilters() {
    setExportOptions((current) => ({
      ...current,
      filters: { organisation_id: "", member_id: "", course_id: "", status: "", quick: "", completed_from: "", completed_to: "", expiry_from: "", expiry_to: "" }
    }));
    setExportPreviewOpen(false);
  }

  function dateInRange(value, from, to) {
    if (!value) return !from && !to;
    if (from && value < from) return false;
    if (to && value > to) return false;
    return true;
  }

  function getExportRecords() {
    const filters = exportOptions.filters;
    const forcedStatus = exportOptions.type === "expiring_report" ? "expiring" : exportOptions.type === "expired_report" ? "expired" : "";
    return enrichedTrainingRecords.filter((record) => {
      if (filters.organisation_id && record.staffMember?.organisation_id !== filters.organisation_id) return false;
      if (filters.member_id && record.member_id !== filters.member_id) return false;
      if (filters.course_id && record.course_id !== filters.course_id) return false;
      if (forcedStatus && record.status !== forcedStatus) return false;
      if (filters.status && record.status !== filters.status) return false;
      if (filters.quick === "valid" && record.status !== "valid") return false;
      if (filters.quick === "expiring" && record.status !== "expiring") return false;
      if (filters.quick === "expired" && record.status !== "expired") return false;
      if (!dateInRange(record.date_completed, filters.completed_from, filters.completed_to)) return false;
      if (!dateInRange(record.expiry_date, filters.expiry_from, filters.expiry_to)) return false;
      return true;
    });
  }

  function getExportOrganisations(records) {
    const filters = exportOptions.filters;
    const recordOrgIds = new Set(records.map((record) => record.staffMember?.organisation_id).filter(Boolean));
    return tcOrganisations.filter((org) => {
      if (filters.organisation_id && org.id !== filters.organisation_id) return false;
      if ((filters.member_id || filters.course_id || filters.status || filters.quick || filters.completed_from || filters.completed_to || filters.expiry_from || filters.expiry_to) && !recordOrgIds.has(org.id)) return false;
      return true;
    });
  }

  function getExportMembers(records) {
    const filters = exportOptions.filters;
    const recordMemberIds = new Set(records.map((record) => record.member_id).filter(Boolean));
    return tcMembers.filter((member) => {
      if (filters.organisation_id && member.organisation_id !== filters.organisation_id) return false;
      if (filters.member_id && member.id !== filters.member_id) return false;
      if ((filters.course_id || filters.status || filters.quick || filters.completed_from || filters.completed_to || filters.expiry_from || filters.expiry_to) && !recordMemberIds.has(member.id)) return false;
      return true;
    });
  }

  function exportStats(records, organisations, members) {
    const byCourse = {};
    const byOrganisation = {};
    records.forEach((record) => {
      const courseName = record.course?.name || "Unknown course";
      const orgName = record.organisation?.name || "Unknown organisation";
      byCourse[courseName] = (byCourse[courseName] || 0) + 1;
      byOrganisation[orgName] = (byOrganisation[orgName] || 0) + 1;
    });
    const valid = records.filter((record) => record.status === "valid").length;
    const expiring = records.filter((record) => record.status === "expiring").length;
    const expired = records.filter((record) => record.status === "expired").length;
    return {
      total_organisations: organisations.length,
      total_staff: members.length,
      total_training_records: records.length,
      valid_records: valid,
      expiring_within_30_days: expiring,
      expired_records: expired,
      compliance_percentage: records.length ? `${Math.round((valid / records.length) * 100)}%` : "0%",
      records_by_course: Object.entries(byCourse).map(([name, count]) => `${name}: ${count}`).join("; "),
      records_by_organisation: Object.entries(byOrganisation).map(([name, count]) => `${name}: ${count}`).join("; ")
    };
  }

  function selectedExportFields(type) {
    const fields = exportOptions.fields;
    const organisationFields = ["organisation_name", "contact_name", "contact_email", "phone"];
    const staffFields = ["full_name", "email", "role", "organisation"];
    const trainingFields = ["course_name", "date_completed", "expiry_date", "status"];
    const allowed = type === "organisations" ? organisationFields : type === "staff" ? staffFields : [...organisationFields, ...staffFields, ...trainingFields];
    return allowed.filter((field) => fields[field]);
  }

  function buildExportRows() {
    const records = getExportRecords();
    const organisations = getExportOrganisations(records);
    const members = getExportMembers(records);
    const type = exportOptions.type;
    let rows = [];

    if (type === "organisations") {
      rows = organisations.map((org) => ({ organisation_name: org.name, contact_name: org.contact_name, contact_email: org.contact_email, phone: org.phone }));
    } else if (type === "staff") {
      rows = members.map((member) => ({ full_name: member.full_name, email: member.email, role: member.role, organisation: tcOrganisationMap[member.organisation_id]?.name || "" }));
    } else {
      rows = records.map((record) => ({
        organisation_name: record.organisation?.name || "",
        contact_name: record.organisation?.contact_name || "",
        contact_email: record.organisation?.contact_email || "",
        phone: record.organisation?.phone || "",
        full_name: record.staffMember?.full_name || "",
        email: record.staffMember?.email || "",
        role: record.staffMember?.role || "",
        organisation: record.organisation?.name || "",
        course_name: record.course?.name || "",
        date_completed: formatDisplayDate(record.date_completed),
        expiry_date: formatDisplayDate(record.expiry_date),
        status: record.status || ""
      }));
    }

    const fields = selectedExportFields(type === "organisations" ? "organisations" : type === "staff" ? "staff" : "records");
    return {
      rows: rows.map((row) => Object.fromEntries(fields.map((field) => [formatExportLabel(field), row[field] || ""]))),
      rawRows: rows,
      fields,
      stats: exportStats(records, organisations, members),
      records,
      organisations,
      members
    };
  }

  function downloadTrainingComplianceCsv() {
    const exportData = buildExportRows();
    const statRows = exportOptions.includeStats ? Object.entries(exportData.stats).map(([key, value]) => ({ Metric: formatExportLabel(key), Value: value })) : [];
    const dataRows = exportData.rows;
    if (!dataRows.length && !statRows.length) {
      showMessage("error", "No export data matches the selected filters.");
      return;
    }
    const sections = [];
    if (statRows.length) {
      sections.push(["Metric,Value", ...statRows.map((row) => `${csvCell(row.Metric)},${csvCell(row.Value)}`)].join("\n"));
    }
    if (dataRows.length) {
      const headers = Object.keys(dataRows[0]);
      sections.push([headers.map(csvCell).join(","), ...dataRows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n"));
    }
    const blob = new Blob([sections.join("\n\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `training-compliance-${exportOptions.type}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function reportRowsForType(reportType) {
    if (reportType === "expired") return expiredTrainingRecords;
    if (reportType === "expiring") return expiringWithinThirtyDays;
    if (reportType === "matrix") return enrichedTrainingRecords;
    if (reportType === "council") return enrichedTrainingRecords;
    if (reportType === "organisation") return enrichedTrainingRecords;
    return enrichedTrainingRecords;
  }

  function downloadReportCsv(reportType, reportTitle) {
    if (reportType === "reminders" || reportType === "audit") {
      showMessage("error", "Reminder and audit trail exports are coming next.");
      return;
    }
    const records = reportRowsForType(reportType);
    if (!records.length && reportType !== "organisation") {
      showMessage("error", "No records available for this report.");
      return;
    }
    const rows = reportType === "organisation"
      ? tcOrganisations.map((org) => ({
          Organisation: org.name || "",
          "Contact Name": org.contact_name || "",
          "Contact Email": org.contact_email || "",
          Phone: org.phone || "",
          Staff: tcMembers.filter((member) => member.organisation_id === org.id).length,
          Records: enrichedTrainingRecords.filter((record) => record.organisation_id === org.id).length
        }))
      : records.map((record) => ({
          Organisation: record.organisation?.name || "",
          "Staff Member": record.staffMember?.full_name || "",
          Email: record.staffMember?.email || "",
          Role: record.staffMember?.role || "",
          Course: record.course?.name || "",
          Completed: formatDisplayDate(record.date_completed),
          Expiry: formatDisplayDate(record.expiry_date),
          Status: record.status || ""
        }));
    if (!rows.length) {
      showMessage("error", "No data available for this report.");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csv = [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage("success", `${reportTitle} downloaded.`);
  }

  function buildReportStatus(report) {
    const records = reportRowsForType(report.type);
    const organisationReportData = report.type === "council" && selectedReportOrganisationId ? getOrganisationComplianceReportData(selectedReportOrganisationId) : null;
    return {
      title: report.title,
      format: report.format,
      status: report.type === "council" || report.type === "audit" ? "Ready to generate PDF" : report.action === "pdf" ? "PDF generation is not active yet" : report.action === "stub" ? "Report data source is being connected" : "Ready to export",
      description: report.description,
      selectedOrganisation: organisationReportData?.organisation?.name || "",
      counts: {
        organisations: report.type === "council" && organisationReportData ? 1 : tcOrganisations.length,
        staff: organisationReportData ? organisationReportData.members.length : tcMembers.length,
        records: organisationReportData ? organisationReportData.records.length : report.type === "organisation" ? tcOrganisations.length : records.length,
        valid: organisationReportData ? organisationReportData.validRecords.length : trainingSummary.valid,
        expiring7: organisationReportData ? organisationReportData.expiring7Records.length : expiringWithinSevenDays.length,
        expiring30: organisationReportData ? organisationReportData.expiring30Records.length : expiringWithinThirtyDays.length,
        expired: organisationReportData ? organisationReportData.expiredRecords.length : expiredTrainingRecords.length,
        missing: organisationReportData ? organisationReportData.missingMembers.length : missingTrainingMembers.length
      },
      updatedAt: new Date().toISOString()
    };
  }

  function getOrganisationComplianceReportData(organisationId) {
    const organisation = tcOrganisationMap[organisationId];
    const membersForOrganisation = tcMembers.filter((member) => member.organisation_id === organisationId);
    const memberIds = new Set(membersForOrganisation.map((member) => member.id));
    const recordsForOrganisation = enrichedTrainingRecords.filter((record) => memberIds.has(record.member_id));
    const staffWithOrganisationRecords = new Set(recordsForOrganisation.map((record) => record.member_id).filter(Boolean));
    const expiredRecords = recordsForOrganisation.filter((record) => record.status === "expired");
    const expiring7Records = recordsForOrganisation.filter((record) => {
      if (!record.expiry_date) return false;
      const expiry = new Date(`${record.expiry_date}T00:00:00`);
      if (Number.isNaN(expiry.getTime())) return false;
      const daysUntilExpiry = Math.ceil((expiry.getTime() - todayForReports.getTime()) / 86400000);
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });
    const expiring30Records = recordsForOrganisation.filter((record) => record.status === "expiring");
    const validRecords = recordsForOrganisation.filter((record) => record.status === "valid");
    const missingMembers = membersForOrganisation.filter((member) => !staffWithOrganisationRecords.has(member.id));
    const compliantMembers = membersForOrganisation.filter((member) => {
      const memberRecords = recordsForOrganisation.filter((record) => record.member_id === member.id);
      return memberRecords.length > 0 && memberRecords.every((record) => record.status === "valid");
    });
    return { organisation, members: membersForOrganisation, records: recordsForOrganisation, validRecords, expiredRecords, expiring7Records, expiring30Records, missingMembers, compliantMembers };
  }

  function generateCouncilCompliancePdf(organisationId) {
    const reportData = getOrganisationComplianceReportData(organisationId);
    if (!reportData.organisation) {
      throw new Error("Please select an organisation before generating this report.");
    }
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const generatedAt = new Date().toISOString();
    const organisationName = reportData.organisation.name || "Selected Organisation";
    const fileDate = generatedAt.slice(0, 10);
    const fileName = `ace-midas-compliance-report-${fileSafeName(organisationName)}-${fileDate}.pdf`;
    const records = reportData.records;
    const compliantStaffCount = reportData.compliantMembers.length;
    const actionItems = [
      reportData.expiredRecords.length ? `${reportData.expiredRecords.length} expired training record(s) need immediate renewal action.` : "No expired training records currently recorded for this organisation.",
      reportData.expiring7Records.length ? `${reportData.expiring7Records.length} record(s) expire within 7 days and should be prioritised.` : "No records expire within the next 7 days for this organisation.",
      reportData.expiring30Records.length ? `${reportData.expiring30Records.length} record(s) expire within 30 days and should be scheduled for renewal.` : "No records expire within the next 30 days for this organisation.",
      reportData.missingMembers.length ? `${reportData.missingMembers.length} staff member(s) have no training record logged.` : "All listed staff for this organisation have at least one training record.",
      "Reminder log summary can be added once reminder activity reporting is connected to this report."
    ];

    doc.setFillColor(11, 31, 58);
    doc.rect(0, 0, 297, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ACE MiDAS Training", 14, 13);
    doc.setFontSize(12);
    doc.text("Organisation Compliance Report", 14, 22);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text("Organisation Compliance Report", 14, 43);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Organisation: ${organisationName}`, 14, 51);
    doc.text(`Generated: ${formatDisplayDateTime(generatedAt)}`, 14, 57);
    doc.text(`Report scope: Training records, expiry dates and compliance status held in the ACE MiDAS Training portal.`, 14, 63);

    autoTable(doc, {
      startY: 71,
      theme: "grid",
      head: [["Total staff", "Compliant staff", "Expired records", "Expiring 7 days", "Expiring 30 days", "Missing records"]],
      body: [[reportData.members.length, compliantStaffCount, reportData.expiredRecords.length, reportData.expiring7Records.length, reportData.expiring30Records.length, reportData.missingMembers.length]],
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [11, 31, 58], textColor: [255, 255, 255] }
    });

    const tableRows = records.map((record) => [
      record.organisation?.name || "",
      record.staffMember?.full_name || "",
      record.staffMember?.email || "",
      record.staffMember?.role || "",
      record.course?.name || "",
      formatDisplayDate(record.date_completed),
      formatDisplayDate(record.expiry_date),
      record.status || "",
      evidenceForRecord(record.id).length ? "Yes" : "No"
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      theme: "striped",
      head: [["Organisation", "Staff member", "Email", "Role", "Course", "Completed", "Expiry", "Status", "Certificate attached"]],
      body: tableRows.length ? tableRows : [["No records available", "", "", "", "", "", "", "", ""]],
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [16, 185, 129], textColor: [15, 23, 42] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 28 },
        2: { cellWidth: 38 },
        3: { cellWidth: 22 },
        4: { cellWidth: 30 },
        5: { cellWidth: 21 },
        6: { cellWidth: 21 },
        7: { cellWidth: 18 },
        8: { cellWidth: 24 }
      }
    });

    const actionsStartY = doc.lastAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (actionsStartY > pageHeight - 35) doc.addPage();
    const y = actionsStartY > pageHeight - 35 ? 20 : actionsStartY;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Recommended actions", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    actionItems.forEach((item, index) => {
      doc.text(`${index + 1}. ${item}`, 14, y + 8 + index * 6, { maxWidth: 260 });
    });

    doc.save(fileName);
    return fileName;
  }

  function generateAuditTrailPdf() {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const generatedAt = new Date().toISOString();
    const fileDate = generatedAt.slice(0, 10);
    const fileName = `ace-midas-audit-trail-report-${fileDate}.pdf`;
    const auditRows = [
      ...activity.slice(0, 25).map((item, index) => [
        formatDisplayDateTime(generatedAt),
        "Back Office activity",
        item || `Activity item ${index + 1}`,
        "Logged in current session"
      ]),
      ...enrichedTrainingRecords.map((record) => [
        formatDisplayDateTime(record.created_at || generatedAt),
        "Training record",
        `${record.staffMember?.full_name || "Unknown staff"} - ${record.course?.name || "Unknown course"}`,
        `Completed ${formatDisplayDate(record.date_completed)}; expires ${formatDisplayDate(record.expiry_date)}; status ${record.status || "unknown"}`
      ])
    ];

    const recommendedRows = [
      expiredTrainingRecords.length ? `${expiredTrainingRecords.length} expired training record(s) require renewal follow-up.` : "No expired training records are currently recorded.",
      expiringWithinSevenDays.length ? `${expiringWithinSevenDays.length} training record(s) expire within 7 days.` : "No training records expire within 7 days.",
      missingTrainingMembers.length ? `${missingTrainingMembers.length} staff member(s) currently have no training record logged.` : "All listed staff have at least one training record.",
      activity.length ? "Back Office activity rows are included from the available local activity log." : "Dedicated audit log rows are not yet available, so the report includes compliance record activity instead."
    ];

    doc.setFillColor(11, 31, 58);
    doc.rect(0, 0, 297, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ACE MiDAS Training", 14, 13);
    doc.setFontSize(12);
    doc.text("Audit Trail Report", 14, 22);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.text("Audit Trail Report", 14, 43);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDisplayDateTime(generatedAt)}`, 14, 51);
    doc.text("Scope: available compliance records, expiry status, Back Office activity and reminder-ready compliance activity.", 14, 57);

    autoTable(doc, {
      startY: 66,
      theme: "grid",
      head: [["Organisations", "Staff", "Expiring 7 days", "Expired records", "Training records", "Activity rows"]],
      body: [[tcOrganisations.length, tcMembers.length, expiringWithinSevenDays.length, expiredTrainingRecords.length, enrichedTrainingRecords.length, auditRows.length]],
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [11, 31, 58], textColor: [255, 255, 255] }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      theme: "striped",
      head: [["Date/time", "Activity type", "Record", "Details"]],
      body: auditRows.length ? auditRows : [[formatDisplayDateTime(generatedAt), "No activity available", "No audit rows found", "Add training records or reminder logs to populate this report."]],
      styles: { fontSize: 8, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: [16, 185, 129], textColor: [15, 23, 42] },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 38 },
        2: { cellWidth: 72 },
        3: { cellWidth: 126 }
      }
    });

    const actionsStartY = doc.lastAutoTable.finalY + 10;
    const pageHeight = doc.internal.pageSize.getHeight();
    if (actionsStartY > pageHeight - 35) doc.addPage();
    const y = actionsStartY > pageHeight - 35 ? 20 : actionsStartY;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Audit notes and recommended actions", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    recommendedRows.forEach((item, index) => {
      doc.text(`${index + 1}. ${item}`, 14, y + 8 + index * 6, { maxWidth: 260 });
    });

    doc.save(fileName);
    return fileName;
  }

  async function handleReportAction(report) {
    setGeneratingReport(report.title);
    setReportStatusPanel(buildReportStatus(report));
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (report.type === "council") {
        if (!selectedReportOrganisationId) {
          setReportStatusPanel((current) => current ? { ...current, status: "Organisation selection required" } : current);
          showMessage("error", "Please select an organisation before generating this report.");
          return;
        }
        const fileName = generateCouncilCompliancePdf(selectedReportOrganisationId);
        await saveReportHistoryEntry(report, fileName);
        setReportStatusPanel((current) => current ? { ...current, status: "PDF generated", fileName } : current);
        showMessage("success", "Organisation Compliance Report PDF downloaded.");
        return;
      }
      if (report.type === "audit") {
        const fileName = generateAuditTrailPdf();
        await saveReportHistoryEntry(report, fileName);
        setReportStatusPanel((current) => current ? { ...current, status: "PDF generated", fileName } : current);
        showMessage("success", "Audit Trail Report PDF downloaded.");
        return;
      }
      if (report.action === "pdf") {
        showMessage("error", "PDF generation is not active yet.");
        return;
      }
      if (report.action === "stub") {
        showMessage("success", `${report.title} status opened.`);
        return;
      }
      downloadReportCsv(report.type, report.title);
    } catch (error) {
      console.error("Report action error:", error);
      showMessage("error", "Report action could not be completed. Please try again.");
    } finally {
      setGeneratingReport("");
    }
  }

  function printTrainingComplianceReport() {
    const exportData = buildExportRows();
    const headers = exportData.rows[0] ? Object.keys(exportData.rows[0]) : [];
    const statsHtml = exportOptions.includeStats ? `<section><h2>Summary Statistics</h2><table>${Object.entries(exportData.stats).map(([key, value]) => `<tr><th>${htmlEscape(formatExportLabel(key))}</th><td>${htmlEscape(value)}</td></tr>`).join("")}</table></section>` : "";
    const rowsHtml = exportData.rows.length ? `<table><thead><tr>${headers.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}</tr></thead><tbody>${exportData.rows.map((row) => `<tr>${headers.map((header) => `<td>${htmlEscape(row[header])}</td>`).join("")}</tr>`).join("")}</tbody></table>` : "<p>No records match the selected filters.</p>";
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showMessage("error", "Unable to open print preview. Please allow pop-ups for this site.");
      return;
    }
    printWindow.document.write(`<!doctype html><html><head><title>Training Compliance Export</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#0f172a}h1{font-size:28px}h2{margin-top:24px}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left;font-size:12px}th{background:#f1f5f9}.meta{color:#475569;margin-top:4px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Print / Save as PDF</button><h1>ACE MiDAS Training Compliance Report</h1><p class="meta">Export type: ${htmlEscape(formatExportLabel(exportOptions.type))}</p><p class="meta">Generated: ${formatDisplayDateTime(new Date().toISOString())}</p>${statsHtml}<section><h2>Export Data</h2>${rowsHtml}</section></body></html>`);
    printWindow.document.close();
    printWindow.focus();
  }

  function updateMediaField(slot, field, value) {
    setMediaSettings((current) => ({
      ...current,
      [slot]: {
        ...getMediaSlot(current, slot),
        [field]: field === "x" || field === "y" || field === "zoom" ? Number(value) : value
      }
    }));
  }

  async function saveMediaSlot(slot) {
    const media = getMediaSlot(mediaSettings, slot);
    if (!supabase) {
      showMessage("success", `${media.label} saved locally. Supabase is not configured yet.`);
      return;
    }
    const payload = {
      slot,
      image_url: media.imageUrl,
      alt_text: media.altText,
      object_position_x: Math.round(media.x ?? 50),
      object_position_y: Math.round(media.y ?? 50),
      zoom: Number(media.zoom ?? 1),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("site_media_settings").upsert(payload, { onConflict: "slot" });
    if (error) {
      showMessage("success", `${media.label} saved locally. Supabase table site_media_settings is not ready yet.`);
      setActivity((current) => [`Media setting saved locally: ${media.label}`, ...current]);
      return;
    }
    setActivity((current) => [`Media setting saved: ${media.label}`, ...current]);
    showMessage("success", `${media.label} saved.`);
  }

  async function uploadMediaFile(slot, file) {
    if (!file) return;
    if (!supabase?.storage) {
      showMessage("error", "Supabase Storage is not configured. Use an image URL for now.");
      return;
    }
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${slot}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("site-media").upload(filePath, file, { upsert: true });
    if (error) {
      showMessage("error", `${error.message || "Upload failed."} Use an image URL if the site-media bucket is not available yet.`);
      return;
    }
    const { data } = supabase.storage.from("site-media").getPublicUrl(filePath);
    updateMediaField(slot, "imageUrl", data.publicUrl);
    showMessage("success", "Image uploaded. Save the media slot to keep it.");
  }

  const premiumReportCards = [
    { title: "Organisation Compliance Report", type: "council", format: "PDF", action: "pdf", description: "Council-ready overview of one organisation's staff training, expiry status and provider compliance evidence." },
    { title: "Full Training Matrix", type: "matrix", format: "CSV", action: "csv", description: "Complete staff-by-course matrix for operational tracking and spreadsheet analysis." },
    { title: "Expired Training Report", type: "expired", format: "CSV", action: "csv", description: "Focused list of expired records requiring urgent renewal or follow-up action." },
    { title: "Expiring Soon Report", type: "expiring", format: "Excel-ready", action: "csv", description: "Upcoming expiries within the compliance window, ready for planning and reminders." },
    { title: "Reminder Activity Report", type: "reminders", format: "CSV", action: "stub", description: "Email reminder history, delivery status and failed reminder review." },
    { title: "Audit Trail Report", type: "audit", format: "PDF", action: "pdf", description: "Structured audit trail for record changes, exports and compliance activity." },
    { title: "Organisation Summary", type: "organisation", format: "Excel-ready", action: "csv", description: "Organisation-level staff counts, record totals and contact details in one report." }
  ];

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-md min-w-0 rounded-2xl bg-white p-4 text-slate-950 shadow-sm sm:p-6">
          <p className="font-semibold text-emerald-700">Back Office</p>
          <h1 className="mt-3 text-2xl font-black sm:text-3xl">Admin unlock</h1>
          {message ? <p className={`mt-5 rounded-xl p-3 text-sm font-semibold ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</p> : null}
          <form onSubmit={unlockBackOffice} className="mt-6 grid gap-4">
            <input type="password" value={code} onChange={(e) => setCode(e.target.value)} className="rounded-xl border border-slate-200 p-4" placeholder="Admin code" required />
            <button type="submit" className="w-full rounded-xl bg-slate-950 p-4 font-black text-white">Unlock Back Office</button>
            <button type="button" onClick={() => setPage("Home")} className="rounded-xl border border-slate-200 p-4 font-bold text-slate-700">Back to Site</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 px-3 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-semibold text-emerald-300">ACE MiDAS Training</p>
            <h1 className="mt-2 text-4xl font-black">Back Office</h1>
          </div>
          <button type="button" onClick={() => setPage("Home")} className="rounded-xl bg-white px-5 py-3 font-bold text-slate-950">Back to Site</button>
        </div>

        {message ? <p className={`mt-6 rounded-xl p-4 text-sm font-semibold ${message.type === "error" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{message.text}</p> : null}

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <button type="button" onClick={() => setDebugOpen((current) => !current)} className="text-sm font-black text-emerald-300">{debugOpen ? "Hide Debug" : "Debug"}</button>
          {debugOpen ? (
            <div className="mt-3 grid gap-2 text-xs text-slate-200">
              <p>Last fetch count: {debugInfo.lastFetchCount ?? "Not fetched yet"}</p>
              <p>Last saved setting timestamp: {debugInfo.lastSavedSettingTimestamp ? formatDisplayDateTime(debugInfo.lastSavedSettingTimestamp) : "Not saved yet"}</p>
              <pre className="max-h-56 overflow-auto rounded-xl bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-100">{JSON.stringify(debugInfo.lastSaveResponse, null, 2) || "No save response yet"}</pre>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 lg:mt-8 lg:grid-cols-[240px_1fr] lg:gap-6">
          <aside className="overflow-x-auto rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="flex gap-2 lg:grid lg:gap-2">
              {tabs.map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`min-w-max rounded-xl px-4 py-3 text-left text-sm font-bold ${activeTab === tab ? "bg-emerald-400 text-slate-950" : "text-white hover:bg-white/10"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 text-slate-950 shadow-sm sm:p-6">
            {activeTab === "Dashboard" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Dashboard</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Posts</p><p className="mt-2 text-2xl font-black sm:text-3xl">{posts.length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Reviews</p><p className="mt-2 text-2xl font-black sm:text-3xl">{reviews.length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Onboarding</p><p className="mt-2 text-2xl font-black sm:text-3xl">{onboarding.length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Members</p><p className="mt-2 text-2xl font-black sm:text-3xl">{members.length}</p></div>
                </div>
              </div>
            ) : null}

            {activeTab === "Blogs" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Blogs</h2>
                <form onSubmit={saveBlog} className="mt-6 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="tag" value={blogForm.tag} onChange={updateBlogField} className="rounded-xl border border-slate-200 p-3" placeholder="Tag" />
                    <select name="status" value={blogForm.status} onChange={updateBlogField} className="rounded-xl border border-slate-200 p-3">
                      <option>Draft</option>
                      <option>Published</option>
                    </select>
                  </div>
                  <input name="title" value={blogForm.title} onChange={updateBlogField} className="rounded-xl border border-slate-200 p-3" placeholder="Title" required />
                  <textarea name="content" value={blogForm.content} onChange={updateBlogField} className="rounded-xl border border-slate-200 p-3" rows={7} placeholder="Content" required />
                  <button type="submit" disabled={isSaving} className="w-full rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSaving ? "Saving..." : "Save Blog"}</button>
                </form>
                <div className="mt-8 grid gap-3">
                  {posts.map((post) => <div key={post.id || `${post.title}-${post.status}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-emerald-700">{post.tag} - {post.status}</p><h3 className="mt-1 text-xl font-black">{post.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{post.text}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => updateBlogStatus(post, "Published")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Publish</button><button type="button" onClick={() => updateBlogStatus(post, "Draft")} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Draft</button><button type="button" onClick={() => deleteBlog(post)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button></div></div></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Reviews" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Reviews</h2>
                <form onSubmit={saveReview} className="mt-6 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="rating" value={reviewForm.rating} onChange={updateReviewField} className="rounded-xl border border-slate-200 p-3" placeholder="Rating" />
                    <select name="status" value={reviewForm.status} onChange={updateReviewField} className="rounded-xl border border-slate-200 p-3">
                      <option>Draft</option>
                      <option>Published</option>
                    </select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="name" value={reviewForm.name} onChange={updateReviewField} className="rounded-xl border border-slate-200 p-3" placeholder="Name" required />
                    <input name="organisation" value={reviewForm.organisation} onChange={updateReviewField} className="rounded-xl border border-slate-200 p-3" placeholder="Organisation" />
                  </div>
                  <textarea name="content" value={reviewForm.content} onChange={updateReviewField} className="rounded-xl border border-slate-200 p-3" rows={6} placeholder="Review content" required />
                  <button type="submit" disabled={isSaving} className="w-full rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSaving ? "Saving..." : "Save Review"}</button>
                </form>
                <div className="mt-8 grid gap-3">
                  {reviews.map((review) => <div key={review.id || `${review.name}-${review.org}-${review.status}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-amber-600">{review.rating} - {review.status}</p><h3 className="mt-1 text-xl font-black">{review.name}</h3><p className="text-sm text-slate-500">{review.org}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{review.text}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => updateReviewStatus(review, "Published")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Publish</button><button type="button" onClick={() => updateReviewStatus(review, "Draft")} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Draft</button><button type="button" onClick={() => deleteReview(review)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button></div></div></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Onboarding" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Onboarding</h2>
                <div className="mt-6 grid gap-3">
                  {onboarding.map((item) => <div key={item.id || item.email} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h3 className="text-xl font-black">{item.organisation || "Organisation pending"}</h3><p className="text-sm leading-relaxed text-slate-600">{item.contact_name || item.contact || "Contact pending"} - {item.email}</p><p className="mt-2 text-sm">Tools requested: {item.tools_required || item.modules || "Not specified"}</p><p className="text-sm">Preferred login: {item.preferred_login_method || "Email verification code"}</p><p className="text-sm">Depots/sites: {item.depots || "Not specified"} | Road staff: {item.road_staff || "Not specified"}</p>{item.notes ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.notes}</p> : null}{item.stripe_session_id ? <p className="mt-2 break-all text-xs text-slate-500">Stripe session: {item.stripe_session_id}</p> : null}</div><p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{item.status || "New"}</p></div></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Members" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Members</h2>
                <form onSubmit={createMemberAccount} className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-xl font-black">Create member/customer account</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="organisation" value={memberForm.organisation} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3" placeholder="Organisation name" required />
                    <input name="contact_name" value={memberForm.contact_name} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3" placeholder="Main contact name" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input type="email" name="email" value={memberForm.email} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3" placeholder="Approved login email" required />
                    <input name="username" value={memberForm.username} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3" placeholder="Username" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <select name="subscription_status" value={memberForm.subscription_status} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3">{subscriptionStatusOptions.map((status) => <option key={status}>{status}</option>)}</select>
                    <select name="onboarding_status" value={memberForm.onboarding_status} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3">{onboardingStatusOptions.map((status) => <option key={status}>{status}</option>)}</select>
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold"><input type="checkbox" name="is_active" checked={memberForm.is_active} onChange={updateMemberFormField} /> Active login access</label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
                    <input name="admin_password_reference" value={memberForm.admin_password_reference} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3 font-mono text-sm" placeholder="Admin password/reference" />
                    <button type="button" onClick={() => setMemberForm((current) => ({ ...current, admin_password_reference: generateAdminReference() }))} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Generate</button>
                    <button type="button" onClick={() => copyReference(memberForm.admin_password_reference)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Copy</button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="med_app_url" value={memberForm.med_app_url} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3" placeholder="Medication app URL" />
                    <input name="journey_app_url" value={memberForm.journey_app_url} onChange={updateMemberFormField} className="rounded-xl border border-slate-200 p-3" placeholder="Journey/compliance portal URL" />
                  </div>
                  <button type="submit" className="w-full rounded-xl bg-slate-950 p-4 font-black text-white">Create Member</button>
                </form>
                <div className="mt-8 grid gap-4">
                  {members.map((member) => <div key={member.id || member.email || member.organisation} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><h3 className="text-xl font-black">{member.organisation || "Organisation pending"}</h3><p className="text-sm leading-relaxed text-slate-600">{member.contact_name || "Contact pending"} - {member.email}</p><p className="text-sm font-bold text-slate-700">Subscription: {member.subscription_status || "Pending"} | Onboarding: {member.onboarding_status || member.setup_status || "New"} | Login: {member.is_active ? "Active" : "Disabled"}</p>{member.stripe_session_id ? <p className="mt-2 break-all text-xs text-slate-500">Stripe session: {member.stripe_session_id}</p> : null}</div><button type="button" onClick={() => saveMemberSettings(member)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Save Member Settings</button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">Organisation<input value={member.organisation || ""} onChange={(e) => updateExistingMember(member, "organisation", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Contact name<input value={member.contact_name || ""} onChange={(e) => updateExistingMember(member, "contact_name", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Approved email<input type="email" value={member.email || ""} onChange={(e) => updateExistingMember(member, "email", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Username<input value={member.username || ""} onChange={(e) => updateExistingMember(member, "username", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label></div><div className="mt-4 grid gap-4 md:grid-cols-3"><label className="grid gap-2 text-sm font-bold text-slate-700">Subscription status<select value={member.subscription_status || "Pending"} onChange={(e) => updateExistingMember(member, "subscription_status", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{subscriptionStatusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="grid gap-2 text-sm font-bold text-slate-700">Onboarding status<select value={member.onboarding_status || member.setup_status || "New"} onChange={(e) => updateExistingMember(member, "onboarding_status", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{onboardingStatusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold"><input type="checkbox" checked={member.is_active === true} onChange={(e) => updateExistingMember(member, "is_active", e.target.checked)} /> Active login access</label></div><div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto]"><input value={member.admin_password_reference || ""} onChange={(e) => updateExistingMember(member, "admin_password_reference", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-mono text-sm" placeholder="Admin password/reference" /><button type="button" onClick={() => regenerateMemberReference(member)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Regenerate</button><button type="button" onClick={() => copyReference(member.admin_password_reference)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Copy</button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">Medication app URL<input value={member.med_app_url || ""} onChange={(e) => updateExistingMember(member, "med_app_url", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder="https://..." /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Journey/compliance portal URL<input value={member.journey_app_url || ""} onChange={(e) => updateExistingMember(member, "journey_app_url", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder="https://..." /></label></div><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">Med app status<select value={member.med_app_status || "Pending"} onChange={(e) => updateExistingMember(member, "med_app_status", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="grid gap-2 text-sm font-bold text-slate-700">Journey app status<select value={member.journey_app_status || "Pending"} onChange={(e) => updateExistingMember(member, "journey_app_status", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label></div></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Training Compliance" ? (
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-2xl font-black sm:text-3xl">Training Compliance</h2>
                  <button type="button" onClick={() => setActiveTab("Export Centre")} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white">Open Export Centre</button>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Organisations</p><p className="mt-2 text-3xl font-black">{trainingSummary.organisations}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Members/staff</p><p className="mt-2 text-3xl font-black">{trainingSummary.members}</p></div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><p className="text-sm font-semibold text-emerald-700">Valid records</p><p className="mt-2 text-3xl font-black text-emerald-700">{trainingSummary.valid}</p></div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><p className="text-sm font-semibold text-amber-700">Expiring 30 days</p><p className="mt-2 text-3xl font-black text-amber-700">{trainingSummary.expiring}</p></div>
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm"><p className="text-sm font-semibold text-red-700">Expired</p><p className="mt-2 text-3xl font-black text-red-700">{trainingSummary.expired}</p></div>
                </div>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Compliance risk dashboard</p>
                      <h3 className="mt-2 text-2xl font-black">Operational risk snapshot</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">Select a card to focus the training records below.</p>
                    </div>
                    <button type="button" onClick={clearRiskFilter} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-700">Clear filter</button>
                  </div>
                  {riskFilter ? <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm font-bold text-slate-700">Active risk filter: {riskFilter}</p> : null}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                    <button type="button" onClick={() => applyRiskFilter("expired")} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${riskFilter === "expired" ? "border-red-400 bg-red-100" : "border-red-200 bg-red-50"}`}><p className="text-xs font-bold text-red-700">Expired Training</p><p className="mt-2 text-3xl font-black text-red-700">{expiredTrainingRecords.length}</p></button>
                    <button type="button" onClick={() => applyRiskFilter("expiring7")} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${riskFilter === "expiring7" ? "border-orange-400 bg-orange-100" : "border-orange-200 bg-orange-50"}`}><p className="text-xs font-bold text-orange-700">Expiring Within 7 Days</p><p className="mt-2 text-3xl font-black text-orange-700">{expiringWithinSevenDays.length}</p></button>
                    <button type="button" onClick={() => applyRiskFilter("expiring30")} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${riskFilter === "expiring30" ? "border-amber-400 bg-amber-100" : "border-amber-200 bg-amber-50"}`}><p className="text-xs font-bold text-amber-700">Expiring Within 30 Days</p><p className="mt-2 text-3xl font-black text-amber-700">{expiringWithinThirtyDays.length}</p></button>
                    <button type="button" onClick={() => applyRiskFilter("expiring60")} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${riskFilter === "expiring60" ? "border-yellow-400 bg-yellow-100" : "border-yellow-200 bg-yellow-50"}`}><p className="text-xs font-bold text-yellow-700">Expiring Within 60 Days</p><p className="mt-2 text-3xl font-black text-yellow-700">{expiringWithinSixtyDays.length}</p></button>
                    <button type="button" onClick={() => applyRiskFilter("expiring90")} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${riskFilter === "expiring90" ? "border-lime-400 bg-lime-100" : "border-lime-200 bg-lime-50"}`}><p className="text-xs font-bold text-lime-700">Expiring Within 90 Days</p><p className="mt-2 text-3xl font-black text-lime-700">{expiringWithinNinetyDays.length}</p></button>
                    <button type="button" onClick={() => applyRiskFilter("certMissing")} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${riskFilter === "certMissing" ? "border-slate-400 bg-slate-100" : "border-slate-200 bg-slate-50"}`}><p className="text-xs font-bold text-slate-600">Certificates Missing</p><p className="mt-2 text-3xl font-black">{certificateMissingRecords.length}</p></button>
                    <button type="button" onClick={() => applyRiskFilter("certAttached")} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${riskFilter === "certAttached" ? "border-emerald-400 bg-emerald-100" : "border-emerald-200 bg-emerald-50"}`}><p className="text-xs font-bold text-emerald-700">Certificates Attached</p><p className="mt-2 text-3xl font-black text-emerald-700">{certificateAttachedRecords.length}</p></button>
                    <button type="button" onClick={() => applyRiskFilter("reminderFailures")} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${riskFilter === "reminderFailures" ? "border-rose-400 bg-rose-100" : "border-rose-200 bg-rose-50"}`}><p className="text-xs font-bold text-rose-700">Reminder Failures</p><p className="mt-2 text-3xl font-black text-rose-700">{reminderFailureRecords.length}</p></button>
                    <button type="button" onClick={() => applyRiskFilter("")} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><p className="text-xs font-bold text-slate-500">Compliance Percentage</p><p className="mt-2 text-3xl font-black">{compliancePercentage}%</p></button>
                  </div>
                </section>

                <div className="mt-8 grid gap-6">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-xl font-black">Organisations</h3>
                    <form onSubmit={saveTrainingOrganisation} className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
                      <input name="name" value={tcOrgForm.name} onChange={updateTcOrgForm} className="min-w-0 rounded-xl border border-slate-200 p-3" placeholder="Organisation name" required />
                      <input name="contact_name" value={tcOrgForm.contact_name} onChange={updateTcOrgForm} className="min-w-0 rounded-xl border border-slate-200 p-3" placeholder="Contact name" />
                      <input type="email" name="contact_email" value={tcOrgForm.contact_email} onChange={updateTcOrgForm} className="min-w-0 rounded-xl border border-slate-200 p-3" placeholder="Contact email" />
                      <input name="phone" value={tcOrgForm.phone} onChange={updateTcOrgForm} className="min-w-0 rounded-xl border border-slate-200 p-3" placeholder="Phone" />
                      <button type="submit" className="rounded-xl bg-slate-950 p-3 font-black text-white lg:col-span-2 xl:col-span-4">Add Organisation</button>
                    </form>
                    <div className="mt-5 grid gap-3">
                      {tcOrganisations.map((org) => <div key={org.id} className="grid min-w-0 gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto_auto]">
                        <input value={org.name || ""} onChange={(e) => updateTrainingOrganisation(org.id, "name", e.target.value)} className="min-w-0 rounded-lg border border-slate-200 p-2" />
                        <input value={org.contact_name || ""} onChange={(e) => updateTrainingOrganisation(org.id, "contact_name", e.target.value)} className="min-w-0 rounded-lg border border-slate-200 p-2" placeholder="Contact" />
                        <input value={org.contact_email || ""} onChange={(e) => updateTrainingOrganisation(org.id, "contact_email", e.target.value)} className="min-w-0 rounded-lg border border-slate-200 p-2" placeholder="Email" />
                        <input value={org.phone || ""} onChange={(e) => updateTrainingOrganisation(org.id, "phone", e.target.value)} className="min-w-0 rounded-lg border border-slate-200 p-2" placeholder="Phone" />
                        <button type="button" onClick={() => saveTrainingOrganisationRow(org)} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white">Save</button>
                        <button type="button" onClick={() => deleteTrainingOrganisation(org)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white">Delete</button>
                      </div>)}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-xl font-black">Members / staff</h3>
                    <form onSubmit={saveTrainingMember} className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto]">
                      <select name="organisation_id" value={tcMemberForm.organisation_id} onChange={updateTcMemberForm} className="min-w-0 rounded-xl border border-slate-200 p-3" required><option value="">Organisation</option>{tcOrganisations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select>
                      <input name="full_name" value={tcMemberForm.full_name} onChange={updateTcMemberForm} className="min-w-0 rounded-xl border border-slate-200 p-3" placeholder="Full name" required />
                      <input type="email" name="email" value={tcMemberForm.email} onChange={updateTcMemberForm} className="min-w-0 rounded-xl border border-slate-200 p-3" placeholder="Email" required />
                      <input name="role" value={tcMemberForm.role} onChange={updateTcMemberForm} className="min-w-0 rounded-xl border border-slate-200 p-3" placeholder="Role" required />
                      <button type="submit" className="rounded-xl bg-slate-950 p-3 font-black text-white">Add Staff</button>
                    </form>
                    <div className="mt-5 grid gap-3">
                      {tcMembers.map((member) => <div key={member.id} className="grid min-w-0 gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto_auto]">
                        <select value={member.organisation_id || ""} onChange={(e) => updateTrainingMember(member.id, "organisation_id", e.target.value)} className="min-w-0 rounded-lg border border-slate-200 p-2"><option value="">Organisation</option>{tcOrganisations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select>
                        <input value={member.full_name || ""} onChange={(e) => updateTrainingMember(member.id, "full_name", e.target.value)} className="min-w-0 rounded-lg border border-slate-200 p-2" placeholder="Full name" />
                        <input value={member.email || ""} onChange={(e) => updateTrainingMember(member.id, "email", e.target.value)} className="min-w-0 rounded-lg border border-slate-200 p-2" placeholder="Email" />
                        <input value={member.role || ""} onChange={(e) => updateTrainingMember(member.id, "role", e.target.value)} className="min-w-0 rounded-lg border border-slate-200 p-2" placeholder="Role" />
                        <button type="button" onClick={() => saveTrainingMemberRow(member)} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white">Save</button>
                        <button type="button" onClick={() => deleteTrainingMember(member)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white">Delete</button>
                      </div>)}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-xl font-black">Training records</h3>
                    <form onSubmit={saveTrainingRecord} className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]">
                      <select name="organisation_id" value={tcRecordForm.organisation_id} onChange={updateTcRecordForm} className="min-w-0 rounded-xl border border-slate-200 p-3" required><option value="">Organisation</option>{tcOrganisations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select>
                      <select name="member_id" value={tcRecordForm.member_id} onChange={updateTcRecordForm} className="min-w-0 rounded-xl border border-slate-200 p-3" required><option value="">Staff member</option>{tcMembers.filter((member) => !tcRecordForm.organisation_id || member.organisation_id === tcRecordForm.organisation_id).map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select>
                      <select name="course_id" value={tcRecordForm.course_id} onChange={updateTcRecordForm} className="min-w-0 rounded-xl border border-slate-200 p-3" required><option value="">Course</option>{tcCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
                      <input name="date_completed_display" value={tcRecordForm.date_completed_display || formatDisplayDate(tcRecordForm.date_completed)} onChange={updateTcRecordForm} className="min-w-0 rounded-xl border border-slate-200 p-3" placeholder="DD/MM/YYYY" required />
                      <button type="submit" className="rounded-xl bg-slate-950 p-3 font-black text-white">Add Record</button>
                    </form>
                    {tcRecordForm.date_completed && tcRecordForm.course_id ? <p className="mt-3 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700">Expiry preview: {formatDisplayDate(addMonthsToDate(tcRecordForm.date_completed, tcCourseMap[tcRecordForm.course_id]?.validity_months))} ({getTrainingStatus(addMonthsToDate(tcRecordForm.date_completed, tcCourseMap[tcRecordForm.course_id]?.validity_months))})</p> : null}
                    <div className="mt-5 grid gap-4 md:grid-cols-4">
                      <select name="organisation_id" value={tcFilters.organisation_id} onChange={updateTcFilter} className="rounded-xl border border-slate-200 p-3"><option value="">All organisations</option>{tcOrganisations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select>
                      <select name="course_id" value={tcFilters.course_id} onChange={updateTcFilter} className="rounded-xl border border-slate-200 p-3"><option value="">All courses</option>{tcCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
                      <select name="status" value={tcFilters.status} onChange={updateTcFilter} className="rounded-xl border border-slate-200 p-3"><option value="">All statuses</option><option value="valid">Valid</option><option value="expiring">Expiring</option><option value="expired">Expired</option></select>
                      <select name="quick" value={tcFilters.quick} onChange={updateTcFilter} className="rounded-xl border border-slate-200 p-3"><option value="">No quick filter</option><option value="expiring">Expiring within 30 days</option><option value="expired">Expired only</option></select>
                    </div>
                    <div className="mt-5 grid gap-4">
                      {filteredTrainingRecords.map((record) => {
                        const statusClass = record.status === "expired" ? "bg-red-50 text-red-700" : record.status === "expiring" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";
                        const recordEvidence = evidenceForRecord(record.id);
                        const uploadInputId = `evidence-upload-${record.id}`;
                        return <article key={record.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9"><div className="xl:col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Organisation</p><p className="mt-1 break-words text-sm font-black text-slate-950">{record.organisation?.name || "Unknown"}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Member</p><p className="mt-1 break-words text-sm font-black text-slate-950">{record.staffMember?.full_name || "Unknown"}</p></div><div className="xl:col-span-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</p><p className="mt-1 break-all text-sm font-semibold text-slate-700">{record.staffMember?.email || ""}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Role</p><p className="mt-1 break-words text-sm font-semibold text-slate-700">{record.staffMember?.role || ""}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Course</p><p className="mt-1 break-words text-sm font-semibold text-slate-700">{record.course?.name || "Unknown"}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Completed</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatDisplayDate(record.date_completed)}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Expiry</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatDisplayDate(record.expiry_date)}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Status</p><span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{record.status}</span></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Certificate attached</p><p className="mt-1 text-sm font-black text-slate-950">{recordEvidence.length ? "Yes" : "No"}</p></div></div><div className="border-t border-slate-200 bg-slate-50 p-4"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"><input id={uploadInputId} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { uploadTrainingEvidence(record, e.target.files?.[0]); e.target.value = ""; }} /><button type="button" onClick={() => document.getElementById(uploadInputId)?.click()} disabled={evidenceBusyId === record.id} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Upload Certificate</button><button type="button" onClick={() => viewTrainingEvidence(record)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">View Certificate</button><button type="button" onClick={() => downloadLatestTrainingEvidence(record)} disabled={!recordEvidence.length || evidenceBusyId === recordEvidence[0]?.id} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Download Certificate</button><button type="button" onClick={() => deleteLatestTrainingEvidence(record)} disabled={!recordEvidence.length || evidenceBusyId === recordEvidence[0]?.id} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40">Delete Certificate</button><button type="button" onClick={() => deleteTrainingRecord(record)} className="rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white">Delete Record</button></div></div></article>;
                      })}
                      {!filteredTrainingRecords.length ? <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-600">No training records match the selected filters.</p> : null}
                    </div>
                    {selectedEvidenceRecordId ? (
                      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h4 className="text-lg font-black">Training Certificates</h4>
                            <p className="mt-1 text-sm font-semibold text-slate-600">{tcMemberMap[tcRecords.find((item) => item.id === selectedEvidenceRecordId)?.member_id]?.full_name || "Selected record"}</p>
                          </div>
                          <button type="button" onClick={() => setSelectedEvidenceRecordId("")} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-black">Close Certificates</button>
                        </div>
                        <div className="mt-4 grid gap-3">
                          {evidenceForRecord(selectedEvidenceRecordId).length ? evidenceForRecord(selectedEvidenceRecordId).map((evidence) => (
                            <div key={evidence.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
                              <div>
                                <p className="break-all text-sm font-black">{evidence.file_name}</p>
                                <p className="text-xs font-semibold text-slate-500">{evidence.file_type} - uploaded {formatDisplayDateTime(evidence.uploaded_at)}</p>
                              </div>
                              <button type="button" onClick={() => downloadTrainingEvidence(evidence)} disabled={evidenceBusyId === evidence.id} className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-black text-white disabled:opacity-60">Download Certificate</button>
                              <button type="button" onClick={() => deleteTrainingEvidence(evidence)} disabled={evidenceBusyId === evidence.id} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white disabled:opacity-60">Delete Certificate</button>
                            </div>
                          )) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">No certificate is attached to this record.</p>}
                        </div>
                      </div>
                    ) : null}
                  </section>
</div>
              </div>
            ) : null}

            {activeTab === "Reports & Exports" ? (
              <div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Compliance reporting</p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">Reports & Exports</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">Generate operational and council-ready compliance reports from the Training Compliance data already loaded from Supabase.</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab("Export Centre")} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Open Detailed Export Centre</button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-xs font-bold text-slate-500">Total staff</p><p className="mt-2 text-3xl font-black">{tcMembers.length}</p></div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><p className="text-xs font-bold text-emerald-700">Fully compliant staff</p><p className="mt-2 text-3xl font-black text-emerald-700">{fullyCompliantStaff.length}</p></div>
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm"><p className="text-xs font-bold text-red-700">Expired records</p><p className="mt-2 text-3xl font-black text-red-700">{expiredTrainingRecords.length}</p></div>
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm"><p className="text-xs font-bold text-orange-700">Expiring 7 days</p><p className="mt-2 text-3xl font-black text-orange-700">{expiringWithinSevenDays.length}</p></div>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm"><p className="text-xs font-bold text-amber-700">Expiring 30 days</p><p className="mt-2 text-3xl font-black text-amber-700">{expiringWithinThirtyDays.length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold text-slate-500">Missing records</p><p className="mt-2 text-3xl font-black">{missingTrainingMembers.length}</p></div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-6">
                  <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-2xl font-black">Council-ready report library</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">Use quick report cards for common compliance outputs, or move into the existing Export Centre for field-by-field control.</p>
                    </div>
                    <p className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-emerald-200">{compliancePercentage}% record compliance</p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4">
                    <label className="grid gap-2 text-sm font-black text-white">
                      Organisation for Organisation Compliance Report
                      <select value={selectedReportOrganisationId} onChange={(e) => setSelectedReportOrganisationId(e.target.value)} className="min-w-0 rounded-xl border border-white/10 bg-white p-3 text-sm font-bold text-slate-950">
                        <option value="">Select an organisation before generating PDF</option>
                        {tcOrganisations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                      </select>
                    </label>
                    <p className="mt-2 text-xs font-semibold text-slate-300">The PDF will include only staff, records, compliance status, expired items and upcoming expiries for the selected organisation.</p>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {premiumReportCards.map((report) => (
                      <article key={report.title} className="flex min-h-[220px] flex-col justify-between rounded-2xl border border-white/10 bg-white p-5 text-slate-950 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-xl font-black leading-tight">{report.title}</h4>
                            <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{report.format}</span>
                          </div>
                          <p className="mt-4 text-sm leading-relaxed text-slate-600">{report.description}</p>
                        </div>
                        <button type="button" onClick={() => handleReportAction(report)} disabled={generatingReport === report.title} className="mt-6 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
                          {generatingReport === report.title ? "Working..." : report.action === "pdf" ? "Generate Report" : report.action === "stub" ? "View Status" : "Generate / Export"}
                        </button>
                      </article>
                    ))}
                  </div>
                </div>

                {reportStatusPanel ? (
                  <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Report status</p>
                        <h3 className="mt-2 text-2xl font-black">{reportStatusPanel.title}</h3>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{reportStatusPanel.description}</p>
                      </div>
                      <button type="button" onClick={() => setReportStatusPanel(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Close</button>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Current status</p><p className="mt-2 text-sm font-black text-slate-900">{reportStatusPanel.status}</p></div>
                      <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Format</p><p className="mt-2 text-sm font-black text-slate-900">{reportStatusPanel.format}</p></div>
                      <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Matching records</p><p className="mt-2 text-2xl font-black">{reportStatusPanel.counts.records}</p></div>
                      <div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Checked</p><p className="mt-2 text-sm font-black text-slate-900">{formatDisplayDateTime(reportStatusPanel.updatedAt)}</p></div>
                    </div>
                    {reportStatusPanel.fileName ? <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">Downloaded: {reportStatusPanel.fileName}</p> : null}
                    {reportStatusPanel.selectedOrganisation ? <p className="mt-4 rounded-xl bg-white p-4 text-sm font-bold text-slate-800">Selected organisation: {reportStatusPanel.selectedOrganisation}</p> : null}
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <p className="rounded-xl bg-white p-4 text-sm font-bold">Organisations: {reportStatusPanel.counts.organisations}</p>
                      <p className="rounded-xl bg-white p-4 text-sm font-bold">Staff: {reportStatusPanel.counts.staff}</p>
                      <p className="rounded-xl bg-white p-4 text-sm font-bold text-amber-700">Expiring 7 days: {reportStatusPanel.counts.expiring7}</p>
                      <p className="rounded-xl bg-white p-4 text-sm font-bold text-red-700">Expired: {reportStatusPanel.counts.expired}</p>
                    </div>
                    {reportStatusPanel.status === "PDF generation is not active yet" ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-800">PDF generation is not active yet. Use the existing Print / Save as PDF option in Export Centre for now.</p> : null}
                    {reportStatusPanel.status === "Report data source is being connected" ? <p className="mt-4 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-800">Reminder activity and audit trail exports need their dedicated activity data source connected before download is enabled.</p> : null}
                  </section>
                ) : null}

                <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Report history</p>
                      <h3 className="mt-2 text-2xl font-black">Recent Reports</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">This records PDF report generations only. The PDF file itself is not stored yet.</p>
                    </div>
                    <button type="button" onClick={() => loadReportHistory()} disabled={isRefreshingReports} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">
                      {isRefreshingReports ? "Refreshing..." : "Refresh Recent Reports"}
                    </button>
                  </div>
                  <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-[760px] w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-600">
                        <tr><th className="p-3">Created</th><th className="p-3">Report</th><th className="p-3">Organisation</th><th className="p-3">File name</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
                      </thead>
                      <tbody>
                        {reportHistory.length ? reportHistory.map((report) => (
                          <tr key={report.id} className="border-t border-slate-200">
                            <td className="p-3">{formatDisplayDateTime(report.created_at)}</td>
                            <td className="p-3 font-bold">{report.report_type}</td>
                            <td className="p-3">{tcOrganisationMap[report.organisation_id]?.name || "All / not linked"}</td>
                            <td className="p-3">{report.file_name}</td>
                            <td className="p-3"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{report.status || "generated"}</span></td>
                            <td className="p-3"><button type="button" onClick={() => setSelectedReportHistory(report)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white">View Report Details</button></td>
                          </tr>
                        )) : (
                          <tr><td className="p-4 text-sm font-semibold text-slate-500" colSpan={6}>No report history has been recorded yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {selectedReportHistory ? (
                  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Report details</p>
                        <h3 className="mt-2 text-2xl font-black">{selectedReportHistory.report_type}</h3>
                      </div>
                      <button type="button" onClick={() => setSelectedReportHistory(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Close Details</button>
                    </div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold">Organisation: {tcOrganisationMap[selectedReportHistory.organisation_id]?.name || "All / not linked"}</p>
                      <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold">Generated: {formatDisplayDateTime(selectedReportHistory.created_at)}</p>
                      <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold">Generated by: {selectedReportHistory.generated_by || "Back Office"}</p>
                      <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold">Status: {selectedReportHistory.status || "generated"}</p>
                      <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold md:col-span-2">File name: {selectedReportHistory.file_name}</p>
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}

            {activeTab === "Export Centre" ? (
              <div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-black sm:text-3xl">Export Centre</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">Export real Training Compliance data loaded from Supabase. Choose the report type, filters and fields before previewing, downloading CSV, or printing to PDF.</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab("Training Compliance")} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-black">Back to Training Compliance</button>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black">Export Centre</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">Use filters and checkboxes to control exactly what goes into the export.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setExportPreviewOpen(true)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Preview Export</button>
                      <button type="button" onClick={downloadTrainingComplianceCsv} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Download CSV</button>
                      <button type="button" onClick={printTrainingComplianceReport} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Print / Save as PDF</button>
                      <button type="button" onClick={clearExportFilters} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Clear Filters</button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Export type<select value={exportOptions.type} onChange={(e) => updateExportOption("type", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal"><option value="organisations">Company/organisation information only</option><option value="staff">Staff/member information only</option><option value="records">Staff training records only</option><option value="full_compliance">Full compliance report</option><option value="organisation_report">Individual organisation report</option><option value="staff_report">Individual staff member report</option><option value="expiring_report">Expiring soon report</option><option value="expired_report">Expired training report</option></select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Organisation<select name="organisation_id" value={exportOptions.filters.organisation_id} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal"><option value="">All organisations</option>{tcOrganisations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Staff member<select name="member_id" value={exportOptions.filters.member_id} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal"><option value="">All staff</option>{tcMembers.filter((member) => !exportOptions.filters.organisation_id || member.organisation_id === exportOptions.filters.organisation_id).map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Course<select name="course_id" value={exportOptions.filters.course_id} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal"><option value="">All courses</option>{tcCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Status<select name="status" value={exportOptions.filters.status} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal"><option value="">All statuses</option><option value="valid">Valid</option><option value="expiring">Expiring</option><option value="expired">Expired</option></select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Quick filter<select name="quick" value={exportOptions.filters.quick} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal"><option value="">All records</option><option value="valid">Valid only</option><option value="expiring">Expiring within 30 days</option><option value="expired">Expired only</option></select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Completed from<input type="date" name="completed_from" value={exportOptions.filters.completed_from} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Completed to<input type="date" name="completed_to" value={exportOptions.filters.completed_to} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Expiry from<input type="date" name="expiry_from" value={exportOptions.filters.expiry_from} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Expiry to<input type="date" name="expiry_to" value={exportOptions.filters.expiry_to} onChange={updateExportFilter} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold"><input type="checkbox" checked={exportOptions.includeStats} onChange={(e) => updateExportOption("includeStats", e.target.checked)} /> Include summary statistics</label>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-black">Organisation fields</h4><div className="mt-3 grid gap-2 text-sm">{["organisation_name", "contact_name", "contact_email", "phone"].map((field) => <label key={field} className="flex items-center gap-2"><input type="checkbox" checked={exportOptions.fields[field]} onChange={() => updateExportField(field)} /> {formatExportLabel(field)}</label>)}</div></div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-black">Staff fields</h4><div className="mt-3 grid gap-2 text-sm">{["full_name", "email", "role", "organisation"].map((field) => <label key={field} className="flex items-center gap-2"><input type="checkbox" checked={exportOptions.fields[field]} onChange={() => updateExportField(field)} /> {formatExportLabel(field)}</label>)}</div></div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-black">Training fields</h4><div className="mt-3 grid gap-2 text-sm">{["course_name", "date_completed", "expiry_date", "status"].map((field) => <label key={field} className="flex items-center gap-2"><input type="checkbox" checked={exportOptions.fields[field]} onChange={() => updateExportField(field)} /> {formatExportLabel(field)}</label>)}</div></div>
                  </div>

                  {exportOptions.includeStats ? (() => {
                    const exportData = buildExportRows();
                    return <div className="mt-5 grid gap-3 md:grid-cols-4"><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Training records</p><p className="text-2xl font-black">{exportData.stats.total_training_records}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Valid</p><p className="text-2xl font-black text-emerald-700">{exportData.stats.valid_records}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Expiring</p><p className="text-2xl font-black text-amber-700">{exportData.stats.expiring_within_30_days}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs font-bold text-slate-500">Compliance</p><p className="text-2xl font-black">{exportData.stats.compliance_percentage}</p></div></div>;
                  })() : null}

                  {exportPreviewOpen ? (() => {
                    const exportData = buildExportRows();
                    const rows = exportData.rows.slice(0, 10);
                    const headers = rows[0] ? Object.keys(rows[0]) : [];
                    return <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-black">Export Preview</h4><p className="mt-1 text-sm text-slate-500">{exportData.rows.length} rows match the selected filters. Showing first 10.</p>{rows.length ? <div className="mt-4 overflow-x-auto"><table className="min-w-[800px] w-full text-left text-xs"><thead className="bg-slate-100">{headers.map((header) => <th key={header} className="p-2">{header}</th>)}</thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-slate-200">{headers.map((header) => <td key={header} className="p-2">{row[header]}</td>)}</tr>)}</tbody></table></div> : <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">No export data matches the selected filters.</p>}</div>;
                  })() : null}
                </div>
              </div>
            ) : null}

            {activeTab === "Depot Tokens" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Depot Tokens</h2>
                <div className="mt-6 grid gap-3">
                  {depotTokens.map((token) => <div key={token.url} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><h3 className="text-xl font-black">{token.organisation}</h3><p className="mt-2 break-all text-sm leading-relaxed text-slate-600">{token.url}</p><p className="mt-2 text-xs font-bold text-slate-500">Token: {token.token}</p></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Activity" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Activity</h2>
                <div className="mt-6 grid gap-3">
                  {activity.map((item, index) => <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-relaxed text-slate-700 shadow-sm">{item}</div>)}
                </div>
              </div>
            ) : null}

            {["AI Operations", "Ava Compliance Centre", "Nia Content Studio", "Rory Prospecting Centre"].includes(activeTab) ? (() => {
              try {
                return (
              <SafeSectionBoundary title={activeTab}>
              <div>
                {activeTab === "AI Operations" ? <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Agent Operations Centre</p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">ACE MiDAS Training AI Agents</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">Named operational agents can complete safe tasks and log their work. Booking/date/payment decisions stay routed to human approval.</p>
                  </div>
                  <button type="button" onClick={runAvaMiaWorkflow} disabled={agentWorkflowRunning} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">{agentWorkflowRunning ? "Running Mia Auto-Send..." : "Run Mia Auto-Send Workflow"}</button>
                </div>

                {miaWorkflowStats ? (
                  <div className="mt-5 grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:grid-cols-4">
                    <div><p className="text-xs font-black uppercase text-emerald-700">Reminders found</p><p className="text-2xl font-black">{miaWorkflowStats.remindersFound || 0}</p></div>
                    <div><p className="text-xs font-black uppercase text-emerald-700">Emails sent</p><p className="text-2xl font-black">{miaWorkflowStats.emailsSent || 0}</p></div>
                    <div><p className="text-xs font-black uppercase text-emerald-700">Skipped duplicates</p><p className="text-2xl font-black">{miaWorkflowStats.skippedDuplicates || 0}</p></div>
                    <div><p className="text-xs font-black uppercase text-emerald-700">Failed sends</p><p className="text-2xl font-black">{miaWorkflowStats.failedSends || 0}</p></div>
                  </div>
                ) : null}

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {aiAgentCards.filter((agent) => ["ellis", "mia", "theo"].includes(agent.key)).map((agent) => (
                    <article key={agent.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">{agent.avatar}</div>
                        <div>
                          <h3 className="text-xl font-black">{safeText(agent.name, "Unknown agent")}</h3>
                          <p className="mt-1 text-sm font-bold text-slate-600">{safeText(agent.title, "Unknown role")}</p>
                        </div>
                      </div>
                      <p className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-700">{safeText(agent.status, "Pending")}</p>
                      <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
                        <p>Actions today: <span className="font-black text-slate-950">{safeText(agent.actionsToday, "0")}</span></p>
                        <p>Pending tasks: <span className="font-black text-slate-950">{safeText(agent.pendingTasks, "0")}</span></p>
                        <p>Approval required: <span className="font-black text-slate-950">{safeText(agent.approvalsRequired, "0")}</span></p>
                        <p>Last activity: <span className="font-black text-slate-950">{safeText(agent.lastActivity, "No activity yet")}</span></p>
                      </div>
                    </article>
                  ))}
                </div>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-xl font-black">Daily AI Summary</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">Today&apos;s summary: {messagesReceivedToday} inbound message(s) received, {messagesRoutedToday} routed, {spamFilteredToday} filtered as spam/irrelevant and {theoApprovalsCreatedToday} Theo approval(s) created. Ava is internal-only: expired training {expiredTrainingRecords.length}, expiring within 7/30/60/90 days {expiringWithinSevenDays.length}/{expiringWithinThirtyDays.length}/{expiringWithinSixtyDays.length}/{expiringWithinNinetyDays.length}, certificates missing {certificateMissingRecords.length}, reminders sent today {remindersSentToday}, urgent organisations {urgentOrganisationNames.length}, compliance checks today {avaComplianceChecksToday}, Ava summaries generated/sent today {avaDailySummariesToday} daily and {avaWeeklySummariesToday} weekly. Mia sent {remindersSentToday} refresher reminder(s){miaWorkflowStats ? `, with ${miaWorkflowStats.skippedDuplicates || 0} duplicate(s) skipped and ${miaWorkflowStats.failedSends || 0} failed send(s) in the latest run` : ""}. Mia/Ellis classified {repliesClassifiedToday} customer reply/replies. Theo handled {theoBookingEnquiriesHandledToday} safe booking enquiry/enquiries, provided {theoEstimatesProvidedToday} estimate(s), referred {theoTrainingPageReferralsToday} customer(s) to the training page and sent {theoResponsesSentToday} booking response(s). Rory completed {roryResearchRunsToday} research run(s), saved {roryProspectsFoundToday} prospect(s), added or updated {prospectsAddedToday} prospect(s), passed {prospectsPassedToMiaToday} to Mia, and logged {roryProviderIssuesToday} research provider/error issue(s). Mia sent {prospectOutreachSentToday} prospect outreach email(s) and scheduled {prospectFollowUpsScheduledToday} follow-up set(s). Ellis filtered {emailsFilteredToday} email(s). Nia created/saved {contentDraftsToday} content draft(s), generated {weeklyPlansGeneratedToday} weekly plan(s), and marked {contentDraftsUsedToday} draft(s) as used. Theo has {bookingApprovalsNeeded} booking approval item(s).</p>
                  <p className="mt-3 rounded-xl bg-white p-3 text-sm font-bold text-slate-600">Audio summary support: planned for a future release.</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {aiAgentCards.filter((agent) => ["ellis", "mia", "theo"].includes(agent.key)).map((agent) => <div key={`${agent.key}-summary`} className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-700"><p className="font-black text-slate-950">{safeText(agent.name, "Unknown agent")}</p><p className="mt-1 text-xs font-bold text-slate-500">{safeText(agent.title, "Unknown role")}</p><p className="mt-2">Status: {safeText(agent.status, "Pending")}. Pending: {safeText(agent.pendingTasks, "0")}. Approvals: {safeText(agent.approvalsRequired, "0")}.</p></div>)}
                  </div>
                </section>
                </> : null}

                {activeTab === "Ava Compliance Centre" ? (
                <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-emerald-950">Ava Internal Compliance Summaries</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-900">Ava is internal-only. She does not email customers. These summaries are sent to Marvin/admin and use live compliance, certificate and reminder data.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={runAvaComplianceCheck} disabled={avaCheckRunning} className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{avaCheckRunning ? "Checking..." : "Run Ava Compliance Check"}</button>
                      <button type="button" onClick={() => generateAvaSummary("daily")} disabled={Boolean(avaSummaryBusy)} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{avaSummaryBusy === "generate-daily" ? "Generating..." : "Generate Daily Summary"}</button>
                      <button type="button" onClick={() => generateAvaSummary("weekly")} disabled={Boolean(avaSummaryBusy)} className="rounded-xl bg-slate-700 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{avaSummaryBusy === "generate-weekly" ? "Generating..." : "Generate Weekly Summary"}</button>
                      <button type="button" onClick={() => sendAvaSummary("daily")} disabled={Boolean(avaSummaryBusy)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{avaSummaryBusy === "send-daily" ? "Sending..." : "Send Daily to Admin"}</button>
                      <button type="button" onClick={() => sendAvaSummary("weekly")} disabled={Boolean(avaSummaryBusy)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{avaSummaryBusy === "send-weekly" ? "Sending..." : "Send Weekly to Admin"}</button>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
                    <div className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">Expired</p><p className="text-2xl font-black text-red-700">{expiredTrainingRecords.length}</p></div>
                    <div className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">7 days</p><p className="text-2xl font-black text-amber-700">{expiringWithinSevenDays.length}</p></div>
                    <div className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">30 days</p><p className="text-2xl font-black text-amber-700">{expiringWithinThirtyDays.length}</p></div>
                    <div className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">60 days</p><p className="text-2xl font-black text-slate-950">{expiringWithinSixtyDays.length}</p></div>
                    <div className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">90 days</p><p className="text-2xl font-black text-slate-950">{expiringWithinNinetyDays.length}</p></div>
                    <div className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">Certs missing</p><p className="text-2xl font-black text-red-700">{certificateMissingRecords.length}</p></div>
                    <div className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">Certs attached</p><p className="text-2xl font-black text-emerald-700">{certificateAttachedRecords.length}</p></div>
                    <div className="rounded-xl bg-white p-4"><p className="text-xs font-black uppercase text-slate-500">Reminder failures</p><p className="text-2xl font-black text-rose-700">{reminderFailureRecords.length}</p></div>
                  </div>
                  <div className="mt-4 rounded-xl bg-white p-4">
                    <p className="text-sm font-black text-slate-950">Urgent organisations</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{urgentOrganisationNames.length ? urgentOrganisationNames.join(", ") : "No urgent organisations identified."}</p>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-700">
                      <p className="font-black text-slate-950">Ava status</p>
                      <p className="mt-2">Last run: {avaCheckResult?.log?.created_at ? formatDisplayDateTime(avaCheckResult.log.created_at) : latestAvaCheckLog?.created_at ? formatDisplayDateTime(latestAvaCheckLog.created_at) : "Not run yet"}</p>
                      <p className="mt-1">Send status: {avaSummaryResult?.log?.status || latestAvaDailyLog?.status || latestAvaWeeklyLog?.status || "No summary sent yet"}</p>
                    </div>
                    <div className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-700">
                      <p className="font-black text-slate-950">Latest daily summary</p>
                      <p className="mt-2">Expired: {latestAvaDailySummary?.expired_training ?? expiredTrainingRecords.length}. Expiring 7/30/60/90: {latestAvaDailySummary?.expiring_within_7_days ?? expiringWithinSevenDays.length}/{latestAvaDailySummary?.expiring_within_30_days ?? expiringWithinThirtyDays.length}/{latestAvaDailySummary?.expiring_within_60_days ?? expiringWithinSixtyDays.length}/{latestAvaDailySummary?.expiring_within_90_days ?? expiringWithinNinetyDays.length}.</p>
                      <p className="mt-1">Suggested action: {latestAvaDailySummary?.recommended_actions?.[0] || "No compliance risks found from the available records."}</p>
                    </div>
                    <div className="rounded-xl bg-white p-4 text-sm font-semibold text-slate-700">
                      <p className="font-black text-slate-950">Latest weekly summary</p>
                      <p className="mt-2">Records monitored: {latestAvaWeeklySummary?.total_records_monitored ?? enrichedTrainingRecords.length}. Reminders sent this week: {latestAvaWeeklySummary?.total_reminders_sent_this_week ?? 0}. Failed reminders: {latestAvaWeeklySummary?.failed_reminders ?? 0}.</p>
                      <p className="mt-1">Next week: {latestAvaWeeklySummary?.upcoming_expiries_next_week ?? expiringWithinSevenDays.length} upcoming expiry item(s).</p>
                    </div>
                  </div>
                  {avaCheckResult?.summary ? <div className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold text-slate-700"><p className="font-black text-slate-950">Last Ava compliance check</p><p className="mt-2">Logged {avaCheckResult.logs?.length || 0} internal activity row(s). Expired: {avaCheckResult.summary.expired_training}. Expiring 7/30/60/90: {avaCheckResult.summary.expiring_within_7_days}/{avaCheckResult.summary.expiring_within_30_days}/{avaCheckResult.summary.expiring_within_60_days}/{avaCheckResult.summary.expiring_within_90_days}. Missing certificates: {avaCheckResult.summary.certificates_missing}.</p></div> : null}
                  {avaSummaryResult?.summary ? <div className="mt-4 rounded-xl bg-white p-4 text-sm font-semibold text-slate-700"><p className="font-black text-slate-950">Last Ava summary sent</p><p className="mt-2">Type: {avaSummaryResult.type}. Recipient: {avaSummaryResult.recipient}. Records monitored: {avaSummaryResult.summary.total_records_monitored}. Failed reminders: {avaSummaryResult.summary.failed_reminders}.</p></div> : null}
                </section>
                ) : null}

                {activeTab === "Nia Content Studio" ? (
                <section className="mt-6 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black text-fuchsia-950">Nia Premium Content Studio</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-fuchsia-900">Nia creates polished, ready-to-post drafts for review. Nothing is posted automatically, and content stays saved in the drafts library after refresh.</p>
                    </div>
                    <div className="rounded-xl bg-white px-4 py-3 text-sm font-black text-fuchsia-800">{safeContentDrafts.length} saved draft(s)</div>
                  </div>

                  <div className="mt-5 grid gap-4 rounded-2xl border border-fuchsia-100 bg-white p-4 lg:grid-cols-3">
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Platform<select value={niaDraftForm.platform} onChange={(e) => updateNiaDraftForm("platform", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{NIA_PLATFORM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Content type<select value={niaDraftForm.content_type} onChange={(e) => updateNiaDraftForm("content_type", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{NIA_CONTENT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Topic<input list="nia-topic-options" value={niaDraftForm.topic} onChange={(e) => updateNiaDraftForm("topic", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /><datalist id="nia-topic-options">{NIA_TOPIC_OPTIONS.map((option) => <option key={option} value={option} />)}</datalist></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700">Target audience<input list="nia-audience-options" value={niaDraftForm.target_audience} onChange={(e) => updateNiaDraftForm("target_audience", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /><datalist id="nia-audience-options">{NIA_AUDIENCE_OPTIONS.map((option) => <option key={option} value={option} />)}</datalist></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-2">Tone<input value={niaDraftForm.tone} onChange={(e) => updateNiaDraftForm("tone", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                    <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-3">Call to action<input value={niaDraftForm.call_to_action} onChange={(e) => updateNiaDraftForm("call_to_action", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                    <div className="flex flex-wrap gap-2 lg:col-span-3">
                      <button type="button" onClick={() => generateNiaDraft(false)} disabled={Boolean(niaBusy)} className="rounded-xl bg-fuchsia-700 px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">{niaBusy === "generate" ? "Generating..." : "Generate Premium Draft"}</button>
                      <button type="button" onClick={() => generateNiaDraft(true)} disabled={Boolean(niaBusy)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">{niaBusy === "weekly" ? "Generating..." : "Generate Weekly Content Plan"}</button>
                      <button type="button" onClick={() => saveNiaDraft()} disabled={Boolean(niaBusy) || !niaCurrentDraft} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">{niaBusy === "save" ? "Saving..." : "Save Draft"}</button>
                      <button type="button" onClick={() => copyNiaDraft(niaCurrentDraft)} disabled={!niaCurrentDraft} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Copy Draft</button>
                    </div>
                  </div>

                  {niaCurrentDraft ? (
                    <div className="mt-5 rounded-2xl border border-fuchsia-100 bg-white p-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-fuchsia-700">Current draft</p>
                          <input value={niaCurrentDraft.title || ""} onChange={(e) => updateNiaCurrentDraft("title", e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-xl font-black" placeholder="Draft title" />
                          <p className="mt-2 text-sm font-bold text-slate-500">{safeText(niaCurrentDraft.platform, "Platform")} | {safeText(niaCurrentDraft.target_audience, "Audience")} | {safeText(niaCurrentDraft.content_type, "Content type")}</p>
                        </div>
                        <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-black text-fuchsia-800">{safeText(niaCurrentDraft.status, "draft")}</span>
                      </div>
                      <label className="mt-4 grid gap-2 text-sm font-bold text-slate-700">Post/caption body<textarea value={niaCurrentDraft.content || ""} onChange={(e) => updateNiaCurrentDraft("content", e.target.value)} rows={10} className="rounded-xl border border-slate-200 p-3 font-normal leading-relaxed" /></label>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <label className="grid gap-2 text-sm font-bold text-slate-700">Suggested visual<textarea value={niaCurrentDraft.suggested_visual || ""} onChange={(e) => updateNiaCurrentDraft("suggested_visual", e.target.value)} rows={4} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                        <label className="grid gap-2 text-sm font-bold text-slate-700">Call to action<textarea value={niaCurrentDraft.call_to_action || ""} onChange={(e) => updateNiaCurrentDraft("call_to_action", e.target.value)} rows={4} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                        <label className="grid gap-2 text-sm font-bold text-slate-700">Hashtags<input value={niaCurrentDraft.hashtags || ""} onChange={(e) => updateNiaCurrentDraft("hashtags", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                        <label className="grid gap-2 text-sm font-bold text-slate-700">Tone/style<input value={niaCurrentDraft.tone || ""} onChange={(e) => updateNiaCurrentDraft("tone", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                      </div>
                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <h4 className="font-black">Manual Image Asset</h4>
                            <p className="mt-1 text-sm font-semibold text-slate-600">Nia creates the image prompt. Upload the finished image after creating it manually in your preferred design tool.</p>
                            <p className="mt-2 text-xs font-black uppercase text-fuchsia-700">Image status: {safeText(niaCurrentDraft.image_status, "not started")}</p>
                          </div>
                          {niaCurrentDraft.image_url ? <img src={niaCurrentDraft.image_url} alt={niaCurrentDraft.image_file_name || "Nia content asset preview"} className="h-28 w-full rounded-xl object-cover sm:w-44" /> : null}
                        </div>
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <label className="grid gap-2 text-sm font-bold text-slate-700">Visual style<textarea value={niaCurrentDraft.visual_style || ""} onChange={(e) => updateNiaCurrentDraft("visual_style", e.target.value)} rows={4} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                          <label className="grid gap-2 text-sm font-bold text-slate-700">Image prompt<textarea value={niaCurrentDraft.image_prompt || ""} onChange={(e) => updateNiaCurrentDraft("image_prompt", e.target.value)} rows={6} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button type="button" onClick={() => generateNiaImagePrompt(niaCurrentDraft)} disabled={Boolean(niaBusy)} className="rounded-lg bg-fuchsia-700 px-4 py-2 text-xs font-black text-white disabled:opacity-60">Generate Image Prompt</button>
                          <button type="button" onClick={() => copyNiaImagePrompt(niaCurrentDraft)} disabled={!niaCurrentDraft.image_prompt} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Copy Image Prompt</button>
                          <label className={`cursor-pointer rounded-lg bg-slate-950 px-4 py-2 text-xs font-black text-white ${niaBusy ? "opacity-60" : ""}`}>Upload Finished Image<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={Boolean(niaBusy)} onChange={(e) => uploadNiaImage(niaCurrentDraft, e.target.files?.[0])} /></label>
                          <button type="button" onClick={() => openNiaImage(niaCurrentDraft, false)} disabled={!niaCurrentDraft.image_path} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-50">View Image</button>
                          <button type="button" onClick={() => openNiaImage(niaCurrentDraft, true)} disabled={!niaCurrentDraft.image_path} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Download Image</button>
                          <button type="button" onClick={() => deleteNiaImage(niaCurrentDraft)} disabled={!niaCurrentDraft.image_path || Boolean(niaBusy)} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50">Delete Image</button>
                        </div>
                      </div>
                    </div>
                  ) : <p className="mt-5 rounded-xl bg-white p-4 text-sm font-bold text-slate-600">Generate a premium draft to preview and edit it here.</p>}

                  <div className="mt-5 rounded-2xl border border-fuchsia-100 bg-white p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-lg font-black">Content Drafts Library</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-600">Review, copy, mark as used or delete saved Nia drafts.</p>
                      </div>
                      <button type="button" onClick={() => loadTrainingComplianceData({ quiet: false })} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black">Refresh Drafts</button>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {safeContentDrafts.length ? safeContentDrafts.map((draft) => (
                        <article key={draft.id || `${draft.title}-${draft.created_at}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            {draft.image_url ? <img src={draft.image_url} alt={draft.image_file_name || draft.title || "Nia content asset"} className="h-32 w-full rounded-xl object-cover lg:w-48" /> : <div className="grid h-32 w-full place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-center text-xs font-black uppercase text-slate-400 lg:w-48">No image</div>}
                            <div>
                              <h5 className="text-lg font-black">{safeText(draft.title, "Untitled draft")}</h5>
                              <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-500">{safeText(draft.platform, "Platform")} | {safeText(draft.target_audience, "Audience")} | {safeText(draft.topic, "Topic")}</p>
                              <p className="mt-2 line-clamp-3 text-sm font-semibold leading-relaxed text-slate-700">{safeText(draft.content, "No content recorded.")}</p>
                              <p className="mt-2 text-xs font-bold text-slate-500">Created: {formatDisplayDateTime(draft.created_at)} | Status: {safeText(draft.status, "draft")} | Image: {safeText(draft.image_status, "not started")}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 lg:justify-end">
                              <button type="button" onClick={() => setNiaCurrentDraft(draft)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">Edit</button>
                              <button type="button" onClick={() => copyNiaDraft(draft)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white">Copy Draft</button>
                              <button type="button" onClick={() => generateNiaImagePrompt(draft)} disabled={Boolean(niaBusy)} className="rounded-lg bg-fuchsia-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Generate Image Prompt</button>
                              <button type="button" onClick={() => copyNiaImagePrompt(draft)} disabled={!draft.image_prompt} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Copy Image Prompt</button>
                              <label className={`cursor-pointer rounded-lg bg-slate-700 px-3 py-2 text-xs font-black text-white ${niaBusy ? "opacity-60" : ""}`}>Upload Finished Image<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={Boolean(niaBusy)} onChange={(e) => uploadNiaImage(draft, e.target.files?.[0])} /></label>
                              <button type="button" onClick={() => openNiaImage(draft, false)} disabled={!draft.image_path} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-50">View Image</button>
                              <button type="button" onClick={() => openNiaImage(draft, true)} disabled={!draft.image_path} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-50">Download Image</button>
                              <button type="button" onClick={() => deleteNiaImage(draft)} disabled={!draft.image_path || Boolean(niaBusy)} className="rounded-lg bg-red-500 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Delete Image</button>
                              <button type="button" onClick={() => markNiaDraftUsed(draft)} disabled={niaBusy === `used-${draft.id}` || draft.status === "used"} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">{draft.status === "used" ? "Used" : "Mark as Used"}</button>
                              <button type="button" onClick={() => deleteNiaDraft(draft)} disabled={niaBusy === `delete-${draft.id}`} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Delete Draft</button>
                            </div>
                          </div>
                        </article>
                      )) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">No Nia content drafts have been saved yet.</p>}
                    </div>
                  </div>
                </section>
                ) : null}

                {activeTab === "AI Operations" ? <>
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black">Inbound Message Intake</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">Ellis classifies incoming contact form messages, pasted replies and future email replies, then routes them to the right ACE agent.</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-800">{safeInboundMessages.length} captured</div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-black">Theo test prompts</h4>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">Load a safe booking, estimate or approval scenario into manual intake, then route it to inspect Ellis/Theo classification and the decision trace.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {THEO_TEST_PROMPTS.map((prompt) => <button key={prompt.label} type="button" onClick={() => applyTheoTestPrompt(prompt)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700">{prompt.label}</button>)}
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-black">Manual Reply Intake</h4>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <input value={manualInboundForm.from_name} onChange={(e) => updateManualInboundForm("from_name", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="From name" />
                      <input value={manualInboundForm.from_email} onChange={(e) => updateManualInboundForm("from_email", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="From email" />
                      <input value={manualInboundForm.organisation} onChange={(e) => updateManualInboundForm("organisation", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Organisation" />
                      <input value={manualInboundForm.subject} onChange={(e) => updateManualInboundForm("subject", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Subject" />
                      <textarea value={manualInboundForm.message_body} onChange={(e) => updateManualInboundForm("message_body", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm lg:col-span-2" rows={4} placeholder="Message body" />
                    </div>
                    <button type="button" onClick={saveManualInboundMessage} disabled={isSaving} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{isSaving ? "Routing..." : "Route Message"}</button>
                  </div>
                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-[980px] w-full text-left text-sm">
                      <thead className="bg-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Received</th><th className="p-3">Sender</th><th className="p-3">Subject</th><th className="p-3">Classification</th><th className="p-3">Agent</th><th className="p-3">Status</th><th className="p-3">Action</th><th className="p-3">Trace</th></tr></thead>
                      <tbody>{safeInboundMessages.length ? safeInboundMessages.map((item) => <tr key={item.id || `${item.from_email}-${item.created_at}`} className="border-t border-slate-200"><td className="p-3">{formatDisplayDateTime(item.created_at)}</td><td className="p-3">{safeText(item.from_name || item.from_email, "Unknown")}<p className="text-xs text-slate-500">{safeText(item.organisation, "No organisation")}</p></td><td className="p-3">{safeText(item.subject, "No subject")}</td><td className="p-3 font-bold">{safeText(item.classification, "Pending")}</td><td className="p-3 font-bold uppercase">{safeText(item.assigned_agent, "Unknown agent")}</td><td className="p-3">{safeText(item.status, "Pending")}</td><td className="p-3">{safeText(item.action_taken, "No action yet")}</td><td className="p-3">{item.assigned_agent === "theo" ? <button type="button" onClick={() => openTheoDecisionTrace(item.id)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white">View Theo Decision Trace</button> : <span className="text-xs font-bold text-slate-400">Not Theo</span>}</td></tr>) : <tr><td className="p-4 text-sm font-bold text-slate-600" colSpan={8}>No inbound messages captured yet.</td></tr>}</tbody>
                    </table>
                  </div>
                </section>
                </> : null}

                {activeTab === "AI Operations" ? (
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black">Reply Classification & Theo Approval Queue</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">Paste customer replies here. Date, availability, booking, cancellation, pricing and payment-link requests are routed to Theo for human approval.</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">{theoReplyApprovals.length} Theo approval item(s)</div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-black">Classify a customer reply</h4>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <select value={replyForm.organisation_id} onChange={(e) => updateReplyForm("organisation_id", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm"><option value="">Organisation</option>{tcOrganisations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select>
                      <select value={replyForm.member_id} onChange={(e) => updateReplyForm("member_id", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm"><option value="">Linked staff/member</option>{tcMembers.filter((member) => !replyForm.organisation_id || member.organisation_id === replyForm.organisation_id).map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</select>
                      <select value={replyForm.training_record_id} onChange={(e) => updateReplyForm("training_record_id", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm"><option value="">Linked training record</option>{enrichedTrainingRecords.filter((record) => !replyForm.member_id || record.member_id === replyForm.member_id).map((record) => <option key={record.id} value={record.id}>{record.staffMember?.full_name || "Staff"} - {record.course?.name || "Training"}</option>)}</select>
                      <input value={replyForm.contact_name} onChange={(e) => updateReplyForm("contact_name", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Contact name" />
                      <input value={replyForm.contact_email} onChange={(e) => updateReplyForm("contact_email", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Contact email" />
                      <input value={replyForm.notes} onChange={(e) => updateReplyForm("notes", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Internal notes" />
                      <textarea value={replyForm.message} onChange={(e) => updateReplyForm("message", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm lg:col-span-3" rows={4} placeholder="Paste customer reply message" />
                    </div>
                    <button type="button" onClick={saveReplyIntake} disabled={isSaving} className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{isSaving ? "Classifying..." : "Classify Reply"}</button>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {theoReplyApprovals.length ? theoReplyApprovals.map((reply) => {
                      const organisation = tcOrganisationMap[reply.organisation_id];
                      const member = tcMemberMap[reply.member_id];
                      const relatedRecord = enrichedTrainingRecords.find((record) => record.id === reply.training_record_id);
                      const decision = theoDecisionFields[reply.id] || {};
                      return <article key={reply.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                          <div>
                            <h4 className="font-black">{organisation?.name || "Organisation not linked"}</h4>
                            <p className="mt-1 text-sm font-semibold text-slate-700">{reply.contact_name || "Contact not recorded"} | {reply.contact_email || "Email not recorded"}</p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-700">{safeText(reply.message, "No message recorded")}</p>
                            <p className="mt-2 text-xs font-black text-amber-800">Classification: {safeText(reply.classification, "Pending")} | Requested action: {safeText(reply.requested_action, "Pending")}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 rounded-xl bg-white p-4 text-sm font-semibold text-slate-700 md:grid-cols-2 lg:grid-cols-4">
                          <p>Requested course: <span className="font-black text-slate-950">{safeText(reply.requested_course || relatedRecord?.course?.name, "Not known")}</span></p>
                          <p>Attendees: <span className="font-black text-slate-950">{safeText(reply.attendees, "Not known")}</span></p>
                          <p>Location: <span className="font-black text-slate-950">{safeText(reply.location, "Not known")}</span></p>
                          <p>Preferred dates: <span className="font-black text-slate-950">{safeText(reply.preferred_dates, "Not known")}</span></p>
                          <p>Urgency: <span className="font-black text-slate-950">{safeText(reply.urgency, "Medium")}</span></p>
                          <p>Related staff: <span className="font-black text-slate-950">{member?.full_name || relatedRecord?.staffMember?.full_name || "Not linked"}</span></p>
                          <p>Related record: <span className="font-black text-slate-950">{relatedRecord?.course?.name || "Not linked"}</span></p>
                          <p>Expiry: <span className="font-black text-slate-950">{relatedRecord?.expiry_date ? formatDisplayDate(relatedRecord.expiry_date) : "Not linked"}</span></p>
                        </div>
                        <div className="mt-4 grid gap-3 rounded-xl border border-amber-200 bg-white p-4 lg:grid-cols-2">
                          <label className="grid gap-2 text-sm font-bold text-slate-700">Approved dates<input value={decision.approved_dates || reply.approved_dates || ""} onChange={(e) => updateTheoDecisionField(reply.id, "approved_dates", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder="Only enter dates admin has approved" /></label>
                          <label className="grid gap-2 text-sm font-bold text-slate-700">Approved availability wording<input value={decision.approved_availability_wording || reply.approved_availability_wording || ""} onChange={(e) => updateTheoDecisionField(reply.id, "approved_availability_wording", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder="E.g. We are checking availability and will confirm" /></label>
                          <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-2">Approved price/payment instruction<input value={decision.approved_price_payment_instruction || reply.approved_price_payment_instruction || ""} onChange={(e) => updateTheoDecisionField(reply.id, "approved_price_payment_instruction", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder="Only include approved pricing/payment wording" /></label>
                          <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-2">Notes for Theo<textarea value={replyApprovalNotes[reply.id] || reply.theo_notes || ""} onChange={(e) => setReplyApprovalNotes((current) => ({ ...current, [reply.id]: e.target.value }))} className="rounded-xl border border-slate-200 p-3 font-normal" rows={2} placeholder="Instructions Theo can use when drafting" /></label>
                          {reply.draft_response ? <div className="rounded-xl bg-slate-50 p-3 text-sm font-semibold leading-relaxed text-slate-700 lg:col-span-2"><p className="font-black text-slate-950">Theo draft response</p><pre className="mt-2 whitespace-pre-wrap font-sans">{safeText(reply.draft_response, "No draft response available")}</pre></div> : null}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button type="button" onClick={() => updateReplyApproval(reply, "approved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white">Approve Response</button>
                          <button type="button" onClick={() => updateReplyApproval(reply, "edit_response")} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white">Edit Response</button>
                          <button type="button" onClick={() => updateReplyApproval(reply, "needs_more_info")} className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-black text-amber-800">Mark Needs More Info</button>
                          <button type="button" onClick={() => updateReplyApproval(reply, "rejected")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Reject / Do Not Reply</button>
                          <button type="button" onClick={() => sendTheoApprovedResponse(reply)} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-black text-white">Send Approved Theo Response</button>
                        </div>
                      </article>;
                    }) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">No customer replies are waiting for Theo approval.</p>}
                  </div>
                </section>
                ) : null}

                {activeTab === "Rory Prospecting Centre" ? <>
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black">Rory Research & Partnerships</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">Rory organises public UK prospect information, scores opportunity fit and prepares outreach briefs for Mia. Rory never sends emails directly.</p>
                    </div>
                    <div className="grid gap-2 text-sm font-black sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-slate-800">{safeProspects.length} total prospect(s)</div>
                      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-emerald-800">{pendingProspects.length} pending review</div>
                      <div className="rounded-xl bg-blue-50 px-4 py-3 text-blue-800">{highPriorityProspects.length} high priority</div>
                      <div className="rounded-xl bg-indigo-50 px-4 py-3 text-indigo-800">{readyForMiaProspects.length} with Mia</div>
                      <div className="rounded-xl bg-amber-50 px-4 py-3 text-amber-800">{safeFollowUpTasks.filter((task) => ["pending", "pending_approval"].includes(task.status)).length} follow-ups</div>
                      <div className="rounded-xl bg-red-50 px-4 py-3 text-red-800">{doNotContactProspects.length} do not contact</div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h4 className="font-black">Automated Research Runs</h4>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">Run Rory against a configured search theme. If no live research provider is connected, Rory records a clear provider status and does not create fake prospects.</p>
                        <p className="mt-2 text-xs font-black text-slate-500">Latest status: {safeText(latestRoryResearchRun?.status || roryResearchStatus?.status, "No research runs yet").replaceAll("_", " ")}</p>
                      </div>
                      <div className="grid gap-2 text-sm font-black sm:grid-cols-3">
                        <div className="rounded-xl bg-white px-4 py-3 text-slate-700">{safeRoryResearchRuns.length} run(s)</div>
                        <div className="rounded-xl bg-white px-4 py-3 text-slate-700">{safeRoryResearchRuns.reduce((total, run) => total + Number(run.prospects_saved || 0), 0)} saved</div>
                        <div className="rounded-xl bg-white px-4 py-3 text-slate-700">{safeRoryResearchRuns.reduce((total, run) => total + Number(run.duplicates_skipped || 0), 0)} duplicate(s) skipped</div>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr_auto_auto]">
                      <select value={rorySearchTheme} onChange={(e) => setRorySearchTheme(e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm">
                        {RORY_SEARCH_THEME_OPTIONS.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
                      </select>
                      <input value={roryLocationFocus} onChange={(e) => setRoryLocationFocus(e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Location focus e.g. London" />
                      <button type="button" onClick={runRoryResearchNow} disabled={roryResearchBusy} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{roryResearchBusy ? "Researching..." : "Run Rory Research Now"}</button>
                      <button type="button" onClick={sendQualifiedProspectsToMia} disabled={isSaving || !filteredQualifiedProspectsForMia.length} className="rounded-xl border border-blue-300 bg-white px-5 py-3 text-sm font-black text-blue-800 disabled:opacity-50">Send {roryProspectServiceFilter || "Qualified"} Prospects to Mia</button>
                    </div>
                    {roryResearchStatus?.status === "provider_not_configured" ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">Research provider not configured. Add a supported live research endpoint later, then Rory can run internet research. Manual prospecting remains available now.</p> : null}
                    {(roryResearchStatus?.error || latestRoryResearchRun?.errors) ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{safeErrorText(roryResearchStatus?.error || latestRoryResearchRun?.errors, "Rory research failed.")}</p> : null}
                    {roryDuplicateWarnings.length ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h5 className="text-sm font-black text-amber-900">Duplicate warning</h5>
                            <p className="mt-1 text-sm font-semibold text-amber-800">{roryDuplicateWarnings.length} prospect(s) were skipped because Rory found likely matches already on record.</p>
                          </div>
                          <button type="button" onClick={() => setRoryDuplicateWarnings([])} className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-900">Dismiss</button>
                        </div>
                        <div className="mt-3 grid gap-2">
                          {roryDuplicateWarnings.slice(0, 8).map((warning, index) => <div key={`${warning.organisation_name}-${index}`} className="rounded-xl bg-white p-3 text-xs font-bold text-slate-700">
                            <p>{safeText(warning.organisation_name, "Unnamed prospect")} skipped</p>
                            <p className="mt-1 text-slate-500">Matched existing: {safeText(warning.matched_organisation, "Existing prospect")} | Reason: {safeText(warning.reason, "similar prospect already exists")}</p>
                            <p className="mt-1 break-all text-slate-400">{safeText(warning.website || warning.contact_email, "No duplicate source recorded")}</p>
                          </div>)}
                          {roryDuplicateWarnings.length > 8 ? <p className="text-xs font-bold text-amber-800">Showing first 8 duplicate warnings.</p> : null}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-5">
                      <h5 className="text-sm font-black text-slate-900">View Research Runs</h5>
                      <div className="mt-3 grid gap-2">
                        {safeRoryResearchRuns.length ? safeRoryResearchRuns.slice(0, 6).map((run) => <div key={run.id || `${run.search_theme}-${run.started_at}`} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-600 md:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.7fr_auto] md:items-center">
                          <p>{safeText(run.search_theme, "No theme")}</p>
                          <p>Status: {safeText(run.status, "Pending").replaceAll("_", " ")}</p>
                          <p>Found: {Number(run.prospects_found || 0)}</p>
                          <p>Saved: {Number(run.prospects_saved || 0)}</p>
                          <p>{formatDisplayDateTime(run.completed_at || run.started_at)}</p>
                          {["running", "waiting_for_result"].includes(run.status) && run.provider_task_id ? <button type="button" onClick={() => checkRoryResearchRun(run)} disabled={roryResearchBusy} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 disabled:opacity-60">Check Result</button> : <span className="text-xs text-slate-400">-</span>}
                        </div>) : <p className="rounded-xl bg-white p-3 text-sm font-bold text-slate-600">No research runs yet.</p>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h4 className="font-black">Upload Researched Results</h4>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">Paste Manus/GPT/Claude deep research, structured JSON, or upload CSV/JSON/XLSX research. Rory will study the results, save valid prospects, skip duplicates, score them and prepare them for Mia.</p>
                      </div>
                      <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800">
                        Upload CSV/JSON/XLSX
                        <input type="file" accept=".csv,.json,.xlsx,.xls,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={handleRoryImportFile} className="hidden" />
                      </label>
                    </div>
                    <textarea value={roryImportText} onChange={(e) => setRoryImportText(e.target.value)} className="mt-4 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm" placeholder='Paste AI deep research here. Rory accepts JSON/CSV or written blocks such as: Organisation: Example School; Website: https://example.sch.uk; Location: London; Sector: School; Likely training need: First Aid refresher; Source URL: https://example.sch.uk/contact; Notes: Public contact page found.' />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={importRoryResearchResults} disabled={roryResearchBusy || !roryImportText.trim()} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">Import Results to Prospect Library</button>
                      <button type="button" onClick={() => setRoryImportText("")} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800">Clear Import</button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="font-black">Add Prospect Manually</h4>
                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                      <input value={prospectForm.organisation_name} onChange={(e) => updateProspectForm("organisation_name", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Organisation name" />
                      <input value={prospectForm.website} onChange={(e) => updateProspectForm("website", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Website" />
                      <input value={prospectForm.location} onChange={(e) => updateProspectForm("location", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Location" />
                      <input value={prospectForm.region} onChange={(e) => updateProspectForm("region", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Region" />
                      <select value={prospectForm.sector} onChange={(e) => updateProspectForm("sector", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm"><option value="schools">Schools</option><option value="academy trusts">Academy trusts</option><option value="SEND schools">SEND schools</option><option value="local authorities">Local authorities</option><option value="community transport">Community transport providers</option><option value="care providers">Care providers</option><option value="charities">Charities</option><option value="transport operators">Transport operators</option><option value="nurseries">Nurseries</option><option value="childcare providers">Childcare providers</option><option value="sports clubs">Sports clubs</option><option value="gyms and fitness centres">Gyms and fitness centres</option><option value="community centres">Community centres</option><option value="event companies">Event companies</option><option value="hospitality businesses">Hospitality businesses</option><option value="warehouses">Warehouses</option><option value="construction companies">Construction companies</option><option value="security companies">Security companies</option><option value="facilities management">Facilities management</option><option value="small businesses">Small businesses</option><option value="other">Other</option></select>
                      <input value={prospectForm.likely_training_need} onChange={(e) => updateProspectForm("likely_training_need", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Likely training need" />
                      <select value={prospectForm.recommended_service} onChange={(e) => updateProspectForm("recommended_service", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm">{RORY_SERVICE_OPTIONS.map((service) => <option key={service} value={service}>{service}</option>)}</select>
                      <select value={prospectForm.priority} onChange={(e) => updateProspectForm("priority", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm"><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select>
                      <input value={prospectForm.contact_email} onChange={(e) => updateProspectForm("contact_email", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Public contact email" />
                      <input value={prospectForm.phone} onChange={(e) => updateProspectForm("phone", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Public phone number" />
                      <input value={prospectForm.decision_maker_name} onChange={(e) => updateProspectForm("decision_maker_name", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Public decision-maker name" />
                      <input value={prospectForm.source_url} onChange={(e) => updateProspectForm("source_url", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm lg:col-span-2" placeholder="Source URL" />
                      <input value={prospectForm.relevance_reason} onChange={(e) => updateProspectForm("relevance_reason", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm" placeholder="Why this prospect is relevant" />
                      <textarea value={prospectForm.outreach_brief} onChange={(e) => updateProspectForm("outreach_brief", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm lg:col-span-3" rows={3} placeholder="Outreach brief for Mia" />
                      <textarea value={prospectForm.notes} onChange={(e) => updateProspectForm("notes", e.target.value)} className="rounded-xl border border-slate-200 p-3 text-sm lg:col-span-3" rows={3} placeholder="Notes from public research" />
                      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={prospectForm.do_not_contact} onChange={(e) => updateProspectForm("do_not_contact", e.target.checked)} /> Do not contact</label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={prepareRoryResearchFromForm} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800">Research Prospect</button>
                      <button type="button" onClick={saveRoryProspect} disabled={isSaving} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{isSaving ? "Saving..." : "Save Prospect"}</button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <h4 className="font-black">Prospect Library</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-600">Filter by course/service, then pass the matching high-priority prospects to Mia for warm outreach.</p>
                      </div>
                      <div className="grid gap-2 lg:grid-cols-[minmax(190px,240px)_minmax(190px,240px)_minmax(170px,220px)_auto] lg:items-center">
                        <select value={roryProspectServiceFilter} onChange={(e) => setRoryProspectServiceFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800">
                          <option value="">All courses/services</option>
                          {RORY_SERVICE_OPTIONS.map((service) => <option key={service} value={service}>{service}</option>)}
                        </select>
                        <select value={roryProspectStatusFilter} onChange={(e) => setRoryProspectStatusFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800">
                          <option value="">All outreach statuses</option>
                          <option value="not_contacted">Not contacted</option>
                          <option value="ready_for_outreach">Sent to Mia / ready</option>
                          <option value="contacted">Contacted</option>
                          <option value="follow_up_due">Follow-up due</option>
                          <option value="do_not_contact">Do not contact</option>
                          <option value="high_priority">High priority only</option>
                        </select>
                        <input value={roryProspectLocationFilter} onChange={(e) => setRoryProspectLocationFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800" placeholder="Location e.g. London" />
                        <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-black text-blue-800">{filteredProspects.length} shown | {filteredHighPriorityProspects.length} high priority | {contactedProspects.length} contacted overall</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-black text-slate-700">{selectedRoryProspects.length} selected overall | {selectedVisibleRoryProspects.length} selected in this view</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={sendSelectedProspectsToMia} disabled={isSaving || !selectedRoryProspects.length} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Send Selected to Mia</button>
                        <button type="button" onClick={selectVisibleRoryProspects} disabled={!visibleRoryProspectIds.length || allVisibleRoryProspectsSelected} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50">Select Visible</button>
                        <button type="button" onClick={clearRoryProspectSelection} disabled={!selectedRoryProspectIds.length} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 disabled:opacity-50">Clear Selection</button>
                      </div>
                    </div>
                    {roryProspectServiceFilter || roryProspectStatusFilter || roryProspectLocationFilter ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">Showing prospects matched to {roryProspectServiceFilter || "all courses/services"}, {roryProspectStatusFilter ? roryProspectStatusFilter.replaceAll("_", " ") : "all outreach statuses"} and {roryProspectLocationFilter || "all locations"}. Bulk sending will only use qualified high-priority prospects in this filtered view.</p> : null}
                    {filteredProspects.length ? filteredProspects.map((prospect) => {
                      const scoreExplanation = getRoryScoreExplanation(prospect);
                      return <article key={prospect.id || prospect.organisation_name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <label className="flex items-start gap-3">
                            <input type="checkbox" checked={selectedRoryProspectIds.includes(roryProspectKey(prospect))} onChange={() => toggleRoryProspectSelection(prospect)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                            <span>
                              <span className="block text-lg font-black">{safeText(prospect.organisation_name, "Unnamed prospect")}</span>
                              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Select prospect</span>
                            </span>
                          </label>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{safeText(prospect.sector, "Sector not recorded")} | {safeText(prospect.location, "Location not recorded")} | {safeText(prospect.region, "Region not recorded")} | {safeText(prospect.priority, "medium")} priority</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">{safeText(prospect.relevance_reason || prospect.likely_training_need, "Relevance reason not recorded.")}</p>
                          <p className="mt-2 text-sm font-bold text-emerald-700">Recommended service: {safeText(prospect.recommended_service, "Not scored yet")} {prospect.score !== undefined && prospect.score !== null ? `| Score: ${prospect.score}/100` : ""}</p>
                          <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Why this score?</p>
                            <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                              <p>Score: {scoreExplanation.score}</p>
                              <p>Priority: {scoreExplanation.priority}</p>
                              <p>Service fit: {scoreExplanation.service}</p>
                              <p>Sector fit: {scoreExplanation.sectorFit}</p>
                              <p>Contact quality: {scoreExplanation.contactQuality}</p>
                              <p>Source quality: {scoreExplanation.sourceQuality}</p>
                            </div>
                            <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">Rory preserves imported research scores when they are higher than the local calculation.</p>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">Mia brief: {safeText(prospect.outreach_brief, "No outreach brief yet.")}</p>
                          <p className="mt-2 break-all text-xs font-bold text-slate-500">Source: {safeText(prospect.source_url, "No source URL")}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => previewMiaProspectEmail(prospect)} disabled={miaEmailPreviewBusy === prospect.id} className="rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-black text-emerald-800 disabled:opacity-50">{miaEmailPreviewBusy === prospect.id ? "Previewing..." : "Preview Mia Email"}</button>
                          <button type="button" onClick={() => scoreRoryProspect(prospect)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Score Prospect</button>
                          <button type="button" onClick={() => updateRoryProspectWorkflow(prospect, { priority: "high", status: prospect.status || "new" }, "Prospect marked high priority.")} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-slate-950">Mark as High Priority</button>
                          <button type="button" onClick={() => updateRoryProspectWorkflow(prospect, { status: "contacted", review_status: prospect.review_status || "approved", last_contacted_at: new Date().toISOString() }, "Prospect marked contacted.")} className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-black text-blue-800">Mark as Contacted</button>
                          <button type="button" onClick={() => sendProspectToMia(prospect)} disabled={prospect.do_not_contact} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-black text-white disabled:opacity-50">Send to Mia for Outreach</button>
                          <button type="button" onClick={() => updateRoryProspectStatus(prospect, "approved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white">Approve</button>
                          <button type="button" onClick={() => updateRoryProspectStatus(prospect, "rejected")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Reject</button>
                          <button type="button" onClick={() => markProspectDoNotContact(prospect)} className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-black text-amber-800">Mark as Do Not Contact</button>
                          <button type="button" onClick={() => deleteRoryProspect(prospect)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-black text-white">Delete Prospect</button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                        <p>Email: {safeText(prospect.contact_email, "Not publicly found")}</p>
                        <p>Phone: {safeText(prospect.phone, "Not publicly found")}</p>
                        <p>Decision-maker: {safeText(prospect.decision_maker_name, "Not publicly found")}</p>
                        <p>Status: {String(prospect.status || prospect.review_status || "new").replaceAll("_", " ")}</p>
                        <p>Last contacted: {prospect.last_contacted_at ? formatDisplayDateTime(prospect.last_contacted_at) : "Not contacted"}</p>
                        <p>Next follow-up: {nextFollowUpForProspect(prospect) ? formatDisplayDateTime(nextFollowUpForProspect(prospect)) : "Not scheduled"}</p>
                        <p>Assigned to: {safeText(prospect.assigned_to, "Not assigned")}</p>
                        <p>Do not contact: {prospect.do_not_contact ? "Yes" : "No"}</p>
                      </div>
                    </article>;
                    }) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">{roryProspectServiceFilter || roryProspectStatusFilter || roryProspectLocationFilter ? "No prospects match the current filters yet." : "No prospects have been added yet."}</p>}
                  </div>
                  {miaEmailPreview ? (
                    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4">
                      <section className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
                        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Preview only</p>
                            <h4 className="mt-1 text-xl font-black">Mia Email Preview</h4>
                            <p className="mt-1 text-sm font-semibold text-slate-600">This does not send an email. It shows the current message Mia would prepare for this prospect.</p>
                          </div>
                          <button type="button" onClick={() => setMiaEmailPreview(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Close Preview</button>
                        </div>
                        <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                          <p>To: {safeText(miaEmailPreview.to, "No public email recorded")}</p>
                          <p>Subject: {safeText(miaEmailPreview.subject, "No subject generated")}</p>
                          <p>Prospect: {safeText(miaEmailPreview.prospect?.organisation_name, "Unnamed prospect")}</p>
                        </div>
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <iframe title="Mia email preview" srcDoc={miaEmailPreview.html || "<p>No preview available.</p>"} className="h-[520px] w-full rounded-xl border border-slate-200 bg-white" />
                        </div>
                        <div className="mt-4 flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => navigator.clipboard?.writeText(miaEmailPreview.html || "").then(() => showMessage("success", "Mia email HTML copied."), () => showMessage("error", "Could not copy email HTML."))} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Copy HTML</button>
                          <button type="button" onClick={() => setMiaEmailPreview(null)} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-black text-white">Done</button>
                        </div>
                      </section>
                    </div>
                  ) : null}
                </section>
                </> : null}

                {activeTab === "AI Operations" ? <>
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-black">Agent Activity Log</h3>
                  <div className="mt-5 grid gap-3">
                    {safeAgentActivityLogs.length ? safeAgentActivityLogs.slice(0, 20).map((log) => <div key={log.id || `${log.agent_key}-${log.created_at}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black">{safeText(log.agent_name, "Unknown agent")}</p><p className="mt-1 text-sm font-semibold text-slate-700">{safeText(log.summary, "No summary available")}</p></div><p className="text-xs font-bold text-slate-500">{formatDisplayDateTime(log.created_at)}</p></div><p className="mt-2 text-xs font-bold text-emerald-700">Status: {safeText(log.status, "Pending")} | Approval required: {log.approval_required ? "Yes" : "No"}</p></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">No agent activity has been logged yet.</p>}
                  </div>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-xl font-black">Agent Identity Settings</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-600">These identities control how agents appear in the operations centre, summaries and future communication templates. Backend automated reminder emails use matching operational signatures.</p>
                  <div className="mt-5 grid gap-4">
                    {aiAgentCards.map((agent) => (
                      <div key={`${agent.key}-identity`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-sm font-black text-white">{agent.avatar}</div>
                          <div>
                            <h4 className="font-black">{safeText(agent.name, "Unknown agent")}</h4>
                            <p className="text-xs font-bold text-slate-500">{safeText(agent.title, "Unknown role")}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 lg:grid-cols-3">
                          <label className="grid gap-2 text-sm font-bold text-slate-700">Agent name<input value={agentIdentities[agent.key]?.name || ""} onChange={(e) => updateAgentIdentity(agent.key, "name", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                          <label className="grid gap-2 text-sm font-bold text-slate-700">Role/title<input value={agentIdentities[agent.key]?.title || ""} onChange={(e) => updateAgentIdentity(agent.key, "title", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                          <label className="grid gap-2 text-sm font-bold text-slate-700">Avatar initials<input value={agentIdentities[agent.key]?.avatar || ""} onChange={(e) => updateAgentIdentity(agent.key, "avatar", e.target.value.slice(0, 2).toUpperCase())} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                          <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-3">Tone/personality<input value={agentIdentities[agent.key]?.tone || ""} onChange={(e) => updateAgentIdentity(agent.key, "tone", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" /></label>
                          <label className="grid gap-2 text-sm font-bold text-slate-700 lg:col-span-3">Email signature<textarea value={agentIdentities[agent.key]?.signature || ""} onChange={(e) => updateAgentIdentity(agent.key, "signature", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" rows={3} /></label>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-xl font-black">Approval Queue</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-600">Booking Agent rule: training dates cannot be confirmed automatically. Human approval is always required before booking confirmation.</p>
                  <div className="mt-5 grid gap-3">
                    {aiApprovalQueue.length ? aiApprovalQueue.map((item) => <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><p className="font-black">{item.agent}</p><p className="mt-1 text-sm font-semibold text-slate-700">{item.task}</p><p className="mt-1 text-xs font-bold text-amber-700">{item.risk} - {item.count} item(s)</p></div><button type="button" onClick={() => simulateAiApproval(item, "Approved")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white">Approve</button><button type="button" onClick={() => simulateAiApproval(item, "Dismissed")} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700">Dismiss</button></div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">No approval items are waiting.</p>}
                  </div>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <h3 className="text-xl font-black">Configurable Agent Rules</h3>
                  <div className="mt-5 grid gap-4">
                    {aiAgentCards.map((agent) => {
                      const rules = asObject(aiRules[agent.key]);
                      return <div key={`${agent.key}-rules`} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h4 className="text-lg font-black">{safeText(agent.name, "Unknown agent")}</h4><label className="flex items-center gap-2 text-sm font-black"><input type="checkbox" checked={Boolean(rules.approvalRequired)} onChange={(e) => updateAiRule(agent.key, "approvalRequired", e.target.checked)} /> Approval required</label></div><div className="mt-4 grid gap-4 lg:grid-cols-3"><label className="grid gap-2 text-sm font-bold text-slate-700">Allowed actions<textarea value={safeText(rules.allowedActions, "")} onChange={(e) => updateAiRule(agent.key, "allowedActions", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" rows={3} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Forbidden actions<textarea value={safeText(rules.forbiddenActions, "")} onChange={(e) => updateAiRule(agent.key, "forbiddenActions", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" rows={3} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Escalation triggers<textarea value={safeText(rules.escalationTriggers, "")} onChange={(e) => updateAiRule(agent.key, "escalationTriggers", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" rows={3} /></label></div></div>;
                    })}
                  </div>
                </section>
                </> : null}
              </div>
              </SafeSectionBoundary>
                );
              } catch (error) {
                console.error("AI Operations render error:", error);
                return <SectionCrashPanel title="AI Operations" error={error} />;
              }
            })() : null}

            {activeTab === "Mia Knowledge Base" ? (
              <SafeSectionBoundary title="Mia Knowledge Base">
                <div>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Mia Knowledge Base</p>
                      <h2 className="mt-2 text-2xl font-black sm:text-3xl">Mia Knowledge Base</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">Manage approved answers, saved visitor questions, low-confidence responses and lead enquiries used by the enquiry response workflow.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => loadMiaKnowledgeBase({ quiet: false })} disabled={miaKbBusy === "loading"} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-60">Refresh</button>
                      <button type="button" onClick={syncMiaKnowledgeBase} disabled={miaKbBusy === "sync"} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{miaKbBusy === "sync" ? "Syncing..." : "Sync Knowledge Base From Seed"}</button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase text-slate-500">KB entries</p><p className="mt-2 text-3xl font-black">{safeMiaKbEntries.length}</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-5"><p className="text-xs font-black uppercase text-emerald-700">Visitor questions</p><p className="mt-2 text-3xl font-black">{safeMiaVisitorQuestions.length}</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-amber-50 p-5"><p className="text-xs font-black uppercase text-amber-700">Needs review</p><p className="mt-2 text-3xl font-black">{miaNeedsReviewQuestions.length}</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-blue-50 p-5"><p className="text-xs font-black uppercase text-blue-700">Lead enquiries</p><p className="mt-2 text-3xl font-black">{miaLeadQuestions.length}</p></div>
                  </div>

                  <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-xl font-black">Settings / Guardrails</h3>
                    <div className="mt-4 grid gap-3 text-sm font-semibold leading-relaxed text-slate-700 lg:grid-cols-2">
                      <p className="rounded-xl bg-white p-4">Mia uses approved knowledge base content only. She must not invent services, prices, dates, accreditations, availability or certificate rules.</p>
                      <p className="rounded-xl bg-white p-4">Low-confidence answers are logged for admin review. Pricing questions without an exact approved price use the approved pricing fallback.</p>
                    </div>
                  </section>

                  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xl font-black">Knowledge Base Entries</h3>
                    <form onSubmit={saveMiaKnowledgeEntry} className="mt-5 grid gap-4 rounded-2xl bg-slate-50 p-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <input value={miaKbEntryForm.category} onChange={(e) => updateMiaKbEntryField("category", e.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Category" required />
                        <input value={miaKbEntryForm.title} onChange={(e) => updateMiaKbEntryField("title", e.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Title" required />
                        <select value={miaKbEntryForm.status} onChange={(e) => updateMiaKbEntryField("status", e.target.value)} className="rounded-xl border border-slate-200 p-3">
                          <option value="approved">approved</option>
                          <option value="draft">draft</option>
                          <option value="archived">archived</option>
                        </select>
                      </div>
                      <input value={miaKbEntryForm.question} onChange={(e) => updateMiaKbEntryField("question", e.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Approved question / prompt" />
                      <textarea value={miaKbEntryForm.approved_answer} onChange={(e) => updateMiaKbEntryField("approved_answer", e.target.value)} className="rounded-xl border border-slate-200 p-3" rows={4} placeholder="Approved answer" required />
                      <div className="grid gap-4 md:grid-cols-[1fr_140px_160px]">
                        <input value={miaKbEntryForm.keywords} onChange={(e) => updateMiaKbEntryField("keywords", e.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Keywords, comma separated" />
                        <input type="number" value={miaKbEntryForm.priority} onChange={(e) => updateMiaKbEntryField("priority", e.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Priority" />
                        <input type="number" value={miaKbEntryForm.confidence_threshold} onChange={(e) => updateMiaKbEntryField("confidence_threshold", e.target.value)} className="rounded-xl border border-slate-200 p-3" placeholder="Threshold" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" disabled={miaKbBusy === "save-entry"} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{miaKbEntryForm.id ? "Update Entry" : "Save Entry"}</button>
                        <button type="button" onClick={() => setMiaKbEntryForm({ category: "", title: "", question: "", approved_answer: "", keywords: "", source: "Back Office", status: "approved", priority: 50, confidence_threshold: 35 })} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700">Clear</button>
                      </div>
                    </form>
                    <div className="mt-5 grid gap-3">
                      {safeMiaKbEntries.length ? safeMiaKbEntries.slice(0, 30).map((entry) => (
                        <article key={entry.id || `${entry.category}-${entry.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-black uppercase text-emerald-700">{entry.category} | {entry.status}</p>
                              <h4 className="mt-1 text-lg font-black">{entry.title}</h4>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">{entry.approved_answer}</p>
                              <p className="mt-2 text-xs font-bold text-slate-500">Keywords: {Array.isArray(entry.keywords) && entry.keywords.length ? entry.keywords.join(", ") : "None recorded"}</p>
                            </div>
                            <button type="button" onClick={() => editMiaKbEntry(entry)} className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-black text-white">Edit</button>
                          </div>
                        </article>
                      )) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">No knowledge base entries loaded yet. Use Sync Knowledge Base From Seed.</p>}
                    </div>
                  </section>

                  <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xl font-black">Visitor Questions</h3>
                    <div className="mt-5 grid gap-3">
                      {safeMiaVisitorQuestions.length ? safeMiaVisitorQuestions.map((question) => (
                        <article key={question.id} className={`rounded-2xl border p-4 ${question.needs_review ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-black uppercase text-slate-500">{formatDisplayDateTime(question.created_at)} | {safeText(question.status, "New enquiry")} | Confidence {question.confidence_score || 0}</p>
                              <h4 className="mt-2 text-lg font-black">{question.visitor_question}</h4>
                              <p className="mt-3 whitespace-pre-line text-sm font-semibold leading-relaxed text-slate-700">{question.mia_answer}</p>
                              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
                                <p>Lead: {safeText(question.visitor_name || question.organisation || question.email, "No lead details")}</p>
                                <p>Course: {safeText(question.course_interest, "Not specified")}</p>
                                <p>Location: {safeText(question.location, "Not specified")}</p>
                                <p>Matched: {question.matched_knowledge_base_entries?.map((entry) => entry.title || entry.category).filter(Boolean).join(", ") || "No matches recorded"}</p>
                              </div>
                            </div>
                            <div className="grid min-w-[170px] gap-2">
                              <button type="button" onClick={() => updateMiaVisitorQuestion(question, { status: "Answered by Mia", was_answered: true, needs_review: false }, "Answer approved.")} disabled={miaKbBusy === question.id} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Approve Answer</button>
                              <button type="button" onClick={() => createMiaEntryFromQuestion(question)} disabled={miaKbBusy === question.id} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Add as KB Entry</button>
                              <button type="button" onClick={() => updateMiaVisitorQuestion(question, { status: "Needs admin review", needs_review: true }, "Question marked for review.")} disabled={miaKbBusy === question.id} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-60">Needs Review</button>
                              <button type="button" onClick={() => updateMiaVisitorQuestion(question, { status: "Not suitable", needs_review: false }, "Question marked not relevant.")} disabled={miaKbBusy === question.id} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60">Not Relevant</button>
                            </div>
                          </div>
                        </article>
                      )) : <p className="rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">No visitor questions have been logged yet.</p>}
                    </div>
                  </section>

                  <section className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-amber-50 p-5 shadow-sm">
                      <h3 className="text-xl font-black">Needs Review</h3>
                      <div className="mt-4 grid gap-3">
                        {miaNeedsReviewQuestions.length ? miaNeedsReviewQuestions.slice(0, 8).map((question) => <div key={`review-${question.id}`} className="rounded-xl bg-white p-4"><p className="font-black">{question.visitor_question}</p><p className="mt-1 text-xs font-bold text-amber-700">Confidence {question.confidence_score || 0}</p></div>) : <p className="rounded-xl bg-white p-4 text-sm font-bold text-slate-600">No low-confidence questions waiting.</p>}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-blue-50 p-5 shadow-sm">
                      <h3 className="text-xl font-black">Lead Enquiries</h3>
                      <div className="mt-4 grid gap-3">
                        {miaLeadQuestions.length ? miaLeadQuestions.slice(0, 8).map((question) => <div key={`lead-${question.id}`} className="rounded-xl bg-white p-4"><p className="font-black">{safeText(question.organisation || question.visitor_name, "Lead")}</p><p className="mt-1 text-sm font-semibold text-slate-700">{safeText(question.email || question.phone, "No contact details")}</p><p className="mt-1 text-xs font-bold text-blue-700">{safeText(question.course_interest, "Course not specified")}</p></div>) : <p className="rounded-xl bg-white p-4 text-sm font-bold text-slate-600">No lead details captured yet.</p>}
                      </div>
                    </div>
                  </section>
                </div>
              </SafeSectionBoundary>
            ) : null}

            {activeTab === "Workflow Debug Trace" ? (
              <SafeSectionBoundary title="Workflow Debug Trace">
              <div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Workflow Debug Trace</p>
                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">Theo Decision Trace</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">Use this page to see exactly why Theo auto-replied or routed a booking enquiry to approval.</p>
                  </div>
                  <button type="button" onClick={() => loadTrainingComplianceData({ quiet: false })} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Refresh Trace Data</button>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-xl font-black">Recent Theo Decisions</h3>
                    <div className="mt-4 grid gap-3">
                      {theoDecisionTraceLogs.length ? theoDecisionTraceLogs.slice(0, 12).map((log) => {
                        const trace = asObject(log.metadata?.theo_trace);
                        const inboundId = trace.inbound_message_id || asObject(log.metadata).inbound_message_id || "";
                        return <button key={log.id} type="button" onClick={() => setSelectedTheoTraceId(inboundId)} className={`rounded-xl border p-4 text-left transition ${selectedTheoTraceId === inboundId ? "border-emerald-500 bg-white shadow-sm" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-black">{safeText(trace.classification_result || asObject(log.metadata).classification, "Theo decision")}</p>
                              <p className="mt-1 text-xs font-bold text-slate-500">Inbound: {safeText(inboundId, "Not linked")}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${trace.approval_required ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{trace.approval_required ? "Approval" : "Auto-reply"}</span>
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-600">{formatDisplayDateTime(log.created_at)}</p>
                        </button>;
                      }) : <p className="rounded-xl bg-white p-4 text-sm font-bold text-slate-600">No Theo decision traces have been logged yet.</p>}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-xl font-black">Selected Trace</h3>
                    {hasSelectedTheoTrace ? (
                      <div className="mt-4 grid gap-4">
                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-xs font-black uppercase text-slate-500">Original message</p>
                          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">{safeText(selectedTheoInbound?.message_body, "Original inbound message is not available in the current loaded data.")}</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Inbound message ID</p><p className="mt-2 break-all text-sm font-black">{safeText(selectedTheoTrace.inbound_message_id, "Not recorded")}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Classification result</p><p className="mt-2 text-sm font-black">{safeText(selectedTheoTrace.classification_result, "Not recorded")}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Assigned agent</p><p className="mt-2 text-sm font-black uppercase">{safeText(selectedTheoTrace.assigned_agent, "Not recorded")}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Approval required</p><p className="mt-2 text-sm font-black">{selectedTheoTrace.approval_required ? "Yes" : "No"}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4 md:col-span-2"><p className="text-xs font-black uppercase text-slate-500">Reason approval was required / decision reason</p><p className="mt-2 text-sm font-semibold leading-relaxed text-slate-700">{safeText(selectedTheoTrace.approval_reason || selectedTheoTrace.decision_reason, "No approval reason recorded.")}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Theo auto-reply allowed</p><p className="mt-2 text-sm font-black">{selectedTheoTrace.theo_auto_reply_allowed ? "Yes" : "No"}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Response draft generated</p><p className="mt-2 text-sm font-black">{selectedTheoTrace.theo_response_draft_generated ? "Yes" : "No"}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Resend send attempted</p><p className="mt-2 text-sm font-black">{selectedTheoTrace.resend_send_attempted ? "Yes" : "No"}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Resend response status</p><p className="mt-2 text-sm font-black">{safeText(selectedTheoTrace.resend_response_status, "Not attempted / not recorded")}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Theo queue item created</p><p className="mt-2 text-sm font-black">{selectedTheoTrace.theo_queue_item_created ? "Yes" : "No"}</p></div>
                          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-black uppercase text-slate-500">Thrown error</p><p className="mt-2 break-words text-sm font-semibold text-red-700">{safeText(selectedTheoTrace.thrown_error, "None")}</p></div>
                        </div>
                        <details className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <summary className="cursor-pointer text-sm font-black">Raw trace metadata</summary>
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(selectedTheoTrace, null, 2)}</pre>
                        </details>
                      </div>
                    ) : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-600">Select a Theo decision trace to inspect the workflow.</p>}
                  </section>
                </div>
              </div>
              </SafeSectionBoundary>
            ) : null}

            {activeTab === "Media Manager" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Media Manager</h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">Update key site images without changing the card layouts. URL changes and slider controls preview immediately. Supabase Storage uploads use a public bucket named site-media when available.</p>
                <div className="mt-6 grid gap-5">
                  {MEDIA_MANAGER_SLOT_ORDER.map((slot) => {
                    const defaults = DEFAULT_MEDIA_SETTINGS[slot];
                    const media = getMediaSlot(mediaSettings, slot);
                    return (
                      <div key={slot} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="h-44 overflow-hidden bg-slate-100">
                              <img {...mediaImageProps(mediaSettings, slot)} className="h-full w-full object-cover" />
                            </div>
                            <div className="p-4">
                              <p className="text-lg font-black">{defaults.label}</p>
                              <p className="mt-1 text-xs text-slate-500">{slot}</p>
                            </div>
                          </div>
                          <div className="grid gap-4">
                            <label className="grid gap-2 text-sm font-bold text-slate-700">Image URL<input value={media.imageUrl || ""} onChange={(e) => updateMediaField(slot, "imageUrl", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder={defaults.imageUrl} /></label>
                            <label className="grid gap-2 text-sm font-bold text-slate-700">Upload image<input type="file" accept="image/*" onChange={(e) => uploadMediaFile(slot, e.target.files?.[0])} className="rounded-xl border border-slate-200 bg-white p-3 font-normal" /></label>
                            <label className="grid gap-2 text-sm font-bold text-slate-700">Alt text<input value={media.altText || ""} onChange={(e) => updateMediaField(slot, "altText", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder={defaults.altText} /></label>
                            <div className="grid gap-4 md:grid-cols-3">
                              <label className="grid gap-2 text-sm font-bold text-slate-700">X position: {media.x ?? 50}%<input type="range" min="0" max="100" value={media.x ?? 50} onChange={(e) => updateMediaField(slot, "x", e.target.value)} /></label>
                              <label className="grid gap-2 text-sm font-bold text-slate-700">Y position: {media.y ?? 50}%<input type="range" min="0" max="100" value={media.y ?? 50} onChange={(e) => updateMediaField(slot, "y", e.target.value)} /></label>
                              <label className="grid gap-2 text-sm font-bold text-slate-700">Zoom: {Number(media.zoom ?? 1).toFixed(1)}<input type="range" min="0.8" max="2" step="0.1" value={media.zoom ?? 1} onChange={(e) => updateMediaField(slot, "zoom", e.target.value)} /></label>
                            </div>
                            <button type="button" onClick={() => saveMediaSlot(slot)} className="rounded-xl bg-slate-950 p-3 font-black text-white">Save {defaults.label}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activeTab === "Settings" ? (
              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Settings</h2>
                <div className="mt-6 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="businessName" value={settings.businessName} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Footer business name" />
                    <input name="companyNumber" value={settings.companyNumber} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Company number" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="registeredJurisdiction" value={settings.registeredJurisdiction} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Registered jurisdiction" />
                    <input name="contactEmail" value={settings.contactEmail} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Email address" />
                  </div>
                  <input name="contactDisplayText" value={settings.contactDisplayText} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Contact display text" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="phone" value={settings.phone} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Phone number" />
                    <input name="address" value={settings.address} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Registered office address" />
                  </div>
                  <input name="stripeLink" value={settings.stripeLink} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Stripe live payment link" />
                  <input name="complianceAppBase" value={settings.complianceAppBase} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Compliance app base" />
                  <input name="privacyReview" value={settings.privacyReview} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Privacy review" />
                  <button type="button" onClick={saveSiteSettings} className="rounded-xl bg-slate-950 p-4 font-black text-white">Save Settings</button>
                  <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Settings save to Supabase site_settings and are used by the footer and contact page after refresh.</p>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathRoutes = {
    "/": "Home",
    "/training": "Training",
    "/booking": "Booking",
    "/booking-success": "BookingConfirmation",
    "/booking-confirmation": "BookingConfirmation",
    "/compliance": "Compliance",
    "/membership": "Membership",
    "/login": "Login",
    "/member-dashboard": "MemberDashboard",
    "/member-welcome": "MemberWelcome",
    "/onboarding": "Onboarding",
    "/reviews": "Reviews",
    "/blog": "Blog",
    "/contact": "Contact",
    "/privacy": "Privacy",
    "/cookies": "CookiePolicy",
    "/terms": "Terms",
    "/subscribe": "Subscribe",
    "/onboarding-success": "PaymentSuccess",
    "/payment-success": "PaymentSuccess",
    "/premium-compliance-partner": "PremiumCompliancePartner",
    "/backoffice": "BackOffice"
  };
  const legacyHashRoutes = {
    training: "Training",
    booking: "Booking",
    bookingconfirmation: "BookingConfirmation",
    compliance: "Compliance",
    membership: "Membership",
    login: "Login",
    memberdashboard: "MemberDashboard",
    "member-welcome": "MemberWelcome",
    onboarding: "Onboarding",
    reviews: "Reviews",
    blog: "Blog",
    contact: "Contact",
    privacy: "Privacy",
    cookies: "CookiePolicy",
    terms: "Terms",
    subscribe: "Subscribe",
    "onboarding-success": "PaymentSuccess",
    "payment-success": "PaymentSuccess",
    "premium-compliance-partner": "PremiumCompliancePartner",
    backoffice: "BackOffice"
  };
  const pagePaths = Object.fromEntries(Object.entries(pathRoutes).map(([path, route]) => [route, path]));
  const cleanPath = location.pathname.replace(/\/+$/, "") || "/";
  const blogSlug = cleanPath.startsWith("/blog/") ? cleanPath.slice("/blog/".length) : "";
  const legacyHash = location.hash.replace("#", "").split("?")[0].toLowerCase();
  const page = blogSlug ? "BlogDetail" : pathRoutes[cleanPath] || (cleanPath === "/" && legacyHashRoutes[legacyHash]) || "Home";
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loggedInMember, setLoggedInMember] = useState(null);
  const [authSession, setAuthSession] = useState(null);
  const [posts, setPosts] = useState(initialPosts);
  const [reviews, setReviews] = useState(initialReviews);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [mediaSettings, setMediaSettings] = useState(DEFAULT_MEDIA_SETTINGS);
  const [backOfficeLoginNonce, setBackOfficeLoginNonce] = useState(0);
  const selectedBlogPost = posts.find((post) => createBlogSlug(post) === blogSlug);

  function setPage(nextPage) {
    const path = pagePaths[nextPage] || "/";
    const keepSearch = nextPage === "PaymentSuccess" || nextPage === "MemberWelcome";
    navigate(`${path}${keepSearch ? location.search : ""}`);
  }

  function openBlogPost(post) {
    navigate(`/blog/${createBlogSlug(post)}`);
  }

  useEffect(() => {
    const cookieYesId = import.meta.env?.VITE_COOKIEYES_ID || "";
    if (!cookieYesId || document.getElementById("cookieyes")) return;
    const script = document.createElement("script");
    script.id = "cookieyes";
    script.type = "text/javascript";
    script.src = `https://cdn-cookieyes.com/client_data/${cookieYesId}/script.js`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ((params.get("payment") === "success" || params.get("success") === "true") && cleanPath !== "/onboarding-success" && cleanPath !== "/payment-success") setPage("BookingConfirmation");
  }, []);

  useEffect(() => {
    if (!supabase) return;
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setAuthSession(data.session);
      if (data.session?.user?.email) {
        const { data: memberData } = await supabase.from("members").select("id, organisation, contact_name, email, phone, plan, payment_status, setup_status, med_app_status, journey_app_status, med_app_url, journey_app_url").eq("email", data.session.user.email).maybeSingle();
        if (memberData) setLoggedInMember(memberData);
      }
    }
    loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setAuthSession(session);
      if (!session?.user?.email) { setLoggedInMember(null); return; }
      const { data: memberData } = await supabase.from("members").select("id, organisation, contact_name, email, phone, plan, payment_status, setup_status, med_app_status, journey_app_status, med_app_url, journey_app_url").eq("email", session.user.email).maybeSingle();
      if (memberData) setLoggedInMember(memberData);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    async function loadSupabaseContent() {
      if (!supabase) return;
      const { data: blogData, error: blogError } = await supabase.from("blog_posts").select("id, tag, title, content, status, created_at").order("created_at", { ascending: false });
      if (!blogError && blogData && blogData.length > 0) setPosts(blogData.map((post) => ({ id: post.id, tag: post.tag || "Update", title: post.title || "Untitled", text: post.content || "", status: post.status || "Draft" })));
      const { data: reviewData, error: reviewError } = await supabase.from("reviews").select("id, rating, name, organisation, content, status, created_at").order("created_at", { ascending: false });
      if (!reviewError && reviewData && reviewData.length > 0) setReviews(reviewData.map((review) => ({ id: review.id, rating: review.rating || "★★★★★", name: review.name || "Reviewer", org: review.organisation || "Organisation", text: review.content || "", status: review.status || "Draft" })));
    }
    loadSupabaseContent();
  }, []);

  useEffect(() => {
    async function loadMediaSettings() {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("site_media_settings")
        .select("slot, image_url, alt_text, object_position_x, object_position_y, zoom");
      if (error || !data) return;
      const nextSettings = data.reduce((acc, row) => {
        if (DEFAULT_MEDIA_SETTINGS[row.slot]) acc[row.slot] = { ...DEFAULT_MEDIA_SETTINGS[row.slot], ...mapMediaRow(row) };
        return acc;
      }, {});
      if (Object.keys(nextSettings).length > 0) setMediaSettings((current) => ({ ...current, ...nextSettings }));
    }
    loadMediaSettings();
  }, []);

  useEffect(() => {
    async function loadSiteSettings() {
      const { response, result } = await callAdminAction("get-settings");
      if (!response.ok) {
        console.error("Settings load error:", result);
        return;
      }
      if (result.settings) setSiteSettings((current) => ({ ...current, ...result.settings }));
    }
    loadSiteSettings().catch((error) => console.error("Settings load error:", error));
  }, []);

  function startBooking(course) { setSelectedCourse(course); setPage("Booking"); }
  function openBackOffice() {
    try {
      window.localStorage.removeItem("ace_back_office_unlocked");
    } catch (error) {
      console.warn("Back Office unlock reset unavailable:", error);
    }
    setBackOfficeLoginNonce((current) => current + 1);
    setPage("BackOffice");
  }

  return <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950"><Header page={page === "BlogDetail" ? "Blog" : page} setPage={setPage} openBackOffice={openBackOffice} />{page === "Home" && <HomePage setPage={setPage} mediaSettings={mediaSettings} />}{page === "Training" && <TrainingPage startBooking={startBooking} mediaSettings={mediaSettings} />}{page === "Booking" && <BookingPage course={selectedCourse} setPage={setPage} />}{page === "BookingConfirmation" && <BookingConfirmationPage setPage={setPage} />}{page === "Compliance" && <CompliancePage setPage={setPage} siteSettings={siteSettings} />}{page === "Membership" && <MembershipPage setPage={setPage} siteSettings={siteSettings} />}{page === "Subscribe" && <SubscribePage siteSettings={siteSettings} />}{page === "PaymentSuccess" && <PaymentSuccessPage setPage={setPage} />}{page === "PremiumCompliancePartner" && <PremiumCompliancePartnerPage setPage={setPage} />}{page === "MemberWelcome" && <MemberWelcomePage setPage={setPage} setLoggedInMember={setLoggedInMember} />}{page === "Login" && <LoginPage setPage={setPage} setLoggedInMember={setLoggedInMember} />}{page === "MemberDashboard" && <MemberDashboardPage member={loggedInMember} setPage={setPage} session={authSession} />}{page === "Onboarding" && <OnboardingPage setPage={setPage} />}{page === "Reviews" && <ReviewsPage reviews={reviews} setReviews={setReviews} />}{page === "Blog" && <BlogPage posts={posts} openBlogPost={openBlogPost} />}{page === "BlogDetail" && <BlogDetailPage post={selectedBlogPost} setPage={setPage} />}{page === "Contact" && <ContactPage siteSettings={siteSettings} />}{page === "Privacy" && <PrivacyPage setPage={setPage} siteSettings={siteSettings} />}{page === "CookiePolicy" && <CookiePolicyPage setPage={setPage} siteSettings={siteSettings} />}{page === "Terms" && <TermsPage setPage={setPage} siteSettings={siteSettings} />}{page === "BackOffice" && <BackOfficePage setPage={setPage} posts={posts} setPosts={setPosts} reviews={reviews} setReviews={setReviews} siteSettings={siteSettings} setSiteSettings={setSiteSettings} mediaSettings={mediaSettings} setMediaSettings={setMediaSettings} loginNonce={backOfficeLoginNonce} />}<Footer setPage={setPage} siteSettings={siteSettings} /></div>;
}


