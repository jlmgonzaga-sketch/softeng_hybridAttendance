// ═══════════════════════════════════════════════════════════
//  SSC-R Admin — Mobile JS
//  Same logic as admin.html desktop
//  Depends on: students-data.js (loaded before this script)
// ═══════════════════════════════════════════════════════════
requireAuth('admin');
let _currentPage = 1;
const ROWS_PER_PAGE = 10;
let _lastFilteredRows = [];
const TODAY     = new Date();
const TODAY_STR = TODAY.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ── Init ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    seedDemo();
    updateStatCards();

    const fmt = d => d.toISOString().split('T')[0];
    document.getElementById('dateFrom').value = fmt(TODAY);
    document.getElementById('dateTo').value   = fmt(TODAY);

    renderAttendanceTable();
});

// ── Seed demo attendance (same as desktop) ────────────────
function seedDemo() {
    const statuses = ['Present', 'Present', 'Present', 'Late', 'Absent', ''];
    const times    = ['07:05 AM', '07:20 AM', '07:45 AM', '08:15 AM', '08:30 AM'];
    SSCR_SUBJECTS.forEach(subj => {
        SSCR_SECTIONS.forEach(sec => {
            SSCR_STUDENTS[sec].forEach((s, i) => {
                const pick = statuses[i % statuses.length];
                if (pick === 'Present') {
                    attendanceDB[subj][sec][s.id] = { status: 'Present', timeIn: times[i % times.length] };
                } else if (pick === 'Late') {
                    attendanceDB[subj][sec][s.id] = { status: 'Late', timeIn: '08:45 AM' };
                } else if (pick === 'Absent') {
                    attendanceDB[subj][sec][s.id] = { status: 'Absent', timeIn: '' };
                }
            });
        });
    });
}

// ── Update stat cards ─────────────────────────────────────
function updateStatCards() {
    const allStudents = getAllStudents();
    document.getElementById('statTotal').textContent = allStudents.length;

    let present = 0, late = 0, absent = 0;
    SSCR_SUBJECTS.forEach(subj => {
        SSCR_SECTIONS.forEach(sec => {
            SSCR_STUDENTS[sec].forEach(s => {
                const rec = attendanceDB[subj][sec][s.id];
                if (rec.status === 'Present') present++;
                else if (rec.status === 'Late') late++;
                else if (rec.status === 'Absent') absent++;
            });
        });
    });
    document.getElementById('statPresent').textContent = present;
    document.getElementById('statLate').textContent    = late;
    document.getElementById('statAbsent').textContent  = absent;
}

// ── Build filtered rows ───────────────────────────────────
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
    if (sfilt === 'Unmarked')  rows = rows.filter(r => !r.status);
    else if (sfilt)            rows = rows.filter(r => r.status === sfilt);

    return rows;
}

// ── Render table ──────────────────────────────────────────
function renderAttendanceTable(allRowsOverride) {
    const allRows    = allRowsOverride || buildRows();
    _lastFilteredRows = allRows;

    const tbody      = document.getElementById('attendanceTableBody');
    const totalRows  = allRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / ROWS_PER_PAGE));
    if (_currentPage > totalPages) _currentPage = totalPages;

    tbody.innerHTML = '';

    if (!totalRows) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#aaa;padding:2rem;font-size:0.82rem;">No records found.</td></tr>';
        buildPagination(0, 0);
        return;
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
            '<td style="font-size:.78rem;">' + r.subject + '</td>' +
            '<td style="font-size:.78rem;">' + r.section + '</td>' +
            '<td style="font-size:.75rem;color:#555;">' + TODAY_STR + '</td>' +
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

