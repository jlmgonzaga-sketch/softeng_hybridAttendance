// faculty.js
// ── All application logic for the SSC-R Faculty Dashboard ────────────────
// Depends on: students-data.js (SSCR_STUDENTS, attendanceDB, etc.)
//             faculty-scans.js (RECENT_SCANS)

// ── Notifications ─────────────────────────────────────────────────────────
requireAuth('faculty');

// ── Toast / Snackbar System ──────────────────────────────────────────────
(function() {
    var container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);

    var ICONS = { success:'✓', error:'✕', info:'ℹ', warn:'⚠' };

    window.showToast = function(msg, type, duration) {
        type = type || 'info';
        duration = duration || 3500;
        var toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        toast.innerHTML =
            '<span class="toast-icon">' + (ICONS[type] || 'ℹ') + '</span>' +
            '<span class="toast-msg">' + msg + '</span>' +
            '<button class="toast-close" onclick="this.parentElement._dismiss()">×</button>';
        toast._dismiss = function() {
            toast.classList.add('toast-out');
            setTimeout(function() { toast.remove(); }, 280);
        };
        container.appendChild(toast);
        var t = setTimeout(function() { toast._dismiss(); }, duration);
        toast.addEventListener('mouseenter', function() { clearTimeout(t); });
        toast.addEventListener('mouseleave', function() { t = setTimeout(function() { toast._dismiss(); }, 1500); });
    };
})();

// ── Shared Class Info (previously inline in viewClassDetails) ─────────────
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


const NOTIFICATIONS = [
    { id:1, unread:true,  type:'alert',   avatar:'SB', avatarColor:'#c62828,#ffcdd2', text:'<strong>3 students</strong> from Sec B have exceeded the maximum absences in <strong>Math</strong>.', time:'2 mins ago' },
    { id:2, unread:true,  type:'info',    avatar:'SY', avatarColor:'#1565c0,#bbdefb', text:'<strong>Attendance report</strong> for English — Sec A has been generated successfully.', time:'15 mins ago' },
    { id:3, unread:true,  type:'warn',    avatar:'KG', avatarColor:'#e65100,#ffe0b2', text:'<strong>GONZAGA, Krystine</strong> was marked Late in Science class today.', time:'42 mins ago' },
    { id:4, unread:false, type:'success', avatar:'QR', avatarColor:'#2e7d32,#c8e6c9', text:'QR attendance session for <strong>Filipino — Sec C</strong> completed. 11/11 students recorded.', time:'1 hr ago' },
    { id:5, unread:false, type:'info',    avatar:'AD', avatarColor:'#1565c0,#bbdefb', text:'Reminder: Submit <strong>monthly attendance reports</strong> by Feb 28, 2026.', time:'3 hrs ago' },
    { id:6, unread:false, type:'alert',   avatar:'SY', avatarColor:'#7b1fa2,#e1bee7', text:'System maintenance scheduled on <strong>Feb 22, 2026 at 11:00 PM</strong>. Save your work.', time:'Yesterday' },
];

let _notifications = [...NOTIFICATIONS];

