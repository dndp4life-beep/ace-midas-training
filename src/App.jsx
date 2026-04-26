import React, { useEffect, useState } from "react";

const DEPOT_LOGIN_URL = "https://journeytracker.manus.space";
const STRIPE_SUBSCRIPTION_URL = "https://buy.stripe.com/test_9B69ATd133zdfIhbcMdIA00";
const CHECKOUT_API_URL = "/api/create-checkout-session";
const BOOKING_DETAILS_ENDPOINT = "https://formspree.io/f/mykloeon";
const BOOKING_CONFIRMATION_API = "/api/send-booking-confirmation";

const courses = [
  { title: "MiDAS Standard", price: "£165", note: "Includes £40 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_fZucN52mp8Tx8fPft2dIA07" },
  { title: "MiDAS Accessible", price: "£210", note: "Includes £40 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_8x2aEX3qt9XBanX5SsdIA06" },
  { title: "PATS Standard", price: "£125", note: "Includes £30 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_fZubJ12mpglZ0Nn94EdIA05" },
  { title: "PATS Accessible", price: "£155–£185", note: "Attendance or proficiency routes", stripeUrl: "https://buy.stripe.com/test_fZubJ1bWZfhV9jT5SsdIA04" },
  { title: "First Aid at Work", price: "£205–£225", note: "Blended or 3-day classroom options", stripeUrl: "https://buy.stripe.com/test_4gM6oH1il6LpeEddkUdIA03" },
  { title: "Children’s Transport First Aid", price: "£95–£135", note: "Optional epilepsy medication module", stripeUrl: "https://buy.stripe.com/test_8x200jgdffhV67H94EdIA02" }
];

const features = [
  "Journey reporting",
  "Medication tracking",
  "Attendance recording",
  "Wheelchair safety checklists",
  "Incident reporting",
  "Audit-ready records"
];

