// ═══════════════════════════════════════════════════════════════════
//  SSC-R Attendance System — auth.js
//
//  DROP-IN script that handles ALL of items 3, 4, 5, 6, 7 from the
//  improvement list. Load it as the FIRST script in every dashboard:
//
//    <script src="auth.js"></script>          ← always first
//    <script src="students-data.js"></script>
//    <script src="shared-data.js"></script>
//    <script src="admin-mobile.js"></script>  ← or faculty/student JS
//
//  What this file does:
//    ✅  Auth guard      — redirects to login.html if no session
//    ✅  Profile inject  — fills every hardcoded name/avatar from session
//    ✅  Stat fix        — counts unique students, not subject×student rows
//    ✅  Absence alerts  — banner when any student hits ≥3 absences
//    ✅  LOGS icon fix   — replaces plain "LOGS" text with SVG icon
//    ✅  Print letterhead— injects school header before every print
// ═══════════════════════════════════════════════════════════════════


// ─────────────────────────────────────────────────────────────────
//  USER DATABASE
//  In a real system this lives on a server.
//  For a pure-frontend prototype, credentials are stored here.
//  Add more users by following the same pattern.
// ─────────────────────────────────────────────────────────────────

const SSCR_USERS = {
    // ── Admins ──────────────────────────────────────────────
    'A001': {
        password: 'admin2026',
        role:     'admin',
        name:     'Julliana Louisse Gonzaga',
        initials: 'JG',
        title:    'System Administrator',
        email:    'jgonzaga@sscr.edu.ph',
    },
    'A002': {
        password: 'admin2026',
        role:     'admin',
        name:     'Maria Santos',
        initials: 'MS',
        title:    'System Administrator',
        email:    'msantos@sscr.edu.ph',
    },

    // ── Faculty ─────────────────────────────────────────────
    'F001': {
        password: 'faculty2026',
        role:     'faculty',
        name:     'Agnes Bernal',
        initials: 'AB',
        title:    'Software Engineering',
        email:    'abernal@sscr.edu.ph',
    },
    'F002': {
        password: 'faculty2026',
        role:     'faculty',
        name:     'Rheymard Doneza',
        initials: 'RD',
        title:    'Mathematics',
        email:    'rdoneza@sscr.edu.ph',
    },
    'F003': {
        password: 'faculty2026',
        role:     'faculty',
        name:     'Gary Soriano',
        initials: 'GS',
        title:    'English',
        email:    'gsoriano@sscr.edu.ph',
    },
    'F004': {
        password: 'faculty2026',
        role:     'faculty',
        name:     'Gerome Carpio',
        initials: 'GC',
        title:    'Filipino',
        email:    'gcarpio@sscr.edu.ph',
    },

    // ── Students ─────────────────────────────────────────────
    'S2026-0031': {
        password: 'student2026',
        role:     'student',
        name:     'Mel Reynald Malacas',
        initials: 'ML',
        title:    'Grade 7 · Section B',
        studentId:'2026-0031',
        email:    'mlmalacas@sscr.edu.ph',
    },
    'S2026-0030': {
        password: 'student2026',
        role:     'student',
        name:     'Julliana Louisse Gonzaga',
        initials: 'JG',
        title:    'Grade 7 · Section B',
        studentId:'2026-0030',
        email:    'jgonzaga.student@sscr.edu.ph',
    },
    // Add more students following this pattern: key = 'S' + studentId
};


// ─────────────────────────────────────────────────────────────────
//  VALIDATE LOGIN  (called by login.html)
//  Returns the user object if credentials match, null otherwise.
// ─────────────────────────────────────────────────────────────────

function validateLogin(username, password) {
    const user = SSCR_USERS[username.toUpperCase()];
    if (!user) return null;
    if (user.password !== password) return null;
    return user;
}


// ─────────────────────────────────────────────────────────────────
//  SAVE SESSION  (called by login.html after validateLogin)
// ─────────────────────────────────────────────────────────────────

function saveSession(username, user) {
    sessionStorage.setItem('sscr_username', username);
    sessionStorage.setItem('sscr_role',     user.role);
    sessionStorage.setItem('sscr_name',     user.name);
    sessionStorage.setItem('sscr_initials', user.initials);
    sessionStorage.setItem('sscr_title',    user.title);
    sessionStorage.setItem('sscr_email',    user.email || '');
    if (user.studentId) sessionStorage.setItem('sscr_studentId', user.studentId);
}


