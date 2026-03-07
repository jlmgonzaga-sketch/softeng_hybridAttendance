// ═══════════════════════════════════════════════════════════
//  SSC-R Student — Mobile JS
//  Same data and logic as student.js desktop
//  Depends on: students-data.js (for SSCR_STUDENTS etc.)
//  Student data sourced from students-data.js (MEL_ATTENDANCE, etc.)
// ═══════════════════════════════════════════════════════════

// ── Student Data (same as student.js desktop) ─────────────
const STUDENT = {
    id:      '2026-0031',
    name:    'Mel Reynald Malacas',
    grade:   'Grade 7',
    section: 'Section B',
};

const RAW_ATTENDANCE = {
    Math:    ['P','P','P','L','L','L','P','P','P','P','L','P','P','P','L','A','P','P','P','P','L','P','P','L','P','P','P','P'],
    English: ['P','L','P','P','P','A','P','P','A','P','P','L','P','P','A','P','P','P','P','A','P','P','L','P','P','P','P','P'],
    Science: ['P','P','P','P','P','P','P','P','P','P','P','L','A','P','P','P','P','P','P','P','P','P','P','P','L','P','P','P'],
    Filipino:['P','P','P','P','P','P','L','P','P','P','P','P','P','L','P','P','P','P','L','P','P','P','P','P','P','P','P','P'],
};

const SUBJECT_INFO = {
    Math:    { full: 'Mathematics', faculty: 'Rheymard Doneza', room: 'Room 101', section: 'Sec B' },
    English: { full: 'English',     faculty: 'Gary Soriano',   room: 'Room 102', section: 'Sec B' },
    Science: { full: 'Science',     faculty: 'Agnes Bernal',   room: 'Lab 201',  section: 'Sec B' },
    Filipino:{ full: 'Filipino',    faculty: 'Gerome Carpio',  room: 'Room 103', section: 'Sec B' },
};

// Pre-compute stats
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

// Build flat records (newest first)
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ATTENDANCE_RECORDS = [];
for (let day = 28; day >= 1; day--) {
    const d       = new Date(2026, 1, day);
    const weekday = WEEKDAY_NAMES[d.getDay()];
    const dateLabel = `Feb ${String(day).padStart(2,'0')}, 2026`;
    const dateKey   = `2026-02-${String(day).padStart(2,'0')}`;
    for (const subj of ['Math','English','Science','Filipino']) {
        ATTENDANCE_RECORDS.push({ subject: subj, day, date: dateLabel, dateKey, weekday, status: RAW_ATTENDANCE[subj][day - 1] });
    }
}

// Calendar dominant status per day
const ATTENDANCE_DATA = {};
for (let day = 1; day <= 28; day++) {
    const key = `2026-02-${String(day).padStart(2,'0')}`;
    const statuses = Object.values(RAW_ATTENDANCE).map(arr => arr[day - 1]);
    ATTENDANCE_DATA[key] = statuses.includes('A') ? 'absent' : statuses.includes('L') ? 'late' : 'present';
}

// ── Notifications ─────────────────────────────────────────
const STUDENT_NOTIFICATIONS = [
    { id:1, unread:true,  text:'Your absences in <strong>English</strong> have reached <strong>4 days</strong> this month.', time:'Today' },
    { id:2, unread:true,  text:'You were marked <strong>Late</strong> in Math on <strong>Feb 21, 2026</strong>.', time:'Feb 21' },
    { id:3, unread:true,  text:'QR attendance for <strong>Filipino — Sec B</strong> is open. Scan now.', time:'Feb 21' },
    { id:4, unread:false, text:'Your attendance for <strong>Science — Feb 18</strong> has been recorded as Present.', time:'Feb 18' },
    { id:5, unread:false, text:'Reminder: School closed on <strong>Feb 25</strong> (holiday). No classes.', time:'Feb 17' },
    { id:6, unread:false, text:'Monthly attendance report for <strong>February 2026</strong> is now available.', time:'Feb 1' },
];
let _notifications = [...STUDENT_NOTIFICATIONS];

function renderNotifications() {
    const list   = document.getElementById('notifList');
    const unread = _notifications.filter(n => n.unread).length;
    const badge  = document.getElementById('notificationCount');
    badge.textContent   = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
    list.innerHTML = _notifications.map(n => `
        <div class="nd-item ${n.unread ? 'unread' : ''}" onclick="markRead(${n.id})">
            <div class="nd-body">
                <div class="nd-text">${n.text}</div>
                <div class="nd-time">${n.time}</div>
            </div>
            <div class="nd-dot"></div>
        </div>`).join('');
}
function toggleNotifications(e) {
    e.stopPropagation();
    const dd = document.getElementById('notifDropdown');
    dd.classList.toggle('open');
    if (dd.classList.contains('open')) renderNotifications();
}
function closeNotifications() { document.getElementById('notifDropdown').classList.remove('open'); }
function markRead(id)  { const n = _notifications.find(n => n.id === id); if (n) n.unread = false; renderNotifications(); }
function markAllRead() { _notifications.forEach(n => n.unread = false); renderNotifications(); }
document.addEventListener('click', e => {
    const w = document.getElementById('notifWrapper');
    if (w && !w.contains(e.target)) closeNotifications();
});

