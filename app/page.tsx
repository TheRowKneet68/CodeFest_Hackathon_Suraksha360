"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HeartPulse, UserRound, Stethoscope, LockKeyhole, LayoutDashboard, FileHeart,
  Siren, ShieldUser, Search, Moon, Sun, Bell, LogOut, Sparkles, CalendarPlus,
  ClipboardCheck, Activity, Building2, ReceiptText, Printer, Download,
  MessageCircleHeart, Send, X, Hospital, Clock, SearchX, PhoneCall, ShieldAlert,
  Check, FlaskConical
} from "lucide-react";

type Doctor = { name?: string; department?: string; hospital?: string; specialty?: string; qualification?: string; opd_timing?: string; photo_url?: string };
type Disease = { name?: string; nepaliName?: string; department?: string; symptoms?: string[]; context?: string; source?: string; action?: string };
type TestItem = { disease_name?: string; department?: string; total_estimated_cost_npr?: string; average_follow_up_time?: string; required_diagnostic_tests?: { test_name?: string; cost_range_npr?: string }[] };
type EdgeCase = { case_id?: string; title?: string; patient_profile?: string; reported_symptoms?: string[]; expected_department?: string; recommended_action?: string };

const DATA_FILES = {
  doctors: "/gandaki_doctors.json",
  common: "/gandaki_common_diseases.json",
  symptoms: "/gandaki_symptoms_diseases.json",
  expanded: "/gandaki_diseases_expanded.json",
  additional: "/ADDITIONAL DISEASES.json",
  tests: "/TESTS AND COST.json",
};

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function parseJsonLenient(text: string) {
  try { return JSON.parse(text); } catch { return JSON.parse(text.replace(/,\s*([}\]])/g, "$1")); }
}

function flattenDoctors(source: any = {}): Doctor[] {
  return (source.departments || []).flatMap((d: any) =>
    (d.doctors || []).map((doc: any) => ({ ...doc, department: d.department }))
  );
}

