const DATA_FILES = {
  doctors: "../Json%20Files/gandaki_doctors.json",
  common: "../Json%20Files/gandaki_common_diseases.json",
  symptoms: "../Json%20Files/gandaki_symptoms_diseases.json",
  expanded: "../Json%20Files/gandaki_diseases_expanded.json",
  additional: "../Json%20Files/ADDITIONAL%20DISEASES.json",
  tests: "../Json%20Files/TESTS%20AND%20COST.json"
};

const screenTitles = {
  home: "Overview",
  check: "Symptom Check",
  doctors: "Doctors",
  records: "Tests & Records",
  emergency: "Emergency",
  profile: "Profile"
};

const state = {
  selectedRole: "patient",
  activeScreen: "home",
  activeDepartment: "All",
  query: "",
  data: {},
  doctors: [],
  diseases: [],
  tests: [],
  edgeCases: [],
  loadErrors: []
};

document.addEventListener("DOMContentLoaded", () => {
  bindLogin();
  bindNavigation();
  bindUtilities();
  renderInitialLoading();
  loadAllData();
  setToday();
  applySavedTheme();
  refreshIcons();
});

function bindLogin() {
  document.querySelectorAll(".role-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRole = button.dataset.role;
      document.querySelectorAll(".role-card").forEach((card) => {
        const active = card === button;
        card.classList.toggle("is-selected", active);
        card.setAttribute("aria-pressed", String(active));
      });
    });
  });

  document.getElementById("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const id = document.getElementById("login-id").value.trim();
    const pin = document.getElementById("login-pass").value.trim();
    const status = document.getElementById("login-status");

    if (!id || !pin) {
      status.textContent = "Enter both fields to continue.";
      return;
    }

    status.textContent = "";
    if (state.selectedRole === "doctor") {
      window.location.href = "doctor.html";
      return;
    }

    document.getElementById("login-view").classList.add("is-hidden");
    document.getElementById("app-view").classList.remove("is-hidden");
    showToast("Signed in", "Demo patient workspace is ready.");
    refreshIcons();
  });
}

function bindNavigation() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.nav;
      if (!target || !screenTitles[target]) return;
      switchScreen(target);
    });
  });
}

function bindUtilities() {
  const search = document.getElementById("global-search");
  search.addEventListener("input", () => {
    state.query = search.value.trim().toLowerCase();
    renderDoctors();
    renderTests();
    if (state.activeScreen === "home") {
      renderConditionPreview();
      renderCostPreview();
    }
  });

  document.getElementById("theme-toggle").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("swasthya-theme", dark ? "dark" : "light");
    document.getElementById("theme-toggle").innerHTML = dark ? icon("sun") : icon("moon");
    showToast(dark ? "Dark mode on" : "Light mode on", "Theme preference saved on this device.");
    refreshIcons();
  });

  document.getElementById("notification-button").addEventListener("click", () => {
    showToast("No urgent alerts", "Two OPD reminders and one report tip are waiting in your dashboard.");
  });

  document.getElementById("logout-button").addEventListener("click", logout);

  document.getElementById("prepare-visit").addEventListener("click", () => {
    showToast("Visit checklist created", "Bring previous reports, medicine names, and symptom start time.");
  });

  document.getElementById("run-check").addEventListener("click", runSymptomMatch);
  document.getElementById("symptom-input").addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") runSymptomMatch();
  });

  document.getElementById("print-doctors").addEventListener("click", () => {
    showToast("Preparing print view", "Use your browser dialog to save or print the directory.");
    window.print();
  });

  document.getElementById("export-records").addEventListener("click", exportTestSummary);
}

function logout() {
  document.getElementById("app-view").classList.add("is-hidden");
  document.getElementById("login-view").classList.remove("is-hidden");
  document.getElementById("login-id").value = "";
  document.getElementById("login-pass").value = "";
  document.getElementById("login-status").textContent = "";
  showToast("Signed out", "You have been logged out securely.");
  refreshIcons();
}

