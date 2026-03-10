// ═══════════════════════════════════════════════════════════
//  SSC-R Admin — Mobile JS  (updated to match desktop v2)
//  Depends on: students-data.js (loaded before this script)
// ═══════════════════════════════════════════════════════════
requireAuth('admin');

// ── Toast / Snackbar System ──────────────────────────────
(function () {
    var ICONS = { success: '✓', error: '✕', info: 'ℹ', warn: '⚠' };
    window.showToast = function (msg, type, duration) {
        type = type || 'info'; duration = duration || 3200;
        var container = document.getElementById('toast-container');
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

// ════════════════════════════════════════════════════════
//  SYSTEM LOGS
// ════════════════════════════════════════════════════════
const LOG_ROWS_PER_PAGE = 10;
let _logPage     = 1;
let _logFiltered = [];

const LOG_USERS = [
    { name: 'Julliana Louisse Gonzaga', role: 'Administrator', ip: '192.168.1.10' },
    { name: 'Agnes Bernal',             role: 'Faculty',       ip: '192.168.1.22' },
    { name: 'Gary Soriano',             role: 'Faculty',       ip: '192.168.1.35' },
    { name: 'Rheymard Doneza',          role: 'Faculty',       ip: '192.168.1.47' },
];

const LOG_TEMPLATES = [
    { action: 'Login',    severity: 'info',    desc: u => `${u.name} logged in successfully.` },
    { action: 'Logout',   severity: 'info',    desc: u => `${u.name} logged out of the system.` },
    { action: 'Edit',     severity: 'warning', desc: u => `${u.name} edited attendance record for student 2026-00${10+Math.floor(Math.random()*40)}.` },
    { action: 'Generate', severity: 'info',    desc: u => `${u.name} generated ${['Daily','Weekly','Monthly'][Math.floor(Math.random()*3)]} attendance report.` },
    { action: 'Export',   severity: 'info',    desc: u => `${u.name} exported attendance data as ${['Excel','CSV'][Math.floor(Math.random()*2)]}.` },
    { action: 'Print',    severity: 'info',    desc: u => `${u.name} printed attendance report for ${['Sec A','Sec B','Sec C'][Math.floor(Math.random()*3)]}.` },
    { action: 'View',     severity: 'info',    desc: u => `${u.name} viewed attendance details for student 2026-00${10+Math.floor(Math.random()*40)}.` },
    { action: 'Error',    severity: 'error',   desc: u => `Failed login attempt detected from IP ${u.ip}. Invalid credentials.` },
    { action: 'System',   severity: 'info',    desc: () => 'System backup completed successfully.' },
    { action: 'System',   severity: 'warning', desc: () => 'High memory usage detected. System running at 87% capacity.' },
    { action: 'Edit',     severity: 'warning', desc: u => `${u.name} bulk-updated attendance status for Section ${['A','B','C'][Math.floor(Math.random()*3)]}.` },
    { action: 'Login',    severity: 'error',   desc: u => `${u.name} — session expired. Forced re-login required.` },
];

function generateLogs() {
    const logs = [];
    const now  = new Date();
    for (let i = 0; i < 120; i++) {
        const minsAgo = i * (3 + Math.floor(Math.random() * 12));
        const ts   = new Date(now.getTime() - minsAgo * 60000);
        const user = LOG_USERS[Math.floor(Math.random() * LOG_USERS.length)];
        const tpl  = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
        logs.push({
            id:        'LOG-' + String(120 - i).padStart(5, '0'),
            timestamp: ts,
            user:      user.name,
            role:      user.role,
            ip:        user.ip,
            action:    tpl.action,
            severity:  tpl.severity,
            desc:      tpl.desc(user),
        });
    }
    return logs;
}

let ALL_LOGS = generateLogs();

function fmtTimestamp(dt) {
    return dt.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) +
           ' ' + dt.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
}
function fmtDateOnly(dt) {
    const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,'0'), d = String(dt.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + d;
}
function fmtRelative(dt) {
    const diff = Math.floor((Date.now() - dt.getTime()) / 60000);
    if (diff < 1)   return 'Just now';
    if (diff < 60)  return diff + ' min ago';
    if (diff < 1440) return Math.floor(diff/60) + ' hr ago';
    return Math.floor(diff/1440) + 'd ago';
}

function renderLogs() {
    const search = (document.getElementById('logSearch').value || '').toLowerCase();
    const fType  = document.getElementById('filterType').value;
    const fRole  = document.getElementById('filterRole').value;
    const fSev   = document.getElementById('filterSeverity').value;
    const fDate  = document.getElementById('filterDate').value;

    _logFiltered = ALL_LOGS.filter(l => {
        if (fType && l.action !== fType)                   return false;
        if (fRole && l.role   !== fRole)                   return false;
        if (fSev  && l.severity !== fSev)                  return false;
        if (fDate && fmtDateOnly(l.timestamp) !== fDate)   return false;
        if (search && !(
            l.user.toLowerCase().includes(search) ||
            l.action.toLowerCase().includes(search) ||
            l.desc.toLowerCase().includes(search) ||
            l.id.toLowerCase().includes(search)
        )) return false;
        return true;
    });

    document.getElementById('logCountBadge').textContent = _logFiltered.length;

    const container  = document.getElementById('logCardList');
    const total      = _logFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / LOG_ROWS_PER_PAGE));
    if (_logPage > totalPages) _logPage = totalPages;
    container.innerHTML = '';

    if (!total) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#aaa;font-size:.85rem;">No logs found. Try adjusting your filters.</div>';
        buildLogPagination(0, 0);
        return;
    }

    const start    = (_logPage - 1) * LOG_ROWS_PER_PAGE;
    const pageRows = _logFiltered.slice(start, start + LOG_ROWS_PER_PAGE);

    pageRows.forEach((l, i) => {
        const card = document.createElement('div');
        card.className = 'log-card sev-' + l.severity;
        card.onclick   = () => showLogDetail(l);
        card.innerHTML =
            '<div class="log-card-top">' +
                '<span class="log-card-user">' + l.user.split(' ').slice(-1)[0] + ', ' + l.user.split(' ')[0] + '</span>' +
                '<span class="log-card-time">' + fmtRelative(l.timestamp) + '</span>' +
            '</div>' +
            '<div class="log-card-desc">' + l.desc + '</div>' +
            '<div class="log-card-meta">' +
                '<span class="log-badge log-' + l.action.toLowerCase() + '">' + l.action + '</span>' +
                '<span class="role-badge' + (l.role === 'Faculty' ? ' faculty' : '') + '">' + (l.role === 'Administrator' ? 'Admin' : l.role) + '</span>' +
                '<span class="sev-dot ' + l.severity + '"></span>' +
                '<span class="log-ip">' + l.ip + '</span>' +
            '</div>';
        container.appendChild(card);
    });

    buildLogPagination(totalPages, total);
}

