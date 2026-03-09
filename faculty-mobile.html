// ═══════════════════════════════════════════════════════════
//  SSC-R Faculty — Mobile JS
//  Same logic as faculty.js desktop
//  Depends on: students-data.js, faculty-scans.js
// ═══════════════════════════════════════════════════════════

// ── Auth ──────────────────────────────────────────────────
requireAuth('faculty');

// ── Toast / Snackbar System ──────────────────────────────
(function() {
    var container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    var ICONS = { success:'✓', error:'✕', info:'ℹ', warn:'⚠' };
    window.showToast = function(msg, type, duration) {
        type = type || 'info'; duration = duration || 3200;
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML =
            '<span class="toast-icon">' + (ICONS[type]||'ℹ') + '</span>' +
            '<span class="toast-msg">' + msg + '</span>' +
            '<button class="toast-close" onclick="this.parentElement._dismiss()">×</button>';
        toast._dismiss = function() {
            toast.classList.add('toast-out');
            setTimeout(function(){ toast.remove(); }, 280);
        };
        container.appendChild(toast);
        var t = setTimeout(function(){ toast._dismiss(); }, duration);
        toast.addEventListener('mouseenter', function(){ clearTimeout(t); });
        toast.addEventListener('mouseleave', function(){ t = setTimeout(function(){ toast._dismiss(); }, 1500); });
    };
})();


// ── Shared Class Info ────────────────────────────────────
const CLASS_INFO = {
    'MATH-A': { name:'Mathematics', room:'Room 101', section:'Sec A' },
    'MATH-B': { name:'Mathematics', room:'Room 101', section:'Sec B' },
    'MATH-C': { name:'Mathematics', room:'Room 101', section:'Sec C' },
    'ENG-A':  { name:'English',     room:'Room 102', section:'Sec A' },
    'ENG-B':  { name:'English',     room:'Room 102', section:'Sec B' },
    'ENG-C':  { name:'English',     room:'Room 102', section:'Sec C' },
    'SCI-A':  { name:'Science',     room:'Lab 201',  section:'Sec A' },
    'SCI-B':  { name:'Science',     room:'Lab 201',  section:'Sec B' },
    'SCI-C':  { name:'Science',     room:'Lab 201',  section:'Sec C' },
    'FIL-A':  { name:'Filipino',    room:'Room 103', section:'Sec A' },
    'FIL-B':  { name:'Filipino',    room:'Room 103', section:'Sec B' },
    'FIL-C':  { name:'Filipino',    room:'Room 103', section:'Sec C' },
};


// ── Notifications ─────────────────────────────────────────
const NOTIFICATIONS = [
    { id:1, unread:true,  type:'alert',   avatar:'SB', avatarColor:'#c62828,#ffcdd2', text:'<strong>3 students</strong> from Sec B exceeded absences in <strong>Math</strong>.', time:'2 mins ago' },
    { id:2, unread:true,  type:'info',    avatar:'SY', avatarColor:'#1565c0,#bbdefb', text:'<strong>Attendance report</strong> for English — Sec A generated successfully.', time:'15 mins ago' },
    { id:3, unread:true,  type:'warn',    avatar:'KG', avatarColor:'#e65100,#ffe0b2', text:'<strong>GONZAGA, Krystine</strong> was marked Late in Science today.', time:'42 mins ago' },
    { id:4, unread:false, type:'success', avatar:'QR', avatarColor:'#2e7d32,#c8e6c9', text:'QR session for <strong>Filipino — Sec C</strong> completed. 11/11 recorded.', time:'1 hr ago' },
    { id:5, unread:false, type:'info',    avatar:'AD', avatarColor:'#1565c0,#bbdefb', text:'Reminder: Submit <strong>monthly attendance reports</strong> by Feb 28, 2026.', time:'3 hrs ago' },
    { id:6, unread:false, type:'alert',   avatar:'SY', avatarColor:'#7b1fa2,#e1bee7', text:'System maintenance on <strong>Feb 22, 2026 at 11:00 PM</strong>.', time:'Yesterday' },
];
let _notifications = [...NOTIFICATIONS];

function renderNotifications() {
    const list   = document.getElementById('notifList');
    const unread = _notifications.filter(n => n.unread).length;
    const badge  = document.getElementById('notificationCount');
    badge.textContent    = unread;
    badge.style.display  = unread > 0 ? 'flex' : 'none';
    list.innerHTML = _notifications.map(n => {
        return `<div class="nd-item ${n.unread ? 'unread' : ''}" onclick="markRead(${n.id})">
            <div class="nd-avatar ${n.type || ''}">${n.avatar || '?'}</div>
            <div class="nd-body">
                <div class="nd-text">${n.text}</div>
                <div class="nd-time">${n.time}</div>
            </div>
            <div class="nd-dot"></div>
        </div>`;
    }).join('');
}

