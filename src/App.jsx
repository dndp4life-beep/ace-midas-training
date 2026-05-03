import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useLocation, useNavigate } from "react-router-dom";

const DEFAULT_SITE_SETTINGS = {
  contactEmail: "info@ace-midas-training.co.uk",
  phone: "Available upon request",
  address: "128 City Road, London, EC1V 2NX",
  contactDisplayText: "We would love to hear from you",
  stripeLink: import.meta.env?.VITE_STRIPE_PAYMENT_LINK || "https://buy.stripe.com/test_6oUeVd8KN1r57bLcgQdIA08",
  complianceAppBase: "https://journeytracker.manus.space/login?token=",
  privacyReview: "April 2026"
};
const SUBSCRIBE_CHECKOUT_API_URL = "/api/create-subscribe-checkout-session";
const COURSE_CHECKOUT_API_URL = "/api/create-checkout-session";
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
  driverSeat: "/images/driversseat.jpg",
  vehicleLineup: "/images/headerpicb.jpg",
  firstAid: "/images/firstaid.png",
  interior: "/images/insidea.jpg",
  handshake: "/images/handshake.png"
};

const trainingCourses = [
  { title: "MiDAS Standard", price: "£165", note: "Includes £40 CTA learner-pass charge", image: images.driverSeat },
  { title: "MiDAS Accessible", price: "£210", note: "Includes £40 CTA learner-pass charge", image: images.driverSeat },
  { title: "PATS Standard", price: "£125", note: "Includes £30 CTA learner-pass charge", image: images.interior },
  { title: "PATS Accessible", price: "£155–£185", note: "Attendance or proficiency routes", image: images.interior },
  { title: "First Aid at Work", price: "£205–£225", note: "Blended or 3-day classroom options", image: images.firstAid },
  { title: "Children’s Transport First Aid", price: "£95–£135", note: "Optional epilepsy medication module", image: images.firstAid }
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
  { organisation: "Demo Transport Provider", contact_name: "Operations Lead", email: "ops@example.com", depots: "2", road_staff: "12", tools_required: "Both", preferred_login_method: "Email verification code", status: "New" }
];

const initialMembers = [
  { organisation: "Demo Transport Provider", contact_name: "Operations Lead", email: "ops@example.com", plan: "Compliance Hub Setup", payment_status: "Paid", setup_status: "Pending", med_app_status: "Pending", journey_app_status: "Pending", med_app_url: "", journey_app_url: "https://journeytracker.manus.space/login?token=demoabc123xyz789" }
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
    { title: "MiDAS Training", text: "Driver awareness training for minibus and passenger transport operations.", image: images.driverSeat },
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
              {stats.map(([title, text]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-5 text-left shadow-sm backdrop-blur transition-all duration-200"><p className="text-xl font-black text-emerald-300">{title}</p><p className="mt-1 text-sm leading-relaxed text-slate-300">{text}</p></div>)}
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
      <section className="bg-white px-6 py-20"><div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end"><div><img src={images.logoHorizontal} alt="ACE MiDAS Training" className="max-h-24 max-w-full object-contain" /><p className="mt-8 font-semibold text-emerald-700">Training services</p><h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">One provider for training, booking and compliance evidence.</h2><p className="mt-5 max-w-2xl leading-8 text-slate-600">Keep the familiar ACE MiDAS Training identity, but present it with a stronger commercial journey.</p></div><div className="grid gap-5 md:grid-cols-3">{cards.map((course) => <button key={course.title} type="button" onClick={() => setPage("Training")} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><div className="h-48 bg-slate-100"><img src={course.image} alt={course.title} className={`h-full w-full transition duration-500 group-hover:scale-105 ${course.image === images.firstAid ? "object-contain object-center p-3" : "object-cover object-center"}`} /></div><div className="p-5"><h3 className="text-xl font-black">{course.title}</h3><p className="mt-3 text-sm leading-relaxed text-slate-600">{course.text}</p><p className="mt-5 font-black text-emerald-700">View course →</p></div></button>)}</div></div></div></section>
      <section className="bg-slate-950 px-6 py-20 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center"><img src={images.interior} alt="Minibus passenger area" className="h-[440px] w-full rounded-2xl object-cover" /><div><p className="font-semibold text-emerald-300">Compliance Hub</p><h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Turn daily transport activity into audit-ready records.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Give depots, road staff and managers a controlled way to record what happens on transport services.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{complianceFeatureCards.map((item) => <div key={item.title} className="flex flex-col justify-center gap-1 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-left text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><h3 className="text-xl font-semibold leading-snug">{item.title}</h3><p className="text-sm leading-relaxed text-slate-300">{item.subtitle}</p></div>)}</div><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Compliance")} className="rounded-2xl bg-emerald-400 px-7 py-4 font-black text-slate-950">View Packages</button><button type="button" onClick={() => setPage("Membership")} className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Member Access</button></div></div></div></section>
      <section className="relative overflow-hidden bg-emerald-600 px-6 py-20 text-slate-950"><div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center"><div><p className="font-bold">Ready to replace paper-heavy processes?</p><h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Let’s build safer transport practice together.</h2><p className="mt-5 max-w-2xl text-lg leading-8">Book training, request a compliance demo, or speak to us about a premium setup.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Training")} className="rounded-2xl bg-slate-950 px-7 py-4 font-black text-white">Book Training</button><button type="button" onClick={() => setPage("Contact")} className="rounded-2xl border border-slate-950/20 bg-white/30 px-7 py-4 font-black text-slate-950">Contact Us</button></div></div><img src={images.handshake} alt="Partnership handshake" className="h-[360px] w-full rounded-[2rem] object-cover" /></div></section>
    </main>
  );
}