async function loadAllData() {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, path]) => [key, await loadJson(path, key)])
  );

  state.data = Object.fromEntries(entries);
  state.doctors = flattenDoctors(state.data.doctors);
  state.diseases = flattenDiseases(state.data.common, state.data.expanded, state.data.additional);
  state.tests = state.data.tests?.diseases_diagnostic_data || [];
  state.edgeCases = state.data.additional?.critical_misdiagnosis_edge_cases || [];

  document.querySelector(".status-dot")?.classList.add("is-ready");
  const source = document.getElementById("data-source-label");
  source.textContent = state.loadErrors.length
    ? `${Object.keys(DATA_FILES).length - state.loadErrors.length} of ${Object.keys(DATA_FILES).length} JSON files loaded.`
    : "All JSON files loaded without changing data.";

  renderAll();
  refreshIcons();
}

async function loadJson(path, label) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    return parseJsonLenient(text);
  } catch (error) {
    state.loadErrors.push(label);
    console.warn(`Could not load ${label}:`, error);
    return {};
  }
}

function parseJsonLenient(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const withoutTrailingCommas = text.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(withoutTrailingCommas);
  }
}

function flattenDoctors(source = {}) {
  return (source.departments || []).flatMap((department) =>
    (department.doctors || []).map((doctor) => ({
      ...doctor,
      department: department.department
    }))
  );
}