// ── Recent Attendance (Home page) ─────────────────────────
function renderRecentAttendance() {
    const list    = document.getElementById('recentAttendanceList');
    const recent  = ATTENDANCE_RECORDS.slice(0, 8);
    const dotClass = { Math: 'dot-math', English: 'dot-english', Science: 'dot-science', Filipino: 'dot-filipino' };
    const badgeClass = { P: 'status-present', L: 'status-late', A: 'status-absent' };
    const badgeLabel = { P: 'Present', L: 'Late', A: 'Absent' };

    list.innerHTML = recent.map(r => `
        <div class="att-card" onclick="showAttDetail('${r.subject}','${r.date}','${r.weekday}','${r.status}')">
            <div class="att-subj-dot ${dotClass[r.subject] || ''}">${r.subject.substring(0,3).toUpperCase()}</div>
            <div class="att-info">
                <div class="att-subj-name">${SUBJECT_INFO[r.subject].full}</div>
                <div class="att-meta">${r.date} · ${r.weekday}</div>
            </div>
            <span class="status-badge ${badgeClass[r.status]}">${badgeLabel[r.status]}</span>
        </div>`).join('');
}

// ── Attendance Records Page ───────────────────────────────
const ATT_PER_PAGE = 12;
let attPage = 1;

function getFilteredRecords() {
    const q       = (document.getElementById('attSearch').value || '').toUpperCase();
    const status  = document.getElementById('attStatus').value;
    const subject = document.getElementById('attSubject').value;

    return ATTENDANCE_RECORDS.filter(r => {
        const matchQ    = !q || (r.subject + ' ' + r.date + ' ' + r.weekday).toUpperCase().includes(q);
        const matchStat = !status  || r.status  === status;
        const matchSubj = !subject || r.subject === subject;
        return matchQ && matchStat && matchSubj;
    });
}

function renderAttTable() {
    attPage = 1;
    renderAttPage();
}

