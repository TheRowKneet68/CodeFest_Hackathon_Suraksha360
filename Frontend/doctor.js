// === SIDEBAR TOGGLE ===
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const mainContent = document.querySelector('.main-content');

if (sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('show');
  });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 1024 && sidebar.classList.contains('show') && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
    sidebar.classList.remove('show');
  }
});

// === NAVIGATION ===
const navLinks = document.querySelectorAll('.nav-link[data-page]');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const page = link.dataset.page;
    showToast(`Switched to ${page.charAt(0).toUpperCase() + page.slice(1)}`);
    if (window.innerWidth <= 1024) {
      sidebar.classList.remove('show');
    }
  });
});

// === SEARCH ===
const searchInput = document.getElementById('searchInput');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.patients-table tbody tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

// === NOTIFICATION PANEL ===
const notificationBtn = document.getElementById('notificationBtn');
const notificationPanel = document.getElementById('notificationPanel');
const markAllRead = document.getElementById('markAllRead');

if (notificationBtn && notificationPanel) {
  notificationBtn.addEventListener('click', () => {
    notificationPanel.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
      notificationPanel.classList.remove('show');
    }
  });

  if (markAllRead) {
    markAllRead.addEventListener('click', () => {
      document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
      });
      const badge = notificationBtn.querySelector('.badge');
      if (badge) badge.style.display = 'none';
      showToast('All notifications marked as read');
    });
  }
}

// === MODAL ===
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

function showModal(title, content) {
  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  modalOverlay.classList.add('show');
}

if (closeModal) {
  closeModal.addEventListener('click', () => modalOverlay.classList.remove('show'));
}
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.remove('show');
  });
}

// === VIEW PATIENT BUTTONS ===
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const patientId = btn.dataset.patient;
    showModal(`Patient ${patientId}`, `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <p style="color:var(--text-secondary);">Detailed patient information for <strong>${patientId}</strong>.</p>
        <div style="padding:20px;background:var(--bg);border-radius:var(--radius-sm);text-align:center;">
          <i data-lucide="file-text" style="width:48px;height:48px;color:var(--text-muted);margin-bottom:8px;display:inline-block;"></i>
          <p style="color:var(--text-muted);">Full patient profile coming soon</p>
        </div>
        <button class="btn btn-primary" style="width:100%;" onclick="document.getElementById('modalOverlay').classList.remove('show')">Close</button>
      </div>
    `);
    lucide.createIcons();
  });
});

// === QUICK ACTIONS ===
function bindAction(id, title, message) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', () => showToast(message));
}

bindAction('newPrescriptionBtn', 'New Prescription', 'Opening prescription form...');
bindAction('viewRecordsBtn', 'View Records', 'Loading patient records...');
bindAction('scheduleBtn', 'Schedule', 'Opening schedule...');
bindAction('reportBtn', 'Reports', 'Generating reports...');
bindAction('messagesBtn', 'Messages', 'Opening messages...');
bindAction('emergencyBtn', 'Emergency', 'Initiating emergency protocol...');

// === VIEW ALL BUTTONS ===
function bindViewAll(id, message) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', (e) => { e.preventDefault(); showToast(message); });
}

bindViewAll('viewAllPatients', 'Loading all patients...');
bindViewAll('viewAllAppointments', 'Loading all appointments...');

// === TOAST NOTIFICATIONS ===
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    background: 'var(--text)',
    color: 'white',
    padding: '12px 24px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-body)',
    zIndex: '9999',
    animation: 'fadeIn 0.3s ease',
    boxShadow: 'var(--shadow-lg)'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// === INITIALIZE LUCIDE ICONS ===
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
});