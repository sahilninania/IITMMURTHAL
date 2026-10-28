
import { useState } from "react";


import PersonalHealthChat from "./components/PersonalHealthChat.jsx";
import MedicalReportAnalyzer from "./components/MedicalReportAnalyzer.jsx";
import PatientHealthMonitor from "./components/PatientHealthMonitor.jsx";
import HealthReminders from "./components/HealthReminders";
import PatientDemoData from "./components/PatientDemoData";
import DoctorHealthAnalysis from "./components/DoctorHealthAnalysis";
import GeneticHealthDemo from "./components/GeneticHealthDemo";
import AppointmentPage from "./pages/AppointmentPage";
import DoctorAppointmentRequests from "./pages/DoctorAppointmentRequests";
import "./pages/appointments.css";
import {
  Activity, ArrowRight, Bell, BrainCircuit, Building2,
  CalendarDays, CheckCircle2, ChevronRight, ClipboardList,
  Clock3, FileText, HeartPulse, Hospital, LayoutDashboard,
  LockKeyhole, LogOut, Menu, MessageCircle, Search,
  ShieldCheck, Stethoscope, UserRound, Users, X,
} from "lucide-react";
 

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const demoTasks = [
  { title: "Laboratory report review", patient: "Demo patient A", department: "Pathology", due: "Today", status: "Needs review", color: "amber" },
  { title: "Cardiology follow-up", patient: "Demo patient B", department: "Cardiology", due: "Overdue", status: "Overdue", color: "rose" },
  { title: "Specialist referral", patient: "Demo patient C", department: "Neurology", due: "Tomorrow", status: "Upcoming", color: "emerald" },
  { title: "Prescription review", patient: "Demo patient D", department: "General Medicine", due: "Today", status: "Pending", color: "blue" },
];

const features = [
  { icon: Users, title: "Smart patient records", text: "Keep patient details, reports, referrals and care activities organized." },
  { icon: BrainCircuit, title: "AI care coordinator", text: "Identify missed steps and suggest next actions for staff review." },
  { icon: CalendarDays, title: "Follow-up tracking", text: "Track appointments, pending tests, referrals and overdue tasks." },
  { icon: MessageCircle, title: "AI health assistant", text: "Help patients understand health information in accessible language." },
];

