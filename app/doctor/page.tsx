"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  HeartPulse, LayoutDashboard, UsersRound, Stethoscope, Brain,
  Search, CalendarDays, LogOut, Megaphone, FilePenLine, Siren,
  Building2, Clock, Hospital, FileSearch, SearchX, ArrowLeft,
  PhoneCall, ShieldAlert, AlertTriangle, Pill, Plus, Trash2
} from "lucide-react";

type Doctor = { name?: string; department?: string; hospital?: string; specialty?: string; qualification?: string; opd_timing?: string; photo_url?: string };
type Disease = { name?: string; department?: string; symptoms?: string[]; context?: string };
type EdgeCase = { case_id?: string; title?: string; patient_profile?: string; diagnostic_challenge?: string; reported_symptoms?: string[]; expected_department?: string; recommended_action?: string };

const DATA_FILES = {
  doctors: "/gandaki_doctors.json",
  additionalDocs: "/additional_doctors.json",
  common: "/gandaki_common_diseases.json",
  additional: "/ADDITIONAL DISEASES.json",
  tests: "/TESTS AND COST.json",
};

function parseJsonLenient(text: string) {
  try { return JSON.parse(text); } catch { return JSON.parse(text.replace(/,\s*([}\]])/g, "$1")); }
}

function flattenDoctors(source: any = {}, additionalSource: any = {}): Doctor[] {
  let id = 64;
  const main = (source.departments || []).flatMap((d: any) =>
    (d.doctors || []).map((doc: any) => ({ ...doc, department: d.department, photo_url: doc.photo_url || `https://picsum.photos/id/${id++}/300/300` }))
  );
  const extra = (additionalSource.departments || []).flatMap((d: any) =>
    (d.doctors || []).map((doc: any) => ({ ...doc, department: d.department, photo_url: doc.photo_url || `https://picsum.photos/id/${id++}/300/300` }))
  );
  return [...main, ...extra];
}

function flattenDiseases(common: any = {}, additional: any = {}): Disease[] {
  const base = (common.diseases || []).map((d: any) => ({
    name: d.disease, department: d.department, symptoms: d.symptoms || [], context: d.nepal_context
  }));
  const expanded = (additional.healthcare_departments || []).flatMap((dept: any) =>
    (dept.common_diseases || []).map((d: any) => ({
      name: d.disease_name, department: dept.department_name, symptoms: d.symptoms || [], context: d.description
    }))
  );
  return [...base, ...expanded];
}

function initials(name: string) {
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
}

function riskRank(risk: string) {
  return { low: 1, medium: 2, high: 3 }[risk] || 0;
}

type Vitals = { bp?: string; hr?: string; temp?: string; spo2?: string; rr?: string };
type Patient = { id: string; name: string; condition: string; department: string; risk: string; note: string; time: string; vitals?: Vitals };
type Appointment = { time: string; patient: string; type: string; status: string };
type DoctorPrescription = { id: string; patientName: string; medication: string; dosage: string; frequency: string; route: string; notes: string; date: string };

const DOCTOR_PRESCRIPTIONS: DoctorPrescription[] = [
  { id: "RX-D1", patientName: "Anita Poudel", medication: "Amlodipine 5mg", dosage: "5mg", frequency: "Once daily", route: "Oral", notes: "Monitor BP weekly. Follow up in 2 weeks.", date: "2026-07-24" },
  { id: "RX-D2", patientName: "Sita Gurung", medication: "Paracetamol 650mg", dosage: "650mg", frequency: "Every 6 hours PRN", route: "Oral", notes: "For fever. Max 4 doses/day. Return if vomiting worsens.", date: "2026-07-24" },
  { id: "RX-D3", patientName: "Ram Kumar", medication: "Metformin 500mg", dosage: "500mg", frequency: "Twice daily with meals", route: "Oral", notes: "Continue current regimen. HbA1c check in 3 months.", date: "2026-07-23" },
];