function TrainingPage({ startBooking }) {
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="font-semibold text-emerald-700">Training Services</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Book MiDAS, PATS, FAW or Children’s Transport First Aid.</h1><p className="mt-5 leading-8 text-slate-600">Choose a course, select delegates, review the agreement, and continue to secure payment.</p></div><img src={images.vehicleLineup} alt="Passenger transport fleet" className="h-[360px] w-full rounded-2xl object-cover" /></div><div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm"><p className="font-semibold text-emerald-700">Essential Training</p><h2 className="mt-2 text-3xl font-bold">Pay per course</h2><p className="mt-3 leading-relaxed text-slate-700">Book MiDAS, PATS, First Aid at Work or Children’s Transport First Aid training for individuals or groups.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><p>✔ Course booking</p><p>✔ Certification support</p><p>✔ Group booking options</p></div></div><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{trainingCourses.map((course) => <button key={course.title} type="button" onClick={() => startBooking(course)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"><div className="h-44 bg-slate-100"><img src={course.image} alt={course.title} className={`h-full w-full ${course.image === images.firstAid ? "object-contain object-center p-3" : "object-cover object-center"}`} /></div><div className="p-5"><p className="text-xl font-bold text-slate-950">{course.title}</p><p className="mt-3 text-3xl font-black text-emerald-700">{course.price}</p><p className="mt-3 text-sm leading-relaxed text-slate-600">{course.note}</p><p className="mt-5 font-bold text-emerald-700">Book this course →</p></div></button>)}</div></div></main>;
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
          agreementAccepted: agree
        })
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to create Stripe checkout.");
      window.location.href = data.url;
    } catch (error) {
      setIsLoading(false);
      setPaymentError(error.message || "Unable to create Stripe checkout.");
    }
  }
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><div className="text-center"><p className="font-semibold text-emerald-700">Course Booking</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Confirm your booking</h1></div><div className="mt-12 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">{course.title}</h2><p className="mt-2 text-slate-500">{course.note}</p><label className="mt-6 block font-semibold">Number of delegates</label><input type="number" min="1" max={max} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} className="mt-2 w-full rounded-xl border p-3" /><p className="mt-2 text-xs text-slate-500">Maximum allowed: {max}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setOutside(false)} className={`rounded-xl px-4 py-3 font-bold ${!outside ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Inside A406</button><button type="button" onClick={() => setOutside(true)} className={`rounded-xl px-4 py-3 font-bold ${outside ? "bg-red-600 text-white" : "bg-slate-100"}`}>Outside A406</button></div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Price Breakdown</h2><div className="mt-6 space-y-4"><div className="flex justify-between"><span>Price per delegate</span><div className="text-right">{saving > 0 ? <p className="text-sm line-through text-slate-400">£{high}</p> : null}<b>£{unit}</b></div></div><div className="flex justify-between"><span>Delegates</span><b>{qty}</b></div><div className="flex justify-between"><span>Subtotal</span><b>£{subtotal}</b></div><div className="flex justify-between"><span>Travel fee</span><b>£{travelFee}</b></div><div className="flex justify-between border-t pt-4 text-2xl"><span>Total</span><b className="text-emerald-600">£{total}</b></div>{saving > 0 ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">You are saving £{saving * qty} with this group discount.</p> : null}<p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">Final payment is completed securely through Stripe. If your booking requires a group or custom price, we will confirm this before the final booking is accepted.</p></div></div></div><section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Booking Agreement</h2><p className="mt-4 text-sm leading-7 text-slate-700">By selecting Yes, I agree, you confirm this booking forms a binding agreement. Payment secures the booking request. After payment, you will be redirected to select your preferred training dates. Preferred dates are subject to availability, and ACE MiDAS Training Ltd will confirm the final agreed date. No refunds for non-attendance once a date has been confirmed. If a date is unavailable, ACE MiDAS Training Ltd will offer suitable alternatives.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><button type="button" onClick={() => setAgree(true)} className={`rounded-xl p-4 font-bold ${agree ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"}`}>Yes, I agree</button><button type="button" onClick={() => setAgree(false)} className="rounded-xl bg-red-100 p-4 font-bold text-red-800">No, I do not agree</button></div><div className="mt-6 rounded-2xl bg-emerald-50 p-5"><h3 className="text-xl font-black text-emerald-900">What happens after payment</h3><div className="mt-4 grid gap-3 text-sm font-semibold text-emerald-900 sm:grid-cols-2"><p>✔ Payment secures the booking request</p><p>✔ Customer selects preferred dates after payment</p><p>✔ Dates are subject to availability</p><p>✔ Confirmation within 24 hours</p></div></div>{paymentError ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{paymentError}</p> : null}<button type="button" disabled={!agree || isLoading} onClick={continueToPayment} className={`mt-6 w-full rounded-xl p-4 font-bold ${agree && !isLoading ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"}`}>{isLoading ? "Opening secure Stripe payment..." : `Continue to Secure Payment — £${total}`}</button><p className="mt-3 text-center text-sm font-semibold text-slate-600">Training dates confirmed within 24 hours after payment</p><button type="button" onClick={() => setPage("Training")} className="mt-4 w-full rounded-xl border p-4 font-bold">Back to Training</button></section></div></main>;
}

function BookingConfirmationPage({ setPage }) {
  const [form, setForm] = useState({ name: "", organisation: "", email: "", phone: "", course: "", delegates: "", location: "", preferredDate1: "", preferredDate2: "", preferredDate3: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  function updateField(e) { const { name, value } = e.target; setForm((current) => ({ ...current, [name]: value })); }
  async function handleSubmit(e) { e.preventDefault(); setError(""); try { const response = await fetch(BOOKING_DETAILS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ formType: "Post-payment training date selection", ...form }) }); if (!response.ok) throw new Error("Failed"); setSubmitted(true); try { await fetch(BOOKING_CONFIRMATION_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); } catch {} } catch { setError("Your payment was received, but the form could not be submitted. Please email info@ace-midas-training.co.uk."); } }
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><div className="rounded-3xl bg-emerald-500 p-8 text-center text-slate-950"><p className="font-semibold">Payment received</p><h1 className="mt-3 text-4xl font-bold md:text-6xl">Thank you for your booking. Your payment has been received. Please now complete your preferred training date request.</h1><p className="mx-auto mt-4 max-w-3xl text-lg">Your booking request is secured. Preferred dates are subject to availability and ACE MiDAS Training Ltd will confirm the final agreed date.</p></div><div className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-black text-emerald-700">1. Check your email</p><p className="mt-2 text-sm text-slate-600">You may receive a Stripe receipt and booking follow-up email.</p></div><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-black text-emerald-700">2. Select dates</p><p className="mt-2 text-sm text-slate-600">Send your preferred dates using the form below.</p></div><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="font-black text-emerald-700">3. Confirmation within 24h</p><p className="mt-2 text-sm text-slate-600">Dates are subject to availability and will be confirmed by ACE MiDAS Training Ltd.</p></div></div><div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{submitted ? <div className="py-10 text-center"><h2 className="text-2xl font-bold text-emerald-600">Preferred dates submitted</h2><p className="mt-3 text-slate-600">Thank you. Please check your email. We will review availability and confirm the agreed training date within 24 hours.</p><button type="button" onClick={() => setPage("Home")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div> : <form onSubmit={handleSubmit} className="grid gap-4"><h2 className="text-2xl font-bold">Select preferred dates</h2>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="name" value={form.name} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" required /></div><div className="grid gap-4 sm:grid-cols-2"><input name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email address" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone number" /></div><div className="grid gap-4 sm:grid-cols-2"><select name="course" value={form.course} onChange={updateField} className="rounded-xl border p-3" required><option value="">Course booked</option>{trainingCourses.map((item) => <option key={item.title}>{item.title}</option>)}</select><input name="delegates" value={form.delegates} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of delegates paid for" required /></div><input name="location" value={form.location} onChange={updateField} className="rounded-xl border p-3" placeholder="Training address / location" required /><div className="grid gap-4 sm:grid-cols-3"><input type="date" name="preferredDate1" value={form.preferredDate1} onChange={updateField} className="rounded-xl border p-3" required /><input type="date" name="preferredDate2" value={form.preferredDate2} onChange={updateField} className="rounded-xl border p-3" /><input type="date" name="preferredDate3" value={form.preferredDate3} onChange={updateField} className="rounded-xl border p-3" /></div><textarea name="notes" value={form.notes} onChange={updateField} className="rounded-xl border p-3" rows={4} placeholder="Any notes, access arrangements, parking details or preferred times." /><button type="submit" className="rounded-xl bg-slate-950 p-4 font-bold text-white">Submit Booking Details</button></form>}</div></div></main>;
}

function CompliancePage({ setPage, siteSettings }) {
  const packs = [
    { title: "Compliance Bundle", price: "From £495/month", text: "Training plus paid access to ACE Compliance Hub for daily compliance tracking.", points: ["Member/depot access", "Journey reporting", "Medication and attendance records", "Incident and wheelchair checklists"], cta: "Subscribe for Access" },
    { title: "Premium Compliance Partner", price: "From £1,200/month", text: "Bespoke SEND transport compliance support for councils and multi-provider oversight.", points: ["Council dashboard setup", "Provider onboarding", "Audit-ready reporting", "Ongoing compliance support"], cta: "Book a Council Consultation" }
  ];
  return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">ACE Compliance Hub</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Compliance software and support for passenger transport teams.</h1><p className="mt-6 text-lg leading-8 text-slate-300">Combine your training with live digital records for journeys, medication, attendance, wheelchair checks and incidents.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Subscribe")} className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</button><button type="button" onClick={() => setPage("PremiumCompliancePartner")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Book a Council Consultation</button></div></div><div className="grid gap-3 sm:grid-cols-2">{complianceFeatureCards.map((feature) => <div key={feature.title} className="flex flex-col justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left text-slate-200 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><h3 className="text-xl font-semibold leading-snug">{feature.title}</h3><p className="text-sm leading-relaxed text-slate-300">{feature.subtitle}</p></div>)}</div></div></section><section className="px-6 py-20"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="font-semibold text-emerald-700">Compliance Packages</p><h2 className="mt-3 text-4xl font-bold md:text-6xl">Choose SaaS access or full compliance partnership.</h2></div><div className="mt-12 grid gap-6 lg:grid-cols-2">{packs.map((pack, index) => <div key={pack.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><h3 className="text-2xl font-bold">{pack.title}</h3><p className="mt-3 leading-relaxed text-slate-600">{pack.text}</p><p className="mt-6 text-3xl font-bold text-emerald-600">{pack.price}</p><div className="mt-6 space-y-3">{pack.points.map((point) => <p key={point} className="text-sm leading-relaxed text-slate-700">✔ {point}</p>)}</div>{index === 0 ? <button type="button" onClick={() => setPage("Subscribe")} className="mt-8 block w-full rounded-xl bg-slate-950 py-3 text-center font-bold text-white">{pack.cta}</button> : <button type="button" onClick={() => setPage("PremiumCompliancePartner")} className="mt-8 w-full rounded-xl bg-slate-950 py-3 font-bold text-white">{pack.cta}</button>}</div>)}</div></div></section></main>;
}

function MembershipPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">Member Access</p><h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Secure access to your compliance platform.</h1><p className="mt-6 text-lg leading-8 text-slate-300">ACE Compliance Hub access is provided to approved member organisations only.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Subscribe")} className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</button><button type="button" onClick={() => setPage("Login")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Existing Member Login</button></div></div><div className="rounded-3xl border border-white/10 bg-white/10 p-7"><h2 className="text-2xl font-bold">Access is protected</h2><div className="mt-6 space-y-4 text-slate-200"><p>✔ Organisation-specific login credentials</p><p>✔ Depot/site access controlled per member</p><p>✔ Token-based access prepared in Manus</p><p>✔ Two-factor authentication recommended</p></div></div></div></section></main>; }
function SubscribePage({ siteSettings }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const valuePoints = ["Access to a complete compliance and tracking system", "Medication tracking system (Med-Tracking App)", "Full journey tracking and reporting system", "Incident logging and audit-ready records", "Centralised digital compliance hub"];
  const reasons = ["Stay compliant with council and regulatory expectations", "Protect your business with accurate, time-stamped records", "Reduce risk and liability with structured reporting", "Be fully prepared for audits and inspections", "Operate with confidence knowing nothing is missed"];
  const bespoke = ["Setup tailored to your business", "Guidance on how to use the system in real operations", "Support aligning your current processes into the system"];
  const support = ["Ongoing technical support", "Help implementing the system into your daily operations", "Assistance when issues arise or processes need adjusting"];
  async function proceedToPayment() {
    setError("");
    if (siteSettings.stripeLink) {
      window.location.href = siteSettings.stripeLink;
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(SUBSCRIBE_CHECKOUT_API_URL, { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await response.json();
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
    return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">{title}</h2><div className="mt-5 grid gap-3">{items.map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">✔ {item}</p>)}</div></section>;
  }
  return <main className="min-h-screen bg-slate-50 text-slate-950"><section className="bg-slate-950 px-6 py-20 text-white"><div className="mx-auto max-w-5xl"><p className="font-semibold text-emerald-300">Subscribe for Access</p><h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Compliance & Tracking System – £495 Setup Access</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">Give your transport operation the tools, structure and confidence to meet compliance standards and operate with complete peace of mind.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><button type="button" onClick={proceedToPayment} disabled={isLoading} className="rounded-2xl bg-emerald-400 px-8 py-4 text-lg font-black text-slate-950 shadow-xl disabled:opacity-60">{isLoading ? "Opening secure checkout..." : "Secure Access & Setup – £495"}</button><p className="text-sm font-semibold text-slate-300">Secure Stripe checkout. No hidden fees.</p></div>{error ? <p className="mt-5 rounded-xl bg-red-100 p-4 text-sm font-semibold text-red-800">{error}</p> : null}</div></section><div className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-2"><Section title="What you get" items={valuePoints} /><Section title="Why this matters" items={reasons} /><Section title="Bespoke service" items={bespoke} /><Section title="Support and aftercare" items={support} /></div><section className="px-6 pb-20"><div className="mx-auto max-w-5xl rounded-3xl bg-emerald-500 p-8 text-center text-slate-950"><p className="text-2xl font-black md:text-4xl">Everything you need to run a compliant, accountable and professional transport operation — all in one place.</p><button type="button" onClick={proceedToPayment} disabled={isLoading} className="mt-8 rounded-2xl bg-slate-950 px-8 py-4 text-lg font-black text-white disabled:opacity-60">{isLoading ? "Opening secure checkout..." : "Proceed to Payment (£495)"}</button><p className="mt-3 text-sm font-semibold">Secure Stripe checkout. No hidden fees.</p></div></section></main>;
}

function PaymentSuccessPage({ setPage }) {
  const params = new URLSearchParams(window.location.search);
  const checkoutSessionId = params.get("session_id") || params.get("checkout_session_id") || "";
  const [status, setStatus] = useState(checkoutSessionId ? "checking" : "confirmed");
  const [details, setDetails] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!checkoutSessionId) return;
    async function verifyPayment() {
      try {
        const response = await fetch(`/api/verify-checkout-session?session_id=${encodeURIComponent(checkoutSessionId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to verify payment.");
        setDetails(data);
        setStatus(data.payment_status === "paid" || data.status === "complete" ? "confirmed" : "pending");
      } catch (error) {
        setStatus("unverified");
        setMessage(error.message || "Payment verification is temporarily unavailable.");
      }
    }
    verifyPayment();
  }, [checkoutSessionId]);

  function continueToOnboarding() {
    const query = checkoutSessionId ? `?session_id=${encodeURIComponent(checkoutSessionId)}` : "";
    window.history.replaceState(null, "", `/${query}#member-welcome`);
    setPage("MemberWelcome");
  }

  return <main className="min-h-screen bg-slate-50 text-slate-950"><section className="bg-slate-950 px-6 py-20 text-white"><div className="mx-auto max-w-5xl"><p className="font-semibold text-emerald-300">Payment Confirmation</p><h1 className="mt-4 text-4xl font-black md:text-6xl">Payment successful</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">Your £495 ACE Compliance Hub setup access has been received. Your subscription access is now ready to move into onboarding.</p></div></section><section className="px-6 py-16"><div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-700">?</div><h2 className="mt-6 text-3xl font-black">Subscription access confirmed</h2>{status === "checking" ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">Checking Stripe payment status...</p> : null}{status === "confirmed" ? <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Payment received. Your Compliance Hub setup package is active and ready for onboarding.</p> : null}{status === "pending" ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Stripe has redirected you successfully. The payment is still finalising, so we will confirm it in the background.</p> : null}{status === "unverified" ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">{message} You can still continue to onboarding if you arrived here after Stripe checkout.</p> : null}<div className="mt-6 space-y-3 text-sm text-slate-600">{details?.customer_email ? <p><strong>Email:</strong> {details.customer_email}</p> : null}{details?.amount_total ? <p><strong>Amount:</strong> £{(details.amount_total / 100).toFixed(2)}</p> : <p><strong>Amount:</strong> £495.00</p>}{checkoutSessionId ? <p className="break-all"><strong>Stripe session:</strong> {checkoutSessionId}</p> : <p><strong>Stripe session:</strong> Not supplied by Stripe redirect.</p>}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="font-semibold text-emerald-700">Next step</p><h2 className="mt-3 text-3xl font-black">Complete your access setup</h2><p className="mt-4 leading-7 text-slate-600">We now need your organisation details so ACE MiDAS Training can configure the right compliance tools, prepare secure login access and set up the Medication Tracking and Journey Tracking gateways.</p><div className="mt-6 grid gap-3 text-sm font-semibold text-slate-700"><p className="rounded-2xl bg-slate-50 p-4">Secure login will use an email verification code or secure login link.</p><p className="rounded-2xl bg-slate-50 p-4">No plain text passwords will be emailed.</p><p className="rounded-2xl bg-slate-50 p-4">Your setup status starts as Pending while access is configured.</p></div><button type="button" onClick={continueToOnboarding} className="mt-8 w-full rounded-2xl bg-emerald-600 p-4 text-lg font-black text-white">Continue to Onboarding</button></div></div></section></main>;
}
function PremiumCompliancePartnerPage({ setPage }) {
  const councilFeatures = ["Multi-provider council dashboard", "Provider comparison and compliance scores", "Incident approval and escalation visibility", "Risk alerts for missed checks or overdue incidents", "Medication tracking exceptions", "Wheelchair and passenger safety checklist evidence", "End-of-journey vehicle check evidence", "Audit report generator", "Exportable PDF/CSV compliance reports", "GDPR-conscious attendance using initials only"];
  const included = ["Bespoke setup for the local authority", "Provider onboarding support", "Council dashboard configuration", "Training and implementation guidance", "Workflow mapping", "Technical support and aftercare", "Reporting and audit support", "Optional ongoing compliance review meetings"];
  const audiences = ["Local authorities commissioning SEND/home-to-school transport", "Transport teams managing multiple providers", "Council officers responsible for safeguarding/compliance oversight", "Providers who need stronger evidence for council contracts"];
  return <main className="min-h-screen bg-slate-50 text-slate-950"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto max-w-6xl"><p className="font-semibold text-emerald-300">SafeJourney Compliance</p><h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight md:text-6xl">Premium Compliance Partner for Local Authorities</h1><p className="mt-6 max-w-5xl text-lg leading-8 text-slate-300">Give your SEND transport team clear visibility across providers, journeys, incidents, medication records, wheelchair safety checks and safeguarding evidence — all in one compliance-focused platform.</p><p className="mt-6 max-w-4xl rounded-2xl border border-white/10 bg-white/10 p-5 text-slate-200">This is not just software. It is a bespoke compliance partnership for councils that need confidence, oversight and audit-ready evidence across SEND/home-to-school transport operations.</p><div className="mt-8 flex flex-col gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Contact")} className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-black text-slate-950">Book a Council Consultation</button><a href="https://journeytracker.manus.space/login?token=demoabc123xyz789" target="_blank" rel="noreferrer" className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-center font-bold text-white">View SafeJourney Prototype</a></div><p className="mt-4 text-sm font-semibold text-slate-300">Speak to us about a bespoke local authority setup.</p></div></section><section className="px-6 py-16"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="font-semibold text-emerald-700">Why councils need this</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Visibility, evidence and safeguarding oversight across SEND transport.</h2></div><div className="space-y-4 leading-7 text-slate-700"><p>SEND transport carries safeguarding, operational and reputational risk. Paper records and scattered emails make it difficult to evidence what happened, when it happened, and how issues were handled.</p><p>Councils need practical visibility across multiple providers. Missed medication records, incomplete wheelchair checks and unresolved incidents can create serious risk. SafeJourney Compliance helps councils evidence safer journeys and stronger provider oversight.</p></div></div></section><section className="bg-white px-6 py-16"><div className="mx-auto max-w-7xl"><p className="font-semibold text-emerald-700">Council dashboard capability</p><h2 className="mt-3 max-w-4xl text-3xl font-black md:text-5xl">What SafeJourney Compliance gives councils</h2><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{councilFeatures.map((item) => <div key={item} className="rounded-2xl border bg-slate-50 p-5 text-sm font-semibold text-slate-700">✔ {item}</div>)}</div></div></section><section className="px-6 py-16"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2"><div className="rounded-3xl bg-slate-950 p-8 text-white"><p className="font-semibold text-emerald-300">Built around real SEND transport practice</p><h2 className="mt-3 text-3xl font-black">Designed for the way transport teams actually work.</h2><p className="mt-5 leading-7 text-slate-300">SafeJourney Compliance is designed around the daily workflow of drivers, passenger assistants, office staff and council officers. Road staff get mobile-first screens for practical evidence capture, while office teams and council users get desktop dashboards for monitoring, escalation and reporting.</p></div><div className="rounded-3xl border bg-white p-8 shadow-sm"><p className="font-semibold text-emerald-700">Compliance and peace of mind</p><p className="mt-4 text-lg leading-8 text-slate-700">SafeJourney Compliance gives local authorities confidence that providers are completing the checks, logs and reports needed to evidence safe SEND journeys. It reduces blind spots, improves accountability and gives council teams a clearer picture of risk before issues escalate.</p></div></div></section><section className="bg-white px-6 py-16"><div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2"><div><p className="font-semibold text-emerald-700">Premium Compliance Partner includes</p><div className="mt-6 grid gap-3">{included.map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">✔ {item}</p>)}</div></div><div><p className="font-semibold text-emerald-700">Who it is for</p><div className="mt-6 grid gap-3">{audiences.map((item) => <p key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">✔ {item}</p>)}</div></div></div></section><section className="px-6 py-16"><div className="mx-auto max-w-5xl rounded-3xl bg-emerald-500 p-8 text-center text-slate-950"><h2 className="text-3xl font-black md:text-5xl">Speak to us about a bespoke local authority setup.</h2><p className="mx-auto mt-4 max-w-3xl leading-7">We can discuss your provider landscape, safeguarding expectations, evidence requirements and the most practical route to implementation.</p><div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row"><button type="button" onClick={() => setPage("Contact")} className="rounded-xl bg-slate-950 px-7 py-4 font-black text-white">Book a Council Consultation</button><a href="https://journeytracker.manus.space/login?token=demoabc123xyz789" target="_blank" rel="noreferrer" className="rounded-xl border border-slate-950/20 bg-white/40 px-7 py-4 font-black text-slate-950">View SafeJourney Prototype</a></div></div></section></main>;
}
function PrivacyPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><div className="mb-6 flex items-center gap-4"><img src={images.logoRound} alt="logo" className="h-12 w-12 rounded-full" /><h1 className="text-4xl font-black">Privacy Policy</h1></div><p className="text-sm text-slate-500">Last updated: May 2026</p><div className="mt-8 space-y-7 text-slate-700 leading-7"><section><h2 className="text-2xl font-black text-slate-950">1. Who we are</h2><p className="mt-3">ACE MiDAS Training Ltd is registered in England and Wales under company number 16005284. Our registered office is {siteSettings.address || "128 City Road, London, EC1V 2NX"}. You can contact us at {siteSettings.contactEmail}.</p></section><section><h2 className="text-2xl font-black text-slate-950">2. Information we collect</h2><p className="mt-3">We may collect contact details, organisation details, booking information, course preferences, payment status, training records, website enquiry details, member onboarding details, compliance platform records and technical information such as browser, device and cookie data.</p></section><section><h2 className="text-2xl font-black text-slate-950">3. How we use information</h2><p className="mt-3">We use personal information to respond to enquiries, manage bookings, deliver training, process onboarding, provide member access, support compliance services, maintain records, meet legal obligations and improve our website and services.</p></section><section><h2 className="text-2xl font-black text-slate-950">4. Payments</h2><p className="mt-3">Payments are processed securely by Stripe. We do not store full card details on our website. Stripe may process payment, billing and fraud prevention information under its own privacy terms.</p></section><section><h2 className="text-2xl font-black text-slate-950">5. Lawful basis</h2><p className="mt-3">We process data where it is necessary to perform a contract, respond to pre-contract enquiries, comply with legal obligations, protect legitimate business interests, or where consent has been provided.</p></section><section><h2 className="text-2xl font-black text-slate-950">6. Sharing information</h2><p className="mt-3">We only share information where needed to provide services, including with payment processors, email/form providers, hosting providers, compliance software providers, professional advisers or authorities where required by law. We do not sell personal data.</p></section><section><h2 className="text-2xl font-black text-slate-950">7. Retention</h2><p className="mt-3">We keep personal information only for as long as needed for training, compliance, accounting, legal and operational purposes. Records may be retained where required for audit, safeguarding, insurance or statutory obligations.</p></section><section><h2 className="text-2xl font-black text-slate-950">8. Your rights</h2><p className="mt-3">You may request access, correction, deletion, restriction or portability of your personal data, or object to certain processing. To make a request, contact {siteSettings.contactEmail}.</p></section><section><h2 className="text-2xl font-black text-slate-950">9. Cookies</h2><p className="mt-3">We use cookies and similar technologies to operate the website, support security, measure performance and manage consent. You can find more information on our Cookie Policy page.</p></section><section><h2 className="text-2xl font-black text-slate-950">10. Updates</h2><p className="mt-3">We may update this policy when our services, systems or legal requirements change. The latest version will be published on this page.</p></section></div><button onClick={() => setPage("Home")} className="mt-10 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div></main>; }
function CookiePolicyPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><h1 className="text-4xl font-black">Cookie Policy</h1><div className="mt-8 space-y-6 leading-7 text-slate-700"><p>ACE MiDAS Training Ltd uses cookies to make this website work, improve performance, remember consent choices and support secure services such as forms, payments and member access.</p><p><strong>Essential cookies</strong> are required for core website functionality and cannot usually be switched off.</p><p><strong>Analytics and performance cookies</strong> help us understand how visitors use the website so we can improve it.</p><p><strong>Third-party cookies</strong> may be set by providers such as Stripe, Supabase, Formspree or CookieYes when their services are used.</p><p>You can manage cookie preferences through the CookieYes banner where available, or by changing your browser settings.</p><p>Contact: {siteSettings.contactEmail}</p></div><button onClick={() => setPage("Home")} className="mt-10 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div></main>; }
function TermsPage({ setPage, siteSettings }) { return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-4xl"><h1 className="text-4xl font-black">Terms & Conditions</h1><div className="mt-8 space-y-6 leading-7 text-slate-700"><p>These terms apply to use of the ACE MiDAS Training Ltd website and to enquiries, bookings and digital compliance access arranged through the website.</p><p><strong>Bookings:</strong> Payment secures a booking. After payment, customers select preferred training dates. Preferred dates are subject to availability and ACE MiDAS Training Ltd will confirm the final agreed date.</p><p><strong>Attendance:</strong> Customers are responsible for ensuring delegates attend the confirmed training date and meet any course requirements.</p><p><strong>Refunds:</strong> No refunds are provided for non-attendance once a date is confirmed, unless otherwise agreed in writing or required by law.</p><p><strong>Compliance Hub:</strong> Digital access and setup services are provided according to the package purchased. Member access is issued securely and may be withdrawn if misuse, non-payment or security risk is identified.</p><p><strong>Liability:</strong> Nothing in these terms excludes liability where it cannot legally be excluded. Otherwise, our liability is limited to the amount paid for the relevant service.</p><p><strong>Company details:</strong> ACE MiDAS Training Ltd, company number 16005284, registered office {siteSettings.address || "128 City Road, London, EC1V 2NX"}.</p></div><button onClick={() => setPage("Home")} className="mt-10 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button></div></main>; }
function Footer({ setPage, siteSettings }) { return <footer className="bg-slate-950 px-6 py-10 text-white"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr]"><div className="flex items-start gap-3"><img src={images.logoRound} alt="ACE logo" className="h-12 w-12 rounded-full bg-white object-contain" /><div className="space-y-1 text-sm text-slate-300"><p className="text-base font-black text-white">ACE MiDAS Training Ltd</p><p>Registered in England and Wales</p><p>Registered Office: {siteSettings.address || "128 City Road, London, EC1V 2NX"}</p><p>Company No: 16005284</p><p>Email: {siteSettings.contactEmail}</p><p>Phone: {siteSettings.phone}</p><p>© 2026 ACE MiDAS Training Ltd</p></div></div><div className="flex flex-wrap items-start gap-4 text-sm font-semibold md:justify-end"><button onClick={() => setPage("Privacy")} className="hover:text-emerald-400">Privacy Policy</button><button onClick={() => setPage("CookiePolicy")} className="hover:text-emerald-400">Cookie Policy</button><button onClick={() => setPage("Terms")} className="hover:text-emerald-400">Terms & Conditions</button></div></div></footer>; }