function showLogDetail(log) {
    const sevColors = { info:'#1565c0', warning:'#e65100', error:'#c62828' };
    const ac = 'log-' + log.action.toLowerCase();
    document.getElementById('logDetailBody').innerHTML =
        drow('Log ID',     '<code style="font-size:.82rem;background:#f5f5f5;padding:2px 7px;border-radius:5px;">' + log.id + '</code>') +
        drow('Timestamp',  fmtTimestamp(log.timestamp)) +
        drow('User',       '<strong>' + log.user + '</strong>') +
        drow('Role',       '<span class="role-badge' + (log.role === 'Faculty' ? ' faculty' : '') + '">' + log.role + '</span>') +
        drow('Action',     '<span class="log-badge ' + ac + '">' + log.action + '</span>') +
        drow('Severity',   '<span style="font-weight:700;color:' + (sevColors[log.severity]||'#555') + ';">' + log.severity.charAt(0).toUpperCase() + log.severity.slice(1) + '</span>') +
        drow('IP Address', '<code style="font-size:.82rem;">' + log.ip + '</code>') +
        '<div class="detail-desc">' + log.desc + '</div>';
    document.getElementById('logDetailModal').classList.add('show');
}

function drow(label, val) {
    return '<div class="detail-row"><span class="dr-lbl">' + label + '</span><span class="dr-val">' + val + '</span></div>';
}