const STATIC_PATIENTS: Patient[] = [
  { id: "PAT-1024", name: "Anita Poudel", condition: "Hypertension", department: "Cardiology", risk: "medium", note: "BP log rising for three days", time: "09:10 AM", vitals: { bp: "158/95", hr: "88", temp: "98.6°F", spo2: "97%", rr: "18" } },
  { id: "PAT-1031", name: "Ram Kumar", condition: "Type 2 Diabetes", department: "General Medicine", risk: "low", note: "Follow-up glucose review", time: "09:35 AM", vitals: { bp: "126/82", hr: "74", temp: "98.4°F", spo2: "98%", rr: "16" } },
  { id: "PAT-1042", name: "Sita Gurung", condition: "Dengue warning signs", department: "Emergency Medicine", risk: "high", note: "Vomiting and severe abdominal pain", time: "10:05 AM", vitals: { bp: "98/60", hr: "112", temp: "103.2°F", spo2: "94%", rr: "24" } },
  { id: "PAT-1056", name: "Bikash Magar", condition: "Asthma flare", department: "Pulmonology", risk: "medium", note: "Shortness of breath after cold exposure", time: "10:30 AM", vitals: { bp: "122/78", hr: "96", temp: "99.1°F", spo2: "93%", rr: "22" } },
  { id: "PAT-1063", name: "Maya Shrestha", condition: "Cataract review", department: "Ophthalmology", risk: "low", note: "Post-op one week check", time: "11:00 AM", vitals: { bp: "118/76", hr: "72", temp: "98.2°F", spo2: "99%", rr: "14" } },
];

const STATIC_APPOINTMENTS: Appointment[] = [
  { time: "09:10", patient: "Anita Poudel", type: "BP review", status: "Checked in" },
  { time: "09:35", patient: "Ram Kumar", type: "Diabetes follow-up", status: "Waiting" },
  { time: "10:05", patient: "Sita Gurung", type: "Urgent triage", status: "Priority" },
  { time: "11:00", patient: "Maya Shrestha", type: "Eye follow-up", status: "Scheduled" },
];

