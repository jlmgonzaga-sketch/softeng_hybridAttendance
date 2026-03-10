// ═══════════════════════════════════════════════════════════
//  STUDENT DATA  —  sourced from studdata_prototype.xlsx
//  Student: MALACAS, Mel Reynald L.  |  ID: 2026-0031
//  Grade 7 · Section B  |  February 2026
// ═══════════════════════════════════════════════════════════
// requireAuth('student');  // disabled — handled by login.html redirect
const STUDENT = {
    id:      '2026-0031',
    name:    'Mel Reynald Malacas',
    grade:   'Grade 7',
    section: 'Section B',
};

// ── Real attendance records from Excel (4 subjects × 28 days) ──
const RAW_ATTENDANCE = {
    //           D1    D2    D3    D4    D5    D6    D7    D8    D9    D10   D11   D12   D13   D14   D15   D16   D17   D18   D19   D20   D21   D22   D23   D24   D25   D26   D27   D28
    Math:    ['P','P','P','L','L','L','P','P','P','P','L','P','P','P','L','A','P','P','P','P','L','P','P','L','P','P','P','P'],
    English: ['P','L','P','P','P','A','P','P','A','P','P','L','P','P','A','P','P','P','P','A','P','P','L','P','P','P','P','P'],
    Science: ['P','P','P','P','P','P','P','P','P','P','P','L','A','P','P','P','P','P','P','P','P','P','P','P','L','P','P','P'],
    Filipino:['P','P','P','P','P','P','L','P','P','P','P','P','P','L','P','P','P','P','L','P','P','P','P','P','P','P','P','P'],
};

// ── Subject info ──
const SUBJECT_INFO = {
    Math:    { full: 'Mathematics', faculty: 'Rheymard Doneza', room: 'Room 101', section: 'Sec B' },
    English: { full: 'English',     faculty: 'Gary Soriano',   room: 'Room 102', section: 'Sec B' },
    Science: { full: 'Science',     faculty: 'Agnes Bernal',   room: 'Lab 201',  section: 'Sec B' },
    Filipino:{ full: 'Filipino',    faculty: 'Gerome Carpio',  room: 'Room 103', section: 'Sec B' },
};

// ── Pre-compute stats ──
const SUBJECT_STATS = {};
let grandPresent = 0, grandLate = 0, grandAbsent = 0;

for (const [subj, days] of Object.entries(RAW_ATTENDANCE)) {
    const p = days.filter(s => s === 'P').length;
    const l = days.filter(s => s === 'L').length;
    const a = days.filter(s => s === 'A').length;
    const total = p + l + a;
    SUBJECT_STATS[subj] = { present: p, late: l, absent: a, total, rate: Math.round((p + l) / total * 1000) / 10 };
    grandPresent += p; grandLate += l; grandAbsent += a;
}

const GRAND_TOTAL    = grandPresent + grandLate + grandAbsent;
const GRAND_ATTENDED = grandPresent + grandLate;
const OVERALL_RATE   = Math.round(GRAND_ATTENDED / GRAND_TOTAL * 1000) / 10;

// ── Build flat records (newest first) ──
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTH_NAMES   = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// ── Subject time lookup (from weekly schedule) ──
const SUBJECT_TIME = {
    Math:    '07:00 AM',
    English: '08:30 AM',
    Science: '08:30 AM',
    Filipino:'10:00 AM',
};

const ATTENDANCE_RECORDS = [];
for (let day = 28; day >= 1; day--) {
    const d         = new Date(2026, 1, day);
    const weekday   = WEEKDAY_NAMES[d.getDay()];
    const dateLabel = `Feb ${String(day).padStart(2,'0')}, 2026`;
    const dateKey   = `2026-02-${String(day).padStart(2,'0')}`;
    for (const subj of ['Math','English','Science','Filipino']) {
        ATTENDANCE_RECORDS.push({ subject: subj, day, date: dateLabel, dateKey, weekday, status: RAW_ATTENDANCE[subj][day - 1], time: SUBJECT_TIME[subj] });
    }
}

