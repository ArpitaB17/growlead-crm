import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const STATUSES = ['New', 'Contacted', 'Interested', 'Converted', 'Lost'];
const SOURCES = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Event', 'Other'];
const EMPTY = { name: '', email: '', phone: '', company: '', source: 'Website', status: 'New' };

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <defs><linearGradient id="gl-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#6366f1" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient></defs>
      <rect width="32" height="32" rx="9" fill="url(#gl-grad)" />
      <path d="M8 21l5-5 4 3 7-8M19 11h5v5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Auth({ mode, onLogin }) {
  const signup = mode === 'signup';
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  useEffect(() => { setErr(''); setF({ name: '', email: '', password: '', confirm: '' }); }, [mode]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (signup && f.password !== f.confirm) return setErr('Passwords do not match');
    try {
      const body = signup ? { name: f.name, email: f.email, password: f.password } : { email: f.email, password: f.password };
      onLogin(await api(signup ? '/auth/register' : '/auth/login', { method: 'POST', body }));
    } catch (x) { setErr(x.message); }
  };
  return (
    <div className="login"><form className="card" onSubmit={submit}>
      <div className="brand auth-brand"><Logo /><span>GrowLead</span></div>
      <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p className="muted">{signup ? 'Start tracking and converting your leads' : 'Sign in to manage your leads'}</p>
      {err && <div className="alert">{err}</div>}
      {signup && <input placeholder="Full name" value={f.name} onChange={set('name')} required />}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password" value={f.password} onChange={set('password')} required minLength={signup ? 6 : undefined} />
      {signup && <input type="password" placeholder="Confirm password" value={f.confirm} onChange={set('confirm')} required />}
      <button className="btn">{signup ? 'Create Account' : 'Login'}</button>
      <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
        {signup ? 'Already have an account?' : "Don't have an account?"}{' '}
        <a className="link" href={signup ? '#/login' : '#/signup'}>{signup ? 'Sign in' : 'Create account'}</a>
      </p>
    </form></div>
  );
}

