// Private Paralegal — client side. One flow: paste contract -> review card.
const contractEl = document.getElementById("contract");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

function esc(s) {
  return String(s || "").replace(/</g, "&lt;");
}

function list(el, items) {
  el.innerHTML = (items || []).map((s) => "<li>" + esc(s) + "</li>").join("") || "<li>None found.</li>";
}

document.getElementById("review").addEventListener("click", async () => {
  const contract = contractEl.value.trim();
  if (!contract) { statusEl.textContent = "Paste a contract first."; return; }
  statusEl.textContent = "SERV Reasoning is reviewing it...";
  resultEl.style.display = "none";
  try {
    const r = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract }),
    });
    const data = await r.json();
    if (!r.ok) { statusEl.textContent = data.error || ("Review failed (" + r.status + ")."); return; }
    statusEl.textContent = "";
    document.getElementById("summary").textContent = data.summary || "";
    document.getElementById("type").textContent = data.type || "not stated";
    document.getElementById("dates").textContent = data.dates || "not stated";
    document.getElementById("payment").textContent = data.payment || "not stated";
    document.getElementById("obligations").textContent = data.obligations || "not stated";
    list(document.getElementById("risks"), data.risks);
    list(document.getElementById("missing"), data.missing);
    list(document.getElementById("steps"), data.steps);
    document.getElementById("warning").textContent = data.warning || "";
    document.getElementById("model").textContent = "Reviewed with SERV Reasoning (" + (data.model || "") + "). General information only, not legal advice.";
    resultEl.style.display = "block";
  } catch (e) {
    statusEl.textContent = "Could not reach the server: " + e.message;
  }
});
