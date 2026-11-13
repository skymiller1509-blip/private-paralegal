# Private Paralegal — submission draft (prepared 2026-11-13, not yet submitted)

Status: scaffold built and verified 2026-11-12. Key landed 2026-11-13
(account eddiebrit4@gmail.com; key stored in the secure connector, never in
chat). Live test running 2026-11-13: the key works, the SERV catalog has 38
models (no qwen/deepseek; qwen3.6-flash and deepseek-v4-flash return "No
pricing configured"), gpt-5.4-mini refused a review, gemini-3.5-flash was
unsteady (empty risks on a rerun). Model picked: claude-haiku-4.5, fullest
live review (6 risks, 9 missing items, all four expected flags).

## After the key lands (Mabel's steps)
- Run a real review with the fake sample contract in DEMO.md through the
  connector helper (the key is held by the connector, so the server calls
  SERV through the helper when no key is in .env), check the verdict +
  reasoning steps show on the page.
- Record the ~2-minute demo video following DEMO.md.
- Eddie creates the public GitHub repo `private-paralegal` (same flow as
  plain-english-automations: create public repo, add it to the `mabel` token),
  Mabel pushes the code.
- X post (draft below), then submit with a full read-back before
  15 Nov 23:59 UTC = 16 Nov 00:59 WAT.

## Track
Open Track. (Eddie named Dolphin, but Dolphin partner docs are not on the
OpenServ page and no Dolphin Network call is proven, so the safe entry is Open
Track with an open model via SERV Reasoning.)

## Short write-up (for the submission form)
Private Paralegal is for freelancers who sign contracts alone. Paste a
contract, and SERV Reasoning (model claude-haiku-4.5) reviews it,
working through a fixed checklist — type and parties, key dates, payment
terms, what each side must do, risks, and what is missing — and showing every
reasoning step on screen, so the review can be audited instead of trusted
blind. It returns a plain-words review, not legal advice. The pasted contract
is sent to the SERV Reasoning API for review only and is not stored by the
app; the API key stays on the server and never reaches the browser. Revenue:
freelancers pay a small subscription to review contracts before they sign —
one review that catches a bad payment term or an IP grab pays for a year.

## X post draft (needs Eddie's post + link back)
"Freelancers sign contracts alone. I built Private Paralegal: paste a
contract, SERV Reasoning reviews it, and every step shows on screen so you
can check its work. Built for the OpenServ Hackathon. #OpenServ"

## Demo sample contract (fake, from DEMO.md)
"Freelance design agreement between Ada (designer) and Bright Ltd (client).
Fee: $200, paid 60 days after delivery. Designer gives up all IP on payment.
Client may end the agreement at any time with no notice. Designer must fix
all issues for free for 12 months. Work starts 20 Nov 2026."
Expected flags: 60-day pay, IP grab, end at any time, 12 months free fixes.