// ── Pagination ────────────────────────────────────────────
function buildPagination(totalPages, totalRows) {
    const wrap = document.getElementById('paginationWrap');
    wrap.innerHTML = '';
    if (!totalRows) return;

    const prev = document.createElement('button');
    prev.className = 'page-btn'; prev.textContent = '‹';
    prev.disabled = _currentPage === 1;
    prev.onclick = () => { if (_currentPage > 1) { _currentPage--; renderAttendanceTable(); } };
    wrap.appendChild(prev);

    const maxVisible = 5;
    let s = Math.max(1, _currentPage - Math.floor(maxVisible / 2));
    let e = Math.min(totalPages, s + maxVisible - 1);
    if (e - s < maxVisible - 1) s = Math.max(1, e - maxVisible + 1);
    for (let p = s; p <= e; p++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (p === _currentPage ? ' active' : '');
        btn.textContent = p;
        const pg = p;
        btn.onclick = () => { _currentPage = pg; renderAttendanceTable(); };
        wrap.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'page-btn'; next.textContent = '›';
    next.disabled = _currentPage === totalPages;
    next.onclick = () => { if (_currentPage < totalPages) { _currentPage++; renderAttendanceTable(); } };
    wrap.appendChild(next);

    const label = document.createElement('span');
    label.style.cssText = 'font-size:.75rem;color:#999;margin-left:.5rem;line-height:32px;';
    const start = (_currentPage - 1) * ROWS_PER_PAGE + 1;
    const end   = Math.min(_currentPage * ROWS_PER_PAGE, totalRows);
    label.textContent = start + '–' + end + ' of ' + totalRows;
    wrap.appendChild(label);
}

// ── Generate Report ───────────────────────────────────────
function generateReport() {
    const period = document.getElementById('viewPeriod').value;
    const dfrom  = document.getElementById('dateFrom').value;
    const dto    = document.getElementById('dateTo').value;

    if (!period || !dfrom || !dto) { alert('Please select a View Period and a date range first.'); return; }
    if (dfrom > dto) { alert('"Date From" cannot be after "Date To".'); return; }

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
}

// ── Refresh ───────────────────────────────────────────────
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

// ── Export to Excel ───────────────────────────────────────
function exportToExcel() {
    const rows = _lastFilteredRows.length ? _lastFilteredRows : buildRows();
    if (!rows.length) { alert('No data to export.'); return; }

    const wsData = [['Student ID', 'Student Name', 'Subject', 'Section', 'Date', 'Time In', 'Status']];
    rows.forEach(r => {
        wsData.push([r.id, r.name, r.subject, r.section, TODAY_STR, r.timeIn || '—', r.status || 'Unmarked']);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch: 12}, {wch: 32}, {wch: 10}, {wch: 10}, {wch: 16}, {wch: 10}, {wch: 10}];
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    const subjFilt = document.getElementById('subjectFilter').value || 'All';
    XLSX.writeFile(wb, 'SSC-R_Attendance_' + subjFilt + '_' + TODAY_STR.replace(/,/g, '').replace(/ /g, '_') + '.xlsx');
}

// ── Print ─────────────────────────────────────────────────
function printTable() {
    const meta     = document.getElementById('printMeta');
    const hdr      = document.getElementById('printHeader');
    const subjFilt = document.getElementById('subjectFilter').value || 'All Subjects';
    const secFilt  = document.getElementById('sectionFilter').value || 'All Sections';
    const dfrom    = document.getElementById('dateFrom').value;
    const dto      = document.getElementById('dateTo').value;
    meta.textContent = subjFilt + ' | ' + secFilt + ' | ' + dfrom + ' to ' + dto + ' | Generated: ' + TODAY_STR;
    hdr.style.display = 'block';
    window.print();
    hdr.style.display = 'none';
}

// ── Download PDF ──────────────────────────────────────────
function downloadPDF() {
    const rows = _lastFilteredRows.length ? _lastFilteredRows : buildRows();
    if (!rows.length) { alert('No data to export.'); return; }

    const subjFilt = document.getElementById('subjectFilter').value || 'All Subjects';
    const secFilt  = document.getElementById('sectionFilter').value || 'All Sections';
    const dfrom    = document.getElementById('dateFrom').value;
    const dto      = document.getElementById('dateTo').value;

    let html = `
    <style>
      body { font-family: Arial, sans-serif; font-size: 11px; }
      h2 { margin: 0 0 4px; font-size: 15px; }
      p  { margin: 0 0 10px; color: #666; font-size: 10px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1A1A1A; color: #C9A227; padding: 6px 8px; text-align: left; font-size: 10px; }
      td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
      tr:nth-child(even) td { background: #fafafa; }
      .badge { display:inline-block; padding:2px 7px; border-radius:12px; font-weight:700; font-size:9px; }
      .p { background:#e8f5e9; color:#2e7d32; } .a { background:#ffebee; color:#c62828; }
      .l { background:#fff3e0; color:#e65100; } .u { background:#f0f0f0; color:#999; }
    </style>
    <h2>SSC-R Attendance Report</h2>
    <p>${subjFilt} | ${secFilt} | ${dfrom} to ${dto} | Generated: ${TODAY_STR}</p>
    <table><thead><tr>
      <th>Student ID</th><th>Student Name</th><th>Subject</th>
      <th>Section</th><th>Date</th><th>Time In</th><th>Status</th>
    </tr></thead><tbody>`;

    rows.forEach(r => {
        const cls = r.status === 'Present' ? 'p' : r.status === 'Absent' ? 'a' : r.status === 'Late' ? 'l' : 'u';
        const sl  = r.status || 'Unmarked';
        html += `<tr>
          <td>${r.id}</td><td>${r.name}</td><td>${r.subject}</td>
          <td>${r.section}</td><td>${TODAY_STR}</td>
          <td>${r.timeIn || '—'}</td>
          <td><span class="badge ${cls}">${sl}</span></td>
        </tr>`;
    });
    html += '</tbody></table>';

    const el = document.createElement('div');
    el.innerHTML = html;

    html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: 'SSC-R_Attendance_' + subjFilt + '_' + TODAY_STR.replace(/,/g, '').replace(/ /g, '_') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(el).save();
}

// ── View Details Modal ────────────────────────────────────
function viewDetails(id, name, subj, sec, status, timeIn) {
    const sc = status ? 'status-' + status.toLowerCase() : 'status-unmarked';
    const sl = status || 'Unmarked';
    const td = status === 'Absent' ? '— (did not attend)'
             : (status === 'Present' || status === 'Late') ? timeIn
             : 'Not yet marked';

    document.getElementById('modalBody').innerHTML =
        '<div class="detail-row"><span class="dr-lbl">Student ID</span><span class="dr-val">' + id + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Full Name</span><span class="dr-val">' + name + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Subject</span><span class="dr-val">' + subj + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Section</span><span class="dr-val">' + sec + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Date</span><span class="dr-val">' + TODAY_STR + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Time In</span><span class="dr-val">' + td + '</span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Status</span><span class="dr-val"><span class="status-badge ' + sc + '">' + sl + '</span></span></div>' +
        '<div class="detail-row"><span class="dr-lbl">Session ID</span><span class="dr-val">SESSION-' + Date.now() + '</span></div>';

    document.getElementById('detailsModal').classList.add('show');
}

// ── Edit Record Modal ─────────────────────────────────────
function openEdit(id, name, subj, sec, status, timeIn) {
    const selOpts = ['', 'Present', 'Late', 'Absent'].map(v =>
        '<option value="' + v + '"' + (v === status ? ' selected' : '') + '>' +
        (v ? v : '— Unmarked —') + '</option>').join('');

    document.getElementById('editModalBody').innerHTML =
        '<div class="edit-row"><label>Student ID</label>' +
            '<input type="text" value="' + id + '" readonly style="background:#f5f5f5;"></div>' +
        '<div class="edit-row"><label>Full Name</label>' +
            '<input type="text" value="' + name + '" readonly style="background:#f5f5f5;"></div>' +
        '<div class="edit-row"><label>Subject</label>' +
            '<input type="text" value="' + subj + '" readonly style="background:#f5f5f5;"></div>' +
        '<div class="edit-row"><label>Section</label>' +
            '<input type="text" value="' + sec + '" readonly style="background:#f5f5f5;"></div>' +
        '<div class="edit-row"><label>Status</label>' +
            '<select id="editStatus" onchange="handleEditStatusChange()">' + selOpts + '</select></div>' +
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
        if (ti && !ti.value) {
            const n = new Date();
            ti.value = pad(n.getHours()) + ':' + pad(n.getMinutes());
        }
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
            const ap  = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            rec.timeIn = pad(h12) + ':' + pad(m) + ' ' + ap;
        } else {
            rec.timeIn = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
    } else { rec.timeIn = ''; }
    closeModal('editModal');
    renderAttendanceTable();
    updateStatCards();
}

// ── Page Navigation ───────────────────────────────────────
function goPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    const navBtn = document.getElementById('nav-' + id);
    if (navBtn) navBtn.classList.add('active');
}

// ── Helpers ───────────────────────────────────────────────
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
    if (confirm('Are you sure you want to logout?')) window.location.href = 'login.html';
}

// Close modal when tapping backdrop
window.addEventListener('click', e => {
    document.querySelectorAll('.modal').forEach(m => {
        if (e.target === m) m.classList.remove('show');
    });
});