function toggleNotifications(e) {
    e.stopPropagation();
    const dd  = document.getElementById('notifDropdown');
    const btn = document.getElementById('notifBtn');
    const rect = btn.getBoundingClientRect();
    // Position dropdown below the bell button, flush to right edge
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
    if (wrapper && !wrapper.contains(e.target) && dd && !dd.contains(e.target)) {
        closeNotifications();
    }
});


// ═══════════════════════════════════════════════════════════
//  PAGINATION HELPER
// ═══════════════════════════════════════════════════════════
function buildPagination(containerId, total, perPage, currentPage, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    // Prev arrow
    html += `<button class="pg-btn" ${currentPage === 1 ? 'disabled' : ''}
        onclick="(${onPageChange.toString()})(${currentPage - 1})">&#8249;</button>`;

    // Page numbers — show at most 5 around current
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            range.push(i);
        }
    }
    let prev = null;
    range.forEach(i => {
        if (prev !== null && i - prev > 1) html += `<span class="pg-info">…</span>`;
        html += `<button class="pg-btn ${i === currentPage ? 'active' : ''}"
            onclick="(${onPageChange.toString()})(${i})">${i}</button>`;
        prev = i;
    });

    // Next arrow
    html += `<button class="pg-btn" ${currentPage === totalPages ? 'disabled' : ''}
        onclick="(${onPageChange.toString()})(${currentPage + 1})">&#8250;</button>`;

    container.innerHTML = html;
}


// ═══════════════════════════════════════════════════════════
//  SCAN / REPORTS  (with pagination)
// ═══════════════════════════════════════════════════════════
const REPORT_PER_PAGE = 5;
let _reportPage    = 1;
let _filteredScans = [];

function refreshScanPreview() {
    _reportPage = 1;
    _rebuildScanTable();
}

