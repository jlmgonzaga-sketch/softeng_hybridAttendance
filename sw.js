const CACHE = 'sscr-v1';
const FILES = [
  '/sscr_attendance/login.html',
  '/sscr_attendance/admin-mobile.html',
  '/sscr_attendance/faculty-mobile.html',
  '/sscr_attendance/student-mobile.html',
  '/sscr_attendance/system-logs-mobile.html',
  '/sscr_attendance/admin-mobile.css',
  '/sscr_attendance/faculty-mobile.css',
  '/sscr_attendance/student-mobile.css',
  '/sscr_attendance/admin-mobile.js',
  '/sscr_attendance/faculty-mobile.js',
  '/sscr_attendance/faculty-scans.js',
  '/sscr_attendance/student-mobile.js',
  '/sscr_attendance/students-data.js',
  '/sscr_attendance/sscrmnlofficiallogo.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});