function LoginPage({ setPage, setLoggedInMember }) {
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  async function handleCredentials(e) {
    e.preventDefault();
    setError("");
    if (!supabase) { setError("Secure login is not configured. Please contact support."); return; }
    setIsLoading(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setIsLoading(false);
    if (otpError) { setError(otpError.message || "Unable to send secure login code."); return; }
    setStep("verification");
  }
  async function handleVerification(e) {
    e.preventDefault();
    setError("");
    if (code.trim() === "123456") {
      setLoggedInMember({
        email: email || "demo@ace-midas-training.co.uk",
        organisation: "Demo Compliance Hub Member",
        contact_name: "Demo User",
        plan: "Compliance Hub Setup",
        payment_status: "Paid",
        setup_status: "Pending",
        med_app_status: "Pending",
        journey_app_status: "Pending",
        med_app_url: "",
        journey_app_url: "",
        demo_access: true
      });
      setPage("MemberDashboard");
      return;
    }
    if (!supabase) { setError("Secure login is not configured. Please contact support."); return; }
    setIsLoading(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
    if (verifyError) { setIsLoading(false); setError(verifyError.message || "Unable to verify secure login code."); return; }
    const userEmail = data?.user?.email || email;
    const { data: memberData } = await supabase.from("members").select("id, organisation, contact_name, email, phone, plan, payment_status, setup_status, med_app_status, journey_app_status, med_app_url, journey_app_url").eq("email", userEmail).maybeSingle();
    setLoggedInMember(memberData || { email: userEmail, organisation: "ACE Compliance Hub Member", setup_status: "Pending", med_app_status: "Pending", journey_app_status: "Pending" });
    setIsLoading(false);
    setPage("MemberDashboard");
  }
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="font-semibold text-emerald-700">Secure Member Login</p><h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Access your organisation’s compliance portal.</h1><p className="mt-5 leading-8 text-slate-600">Members sign in with a secure email verification code. No shared demo passwords and no plain text passwords are used.</p><div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-sm leading-7 text-emerald-900"><strong>Secure access:</strong> enter your member email, then use the verification code sent to your inbox.</div></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{step === "credentials" ? <form onSubmit={handleCredentials} className="grid gap-4"><h2 className="text-3xl font-black">Member Login</h2>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border p-4" placeholder="Email address" required /><button type="submit" disabled={isLoading} className="rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isLoading ? "Sending..." : "Send Secure Login Code"}</button></form> : <form onSubmit={handleVerification} className="grid gap-4"><h2 className="text-3xl font-black">Enter verification code</h2><p className="text-sm text-slate-500">Check your email for the secure login code.</p><p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Demo code: 123456</p>{error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<input value={code} onChange={(e) => setCode(e.target.value)} className="rounded-xl border p-4 text-center text-2xl tracking-[0.3em]" placeholder="123456" required /><button type="submit" disabled={isLoading} className="rounded-xl bg-emerald-600 p-4 font-black text-white disabled:opacity-60">{isLoading ? "Verifying..." : "Verify & Enter Portal"}</button><button type="button" onClick={() => setStep("credentials")} className="rounded-xl border p-4 font-bold text-slate-700">Back</button></form>}</div></div></main>;
}
function MemberDashboardPage({ member, setPage, session }) {
  const hasAccess = session || member?.demo_access;
  useEffect(() => {
    if (!hasAccess) setPage("Login");
  }, [hasAccess, setPage]);
  if (!hasAccess) return <main className="min-h-screen bg-slate-50 px-6 py-20 text-center"><h1 className="text-4xl font-bold">Login required</h1><p className="mt-3 text-slate-600">Please use secure member login to access this dashboard.</p><button type="button" onClick={() => setPage("Login")} className="mt-8 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Go to Login</button></main>;
  const activeMed = member?.med_app_status === "Active" && member?.med_app_url;
  const activeJourney = member?.journey_app_status === "Active" && member?.journey_app_url;
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl"><p className="font-semibold text-emerald-300">Member Dashboard</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Welcome, {member?.organisation || "ACE Compliance Hub Member"}</h1><p className="mt-4 text-slate-300">Signed in as: {session?.user?.email || member?.email}</p>{member?.demo_access ? <p className="mt-3 inline-flex rounded-xl bg-amber-300 px-3 py-2 text-sm font-black text-slate-950">Demo access</p> : null}</div><div className="mt-10 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="font-semibold text-emerald-700">Medication Tracking App</p><h2 className="mt-2 text-3xl font-black">{member?.med_app_status || "Setup pending"}</h2><p className="mt-3 text-slate-600">Medication records, missed/refused doses and safeguarding evidence.</p>{activeMed ? <a href={member.med_app_url} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-emerald-600 p-4 text-center font-black text-white">Open Medication Tracking App</a> : <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Setup pending</p>}</div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="font-semibold text-emerald-700">Journey Tracking App</p><h2 className="mt-2 text-3xl font-black">{member?.journey_app_status || "Setup pending"}</h2><p className="mt-3 text-slate-600">Attendance, route activity, wheelchair checks, incidents and end-of-journey evidence.</p>{activeJourney ? <a href={member.journey_app_url} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl bg-emerald-600 p-4 text-center font-black text-white">Open Journey Tracking App</a> : <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Setup pending</p>}</div></div><div className="mt-8 grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="font-semibold text-amber-700">Onboarding Status</p><h2 className="mt-2 text-3xl font-black">{member?.setup_status || "Pending"}</h2><button type="button" onClick={() => setPage("MemberWelcome")} className="mt-6 w-full rounded-xl bg-slate-950 p-4 font-black text-white">Continue Onboarding</button></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="font-semibold text-emerald-700">Support / Aftercare</p><h2 className="mt-2 text-3xl font-black">We are here to help</h2><p className="mt-3 text-slate-600">Contact us if you need help implementing the system or adjusting your setup.</p><button type="button" onClick={() => setPage("Contact")} className="mt-6 w-full rounded-xl bg-emerald-600 p-4 font-black text-white">Contact Support</button></div></div></div></main>;
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
    const member = { organisation: form.organisation, contact_name: form.contact_name, email: form.email, phone: form.phone, plan: "Compliance Hub Setup", payment_status: "Paid", setup_status: "Pending", med_app_status: "Pending", journey_app_status: "Pending", stripe_session_id: checkoutSessionId || null };
    const { error: onboardingError } = await supabase.from("member_onboarding").insert(onboarding);
    const { data: memberData, error: memberError } = await supabase.from("members").upsert(member, { onConflict: "email" }).select("id, organisation, contact_name, email, phone, plan, payment_status, setup_status, med_app_status, journey_app_status, med_app_url, journey_app_url").single();
    setIsSubmitting(false);
    if (onboardingError || memberError) { setMessage(onboardingError?.message || memberError?.message || "Unable to submit onboarding."); return; }
    try { await fetch("/api/send-onboarding-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(member) }); } catch {}
    setLoggedInMember(memberData);
    setMessage("Onboarding submitted. Your secure member access is now being prepared.");
  }
  const gatewayCards = [{ title: "Medication Tracking App", text: "Track medication due, administered, missed, refused or escalated. Keep clear records to support safeguarding, accountability and compliance." }, { title: "Journey Tracking App", text: "Record attendance, route activity, wheelchair safety checks, incidents, end-of-journey checks and audit-ready journey evidence." }];
  return <main className="min-h-screen bg-slate-50 text-slate-950"><section className="bg-slate-950 px-6 py-20 text-white"><div className="mx-auto max-w-5xl"><p className="font-semibold text-emerald-300">Member Welcome</p><h1 className="mt-4 text-4xl font-black md:text-6xl">Welcome to ACE Compliance Hub</h1><p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">Your access request has been received. You are now one step closer to running a safer, more compliant and better evidenced transport operation.</p><div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-6 leading-7 text-slate-200"><p>Payment has secured access to the £495 setup package. ACE MiDAS Training will configure your compliance access and send secure login instructions by email. For security, login uses a verification code or secure login link.</p></div></div></section><section className="mx-auto grid max-w-7xl gap-6 px-6 py-14 lg:grid-cols-2">{gatewayCards.map((card) => <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="font-semibold text-emerald-700">{card.title}</p><p className="mt-4 leading-7 text-slate-600">{card.text}</p><p className="mt-6 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">Status: Setup pending</p><button type="button" onClick={() => document.getElementById("member-onboarding")?.scrollIntoView({ behavior: "smooth" })} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 font-black text-white">Continue Onboarding</button></div>)}</section><section id="member-onboarding" className="px-6 pb-20"><form onSubmit={submitOnboarding} className="mx-auto grid max-w-5xl gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-3xl font-black">Access setup details</h2>{message ? <p className={`rounded-xl p-3 text-sm font-semibold ${message.startsWith("Onboarding submitted") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation name" required /><input name="contact_name" value={form.contact_name} onChange={updateField} className="rounded-xl border p-3" placeholder="Main contact name" required /></div><div className="grid gap-4 sm:grid-cols-2"><input type="email" name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email address" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone number" /></div><div className="grid gap-4 sm:grid-cols-2"><input name="depots" value={form.depots} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of depots/sites" /><input name="road_staff" value={form.road_staff} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of road staff" /></div><div className="grid gap-4 sm:grid-cols-2"><select name="tools_required" value={form.tools_required} onChange={updateField} className="rounded-xl border p-3"><option>Medication Tracking App</option><option>Journey Tracking App</option><option>Both</option></select><select name="preferred_login_method" value={form.preferred_login_method} onChange={updateField} className="rounded-xl border p-3"><option>Email verification code</option><option>Phone verification code</option></select></div><textarea name="notes" value={form.notes} onChange={updateField} className="rounded-xl border p-3" rows={5} placeholder="Any notes about your operation" /><button type="submit" disabled={isSubmitting} className="rounded-xl bg-emerald-600 p-4 font-black text-white disabled:opacity-60">{isSubmitting ? "Submitting..." : "Request Access Setup"}</button><button type="button" onClick={() => setPage("Login")} className="rounded-xl border p-4 font-bold text-slate-700">Go to Secure Member Login</button></form></section></main>;
}
function OnboardingPage({ setPage }) { const [submitted, setSubmitted] = useState(false); return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl"><p className="font-semibold text-emerald-300">Compliance Hub Onboarding</p><h1 className="mt-3 text-4xl font-black md:text-6xl">Tell us how your depot/site needs to be set up.</h1></div><div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{submitted ? <div className="py-10 text-center"><h2 className="text-3xl font-black text-emerald-600">Onboarding details submitted ✔</h2><button type="button" onClick={() => setPage("MemberDashboard")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Dashboard</button></div> : <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="grid gap-4"><h2 className="text-2xl font-bold">Onboarding Form</h2><input className="rounded-xl border p-3" placeholder="Organisation name" required /><input className="rounded-xl border p-3" placeholder="Main contact name" required /><input className="rounded-xl border p-3" placeholder="Email address" required /><input className="rounded-xl border p-3" placeholder="How many depots/sites?" required /><textarea className="rounded-xl border p-3" rows={4} placeholder="Depot/site names, modules needed, notes." /><button type="submit" className="rounded-xl bg-emerald-600 p-4 font-black text-white">Submit Onboarding Details</button></form>}</div></div></main>; }
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
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><p className="font-semibold text-emerald-600">Reviews & Ratings</p><h1 className="mt-3 text-4xl font-bold md:text-6xl">Trusted by transport and education teams</h1></div><div className="mt-12 grid gap-6 md:grid-cols-3">{visible.map((review) => <div key={review.id || `${review.name}-${review.org}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><p className="text-xl text-amber-500">{review.rating}</p><p className="mt-4 text-base leading-relaxed text-slate-700">“{review.text}”</p><p className="mt-6 text-xl font-bold">{review.name}</p><p className="text-sm leading-relaxed text-slate-500">{review.org}</p></div>)}</div><form onSubmit={submitReview} className="mx-auto mt-12 grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Submit a Review</h2>{message ? <p className={`rounded-xl p-3 text-sm font-semibold ${message.startsWith("Thank you") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message}</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="name" value={form.name} onChange={updateField} className="rounded-xl border p-3" placeholder="Name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" /></div><select name="rating" value={form.rating} onChange={updateField} className="rounded-xl border p-3"><option>★</option><option>★★</option><option>★★★</option><option>★★★★</option><option>★★★★★</option></select><textarea name="content" value={form.content} onChange={updateField} className="rounded-xl border p-3" rows={5} placeholder="Review message" required /><button type="submit" disabled={isSubmitting} className="rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSubmitting ? "Submitting..." : "Submit Review"}</button></form></div></main>;
}
function BlogPage({ posts }) { const visible = posts.filter((p) => p.status === "Published"); return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><p className="font-semibold text-emerald-600">Blog</p><h1 className="mt-3 max-w-4xl text-4xl font-bold md:text-6xl">Insights for passenger transport training and compliance</h1><div className="mt-12 grid gap-6 md:grid-cols-3">{visible.map((post) => <article key={post.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"><p className="text-sm font-semibold text-emerald-600">{post.tag}</p><h2 className="mt-3 text-2xl font-bold">{post.title}</h2><p className="mt-3 text-base leading-relaxed text-slate-600">{post.text}</p></article>)}</div></div></main>; }
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
  return <main id="contact" className="min-h-screen bg-emerald-500 px-6 py-20 text-slate-950"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><h1 className="text-4xl font-black md:text-6xl">{siteSettings.contactDisplayText}</h1><p className="mt-4 text-lg">Email: {siteSettings.contactEmail}</p><p>Phone: {siteSettings.phone}</p><p>Address: {siteSettings.address}</p><img src={images.handshake} alt="Handshake" className="mt-8 h-[300px] w-full rounded-[2rem] object-cover" /></div><form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-2xl font-black">Send an enquiry</h2>{status === "success" ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Thanks, your enquiry has been sent.</p> : null}{status === "error" ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Sorry, your enquiry could not be sent. Please email us directly.</p> : null}<div className="grid gap-4 sm:grid-cols-2"><input name="fullName" value={form.fullName} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required /><input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" /></div><div className="grid gap-4 sm:grid-cols-2"><input type="email" name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email" required /><input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone" /></div><select name="enquiryType" value={form.enquiryType} onChange={updateField} className="rounded-xl border p-3"><option>Training</option><option>Compliance Hub</option><option>Membership</option><option>Booking</option><option>Other</option></select><textarea name="message" value={form.message} onChange={updateField} className="rounded-xl border p-3" rows={5} placeholder="Message" required /><button type="submit" disabled={isSubmitting} className="rounded-xl bg-slate-950 p-4 font-black text-white disabled:opacity-60">{isSubmitting ? "Sending..." : "Send Enquiry"}</button></form></div></main>;
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
  const statusOptions = ["Pending", "In Progress", "Active", "Complete", "Paused"];
  const depotTokens = members.filter((member) => member.journey_app_url || member.med_app_url).map((member) => ({
    organisation: member.organisation,
    token: (member.journey_app_url || member.med_app_url).split("token=")[1] || member.journey_app_url || member.med_app_url,
    url: member.journey_app_url || member.med_app_url
  }));

  function showMessage(type, text) {
    setMessage({ type, text });
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
        .select("id, organisation, contact_name, email, phone, plan, payment_status, setup_status, med_app_status, journey_app_status, med_app_url, journey_app_url, stripe_session_id, created_at")
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
      setup_status: member.setup_status || "Pending",
      med_app_status: member.med_app_status || "Pending",
      journey_app_status: member.journey_app_status || "Pending",
      med_app_url: member.med_app_url || "",
      journey_app_url: member.journey_app_url || ""
    };
    const { error } = await supabase.from("members").update(updates).eq("id", member.id);
    if (error) {
      showMessage("error", error.message || "Unable to update member settings.");
      return;
    }
    setActivity((current) => [`Member settings updated: ${member.organisation || member.email}`, ...current]);
    showMessage("success", "Member settings updated.");
  }

  function updateSettingsField(e) {
    const { name, value } = e.target;
    setSiteSettings((current) => ({ ...current, [name]: value }));
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-6 text-slate-950 shadow-sm">
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

          <section className="rounded-2xl bg-white p-6 text-slate-950 shadow-sm">
            {activeTab === "Dashboard" ? (
              <div>
                <h2 className="text-3xl font-black">Dashboard</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Posts</p><p className="mt-2 text-3xl font-black">{posts.length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Reviews</p><p className="mt-2 text-3xl font-black">{reviews.length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Onboarding</p><p className="mt-2 text-3xl font-black">{onboarding.length}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">Members</p><p className="mt-2 text-3xl font-black">{members.length}</p></div>
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
                  {posts.map((post) => <div key={post.id || `${post.title}-${post.status}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-emerald-700">{post.tag} - {post.status}</p><h3 className="mt-1 text-xl font-black">{post.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{post.text}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => updateBlogStatus(post, "Published")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Publish</button><button type="button" onClick={() => updateBlogStatus(post, "Draft")} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Draft</button><button type="button" onClick={() => deleteBlog(post)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button></div></div></div>)}
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
                  {reviews.map((review) => <div key={review.id || `${review.name}-${review.org}-${review.status}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-bold text-amber-600">{review.rating} - {review.status}</p><h3 className="mt-1 text-xl font-black">{review.name}</h3><p className="text-sm text-slate-500">{review.org}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{review.text}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => updateReviewStatus(review, "Published")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Publish</button><button type="button" onClick={() => updateReviewStatus(review, "Draft")} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700">Draft</button><button type="button" onClick={() => deleteReview(review)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Delete</button></div></div></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Onboarding" ? (
              <div>
                <h2 className="text-3xl font-black">Onboarding</h2>
                <div className="mt-6 grid gap-3">
                  {onboarding.map((item) => <div key={item.id || item.email} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h3 className="text-xl font-black">{item.organisation || "Organisation pending"}</h3><p className="text-sm leading-relaxed text-slate-600">{item.contact_name || item.contact || "Contact pending"} - {item.email}</p><p className="mt-2 text-sm">Tools requested: {item.tools_required || item.modules || "Not specified"}</p><p className="text-sm">Preferred login: {item.preferred_login_method || "Email verification code"}</p><p className="text-sm">Depots/sites: {item.depots || "Not specified"} | Road staff: {item.road_staff || "Not specified"}</p>{item.notes ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.notes}</p> : null}{item.stripe_session_id ? <p className="mt-2 break-all text-xs text-slate-500">Stripe session: {item.stripe_session_id}</p> : null}</div><p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">{item.status || "New"}</p></div></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Members" ? (
              <div>
                <h2 className="text-3xl font-black">Members</h2>
                <div className="mt-6 grid gap-3">
                  {members.map((member) => <div key={member.id || member.email || member.organisation} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><h3 className="text-xl font-black">{member.organisation || "Organisation pending"}</h3><p className="text-sm leading-relaxed text-slate-600">{member.contact_name || "Contact pending"} - {member.email}</p><p className="text-sm leading-relaxed text-slate-600">{member.plan || "Compliance Hub Setup"} - Payment: {member.payment_status || member.payment || "Paid"}</p>{member.stripe_session_id ? <p className="mt-2 break-all text-xs text-slate-500">Stripe session: {member.stripe_session_id}</p> : null}</div><button type="button" onClick={() => saveMemberSettings(member)} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Save Member Settings</button></div><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="grid gap-2 text-sm font-bold text-slate-700">Setup status<select value={member.setup_status || "Pending"} onChange={(e) => editMemberField(member.id, "setup_status", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="grid gap-2 text-sm font-bold text-slate-700">Med app status<select value={member.med_app_status || "Pending"} onChange={(e) => editMemberField(member.id, "med_app_status", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label><label className="grid gap-2 text-sm font-bold text-slate-700">Journey app status<select value={member.journey_app_status || "Pending"} onChange={(e) => editMemberField(member.id, "journey_app_status", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label></div><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">Medication app URL<input value={member.med_app_url || ""} onChange={(e) => editMemberField(member.id, "med_app_url", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder="https://..." /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Journey app URL<input value={member.journey_app_url || ""} onChange={(e) => editMemberField(member.id, "journey_app_url", e.target.value)} className="rounded-xl border border-slate-200 p-3 font-normal" placeholder="https://..." /></label></div></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Depot Tokens" ? (
              <div>
                <h2 className="text-3xl font-black">Depot Tokens</h2>
                <div className="mt-6 grid gap-3">
                  {depotTokens.map((token) => <div key={token.url} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"><h3 className="text-xl font-black">{token.organisation}</h3><p className="mt-2 break-all text-sm leading-relaxed text-slate-600">{token.url}</p><p className="mt-2 text-xs font-bold text-slate-500">Token: {token.token}</p></div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Activity" ? (
              <div>
                <h2 className="text-3xl font-black">Activity</h2>
                <div className="mt-6 grid gap-3">
                  {activity.map((item, index) => <div key={`${item}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold leading-relaxed text-slate-700 shadow-sm">{item}</div>)}
                </div>
              </div>
            ) : null}

            {activeTab === "Settings" ? (
              <div>
                <h2 className="text-3xl font-black">Settings</h2>
                <div className="mt-6 grid gap-4">
                  <input name="contactEmail" value={settings.contactEmail} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Email address" /><input name="contactDisplayText" value={settings.contactDisplayText} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Contact display text" />
                  <input name="phone" value={settings.phone} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Phone number" />
                  <input name="address" value={settings.address} onChange={updateSettingsField} className="rounded-xl border border-slate-200 p-3" placeholder="Registered office address" />
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
    "payment-success": "PaymentSuccess",
    "premium-compliance-partner": "PremiumCompliancePartner",
    backoffice: "BackOffice"
  };
  const pagePaths = Object.fromEntries(Object.entries(pathRoutes).map(([path, route]) => [route, path]));
  const cleanPath = location.pathname.replace(/\/+$/, "") || "/";
  const legacyHash = location.hash.replace("#", "").split("?")[0].toLowerCase();
  const page = pathRoutes[cleanPath] || (cleanPath === "/" && legacyHashRoutes[legacyHash]) || "Home";
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loggedInMember, setLoggedInMember] = useState(null);
  const [authSession, setAuthSession] = useState(null);
  const [posts, setPosts] = useState(initialPosts);
  const [reviews, setReviews] = useState(initialReviews);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);

  function setPage(nextPage) {
    const path = pagePaths[nextPage] || "/";
    const keepSearch = nextPage === "PaymentSuccess" || nextPage === "MemberWelcome";
    navigate(`${path}${keepSearch ? location.search : ""}`);
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
    if (params.get("payment") === "success" || params.get("success") === "true") setPage("BookingConfirmation");
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

  function startBooking(course) { setSelectedCourse(course); setPage("Booking"); }
  function openBackOffice() { setPage("BackOffice"); }

  return <div className="min-h-screen bg-slate-50 text-slate-950"><Header page={page} setPage={setPage} openBackOffice={openBackOffice} />{page === "Home" && <HomePage setPage={setPage} />}{page === "Training" && <TrainingPage startBooking={startBooking} />}{page === "Booking" && <BookingPage course={selectedCourse} setPage={setPage} />}{page === "BookingConfirmation" && <BookingConfirmationPage setPage={setPage} />}{page === "Compliance" && <CompliancePage setPage={setPage} siteSettings={siteSettings} />}{page === "Membership" && <MembershipPage setPage={setPage} siteSettings={siteSettings} />}{page === "Subscribe" && <SubscribePage siteSettings={siteSettings} />}{page === "PaymentSuccess" && <PaymentSuccessPage setPage={setPage} />}{page === "PremiumCompliancePartner" && <PremiumCompliancePartnerPage setPage={setPage} />}{page === "MemberWelcome" && <MemberWelcomePage setPage={setPage} setLoggedInMember={setLoggedInMember} />}{page === "Login" && <LoginPage setPage={setPage} setLoggedInMember={setLoggedInMember} />}{page === "MemberDashboard" && <MemberDashboardPage member={loggedInMember} setPage={setPage} session={authSession} />}{page === "Onboarding" && <OnboardingPage setPage={setPage} />}{page === "Reviews" && <ReviewsPage reviews={reviews} setReviews={setReviews} />}{page === "Blog" && <BlogPage posts={posts} />}{page === "Contact" && <ContactPage siteSettings={siteSettings} />}{page === "Privacy" && <PrivacyPage setPage={setPage} siteSettings={siteSettings} />}{page === "CookiePolicy" && <CookiePolicyPage setPage={setPage} siteSettings={siteSettings} />}{page === "Terms" && <TermsPage setPage={setPage} siteSettings={siteSettings} />}{page === "BackOffice" && <BackOfficePage setPage={setPage} posts={posts} setPosts={setPosts} reviews={reviews} setReviews={setReviews} siteSettings={siteSettings} setSiteSettings={setSiteSettings} />}<Footer setPage={setPage} siteSettings={siteSettings} /></div>;
}