function buildLogPagination(totalPages, totalRows) {
    const wrap = document.getElementById('logPaginationWrap');
    wrap.innerHTML = '';
    if (!totalRows) return;
    const prev = document.createElement('button');
    prev.className = 'page-btn'; prev.textContent = '‹'; prev.disabled = _logPage === 1;
    prev.onclick = () => { if (_logPage > 1) { _logPage--; renderLogs(); } };
    wrap.appendChild(prev);
    let s = Math.max(1, _logPage - 2), e = Math.min(totalPages, s + 4);
    if (e - s < 4) s = Math.max(1, e - 4);
    for (let p = s; p <= e; p++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (p === _logPage ? ' active' : '');
        btn.textContent = p;
        const pg = p;
        btn.onclick = () => { _logPage = pg; renderLogs(); };
        wrap.appendChild(btn);
    }
    const next = document.createElement('button');
    next.className = 'page-btn'; next.textContent = '›'; next.disabled = _logPage === totalPages;
    next.onclick = () => { if (_logPage < totalPages) { _logPage++; renderLogs(); } };
    wrap.appendChild(next);
    const label = document.createElement('span');
    label.style.cssText = 'font-size:.75rem;color:#999;margin-left:.5rem;line-height:32px;';
    label.textContent = ((_logPage-1)*LOG_ROWS_PER_PAGE+1) + '–' + Math.min(_logPage*LOG_ROWS_PER_PAGE,totalRows) + ' of ' + totalRows;
    wrap.appendChild(label);
}

function refreshLogs() {
    const user = LOG_USERS[0], now = new Date();
    ALL_LOGS.unshift({ id:'LOG-'+String(ALL_LOGS.length+1).padStart(5,'0'), timestamp:now, user:user.name, role:user.role, ip:user.ip, action:'System', severity:'info', desc:'Logs refreshed manually by ' + user.name + '.' });
    _logPage = 1;
    renderLogs();
    showToast('Logs refreshed.', 'success', 2000);
}

function exportLogs() {
    const rows = _logFiltered.length ? _logFiltered : ALL_LOGS;
    if (!rows.length) return;
    const wsData = [['Log ID','Timestamp','User','Role','Action','Description','IP Address','Severity']];
    rows.forEach(l => wsData.push([l.id, fmtTimestamp(l.timestamp), l.user, l.role, l.action, l.desc, l.ip, l.severity]));
    if (typeof XLSX !== 'undefined') {
        const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{wch:12},{wch:22},{wch:28},{wch:14},{wch:10},{wch:55},{wch:14},{wch:10}];
        XLSX.utils.book_append_sheet(wb, ws, 'System Logs');
        XLSX.writeFile(wb, 'SSC-R_SystemLogs_' + fmtDateOnly(new Date()) + '.xlsx');
        showToast('Logs exported to Excel.', 'success');
    } else {
        const csv = wsData.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
        const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        a.download = 'SSC-R_SystemLogs_' + fmtDateOnly(new Date()) + '.csv'; a.click();
        showToast('Logs exported as CSV.', 'success');
    }
}

function clearLogFilters() {
    document.getElementById('logSearch').value      = '';
    document.getElementById('filterType').value     = '';
    document.getElementById('filterRole').value     = '';
    document.getElementById('filterSeverity').value = '';
    document.getElementById('filterDate').value     = '';
    _logPage = 1;
    renderLogs();
}

// ════════════════════════════════════════════════════════
//  ATTENDANCE
// ════════════════════════════════════════════════════════
let _currentPage = 1;
const ROWS_PER_PAGE = 10;
let _lastFilteredRows = [];
const TODAY     = new Date();
const TODAY_STR = TODAY.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function seedDemo() {
    const statuses = ['Present', 'Present', 'Present', 'Late', 'Absent', ''];
    const times    = ['07:05 AM', '07:20 AM', '07:45 AM', '08:15 AM', '08:30 AM'];
    SSCR_SUBJECTS.forEach(subj => {
        SSCR_SECTIONS.forEach(sec => {
            SSCR_STUDENTS[sec].forEach((s, i) => {
                const pick = statuses[i % statuses.length];
                if      (pick === 'Present') attendanceDB[subj][sec][s.id] = { status: 'Present', timeIn: times[i % times.length] };
                else if (pick === 'Late')    attendanceDB[subj][sec][s.id] = { status: 'Late',    timeIn: '08:45 AM' };
                else if (pick === 'Absent')  attendanceDB[subj][sec][s.id] = { status: 'Absent',  timeIn: '' };
            });
        });
    });
}

