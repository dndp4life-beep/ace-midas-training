import React, { useState } from "react";

const DEPOT_LOGIN_URL = "https://journeytracker.manus.space";
const STRIPE_SUBSCRIPTION_URL = "https://buy.stripe.com/test_9B69ATd133zdfIhbcMdIA00";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mykloeon";
const CHECKOUT_API_URL = "/api/create-checkout-session";

function Icon() {
  return <span className="text-emerald-500 text-lg font-bold">✔</span>;
}

function Header({ setPage, cta = "Member Login", ctaHref = DEPOT_LOGIN_URL }) {
  const navItems = [
    ["home", "Home"],
    ["training", "Training"],
    ["system", "Compliance System"],
    ["packages", "Packages"],
    ["reviews", "Reviews"],
    ["blog", "Blog"],
    ["contact", "Contact"]
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <button type="button" onClick={() => setPage("home")} className="text-left">
          <h1 className="font-bold text-xl text-slate-950">ACE MiDAS Training</h1>
          <p className="text-xs text-slate-500">Training • Compliance • Digital Systems</p>
        </button>
        <nav className="hidden md:flex gap-5 text-sm text-slate-600">
          {navItems.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setPage(key)} className="hover:text-emerald-600">
              {label}
            </button>
          ))}
        </nav>
        <a href={ctaHref} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-semibold shadow-sm">
          {cta}
        </a>
      </div>
    </header>
  );
}

function SectionHeading({ label, title, text, light = false }) {
  return (
    <div className="max-w-3xl">
      <p className={light ? "text-emerald-300 font-semibold" : "text-emerald-600 font-semibold"}>{label}</p>
      <h2 className={light ? "text-3xl md:text-5xl font-bold mt-3 text-white" : "text-3xl md:text-5xl font-bold mt-3 text-slate-950"}>{title}</h2>
      {text ? <p className={light ? "mt-4 text-slate-300 leading-8" : "mt-4 text-slate-600 leading-8"}>{text}</p> : null}
    </div>
  );
}

const trainingPrices = [
  { title: "MiDAS Standard", price: "£165", note: "Includes £40 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_fZucN52mp8Tx8fPft2dIA07" },
  { title: "MiDAS Accessible", price: "£210", note: "Includes £40 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_8x2aEX3qt9XBanX5SsdIA06" },
  { title: "PATS Standard", price: "£125", note: "Includes £30 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_fZubJ12mpglZ0Nn94EdIA05" },
  { title: "PATS Accessible", price: "£155–£185", note: "Attendance or proficiency routes", stripeUrl: "https://buy.stripe.com/test_fZubJ1bWZfhV9jT5SsdIA04" },
  { title: "First Aid at Work", price: "£205–£225", note: "Blended or 3-day classroom options", stripeUrl: "https://buy.stripe.com/test_4gM6oH1il6LpeEddkUdIA03" },
  { title: "Children’s Transport First Aid", price: "£95–£135", note: "Optional epilepsy medication module", stripeUrl: "https://buy.stripe.com/test_8x200jgdffhV67H94EdIA02" }
];

const systemFeatures = [
  "Journey reporting",
  "Medication tracking",
  "Attendance recording",
  "Wheelchair safety checklists",
  "Incident reporting",
  "Depot login for SaaS members",
  "Secure member access",
  "Audit-ready records"
];

const packages = [
  {
    title: "Essential Training",
    price: "Pay per course",
    text: "For organisations that need certified MiDAS, PATS or First Aid training only.",
    points: ["MiDAS, PATS or First Aid", "Certification support", "Group booking options"],
    cta: "Enquire"
  },
  {
    title: "Compliance Bundle",
    price: "From £495/month",
    text: "Training plus paid access to ACE Compliance Hub for daily compliance tracking.",
    points: ["Subscription access", "Depot login", "Journey and medication tracking", "Attendance and incident records"],
    cta: "Subscribe for Access"
  },
  {
    title: "Premium Compliance Partner",
    price: "From £1,200/month",
    text: "Full compliance support, setup, onboarding and reporting for larger operators.",
    points: ["Full depot setup", "Staff onboarding", "Quarterly compliance review", "Priority support"],
    cta: "Request Demo"
  }
];

const audienceCards = [
  { title: "Local Authorities & Councils", text: "Help contracted operators evidence safe, consistent and audit-ready passenger transport practice." },
  { title: "Schools & Academy Trusts", text: "Support SEND transport arrangements with clear journey, attendance, incident and medication records." },
  { title: "Transport Providers", text: "Protect your contracts and improve oversight with training, depot access and structured compliance records." }
];

