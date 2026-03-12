// ═══════════════════════════════════════════════════════════════
//  SSC-R faculty-firebase.js  v6
//  Key fix: calls renderStudentTable(subject, section) directly
//  instead of relying on faculty.js internal _currentSection var
// ═══════════════════════════════════════════════════════════════

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut }
                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc,
         onSnapshot, query, where, updateDoc, serverTimestamp }
                          from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyCG2S8sm0WOOKKyrXsXCkgSzLIFy8jEC2E",
    authDomain:        "sscr-attendance-6bb23.firebaseapp.com",
    projectId:         "sscr-attendance-6bb23",
    storageBucket:     "sscr-attendance-6bb23.firebasestorage.app",
    messagingSenderId: "608259669011",
    appId:             "1:608259669011:web:4620cf50705c897ca553e6"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── State ───────────────────────────────────────────────────────
let currentUser     = null;
let activeSessionId = null;
let liveUnsubscribe = null;
let countdownTimer  = null;
let sessionEndTimer = null;
let fbSubject = '';   // tracked entirely by this module
let fbSection = '';   // tracked entirely by this module

// ── Schedule ────────────────────────────────────────────────────
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const SCHEDULE = {
    Monday:    [
        {time:'07:00',subject:'Math',    section:'Sec A'},
        {time:'08:30',subject:'English', section:'Sec B'},
        {time:'10:00',subject:'Science', section:'Sec C'},
        {time:'13:00',subject:'Filipino',section:'Sec A'},
        {time:'16:00',subject:'English', section:'Sec C'},
    ],
    Tuesday:   [
        {time:'08:30',subject:'Science', section:'Sec A'},
        {time:'10:00',subject:'Filipino',section:'Sec B'},
        {time:'13:00',subject:'Math',    section:'Sec C'},
        {time:'14:30',subject:'English', section:'Sec A'},
        {time:'16:00',subject:'Science', section:'Sec C'},
    ],
    Wednesday: [
        {time:'07:00',subject:'Math',    section:'Sec B'},
        {time:'08:30',subject:'English', section:'Sec C'},
        {time:'10:00',subject:'Filipino',section:'Sec A'},
        {time:'13:00',subject:'Science', section:'Sec B'},
        {time:'14:30',subject:'Science', section:'Sec C'},
    ],
    Thursday:  [
        {time:'08:30',subject:'English', section:'Sec A'},
        {time:'10:00',subject:'Filipino',section:'Sec C'},
        {time:'13:00',subject:'Math',    section:'Sec B'},
        {time:'14:30',subject:'English', section:'Sec C'},
        {time:'16:00',subject:'Science', section:'Sec A'},
    ],
    Friday:    [
        {time:'07:00',subject:'Math',    section:'Sec C'},
        {time:'08:30',subject:'Science', section:'Sec B'},
        {time:'13:00',subject:'Math',    section:'Sec A'},
        {time:'14:30',subject:'Filipino',section:'Sec C'},
        {time:'16:00',subject:'Filipino',section:'Sec B'},
    ],
    Saturday:[], Sunday:[],
};

function getScheduledSection(subject) {
    const day    = DAYS[new Date().getDay()];
    const nowMin = new Date().getHours()*60 + new Date().getMinutes();
    const list   = (SCHEDULE[day]||[])
        .filter(c => c.subject === subject)
        .map(c => { const [h,m]=c.time.split(':').map(Number); return {...c, min:h*60+(m||0)}; });
    if (!list.length) return 'Sec A';
    const active   = list.find(c => nowMin >= c.min && nowMin <= c.min+90);
    if (active) return active.section;
    const upcoming = list.filter(c => c.min > nowMin).sort((a,b)=>a.min-b.min);
    if (upcoming.length) return upcoming[0].section;
    return list.sort((a,b)=>b.min-a.min)[0].section;
}

// ── Auth ─────────────────────────────────────────────────────────
onAuthStateChanged(auth, user => {
    if (!user) { window.location.replace('login.html'); return; }
    currentUser = user;
    const s = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
    s('headerName',     sessionStorage.getItem('sscr_name')     || 'Faculty');
    s('headerRole',     sessionStorage.getItem('sscr_title')    || 'Faculty');
    s('headerAvatar',   sessionStorage.getItem('sscr_initials') || 'FA');
});

window.logout = async function() {
    if (!confirm('Are you sure you want to logout?')) return;
    if (liveUnsubscribe) liveUnsubscribe();
    clearInterval(countdownTimer); clearTimeout(sessionEndTimer);
    await signOut(auth);
    sessionStorage.clear();
    window.location.replace('login.html');
};