function updateStatCards() {
    const allStudents = getAllStudents();
    document.getElementById('statTotal').textContent = allStudents.length;
    let present = 0, late = 0, absent = 0;
    SSCR_SUBJECTS.forEach(subj => {
        SSCR_SECTIONS.forEach(sec => {
            SSCR_STUDENTS[sec].forEach(s => {
                const rec = attendanceDB[subj][sec][s.id];
                if      (rec.status === 'Present') present++;
                else if (rec.status === 'Late')    late++;
                else if (rec.status === 'Absent')  absent++;
            });
        });
    });
    document.getElementById('statPresent').textContent = present;
    document.getElementById('statLate').textContent    = late;
    document.getElementById('statAbsent').textContent  = absent;
}

function buildRows() {
    const search   = document.getElementById('searchInput').value.toUpperCase();
    const sfilt    = document.getElementById('statusFilter').value;
    const secFilt  = document.getElementById('sectionFilter').value;
    const subjFilt = document.getElementById('subjectFilter').value;
    const sections = secFilt  ? [secFilt]  : SSCR_SECTIONS;
    const subjects = subjFilt ? [subjFilt] : SSCR_SUBJECTS;
    let rows = [];
    subjects.forEach(subj => {
        sections.forEach(sec => {
            SSCR_STUDENTS[sec].forEach(s => {
                const rec    = attendanceDB[subj][sec][s.id];
                const status = rec.status || '';
                let timeIn   = '';
                if      (status === 'Absent')                        timeIn = '—';
                else if (status === 'Present' || status === 'Late')  timeIn = rec.timeIn || '—';
                rows.push({ id: s.id, name: s.name, section: sec, subject: subj, status, timeIn });
            });
        });
    });
    if (search) rows = rows.filter(r => (r.id + r.name).toUpperCase().includes(search));
    if (sfilt === 'Unmarked') rows = rows.filter(r => !r.status);
    else if (sfilt)           rows = rows.filter(r => r.status === sfilt);
    return rows;
}

function renderAttendanceTable(allRowsOverride) {
    const allRows    = allRowsOverride || buildRows();
    _lastFilteredRows = allRows;
    const tbody      = document.getElementById('attendanceTableBody');
    const totalRows  = allRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
    if (_currentPage > totalPages) _currentPage = totalPages;
    tbody.innerHTML = '';

    if (!totalRows) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:2rem;font-size:.82rem;">No records found.</td></tr>';
        buildPagination(0, 0); return;
    }

    const start    = (_currentPage - 1) * ROWS_PER_PAGE;
    const pageRows = allRows.slice(start, start + ROWS_PER_PAGE);
    pageRows.forEach(r => {
        const sc    = r.status ? 'status-' + r.status.toLowerCase() : 'status-unmarked';
        const sl    = r.status || 'Unmarked';
        const tc    = r.status === 'Present' ? 'on-time' : r.status === 'Late' ? 'late' : r.status === 'Absent' ? 'absent' : '';
        const eName = r.name.replace(/'/g, "\\'");
        const tr    = document.createElement('tr');
        tr.innerHTML =
            '<td style="font-family:monospace;font-size:.75rem;">' + r.id + '</td>' +
            '<td style="font-weight:600;font-size:.78rem;">' + r.name + '</td>' +
            '<td style="font-size:.75rem;">' + r.subject + '</td>' +
            '<td style="font-size:.75rem;">' + r.section + '</td>' +
            '<td><span class="timein-pill ' + tc + '">' + (r.timeIn || '—') + '</span></td>' +
            '<td><span class="status-badge ' + sc + '">' + sl + '</span></td>' +
            '<td class="no-print">' +
                '<button class="action-btn view" onclick="viewDetails(\'' + r.id + '\',\'' + eName + '\',\'' + r.subject + '\',\'' + r.section + '\',\'' + r.status + '\',\'' + r.timeIn + '\')">View</button>' +
                '<button class="action-btn edit" onclick="openEdit(\'' + r.id + '\',\'' + eName + '\',\'' + r.subject + '\',\'' + r.section + '\',\'' + r.status + '\',\'' + r.timeIn + '\')">Edit</button>' +
            '</td>';
        tbody.appendChild(tr);
    });
    buildPagination(totalPages, totalRows);
}

