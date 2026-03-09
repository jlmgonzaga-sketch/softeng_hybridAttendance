// ═══════════════════════════════════════════════════════════
//  SSC-R Student — Mobile JS
// ═══════════════════════════════════════════════════════════

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
    English: { full: 'English',     faculty: 'Gary Soriano',    room: 'Room 102', section: 'Sec B' },
    Science: { full: 'Science',     faculty: 'Agnes Bernal',    room: 'Lab 201',  section: 'Sec B' },
    Filipino:{ full: 'Filipino',    faculty: 'Gerome Carpio',   room: 'Room 103', section: 'Sec B' },
};

for (const [subj, days] of Object.entries(RAW_ATTENDANCE)) {
    const p = days.filter(s => s === 'P').length;
    const l = days.filter(s => s === 'L').length;
    const a = days.filter(s => s === 'A').length;
}

const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ATTENDANCE_RECORDS = [];
for (let day = 28; day >= 1; day--) {
    const d         = new Date(2026, 1, day);
    const weekday   = WEEKDAY_NAMES[d.getDay()];
    const dateLabel = `Feb ${String(day).padStart(2,'0')}, 2026`;
    const dateKey   = `2026-02-${String(day).padStart(2,'0')}`;
    for (const subj of ['Math','English','Science','Filipino']) {
        ATTENDANCE_RECORDS.push({ subject: subj, day, date: dateLabel, dateKey, weekday, status: RAW_ATTENDANCE[subj][day - 1] });
    }
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

// ── Card builder — NO abbreviation box, just subject name + date ──
function buildCard(r) {
    const badgeClass = { P: 'status-present', L: 'status-late', A: 'status-absent' };
    const badgeLabel = { P: 'Present', L: 'Late', A: 'Absent' };
    return `<div class="att-card" onclick="showAttDetail('${r.subject}','${r.date}','${r.weekday}','${r.status}')"><div class="att-info"><div class="att-subj-name">${SUBJECT_INFO[r.subject].full}</div><div class="att-meta">${r.date} · ${r.weekday}</div></div><span class="status-badge ${badgeClass[r.status]}">${badgeLabel[r.status]}</span></div>`;
}

// ── Recent Attendance (Home) ───────────────────────────────
function renderRecentAttendance() {
    const wrap = document.getElementById('recentAttendanceList');
    const recent = ATTENDANCE_RECORDS.slice(0, 8);
    wrap.innerHTML = recent.map(buildCard).join('');
}

// ── Attendance Page ───────────────────────────────────────
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

function renderAttTable() { attPage = 1; renderAttPage(); }

function renderAttPage() {
    const records    = getFilteredRecords();
    const totalPages = Math.max(1, Math.ceil(records.length / ATT_PER_PAGE));
    if (attPage > totalPages) attPage = totalPages;
    const start = (attPage - 1) * ATT_PER_PAGE;
    const slice = records.slice(start, start + ATT_PER_PAGE);

    const wrap = document.getElementById('attCardList');
    document.getElementById('attCountLabel').textContent = records.length + ' records';

    if (!slice.length) {
        wrap.innerHTML = '<div style="padding:2rem;text-align:center;color:#aaa;font-size:.85rem;background:#fff;">No records found.</div>';
        document.getElementById('attPagination').innerHTML = '';
        return;
    }

    wrap.innerHTML = slice.map(buildCard).join('');

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

// ── Detail helpers ────────────────────────────────────────
function row(lbl, val) {
    return `<div class="detail-row"><span class="dr-lbl">${lbl}</span><span class="dr-val">${val}</span></div>`;
}

function showAttDetail(subject, date, weekday, status) {
    const info = SUBJECT_INFO[subject];
    const sl   = status === 'P' ? 'Present' : status === 'L' ? 'Late' : 'Absent';
    const sc   = status === 'P' ? 'status-present' : status === 'L' ? 'status-late' : 'status-absent';
    document.getElementById('detailsModalBody').innerHTML =
        row('Subject', info.full) + row('Faculty', info.faculty) + row('Room', info.room) +
        row('Section', info.section) + row('Date', date) + row('Day', weekday) +
        `<div class="detail-row"><span class="dr-lbl">Status</span><span class="dr-val"><span class="status-badge ${sc}">${sl}</span></span></div>`;
    openModal('detailsModal');
}

function viewClassDetail(subject, day, time) {
    const info = SUBJECT_INFO[subject];
    document.getElementById('classModalBody').innerHTML =
        row('Subject', info.full) + row('Faculty', info.faculty) + row('Room', info.room) +
        row('Section', info.section) + row('Day', day) + row('Time', time);
    openModal('classModal');
}

// ── Modal open / close ────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

window.addEventListener('click', e => {
    document.querySelectorAll('.modal').forEach(m => {
        if (e.target === m) {
            if (m.id === 'qrModal') closeQRModal();
            else m.classList.remove('show');
        }
    });
});

// ── QR Scanner — async-safe close ────────────────────────
let _html5QrCode = null;
let _qrClosing   = false;   // guard: prevent double-close race

function openQRScanner() {
    // Reset UI
    document.getElementById('qrResultBox').style.display = 'none';
    document.getElementById('qrStatusMsg').textContent   = 'Starting camera...';
    document.getElementById('qrStatusMsg').style.color   = '#888';
    document.getElementById('scanLine').style.display    = 'block';

    // Destroy any leftover instance first, then open fresh
    _destroyQR().then(() => {
        openModal('qrModal');
        setTimeout(_startQR, 300);
    });
}

function _startQR() {
    _html5QrCode = new Html5Qrcode('qr-reader');
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
                // QR scanned — stop camera, show result, keep modal open so user can read it
                _html5QrCode.stop().catch(() => {}).finally(() => {
                    _html5QrCode = null;
                    document.getElementById('qrResultText').textContent  = decodedText;
                    document.getElementById('qrResultBox').style.display = 'block';
                    document.getElementById('qrStatusMsg').textContent   = 'Attendance marked as Present!';
                    document.getElementById('qrStatusMsg').style.color   = '#2e7d32';
                    document.getElementById('scanLine').style.display    = 'none';
                    // Re-enable buttons — camera is fully stopped
                    _qrClosing = false;
                });
            },
            () => {} // per-frame errors ignored
        ).then(() => {
            document.getElementById('qrStatusMsg').textContent = 'Align QR code in the frame';
        }).catch(() => {
            document.getElementById('qrStatusMsg').textContent = 'Camera access denied.';
            document.getElementById('qrStatusMsg').style.color = '#c62828';
            _html5QrCode = null;
        });
    }).catch(() => {
        document.getElementById('qrStatusMsg').textContent = 'Could not access camera.';
        document.getElementById('qrStatusMsg').style.color = '#c62828';
        _html5QrCode = null;
    });
}

