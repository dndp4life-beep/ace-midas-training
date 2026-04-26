import React, { useState } from "react";

const DEPOT_LOGIN_URL = "https://journeytracker.manus.space";
const STRIPE_SUBSCRIPTION_URL = "https://buy.stripe.com/test_9B69ATd133zdfIhbcMdIA00";

const courses = [
  { title: "MiDAS Standard", price: "£165", note: "Includes £40 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_fZucN52mp8Tx8fPft2dIA07" },
  { title: "MiDAS Accessible", price: "£210", note: "Includes £40 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_8x2aEX3qt9XBanX5SsdIA06" },
  { title: "PATS Standard", price: "£125", note: "Includes £30 CTA learner-pass charge", stripeUrl: "https://buy.stripe.com/test_fZubJ12mpglZ0Nn94EdIA05" },
  { title: "PATS Accessible", price: "£155–£185", note: "Attendance or proficiency routes", stripeUrl: "https://buy.stripe.com/test_fZubJ1bWZfhV9jT5SsdIA04" },
  { title: "First Aid at Work", price: "£205–£225", note: "Blended or 3-day classroom options", stripeUrl: "https://buy.stripe.com/test_4gM6oH1il6LpeEddkUdIA03" },
  { title: "Children’s Transport First Aid", price: "£95–£135", note: "Optional epilepsy medication module", stripeUrl: "https://buy.stripe.com/test_8x200jgdffhV67H94EdIA02" }
];

const features = ["Journey reporting","Medication tracking","Attendance recording","Wheelchair safety checklists","Incident reporting","Audit-ready records"];

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
          {nav.map((item) => <button key={item} onClick={() => setPage(item)} className={page === item ? "font-bold text-emerald-600" : "hover:text-emerald-600"}>{item}</button>)}
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
  const nums = course.price.match(/\d+/g)?.map(Number) || [0];
  const low = nums[0], high = nums[1] || nums[0];
  const unit = nums.length > 1 ? (qty >= 10 ? low : high) : qty >= 10 ? Math.round(high * 0.8) : qty >= 5 ? Math.round(high * 0.9) : high;
  const max = course.title.includes("PATS Accessible") || course.title.includes("First Aid") || course.title.includes("Children") ? 12 : 20;
  const total = unit * qty + (outside ? 75 : 0);
  return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-5xl"><h2 className="text-center text-4xl font-bold md:text-6xl">Confirm your booking</h2><div className="mt-12 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border bg-white p-7 shadow-sm"><h3 className="text-2xl font-bold">{course.title}</h3><p className="mt-2 text-slate-500">{course.note}</p><label className="mt-6 block font-semibold">Number of delegates</label><input type="number" min="1" max={max} value={qty} onChange={(e)=>setQty(Math.max(1, Math.min(max, Number(e.target.value)||1)))} className="mt-2 w-full rounded-xl border p-3"/><p className="mt-2 text-xs text-slate-500">Max allowed: {max}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><button onClick={()=>setOutside(false)} className={`rounded-xl px-4 py-3 font-bold ${!outside ? "bg-emerald-600 text-white":"bg-slate-100"}`}>Inside A406</button><button onClick={()=>setOutside(true)} className={`rounded-xl px-4 py-3 font-bold ${outside ? "bg-red-600 text-white":"bg-slate-100"}`}>Outside A406</button></div></div><div className="rounded-3xl border bg-white p-7 shadow-sm"><h3 className="text-2xl font-bold">Price Breakdown</h3><div className="mt-6 space-y-4"><div className="flex justify-between"><span>Price per delegate</span><b>£{unit}</b></div><div className="flex justify-between"><span>Delegates selected</span><b>{qty}</b></div><div className="flex justify-between"><span>Travel fee</span><b>£{outside ? 75 : 0}</b></div><div className="flex justify-between border-t pt-4 text-2xl"><span>Estimated total</span><b className="text-emerald-600">£{total}</b></div></div><div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"><strong>Important:</strong> On the next Stripe checkout page, please confirm the same number of delegates. Your booking will only be processed for the number of delegates paid for in Stripe.</div></div></div><section className="mt-10 rounded-3xl border bg-white p-7 shadow-sm"><h3 className="text-2xl font-bold">Booking Agreement</h3><p className="mt-4 text-sm leading-7 text-slate-700">By selecting “Yes, I agree”, you confirm this booking forms a binding agreement. Payment confirms the booking. No refunds for non-attendance. You must ensure the delegate quantity selected on the Stripe checkout page matches the delegate quantity selected here.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><button onClick={()=>setAgree(true)} className={`rounded-xl p-4 font-bold ${agree ? "bg-emerald-600 text-white":"bg-emerald-100 text-emerald-800"}`}>Yes, I agree</button><button onClick={()=>setAgree(false)} className="rounded-xl bg-red-100 p-4 font-bold text-red-800">No, I do not agree</button></div><button disabled={!agree} onClick={() => { if (!course.stripeUrl) { alert("No Stripe link has been added for this course yet."); return; } window.open(course.stripeUrl, "_blank", "noopener,noreferrer"); }} className={`mt-6 w-full rounded-xl p-4 font-bold ${agree ? "bg-slate-950 text-white":"bg-slate-200 text-slate-400"}`}>Continue to Stripe — confirm {qty} delegate{qty === 1 ? "" : "s"}</button><button onClick={()=>setPage("Training")} className="mt-4 w-full rounded-xl border p-4 font-bold">Back to Training</button></section></div></main>;
}