// ── Calendar: per-day dominant status ──
const ATTENDANCE_DATA = {};
for (let day = 1; day <= 28; day++) {
    const key = `2026-02-${String(day).padStart(2,'0')}`;
    const statuses = Object.values(RAW_ATTENDANCE).map(arr => arr[day - 1]);
    ATTENDANCE_DATA[key] = statuses.includes('A') ? 'absent' : statuses.includes('L') ? 'late' : 'present';
}

// ── Pagination state (main table) ──
const ROWS_PER_PAGE = 5;
let currentPage = 1;
let filteredRecords = [...ATTENDANCE_RECORDS];

// ═══════════════════════════════════════════════════════════
//  ON PAGE LOAD
// ═══════════════════════════════════════════════════════════
function initDashboard() {
    filteredRecords = ATTENDANCE_RECORDS.slice();
    currentPage = 1;
    updateStatCards();
    updateSubjectFilter();
    renderAttendanceTable();
    renderBreakdown();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    initDashboard();
}

function updateStatCards() {
    // Use named IDs — no class-selector guessing
    const rateEl     = document.getElementById('statRate');
    const rateLabel  = document.getElementById('statRateLabel');
    const attEl      = document.getElementById('statAttended');
    const attLabel   = document.getElementById('statAttendedLabel');
    const absEl      = document.getElementById('statAbsent');
    const absLabel   = document.getElementById('statAbsentLabel');

    if (rateEl)  rateEl.textContent  = OVERALL_RATE + '%';
    if (attEl)   attEl.textContent   = GRAND_ATTENDED;
    if (absEl)   absEl.textContent   = grandAbsent;
}