function _rebuildScanTable() {
    if (typeof RECENT_SCANS === 'undefined') return;

    const typeVal = document.getElementById('rptType').value;
    const subjVal = document.getElementById('rptSubject').value;
    const secVal  = document.getElementById('rptSection').value;

    _filteredScans = RECENT_SCANS.filter(r => {
        const okType = !typeVal || r.status  === typeVal;
        const okSubj = !subjVal || r.subject === subjVal;
        const okSec  = !secVal  || r.section === secVal;
        return okType && okSubj && okSec;
    });

    const parts = [];
    if (typeVal) parts.push(typeVal);
    if (subjVal) parts.push(subjVal);
    if (secVal)  parts.push(secVal);
    document.getElementById('scanPreviewLabel').textContent =
        (parts.length ? parts.join(' · ') : 'All records') + ' · Feb 2026';

    const start     = (_reportPage - 1) * REPORT_PER_PAGE;
    const paginated = _filteredScans.slice(start, start + REPORT_PER_PAGE);
    const tbody     = document.getElementById('scanPreviewBody');
    tbody.innerHTML = '';

    if (!_filteredScans.length) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#bbb;font-style:italic;padding:1.2rem;">No records match the selected filters.</td></tr>';
    } else {
        paginated.forEach(r => {
            const statusCls = r.status === 'Present' ? 'Present' : r.status === 'Late' ? 'Late' : 'Absent';
            const tr = document.createElement('tr');
            tr.innerHTML =
                // Col 1: ID + Last name + Section stacked
                '<td>' +
                  '<div class="rpt-student-id">' + r.id + '</div>' +
                  '<div class="rpt-student-name">' + r.name.split(',')[0] + (r.name.includes(',') ? ',' + r.name.split(',').slice(1).join(',') : '') + '</div>' +
                  '<div class="rpt-student-sec">' + r.section + '</div>' +
                '</td>' +
                // Col 2: Subject
                '<td style="font-size:.74rem;font-weight:600;">' + r.subject + '</td>' +
                // Col 3: Time + Status badge
                '<td>' +
                  '<div style="font-size:.74rem;font-weight:700;">' + (r.timeIn || '—') + '</div>' +
                  '<span class="rpt-status ' + statusCls + '">' + r.status + '</span>' +
                '</td>';
            tbody.appendChild(tr);
        });
    }

    const shown = Math.min(start + REPORT_PER_PAGE, _filteredScans.length);
    document.getElementById('scanShownCount').textContent = _filteredScans.length ? shown : 0;
    document.getElementById('scanTotalCount').textContent = RECENT_SCANS.length;

    buildPagination('reportPagination', _filteredScans.length, REPORT_PER_PAGE, _reportPage, function(p) {
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
//  CLASS MODAL
// ═══════════════════════════════════════════════════════════
let _currentSubject = '';
let _currentSection = 'Sec A';

function openClassModal(subjectName) {
    _currentSubject = subjectName;
    _currentSection = 'Sec A';

    document.getElementById('classModalTitle').textContent = subjectName;

    const qrData = 'SSC-R-' + subjectName + '-' + Date.now();
    document.getElementById('classQRCode').src =
        'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(qrData);

    document.getElementById('sessionClass').textContent   = subjectName;
    document.getElementById('sessionSection').textContent = _currentSection;
    document.getElementById('sessionDate').textContent    = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('sessionTime').textContent    = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    SSCR_SECTIONS.forEach(sec => {
        const key = sec.replace(' ', '');
        document.getElementById('count-' + key).textContent = SSCR_STUDENTS[sec].length;
        document.getElementById('tab-' + key).classList.remove('active');
    });
    document.getElementById('tab-SecA').classList.add('active');

    renderStudentTable(_currentSubject, _currentSection);
    document.getElementById('classModal').classList.add('show');
}

function switchSection(sectionLabel) {
    _currentSection = sectionLabel;
    document.getElementById('sessionSection').textContent = sectionLabel;
    SSCR_SECTIONS.forEach(sec => {
        document.getElementById('tab-' + sec.replace(' ', '')).classList.remove('active');
    });
    document.getElementById('tab-' + sectionLabel.replace(' ', '')).classList.add('active');
    renderStudentTable(_currentSubject, _currentSection);
}

function renderStudentTable(subject, section) {
    const students = SSCR_STUDENTS[section];
    const tbody    = document.getElementById('studentListBody');
    tbody.innerHTML = '';

    let present = 0, absent = 0, late = 0;

    students.forEach((s, idx) => {
        const rec    = attendanceDB[subject][section][s.id];
        const status = rec.status || '';
        let timeDisplay = '';
        if (status === 'Absent') timeDisplay = '—';
        else if (status === 'Present' || status === 'Late') timeDisplay = rec.timeIn || '—';
        if (status === 'Present') present++;
        else if (status === 'Absent') absent++;
        else if (status === 'Late') late++;

        const statusClass = 'status-' + (status || 'unmarked');
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td style="color:#999;font-size:.78rem;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:700;font-size:.75rem;color:#555;">' + s.id + '</td>' +
            '<td style="font-size:.8rem;">' + s.name + '</td>' +
            '<td style="font-size:.8rem;color:#555;">' + timeDisplay + '</td>' +
            '<td><select class="status-sel ' + statusClass + '" ' +
                'onchange="updateStatus(\'' + subject + '\',\'' + section + '\',\'' + s.id + '\', this)">' +
                '<option value=""'         + (!status             ? ' selected' : '') + '>— Mark —</option>' +
                '<option value="Present"'  + (status === 'Present' ? ' selected' : '') + '>Present</option>' +
                '<option value="Late"'     + (status === 'Late'    ? ' selected' : '') + '>Late</option>' +
                '<option value="Absent"'   + (status === 'Absent'  ? ' selected' : '') + '>Absent</option>' +
            '</select></td>';
        tbody.appendChild(tr);
    });

    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('presentCount').textContent  = present;
    document.getElementById('absentCount').textContent   = absent;
    document.getElementById('lateCount').textContent     = late;
}

function updateStatus(subject, section, studentId, selectEl) {
    const newStatus = selectEl.value;
    const rec = attendanceDB[subject][section][studentId];
    rec.status = newStatus;
    if (newStatus === 'Present' || newStatus === 'Late') {
        if (!rec.timeIn) rec.timeIn = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (newStatus === 'Absent') {
        rec.timeIn = '';
    }
    selectEl.className = 'status-sel status-' + (newStatus || 'unmarked');
    renderStudentTable(subject, section);
    if (newStatus) showToast(studentId + ' marked as ' + newStatus + '.', newStatus === 'Present' ? 'success' : newStatus === 'Late' ? 'warn' : 'error', 2000);
}

function enlargeQR() {
    document.getElementById('enlargedQRImage').src = document.getElementById('classQRCode').src;
    document.getElementById('qrEnlargedModal').classList.add('show');
}


// ═══════════════════════════════════════════════════════════
//  STUDENT LIST  (with pagination + add student)
// ═══════════════════════════════════════════════════════════
const ROSTER_PER_PAGE = 15;
let _rosterPage     = 1;
let _customStudents = [];   // students added via the Add Student form

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
        const text  = (s.id + ' ' + s.name + ' ' + s.section).toUpperCase();
        const okSrc = !search    || text.includes(search);
        const okSec = !secFilter || s.section === secFilter;
        return okSrc && okSec;
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
            const tr = document.createElement('tr');
            // Store student data as JSON on the row for the detail modal
            const safeId = s.id.replace(/'/g, "\\'");
            tr.innerHTML =
                '<td style="color:#999;font-size:.72rem;text-align:center;">' + (start + idx + 1) + '</td>' +
                '<td style="font-weight:700;font-size:.68rem;color:#555;font-family:monospace;">' + s.id + '</td>' +
                '<td style="font-size:.78rem;font-weight:600;">' + s.name + '</td>' +
                '<td style="text-align:center;"><button class="btn-view-stu" onclick="openStudentDetail(\'' + safeId + '\')">View</button></td>';
            tbody.appendChild(tr);
        });
    }

    buildPagination('rosterPagination', total, ROSTER_PER_PAGE, _rosterPage, function(p) {
        _rosterPage = p;
        _rebuildRosterTable();
    });
}

