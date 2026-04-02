/* ============================================
   FOOD SAVER — app.js
   All JavaScript logic for the entire website
   ============================================ */

// ============================================
// STEP 4 & 6: AUTH SYSTEM + localStorage
// ============================================

const FoodSaver = {

  // ----- Storage Keys -----
  KEYS: {
    SESSION: 'fs_session',
    USERS:   'fs_users',
    FOODS:   'fs_foods',
  },

  // ----- Default Demo Users -----
  DEMO_USERS: [
    { id: 'u1', name: 'Rahul Sharma',    email: 'donor@demo.com',  password: 'demo123', role: 'donor' },
    { id: 'u2', name: 'Hope Foundation', email: 'ngo@demo.com',    password: 'demo123', role: 'ngo'   },
  ],

  // ----- Init -----
  init() {
    // Seed demo users if none exist
    if (!this.getUsers().length) {
      localStorage.setItem(this.KEYS.USERS, JSON.stringify(this.DEMO_USERS));
    }
    this.renderNav();
  },

  // ----- Session -----
  getSession()         { return JSON.parse(localStorage.getItem(this.KEYS.SESSION) || 'null'); },
  setSession(user)     { localStorage.setItem(this.KEYS.SESSION, JSON.stringify(user)); },
  clearSession()       { localStorage.removeItem(this.KEYS.SESSION); },
  isLoggedIn()         { return !!this.getSession(); },

  // ----- Users -----
  getUsers()           { return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]'); },
  saveUsers(users)     { localStorage.setItem(this.KEYS.USERS, JSON.stringify(users)); },

  // ----- Foods -----
  getFoods()           { return JSON.parse(localStorage.getItem(this.KEYS.FOODS) || '[]'); },
  saveFoods(foods)     { localStorage.setItem(this.KEYS.FOODS, JSON.stringify(foods)); },

  // ============================================
  // AUTH METHODS
  // ============================================

  login(email, password, role) {
    const users = this.getUsers();
    const user  = users.find(
      u => u.email === email.trim().toLowerCase()
        && u.password === password
        && u.role === role
    );
    if (!user) return { ok: false, error: 'Invalid email, password, or role.' };
    this.setSession(user);
    return { ok: true, user };
  },

  register(name, email, password, role) {
    const users = this.getUsers();
    if (users.find(u => u.email === email.trim().toLowerCase())) {
      return { ok: false, error: 'Email already registered.' };
    }
    const newUser = {
      id: 'u' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    };
    users.push(newUser);
    this.saveUsers(users);
    this.setSession(newUser);
    return { ok: true, user: newUser };
  },

  logout() {
    this.clearSession();
    window.location.href = 'index.html';
  },

  requireAuth(role) {
    const session = this.getSession();
    if (!session) { window.location.href = 'login.html'; return null; }
    if (role && session.role !== role) {
      showToast('Access denied for your role.', 'error');
      setTimeout(() => window.location.href = 'index.html', 1500);
      return null;
    }
    return session;
  },

  // ============================================
  // FOOD DONATION METHODS (Step 5–9)
  // ============================================

  addFood(data) {
    const foods = this.getFoods();
    const food = {
      id:          'f' + Date.now(),
      ...data,
      donorId:     this.getSession().id,
      donorName:   this.getSession().name,
      status:      'available',
      createdAt:   new Date().toISOString(),
    };
    foods.unshift(food); // newest first
    this.saveFoods(foods);
    return food;
  },

  deleteFood(id) {
    const session = this.getSession();
    let foods = this.getFoods();
    const food = foods.find(f => f.id === id);
    if (!food) return false;
    // Donor can delete own; NGO can delete any
    if (session.role === 'donor' && food.donorId !== session.id) return false;
    foods = foods.filter(f => f.id !== id);
    this.saveFoods(foods);
    return true;
  },

  claimFood(id) {
    const session = this.getSession();
    const foods = this.getFoods();
    const food = foods.find(f => f.id === id);
    if (!food || food.status !== 'available') return false;
    food.status     = 'claimed';
    food.claimedBy  = session.name;
    food.claimedAt  = new Date().toISOString();
    this.saveFoods(foods);
    return true;
  },

  getMyDonations() {
    const session = this.getSession();
    return this.getFoods().filter(f => f.donorId === session.id);
  },

  getStats() {
    const foods = this.getFoods();
    return {
      total:     foods.length,
      available: foods.filter(f => f.status === 'available').length,
      claimed:   foods.filter(f => f.status === 'claimed').length,
      donors:    [...new Set(foods.map(f => f.donorId))].length,
    };
  },

  // ============================================
  // NAVBAR RENDERER
  // ============================================

  renderNav() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const session = this.getSession();
    const page    = window.location.pathname.split('/').pop() || 'index.html';

    const isActive = (p) => page === p ? 'active' : '';

    let links = `
      <a href="index.html"    class="${isActive('index.html')}">Home</a>
      <a href="food-list.html" class="${isActive('food-list.html')}">Browse Food</a>
    `;

    if (session?.role === 'donor') {
      links += `<a href="donate.html" class="${isActive('donate.html')}">Donate</a>`;
    }

    let rightSide = '';
    if (session) {
      rightSide = `
        <div class="nav-user-badge">
          <span class="dot"></span>
          ${session.name} · ${session.role.toUpperCase()}
        </div>
        <button class="btn-logout" onclick="FoodSaver.logout()">Log Out</button>
      `;
    } else {
      rightSide = `
        <a href="login.html" class="btn btn-primary btn-sm">Sign In</a>
      `;
    }

    nav.innerHTML = `
      <a href="index.html" class="nav-logo">
        <div class="nav-logo-icon">🌿</div>
        Food<span>Saver</span>
      </a>
      <div class="nav-links">${links}</div>
      <div class="nav-links">${rightSide}</div>
    `;
  },

};

// ============================================
// UTILITY HELPERS
// ============================================

function showToast(msg, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast${type === 'error' ? ' error' : ''}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'error' ? '⚠️' : '✅'}</span>
    ${msg}
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function timeSince(iso) {
  const sec = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (sec < 60)   return 'Just now';
  if (sec < 3600) return Math.floor(sec / 60) + ' min ago';
  if (sec < 86400)return Math.floor(sec / 3600) + 'h ago';
  return Math.floor(sec / 86400) + 'd ago';
}

function getFoodEmoji(type) {
  const map = {
    cooked:    '🍛',
    raw:       '🥦',
    packaged:  '📦',
    fruits:    '🍎',
    baked:     '🍞',
    beverages: '🥤',
    other:     '🥡',
  };
  return map[type] || '🍽️';
}

// ============================================
// MODAL CONFIRM DIALOG
// ============================================

function showConfirm(title, msg, onConfirm) {
  let overlay = document.getElementById('confirm-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'confirm-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <h3 id="confirm-title"></h3>
        <p  id="confirm-msg"></p>
        <div class="modal-actions">
          <button class="btn btn-outline btn-sm" id="confirm-cancel">Cancel</button>
          <button class="btn btn-danger  btn-sm" id="confirm-ok">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.querySelector('#confirm-title').textContent = title;
  overlay.querySelector('#confirm-msg').textContent   = msg;
  overlay.classList.add('active');

  overlay.querySelector('#confirm-cancel').onclick = () => overlay.classList.remove('active');
  overlay.querySelector('#confirm-ok').onclick = () => {
    overlay.classList.remove('active');
    onConfirm();
  };
}

// ============================================
// AUTO-INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => FoodSaver.init());