function Header({ page, setPage }) {
  const nav = ["Home", "Training", "Compliance", "Packages", "Reviews", "Blog", "Contact"];
  return (
    <header className="sticky top-0 z-50 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button onClick={() => setPage("Home")} className="text-left">
          <h1 className="text-xl font-bold text-slate-950">ACE MiDAS Training</h1>
          <p className="text-xs text-slate-500">Training • Compliance • Digital Systems</p>
        </button>
        <nav className="hidden gap-5 text-sm text-slate-600 md:flex">
          {nav.map((item) => (
            <button key={item} onClick={() => setPage(item)} className={page === item ? "font-bold text-emerald-600" : "hover:text-emerald-600"}>{item}</button>
          ))}
        </nav>
        <a href={DEPOT_LOGIN_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-500 px-5 py-2 font-semibold text-white">Member Login</a>
      </div>
    </header>
  );
}

function CourseCard({ course, onBook }) {
  return (
    <button onClick={() => onBook(course)} className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:border-emerald-500 hover:shadow-lg">
      <p className="text-sm text-slate-500">{course.title}</p>
      <p className="mt-3 text-3xl font-bold">{course.price}</p>
      <p className="mt-3 text-sm text-slate-600">{course.note}</p>
      <p className="mt-5 font-bold text-emerald-700">Book this course →</p>
    </button>
  );
}

function Home({ setPage, onBook }) {
  return (
    <>
      <section className="bg-slate-950 px-6 py-24 text-white md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-block rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">Built for SEND transport, schools, councils and operators</div>
            <h2 className="text-4xl font-bold leading-tight md:text-6xl">Training, Compliance & Digital Systems for Safe Passenger Transport</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">MiDAS, PATS and First Aid training alongside a paid compliance platform for journey reporting, medication logs, attendance, wheelchair checks and incident reporting.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button onClick={() => setPage("Training")} className="rounded-xl bg-emerald-400 px-7 py-3 font-bold text-slate-950">Book Training</button>
              <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-white/20 bg-white/5 px-7 py-3 text-center font-bold text-white">Subscribe for Access</a>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl">
            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-sm text-slate-400">ACE Compliance Hub</p>
              <h3 className="mt-2 text-2xl font-bold">Paid member access to your compliance platform</h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {features.map((f) => <div key={f} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">✔ {f}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="font-semibold text-emerald-600">2026 Training Prices</p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">Click a course to begin booking</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{courses.map(c => <CourseCard key={c.title} course={c} onBook={onBook} />)}</div>
        </div>
      </section>
      <section className="bg-emerald-500 px-6 py-20 text-center text-slate-950">
        <h2 className="text-3xl font-bold md:text-5xl">We would love to hear from you</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg">Whether you need training, a group quote, or a demo, get in touch.</p>
        <button onClick={() => setPage("Contact")} className="mt-8 rounded-xl bg-slate-950 px-7 py-3 font-bold text-white">Go to Contact Page</button>
      </section>
    </>
  );
}

function Training({ onBook }) {
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><p className="font-semibold text-emerald-600">Training Services</p><h2 className="mt-3 text-4xl font-bold md:text-6xl">MiDAS, PATS and First Aid training</h2><p className="mt-4 max-w-3xl text-slate-600">Professional training for SEND transport, schools, councils and passenger transport operators.</p><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{courses.map(c => <CourseCard key={c.title} course={c} onBook={onBook} />)}</div></div></main>;
}

function Booking({ course, setPage }) {
  const [qty, setQty] = useState(1);
  const [outside, setOutside] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const nums = course.price.match(/\d+/g)?.map(Number) || [0];
  const low = nums[0], high = nums[1] || nums[0];
  const discountTier = qty >= 9 ? "9–12 delegates" : qty >= 4 ? "4–8 delegates" : "1–3 delegates";
  const discountLabel = qty >= 9 ? "20% group discount" : qty >= 4 ? "10% small group discount" : "Standard rate";
  const unit = nums.length > 1 ? (qty >= 9 ? low : qty >= 4 ? Math.round(high * 0.9) : high) : qty >= 9 ? Math.round(high * 0.8) : qty >= 4 ? Math.round(high * 0.9) : high;
  const savingPerDelegate = Math.max(0, high - unit);
  const max = course.title.includes("PATS Accessible") || course.title.includes("First Aid") || course.title.includes("Children") ? 12 : 20;
  const total = unit * qty + (outside ? 75 : 0);

  async function continueToPayment() {
    if (!agree) return;

    setIsLoading(true);
    setPaymentError("");

    try {
      const response = await fetch(CHECKOUT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: course.title,
          quantity: qty,
          unitPrice: unit,
          subtotal: unit * qty,
          travelFee: outside ? 75 : 0,
          total,
          outsideA406: outside,
          agreementAccepted: true,
          refundPolicy: "No refunds for non-attendance"
        })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to create Stripe checkout");
      }

      window.location.href = data.url;
    } catch (error) {
      setPaymentError(error.message || "Unable to create Stripe checkout. Please try again or contact ACE MiDAS Training.");
      setIsLoading(false);
    }
  }

  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><h2 className="text-center text-4xl font-bold md:text-6xl">Confirm your booking</h2><div className="mt-12 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border bg-white p-7 shadow-sm"><h3 className="text-2xl font-bold">{course.title}</h3><p className="mt-2 text-slate-500">{course.note}</p><label className="mt-6 block font-semibold">Number of delegates</label><input type="number" min="1" max={max} value={qty} onChange={(e)=>setQty(Math.max(1, Math.min(max, Number(e.target.value)||1)))} className="mt-2 w-full rounded-xl border p-3"/><p className="mt-2 text-xs text-slate-500">Max allowed: {max}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={()=>setOutside(false)} className={`rounded-xl px-4 py-3 font-bold ${!outside ? "bg-emerald-600 text-white":"bg-slate-100"}`}>Inside A406</button><button onClick={()=>setOutside(true)} className={`rounded-xl px-4 py-3 font-bold ${outside ? "bg-red-600 text-white":"bg-slate-100"}`}>Outside A406</button></div></div><div className="rounded-3xl border bg-white p-7 shadow-sm"><h3 className="text-2xl font-bold">Price Breakdown</h3><div className="mt-6 space-y-4"><div className="flex justify-between"><span>Price per delegate</span><div className="text-right">{savingPerDelegate > 0 ? <p className="text-sm line-through text-slate-400">£{high}</p> : null}<b>£{unit}</b></div></div><div className="flex justify-between"><span>Discount tier</span><b>{discountTier} — {discountLabel}</b></div><div className="flex justify-between"><span>Delegates selected</span><b>{qty}</b></div><div className="flex justify-between"><span>Training subtotal</span><b>£{unit * qty}</b></div><div className="flex justify-between"><span>Travel fee</span><b>£{outside ? 75 : 0}</b></div><div className="flex justify-between border-t pt-4 text-2xl"><span>Estimated total</span><b className="text-emerald-600">£{total}</b></div>{savingPerDelegate > 0 ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">You’re saving £{savingPerDelegate * qty} on this booking.</p> : null}</div><div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"><strong>Locked quantity:</strong> Stripe will charge for exactly {qty} delegate{qty === 1 ? "" : "s"}. The customer will not need to change the quantity on the Stripe checkout page.</div></div></div><section className="mt-10 rounded-3xl border bg-white p-7 shadow-sm"><h3 className="text-2xl font-bold">Booking Agreement</h3><p className="mt-4 text-sm leading-7 text-slate-700">By selecting “Yes, I agree”, you confirm this booking forms a binding agreement. Payment confirms the booking. No refunds for non-attendance. Stripe will charge the exact number of delegates selected on this page.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><button onClick={()=>setAgree(true)} className={`rounded-xl p-4 font-bold ${agree ? "bg-emerald-600 text-white":"bg-emerald-100 text-emerald-800"}`}>Yes, I agree</button><button onClick={()=>setAgree(false)} className="rounded-xl bg-red-100 p-4 font-bold text-red-800">No, I do not agree</button></div>{paymentError ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{paymentError}</p> : null}<button disabled={!agree || isLoading} onClick={continueToPayment} className={`mt-6 w-full rounded-xl p-4 font-bold ${agree && !isLoading ? "bg-slate-950 text-white":"bg-slate-200 text-slate-400"}`}>{isLoading ? "Creating secure checkout..." : `Continue to Secure Payment — £${total}`}</button><button onClick={()=>setPage("Training")} className="mt-4 w-full rounded-xl border p-4 font-bold">Back to Training</button></section></div></main>;
}

function CompliancePage({ setPage }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
          <div>
            <p className="font-semibold text-emerald-300">ACE Compliance Hub</p>
            <h2 className="mt-3 text-4xl font-bold md:text-6xl">Digital compliance tools for passenger transport teams</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Give your organisation a clearer way to record journeys, medication, attendance, wheelchair checks and incidents in one place.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400 px-7 py-3 text-center font-bold text-slate-950">Subscribe for Access</a>
              <button onClick={() => setPage("Contact")} className="rounded-xl border border-white/20 bg-white/5 px-7 py-3 font-bold text-white">Request Demo</button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => <div key={f} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">✔ {f}</div>)}
          </div>
        </div>
      </section>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h3 className="text-3xl font-bold md:text-5xl">Why this matters</h3>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              "Paper records can be lost, incomplete or difficult to audit.",
              "Staff need a consistent way to evidence what happens on each journey.",
              "Councils, schools and operators need proof of safe working practices."
            ].map((text) => <div key={text} className="rounded-3xl border bg-white p-7 shadow-sm"><p className="text-slate-700">{text}</p></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}

function PackagesPage({ setPage }) {
  const packs = [
    { title: "Essential Training", price: "Pay per course", text: "For organisations that need MiDAS, PATS or First Aid training only.", points: ["Course booking", "Certification support", "Group booking options"], cta: "Book Training" },
    { title: "Compliance Bundle", price: "From £495/month", text: "Training plus paid access to ACE Compliance Hub for daily compliance tracking.", points: ["Member access", "Journey reporting", "Medication and incident records"], cta: "Subscribe for Access" },
    { title: "Premium Compliance Partner", price: "From £1,200/month", text: "Full setup, onboarding and compliance support for larger operators.", points: ["Depot setup", "Staff onboarding", "Quarterly compliance review"], cta: "Request Demo" }
  ];
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-emerald-600">Packages</p>
          <h2 className="mt-3 text-4xl font-bold md:text-6xl">Choose training only, SaaS access or full compliance support</h2>
          <p className="mt-4 text-slate-600">Pick the level of service that fits your organisation.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {packs.map((pack, index) => <div key={pack.title} className={`relative rounded-3xl border bg-white p-7 shadow-sm ${index === 1 ? "border-emerald-500 shadow-xl" : "border-slate-200"}`}>
            {index === 1 && <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-4 py-1 text-sm font-bold text-slate-950">Best Seller</div>}
            <h3 className="text-2xl font-bold">{pack.title}</h3>
            <p className="mt-3 text-slate-600">{pack.text}</p>
            <p className="mt-6 text-3xl font-bold text-emerald-600">{pack.price}</p>
            <div className="mt-6 space-y-3">{pack.points.map((p) => <p key={p} className="text-sm text-slate-700">✔ {p}</p>)}</div>
            {index === 1 ? <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="mt-8 block rounded-xl bg-slate-950 py-3 text-center font-bold text-white">{pack.cta}</a> : <button onClick={() => setPage(index === 0 ? "Training" : "Contact")} className="mt-8 w-full rounded-xl bg-slate-950 py-3 font-bold text-white">{pack.cta}</button>}
          </div>)}
        </div>
      </div>
    </main>
  );
}

function ReviewsPage() {
  const reviews = [
    { rating: "★★★★★", name: "Transport Manager", org: "SEND Transport Provider", text: "The system gives us a clearer way to evidence what happens on each journey." },
    { rating: "★★★★★", name: "School Operations Lead", org: "Academy Trust", text: "The training and compliance approach feels practical, organised and relevant." },
    { rating: "★★★★★", name: "Compliance Lead", org: "Community Transport", text: "This would help us prepare records for audits and contract monitoring." }
  ];
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-emerald-600">Reviews & Ratings</p>
          <h2 className="mt-3 text-4xl font-bold md:text-6xl">Trusted by transport and education teams</h2>
          <p className="mt-4 text-slate-600">Use this section for testimonials, case studies and feedback as your client base grows.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((r) => <div key={r.name} className="rounded-3xl border bg-white p-7 shadow-sm"><p className="text-xl text-amber-500">{r.rating}</p><p className="mt-4 text-slate-700">“{r.text}”</p><p className="mt-6 font-bold">{r.name}</p><p className="text-sm text-slate-500">{r.org}</p></div>)}
        </div>
      </div>
    </main>
  );
}