function buildPagination(totalPages, totalRows) {
    const wrap = document.getElementById('paginationWrap');
    wrap.innerHTML = '';
    if (!totalRows) return;
    const prev = document.createElement('button');
    prev.className = 'page-btn'; prev.textContent = '‹'; prev.disabled = _currentPage === 1;
    prev.onclick = () => { if (_currentPage > 1) { _currentPage--; renderAttendanceTable(); } };
    wrap.appendChild(prev);
    let s = Math.max(1, _currentPage - 2), e = Math.min(totalPages, s + 4);
    if (e - s < 4) s = Math.max(1, e - 4);
    for (let p = s; p <= e; p++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (p === _currentPage ? ' active' : '');
        btn.textContent = p;
        const pg = p;
        btn.onclick = () => { _currentPage = pg; renderAttendanceTable(); };
        wrap.appendChild(btn);
    }
    const next = document.createElement('button');
    next.className = 'page-btn'; next.textContent = '›'; next.disabled = _currentPage === totalPages;
    next.onclick = () => { if (_currentPage < totalPages) { _currentPage++; renderAttendanceTable(); } };
    wrap.appendChild(next);
    const label = document.createElement('span');
    label.style.cssText = 'font-size:.75rem;color:#999;margin-left:.5rem;line-height:32px;';
    label.textContent = ((_currentPage-1)*ROWS_PER_PAGE+1) + '–' + Math.min(_currentPage*ROWS_PER_PAGE,totalRows) + ' of ' + totalRows;
    wrap.appendChild(label);
}

function generateReport() {
    const period = document.getElementById('viewPeriod').value;
    const dfrom  = document.getElementById('dateFrom').value;
    const dto    = document.getElementById('dateTo').value;
    if (!period || !dfrom || !dto) { showToast('Please select a View Period and date range first.', 'warn'); return; }
    if (dfrom > dto) { showToast('"Date From" cannot be after "Date To".', 'warn'); return; }
    const allRows = buildRows();
    _lastFilteredRows = allRows;
    let c = { present: 0, absent: 0, late: 0, unmarked: 0 };
    allRows.forEach(r => {
        if      (r.status === 'Present') c.present++;
        else if (r.status === 'Absent')  c.absent++;
        else if (r.status === 'Late')    c.late++;
        else                             c.unmarked++;
    });
    const strip = document.getElementById('reportStrip');
    strip.style.display = 'flex';
    document.getElementById('rpTotal').textContent    = allRows.length;
    document.getElementById('rpPresent').textContent  = c.present;
    document.getElementById('rpLate').textContent     = c.late;
    document.getElementById('rpAbsent').textContent   = c.absent;
    document.getElementById('rpUnmarked').textContent = c.unmarked;
    _currentPage = 1;
    renderAttendanceTable(allRows);
    showToast('Report generated.', 'success', 2000);
}

function refreshData() {
    document.getElementById('searchInput').value   = '';
    document.getElementById('sectionFilter').value = '';
    document.getElementById('subjectFilter').value = '';
    document.getElementById('statusFilter').value  = '';
    document.getElementById('viewPeriod').value    = '';
    const fmt = d => d.toISOString().split('T')[0];
    document.getElementById('dateFrom').value = fmt(TODAY);
    document.getElementById('dateTo').value   = fmt(TODAY);
    document.getElementById('reportStrip').style.display = 'none';
    _currentPage = 1;
    renderAttendanceTable();
    updateStatCards();
}

