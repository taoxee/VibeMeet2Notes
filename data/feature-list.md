# VibeMeet2Notes — Feature Audit

## What the app does today

| Feature | Status |
|---|---|
| Multi-file upload (audio/video) | ✅ |
| ASR vendor select (only shows configured ones) | ✅ |
| LLM vendor + model select (model remembered per vendor) | ✅ |
| Custom prompt editor | ✅ |
| Background task queue with live progress | ✅ |
| Results: transcript + meeting notes (markdown rendered) | ✅ |
| Token usage display | ✅ |
| History (click to reload past results) | ✅ |
| Vendor credentials (import/export CSV/JSON, auto-save) | ✅ |
| Vendor capability reference table | ✅ |
| Chinese/English language switch | ✅ |
| Folder Watch | hidden (not ready) |

---

## Missing features — by priority

### P0 — Blockers (core loop breaks without these)

1. **No Copy button** on transcript or notes. After processing, you have to manually select all text. This is the #1 action every user needs. Missing entirely.
2. **No Download button** — no way to save notes as `.txt` or `.md` from the UI. Output files exist on the server but unreachable from the browser.
3. **Vendor selection not remembered on refresh** — ASR and LLM vendor dropdowns reset every page load. Model is remembered, vendor is not. Daily users re-select the same vendors every time.
4. **No "Re-run notes" from results** — If the notes are wrong or you want to try a different LLM/prompt, you must re-upload the whole file. The transcript is already cached; re-running just the LLM step should be one click.

### P1 — High friction

5. **No upload progress bar** — For a 60-minute recording (~200MB), the upload phase is silent. User has no idea if it's working.
6. **First-time experience is broken** — New user lands on the page, sees two empty dropdowns, no explanation of what to do. Must scroll to the bottom to set up credentials before anything works. No onboarding, no guidance.
7. **Results are read-only** — You can't edit or correct the notes. If the AI misheard a name or missed an action item, you're stuck.
8. **History has no delete or search** — After 20+ recordings, the list becomes useless noise. No filter by date or filename.

### P2 — Quality of life

9. **No speaker name mapping** — Diarization gives "Speaker 1", "Speaker 2". No way to assign real names.
10. **No browser notification when done** — Long recording finishes while you're in another tab — silent. No "ding."
11. **No "transcript only" mode** — No clean way to skip LLM and just get the transcript.
12. **Multi-file batch behavior is unclear** — What happens if you upload 5 files? The queue handles it, but there's no visual explanation.

### P3 — Future / SaaS prep

13. No mobile layout
14. No in-browser recording (microphone)
15. No share link for results
16. No meeting title / participants metadata
