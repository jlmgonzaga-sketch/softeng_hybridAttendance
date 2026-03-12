// ═══════════════════════════════════════════════════════════
//  SSC-R Faculty — Mobile JS  (Firebase-connected)
//  Depends on: firebase-config.js, students-data.js, faculty-scans.js
// ═══════════════════════════════════════════════════════════

// ── Firebase state ────────────────────────────────────────
let _currentUser    = null;
let _activeSessionId = null;
let _liveUnsubscribe = null;
let _countdownTimer  = null;
let _sessionEndTimer = null;
let _fbSubject = '';
let _fbSection = '';

// ── Schedule lookup (mirrors faculty-firebase.js) ─────────
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MOBILE_SCHEDULE = {
    Monday:    [{time:'07:00',subject:'Math',section:'Sec A'},{time:'08:30',subject:'English',section:'Sec B'},{time:'10:00',subject:'Science',section:'Sec C'},{time:'13:00',subject:'Filipino',section:'Sec A'},{time:'16:00',subject:'English',section:'Sec C'}],
    Tuesday:   [{time:'08:30',subject:'Science',section:'Sec A'},{time:'10:00',subject:'Filipino',section:'Sec B'},{time:'13:00',subject:'Math',section:'Sec C'},{time:'14:30',subject:'English',section:'Sec A'},{time:'16:00',subject:'Science',section:'Sec C'}],
    Wednesday: [{time:'07:00',subject:'Math',section:'Sec B'},{time:'08:30',subject:'English',section:'Sec C'},{time:'10:00',subject:'Filipino',section:'Sec A'},{time:'13:00',subject:'Science',section:'Sec B'},{time:'14:30',subject:'Science',section:'Sec C'}],
    Thursday:  [{time:'08:30',subject:'English',section:'Sec A'},{time:'10:00',subject:'Filipino',section:'Sec C'},{time:'13:00',subject:'Math',section:'Sec B'},{time:'14:30',subject:'English',section:'Sec C'},{time:'16:00',subject:'Science',section:'Sec A'}],
    Friday:    [{time:'07:00',subject:'Math',section:'Sec C'},{time:'08:30',subject:'Science',section:'Sec B'},{time:'13:00',subject:'Math',section:'Sec A'},{time:'14:30',subject:'Filipino',section:'Sec C'},{time:'16:00',subject:'Filipino',section:'Sec B'}],
    Saturday:[], Sunday:[],
};

function getScheduledSection(subject) {
    const day    = DAYS[new Date().getDay()];
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const list   = (MOBILE_SCHEDULE[day] || [])
        .filter(c => c.subject === subject)
        .map(c => { const [h, m] = c.time.split(':').map(Number); return { ...c, min: h * 60 + (m || 0) }; });
    if (!list.length) return 'Sec A';
    const active = list.find(c => nowMin >= c.min && nowMin <= c.min + 90);
    if (active) return active.section;
    const upcoming = list.filter(c => c.min > nowMin).sort((a, b) => a.min - b.min);
    if (upcoming.length) return upcoming[0].section;
    return list.sort((a, b) => b.min - a.min)[0].section;
}


// ── Toast System ─────────────────────────────────────────
(function () {
    var ICONS = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
    window.showToast = function (msg, type, duration) {
        type = type || 'info'; duration = duration || 3200;
        var container = document.getElementById('toast-container');
        if (!container) return;
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML =
            '<span class="toast-icon">' + (ICONS[type] || 'ℹ') + '</span>' +
            '<span class="toast-msg">' + msg + '</span>' +
            '<button class="toast-close" onclick="this.parentElement._dismiss()">×</button>';
        toast._dismiss = function () {
            toast.classList.add('toast-out');
            setTimeout(function () { toast.remove(); }, 280);
        };
        container.appendChild(toast);
        var t = setTimeout(function () { toast._dismiss(); }, duration);
        toast.addEventListener('mouseenter', function () { clearTimeout(t); });
        toast.addEventListener('mouseleave', function () { t = setTimeout(function () { toast._dismiss(); }, 1500); });
    };
})();


// ── Auth: wait for Firebase Auth then populate UI ─────────
document.addEventListener('DOMContentLoaded', function () {
    // Wait for firebase to be ready (firebase-config.js sets up auth)
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function (user) {
            if (!user) {
                window.location.replace('login.html');
                return;
            }
            _currentUser = user;
            _loadUserProfile(user);
        });
    }

    renderNotifications();
    loadTodayReports();

    // Today label
    const lbl = document.getElementById("todayDateLabel");
    if (lbl) lbl.textContent = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Total students stat
    if (typeof getAllStudents === "function") {
        const el = document.getElementById("statTotal");
        if (el) el.textContent = getAllStudents().length;
    }
});