function exportToExcel() {
    const rows = _lastFilteredRows.length ? _lastFilteredRows : buildRows();
    if (!rows.length) { showToast('No data to export.', 'warn'); return; }
    const wsData = [['Student ID', 'Student Name', 'Subject', 'Section', 'Date', 'Time In', 'Status']];
    rows.forEach(r => wsData.push([r.id, r.name, r.subject, r.section, TODAY_STR, r.timeIn || '—', r.status || 'Unmarked']));
    const wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch:12},{wch:32},{wch:10},{wch:10},{wch:16},{wch:10},{wch:10}];
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    const subjFilt = document.getElementById('subjectFilter').value || 'All';
    XLSX.writeFile(wb, 'SSC-R_Attendance_' + subjFilt + '_' + TODAY_STR.replace(/,/g,'').replace(/ /g,'_') + '.xlsx');
    showToast('Exported to Excel.', 'success');
}

function printTable() {
    const meta     = document.getElementById('printMeta');
    const hdr      = document.getElementById('printHeader');
    const subjFilt = document.getElementById('subjectFilter').value || 'All Subjects';
    const secFilt  = document.getElementById('sectionFilter').value || 'All Sections';
    const dfrom    = document.getElementById('dateFrom').value;
    const dto      = document.getElementById('dateTo').value;
    meta.textContent = subjFilt + ' | ' + secFilt + ' | ' + dfrom + ' to ' + dto + ' | Generated: ' + TODAY_STR;
    hdr.style.display = 'block'; window.print(); hdr.style.display = 'none';
}