export default function DoctorDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [edgeCases, setEdgeCases] = useState<EdgeCase[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [toasts, setToasts] = useState<{ id: number; title: string; message: string }[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [docPrescriptions, setDocPrescriptions] = useState<DoctorPrescription[]>(DOCTOR_PRESCRIPTIONS);
  const [rxForm, setRxForm] = useState({ patient: "", medication: "", dosage: "", frequency: "Once daily", route: "Oral", notes: "" });

  const supabase = createClient();

  const showToast = useCallback((title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    async function loadDoctorData() {
      const entries = await Promise.all(
        Object.entries(DATA_FILES).map(async ([key, path]) => {
          try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            return [key, parseJsonLenient(text)];
          } catch {
            setLoadErrors(prev => [...prev, key]);
            return [key, {}];
          }
        })
      );
      const data = Object.fromEntries(entries);
      setDoctors(flattenDoctors(data.doctors, data.additionalDocs));
      setDiseases(flattenDiseases(data.common, data.additional));
      setEdgeCases(data.additional?.critical_misdiagnosis_edge_cases || []);
      setDataLoaded(true);
    }
    loadDoctorData();
  }, []);

  const tabTitles: Record<string, string> = {
    dashboard: "Dashboard",
    emergency: "Emergency Cases",
    queue: "Patient Queue",
    prescriptions: "Prescriptions",
    directory: "Directory",
    insights: "Risk Insights",
  };

  function filterByQuery<T>(items: T[], selector: (item: T) => string): T[] {
    if (!query) return items;
    return items.filter(item => selector(item).toLowerCase().includes(query));
  }

  const visiblePatients = filterByQuery(
    STATIC_PATIENTS,
    p => [p.name, p.id, p.condition, p.department, p.note, p.risk].join(" ")
  ).sort((a, b) => riskRank(b.risk) - riskRank(a.risk));

  const filteredDoctors = filterByQuery(
    doctors,
    d => [d.name, d.department, d.hospital, d.specialty].join(" ")
  );

  const filteredEdgeCases = filterByQuery(
    edgeCases,
    e => [e.title, e.patient_profile, e.expected_department, e.recommended_action, ...(e.reported_symptoms || [])].join(" ")
  );

  const emergencyPatients = STATIC_PATIENTS.filter(p =>
    p.department.toLowerCase().includes("emergency") || p.risk === "high"
  ).sort((a, b) => riskRank(b.risk) - riskRank(a.risk));

  const highRisk = STATIC_PATIENTS.filter(p => p.risk === "high").length;
  const departments = new Set(doctors.map(d => d.department));

  const summaryCards = [
    { icon: <UsersRound />, value: STATIC_PATIENTS.length, label: "patients in queue" },
    { icon: <Siren />, value: highRisk, label: "priority case today" },
    { icon: <Stethoscope />, value: doctors.length, label: "referral doctors" },
    { icon: <Building2 />, value: departments.size, label: "departments covered" },
  ];

  const emptyState = (title: string, message: string) => (
    <div className="empty-state"><SearchX /><h3>{title}</h3><p>{message}</p></div>
  );

  if (authLoading) {
    return (
      <div className="login-view" style={{ placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <span className="brand-mark" style={{ width: 64, height: 64, fontSize: 28 }}><HeartPulse /></span>
          <p style={{ marginTop: 16, color: "var(--muted)" }}>Loading Doctor Console...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  if (user.user_metadata?.role !== "doctor") {
    return (
      <div className="login-view">
        <div className="login-panel">
          <div className="brand-lockup">
            <span className="brand-mark"><HeartPulse /></span>
            <div>
              <p className="eyebrow">Suraksha360</p>
              <h1>Doctor Console</h1>
            </div>
          </div>
          <p className="login-copy">This account is not registered as a doctor. Please use the patient portal, or sign up as a doctor.</p>
          <Link className="btn btn-primary btn-block" href="/" style={{ textDecoration: "none" }}>
            <ArrowLeft /> Go to Patient Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-shell">
      <aside className="sidebar doctor-sidebar" aria-label="Doctor navigation">
        <Link className="sidebar-brand" href="/">
          <span className="brand-mark"><HeartPulse /></span>
          <span><strong>Swasthya Sathi</strong><small>Doctor console</small></span>
        </Link>
        <nav className="side-nav">
          {([
            { key: "dashboard", icon: <LayoutDashboard />, label: "Dashboard" },
            { key: "emergency", icon: <Siren />, label: "Emergency" },
            { key: "queue", icon: <UsersRound />, label: "Patient Queue" },
            { key: "prescriptions", icon: <Pill />, label: "Prescriptions" },
            { key: "directory", icon: <Stethoscope />, label: "Directory" },
            { key: "insights", icon: <Brain />, label: "Risk Insights" },
          ] as const).map(item => (
            <button
              key={item.key}
              className={`nav-item ${activeTab === item.key ? "is-active" : ""}`}
              type="button"
              onClick={() => {
                setActiveTab(item.key);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className={`status-dot ${dataLoaded ? "is-ready" : ""}`}></span>
          <strong>Clinical data</strong>
          <p>{dataLoaded ? (loadErrors.length ? `${Object.keys(DATA_FILES).length - loadErrors.length} of ${Object.keys(DATA_FILES).length} JSON files loaded.` : "All clinical JSON files loaded.") : "Loading JSON files..."}</p>
        </div>
      </aside>

      <header className="topbar doctor-topbar">
        <div>
          <p className="eyebrow">Doctor shift</p>
          <h2>{tabTitles[activeTab]}</h2>
        </div>
        <div className="topbar-actions">
          <label className="search-field">
            <Search />
            <input type="search" placeholder="Search patients, departments, diseases" value={query} onChange={e => setQuery(e.target.value.trim().toLowerCase())} />
          </label>
          <Link className="btn btn-secondary" href="/appointments"><CalendarDays /> Appointments</Link>
          <button className="icon-button" type="button" onClick={async () => { await supabase.auth.signOut(); }} aria-label="Log out"><LogOut /></button>
        </div>
      </header>

      <main className="content-shell doctor-content">
        {activeTab === "dashboard" && (
          <section className="doctor-tab is-active">
            <div className="doctor-hero">
              <div>
                <p className="eyebrow">Morning clinic</p>
                <h1>Good morning, Dr. Sumin. Your queue is prioritized.</h1>
                <p>Critical cases, follow-up windows, and common regional disease patterns are grouped so a judge can understand the workflow quickly.</p>
              </div>
              <div className="hero-actions">
                <button className="btn btn-primary" type="button" onClick={() => {
                  const next = visiblePatients[0];
                  showToast("Calling next patient", next ? `${next.name} is first in the current queue.` : "No visible patients in this filter.");
                }}><Megaphone /> Call next patient</button>
                <button className="btn btn-secondary" type="button" onClick={() => showToast("Clinical note opened", "Demo note action saved locally for the presentation.")}><FilePenLine /> Write note</button>
              </div>
            </div>

            <div className="summary-grid">
              {summaryCards.map((card, i) => (
                <article key={i} className="summary-card">
                  <span className="icon-bubble">{card.icon}</span>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </article>
              ))}
            </div>

            <div className="doctor-grid-layout">
              <section className="panel">
                <div className="panel-header">
                  <div><p className="eyebrow">Live queue</p><h2>Patients needing review</h2></div>
                  <span className="pill">OPD 9 AM - 1 PM</span>
                </div>
                <div className="queue-list">
                  {visiblePatients.slice(0, 4).length ? visiblePatients.slice(0, 4).map(p => (
                    <article key={p.id} className="queue-card">
                      <div className="queue-main">
                        <span className="avatar-initials">{initials(p.name)}</span>
                        <div>
                          <h3>{p.name}</h3>
                          <p>{p.condition} - {p.note}</p>
                          <div className="meta-line">
                            <span className="tag">{p.id}</span>
                            <span className="tag">{p.department}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`pill risk-${p.risk}`}>{p.risk} risk</span>
                    </article>
                  )) : emptyState("No queue matches", "Clear the doctor search to see all patients.")}
                </div>
              </section>

              <section className="panel accent-panel">
                <div className="panel-header">
                  <div><p className="eyebrow">Today</p><h2>Appointments</h2></div>
                </div>
                <div className="appointment-stack">
                  {STATIC_APPOINTMENTS.map((item, i) => (
                    <article key={i} className="appointment-card">
                      <div className="panel-header">
                        <div>
                          <h3>{item.time} - {item.patient}</h3>
                          <p>{item.type}</p>
                        </div>
                        <span className="pill">{item.status}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === "emergency" && (
          <section className="doctor-tab is-active">
            <div className="emergency-hero">
              <div>
                <p className="eyebrow">Emergency triage</p>
                <h1>Review critical cases requiring immediate attention.</h1>
                <p>Patients flagged as high-risk or routed through the Emergency Medicine department are listed here for rapid triage review.</p>
              </div>
              <div className="emergency-actions">
                <a className="btn btn-danger" href="tel:102"><PhoneCall /> Call ambulance 102</a>
                <a className="btn btn-secondary" href="tel:100"><ShieldAlert /> Police 100</a>
              </div>
            </div>

            <div className="summary-grid">
              <article className="summary-card">
                <span className="icon-bubble"><AlertTriangle /></span>
                <strong>{emergencyPatients.length}</strong>
                <span>emergency cases today</span>
              </article>
              <article className="summary-card">
                <span className="icon-bubble"><Siren /></span>
                <strong>{emergencyPatients.filter(p => p.risk === "high").length}</strong>
                <span>critical priority</span>
              </article>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div><p className="eyebrow">Active cases</p><h2>Emergency patient queue</h2></div>
              </div>
              <div className="doctor-table">
                {emergencyPatients.length ? (
                  <table>
                    <thead>
                      <tr><th>Patient</th><th>Condition</th><th>Department</th><th>Risk</th><th>Time</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {emergencyPatients.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div className="table-patient">
                              <span className="avatar-initials">{initials(p.name)}</span>
                              <div><strong>{p.name}</strong><span>{p.id}</span></div>
                            </div>
                          </td>
                          <td>{p.condition}<br /><span className="tag">{p.note}</span></td>
                          <td>{p.department}</td>
                          <td><span className={`pill risk-${p.risk}`}>{p.risk}</span></td>
                          <td>{p.time}</td>
                          <td>
                            <button className="btn btn-secondary" type="button" onClick={() => showToast("Emergency review opened", `${p.name} is ready for triage.`)}>
                              <FileSearch /> Triage
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : emptyState("No emergency cases", "No patients currently flagged for emergency triage.")}
              </div>
            </div>

            <div className="panel" style={{ marginTop: "1.5rem" }}>
              <div className="panel-header">
                <div><p className="eyebrow">Critical edge cases</p><h2>Misdiagnosis risk patterns</h2></div>
              </div>
              <div className="edge-grid">
                {filteredEdgeCases.slice(0, 4).length ? filteredEdgeCases.slice(0, 4).map((c, i) => (
                  <article key={i} className="edge-card">
                    <span className="pill">{c.case_id || "Risk case"}</span>
                    <h3>{c.title}</h3>
                    <p>{c.diagnostic_challenge || c.patient_profile || ""}</p>
                    <div className="symptom-line">
                      {(c.reported_symptoms || []).map((s, j) => <span key={j} className="tag">{s}</span>)}
                    </div>
                    <p><strong>{c.expected_department || "Escalate"}</strong></p>
                    <p>{c.recommended_action || "Escalate for clinical review."}</p>
                  </article>
                )) : emptyState("No critical edge cases", "No misdiagnosis risk data available.")}
              </div>
            </div>
          </section>
        )}

        {activeTab === "prescriptions" && (
          <section className="doctor-tab is-active">
            <div className="section-intro">
              <p className="eyebrow">Prescriptions</p>
              <h1>Write and manage patient prescriptions.</h1>
              <p>Prescriptions are visible to patients in their portal with dosage reminders.</p>
            </div>

            <div className="doctor-grid-layout">
              <section className="panel">
                <div className="panel-header">
                  <div><p className="eyebrow">New prescription</p><h2>Write prescription</h2></div>
                </div>
                <form style={{ display: "flex", flexDirection: "column", gap: 12 }} onSubmit={e => {
                  e.preventDefault();
                  if (!rxForm.patient || !rxForm.medication) { showToast("Missing fields", "Patient and medication name are required."); return; }
                  const newRx: DoctorPrescription = { id: `RX-D${Date.now()}`, patientName: rxForm.patient, medication: rxForm.medication, dosage: rxForm.dosage, frequency: rxForm.frequency, route: rxForm.route, notes: rxForm.notes, date: new Date().toISOString().slice(0, 10) };
                  setDocPrescriptions(prev => [newRx, ...prev]);
                  setRxForm({ patient: "", medication: "", dosage: "", frequency: "Once daily", route: "Oral", notes: "" });
                  showToast("Prescription saved", `${newRx.medication} prescribed to ${newRx.patientName}.`);
                }}>
                  <label>
                    <span>Patient name</span>
                    <select value={rxForm.patient} onChange={e => setRxForm(p => ({ ...p, patient: e.target.value }))} required>
                      <option value="">Select patient</option>
                      {STATIC_PATIENTS.map(p => <option key={p.id} value={p.name}>{p.name} — {p.condition}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Medication</span>
                    <input type="text" placeholder="e.g. Amoxicillin 500mg" value={rxForm.medication} onChange={e => setRxForm(p => ({ ...p, medication: e.target.value }))} required />
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <label>
                      <span>Dosage</span>
                      <input type="text" placeholder="e.g. 500mg" value={rxForm.dosage} onChange={e => setRxForm(p => ({ ...p, dosage: e.target.value }))} />
                    </label>
                    <label>
                      <span>Frequency</span>
                      <select value={rxForm.frequency} onChange={e => setRxForm(p => ({ ...p, frequency: e.target.value }))}>
                        <option>Once daily</option>
                        <option>Twice daily</option>
                        <option>Three times daily</option>
                        <option>Every 6 hours</option>
                        <option>Every 8 hours</option>
                        <option>As needed</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    <span>Route</span>
                    <select value={rxForm.route} onChange={e => setRxForm(p => ({ ...p, route: e.target.value }))}>
                      <option>Oral</option>
                      <option>IV</option>
                      <option>IM</option>
                      <option>Topical</option>
                      <option>Inhalation</option>
                    </select>
                  </label>
                  <label>
                    <span>Clinical notes</span>
                    <textarea rows={3} placeholder="Instructions, side effects to watch, follow-up..." value={rxForm.notes} onChange={e => setRxForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: "vertical" }} />
                  </label>
                  <button className="btn btn-primary btn-block" type="submit"><Plus /> Save prescription</button>
                </form>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div><p className="eyebrow">Recent</p><h2>Prescribed today</h2></div>
                  <span className="pill">{docPrescriptions.length} total</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {docPrescriptions.map((rx, i) => (
                    <article key={i} style={{ padding: 14, borderRadius: "var(--radius)", background: "var(--surface-strong)", display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ color: "var(--ink)" }}>{rx.medication}</strong>
                        <button className="icon-button" type="button" onClick={() => { setDocPrescriptions(prev => prev.filter((_, j) => j !== i)); showToast("Deleted", `${rx.medication} removed.`); }}><Trash2 size={14} /></button>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>Patient: {rx.patientName} — {rx.dosage} {rx.frequency} ({rx.route})</p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>{rx.notes}</p>
                      <span className="tag" style={{ alignSelf: "flex-start" }}>{rx.date}</span>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}

        {activeTab === "queue" && (
          <section className="doctor-tab is-active">
            <div className="section-intro">
              <p className="eyebrow">Patient queue</p>
              <h1>Focus on the cases with the highest risk first.</h1>
              <p>Search filters patient names, conditions, and triage notes without changing any backend contract.</p>
            </div>
            <div className="doctor-table">
              {visiblePatients.length ? (
                <table>
                  <thead>
                    <tr><th>Patient</th><th>Condition</th><th>Department</th><th>Risk</th><th>Time</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {visiblePatients.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="table-patient">
                            <span className="avatar-initials">{initials(p.name)}</span>
                            <div><strong>{p.name}</strong><span>{p.id}</span></div>
                          </div>
                        </td>
                        <td>{p.condition}<br /><span className="tag">{p.note}</span></td>
                        <td>{p.department}</td>
                        <td><span className={`pill risk-${p.risk}`}>{p.risk}</span></td>
                        <td>{p.time}</td>
                        <td>
                          <button className="btn btn-secondary" type="button" onClick={() => showToast("Patient chart opened", `${p.name} is ready for review.`)}>
                            <FileSearch /> Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : emptyState("No patients found", "Try a broader search.")}
            </div>
          </section>
        )}

        {activeTab === "directory" && (
          <section className="doctor-tab is-active">
            <div className="section-intro">
              <p className="eyebrow">Referral directory</p>
              <h1>Coordinate care across departments.</h1>
              <p>Rendered from the same pokhara_doctors.json data used by the patient portal.</p>
            </div>
            <div className="doctor-grid">
              {filteredDoctors.length ? filteredDoctors.map((d, i) => (
                <article key={i} className="doctor-card">
                  <div className="doctor-card-header">
                    <img src={d.photo_url || "/profile.jpeg"} alt={`${d.name} profile photo`} width={58} height={58} loading="lazy" />
                    <div><h3>{d.name}</h3><p>{d.qualification || "Medical specialist"}</p></div>
                  </div>
                  <span className="pill">{d.department || "General"}</span>
                  <p>{d.specialty || "Specialist care"}</p>
                  <div className="doctor-meta">
                    <span><Hospital size={16} /> {d.hospital || "Hospital unavailable"}</span>
                    <span><Clock size={16} /> {d.opd_timing || "Confirm OPD timing"}</span>
                  </div>
                </article>
              )) : emptyState("No referral doctors found", "Try a different search term.")}
            </div>
          </section>
        )}

        {activeTab === "insights" && (
          <section className="doctor-tab is-active">
            <div className="section-intro">
              <p className="eyebrow">Risk insights</p>
              <h1>Clinical traps worth catching early.</h1>
              <p>High-risk misdiagnosis cases from the existing additional diseases JSON are presented as triage cards.</p>
            </div>
            <div className="edge-grid">
              {filteredEdgeCases.length ? filteredEdgeCases.map((c, i) => (
                <article key={i} className="edge-card">
                  <span className="pill">{c.case_id || "Risk case"}</span>
                  <h3>{c.title}</h3>
                  <p>{c.diagnostic_challenge || c.patient_profile || ""}</p>
                  <div className="symptom-line">
                    {(c.reported_symptoms || []).map((s, j) => <span key={j} className="tag">{s}</span>)}
                  </div>
                  <p><strong>{c.expected_department || "Escalate"}</strong></p>
                  <p>{c.recommended_action || "Escalate for clinical review."}</p>
                </article>
              )) : emptyState("No risk insight matches", "Clear search to see all edge cases.")}
            </div>
          </section>
        )}
      </main>

      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className="toast"><strong>{t.title}</strong><span>{t.message}</span></div>
        ))}
      </div>
    </div>
  );
}
