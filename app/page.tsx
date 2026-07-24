"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  HeartPulse, UserRound, Stethoscope, LockKeyhole, LayoutDashboard, FileHeart,
  Siren, ShieldUser, Search, Moon, Sun, Bell, LogOut, Sparkles, CalendarPlus,
  ClipboardCheck, Activity, Building2, ReceiptText, Printer, Download,
  MessageCircleHeart, Send, X, Hospital, Clock, SearchX, PhoneCall, ShieldAlert,
  Check, FlaskConical, Mail, KeyRound, UserPlus, ArrowLeft, ClipboardList,
  Thermometer, Droplets, Weight, Ruler, Pill, Timer, AlertCircle, BellRing, TriangleAlert
} from "lucide-react";

type Doctor = { name?: string; department?: string; hospital?: string; specialty?: string; qualification?: string; opd_timing?: string; photo_url?: string };
type Disease = { name?: string; nepaliName?: string; department?: string; symptoms?: string[]; context?: string; source?: string; action?: string };
type TestItem = { disease_name?: string; department?: string; total_estimated_cost_npr?: string; average_follow_up_time?: string; required_diagnostic_tests?: { test_name?: string; cost_range_npr?: string }[] };
type EdgeCase = { case_id?: string; title?: string; patient_profile?: string; reported_symptoms?: string[]; expected_department?: string; recommended_action?: string };
type HealthRecord = { id?: string; visit_date?: string; diagnosis?: string; treatment?: string; notes?: string; record_type?: string; status?: string };
type Vital = { id?: string; recorded_at?: string; temperature?: number; blood_pressure_systolic?: number; blood_pressure_diastolic?: number; heart_rate?: number; spo2?: number; notes?: string };
type Prescription = { id?: string; medication_name?: string; dosage?: string; frequency?: string; route?: string; start_date?: string; end_date?: string; status?: string; notes?: string; times?: string[]; follow_up?: string };

const STATIC_PRESCRIPTIONS: Prescription[] = [
  { id: "RX-001", medication_name: "Amlodipine 5mg", dosage: "5mg", frequency: "Once daily", route: "Oral", start_date: "2026-07-20", end_date: "2026-08-20", status: "active", notes: "Take in the morning. Monitor BP regularly.", times: ["08:00"], follow_up: "2026-08-03" },
  { id: "RX-002", medication_name: "Metformin 500mg", dosage: "500mg", frequency: "Twice daily", route: "Oral", start_date: "2026-07-18", end_date: "2026-10-18", status: "active", notes: "Take with meals to reduce stomach upset.", times: ["08:00", "20:00"], follow_up: "2026-08-15" },
  { id: "RX-003", medication_name: "Paracetamol 650mg", dosage: "650mg", frequency: "Every 6 hours as needed", route: "Oral", start_date: "2026-07-22", end_date: "2026-07-29", status: "active", notes: "For fever only. Do not exceed 4 doses in 24 hours.", times: ["08:00", "14:00", "20:00", "02:00"] },
  { id: "RX-004", medication_name: "Cetirizine 10mg", dosage: "10mg", frequency: "Once daily at bedtime", route: "Oral", start_date: "2026-07-15", end_date: "2026-07-30", status: "active", notes: "For allergic rhinitis. May cause drowsiness.", times: ["22:00"] },
  { id: "RX-005", medication_name: "Omeprazole 20mg", dosage: "20mg", frequency: "Once daily before breakfast", route: "Oral", start_date: "2026-07-10", end_date: "2026-08-10", status: "active", notes: "Take 30 minutes before eating.", times: ["07:00"] },
];

