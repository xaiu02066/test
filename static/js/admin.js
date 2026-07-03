/* ============================================================
   admin.js · 管理后台逻辑
   ============================================================ */
(function () {
  // 鉴权：必须是管理员
  const user = Auth.user();
  if (!Auth.isLoggedIn() || !user || user.role !== "admin") {
    location.href = "/";
    return;
  }

  const $ = (id) => document.getElementById(id);
  const tbody = $("userTbody");
  const state = { page: 1, size: 10, total: 0, keyword: "", role: "", status: "" };

  /* ---------- 侧边用户信息 ---------- */
  $("sideName").textContent = user.username;
  $("sideAvatar").textContent = (user.username || "A").charAt(0).toUpperCase();

  /* ---------- 统计 ---------- */
  async function loadStats() {
    try {
      const s = await api("/api/stats");
      $("stTotal").textContent = s.total;
      $("stActive").textContent = s.active;
      $("stDisabled").textContent = s.disabled;
      $("stAdmins").textContent = s.admins;
    } catch (e) { /* 忽略 */ }
  }

  /* ---------- 用户列表 ---------- */
  async function loadUsers() {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty">加载中...</div></td></tr>`;
    try {
      const data = await api("/api/users", { query: {
        page: state.page, size: state.size,
        keyword: state.keyword, role: state.role, status: state.status,
      }});
      state.total = data.total;
      renderRows(data.list);
      renderPager();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty">${err.message}</div></td></tr>`;
    }
  }

  function renderRows(list) {
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        暂无用户数据</div></td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(u => {
      const initial = (u.username || "U").charAt(0).toUpperCase();
      const roleBadge = u.role === "admin"
        ? `<span class="badge amber">管理员</span>`
        : `<span class="badge grey">普通用户</span>`;
      const statusBadge = u.status
        ? `<span class="badge green">启用</span>`
        : `<span class="badge red">禁用</span>`;
      return `<tr data-id="${u.id}">
        <td class="col-id">#${u.id}</td>
        <td><div class="col-user">
          <div class="avatar">${initial}</div>
          <div><div class="u-name">${escapeHtml(u.username)}</div><div class="u-mail">${escapeHtml(u.email)}</div></div>
        </div></td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td class="col-id">${u.created_at || "-"}</td>
        <td><div class="row-actions">
          <button class="btn-icon" title="编辑" data-act="edit"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn-icon" title="${u.status ? "禁用" : "启用"}" data-act="toggle"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${u.status ? '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>' : '<path d="M5.64 18.36a9 9 0 1 1 12.73 0"/><line x1="12" y1="22" x2="12" y2="12"/>'}</svg></button>
          <button class="btn-icon danger" title="删除" data-act="del"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div></td>
      </tr>`;
    }).join("");
  }

  function renderPager() {
    const from = state.total === 0 ? 0 : (state.page - 1) * state.size + 1;
    const to = Math.min(state.page * state.size, state.total);
    $("pagerInfo").textContent = `${from}-${to} / 共 ${state.total} 条`;
    const pages = Math.max(1, Math.ceil(state.total / state.size));
    $("prevBtn").disabled = state.page <= 1;
    $("nextBtn").disabled = state.page >= pages;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- 行操作（事件委托） ---------- */
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const tr = btn.closest("tr");
    const id = Number(tr.dataset.id);
    const act = btn.dataset.act;
    if (act === "edit") {
      openEdit(id);
    } else if (act === "toggle") {
      const row = await getUser(id);
      if (!row) return;
      const next = row.status ? 0 : 1;
      try {
        await api(`/api/users/${id}/status`, { method: "PATCH", body: { status: next } });
        toast(next ? "已启用" : "已禁用");
        loadStats();
        loadUsers();
      } catch (err) { toast(err.message, "err"); }
    } else if (act === "del") {
      if (!confirm("确定删除该用户？此操作不可恢复。")) return;
      try {
        await api(`/api/users/${id}`, { method: "DELETE" });
        toast("已删除");
        if (state.page > 1 && tbody.querySelectorAll("tr").length === 1) state.page--;
        loadStats();
        loadUsers();
      } catch (err) { toast(err.message, "err"); }
    }
  });

  async function getUser(id) {
    try { return await api(`/api/users/${id}`); }
    catch (err) { toast(err.message, "err"); return null; }
  }

  /* ---------- 弹窗（新增/编辑） ---------- */
  const modalMask = $("modalMask");
  const userForm = $("userForm");

  function openModal(isEdit) {
    $("modalTitle").textContent = isEdit ? "编辑用户" : "新增用户";
    $("modalSub").textContent = isEdit ? "修改用户信息，密码留空则不更新" : "填写以下信息创建新用户";
    $("pwdField").style.display = isEdit ? "" : "";
    userForm.querySelector('[name="password"]').placeholder = isEdit ? "留空则不修改" : "至少 6 位";
    modalMask.classList.add("show");
  }
  function closeModal() {
    modalMask.classList.remove("show");
    userForm.reset();
    userForm.querySelectorAll(".field-hint").forEach(h => h.textContent = "");
    userForm.querySelectorAll(".input").forEach(i => i.classList.remove("err"));
  }
  $("addBtn").addEventListener("click", () => {
    userForm.id.value = "";
    userForm.querySelector('[name="role"][value="user"]').checked = true;
    userForm.querySelector('[name="status"][value="1"]').checked = true;
    openModal(false);
  });
  $("cancelBtn").addEventListener("click", closeModal);
  modalMask.addEventListener("click", (e) => { if (e.target === modalMask) closeModal(); });

  async function openEdit(id) {
    const row = await getUser(id);
    if (!row) return;
    userForm.id.value = row.id;
    userForm.username.value = row.username;
    userForm.email.value = row.email;
    userForm.password.value = "";
    userForm.querySelector(`[name="role"][value="${row.role}"]`).checked = true;
    userForm.querySelector(`[name="status"][value="${row.status}"]`).checked = true;
    openModal(true);
  }

  userForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = userForm.id.value;
    const payload = {
      username: userForm.username.value.trim(),
      email: userForm.email.value.trim(),
      role: userForm.querySelector('[name="role"]:checked').value,
      status: Number(userForm.querySelector('[name="status"]:checked').value),
    };
    const password = userForm.password.value;
    // 校验
    let ok = true;
    const setErr = (name, msg) => {
      const input = userForm.querySelector(`[name="${name}"]`);
      const hint = input.parentElement.querySelector(".field-hint");
      input.classList.add("err"); hint.textContent = msg; ok = false;
    };
    userForm.querySelectorAll(".input").forEach(i => i.classList.remove("err"));
    userForm.querySelectorAll(".field-hint").forEach(h => h.textContent = "");
    if (payload.username.length < 3 || payload.username.length > 20) setErr("username", "用户名长度需为 3-20 位");
    if (!/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(payload.email)) setErr("email", "邮箱格式不正确");
    if (!id && password.length < 6) setErr("password", "密码至少 6 位");
    if (id && password && password.length < 6) setErr("password", "密码至少 6 位");
    if (!ok) return;

    if (password) payload.password = password;
    const btn = userForm.querySelector("button[type=submit]");
    setLoading(btn, true);
    try {
      if (id) {
        await api(`/api/users/${id}`, { method: "PUT", body: payload });
        toast("更新成功");
      } else {
        await api("/api/users", { method: "POST", body: payload });
        toast("创建成功");
      }
      closeModal();
      loadStats();
      loadUsers();
    } catch (err) {
      toast(err.message, "err");
    } finally {
      setLoading(btn, false);
    }
  });

  /* ---------- 工具栏 ---------- */
  let searchTimer = null;
  $("keyword").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.keyword = e.target.value.trim();
      state.page = 1;
      loadUsers();
    }, 300);
  });
  $("roleFilter").addEventListener("change", (e) => { state.role = e.target.value; state.page = 1; loadUsers(); });
  $("statusFilter").addEventListener("change", (e) => { state.status = e.target.value; state.page = 1; loadUsers(); });
  $("prevBtn").addEventListener("click", () => { if (state.page > 1) { state.page--; loadUsers(); } });
  $("nextBtn").addEventListener("click", () => { state.page++; loadUsers(); });
  $("refreshBtn").addEventListener("click", () => { loadStats(); loadUsers(); });
  $("logoutBtn").addEventListener("click", logout);

  /* ---------- 初始化 ---------- */
  loadStats();
  loadUsers();
})();