function BlogPage() {
  const posts = [
    { tag: "Compliance", title: "Why transport compliance needs more than paper records", text: "A practical look at why daily evidence matters for SEND transport providers." },
    { tag: "Training", title: "MiDAS, PATS and digital compliance", text: "How training and digital records can work together to protect operators and passengers." },
    { tag: "Contracts", title: "What councils may expect from transport providers", text: "How audit-ready records support stronger contract monitoring and operational accountability." }
  ];
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <p className="font-semibold text-emerald-600">Blog</p>
        <h2 className="mt-3 max-w-4xl text-4xl font-bold md:text-6xl">Insights for passenger transport training and compliance</h2>
        <p className="mt-4 max-w-3xl text-slate-600">Use the blog to build SEO, educate potential clients and show authority in SEND transport compliance.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.map((post) => <article key={post.title} className="rounded-3xl border bg-white p-7 shadow-sm"><p className="text-sm font-semibold text-emerald-600">{post.tag}</p><h3 className="mt-3 text-2xl font-bold">{post.title}</h3><p className="mt-3 text-slate-600">{post.text}</p><button className="mt-6 font-bold text-emerald-700">Read article →</button></article>)}
        </div>
      </div>
    </main>
  );
}
function BookingConfirmationPage({ setPage }) {
  const [form, setForm] = useState({
    name: "",
    organisation: "",
    email: "",
    phone: "",
    course: "",
    delegates: "",
    location: "",
    preferredDate1: "",
    preferredDate2: "",
    preferredDate3: "",
    notes: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitBookingDetails(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(BOOKING_DETAILS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "Post-payment training date selection",
          ...form
        })
      });

      if (!response.ok) {
        throw new Error("Unable to submit booking details");
      }

      const confirmationResponse = await fetch(BOOKING_CONFIRMATION_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (!confirmationResponse.ok) {
        throw new Error("Booking details saved, but confirmation email failed");
      }

      setSubmitted(true);
    } catch (err) {
      setError("Your payment was received, but the confirmation process could not be completed. Please email info@ace-midas-training.co.uk with your preferred dates.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-emerald-500 p-8 text-center text-slate-950 shadow-sm">
          <p className="font-semibold">Payment received</p>
          <h2 className="mt-3 text-4xl font-bold md:text-6xl">Booking received ✅</h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg">Thank you. Your payment confirms your booking. Please now select your preferred training dates so we can confirm availability.</p>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            <h3 className="text-2xl font-bold">What happens next?</h3>
            <div className="mt-6 space-y-4 text-slate-700">
              <p>✔ Submit your preferred dates using the form.</p>
              <p>✔ We check trainer availability and confirm the final date.</p>
              <p>✔ You receive confirmation and joining instructions.</p>
              <p>✔ Please note: preferred dates are requested dates, not guaranteed until confirmed by ACE MiDAS Training.</p>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Non-attendance is non-refundable once a confirmed training date has been agreed.
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            {submitted ? (
              <div className="py-10 text-center">
                <h3 className="text-2xl font-bold text-emerald-600">Preferred dates submitted ✅</h3>
                <p className="mt-3 text-slate-600">We will review your request and contact you shortly. A booking summary email has also been sent to the customer email address provided.</p>
                <button onClick={() => setPage("Home")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button>
              </div>
            ) : (
              <form onSubmit={submitBookingDetails} className="grid gap-4">
                <h3 className="text-2xl font-bold">Select preferred dates</h3>
                {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="name" value={form.name} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required />
                  <input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <input name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email address" required />
                  <input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone number" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <select name="course" value={form.course} onChange={updateField} className="rounded-xl border p-3" required>
                    <option value="">Course booked</option>
                    {courses.map((item) => <option key={item.title}>{item.title}</option>)}
                  </select>
                  <input name="delegates" value={form.delegates} onChange={updateField} className="rounded-xl border p-3" placeholder="Number of delegates paid for" required />
                </div>
                <input name="location" value={form.location} onChange={updateField} className="rounded-xl border p-3" placeholder="Training address / location" required />
                <div className="grid gap-4 sm:grid-cols-3">
                  <input type="date" name="preferredDate1" value={form.preferredDate1} onChange={updateField} className="rounded-xl border p-3" required />
                  <input type="date" name="preferredDate2" value={form.preferredDate2} onChange={updateField} className="rounded-xl border p-3" />
                  <input type="date" name="preferredDate3" value={form.preferredDate3} onChange={updateField} className="rounded-xl border p-3" />
                </div>
                <textarea name="notes" value={form.notes} onChange={updateField} className="rounded-xl border p-3" rows={4} placeholder="Any notes, access arrangements, parking details or preferred times." />
                <button type="submit" className="rounded-xl bg-slate-950 p-4 font-bold text-white">Submit Booking Details</button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Contact() { return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">Contact ACE MiDAS Training</p><h2 className="mt-3 text-4xl font-bold md:text-6xl">We would love to hear from you</h2><p className="mt-6 text-lg text-slate-300">Tell us what you need and we’ll help with training, compliance support, group bookings or demo access.</p></div><div className="rounded-3xl bg-white/10 p-8 text-center"><div className="text-7xl">🤝</div><h3 className="mt-4 text-2xl font-bold">Partnership starts with a conversation</h3></div></div></section><section className="bg-emerald-500 px-6 py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><h2 className="text-4xl font-bold">Speak to us about your organisation</h2><div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white"><p>Email: info@ace-midas-training.co.uk</p><p>Phone: 020 3633 4203 / 07570 988 597</p></div></div><form className="rounded-3xl bg-white p-7 shadow-xl"><h3 className="text-2xl font-bold">Lead Capture Form</h3><div className="mt-6 grid gap-4"><input className="rounded-xl border p-3" placeholder="Full name"/><input className="rounded-xl border p-3" placeholder="Organisation"/><input className="rounded-xl border p-3" placeholder="Email address"/><select className="rounded-xl border p-3"><option>What do you need?</option><option>MiDAS Training</option><option>PATS Training</option><option>ACE Compliance Hub Demo</option></select><textarea className="rounded-xl border p-3" rows={5} placeholder="Message"/><button type="button" className="rounded-xl bg-slate-950 p-3 font-bold text-white">Submit Enquiry</button></div></form></div></section></main>; }

export default function AceMidasPreview() {
  const [page, setPage] = useState("Home");
  const [course, setCourse] = useState(null);
  const onBook = (c) => { setCourse(c); setPage("Booking"); };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success" || params.get("success") === "true") {
      setPage("BookingConfirmation");
    }
  }, []);

  return <div><Header page={page} setPage={setPage}/>{page === "Home" && <Home setPage={setPage} onBook={onBook}/>} {page === "Training" && <Training onBook={onBook}/>} {page === "Booking" && <Booking course={course} setPage={setPage}/>} {page === "BookingConfirmation" && <BookingConfirmationPage setPage={setPage}/>} {page === "Compliance" && <CompliancePage setPage={setPage}/>} {page === "Packages" && <PackagesPage setPage={setPage}/>} {page === "Reviews" && <ReviewsPage/>} {page === "Blog" && <BlogPage/>} {page === "Contact" && <Contact/>}</div>;
}
