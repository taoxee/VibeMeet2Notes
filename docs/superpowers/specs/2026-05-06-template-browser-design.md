# Template Browser — Design Spec

**Date:** 2026-05-06
**Context:** 13 builtin templates today, growing to ~30–60 across 6+ domains. Flat `<select>` is unmanageable. This spec replaces the current template dropdown with a compact bar + expandable browse panel, and consolidates all builtin template data into a single JSON file.

---

## Goals

- Support 30–60 builtin templates across 6+ domains without overwhelming the user
- Surface 3–4 featured templates for one-click apply (common use cases)
- Let users browse by domain with name + description visible before selecting
- Show full prompt preview before applying a domain template
- Keep user-saved custom templates in their own section
- Replace the 13 separate `.txt` files with one `builtin-templates.json` (single source of truth)

---

## Data Model

### `data/custom-prompts/builtin-templates.json`

Replaces all files in `data/custom-prompts/builtin/*.txt`. Each entry:

```json
{
  "id": "<uuid4>",
  "name": "Meeting Minutes",
  "domain": "meeting",
  "featured": true,
  "description": "Agenda, decisions, action items, and owners.",
  "content": "You are a senior program manager..."
}
```

**Fields:**
- `id` — stable uuid4, never changes (safe for bookmarks/localStorage)
- `name` — display name
- `domain` — one of: `meeting`, `sales`, `hr`, `product`, `study`, `law` (extensible)
- `featured` — `true` for the 3–4 Common Use templates shown as pills
- `description` — one sentence shown on the card in browse mode
- `content` — full prompt text

**Migration:** all 13 existing `.txt` files are absorbed into this JSON with new stable UUIDs. The `builtin/` directory and its files are deleted.

### `data/custom-prompts/user-templates.json` (unchanged)

Existing structure. User templates get their own "My Templates" section in the panel — no domain or featured fields required.

---

## Backend Changes

### `app/config.py`
- Remove `BUILTIN_TEMPLATES_DIR`
- Add `BUILTIN_TEMPLATES_FILE = os.path.join(DATA_DIR, "custom-prompts", "builtin-templates.json")`

### `app/routes.py` — `_load_builtin_templates()`

Replace the current glob-based loader:

```python
def _load_builtin_templates():
    if not os.path.isfile(BUILTIN_TEMPLATES_FILE):
        return []
    try:
        with open(BUILTIN_TEMPLATES_FILE, "r", encoding="utf-8") as f:
            templates = json.load(f)
        for t in templates:
            t["is_builtin"] = True
        return templates
    except Exception as e:
        print(f"[Templates] Failed to load builtin-templates.json: {e}")
        return []
```

### `GET /api/prompt-templates` (unchanged signature)

Returns `[...builtins, ...userTemplates]`. Each builtin now includes `domain`, `featured`, and `description` fields in addition to the existing `id`, `name`, `content`, `is_builtin`.

No other API endpoints change.

---

## Frontend — UI Components

### Compact Bar (always visible, replaces current `<select>`)

```
[ 📄 Meeting Minutes                    Browse ▾ ]
```

- Shows currently selected template name (or placeholder if none)
- "Browse ▾" button toggles the panel open/closed
- On selection, bar updates to show the chosen template name

### Browse Panel (inline, expands below the bar)

**Section 1 — Common Use** (featured templates)
- Label: `⭐ COMMON USE`
- Rendered as pill chips (`border-radius: 20px`)
- **One-click apply:** clicking a chip applies the template immediately and closes the panel
- Only templates with `featured: true`

**Section 2 — Domain Filter**
- Label: `🗂 DOMAIN`
- One pill chip per domain (Meeting, Sales, HR, Product, Study, Law…)
- Plus a purple "My Templates" chip at the end
- Active domain chip is highlighted (filled blue); others are outlined
- Clicking a chip filters the card grid below