function flattenDiseases(common: any = {}, expanded: any = {}, additional: any = {}): Disease[] {
  const diseases: Disease[] = [];
  (common.diseases || []).forEach((d: any) => {
    diseases.push({ name: d.disease, department: d.department, symptoms: d.symptoms || [], context: d.nepal_context, source: "Very common" });
  });
  (expanded.departments || []).forEach((dept: any) => {
    (dept.common_diseases || []).forEach((d: any) => {
      diseases.push({ name: d.disease, department: dept.department, symptoms: d.symptoms || [], context: d.nepal_context, source: "Department data" });
    });
  });
  (additional.healthcare_departments || []).forEach((dept: any) => {
    (dept.common_diseases || []).forEach((d: any) => {
      diseases.push({ name: d.disease_name, nepaliName: d.nepali_name, department: dept.department_name, symptoms: d.symptoms || [], context: d.description, action: d.recommended_action, source: "Expanded risk model" });
    });
  });
  const seen = new Set<string>();
  return diseases.filter((d) => {
    const key = `${d.name}|${d.department}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreDisease(disease: Disease, terms: string[]) {
  const haystack = [disease.name, disease.department, disease.context, ...(disease.symptoms || [])].join(" ").toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? (term.length > 5 ? 2 : 1) : 0), 0);
}

function tokenize(text: string) {
  return text.toLowerCase().split(/[^a-z0-9]+/i).map(t => t.trim()).filter(t => t.length > 2);
}

export default function PatientPortal() {
  const [selectedRole, setSelectedRole] = useState("patient");
  const [activeScreen, setActiveScreen] = useState("home");
  const [activeDepartment, setActiveDepartment] = useState("All");
  const [query, setQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [edgeCases, setEdgeCases] = useState<EdgeCase[]>([]);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "bot" | "user"; text: string; matches?: Disease[] }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [toasts, setToasts] = useState<{ id: number; title: string; message: string }[]>([]);

  const todayLabel = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(new Date());

  const showToast = useCallback((title: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3600);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("swasthya-theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.dataset.theme = "dark";
    }
  }, []);

  useEffect(() => {
    async function loadAllData() {
      const entries = await Promise.all(
        Object.entries(DATA_FILES).map(async ([key, path]) => {
          try {
            const res = await fetch(path);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            return [key, parseJsonLenient(text)];
          } catch {
            return [key, {}];
          }
        })
      );
      const data = Object.fromEntries(entries);
      setDoctors(flattenDoctors(data.doctors));
      setDiseases(flattenDiseases(data.common, data.expanded, data.additional));
      setTests(data.tests?.diseases_diagnostic_data || []);
      setEdgeCases(data.additional?.critical_misdiagnosis_edge_cases || []);
      setDataLoaded(true);
    }
    loadAllData();
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("swasthya-theme", next ? "dark" : "light");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === "doctor") {
      window.location.href = "/doctor";
      return;
    }
    setIsLoggedIn(true);
    showToast("Signed in", "Demo patient workspace is ready.");
  };

  const filteredDoctors = doctors.filter(d => {
    const matchDept = activeDepartment === "All" || d.department === activeDepartment;
    const matchQ = !query || [d.name, d.department, d.hospital, d.specialty, d.qualification].join(" ").toLowerCase().includes(query);
    return matchDept && matchQ;
  });

  const filteredDiseases = diseases.filter(d =>
    !query || [d.name, d.department, ...(d.symptoms || [])].join(" ").toLowerCase().includes(query)
  );

  const filteredTests = tests.filter(t =>
    !query || [t.disease_name, t.department, t.total_estimated_cost_npr].join(" ").toLowerCase().includes(query)
  );

  const departments = ["All", ...new Set(doctors.map(d => d.department).filter(Boolean))];
  const totalTests = tests.reduce((sum, item) => sum + (item.required_diagnostic_tests || []).length, 0);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setChatInput("");

    const terms = tokenize(userText);
    const scored = diseases.map(d => ({ disease: d, score: scoreDisease(d, terms) }))
      .filter(i => i.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

    if (!scored.length) {
      setChatMessages(prev => [...prev, { role: "bot", text: "I couldn't find a strong match. Try adding words like fever, cough, pain, rash, vomiting, or dizziness." }]);
    } else {
      setChatMessages(prev => [...prev, { role: "bot", text: "Here are the best matches:", matches: scored.map(s => s.disease) }]);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-view">
        <div className="login-panel">
          <div className="brand-lockup">
            <span className="brand-mark"><HeartPulse /></span>
            <div>
              <p className="eyebrow">Suraksha360</p>
              <h1>Swasthya Sathi</h1>
            </div>
          </div>
          <p className="login-copy">Regional symptom guidance, trusted doctors, and diagnostic costs for patients in Gandaki Province.</p>
          <div className="role-grid" role="radiogroup" aria-label="Choose portal">
            <button className={`role-card ${selectedRole === "patient" ? "is-selected" : ""}`} type="button" onClick={() => setSelectedRole("patient")}>
              <UserRound /><span>Patient</span><small>Check symptoms and find care</small>
            </button>
            <button className={`role-card ${selectedRole === "doctor" ? "is-selected" : ""}`} type="button" onClick={() => setSelectedRole("doctor")}>
              <Stethoscope /><span>Doctor</span><small>Review patients and schedule</small>
            </button>
          </div>
          <form className="login-form" onSubmit={handleLogin}>
            <label>
              <span>Patient ID or license number</span>
              <input type="text" autoComplete="username" placeholder="SS-1024" />
            </label>
            <label>
              <span>Secure PIN</span>
              <input type="password" autoComplete="current-password" placeholder="Enter any demo PIN" />
            </label>
            <button className="btn btn-primary btn-block" type="submit"><LockKeyhole /> Enter secure demo</button>
          </form>
        </div>
        <aside className="login-context" aria-label="Platform highlights">
          <div className="context-card context-large">
            <h2>Care guidance built around real regional data.</h2>
            <p>Doctors, disease patterns, and estimated diagnostic costs are rendered from the JSON files already in this project.</p>
          </div>
          <div className="context-card">
            <Activity />
            <strong>Fast triage</strong>
            <span>Spot warning signs before delays become dangerous.</span>
          </div>
          <div className="context-card">
            <Building2 />
            <strong>Gandaki focused</strong>
            <span>Departments, hospitals, and OPD timings stay close to the patient.</span>
          </div>
        </aside>
      </div>
    );
  }

  const screenTitles: Record<string, string> = { home: "Overview", doctors: "Doctors", records: "Tests & Records", emergency: "Emergency", profile: "Profile" };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/" onClick={() => setActiveScreen("home")}>
          <span className="brand-mark"><HeartPulse /></span>
          <span><strong>Swasthya Sathi</strong><small>Patient portal</small></span>
        </Link>
        <nav className="side-nav">
          {(["home", "doctors", "records", "emergency", "profile"] as const).map(s => (
            <button key={s} className={`nav-item ${activeScreen === s ? "is-active" : ""}`} type="button" onClick={() => setActiveScreen(s)}>
              {s === "home" && <LayoutDashboard />}
              {s === "doctors" && <Stethoscope />}
              {s === "records" && <FileHeart />}
              {s === "emergency" && <Siren />}
              {s === "profile" && <ShieldUser />}
              <span>{screenTitles[s]}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className={`status-dot ${dataLoaded ? "is-ready" : ""}`}></span>
          <strong>Data source</strong>
          <p>{dataLoaded ? (loadErrors.length ? `${Object.keys(DATA_FILES).length - loadErrors.length} of ${Object.keys(DATA_FILES).length} JSON files loaded.` : "All JSON files loaded.") : "Loading JSON files..."}</p>
        </div>
      </aside>

      <header className="topbar">
        <div>
          <p className="eyebrow">{todayLabel}</p>
          <h2>{screenTitles[activeScreen]}</h2>
        </div>
        <div className="topbar-actions">
          <label className="search-field">
            <Search />
            <input type="search" placeholder="Search symptoms, doctors, tests" value={query} onChange={e => setQuery(e.target.value.trim().toLowerCase())} />
          </label>
          <button className="icon-button" type="button" onClick={toggleTheme}>{darkMode ? <Sun /> : <Moon />}</button>
          <button className="icon-button has-badge" type="button" onClick={() => showToast("No urgent alerts", "Two OPD reminders and one report tip are waiting in your dashboard.")}><Bell /></button>
          <button className="icon-button" type="button" onClick={() => { setIsLoggedIn(false); showToast("Signed out", "You have been logged out securely."); }}><LogOut /></button>
        </div>
      </header>

      <main className="content-shell">
        {activeScreen === "home" && (
          <>
            <div className="hero-grid">
              <article className="hero-card">
                <div>
                  <p className="eyebrow">Care snapshot</p>
                  <h1>Namaste, Sanskar. Your care plan is ready for today.</h1>
                  <p>Review likely conditions, compare diagnostic costs, and book with a relevant specialist from one dashboard.</p>
                </div>
                <div className="hero-actions">
                  <button className="btn btn-primary" type="button" onClick={() => setChatOpen(true)}><Sparkles /> Start symptom check</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setActiveScreen("doctors")}><CalendarPlus /> Find a doctor</button>
                </div>
              </article>
              <aside className="next-visit-card">
                <span className="pill">Next step</span>
                <h2>General Medicine review</h2>
                <p>Today, 11:30 AM at Charak Memorial Hospital</p>
                <button className="btn btn-ghost" type="button" onClick={() => showToast("Visit checklist created", "Bring previous reports, medicine names, and symptom start time.")}><ClipboardCheck /> Prepare visit</button>
              </aside>
            </div>

            <div className="summary-grid">
              {[
                { icon: <Stethoscope />, value: doctors.length, label: "verified regional doctors" },
                { icon: <Building2 />, value: new Set(doctors.map(d => d.department)).size, label: "specialty departments" },
                { icon: <Activity />, value: diseases.length, label: "symptom patterns mapped" },
                { icon: <ReceiptText />, value: totalTests, label: "diagnostic tests with costs" },
              ].map((card, i) => (
                <article key={i} className="summary-card">
                  <span className="icon-bubble">{card.icon}</span>
                  <strong>{card.value}</strong>
                  <span>{card.label}</span>
                </article>
              ))}
            </div>

            <div className="layout-two">
              <section className="panel">
                <div className="panel-header">
                  <div><p className="eyebrow">Common in Gandaki</p><h2>Symptoms to watch</h2></div>
                  <button className="btn btn-text" type="button" onClick={() => setChatOpen(true)}>Open checker</button>
                </div>
                <div className="condition-list">
                  {filteredDiseases.slice(0, 4).map((d, i) => (
                    <article key={i} className="condition-item">
                      <span className="pill">{d.department || "General care"}</span>
                      <h3>{d.name}</h3>
                      <p>{d.context || "Review symptoms and consult a clinician if they persist."}</p>
                      <div className="symptom-line">{(d.symptoms || []).slice(0, 4).map((s, j) => <span key={j} className="tag">{s}</span>)}</div>
                    </article>
                  ))}
                </div>
              </section>
              <section className="panel accent-panel">
                <div className="panel-header">
                  <div><p className="eyebrow">Care budget</p><h2>Estimated test costs</h2></div>
                </div>
                <div className="cost-stack">
                  {filteredTests.slice(0, 3).map((t, i) => (
                    <article key={i} className="cost-item">
                      <h3>{t.disease_name}</h3>
                      <p>{t.department}</p>
                      <div className="meta-line">
                        <span className="tag">NPR {t.total_estimated_cost_npr || "Confirm at lab"}</span>
                        <span className="tag">{(t.required_diagnostic_tests || []).length} tests</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {activeScreen === "doctors" && (
          <section>
            <div className="section-intro with-actions">
              <div>
                <p className="eyebrow">Doctor directory</p>
                <h1>Find the right specialist faster.</h1>
                <p>Search by doctor, hospital, department, or specialty.</p>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => window.print()}><Printer /> Print list</button>
            </div>
            <div className="filter-row">
              {departments.map(dept => (
                <button key={dept} className={`filter-chip ${dept === activeDepartment ? "is-active" : ""}`} type="button" onClick={() => setActiveDepartment(dept!)}>{dept}</button>
              ))}
            </div>
            <div className="doctor-grid">
              {filteredDoctors.length ? filteredDoctors.map((d, i) => (
                <article key={i} className="doctor-card">
                  <div className="doctor-card-header">
                    <img src={d.photo_url || "/profile.jpeg"} alt={`${d.name} profile`} width={58} height={58} />
                    <div><h3>{d.name}</h3><p>{d.qualification || "Medical specialist"}</p></div>
                  </div>
                  <span className="pill">{d.department || "General"}</span>
                  <p>{d.specialty || "Specialist care"}</p>
                  <div className="doctor-meta">
                    <span><Hospital size={16} /> {d.hospital || "Hospital details unavailable"}</span>
                    <span><Clock size={16} /> {d.opd_timing || "Confirm OPD timing before visiting"}</span>
                  </div>
                  <button className="btn btn-primary btn-block" type="button" onClick={() => showToast("Appointment request saved", `${d.name} will be added to your care plan.`)}><CalendarPlus /> Book appointment</button>
                </article>
              )) : <div className="empty-state"><SearchX /><h3>No doctors found</h3><p>Try a different department or search term.</p></div>}
            </div>
          </section>
        )}

        {activeScreen === "records" && (
          <section>
            <div className="section-intro with-actions">
              <div>
                <p className="eyebrow">Tests and records</p>
                <h1>Know the test plan before the visit.</h1>
                <p>Compare recommended diagnostics, cost ranges, and follow-up expectations in NPR.</p>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => {
                const blob = new Blob([JSON.stringify({ diseases_diagnostic_data: tests }, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = "swasthya-test-summary.json"; a.click();
                URL.revokeObjectURL(url);
                showToast("Summary exported", "A JSON copy of the test-cost summary was downloaded.");
              }}><Download /> Export summary</button>
            </div>
            <div className="test-grid">
              {filteredTests.length ? filteredTests.map((t, i) => (
                <article key={i} className="test-card">
                  <span className="icon-bubble"><FlaskConical /></span>
                  <div>
                    <span className="pill">{t.department || "Diagnostic care"}</span>
                    <h3>{t.disease_name}</h3>
                    <p>{t.average_follow_up_time || "Follow up timing depends on clinician review."}</p>
                  </div>
                  <ul className="test-list">
                    {(t.required_diagnostic_tests || []).slice(0, 4).map((test, j) => (
                      <li key={j}><span>{test.test_name}</span><strong>NPR {test.cost_range_npr}</strong></li>
                    ))}
                  </ul>
                  <span className="pill">Estimated total: NPR {t.total_estimated_cost_npr || "Confirm locally"}</span>
                </article>
              )) : <div className="empty-state"><SearchX /><h3>No test plan found</h3><p>Try dengue, typhoid, cataract, or diabetes.</p></div>}
            </div>
          </section>
        )}

        {activeScreen === "emergency" && (
          <section>
            <div className="emergency-hero">
              <div>
                <p className="eyebrow">Emergency support</p>
                <h1>Do not wait if symptoms are severe.</h1>
                <p>Call local emergency services or visit the nearest emergency department for chest pain, breathing difficulty, stroke symptoms, loss of consciousness, heavy bleeding, or severe dehydration.</p>
              </div>
              <div className="emergency-actions">
                <a className="btn btn-danger" href="tel:102"><PhoneCall /> Call ambulance 102</a>
                <a className="btn btn-secondary" href="tel:100"><ShieldAlert /> Police 100</a>
              </div>
            </div>
            <div className="edge-grid">
              {edgeCases.slice(0, 4).map((c, i) => (
                <article key={i} className="edge-card">
                  <span className="pill">{c.case_id || "Risk case"}</span>
                  <h3>{c.title}</h3>
                  <p>{c.patient_profile || ""}</p>
                  <div className="symptom-line">{(c.reported_symptoms || []).slice(0, 4).map((s, j) => <span key={j} className="tag">{s}</span>)}</div>
                  <p><strong>{c.expected_department || "Emergency care"}</strong></p>
                  <p>{c.recommended_action || "Seek urgent clinician review."}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeScreen === "profile" && (
          <section className="profile-layout">
            <section className="panel profile-card">
              <img src="/profile.jpeg" alt="Patient profile" width={108} height={108} />
              <div>
                <p className="eyebrow">Patient profile</p>
                <h1>Sanskar Joshi</h1>
                <p>Pokhara, Gandaki Province</p>
                <span className="pill good">Records verified</span>
              </div>
            </section>
            <section className="panel">
              <div className="panel-header">
                <div><p className="eyebrow">Onboarding</p><h2>Before your next visit</h2></div>
              </div>
              <ol className="checklist">
                <li><Check /><span>Bring previous reports or upload photos before reaching the hospital.</span></li>
                <li><Check /><span>Write down symptom start time, severity, medicines taken, and allergies.</span></li>
                <li><Check /><span>Use the test-cost screen to plan budget and follow-up timing.</span></li>
              </ol>
            </section>
          </section>
        )}
      </main>

      <button className="chat-fab" type="button" onClick={() => setChatOpen(true)}><MessageCircleHeart /></button>

      {chatOpen && (
        <div className="chat-overlay" onClick={e => { if (e.target === e.currentTarget) setChatOpen(false); }}>
          <div className="chat-popup">
            <div className="chat-header">
              <div><strong>Symptom Checker</strong><small>AI-assisted triage</small></div>
              <button className="icon-button" type="button" onClick={() => setChatOpen(false)}><X /></button>
            </div>
            <div className="chat-messages">
              {chatMessages.length === 0 && (
                <div className="chat-msg bot"><strong>Swasthya Sathi</strong><span>Namaste! I can help match your symptoms to the right department. Describe what you&apos;re feeling — for example fever, headache, or chest pain.</span></div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  {msg.role === "bot" && <strong>Swasthya Sathi</strong>}
                  <span>{msg.text}</span>
                  {msg.matches && msg.matches.map((d, j) => (
                    <div key={j} className="chat-match">
                      <strong>{j === 0 ? "Closest match" : `Match ${j + 1}`}: {d.name}</strong>
                      <span>{d.context || "Consult a clinician."}</span>
                      <div className="symptom-line">
                        <span className="tag">{d.department || "General"}</span>
                        {(d.symptoms || []).slice(0, 3).map((s, k) => <span key={k} className="tag">{s}</span>)}
                      </div>
                    </div>
                  ))}
                  {msg.matches && <span style={{ marginTop: 8, fontSize: "0.82rem", color: "var(--muted)" }}>This is not a diagnosis. Please consult a doctor for confirmation.</span>}
                </div>
              ))}
            </div>
            <form className="chat-input-row" onSubmit={handleSendChat}>
              <input type="text" placeholder="Describe your symptoms..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button className="btn btn-primary" type="submit"><Send /></button>
            </form>
          </div>
        </div>
      )}

      <nav className="mobile-nav">
        <button className={activeScreen === "home" ? "is-active" : ""} type="button" onClick={() => setActiveScreen("home")}><LayoutDashboard /><span>Home</span></button>
        <button type="button" onClick={() => setChatOpen(true)}><MessageCircleHeart /><span>Check</span></button>
        <button className={activeScreen === "doctors" ? "is-active" : ""} type="button" onClick={() => setActiveScreen("doctors")}><Stethoscope /><span>Doctors</span></button>
        <button className={activeScreen === "records" ? "is-active" : ""} type="button" onClick={() => setActiveScreen("records")}><FileHeart /><span>Tests</span></button>
      </nav>

      <div className="toast-region">
        {toasts.map(t => (
          <div key={t.id} className="toast"><strong>{t.title}</strong><span>{t.message}</span></div>
        ))}
      </div>
    </div>
  );
}