function renderNotifications() {
    const list = document.getElementById('notifList');
    const unread = _notifications.filter(n => n.unread).length;
    const badge = document.getElementById('notificationCount');
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
    list.innerHTML = _notifications.map(n => {
        var cols = (n.avatarColor || '#555,#eee').split(',');
        var avatarStyle = 'background:' + cols[1] + ';color:' + cols[0] + ';border-color:' + cols[0] + ';';
        return `
        <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="markRead(${n.id})">
            <div class="notif-icon ${n.type}" style="${avatarStyle}" title="Profile photo placeholder">${n.avatar || '?'}</div>
            <div class="notif-body">
                <div class="notif-text">${n.text}</div>
                <div class="notif-time">${n.time}</div>
            </div>
            <div class="notif-dot"></div>
        </div>`;
    }).join('');
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


// ── Scan Preview (paginated · 6 rows per page) ───────────────────────────

let _scanFiltered = [];
let _scanPage = 1;
const _SCAN_PER_PAGE = 4;

function refreshScanPreview() {
    const typeVal = document.getElementById('rptType').value;
    const subjVal = document.getElementById('rptSubject').value;
    const secVal  = document.getElementById('rptSection').value;

    _scanFiltered = RECENT_SCANS.filter(function(r) {
        return (!typeVal || r.status  === typeVal)
            && (!subjVal || r.subject === subjVal)
            && (!secVal  || r.section === secVal);
    });

    const parts = [];
    if (typeVal) parts.push(typeVal);
    if (subjVal) parts.push(subjVal);
    if (secVal)  parts.push(secVal);
    document.getElementById('scanPreviewLabel').textContent =
        (parts.length ? parts.join(' · ') : 'All records') + ' · Feb 2026';

    _scanPage = 1;
    _renderScanPage();
}

function _renderScanPage() {
    const total = _scanFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / _SCAN_PER_PAGE));
    if (_scanPage > totalPages) _scanPage = totalPages;
    const start    = (_scanPage - 1) * _SCAN_PER_PAGE;
    const pageRows = _scanFiltered.slice(start, start + _SCAN_PER_PAGE);

    const tbody = document.getElementById('scanPreviewBody');
    tbody.innerHTML = '';

    if (pageRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#bbb;font-style:italic;padding:1.5rem;">No records match the selected filters.</td></tr>';
    } else {
        pageRows.forEach(function(r) {
            const tc = r.status === 'Present' ? '#1a7a1a' : r.status === 'Late' ? '#c45c00' : '#999';
            const bs = r.status === 'Present'
                ? 'background:#e8f5e9;color:#2e7d32;border:1.5px solid #66bb6a;'
                : r.status === 'Late'
                ? 'background:#fff3e0;color:#e65100;border:1.5px solid #FFA500;'
                : 'background:#ffebee;color:#c62828;border:1.5px solid #ef9a9a;';
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td style="font-size:0.72rem;font-weight:700;color:#888;">'        + r.id      + '</td>' +
                '<td style="font-size:0.8rem;font-weight:600;">'                    + r.name    + '</td>' +
                '<td style="font-size:0.78rem;">'                                   + r.subject + '</td>' +
                '<td style="font-size:0.78rem;">'                                   + r.section + '</td>' +
                '<td style="font-size:0.78rem;font-weight:600;color:' + tc + ';">' + (r.timeIn || '—') + '</td>' +
                '<td><span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;' + bs + '">' + r.status + '</span></td>';
            tbody.appendChild(tr);
        });
    }

    const s2 = total === 0 ? 0 : start + 1;
    const e2 = Math.min(start + _SCAN_PER_PAGE, total);
    document.getElementById('scanShownCount').textContent = total === 0 ? '0' : s2 + '\u2013' + e2;
    document.getElementById('scanTotalCount').textContent = total;
    _buildScanPagination(totalPages, total);
}

function _buildScanPagination(totalPages, total) {
    const wrap = document.getElementById('scanPaginationWrap');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (total <= _SCAN_PER_PAGE) return;

    function mkBtn(label, disabled, active) {
        const b = document.createElement('button');
        b.className = 'page-btn' + (active ? ' active' : '');
        b.textContent = label;
        b.disabled = !!disabled;
        return b;
    }

    const prev = mkBtn('\u2039', _scanPage === 1);
    prev.onclick = function() { if (_scanPage > 1) { _scanPage--; _renderScanPage(); } };
    wrap.appendChild(prev);

    let s = Math.max(1, _scanPage - 2);
    let e = Math.min(totalPages, s + 4);
    if (e - s < 4) s = Math.max(1, e - 4);
    for (let p = s; p <= e; p++) {
        const b = mkBtn(p, false, p === _scanPage);
        (function(pg) { b.onclick = function() { _scanPage = pg; _renderScanPage(); }; })(p);
        wrap.appendChild(b);
    }

    const next = mkBtn('\u203a', _scanPage === totalPages);
    next.onclick = function() { if (_scanPage < totalPages) { _scanPage++; _renderScanPage(); } };
    wrap.appendChild(next);
}


// ── Scan Search ───────────────────────────────────────────────────────────

