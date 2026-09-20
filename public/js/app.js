const TOKEN_KEY = "ems_jwt";
const USER_KEY = "ems_user";

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } }
function setSession(token, user) { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); }
function clearSession() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[char]));
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, { ...options, headers });
  let data = {};
  try { data = await response.json(); } catch {}
  if (response.status === 401) {
    clearSession();
    if (!location.pathname.endsWith("index.html") && location.pathname !== "/") location.href = "/";
    throw new Error(data.message || "Session expired. Please login again.");
  }
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  container.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

function requireSession() {
  if (!getToken() || !getUser()) { location.href = "/"; return null; }
  return getUser();
}

function logout() { clearSession(); location.href = "/"; }

function bindNavbar(user) {
  const email = document.getElementById("user-email");
  if (email) email.textContent = user.email;
  document.getElementById("logout-button")?.addEventListener("click", logout);
  const auditLink = document.getElementById("audit-link");
  if (auditLink && user.role === "admin") auditLink.classList.remove("hidden");
}

function formatSalary(value) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function validateEmployee(form) {
  const required = ["employee-name","employee-email","employee-phone","employee-department","employee-position","employee-salary","employee-join-date"];
  for (const id of required) {
    const el = document.getElementById(id);
    if (!el.value.trim()) return "Please fill in all required fields.";
  }
  const email = document.getElementById("employee-email").value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address.";
  const salary = Number(document.getElementById("employee-salary").value);
  if (!Number.isFinite(salary) || salary <= 0) return "Salary must be greater than 0.";
  return "";
}

function openEmployeeModal(employee = null) {
  const modal = document.getElementById("employee-modal");
  const form = document.getElementById("employee-form");
  if (!modal || !form) return;
  form.reset();
  document.getElementById("employee-id").value = employee?._id || "";
  document.getElementById("modal-title").textContent = employee ? "Edit Employee" : "Add Employee";
  document.getElementById("save-employee-button").textContent = employee ? "Save Changes" : "Save Employee";
  if (employee) {
    document.getElementById("employee-name").value = employee.name || "";
    document.getElementById("employee-email").value = employee.email || "";
    document.getElementById("employee-phone").value = employee.phone || "";
    document.getElementById("employee-department").value = employee.department || "";
    document.getElementById("employee-position").value = employee.position || "";
    document.getElementById("employee-salary").value = employee.salary ?? "";
    document.getElementById("employee-join-date").value = employee.joinDate ? new Date(employee.joinDate).toISOString().slice(0,10) : "";
    document.getElementById("employee-status").value = employee.status || "active";
  }
  document.getElementById("form-error").classList.add("hidden");
  modal.classList.remove("hidden");
  document.getElementById("employee-name").focus();
}

function closeEmployeeModal() { document.getElementById("employee-modal")?.classList.add("hidden"); }

