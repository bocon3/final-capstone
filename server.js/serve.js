/* ComBaTy backend — Express + SQLite (better-sqlite3) + JWT auth
   Run:  npm install  →  npm start  →  http://localhost:3000            */
process.env.TZ = process.env.TZ || 'Asia/Manila';

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) console.warn('[warn] JWT_SECRET is not set: everyone is logged out whenever the server restarts. Set it for real use.');
const PHONE_MSG = 'Phone access is only available to Brgy Staff accounts. Please log in on a computer.';

/* ───────────── DATABASE ───────────── */
const db = new Database(process.env.DB_FILE || path.join(__dirname, 'combaty.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS accounts(
  username TEXT PRIMARY KEY COLLATE NOCASE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL, barangay TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Active',
  full_name TEXT DEFAULT '', position TEXT DEFAULT '', email TEXT DEFAULT '', phone TEXT DEFAULT '', address TEXT DEFAULT '');
CREATE TABLE IF NOT EXISTS barangays(
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL COLLATE NOCASE,
  pct REAL NOT NULL, hh INTEGER NOT NULL, lat REAL NOT NULL, lng REAL NOT NULL);
CREATE TABLE IF NOT EXISTS records(
  id INTEGER PRIMARY KEY AUTOINCREMENT, barangay TEXT NOT NULL COLLATE NOCASE,
  year INTEGER NOT NULL, hh INTEGER NOT NULL, mag INTEGER NOT NULL, UNIQUE(barangay, year));
CREATE TABLE IF NOT EXISTS households(
  id TEXT PRIMARY KEY, head TEXT NOT NULL, barangay TEXT NOT NULL COLLATE NOCASE, address TEXT NOT NULL,
  members INTEGER NOT NULL, income REAL NOT NULL, occupation TEXT DEFAULT '', education TEXT, housing TEXT, services TEXT,
  status TEXT NOT NULL DEFAULT 'Draft', lat REAL, lng REAL, geo_src TEXT, geo_at TEXT,
  remarks TEXT DEFAULT '', submitted_by TEXT DEFAULT '—', form_date TEXT, acted_by TEXT, acted_on TEXT);
CREATE INDEX IF NOT EXISTS ix_hh_brgy ON households(barangay);
CREATE TABLE IF NOT EXISTS logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT, t TEXT NOT NULL, username TEXT, role TEXT, type TEXT NOT NULL, action TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifs(
  id INTEGER PRIMARY KEY AUTOINCREMENT, brgy TEXT NOT NULL COLLATE NOCASE, text TEXT NOT NULL, time TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0);
`);

const pad = n => String(n).padStart(2, '0');
const ts = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const log = (u, type, action) => db.prepare('INSERT INTO logs(t,username,role,type,action) VALUES(?,?,?,?,?)').run(ts(), u ? u.username : '—', u ? u.role : '—', type, action);

/* ───────────── SEED (placeholder data from the prototype — replace with real data) ───────────── */
(function seed() {
  if (db.prepare('SELECT COUNT(*) c FROM accounts').get().c) return;
  const h = p => bcrypt.hashSync(p, 10);
  db.transaction(() => {
    const ia = db.prepare('INSERT INTO accounts(username,password_hash,role,barangay) VALUES(?,?,?,?)');
    ia.run('admin', h(process.env.ADMIN_PASSWORD || 'admin123'), 'Administrator', 'Municipal-wide');
    ia.run('brgystaff', h('brgystaff123'), 'Brgy Staff', 'Guilang-Guilang');
    ia.run('barangay', h('barangay123'), 'Barangay', 'Guilang-Guilang');

    const ib = db.prepare('INSERT INTO barangays(name,pct,hh,lat,lng) VALUES(?,?,?,?,?)');
    [['Minsuro', 45, 250, 8.39, 124.83], ['Ticala', 42, 220, 8.37, 124.87], ['Guilang-Guilang', 84.82, 412, 8.3745, 124.8467],
     ['Santiago', 74.35, 389, 8.3512, 124.8801], ['Maluco', 53.75, 165, 8.3298, 124.8489]].forEach(r => ib.run(...r));

    const ir = db.prepare('INSERT INTO records(barangay,year,hh,mag) VALUES(?,?,?,?)');
    [['Guilang-Guilang', [[2019, 290, 232], [2021, 303, 257], [2023, 360, 300], [2025, 412, 349]]],
     ['Santiago', [[2019, 350, 245], [2021, 365, 262], [2023, 378, 279], [2025, 389, 289]]],
     ['Maluco', [[2019, 150, 70], [2021, 155, 78], [2023, 160, 84], [2025, 165, 89]]],
     ['Minsuro', [[2019, 230, 90], [2021, 238, 98], [2023, 245, 108], [2025, 250, 112]]],
     ['Ticala', [[2019, 205, 80], [2021, 210, 84], [2023, 215, 90], [2025, 220, 92]]]]
      .forEach(([b, rs]) => rs.forEach(([y, hh, m]) => ir.run(b, y, hh, m)));

    const ih = db.prepare(`INSERT INTO households(id,head,barangay,address,members,income,occupation,education,housing,services,status,lat,lng,remarks,submitted_by,form_date)
      VALUES(@id,@head,@barangay,@address,@members,@income,@occupation,@education,@housing,@services,@status,@lat,@lng,@remarks,@by,@date)`);
    [
      { id: 'HH-0001', head: 'Maria Dela Cruz', barangay: 'Guilang-Guilang', address: 'Purok 3', members: 6, income: 6500, occupation: 'Farm laborer', education: 'Elementary undergrad/grad', housing: 'Poor', services: 'Limited', status: 'Approved', lat: 8.3751, lng: 124.8472, remarks: '', by: 'brgystaff', date: '2026-10-20' },
      { id: 'HH-0002', head: 'Juan Bautista', barangay: 'Guilang-Guilang', address: 'Purok 1', members: 5, income: 9000, occupation: 'Tricycle driver', education: 'Secondary undergrad', housing: 'Fair', services: 'Moderate', status: 'Submitted', lat: 8.3738, lng: 124.8455, remarks: '', by: 'brgystaff', date: '2026-10-25' },
      { id: 'HH-0003', head: 'Rosa Villanueva', barangay: 'Guilang-Guilang', address: 'Purok 5', members: 4, income: 15000, occupation: 'Sari-sari store owner', education: 'Secondary graduate', housing: 'Good', services: 'Full', status: 'Under Review', lat: null, lng: null, remarks: '', by: 'brgystaff', date: '2026-10-25' },
      { id: 'HH-0004', head: 'Elena Reyes', barangay: 'Guilang-Guilang', address: 'Purok 2', members: 7, income: 5000, occupation: 'Seasonal farm labor', education: 'No schooling', housing: 'Poor', services: 'Limited', status: 'Returned', lat: 8.376, lng: 124.844, remarks: 'Please verify income figure.', by: 'brgystaff', date: '2026-10-22' },
      { id: 'HH-0005', head: 'Pedro Santos', barangay: 'Guilang-Guilang', address: 'Purok 4', members: 3, income: 12000, occupation: 'Carpenter', education: 'Secondary graduate', housing: 'Fair', services: 'Moderate', status: 'Draft', lat: null, lng: null, remarks: '', by: 'brgystaff', date: '2026-10-27' },
      { id: 'HH-0006', head: 'Ana Lopez', barangay: 'Santiago', address: 'Purok 2', members: 6, income: 7000, occupation: 'Farm laborer', education: 'Elementary undergrad/grad', housing: 'Poor', services: 'Limited', status: 'Approved', lat: 8.3515, lng: 124.8795, remarks: '', by: '—', date: '2026-10-18' }
    ].forEach(r => ih.run(r));

    db.prepare('INSERT INTO notifs(brgy,text,time,is_read) VALUES(?,?,?,0)')
      .run('Guilang-Guilang', 'Brgy Staff (brgystaff) submitted 2 household forms for review.', '2026-10-25 14:31');
    db.prepare('INSERT INTO logs(t,username,role,type,action) VALUES(?,?,?,?,?)').run(ts(), 'system', '—', 'Activity', 'Database created and seeded with placeholder data');
  })();
  console.log('[init] Database seeded. Default logins: admin/admin123, brgystaff/brgystaff123, barangay/barangay123 — CHANGE THESE.');
})();

/* ───────────── HELPERS ───────────── */
const bad = (res, m, c = 400) => res.status(c).json({ error: m });
const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const pub = a => ({ username: a.username, role: a.role, barangay: a.barangay, status: a.status, fullName: a.full_name, position: a.position, email: a.email, phone: a.phone, address: a.address });
const mapHH = r => ({ id: r.id, head: r.head, barangay: r.barangay, address: r.address, members: r.members, income: r.income, occupation: r.occupation, education: r.education, housing: r.housing, services: r.services, status: r.status, lat: r.lat, lng: r.lng, remarks: r.remarks || '', by: r.submitted_by, date: r.form_date, geoSrc: r.geo_src || undefined, geoAt: r.geo_at || undefined, actedBy: r.acted_by || undefined, actedOn: r.acted_on || undefined });
const EDU = ['No schooling', 'Elementary undergrad/grad', 'Secondary undergrad', 'Secondary graduate', 'Tertiary'];
const HOU = ['Poor', 'Fair', 'Good'], SRV = ['Limited', 'Moderate', 'Full'];
const editable = h => h.status === 'Draft' || h.status === 'Returned';
const nextHHId = () => 'HH-' + String((db.prepare("SELECT MAX(CAST(SUBSTR(id,4) AS INTEGER)) m FROM households").get().m || 0) + 1).padStart(4, '0');

function hhFields(b) {
  const d = { head: str(b.head), address: str(b.address), members: parseInt(b.members, 10), income: Number(b.income),
    occupation: str(b.occupation), education: str(b.education), housing: str(b.housing), services: str(b.services) };
  if (!d.head || !d.address || !(d.members > 0) || !Number.isFinite(d.income) || d.income < 0) return { error: 'Name, address, members and income are required.' };
  if (!EDU.includes(d.education) || !HOU.includes(d.housing) || !SRV.includes(d.services)) return { error: 'Invalid education, housing or services value.' };
  return { d };
}

/* ───────────── AUTH ───────────── */
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return bad(res, 'Not logged in.', 401);
  try {
    const p = jwt.verify(h.slice(7), SECRET);
    const u = db.prepare('SELECT * FROM accounts WHERE username=?').get(p.u);
    if (!u || u.status !== 'Active') return bad(res, 'Account unavailable.', 401);
    req.user = u; next();
  } catch { bad(res, 'Session expired. Please log in again.', 401); }
}
const only = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : bad(res, 'You do not have access to that action.', 403);
const ADMIN = only('Administrator'), STAFF = only('Brgy Staff'), BRGY = only('Barangay');

/* ───────────── APP ───────────── */
const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts. Try again in a few minutes.' } });

app.post('/api/login', loginLimiter, (req, res) => {
  const { username, password, phone } = req.body || {};
  if (!username || !password) return bad(res, 'Please enter both a username and password.');
  const u = db.prepare('SELECT * FROM accounts WHERE username=?').get(str(username, 60));
  if (!u || !bcrypt.compareSync(String(password), u.password_hash)) return bad(res, 'Invalid username or password.', 401);
  if (u.status !== 'Active') return bad(res, 'This account has been suspended. Contact the administrator.', 403);
  if (phone && u.role !== 'Brgy Staff') return bad(res, PHONE_MSG, 403);
  log(u, 'User', 'Logged in');
  res.json({ token: jwt.sign({ u: u.username }, SECRET, { expiresIn: '12h' }), user: pub(u) });
});

app.post('/api/logout', auth, (req, res) => { log(req.user, 'User', 'Logged out'); res.json({ ok: true }); });

/* One call that returns everything the logged-in role is allowed to see */
app.get('/api/bootstrap', auth, (req, res) => {
  const u = req.user, admin = u.role === 'Administrator';
  const where = admin ? '' : ' WHERE barangay=?', args = admin ? [] : [u.barangay];
  res.json({
    me: pub(u),
    barangays: admin ? db.prepare('SELECT name,pct,hh,lat,lng FROM barangays ORDER BY id').all()
                     : db.prepare('SELECT name,pct,hh,lat,lng FROM barangays WHERE name=?').all(u.barangay),
    records: db.prepare('SELECT barangay,year,hh,mag FROM records' + where + ' ORDER BY barangay,year').all(...args),
    households: db.prepare('SELECT * FROM households' + where + ' ORDER BY id').all(...args).map(mapHH),
    notifs: u.role === 'Barangay'
      ? db.prepare('SELECT brgy,text,time,is_read FROM notifs WHERE brgy=? ORDER BY id DESC').all(u.barangay).map(n => ({ brgy: n.brgy, text: n.text, time: n.time, read: !!n.is_read }))
      : [],
    logs: admin ? db.prepare('SELECT t,username AS user,role,type,action FROM logs ORDER BY id DESC LIMIT 500').all() : [],
    accounts: admin ? db.prepare('SELECT * FROM accounts ORDER BY rowid').all().map(pub) : undefined
  });
});

/* ── Logs (client-side activity such as GPS tracking / report generation) ── */
app.post('/api/logs', auth, (req, res) => {
  const { type, action } = req.body || {};
  if (!['Activity', 'User'].includes(type) || !str(action, 200)) return bad(res, 'Invalid log entry.');
  log(req.user, type, str(action, 200)); res.json({ ok: true });
});

/* ── My profile ── */
app.put('/api/me', auth, (req, res) => {
  const b = req.body || {}, n = str(b.fullName, 60), m = str(b.email, 80), t = str(b.phone, 15);
  if (n.length < 2) return bad(res, 'Please enter your full name.');
  if (m && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) return bad(res, 'Enter a valid email address.');
  if (t && !/^[0-9+()\-\s]{7,15}$/.test(t)) return bad(res, 'Enter a valid contact number.');
  db.prepare('UPDATE accounts SET full_name=?,position=?,email=?,phone=?,address=? WHERE username=?').run(n, str(b.position, 60), m, t, str(b.address, 120), req.user.username);
  log(req.user, 'User', 'Updated profile details'); res.json({ ok: true });
});
app.put('/api/me/password', auth, (req, res) => {
  const { current, next } = req.body || {};
  if (!bcrypt.compareSync(String(current || ''), req.user.password_hash)) return bad(res, 'Current password is incorrect.');
  if (String(next || '').length < 6) return bad(res, 'New password must be at least 6 characters.');
  if (next === current) return bad(res, 'New password must be different from the current one.');
  db.prepare('UPDATE accounts SET password_hash=? WHERE username=?').run(bcrypt.hashSync(String(next), 10), req.user.username);
  log(req.user, 'User', 'Changed account password'); res.json({ ok: true });
});

/* ── ADMIN: accounts ── */
app.post('/api/accounts', auth, ADMIN, (req, res) => {
  const b = req.body || {}, username = str(b.username, 30), password = String(b.password || '');
  if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) return bad(res, 'Username must be 3–30 letters, numbers, dot, dash or underscore.');
  if (password.length < 6) return bad(res, 'Password must be at least 6 characters.');
  if (!['Brgy Staff', 'Barangay'].includes(b.role)) return bad(res, 'Invalid role.');
  if (!db.prepare('SELECT 1 FROM barangays WHERE name=?').get(str(b.barangay))) return bad(res, 'Choose a valid barangay.');
  if (db.prepare('SELECT 1 FROM accounts WHERE username=?').get(username)) return bad(res, 'That username already exists.');
  db.prepare('INSERT INTO accounts(username,password_hash,role,barangay) VALUES(?,?,?,?)').run(username, bcrypt.hashSync(password, 10), b.role, str(b.barangay));
  log(req.user, 'User', 'Created account ' + username); res.json({ ok: true });
});
app.patch('/api/accounts/:u/toggle', auth, ADMIN, (req, res) => {
  const a = db.prepare('SELECT * FROM accounts WHERE username=?').get(req.params.u);
  if (!a) return bad(res, 'Account not found.', 404);
  if (a.username === req.user.username) return bad(res, 'You cannot suspend your own account.');
  const st = a.status === 'Active' ? 'Suspended' : 'Active';
  db.prepare('UPDATE accounts SET status=? WHERE username=?').run(st, a.username);
  log(req.user, 'User', `${st === 'Active' ? 'Activated' : 'Suspended'} account ${a.username}`); res.json({ status: st });
});
app.delete('/api/accounts/:u', auth, ADMIN, (req, res) => {
  if (req.params.u.toLowerCase() === req.user.username.toLowerCase()) return bad(res, 'You cannot delete your own account.');
  const r = db.prepare('DELETE FROM accounts WHERE username=?').run(req.params.u);
  if (!r.changes) return bad(res, 'Account not found.', 404);
  log(req.user, 'User', 'Deleted account ' + req.params.u); res.json({ ok: true });
});

/* ── ADMIN: barangays & historical records ── */
app.post('/api/barangays', auth, ADMIN, (req, res) => {
  const b = req.body || {}, name = str(b.name, 60), pct = Number(b.pct), hh = parseInt(b.hh, 10), lat = Number(b.lat), lng = Number(b.lng);
  if (!name || ![pct, hh, lat, lng].every(Number.isFinite)) return bad(res, 'All fields are required.');
  if (pct < 0 || pct > 100 || hh < 0 || Math.abs(lat) > 90 || Math.abs(lng) > 180) return bad(res, 'One or more values are out of range.');
  if (db.prepare('SELECT 1 FROM barangays WHERE name=?').get(name)) return bad(res, 'That barangay is already tracked.');
  db.prepare('INSERT INTO barangays(name,pct,hh,lat,lng) VALUES(?,?,?,?,?)').run(name, pct, hh, lat, lng);
  log(req.user, 'Activity', 'Added barangay ' + name); res.json({ ok: true });
});
app.delete('/api/barangays/:name', auth, ADMIN, (req, res) => {
  db.transaction(() => {
    db.prepare('DELETE FROM records WHERE barangay=?').run(req.params.name);
    if (!db.prepare('DELETE FROM barangays WHERE name=?').run(req.params.name).changes) throw Object.assign(new Error('Barangay not found.'), { code: 404 });
  })();
  log(req.user, 'Activity', 'Removed barangay ' + req.params.name); res.json({ ok: true });
});
app.post('/api/records', auth, ADMIN, (req, res) => {
  const b = req.body || {}, brgy = str(b.barangay), year = parseInt(b.year, 10), hh = Math.round(Number(b.hh)), mag = Math.round(Number(b.mag));
  if (!(hh > 0) || !Number.isFinite(mag) || mag < 0) return bad(res, 'Households and poor HH magnitude are required.');
  if (mag > hh) return bad(res, 'Magnitude cannot exceed number of households.');
  if (!(year >= 2000 && year <= 2100)) return bad(res, 'Invalid year.');
  if (!db.prepare('SELECT 1 FROM barangays WHERE name=?').get(brgy)) return bad(res, 'Unknown barangay.');
  db.prepare('INSERT INTO records(barangay,year,hh,mag) VALUES(?,?,?,?) ON CONFLICT(barangay,year) DO UPDATE SET hh=excluded.hh,mag=excluded.mag').run(brgy, year, hh, mag);
  log(req.user, 'Activity', `Saved poverty record ${brgy} ${year}`); res.json({ ok: true });
});
app.delete('/api/records', auth, ADMIN, (req, res) => {
  const r = db.prepare('DELETE FROM records WHERE barangay=? AND year=?').run(str(req.query.barangay), parseInt(req.query.year, 10));
  if (!r.changes) return bad(res, 'Record not found.', 404);
  log(req.user, 'Activity', 'Deleted a poverty record'); res.json({ ok: true });
});

/* ── BRGY STAFF: household forms ── */
const ownHH = (id, u) => db.prepare('SELECT * FROM households WHERE id=? AND (?=1 OR barangay=?)').get(id, u.role === 'Administrator' ? 1 : 0, u.barangay);

app.post('/api/households/submit', auth, STAFF, (req, res) => {
  const u = req.user, drafts = db.prepare("SELECT id FROM households WHERE barangay=? AND status IN ('Draft','Returned')").all(u.barangay);
  if (!drafts.length) return bad(res, 'No drafts or returned forms to submit.');
  db.transaction(() => {
    db.prepare("UPDATE households SET status='Submitted',submitted_by=?,form_date=?,remarks='' WHERE barangay=? AND status IN ('Draft','Returned')").run(u.username, ts().slice(0, 10), u.barangay);
    db.prepare('INSERT INTO notifs(brgy,text,time) VALUES(?,?,?)').run(u.barangay, `Brgy Staff (${u.username}) submitted ${drafts.length} household form${drafts.length > 1 ? 's' : ''} for review.`, ts());
  })();
  log(u, 'Activity', `Submitted ${drafts.length} household form(s) to Barangay`); res.json({ submitted: drafts.length });
});
app.post('/api/households', auth, STAFF, (req, res) => {
  const v = hhFields(req.body || {}); if (v.error) return bad(res, v.error);
  const id = nextHHId(), d = v.d;
  db.prepare(`INSERT INTO households(id,head,barangay,address,members,income,occupation,education,housing,services,status,submitted_by,form_date)
    VALUES(?,?,?,?,?,?,?,?,?,?,'Draft',?,?)`).run(id, d.head, req.user.barangay, d.address, d.members, d.income, d.occupation, d.education, d.housing, d.services, req.user.username, ts().slice(0, 10));
  log(req.user, 'Activity', 'Added household ' + id); res.json({ id });
});
app.put('/api/households/:id', auth, STAFF, (req, res) => {
  const h = ownHH(req.params.id, req.user); if (!h) return bad(res, 'Household not found.', 404);
  if (!editable(h)) return bad(res, 'Only Draft or Returned forms can be modified.');
  const v = hhFields(req.body || {}); if (v.error) return bad(res, v.error); const d = v.d;
  db.prepare('UPDATE households SET head=?,address=?,members=?,income=?,occupation=?,education=?,housing=?,services=? WHERE id=?')
    .run(d.head, d.address, d.members, d.income, d.occupation, d.education, d.housing, d.services, h.id);
  log(req.user, 'Activity', 'Modified household ' + h.id); res.json({ ok: true });
});
app.delete('/api/households/:id', auth, STAFF, (req, res) => {
  const h = ownHH(req.params.id, req.user); if (!h) return bad(res, 'Household not found.', 404);
  if (!editable(h)) return bad(res, 'Only Draft or Returned forms can be removed.');
  db.prepare('DELETE FROM households WHERE id=?').run(h.id);
  log(req.user, 'Activity', 'Removed household ' + h.id); res.json({ ok: true });
});
app.put('/api/households/:id/geotag', auth, STAFF, (req, res) => {
  const h = ownHH(req.params.id, req.user); if (!h) return bad(res, 'Household not found.', 404);
  const lat = Number(req.body.lat), lng = Number(req.body.lng), src = str(req.body.src, 60) || 'Map pin';
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return bad(res, 'Invalid coordinates.');
  db.prepare('UPDATE households SET lat=?,lng=?,geo_src=?,geo_at=? WHERE id=?').run(lat, lng, src, ts(), h.id);
  log(req.user, 'Activity', `Geotagged household ${h.id} (${src})`); res.json({ ok: true });
});

/* ── BARANGAY: review / approve / return ── */
app.put('/api/households/:id/decision', auth, BRGY, (req, res) => {
  const h = ownHH(req.params.id, req.user); if (!h) return bad(res, 'Household not found.', 404);
  const st = req.body.status;
  if (!['Approved', 'Under Review', 'Returned'].includes(st)) return bad(res, 'Invalid status.');
  if (h.status === 'Draft') return bad(res, 'Draft forms have not been submitted yet.');
  const remarks = st === 'Returned' ? str(req.body.remarks, 300) : h.remarks;
  db.prepare('UPDATE households SET status=?,remarks=?,acted_by=?,acted_on=? WHERE id=?').run(st, remarks, req.user.username, ts(), h.id);
  log(req.user, 'Activity', `${st} household form ${h.id}`); res.json({ ok: true });
});
app.post('/api/notifications/read-all', auth, BRGY, (req, res) => {
  db.prepare('UPDATE notifs SET is_read=1 WHERE brgy=?').run(req.user.barangay); res.json({ ok: true });
});

/* ── misc ── */
app.get('/api/health', (req, res) => res.json({ ok: true, time: ts() }));
app.use('/api', (req, res) => bad(res, 'Not found.', 404));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return bad(res, 'Bad request body.');
  if (err.code === 404) return bad(res, err.message, 404);
  console.error(err); bad(res, 'Server error.', 500);
});
app.listen(PORT, () => console.log(`ComBaTy running → http://localhost:${PORT}`));