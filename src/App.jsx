import React, { useState } from "react";

// Rename your uploaded files in GitHub/public/images to these clean names:
// /images/ace-logo-horizontal.jpg
// /images/ace-logo-round.png
// /images/minibus-hero.jpg
// /images/vehicle-lineup.jpg
// /images/first-aid-training.png
// /images/interior-training.jpg

const images = {
  logoHorizontal: "/images/Logo-horizontal.jpg",
  logoRound: "/images/Logo-round.png",
  minibusHero: "/images/Bus-a.jpg",
  vehicleLineup: "/images/Header-pic-a.jpg",
  firstAid: "/images/First-Aid.png",
  interior: "/images/Inside-a.jpg"
};

const courses = [
  { title: "MiDAS Training", text: "Driver awareness training for minibus and passenger transport operations.", image: images.minibusHero },
  { title: "PATS Training", text: "Passenger assistant training for staff supporting children and vulnerable passengers.", image: images.interior },
  { title: "First Aid & CTFA", text: "First Aid at Work and Children’s Transport First Aid with practical scenarios.", image: images.firstAid }
];

const stats = [
  ["MiDAS", "Driver training"],
  ["PATS", "Passenger assistant training"],
  ["CTFA", "Children’s transport first aid"],
  ["Compliance", "Digital tracking support"]
];

export default function AceMidasHomepageRedesign() {
  const [active, setActive] = useState("Training");
  const nav = ["Training", "Compliance Hub", "Reviews", "Blog", "Contact"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={images.logoRound} alt="ACE MiDAS Training logo" className="h-12 w-12 rounded-full object-contain" />
            <div>
              <p className="text-lg font-bold leading-tight">ACE MiDAS Training</p>
              <p className="text-xs text-slate-500">Training • Compliance • Passenger Transport</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {nav.map((item) => (
              <button key={item} onClick={() => setActive(item)} className={active === item ? "text-emerald-600" : "hover:text-emerald-600"}>
                {item}
              </button>
            ))}
          </nav>

          <button className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm">
            Book Training
          </button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 opacity-30">
            <img src={images.vehicleLineup} alt="Passenger transport minibuses" className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2 lg:py-32">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Built for schools, councils and passenger transport providers
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-extrabold tracking-tight md:text-6xl">
                Passenger transport training with compliance built in.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                MiDAS, PATS and First Aid training for organisations transporting children, SEND passengers and vulnerable service users — supported by digital compliance tools for safer daily operations.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button className="rounded-xl bg-emerald-400 px-7 py-4 font-bold text-slate-950 shadow-lg shadow-emerald-900/30">
                  Book Training
                </button>
                <button className="rounded-xl border border-white/20 bg-white/10 px-7 py-4 font-bold text-white backdrop-blur">
                  View Compliance Hub
                </button>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {stats.map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                    <p className="text-xl font-bold text-emerald-300">{title}</p>
                    <p className="mt-1 text-xs text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
                <img src={images.minibusHero} alt="ACE MiDAS passenger transport vehicle" className="h-[480px] w-full rounded-[1.5rem] object-cover" />
                <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-slate-950/85 p-5 backdrop-blur">
                  <p className="text-sm text-emerald-300">ACE MiDAS Training</p>
                  <p className="mt-1 text-2xl font-bold">Practical, transport-focused training.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <img src={images.logoHorizontal} alt="ACE MiDAS Training" className="max-h-24 max-w-full object-contain" />
                <h2 className="mt-8 text-3xl font-bold md:text-5xl">Training that reflects real passenger transport operations.</h2>
                <p className="mt-4 leading-8 text-slate-600">
                  Your original website identity stays at the centre — but the new homepage gives visitors a clearer journey: understand the training, see the compliance offer, then book or enquire.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {courses.map((course) => (
                  <div key={course.title} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                    <img src={course.image} alt={course.title} className="h-44 w-full object-cover" />
                    <div className="p-6">
                      <h3 className="text-xl font-bold">{course.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{course.text}</p>
                      <button className="mt-5 font-bold text-emerald-700">View course →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-100 px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm">
              <img src={images.interior} alt="Minibus passenger area" className="h-[420px] w-full rounded-[1.5rem] object-cover" />
            </div>

            <div>
              <p className="font-semibold text-emerald-700">Compliance Hub</p>
              <h2 className="mt-3 text-3xl font-bold md:text-5xl">Turn training into daily evidence.</h2>
              <p className="mt-5 leading-8 text-slate-600">
                Support your teams with journey reporting, attendance records, medication logs, wheelchair checks and incident tracking — so safety can be evidenced, not just promised.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  "Journey reporting",
                  "Medication logs",
                  "Attendance tracking",
                  "Wheelchair checks",
                  "Incident records",
                  "Audit-ready evidence"
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white p-4 font-semibold text-slate-700 shadow-sm">✔ {item}</div>
                ))}
              </div>
              <button className="mt-8 rounded-xl bg-slate-950 px-7 py-4 font-bold text-white">Explore Compliance Packages</button>
            </div>
          </div>
        </section>

        <section className="bg-emerald-600 px-6 py-20 text-slate-950">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-semibold">Ready to improve training and compliance?</p>
              <h2 className="mt-3 text-3xl font-extrabold md:text-5xl">We would love to hear from you.</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8">
                Whether you need a one-off course, group booking, or compliance support package, ACE MiDAS Training can help you build safer passenger transport practice.
              </p>
              <button className="mt-8 rounded-xl bg-slate-950 px-7 py-4 font-bold text-white">Contact ACE MiDAS Training</button>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-emerald-300 bg-white/20 p-3 shadow-xl">
              <img src={images.firstAid} alt="First aid training equipment" className="h-[360px] w-full rounded-[1.5rem] object-cover" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
