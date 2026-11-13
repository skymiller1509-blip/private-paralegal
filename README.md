# Private Paralegal

One flow: paste a contract, SERV Reasoning reviews it step by step, you get a plain-words review with the risks flagged and the working shown.

Built for freelancers who sign contracts alone.

## How it works

- The page is a plain static site (`index.html` + `app.js`).
- The browser never sees the API key. The server (`server.js`, zero dependencies) sends the contract to SERV Reasoning at `https://inference-api.openserv.ai/v1/chat/completions` (OpenAI-compatible chat completions, model `claude-haiku-4.5` by default, key from `SERV_API_KEY`).
- SERV Reasoning is the whole reviewer: the system prompt makes it work through a fixed checklist (type and parties, key dates, payment terms, obligations, risks, missing items) and answer as JSON. The reasoning steps are shown on screen. Auditable steps are what SERV sells, so they are the visible feature.
- Model choice, checked live 13 Nov 2026: the SERV catalog no longer lists qwen or deepseek models, and `qwen3.6-flash` and `deepseek-v4-flash` both return "No pricing configured for model". The live catalog has 38 models (Claude, Gemini, GPT, SERV's own). `gpt-5.4-mini` answered a review with a bare refusal, and `gemini-3.5-flash` answered well once but returned empty risks on a second run. `claude-haiku-4.5` gave the fullest review in the live test (6 risks, 9 missing items, all four expected flags). Change it with `SERV_MODEL` if needed. Models answer in their own JSON shapes, so `server.js` reshapes any answer into the flat fields the page renders; nothing is invented, values only move.
- Honest limits (v1): the reviewer reads the contract you paste. It does not fetch outside data. If a fact is not in the contract, it says not stated. It is general information only, not legal advice. Your pasted contract is sent to the SERV Reasoning API for review only. It is not stored by this app. The API key stays on the server and never reaches the browser.

## Run it

```bash
cp .env.example .env   # then put your key in .env, or export SERV_API_KEY
SERV_API_KEY=your_key_here node server.js
# open http://localhost:4184
```

No build step, no dependencies, no database.

## Track

Open Track. Any domain, any stack, built on SERV Reasoning.

Note on Dolphin: Eddie named the Dolphin track. Dolphin partner docs are not on the OpenServ page, and SERV Reasoning sits in front of OpenAI, Anthropic, Google, plus open models like qwen and deepseek. The live catalog checked 13 Nov 2026 lists no open models, so this build does not run on an open model and does not prove a Dolphin Network call. Safe entry is Open Track. Enter Dolphin only if a Dolphin call is proven.

## Submission checklist

- [x] OpenServ account + SERV_API_KEY (console.openserv.ai; account created 13 Nov 2026 with eddiebrit4@gmail.com; key stored in the secure connector, never in chat; live review verified 13 Nov 2026)
- [ ] Public GitHub repo (Eddie creates it on his phone)
- [ ] Demo link or video (script in DEMO.md)
- [ ] Short write-up: what it does, how it uses SERV Reasoning, track = Open
- [ ] X post about the project by 15 Nov 23:59 UTC, link in the submission form
- [ ] Submit before 15 Nov 23:59 UTC (16 Nov 00:59 WAT)

## Revenue story

Freelancers pay a small subscription to review contracts before they sign. One review that catches a bad payment term or an IP grab pays for a year. That is the pitch, not a proven price. No payment code is in v1.
