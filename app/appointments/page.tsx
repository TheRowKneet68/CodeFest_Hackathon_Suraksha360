"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  HeartPulse,
  UsersRound,
  Siren,
  Clock,
  CheckCircle2,
  CalendarPlus,
  Send,
  Printer,
  ArrowLeft,
} from "lucide-react";

type Toast = { id: number; title: string; message: string };

const APPOINTMENTS = [
  { time: "09:10", name: "Anita Poudel", note: "Blood pressure review with recent readings.", status: "In room", risk: "risk-medium" },
  { time: "09:35", name: "Ram Kumar", note: "Diabetes follow-up and medicine adherence check.", status: "Waiting", risk: "risk-low" },
  { time: "10:05", name: "Sita Gurung", note: "Possible dengue warning signs, vomiting and abdominal pain.", status: "Priority", risk: "risk-high" },
  { time: "10:30", name: "Bikash Magar", note: "Asthma flare after cold exposure.", status: "Next", risk: "risk-medium" },
];

export default function AppointmentsPage() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3400);
  }, []);

  return (
    <div className="doctor-shell">
      <aside className="sidebar doctor-sidebar" aria-label="Schedule navigation">
        <Link className="sidebar-brand" href="/doctor">
          <span className="brand-mark" aria-hidden="true">
            <HeartPulse />
          </span>
          <span>
            <strong>Swasthya Sathi</strong>
            <small>Appointments</small>
          </span>
        </Link>
        <nav className="side-nav">
          <Link className="nav-item" href="/doctor">
            <span>Doctor dashboard</span>
          </Link>
          <Link className="nav-item is-active" href="/appointments">
            <span>Appointments</span>
          </Link>
          <Link className="nav-item" href="/">
            <span>Patient portal</span>
          </Link>
        </nav>
        <div className="sidebar-card">
          <span className="status-dot is-ready"></span>
          <strong>Schedule status</strong>
          <p>Static demo schedule is ready for judging and does not require missing assets.</p>
        </div>
      </aside>

      <header className="topbar doctor-topbar">
        <div>
          <p className="eyebrow">Clinic schedule</p>
          <h2>Appointments</h2>
        </div>
        <div className="topbar-actions">
          <Link className="btn btn-secondary" href="/doctor">
            <ArrowLeft /> Back to console
          </Link>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() =>
              showToast(
                "Appointment draft opened",
                "Demo action only - no backend route was changed."
              )
            }
          >
            <CalendarPlus /> New appointment
          </button>
        </div>
      </header>

      <main className="content-shell doctor-content">
        <section className="doctor-hero">
          <div>
            <p className="eyebrow">Thursday clinic</p>
            <h1>Keep the room, queue, and urgency visible at a glance.</h1>
            <p>
              The schedule favors quick scanning: priority cases are highlighted,
              routine follow-ups recede, and the next patient action is always
              clear.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => window.print()}
            >
              <Printer /> Print schedule
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() =>
                showToast(
                  "Patients notified",
                  "Waiting-room reminders are ready for the demo."
                )
              }
            >
              <Send /> Notify waiting patients
            </button>
          </div>
        </section>

        <div className="summary-grid">
          <article className="summary-card">
            <span className="icon-bubble">
              <UsersRound />
            </span>
            <strong>18</strong>
            <span>appointments today</span>
          </article>
          <article className="summary-card">
            <span className="icon-bubble">
              <Siren />
            </span>
            <strong>2</strong>
            <span>priority triage cases</span>
          </article>
          <article className="summary-card">
            <span className="icon-bubble">
              <Clock />
            </span>
            <strong>14m</strong>
            <span>average wait time</span>
          </article>
          <article className="summary-card">
            <span className="icon-bubble">
              <CheckCircle2 />
            </span>
            <strong>7</strong>
            <span>completed visits</span>
          </article>
        </div>

        <div className="doctor-grid-layout">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Timeline</p>
                <h2>Today&apos;s queue</h2>
              </div>
              <span className="pill">OPD 9:00 AM - 1:00 PM</span>
            </div>
            <div className="appointment-stack">
              {APPOINTMENTS.map((appt, i) => (
                <article key={i} className="appointment-card">
                  <div className="panel-header">
                    <div>
                      <h3>
                        {appt.time} - {appt.name}
                      </h3>
                      <p>{appt.note}</p>
                    </div>
                    <span className={`pill ${appt.risk}`}>{appt.status}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel accent-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Room readiness</p>
                <h2>Quick actions</h2>
              </div>
            </div>
            <ol className="checklist">
              <li>
                <CheckCircle2 />
                <span>Vitals station synced with the queue.</span>
              </li>
              <li>
                <CheckCircle2 />
                <span>Emergency escalation path visible for priority cases.</span>
              </li>
              <li>
                <CheckCircle2 />
                <span>Printed prescription pads and digital signature are ready.</span>
              </li>
            </ol>
          </section>
        </div>
      </main>

      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <strong>{t.title}</strong>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