function Logo({ small = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${small ? "h-10 w-10" : "h-12 w-12"} grid shrink-0 place-items-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-900/10`}>
        <HeartPulse size={small ? 21 : 25} />
      </div>
      <div>
        <p className={`${small ? "text-base" : "text-lg"} font-extrabold tracking-tight text-slate-900`}>
          Jeevan Rakshak <span className="text-teal-700">AI</span>
        </p>
        <p className="text-xs text-slate-500">Intelligent Hospital Care</p>
      </div>
    </div>
  );
}

function Navbar({ onLogin, loggedIn = false, onDashboard }) {
  const [open, setOpen] = useState(false);

  function go(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Go home">
          <Logo />
        </button>

        <div className="hidden items-center gap-7 md:flex">
          <button onClick={() => go("home")} className="text-sm font-medium text-slate-600 hover:text-teal-700">Home</button>
          <button onClick={() => go("features")} className="text-sm font-medium text-slate-600 hover:text-teal-700">Features</button>
          <button onClick={loggedIn ? onDashboard : () => go("workflow")} className="text-sm font-medium text-slate-600 hover:text-teal-700">
            {loggedIn ? "Dashboard" : "How it works"}
          </button>
          <button onClick={() => go("about")} className="text-sm font-medium text-slate-600 hover:text-teal-700">About</button>
        </div>

        <button onClick={loggedIn ? onDashboard : onLogin} className="hidden items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800 md:flex">
          {loggedIn ? "Open dashboard" : "Portal login"} <ArrowRight size={16} />
        </button>

        <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="rounded-lg p-2 text-slate-700 md:hidden">
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="space-y-1 border-t border-slate-100 p-4 md:hidden">
          <button onClick={() => go("home")} className="block w-full rounded-lg p-3 text-left">Home</button>
          <button onClick={() => go("features")} className="block w-full rounded-lg p-3 text-left">Features</button>
          <button onClick={() => go("workflow")} className="block w-full rounded-lg p-3 text-left">How it works</button>
          <button onClick={onLogin} className="mt-2 w-full rounded-xl bg-teal-700 p-3 font-bold text-white">Portal login</button>
        </div>
      )}
    </header>
  );
}

function StatCard({ icon: Icon, label, value, detail, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
      {detail && <p className="mt-2 text-xs text-slate-400">{detail}</p>}
    </div>
  );
}

function TaskTable({ items = demoTasks }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="font-extrabold text-slate-900">Care coordination tasks</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Demo records</span>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((task, i) => (
          <div key={`${task.title}-${i}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <ClipboardList size={19} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{task.title}</p>
                <p className="mt-1 text-xs text-slate-500">{task.patient} · {task.department || "Care team"} · {task.due}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              task.color === "rose" ? "bg-rose-50 text-rose-700" :
              task.color === "amber" ? "bg-amber-50 text-amber-700" :
              task.color === "blue" ? "bg-blue-50 text-blue-700" :
              "bg-emerald-50 text-emerald-700"
            }`}>{task.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LandingPage({ onLogin }) {
  function go(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Navbar onLogin={onLogin} />

      <main>
        <section id="home" className="overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-2 lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-sm font-bold text-teal-800 shadow-sm">
                <BrainCircuit size={17} /> AI-powered hospital care coordination
              </span>
              <h1 className="mt-6 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Every patient deserves <span className="text-teal-700">care that never misses a step.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                Connect patient records, appointments, laboratories and referrals in one intelligent platform. Help healthcare teams identify missed steps and coordinate timely care.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button onClick={onLogin} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-4 font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-800">
                  Access your portal <ArrowRight size={18} />
                </button>
                <button onClick={() => go("features")} className="rounded-xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 hover:border-teal-300">
                  Explore features
                </button>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-600">
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-teal-700" /> Consent-aware access</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-teal-700" /> Human-reviewed alerts</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-teal-200/50 blur-3xl" />
              <div className="relative rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-teal-900/10 sm:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.18em] text-teal-700">HOSPITAL OVERVIEW</p>
                    <h2 className="mt-2 text-2xl font-extrabold">Care dashboard</h2>
                    <p className="mt-1 text-sm text-slate-500">Illustrative sample data</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Demo preview</span>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatCard icon={Users} label="Patients" value="248" />
                  <StatCard icon={CalendarDays} label="Visits due" value="16" tone="blue" />
                  <StatCard icon={Activity} label="Need review" value="08" tone="rose" />
                </div>
                <div className="mt-6">
                  <TaskTable items={demoTasks.slice(0, 3)} />
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-400">Demo figures only. Clinical alerts require authorized staff review.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:grid-cols-3 lg:px-8">
            {[
              { icon: ShieldCheck, title: "Privacy-conscious", text: "Access controlled by permissions" },
              { icon: Stethoscope, title: "Staff in control", text: "Clinical decisions stay with professionals" },
              { icon: Clock3, title: "Continuity of care", text: "Track tasks across providers" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon size={21} /></span>
                <div><p className="font-bold">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="scroll-mt-24 px-5 py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-teal-700">One connected platform</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Better coordination. For every patient.</h2>
              <p className="mt-4 leading-7 text-slate-600">From registration to reports, referrals and follow-ups, bring important care activities into one organized workflow.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-900/5">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon size={24} /></span>
                  <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-slate-50 px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-teal-700">Simple workflow</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black sm:text-4xl">From pending task to coordinated care.</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                { n: "01", title: "Collect", text: "Authorized staff record appointments, reports, referrals and pending tasks." },
                { n: "02", title: "Coordinate", text: "The system identifies missed steps and suggests follow-up actions." },
                { n: "03", title: "Review & resolve", text: "Authorized staff review alerts, assign responsibility and track resolution." },
              ].map((s) => (
                <article key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-black text-teal-700">{s.n}</p>
                  <h3 className="mt-3 text-xl font-extrabold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 px-5 py-20 lg:px-8">
          <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-3xl bg-teal-900 px-6 py-12 text-white sm:px-12 sm:py-16 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-200">Introducing Jeevan Rakshak AI</p>
              <h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">Fewer missed steps. More connected patient care.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-teal-100">A care-coordination prototype connecting clinics, laboratories, pharmacies and authorized healthcare teams.</p>
            </div>
            <button onClick={onLogin} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-bold text-teal-900 hover:bg-teal-50">
              Choose your portal <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">Connected patient care through coordinated records, reports, referrals and follow-ups.</p>
          </div>
          <div>
            <h3 className="font-bold text-white">Explore</h3>
            <div className="mt-4 space-y-3 text-sm">
              <a href="#home" className="block text-slate-400 hover:text-teal-300">Home</a>
              <a href="#features" className="block text-slate-400 hover:text-teal-300">Features</a>
              <a href="#workflow" className="block text-slate-400 hover:text-teal-300">How it works</a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">Portals</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <p>Patient portal</p><p>Doctor workspace</p><p>Hospital coordination</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">Our commitment</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <p>Consent-aware access</p><p>Responsible AI assistance</p><p>Human-reviewed alerts</p>
            </div>
          </div>
        </div>
        <div className="mt-9 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs leading-6 text-slate-400">
          <strong className="text-slate-200">Healthcare notice:</strong> This is a hackathon prototype. AI-generated information supports healthcare workflows and does not replace professional diagnosis or clinical judgment.
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Jeevan Rakshak AI</p><p>Built for better coordinated care across every department.</p>
        </div>
      </div>
    </footer>
  );
}

function PortalLogin({ onBack, onLogin }) {
  const [role, setRole] = useState("patient");
  const [mode, setMode] = useState("login");
  const [demoId, setDemoId] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function chooseRole(next) {
    setRole(next);
    setError("");
    setMode("login");
    setDemoOtp("");
    setOtp("");
  }

  async function patientSendOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId: demoId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not create demo OTP.");
      if (!data.demoOtp) throw new Error("Demo OTP missing from backend response.");
      setDemoOtp(String(data.demoOtp));
      setOtp("");
      setMode("otp");
    } catch (err) {
      setError(err.message || "Backend connection failed.");
    } finally {
      setLoading(false);
    }
  }

  async function patientVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demoId: demoId.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed.");
      if (!data.user || !data.token) throw new Error("Invalid login response.");
      onLogin({ ...data, user: { ...data.user, role: "patient" } });
    } catch (err) {
      setError(err.message || "Backend connection failed.");
    } finally {
      setLoading(false);
    }
  }

  async function staffLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = role === "doctor" ? "/auth/doctor-login" : "/auth/hospital-login";
      const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid credentials.");
      if (!data.user || !data.token) throw new Error("Invalid login response.");
      if (data.user.role !== role) throw new Error("Account type does not match selected portal.");
      onLogin(data);
    } catch (err) {
      setError(err.message || "Backend connection failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-teal-900 p-10 text-white lg:flex">
          <div>
            <Logo />
            <p className="mt-14 text-xs font-bold uppercase tracking-[0.2em] text-teal-200">Secure healthcare access</p>
            <h1 className="mt-5 text-4xl font-black leading-tight">One connected platform. Three dedicated portals.</h1>
            <p className="mt-5 leading-7 text-teal-100">Access the right tools for your role, with care coordination built around privacy and authorized access.</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
            <ShieldCheck size={26} className="text-teal-200" />
            <p className="mt-3 font-bold">Your privacy matters</p>
            <p className="mt-1 text-sm leading-6 text-teal-100">Staff accounts should be provisioned by an authorized administrator.</p>
          </div>
        </section>

        <section className="p-6 sm:p-10">
          <button onClick={onBack} className="mb-7 text-sm font-semibold text-teal-700 hover:text-teal-900">← Back to homepage</button>
          <p className="text-xs font-extrabold tracking-[0.2em] text-teal-700">PORTAL ACCESS</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Select your portal to continue securely.</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              { id: "patient", title: "Patient", icon: UserRound },
              { id: "doctor", title: "Doctor", icon: Stethoscope },
              { id: "hospital", title: "Hospital", icon: Hospital },
            ].map(({ id, title, icon: Icon }) => (
              <button key={id} type="button" onClick={() => chooseRole(id)} className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${role === id ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-500 hover:border-teal-200"}`}>
                <Icon size={22} />{title}
              </button>
            ))}
          </div>

          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

          {role === "patient" && mode !== "otp" && (
            <form onSubmit={patientSendOtp} className="mt-6 space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Demo only: enter a test patient ID. Do not enter a real Aadhaar number. This screen does not perform Aadhaar authentication.
              </div>
              <label className="block text-sm font-semibold text-slate-700">Demo patient ID
                <input required minLength={4} maxLength={40} autoComplete="off" value={demoId} onChange={(e) => setDemoId(e.target.value)} placeholder="e.g. DEMO1234" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100" />
              </label>
              <button disabled={loading} className="w-full rounded-xl bg-teal-700 px-4 py-3.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60">{loading ? "Generating demo OTP..." : "Continue with OTP →"}</button>
            </form>
          )}

          {role === "patient" && mode === "otp" && (
            <form onSubmit={patientVerifyOtp} className="mt-6 space-y-4">
              <p className="text-sm text-slate-500">Demo verification for ID <strong>{demoId}</strong>.</p>
              <label className="block text-sm font-semibold">6-digit demo OTP
                <input required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3.5 text-center text-xl tracking-[0.4em] outline-none focus:border-teal-600" />
              </label>
              {demoOtp && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center"><p className="text-xs font-bold text-emerald-800">DEMO OTP · NO SMS SENT</p><p className="mt-2 text-3xl font-black tracking-[0.3em] text-teal-800">{demoOtp}</p></div>}
              <button disabled={loading} className="w-full rounded-xl bg-teal-700 px-4 py-3.5 font-bold text-white disabled:opacity-60">{loading ? "Verifying..." : "Verify & open patient dashboard"}</button>
              <button type="button" onClick={() => { setMode("login"); setOtp(""); setDemoOtp(""); setError(""); }} className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold">← Change patient ID</button>
            </form>
          )}

          {(role === "doctor" || role === "hospital") && (
            <form onSubmit={staffLogin} className="mt-6 space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-800">Authorized staff only. Accounts must be created and approved by the hospital administrator.</div>
              <label className="block text-sm font-semibold">Username
                <input required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={role === "doctor" ? "Doctor username" : "Hospital staff username"} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-teal-600" />
              </label>
              <label className="block text-sm font-semibold">Password
                <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-teal-600" />
              </label>
              <button disabled={loading} className="w-full rounded-xl bg-teal-700 px-4 py-3.5 font-bold text-white hover:bg-teal-800 disabled:opacity-60">{loading ? "Signing in..." : `Login to ${role === "doctor" ? "doctor" : "hospital"} portal →`}</button>
            </form>
          )}

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-400">Never share your password. Patient and staff records are intended for authorized access only.</p>
        </section>
      </div>
    </main>
  );
}

