# Prompt Templates Feature — Design Spec

**Date:** 2026-05-06  
**Status:** Approved  
**Scope:** Built-in template selection + user-saved custom templates

---

## Overview

Allow users to select a pre-built LLM prompt template (e.g., "Interview Analysis", "Sales - Purchase Indication") instead of always starting from the default meeting-minutes prompt. Users can also save their own edited prompts as named templates for later reuse.

---

## Architecture & Components

### New files

```
data/custom-prompts/builtin/
  01-meeting-minutes.txt            ← moved from data/custom-prompts/meetingminutes-prompt.txt
  02-interview-analysis.txt         ← new
  03-sales-purchase-indication.txt  ← new

data/custom-prompts/
  user-templates.json               ← created on first user save; NOT committed to git
```

### Modified files

| File | Change |
|------|--------|
| `app/config.py` | Update `LLM_PROMPT` load path to `builtin/01-meeting-minutes.txt`; add `BUILTIN_TEMPLATES_DIR` and `USER_TEMPLATES_FILE` constants |
| `app/routes.py` | Add 3 new endpoints: GET, POST, DELETE `/api/prompt-templates` |
| `static/index.html` | Add standalone template selector section (main form + re-run dialog); add save/delete JS logic |

---

## API

### GET `/api/prompt-templates`

Returns all templates as a flat list — builtins first, then user-saved.

**Response shape:**
```json
[
  {
    "id": "builtin_01_meeting_minutes",
    "name": "Meeting Minutes",
    "content": "...",
    "is_builtin": true
  },
  {
    "id": "a3f8c2d1-7b4e-4f1a-9c3d-2e5b0f6a8d9c",
    "name": "My Sales Template",
    "content": "...",
    "is_builtin": false
  }
]
```

**ID generation rules:**
- **Builtins:** deterministic — `builtin_` + filename stem with hyphens replaced by underscores. Example: `02-interview-analysis.txt` → `builtin_02_interview_analysis`. Stable across restarts.
- **User templates:** `uuid.uuid4()` generated at save time, stored in `user-templates.json`.

**Error behavior:** If `builtin/` dir is missing or empty, returns empty builtins list (no 500). If `user-templates.json` is corrupt, logs the error and treats user list as empty — builtins still load.

---

### POST `/api/prompt-templates`

Save a new user template.

**Request body:**
```json
{ "name": "string (max 80 chars, required)", "content": "string (required)" }
```

**Response:** Full created object (including generated UUID and `is_builtin: false`).  
**Errors:** `400` if `name` or `content` is empty or name exceeds 80 chars.

Duplicate names are allowed — names are display-only; IDs are the identity.

---

### DELETE `/api/prompt-templates/<id>`

Delete a user template.

| Condition | Response |
|-----------|----------|
| Success | `200 { "ok": true }` |
| ID starts with `builtin_` | `403` |
| ID not found | `404` |
| File write error | `500` |

File writes use atomic temp-file-then-rename to prevent partial-write corruption.

---

## Data Flow

### Selecting a template
1. Page load → `GET /api/prompt-templates` → dropdown populated
2. User selects template → textarea populated with `content` → prompt editor auto-expands
3. User may freely edit textarea (saved to `localStorage` as today)
4. On process/rerun: `llm_prompt` in POST body = current textarea value (no change to existing behavior)

### Saving a custom template
1. User edits textarea → clicks "Save as Template"
2. Inline name `<input>` appears below button
3. User types name, confirms → `POST /api/prompt-templates`
4. New template appended to dropdown and auto-selected

### Deleting a user template
1. User selects a user template → "Delete" button appears
2. User clicks → `DELETE /api/prompt-templates/<id>`
3. Template removed from dropdown; selection clears to placeholder

---

## UI

The prompt section is promoted from a collapsed toggle to a **standalone always-visible section**:

```
┌──────────────────────────────────────────────────────────────┐
│  Prompt Template  /  提示词模板                               │
│                                                              │
│  [── Select a template ──────────────────────────── ▼]      │
│  [Save as Template]   [Delete]  ← Delete only for user tmpl  │
│                                                              │
│  ▶ 自定义提示词 / Custom Prompt        [Reset to Default]    │
│  (collapsible textarea — unchanged from today)               │
└──────────────────────────────────────────────────────────────┘
```

**Dropdown:** Builtins first, then a `<optgroup>` divider, then user-saved templates.

**Selecting a template:** Auto-expands the textarea section. Selection is not persisted across page reloads — the dropdown resets to the placeholder on load (localStorage stores textarea content only, not which template was active).

**Save as Template:** Always clickable. On click, reveals inline `<input>` + Confirm/Cancel. Empty name shows inline validation ("Name required") without submitting.

**Delete button:** Only rendered when `is_builtin === false`. Never shown for builtins. Backend also enforces `403` as a backstop.

**Re-run LLM dialog:** Gets the same template dropdown (same GET call, same behavior).

**Folder-watch config panel:** Out of scope — no template selector added there.

**i18n labels** (follow existing `t()` pattern):

| Key | EN | CN |
|-----|----|----|
| `promptTemplateLabel` | Prompt Template | 提示词模板 |
| `selectTemplatePlaceholder` | ── Select a template ── | ── 选择模板 ── |
| `saveAsTemplate` | Save as Template | 另存为模板 |
| `deleteTemplate` | Delete | 删除 |
| `templateNamePlaceholder` | Template name... | 模板名称... |

---

## Error Handling

**Backend:**
- GET with missing/empty `builtin/`: returns empty list, logs warning
- GET with corrupt `user-templates.json`: returns empty user list, logs error, builtins still load
- POST with empty name/content or name > 80 chars: `400 {error: "..."}`
- DELETE builtin: `403`; unknown ID: `404`; file write error: `500`
- File writes use atomic rename to prevent corruption

**Frontend:**
- GET failure on page load: dropdown shows disabled with subtle error note; rest of form works normally (existing `/api/prompt` fallback still loads default prompt)
- POST/DELETE failure: brief error toast (same pattern as existing error handling)
- Empty name on save confirm: inline validation, no request sent

---

## Testing

### Backend (manual curl)
1. GET — confirm builtins load with `is_builtin: true` and correct IDs
2. POST valid body — confirm UUID in response, `user-templates.json` updated
3. POST empty name or content — confirm `400`
4. DELETE user template — confirm removed from subsequent GET
5. DELETE builtin ID — confirm `403`
6. DELETE unknown ID — confirm `404`
7. Corrupt `user-templates.json` — confirm GET returns builtins without 500

### Frontend (browser)
1. Page load — dropdown populated with builtins
2. Select builtin → textarea populates, editor expands, Delete hidden
3. Select user template → Delete button visible
4. Save template → appears in dropdown, auto-selected
5. Delete user template → removed from dropdown, selection clears
6. Re-run dialog — template dropdown present and functional
7. CN/EN toggle — all template section labels switch correctly

---

## Out of Scope

- Template export/import
- Per-template language variants (CN/EN prompt text)
- Folder-watch config panel template selection
- Template reordering or categorization