function _loadUserProfile(user) {
    // Try Firestore users/{uid} first, fall back to sessionStorage
    if (typeof db !== 'undefined') {
        db.collection('users').doc(user.uid).get().then(function (doc) {
            if (doc.exists) {
                const d = doc.data();
                _setProfileUI(d.name || 'Faculty', d.title || 'Faculty', d.email || user.email);
            } else {
                _setProfileUI(
                    sessionStorage.getItem('sscr_name')  || 'Faculty',
                    sessionStorage.getItem('sscr_title') || 'Faculty',
                    user.email
                );
            }
        }).catch(function () {
            _setProfileUI(sessionStorage.getItem('sscr_name') || 'Faculty', 'Faculty', user.email);
        });
    } else {
        _setProfileUI(sessionStorage.getItem('sscr_name') || 'Faculty', 'Faculty', user.email);
    }
}

function _setProfileUI(name, title, email) {
    const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('homeName',   name);
    set('homeRole',   title);
    set('homeAvatar', initials);
    set('topAvatar',  initials);
    // Settings page
    const sn = document.getElementById('settingsName');  if (sn) sn.value = name;
    const st = document.getElementById('settingsTitle'); if (st) st.value = title;
    const se = document.getElementById('settingsEmail'); if (se) se.value = email;
}

window.logout = function () {
    showToast('Logging out…', 'info', 1200);
    if (_liveUnsubscribe) _liveUnsubscribe();
    clearInterval(_countdownTimer); clearTimeout(_sessionEndTimer);
    if (typeof auth !== 'undefined') {
        auth.signOut().then(function () {
            sessionStorage.clear();
            window.location.replace('login.html');
        });
    } else {
        setTimeout(function () { window.location.href = 'login.html'; }, 1300);
    }
};

window.changePassword = function () {
    showToast('Password changes are managed through Firebase Console.', 'info');
};


// ── Shared Class Info ─────────────────────────────────────
const CLASS_INFO = {
    'MATH-A': { name: 'Mathematics', room: 'Room 101', section: 'Sec A' },
    'MATH-B': { name: 'Mathematics', room: 'Room 101', section: 'Sec B' },
    'MATH-C': { name: 'Mathematics', room: 'Room 101', section: 'Sec C' },
    'ENG-A':  { name: 'English',     room: 'Room 102', section: 'Sec A' },
    'ENG-B':  { name: 'English',     room: 'Room 102', section: 'Sec B' },
    'ENG-C':  { name: 'English',     room: 'Room 102', section: 'Sec C' },
    'SCI-A':  { name: 'Science',     room: 'Lab 201',  section: 'Sec A' },
    'SCI-B':  { name: 'Science',     room: 'Lab 201',  section: 'Sec B' },
    'SCI-C':  { name: 'Science',     room: 'Lab 201',  section: 'Sec C' },
    'FIL-A':  { name: 'Filipino',    room: 'Room 103', section: 'Sec A' },
    'FIL-B':  { name: 'Filipino',    room: 'Room 103', section: 'Sec B' },
    'FIL-C':  { name: 'Filipino',    room: 'Room 103', section: 'Sec C' },
};


// ── Notifications ─────────────────────────────────────────
const NOTIFICATIONS = [
    { id: 1, unread: true,  type: 'alert',   avatar: 'SB', text: '<strong>3 students</strong> from Sec B exceeded absences in <strong>Math</strong>.', time: '2 mins ago' },
    { id: 2, unread: true,  type: 'info',    avatar: 'SY', text: '<strong>Attendance report</strong> for English — Sec A generated successfully.', time: '15 mins ago' },
    { id: 3, unread: true,  type: 'warn',    avatar: 'KG', text: '<strong>GONZAGA, Krystine</strong> was marked Late in Science today.', time: '42 mins ago' },
    { id: 4, unread: false, type: 'success', avatar: 'QR', text: 'QR session for <strong>Filipino — Sec C</strong> completed. 11/11 recorded.', time: '1 hr ago' },
    { id: 5, unread: false, type: 'info',    avatar: 'AD', text: 'Reminder: Submit <strong>monthly attendance reports</strong> by Feb 28, 2026.', time: '3 hrs ago' },
];
let _notifications = [...NOTIFICATIONS];