function renderAttPage() {
    const records    = getFilteredRecords();
    const totalPages = Math.max(1, Math.ceil(records.length / ATT_PER_PAGE));
    if (attPage > totalPages) attPage = totalPages;

    const start  = (attPage - 1) * ATT_PER_PAGE;
    const slice  = records.slice(start, start + ATT_PER_PAGE);

    const dotClass   = { Math: 'dot-math', English: 'dot-english', Science: 'dot-science', Filipino: 'dot-filipino' };
    const badgeClass = { P: 'status-present', L: 'status-late', A: 'status-absent' };
    const badgeLabel = { P: 'Present', L: 'Late', A: 'Absent' };

    const container = document.getElementById('attCardList');
    document.getElementById('attCountLabel').textContent = records.length + ' records';

    if (!slice.length) {
        container.innerHTML = '<div style="text-align:center;color:#aaa;padding:2rem;font-size:.85rem;">No records found.</div>';
        document.getElementById('attPagination').innerHTML = '';
        return;
    }

    container.innerHTML = slice.map(r => `
        <div class="att-card" onclick="showAttDetail('${r.subject}','${r.date}','${r.weekday}','${r.status}')">
            <div class="att-subj-dot ${dotClass[r.subject] || ''}">${r.subject.substring(0,3).toUpperCase()}</div>
            <div class="att-info">
                <div class="att-subj-name">${SUBJECT_INFO[r.subject].full}</div>
                <div class="att-meta">${r.date} · ${r.weekday}</div>
            </div>
            <span class="status-badge ${badgeClass[r.status]}">${badgeLabel[r.status]}</span>
        </div>`).join('');

    // Pagination
    const pg = document.getElementById('attPagination');
    let html = `<button class="page-btn" onclick="goAttPage(${attPage-1})" ${attPage===1?'disabled':''}>‹</button>`;
    const maxV = 5;
    let s = Math.max(1, attPage - Math.floor(maxV/2));
    let e = Math.min(totalPages, s + maxV - 1);
    if (e - s < maxV - 1) s = Math.max(1, e - maxV + 1);
    for (let i = s; i <= e; i++) {
        html += `<button class="page-btn ${i===attPage?'active':''}" onclick="goAttPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="goAttPage(${attPage+1})" ${attPage===totalPages?'disabled':''}>›</button>`;
    html += `<span style="font-size:.72rem;color:#999;margin-left:.4rem;line-height:32px;">${start+1}–${Math.min(attPage*ATT_PER_PAGE,records.length)} of ${records.length}</span>`;
    pg.innerHTML = html;
}

function goAttPage(n) {
    const total = Math.max(1, Math.ceil(getFilteredRecords().length / ATT_PER_PAGE));
    if (n < 1 || n > total) return;
    attPage = n;
    renderAttPage();
}

// ── Attendance Detail Modal ───────────────────────────────
function showAttDetail(subject, date, weekday, status) {
    const info  = SUBJECT_INFO[subject];
    const sl    = status === 'P' ? 'Present' : status === 'L' ? 'Late' : 'Absent';
    const sc    = status === 'P' ? 'status-present' : status === 'L' ? 'status-late' : 'status-absent';
    document.getElementById('detailsModalBody').innerHTML =
        `<div class="detail-row"><span class="dr-lbl">Subject</span><span class="dr-val">${info.full}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Faculty</span><span class="dr-val">${info.faculty}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Room</span><span class="dr-val">${info.room}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Section</span><span class="dr-val">${info.section}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Date</span><span class="dr-val">${date}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Day</span><span class="dr-val">${weekday}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Status</span><span class="dr-val"><span class="status-badge ${sc}">${sl}</span></span></div>`;
    document.getElementById('detailsModal').classList.add('show');
}

// ── Schedule Click ────────────────────────────────────────
function viewClassDetail(subject, day, time) {
    const info = SUBJECT_INFO[subject];
    document.getElementById('classModalBody').innerHTML =
        `<div class="detail-row"><span class="dr-lbl">Subject</span><span class="dr-val">${info.full}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Faculty</span><span class="dr-val">${info.faculty}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Room</span><span class="dr-val">${info.room}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Section</span><span class="dr-val">${info.section}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Day</span><span class="dr-val">${day}</span></div>` +
        `<div class="detail-row"><span class="dr-lbl">Time</span><span class="dr-val">${time}</span></div>`;
    document.getElementById('classModal').classList.add('show');
}

// ── QR Scanner (Real Camera) ────────────────────────────────────────────────
let _html5QrCode = null;

function openQRScanner() {
    document.getElementById('qrModal').classList.add('show');
    document.getElementById('qrResultBox').style.display = 'none';
    document.getElementById('qrStatusMsg').textContent = 'Starting camera...';
    document.getElementById('qrStatusMsg').style.color = '#888';
    document.getElementById('scanLine').style.display = 'block';

    setTimeout(() => {
        _html5QrCode = new Html5Qrcode("qr-reader");
        Html5Qrcode.getCameras().then(cameras => {
            if (!cameras || cameras.length === 0) {
                document.getElementById('qrStatusMsg').textContent = 'No camera found.';
                return;
            }
            const cam = cameras.find(c => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1];
            _html5QrCode.start(
                cam.id,
                { fps: 10, qrbox: { width: 200, height: 200 } },
                (decodedText) => {
                    document.getElementById('qrResultText').textContent = decodedText;
                    document.getElementById('qrResultBox').style.display = 'block';
                    document.getElementById('qrStatusMsg').textContent = 'Attendance marked as Present!';
                    document.getElementById('qrStatusMsg').style.color = '#2e7d32';
                    document.getElementById('scanLine').style.display = 'none';
                    _html5QrCode.stop().catch(() => {});
                },
                () => {}
            ).then(() => {
                document.getElementById('qrStatusMsg').textContent = 'Align QR code in the frame';
            }).catch(() => {
                document.getElementById('qrStatusMsg').textContent = 'Camera access denied. Please allow camera permission.';
                document.getElementById('qrStatusMsg').style.color = '#c62828';
            });
        }).catch(() => {
            document.getElementById('qrStatusMsg').textContent = 'Could not access camera.';
            document.getElementById('qrStatusMsg').style.color = '#c62828';
        });
    }, 300);
}

function closeQRModal() {
    if (_html5QrCode) {
        _html5QrCode.stop().catch(() => {}).finally(() => {
            _html5QrCode.clear();
            _html5QrCode = null;
        });
    }
    document.getElementById('scanLine').style.display = 'block';
    document.getElementById('qrResultBox').style.display = 'none';
    document.getElementById('qrModal').classList.remove('show');
}
// ── Subjects Sheet ────────────────────────────────────────
function openSubjectsSheet() { document.getElementById('subjectsModal').classList.add('show'); }

// ── Page Navigation ───────────────────────────────────────
function goPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    const nb = document.getElementById('nav-' + id);
    if (nb) nb.classList.add('active');

    if (id === 'attendance') { attPage = 1; renderAttPage(); }
}

// ── Utilities ─────────────────────────────────────────────
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function logout() { if (confirm('Are you sure you want to logout?')) window.location.href = 'login.html'; }

window.addEventListener('click', e => {
    document.querySelectorAll('.modal').forEach(m => { if (e.target === m) m.classList.remove('show'); });
});

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    renderNotifications();
    renderRecentAttendance();
    renderAttPage();
});
