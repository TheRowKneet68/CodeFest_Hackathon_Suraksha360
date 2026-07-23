// Swastha Sathi Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    
    darkModeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update icon
        const icon = this.querySelector('i');
        if (newTheme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
    
    // Search Functionality
    const searchInput = document.querySelector('.search-input');
    const searchShortcut = document.querySelector('.search-shortcut');
    
    // Keyboard shortcut for search (Cmd/Ctrl + K)
    document.addEventListener('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Escape to close search
        if (e.key === 'Escape') {
            searchInput.blur();
        }
    });
    
    // Search input focus effects
    searchInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    searchInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
    
    // Patient table row click
    const patientRows = document.querySelectorAll('.appointments-table tbody tr');
    patientRows.forEach(row => {
        row.addEventListener('click', function(e) {
            if (!e.target.classList.contains('action-btn')) {
                const patientName = this.querySelector('.patient-info span').textContent;
                console.log('Opening patient:', patientName);
                // Add your navigation logic here
            }
        });
    });
    
    // Action button click
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const row = this.closest('tr');
            const patientName = row.querySelector('.patient-info span').textContent;
            console.log('Opening patient:', patientName);
            // Add your navigation logic here
        });
    });
    
    // Quick Action buttons
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    quickActionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.querySelector('span').textContent;
            console.log('Quick action:', action);
            
            // Add visual feedback
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
            
            // Add your action logic here
        });
    });
    
    // Request approve/reject buttons
    const approveButtons = document.querySelectorAll('.btn-approve');
    const rejectButtons = document.querySelectorAll('.btn-reject');
    
    approveButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const requestItem = this.closest('.request-item');
            requestItem.style.opacity = '0.5';
            requestItem.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                requestItem.style.display = 'none';
            }, 300);
            
            console.log('Request approved');
        });
    });
    
    rejectButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const requestItem = this.closest('.request-item');
            requestItem.style.opacity = '0.5';
            requestItem.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                requestItem.style.display = 'none';
            }, 300);
            
            console.log('Request rejected');
        });
    });
    
    // Navigation items
    const navItems = document.querySelectorAll('.nav-item:not(.logout)');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the section name
            const section = this.querySelector('span').textContent;
            console.log('Navigating to:', section);
            
            // Add your navigation logic here
        });
    });
    
    // Notification bell animation
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            const badge = this.querySelector('.notification-badge');
            if (badge) {
                badge.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    badge.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }
    
    // Doctor profile dropdown (placeholder)
    const doctorProfile = document.querySelector('.doctor-profile');
    if (doctorProfile) {
        doctorProfile.addEventListener('click', function() {
            console.log('Opening doctor profile menu');
            // Add your dropdown menu logic here
        });
    }
    
    // Logout button
    const logoutBtn = document.querySelector('.nav-item.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logging out...');
            // Add your logout logic here
        });
    }
    
    // Add loading animation on initial load
    document.body.classList.add('loaded');
    
    // Animate stats on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe stat cards for animation
    document.querySelectorAll('.stat-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
    
    // Simulate real-time updates (placeholder)
    function simulateUpdates() {
        // Update notification count randomly
        const notificationBadge = document.querySelector('.notification-badge');
        if (notificationBadge) {
            const currentCount = parseInt(notificationBadge.textContent);
            if (Math.random() > 0.7) {
                notificationBadge.textContent = currentCount + 1;
                notificationBadge.style.animation = 'pulse 0.3s ease';
                setTimeout(() => {
                    notificationBadge.style.animation = '';
                }, 300);
            }
        }
    }
    
    // Run updates every 30 seconds
    setInterval(simulateUpdates, 30000);
});

// Add CSS animation for pulse effect
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    .search-container.focused .search-input {
        border-color: var(--primary-blue);
        background: var(--bg-white);
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    }
    
    .search-container.focused .search-shortcut {
        opacity: 0;
    }
    
    body {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    body.loaded {
        opacity: 1;
    }
`;
document.head.appendChild(style);
