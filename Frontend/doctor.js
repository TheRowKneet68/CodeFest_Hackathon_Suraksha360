const DOCTOR_DATA = {
  doctors: "../Json%20Files/gandaki_doctors.json",
  common: "../Json%20Files/gandaki_common_diseases.json",
  additional: "../Json%20Files/ADDITIONAL%20DISEASES.json",
  tests: "../Json%20Files/TESTS%20AND%20COST.json"
};

const doctorState = {
  query: "",
  doctors: [],
  diseases: [],
  edgeCases: [],
  tests: [],
  patients: [
    { id: "PAT-1024", name: "Anita Poudel", condition: "Hypertension", department: "Cardiology", risk: "medium", note: "BP log rising for three days", time: "09:10 AM" },
    { id: "PAT-1031", name: "Ram Kumar", condition: "Type 2 Diabetes", department: "General Medicine", risk: "low", note: "Follow-up glucose review", time: "09:35 AM" },
    { id: "PAT-1042", name: "Sita Gurung", condition: "Dengue warning signs", department: "Emergency Medicine", risk: "high", note: "Vomiting and severe abdominal pain", time: "10:05 AM" },
    { id: "PAT-1056", name: "Bikash Magar", condition: "Asthma flare", department: "Pulmonology", risk: "medium", note: "Shortness of breath after cold exposure", time: "10:30 AM" },
    { id: "PAT-1063", name: "Maya Shrestha", condition: "Cataract review", department: "Ophthalmology", risk: "low", note: "Post-op one week check", time: "11:00 AM" }
  ],
  appointments: [
    { time: "09:10", patient: "Anita Poudel", type: "BP review", status: "Checked in" },
    { time: "09:35", patient: "Ram Kumar", type: "Diabetes follow-up", status: "Waiting" },
    { time: "10:05", patient: "Sita Gurung", type: "Urgent triage", status: "Priority" },
    { time: "11:00", patient: "Maya Shrestha", type: "Eye follow-up", status: "Scheduled" }
  ],
  loadErrors: []
};

document.addEventListener("DOMContentLoaded", () => {
  bindDoctorShell();
  loadDoctorData();
  refreshIcons();
});

function bindDoctorShell() {
  document.querySelectorAll("[data-doctor-tab]").forEach((button) => {
    button.addEventListener("click", () => switchDoctorTab(button.dataset.doctorTab));
  });

  document.getElementById("doctor-search").addEventListener("input", (event) => {
    doctorState.query = event.target.value.trim().toLowerCase();
    renderPatientQueue();
    renderQueueTable();
    renderDirectory();
    renderInsights();
  });

  document.getElementById("call-next").addEventListener("click", () => {
    const next = visiblePatients()[0];
    showToast("Calling next patient", next ? `${next.name} is first in the current queue.` : "No visible patients in this filter.");
  });

  document.getElementById("write-note").addEventListener("click", () => {
    showToast("Clinical note opened", "Demo note action saved locally for the presentation.");
  });
}

async function loadDoctorData() {
  const entries = await Promise.all(
    Object.entries(DOCTOR_DATA).map(async ([key, path]) => [key, await loadJson(path, key)])
  );
  const data = Object.fromEntries(entries);

  doctorState.doctors = flattenDoctors(data.doctors);
  doctorState.diseases = flattenDiseases(data.common, data.additional);
  doctorState.edgeCases = data.additional?.critical_misdiagnosis_edge_cases || [];
  doctorState.tests = data.tests?.diseases_diagnostic_data || [];

  document.querySelector(".status-dot")?.classList.add("is-ready");
  document.getElementById("doctor-data-label").textContent = doctorState.loadErrors.length
    ? `${Object.keys(DOCTOR_DATA).length - doctorState.loadErrors.length} of ${Object.keys(DOCTOR_DATA).length} JSON files loaded.`
    : "All clinical JSON files loaded.";

  renderDoctorDashboard();
  refreshIcons();
}

async function loadJson(path, label) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    return parseJsonLenient(text);
  } catch (error) {
    doctorState.loadErrors.push(label);
    console.warn(`Could not load ${label}:`, error);
    return {};
  }
}