async function loadEmployees() {
  const body = document.getElementById("employee-table-body");
  const empty = document.getElementById("empty-state");
  const error = document.getElementById("table-error");
  if (!body) return;
  error.classList.add("hidden");
  body.innerHTML = '<tr><td colspan="7" class="muted">Loading employees...</td></tr>';
  try {
    const data = await api("/api/employees");
    body.innerHTML = "";
    document.getElementById("employee-count").textContent = `${data.count} employee${data.count === 1 ? "" : "s"}`;
    empty.classList.toggle("hidden", data.count !== 0);
    if (!data.count) return;
    const user = getUser();
    for (const employee of data.employees) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>${escapeHtml(employee.name)}</strong><br><span class="muted">${escapeHtml(formatDate(employee.joinDate))}</span></td>
        <td>${escapeHtml(employee.email)}</td>
        <td>${escapeHtml(employee.department)}</td>
        <td>${escapeHtml(employee.position)}</td>
        <td>${escapeHtml(formatSalary(employee.salary))}</td>
        <td><span class="status ${escapeHtml(employee.status)}">${escapeHtml(employee.status)}</span></td>
        <td class="action-cell"><div class="row-actions">
          ${user.role === "admin" ? '<button class="btn small secondary edit-btn">Edit</button><button class="btn small danger delete-btn">Delete</button>' : '<span class="muted">Read only</span>'}
        </div></td>`;
      if (user.role === "admin") {
        row.querySelector(".edit-btn").addEventListener("click", () => openEmployeeModal(employee));
        row.querySelector(".delete-btn").addEventListener("click", () => deleteEmployee(employee));
      }
      body.appendChild(row);
    }
  } catch (errorValue) {
    body.innerHTML = "";
    error.textContent = errorValue.message;
    error.classList.remove("hidden");
    showToast(errorValue.message, "error");
  }
}

async function deleteEmployee(employee) {
  if (!confirm(`Delete employee "${employee.name}"? This action will create an immutable audit log.`)) return;
  try {
    await api(`/api/employees/${encodeURIComponent(employee._id)}`, { method: "DELETE" });
    showToast("Employee deleted and audit log recorded.");
    loadEmployees();
  } catch (error) { showToast(error.message, "error"); }
}

async function saveEmployee(event) {
  event.preventDefault();
  const formError = document.getElementById("form-error");
  const validationError = validateEmployee(event.currentTarget);
  if (validationError) {
    formError.textContent = validationError;
    formError.classList.remove("hidden");
    return;
  }
  const id = document.getElementById("employee-id").value;
  const payload = {
    name: document.getElementById("employee-name").value.trim(),
    email: document.getElementById("employee-email").value.trim(),
    phone: document.getElementById("employee-phone").value.trim(),
    department: document.getElementById("employee-department").value.trim(),
    position: document.getElementById("employee-position").value.trim(),
    salary: Number(document.getElementById("employee-salary").value),
    joinDate: document.getElementById("employee-join-date").value,
    status: document.getElementById("employee-status").value
  };
  const button = document.getElementById("save-employee-button");
  button.disabled = true;
  try {
    await api(id ? `/api/employees/${encodeURIComponent(id)}` : "/api/employees", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeEmployeeModal();
    showToast(id ? "Employee updated successfully." : "Employee created successfully.");
    loadEmployees();
  } catch (error) {
    formError.textContent = error.message;
    formError.classList.remove("hidden");
  } finally { button.disabled = false; }
}

async function initLoginPage() {
  if (getToken() && getUser()) { location.href = "/dashboard.html"; return; }
  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.add("hidden");
    const button = document.getElementById("login-button");
    button.disabled = true;
    try {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      if (!email || !password) throw new Error("Email and password are required.");
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setSession(data.token, data.user);
      location.href = "/dashboard.html";
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove("hidden");
    } finally { button.disabled = false; }
  });
}

async function initDashboardPage() {
  const user = requireSession();
  if (!user) return;
  bindNavbar(user);
  if (user.role !== "admin") document.getElementById("add-employee-button").classList.add("hidden");
  document.getElementById("add-employee-button").addEventListener("click", () => openEmployeeModal());
  document.getElementById("refresh-button").addEventListener("click", loadEmployees);
  document.getElementById("employee-form").addEventListener("submit", saveEmployee);
  document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeEmployeeModal));
  document.getElementById("employee-modal").addEventListener("click", (event) => { if (event.target.id === "employee-modal") closeEmployeeModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeEmployeeModal(); });
  await loadEmployees();
}

function renderAuditLog(log) {
  const performedBy = typeof log.performedBy === "object" ? (log.performedBy?.email || log.performedBy?.name || log.performedBy?._id) : log.performedBy;
  const employeeId = typeof log.employeeId === "object" ? (log.employeeId?.name ? `${log.employeeId.name} (${log.employeeId._id})` : log.employeeId?._id) : log.employeeId;
  return `<tr>
    <td><span class="audit-action ${escapeHtml(log.action)}">${escapeHtml(log.action)}</span></td>
    <td>${escapeHtml(new Date(log.timestamp).toLocaleString())}</td>
    <td>${escapeHtml(performedBy || "—")}</td>
    <td><code>${escapeHtml(employeeId || "—")}</code></td>
    <td class="json-cell"><pre>${escapeHtml(JSON.stringify(log.previousData, null, 2))}</pre></td>
  </tr>`;
}

async function loadAuditLogs() {
  const body = document.getElementById("audit-table-body");
  const empty = document.getElementById("logs-empty");
  const error = document.getElementById("logs-error");
  try {
    const data = await api("/api/audit-logs");
    document.getElementById("log-count").textContent = `${data.count} log${data.count === 1 ? "" : "s"}`;
    body.innerHTML = data.auditLogs.map(renderAuditLog).join("");
    empty.classList.toggle("hidden", data.count !== 0);
  } catch (errorValue) {
    error.textContent = errorValue.message;
    error.classList.remove("hidden");
    showToast(errorValue.message, "error");
  }
}

async function initAuditLogsPage() {
  const user = requireSession();
  if (!user) return;
  if (user.role !== "admin") { location.href = "/dashboard.html"; return; }
  bindNavbar(user);
  document.getElementById("refresh-logs").addEventListener("click", loadAuditLogs);
  await loadAuditLogs();
}

window.initLoginPage = initLoginPage;
window.initDashboardPage = initDashboardPage;
window.initAuditLogsPage = initAuditLogsPage;
