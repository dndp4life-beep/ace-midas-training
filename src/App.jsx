import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SUBSCRIPTION_URL = "https://buy.stripe.com/test_9B69ATd133zdfIhbcMdIA00";
const CHECKOUT_API_URL = "/api/create-checkout-session";
const BOOKING_DETAILS_ENDPOINT = "https://formspree.io/f/mykloeon";
const BOOKING_CONFIRMATION_API = "/api/send-booking-confirmation";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

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
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><div className="text-center"><p className="font-semibold text-emerald-700">Course Booking</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Confirm your booking</h1></div><div className="mt-12 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">{course.title}</h2><p className="mt-2 text-slate-500">{course.note}</p><label className="mt-6 block font-semibold">Number of delegates</label><input type="number" min="1" max={max} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} className="mt-2 w-full rounded-xl border p-3" /><p className="mt-2 text-xs text-slate-500">Maximum allowed: {max}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setOutside(false)} className={`rounded-xl px-4 py-3 font-bold ${!outside ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Inside A406</button><button type="button" onClick={() => setOutside(true)} className={`rounded-xl px-4 py-3 font-bold ${outside ? "bg-red-600 text-white" : "bg-slate-100"}`}>Outside A406</button></div></div><div className="rounded-3xl border bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">Price Breakdown</h2><div className="mt-6 space-y-4"><div className="flex justify-between"><span>Price per delegate</span><div className="text-right">{saving > 0 ? <p className="text-sm line-through text-slate-400">£{high}</p> : null}<b>£{unit}</b></div></div><div className="flex justify-between"><span>Delegates</span><b>{qty}</b></div><div className="flex justify-between"><span>Subtotal</span><b>£{subtotal}</b></div><div className="flex justify-between"><span>Travel fee</span><b>£{travelFee}</b></div><div className="flex justify-between border-t pt-4 text-2xl"><span>Total</span><b className="text-emerald-600">£{total}</b></div>{saving > 0 ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">You’re saving £{saving * qty}.</p> : null}</div></div></div><section className="mt-10 rounded-3xl border bg-white p-7 shadow-sm"><h2 className="text-2xl font-bold">Booking Agreement</h2><p className="mt-4 text-sm leading-7 text-slate-700">By selecting “Yes, I agree”, you confirm this booking forms a binding agreement. Payment confirms the booking. No refunds for non-attendance.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => setAgree(true)} className={`rounded-xl p-4 font-bold ${agree ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"}`}>Yes, I agree</button><button type="button" onClick={() => setAgree(false)} className="rounded-xl bg-red-100 p-4 font-bold text-red-800">No, I do not agree</button></div>{paymentError ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{paymentError}</p> : null}<button type="button" disabled={!agree || isLoading} onClick={continueToPayment} className={`mt-6 w-full rounded-xl p-4 font-bold ${agree && !isLoading ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"}`}>{isLoading ? "Creating secure checkout..." : `Continue to Secure Payment — £${total}`}</button><button type="button" onClick={() => setPage("Training")} className="mt-4 w-full rounded-xl border p-4 font-bold">Back to Training</button></section></div></main>;
}

function BookingConfirmationPage({ setPage }) {
  const [form, setForm] = useState({ name: "", organisation: "", email: "", phone: "", course: "", delegates: "", location: "", preferredDate1: "", preferredDate2: "", preferredDate3: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  function updateField(e) { const { name, value } = e.target; setForm((current) => ({ ...current, [name]: value })); }
  async function handleSubmit(e) { e.preventDefault(); setError(""); try { const response = await fetch(BOOKING_DETAILS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formType: "Post-payment training date selection", ...form }) }); if (!response.ok) throw new Error("Failed"); setSubmitted(true); try { await fetch(BOOKING_CONFIRMATION_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); } catch {} } catch { setError("Your payment was received, but the form could not be submitted. Please email info@ace-midas-training.co.uk."); } }
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><div className="rounded-3xl bg-emerald-500 p-8 text-center text-slate-950"><p className="font-semibold">Payment received</p><h1 className="mt-3 text-4xl font-bold md:text-6xl">Booking received ✅</h1><p className="mx-auto mt-4 max-w-3xl text-lg">Please now select your preferred training dates so we can confirm availability.</p></div><div className="mt-10 rounded-3xl border bg-white p-7 shadow-sm">{submitted ? <div className="py-10 text-center"><h2 className="text-2xl font-bold text-emerald-600">Preferred dates submitted ✅</h2><p className="mt-3 text-slate-600">We will review your request and contact you shortly.</p><button type="button" onClick={() => setPage("Home")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div> : <form onSubmit={handleSubmit} className="grid gap-4"><h2 className="text-2xl font-bold">Select preferred dates</h2>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="name" value={form.name} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" required /></div><div className="grid gap-4 sm:grid-cols-2"><input name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email address" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone number" /></div><div className="grid gap-4 sm:grid-cols-2"><select name="course" value={form.course} onChange={updateField} className="rounded-xl border p-3" required><option value="">Course booked</option>{trainingCourses.map((item) => <option key={item.title}>{item.title}</option>)}</select><input name="delegates" value={form.delegates} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of delegates paid for" required /></div><input name="location" value={form.location} onChange={updateField} className="rounded-xl border p-3" placeholder="Training address / location" required /><div className="grid gap-4 sm:grid-cols-3"><input type="date" name="preferredDate1" value={form.preferredDate1} onChange={updateField} className="rounded-xl border p-3" required /><input type="date" name="preferredDate2" value={form.preferredDate2} onChange={updateField} className="rounded-xl border p-3" /><input type="date" name="preferredDate3" value={form.preferredDate3} onChange={updateField} className="rounded-xl border p-3" /></div><textarea name="notes" value={form.notes} onChange={updateField} className="rounded-xl border p-3" rows={4} placeholder="Any notes, access arrangements, parking details or preferred times." /><button type="submit" className="rounded-xl bg-slate-950 p-4 font-bold text-white">Submit Booking Details</button></form>}</div></div></main>;
}

function CompliancePage({ setPage }) {
  const packs = [
    { title: "Compliance Bundle", price: "From £495/month", text: "Training plus paid access to ACE Compliance Hub for daily compliance tracking.", points: ["Member/depot access", "Journey reporting", "Medication and attendance records", "Incident and wheelchair checklists"], cta: "Subscribe for Access" },
    { title: "Premium Compliance Partner", price: "From £1,200/month", text: "Full setup, onboarding and compliance support for larger operators.", points: ["Depot setup", "Staff onboarding", "Quarterly compliance review", "Priority support"], cta: "Request Demo" }
  ];
  return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">ACE Compliance Hub</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Compliance software and support for passenger transport teams.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Combine your training with live digital records for journeys, medication, attendance, wheelchair checks and incidents.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</a><button type="button" onClick={() => setPage("Contact")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Request Demo</button></div></div><div className="grid gap-4 sm:grid-cols-2">{features.map((feature) => <div key={feature} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">✔ {feature}</div>)}</div></div></section><section className="px-6 py-20"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="font-semibold text-emerald-700">Compliance Packages</p><h2 className="mt-3 text-4xl font-bold md:text-6xl">Choose SaaS access or full compliance partnership.</h2></div><div className="mt-12 grid gap-6 lg:grid-cols-2">{packs.map((pack, index) => <div key={pack.title} className="rounded-3xl border bg-white p-7 shadow-sm"><h3 className="text-2xl font-bold">{pack.title}</h3><p className="mt-3 text-slate-600">{pack.text}</p><p className="mt-6 text-3xl font-bold text-emerald-600">{pack.price}</p><div className="mt-6 space-y-3">{pack.points.map((point) => <p key={point} className="text-sm text-slate-700">✔ {point}</p>)}</div>{index === 0 ? <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="mt-8 block rounded-xl bg-slate-950 py-3 text-center font-bold text-white">{pack.cta}</a> : <button type="button" onClick={() => setPage("Contact")} className="mt-8 w-full rounded-xl bg-slate-950 py-3 font-bold text-white">{pack.cta}</button>}</div>)}</div></div></section></main>;
}

function MembershipPage({ setPage }) { return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">Member Access</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Secure access to your compliance platform.</h1><p className="mt-6 text-lg leading-8 text-slate-300">ACE Compliance Hub access is provided to approved member organisations only.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</a><button type="button" onClick={() => setPage("Login")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Existing Member Login</button></div></div><div className="rounded-3xl border border-white/10 bg-white/10 p-7"><h2 className="text-2xl font-bold">Access is protected</h2><div className="mt-6 space-y-4 text-slate-200"><p>✔ Organisation-specific login credentials</p><p>✔ Depot/site access controlled per member</p><p>✔ Token-based access prepared in Manus</p><p>✔ Two-factor authentication recommended</p></div></div></div></section></main>; }
function PrivacyPage({ setPage }) { return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><div className="mb-6 flex items-center gap-4"><img src={images.logoRound} alt="logo" className="h-12 w-12 rounded-full" /><h1 className="text-4xl font-black">Privacy Policy</h1></div><p className="text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p><div className="mt-8 space-y-6 text-slate-700 leading-7"><p><strong>Who we are:</strong> Ace MiDAS Training provides passenger transport training and compliance solutions.</p><p><strong>Data we collect:</strong> Contact details, booking information, training records, login data and compliance records.</p><p><strong>How we use data:</strong> To deliver training, manage bookings, provide access to systems and improve services.</p><p><strong>Payments:</strong> Payments are processed securely via Stripe. We do not store card details.</p><p><strong>Compliance platform:</strong> Organisations remain the data controller. We act as the data processor.</p><p><strong>Data sharing:</strong> We only share data with required providers. We never sell data.</p><p><strong>Your rights:</strong> You can request access, correction or deletion at info@ace-midas-training.co.uk</p><p><strong>Cookies:</strong> We use cookies to support website functionality, login systems and payments.</p></div><button onClick={() => setPage("Home")} className="mt-10 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div></main>; }
function Footer({ setPage }) { return <footer className="bg-slate-950 px-6 py-10 text-white"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row"><div className="flex items-center gap-3"><img src={images.logoRound} alt="ACE logo" className="h-10 w-10 rounded-full" /><p className="font-bold">ACE MiDAS Training</p></div><p className="text-sm text-slate-400">© {new Date().getFullYear()} ACE MiDAS Training</p><button onClick={() => setPage("Privacy")} className="text-sm hover:text-emerald-400">Privacy Policy</button></div></footer>; }

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
function ContactPage() { return <main className="min-h-screen bg-emerald-500 px-6 py-20 text-slate-950"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><h1 className="text-4xl font-black md:text-6xl">We would love to hear from you</h1><p className="mt-4 text-lg">Email: info@ace-midas-training.co.uk</p><p>Phone: 020 3633 4203 / 07570 988 597</p></div><img src={images.handshake} alt="Handshake" className="h-[360px] w-full rounded-[2rem] object-cover" /></div></main>; }
function BackOfficePage({ setPage, posts, setPosts, reviews, setReviews }) {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [members, setMembers] = useState(initialMembers);
  const [activity, setActivity] = useState(initialActivity);
  const [settings, setSettings] = useState({
    contactEmail: "info@ace-midas-training.co.uk",
    phone: "020 3633 4203 / 07570 988 597",
    stripeLink: STRIPE_SUBSCRIPTION_URL,
    complianceAppBase: "https://journeytracker.manus.space/login?token=",
    privacyReview: "April 2026"
  });
  const [newPost, setNewPost] = useState({ tag: "Industry Update", title: "", text: "", status: "Draft" });
  const [newReview, setNewReview] = useState({ rating: "★★★★★", name: "", org: "", text: "", status: "Draft" });
  const [newOnboarding, setNewOnboarding] = useState({ organisation: "", contact: "", email: "", depots: "", modules: "", status: "New" });
  const [newMember, setNewMember] = useState({ organisation: "", plan: "Compliance Bundle", payment: "Pending", onboarding: "New", depotUrl: "" });

  const tabs = ["Dashboard", "Blogs", "Reviews", "Onboarding", "Members", "Depot Tokens", "Activity", "Settings"];

  function addActivity(item) {
    setActivity((current) => [`${new Date().toLocaleString()} — ${item}`, ...current]);
  }

  function generateToken() {
    return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  }

  async function saveBlog(e) {
    e.preventDefault();
    if (!newPost.title || !newPost.text) return;
    const localPost = { ...newPost };
    setPosts([localPost, ...posts]);
    setNewPost({ tag: "Industry Update", title: "", text: "", status: "Draft" });
    addActivity(`Blog ${localPost.status.toLowerCase()}: ${localPost.title}`);
    if (!supabase) {
      setMessage("Blog saved locally. Add Supabase environment variables in Vercel to save permanently.");
      return;
    }
    const { error } = await supabase.from("blog_posts").insert({ tag: localPost.tag, title: localPost.title, content: localPost.text, status: localPost.status });
    setMessage(error ? `Blog saved locally, but Supabase blocked the save: ${error.message}` : "Blog saved to Supabase ✅");
  }

  async function saveReview(e) {
    e.preventDefault();
    if (!newReview.name || !newReview.text) return;
    const localReview = { ...newReview };
    setReviews([localReview, ...reviews]);
    setNewReview({ rating: "★★★★★", name: "", org: "", text: "", status: "Draft" });
    addActivity(`Review ${localReview.status.toLowerCase()}: ${localReview.name}`);
    if (!supabase) {
      setMessage("Review saved locally. Add Supabase environment variables in Vercel to save permanently.");
      return;
    }
    const { error } = await supabase.from("reviews").insert({ rating: localReview.rating, name: localReview.name, organisation: localReview.org, content: localReview.text, status: localReview.status });
    setMessage(error ? `Review saved locally, but Supabase blocked the save: ${error.message}` : "Review saved to Supabase ✅");
  }

  function saveOnboarding(e) {
    e.preventDefault();
    if (!newOnboarding.organisation || !newOnboarding.email) return;
    setOnboarding([newOnboarding, ...onboarding]);
    addActivity(`Onboarding request added: ${newOnboarding.organisation}`);
    setNewOnboarding({ organisation: "", contact: "", email: "", depots: "", modules: "", status: "New" });
    setMessage("Onboarding request added locally.");
  }

  function saveMember(e) {
    e.preventDefault();
    if (!newMember.organisation) return;
    const member = { ...newMember };
    if (!member.depotUrl) member.depotUrl = `${settings.complianceAppBase}${generateToken()}`;
    setMembers([member, ...members]);
    addActivity(`Member added: ${member.organisation}`);
    setNewMember({ organisation: "", plan: "Compliance Bundle", payment: "Pending", onboarding: "New", depotUrl: "" });
    setMessage("Member added locally with depot token URL.");
  }

  function updatePostStatus(index, status) {
    const updated = posts.map((post, i) => i === index ? { ...post, status } : post);
    setPosts(updated);
    addActivity(`Blog status changed to ${status}: ${posts[index]?.title}`);
  }

  function updateReviewStatus(index, status) {
    const updated = reviews.map((review, i) => i === index ? { ...review, status } : review);
    setReviews(updated);
    addActivity(`Review status changed to ${status}: ${reviews[index]?.name}`);
  }

  function deletePost(index) {
    addActivity(`Blog deleted: ${posts[index]?.title}`);
    setPosts(posts.filter((_, i) => i !== index));
  }

  function deleteReview(index) {
    addActivity(`Review deleted: ${reviews[index]?.name}`);
    setReviews(reviews.filter((_, i) => i !== index));
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`${label} copied ✅`);
    } catch {
      setMessage("Could not copy. Please copy manually.");
    }
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <form onSubmit={(e) => { e.preventDefault(); if (code === "ACEADMIN2026") setUnlocked(true); }} className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-slate-950">
          <h1 className="text-3xl font-black">Admin Login</h1>
          <p className="mt-3 text-slate-600">Double-click the round logo, then enter your private back office code.</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} className="mt-6 w-full rounded-xl border p-4" placeholder="Back office code" type="password" />
          <button type="submit" className="mt-4 w-full rounded-xl bg-slate-950 p-4 font-black text-white">Enter</button>
          <button type="button" onClick={() => setPage("Home")} className="mt-3 w-full rounded-xl border p-4 font-bold">Back</button>
        </form>
      </main>
    );
  }

  const dashboardCards = [
    ["Published blogs", posts.filter((p) => p.status === "Published").length],
    ["Draft blogs", posts.filter((p) => p.status === "Draft").length],
    ["Published reviews", reviews.filter((r) => r.status === "Published").length],
    ["Onboarding requests", onboarding.length],
    ["Members", members.length],
    ["Pending setups", members.filter((m) => m.onboarding !== "Completed").length]
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-7 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold text-emerald-300">ACE Back Office</p>
              <h1 className="mt-2 text-4xl font-black md:text-6xl">Control centre</h1>
              <p className="mt-3 max-w-3xl text-slate-300">Manage content, reviews, onboarding, members, depot token URLs and business settings.</p>
            </div>
            <button type="button" onClick={() => setPage("Home")} className="rounded-xl bg-white px-5 py-3 font-bold text-slate-950">Back to Site</button>
          </div>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-3">
          {tabs.map((tab) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold ${activeTab === tab ? "bg-emerald-400 text-slate-950" : "bg-white/10 text-white hover:bg-white/20"}`}>
              {tab}
            </button>
          ))}
        </div>

        {message ? <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</p> : null}

        {activeTab === "Dashboard" && (
          <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {dashboardCards.map(([label, value]) => (
              <div key={label} className="rounded-3xl bg-white p-6 text-slate-950 shadow-xl">
                <p className="text-sm font-semibold text-slate-500">{label}</p>
                <p className="mt-2 text-4xl font-black">{value}</p>
              </div>
            ))}
            <div className="rounded-3xl bg-emerald-400 p-6 text-slate-950 shadow-xl lg:col-span-3">
              <h2 className="text-2xl font-black">Next priority</h2>
              <p className="mt-2">Connect Supabase Auth before allowing permanent admin-only writes. Temporary public insert policies should only be used for testing.</p>
            </div>
          </section>
        )}

        {activeTab === "Blogs" && (
          <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={saveBlog} className="rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
              <h2 className="text-3xl font-black">Add Blog Update</h2>
              <div className="mt-6 grid gap-4">
                <input value={newPost.tag} onChange={(e) => setNewPost({ ...newPost, tag: e.target.value })} className="rounded-xl border p-3" placeholder="Category" />
                <input value={newPost.title} onChange={(e) => setNewPost({ ...newPost, title: e.target.value })} className="rounded-xl border p-3" placeholder="Blog title" />
                <textarea value={newPost.text} onChange={(e) => setNewPost({ ...newPost, text: e.target.value })} className="rounded-xl border p-3" rows={7} placeholder="Write update" />
                <select value={newPost.status} onChange={(e) => setNewPost({ ...newPost, status: e.target.value })} className="rounded-xl border p-3"><option>Draft</option><option>Published</option></select>
                <button className="rounded-xl bg-emerald-600 p-4 font-black text-white">Save Blog</button>
              </div>
            </form>
            <div className="rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
              <h2 className="text-3xl font-black">Blog Manager</h2>
              <div className="mt-6 space-y-4">
                {posts.map((post, index) => (
                  <div key={`${post.title}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-bold text-emerald-700">{post.tag} • {post.status}</p>
                    <h3 className="mt-1 text-xl font-black">{post.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{post.text}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => updatePostStatus(index, "Published")} className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">Publish</button>
                      <button type="button" onClick={() => updatePostStatus(index, "Draft")} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">Draft</button>
                      <button type="button" onClick={() => deletePost(index)} className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-800">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "Reviews" && (
          <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={saveReview} className="rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
              <h2 className="text-3xl font-black">Add Review</h2>
              <div className="mt-6 grid gap-4">
                <input value={newReview.name} onChange={(e) => setNewReview({ ...newReview, name: e.target.value })} className="rounded-xl border p-3" placeholder="Reviewer name or title" />
                <input value={newReview.org} onChange={(e) => setNewReview({ ...newReview, org: e.target.value })} className="rounded-xl border p-3" placeholder="Organisation" />
                <textarea value={newReview.text} onChange={(e) => setNewReview({ ...newReview, text: e.target.value })} className="rounded-xl border p-3" rows={5} placeholder="Review text" />
                <select value={newReview.status} onChange={(e) => setNewReview({ ...newReview, status: e.target.value })} className="rounded-xl border p-3"><option>Draft</option><option>Published</option></select>
                <button className="rounded-xl bg-slate-950 p-4 font-black text-white">Save Review</button>
              </div>
            </form>
            <div className="rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
              <h2 className="text-3xl font-black">Review Manager</h2>
              <div className="mt-6 space-y-4">
                {reviews.map((review, index) => (
                  <div key={`${review.name}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-amber-500">{review.rating}</p>
                    <h3 className="mt-1 text-xl font-black">{review.name}</h3>
                    <p className="text-sm text-slate-500">{review.org} • {review.status}</p>
                    <p className="mt-2 text-sm text-slate-600">{review.text}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateReviewStatus(index, "Published")} className="rounded-lg bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-800">Approve</button>
                      <button type="button" onClick={() => updateReviewStatus(index, "Draft")} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800">Hide</button>
                      <button type="button" onClick={() => deleteReview(index)} className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-800">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "Onboarding" && (
          <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <form onSubmit={saveOnboarding} className="rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
              <h2 className="text-3xl font-black">Add Onboarding Request</h2>
              <div className="mt-6 grid gap-4">
                <input value={newOnboarding.organisation} onChange={(e) => setNewOnboarding({ ...newOnboarding, organisation: e.target.value })} className="rounded-xl border p-3" placeholder="Organisation" />
                <input value={newOnboarding.contact} onChange={(e) => setNewOnboarding({ ...newOnboarding, contact: e.target.value })} className="rounded-xl border p-3" placeholder="Contact person" />
                <input value={newOnboarding.email} onChange={(e) => setNewOnboarding({ ...newOnboarding, email: e.target.value })} className="rounded-xl border p-3" placeholder="Email" />
                <input value={newOnboarding.depots} onChange={(e) => setNewOnboarding({ ...newOnboarding, depots: e.target.value })} className="rounded-xl border p-3" placeholder="Number of depots/sites" />
                <textarea value={newOnboarding.modules} onChange={(e) => setNewOnboarding({ ...newOnboarding, modules: e.target.value })} className="rounded-xl border p-3" rows={4} placeholder="Modules needed" />
                <button className="rounded-xl bg-emerald-600 p-4 font-black text-white">Save Request</button>
              </div>
            </form>
            <div className="rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
              <h2 className="text-3xl font-black">Onboarding Tracker</h2>
              <div className="mt-6 space-y-4">
                {onboarding.map((item, index) => (
                  <div key={`${item.organisation}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-xl font-black">{item.organisation}</h3>
                    <p className="text-sm text-slate-500">{item.contact} • {item.email}</p>
                    <p className="mt-2 text-sm">Depots/sites: {item.depots}</p>
                    <p className="text-sm">Modules: {item.modules}</p>
                    <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">{item.status}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "Members" && (
          <section className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <form onSubmit={saveMember} className="rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
              <h2 className="text-3xl font-black">Add Member</h2>
              <div className="mt-6 grid gap-4">
                <input value={newMember.organisation} onChange={(e) => setNewMember({ ...newMember, organisation: e.target.value })} className="rounded-xl border p-3" placeholder="Organisation" />
                <select value={newMember.plan} onChange={(e) => setNewMember({ ...newMember, plan: e.target.value })} className="rounded-xl border p-3"><option>Compliance Bundle</option><option>Premium Compliance Partner</option><option>Training Only</option></select>
                <select value={newMember.payment} onChange={(e) => setNewMember({ ...newMember, payment: e.target.value })} className="rounded-xl border p-3"><option>Pending</option><option>Paid</option><option>Test</option><option>Overdue</option></select>
                <input value={newMember.depotUrl} onChange={(e) => setNewMember({ ...newMember, depotUrl: e.target.value })} className="rounded-xl border p-3" placeholder="Depot URL or leave blank to generate" />
                <button className="rounded-xl bg-emerald-600 p-4 font-black text-white">Save Member</button>
              </div>
            </form>
            <div className="rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
              <h2 className="text-3xl font-black">Member Manager</h2>
              <div className="mt-6 space-y-4">
                {members.map((member, index) => (
                  <div key={`${member.organisation}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                    <h3 className="text-xl font-black">{member.organisation}</h3>
                    <p className="text-sm text-slate-500">{member.plan} • Payment: {member.payment} • Setup: {member.onboarding}</p>
                    <p className="mt-3 break-all rounded-xl bg-white p-3 text-xs text-slate-600">{member.depotUrl}</p>
                    <button type="button" onClick={() => copyText(member.depotUrl, "Depot URL")} className="mt-3 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white">Copy URL</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "Depot Tokens" && (
          <section className="mt-8 rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
            <h2 className="text-3xl font-black">Depot Token Manager</h2>
            <p className="mt-3 text-slate-600">Use this to prepare token URLs for Manus. Full secure token storage should move into Supabase/Auth next.</p>
            <div className="mt-6 space-y-4">
              {members.map((member, index) => (
                <div key={`${member.organisation}-token-${index}`} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-xl font-black">{member.organisation}</h3>
                      <p className="mt-2 break-all text-sm text-slate-600">{member.depotUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => copyText(member.depotUrl, "Depot token URL")} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white">Copy</button>
                      <button type="button" onClick={() => {
                        const updated = members.map((m, i) => i === index ? { ...m, depotUrl: `${settings.complianceAppBase}${generateToken()}` } : m);
                        setMembers(updated);
                        addActivity(`Token regenerated for ${member.organisation}`);
                      }} className="rounded-lg bg-amber-100 px-4 py-3 text-sm font-bold text-amber-800">Regenerate</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Activity" && (
          <section className="mt-8 rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
            <h2 className="text-3xl font-black">Activity Log</h2>
            <div className="mt-6 space-y-3">
              {activity.map((item, index) => <p key={`${item}-${index}`} className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{item}</p>)}
            </div>
          </section>
        )}

        {activeTab === "Settings" && (
          <section className="mt-8 rounded-3xl bg-white p-7 text-slate-950 shadow-xl">
            <h2 className="text-3xl font-black">Site Settings</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input value={settings.contactEmail} onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })} className="rounded-xl border p-3" placeholder="Contact email" />
              <input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="rounded-xl border p-3" placeholder="Phone" />
              <input value={settings.stripeLink} onChange={(e) => setSettings({ ...settings, stripeLink: e.target.value })} className="rounded-xl border p-3 md:col-span-2" placeholder="Stripe subscription link" />
              <input value={settings.complianceAppBase} onChange={(e) => setSettings({ ...settings, complianceAppBase: e.target.value })} className="rounded-xl border p-3 md:col-span-2" placeholder="Compliance app base URL" />
              <input value={settings.privacyReview} onChange={(e) => setSettings({ ...settings, privacyReview: e.target.value })} className="rounded-xl border p-3" placeholder="Privacy policy review date" />
            </div>
            <button type="button" onClick={() => { setMessage("Settings saved locally. Next step is saving settings to Supabase."); addActivity("Settings updated"); }} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Save Settings</button>
          </section>
        )}
      </div>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState("Home");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loggedInMember, setLoggedInMember] = useState(null);
  const [posts, setPosts] = useState(initialPosts);
  const [reviews, setReviews] = useState(initialReviews);
  useEffect(() => { const params = new URLSearchParams(window.location.search); if (params.get("payment") === "success" || params.get("success") === "true") setPage("BookingConfirmation"); }, []);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "smooth" }); }, [page]);
  useEffect(() => { async function loadSupabaseContent() { if (!supabase) return; const { data: blogData, error: blogError } = await supabase.from("blog_posts").select("id, tag, title, content, status, created_at").order("created_at", { ascending: false }); if (!blogError && blogData && blogData.length > 0) setPosts(blogData.map((post) => ({ tag: post.tag || "Update", title: post.title || "Untitled", text: post.content || "", status: post.status || "Draft" }))); const { data: reviewData, error: reviewError } = await supabase.from("reviews").select("id, rating, name, organisation, content, status, created_at").order("created_at", { ascending: false }); if (!reviewError && reviewData && reviewData.length > 0) setReviews(reviewData.map((review) => ({ rating: review.rating || "★★★★★", name: review.name || "Reviewer", org: review.organisation || "Organisation", text: review.content || "", status: review.status || "Draft" }))); } loadSupabaseContent(); }, []);
  function startBooking(course) { setSelectedCourse(course); setPage("Booking"); }
  function openBackOffice() { setPage("BackOffice"); }
  return <div className="min-h-screen bg-slate-50 text-slate-950"><Header page={page} setPage={setPage} openBackOffice={openBackOffice} />{page === "Home" && <HomePage setPage={setPage} />}{page === "Training" && <TrainingPage startBooking={startBooking} />}{page === "Booking" && <BookingPage course={selectedCourse} setPage={setPage} />}{page === "BookingConfirmation" && <BookingConfirmationPage setPage={setPage} />}{page === "Compliance" && <CompliancePage setPage={setPage} />}{page === "Membership" && <MembershipPage setPage={setPage} />}{page === "Login" && <LoginPage setPage={setPage} setLoggedInMember={setLoggedInMember} />}{page === "MemberDashboard" && <MemberDashboardPage member={loggedInMember} setPage={setPage} />}{page === "Onboarding" && <OnboardingPage setPage={setPage} />}{page === "Reviews" && <ReviewsPage reviews={reviews} />}{page === "Blog" && <BlogPage posts={posts} />}{page === "Contact" && <ContactPage />}{page === "Privacy" && <PrivacyPage setPage={setPage} />}{page === "BackOffice" && <BackOfficePage setPage={setPage} posts={posts} setPosts={setPosts} reviews={reviews} setReviews={setReviews} />}<Footer setPage={setPage} /></div>;
}