function renderNotifications() {
    const list   = document.getElementById('notifList');
    if (!list) return;
    const unread = _notifications.filter(n => n.unread).length;
    const badge  = document.getElementById('notificationCount');
    if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
    list.innerHTML = _notifications.map(n =>
        `<div class="nd-item ${n.unread ? 'unread' : ''}" onclick="markRead(${n.id})">
            <div class="nd-avatar ${n.type || ''}">${n.avatar || '?'}</div>
            <div class="nd-body">
                <div class="nd-text">${n.text}</div>
                <div class="nd-time">${n.time}</div>
            </div>
            <div class="nd-dot"></div>
        </div>`
    ).join('');
}

function toggleNotifications(e) {
    e.stopPropagation();
    const dd  = document.getElementById('notifDropdown');
    const btn = document.getElementById('notifBtn');
    const rect = btn.getBoundingClientRect();
    dd.style.top   = (rect.bottom + 8) + 'px';
    dd.style.right = (window.innerWidth - rect.right) + 'px';
    dd.style.left  = 'auto';
    dd.classList.toggle('open');
    if (dd.classList.contains('open')) renderNotifications();
}
function closeNotifications() { document.getElementById('notifDropdown').classList.remove('open'); }
function markRead(id) { const n = _notifications.find(n => n.id === id); if (n) n.unread = false; renderNotifications(); }
function markAllRead() { _notifications.forEach(n => n.unread = false); renderNotifications(); }

document.addEventListener('click', e => {
    const wrapper = document.getElementById('notifWrapper');
    const dd      = document.getElementById('notifDropdown');
    if (wrapper && !wrapper.contains(e.target) && dd && !dd.contains(e.target)) closeNotifications();
});


// ═══════════════════════════════════════════════════════════
//  REPORTS — pulled live from Firestore (today)
// ═══════════════════════════════════════════════════════════
const REPORT_PER_PAGE = 5;
let _reportPage    = 1;
let _allReports    = [];
let _filteredScans = [];

function loadTodayReports() {
    if (typeof db === 'undefined') return;
    const today = new Date().toISOString().split('T')[0];
    db.collection('attendance')
        .where('date', '==', today)
        .orderBy('updatedAt', 'desc')
        .get()
        .then(function (snap) {
            _allReports = [];
            snap.forEach(doc => _allReports.push(doc.data()));
            refreshScanPreview();
            _updateStatsFromReports();
        })
        .catch(function (err) {
            console.warn('[Reports] Firestore fetch failed, using in-memory data.', err);
            // Fallback: build from attendanceDB
            _allReports = [];
            if (typeof SSCR_SUBJECTS !== 'undefined' && typeof attendanceDB !== 'undefined') {
                SSCR_SUBJECTS.forEach(subj => {
                    Object.keys(attendanceDB[subj] || {}).forEach(sec => {
                        Object.keys(attendanceDB[subj][sec] || {}).forEach(sid => {
                            const rec = attendanceDB[subj][sec][sid];
                            if (rec.status) {
                                const stu = (typeof getAllStudents === 'function') ? getAllStudents().find(s => s.id === sid) : null;
                                _allReports.push({ studentId: sid, studentName: stu ? stu.name : sid, subject: subj, section: sec, status: rec.status, timeIn: rec.timeIn || '' });
                            }
                        });
                    });
                });
            }
            refreshScanPreview();
        });
}

function _updateStatsFromReports() {
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('statPresent', _allReports.filter(r => (r.status||'').toLowerCase() === 'present').length);
    set('statLate',    _allReports.filter(r => (r.status||'').toLowerCase() === 'late').length);
    set('statAbsent',  _allReports.filter(r => (r.status||'').toLowerCase() === 'absent').length);
}

function refreshScanPreview() {
    _reportPage = 1;
    _rebuildScanTable();
}