function GenericPage({ title, subtitle }) { return <main className="min-h-screen bg-slate-50 px-6 py-20"><div className="mx-auto max-w-7xl"><h2 className="text-4xl font-bold md:text-6xl">{title}</h2><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p></div></main>; }
function Contact() { return <main className="min-h-screen bg-slate-50"><section className="bg-slate-950 px-6 py-24 text-white"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2"><div><p className="font-semibold text-emerald-300">Contact ACE MiDAS Training</p><h2 className="mt-3 text-4xl font-bold md:text-6xl">We would love to hear from you</h2><p className="mt-6 text-lg text-slate-300">Tell us what you need and we’ll help with training, compliance support, group bookings or demo access.</p></div><div className="rounded-3xl bg-white/10 p-8 text-center"><div className="text-7xl">🤝</div><h3 className="mt-4 text-2xl font-bold">Partnership starts with a conversation</h3></div></div></section><section className="bg-emerald-500 px-6 py-20"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><h2 className="text-4xl font-bold">Speak to us about your organisation</h2><div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white"><p>Email: info@ace-midas-training.co.uk</p><p>Phone: 020 3633 4203 / 07570 988 597</p></div></div><form className="rounded-3xl bg-white p-7 shadow-xl"><h3 className="text-2xl font-bold">Lead Capture Form</h3><div className="mt-6 grid gap-4"><input className="rounded-xl border p-3" placeholder="Full name"/><input className="rounded-xl border p-3" placeholder="Organisation"/><input className="rounded-xl border p-3" placeholder="Email address"/><select className="rounded-xl border p-3"><option>What do you need?</option><option>MiDAS Training</option><option>PATS Training</option><option>ACE Compliance Hub Demo</option></select><textarea className="rounded-xl border p-3" rows={5} placeholder="Message"/><button type="button" className="rounded-xl bg-slate-950 p-3 font-bold text-white">Submit Enquiry</button></div></form></div></section></main>; }

export default function App() {
  const [page, setPage] = useState("Home");
  const [course, setCourse] = useState(null);
  const onBook = (c) => { setCourse(c); setPage("Booking"); };
  return <div><Header page={page} setPage={setPage}/>{page === "Home" && <Home setPage={setPage} onBook={onBook}/>} {page === "Training" && <Training onBook={onBook}/>} {page === "Booking" && <Booking course={course} setPage={setPage}/>} {page === "Compliance" && <GenericPage title="ACE Compliance Hub" subtitle="Paid member access to your compliance platform with journey reporting, medication logs, attendance, wheelchair checks and incident reporting."/>} {page === "Packages" && <GenericPage title="Packages" subtitle="Choose training only, Compliance Bundle, or Premium Compliance Partner."/>} {page === "Reviews" && <GenericPage title="Reviews & Ratings" subtitle="A dedicated section for testimonials, case studies and star ratings."/>} {page === "Blog" && <GenericPage title="Blog" subtitle="Insights for passenger transport training, compliance and SEND transport operations."/>} {page === "Contact" && <Contact/>}</div>;
}