function DashboardLayout({ user, onLogout, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Logo small />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{user?.name || user?.username || "Demo User"}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role || "patient"} portal</p>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white px-5 py-5 text-center text-xs text-slate-400">Jeevan Rakshak AI · Hackathon demo · Not a diagnostic tool</footer>
    </div>
  );
}

function PatientDashboard({ user, onLogout, setPage }) {
  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <div className="rounded-3xl bg-gradient-to-r from-teal-800 to-teal-600 p-7 text-white sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-100">Patient portal</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Your care, all in one place.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-teal-50">Hello, {user?.name || "Demo patient"}. View your care tasks and appointment information here.</p>
      </div>
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setPage("appointments")}
          className="rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800"
        >
          <CalendarDays size={17} className="mr-2 inline" />
          Book Appointment
        </button>
      </div>

      
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarDays} label="Upcoming visits" value="2" detail="Illustrative data" />
        <StatCard icon={FileText} label="Reports available" value="3" tone="blue" detail="Illustrative data" />
        <StatCard icon={Clock3} label="Pending follow-ups" value="1" tone="amber" detail="Illustrative data" />
        <StatCard icon={MessageCircle} label="Care assistant" value="Available" tone="teal" detail="Demo preview" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <TaskTable items={demoTasks.slice(0, 2)} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><BrainCircuit /></div>
          <h2 className="mt-4 text-lg font-extrabold">AI health assistant</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Get help understanding general health information and preparing questions for your healthcare provider.</p>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">Not for emergencies or diagnosis. Confirm medical decisions with your clinician.</p>
        </div>
      </div>
      <PatientDemoData />
      <GeneticHealthDemo role="patient" />
      <HealthReminders />
      
      <PatientHealthMonitor />
      <section className="mt-8" aria-label="Medical report analysis">
        <MedicalReportAnalyzer />
      </section>
      <PersonalHealthChat role="patient" />
    </DashboardLayout>
  );
}