function flattenDiseases(common = {}, expanded = {}, additional = {}) {
  const diseases = [];

  (common.diseases || []).forEach((disease) => {
    diseases.push({
      name: disease.disease,
      department: disease.department,
      symptoms: disease.symptoms || [],
      context: disease.nepal_context,
      source: "Very common"
    });
  });

  (expanded.departments || []).forEach((department) => {
    (department.common_diseases || []).forEach((disease) => {
      diseases.push({
        name: disease.disease,
        department: department.department,
        symptoms: disease.symptoms || [],
        context: disease.nepal_context,
        source: "Department data"
      });
    });
  });

  (additional.healthcare_departments || []).forEach((department) => {
    (department.common_diseases || []).forEach((disease) => {
      diseases.push({
        name: disease.disease_name,
        nepaliName: disease.nepali_name,
        department: department.department_name,
        symptoms: disease.symptoms || [],
        context: disease.description,
        action: disease.recommended_action,
        source: "Expanded risk model"
      });
    });
  });

  const seen = new Set();
  return diseases.filter((disease) => {
    const key = `${disease.name}|${disease.department}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderInitialLoading() {
  const summary = document.getElementById("summary-grid");
  summary.innerHTML = Array.from({ length: 4 }, () => `<div class="skeleton-card"></div>`).join("");
}

function renderAll() {
  renderSummary();
  renderConditionPreview();
  renderCostPreview();
  renderQuickSymptoms();
  renderDepartmentFilters();
  renderDoctors();
  renderTests();
  renderEdgeCases();
}

function renderSummary() {
  const departments = new Set(state.doctors.map((doctor) => doctor.department));
  const totalTests = state.tests.reduce((sum, item) => sum + (item.required_diagnostic_tests || []).length, 0);
  const cards = [
    { icon: "stethoscope", value: state.doctors.length, label: "verified regional doctors" },
    { icon: "building-2", value: departments.size, label: "specialty departments" },
    { icon: "activity", value: state.diseases.length, label: "symptom patterns mapped" },
    { icon: "receipt-text", value: totalTests, label: "diagnostic tests with costs" }
  ];

  document.getElementById("summary-grid").classList.remove("skeleton-grid");
  document.getElementById("summary-grid").innerHTML = cards.map((card) => `
    <article class="summary-card">
      <span class="icon-bubble">${icon(card.icon)}</span>
      <strong>${card.value}</strong>
      <span>${escapeHtml(card.label)}</span>
    </article>
  `).join("");
}

function renderConditionPreview() {
  const items = filterByQuery(state.diseases, (disease) =>
    [disease.name, disease.department, ...(disease.symptoms || [])].join(" ")
  ).slice(0, 4);

  document.getElementById("condition-preview").innerHTML = items.length ? items.map(renderConditionItem).join("") : emptyMarkup("No condition matches", "Try searching for fever, cough, headache, or diabetes.");
}

function renderConditionItem(disease) {
  const symptoms = (disease.symptoms || []).slice(0, 4);
  return `
    <article class="condition-item">
      <span class="pill">${escapeHtml(disease.department || "General care")}</span>
      <h3>${escapeHtml(disease.name)}</h3>
      <p>${escapeHtml(disease.context || "Review symptoms and consult a clinician if they persist.")}</p>
      <div class="symptom-line">${symptoms.map((symptom) => `<span class="tag">${escapeHtml(symptom)}</span>`).join("")}</div>
    </article>
  `;
}

function renderCostPreview() {
  const tests = filterByQuery(state.tests, (item) =>
    [item.disease_name, item.department, item.total_estimated_cost_npr].join(" ")
  ).slice(0, 3);

  document.getElementById("cost-preview").innerHTML = tests.length ? tests.map((item) => `
    <article class="cost-item">
      <h3>${escapeHtml(item.disease_name)}</h3>
      <p>${escapeHtml(item.department)}</p>
      <div class="meta-line">
        <span class="tag">NPR ${escapeHtml(item.total_estimated_cost_npr || "Confirm at lab")}</span>
        <span class="tag">${(item.required_diagnostic_tests || []).length} tests</span>
      </div>
    </article>
  `).join("") : emptyMarkup("No cost data found", "Clear the search or try another disease name.");
}

function renderQuickSymptoms() {
  const popular = ["Fever", "Headache", "Cough", "Vomiting", "Chest pain", "Skin rash", "Joint pain", "Blurred vision"];
  document.getElementById("quick-symptoms").innerHTML = popular.map((symptom) =>
    `<button class="chip" type="button" data-symptom="${escapeHtml(symptom)}">${escapeHtml(symptom)}</button>`
  ).join("");

  document.querySelectorAll("[data-symptom]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById("symptom-input");
      const current = input.value.trim();
      input.value = current ? `${current}, ${button.dataset.symptom}` : button.dataset.symptom;
      input.focus();
    });
  });
}

function renderDepartmentFilters() {
  const departments = ["All", ...new Set(state.doctors.map((doctor) => doctor.department).filter(Boolean))];
  document.getElementById("department-filters").innerHTML = departments.map((department) => `
    <button class="filter-chip ${department === state.activeDepartment ? "is-active" : ""}" type="button" data-department="${escapeHtml(department)}">
      ${escapeHtml(department)}
    </button>
  `).join("");

  document.querySelectorAll("[data-department]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDepartment = button.dataset.department;
      renderDepartmentFilters();
      renderDoctors();
    });
  });
}

function renderDoctors() {
  const doctors = filterByQuery(state.doctors, (doctor) =>
    [doctor.name, doctor.department, doctor.hospital, doctor.specialty, doctor.qualification].join(" ")
  ).filter((doctor) => state.activeDepartment === "All" || doctor.department === state.activeDepartment);

  document.getElementById("doctor-grid").innerHTML = doctors.length ? doctors.map((doctor) => `
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
        <span>${icon("hospital")} ${escapeHtml(doctor.hospital || "Hospital details unavailable")}</span>
        <span>${icon("clock")} ${escapeHtml(doctor.opd_timing || "Confirm OPD timing before visiting")}</span>
      </div>
      <button class="btn btn-primary btn-block" type="button" data-book="${escapeAttribute(doctor.name)}">${icon("calendar-plus")} Book appointment</button>
    </article>
  `).join("") : emptyMarkup("No doctors found", "Try a different department or search term.");

  document.querySelectorAll("[data-book]").forEach((button) => {
    button.addEventListener("click", () => {
      showToast("Appointment request saved", `${button.dataset.book} will be added to your care plan.`);
    });
  });
  refreshIcons();
}

function renderTests() {
  const tests = filterByQuery(state.tests, (item) =>
    [item.disease_name, item.department, item.total_estimated_cost_npr, item.average_follow_up_time].join(" ")
  );

  document.getElementById("test-grid").innerHTML = tests.length ? tests.map((item) => `
    <article class="test-card">
      <span class="icon-bubble">${icon("flask-conical")}</span>
      <div>
        <span class="pill">${escapeHtml(item.department || "Diagnostic care")}</span>
        <h3>${escapeHtml(item.disease_name)}</h3>
        <p>${escapeHtml(item.average_follow_up_time || "Follow up timing depends on clinician review.")}</p>
      </div>
      <ul class="test-list">
        ${(item.required_diagnostic_tests || []).slice(0, 4).map((test) => `
          <li><span>${escapeHtml(test.test_name)}</span><strong>NPR ${escapeHtml(test.cost_range_npr)}</strong></li>
        `).join("")}
      </ul>
      <span class="pill">Estimated total: NPR ${escapeHtml(item.total_estimated_cost_npr || "Confirm locally")}</span>
    </article>
  `).join("") : emptyMarkup("No test plan found", "Try dengue, typhoid, cataract, or diabetes.");
}

function renderEdgeCases() {
  const cases = state.edgeCases.slice(0, 4);
  document.getElementById("edge-cases").innerHTML = cases.length ? cases.map((item) => `
    <article class="edge-card">
      <span class="pill">${escapeHtml(item.case_id || "Risk case")}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.patient_profile || "")}</p>
      <div class="symptom-line">${(item.reported_symptoms || []).slice(0, 4).map((symptom) => `<span class="tag">${escapeHtml(symptom)}</span>`).join("")}</div>
      <p><strong>${escapeHtml(item.expected_department || "Emergency care")}</strong></p>
      <p>${escapeHtml(item.recommended_action || "Seek urgent clinician review.")}</p>
    </article>
  `).join("") : emptyMarkup("Emergency cases unavailable", "The app still shows direct emergency call actions.");
}

function runSymptomMatch() {
  const input = document.getElementById("symptom-input").value.trim();
  const target = document.getElementById("match-results");

  if (!input) {
    target.className = "match-results empty-state";
    target.innerHTML = emptyMarkup("Add symptoms first", "A few words are enough, for example fever and headache.");
    refreshIcons();
    return;
  }

  const terms = tokenize(input);
  const scored = state.diseases
    .map((disease) => ({ disease, score: scoreDisease(disease, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  target.className = "match-results";
  if (!scored.length) {
    target.className = "match-results empty-state";
    target.innerHTML = emptyMarkup("No strong match yet", "Try adding symptom words like fever, cough, pain, rash, vomiting, or dizziness.");
    refreshIcons();
    return;
  }

  target.innerHTML = scored.map(({ disease, score }, index) => `
    <article class="match-item">
      <div class="panel-header">
        <div>
          <span class="pill">${index === 0 ? "Closest match" : `Match ${index + 1}`}</span>
          <h3>${escapeHtml(disease.name)}</h3>
        </div>
        <span class="pill">${Math.min(98, 54 + score * 11)}% signal</span>
      </div>
      <p>${escapeHtml(disease.context || "Discuss this pattern with a clinician.")}</p>
      <div class="meta-line">
        <span class="tag">${escapeHtml(disease.department || "General care")}</span>
        ${(disease.symptoms || []).slice(0, 5).map((symptom) => `<span class="tag">${escapeHtml(symptom)}</span>`).join("")}
      </div>
    </article>
  `).join("");

  showToast("Symptom match updated", "Top departments are ranked from the existing JSON data.");
  refreshIcons();
}

function scoreDisease(disease, terms) {
  const haystack = [
    disease.name,
    disease.department,
    disease.context,
    ...(disease.symptoms || [])
  ].join(" ").toLowerCase();

  return terms.reduce((score, term) => {
    if (haystack.includes(term)) return score + (term.length > 5 ? 2 : 1);
    return score;
  }, 0);
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function switchScreen(target) {
  state.activeScreen = target;
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === target);
  });
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.nav === target);
  });
  document.getElementById("screen-title").textContent = screenTitles[target];
  window.scrollTo({ top: 0, behavior: "smooth" });
  refreshIcons();
}

function filterByQuery(items, selector) {
  if (!state.query) return items;
  return items.filter((item) => selector(item).toLowerCase().includes(state.query));
}

function exportTestSummary() {
  const payload = {
    generated_for: "Swasthya Sathi demo patient",
    province_context: state.data.tests?.province_context,
    currency: state.data.tests?.currency,
    diseases_diagnostic_data: state.tests
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "swasthya-test-summary.json";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Summary exported", "A JSON copy of the test-cost summary was downloaded.");
}

function setToday() {
  const label = new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
  document.getElementById("today-label").textContent = label;
}

function applySavedTheme() {
  const saved = localStorage.getItem("swasthya-theme");
  if (saved === "dark") {
    document.documentElement.dataset.theme = "dark";
    document.getElementById("theme-toggle").innerHTML = icon("sun");
  }
}

function showToast(title, message) {
  const region = document.getElementById("toast-region");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

function emptyMarkup(title, message) {
  return `
    <i data-lucide="search-x"></i>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(message)}</p>
  `;
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