function _rebuildScanTable() {
    const typeVal = document.getElementById('rptType').value;
    const subjVal = document.getElementById('rptSubject').value;
    const secVal  = document.getElementById('rptSection').value;

    _filteredScans = _allReports.filter(r => {
        const st  = (r.status || '').charAt(0).toUpperCase() + (r.status || '').slice(1).toLowerCase();
        const okType = !typeVal || st === typeVal;
        const okSubj = !subjVal || r.subject === subjVal;
        const okSec  = !secVal  || r.section === secVal;
        return okType && okSubj && okSec;
    });

    const parts = [];
    if (typeVal) parts.push(typeVal);
    if (subjVal) parts.push(subjVal);
    if (secVal)  parts.push(secVal);
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('scanPreviewLabel').textContent =
        (parts.length ? parts.join(' · ') : 'All records') + ' · ' + today;

    const start     = (_reportPage - 1) * REPORT_PER_PAGE;
    const paginated = _filteredScans.slice(start, start + REPORT_PER_PAGE);
    const tbody     = document.getElementById('scanPreviewBody');
    tbody.innerHTML = '';

    if (!_filteredScans.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#bbb;font-style:italic;padding:1.2rem;">No records found for today.</td></tr>';
    } else {
        paginated.forEach(r => {
            const st  = (r.status || '').charAt(0).toUpperCase() + (r.status || '').slice(1).toLowerCase();
            const name = r.studentName || r.studentId || '—';
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td>' +
                  '<div class="rpt-student-id">' + (r.studentId || '—') + '</div>' +
                  '<div class="rpt-student-name">' + name.split(',')[0] + (name.includes(',') ? ',' + name.split(',').slice(1).join(',') : '') + '</div>' +
                  '<div class="rpt-student-sec">' + (r.section || '—') + '</div>' +
                '</td>' +
                '<td style="font-size:.74rem;font-weight:600;">' + (r.subject || '—') + '</td>' +
                '<td>' +
                  '<div style="font-size:.74rem;font-weight:700;">' + (r.timeIn || '—') + '</div>' +
                  '<span class="rpt-status ' + st + '">' + st + '</span>' +
                '</td>';
            tbody.appendChild(tr);
        });
    }

    const shown = _filteredScans.length ? Math.min(start + REPORT_PER_PAGE, _filteredScans.length) : 0;
    document.getElementById('scanShownCount').textContent = shown;
    document.getElementById('scanTotalCount').textContent = _allReports.length;

    buildPagination('reportPagination', _filteredScans.length, REPORT_PER_PAGE, _reportPage, function (p) {
        _reportPage = p;
        _rebuildScanTable();
    });
}

function filterScanSearch() {
    const q    = document.getElementById('scanSearch').value.toUpperCase();
    const rows = document.querySelectorAll('#scanPreviewBody tr');
    let shown  = 0;
    rows.forEach(row => {
        const match = !q || row.textContent.toUpperCase().includes(q);
        row.style.display = match ? '' : 'none';
        if (match) shown++;
    });
    document.getElementById('scanShownCount').textContent = shown;
}

function downloadReport() {
    const subject = document.getElementById('rptSubject').value;
    const section = document.getElementById('rptSection').value;
    if (!subject || !section) { showToast('Please select a Subject and Section first.', 'warn'); return; }
    showToast('Downloading report for ' + subject + ' — ' + section + '…', 'success');
}


// ═══════════════════════════════════════════════════════════
//  PAGINATION HELPER
// ═══════════════════════════════════════════════════════════
function buildPagination(containerId, total, perPage, currentPage, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    html += `<button class="pg-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="(${onPageChange.toString()})(${currentPage - 1})">&#8249;</button>`;
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) range.push(i);
    }
    let prev = null;
    range.forEach(i => {
        if (prev !== null && i - prev > 1) html += `<span class="pg-info">…</span>`;
        html += `<button class="pg-btn ${i === currentPage ? 'active' : ''}" onclick="(${onPageChange.toString()})(${i})">${i}</button>`;
        prev = i;
    });
    html += `<button class="pg-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="(${onPageChange.toString()})(${currentPage + 1})">&#8250;</button>`;
    container.innerHTML = html;
}


// ═══════════════════════════════════════════════════════════
//  CLASS MODAL — Firebase-powered
// ═══════════════════════════════════════════════════════════
function openClassModal(subjectName) {
    if (!_currentUser) { showToast('Not logged in. Please refresh.', 'error'); return; }
    _fbSubject = subjectName;
    _fbSection = getScheduledSection(subjectName);

    document.getElementById('classModalTitle').textContent = subjectName;
    document.getElementById('sessionClass').textContent    = subjectName;
    document.getElementById('sessionSection').textContent  = _fbSection;
    document.getElementById('sessionDate').textContent     = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('sessionTime').textContent     = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    _updateTabs(_fbSection);
    _fbRenderTable(_fbSubject, _fbSection);
    _resetToPreSession();
    document.getElementById('classModal').classList.add('show');
}

function switchSection(sectionLabel) {
    _fbSection = sectionLabel;
    document.getElementById('sessionSection').textContent = sectionLabel;
    _updateTabs(sectionLabel);
    _fbRenderTable(_fbSubject, _fbSection);
}