function openStudentDetail(id) {
    const all = _getAllRosterStudents();
    const s = all.find(s => s.id === id);
    if (!s) return;
    const subjs = Array.isArray(s.subjects) ? s.subjects.join(', ') : (s.subjects || '—');
    const secBg = s.section === 'Sec A' ? '#e8f5e9;color:#2e7d32'
                : s.section === 'Sec B' ? '#e3f2fd;color:#1565c0'
                : '#fff3e0;color:#e65100';
    document.getElementById('studentDetailBody').innerHTML =
        '<div style="padding:0.5rem 1rem 1rem;">' +
        '<div class="sdet-row"><span class="sdet-lbl">Student ID</span><span class="sdet-val" style="font-family:monospace;">' + s.id + '</span></div>' +
        '<div class="sdet-row"><span class="sdet-lbl">Full Name</span><span class="sdet-val">' + s.name + '</span></div>' +
        '<div class="sdet-row"><span class="sdet-lbl">Section</span><span class="sdet-val"><span style="background:' + secBg + ';border-radius:20px;padding:3px 14px;font-size:.85rem;font-weight:700;display:inline-block;">' + s.section + '</span></span></div>' +
        '<div class="sdet-row"><span class="sdet-lbl">Subjects</span><span class="sdet-val">' + subjs + '</span></div>' +
        '</div>';
    document.getElementById('studentDetailModal').classList.add('show');
}

function filterRoster() {
    _rosterPage = 1;
    _rebuildRosterTable();
}

// ── Add Student Modal ─────────────────────────────────────
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
    // Let the browser toggle the checkbox first, then sync the visual class
    setTimeout(function() {
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

    if (!id)           { showToast('Please enter a Student ID.',   'error'); return; }
    if (!name)         { showToast('Please enter the student name.', 'error'); return; }
    if (!section)      { showToast('Please select a section.',     'error'); return; }
    if (!subjs.length) { showToast('Select at least one subject.', 'warn');  return; }

    // Duplicate ID check
    if (_getAllRosterStudents().find(s => s.id === id)) {
        showToast('Student ID "' + id + '" already exists.', 'error');
        return;
    }

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

function logout() {
    showToast('Logging out…', 'info', 1200);
    setTimeout(function(){ window.location.href = 'login.html'; }, 1300);
}

window.addEventListener('click', e => {
    document.querySelectorAll('.modal').forEach(m => { if (e.target === m) m.classList.remove('show'); });
});

function saveProfile() {
    var nameEl = document.querySelector('.settings-section .settings-input');
    var name   = nameEl ? nameEl.value.trim() : '';
    if (!name) { showToast('Name cannot be empty.', 'error'); return; }
    var initials  = name.split(' ').map(function(w){ return w[0]; }).filter(Boolean).slice(0,2).join('').toUpperCase();
    var homeAvatar = document.getElementById('homeAvatar');
    var homeName   = document.getElementById('homeName');
    var topAvatar  = document.querySelector('.avatar-sm');
    if (homeAvatar) homeAvatar.textContent = initials;
    if (homeName)   homeName.textContent   = name;
    if (topAvatar)  topAvatar.textContent  = initials;
    showToast('Profile saved successfully!', 'success');
}


// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    renderNotifications();
    refreshScanPreview();
});
