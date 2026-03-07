// faculty.js
// ── All application logic for the SSC-R Faculty Dashboard ────────────────
// Depends on: students-data.js (SSCR_STUDENTS, attendanceDB, etc.)
//             faculty-scans.js (RECENT_SCANS)

// ── Notifications ─────────────────────────────────────────────────────────
requireAuth('faculty');
const NOTIFICATIONS = [
    { id:1, unread:true,  type:'alert', text:'<strong>3 students</strong> from Sec B have exceeded the maximum absences in <strong>Math</strong>.', time:'2 mins ago' },
    { id:2, unread:true,  type:'info', text:'<strong>Attendance report</strong> for English — Sec A has been generated successfully.', time:'15 mins ago' },
    { id:3, unread:true,  type:'warn', text:'<strong>GONZAGA, Krystine</strong> was marked Late in Science class today.', time:'42 mins ago' },
    { id:4, unread:false, type:'success', text:'QR attendance session for <strong>Filipino — Sec C</strong> completed. 11/11 students recorded.', time:'1 hr ago' },
    { id:5, unread:false, type:'info',  text:'Reminder: Submit <strong>monthly attendance reports</strong> by Feb 28, 2026.', time:'3 hrs ago' },
    { id:6, unread:false, type:'alert', text:'System maintenance scheduled on <strong>Feb 22, 2026 at 11:00 PM</strong>. Save your work.', time:'Yesterday' },
];

let _notifications = [...NOTIFICATIONS];

function renderNotifications() {
    const list = document.getElementById('notifList');
    const unread = _notifications.filter(n => n.unread).length;
    const badge = document.getElementById('notificationCount');
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


// ── Scan Preview ──────────────────────────────────────────────────────────

function refreshScanPreview() {
    const typeVal  = document.getElementById('rptType').value;    // '' | 'Present' | 'Late' | 'Absent'
    const subjVal  = document.getElementById('rptSubject').value; // '' | 'Math' | 'English' | 'Science' | 'Filipino'
    const secVal   = document.getElementById('rptSection').value; // '' | 'Sec A' | 'Sec B' | 'Sec C'

    // Live filter — all three work independently and combine
    const filtered = RECENT_SCANS.filter(function(r) {
        const okType = !typeVal || r.status  === typeVal;
        const okSubj = !subjVal || r.subject === subjVal;
        const okSec  = !secVal  || r.section === secVal;
        return okType && okSubj && okSec;
    });

    // Update label
    const parts = [];
    if (typeVal) parts.push(typeVal);
    if (subjVal) parts.push(subjVal);
    if (secVal)  parts.push(secVal);
    document.getElementById('scanPreviewLabel').textContent =
        (parts.length ? parts.join(' · ') : 'All records') + ' · Feb 2026';

    // Render ALL matching rows (this is the report preview, not just a peek)
    const tbody = document.getElementById('scanPreviewBody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#bbb;font-style:italic;padding:1.5rem;">No records match the selected filters.</td></tr>';
    } else {
        filtered.forEach(function(r) {
            const tc = r.status === 'Present' ? '#1a7a1a' : r.status === 'Late' ? '#c45c00' : '#999';
            const bs = r.status === 'Present'
                ? 'background:#e8f5e9;color:#2e7d32;border:1.5px solid #66bb6a;'
                : r.status === 'Late'
                ? 'background:#fff3e0;color:#e65100;border:1.5px solid #FFA500;'
                : 'background:#ffebee;color:#c62828;border:1.5px solid #ef9a9a;';
            const tr = document.createElement('tr');
            tr.innerHTML =
                '<td style="font-size:0.72rem;font-weight:700;color:#888;">'         + r.id      + '</td>' +
                '<td style="font-size:0.8rem;font-weight:600;">'                     + r.name    + '</td>' +
                '<td style="font-size:0.78rem;">'                                    + r.subject + '</td>' +
                '<td style="font-size:0.78rem;">'                                    + r.section + '</td>' +
                '<td style="font-size:0.78rem;font-weight:600;color:' + tc + ';">'  + (r.timeIn || '—') + '</td>' +
                '<td><span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;' + bs + '">' + r.status + '</span></td>';
            tbody.appendChild(tr);
        });
    }

    document.getElementById('scanShownCount').textContent = filtered.length;
    document.getElementById('scanTotalCount').textContent  = RECENT_SCANS.length;
}


// ── Scan Search ──────────────────────────────────────────────────────────

function filterScanSearch() {
    const q = document.getElementById('scanSearch').value.toUpperCase();
    const rows = document.querySelectorAll('#scanPreviewBody tr');
    let shown = 0;
    rows.forEach(function(row) {
        const match = !q || row.textContent.toUpperCase().includes(q);
        row.style.display = match ? '' : 'none';
        if (match) shown++;
    });
    document.getElementById('scanShownCount').textContent = shown;
}


// ── Report Buttons ────────────────────────────────────────────────────────

function downloadReport() {
    const subject = document.getElementById('rptSubject').value;
    const section = document.getElementById('rptSection').value;
    if (!subject || !section) {
        alert('Please select a Subject and Section first.');
        return;
    }
    alert('Downloading report for ' + subject + ' — ' + section + '...\n(PDF/Excel export in full system)');
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


// ── Student Roster Modal ──────────────────────────────────────────────────

function openStudentListModal() {
    const tbody = document.getElementById('rosterTableBody');
    tbody.innerHTML = '';
    const allStudents = getAllStudents();
    document.getElementById('rosterTotalCount').textContent = allStudents.length;
    allStudents.forEach(function(s, idx) {
        const tr = document.createElement('tr');
        const subjectTags = SSCR_SUBJECTS.map(function(sub) {
            return '<span class="subj-tag">' + sub + '</span>';
        }).join('');
        tr.innerHTML =
            '<td style="color:#999;font-size:0.8rem;">' + (idx + 1) + '</td>' +
            '<td style="font-weight:700;font-size:0.82rem;color:#555;">' + s.id + '</td>' +
            '<td style="font-weight:500;">' + s.name + '</td>' +
            '<td><span style="display:inline-block;background:#eee;border-radius:20px;padding:2px 10px;font-size:0.78rem;font-weight:700;">' + s.section + '</span></td>' +
            '<td>' + subjectTags + '</td>';
        tbody.appendChild(tr);
    });
    document.getElementById('rosterShownCount').textContent = allStudents.length;
    document.getElementById('rosterSearch').value = '';
    document.getElementById('rosterSectionFilter').value = '';
    document.getElementById('studentListModal').classList.add('show');
}

function filterRoster() {
    const search    = document.getElementById('rosterSearch').value.toUpperCase();
    const secFilter = document.getElementById('rosterSectionFilter').value;
    const rows      = document.querySelectorAll('#rosterTableBody tr');
    let shown = 0;
    rows.forEach(function(row) {
        const text    = row.textContent.toUpperCase();
        const secCell = row.cells[3] ? row.cells[3].textContent.trim() : '';
        if ((!search || text.includes(search)) && (!secFilter || secCell.includes(secFilter))) {
            row.style.display = '';
            shown++;
        } else {
            row.style.display = 'none';
        }
    });
    document.getElementById('rosterShownCount').textContent = shown;
}


// ── Schedule Click ────────────────────────────────────────────────────────

function viewClassDetails(classCode, day, time) {
    const classInfo = {
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
    const info = classInfo[classCode] || { name:'Unknown', room:'—', section:'—' };
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
    alert('Attendance session started!');
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