const painPoints = [
  "Paper-based records get lost or completed incorrectly",
  "Staff are unsure what needs to be recorded",
  "Incidents are not tracked or reviewed properly",
  "No clear audit trail for councils or contracts",
  "Training is delivered but not monitored in practice",
  "Compliance checks are reactive instead of proactive"
];

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedCourse, setSelectedCourse] = useState(null);

  function startCourseBooking(course) {
    setSelectedCourse(course);
    setPage("booking");
  }

  return (
    <>
      {page === "home" && <Homepage setPage={setPage} startCourseBooking={startCourseBooking} />}
      {page === "training" && <TrainingPage setPage={setPage} startCourseBooking={startCourseBooking} />}
      {page === "booking" && <CourseBookingPage setPage={setPage} course={selectedCourse} />}
      {page === "system" && <ComplianceSystemPage setPage={setPage} />}
      {page === "packages" && <PackagesPage setPage={setPage} />}
      {page === "reviews" && <ReviewsPage setPage={setPage} />}
      {page === "blog" && <BlogPage setPage={setPage} />}
      {page === "contact" && <ContactPage setPage={setPage} />}
      {page === "login" && <LoginGatewayPage setPage={setPage} />}
      {page === "adminFollowUp" && <AdminFollowUpDashboard setPage={setPage} />}
    </>
  );
}