function parseJsonLenient(text) {
  try {
    return JSON.parse(text);
  } catch {
    return JSON.parse(text.replace(/,\s*([}\]])/g, "$1"));
  }
}

function flattenDoctors(source = {}) {
  return (source.departments || []).flatMap((department) =>
    (department.doctors || []).map((doctor) => ({ ...doctor, department: department.department }))
  );
}

function flattenDiseases(common = {}, additional = {}) {
  const base = (common.diseases || []).map((disease) => ({
    name: disease.disease,
    department: disease.department,
    symptoms: disease.symptoms || [],
    context: disease.nepal_context
  }));

  const expanded = (additional.healthcare_departments || []).flatMap((department) =>
    (department.common_diseases || []).map((disease) => ({
      name: disease.disease_name,
      department: department.department_name,
      symptoms: disease.symptoms || [],
      context: disease.description
    }))
  );

  return [...base, ...expanded];
}

function renderDoctorDashboard() {
  renderDoctorSummary();
  renderPatientQueue();
  renderAppointments();
  renderQueueTable();
  renderDirectory();
  renderInsights();
}

function renderDoctorSummary() {
  const highRisk = doctorState.patients.filter((patient) => patient.risk === "high").length;
  const departments = new Set(doctorState.doctors.map((doctor) => doctor.department));
  const cards = [
    { icon: "users-round", value: doctorState.patients.length, label: "patients in queue" },
    { icon: "siren", value: highRisk, label: "priority case today" },
    { icon: "stethoscope", value: doctorState.doctors.length, label: "referral doctors" },
    { icon: "building-2", value: departments.size, label: "departments covered" }
  ];

  document.getElementById("doctor-summary").innerHTML = cards.map((card) => `
    <article class="summary-card">
      <span class="icon-bubble">${icon(card.icon)}</span>
      <strong>${card.value}</strong>
      <span>${escapeHtml(card.label)}</span>
    </article>
  `).join("");
}

function renderPatientQueue() {
  const patients = visiblePatients().slice(0, 4);
  document.getElementById("patient-queue").innerHTML = patients.length ? patients.map((patient) => `
    <article class="queue-card">
      <div class="queue-main">
        <span class="avatar-initials">${initials(patient.name)}</span>
        <div>
          <h3>${escapeHtml(patient.name)}</h3>
          <p>${escapeHtml(patient.condition)} - ${escapeHtml(patient.note)}</p>
          <div class="meta-line">
            <span class="tag">${escapeHtml(patient.id)}</span>
            <span class="tag">${escapeHtml(patient.department)}</span>
          </div>
        </div>
      </div>
      <span class="pill risk-${patient.risk}">${escapeHtml(patient.risk)} risk</span>
    </article>
  `).join("") : emptyMarkup("No queue matches", "Clear the doctor search to see all patients.");
}

function renderAppointments() {
  document.getElementById("appointment-stack").innerHTML = doctorState.appointments.map((item) => `
    <article class="appointment-card">
      <div class="panel-header">
        <div>
          <h3>${escapeHtml(item.time)} - ${escapeHtml(item.patient)}</h3>
          <p>${escapeHtml(item.type)}</p>
        </div>
        <span class="pill">${escapeHtml(item.status)}</span>
      </div>
    </article>
  `).join("");
}

function renderQueueTable() {
  const patients = visiblePatients();
  document.getElementById("queue-table").innerHTML = patients.length ? `
    <table>
      <thead>
        <tr><th>Patient</th><th>Condition</th><th>Department</th><th>Risk</th><th>Time</th><th>Action</th></tr>
      </thead>
      <tbody>
        ${patients.map((patient) => `
          <tr>
            <td><div class="table-patient"><span class="avatar-initials">${initials(patient.name)}</span><div><strong>${escapeHtml(patient.name)}</strong><span>${escapeHtml(patient.id)}</span></div></div></td>
            <td>${escapeHtml(patient.condition)}<br><span class="tag">${escapeHtml(patient.note)}</span></td>
            <td>${escapeHtml(patient.department)}</td>
            <td><span class="pill risk-${patient.risk}">${escapeHtml(patient.risk)}</span></td>
            <td>${escapeHtml(patient.time)}</td>
            <td><button class="btn btn-secondary" type="button" data-review="${escapeAttribute(patient.name)}">${icon("file-search")} Review</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : emptyMarkup("No patients found", "Try a broader search.");

  document.querySelectorAll("[data-review]").forEach((button) => {
    button.addEventListener("click", () => showToast("Patient chart opened", `${button.dataset.review} is ready for review.`));
  });
  refreshIcons();
}

