/* ═══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS — Student Record Management System
   ═══════════════════════════════════════════════════════════ */

const API_BASE = '/api';

// ── API Helper ──
async function apiRequest(endpoint, options = {}) {
    const config = {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        ...options
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (response.status === 401) {
            window.location.href = '/index.html';
            return null;
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast('error', 'Connection Error', 'Unable to connect to server');
        throw error;
    }
}

// ── Toast Notifications ──
function showToast(type, title, message, duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ'}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ── Auth Check ──
async function checkAuth() {
    try {
        const data = await apiRequest('/auth/check');
        if (!data || !data.success) {
            window.location.href = '/index.html';
            return null;
        }
        return data.user;
    } catch {
        window.location.href = '/index.html';
        return null;
    }
}

// ── Setup Page (Auth + Sidebar) ──
async function setupPage(activeNav) {
    const user = await checkAuth();
    if (!user) return null;

    // Set user info in sidebar
    const avatarEl = document.getElementById('user-avatar');
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');

    if (avatarEl) avatarEl.textContent = user.fullName.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = user.fullName;
    if (roleEl) roleEl.textContent = user.role;

    // Set active nav
    if (activeNav) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.nav === activeNav) {
                link.classList.add('active');
            }
        });
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar on link click (mobile)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            });
        });
    }

    // Logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await apiRequest('/auth/logout', { method: 'POST' });
            window.location.href = '/index.html';
        });
    }

    return user;
}

// ── Load Classes Dropdown ──
async function loadClassesDropdown(selectId, selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    const data = await apiRequest('/classes');
    if (data && data.success) {
        select.innerHTML = '<option value="">Select Class</option>';
        data.data.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls._id;
            option.textContent = cls.name;
            if (cls._id === selectedValue) option.selected = true;
            select.appendChild(option);
        });
    }
}

// ── Load Sections Dropdown by Class ──
async function loadSectionsDropdown(selectId, classId, selectedValue = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Select Section</option>';

    if (!classId) return;

    const data = await apiRequest(`/sections?classId=${classId}`);
    if (data && data.success) {
        data.data.forEach(sec => {
            const option = document.createElement('option');
            option.value = sec._id;
            option.textContent = sec.name;
            if (sec._id === selectedValue) option.selected = true;
            select.appendChild(option);
        });
    }
}

// ── Format Date ──
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

// ── Grade Helpers ──
function getGradeClass(grade) {
    if (!grade) return '';
    const g = grade.replace('+', '').toUpperCase();
    if (g === 'A') return 'grade-a';
    if (g === 'B') return 'grade-b';
    if (g === 'C') return 'grade-c';
    if (g === 'D') return 'grade-d';
    return 'grade-f';
}

function calculateGrade(obtained, max) {
    const pct = (obtained / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
}

// ── Modal Helpers ──
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// ── CSV Export ──
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showToast('warning', 'No Data', 'No data available to export');
        return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
        const values = headers.map(h => {
            const val = row[h] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('success', 'Export Complete', `${filename}.csv downloaded successfully`);
}

// ── Debounce ──
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ── Sidebar HTML Template ──
function getSidebarHTML() {
    return `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-logo">🎓</div>
            <div class="sidebar-title">
                <h2>StudentRec</h2>
                <p>Management System</p>
            </div>
        </div>

        <nav class="sidebar-nav">
            <div class="nav-section">
                <div class="nav-section-title">Overview</div>
                <a href="/dashboard.html" class="nav-link" data-nav="dashboard">
                    <span class="nav-icon">📊</span>
                    <span>Dashboard</span>
                </a>
            </div>

            <div class="nav-section">
                <div class="nav-section-title">Students</div>
                <a href="/add-student.html" class="nav-link" data-nav="add-student">
                    <span class="nav-icon">➕</span>
                    <span>Add Student</span>
                </a>
                <a href="/view-students.html" class="nav-link" data-nav="view-students">
                    <span class="nav-icon">👥</span>
                    <span>View Students</span>
                </a>
            </div>

            <div class="nav-section">
                <div class="nav-section-title">Academics</div>
                <a href="/manage-classes.html" class="nav-link" data-nav="manage-classes">
                    <span class="nav-icon">🏫</span>
                    <span>Classes & Sections</span>
                </a>
            </div>

            <div class="nav-section">
                <div class="nav-section-title">Account</div>
                <a href="#" class="nav-link" id="logout-btn" data-nav="logout">
                    <span class="nav-icon">🚪</span>
                    <span>Logout</span>
                </a>
            </div>
        </nav>

        <div class="sidebar-footer">
            <div class="sidebar-user">
                <div class="user-avatar" id="user-avatar">A</div>
                <div class="user-info">
                    <div class="user-name" id="user-name">Admin</div>
                    <div class="user-role" id="user-role">admin</div>
                </div>
            </div>
        </div>
    </aside>`;
}

function getHeaderHTML(title, breadcrumb = '') {
    return `
    <header class="main-header">
        <div class="header-left">
            <button class="menu-toggle" id="menu-toggle">☰</button>
            <div>
                <h1>${title}</h1>
                ${breadcrumb ? `<div class="breadcrumb">${breadcrumb}</div>` : ''}
            </div>
        </div>
        <div class="header-right">
        </div>
    </header>`;
}
