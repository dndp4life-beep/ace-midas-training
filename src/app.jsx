import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_SETTINGS = {
  contactEmail: "info@ace-midas-training.co.uk",
  phone: "020 3633 4203 / 07570 988 597",
  contactDisplayText: "We would love to hear from you",
  stripeLink: import.meta.env?.VITE_STRIPE_PAYMENT_LINK || "",
  complianceAppBase: "https://journeytracker.manus.space/login?token=",
  privacyReview: "April 2026"
};
const CHECKOUT_API_URL = "/api/create-checkout-session";
const BOOKING_DETAILS_ENDPOINT = "https://formspree.io/f/mykloeon";
const BOOKING_CONFIRMATION_API = "/api/send-booking-confirmation";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

console.log("SUPABASE_URL:", SUPABASE_URL ? "loaded" : "missing");
console.log("SUPABASE_KEY:", SUPABASE_KEY ? "loaded" : "missing");

const images = {
  logoHorizontal: "/images/logohorizontal.jpg",
  logoRound: "/images/logoround.png",
  minibusHero: "/images/headerpica.jpg",
  vehicleLineup: "/images/headerpicb.jpg",
  firstAid: "/images/firstaid.png",
  interior: "/images/insidea.jpg",
  handshake: "/images/handshake.png"
};

const trainingCourses = [
  { title: "MiDAS Standard", price: "£165", note: "Includes £40 CTA learner-pass charge", image: images.minibusHero },
  { title: "MiDAS Accessible", price: "£210", note: "Includes £40 CTA learner-pass charge", image: images.minibusHero },
  { title: "PATS Standard", price: "£125", note: "Includes £30 CTA learner-pass charge", image: images.interior },
  { title: "PATS Accessible", price: "£155–£185", note: "Attendance or proficiency routes", image: images.interior },
  { title: "First Aid at Work", price: "£205–£225", note: "Blended or 3-day classroom options", image: images.firstAid },
  { title: "Children’s Transport First Aid", price: "£95–£135", note: "Optional epilepsy medication module", image: images.firstAid }
];

const features = ["Journey reporting", "Medication logs", "Attendance tracking", "Wheelchair checks", "Incident records", "Audit-ready evidence"];
const stats = [["MiDAS", "Driver training"], ["PATS", "Passenger assistant training"], ["CTFA", "Children’s transport first aid"], ["Compliance", "Digital tracking support"]];
const initialPosts = [
  { tag: "Compliance", title: "Why transport compliance needs more than paper records", text: "A practical look at why daily evidence matters for SEND transport providers.", status: "Published" },
  { tag: "Training", title: "MiDAS, PATS and digital compliance", text: "How training and digital records work together to protect operators and passengers.", status: "Draft" }
];
const initialReviews = [
  { rating: "★★★★★", name: "Transport Manager", org: "SEND Transport Provider", text: "The system gives us a clearer way to evidence what happens on each journey.", status: "Published" },
  { rating: "★★★★★", name: "School Operations Lead", org: "Academy Trust", text: "The training and compliance approach feels practical, organised and relevant.", status: "Published" }
];

const initialOnboarding = [
  { organisation: "Demo Transport Provider", contact: "Operations Lead", email: "ops@example.com", depots: "2", modules: "Journey reporting, medication logs, incidents", status: "New" }
];

const initialMembers = [
  { organisation: "Demo Transport Provider", plan: "Compliance Bundle", payment: "Test", onboarding: "Pending", depotUrl: "https://journeytracker.manus.space/login?token=demoabc123xyz789" }
];

const initialActivity = [
  "Back Office opened",
  "Supabase tables created",
  "Privacy Policy added",
  "Member dashboard created"
];

function runSelfTests() {
  console.assert(trainingCourses.length === 6, "Expected six training courses");
  console.assert(trainingCourses.some((course) => course.title === "Children’s Transport First Aid"), "CTFA course should exist");
  console.assert(images.logoRound.startsWith("/images/"), "Images should load from public/images");
  console.assert(typeof SUPABASE_URL === "string", "Supabase URL should be a string");
}
runSelfTests();

function Header({ page, setPage, openBackOffice }) {
  const nav = ["Home", "Training", "Compliance", "Reviews", "Blog", "Contact"];
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <button type="button" onClick={() => setPage("Home")} className="flex items-center gap-3 text-left">
          <img onDoubleClick={openBackOffice} src={images.logoRound} alt="ACE MiDAS Training logo" className="h-12 w-12 rounded-full object-contain" />
          <div>
            <p className="text-lg font-bold leading-tight text-slate-950">ACE MiDAS Training</p>
            <p className="text-xs text-slate-500">Training • Compliance • Passenger Transport</p>
          </div>
        </button>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {nav.map((item) => (
            <button key={item} type="button" onClick={() => setPage(item)} className={page === item ? "text-emerald-600" : "hover:text-emerald-600"}>{item}</button>
          ))}
        </nav>
        <button type="button" onClick={() => setPage("Login")} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm">Member Login</button>
      </div>
    </header>
  );
}