// ── Override openClassModal ──────────────────────────────────────
// faculty.js hardcodes _currentSection='Sec A' and uses private vars.
// We bypass all of that by rendering the table ourselves.
document.addEventListener('DOMContentLoaded', function () {

    window.openClassModal = function(subjectName) {
        if (!currentUser) { alert('Not logged in. Please refresh.'); return; }

        fbSubject = subjectName;
        fbSection = getScheduledSection(subjectName);

        // Fill header + session info
        document.getElementById('classModalTitle').textContent = subjectName;
        document.getElementById('sessionClass').textContent    = subjectName;
        document.getElementById('sessionSection').textContent  = fbSection;
        document.getElementById('sessionDate').textContent     = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
        document.getElementById('sessionTime').textContent     = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});

        // Activate scheduled tab + fill counts
        updateTabs(fbSection);

        // Render table directly — no reliance on faculty.js internal vars
        fbRenderTable(fbSubject, fbSection);

        // Reset Firebase UI
        resetToPreSession();

        // Open modal
        document.getElementById('classModal').classList.add('show');
    };

    // Override switchSection — called by tab onclick="switchSection('Sec X')"
    window.switchSection = function(sectionLabel) {
        fbSection = sectionLabel;
        document.getElementById('sessionSection').textContent = sectionLabel;
        updateTabs(sectionLabel);
        fbRenderTable(fbSubject, fbSection);
    };

});

// ── Tab styling ──────────────────────────────────────────────────
function updateTabs(activeSection) {
    ['Sec A','Sec B','Sec C'].forEach(sec => {
        const key = sec.replace(' ','');
        const tab = document.getElementById('tab-'+key);
        if (tab) sec === activeSection ? tab.classList.add('active') : tab.classList.remove('active');
        const cnt = document.getElementById('count-'+key);
        if (cnt && typeof SSCR_STUDENTS !== 'undefined')
            cnt.textContent = (SSCR_STUDENTS[sec]||[]).length;
    });
}