function filterScanSearch() {
    const q = document.getElementById('scanSearch').value.trim().toUpperCase();
    if (!q) { refreshScanPreview(); return; }
    _scanFiltered = RECENT_SCANS.filter(function(r) {
        return (r.id + ' ' + r.name + ' ' + r.subject + ' ' + r.section).toUpperCase().includes(q);
    });
    _scanPage = 1;
    _renderScanPage();
}


// ── Report Buttons ────────────────────────────────────────────────────────

function downloadReport() {
    const subject = document.getElementById('rptSubject').value;
    const section = document.getElementById('rptSection').value;
    if (!subject || !section) {
        showToast('Please select a Subject and Section first.', 'warn'); return;
        return;
    }
    showToast('Downloading report for ' + subject + ' — ' + section + '…', 'success');
}


// ── Class Modal ───────────────────────────────────────────────────────────

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
    document.getElementById('sessionDate').textContent    = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
    document.getElementById('sessionTime').textContent    = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });

    SSCR_SECTIONS.forEach(function(sec) {
        const key = sec.replace(' ', '');
        document.getElementById('count-' + key).textContent = SSCR_STUDENTS[sec].length;
        document.getElementById('tab-'   + key).classList.remove('active');
    });
    document.getElementById('tab-SecA').classList.add('active');

    renderStudentTable(_currentSubject, _currentSection);
    document.getElementById('classModal').classList.add('show'); // unified: all modals use .show
}