function calcBMI(weightKg: string, heightCm: string): string {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);
  if (!w || !h || h <= 0) return "--";
  const hm = h / 100;
  return (w / (hm * hm)).toFixed(1);
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "bot" | "user"; text: string; matches?: Disease[] }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [toasts, setToasts] = useState<{ id: number; title: string; message: string }[]>([]);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bandVitals, setBandVitals] = useState({ bp: "120/80", hr: "72", spo2: "98", temp: "98.6" });
  const [manualVitals, setManualVitals] = useState({ weight: "", height: "" });
  const [editingVital, setEditingVital] = useState<string | null>(null);

  const supabase = createClient();
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
    async function loadAllData() {
      const [docsRes, disRes, testsRes, edgesRes] = await Promise.all([
        supabase.from("doctors").select("*, departments(name), hospitals(name)"),
        supabase.from("diseases").select("*, departments(name), disease_symptoms(symptoms(name))"),
        supabase.from("diagnostic_tests").select("*"),
        supabase.from("edge_cases").select("*"),
      ]);

      if (docsRes.data) {
        setDoctors(docsRes.data.map(d => ({
          name: d.name,
          department: (d as any).departments?.name || "General",
          hospital: (d as any).hospitals?.name,
          specialty: d.specialty,
          qualification: d.qualification,
          opd_timing: d.opd_timing,
          photo_url: d.photo_url,
        })));
      }

      if (disRes.data) {
        setDiseases(disRes.data.map(d => ({
          name: d.name,
          department: (d as any).departments?.name || "General",
          symptoms: [...new Set(((d as any).disease_symptoms || []).map((ds: any) => ds.symptoms?.name).filter((s: any) => s))] as string[],
          context: d.nepal_context || d.description || "",
          nepaliName: d.nepali_name,
        })));
      }

      if (testsRes.data) {
        const grouped: Record<string, any> = {};
        testsRes.data.forEach(t => {
          const key = t.disease_name;
          if (!grouped[key]) {
            grouped[key] = {
              disease_name: t.disease_name,
              department: t.department,
              required_diagnostic_tests: [],
              total_estimated_cost_npr: t.total_estimated_cost_npr,
              average_follow_up_time: t.average_follow_up_time,
            };
          }
          grouped[key].required_diagnostic_tests.push({ test_name: t.test_name, cost_range_npr: t.cost_range_npr });
        });
        setTests(Object.values(grouped));
      }

      if (edgesRes.data) setEdgeCases(edgesRes.data as any);
      setDataLoaded(true);
    }
    loadAllData();
  }, []);

  useEffect(() => {
    async function loadMedicalHistory() {
      if (!user) return;

      const { data: records } = await supabase
        .from("health_records")
        .select("*")
        .eq("patient_id", user.id)
        .order("visit_date", { ascending: false })
        .limit(20);

      setHealthRecords(records?.length ? records : [
        { id: "1", visit_date: "2026-07-10", diagnosis: "Viral Fever", treatment: "Paracetamol 500mg, rest, fluids", notes: "Fever lasted 4 days. Follow-up in 1 week.", record_type: "visit", status: "completed" },
        { id: "2", visit_date: "2026-06-22", diagnosis: "Acute Gastroenteritis", treatment: "ORS, Metronidazole 400mg", notes: "Dehydration on arrival. IV fluids administered.", record_type: "visit", status: "completed" },
        { id: "3", visit_date: "2026-05-15", diagnosis: "Seasonal Allergic Rhinitis", treatment: "Cetirizine 10mg, nasal spray", notes: "Pollen season trigger. Avoid dusty areas.", record_type: "visit", status: "completed" },
        { id: "4", visit_date: "2026-04-03", diagnosis: "Dengue Fever (mild)", treatment: "Paracetamol, fluids, platelet monitoring", notes: "NS1 positive. Platelets dropped to 90k, recovered in 5 days.", record_type: "lab", status: "completed" },
        { id: "5", visit_date: "2026-02-18", diagnosis: "Routine Health Checkup", treatment: "No treatment needed", notes: "All vitals normal. Recommended annual checkup.", record_type: "report", status: "completed" },
      ]);

      const { data: vitalsData } = await supabase
        .from("vitals")
        .select("*")
        .eq("patient_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(10);

      setVitals(vitalsData?.length ? vitalsData : [
        { id: "1", recorded_at: "2026-07-10T10:30:00Z", temperature: 38.6, blood_pressure_systolic: 120, blood_pressure_diastolic: 78, heart_rate: 88, spo2: 97, notes: "Fever episode" },
        { id: "2", recorded_at: "2026-06-22T09:15:00Z", temperature: 37.8, blood_pressure_systolic: 115, blood_pressure_diastolic: 75, heart_rate: 82, spo2: 98, notes: "Stomach infection" },
        { id: "3", recorded_at: "2026-05-15T14:00:00Z", temperature: 37.2, blood_pressure_systolic: 118, blood_pressure_diastolic: 76, heart_rate: 76, spo2: 99, notes: "Allergy visit" },
        { id: "4", recorded_at: "2026-04-03T11:45:00Z", temperature: 39.2, blood_pressure_systolic: 110, blood_pressure_diastolic: 70, heart_rate: 95, spo2: 96, notes: "Dengue acute phase" },
        { id: "5", recorded_at: "2026-02-18T10:00:00Z", temperature: 36.8, blood_pressure_systolic: 122, blood_pressure_diastolic: 80, heart_rate: 72, spo2: 99, notes: "Annual checkup - normal" },
      ]);

      const { data: rxData } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", user.id)
        .order("prescribed_at", { ascending: false })
        .limit(20);

      setPrescriptions(rxData?.length ? rxData : [
        { id: "1", medication_name: "Paracetamol", dosage: "500mg", frequency: "Every 6 hours as needed", route: "Oral", start_date: "2026-07-10", end_date: "2026-07-17", status: "completed", notes: "For fever and body pain" },
        { id: "2", medication_name: "Metronidazole", dosage: "400mg", frequency: "3 times daily after meals", route: "Oral", start_date: "2026-06-22", end_date: "2026-06-27", status: "completed", notes: "For gastroenteritis" },
        { id: "3", medication_name: "Cetirizine", dosage: "10mg", frequency: "Once daily at night", route: "Oral", start_date: "2026-05-15", end_date: "2026-05-30", status: "completed", notes: "For allergic rhinitis" },
        { id: "4", medication_name: "ORS Sachets", dosage: "1 packet in 1L water", frequency: "Sip throughout the day", route: "Oral", start_date: "2026-04-03", end_date: "2026-04-10", status: "completed", notes: "Dengue hydration support" },
        { id: "5", medication_name: "Montelukast", dosage: "10mg", frequency: "Once daily before bed", route: "Oral", start_date: "2026-02-18", end_date: "ongoing", status: "active", notes: "Seasonal allergy prevention" },
      ]);
    }
    loadMedicalHistory();
  }, [user, supabase]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("swasthya-theme", next ? "dark" : "light");
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthBusy(true);

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: { data: { full_name: authFullName, role: selectedRole } },
      });
      if (error) {
        const msg = error.message.toLowerCase().includes("already registered")
          ? "This email is already registered. Please sign in instead, or use a different email."
          : error.message;
        setAuthError(msg);
        setAuthBusy(false);
        return;
      }
      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          role: selectedRole,
          name: authFullName,
          email: authEmail,
        });
      }
      if (data.user && !data.session) {
        showToast("Check your email", "We sent a confirmation link to verify your account.");
        setAuthBusy(false);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthError(error.message);
        setAuthBusy(false);
        return;
      }
      const userRole = data.user?.user_metadata?.role;
      if (userRole && userRole !== selectedRole) {
        await supabase.auth.signOut();
        setAuthError(`This email is registered as a ${userRole}. Please select the "${userRole}" role to sign in.`);
        setAuthBusy(false);
        return;
      }
    }

    if (selectedRole === "doctor") {
      window.location.href = "/doctor";
      return;
    }
    showToast("Signed in", "Welcome to Swasthya Sathi.");
    setAuthBusy(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast("Signed out", "You have been logged out securely.");
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

  function severityLevel(diagnosis: string): { level: "critical" | "high" | "medium" | "low" | "healthy"; label: string } {
    const d = (diagnosis || "").toLowerCase();
    if (d.includes("heart failure") || d.includes("stroke") || d.includes("hape") || d.includes("hace") || d.includes("pulmonary tuberculosis") || d.includes("severe dengue")) return { level: "critical", label: "Critical" };
    if (d.includes("dengue") || d.includes("copd") || d.includes("coronary artery") || d.includes("angina") || d.includes("hypertension") || d.includes("diabetes") || d.includes("scrub typhus") || d.includes("typhoid") || d.includes("pneumonia")) return { level: "high", label: "High" };
    if (d.includes("gastroenteritis") || d.includes("sinusitis") || d.includes("migraine") || d.includes("osteoarthritis") || d.includes("tonsillitis") || d.includes("otitis media") || d.includes("hepatitis")) return { level: "medium", label: "Medium" };
    if (d.includes("cold") || d.includes("viral fever") || d.includes("allergic") || d.includes("rhinitis") || d.includes("rash") || d.includes("fungal") || d.includes("cataract")) return { level: "low", label: "Low" };
    if (d.includes("routine") || d.includes("checkup") || d.includes("normal") || d.includes("healthy")) return { level: "healthy", label: "Healthy" };
    return { level: "low", label: "Low" };
  }

  const severityColors: Record<string, string> = {
    critical: "var(--danger)",
    high: "var(--amber)",
    medium: "#f59e0b",
    low: "var(--primary)",
    healthy: "var(--success)",
  };
  const severityBgs: Record<string, string> = {
    critical: "var(--danger-soft)",
    high: "var(--amber-soft)",
    medium: "#fef3c7",
    low: "var(--primary-soft)",
    healthy: "var(--success-soft)",
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setChatInput("");

    const updatedMessages = [...chatMessages, { role: "user" as const, text: userText }];

    let accessToken = "";
    try {
      const { data: { session } } = await supabase.auth.getSession();
      accessToken = session?.access_token || "";
    } catch {}

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.text })),
          accessToken,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: "bot", text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { role: "bot", text: data.error || "Sorry, Swasthya AI encountered an error. Please try again." }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: "bot", text: "Could not reach Swasthya AI. Please check your connection and try again." }]);
    }
  };

  if (authLoading) {
    return (
      <div className="login-view" style={{ placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <span className="brand-mark" style={{ width: 64, height: 64, fontSize: 28 }}><HeartPulse /></span>
          <p style={{ marginTop: 16, color: "var(--muted)" }}>Loading Swasthya Sathi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
          <p className="login-copy">Regional symptom guidance, trusted doctors, and diagnostic costs for patients in Pokhara.</p>
          <div className="role-grid" role="radiogroup" aria-label="Choose portal">
            <button className={`role-card ${selectedRole === "patient" ? "is-selected" : ""}`} type="button" onClick={() => setSelectedRole("patient")}>
              <UserRound /><span>Patient</span><small>Check symptoms and find care</small>
            </button>
            <button className={`role-card ${selectedRole === "doctor" ? "is-selected" : ""}`} type="button" onClick={() => setSelectedRole("doctor")}>
              <Stethoscope /><span>Doctor</span><small>Review patients and schedule</small>
            </button>
          </div>

          {authMode === "login" ? (
            <form className="login-form" onSubmit={handleAuth}>
              <label>
                <span>Email address</span>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                  <input type="email" required autoComplete="email" placeholder="you@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
              </label>
              <label>
                <span>Password</span>
                <div style={{ position: "relative" }}>
                  <KeyRound size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                  <input type="password" required autoComplete="current-password" placeholder="Enter your password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
              </label>
              {authError && <p className="form-note">{authError}</p>}
              <button className="btn btn-primary btn-block" type="submit" disabled={authBusy}>
                <LockKeyhole /> {authBusy ? "Please wait..." : "Sign in"}
              </button>
              <button className="btn btn-text btn-block" type="button" onClick={() => { setAuthMode("signup"); setAuthError(""); }}>
                <UserPlus /> Don&apos;t have an account? Sign up
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleAuth}>
              <label>
                <span>Full name</span>
                <div style={{ position: "relative" }}>
                  <UserRound size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                  <input type="text" required autoComplete="name" placeholder="Sanskar Joshi" value={authFullName} onChange={e => setAuthFullName(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
              </label>
              <label>
                <span>Email address</span>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                  <input type="email" required autoComplete="email" placeholder="you@example.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
              </label>
              <label>
                <span>Password</span>
                <div style={{ position: "relative" }}>
                  <KeyRound size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
                  <input type="password" required autoComplete="new-password" placeholder="Min 6 characters" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ paddingLeft: 36 }} />
                </div>
              </label>
              {authError && <p className="form-note">{authError}</p>}
              <button className="btn btn-primary btn-block" type="submit" disabled={authBusy}>
                <UserPlus /> {authBusy ? "Please wait..." : "Create account"}
              </button>
              <button className="btn btn-text btn-block" type="button" onClick={() => { setAuthMode("login"); setAuthError(""); }}>
                <ArrowLeft /> Already have an account? Sign in
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const screenTitles: Record<string, string> = { home: "Overview", doctors: "Doctors", records: "Tests & Records", history: "Past Records", prescriptions: "Prescriptions", emergency: "Emergency", profile: "Profile" };
  const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Patient";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="sidebar-brand" href="/" onClick={() => setActiveScreen("home")}>
          <span className="brand-mark"><HeartPulse /></span>
          <span><strong>Swasthya Sathi</strong><small>Patient portal</small></span>
        </Link>
        <nav className="side-nav">
          {(["home", "doctors", "records", "history", "prescriptions", "emergency", "profile"] as const).map(s => (
            <button key={s} className={`nav-item ${activeScreen === s ? "is-active" : ""}`} type="button" onClick={() => setActiveScreen(s)}>
              {s === "home" && <LayoutDashboard />}
              {s === "doctors" && <Stethoscope />}
              {s === "records" && <FileHeart />}
              {s === "history" && <ClipboardList />}
              {s === "prescriptions" && <Pill />}
              {s === "emergency" && <Siren />}
              {s === "profile" && <ShieldUser />}
              <span>{screenTitles[s]}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <span className={`status-dot ${dataLoaded ? "is-ready" : ""}`}></span>
          <strong>Data source</strong>
          <p>{dataLoaded ? (dataLoaded ? "All data loaded successfully." : "Loading...") : "Loading data..."}</p>
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
          <button className="icon-button" type="button" onClick={handleLogout}><LogOut /></button>
        </div>
      </header>

      <main className="content-shell">
        {activeScreen === "home" && (
          <>
            <div className="hero-grid">
              <article className="hero-card">
                <div>
                  <p className="eyebrow">Care snapshot</p>
                  <h1>Namaste, {userName}. Your health journey starts here — track vitals, check symptoms, and connect with the right doctors in Pokhara, all in one place.</h1>
                </div>
                <div className="hero-actions">
                  <button className="btn btn-primary" type="button" onClick={() => setChatOpen(true)}><Sparkles /> Start symptom check</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setActiveScreen("doctors")}><CalendarPlus /> Find a doctor</button>
                </div>
              </article>
              <aside className="next-visit-card" style={{ background: "var(--primary-soft)" }}>
                <span className="pill">Reminders</span>
                <h2 style={{ fontSize: "1rem" }}>Medicine schedule</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {STATIC_PRESCRIPTIONS.filter(p => p.times && p.times.length).slice(0, 3).map((rx, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="vital-icon" style={{ width: 28, height: 28, minWidth: 28, fontSize: 12 }}><Pill size={14} /></span>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: "0.82rem", color: "var(--ink)" }}>{rx.medication_name}</strong>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>{rx.times?.[0]} — {rx.dosage}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-ghost" type="button" onClick={() => setActiveScreen("prescriptions")}><BellRing /> View all</button>
              </aside>
            </div>

            <section className="panel" style={{ marginBottom: "18px" }}>
              <div className="panel-header">
                <div><p className="eyebrow">Vitals</p><h2>Your health readings</h2></div>
                <span className="pill">Band-synced</span>
              </div>
              <div className="vitals-grid">
                <article className="vital-card" style={{ background: "linear-gradient(135deg, #fce4ec, #fff)" }}>
                  <div className="vital-top">
                    <span className="vital-icon" style={{ background: "#e91e6333", color: "#e91e63" }}><HeartPulse /></span>
                    <span className="vital-status">Normal</span>
                  </div>
                  <div className="vital-reading">{bandVitals.hr}<small>bpm</small></div>
                  <span className="vital-label">Heart rate</span>
                </article>
                <article className="vital-card" style={{ background: "linear-gradient(135deg, #e3f2fd, #fff)" }}>
                  <div className="vital-top">
                    <span className="vital-icon" style={{ background: "#2196f333", color: "#2196f3" }}><Activity /></span>
                    <span className="vital-status">Normal</span>
                  </div>
                  <div className="vital-reading">{bandVitals.bp}<small>mmHg</small></div>
                  <span className="vital-label">Blood pressure</span>
                </article>
                <article className="vital-card" style={{ background: "linear-gradient(135deg, #e8f5e9, #fff)" }}>
                  <div className="vital-top">
                    <span className="vital-icon" style={{ background: "#4caf5033", color: "#4caf50" }}><Droplets /></span>
                    <span className="vital-status">Good</span>
                  </div>
                  <div className="vital-reading">{bandVitals.spo2}<small>%</small></div>
                  <span className="vital-label">SpO₂</span>
                </article>
                <article className="vital-card" style={{ background: "linear-gradient(135deg, #fff3e0, #fff)" }}>
                  <div className="vital-top">
                    <span className="vital-icon" style={{ background: "#ff980033", color: "#ff9800" }}><Thermometer /></span>
                    <span className="vital-status">Normal</span>
                  </div>
                  <div className="vital-reading">{bandVitals.temp}<small>&deg;F</small></div>
                  <span className="vital-label">Temperature</span>
                </article>
                <article className="vital-card" style={{ background: "linear-gradient(135deg, #f3e5f5, #fff)", cursor: "pointer" }} onClick={() => setEditingVital(editingVital === "weight" ? null : "weight")}>
                  <div className="vital-top">
                    <span className="vital-icon" style={{ background: "#9c27b033", color: "#9c27b0" }}><Weight /></span>
                    <span className="vital-status">{manualVitals.weight ? "Set" : "Tap"}</span>
                  </div>
                  {editingVital === "weight" ? (
                    <input type="number" placeholder="65" value={manualVitals.weight} onChange={e => setManualVitals(p => ({ ...p, weight: e.target.value }))} className="vital-input-inline" autoFocus onBlur={() => setEditingVital(null)} />
                  ) : (
                    <div className="vital-reading">{manualVitals.weight || "—"}<small>kg</small></div>
                  )}
                  <span className="vital-label">Weight</span>
                </article>
                <article className="vital-card" style={{ background: "linear-gradient(135deg, #e0f2f1, #fff)", cursor: "pointer" }} onClick={() => setEditingVital(editingVital === "height" ? null : "height")}>
                  <div className="vital-top">
                    <span className="vital-icon" style={{ background: "#00968833", color: "#009688" }}><Ruler /></span>
                    <span className="vital-status">{manualVitals.height ? "Set" : "Tap"}</span>
                  </div>
                  {editingVital === "height" ? (
                    <input type="number" placeholder="170" value={manualVitals.height} onChange={e => setManualVitals(p => ({ ...p, height: e.target.value }))} className="vital-input-inline" autoFocus onBlur={() => setEditingVital(null)} />
                  ) : (
                    <div className="vital-reading">{manualVitals.height || "—"}<small>cm</small></div>
                  )}
                  <span className="vital-label">Height</span>
                </article>
                <article className="vital-card" style={{ background: "linear-gradient(135deg, #fffde7, #fff)" }}>
                  <div className="vital-top">
                    <span className="vital-icon" style={{ background: "#ffc10733", color: "#ffc107" }}><Activity /></span>
                    <span className="vital-status">{manualVitals.weight && manualVitals.height ? "Computed" : "––"}</span>
                  </div>
                  <div className="vital-reading">{calcBMI(manualVitals.weight, manualVitals.height)}<small>kg/m²</small></div>
                  <span className="vital-label">BMI</span>
                </article>
              </div>
            </section>

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
                  <div><p className="eyebrow">Common in Pokhara</p><h2>Symptoms to watch</h2></div>
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

        {activeScreen === "history" && (
          <section>
            <div className="section-intro">
              <div>
                <p className="eyebrow">Medical history</p>
                <h1>Your past records, vitals, and medications.</h1>
                <p>All data is fetched from your Supabase health records.</p>
              </div>
            </div>

            <div className="layout-two">
              <section className="panel">
                <div className="panel-header">
                  <div><p className="eyebrow">Visit history</p><h2>Past diagnoses</h2></div>
                </div>
                {healthRecords.length ? (
                  <div className="condition-list">
                    {healthRecords.map((r, i) => {
                      const sev = severityLevel(r.diagnosis || "");
                      return (
                        <article key={i} className="condition-item" style={{ borderLeft: `5px solid ${severityColors[sev.level]}`, background: severityBgs[sev.level] }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span className="pill" style={{ background: severityColors[sev.level], color: "#fff", borderColor: "transparent" }}>{sev.label}</span>
                            <span className="pill">{r.record_type || "visit"}</span>
                          </div>
                          <h3>{r.diagnosis || "No diagnosis recorded"}</h3>
                          <p>{r.treatment || "No treatment notes"}</p>
                          <div className="meta-line">
                            <span className="tag">{r.visit_date || "Unknown date"}</span>
                            <span className="tag">{r.status || "completed"}</span>
                          </div>
                          {r.notes && <p style={{ marginTop: 6, fontSize: "0.85rem", color: "var(--muted)" }}>{r.notes}</p>}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state"><SearchX /><h3>No past records</h3><p>Your visit history will appear here once recorded by a doctor.</p></div>
                )}
              </section>

              <section className="panel accent-panel">
                <div className="panel-header">
                  <div><p className="eyebrow">Vitals</p><h2>Recent measurements</h2></div>
                </div>
                {vitals.length ? (
                  <div className="cost-stack">
                    {vitals.map((v, i) => (
                      <article key={i} className="cost-item">
                        <h3>{v.recorded_at?.split("T")[0] || "Unknown"}</h3>
                        <div className="meta-line">
                          {v.temperature && <span className="tag">Temp: {v.temperature}°C</span>}
                          {v.blood_pressure_systolic && <span className="tag">BP: {v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span>}
                          {v.heart_rate && <span className="tag">HR: {v.heart_rate} bpm</span>}
                          {v.spo2 && <span className="tag">SpO2: {v.spo2}%</span>}
                        </div>
                        {v.notes && <p style={{ marginTop: 4, fontSize: "0.85rem", color: "var(--muted)" }}>{v.notes}</p>}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state"><SearchX /><h3>No vitals recorded</h3><p>Vital measurements will appear here after a checkup.</p></div>
                )}
              </section>
            </div>

            <section className="panel" style={{ marginTop: 20 }}>
              <div className="panel-header">
                <div><p className="eyebrow">Medications</p><h2>Prescriptions</h2></div>
              </div>
              {prescriptions.length ? (
                <div className="test-grid">
                  {prescriptions.map((p, i) => (
                    <article key={i} className="test-card">
                      <span className="icon-bubble"><FlaskConical /></span>
                      <div>
                        <span className={`pill ${p.status === "active" ? "good" : ""}`}>{p.status || "active"}</span>
                        <h3>{p.medication_name}</h3>
                        <p>{p.dosage || ""} {p.frequency || ""} {p.route || ""}</p>
                      </div>
                      <div className="meta-line">
                        <span className="tag">{p.start_date || ""} → {p.end_date || "ongoing"}</span>
                      </div>
                      {p.notes && <p style={{ marginTop: 4, fontSize: "0.85rem", color: "var(--muted)" }}>{p.notes}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><SearchX /><h3>No prescriptions</h3><p>Medication history will appear here once prescribed.</p></div>
              )}
            </section>
          </section>
        )}

        {activeScreen === "prescriptions" && (
          <section>
            <div className="section-intro">
              <p className="eyebrow">Prescriptions & reminders</p>
              <h1>Your medicines, on schedule.</h1>
              <p>Track every dose, never miss a follow-up. Reminders ring at the right time so you stay on track.</p>
            </div>

            <div className="panel" style={{ marginBottom: 18 }}>
              <div className="panel-header">
                <div><p className="eyebrow">Upcoming</p><h2>Today&apos;s reminders</h2></div>
                <span className="pill">{STATIC_PRESCRIPTIONS.filter(p => p.status === "active").length} active</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {STATIC_PRESCRIPTIONS.filter(p => p.times && p.times.length).map((rx, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--surface-strong)" }}>
                    <span className="vital-icon" style={{ width: 38, height: 38, minWidth: 38 }}><Pill size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: "0.95rem", color: "var(--ink)" }}>{rx.medication_name}</strong>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>{rx.dosage} — {rx.route} — {rx.frequency}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {rx.times?.map((t, j) => (
                        <span key={j} className="tag" style={{ display: "flex", alignItems: "center", gap: 4 }}><Timer size={12} /> {t}</span>
                      ))}
                    </div>
                    <button className="btn btn-secondary" type="button" onClick={() => showToast("Reminder set", `${rx.medication_name} reminders are active.`)} style={{ whiteSpace: "nowrap" }}><BellRing size={16} /> Reminder</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 18 }}>
              <div className="panel-header">
                <div><p className="eyebrow">Follow-ups</p><h2>Upcoming appointments</h2></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {STATIC_PRESCRIPTIONS.filter(p => p.follow_up).map((rx, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--radius)", background: "var(--surface-strong)" }}>
                    <span className="vital-icon" style={{ width: 38, height: 38, minWidth: 38, background: "var(--accent-soft)", color: "var(--accent)" }}><CalendarPlus size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: "0.95rem", color: "var(--ink)" }}>Follow-up for {rx.medication_name}</strong>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>Scheduled: {rx.follow_up}</p>
                    </div>
                    <span className="pill">{rx.status}</span>
                    <button className="btn btn-ghost" type="button" onClick={() => showToast("Follow-up reminder", `Reminder set for ${rx.follow_up}.`)}><BellRing size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div><p className="eyebrow">All prescriptions</p><h2>Medication history</h2></div>
              </div>
              <div className="test-grid">
                {STATIC_PRESCRIPTIONS.map((p, i) => (
                  <article key={i} className="test-card">
                    <span className="icon-bubble"><FlaskConical /></span>
                    <div>
                      <span className={`pill ${p.status === "active" ? "good" : ""}`}>{p.status || "active"}</span>
                      <h3>{p.medication_name}</h3>
                      <p>{p.dosage || ""} {p.frequency || ""} {p.route || ""}</p>
                    </div>
                    <div className="meta-line">
                      <span className="tag">{p.start_date || ""} → {p.end_date || "ongoing"}</span>
                    </div>
                    {p.notes && <p style={{ marginTop: 4, fontSize: "0.85rem", color: "var(--muted)" }}>{p.notes}</p>}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeScreen === "profile" && (
          <section className="profile-layout">
            <section className="panel profile-card">
              <div style={{ position: "relative" }}>
                <img src={user.user_metadata?.avatar_url || "/profile.jpeg"} alt="Patient profile" width={108} height={108} style={{ borderRadius: "50%", objectFit: "cover" }} />
                <label htmlFor="avatar-upload" style={{ position: "absolute", bottom: 0, right: 0, width: 32, height: 32, borderRadius: "50%", background: "var(--primary-strong)", color: "white", display: "grid", placeItems: "center", cursor: "pointer", fontSize: 14 }}>
                  <Download size={14} />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const url = reader.result as string;
                    const { error } = await supabase.auth.updateUser({ data: { avatar_url: url } });
                    if (!error) { setUser(prev => prev ? { ...prev, user_metadata: { ...prev.user_metadata, avatar_url: url } } : null); showToast("Photo updated", "Your profile photo has been saved."); }
                  };
                  reader.readAsDataURL(file);
                }} />
              </div>
              <div>
                <p className="eyebrow">Patient profile</p>
                <h1>{userName}</h1>
                <p>{user.email}</p>
                <span className="pill good">Connected to Supabase</span>
              </div>
            </section>
            <section className="panel">
              <div className="panel-header">
                <div><p className="eyebrow">Data sharing</p><h2>Medical history access</h2></div>
              </div>
              <p style={{ marginBottom: 16, color: "var(--muted)", fontSize: "0.9rem" }}>Control who can see your medical records. Doctors can only view your history with your consent or in emergencies.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { key: "emergency", label: "Emergency data access", desc: "Allow doctors to view your vitals and history during emergencies (accidents, unconsciousness).", default: true },
                  { key: "vitals", label: "Share vitals with doctor", desc: "Allow assigned doctors to see your BP, heart rate, SpO2, and temperature readings.", default: true },
                  { key: "prescriptions", label: "Share prescriptions with doctor", desc: "Allow assigned doctors to see your medication history and active prescriptions.", default: true },
                  { key: "records", label: "Share health records", desc: "Allow assigned doctors to see your visit history, diagnoses, and lab reports.", default: true },
                ].map(item => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: "var(--radius)", background: "var(--surface-strong)" }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: "var(--ink)", fontSize: "0.95rem" }}>{item.label}</strong>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--muted)" }}>{item.desc}</p>
                    </div>
                    <label style={{ position: "relative", width: 44, height: 24, cursor: "pointer" }}>
                      <input type="checkbox" defaultChecked={item.default} style={{ display: "none" }} onChange={e => showToast("Setting saved", `${item.label}: ${e.target.checked ? "enabled" : "disabled"}.`)} />
                      <span style={{ position: "absolute", inset: 0, borderRadius: 12, background: "var(--border)", transition: "0.2s" }} className="toggle-track" />
                      <span style={{ position: "absolute", top: 2, left: 2, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} className="toggle-thumb" />
                    </label>
                  </div>
                ))}
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
              <div><strong>Swasthya AI</strong><small>Swasthya Sathi healthcare assistant</small></div>
              <button className="icon-button" type="button" onClick={() => setChatOpen(false)}><X /></button>
            </div>
            <div className="chat-messages">
              <div className="chat-warning"><TriangleAlert size={36} /> <span>Swasthya Sathi provides triage navigation, NOT medical diagnosis. Only a licensed physician can diagnose medical conditions.</span></div>
              {chatMessages.length === 0 && (
                <div className="chat-msg bot"><strong>Swasthya AI</strong><span>Namaste! I am Swasthya AI, your healthcare assistant. I can help you understand symptoms, find the right department, and estimate diagnostic costs. Describe what you&apos;re feeling — for example fever, headache, or chest pain.</span></div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  {msg.role === "bot" && <strong>Swasthya AI</strong>}
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
                  {msg.matches && <span style={{ marginTop: 8, fontSize: "0.82rem", color: "var(--muted)" }}>Swasthya AI is not a doctor. Please consult a medical professional for diagnosis and treatment.</span>}
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