// ── Render student table (self-contained, no faculty.js vars) ────
function fbRenderTable(subject, section) {
    if (typeof SSCR_STUDENTS === 'undefined' || typeof attendanceDB === 'undefined') return;

    const students = SSCR_STUDENTS[section] || [];
    const tbody    = document.getElementById('studentListBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let present=0, absent=0, late=0;

    students.forEach(function(s, idx) {
        const rec    = (attendanceDB[subject] && attendanceDB[subject][section])
                       ? attendanceDB[subject][section][s.id] || {status:'',timeIn:''}
                       : {status:'',timeIn:''};
        const status = rec.status || '';

        let timeDisplay = '';
        if (status==='Absent') timeDisplay = '—';
        else if (status==='Present'||status==='Late') timeDisplay = rec.timeIn||'—';

        if (status==='Present') present++;
        else if (status==='Absent') absent++;
        else if (status==='Late') late++;

        const statusClass = status ? 'status-'+status.toLowerCase() : 'status-unmarked';
        const rowBg = idx % 2 === 0 ? '#ffffff' : 'rgba(255,215,0,0.05)';
        const tr = document.createElement('tr');
        tr.setAttribute('data-student-id', s.id);
        tr.style.background = rowBg;
        tr.innerHTML =
            '<td style="color:#aaa;font-size:0.78rem;font-weight:600;text-align:center;width:36px;">'+(idx+1)+'</td>'+
            '<td style="font-weight:700;font-size:0.8rem;color:#555;white-space:nowrap;">'+s.id+'</td>'+
            '<td style="font-weight:600;color:#1a1a1a;line-height:1.35;min-width:130px;">'+s.name+'</td>'+
            '<td style="font-size:0.82rem;color:#888;text-align:center;" class="status-cell">'+timeDisplay+'</td>'+
            '<td><select class="status-select '+statusClass+'" '+
                'onchange="updateStatus(\''+subject+'\',\''+section+'\',\''+s.id+'\',this)" '+
                'style="border:none;border-radius:20px;padding:3px 8px;font-size:0.78rem;font-weight:700;cursor:pointer;outline:none;">'+
                '<option value=""'        +(!status?            ' selected':'')+'>— Mark —</option>'+
                '<option value="Present"' +(status==='Present'? ' selected':'')+'>Present</option>'+
                '<option value="Late"'    +(status==='Late'?    ' selected':'')+'>Late</option>'+
                '<option value="Absent"'  +(status==='Absent'?  ' selected':'')+'>Absent</option>'+
            '</select></td>';
        tbody.appendChild(tr);
    });

    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
    set('totalStudents', students.length);
    set('presentCount',  present);
    set('absentCount',   absent);
    set('lateCount',     late);
}

// ── Reset Firebase UI ────────────────────────────────────────────
function resetToPreSession() {
    const startBtn  = document.getElementById('fbStartBtn');
    const countdown = document.getElementById('fbCountdown');
    if (startBtn)  { startBtn.style.display='block'; startBtn.textContent='Start Session'; startBtn.disabled=false; }
    if (countdown) countdown.style.display='none';

    const placeholder = document.getElementById('qrPlaceholder');
    const qrDiv       = document.getElementById('firebaseQRDiv');
    const clickHint   = document.getElementById('qrClickHint');
    if (placeholder) placeholder.style.display='flex';
    if (qrDiv)       { qrDiv.style.display='none'; qrDiv.innerHTML=''; }
    if (clickHint)   clickHint.style.display='none';

    clearInterval(countdownTimer); clearTimeout(sessionEndTimer);
    if (liveUnsubscribe) { liveUnsubscribe(); liveUnsubscribe=null; }
    if (activeSessionId) {
        updateDoc(doc(db,'sessions',activeSessionId),{active:false}).catch(()=>{});
        activeSessionId=null;
    }
}

// ── Start Session ────────────────────────────────────────────────
window.startFbSession = async function() {
    if (!currentUser) return;
    const startBtn = document.getElementById('fbStartBtn');
    if (startBtn) { startBtn.textContent='Starting…'; startBtn.disabled=true; }

    try {
        const now     = new Date();
        const endTime = new Date(now.getTime() + 60*60*1000);

        const sessionRef = await addDoc(collection(db,'sessions'), {
            subject:   fbSubject,
            section:   fbSection,
            faculty:   currentUser.email,
            facultyId: currentUser.uid,
            startTime: now,
            endTime:   endTime,
            qrToken:   Math.random().toString(36).substring(2,10).toUpperCase(),
            active:    true,
            createdAt: serverTimestamp(),
        });
        activeSessionId = sessionRef.id;

        const scanUrl = window.location.href.replace('faculty.html','student.html')+'?scan='+sessionRef.id;
        showQR(scanUrl);

        if (startBtn) startBtn.style.display='none';
        const countdown = document.getElementById('fbCountdown');
        if (countdown) countdown.style.display='block';

        startCountdown(endTime);
        listenAttendance(sessionRef.id);
        sessionEndTimer = setTimeout(()=>window.endSession(), 60*60*1000);

        if (typeof showToast==='function') showToast(fbSubject+' session started!','success');

    } catch(err) {
        console.error(err);
        if (startBtn) { startBtn.textContent='Start Session'; startBtn.disabled=false; }
        alert('Failed: '+err.message);
    }
};

// ── Show QR ──────────────────────────────────────────────────────
function showQR(url) {
    window._currentQRUrl = url;
    const placeholder = document.getElementById('qrPlaceholder');
    const qrDiv       = document.getElementById('firebaseQRDiv');
    const clickHint   = document.getElementById('qrClickHint');
    if (placeholder) placeholder.style.display='none';
    if (clickHint)   clickHint.style.display='block';
    if (!qrDiv) return;
    qrDiv.style.display='block';
    qrDiv.innerHTML='';

    function render() {
        new QRCode(qrDiv,{text:url,width:180,height:180,colorDark:'#1a1a1a',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.H});
    }
    typeof QRCode!=='undefined' ? render() : (() => {
        const s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        s.onload=render; document.head.appendChild(s);
    })();
}

// ── Countdown ────────────────────────────────────────────────────
function startCountdown(endTime) {
    clearInterval(countdownTimer);
    function tick() {
        const rem = Math.max(0,Math.floor((endTime-new Date())/1000));
        const el  = document.getElementById('fbCountdownTime');
        if (el) el.textContent = String(Math.floor(rem/60)).padStart(2,'0')+':'+String(rem%60).padStart(2,'0');
        if (rem===0) { clearInterval(countdownTimer); window.endSession(); }
    }
    tick(); countdownTimer=setInterval(tick,1000);
}

// ── Live Attendance ───────────────────────────────────────────────
function listenAttendance(sessionId) {
    if (liveUnsubscribe) liveUnsubscribe();
    liveUnsubscribe = onSnapshot(
        query(collection(db,'attendance'),where('sessionId','==',sessionId)),
        snapshot => {
            snapshot.docs.map(d=>d.data()).forEach(rec => {
                const row = document.querySelector(`[data-student-id="${rec.studentId}"]`);
                if (!row) return;
                const cell = row.querySelector('.status-cell');
                if (!cell) return;
                const c = {
                    present:'background:#e8f5e9;color:#2e7d32;border:1.5px solid #66bb6a;',
                    late:   'background:#fff3e0;color:#e65100;border:1.5px solid #FFA500;',
                    absent: 'background:#ffebee;color:#c62828;border:1.5px solid #ef9a9a;',
                };
                cell.innerHTML=`<span style="padding:2px 10px;border-radius:20px;font-size:0.73rem;font-weight:700;${c[rec.status]||''}">${rec.status.toUpperCase()}</span>`;
            });
            const docs = snapshot.docs.map(d=>d.data());
            const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};
            set('presentCount',docs.filter(r=>r.status==='present').length);
            set('lateCount',   docs.filter(r=>r.status==='late').length);
            set('absentCount', docs.filter(r=>r.status==='absent').length);
        }
    );
}

// ── End Session ───────────────────────────────────────────────────
window.endSession = async function() {
    clearInterval(countdownTimer); clearTimeout(sessionEndTimer);
    if (liveUnsubscribe) { liveUnsubscribe(); liveUnsubscribe=null; }
    if (activeSessionId) {
        try { await updateDoc(doc(db,'sessions',activeSessionId),{active:false}); } catch(e){}
        activeSessionId=null;
    }
    resetToPreSession();
    if (typeof showToast==='function') showToast('Session ended. Attendance saved!','success');
};