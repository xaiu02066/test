/* ============================================================
   app.js · 共享工具 + 登录/注册页逻辑
   ============================================================ */

/* ---------- Token / 用户存储 ---------- */
const TOKEN_KEY = "uv_token";
const USER_KEY = "uv_user";

const Auth = {
  token: () => localStorage.getItem(TOKEN_KEY),
  user: () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
    catch { return null; }
  },
  save(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isLoggedIn() { return !!this.token(); },
};

/* ---------- API 封装 ---------- */
async function api(path, { method = "GET", body, auth = true, query } = {}) {
  const opts = { method, headers: {} };
  if (body !== undefined) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  if (auth && Auth.token()) {
    opts.headers["Authorization"] = "Bearer " + Auth.token();
  }
  let url = path;
  if (query) {
    const qs = new URLSearchParams(query).toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    throw { code: -1, message: "网络请求失败，请检查服务是否启动" };
  }
  let data = null;
  try { data = await res.json(); } catch { /* 非 JSON */ }
  if (!res.ok) {
    const msg = (data && data.message) || `请求失败 (${res.status})`;
    const err = { code: res.status, message: msg, data: data && data.data };
    if (res.status === 401) {
      Auth.clear();
      if (!location.pathname.startsWith("/")) {}
      if (location.pathname !== "/" && !location.pathname.endsWith("index.html")) {
        location.href = "/";
      }
    }
    throw err;
  }
  if (data && data.code !== 0) {
    throw { code: data.code, message: data.message || "操作失败", data: data.data };
  }
  return data ? data.data : null;
}

/* ---------- Toast ---------- */
function toast(message, type = "ok", timeout = 2600) {
  const wrap = document.getElementById("toastWrap");
  if (!wrap) { alert(message); return; }
  const el = document.createElement("div");
  el.className = "toast " + type;
  const iconOk = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>`;
  const iconErr = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  el.innerHTML = (type === "err" ? iconErr : iconOk) + `<span>${message}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add("fade"); setTimeout(() => el.remove(), 300); }, timeout);
}

function logout() {
  Auth.clear();
  location.href = "/";
}

/* ---------- 登录/注册页逻辑 ---------- */
(function initAuthPage() {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (!loginForm && !registerForm) return;

  // 已登录则按角色跳转
  if (Auth.isLoggedIn()) {
    const u = Auth.user();
    location.href = u && u.role === "admin" ? "/admin" : "/home";
    return;
  }

  // Tab 切换
  const tabs = document.querySelectorAll(".auth-tab");
  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    const tab = t.dataset.tab;
    loginForm.classList.toggle("active", tab === "login");
    registerForm.classList.toggle("active", tab === "register");
    clearHints([loginForm, registerForm]);
  }));

  function setHint(form, name, msg) {
    const input = form.querySelector(`[name="${name}"]`);
    const hint = input ? input.parentElement.querySelector(".field-hint") : null;
    if (input) input.classList.toggle("err", !!msg);
    if (hint) hint.textContent = msg || "";
  }
  function clearHints(forms) {
    forms.forEach(f => {
      f.querySelectorAll(".input").forEach(i => i.classList.remove("err"));
      f.querySelectorAll(".field-hint").forEach(h => h.textContent = "");
    });
  }

  /* 登录 */
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearHints([loginForm]);
    const account = loginForm.account.value.trim();
    const password = loginForm.password.value;
    if (!account) return setHint(loginForm, "account", "请输入用户名或邮箱");
    if (!password) return setHint(loginForm, "password", "请输入密码");
    const btn = loginForm.querySelector("button[type=submit]");
    setLoading(btn, true);
    try {
      const data = await api("/api/auth/login", { method: "POST", auth: false, body: { account, password } });
      Auth.save(data.token, data.user);
      toast("登录成功");
      setTimeout(() => {
        location.href = data.user.role === "admin" ? "/admin" : "/home";
      }, 400);
    } catch (err) {
      toast(err.message, "err");
    } finally {
      setLoading(btn, false);
    }
  });

  /* 注册 */
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearHints([registerForm]);
    const username = registerForm.username.value.trim();
    const email = registerForm.email.value.trim();
    const password = registerForm.password.value;
    const confirm = registerForm.confirm.value;
    if (username.length < 3 || username.length > 20) return setHint(registerForm, "username", "用户名长度需为 3-20 位");
    if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(email)) return setHint(registerForm, "email", "邮箱格式不正确");
    if (password.length < 6) return setHint(registerForm, "password", "密码至少 6 位");
    if (password !== confirm) return setHint(registerForm, "confirm", "两次密码不一致");
    const btn = registerForm.querySelector("button[type=submit]");
    setLoading(btn, true);
    try {
      await api("/api/auth/register", { method: "POST", auth: false, body: { username, email, password } });
      toast("注册成功，请登录");
      // 切到登录并预填
      document.querySelector('.auth-tab[data-tab="login"]').click();
      loginForm.account.value = username;
      loginForm.password.value = "";
      loginForm.password.focus();
    } catch (err) {
      toast(err.message, "err");
    } finally {
      setLoading(btn, false);
    }
  });
})();

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.text = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> 处理中...`;
  } else {
    btn.disabled = false;
    if (btn.dataset.text) btn.innerHTML = btn.dataset.text;
  }
}