function HomePage({ setPage }) {
  const cards = [
    { title: "MiDAS Training", text: "Driver awareness training for minibus and passenger transport operations.", image: images.minibusHero },
    { title: "PATS Training", text: "Passenger assistant training for staff supporting children and vulnerable passengers.", image: images.interior },
    { title: "First Aid & CTFA", text: "First Aid at Work and Children’s Transport First Aid with practical scenarios.", image: images.firstAid }
  ];
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[88vh] overflow-hidden bg-slate-950 text-white">
        <img src={images.vehicleLineup} alt="Passenger transport fleet" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/30" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-400" />MiDAS • PATS • First Aid • Compliance Hub</div>
            <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight md:text-7xl">Safer passenger transport starts with better training and better evidence.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">Practical transport-focused training for schools, councils and operators — supported by a digital compliance hub for journey reporting, medication logs, attendance, wheelchair checks and incident evidence.</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => setPage("Training")} className="rounded-2xl bg-emerald-400 px-8 py-4 text-lg font-black text-slate-950 shadow-xl transition hover:-translate-y-1">Book Training</button>
              <button type="button" onClick={() => setPage("Compliance")} className="rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur transition hover:-translate-y-1">Explore Compliance Hub</button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map(([title, text]) => <div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-2xl font-black text-emerald-300">{title}</p><p className="mt-1 text-xs leading-5 text-slate-300">{text}</p></div>)}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="relative rotate-2 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur transition hover:rotate-0">
              <img src={images.minibusHero} alt="ACE MiDAS minibus training" className="h-[520px] w-full rounded-[2rem] object-cover" />
              <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-slate-950/85 p-6 shadow-xl backdrop-blur"><p className="text-sm font-semibold text-emerald-300">ACE MiDAS Training</p><p className="mt-1 text-3xl font-black">Training that matches real transport operations.</p></div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-slate-200 bg-white px-6 py-5"><div className="mx-auto grid max-w-7xl gap-3 text-center text-sm font-bold text-slate-600 md:grid-cols-4">{["Council & school transport focused", "SEND passenger safety", "Training + digital compliance", "Built for real operators"].map((point) => <div key={point} className="rounded-2xl bg-slate-50 px-4 py-3">✔ {point}</div>)}</div></section>
      <section className="bg-white px-6 py-20"><div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"><div><img src={images.logoHorizontal} alt="ACE MiDAS Training" className="max-h-24 max-w-full object-contain" /><p className="mt-8 font-semibold text-emerald-700">Training services</p><h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">One provider for training, booking and compliance evidence.</h2><p className="mt-5 max-w-2xl leading-8 text-slate-600">Keep the familiar ACE MiDAS Training identity, but present it with a stronger commercial journey.</p></div><div className="grid gap-5 md:grid-cols-3">{cards.map((course) => <button key={course.title} type="button" onClick={() => setPage("Training")} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 text-left shadow-sm transition hover:-translate-y-2 hover:shadow-2xl"><img src={course.image} alt={course.title} className="h-48 w-full object-cover transition duration-500 group-hover:scale-110" /><div className="p-6"><h3 className="text-xl font-black">{course.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{course.text}</p><p className="mt-5 font-black text-emerald-700">View course →</p></div></button>)}</div></div></div></section>
      <section className="bg-slate-950 px-6 py-20 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center"><img src={images.interior} alt="Minibus passenger area" className="h-[440px] w-full rounded-[2rem] object-cover" /><div><p className="font-semibold text-emerald-300">Compliance Hub</p><h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Turn daily transport activity into audit-ready records.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Give depots, road staff and managers a controlled way to record what happens on transport services.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{features.map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 font-semibold text-slate-200">✔ {item}</div>)}</div><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Compliance")} className="rounded-2xl bg-emerald-400 px-7 py-4 font-black text-slate-950">View Packages</button><button type="button" onClick={() => setPage("Membership")} className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Member Access</button></div></div></div></section>
      <section className="relative overflow-hidden bg-emerald-600 px-6 py-20 text-slate-950"><div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center"><div><p className="font-bold">Ready to replace paper-heavy processes?</p><h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Let’s build safer transport practice together.</h2><p className="mt-5 max-w-2xl text-lg leading-8">Book training, request a compliance demo, or speak to us about a premium setup.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Training")} className="rounded-2xl bg-slate-950 px-7 py-4 font-black text-white">Book Training</button><button type="button" onClick={() => setPage("Contact")} className="rounded-2xl border border-slate-950/20 bg-white/30 px-7 py-4 font-black text-slate-950">Contact Us</button></div></div><img src={images.handshake} alt="Partnership handshake" className="h-[360px] w-full rounded-[2rem] object-cover" /></div></section>
    </main>
  );
}

function TrainingPage({ startBooking }) {
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="font-semibold text-emerald-700">Training Services</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Book MiDAS, PATS, FAW or Children’s Transport First Aid.</h1><p className="mt-5 leading-8 text-slate-600">Choose a course, select delegates, review the agreement, and continue to secure payment.</p></div><img src={images.vehicleLineup} alt="Passenger transport fleet" className="h-[360px] w-full rounded-[1.5rem] object-cover" /></div><div className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50 p-7 shadow-sm"><p className="font-semibold text-emerald-700">Essential Training</p><h2 className="mt-2 text-3xl font-bold">Pay per course</h2><p className="mt-3 text-slate-700">Book MiDAS, PATS, First Aid at Work or Children’s Transport First Aid training for individuals or groups.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><p>✔ Course booking</p><p>✔ Certification support</p><p>✔ Group booking options</p></div></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{trainingCourses.map((course) => <button key={course.title} type="button" onClick={() => startBooking(course)} className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-500 hover:shadow-lg"><img src={course.image} alt={course.title} className="h-44 w-full object-cover" /><div className="p-6"><p className="text-sm text-slate-500">{course.title}</p><p className="mt-3 text-3xl font-bold">{course.price}</p><p className="mt-3 text-sm text-slate-600">{course.note}</p><p className="mt-5 font-bold text-emerald-700">Book this course →</p></div></button>)}</div></div></main>;
}

