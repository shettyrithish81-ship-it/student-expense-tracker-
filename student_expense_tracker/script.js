const categories = ["Food", "Travel", "Books", "College", "Shopping", "Other"];
const chartColors = ["#6874e8", "#25a889", "#f2ad55", "#e47e91", "#8a70c9", "#56a6c9"];

const form = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const expenseList = document.getElementById("expenseList");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const authPanel = document.getElementById("authPanel");
const accountBar = document.getElementById("accountBar");
const authForm = document.getElementById("authForm");

if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY ||
    window.SUPABASE_URL.includes("YOUR_PROJECT_ID") || window.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE")) {
  document.getElementById("authMessage").textContent = "Set your Supabase URL and publishable/anon key in supabase-config.js first.";
  throw new Error("Supabase configuration is missing.");
}

const db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
let expenses = [];
let currentUser = null;

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function showMessage(elementId, message) { document.getElementById(elementId).textContent = message || ""; }

async function loadExpenses() {
  if (!currentUser) { expenses = []; render(); return; }
  const { data, error } = await db.from("expenses").select("id,title,amount,category,date,created_at").eq("user_id", currentUser.id).order("date", { ascending: false }).order("created_at", { ascending: false });
  if (error) { alert(`Could not load expenses: ${error.message}`); return; }
  expenses = (data || []).map(item => ({ ...item, amount: Number(item.amount) }));
  render();
}
function render() { renderSummary(); renderExpenses(); renderChart(); }
function renderSummary() {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const now = new Date();
  const monthTotal = expenses.filter(item => {
    const d = new Date(`${item.date}T00:00:00`);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, item) => sum + item.amount, 0);
  document.getElementById("totalAmount").textContent = money(total);
  document.getElementById("monthAmount").textContent = money(monthTotal);
  document.getElementById("transactionCount").textContent = expenses.length;
}
function renderExpenses() {
  const search = searchInput.value.trim().toLowerCase();
  const selectedCategory = filterCategory.value;
  const visible = expenses.filter(item => item.title.toLowerCase().includes(search))
    .filter(item => selectedCategory === "All" || item.category === selectedCategory);
  expenseList.innerHTML = "";
  if (!visible.length) {
    const row = document.createElement("tr"); const cell = document.createElement("td");
    cell.colSpan = 5; cell.className = "empty-state";
    cell.textContent = expenses.length ? "No matching expenses found." : "No expenses yet. Add your first expense above.";
    row.appendChild(cell); expenseList.appendChild(row);
  } else visible.forEach(item => {
    const row = document.createElement("tr");
    const name = document.createElement("td"); name.textContent = item.title;
    const category = document.createElement("td"); const pill = document.createElement("span");
    pill.className = "category-pill"; pill.textContent = item.category; category.appendChild(pill);
    const date = document.createElement("td"); date.textContent = formatDate(item.date);
    const amount = document.createElement("td"); amount.className = "amount-cell"; amount.textContent = money(item.amount);
    const action = document.createElement("td"); const remove = document.createElement("button");
    remove.className = "delete-button"; remove.type = "button"; remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${item.title}`); remove.addEventListener("click", () => deleteExpense(item.id));
    action.appendChild(remove); row.append(name, category, date, amount, action); expenseList.appendChild(row);
  });
  document.getElementById("shownCount").textContent = `Showing ${visible.length} of ${expenses.length} expenses`;
}
function renderChart() {
  const totals = categories.map(category => expenses.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0));
  const grandTotal = totals.reduce((sum, value) => sum + value, 0);
  const chart = document.getElementById("categoryChart"); const legend = document.getElementById("categoryLegend"); legend.innerHTML = "";
  if (grandTotal === 0) { chart.innerHTML = '<p class="empty-state">Add an expense to see your category breakdown.</p>'; return; }
  let current = 0;
  const segments = totals.map((value, index) => { const start = current; current += (value / grandTotal) * 100; return `${chartColors[index]} ${start}% ${current}%`; });
  chart.innerHTML = ""; const donut = document.createElement("div"); donut.className = "donut"; donut.style.background = `conic-gradient(${segments.join(", ")})`;
  const center = document.createElement("div"); center.className = "donut-total"; const totalText = document.createElement("span"); totalText.textContent = money(grandTotal);
  const caption = document.createElement("small"); caption.textContent = "TOTAL SPENT"; center.append(totalText, caption); donut.appendChild(center); chart.appendChild(donut);
  categories.forEach((category, index) => { if (totals[index] <= 0) return; const item = document.createElement("span"); item.className = "legend-item";
    const dot = document.createElement("i"); dot.className = "legend-dot"; dot.style.background = chartColors[index];
    const label = document.createElement("span"); label.textContent = `${category} (${Math.round(totals[index] / grandTotal * 100)}%)`;
    item.append(dot, label); legend.appendChild(item);
  });
}
async function deleteExpense(id) {
  const { error } = await db.from("expenses").delete().eq("id", id).eq("user_id", currentUser.id);
  if (error) { alert(`Could not delete expense: ${error.message}`); return; }
  await loadExpenses();
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentUser) { showMessage("formMessage", "Please sign in first."); return; }
  const title = titleInput.value.trim(); const amount = Number(amountInput.value); const date = dateInput.value;
  if (!title || !Number.isFinite(amount) || amount <= 0 || !date) { showMessage("formMessage", "Please enter a valid name, amount and date."); return; }
  const { error } = await db.from("expenses").insert({ user_id: currentUser.id, title, amount: Math.round(amount * 100) / 100, category: categoryInput.value, date });
  if (error) { showMessage("formMessage", `Could not save expense: ${error.message}`); return; }
  await loadExpenses(); form.reset(); dateInput.value = localDateString(); showMessage("formMessage", "Expense saved to Supabase successfully."); titleInput.focus();
});
searchInput.addEventListener("input", renderExpenses);
filterCategory.addEventListener("change", renderExpenses);
document.getElementById("clearAll").addEventListener("click", async () => {
  if (!currentUser || expenses.length === 0) return;
  if (!confirm("Delete all your saved expenses? This cannot be undone.")) return;
  const { error } = await db.from("expenses").delete().eq("user_id", currentUser.id);
  if (error) { alert(`Could not clear expenses: ${error.message}`); return; }
  await loadExpenses();
});

authForm.addEventListener("submit", async event => {
  event.preventDefault();
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  showMessage("authMessage", "Signing in...");
  const { error } = await db.auth.signInWithPassword({ email, password });
  showMessage("authMessage", error ? error.message : "Signed in successfully.");
});
document.getElementById("signUpButton").addEventListener("click", async () => {
  const email = document.getElementById("authEmail").value.trim(); const password = document.getElementById("authPassword").value;
  if (!email || password.length < 6) { showMessage("authMessage", "Enter a valid email and a password of at least 6 characters."); return; }
  showMessage("authMessage", "Creating account...");
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) showMessage("authMessage", error.message);
  else if (data.session) showMessage("authMessage", "Account created and signed in.");
  else showMessage("authMessage", "Account created. Check your email to confirm, then sign in.");
});
document.getElementById("signOutButton").addEventListener("click", async () => {
  const { error } = await db.auth.signOut(); if (error) alert(error.message);
});

function updateAuthUI(user) {
  currentUser = user;
  authPanel.hidden = Boolean(user); accountBar.hidden = !user;
  document.getElementById("currentUser").textContent = user?.email || "";
  form.querySelectorAll("input, select, button").forEach(control => control.disabled = !user);
  document.getElementById("clearAll").disabled = !user;
  if (!user) { expenses = []; render(); }
}

document.getElementById("today").textContent = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
dateInput.value = localDateString();
updateAuthUI(null);
db.auth.getSession().then(async ({ data, error }) => {
  if (error) showMessage("authMessage", error.message);
  updateAuthUI(data.session?.user || null);
  if (currentUser) await loadExpenses();
});
db.auth.onAuthStateChange((_event, session) => {
  updateAuthUI(session?.user || null);
  if (currentUser) setTimeout(() => loadExpenses(), 0);
});
