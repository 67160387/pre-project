const $ = (id) => document.getElementById(id);
const base = "/api/v1";
let editingId = null;
async function api(path, options) {
  const r = await fetch(base + path, options);
  if (r.status === 401) { location.replace("/login"); throw Error("กรุณาเข้าสู่ระบบอีกครั้ง"); }
  if (!r.ok) {
    let obj = {};
    try {
      obj = await r.json();
    } catch {}
    throw Error(obj.error?.message || `HTTP ${r.status}`);
  }
  return r.status === 204 ? null : r.json();
}
function showStatus(id, message, error = false) {
  const node = $(id);
  node.textContent = message;
  node.classList.toggle("error", error);
}
function renderGames(games) {
  $("games").replaceChildren();
  for (const g of games) {
    const card = document.createElement("div");
    card.className = "card";
    const title = document.createElement("h3");
    title.textContent = g.name;
    const info = document.createElement("p");
    info.className = "muted";
    info.textContent = `${g.minPlayers}–${g.maxPlayers} คน • ${g.playingTimeMinutes} นาที`;
    const info2 = document.createElement("p");
    info2.textContent = `${g.publisher} · ${g.category}`;
    const btn = document.createElement("button");
    btn.textContent = "ลบ";
    btn.addEventListener("click", async () => {
      if (btn.dataset.confirm !== "yes") {
        btn.dataset.confirm = "yes";
        btn.textContent = "ยืนยันลบ";
        return;
      }
      try {
        showStatus("status", "กำลังลบ...");
        await api("/games/" + g.id, { method: "DELETE" });
        if (editingId === g.id) resetForm();
        await loadGames();
      } catch (e) {
        showStatus("status", e.message, true);
      }
    });
    const edit = document.createElement("button");
    edit.textContent = "แก้ไข";
    edit.onclick = () => {
      editingId = g.id;
      for (const k of [
        "name",
        "minPlayers",
        "maxPlayers",
        "playingTimeMinutes",
        "publisherId",
        "categoryId",
      ])
        $("form").elements[k].value = g[k];
      $("formTitle").textContent = "แก้ไขบอร์ดเกม";
      $("cancel").hidden = false;
      $("form").elements.name.focus();
    };
    const detail = document.createElement("button");
    detail.textContent = "ข้อมูลเพิ่มเติม";
    const summary = document.createElement("p");
    summary.setAttribute("role", "status");
    detail.onclick = async () => {
      detail.disabled = true;
      summary.textContent = "กำลังค้นข้อมูล...";
      try {
        const r = await api("/games/" + g.id + "/background");
        summary.textContent = r.data.external.summary;
      } catch (e) {
        summary.textContent = e.message;
      } finally {
        detail.disabled = false;
      }
    };
    card.append(title, info, info2, edit, btn, detail, summary);
    $("games").append(card);
  }
}
async function loadGames() {
  showStatus("status", "Loading...");
  try {
    const response = await api("/games");
    renderGames(response.data);
    showStatus("status", `แสดง ${response.data.length} เกม`);
  } catch (e) {
    showStatus("status", "เกิดข้อผิดพลาด: " + e.message, true);
  }
}
async function loadOptions() {
  $("submit").disabled = true;
  showStatus("formStatus", "กำลังโหลดตัวเลือก...");
  try {
    const [pub, cat] = await Promise.all([
      api("/publishers"),
      api("/categories"),
    ]);
    for (const [name, values] of [
      ["publisherId", pub.data],
      ["categoryId", cat.data],
    ]) {
      const select = document.querySelector(`[name="${name}"]`);
      select.replaceChildren();
      for (const item of values) {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        select.append(option);
      }
    }
    $("submit").disabled = false;
    showStatus("formStatus", "");
  } catch (e) {
    showStatus("formStatus", "โหลดตัวเลือกไม่สำเร็จ: " + e.message, true);
  }
}
$("refresh").addEventListener("click", () => {
  loadGames();
  loadOptions();
});
function resetForm() {
  editingId = null;
  $("form").reset();
  $("formTitle").textContent = "เพิ่มบอร์ดเกม";
  $("cancel").hidden = true;
}
$("cancel").onclick = resetForm;
$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  if (!f.reportValidity()) return;
  const d = Object.fromEntries(new FormData(f));
  for (const key of [
    "minPlayers",
    "maxPlayers",
    "playingTimeMinutes",
    "publisherId",
    "categoryId",
  ])
    d[key] = Number(d[key]);
  d.name = d.name.trim();
  if (
    !d.name ||
    [
      "minPlayers",
      "maxPlayers",
      "playingTimeMinutes",
      "publisherId",
      "categoryId",
    ].some(
      (k) => !Number.isSafeInteger(d[k]) || d[k] < 1 || d[k] > 2147483647,
    ) ||
    d.maxPlayers < d.minPlayers
  ) {
    showStatus("formStatus", "จำนวนผู้เล่นสูงสุดต้องไม่ต่ำกว่าขั้นต่ำ", true);
    return;
  }
  const button = $("submit");
  button.disabled = true;
  showStatus("formStatus", "กำลังบันทึก...");
  try {
    await api("/games" + (editingId ? "/" + editingId : ""), {
      method: editingId ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(d),
    });
    showStatus("formStatus", "บันทึกบอร์ดเกมสำเร็จ");
    resetForm();
    await loadGames();
  } catch (err) {
    showStatus("formStatus", err.message, true);
  } finally {
    button.disabled = false;
  }
});
loadOptions();
loadGames();

$("logout").onclick = async () => {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw Error("ออกจากระบบไม่สำเร็จ");
    location.replace("/login");
  } catch (error) { showStatus("status", error.message, true); }
};