function BookingPage({ course, setPage }) {
  const [qty, setQty] = useState(1);
  const [outside, setOutside] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  if (!course) return <main className="min-h-screen bg-slate-50 px-6 py-20 text-center"><h1 className="text-4xl font-bold">No course selected</h1><button type="button" onClick={() => setPage("Training")} className="mt-8 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Training</button></main>;
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
      const response = await fetch(CHECKOUT_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseTitle: course.title, quantity: qty, unitPrice: unit, subtotal, travelFee, total, outsideA406: outside, agreementAccepted: true, refundPolicy: "No refunds for non-attendance" }) });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to create Stripe checkout");
      window.location.href = data.url;
    } catch (error) {
      setPaymentError(error.message || "Unable to create Stripe checkout.");
      setIsLoading(false);
    }
  }
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><div className="text-center"><p className="font-semibold text-emerald-700">Course Booking</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Confirm your booking</h1></div><div className="mt-12 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">{course.title}</h2><p className="mt-2 text-slate-500">{course.note}</p><label className="mt-6 block font-semibold">Number of delegates</label><input type="number" min="1" max={max} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} className="mt-2 w-full rounded-xl border p-3" /><p className="mt-2 text-xs text-slate-500">Maximum allowed: {max}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setOutside(false)} className={`rounded-xl px-4 py-3 font-bold ${!outside ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Inside A406</button><button type="button" onClick={() => setOutside(true)} className={`rounded-xl px-4 py-3 font-bold ${outside ? "bg-red-600 text-white" : "bg-slate-100"}`}>Outside A406</button></div></div><div className="rounded-3xl border bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">Price Breakdown</h2><div className="mt-6 space-y-4"><div className="flex justify-between"><span>Price per delegate</span><div className="text-right">{saving > 0 ? <p className="text-sm line-through text-slate-400">£{high}</p> : null}<b>£{unit}</b></div></div><div className="flex justify-between"><span>Delegates</span><b>{qty}</b></div><div className="flex justify-between"><span>Subtotal</span><b>£{subtotal}</b></div><div className="flex justify-between"><span>Travel fee</span><b>£{travelFee}</b></div><div className="flex justify-between border-t pt-4 text-2xl"><span>Total</span><b className="text-emerald-600">£{total}</b></div>{saving > 0 ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">You are saving £{saving * qty} with this group discount.</p> : null}</div></div></div><section className="mt-10 rounded-3xl border bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">Booking Agreement</h2><p className="mt-4 text-sm leading-7 text-slate-700">By selecting Yes, I agree, you confirm this booking forms a binding agreement. Payment secures the booking. After payment, you will be redirected to select your preferred training dates. Preferred dates are subject to availability, and ACE MiDAS Training will confirm the final agreed date. No refunds for non-attendance once a date is confirmed.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => setAgree(true)} className={`rounded-xl p-4 font-bold ${agree ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"}`}>Yes, I agree</button><button type="button" onClick={() => setAgree(false)} className="rounded-xl bg-red-100 p-4 font-bold text-red-800">No, I do not agree</button></div>{paymentError ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{paymentError}</p> : null}<button type="button" disabled={!agree || isLoading} onClick={continueToPayment} className={`mt-6 w-full rounded-xl p-4 font-bold ${agree && !isLoading ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"}`}>{isLoading ? "Creating secure checkout..." : `Continue to Secure Payment — £${total}`}</button><button type="button" onClick={() => setPage("Training")} className="mt-4 w-full rounded-xl border p-4 font-bold">Back to Training</button></section></div></main>;
}

function BookingConfirmationPage({ setPage }) {
  const [form, setForm] = useState({ name: "", organisation: "", email: "", phone: "", course: "", delegates: "", location: "", preferredDate1: "", preferredDate2: "", preferredDate3: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  function updateField(e) { const { name, value } = e.target; setForm((current) => ({ ...current, [name]: value })); }
  async function handleSubmit(e) { e.preventDefault(); setError(""); try { const response = await fetch(BOOKING_DETAILS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formType: "Post-payment training date selection", ...form }) }); if (!response.ok) throw new Error("Failed"); setSubmitted(true); try { await fetch(BOOKING_CONFIRMATION_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); } catch {} } catch { setError("Your payment was received, but the form could not be submitted. Please email info@ace-midas-training.co.uk."); } }
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><div className="rounded-3xl bg-emerald-500 p-8 text-center text-slate-950"><p className="font-semibold">Payment received</p><h1 className="mt-3 text-4xl font-bold md:text-6xl">Booking received ✅</h1><p className="mx-auto mt-4 max-w-3xl text-lg">Please now select your preferred training dates so we can confirm availability.</p></div><div className="mt-10 rounded-3xl border bg-white p-7 shadow-sm">{submitted ? <div className="py-10 text-center"><h2 className="text-2xl font-bold text-emerald-600">Preferred dates submitted ✅</h2><p className="mt-3 text-slate-600">We will review your request and contact you shortly.</p><button type="button" onClick={() => setPage("Home")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div> : <form onSubmit={handleSubmit} className="grid gap-4"><h2 className="text-2xl font-bold">Select preferred dates</h2>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="name" value={form.name} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" required /></div><div className="grid gap-4 sm:grid-cols-2"><input name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email address" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone number" /></div><div className="grid gap-4 sm:grid-cols-2"><select name="course" value={form.course} onChange={updateField} className="rounded-xl border p-3" required><option value="">Course booked</option>{trainingCourses.map((item) => <option key={item.title}>{item.title}</option>)}</select><input name="delegates" value={form.delegates} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of delegates paid for" required /></div><input name="location" value={form.location} onChange={updateField} className="rounded-xl border p-3" placeholder="Training address / location" required /><div className="grid gap-4 sm:grid-cols-3"><input type="date" name="preferredDate1" value={form.preferredDate1} onChange={updateField} className="rounded-xl border p-3" required /><input type="date" name="preferredDate2" value={form.preferredDate2} onChange={updateField} className="rounded-xl border p-3" /><input type="date" name="preferredDate3" value={form.preferredDate3} onChange={updateField} className="rounded-xl border p-3" /></div><textarea name="notes" value={form.notes} onChange={updateField} className="rounded-xl border p-3" rows={4} placeholder="Any notes, access arrangements, parking details or preferred times." /><button type="submit" className="rounded-xl bg-slate-950 p-4 font-bold text-white">Submit Booking Details</button></form>}</div></div></main>;
}

function CompliancePage({ setPage, siteSettings }) {
  const packs = [
    { title: "Compliance Bundle", price: "From £495/month", text: "Training plus paid access to ACE Compliance Hub for daily compliance tracking.", points: ["Member/depot access", "Journey reporting", "Medication and attendance records", "Incident and wheelchair checklists"], cta: "Subscribe for Access" },
    { title: "Premium Compliance Partner", price: "From £1,200/month", text: "Full setup, onboarding and compliance support for larger operators.", points: ["Depot setup", "Staff onboarding", "Quarterly compliance review", "Priority support"], cta: "Request Demo" }
  ];
  return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">ACE Compliance Hub</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Compliance software and support for passenger transport teams.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Combine your training with live digital records for journeys, medication, attendance, wheelchair checks and incidents.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><a href={siteSettings.stripeLink || "#contact"} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</a><button type="button" onClick={() => setPage("Contact")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Request Demo</button></div></div><div className="grid gap-4 sm:grid-cols-2">{features.map((feature) => <div key={feature} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">✔ {feature}</div>)}</div></div></section><section className="px-6 py-20"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="font-semibold text-emerald-700">Compliance Packages</p><h2 className="mt-3 text-4xl font-bold md:text-6xl">Choose SaaS access or full compliance partnership.</h2></div><div className="mt-12 grid gap-6 lg:grid-cols-2">{packs.map((pack, index) => <div key={pack.title} className="rounded-3xl border bg-white p-7 shadow-sm"><h3 className="text-2xl font-bold">{pack.title}</h3><p className="mt-3 text-slate-600">{pack.text}</p><p className="mt-6 text-3xl font-bold text-emerald-600">{pack.price}</p><div className="mt-6 space-y-3">{pack.points.map((point) => <p key={point} className="text-sm text-slate-700">✔ {point}</p>)}</div>{index === 0 ? <a href={siteSettings.stripeLink || "#contact"} target="_blank" rel="noreferrer" className="mt-8 block rounded-xl bg-slate-950 py-3 text-center font-bold text-white">{pack.cta}</a> : <button type="button" onClick={() => setPage("Contact")} className="mt-8 w-full rounded-xl bg-slate-950 py-3 font-bold text-white">{pack.cta}</button>}</div>)}</div></div></section></main>;
}

function MembershipPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">Member Access</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Secure access to your compliance platform.</h1><p className="mt-6 text-lg leading-8 text-slate-300">ACE Compliance Hub access is provided to approved member organisations only.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><a href={siteSettings.stripeLink || "#contact"} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</a><button type="button" onClick={() => setPage("Login")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Existing Member Login</button></div></div><div className="rounded-3xl border border-white/10 bg-white/10 p-7"><h2 className="text-2xl font-bold">Access is protected</h2><div className="mt-6 space-y-4 text-slate-200"><p>✔ Organisation-specific login credentials</p><p>✔ Depot/site access controlled per member</p><p>✔ Token-based access prepared in Manus</p><p>✔ Two-factor authentication recommended</p></div></div></div></section></main>; }
function PrivacyPage({ setPage }) { return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><div className="mb-6 flex items-center gap-4"><img src={images.logoRound} alt="logo" className="h-12 w-12 rounded-full" /><h1 className="text-4xl font-black">Privacy Policy</h1></div><p className="text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p><div className="mt-8 space-y-6 text-slate-700 leading-7"><p><strong>Who we are:</strong> Ace MiDAS Training provides passenger transport training and compliance solutions.</p><p><strong>Data we collect:</strong> Contact details, booking information, training records, login data and compliance records.</p><p><strong>How we use data:</strong> To deliver training, manage bookings, provide access to systems and improve services.</p><p><strong>Payments:</strong> Payments are processed securely via Stripe. We do not store card details.</p><p><strong>Compliance platform:</strong> Organisations remain the data controller. We act as the data processor.</p><p><strong>Data sharing:</strong> We only share data with required providers. We never sell data.</p><p><strong>Your rights:</strong> You can request access, correction or deletion at info@ace-midas-training.co.uk</p><p><strong>Cookies:</strong> We use cookies to support website functionality, login systems and payments.</p></div><button onClick={() => setPage("Home")} className="mt-10 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div></main>; }
function Footer({ setPage, siteSettings }) { return <footer className="bg-slate-950 px-6 py-10 text-white"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row"><div className="flex items-center gap-3"><img src={images.logoRound} alt="ACE logo" className="h-10 w-10 rounded-full" /><div><p className="font-bold">ACE MiDAS Training</p><p className="text-xs text-slate-400">{siteSettings.contactEmail} | {siteSettings.phone}</p></div></div><p className="text-sm text-slate-400">© {new Date().getFullYear()} ACE MiDAS Training</p><button onClick={() => setPage("Privacy")} className="text-sm hover:text-emerald-400">Privacy Policy</button></div></footer>; }

function LoginPage({ setPage, setLoggedInMember }) {
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pendingMember, setPendingMember] = useState(null);
  function handleCredentials(e) { e.preventDefault(); setError(""); if (!email.includes("@") || password.length < 6) { setError("Please enter a valid email address and a password of at least 6 characters."); return; } const fallback = { email, organisation: "Demo Member Organisation", role: "Depot / Site Manager", access: { depotSiteLogin: "https://journeytracker.manus.space/login?token=demoabc123xyz789" }, onboardingStatus: "Setup required" }; setPendingMember(fallback); setStep("verification"); }
  function handleVerification(e) { e.preventDefault(); setError(""); if (code !== "123456") { setError("Demo verification code is 123456."); return; } setLoggedInMember(pendingMember); setPage("MemberDashboard"); }
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="font-semibold text-emerald-700">Secure Member Login</p><h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Access your organisation’s compliance portal.</h1><p className="mt-5 leading-8 text-slate-600">Members should only access the system through a secure login.</p><div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900"><strong>Demo mode:</strong> For live security, connect Supabase or Clerk.</div></div><div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">{step === "credentials" ? <form onSubmit={handleCredentials} className="grid gap-4"><h2 className="text-3xl font-black">Member Login</h2>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border p-4" placeholder="Email address" required /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-xl border p-4" placeholder="Password" required /><button type="submit" className="rounded-xl bg-slate-950 p-4 font-black text-white">Continue</button></form> : <form onSubmit={handleVerification} className="grid gap-4"><h2 className="text-3xl font-black">Two-step verification</h2><p className="text-sm text-slate-500">Demo code: 123456</p>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<input value={code} onChange={(e) => setCode(e.target.value)} className="rounded-xl border p-4 text-center text-2xl tracking-[0.4em]" placeholder="123456" maxLength={6} required /><button type="submit" className="rounded-xl bg-emerald-600 p-4 font-black text-white">Verify & Enter Portal</button><button type="button" onClick={() => setStep("credentials")} className="rounded-xl border p-4 font-bold text-slate-700">Back</button></form>}</div></div></main>;
}
function MemberDashboardPage({ member, setPage }) { const [copied, setCopied] = useState(""); if (!member) return <main className="min-h-screen bg-slate-50 px-6 py-20 text-center"><h1 className="text-4xl font-bold">Login required</h1><button type="button" onClick={() => setPage("Login")} className="mt-8 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Go to Login</button></main>; const depotLoginUrl = member.access?.depotSiteLogin || "https://journeytracker.manus.space/login?token=demoabc123xyz789"; async function copyLink() { try { await navigator.clipboard.writeText(depotLoginUrl); setCopied("Depot / Site Login URL copied"); } catch { setCopied("Could not copy link."); } } return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl"><p className="font-semibold text-emerald-300">Member Dashboard</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Welcome, {member.organisation}</h1><p className="mt-4 text-slate-300">Signed in as: {member.role}</p></div>{copied ? <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{copied}</p> : null}<div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><div className="rounded-3xl border bg-white p-7 shadow-sm"><p className="font-semibold text-emerald-700">Depot / Site Access</p><h2 className="mt-2 text-3xl font-black">Private token login URL</h2><div className="mt-5 break-all rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">{depotLoginUrl}</div><div className="mt-6 grid gap-3 sm:grid-cols-2"><a href={depotLoginUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-600 p-4 text-center font-black text-white">Open Depot / Site Login</a><button type="button" onClick={copyLink} className="rounded-xl border border-slate-200 p-4 font-bold text-slate-700">Copy Login URL</button></div></div><div className="rounded-3xl border bg-white p-7 shadow-sm"><p className="font-semibold text-amber-700">Onboarding Status</p><h2 className="mt-2 text-3xl font-black">{member.onboardingStatus}</h2><button type="button" onClick={() => setPage("Onboarding")} className="mt-6 w-full rounded-xl bg-slate-950 p-4 font-black text-white">Complete Onboarding</button></div></div></div></main>; }
function OnboardingPage({ setPage }) { const [submitted, setSubmitted] = useState(false); return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl"><p className="font-semibold text-emerald-300">Compliance Hub Onboarding</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Tell us how your depot/site needs to be set up.</h1></div><div className="mt-10 rounded-3xl border bg-white p-7 shadow-sm">{submitted ? <div className="py-10 text-center"><h2 className="text-3xl font-black text-emerald-600">Onboarding details submitted ✅</h2><button type="button" onClick={() => setPage("MemberDashboard")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Dashboard</button></div> : <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="grid gap-4"><h2 className="text-2xl font-bold">Onboarding Form</h2><input className="rounded-xl border p-3" placeholder="Organisation name" required /><input className="rounded-xl border p-3" placeholder="Main contact name" required /><input className="rounded-xl border p-3" placeholder="Email address" required /><input className="rounded-xl border p-3" placeholder="How many depots/sites?" required /><textarea className="rounded-xl border p-3" rows={4} placeholder="Depot/site names, modules needed, notes." /><button type="submit" className="rounded-xl bg-emerald-600 p-4 font-black text-white">Submit Onboarding Details</button></form>}</div></div></main>; }
function ReviewsPage({ reviews }) { const visible = reviews.filter((r) => r.status === "Published"); return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="font-semibold text-emerald-600">Reviews & Ratings</p><h1 className="mt-3 text-4xl font-bold md:text-6xl">Trusted by transport and education teams</h1></div><div className="mt-12 grid gap-6 md:grid-cols-3">{visible.map((review) => <div key={`${review.name}-${review.org}`} className="rounded-3xl border bg-white p-7 shadow-sm"><p className="text-xl text-amber-500">{review.rating}</p><p className="mt-4 text-slate-700">“{review.text}”</p><p className="mt-6 font-bold">{review.name}</p><p className="text-sm text-slate-500">{review.org}</p></div>)}</div></div></main>; }
function BlogPage({ posts }) { const visible = posts.filter((p) => p.status === "Published"); return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><p className="font-semibold text-emerald-600">Blog</p><h1 className="mt-3 max-w-4xl text-4xl font-bold md:text-6xl">Insights for passenger transport training and compliance</h1><div className="mt-12 grid gap-6 md:grid-cols-3">{visible.map((post) => <article key={post.title} className="rounded-3xl border bg-white p-7 shadow-sm"><p className="text-sm font-semibold text-emerald-600">{post.tag}</p><h2 className="mt-3 text-2xl font-bold">{post.title}</h2><p className="mt-3 text-slate-600">{post.text}</p></article>)}</div></div></main>; }
function ContactPage({ siteSettings }) {
  const [form, setForm] = useState({ fullName: "", organisation: "", email: "", phone: "", enquiryType: "Training", message: "" });
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  function updateField(e) { const { name, value } = e.target; setForm((current) => ({ ...current, [name]: value })); }
  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    setIsSubmitting(true);
    try {
      const response = await fetch(BOOKING_DETAILS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formType: "Website contact enquiry", ...form }) });
      if (!response.ok) throw new Error("Unable to submit enquiry");
      setForm({ fullName: "", organisation: "", email: "", phone: "", enquiryType: "Training", message: "" });
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }
  return <main id="contact" className="min-h-screen bg-emerald-500 px-6 py-20 text-slate-950"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><h1 className="text-4xl font-black md:text-6xl">{siteSettings.contactDisplayText}</h1><p className="mt-4 text-lg">Email: {siteSettings.contactEmail}</p><p>Phone: {siteSettings.phone}</p><img src={images.handshake} alt="Handshake" className="mt-8 h-[300px] w-full rounded-[2rem] object-cover" /></div><form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl bg-white p-7 shadow-xl"><h2 className="text-2xl font-black">Send an enquiry</h2>{status === "success" ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Thanks, your enquiry has been sent.</p> : null}{status === "error" ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Sorry, your enquiry could not be sent. Please email us directly.</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="fullName" value={form.fullName} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" /></div><div className="grid gap-4 sm:grid-cols-2"><input type="email" name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone" /></div><select name="enquiryType" value={form.enquiryType} onChange={updateField} className="rounded-xl border p-3"><option>Training</option><option>Compliance Hub</option><option>Membership</option><option>Booking</option><option>Other</option></select><textarea name="message" value={form.message} onChange={updateField} className="rounded-xl border p-3" rows={5} placeholder="Message" required /><button type="submit" disabled={isSubmitting} className="rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSubmitting ? "Sending..." : "Send Enquiry"}</button></form></div></main>;
}
function BackOfficePage({ setPage, posts, setPosts, reviews, setReviews, siteSettings, setSiteSettings }) {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [blogForm, setBlogForm] = useState({ tag: "", title: "", content: "", status: "Draft" });
  const [reviewForm, setReviewForm] = useState({ rating: "", name: "", organisation: "", content: "", status: "Draft" });
  const [isSaving, setIsSaving] = useState(false);
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [members, setMembers] = useState(initialMembers);
  const [activity, setActivity] = useState(initialActivity);
  const settings = siteSettings;

  const tabs = ["Dashboard", "Blogs", "Reviews", "Onboarding", "Members", "Depot Tokens", "Activity", "Settings"];
  const depotTokens = members.map((member) => ({
    organisation: member.organisation,
    token: member.depotUrl.split("token=")[1] || member.depotUrl,
    url: member.depotUrl
  }));

  function showMessage(type, text) {
    setMessage({ type, text });
  }

  function unlockBackOffice(e) {
    e.preventDefault();
    if (code.trim() !== "ACEADMIN2026") {
      showMessage("error", "Incorrect admin code.");
      return;
    }
    setUnlocked(true);
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
      { tag: savedPost.tag || "Update", title: savedPost.title || "Untitled", text: savedPost.content || "", status: savedPost.status || "Draft" },
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
      { rating: savedReview.rating || "5", name: savedReview.name || "Reviewer", org: savedReview.organisation || "Organisation", text: savedReview.content || "", status: savedReview.status || "Draft" },
      ...current
    ]);
    setReviewForm({ rating: "", name: "", organisation: "", content: "", status: "Draft" });
    setActivity((current) => [`Review saved: ${review.name}`, ...current]);
    showMessage("success", "Review saved to Supabase.");
  }

  function updateSettingsField(e) {
    const { name, value } = e.target;
    setSiteSettings((current) => ({ ...current, [name]: value }));
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-slate-950 shadow-xl">
          <p className="font-semibold text-emerald-700">Back Office</p>
          <h1 className="mt-3 text-3xl font-black">Admin unlock</h1>
          {message ? <p className={`mt-5 rounded-xl p-3 text-sm font-semibold ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{message.text}</p> : null}
          <form onSubmit={unlockBackOffice} className="mt-6 grid gap-4">
            <input type="password" value={code} onChange={(e) => setCode(e.target.value)} className="rounded-xl border border-slate-200 p-4" placeholder="Admin code" required />
            <button type="submit" className="rounded-xl bg-slate-950 p-4 font-black text-white">Unlock Back Office</button>
            <button type="button" onClick={() => setPage("Home")} className="rounded-xl border border-slate-200 p-4 font-bold text-slate-700">Back to Site</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-semibold text-emerald-300">ACE MiDAS Training</p>
            <h1 className="mt-2 text-4xl font-black">Back Office</h1>
          </div>
          <button type="button" onClick={() => setPage("Home")} className="rounded-xl bg-white px-5 py-3 font-bold text-slate-950">Back to Site</button>
        </div>

        {message ? <p className={`mt-6 rounded-xl p-4 text-sm font-semibold ${message.type === "error" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>{message.text}</p> : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <div className="grid gap-2">
              {tabs.map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`rounded-xl px-4 py-3 text-left text-sm font-bold ${activeTab === tab ? "bg-emerald-400 text-slate-950" : "text-white hover:bg-white/10"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-3xl bg-white p-6 text-slate-950 shadow-xl">
            {activeTab === "Dashboard" ? (
              <div>
                <h2 className="text-3xl font-black">Dashboard</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">Posts</p><p className="mt-2 text-3xl font-black">{posts.length}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">Reviews</p><p className="mt-2 text-3xl font-black">{reviews.length}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">Onboarding</p><p className="mt-2 text-3xl font-black">{onboarding.length}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-500">Members</p><p className="mt-2 text-3xl font-black">{members.length}</p></div>
                </div>
              </div>
            ) : null}

            {activeTab === "Blogs" ? (
              <div>
                <h2 className="text-3xl font-black">Blogs</h2>
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
                  <button type="submit" disabled={isSaving} className="rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSaving ? "Saving..." : "Save Blog"}</button>
                </form>
                <div className="mt-8 grid gap-3">
                  {posts.map((post) => <div key={`${post.title}-${post.status}`} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold text-emerald-700">{post.tag} - {post.status}</p><h3 className="mt-1 font-black">{post.title}</h3><p className="mt-2 text-sm text-slate-600">{post.text}</p></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Reviews" ? (
              <div>
                <h2 className="text-3xl font-black">Reviews</h2>
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
                  <button type="submit" disabled={isSaving} className="rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSaving ? "Saving..." : "Save Review"}</button>
                </form>
                <div className="mt-8 grid gap-3">
                  {reviews.map((review) => <div key={`${review.name}-${review.org}-${review.status}`} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold text-amber-600">{review.rating} - {review.status}</p><h3 className="mt-1 font-black">{review.name}</h3><p className="text-sm text-slate-500">{review.org}</p><p className="mt-2 text-sm text-slate-600">{review.text}</p></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Onboarding" ? (
              <div>
                <h2 className="text-3xl font-black">Onboarding</h2>
                <div className="mt-6 grid gap-3">
                  {onboarding.map((item) => <div key={item.email} className="rounded-2xl bg-slate-50 p-4"><h3 className="font-black">{item.organisation}</h3><p className="text-sm text-slate-600">{item.contact} - {item.email}</p><p className="mt-2 text-sm">{item.modules}</p><p className="mt-2 text-sm font-bold text-emerald-700">{item.status}</p></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Members" ? (
              <div>
                <h2 className="text-3xl font-black">Members</h2>
                <div className="mt-6 grid gap-3">
                  {members.map((member) => <div key={member.organisation} className="rounded-2xl bg-slate-50 p-4"><h3 className="font-black">{member.organisation}</h3><p className="text-sm text-slate-600">{member.plan} - Payment: {member.payment}</p><p className="mt-2 text-sm font-bold text-emerald-700">Onboarding: {member.onboarding}</p></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Depot Tokens" ? (
              <div>
                <h2 className="text-3xl font-black">Depot Tokens</h2>
                <div className="mt-6 grid gap-3">
                  {depotTokens.map((token) => <div key={token.url} className="rounded-2xl bg-slate-50 p-4"><h3 className="font-black">{token.organisation}</h3><p className="mt-2 break-all text-sm text-slate-600">{token.url}</p><p className="mt-2 text-xs font-bold text-slate-500">Token: {token.token}</p></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Activity" ? (
              <div>
                <h2 className="text-3xl font-black">Activity</h2>
                <div className="mt-6 grid gap-3">
                  {activity.map((item, index) => <div key={`${item}-${index}`} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">{item}</div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Settings" ? (
              <div>
                <h2 className="text-3xl font-black">Settings</h2>
                <div className="mt-6 grid gap-4">
                  <input name="contactEmail" value={settings.contactEmail} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Email address" /><input name="contactDisplayText" value={settings.contactDisplayText} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Contact display text" />
                  <input name="phone" value={settings.phone} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Phone number" />
                  <input name="stripeLink" value={settings.stripeLink} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Stripe live payment link" />
                  <input name="complianceAppBase" value={settings.complianceAppBase} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Compliance app base" />
                  <input name="privacyReview" value={settings.privacyReview} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Privacy review" />
                  <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">Settings are local-only for now.</p>
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
  const hashRoutes = {
    home: "Home",
    training: "Training",
    booking: "Booking",
    bookingconfirmation: "BookingConfirmation",
    compliance: "Compliance",
    membership: "Membership",
    login: "Login",
    memberdashboard: "MemberDashboard",
    onboarding: "Onboarding",
    reviews: "Reviews",
    blog: "Blog",
    contact: "Contact",
    privacy: "Privacy",
    backoffice: "BackOffice"
  };
  const pageHashes = Object.fromEntries(Object.entries(hashRoutes).map(([hash, route]) => [route, hash]));
  function pageFromHash() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    return hashRoutes[hash] || "Home";
  }

  const [page, setPageState] = useState(pageFromHash);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loggedInMember, setLoggedInMember] = useState(null);
  const [posts, setPosts] = useState(initialPosts);
  const [reviews, setReviews] = useState(initialReviews);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);

  function setPage(nextPage) {
    setPageState(nextPage);
    const hash = pageHashes[nextPage] || "";
    const nextUrl = `${window.location.pathname}${window.location.search}${hash && nextPage !== "Home" ? `#${hash}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }

  useEffect(() => {
    function handleHashChange() { setPageState(pageFromHash()); }
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success" || params.get("success") === "true") setPage("BookingConfirmation");
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    async function loadSupabaseContent() {
      if (!supabase) return;
      const { data: blogData, error: blogError } = await supabase.from("blog_posts").select("id, tag, title, content, status, created_at").order("created_at", { ascending: false });
      if (!blogError && blogData && blogData.length > 0) setPosts(blogData.map((post) => ({ tag: post.tag || "Update", title: post.title || "Untitled", text: post.content || "", status: post.status || "Draft" })));
      const { data: reviewData, error: reviewError } = await supabase.from("reviews").select("id, rating, name, organisation, content, status, created_at").order("created_at", { ascending: false });
      if (!reviewError && reviewData && reviewData.length > 0) setReviews(reviewData.map((review) => ({ rating: review.rating || "★★★★★", name: review.name || "Reviewer", org: review.organisation || "Organisation", text: review.content || "", status: review.status || "Draft" })));
    }
    loadSupabaseContent();
  }, []);

  function startBooking(course) { setSelectedCourse(course); setPage("Booking"); }
  function openBackOffice() { setPage("BackOffice"); }

  return <div className="min-h-screen bg-slate-50 text-slate-950"><Header page={page} setPage={setPage} openBackOffice={openBackOffice} />{page === "Home" && <HomePage setPage={setPage} />}{page === "Training" && <TrainingPage startBooking={startBooking} />}{page === "Booking" && <BookingPage course={selectedCourse} setPage={setPage} />}{page === "BookingConfirmation" && <BookingConfirmationPage setPage={setPage} />}{page === "Compliance" && <CompliancePage setPage={setPage} siteSettings={siteSettings} />}{page === "Membership" && <MembershipPage setPage={setPage} siteSettings={siteSettings} />}{page === "Login" && <LoginPage setPage={setPage} setLoggedInMember={setLoggedInMember} />}{page === "MemberDashboard" && <MemberDashboardPage member={loggedInMember} setPage={setPage} />}{page === "Onboarding" && <OnboardingPage setPage={setPage} />}{page === "Reviews" && <ReviewsPage reviews={reviews} />}{page === "Blog" && <BlogPage posts={posts} />}{page === "Contact" && <ContactPage siteSettings={siteSettings} />}{page === "Privacy" && <PrivacyPage setPage={setPage} />}{page === "BackOffice" && <BackOfficePage setPage={setPage} posts={posts} setPosts={setPosts} reviews={reviews} setReviews={setReviews} siteSettings={siteSettings} setSiteSettings={setSiteSettings} />}<Footer setPage={setPage} siteSettings={siteSettings} /></div>;
}
