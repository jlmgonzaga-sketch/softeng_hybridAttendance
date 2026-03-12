// ═══════════════════════════════════════════════════════════════════
//  SSC-R Attendance System — Firebase Configuration
//  Project: sscr-attendance-6bb23
//
//  LOAD ORDER in every HTML file (before any other script):
//    1. firebase-config.js       ← this file
//    2. students-data.js
//    3. auth.js
//    4. faculty.js / student.js / admin.js
// ═══════════════════════════════════════════════════════════════════

// ── Firebase CDN imports (compat version — works with plain HTML/JS) ──
// These are already loaded via <script> tags in your HTML.
// Make sure your HTML has these BEFORE this script:
//
//  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
//  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
//  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>

const firebaseConfig = {
  apiKey:            "AIzaSyCG2S8sm0WOOKKyrXsXCkgSzLIFy8jEC2E",
  authDomain:        "sscr-attendance-6bb23.firebaseapp.com",
  projectId:         "sscr-attendance-6bb23",
  storageBucket:     "sscr-attendance-6bb23.firebasestorage.app",
  messagingSenderId: "608259669011",
  appId:             "1:608259669011:web:4620cf50705c897ca553e6"
};

// ── Initialize Firebase ───────────────────────────────────────────
firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();   // Firestore database
const auth = firebase.auth();        // Firebase Authentication

console.log('%c[SSCR] Firebase connected ✓', 'color:#2e7d32;font-weight:bold;');


// ═══════════════════════════════════════════════════════════════════
//  FIRESTORE HELPERS
//  Drop-in replacements for your in-memory attendanceDB operations.
//  All functions return Promises — use await or .then()
// ═══════════════════════════════════════════════════════════════════

// ── Collection structure ──────────────────────────────────────────
//  attendance/{subject}_{section}_{studentId}
//    → { studentId, studentName, subject, section, status, timeIn, date, updatedAt }
//
//  sessions/{subject}_{section}_{dateKey}
//    → { subject, section, date, startTime, createdBy, active: true/false }

// ── Write a single attendance record ─────────────────────────────
async function fsSetAttendance(subject, section, studentId, status, timeIn) {
    const today   = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const docId   = `${subject}_${section.replace(' ','')}_${studentId}_${today}`;
    const student = _findStudent(studentId);

    await db.collection('attendance').doc(docId).set({
        studentId,
        studentName: student ? student.name : studentId,
        subject,
        section,
        status,
        timeIn:     timeIn || '',
        date:       today,
        updatedAt:  firebase.firestore.FieldValue.serverTimestamp(),
    });
}

// ── Read attendance for a subject + section (today) ───────────────
async function fsGetAttendance(subject, section) {
    const today = new Date().toISOString().split('T')[0];
    const snap  = await db.collection('attendance')
        .where('subject', '==', subject)
        .where('section', '==', section)
        .where('date',    '==', today)
        .get();

    const result = {};
    snap.forEach(doc => {
        const d = doc.data();
        result[d.studentId] = { status: d.status, timeIn: d.timeIn };
    });
    return result;
}

// ── Read ALL attendance for a student (for student dashboard) ─────
async function fsGetStudentAttendance(studentId) {
    const snap = await db.collection('attendance')
        .where('studentId', '==', studentId)
        .orderBy('date', 'desc')
        .get();

    const records = [];
    snap.forEach(doc => records.push(doc.data()));
    return records;
}

// ── Count absences for a student in a subject (for drop warning) ──
async function fsCountAbsences(studentId, subject) {
    const snap = await db.collection('attendance')
        .where('studentId', '==', studentId)
        .where('subject',   '==', subject)
        .where('status',    '==', 'Absent')
        .get();
    return snap.size;
}