function Dashboard({ token, user, logout }) {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({ q: '', status: '', source: '' });
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [menu, setMenu] = useState(false);
  const [active, setActive] = useState('overview');

  const handle = useCallback((e) => { if (e.status === 401) logout(); else setMsg(e.message); }, [logout]);

  const load = useCallback(async () => {
    const p = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    try {
      const [l, s] = await Promise.all([api(`/leads?${p}`, { token }), api('/leads/stats', { token })]);
      setLeads(l); setStats(s);
    } catch (e) { handle(e); }
  }, [filters, token, handle]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const go = (id) => {
    setActive(id); setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (id === 'add-lead') setTimeout(() => document.getElementById('f-name')?.focus(), 400);
  };
  const submit = async (e) => {
    e.preventDefault(); setErrors({}); setMsg('');
    try {
      await api(editId ? `/leads/${editId}` : '/leads', { method: editId ? 'PUT' : 'POST', body: form, token });
      setForm(EMPTY); setEditId(null); load();
    } catch (x) { x.errors ? setErrors(x.errors) : handle(x); }
  };
  const setStatus = async (id, status) => { try { await api(`/leads/${id}`, { method: 'PUT', body: { status }, token }); load(); } catch (x) { handle(x); } };
  const remove = async (id) => { if (!confirm('Delete this lead?')) return; try { await api(`/leads/${id}`, { method: 'DELETE', token }); load(); } catch (x) { handle(x); } };
  const edit = (l) => { setEditId(l._id); setForm({ name: l.name, email: l.email, phone: l.phone, company: l.company, source: l.source, status: l.status }); go('add-lead'); };

  const field = (k, label, type = 'text') => (
    <label>{label}<input id={`f-${k}`} type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      {errors[k] && <span className="err">{errors[k]}</span>}</label>
  );
  const cards = [['Total Leads', stats.total], ['New', stats.New], ['Contacted', stats.Contacted], ['Converted', stats.Converted]];

  const hr = new Date().getHours();
  const hello = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const full = user?.name || user?.email?.split('@')[0] || 'there';
  const first = full.split(' ')[0].replace(/^./, (c) => c.toUpperCase());
  const nav = [['overview', '📊', 'Dashboard'], ['add-lead', '➕', 'Add Lead'], ['leads', '👥', 'All Leads']];

  return (
    <div className="app">
      <div className={`overlay ${menu ? 'show' : ''}`} onClick={() => setMenu(false)} />
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand"><Logo /><span>GrowLead</span></div>
        <nav className="nav">
          <div className="nav-label">Menu</div>
          {nav.map(([id, icon, label]) => (
            <button key={id} className={`nav-item ${active === id ? 'active' : ''}`} onClick={() => go(id)}>
              <span>{icon}</span>{label}{id === 'leads' && <span className="count">{stats.total ?? 0}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user">
            <div className="avatar">{first[0]}</div>
            <div className="user-info"><strong>{full}</strong><span>{user?.email}</span></div>
          </div>
          <button className="btn ghost" onClick={logout}>Logout</button>
        </div>
      </aside>

      <div className="content">
        <div className="topbar">
          <button className="menu-btn" aria-label="Open menu" onClick={() => setMenu(true)}>☰</button>
          <div className="greet"><h2>{hello}, {first} 👋</h2><p className="muted">Here’s what’s happening with your leads today.</p></div>
        </div>
        <main>
          {msg && <div className="alert">{msg}</div>}
          <section id="overview" className="stats">{cards.map(([t, n]) => <div className="card stat" key={t}><span className="muted">{t}</span><strong>{n ?? 0}</strong></div>)}</section>

          <form id="add-lead" className="card form" onSubmit={submit}>
            <h2>{editId ? 'Edit Lead' : 'Add New Lead'}</h2>
            <div className="grid">
              {field('name', 'Full Name')}{field('email', 'Email', 'email')}{field('phone', 'Phone')}{field('company', 'Company')}
              <label>Source<select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></label>
              <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
            </div>
            <div className="row"><button className="btn">{editId ? 'Update Lead' : 'Add Lead'}</button>
              {editId && <button type="button" className="btn ghost" onClick={() => { setEditId(null); setForm(EMPTY); setErrors({}); }}>Cancel</button>}</div>
          </form>

          <section id="leads" className="card">
            <div className="filters">
              <input placeholder="Search name, email, company, phone…" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
              <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}><option value="">All sources</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div className="scroll"><table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Source</th><th>Status</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l._id}><td>{l.name}</td><td>{l.email}</td><td>{l.phone}</td><td>{l.company}</td><td>{l.source}</td>
                    <td><select className={`badge ${l.status}`} value={l.status} onChange={(e) => setStatus(l._id, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
                    <td>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td className="actions"><button className="link" onClick={() => edit(l)}>Edit</button><button className="link danger" onClick={() => remove(l._id)}>Delete</button></td></tr>
                ))}
                {!leads.length && <tr><td colSpan="8" className="muted center">No leads found</td></tr>}
              </tbody></table></div>
          </section>
        </main>
      </div>
    </div>
  );
}

const readUser = (token) => {
  try { const u = JSON.parse(localStorage.getItem('user')); if (u) return u; } catch { /* ignore */ }
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => (localStorage.getItem('token') ? readUser(localStorage.getItem('token')) : null));
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => { const h = () => setRoute(window.location.hash); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  const login = (d) => {
    const u = { name: d.name, email: d.email };
    localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(u));
    setToken(d.token); setUser(u); setRoute('');
    window.history.replaceState(null, '', window.location.pathname);
  };
  const logout = useCallback(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setToken(null); setUser(null); }, []);
  return token ? <Dashboard token={token} user={user} logout={logout} />
    : <Auth mode={route === '#/signup' ? 'signup' : 'login'} onLogin={login} />;
}