function _updateTabs(activeSection) {
    ['Sec A', 'Sec B', 'Sec C'].forEach(sec => {
        const key = sec.replace(' ', '');
        const tab = document.getElementById('tab-' + key);
        if (tab) sec === activeSection ? tab.classList.add('active') : tab.classList.remove('active');
        const cnt = document.getElementById('count-' + key);
        if (cnt && typeof SSCR_STUDENTS !== 'undefined') cnt.textContent = (SSCR_STUDENTS[sec] || []).length;
    });
}

// ── Render student table from attendanceDB (in-memory) ─────
function _fbRenderTable(subject, section) {
    if (typeof SSCR_STUDENTS === 'undefined') return;
    const students = SSCR_STUDENTS[section] || [];
    const tbody    = document.getElementById('studentListBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let present = 0, absent = 0, late = 0;

    students.forEach(function (s, idx) {
        const rec    = (typeof attendanceDB !== 'undefined' && attendanceDB[subject] && attendanceDB[subject][section])
                       ? attendanceDB[subject][section][s.id] || { status: '', timeIn: '' }
                       : { status: '', timeIn: '' };
        const status = rec.status || '';
        let timeDisplay = '';
        if (status === 'Absent') timeDisplay = '—';
        else if (status === 'Present' || status === 'Late') timeDisplay = rec.timeIn || '—';
        if (status === 'Present') present++;
        else if (status === 'Absent') absent++;
        else if (status === 'Late') late++;

        const tr = document.createElement('tr');
        tr.setAttribute('data-student-id', s.id);
        tr.innerHTML =
            '<td style="color:#aaa;font-size:.78rem;font-weight:600;text-align:center;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:700;font-size:.75rem;color:#555;">' + s.id + '</td>' +
            '<td style="font-size:.8rem;">' + s.name + '</td>' +
            '<td style="font-size:.8rem;color:#888;text-align:center;" class="status-cell">' + timeDisplay + '</td>' +
            '<td><select class="status-sel status-' + (status || 'unmarked') + '" ' +
                'onchange="updateStatus(\'' + subject + '\',\'' + section + '\',\'' + s.id + '\',this)">' +
                '<option value=""'         + (!status             ? ' selected' : '') + '>— Mark —</option>' +
                '<option value="Present"'  + (status === 'Present' ? ' selected' : '') + '>Present</option>' +
                '<option value="Late"'     + (status === 'Late'    ? ' selected' : '') + '>Late</option>' +
                '<option value="Absent"'   + (status === 'Absent'  ? ' selected' : '') + '>Absent</option>' +
            '</select></td>';
        tbody.appendChild(tr);
    });

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('totalStudents', students.length);
    set('presentCount',  present);
    set('absentCount',   absent);
    set('lateCount',     late);
}

// ── Manual status update (saves to Firestore + in-memory) ──
function updateStatus(subject, section, studentId, selectEl) {
    const newStatus = selectEl.value;
    if (typeof attendanceDB !== 'undefined' && attendanceDB[subject] && attendanceDB[subject][section]) {
        const rec = attendanceDB[subject][section][studentId];
        rec.status = newStatus;
        if (newStatus === 'Present' || newStatus === 'Late') {
            if (!rec.timeIn) rec.timeIn = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (newStatus === 'Absent') {
            rec.timeIn = '';
        }
    }
    selectEl.className = 'status-sel status-' + (newStatus || 'unmarked');

    // Save to Firestore
    if (newStatus && typeof db !== 'undefined') {
        const timeIn = (newStatus === 'Present' || newStatus === 'Late')
            ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : '';
        fsSetAttendance(subject, section, studentId, newStatus, timeIn).catch(err => {
            console.warn('[Firestore] Manual attendance save failed:', err);
        });
    }

    _fbRenderTable(subject, section);
    if (newStatus) showToast(studentId + ' marked as ' + newStatus + '.', newStatus === 'Present' ? 'success' : newStatus === 'Late' ? 'warn' : 'error', 2000);
}


// ═══════════════════════════════════════════════════════════
//  QR SESSION — Firebase
// ═══════════════════════════════════════════════════════════
function _resetToPreSession() {
    const startBtn  = document.getElementById('fbStartBtn');
    const countdown = document.getElementById('fbCountdown');
    const placeholder = document.getElementById('qrPlaceholder');
    const qrDiv       = document.getElementById('firebaseQRDiv');
    const clickHint   = document.getElementById('qrClickHint');

    if (startBtn)   { startBtn.style.display = 'block'; startBtn.textContent = '▶ Start Session'; startBtn.disabled = false; }
    if (countdown)  countdown.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (qrDiv)      { qrDiv.style.display = 'none'; qrDiv.innerHTML = ''; }
    if (clickHint)  clickHint.style.display = 'none';

    clearInterval(_countdownTimer); clearTimeout(_sessionEndTimer);
    if (_liveUnsubscribe) { _liveUnsubscribe(); _liveUnsubscribe = null; }
    if (_activeSessionId && typeof db !== 'undefined') {
        db.collection('sessions').doc(_activeSessionId).update({ active: false }).catch(() => {});
        _activeSessionId = null;
    }
}

window.startFbSession = async function () {
    if (!_currentUser) { showToast('Not logged in.', 'error'); return; }
    const startBtn = document.getElementById('fbStartBtn');
    if (startBtn) { startBtn.textContent = 'Starting…'; startBtn.disabled = true; }

    try {
        const now     = new Date();
        const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

        const sessionRef = await db.collection('sessions').add({
            subject:   _fbSubject,
            section:   _fbSection,
            faculty:   _currentUser.email,
            facultyId: _currentUser.uid,
            startTime: now,
            endTime:   endTime,
            active:    true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        _activeSessionId = sessionRef.id;

        // Build scan URL pointing to qr-scanner.html (or student.html)
        const base    = window.location.href.replace(/\/[^/]*$/, '/');
        const scanUrl = base + 'qr-scanner.html?scan=' + sessionRef.id;

        _showQR(scanUrl);

        if (startBtn) startBtn.style.display = 'none';
        const countdown = document.getElementById('fbCountdown');
        if (countdown) countdown.style.display = 'block';

        _startCountdown(endTime);
        _listenAttendance(sessionRef.id);
        _sessionEndTimer = setTimeout(() => window.endSession(), 60 * 60 * 1000);

        showToast(_fbSubject + ' session started!', 'success');

    } catch (err) {
        console.error(err);
        if (startBtn) { startBtn.textContent = '▶ Start Session'; startBtn.disabled = false; }
        showToast('Failed to start session: ' + err.message, 'error');
    }
};

function _showQR(url) {
    window._currentQRUrl = url;
    const placeholder = document.getElementById('qrPlaceholder');
    const qrDiv       = document.getElementById('firebaseQRDiv');
    const clickHint   = document.getElementById('qrClickHint');
    if (placeholder) placeholder.style.display = 'none';
    if (clickHint)   clickHint.style.display = 'block';
    if (!qrDiv) return;
    qrDiv.style.display = 'block';
    qrDiv.innerHTML = '';

    function render() {
        new QRCode(qrDiv, { text: url, width: 180, height: 180, colorDark: '#1a1a1a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
    }
    typeof QRCode !== 'undefined' ? render() : (() => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        s.onload = render; document.head.appendChild(s);
    })();
}

function enlargeQR() {
    if (!window._currentQRUrl) return;
    const div = document.getElementById('enlargedQRDiv');
    if (!div) return;
    div.innerHTML = '';
    new QRCode(div, { text: window._currentQRUrl, width: 260, height: 260, colorDark: '#1a1a1a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
    document.getElementById('qrEnlargedModal').classList.add('show');
}

function _startCountdown(endTime) {
    clearInterval(_countdownTimer);
    function tick() {
        const rem = Math.max(0, Math.floor((endTime - new Date()) / 1000));
        const el  = document.getElementById('fbCountdownTime');
        if (el) el.textContent = String(Math.floor(rem / 60)).padStart(2, '0') + ':' + String(rem % 60).padStart(2, '0');
        if (rem === 0) { clearInterval(_countdownTimer); window.endSession(); }
    }
    tick(); _countdownTimer = setInterval(tick, 1000);
}

// ── Live Firestore listener — updates student rows in real-time ──
function _listenAttendance(sessionId) {
    if (_liveUnsubscribe) _liveUnsubscribe();
    _liveUnsubscribe = db.collection('attendance')
        .where('sessionId', '==', sessionId)
        .onSnapshot(function (snapshot) {
            const COLOR = {
                present: 'background:#e8f5e9;color:#2e7d32;border:1.5px solid #66bb6a;',
                late:    'background:#fff3e0;color:#e65100;border:1.5px solid #FFA500;',
                absent:  'background:#ffebee;color:#c62828;border:1.5px solid #ef9a9a;',
            };
            snapshot.docs.map(d => d.data()).forEach(rec => {
                // Match by studentId field OR uid
                const sid = rec.studentId;
                const row = document.querySelector('[data-student-id="' + sid + '"]');
                if (!row) return;
                const cell = row.querySelector('.status-cell');
                if (!cell) return;
                const st = (rec.status || '').toLowerCase();
                cell.innerHTML = `<span style="padding:2px 10px;border-radius:20px;font-size:0.73rem;font-weight:700;${COLOR[st]||''}">${rec.status.toUpperCase()}</span>`;

                // Update in-memory attendanceDB so it persists across tab switches
                if (typeof attendanceDB !== 'undefined' && attendanceDB[_fbSubject] && attendanceDB[_fbSubject][_fbSection] && attendanceDB[_fbSubject][_fbSection][sid]) {
                    attendanceDB[_fbSubject][_fbSection][sid].status = rec.status.charAt(0).toUpperCase() + rec.status.slice(1).toLowerCase();
                    attendanceDB[_fbSubject][_fbSection][sid].timeIn = rec.timeIn || '';
                }
            });

            // Update summary counts
            const docs = snapshot.docs.map(d => d.data());
            const set  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
            set('presentCount', docs.filter(r => (r.status || '').toLowerCase() === 'present').length);
            set('lateCount',    docs.filter(r => (r.status || '').toLowerCase() === 'late').length);
            set('absentCount',  docs.filter(r => (r.status || '').toLowerCase() === 'absent').length);

            // Also refresh the home reports panel silently
            loadTodayReports();
        });
}

window.endSession = async function () {
    clearInterval(_countdownTimer); clearTimeout(_sessionEndTimer);
    if (_liveUnsubscribe) { _liveUnsubscribe(); _liveUnsubscribe = null; }
    if (_activeSessionId && typeof db !== 'undefined') {
        try { await db.collection('sessions').doc(_activeSessionId).update({ active: false }); } catch (e) {}
        _activeSessionId = null;
    }
    _resetToPreSession();
    showToast('Session ended. Attendance saved!', 'success');
};


// ═══════════════════════════════════════════════════════════
//  STUDENT LIST  (with pagination + add student)
// ═══════════════════════════════════════════════════════════
const ROSTER_PER_PAGE = 15;
let _rosterPage     = 1;
let _customStudents = [];

function _getAllRosterStudents() {
    const base = (typeof getAllStudents === 'function') ? getAllStudents() : [];
    return [...base, ..._customStudents];
}

function loadRoster() {
    _rosterPage = 1;
    _rebuildRosterTable();
}

function _rebuildRosterTable() {
    const search    = (document.getElementById('rosterSearch').value || '').toUpperCase();
    const secFilter = document.getElementById('rosterSectionFilter').value;
    const all = _getAllRosterStudents().filter(s => {
        const text = (s.id + ' ' + s.name + ' ' + s.section).toUpperCase();
        return (!search || text.includes(search)) && (!secFilter || s.section === secFilter);
    });
    const total     = all.length;
    const start     = (_rosterPage - 1) * ROSTER_PER_PAGE;
    const paginated = all.slice(start, start + ROSTER_PER_PAGE);

    document.getElementById('rosterTotalCount').textContent = total;
    document.getElementById('rosterShownCount').textContent = total;

    const tbody = document.getElementById('rosterTableBody');
    tbody.innerHTML = '';
    if (!paginated.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#bbb;font-style:italic;padding:1.2rem;">No students found.</td></tr>';
    } else {
        paginated.forEach((s, idx) => {
            const safeId = s.id.replace(/'/g, "\\'");
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td style="color:#999;font-size:.72rem;text-align:center;">' + (start + idx + 1) + '</td>' +
                '<td style="font-weight:700;font-size:.68rem;color:#555;font-family:monospace;">' + s.id + '</td>' +
                '<td style="font-size:.78rem;font-weight:600;">' + s.name + '</td>' +
                '<td style="text-align:center;"><button class="btn-view-stu" onclick="openStudentDetail(\'' + safeId + '\')">View</button></td>';
            tbody.appendChild(tr);
        });
    }
    buildPagination('rosterPagination', total, ROSTER_PER_PAGE, _rosterPage, function (p) {
        _rosterPage = p;
        _rebuildRosterTable();
    });
}

function openStudentDetail(id) {
    const s = _getAllRosterStudents().find(s => s.id === id);
    if (!s) return;
    const subjArr  = Array.isArray(s.subjects) ? s.subjects : ['Math', 'English', 'Science', 'Filipino'];
    const subjPills = subjArr.map(sub =>
        '<span style="display:inline-block;background:linear-gradient(135deg,#FFD700,#FFA500);color:#1a1a1a;border-radius:20px;padding:3px 12px;font-size:0.78rem;font-weight:700;margin:2px;">' + sub + '</span>'
    ).join('');
    const secColor = s.section === 'Sec A' ? 'background:#e8f5e9;color:#2e7d32'
                   : s.section === 'Sec B' ? 'background:#e3f2fd;color:#1565c0'
                   : 'background:#fff3e0;color:#e65100';
    document.getElementById('studentDetailBody').innerHTML =
        '<div style="padding:0.5rem 1rem 1rem;">' +
        '<div class="sdet-row"><span class="sdet-lbl">Student ID</span><span class="sdet-val" style="font-family:monospace;">' + s.id + '</span></div>' +
        '<div class="sdet-row"><span class="sdet-lbl">Full Name</span><span class="sdet-val">' + s.name + '</span></div>' +
        '<div class="sdet-row"><span class="sdet-lbl">Section</span><span class="sdet-val"><span style="' + secColor + ';border-radius:20px;padding:3px 14px;font-size:.85rem;font-weight:700;display:inline-block;">' + s.section + '</span></span></div>' +
        '<div class="sdet-row" style="flex-direction:column;align-items:flex-start;gap:0.5rem;"><span class="sdet-lbl">Subjects Enrolled</span><div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:0.25rem;">' + subjPills + '</div></div>' +
        '</div>';
    document.getElementById('studentDetailModal').classList.add('show');
}

function filterRoster() { _rosterPage = 1; _rebuildRosterTable(); }

function openAddStudentModal() {
    document.getElementById('newStuId').value      = '';
    document.getElementById('newStuName').value    = '';
    document.getElementById('newStuSection').value = '';
    document.querySelectorAll('#newStuSubjects .subj-check-label').forEach(lbl => {
        lbl.classList.remove('checked');
        lbl.querySelector('input').checked = false;
    });
    document.getElementById('addStudentModal').classList.add('show');
}

function toggleSubjCheck(label) {
    setTimeout(function () {
        const cb = label.querySelector('input[type=checkbox]');
        if (cb.checked) label.classList.add('checked');
        else            label.classList.remove('checked');
    }, 0);
}

function submitAddStudent() {
    const id      = document.getElementById('newStuId').value.trim();
    const name    = document.getElementById('newStuName').value.trim();
    const section = document.getElementById('newStuSection').value;
    const subjs   = [];
    document.querySelectorAll('#newStuSubjects input[type=checkbox]:checked').forEach(cb => subjs.push(cb.value));

    if (!id)           { showToast('Please enter a Student ID.',    'error'); return; }
    if (!name)         { showToast('Please enter the student name.', 'error'); return; }
    if (!section)      { showToast('Please select a section.',      'error'); return; }
    if (!subjs.length) { showToast('Select at least one subject.',  'warn');  return; }
    if (_getAllRosterStudents().find(s => s.id === id)) { showToast('Student ID "' + id + '" already exists.', 'error'); return; }

    _customStudents.push({ id, name, section, subjects: subjs });
    closeModal('addStudentModal');
    _rosterPage = 1;
    _rebuildRosterTable();
    showToast(name + ' added successfully!', 'success');
}


// ═══════════════════════════════════════════════════════════
//  SCHEDULE CLICK
// ═══════════════════════════════════════════════════════════
function viewClassDetails(classCode, day, time) {
    const info = CLASS_INFO[classCode] || { name: 'Unknown', room: '—', section: '—' };
    document.getElementById('modalBody').innerHTML =
        '<div class="detail-row"><span class="dr-lbl">Subject</span><span class="dr-val">' + info.name + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Section</span><span class="dr-val">' + info.section + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Day</span><span class="dr-val">' + day + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Time</span><span class="dr-val">' + time + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Location</span><span class="dr-val">' + info.room + '</span></div>' +
        '<div style="margin-top:1rem;">' +
            '<button class="btn btn-primary btn-full" onclick="openClassModal(\'' + info.name.split(' ')[0] + '\');closeModal(\'detailsModal\')">Start Attendance Session</button>' +
        '</div>';
    document.getElementById('detailsModal').classList.add('show');
}


// ═══════════════════════════════════════════════════════════
//  PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════
function goPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    const navBtn = document.getElementById('nav-' + id);
    if (navBtn) navBtn.classList.add('active');
}


// ═══════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

window.addEventListener('click', e => {
    document.querySelectorAll('.modal').forEach(m => { if (e.target === m) m.classList.remove('show'); });
});

function saveProfile() {
    const nameEl = document.getElementById('settingsName');
    const name   = nameEl ? nameEl.value.trim() : '';
    if (!name) { showToast('Name cannot be empty.', 'error'); return; }
    const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('homeAvatar', initials);
    set('homeName',   name);
    set('topAvatar',  initials);
    showToast('Profile saved successfully!', 'success');
}