// ── Create a QR session ───────────────────────────────────────────
async function fsCreateSession(subject, section, facultyName) {
    const today   = new Date().toISOString().split('T')[0];
    const docId   = `${subject}_${section.replace(' ','')}_${today}`;
    const now     = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    await db.collection('sessions').doc(docId).set({
        subject,
        section,
        date:       today,
        startTime:  timeStr,
        createdBy:  facultyName,
        active:     true,
        createdAt:  firebase.firestore.FieldValue.serverTimestamp(),
    });

    return docId; // use as QR payload
}

// ── Get an active session by docId (called when student scans QR) ─
async function fsGetSession(sessionId) {
    const doc = await db.collection('sessions').doc(sessionId).get();
    if (!doc.exists) return null;
    return doc.data();
}

// ── Close a session (faculty ends class) ─────────────────────────
async function fsCloseSession(sessionId) {
    await db.collection('sessions').doc(sessionId).update({ active: false });
}

// ── Listen to attendance in real-time (for faculty modal) ─────────
//  Returns unsubscribe function — call it to stop listening.
function fsListenAttendance(subject, section, callback) {
    const today = new Date().toISOString().split('T')[0];
    return db.collection('attendance')
        .where('subject', '==', subject)
        .where('section', '==', section)
        .where('date',    '==', today)
        .onSnapshot(snap => {
            const result = {};
            snap.forEach(doc => {
                const d = doc.data();
                result[d.studentId] = { status: d.status, timeIn: d.timeIn };
            });
            callback(result);
        });
}

// ── Utility: find student object from students-data.js ────────────
function _findStudent(studentId) {
    if (typeof getAllStudents === 'function') {
        return getAllStudents().find(s => s.id === studentId) || null;
    }
    return null;
}


// ═══════════════════════════════════════════════════════════════════
//  QR ATTENDANCE LOGIC
//  Called when a student scans a QR code.
//  Checks time vs session startTime → Present / Late / Absent
// ═══════════════════════════════════════════════════════════════════

const LATE_WINDOW_MINUTES = 15; // within 15 min after start = Late

async function processQRScan(sessionId, studentId) {
    // 1. Get session
    const session = await fsGetSession(sessionId);
    if (!session) return { success: false, error: 'Session not found or expired.' };
    if (!session.active) return { success: false, error: 'This session has already ended.' };

    // 2. Verify student section matches QR section
    const student = _findStudent(studentId);
    if (!student) return { success: false, error: 'Student not found.' };

    const studentSection = student.section; // e.g. 'Sec B'
    if (studentSection !== session.section) {
        return { success: false, error: `Wrong section. This QR is for ${session.section}.` };
    }

    // 3. Check for duplicate scan
    const today  = new Date().toISOString().split('T')[0];
    const docId  = `${session.subject}_${session.section.replace(' ','')}_${studentId}_${today}`;
    const existing = await db.collection('attendance').doc(docId).get();
    if (existing.exists) {
        const d = existing.data();
        return { success: false, error: `Already recorded as ${d.status} at ${d.timeIn}.` };
    }

    // 4. Determine status based on time
    const now       = new Date();
    const timeIn    = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const [startH, startM] = _parseTime(session.startTime);
    const startMinutes     = startH * 60 + startM;
    const nowMinutes       = now.getHours() * 60 + now.getMinutes();
    const diff             = nowMinutes - startMinutes;

    let status;
    if (diff <= 0)                        status = 'Present';
    else if (diff <= LATE_WINDOW_MINUTES) status = 'Late';
    else                                  status = 'Absent';

    // 5. Write to Firestore
    await fsSetAttendance(session.subject, session.section, studentId, status, timeIn);

    // 6. Check absence count for drop warning
    const absenceCount = await fsCountAbsences(studentId, session.subject);

    return {
        success:  true,
        status,
        timeIn,
        subject:  session.subject,
        section:  session.section,
        student:  student.name,
        absences: absenceCount,
        warn:     absenceCount >= 3,   // trigger EmailJS warning if true
    };
}

// ── Parse "09:00 AM" → [9, 0] ─────────────────────────────────────
function _parseTime(timeStr) {
    if (!timeStr) return [0, 0];
    const [time, period] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return [h, m];
}
