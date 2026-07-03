/* ============================================================
   home.js · 用户主页逻辑
   ============================================================ */
(function () {
  if (!Auth.isLoggedIn()) {
    location.href = "/";
    return;
  }

  const $ = (id) => document.getElementById(id);
  const user = Auth.user();

  async function loadProfile() {
    try {
      const p = await api("/api/auth/profile");
      $("homeName").textContent = p.username;
      $("homeAvatar").textContent = (p.username || "U").charAt(0).toUpperCase();
      $("fUsername").textContent = p.username;
      $("fEmail").textContent = p.email;
      $("fRole").innerHTML = p.role === "admin"
        ? '<span class="badge amber">管理员</span>'
        : '<span class="badge grey">普通用户</span>';
      $("fCreated").textContent = p.created_at || "-";
    } catch (err) {
      toast(err.message, "err");
      if (err.code === 401 || err.code === 403) {
        setTimeout(() => { Auth.clear(); location.href = "/"; }, 1200);
      }
    }
  }

  $("logoutBtn").addEventListener("click", logout);

  // 管理员提供快速进入后台入口
  if (user && user.role === "admin") {
    const btn = document.createElement("button");
    btn.className = "btn btn-primary btn-block";
    btn.style.marginBottom = "12px";
    btn.textContent = "进入管理后台";
    btn.addEventListener("click", () => location.href = "/admin");
    $("logoutBtn").before(btn);
  }

  loadProfile();
})();
