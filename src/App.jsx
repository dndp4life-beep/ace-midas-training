import React, { useEffect, useState } from "react";

const DEPOT_LOGIN_URL = "https://journeytracker.manus.space";
const STRIPE_SUBSCRIPTION_URL = "https://buy.stripe.com/test_9B69ATd133zdfIhbcMdIA00";
const CHECKOUT_API_URL = "/api/create-checkout-session";
const BOOKING_DETAILS_ENDPOINT = "https://formspree.io/f/mykloeon";
const BOOKING_CONFIRMATION_API = "/api/send-booking-confirmation";

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

const homepageCourseCards = [
  { title: "MiDAS Training", text: "Driver awareness training for minibus and passenger transport operations.", image: images.minibusHero },
  { title: "PATS Training", text: "Passenger assistant training for staff supporting children and vulnerable passengers.", image: images.interior },
  { title: "First Aid & CTFA", text: "First Aid at Work and Children’s Transport First Aid with practical scenarios.", image: images.firstAid }
];

const features = [
  "Journey reporting",
  "Medication logs",
  "Attendance tracking",
  "Wheelchair checks",
  "Incident records",
  "Audit-ready evidence"
];

const stats = [
  ["MiDAS", "Driver training"],
  ["PATS", "Passenger assistant training"],
  ["CTFA", "Children’s transport first aid"],
  ["Compliance", "Digital tracking support"]
];

const demoMembers = [
  {
    email: "depot@example.com",
    organisation: "Demo Transport Provider",
    role: "Depot Manager",
    access: {
      officeDepotSite: "https://journeytracker.manus.space/depot-login",
      roadStaffApp: "https://journeytracker.manus.space/journey-reporting"
    }
  },
  {
    email: "roadstaff@example.com",
    organisation: "Demo Transport Provider",
    role: "Road Staff",
    access: {
      officeDepotSite: "https://journeytracker.manus.space/depot-login",
      roadStaffApp: "https://journeytracker.manus.space/journey-reporting"
    }
  }
];

function Header({ page, setPage }) {
  const nav = ["Home", "Training", "Compliance", "Reviews", "Blog", "Contact"];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button type="button" onClick={() => setPage("Home")} className="flex items-center gap-3 text-left">
          <img src={images.logoRound} alt="ACE MiDAS Training logo" className="h-12 w-12 rounded-full object-contain" />
          <div>
            <p className="text-lg font-bold leading-tight text-slate-950">ACE MiDAS Training</p>
            <p className="text-xs text-slate-500">Training • Compliance • Passenger Transport</p>
          </div>
        </button>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {nav.map((item) => (
            <button key={item} type="button" onClick={() => setPage(item)} className={page === item ? "text-emerald-600" : "hover:text-emerald-600"}>
              {item}
            </button>
          ))}
        </nav>

        <button type="button" onClick={() => setPage("Login")} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm">
          Member Login
        </button>
      </div>
    </header>
  );
}