// ═══════════════════════════════════════════════════════════
//  ATTENDANCE TABLE (main card)
// ═══════════════════════════════════════════════════════════
function renderAttendanceTable() {
    const tbody    = document.getElementById('attendanceTableBody');
    const start    = (currentPage - 1) * ROWS_PER_PAGE;
    const pageRows = filteredRecords.slice(start, start + ROWS_PER_PAGE);

    tbody.innerHTML = pageRows.map(r => {
        const info  = SUBJECT_INFO[r.subject];
        const badge = r.status === 'P' ? 'status-present' : r.status === 'L' ? 'status-late' : 'status-absent';
        const label = r.status === 'P' ? 'Present' : r.status === 'L' ? 'Late' : 'Absent';
        const recId = `${r.subject}-${r.dateKey}`;
        return `
            <tr>
                <td>${r.subject}</td>
                <td>${r.date}</td>
                <td>${r.weekday}</td>
                <td>${r.time || '—'}</td>
                <td><span class="status-badge ${badge}">${label}</span></td>
                <td><button class="action-btn view" onclick="viewDetails('${recId}')">View</button></td>
            </tr>`;
    }).join('');

    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredRecords.length / ROWS_PER_PAGE);
    const container  = document.querySelector('.pagination');
    if (!container) return;

    const maxVisible = 5;
    let winStart = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let winEnd   = Math.min(totalPages, winStart + maxVisible - 1);
    if (winEnd - winStart < maxVisible - 1) winStart = Math.max(1, winEnd - maxVisible + 1);

    let html = `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
    if (winStart > 1) {
        html += `<button class="page-btn" onclick="goPage(1)">1</button>`;
        if (winStart > 2) html += `<span style="align-self:center;padding:0 4px;color:#aaa;">…</span>`;
    }
    for (let i = winStart; i <= winEnd; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    if (winEnd < totalPages) {
        if (winEnd < totalPages - 1) html += `<span style="align-self:center;padding:0 4px;color:#aaa;">…</span>`;
        html += `<button class="page-btn" onclick="goPage(${totalPages})">${totalPages}</button>`;
    }
    html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    container.innerHTML = html;
}

function goPage(n) {
    const totalPages = Math.ceil(filteredRecords.length / ROWS_PER_PAGE);
    if (n < 1 || n > totalPages) return;
    currentPage = n;
    renderAttendanceTable();
}

// ═══════════════════════════════════════════════════════════
//  SEARCH & FILTER
// ═══════════════════════════════════════════════════════════
function searchTable() { applyFilters(); }
function filterTable()  { applyFilters(); }

function applyFilters() {
    const search  = document.getElementById('searchInput').value.toUpperCase();
    const status  = document.getElementById('statusFilter').value;
    const subject = document.getElementById('subjectFilter').value;

    filteredRecords = ATTENDANCE_RECORDS.filter(r => {
        const matchSearch  = !search  || r.subject.toUpperCase().includes(search) || r.date.toUpperCase().includes(search) || r.weekday.toUpperCase().includes(search);
        const matchStatus  = !status  || r.status === status.toUpperCase().charAt(0);
        const matchSubject = !subject || r.subject === subject;
        return matchSearch && matchStatus && matchSubject;
    });

    currentPage = 1;
    renderAttendanceTable();
}

function updateSubjectFilter() {
    const sel = document.getElementById('subjectFilter');
    sel.innerHTML = '<option value="">All Subjects</option>' +
        Object.keys(RAW_ATTENDANCE).map(s => `<option value="${s}">${s}</option>`).join('');
}

// ═══════════════════════════════════════════════════════════
//  MODAL HELPERS
// ═══════════════════════════════════════════════════════════
function openModal(modalId)  { document.getElementById(modalId).classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('show'); }

window.onclick = function (event) {
    const modals = document.getElementsByClassName('modal');
    for (const modal of modals) {
        if (event.target === modal) modal.classList.remove('show');
    }
};

// ═══════════════════════════════════════════════════════════
//  VIEW ATTENDANCE DETAILS
// ═══════════════════════════════════════════════════════════
function viewDetails(recordId) {
    const dashIdx = recordId.indexOf('-2026');
    const subj    = recordId.substring(0, dashIdx);
    const dateKey = recordId.substring(dashIdx + 1);
    const day     = parseInt(dateKey.split('-')[2]);
    const status  = RAW_ATTENDANCE[subj] ? RAW_ATTENDANCE[subj][day - 1] : '?';
    const info    = SUBJECT_INFO[subj] || {};
    const badge   = status === 'P' ? 'status-present' : status === 'L' ? 'status-late' : 'status-absent';
    const label   = status === 'P' ? 'Present' : status === 'L' ? 'Late' : 'Absent';
    const d       = new Date(2026, 1, day);
    const dateStr = d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

    document.getElementById('modalBody').innerHTML = `
        <div style="margin-bottom:1rem;"><strong>Student ID:</strong> ${STUDENT.id}</div>
        <div style="margin-bottom:1rem;"><strong>Subject:</strong> ${subj} — ${info.full || ''}</div>
        <div style="margin-bottom:1rem;"><strong>Section:</strong> ${info.section || 'Sec B'}</div>
        <div style="margin-bottom:1rem;"><strong>Date:</strong> ${dateStr} (${WEEKDAY_NAMES[d.getDay()]})</div>
        <div style="margin-bottom:1rem;"><strong>Status:</strong> <span class="status-badge ${badge}">${label}</span></div>
        <div style="margin-bottom:1rem;"><strong>Faculty:</strong> ${info.faculty || '—'}</div>
        <div style="margin-bottom:1rem;"><strong>Room:</strong> ${info.room || '—'}</div>
    `;
    openModal('detailsModal');
}

// ═══════════════════════════════════════════════════════════
//  VIEW CLASS DETAILS (schedule)
// ═══════════════════════════════════════════════════════════
function viewClassDetails(classCode, day, time) {
    const info = SUBJECT_INFO[classCode] || {};
    document.getElementById('classModalBody').innerHTML = `
        <div style="margin-bottom:1rem;"><strong>Subject:</strong> ${classCode} — ${info.full || ''}</div>
        <div style="margin-bottom:1rem;"><strong>Section:</strong> ${info.section || 'Sec B'}</div>
        <div style="margin-bottom:1rem;"><strong>Day:</strong> ${day}</div>
        <div style="margin-bottom:1rem;"><strong>Time:</strong> ${time}</div>
        <div style="margin-bottom:1rem;"><strong>Faculty:</strong> ${info.faculty || '—'}</div>
        <div style="margin-bottom:1rem;"><strong>Room:</strong> ${info.room || '—'}</div>
    `;
    openModal('classDetailsModal');
}

// ═══════════════════════════════════════════════════════════
//  ATTENDANCE HISTORY — FULL TABLE (no pagination, all 112 rows)
// ═══════════════════════════════════════════════════════════
function renderAHFullTable() {
    const tbody = document.getElementById('ahFullTableBody');
    if (!tbody) return;

    // Render ALL records — no pagination
    tbody.innerHTML = ATTENDANCE_RECORDS.map(r => {
        const badge = r.status === 'P' ? 'status-present' : r.status === 'L' ? 'status-late' : 'status-absent';
        const label = r.status === 'P' ? 'Present' : r.status === 'L' ? 'Late' : 'Absent';
        return `<tr>
            <td>${r.subject}</td>
            <td>${r.date}</td>
            <td>${r.weekday}</td>
            <td>${r.time || '—'}</td>
            <td><span class="status-badge ${badge}">${label}</span></td>
        </tr>`;
    }).join('');
}

// Render AH table when history modal opens
const _origOpenModal = openModal;
window.openModal = function(modalId) {
    _origOpenModal(modalId);
    if (modalId === 'attendanceHistoryModal') {
        renderAHFullTable();
        renderBreakdown();
    }
};

// ═══════════════════════════════════════════════════════════
//  ATTENDANCE HISTORY TABS
// ═══════════════════════════════════════════════════════════
function switchAHTab(tab, btn) {
    document.querySelectorAll('.ah-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.ah-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('ah-' + tab).style.display = 'block';
    btn.classList.add('active');
    if (tab === 'calendar')  renderCalendar();
    if (tab === 'breakdown') renderBreakdown();
    if (tab === 'records')   renderAHFullTable();
}

// ═══════════════════════════════════════════════════════════
//  CALENDAR
// ═══════════════════════════════════════════════════════════
let calendarDate = new Date(2026, 1, 1);

function changeMonth(dir) {
    calendarDate.setMonth(calendarDate.getMonth() + dir);
    renderCalendar();
}

function renderCalendar() {
    const grid  = document.getElementById('ah-calendar-grid');
    const label = document.getElementById('ah-month-label');
    const year  = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    label.textContent = `${MONTH_NAMES[month]} ${year}`;

    const firstDay    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="cal-header">${d}</div>`).join('');
    for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const key    = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const status = ATTENDANCE_DATA[key] || '';
        html += `<div class="cal-day ${status}">${d}</div>`;
    }
    grid.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