function DoctorDashboard({ user, onLogout, setPage }) {
  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Clinical workspace</p>
          <h1 className="mt-2 text-3xl font-black">Doctor dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Welcome, Dr. {user?.name || user?.username || "Doctor"}. Review assigned tasks and care coordination.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700"><ShieldCheck size={14} className="mr-1 inline" /> Authorized staff portal</span>
      </div>
      <div className="mt-5">
        <button
          type="button"
          onClick={() => setPage("doctor-appointments")}
          className="rounded-xl bg-teal-700 px-5 py-3 font-bold text-white hover:bg-teal-800"
        >
          <CalendarDays size={17} className="mr-2 inline" />
          View Appointment Requests
        </button>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Assigned patients" value="32" detail="Demo data" />
        <StatCard icon={ClipboardList} label="Tasks to review" value="08" tone="amber" detail="Demo data" />
        <StatCard icon={Clock3} label="Overdue follow-ups" value="03" tone="rose" detail="Demo data" />
        <StatCard icon={CalendarDays} label="Today's appointments" value="12" tone="blue" detail="Demo data" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <TaskTable />
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-extrabold">Care coordination assistant</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">AI-generated summaries and next-step suggestions can be reviewed here once the backend AI service is connected.</p>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800"><Bell size={19} className="mt-0.5 shrink-0" /> Demo alerts only. Review clinical context before taking action.</div>
        </div>
      </div>
      <DoctorHealthAnalysis />
      <GeneticHealthDemo role="doctor" />
      <PersonalHealthChat role="doctor" />
    </DashboardLayout>

  );
}