**Section 3 — Template Card Grid**
- CSS: `grid-template-columns: repeat(auto-fill, minmax(140px, 1fr))`
- Adapts to 1–3 cards per row based on viewport width
- Each card shows: emoji + name (bold, 0.8rem) + 1-line description (0.7rem, muted)
- Currently selected template card has a blue border highlight
- **Clicking a domain template** → transitions to Preview state (does not apply yet)
- **Clicking a "My Templates" card** → transitions to Preview state, shows Delete button

### Preview State (replaces card grid when a domain template is clicked)

```
[ ← Back ]  Team Meeting   Meeting · Built-in
[ read-only textarea with full prompt content  ]
[ Cancel ]  [ ✓ Use This Template ]
```

- Back button returns to the card grid (same domain selected)
- "Use This Template" applies the template, updates the compact bar, closes the panel
- Cancel returns to card grid without applying

---

## Frontend — State & Behavior

### State variables (additions to existing)

```js
let _templateBrowserOpen = false;
let _activeDomain = null;          // currently selected domain chip
let _previewTemplateId = null;     // template being previewed (or null)
```

### `_promptTemplates` array

Already populated by `loadPromptTemplates()`. After this change, each builtin entry also has `domain`, `featured`, `description`.

### Panel open/close

- "Browse ▾" → set `_templateBrowserOpen = true`, render panel, animate open
- "Close ▴" / after applying featured chip → set `_templateBrowserOpen = false`
- Default active domain on open: domain of the currently selected template if it has one (featured templates may span domains — fall back to first available domain if no match)

### Applying a template

- **Featured chip click:** set prompt textarea value, update `_selectedTemplateId`, update compact bar label, close panel, save to `localStorage`
- **"Use This Template" click:** same as above, clear `_previewTemplateId`, close panel

### Re-run dialog

`#rerun-template-select` — keep the existing flat `<select>` for the rerun dialog. The browse panel is only on the main form. The rerun dialog is a secondary surface and doesn't need the full browse experience.

`_buildTemplateSelect()` and `populateTemplateDropdown()` are updated to only target `#rerun-template-select` (the main form's `#template-select` element is removed and replaced by the new panel). The optgroup structure (Built-in / My Templates) is kept for the rerun select.

---

## i18n Keys (additions)

| Key | zh | en |
|-----|----|----|
| `browseBtnOpen` | 浏览 ▾ | Browse ▾ |
| `browseBtnClose` | 收起 ▴ | Close ▴ |
| `sectionCommonUse` | ⭐ 常用模板 | ⭐ COMMON USE |
| `sectionDomain` | 🗂 按领域浏览 | 🗂 DOMAIN |
| `domainMeeting` | 会议 | Meeting |
| `domainSales` | 销售 | Sales |
| `domainHr` | 招聘 | HR |
| `domainProduct` | 产品 | Product |
| `domainStudy` | 学习 | Study |
| `domainLaw` | 法律 | Law |
| `domainMyTemplates` | 我的模板 | My Templates |
| `previewBack` | ← 返回 | ← Back |
| `previewUse` | ✓ 使用此模板 | ✓ Use This Template |

---

## File Changes Summary

| File | Change |
|------|--------|
| `data/custom-prompts/builtin-templates.json` | **Create** — all 13 templates consolidated here with uuid, domain, featured, description, content |
| `data/custom-prompts/builtin/*.txt` | **Delete** — all 13 `.txt` files removed |
| `app/config.py` | Replace `BUILTIN_TEMPLATES_DIR` with `BUILTIN_TEMPLATES_FILE` |
| `app/routes.py` | Replace glob-based `_load_builtin_templates()` with JSON loader |
| `static/index.html` | Replace `<select id="template-select">` section with compact bar + browse panel HTML + JS |

---

## Out of Scope

- Search/filter within the panel (can be added later if template count exceeds ~50)
- Editing builtin template content in the UI
- Dragging/reordering templates
- Per-user featured preferences