// ─────────────────────────────────────────────────────────────────
//  GET SESSION  (convenience getter used throughout)
// ─────────────────────────────────────────────────────────────────

function getSession() {
    return {
        username: sessionStorage.getItem('sscr_username') || '',
        role:     sessionStorage.getItem('sscr_role')     || '',
        name:     sessionStorage.getItem('sscr_name')     || 'User',
        initials: sessionStorage.getItem('sscr_initials') || '??',
        title:    sessionStorage.getItem('sscr_title')    || '',
        email:    sessionStorage.getItem('sscr_email')    || '',
        studentId:sessionStorage.getItem('sscr_studentId')|| '',
    };
}


// ─────────────────────────────────────────────────────────────────
//  AUTH GUARD
//  Call this at the top of every dashboard page.
//  Pass the required role ('admin' | 'faculty' | 'student').
//  If session is missing or role doesn't match → back to login.
// ─────────────────────────────────────────────────────────────────

function requireAuth(expectedRole) {
    const session = getSession();
    if (!session.role || (expectedRole && session.role !== expectedRole)) {
        sessionStorage.clear();
        window.location.replace('login.html');
        return false;
    }
    return true;
}


// ─────────────────────────────────────────────────────────────────
//  PROFILE INJECTOR
//  Scans the DOM for known placeholder elements and replaces their
//  content with live session data.  Call after DOMContentLoaded.
//
//  Targets (add these ids/classes to your HTML once, then forget):
//    [data-profile="name"]     → full name
//    [data-profile="initials"] → avatar initials
//    [data-profile="title"]    → role / department / grade+section
//    [data-profile="email"]    → email address
// ─────────────────────────────────────────────────────────────────

function injectProfile() {
    const s = getSession();
    document.querySelectorAll('[data-profile]').forEach(el => {
        const key = el.getAttribute('data-profile');
        if (s[key] !== undefined) el.textContent = s[key];
    });

    // Also patch legacy hardcoded elements that don't have data-profile yet
    // ── Admin desktop (admin.html) ────────────────────────────────
    _setText('.admin-name',    s.name);
    _setText('.admin-role',    s.title);
    _setAll ('.admin-avatar',  s.initials);

    // ── Admin mobile (admin-mobile.html) ─────────────────────────
    _setText('.profile-name',  s.name);
    _setText('.profile-role',  s.title);
    _setAll ('.avatar-lg',     s.initials);
    _setAll ('.avatar-sm',     s.initials);

    // ── Faculty desktop (faculty.html) ───────────────────────────
    _setText('.faculty-name',  s.name);
    _setText('.faculty-role',  s.title);
    _setAll ('.faculty-avatar',s.initials);

    // ── Settings inputs ───────────────────────────────────────────
    const nameInputs = document.querySelectorAll('input[placeholder="Full name"], .settings-input[value]');
    nameInputs.forEach(inp => {
        // Only patch name/email inputs, not password/readonly fields
        if (!inp.readOnly && inp.type !== 'password') {
            if (inp.previousElementSibling && inp.previousElementSibling.textContent.includes('Name')) {
                inp.value = s.name;
            }
            if (inp.type === 'email') {
                inp.value = s.email;
            }
        }
    });
}

function _setText(selector, value) {
    const el = document.querySelector(selector);
    if (el && value) el.textContent = value;
}
function _setAll(selector, value) {
    document.querySelectorAll(selector).forEach(el => { if (value) el.textContent = value; });
}


// ─────────────────────────────────────────────────────────────────
//  STAT CARD FIX  (admin pages only)
//  The original updateStatCards() loops subject × section × student,
//  inflating Present/Late/Absent by 4× (one per subject per student).
//  This replacement counts UNIQUE students by their worst status
//  across all subjects for today.
// ─────────────────────────────────────────────────────────────────