function HospitalDashboard({ user, onLogout }) {
  return (
    <DashboardLayout user={user} onLogout={onLogout}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">Hospital operations</p>
      <h1 className="mt-2 text-3xl font-black">Hospital coordination dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">Welcome, {user?.name || user?.username || "Hospital staff"}. Monitor unresolved tasks across authorized departments.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Registered patients" value="248" detail="Demo data" />
        <StatCard icon={Building2} label="Departments" value="12" tone="blue" detail="Demo data" />
        <StatCard icon={Activity} label="Unresolved tasks" value="18" tone="rose" detail="Demo data" />
        <StatCard icon={Clock3} label="Follow-ups due" value="16" tone="amber" detail="Demo data" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <TaskTable />
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><LayoutDashboard /></div>
          <h2 className="mt-4 text-lg font-extrabold">Department overview</h2>
          <div className="mt-5 space-y-4">
            {[
              ["General Medicine", "6 pending"],
              ["Cardiology", "4 pending"],
              ["Pathology", "3 pending"],
              ["Neurology", "2 pending"],
            ].map(([name, count]) => (
              <div key={name} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
                <span className="text-sm font-semibold">{name}</span>
                <span className="text-xs font-bold text-amber-700">{count}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">Illustrative department figures. Real metrics require connected backend data.</p>
        </div>
      </div>
      <PersonalHealthChat role="receptionist" />
    </DashboardLayout>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("jr_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function handleLogin(data) {
    const loggedInUser = data.user;
    sessionStorage.setItem("jr_token", data.token);
    sessionStorage.setItem("jr_user", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setPage("dashboard");
  }

  function logout() {
    sessionStorage.removeItem("jr_token");
    sessionStorage.removeItem("jr_user");
    setUser(null);
    setPage("home");
  }

  function dashboard() {
    if (user?.role === "doctor") return <DoctorDashboard user={user} onLogout={logout} setPage={setPage} />;
    if (user?.role === "hospital") return <HospitalDashboard user={user} onLogout={logout} />;
    return <PatientDashboard user={user} onLogout={logout} setPage={setPage} />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {page === "home" && <LandingPage onLogin={() => setPage("login")} />}
      {page === "login" && (
        <>
          <Navbar onLogin={() => setPage("login")} />
          <PortalLogin onBack={() => setPage("home")} onLogin={handleLogin} />
        </>
      )}
      {page === "dashboard" && user && dashboard()}
      {page === "dashboard" && !user && <PortalLogin onBack={() => setPage("home")} onLogin={handleLogin} />}

      {page === "appointments" && user?.role === "patient" && (
        <DashboardLayout user={user} onLogout={logout}>
          <button type="button" onClick={() => setPage("dashboard")} className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold hover:bg-slate-50">
            ← Back to Dashboard
          </button>
          <AppointmentPage />
        </DashboardLayout>
      )}

      {page === "doctor-appointments" && user?.role === "doctor" && (
        <DashboardLayout user={user} onLogout={logout}>
          <button type="button" onClick={() => setPage("dashboard")} className="mb-5 rounded-lg border border-slate-200 bg-white px-4 py-2 font-semibold hover:bg-slate-50">
            ← Back to Dashboard
          </button>
          <DoctorAppointmentRequests />
        </DashboardLayout>
      )}

      {(page === "appointments" || page === "doctor-appointments") && !user && (
        <PortalLogin onBack={() => setPage("home")} onLogin={handleLogin} />
      )}

      {page === "appointments" && user && user.role !== "patient" && (
        <DashboardLayout user={user} onLogout={logout}>
          <p className="rounded-xl bg-amber-50 p-5 font-semibold text-amber-800">This page is available to patient accounts only.</p>
        </DashboardLayout>
      )}

      {page === "doctor-appointments" && user && user.role !== "doctor" && (
        <DashboardLayout user={user} onLogout={logout}>
          <p className="rounded-xl bg-amber-50 p-5 font-semibold text-amber-800">This page is available to doctor accounts only.</p>
        </DashboardLayout>
      )}
    </div>
  );
}