function HomePage({ setPage }) {
  const trustPoints = ["Council & school transport focused", "SEND passenger safety", "Training + digital compliance", "Built for real operators"];
  const processSteps = [
    { title: "1. Book training", text: "Choose MiDAS, PATS, First Aid or CTFA and pay securely online." },
    { title: "2. Confirm dates", text: "Submit preferred training dates after payment and receive confirmation." },
    { title: "3. Evidence compliance", text: "Use ACE Compliance Hub to record journeys, incidents, medication and attendance." }
  ];

  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[88vh] overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <img src={images.vehicleLineup} alt="Passenger transport fleet" className="h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/30" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200 shadow-lg shadow-emerald-950/20 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              MiDAS • PATS • First Aid • Compliance Hub
            </div>

            <h1 className="mt-7 max-w-5xl text-5xl font-black tracking-tight md:text-7xl">
              Safer passenger transport starts with better training and better evidence.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Practical transport-focused training for schools, councils and operators — supported by a digital compliance hub for journey reporting, medication logs, attendance, wheelchair checks and incident evidence.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => setPage("Training")} className="rounded-2xl bg-emerald-400 px-8 py-4 text-lg font-black text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:-translate-y-1 hover:bg-emerald-300">
                Book Training
              </button>
              <button type="button" onClick={() => setPage("Compliance")} className="rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white shadow-xl backdrop-blur transition hover:-translate-y-1 hover:bg-white/15">
                Explore Compliance Hub
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur transition hover:bg-white/15">
                  <p className="text-2xl font-black text-emerald-300">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative rotate-2 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur transition hover:rotate-0">
              <img src={images.minibusHero} alt="ACE MiDAS minibus training" className="h-[520px] w-full rounded-[2rem] object-cover" />
              <div className="absolute bottom-8 left-8 right-8 rounded-3xl border border-white/10 bg-slate-950/85 p-6 shadow-xl backdrop-blur">
                <p className="text-sm font-semibold text-emerald-300">ACE MiDAS Training</p>
                <p className="mt-1 text-3xl font-black">Training that matches real transport operations.</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">Built around the daily realities of SEND, school and passenger transport services.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto grid max-w-7xl gap-3 text-center text-sm font-bold text-slate-600 md:grid-cols-4">
          {trustPoints.map((point) => <div key={point} className="rounded-2xl bg-slate-50 px-4 py-3">✔ {point}</div>)}
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <img src={images.logoHorizontal} alt="ACE MiDAS Training" className="max-h-24 max-w-full object-contain" />
              <p className="mt-8 font-semibold text-emerald-700">Training services</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">One provider for training, booking and compliance evidence.</h2>
              <p className="mt-5 max-w-2xl leading-8 text-slate-600">
                Keep the familiar ACE MiDAS Training identity, but present it with a stronger commercial journey: training first, compliance support next, then a clear route to book or enquire.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {homepageCourseCards.map((course) => (
                <button key={course.title} type="button" onClick={() => setPage("Training")} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 text-left shadow-sm transition hover:-translate-y-2 hover:shadow-2xl">
                  <div className="overflow-hidden">
                    <img src={course.image} alt={course.title} className="h-48 w-full object-cover transition duration-500 group-hover:scale-110" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-black">{course.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{course.text}</p>
                    <p className="mt-5 font-black text-emerald-700">View course →</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-100 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-semibold text-emerald-700">How it works</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">A simple journey from booking to evidence.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {processSteps.map((step) => (
              <div key={step.title} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <h3 className="text-2xl font-black">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-3 shadow-2xl">
            <img src={images.interior} alt="Minibus passenger area" className="h-[440px] w-full rounded-[2rem] object-cover" />
          </div>

          <div>
            <p className="font-semibold text-emerald-300">Compliance Hub</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Turn daily transport activity into audit-ready records.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Give depots, road staff and managers a controlled way to record what happens on transport services — with member access, role-based usage and evidence that supports safer operations.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 font-semibold text-slate-200">✔ {item}</div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => setPage("Compliance")} className="rounded-2xl bg-emerald-400 px-7 py-4 font-black text-slate-950">View Packages</button>
              <button type="button" onClick={() => setPage("Membership")} className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Member Access</button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-semibold text-emerald-700">First Aid and CTFA</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Training that feels practical, relevant and memorable.</h2>
            <p className="mt-5 leading-8 text-slate-600">
              Use real scenarios and practical demonstrations to support transport staff, passenger assistants and organisations working with children and vulnerable passengers.
            </p>
            <button type="button" onClick={() => setPage("Training")} className="mt-8 rounded-2xl bg-slate-950 px-7 py-4 font-black text-white">Book First Aid Training</button>
          </div>
          <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-slate-50 p-3 shadow-xl">
            <img src={images.firstAid} alt="First aid training equipment" className="h-[420px] w-full rounded-[2rem] object-cover" />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-emerald-600 px-6 py-20 text-slate-950">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-slate-950/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-bold">Ready to replace paper-heavy processes?</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Let’s build safer transport practice together.</h2>
            <p className="mt-5 max-w-2xl text-lg leading-8">
              Book training, request a compliance demo, or speak to us about a premium setup for your depot, site or organisation.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button type="button" onClick={() => setPage("Training")} className="rounded-2xl bg-slate-950 px-7 py-4 font-black text-white">Book Training</button>
              <button type="button" onClick={() => setPage("Contact")} className="rounded-2xl border border-slate-950/20 bg-white/30 px-7 py-4 font-black text-slate-950">Contact Us</button>
            </div>
          </div>
          <div className="overflow-hidden rounded-[2.5rem] border border-emerald-300 bg-white/20 p-3 shadow-2xl">
            <img src={images.handshake} alt="Partnership handshake" className="h-[360px] w-full rounded-[2rem] object-cover" />
          </div>
        </div>
      </section>
    </main>
  );
}

function TrainingPage({ startBooking }) {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="font-semibold text-emerald-700">Training Services</p>
            <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Book MiDAS, PATS, FAW or Children’s Transport First Aid.</h1>
            <p className="mt-5 leading-8 text-slate-600">
              Choose a course, select the number of delegates, review the agreement, and continue to secure payment.
            </p>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
            <img src={images.vehicleLineup} alt="Passenger transport fleet" className="h-[360px] w-full rounded-[1.5rem] object-cover" />
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50 p-7 shadow-sm">
          <p className="font-semibold text-emerald-700">Essential Training</p>
          <h2 className="mt-2 text-3xl font-bold">Pay per course</h2>
          <p className="mt-3 text-slate-700">
            Book MiDAS, PATS, First Aid at Work or Children’s Transport First Aid training for individuals or groups.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <p>✔ Course booking</p>
            <p>✔ Certification support</p>
            <p>✔ Group booking options</p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {trainingCourses.map((course) => (
            <button key={course.title} type="button" onClick={() => startBooking(course)} className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-500 hover:shadow-lg">
              <img src={course.image} alt={course.title} className="h-44 w-full object-cover" />
              <div className="p-6">
                <p className="text-sm text-slate-500">{course.title}</p>
                <p className="mt-3 text-3xl font-bold">{course.price}</p>
                <p className="mt-3 text-sm text-slate-600">{course.note}</p>
                <p className="mt-5 font-bold text-emerald-700">Book this course →</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

function BookingPage({ course, setPage }) {
  const [qty, setQty] = useState(1);
  const [outside, setOutside] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20 text-center">
        <h1 className="text-4xl font-bold">No course selected</h1>
        <button type="button" onClick={() => setPage("Training")} className="mt-8 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Training</button>
      </main>
    );
  }

  const nums = course.price.match(/\d+/g)?.map(Number) || [0];
  const low = nums[0];
  const high = nums[1] || nums[0];
  const max = course.title.includes("PATS Accessible") || course.title.includes("First Aid") || course.title.includes("Children") ? 12 : 20;
  const discountTier = qty >= 9 ? "9–12 delegates" : qty >= 4 ? "4–8 delegates" : "1–3 delegates";
  const discountLabel = qty >= 9 ? "20% group discount" : qty >= 4 ? "10% small group discount" : "Standard rate";
  const unit = nums.length > 1 ? (qty >= 9 ? low : qty >= 4 ? Math.round(high * 0.9) : high) : qty >= 9 ? Math.round(high * 0.8) : qty >= 4 ? Math.round(high * 0.9) : high;
  const savingPerDelegate = Math.max(0, high - unit);
  const travelFee = outside ? 75 : 0;
  const subtotal = unit * qty;
  const total = subtotal + travelFee;

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
          subtotal,
          travelFee,
          total,
          outsideA406: outside,
          agreementAccepted: true,
          refundPolicy: "No refunds for non-attendance"
        })
      });

      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to create Stripe checkout");
      window.location.href = data.url;
    } catch (error) {
      setPaymentError(error.message || "Unable to create Stripe checkout. Please try again or contact ACE MiDAS Training.");
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="font-semibold text-emerald-700">Course Booking</p>
          <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Confirm your booking</h1>
          <p className="mt-4 text-slate-600">Select delegates, review the cost, accept the agreement and continue to secure payment.</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold">{course.title}</h2>
            <p className="mt-2 text-slate-500">{course.note}</p>

            <label className="mt-6 block font-semibold">Number of delegates</label>
            <input type="number" min="1" max={max} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} className="mt-2 w-full rounded-xl border p-3" />
            <p className="mt-2 text-xs text-slate-500">Maximum allowed for this course: {max}</p>

            <div className="mt-6">
              <p className="font-semibold">Training location</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setOutside(false)} className={`rounded-xl px-4 py-3 font-bold ${!outside ? "bg-emerald-600 text-white" : "bg-slate-100"}`}>Inside A406</button>
                <button type="button" onClick={() => setOutside(true)} className={`rounded-xl px-4 py-3 font-bold ${outside ? "bg-red-600 text-white" : "bg-slate-100"}`}>Outside A406</button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold">Price Breakdown</h2>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between"><span>Price per delegate</span><div className="text-right">{savingPerDelegate > 0 ? <p className="text-sm line-through text-slate-400">£{high}</p> : null}<b>£{unit}</b></div></div>
              <div className="flex justify-between"><span>Discount tier</span><b>{discountTier} — {discountLabel}</b></div>
              <div className="flex justify-between"><span>Delegates selected</span><b>{qty}</b></div>
              <div className="flex justify-between"><span>Training subtotal</span><b>£{subtotal}</b></div>
              <div className="flex justify-between"><span>Travel fee</span><b>£{travelFee}</b></div>
              <div className="flex justify-between border-t pt-4 text-2xl"><span>Total</span><b className="text-emerald-600">£{total}</b></div>
              {savingPerDelegate > 0 ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">You’re saving £{savingPerDelegate * qty} on this booking.</p> : null}
            </div>
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
              <strong>Locked quantity:</strong> Stripe will charge for exactly {qty} delegate{qty === 1 ? "" : "s"}.
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-3xl border bg-white p-7 shadow-sm">
          <h2 className="text-2xl font-bold">Booking Agreement</h2>
          <p className="mt-4 text-sm leading-7 text-slate-700">
            By selecting “Yes, I agree”, you confirm this booking forms a binding agreement. Payment confirms the booking. No refunds for non-attendance. Stripe will charge the exact number of delegates selected on this page.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <button type="button" onClick={() => setAgree(true)} className={`rounded-xl p-4 font-bold ${agree ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"}`}>Yes, I agree</button>
            <button type="button" onClick={() => setAgree(false)} className="rounded-xl bg-red-100 p-4 font-bold text-red-800">No, I do not agree</button>
          </div>
          {paymentError ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{paymentError}</p> : null}
          <button type="button" disabled={!agree || isLoading} onClick={continueToPayment} className={`mt-6 w-full rounded-xl p-4 font-bold ${agree && !isLoading ? "bg-slate-950 text-white" : "bg-slate-200 text-slate-400"}`}>
            {isLoading ? "Creating secure checkout..." : `Continue to Secure Payment — £${total}`}
          </button>
          <button type="button" onClick={() => setPage("Training")} className="mt-4 w-full rounded-xl border p-4 font-bold">Back to Training</button>
        </section>
      </div>
    </main>
  );
}