function Homepage({ setPage, startCourseBooking }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header setPage={setPage} />
      <section className="bg-slate-950 text-white px-6 py-24 md:py-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-emerald-500/10 border border-emerald-400/30 text-emerald-200 px-4 py-2 rounded-full text-sm mb-6">
              Built for SEND transport, schools, councils and passenger transport operators
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">Training, Compliance & Digital Systems for Safe Passenger Transport</h1>
            <p className="mt-6 text-lg text-slate-300 leading-8 max-w-2xl">
              ACE MiDAS Training provides MiDAS, PATS and First Aid training alongside a paid digital compliance platform for journey reporting, medication logs, attendance, wheelchair checks and incident reporting.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={() => setPage("training")} className="bg-emerald-400 text-slate-950 px-7 py-3 rounded-xl font-bold text-center">Book Training</button>
              <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noopener noreferrer" className="border border-white/20 bg-white/5 text-white px-7 py-3 rounded-xl font-bold text-center">Subscribe for Access</a>
            </div>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="bg-slate-900 rounded-2xl p-6">
              <p className="text-sm text-slate-400">ACE Compliance Hub</p>
              <h2 className="text-2xl font-bold mt-2">Paid member access to your compliance platform</h2>
              <p className="text-slate-300 mt-3 text-sm leading-6">SaaS customers subscribe first, then access the system through the member/depot login.</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                {systemFeatures.map((feature) => (
                  <div key={feature} className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200">
                    <Icon /> <span className="ml-2">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noopener noreferrer" className="bg-emerald-400 text-slate-950 rounded-xl px-4 py-3 text-center text-sm font-bold">Subscribe for Access</a>
                <a href={DEPOT_LOGIN_URL} target="_blank" rel="noopener noreferrer" className="bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-center text-sm font-bold text-white">Member Login</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            ["Transport Training", "Certified MiDAS, PATS and First Aid training for transport operators, schools and SEND services."],
            ["Paid SaaS Platform", "Your compliance platform is delivered as part of a paid package, not as a public free tool."],
            ["Private Admin Control", "Admin controls remain private. Public users only see subscription access and member login routes."]
          ].map(([title, text]) => (
            <div key={title} className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-3 text-slate-600 leading-7">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <SectionHeading label="2026 Training Prices" title="Clear pricing for training and certification" text="Click a course to begin the booking process." />
          <CourseGrid startCourseBooking={startCourseBooking} />
        </div>
      </section>

      <section className="px-6 py-20 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <SectionHeading label="ACE Compliance Hub" title="A live compliance app behind paid member access" text="The website explains the value, sells the package and sends paying customers to the secure member login." light />
          <div className="grid sm:grid-cols-2 gap-4">
            {systemFeatures.map((feature) => (
              <div key={feature} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-200"><Icon /> <span className="ml-2">{feature}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-emerald-500 text-slate-950 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="font-semibold">Ready to talk?</p>
          <h2 className="text-3xl md:text-5xl font-bold mt-3">We would love to hear from you</h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto">Whether you need training, a group quote, or a demo of ACE Compliance Hub, get in touch and we’ll help you choose the right option.</p>
          <button type="button" onClick={() => setPage("contact")} className="mt-8 bg-slate-950 text-white px-7 py-3 rounded-xl font-bold">Go to Contact Page</button>
        </div>
      </section>
    </div>
  );
}

function CourseGrid({ startCourseBooking }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
      {trainingPrices.map((course) => (
        <button key={course.title} type="button" onClick={() => startCourseBooking(course)} className="text-left border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-emerald-500 hover:shadow-lg transition bg-white">
          <p className="text-sm text-slate-500">{course.title}</p>
          <p className="text-3xl font-bold mt-3">{course.price}</p>
          <p className="text-sm text-slate-600 mt-3">{course.note}</p>
          <p className="mt-5 text-emerald-700 font-bold">Book this course →</p>
        </button>
      ))}
    </div>
  );
}

function TrainingPage({ setPage, startCourseBooking }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header setPage={setPage} />
      <section className="bg-slate-950 text-white px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-emerald-300 font-semibold">Training Services</p>
          <h1 className="text-4xl md:text-6xl font-bold mt-3">MiDAS, PATS and First Aid training for passenger transport</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">Professional training for schools, councils, SEND transport teams, community transport providers and passenger transport operators.</p>
        </div>
      </section>
      <section className="bg-white px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <SectionHeading label="2026 Prices" title="Course pricing" text="Click a course to begin booking." />
          <CourseGrid startCourseBooking={startCourseBooking} />
        </div>
      </section>
    </div>
  );
}

function parsePriceRange(price) {
  const numbers = price.match(/\d+/g)?.map(Number) || [0];
  return numbers.length > 1 ? { low: numbers[0], high: numbers[1] } : { low: numbers[0], high: numbers[0] };
}

function CourseBookingPage({ setPage, course }) {
  const [agreement, setAgreement] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [outsideA406, setOutsideA406] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">
        <Header setPage={setPage} />
        <main className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl font-bold">No course selected</h1>
          <p className="mt-4 text-slate-600">Please choose a course from the Training page.</p>
          <button type="button" onClick={() => setPage("training")} className="mt-8 bg-slate-950 text-white px-6 py-3 rounded-xl font-bold">Back to Training</button>
        </main>
      </div>
    );
  }

  const isCappedAt12 = course.title.includes("PATS Accessible") || course.title.includes("First Aid") || course.title.includes("Children");
  const maxCap = isCappedAt12 ? 12 : 20;
  const { low, high } = parsePriceRange(course.price);
  const unitPrice = low !== high ? (quantity >= 10 ? low : high) : quantity >= 10 ? Math.round(high * 0.8) : quantity >= 5 ? Math.round(high * 0.9) : high;
  const subtotal = unitPrice * quantity;
  const travelFee = outsideA406 ? 75 : 0;
  const total = subtotal + travelFee;

  async function proceedToPayment() {
    if (agreement !== "yes") return;
    setIsLoading(true);
    setBookingError("");
    try {
      const response = await fetch(CHECKOUT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: course.title,
          quantity,
          unitPrice,
          subtotal,
          travelFee,
          total,
          outsideA406,
          agreementAccepted: true,
          refundPolicy: "No refunds for non-attendance"
        })
      });
      if (!response.ok) throw new Error("Unable to create checkout session");
      const data = await response.json();
      if (!data.url) throw new Error("Checkout URL missing");
      window.location.href = data.url;
    } catch (error) {
      setBookingError("Dynamic Stripe checkout needs the /api/create-checkout-session backend endpoint before live course payments can be taken.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header setPage={setPage} />
      <main className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-emerald-600 font-semibold">Course Booking</p>
            <h1 className="text-4xl md:text-6xl font-bold mt-3">Confirm your booking</h1>
            <p className="mt-4 text-slate-600 leading-8">Choose delegates, review the price, accept the agreement and continue to secure payment.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-12">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="font-bold text-2xl">Course Details</h2>
              <p className="mt-4 text-xl font-bold">{course.title}</p>
              <p className="text-sm text-slate-500 mt-1">{course.note}</p>
              <div className="mt-6">
                <label className="font-semibold">Number of delegates</label>
                <input type="number" min="1" max={maxCap} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(maxCap, parseInt(event.target.value, 10) || 1)))} className="mt-2 w-full border border-slate-200 rounded-xl p-3" />
                <p className="text-xs text-slate-500 mt-2">Maximum allowed for this course: {maxCap}</p>
              </div>
              <div className="mt-6">
                <label className="font-semibold">Training location</label>
                <div className="mt-2 grid sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setOutsideA406(false)} className={`px-4 py-3 rounded-xl font-bold ${!outsideA406 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>Inside A406</button>
                  <button type="button" onClick={() => setOutsideA406(true)} className={`px-4 py-3 rounded-xl font-bold ${outsideA406 ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700"}`}>Outside A406</button>
                </div>
                {outsideA406 ? <p className="text-sm text-red-600 mt-2">Travel fee applied: £75</p> : null}
              </div>
            </div>

            <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="font-bold text-2xl">Price Breakdown</h2>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between"><span className="text-slate-600">Price per delegate</span><strong>£{unitPrice}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Delegates</span><strong>{quantity}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><strong>£{subtotal}</strong></div>
                <div className="flex justify-between"><span className="text-slate-600">Travel fee</span><strong>£{travelFee}</strong></div>
                <div className="flex justify-between text-2xl border-t border-slate-100 pt-4"><span>Total</span><strong className="text-emerald-600">£{total}</strong></div>
              </div>
              <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800 leading-6">Dynamic Stripe checkout requires a backend endpoint. This page calculates the correct total first.</div>
            </div>
          </div>

          <div className="mt-10 bg-white p-7 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold">Booking Agreement</h2>
            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-5 text-sm leading-7 text-slate-700">
              <p>By selecting “Yes, I agree”, you confirm that you are authorised to book this training and that this booking forms a binding agreement between your organisation and ACE MiDAS Training.</p>
              <p className="mt-3">You agree to pay the displayed total, including any certification, learner-pass, access or travel fees clearly shown above.</p>
              <p className="mt-3 font-semibold text-slate-950">Payment confirms the booking. If delegates do not attend on the agreed training date, no refund will be issued for non-attendance.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <button type="button" onClick={() => setAgreement("yes")} className={`p-4 rounded-xl font-bold ${agreement === "yes" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"}`}>Yes, I agree</button>
              <button type="button" onClick={() => setAgreement("no")} className={`p-4 rounded-xl font-bold ${agreement === "no" ? "bg-red-600 text-white" : "bg-red-100 text-red-800"}`}>No, I do not agree</button>
            </div>
            {agreement === "no" ? <div className="mt-5 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-700">You have not agreed to the booking terms. Payment cannot continue unless you agree.</div> : null}
            {bookingError ? <p className="mt-5 text-sm text-red-600">{bookingError}</p> : null}
            <button type="button" disabled={agreement !== "yes" || isLoading} onClick={proceedToPayment} className={`mt-6 w-full p-4 rounded-xl font-bold ${agreement === "yes" && !isLoading ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>{isLoading ? "Creating secure checkout..." : "Continue to Secure Payment"}</button>
            <button type="button" onClick={() => setPage("training")} className="mt-4 w-full rounded-2xl border border-slate-200 px-6 py-4 font-bold text-slate-700">Back to Training</button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ComplianceSystemPage({ setPage }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header setPage={setPage} />
      <main>
        <section className="bg-slate-950 text-white px-6 py-24">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-emerald-300 font-semibold">ACE Compliance Hub</p>
              <h1 className="text-4xl md:text-6xl font-bold mt-3">Paid member access to your compliance platform</h1>
              <p className="mt-6 text-lg leading-8 text-slate-300">A live digital system for journey reporting, medication logs, attendance, wheelchair safety checks and incident records.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noopener noreferrer" className="bg-emerald-400 text-slate-950 px-7 py-3 rounded-xl font-bold">Subscribe for Access</a>
                <button type="button" onClick={() => setPage("contact")} className="border border-white/20 bg-white/5 text-white px-7 py-3 rounded-xl font-bold">Request Demo</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">{systemFeatures.map((feature) => <div key={feature} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-slate-200"><Icon /> <span className="ml-2">{feature}</span></div>)}</div>
          </div>
        </section>
        <section className="px-6 py-20 bg-white">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6">{painPoints.slice(0, 3).map((problem) => <div key={problem} className="bg-slate-50 rounded-3xl p-7 border border-slate-200"><h3 className="text-xl font-bold">Compliance risk</h3><p className="mt-3 text-slate-600">{problem}</p></div>)}</div>
        </section>
      </main>
    </div>
  );
}

function PackagesPage({ setPage }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header setPage={setPage} />
      <main className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto"><p className="text-emerald-600 font-semibold">Packages</p><h1 className="text-4xl md:text-6xl font-bold mt-3">Training, SaaS access and premium compliance support</h1><p className="mt-4 text-slate-600 leading-8">Choose the level of support that matches your operation.</p></div>
          <div className="grid lg:grid-cols-3 gap-6 mt-12">
            {packages.map((pack, index) => (
              <div key={pack.title} className={`bg-white border rounded-3xl p-7 shadow-sm relative ${index === 1 ? "border-emerald-500 shadow-xl" : "border-slate-200"}`}>
                {index === 1 ? <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-400 text-slate-950 px-4 py-1 rounded-full text-sm font-bold">Best Seller</div> : null}
                <h3 className="text-2xl font-bold">{pack.title}</h3><p className="text-slate-600 mt-3">{pack.text}</p><p className="text-3xl font-bold text-emerald-600 mt-6">{pack.price}</p>
                <div className="mt-6 space-y-3">{pack.points.map((point) => <div key={point} className="text-sm text-slate-700"><Icon /> <span className="ml-2">{point}</span></div>)}</div>
                {index === 1 ? <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noopener noreferrer" className="block mt-8 w-full bg-slate-950 text-white py-3 rounded-xl font-bold text-center">{pack.cta}</a> : <button type="button" onClick={() => setPage("contact")} className="block mt-8 w-full bg-slate-950 text-white py-3 rounded-xl font-bold text-center">{pack.cta}</button>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewsPage({ setPage }) {
  const reviews = [
    { name: "Transport Manager", org: "SEND Transport Provider", rating: "★★★★★", text: "The system gives us a much clearer way to evidence what happens on each journey." },
    { name: "School Operations Lead", org: "Academy Trust", rating: "★★★★★", text: "The training and compliance approach feels practical, organised and relevant to daily transport operations." },
    { name: "Compliance Lead", org: "Community Transport", rating: "★★★★★", text: "We can see how this would help us prepare records for audits and contract monitoring." }
  ];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950"><Header setPage={setPage} /><main className="px-6 py-20"><div className="max-w-7xl mx-auto"><div className="text-center max-w-3xl mx-auto"><p className="text-emerald-600 font-semibold">Reviews & Ratings</p><h1 className="text-4xl md:text-6xl font-bold mt-3">Trusted by transport and education teams</h1><p className="mt-4 text-slate-600 leading-8">A dedicated section for client feedback, ratings and case studies.</p></div><div className="grid md:grid-cols-3 gap-6 mt-12">{reviews.map((review) => <div key={review.name} className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200"><p className="text-amber-500 text-xl">{review.rating}</p><p className="mt-4 text-slate-700">“{review.text}”</p><p className="mt-6 font-bold">{review.name}</p><p className="text-sm text-slate-500">{review.org}</p></div>)}</div></div></main></div>
  );
}

function BlogPage({ setPage }) {
  const posts = [
    { title: "Why transport compliance needs more than paper records", tag: "Compliance", text: "A practical look at why daily evidence matters for SEND transport providers." },
    { title: "MiDAS, PATS and the move toward digital compliance", tag: "Training", text: "How training and digital records can work together to protect operators and passengers." },
    { title: "What councils may expect from transport providers", tag: "Contracts", text: "How audit-ready records support stronger contract monitoring and operational accountability." }
  ];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950"><Header setPage={setPage} /><main className="px-6 py-20"><div className="max-w-7xl mx-auto"><div className="max-w-3xl"><p className="text-emerald-600 font-semibold">Blog</p><h1 className="text-4xl md:text-6xl font-bold mt-3">Insights for passenger transport training and compliance</h1><p className="mt-4 text-slate-600 leading-8">Use this section to build SEO, educate clients and position ACE MiDAS Training as a compliance authority.</p></div><div className="grid md:grid-cols-3 gap-6 mt-12">{posts.map((post) => <article key={post.title} className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200"><p className="text-sm font-semibold text-emerald-600">{post.tag}</p><h2 className="text-2xl font-bold mt-3">{post.title}</h2><p className="mt-3 text-slate-600 leading-7">{post.text}</p><button className="mt-6 text-emerald-700 font-bold">Read article →</button></article>)}</div></div></main></div>
  );
}

function ContactPage({ setPage }) {
  const [formData, setFormData] = useState({ name: "", org: "", email: "", phone: "", service: "", users: "", type: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  function handleChange(event) { const { name, value } = event.target; setFormData((current) => ({ ...current, [name]: value })); }
  async function handleSubmit(event) {
    event.preventDefault(); setSubmitError("");
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!response.ok) throw new Error("Form submission failed");
      setSubmitted(true);
    } catch (error) { setSubmitError("Something went wrong. Please email info@ace-midas-training.co.uk or try again later."); }
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950"><Header setPage={setPage} /><main><section className="bg-slate-950 text-white px-6 py-24"><div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center"><div><p className="text-emerald-300 font-semibold">Contact ACE MiDAS Training</p><h1 className="text-4xl md:text-6xl font-bold mt-3">We would love to hear from you</h1><p className="mt-6 text-lg leading-8 text-slate-300 max-w-2xl">Tell us what you need, and we’ll help you with training, compliance support, group bookings or ACE Compliance Hub access.</p></div><div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-white/10"><div className="h-80 bg-gradient-to-br from-emerald-400 via-slate-200 to-slate-900 flex items-center justify-center text-center p-8"><div className="bg-white/90 rounded-3xl p-8 shadow-xl max-w-sm"><div className="text-6xl mb-4">🤝</div><h2 className="text-2xl font-bold text-slate-950">Partnership starts with a conversation</h2><p className="mt-3 text-slate-600">Use this space for your original handshake image when you add final assets.</p></div></div></div></div></section><section className="px-6 py-20 bg-emerald-500 text-slate-950"><div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-start"><div><p className="font-semibold">Prefer to contact directly?</p><h2 className="text-3xl md:text-5xl font-bold mt-3">Speak to us about your organisation</h2><p className="mt-4 text-lg max-w-2xl">We can help you decide whether you need training only, compliance system access, or a premium support package.</p><div className="mt-8 bg-slate-950 text-white rounded-3xl p-6"><h3 className="text-xl font-bold">Direct contact</h3><p className="mt-3 text-slate-300">Email: info@ace-midas-training.co.uk</p><p className="text-slate-300">Phone: 020 3633 4203 / 07570 988 597</p></div></div><div className="bg-white rounded-3xl p-7 shadow-xl border border-white/60">{submitted ? <div className="text-center py-10"><h3 className="text-2xl font-bold text-emerald-600">Enquiry Sent ✅</h3><p className="mt-3 text-slate-600">Thank you. We will contact you shortly.</p></div> : <><h3 className="text-2xl font-bold">Lead Capture Form</h3><p className="mt-2 text-slate-600 text-sm">Send your enquiry and we’ll get back to you.</p>{submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}<form onSubmit={async (event) => {
  event.preventDefault();

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
      throw new Error("Failed to save booking");
    }

    // ✅ Show success FIRST
    setSubmitted(true);

    // Try email (non-blocking)
    try {
      await fetch("/api/send-booking-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
    } catch (err) {
      console.warn("Email failed, booking still saved");
    }

  } catch (err) {
    setError(
      "Your payment was received, but the form could not be submitted. Please email info@ace-midas-training.co.uk."
    );
  }
}} className="grid gap-4 mt-6"><div className="grid sm:grid-cols-2 gap-4"><input name="name" value={formData.name} onChange={handleChange} className="border border-slate-200 rounded-xl p-3" placeholder="Full name" required /><input name="org" value={formData.org} onChange={handleChange} className="border border-slate-200 rounded-xl p-3" placeholder="Organisation name" required /></div><div className="grid sm:grid-cols-2 gap-4"><input name="email" value={formData.email} onChange={handleChange} className="border border-slate-200 rounded-xl p-3" placeholder="Email address" required /><input name="phone" value={formData.phone} onChange={handleChange} className="border border-slate-200 rounded-xl p-3" placeholder="Phone number" /></div><select name="service" value={formData.service} onChange={handleChange} className="border border-slate-200 rounded-xl p-3 bg-white"><option value="">What do you need?</option><option>MiDAS Training</option><option>PATS Training</option><option>First Aid Training</option><option>Children’s Transport First Aid</option><option>ACE Compliance Hub Demo</option><option>Compliance Bundle</option><option>Premium Compliance Partner (Request Demo)</option></select><textarea name="message" value={formData.message} onChange={handleChange} className="border border-slate-200 rounded-xl p-3" rows={5} placeholder="Tell us what you need, preferred dates, location, and whether you want training only or SaaS compliance support." /><button type="submit" className="bg-slate-950 text-white px-7 py-3 rounded-xl font-bold">Submit Enquiry</button></form></>}</div></div></section></main></div>
  );
}

function LoginGatewayContent() {
  return <div className="max-w-5xl mx-auto"><div className="text-center max-w-3xl mx-auto"><p className="text-emerald-600 font-semibold">ACE Compliance Hub Access</p><h2 className="text-4xl md:text-6xl font-bold mt-3">Member access</h2><p className="mt-4 text-slate-600 leading-8">SaaS members can log in after subscription approval. New customers should subscribe or request a demo first.</p></div><div className="grid md:grid-cols-2 gap-6 mt-12"><a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noopener noreferrer" className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200 block"><h3 className="text-2xl font-bold">Subscribe for Access</h3><p className="mt-3 text-slate-600">Start a paid subscription before accessing ACE Compliance Hub.</p></a><a href={DEPOT_LOGIN_URL} target="_blank" rel="noopener noreferrer" className="bg-white rounded-3xl p-7 shadow-sm border border-slate-200 block"><h3 className="text-2xl font-bold">Member Login</h3><p className="mt-3 text-slate-600">For approved SaaS members and depot staff.</p></a></div></div>;
}

function LoginGatewayPage({ setPage }) {
  return <div className="min-h-screen bg-slate-100 text-slate-950"><Header setPage={setPage} cta="Back to Website" ctaHref="#" /><main className="px-6 py-20"><LoginGatewayContent /></main></div>;
}

export const FOLLOW_UP_SCRIPTS = {
  whatsappInitial: `Hi [Name], it was good speaking with you earlier, I appreciate your time.\n\nBased on what you mentioned, I genuinely think the system would help you tighten up your compliance and give you proper records if ever needed.\n\nI’ll send over the next steps shortly. If anything comes to mind in the meantime, feel free to message me 👍`,
  emailSubject: `Next Steps – ACE Compliance Hub`,
  emailBody: `Hi [Name],\n\nThank you for your time earlier. Based on what you shared, ACE Compliance Hub would help centralise journey, attendance and incident records, improve accountability, and provide audit-ready evidence.\n\nKind regards,\nMarvin`,
  followUp24h: `Hi [Name], just checking in — did you get a chance to think about everything we discussed?\n\nHappy to answer any questions 👍`,
  followUp3d: `Hi [Name], just wanted to follow up. Once companies implement this, it takes pressure off knowing everything is properly recorded.`,
  followUp7d: `Hi [Name], I’ll leave it with you after this. If compliance becomes a priority, feel free to reach out anytime.`
};

function AdminFollowUpDashboard({ setPage }) {
  const [copied, setCopied] = useState("");
  const [leadName, setLeadName] = useState("");
  const scripts = ["whatsappInitial", "emailBody", "followUp24h", "followUp3d", "followUp7d"];
  function personalise(text) { return text.replaceAll("[Name]", leadName || "[Name]"); }
  async function copyScript(key) { await navigator.clipboard.writeText(personalise(FOLLOW_UP_SCRIPTS[key])); setCopied(`${key} copied`); }
  return <div className="min-h-screen bg-slate-100 text-slate-950"><Header setPage={setPage} /><main className="max-w-7xl mx-auto px-6 py-10"><h1 className="text-4xl font-bold">Sales Follow-up Scripts</h1>{copied ? <p className="mt-4 text-emerald-700 font-bold">{copied}</p> : null}<input value={leadName} onChange={(event) => setLeadName(event.target.value)} className="border border-slate-200 rounded-xl p-3 mt-6" placeholder="Lead name" /><div className="grid lg:grid-cols-2 gap-6 mt-8">{scripts.map((key) => <div key={key} className="bg-white border border-slate-200 rounded-3xl p-7"><h2 className="text-2xl font-bold">{key}</h2><pre className="mt-4 whitespace-pre-wrap bg-slate-50 rounded-2xl p-4 text-sm">{personalise(FOLLOW_UP_SCRIPTS[key])}</pre><button onClick={() => copyScript(key)} className="mt-4 bg-slate-950 text-white px-4 py-3 rounded-xl font-bold">Copy</button></div>)}</div></main></div>;
}