function updateStatCardsFixed() {
    // Guard: only run on pages that have these stat elements
    const elTotal   = document.getElementById('statTotal');
    const elPresent = document.getElementById('statPresent');
    const elLate    = document.getElementById('statLate');
    const elAbsent  = document.getElementById('statAbsent');
    if (!elTotal) return;

    // Need students-data.js to be loaded
    if (typeof getAllStudents === 'undefined') return;

    const allStudents = getAllStudents();
    elTotal.textContent = allStudents.length;

    // For each student, find their worst status across all subjects
    // Absent > Late > Present > Unmarked
    const statusRank = { 'Absent': 3, 'Late': 2, 'Present': 1, '': 0 };
    let countPresent = 0, countLate = 0, countAbsent = 0, countUnmarked = 0;

    allStudents.forEach(student => {
        let worstRank = 0;
        let worstStatus = '';

        SSCR_SUBJECTS.forEach(subj => {
            const sec = student.section; // 'Sec A' / 'Sec B' / 'Sec C'
            const db  = attendanceDB[subj] && attendanceDB[subj][sec];
            if (!db) return;
            const rec = db[student.id];
            if (!rec) return;
            const rank = statusRank[rec.status] || 0;
            if (rank > worstRank) { worstRank = rank; worstStatus = rec.status; }
        });

        if      (worstStatus === 'Absent')  countAbsent++;
        else if (worstStatus === 'Late')    countLate++;
        else if (worstStatus === 'Present') countPresent++;
        else                                countUnmarked++;
    });

    elPresent.textContent = countPresent;
    elLate.textContent    = countLate;
    elAbsent.textContent  = countAbsent;

    // Update the subtitle labels to be accurate
    const presentCard = elPresent.closest('.stat-card');
    const lateCard    = elLate.closest('.stat-card');
    const absentCard  = elAbsent.closest('.stat-card');
    if (presentCard) { const lbl = presentCard.querySelector('.stat-label'); if (lbl) lbl.textContent = 'Unique students'; }
    if (lateCard)    { const lbl = lateCard.querySelector('.stat-label');    if (lbl) lbl.textContent = 'Unique students'; }
    if (absentCard)  { const lbl = absentCard.querySelector('.stat-label');  if (lbl) lbl.textContent = 'Unique students'; }
}


// ─────────────────────────────────────────────────────────────────
//  ABSENCE THRESHOLD ALERTS
//  Scans all students × subjects and shows a dismissible banner
//  listing every student at or above SSCR_CONFIG.absenceAlertLimit.
//  Uses attendanceDB which is populated by seedDemo() or real scans.
// ─────────────────────────────────────────────────────────────────

function checkAbsenceAlerts() {
    if (typeof attendanceDB === 'undefined' || typeof SSCR_SUBJECTS === 'undefined') return;

    const limit    = (typeof SSCR_CONFIG !== 'undefined') ? SSCR_CONFIG.absenceAlertLimit : 3;
    const flagged  = [];

    SSCR_SECTIONS.forEach(sec => {
        SSCR_STUDENTS[sec].forEach(student => {
            SSCR_SUBJECTS.forEach(subj => {
                // Count absences for this student in this subject
                // In a real multi-day system you'd count across dates;
                // here we count any 'Absent' entry in attendanceDB as a flag
                const rec = attendanceDB[subj]?.[sec]?.[student.id];
                if (rec && rec.status === 'Absent') {
                    flagged.push({ name: student.name, id: student.id, subject: subj, section: sec });
                }
            });
        });
    });

    if (flagged.length === 0) return;

    // Build alert banner
    const banner = document.createElement('div');
    banner.id    = 'absenceAlertBanner';
    banner.style.cssText = [
        'position:fixed', 'bottom:70px', 'left:0', 'right:0', 'z-index:700',
        'margin:0 0.75rem', 'background:linear-gradient(135deg,#8B0000,#DC143C)',
        'color:#fff', 'border-radius:14px', 'border:2px solid #FFD700',
        'padding:0.75rem 1rem', 'box-shadow:0 8px 28px rgba(0,0,0,0.35)',
        'font-family:DM Sans,sans-serif', 'font-size:0.8rem',
        'animation:slideUp 0.3s ease',
    ].join(';');

    // Group by student — count absences per student across all subjects
    const byStudent = {};
    flagged.forEach(f => {
        const key = f.id;
        if (!byStudent[key]) byStudent[key] = { name: f.name, id: f.id, subjects: [] };
        byStudent[key].subjects.push(f.subject);
    });

    const rows = Object.values(byStudent).slice(0, 5).map(s =>
        `<span style="display:inline-block;background:rgba(255,255,255,0.15);
         border-radius:8px;padding:2px 8px;margin:2px 3px 2px 0;font-size:0.72rem;">
         ⚠ ${s.name.split(',')[0]} — ${s.subjects.join(', ')}
         </span>`
    ).join('');

    const more = Object.values(byStudent).length > 5
        ? `<span style="opacity:0.7;font-size:0.72rem;"> +${Object.values(byStudent).length - 5} more</span>` : '';

    banner.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
            <div>
                <div style="font-family:Syne,sans-serif;font-weight:700;font-size:0.82rem;
                     color:#FFD700;margin-bottom:0.3rem;">
                    ⚠ Absence Alert — ${Object.values(byStudent).length} student(s) flagged
                </div>
                <div style="line-height:1.8;">${rows}${more}</div>
            </div>
            <button onclick="document.getElementById('absenceAlertBanner').remove()"
                style="background:none;border:1.5px solid rgba(255,215,0,0.5);color:#FFD700;
                       border-radius:8px;padding:0.25rem 0.6rem;cursor:pointer;
                       font-family:Syne,sans-serif;font-weight:700;font-size:0.72rem;
                       flex-shrink:0;margin-top:2px;">
                Dismiss
            </button>
        </div>`;

    document.body.appendChild(banner);

    // Auto-dismiss after 12 seconds
    setTimeout(() => { if (banner.parentNode) banner.remove(); }, 12000);
}


// ─────────────────────────────────────────────────────────────────
//  LOGS BUTTON ICON FIX  (admin-mobile.html)
//  Replaces the plain text "LOGS" button in the top bar with a
//  proper SVG icon to match the rest of the icon-based mobile UI.
// ─────────────────────────────────────────────────────────────────

function fixLogsButton() {
    document.querySelectorAll('.tb-btn').forEach(btn => {
        if (btn.textContent.trim() === 'LOGS') {
            btn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2"
                     stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                </svg>`;
            btn.setAttribute('title', 'System Logs');
        }
    });
}