function renderDirectory() {
  const doctors = filterItems(doctorState.doctors, (doctor) =>
    [doctor.name, doctor.department, doctor.hospital, doctor.specialty].join(" ")
  );

  document.getElementById("doctor-directory").innerHTML = doctors.length ? doctors.map((doctor) => `
    <article class="doctor-card">
      <div class="doctor-card-header">
        <img src="${escapeAttribute(doctor.photo_url || "profile.jpeg")}" alt="${escapeAttribute(doctor.name || "Doctor")} profile photo" loading="lazy">
        <div>
          <h3>${escapeHtml(doctor.name)}</h3>
          <p>${escapeHtml(doctor.qualification || "Medical specialist")}</p>
        </div>
      </div>
      <span class="pill">${escapeHtml(doctor.department || "General")}</span>
      <p>${escapeHtml(doctor.specialty || "Specialist care")}</p>
      <div class="doctor-meta">
        <span>${icon("hospital")} ${escapeHtml(doctor.hospital || "Hospital unavailable")}</span>
        <span>${icon("clock")} ${escapeHtml(doctor.opd_timing || "Confirm OPD timing")}</span>
      </div>
    </article>
  `).join("") : emptyMarkup("No referral doctors found", "Try a different search term.");
}

function renderInsights() {
  const cases = filterItems(doctorState.edgeCases, (item) =>
    [item.title, item.patient_profile, item.expected_department, item.recommended_action, ...(item.reported_symptoms || [])].join(" ")
  );

  document.getElementById("doctor-insights").innerHTML = cases.length ? cases.map((item) => `
    <article class="edge-card">
      <span class="pill">${escapeHtml(item.case_id || "Risk case")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.diagnostic_challenge || item.patient_profile || "")}</p>
      <div class="symptom-line">${(item.reported_symptoms || []).map((symptom) => `<span class="tag">${escapeHtml(symptom)}</span>`).join("")}</div>
      <p><strong>${escapeHtml(item.expected_department || "Escalate")}</strong></p>
      <p>${escapeHtml(item.recommended_action || "Escalate for clinical review.")}</p>
    </article>
  `).join("") : emptyMarkup("No risk insight matches", "Clear search to see all edge cases.");
}

function visiblePatients() {
  return filterItems(doctorState.patients, (patient) =>
    [patient.name, patient.id, patient.condition, patient.department, patient.note, patient.risk].join(" ")
  ).sort((a, b) => riskRank(b.risk) - riskRank(a.risk));
}

function riskRank(risk) {
  return { low: 1, medium: 2, high: 3 }[risk] || 0;
}

function filterItems(items, selector) {
  if (!doctorState.query) return items;
  return items.filter((item) => selector(item).toLowerCase().includes(doctorState.query));
}

function switchDoctorTab(tab) {
  const titles = {
    dashboard: "Dashboard",
    queue: "Patient Queue",
    directory: "Directory",
    insights: "Risk Insights"
  };
  document.querySelectorAll("[data-doctor-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.doctorTab === tab);
  });
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabPanel === tab);
  });
  document.getElementById("doctor-title").textContent = titles[tab] || "Dashboard";
  window.scrollTo({ top: 0, behavior: "smooth" });
  refreshIcons();
}

function showToast(title, message) {
  const region = document.getElementById("toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 3400);
}

function emptyMarkup(title, message) {
  return `<div class="empty-state"><i data-lucide="search-x"></i><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div>`;
}

function initials(name) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
