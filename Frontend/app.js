// --- Supabase ---
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON = "YOUR_SUPABASE_ANON_KEY";

// --- Login ---
let selectedRole = "patient";

function selectRole(el) {
  document.querySelectorAll(".login-role").forEach(r => r.setAttribute("data-active", "false"));
  el.setAttribute("data-active", "true");
  selectedRole = el.dataset.role;
}

function showApp() {
  document.getElementById("login-view").classList.add("login-hidden");
  document.getElementById("topbar-inner").classList.remove("login-hidden");
  document.querySelector("main").classList.remove("login-hidden");
  document.querySelector("nav").classList.remove("login-hidden");
  lucide.createIcons();
}

function showLogin() {
  document.getElementById("login-view").classList.remove("login-hidden");
  document.getElementById("topbar-inner").classList.add("login-hidden");
  document.querySelector("main").classList.add("login-hidden");
  document.querySelector("nav").classList.add("login-hidden");
}

async function handleLogin(e) {
  e.preventDefault();
  const id = document.getElementById("login-id").value.trim();
  const pass = document.getElementById("login-pass").value;
  const status = document.getElementById("login-status");

  if (!id || !pass) { status.textContent = "Fill in all fields"; return; }

  if (SUPABASE_URL === "YOUR_SUPABASE_URL") {
    status.textContent = "";
    if (selectedRole === "doctor") { window.location.href = "doctor.html"; return; }
    showApp();
    return;
  }

  status.textContent = "Signing in...";
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const client = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { error } = await client.auth.signInWithPassword({ email: id, password: pass });
  if (error) { status.textContent = error.message; return; }
  status.textContent = "";
  showApp();
}

async function handleSignOut() {
  showLogin();
}

// Hide app initially
document.querySelector("main").classList.add("login-hidden");
document.querySelector("nav").classList.add("login-hidden");

const views = {
  home: document.getElementById("home-view"),
  emergency: document.getElementById("emergency-view"),
  profile: document.getElementById("profile-view"),
  chat: document.getElementById("chat-view")
};

document.querySelectorAll("[data-tool]").forEach(btn => btn.addEventListener("click", () => {
  const name = btn.dataset.tool;
  if (name === "emergency") { switchView("emergency"); return; }
  if (name === "symptom") { switchView("chat"); return; }
}));

function switchView(name) {
  Object.entries(views).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
  document.querySelectorAll("[data-view]").forEach(btn => {
    const active = btn.dataset.view === name;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-current", active ? "page" : "false");
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", () => switchView(btn.dataset.view)));

document.querySelectorAll("[data-tool]").forEach(btn => btn.addEventListener("click", () => {
  const name = btn.dataset.tool;
  if (name === "emergency") { switchView("emergency"); return; }
  if (name === "symptom") { switchView("chat"); return; }
  alert(tools[name]);
}));

document.getElementById("notification-button").addEventListener("click", () => alert("You have no urgent health notifications."));

// --- Chat ---
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const messageStream = document.getElementById("message-stream");
const runtimeMessages = document.getElementById("runtime-messages");
const typingIndicator = document.getElementById("typing-indicator");
const formStatus = document.getElementById("form-status");
const toast = document.getElementById("toast");
const patientTemplate = document.getElementById("patient-message-template");
const specialistButton = document.getElementById("specialist-button");
const specialistModal = document.getElementById("specialist-modal");
const prepareVisitButton = document.getElementById("prepare-visit-button");
const modalClose = document.getElementById("modal-close");

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function appendPatientMessage(text) {
  const node = patientTemplate.content.cloneNode(true);
  node.querySelector(".dynamic-patient-text").textContent = text;
  runtimeMessages.appendChild(node);
}

function appendAiMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex items-start gap-3 rise-in";
  wrapper.innerHTML = `
    <div class="ai-avatar" style="width:2.5rem;height:2.5rem;border-radius:.9rem;" aria-hidden="true"><i data-lucide="bot"></i></div>
    <article class="ai-card max-w-2xl rounded-[1.4rem] rounded-tl-md p-4 sm:p-5" style="background: rgba(255,255,255,.84);">
      <p class="leading-relaxed" style="color: #4D6D69; font-size: 14px;">${text}</p>
    </article>`;
  runtimeMessages.appendChild(wrapper);
  lucide.createIcons();
}

messageInput.addEventListener("input", () => {
  formStatus.textContent = messageInput.value.length >= 280 ? "Limit reached" : "";
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) { formStatus.textContent = "Enter a message"; return; }
  appendPatientMessage(text);
  messageInput.value = "";
  formStatus.textContent = "";
  typingIndicator.classList.remove("hidden");
  typingIndicator.classList.add("flex");
  messageStream.scrollTo({ top: messageStream.scrollHeight, behavior: "smooth" });
  setTimeout(() => {
    typingIndicator.classList.add("hidden");
    typingIndicator.classList.remove("flex");
    appendAiMessage("Thanks for sharing that. Keep resting, drink water, and let me know if anything changes or if new symptoms appear.");
    messageStream.scrollTo({ top: messageStream.scrollHeight, behavior: "smooth" });
  }, 1400);
});

document.querySelectorAll(".question-chip").forEach(chip => chip.addEventListener("click", () => {
  const text = chip.dataset.question;
  appendPatientMessage(text);
  messageStream.scrollTo({ top: messageStream.scrollHeight, behavior: "smooth" });
  setTimeout(() => {
    document.getElementById("followup-response").classList.remove("hidden");
    document.getElementById("followup-response").classList.add("flex");
    messageStream.scrollTo({ top: messageStream.scrollHeight, behavior: "smooth" });
  }, 1000);
}));

specialistButton.addEventListener("click", () => {
  specialistModal.classList.remove("hidden");
  specialistModal.setAttribute("aria-hidden", "false");
});

function closeModal() {
  specialistModal.classList.add("hidden");
  specialistModal.setAttribute("aria-hidden", "true");
}

modalClose.addEventListener("click", closeModal);
prepareVisitButton.addEventListener("click", () => {
  closeModal();
  showToast("Visit preparation steps saved");
});

// New chat button
const newChatBtn = document.getElementById("new-chat-button");
if (newChatBtn) {
  newChatBtn.addEventListener("click", () => {
    runtimeMessages.innerHTML = "";
    document.getElementById("followup-response").classList.add("hidden");
    document.getElementById("followup-response").classList.remove("flex");
    messageInput.value = "";
    showToast("New chat started");
  });
}

lucide.createIcons();