function BookingConfirmationPage({ setPage }) {
  const [form, setForm] = useState({ name: "", organisation: "", email: "", phone: "", course: "", delegates: "", location: "", preferredDate1: "", preferredDate2: "", preferredDate3: "", notes: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(BOOKING_DETAILS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "Post-payment training date selection", ...form })
      });
      if (!response.ok) throw new Error("Failed to save booking");

      setSubmitted(true);

      try {
        await fetch(BOOKING_CONFIRMATION_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
      } catch (emailError) {
        console.warn("Email failed, booking still saved");
      }
    } catch (err) {
      setError("Your payment was received, but the form could not be submitted. Please email info@ace-midas-training.co.uk with your preferred dates.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-emerald-500 p-8 text-center text-slate-950 shadow-sm">
          <p className="font-semibold">Payment received</p>
          <h1 className="mt-3 text-4xl font-bold md:text-6xl">Booking received ✅</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg">Please now select your preferred training dates so we can confirm availability.</p>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold">What happens next?</h2>
            <div className="mt-6 space-y-4 text-slate-700">
              <p>✔ Submit your preferred dates.</p>
              <p>✔ We check trainer availability.</p>
              <p>✔ You receive final confirmation and joining instructions.</p>
              <p>✔ Preferred dates are requested dates, not guaranteed until confirmed.</p>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Non-attendance is non-refundable once a confirmed date has been agreed.</div>
          </div>

          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            {submitted ? (
              <div className="py-10 text-center">
                <h2 className="text-2xl font-bold text-emerald-600">Preferred dates submitted ✅</h2>
                <p className="mt-3 text-slate-600">We will review your request and contact you shortly. A booking summary email should also be sent to the customer email address provided.</p>
                <button type="button" onClick={() => setPage("Home")} className="mt-6 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Back to Home</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <h2 className="text-2xl font-bold">Select preferred dates</h2>
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
                    {trainingCourses.map((item) => <option key={item.title}>{item.title}</option>)}
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

function CompliancePage({ setPage }) {
  const packs = [
    { title: "Compliance Bundle", price: "From £495/month", text: "Training plus paid access to ACE Compliance Hub for daily compliance tracking.", points: ["Member/depot access", "Journey reporting", "Medication and attendance records", "Incident and wheelchair checklists"], cta: "Subscribe for Access" },
    { title: "Premium Compliance Partner", price: "From £1,200/month", text: "Full setup, onboarding and compliance support for larger operators.", points: ["Depot setup", "Staff onboarding", "Quarterly compliance review", "Priority support"], cta: "Request Demo" }
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-semibold text-emerald-300">ACE Compliance Hub</p>
            <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Compliance software and support for passenger transport teams.</h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">Combine your training with live digital records for journeys, medication, attendance, wheelchair checks and incidents.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">Subscribe for Access</a>
              <button type="button" onClick={() => setPage("Contact")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">Request Demo</button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => <div key={feature} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-200">✔ {feature}</div>)}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-semibold text-emerald-700">Compliance Packages</p>
            <h2 className="mt-3 text-4xl font-bold md:text-6xl">Choose SaaS access or full compliance partnership.</h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {packs.map((pack, index) => (
              <div key={pack.title} className={`rounded-3xl border bg-white p-7 shadow-sm ${index === 0 ? "border-emerald-500 shadow-xl" : "border-slate-200"}`}>
                <h3 className="text-2xl font-bold">{pack.title}</h3>
                <p className="mt-3 text-slate-600">{pack.text}</p>
                <p className="mt-6 text-3xl font-bold text-emerald-600">{pack.price}</p>
                <div className="mt-6 space-y-3">{pack.points.map((point) => <p key={point} className="text-sm text-slate-700">✔ {point}</p>)}</div>
                {index === 0 ? <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="mt-8 block rounded-xl bg-slate-950 py-3 text-center font-bold text-white">{pack.cta}</a> : <button type="button" onClick={() => setPage("Contact")} className="mt-8 w-full rounded-xl bg-slate-950 py-3 font-bold text-white">{pack.cta}</button>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function MembershipPage({ setPage }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-semibold text-emerald-300">Member Access</p>
            <h1 className="mt-3 text-4xl font-extrabold md:text-6xl">Secure access to your compliance platform.</h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              ACE Compliance Hub access is provided to approved member organisations only. Each organisation receives its own depot/site access and user credentials after subscription and onboarding.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href={STRIPE_SUBSCRIPTION_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-400 px-7 py-4 text-center font-bold text-slate-950">
                Subscribe for Access
              </a>
              <button type="button" onClick={() => setPage("Login")} className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white">
                Existing Member Login
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-7 shadow-xl backdrop-blur">
            <h2 className="text-2xl font-bold">Access is protected</h2>
            <div className="mt-6 space-y-4 text-slate-200">
              <p>✔ Organisation-specific login credentials</p>
              <p>✔ Depot/site access controlled per member</p>
              <p>✔ User roles for admin, depot and road staff</p>
              <p>✔ Two-factor authentication recommended</p>
              <p>✔ Device/session monitoring and access logs</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border bg-white p-7 shadow-sm">
              <h3 className="text-2xl font-bold">1. Subscribe</h3>
              <p className="mt-3 text-slate-600">The organisation subscribes or requests premium setup.</p>
            </div>
            <div className="rounded-3xl border bg-white p-7 shadow-sm">
              <h3 className="text-2xl font-bold">2. Onboarding</h3>
              <p className="mt-3 text-slate-600">We collect depot/site requirements, users, routes and compliance needs.</p>
            </div>
            <div className="rounded-3xl border bg-white p-7 shadow-sm">
              <h3 className="text-2xl font-bold">3. Secure Access</h3>
              <p className="mt-3 text-slate-600">Approved users receive credentials and access only to their organisation’s portal.</p>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-7 text-amber-900">
            <h3 className="text-2xl font-bold">Important security note</h3>
            <p className="mt-3 leading-7">
              The live app link should not be publicly displayed. Member access should be handled through a proper authentication system with roles, 2FA, secure sessions and organisation-level access control.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoginPage({ setPage, setLoggedInMember }) {
  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pendingMember, setPendingMember] = useState(null);

  function handleCredentials(event) {
    event.preventDefault();
    setError("");

    if (!email.includes("@") || password.length < 6) {
      setError("Please enter a valid email address and a password of at least 6 characters.");
      return;
    }

    const matchedMember = demoMembers.find((item) => item.email.toLowerCase() === email.toLowerCase());
    const fallbackMember = {
      email,
      organisation: "Demo Member Organisation",
      role: email.toLowerCase().includes("road") ? "Road Staff" : "Depot Manager",
      access: {
        officeDepotSite: "https://journeytracker.manus.space/depot-login",
        roadStaffApp: "https://journeytracker.manus.space/journey-reporting"
      }
    };

    setPendingMember(matchedMember || fallbackMember);
    setStep("verification");
  }

  function handleVerification(event) {
    event.preventDefault();
    setError("");

    if (code !== "123456") {
      setError("Demo verification code is 123456. In production this would be sent by email or SMS.");
      return;
    }

    setLoggedInMember(pendingMember);
    setPage("MemberDashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="font-semibold text-emerald-700">Secure Member Login</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Access your organisation’s compliance portal.</h1>
          <p className="mt-5 leading-8 text-slate-600">
            Members should only access the system through a secure login. Each organisation can be given its own roles, app links and access permissions.
          </p>

          <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
            <strong>Demo mode:</strong> This front-end login proves the customer journey. For live security, connect Supabase or Clerk so passwords, sessions, 2FA, roles and access logs are handled safely.
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl">
          {step === "credentials" ? (
            <form onSubmit={handleCredentials} className="grid gap-4">
              <h2 className="text-3xl font-black">Member Login</h2>
              <p className="text-sm text-slate-500">Enter your member credentials to continue.</p>
              {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border p-4" placeholder="Email address" required />
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl border p-4" placeholder="Password" required />
              <button type="submit" className="rounded-xl bg-slate-950 p-4 font-black text-white">Continue</button>
              <button type="button" onClick={() => setPage("Membership")} className="rounded-xl border p-4 font-bold text-slate-700">Need access? View Membership</button>
            </form>
          ) : (
            <form onSubmit={handleVerification} className="grid gap-4">
              <h2 className="text-3xl font-black">Two-step verification</h2>
              <p className="text-sm text-slate-500">Enter the verification code sent to your registered email or phone.</p>
              {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <input value={code} onChange={(event) => setCode(event.target.value)} className="rounded-xl border p-4 text-center text-2xl tracking-[0.4em]" placeholder="123456" maxLength={6} required />
              <button type="submit" className="rounded-xl bg-emerald-600 p-4 font-black text-white">Verify & Enter Portal</button>
              <button type="button" onClick={() => setStep("credentials")} className="rounded-xl border p-4 font-bold text-slate-700">Back</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function MemberDashboardPage({ member, setPage }) {
  const [copied, setCopied] = useState("");

  if (!member) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20 text-center">
        <h1 className="text-4xl font-bold">Login required</h1>
        <button type="button" onClick={() => setPage("Login")} className="mt-8 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">Go to Login</button>
      </main>
    );
  }

  const accessLinks = [
    {
      title: "Office / Depot / Site Login",
      description: "For depot managers, site administrators and office staff who need to monitor journeys, users and compliance records.",
      url: member.access?.officeDepotSite || "https://journeytracker.manus.space/depot-login"
    },
    {
      title: "Road Staff App",
      description: "For drivers, passenger assistants and road staff who need to submit journey reports and live operational records.",
      url: member.access?.roadStaffApp || "https://journeytracker.manus.space/journey-reporting"
    }
  ];

  async function copyLink(label, url) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(`${label} copied`);
    } catch (error) {
      setCopied("Could not copy link. Please open it and copy from the browser.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <p className="font-semibold text-emerald-300">Member Dashboard</p>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">Welcome, {member.organisation}</h1>
          <p className="mt-4 text-slate-300">Signed in as: {member.role}</p>
        </div>

        {copied ? <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{copied}</p> : null}

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {accessLinks.map((link) => (
            <div key={link.title} className="rounded-3xl border bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold">{link.title}</h2>
              <p className="mt-3 text-slate-600">{link.description}</p>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm break-all text-slate-600">{link.url}</div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <a href={link.url} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-600 p-4 text-center font-black text-white">Open</a>
                <button type="button" onClick={() => copyLink(link.title, link.url)} className="rounded-xl border border-slate-200 p-4 font-bold text-slate-700">Copy URL</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold">Customer-specific access</h2>
            <p className="mt-3 text-slate-600">Each member can later be assigned their own portal URLs, custom subdomain or dedicated app workspace.</p>
          </div>

          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold">Security status</h2>
            <div className="mt-4 space-y-3 text-slate-700">
              <p>✔ Two-step verification demo enabled</p>
              <p>✔ Organisation access assigned</p>
              <p>✔ Role-based access options</p>
              <p>⚠ Real device/IP logs require backend auth</p>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-7 shadow-sm">
            <h2 className="text-2xl font-bold">Need changes?</h2>
            <p className="mt-3 text-slate-600">Request new users, depot changes, extra roles or portal setup support.</p>
            <button type="button" onClick={() => setPage("Contact")} className="mt-6 w-full rounded-xl bg-slate-950 p-4 font-bold text-white">Request Support</button>
          </div>
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
          <h1 className="mt-3 text-4xl font-bold md:text-6xl">Trusted by transport and education teams</h1>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => <div key={review.name} className="rounded-3xl border bg-white p-7 shadow-sm"><p className="text-xl text-amber-500">{review.rating}</p><p className="mt-4 text-slate-700">“{review.text}”</p><p className="mt-6 font-bold">{review.name}</p><p className="text-sm text-slate-500">{review.org}</p></div>)}
        </div>
      </div>
    </main>
  );
}

function BlogPage() {
  const posts = [
    { tag: "Compliance", title: "Why transport compliance needs more than paper records", text: "A practical look at why daily evidence matters for SEND transport providers." },
    { tag: "Training", title: "MiDAS, PATS and digital compliance", text: "How training and digital records work together to protect operators and passengers." },
    { tag: "Contracts", title: "What councils may expect from transport providers", text: "How audit-ready records support stronger contract monitoring and accountability." }
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <p className="font-semibold text-emerald-600">Blog</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-bold md:text-6xl">Insights for passenger transport training and compliance</h1>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.map((post) => <article key={post.title} className="rounded-3xl border bg-white p-7 shadow-sm"><p className="text-sm font-semibold text-emerald-600">{post.tag}</p><h2 className="mt-3 text-2xl font-bold">{post.title}</h2><p className="mt-3 text-slate-600">{post.text}</p><button className="mt-6 font-bold text-emerald-700">Read article →</button></article>)}
        </div>
      </div>
    </main>
  );
}

function ContactPage() {
  const [form, setForm] = useState({ name: "", organisation: "", email: "", phone: "", service: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(BOOKING_DETAILS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formType: "General lead capture", ...form })
      });
      if (!response.ok) throw new Error("Unable to submit form");
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please email info@ace-midas-training.co.uk or try again later.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-semibold text-emerald-300">Contact ACE MiDAS Training</p>
            <h1 className="mt-3 text-4xl font-bold md:text-6xl">We would love to hear from you</h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">Tell us what you need and we’ll help with training, compliance support, group bookings or demo access.</p>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-3 shadow-xl">
            <img src={images.handshake} alt="Handshake" className="h-[360px] w-full rounded-[1.5rem] object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-emerald-500 px-6 py-20 text-slate-950">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl font-bold">Speak to us about your organisation</h2>
            <p className="mt-4 text-lg">We can help you decide whether you need training only, compliance system access, or a premium support package.</p>
            <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
              <h3 className="text-xl font-bold">Direct contact</h3>
              <p className="mt-3 text-slate-300">Email: info@ace-midas-training.co.uk</p>
              <p className="text-slate-300">Phone: 020 3633 4203 / 07570 988 597</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-xl">
            {submitted ? <div className="py-10 text-center"><h2 className="text-2xl font-bold text-emerald-600">Enquiry sent ✅</h2><p className="mt-3 text-slate-600">Thank you. We will contact you shortly.</p></div> : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <h2 className="text-2xl font-bold">Lead Capture Form</h2>
                {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
                <input name="name" value={form.name} onChange={updateField} className="rounded-xl border p-3" placeholder="Full name" required />
                <input name="organisation" value={form.organisation} onChange={updateField} className="rounded-xl border p-3" placeholder="Organisation" required />
                <input name="email" value={form.email} onChange={updateField} className="rounded-xl border p-3" placeholder="Email address" required />
                <input name="phone" value={form.phone} onChange={updateField} className="rounded-xl border p-3" placeholder="Phone number" />
                <select name="service" value={form.service} onChange={updateField} className="rounded-xl border p-3" required>
                  <option value="">What do you need?</option>
                  <option>MiDAS Training</option>
                  <option>PATS Training</option>
                  <option>First Aid Training</option>
                  <option>Children’s Transport First Aid</option>
                  <option>ACE Compliance Hub Demo</option>
                  <option>Premium Compliance Partner</option>
                </select>
                <textarea name="message" value={form.message} onChange={updateField} className="rounded-xl border p-3" rows={5} placeholder="Tell us what you need." />
                <button type="submit" className="rounded-xl bg-slate-950 p-4 font-bold text-white">Submit Enquiry</button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState("Home");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loggedInMember, setLoggedInMember] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success" || params.get("success") === "true") {
      setPage("BookingConfirmation");
    }
  }, []);

  function startBooking(course) {
    setSelectedCourse(course);
    setPage("Booking");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Header page={page} setPage={setPage} />
      {page === "Home" && <HomePage setPage={setPage} />}
      {page === "Training" && <TrainingPage startBooking={startBooking} />}
      {page === "Booking" && <BookingPage course={selectedCourse} setPage={setPage} />}
      {page === "BookingConfirmation" && <BookingConfirmationPage setPage={setPage} />}
      {page === "Compliance" && <CompliancePage setPage={setPage} />}
      {page === "Membership" && <MembershipPage setPage={setPage} />}
      {page === "Login" && <LoginPage setPage={setPage} setLoggedInMember={setLoggedInMember} />}
      {page === "MemberDashboard" && <MemberDashboardPage member={loggedInMember} setPage={setPage} />}
      {page === "Reviews" && <ReviewsPage />}
      {page === "Blog" && <BlogPage />}
      {page === "Contact" && <ContactPage />}
    </div>
  );
}