// Safely destroy the QR instance — always returns a Promise
function _destroyQR() {
    if (!_html5QrCode) return Promise.resolve();
    const inst = _html5QrCode;
    _html5QrCode = null;
    return inst.stop().catch(() => {}).finally(() => {
        try { inst.clear(); } catch(e) {}
    });
}

function closeQRModal() {
    if (_qrClosing) return;   // already mid-close, ignore extra taps
    _qrClosing = true;

    // Close the modal immediately so the UI feels responsive
    closeModal('qrModal');

    // Reset display state right away
    document.getElementById('scanLine').style.display    = 'block';
    document.getElementById('qrResultBox').style.display = 'none';
    document.getElementById('qrStatusMsg').textContent   = 'Starting camera...';
    document.getElementById('qrStatusMsg').style.color   = '#888';

    // Destroy camera async in background — clears the div too
    _destroyQR().finally(() => {
        // Nuke and recreate the qr-reader div so html5-qrcode
        // doesn't leave stale video elements that block next open
        const container = document.getElementById('qr-reader');
        if (container) {
            container.innerHTML = '';
        }
        _qrClosing = false;
    });
}

// ── Page Navigation ───────────────────────────────────────
function goPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn:not(.nav-qr)').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    const nb = document.getElementById('nav-' + id);
    if (nb) nb.classList.add('active');
    if (id === 'attendance') { attPage = 1; renderAttPage(); }
}

// ── Utilities ─────────────────────────────────────────────
function logout() {
    if (confirm('Are you sure you want to logout?')) window.location.href = 'login.html';
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('scan') === '1') setTimeout(() => openQRScanner(), 400);
    renderNotifications();
    renderRecentAttendance();
    renderAttPage();
});