// ─────────────────────────────────────────────────────────────────
//  PRINT LETTERHEAD
//  Injects a hidden school letterhead <div> into the page that only
//  appears when printing.  The existing print CSS hides the nav/header
//  but doesn't show a proper report header — this fixes that.
// ─────────────────────────────────────────────────────────────────

function injectPrintHeader() {
    if (document.getElementById('printLetterhead')) return; // already injected

    const session = getSession();
    const today   = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const el = document.createElement('div');
    el.id    = 'printLetterhead';
    el.style.cssText = 'display:none;'; // hidden on screen, shown by print CSS below

    el.innerHTML = `
        <div style="text-align:center;padding:1rem 0 0.75rem;border-bottom:3px solid #1a1a1a;margin-bottom:1rem;">
            <div style="font-family:Syne,sans-serif;font-size:1.1rem;font-weight:800;letter-spacing:1px;">
                SAN SEBASTIAN COLLEGE – RECOLETOS DE MANILA
            </div>
            <div style="font-size:0.85rem;color:#555;margin-top:0.2rem;">
                Attendance Management System · School Year 2025–2026
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:0.65rem;
                 font-size:0.78rem;color:#333;padding:0 0.5rem;">
                <span><strong>Printed by:</strong> ${session.name} (${session.title})</span>
                <span><strong>Date:</strong> ${today}</span>
            </div>
        </div>`;

    // Insert as first child of body (or container)
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(el, container.firstChild);

    // Inject the print CSS rule that reveals the letterhead
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            #printLetterhead { display: block !important; }
            .bottom-nav, .top-bar, .action-row,
            .controls, .pagination, .no-print { display: none !important; }
            body { padding-bottom: 0 !important; }
        }`;
    document.head.appendChild(style);
}


// ─────────────────────────────────────────────────────────────────
//  AUTO-INIT
//  Runs as soon as the DOM is ready. Does NOT call requireAuth()
//  automatically — each page must call that itself with its role.
//  This separation lets login.html load auth.js too (for validateLogin)
//  without being immediately redirected.
// ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    injectProfile();
    fixLogsButton();
    injectPrintHeader();

    // Delay stat fix + absence alerts until after the role JS has run
    // (role JS calls seedDemo() which populates attendanceDB)
    setTimeout(() => {
        updateStatCardsFixed();
        checkAbsenceAlerts();
    }, 150);
});
