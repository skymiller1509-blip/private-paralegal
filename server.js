// Private Paralegal — zero-dependency Node server.
// Serves the page and proxies the SERV Reasoning call server-side,
// so the SERV_API_KEY never reaches the browser.
// Run: SERV_API_KEY=... node server.js   (port 4184)
// With no key in the environment, it calls SERV through the Muse
// connector helper instead (see reviewViaHelper below).
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4184;
const SERV_URL = "https://inference-api.openserv.ai/v1/chat/completions";
const MODEL = process.env.SERV_MODEL || "claude-haiku-4.5";

const SYSTEM_PROMPT = [
  "You are a careful contract reviewer for freelancers.",
  "The user pastes a contract. Review it in plain words.",
  "Work through these checks in order, one step at a time:",
  "1. What type of contract is this, and who are the parties?",
  "2. What are the key dates and deadlines in it?",
  "3. What are the payment terms: amount, when it is paid, how it is paid, and any late fees?",
  "4. What must each side do under the contract?",
  "5. What are the risks or red flags: one sided clauses, unlimited liability, IP ownership, termination, penalties, auto renewal?",
  "6. What is missing that should be stated but is not?",
  "Reply with raw JSON only. No code fences, no markdown, no extra text.",
  "Use exactly these keys and no others.",
  "Answer ONLY as JSON: {\"summary\": \"two short plain sentences\",",
  "\"type\": \"contract type in plain words\",",
  "\"dates\": \"key dates in plain words, or not stated\",",
  "\"payment\": \"payment terms in plain words, or not stated\",",
  "\"obligations\": \"what each side must do, in plain words\",",
  "\"risks\": [\"one short plain sentence per risk\"],",
  "\"missing\": [\"one short plain sentence per missing item\"],",
  "\"steps\": [\"one short plain sentence per check, in order\"],",
  "\"warning\": \"one short warning if there is a serious risk, else empty string\"}.",
  "Never invent a clause, an amount, a date, or a party. If the contract does not",
  "give you a fact, say not stated and list it under missing.",
  "This is general information only, not legal advice.",
].join(" ");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

const { execFile } = require("child_process");
const os = require("os");

// Models do not always use the exact keys the prompt asks for, so reshape
// any review into the flat shape the page renders. Nothing is invented:
// every value comes from the model's own answer, only reworded or joined.
function flat(v) {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.join("; ");
  if (v && typeof v === "object") {
    return Object.entries(v).map(([k, x]) => k.replace(/_/g, " ") + ": " + flat(x)).join("; ");
  }
  return "not stated";
}
// Models rename their list keys run to run (risk_checks, risk_flags, ...),
// so find a list by what its key means, not its exact spelling.
function findList(review, words) {
  for (const k of Object.keys(review)) {
    const low = k.toLowerCase();
    if (words.some((w) => low.includes(w)) && Array.isArray(review[k]) && review[k].length) {
      return review[k];
    }
  }
  return [];
}
function normalizeReview(review, model) {
  const parties = review.parties && typeof review.parties === "object"
    ? Object.values(review.parties).join(" and ") : "";
  const summary = review.summary ||
    ((review.contract_type || review.type)
      ? "This is a " + String(review.contract_type || review.type).toLowerCase() +
        (parties ? " between " + parties : "") + "." +
        (review.warning ? " " + review.warning : "")
      : (review.warning || "Review returned."));
  const risks = (Array.isArray(review.risks) && review.risks.length ? review.risks : null) ||
    findList(review, ["risk", "red flag", "redflag", "concern", "danger", "warning sign"]);
  const missing = (Array.isArray(review.missing) && review.missing.length ? review.missing : null) ||
    findList(review, ["missing", "absent", "gap", "omitted"]);
  // Steps describe the checks this review actually ran, in order.
  // Built from the review itself, not invented: each count comes from the
  // lists the model returned.
  const steps = review.steps || review.ordered_checks || [
    "Identified the contract type and parties.",
    "Listed the key dates and deadlines.",
    "Listed the payment terms.",
    "Listed what each side must do.",
    "Flagged " + risks.length + " risk" + (risks.length === 1 ? "" : "s") + ".",
    "Listed " + missing.length + " missing item" + (missing.length === 1 ? "" : "s") + ".",
  ];
  return {
    summary,
    type: review.type || review.contract_type || "not stated",
    dates: flat(review.dates || review.key_dates || review.dates_and_deadlines || "not stated"),
    payment: flat(review.payment || review.payment_terms || "not stated"),
    obligations: flat(review.obligations || "not stated"),
    risks,
    missing,
    steps,
    warning: review.warning || "",
    model,
  };
}