function downloadPDF() {
    const rows = _lastFilteredRows.length ? _lastFilteredRows : buildRows();
    if (!rows.length) { showToast('No data to export.', 'warn'); return; }
    const subjFilt = document.getElementById('subjectFilter').value || 'All Subjects';
    const secFilt  = document.getElementById('sectionFilter').value || 'All Sections';
    const dfrom    = document.getElementById('dateFrom').value;
    const dto      = document.getElementById('dateTo').value;
    let html = `<style>body{font-family:Arial,sans-serif;font-size:11px;}h2{margin:0 0 4px;font-size:15px;}p{margin:0 0 10px;color:#666;font-size:10px;}table{width:100%;border-collapse:collapse;}th{background:#1A1A1A;color:#C9A227;padding:6px 8px;text-align:left;font-size:10px;}td{padding:5px 8px;border-bottom:1px solid #eee;font-size:10px;}tr:nth-child(even) td{background:#fafafa;}.badge{display:inline-block;padding:2px 7px;border-radius:12px;font-weight:700;font-size:9px;}.p{background:#e8f5e9;color:#2e7d32;}.a{background:#ffebee;color:#c62828;}.l{background:#fff3e0;color:#e65100;}.u{background:#f0f0f0;color:#999;}</style>
    <h2>SSC-R Attendance Report</h2><p>${subjFilt} | ${secFilt} | ${dfrom} to ${dto} | Generated: ${TODAY_STR}</p>
    <table><thead><tr><th>Student ID</th><th>Student Name</th><th>Subject</th><th>Section</th><th>Date</th><th>Time In</th><th>Status</th></tr></thead><tbody>`;
    rows.forEach(r => {
        const cls = r.status === 'Present' ? 'p' : r.status === 'Absent' ? 'a' : r.status === 'Late' ? 'l' : 'u';
        html += `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.subject}</td><td>${r.section}</td><td>${TODAY_STR}</td><td>${r.timeIn||'—'}</td><td><span class="badge ${cls}">${r.status||'Unmarked'}</span></td></tr>`;
    });
    html += '</tbody></table>';
    const el = document.createElement('div'); el.innerHTML = html;
    html2pdf().set({
        margin: [10,10,10,10],
        filename: 'SSC-R_Attendance_' + subjFilt + '_' + TODAY_STR.replace(/,/g,'').replace(/ /g,'_') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(el).save();
    showToast('Downloading PDF…', 'info', 2000);
}

function viewDetails(id, name, subj, sec, status, timeIn) {
    const sc = status ? 'status-' + status.toLowerCase() : 'status-unmarked';
    const sl = status || 'Unmarked';
    const td = status === 'Absent' ? '— (did not attend)'
             : (status === 'Present' || status === 'Late') ? timeIn
             : 'Not yet marked';
    document.getElementById('detailModalBody').innerHTML =
        drow('Student ID', id) +
        drow('Full Name',  name) +
        drow('Subject',    subj) +
        drow('Section',    sec) +
        drow('Date',       TODAY_STR) +
        drow('Time In',    td) +
        drow('Status',     '<span class="status-badge ' + sc + '">' + sl + '</span>') +
        drow('Session ID', 'SESSION-' + Date.now());
    document.getElementById('detailModal').classList.add('show');
}

function openEdit(id, name, subj, sec, status, timeIn) {
    const selOpts = ['', 'Present', 'Late', 'Absent'].map(v =>
        '<option value="' + v + '"' + (v === status ? ' selected' : '') + '>' +
        (v ? v : '— Unmarked —') + '</option>').join('');
    document.getElementById('editModalBody').innerHTML =
        '<div class="edit-row"><label>Student ID</label><input type="text" value="' + id + '" readonly style="background:#f5f5f5;"></div>' +
        '<div class="edit-row"><label>Full Name</label><input type="text" value="' + name + '" readonly style="background:#f5f5f5;"></div>' +
        '<div class="edit-row"><label>Subject</label><input type="text" value="' + subj + '" readonly style="background:#f5f5f5;"></div>' +
        '<div class="edit-row"><label>Section</label><input type="text" value="' + sec + '" readonly style="background:#f5f5f5;"></div>' +
        '<div class="edit-row"><label>Status</label><select id="editStatus" onchange="handleEditStatusChange()">' + selOpts + '</select></div>' +
        '<div class="edit-row" id="editTimeRow" style="' + (status === 'Absent' || !status ? 'display:none' : '') + '">' +
            '<label>Time In</label>' +
            '<input type="time" id="editTimeIn" value="' + (timeIn && timeIn !== '—' ? to24h(timeIn) : '') + '">' +
            '<div class="timein-legend">Present/Late — fill time &nbsp;|&nbsp; Absent — leave blank</div></div>' +
        '<div style="display:flex;gap:.75rem;margin-top:1.25rem;">' +
            '<button class="btn btn-primary" style="flex:1;" onclick="saveEdit(\'' + id + '\',\'' + subj + '\',\'' + sec + '\')">Save Changes</button>' +
            '<button class="btn btn-secondary" style="flex:1;" onclick="closeModal(\'editModal\')">Cancel</button></div>';
    document.getElementById('editModal').classList.add('show');
}

function handleEditStatusChange() {
    const st  = document.getElementById('editStatus').value;
    const row = document.getElementById('editTimeRow');
    if (st === 'Absent' || !st) {
        row.style.display = 'none';
        const ti = document.getElementById('editTimeIn'); if (ti) ti.value = '';
    } else {
        row.style.display = '';
        const ti = document.getElementById('editTimeIn');
        if (ti && !ti.value) { const n = new Date(); ti.value = pad(n.getHours()) + ':' + pad(n.getMinutes()); }
    }
}

function saveEdit(studentId, subject, section) {
    const st  = document.getElementById('editStatus').value;
    const ti  = document.getElementById('editTimeIn');
    const rec = attendanceDB[subject][section][studentId];
    rec.status = st;
    if (st === 'Present' || st === 'Late') {
        if (ti && ti.value) {
            const [h, m] = ti.value.split(':').map(Number);
            const ap = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
            rec.timeIn = pad(h12) + ':' + pad(m) + ' ' + ap;
        } else { rec.timeIn = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    } else { rec.timeIn = ''; }
    closeModal('editModal');
    renderAttendanceTable();
    if (st) showToast(studentId + ' marked as ' + st + '.', st === 'Present' ? 'success' : st === 'Late' ? 'warn' : 'error', 2000);
}

// ════════════════════════════════════════════════════════
//  PAGE NAVIGATION
// ════════════════════════════════════════════════════════
function goPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    const navBtn = document.getElementById('nav-' + id);
    if (navBtn) navBtn.classList.add('active');
}

// ════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════
function updateSettingsAvatar() {
    const name   = document.getElementById('settingsName').value.trim();
    const parts  = name.split(' ').filter(Boolean);
    const init   = parts.length >= 2 ? parts[0][0] + parts[parts.length-1][0] : (parts[0]||'?')[0];
    const upper  = init.toUpperCase();
    document.getElementById('settingsAvatarPreview').textContent = upper;
}

function saveSettingsProfile() {
    const name = document.getElementById('settingsName').value.trim();
    if (!name) { showToast('Name cannot be empty.', 'error'); return; }
    const parts = name.split(' ').filter(Boolean);
    const init  = (parts.length >= 2 ? parts[0][0] + parts[parts.length-1][0] : (parts[0]||'?')[0]).toUpperCase();
    document.getElementById('homeName').textContent   = name;
    document.getElementById('homeAvatar').textContent = init;
    document.getElementById('topAvatar').textContent  = init;
    document.getElementById('settingsAvatarPreview').textContent = init;
    showToast('Profile saved successfully!', 'success');
}

function updatePassword() {
    const cur  = document.getElementById('settingsCurPwd').value;
    const nw   = document.getElementById('settingsNewPwd').value;
    const conf = document.getElementById('settingsConfirmPwd').value;
    const msg  = document.getElementById('settingsPwdMsg');
    msg.style.display = 'block';
    if (!cur || !nw || !conf) {
        msg.style.cssText = 'display:block;background:#ffebee;color:#c62828;font-size:.8rem;padding:6px 10px;border-radius:8px;margin-bottom:.5rem;';
        msg.textContent = 'Please fill in all fields.'; return;
    }
    if (nw !== conf) {
        msg.style.cssText = 'display:block;background:#ffebee;color:#c62828;font-size:.8rem;padding:6px 10px;border-radius:8px;margin-bottom:.5rem;';
        msg.textContent = 'New passwords do not match.'; return;
    }
    if (nw.length < 6) {
        msg.style.cssText = 'display:block;background:#fff3e0;color:#e65100;font-size:.8rem;padding:6px 10px;border-radius:8px;margin-bottom:.5rem;';
        msg.textContent = 'Password must be at least 6 characters.'; return;
    }
    msg.style.cssText = 'display:block;background:#e8f5e9;color:#2e7d32;font-size:.8rem;padding:6px 10px;border-radius:8px;margin-bottom:.5rem;';
    msg.textContent = '✓ Password updated successfully.';
    document.getElementById('settingsCurPwd').value  = '';
    document.getElementById('settingsNewPwd').value  = '';
    document.getElementById('settingsConfirmPwd').value = '';
    showToast('Password updated!', 'success');
}

function toggleDarkMode(on) {
    const track = document.getElementById('toggleTrack');
    const thumb = document.getElementById('toggleThumb');
    if (on) {
        document.body.classList.add('dark-mode');
        track.style.background   = '#8B0000';
        thumb.style.transform    = 'translateX(20px)';
    } else {
        document.body.classList.remove('dark-mode');
        track.style.background   = '#ccc';
        thumb.style.transform    = 'translateX(0)';
    }
}

// ════════════════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════════════════
function to24h(t) {
    if (!t || t === '—') return '';
    try {
        const [time, ap] = t.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (ap === 'PM' && h !== 12) h += 12;
        if (ap === 'AM' && h === 12) h = 0;
        return pad(h) + ':' + pad(m);
    } catch { return ''; }
}
function pad(n) { return String(n).padStart(2, '0'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function logout() {
    showToast('Logging out…', 'info', 1200);
    setTimeout(() => { if (confirm('Are you sure you want to logout?')) window.location.href = 'login.html'; }, 300);
}

window.addEventListener('click', e => {
    document.querySelectorAll('.modal').forEach(m => { if (e.target === m) m.classList.remove('show'); });
});

// ════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
    seedDemo();
    const fmt = d => d.toISOString().split('T')[0];
    document.getElementById('dateFrom').value = fmt(TODAY);
    document.getElementById('dateTo').value   = fmt(TODAY);
    renderAttendanceTable();
});