//  PER-SUBJECT BREAKDOWN
// ═══════════════════════════════════════════════════════════
function renderBreakdown() {
    const grid = document.querySelector('#ah-breakdown .ah-breakdown-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(SUBJECT_STATS).map(([subj, s]) => {
        const color = s.rate >= 90 ? '#22c55e' : s.rate >= 75 ? '#f59e0b' : '#ef4444';
        return `
            <div class="ah-subject-card">
                <div class="ah-subject-name">${subj} — ${SUBJECT_INFO[subj].full}</div>
                <div class="ah-subject-bar-wrap">
                    <div class="ah-subject-bar" style="width:${s.rate}%; background:${color};"></div>
                </div>
                <div class="ah-subject-stats">Present: ${s.present} &nbsp;|&nbsp; Late: ${s.late} &nbsp;|&nbsp; Absent: ${s.absent} &nbsp;|&nbsp; <strong>${s.rate}%</strong></div>
            </div>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════
//  DOWNLOAD CSV
// ═══════════════════════════════════════════════════════════
function downloadReport(format) {
    if (format === 'csv') {
        const rows = [['Student ID','Name','Subject','Date','Day','Status']];
        for (const r of ATTENDANCE_RECORDS) {
            const label = r.status === 'P' ? 'Present' : r.status === 'L' ? 'Late' : 'Absent';
            rows.push([STUDENT.id, STUDENT.name, r.subject, r.date, r.weekday, label]);
        }
        const csv  = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `attendance_${STUDENT.id}_Feb2026.csv`; a.click();
        URL.revokeObjectURL(url);
    } else {
        alert('PDF download coming soon!');
    }
}

// ═══════════════════════════════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════════════════════════════
function saveProfile() {
    const name    = document.getElementById('settingsName').value.trim();
    const section = document.getElementById('settingsSection').value.trim();
    if (!name) { alert('Name cannot be empty.'); return; }
    document.querySelector('.student-name').textContent = name;
    document.querySelector('.student-role').textContent = `${STUDENT.id} · ${section}`;
    const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
    document.querySelector('.student-avatar').textContent = initials;
    document.getElementById('settingsAvatar').textContent = initials;
    alert('Profile updated successfully!');
    closeModal('settingsModal');
}

function toggleDarkMode(checkbox) {
    document.body.classList.toggle('dark-mode', checkbox.checked);
}

// ═══════════════════════════════════════════════════════════
//  MISC
// ═══════════════════════════════════════════════════════════
function refreshData() { location.reload(); }

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════
const STUDENT_NOTIFICATIONS = [
    { id:1, unread:true,  type:'alert',   text:'Your absences in <strong>English</strong> have reached <strong>4 days</strong> this month. Please take note.', time:'Today' },
    { id:2, unread:true,  type:'warn',    text:'You were marked <strong>Late</strong> in Math class on <strong>Feb 21, 2026</strong>.', time:'Feb 21' },
    { id:3, unread:true,  type:'info',    text:'<strong>QR attendance</strong> for Filipino — Sec B has been opened. Scan now to mark attendance.', time:'Feb 21' },
    { id:4, unread:false, type:'success', text:'Your attendance for <strong>Science — Feb 18</strong> has been recorded as Present.', time:'Feb 18' },
    { id:5, unread:false, type:'info',    text:'Reminder: School will be <strong>closed on Feb 25</strong> (holiday). No classes.', time:'Feb 17' },
    { id:6, unread:false, type:'alert',   text:'Monthly attendance report for <strong>February 2026</strong> is now available.', time:'Feb 1' },
];

let _notifications = [...STUDENT_NOTIFICATIONS];

function renderNotifications() {
    const list   = document.getElementById('notifList');
    const unread = _notifications.filter(n => n.unread).length;
    const badge  = document.getElementById('notificationCount');
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
    list.innerHTML = _notifications.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markRead(${n.id})">
            <div class="notif-icon ${n.type}"></div>
            <div class="notif-body">
                <div class="notif-text">${n.text}</div>
                <div class="notif-time">${n.time}</div>
            </div>
            <div class="notif-dot"></div>
        </div>`).join('');
}

function toggleNotifications(e) {
    e.stopPropagation();
    const dd = document.getElementById('notifDropdown');
    dd.classList.toggle('open');
    if (dd.classList.contains('open')) renderNotifications();
}

function closeNotifications() {
    document.getElementById('notifDropdown').classList.remove('open');
}

function markRead(id) {
    const n = _notifications.find(n => n.id === id);
    if (n) n.unread = false;
    renderNotifications();
}

function markAllRead() {
    _notifications.forEach(n => n.unread = false);
    renderNotifications();
}

document.addEventListener('click', function(e) {
    const wrapper = document.getElementById('notifWrapper');
    if (wrapper && !wrapper.contains(e.target)) closeNotifications();
});

function logout() {
    if (confirm('Are you sure you want to logout?')) window.location.href = 'login.html';
}