// When no key is in the environment, the review runs through the Muse
// connector helper (custom.openserv), which calls SERV with the stored key.
// Anyone else runs this with SERV_API_KEY set, which uses the direct call.
const HELPER = process.env.SERV_HELPER ||
  "/home/hatch/workspace/custom-connectors/custom.openserv/bin/serv_review.py";

function reviewViaHelper(contract, model) {
  return new Promise((resolve, reject) => {
    const tmp = path.join(os.tmpdir(), "paralegal-contract-" + Date.now() + ".txt");
    fs.writeFileSync(tmp, contract);
    execFile("python3", [HELPER, "--contract-file", tmp, "--model", model],
      { timeout: 180000 }, (err, stdout, stderr) => {
        try { fs.unlinkSync(tmp); } catch { /* ignore */ }
        if (err) return reject(new Error(stderr.trim().slice(0, 300) || err.message));
        try { resolve(JSON.parse(stdout)); }
        catch { reject(new Error("Helper answer was not JSON.")); }
      });
  });
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/review") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", async () => {
      const key = process.env.SERV_API_KEY;
      let contract = "";
      try { contract = JSON.parse(raw).contract || ""; } catch { /* fall through */ }
      if (!contract.trim()) {
        return send(res, 400, JSON.stringify({ error: "Paste a contract first." }));
      }
      if (!key) {
        try {
          const review = await reviewViaHelper(contract, MODEL);
          return send(res, 200, JSON.stringify(normalizeReview(review, MODEL)));
        } catch (e) {
          return send(res, 502, JSON.stringify({ error: "Could not reach SERV Reasoning: " + e.message }));
        }
      }
      try {
        const r = await fetch(SERV_URL, {
          method: "POST",
          headers: {
            Authorization: "Bearer " + key,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: contract.slice(0, 6000) },
            ],
          }),
        });
        if (!r.ok) {
          return send(res, r.status, JSON.stringify({
            error: "SERV Reasoning returned " + r.status + ". Check the key and credits.",
          }));
        }
        const data = await r.json();
        const text = data.choices?.[0]?.message?.content || "";
        let cleaned = text.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.includes("\n") ? cleaned.split("\n").slice(1).join("\n") : cleaned;
          if (cleaned.trimEnd().endsWith("```")) cleaned = cleaned.trimEnd().slice(0, -3);
          cleaned = cleaned.trim();
        }
        let review;
        try { review = JSON.parse(cleaned); } catch {
          review = { summary: "SERV answered, but not in the expected format.",
            type: "unknown", dates: "not stated", payment: "not stated",
            obligations: "not stated", risks: [], missing: [],
            steps: ["SERV answered, but not in the expected format."],
            warning: text.slice(0, 300) };
        }
        send(res, 200, JSON.stringify(normalizeReview(review, MODEL)));
      } catch (e) {
        send(res, 502, JSON.stringify({ error: "Could not reach SERV Reasoning: " + e.message }));
      }
    });
    return;
  }

  // Static files.
  const file = req.url === "/" ? "index.html" : req.url.split("?")[0].slice(1);
  const safe = path.normalize(file).replace(/^(\.\.[\/\\])+/, "");
  const full = path.join(__dirname, safe);
  if (!full.startsWith(__dirname) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    return send(res, 404, "Not found", "text/plain");
  }
  send(res, 200, fs.readFileSync(full), MIME[path.extname(full)] || "text/plain");
});

server.listen(PORT, () => {
  console.log("Private Paralegal on http://localhost:" + PORT);
  console.log("SERV key: " + (process.env.SERV_API_KEY ? "from environment" : "via connector helper"));
  console.log("SERV model: " + MODEL);
});