function switchSection(sectionLabel) {
    _currentSection = sectionLabel;
    document.getElementById('sessionSection').textContent = sectionLabel;
    SSCR_SECTIONS.forEach(function(sec) {
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

    students.forEach(function(s, idx) {
        const rec    = attendanceDB[subject][section][s.id];
        const status = rec.status || '';
        let timeDisplay = '';
        if (status === 'Absent') timeDisplay = '—';
        else if (status === 'Present' || status === 'Late') timeDisplay = rec.timeIn || '—';
        if (status === 'Present') present++;
        else if (status === 'Absent') absent++;
        else if (status === 'Late') late++;

        const statusClass = status ? 'status-' + status.toLowerCase() : 'status-unmarked';
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td style="color:#999;font-size:0.8rem;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:700;font-size:0.82rem;color:#555;">' + s.id + '</td>' +
            '<td style="font-weight:500;">' + s.name + '</td>' +
            '<td style="font-size:0.85rem;color:#555;">' + timeDisplay + '</td>' +
            '<td><select class="status-select ' + statusClass + '" ' +
                'onchange="updateStatus(\'' + subject + '\',\'' + section + '\',\'' + s.id + '\', this)" ' +
                'style="border:none;border-radius:20px;padding:3px 8px;font-size:0.78rem;font-weight:700;cursor:pointer;outline:none;">' +
                '<option value=""'       + (!status             ? ' selected' : '') + '>— Mark —</option>' +
                '<option value="Present"' + (status === 'Present' ? ' selected' : '') + '>Present</option>' +
                '<option value="Late"'    + (status === 'Late'    ? ' selected' : '') + '>Late</option>' +
                '<option value="Absent"'  + (status === 'Absent'  ? ' selected' : '') + '>Absent</option>' +
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
        if (!rec.timeIn) rec.timeIn = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    } else if (newStatus === 'Absent') {
        rec.timeIn = '';
    }
    selectEl.className = 'status-select status-' + (newStatus ? newStatus.toLowerCase() : 'unmarked');
    renderStudentTable(subject, section);
}

function enlargeQR() {
    document.getElementById('enlargedQRImage').src = document.getElementById('classQRCode').src;
    document.getElementById('qrEnlargedModal').classList.add('show');
}


// ── Profile Modal ─────────────────────────────────────────────────────────

function openProfileModal() {
    document.getElementById('profileName').value  = document.getElementById('headerName').textContent;
    document.getElementById('profileRole').value  = document.getElementById('headerRole').textContent;
    updateAvatarPreview();
    document.getElementById('profileModal').classList.add('show');
}

function updateAvatarPreview() {
    var name = document.getElementById('profileName').value.trim();
    var initials = name.split(' ').map(function(w){ return w[0]; }).filter(Boolean).slice(0,2).join('').toUpperCase() || '?';
    document.getElementById('profileAvatarPreview').textContent = initials;
}

function saveProfile() {
    var name = document.getElementById('profileName').value.trim();
    var role = document.getElementById('profileRole').value.trim();
    if (!name) { showToast('Name cannot be empty.', 'error'); return; }
    var initials = name.split(' ').map(function(w){ return w[0]; }).filter(Boolean).slice(0,2).join('').toUpperCase();
    document.getElementById('headerName').textContent   = name;
    document.getElementById('headerRole').textContent   = role;
    document.getElementById('headerAvatar').textContent = initials;
    closeModal('profileModal');
    showToast('Profile updated successfully.', 'success');
}


// ── Student Roster Modal ──────────────────────────────────────────────────

var _rosterData = null;

function _initRoster() {
    if (_rosterData) return;
    _rosterData = getAllStudents().map(function(s) {
        return { id: s.id, name: s.name, section: s.section, subjects: Array.isArray(s.subjects) ? s.subjects.slice() : SSCR_SUBJECTS.slice() };
    });
}

function openStudentListModal() {
    _initRoster();
    document.getElementById('addStudentForm').style.display = 'none';
    document.getElementById('rosterSearch').value = '';
    document.getElementById('rosterSectionFilter').value = '';
    _renderRoster(_rosterData);
    document.getElementById('studentListModal').classList.add('show');
}

function _renderRoster(list) {
    var tbody = document.getElementById('rosterTableBody');
    tbody.innerHTML = '';
    document.getElementById('rosterTotalCount').textContent = _rosterData.length;
    document.getElementById('rosterShownCount').textContent = list.length;
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#bbb;font-style:italic;padding:1.5rem;">No students found.</td></tr>';
        return;
    }
    list.forEach(function(s, idx) {
        var tags = (s.subjects || []).map(function(sub){ return '<span class="subj-tag">' + sub + '</span>'; }).join('');
        var secBg = s.section === 'Sec A' ? 'background:#e8f5e9;color:#2e7d32' : s.section === 'Sec B' ? 'background:#e3f2fd;color:#1565c0' : 'background:#fff3e0;color:#e65100';
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td style="color:#999;font-size:0.78rem;">' + (idx+1) + '</td>' +
            '<td style="font-weight:700;font-size:0.82rem;color:#555;font-family:monospace;">' + s.id + '</td>' +
            '<td style="font-weight:500;">' + s.name + '</td>' +
            '<td><span style="display:inline-block;' + secBg + ';border-radius:20px;padding:2px 12px;font-size:0.78rem;font-weight:700;">' + s.section + '</span></td>' +
            '<td>' + tags + '</td>' +
            '<td style="text-align:center;white-space:nowrap;">' +
                '<button class="action-btn edit" onclick="openEditStudent(\'' + s.id + '\')" style="margin-right:4px;">Edit</button>' +
                '<button class="action-btn delete" onclick="removeStudent(\'' + s.id + '\')">Remove</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function filterRoster() {
    if (!_rosterData) return;
    var search    = document.getElementById('rosterSearch').value.trim().toUpperCase();
    var secFilter = document.getElementById('rosterSectionFilter').value;
    var filtered  = _rosterData.filter(function(s) {
        var text = (s.id + ' ' + s.name + ' ' + s.section + ' ' + (s.subjects||[]).join(' ')).toUpperCase();
        return (!search || text.includes(search)) && (!secFilter || s.section === secFilter);
    });
    _renderRoster(filtered);
}

function openAddStudentForm() {
    var f = document.getElementById('addStudentForm');
    f.style.display = 'block';
    document.getElementById('newStudentId').value       = '';
    document.getElementById('newStudentName').value     = '';
    document.getElementById('newStudentSection').value  = 'Sec A';
    document.getElementById('newStudentSubjects').value = '';
    document.getElementById('newStudentId').focus();
}

function cancelAddStudent() {
    document.getElementById('addStudentForm').style.display = 'none';
}

function confirmAddStudent() {
    var id       = document.getElementById('newStudentId').value.trim();
    var name     = document.getElementById('newStudentName').value.trim();
    var section  = document.getElementById('newStudentSection').value;
    var subjRaw  = document.getElementById('newStudentSubjects').value.trim();
    if (!id || !name) { showToast('Student ID and Name are required.', 'error'); return; }
    if (_rosterData.find(function(s){ return s.id === id; })) { showToast('A student with this ID already exists.', 'warn'); return; }
    var subjects = subjRaw ? subjRaw.split(',').map(function(s){ return s.trim(); }).filter(Boolean) : SSCR_SUBJECTS.slice();
    _rosterData.push({ id: id, name: name, section: section, subjects: subjects });
    cancelAddStudent();
    filterRoster();
    showToast(name + ' added to ' + section + '.', 'success');
}

function removeStudent(id) {
    var s = _rosterData.find(function(s){ return s.id === id; });
    if (!s) return;
    if (!window.confirm('Remove ' + s.name + ' from the roster?')) return;
    _rosterData = _rosterData.filter(function(r){ return r.id !== id; });
    filterRoster();
    showToast(s.name + ' removed from roster.', 'info');
}

function openEditStudent(id) {
    var s = _rosterData.find(function(s){ return s.id === id; });
    if (!s) return;
    document.getElementById('editStudentOrigId').value      = s.id;
    document.getElementById('editStudentId').value          = s.id;
    document.getElementById('editStudentName').value        = s.name;
    document.getElementById('editStudentSection').value     = s.section;
    document.getElementById('editStudentSubjects').value    = (s.subjects||[]).join(', ');
    document.getElementById('editStudentModal').classList.add('show');
}

function saveEditedStudent() {
    var origId   = document.getElementById('editStudentOrigId').value;
    var newId    = document.getElementById('editStudentId').value.trim();
    var name     = document.getElementById('editStudentName').value.trim();
    var section  = document.getElementById('editStudentSection').value;
    var subjects = document.getElementById('editStudentSubjects').value.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
    if (!newId || !name) { showToast('ID and Name are required.', 'error'); return; }
    var idx = _rosterData.findIndex(function(s){ return s.id === origId; });
    if (idx === -1) return;
    _rosterData[idx] = { id: newId, name: name, section: section, subjects: subjects };
    closeModal('editStudentModal');
    filterRoster();
    showToast('Student record updated.', 'success');
}



// ── Schedule Click ────────────────────────────────────────────────────────

function viewClassDetails(classCode, day, time) {
    const info = CLASS_INFO[classCode] || { name:'Unknown', room:'\u2014', section:'\u2014' };
    document.getElementById('modalBody').innerHTML =
        '<div style="margin-bottom:1rem;"><strong>Subject:</strong> '  + info.name    + '</div>' +
        '<div style="margin-bottom:1rem;"><strong>Section:</strong> '  + info.section + '</div>' +
        '<div style="margin-bottom:1rem;"><strong>Day:</strong> '      + day          + '</div>' +
        '<div style="margin-bottom:1rem;"><strong>Time:</strong> '     + time         + '</div>' +
        '<div style="margin-bottom:1rem;"><strong>Location:</strong> ' + info.room    + '</div>' +
        '<div style="margin-top:1.5rem;"><button class="btn btn-primary" onclick="startSession();closeModal(\'detailsModal\');">Start Attendance Session</button></div>';
    document.getElementById('detailsModal').classList.add('show');
}


// ── Utilities ─────────────────────────────────────────────────────────────

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function startSession() {
    showToast('Attendance session started! QR code is now active.', 'success');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

window.onclick = function(event) {
    document.querySelectorAll('.modal').forEach(function(modal) {
        if (event.target === modal) modal.classList.remove('show');
    });
};


// ── Init — runs after all scripts are parsed ──────────────────────────────
// Scripts are loaded at end of <body> so DOM is ready here.

document.getElementById('notificationCount').textContent =
    _notifications.filter(function(n) { return n.unread; }).length;

refreshScanPreview();
