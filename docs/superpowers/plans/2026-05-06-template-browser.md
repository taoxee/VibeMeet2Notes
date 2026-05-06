# Template Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat template `<select>` with a compact bar + expandable browse panel featuring featured chips (one-click apply), domain filtering, a grid of template cards, and a full-prompt preview state — backed by a single `builtin-templates.json` file instead of 13 separate `.txt` files.

**Architecture:** Backend reads `data/custom-prompts/builtin-templates.json` (one JSON array) instead of globbing `.txt` files; each entry has `id`, `name`, `domain`, `featured`, `description`, `content`. Frontend adds a panel UI rendered via JS DOM manipulation; the existing `<select>` for the re-run dialog is kept unchanged; all panel state is in three new variables.

**Tech Stack:** Python/Flask backend, vanilla JS + inline CSS frontend, no new dependencies.

---

## File Map

| File | Change |
|------|--------|
| `data/custom-prompts/builtin-templates.json` | **Create** — single source of truth for all 13 builtin templates |
| `data/custom-prompts/builtin/*.txt` | **Delete** — all 13 files removed after JSON is created |
| `app/config.py` | Swap `BUILTIN_TEMPLATES_DIR` → `BUILTIN_TEMPLATES_FILE`; update `LLM_PROMPT` source |
| `app/routes.py` | Replace `_load_builtin_templates()` glob logic with JSON reader |
| `static/index.html` | HTML: replace template section; JS: panel functions + updated i18n/existing functions |

---

## Task 1: Create `builtin-templates.json` and update backend

**Files:**
- Create: `data/custom-prompts/builtin-templates.json`
- Modify: `app/config.py` lines 73–76
- Modify: `app/routes.py` lines 52–70

- [ ] **Step 1: Run migration script to create JSON**

  Run from the project root:

  ```bash
  python3 - <<'EOF'
  import json, os

  BASE = "data/custom-prompts/builtin"
  OUT  = "data/custom-prompts/builtin-templates.json"

  ENTRIES = [
      {"id": "de959389-8c2e-4ad7-8977-ed771c69e5f3", "name": "Meeting Minutes",               "domain": "meeting", "featured": True,  "description": "Agenda, decisions, action items, and owners.",                "file": "01-meeting-minutes.txt"},
      {"id": "450d48d8-ba68-4bfc-8421-2b393b73f925", "name": "Interview Analysis",            "domain": "hr",      "featured": True,  "description": "Candidate assessment with hiring recommendation.",             "file": "02-interview-analysis.txt"},
      {"id": "511991a7-9149-4f95-8783-6e75053ed01b", "name": "Sales Purchase Indication",     "domain": "sales",   "featured": True,  "description": "Buyer intent score and recommended next steps.",              "file": "03-sales-purchase-indication.txt"},
      {"id": "6cee2cc1-81a4-41c8-90b6-516296eb3854", "name": "Study Lecture Note",            "domain": "study",   "featured": True,  "description": "Hierarchical study notes from lecture transcripts.",         "file": "04-study-lecture-note.txt"},
      {"id": "1435ce66-07e6-487f-93f0-db10eac0620a", "name": "Product Requirement Review",    "domain": "product", "featured": False, "description": "User stories, acceptance criteria, and open questions.",      "file": "05-product-requirement-review.txt"},
      {"id": "b6e16653-ea8b-4959-82e6-069882c6f27b", "name": "Brainstorming",                 "domain": "product", "featured": False, "description": "All ideas captured, categorized by theme and feasibility.",   "file": "06-brainstorming.txt"},
      {"id": "3c4b9fa2-c5b1-42d5-80a1-77d44a34ce9e", "name": "Team Meeting",                  "domain": "meeting", "featured": False, "description": "Status updates, blockers, actions, and team health.",        "file": "07-team-meeting.txt"},
      {"id": "d0bfb835-2e55-4cc7-bb66-2d524c372eb4", "name": "Customer Requirement Analysis", "domain": "sales",   "featured": False, "description": "Pain points, fit assessment, and follow-up questions.",      "file": "08-customer-requirement-analysis.txt"},
      {"id": "bc9c0162-dbb4-4239-aed4-e862ede0b6c3", "name": "SPIN Selling",                  "domain": "sales",   "featured": False, "description": "SPIN framework analysis of sales conversation quality.",      "file": "09-SPIN-selling.txt"},
      {"id": "79958f28-5428-4302-a08d-c17c6a5433ac", "name": "BANT-MEDDIC Analysis",          "domain": "sales",   "featured": False, "description": "B2B deal qualification against BANT and MeDDIC criteria.",  "file": "10-B2B-BANT-MEDDIC-analysis.txt"},
      {"id": "cba05a09-e0b0-422e-9aab-9eaa4a7b982c", "name": "GPCT Sales Summary",            "domain": "sales",   "featured": False, "description": "Goals, Plans, Concerns, Timeline alignment analysis.",       "file": "11-GPCT-sales-summary.txt"},
      {"id": "deacaf19-f86b-45ee-b1c7-7e21e7720c1c", "name": "MEDDIC Sales Report",           "domain": "sales",   "featured": False, "description": "Comprehensive MEDDIC deal health and champion assessment.",  "file": "12-MEDDIT-sales-report.txt"},
      {"id": "b3499261-5d29-45ed-9cb9-4c35c38da753", "name": "FAINT Sales Opportunities",     "domain": "sales",   "featured": False, "description": "FAINT opportunity quality: Foundation, Authority, Intent.",   "file": "13-FAINT-sales-opportunities.txt"},
  ]

  templates = []
  for entry in ENTRIES:
      path = os.path.join(BASE, entry["file"])
      with open(path, "r", encoding="utf-8") as f:
          content = f.read().strip()
      templates.append({
          "id":          entry["id"],
          "name":        entry["name"],
          "domain":      entry["domain"],
          "featured":    entry["featured"],
          "description": entry["description"],
          "content":     content,
      })

  with open(OUT, "w", encoding="utf-8") as f:
      json.dump(templates, f, ensure_ascii=False, indent=2)
  print(f"Written {len(templates)} templates to {OUT}")
  EOF
  ```

  Expected output: `Written 13 templates to data/custom-prompts/builtin-templates.json`

- [ ] **Step 2: Verify JSON is valid and has 13 entries**

  ```bash
  python3 -c "import json; d=json.load(open('data/custom-prompts/builtin-templates.json')); print(len(d), 'templates,', sum(1 for t in d if t['featured']), 'featured'); [print(t['id'], t['domain'], t['name']) for t in d]"
  ```

  Expected: `13 templates, 4 featured` followed by all 13 entries.

- [ ] **Step 3: Update `app/config.py`**

  First add `import json` to the imports at the top of the file (after `import tempfile`):

  ```python
  import os
  import json
  import tempfile
  ```

  Then replace lines 73–76:

  ```python
  # Before:
  BUILTIN_TEMPLATES_DIR = os.path.join(DATA_DIR, "custom-prompts", "builtin")
  USER_TEMPLATES_FILE = os.path.join(DATA_DIR, "custom-prompts", "user-templates.json")

  LLM_PROMPT = _load_prompt(os.path.join("custom-prompts", "builtin", "01-meeting-minutes.txt"))

  # After:
  BUILTIN_TEMPLATES_FILE = os.path.join(DATA_DIR, "custom-prompts", "builtin-templates.json")
  USER_TEMPLATES_FILE    = os.path.join(DATA_DIR, "custom-prompts", "user-templates.json")

  def _load_default_prompt():
      try:
          with open(BUILTIN_TEMPLATES_FILE, "r", encoding="utf-8") as f:
              templates = json.load(f)
          first = next((t for t in templates if t.get("featured")), templates[0] if templates else None)
          return first["content"] if first else ""
      except Exception:
          return ""

  LLM_PROMPT = _load_default_prompt()
  ```

  Also add `import json` at the top of `config.py` if not already present.

- [ ] **Step 4: Update `_load_builtin_templates()` in `app/routes.py`**

  Replace lines 52–70 (the entire function):

  ```python
  def _load_builtin_templates():
      from app.config import BUILTIN_TEMPLATES_FILE
      if not os.path.isfile(BUILTIN_TEMPLATES_FILE):
          print(f"[Templates] builtin-templates.json not found: {BUILTIN_TEMPLATES_FILE}")
          return []
      try:
          with open(BUILTIN_TEMPLATES_FILE, "r", encoding="utf-8") as f:
              templates = json.load(f)
          if not isinstance(templates, list):
              return []
          for t in templates:
              t["is_builtin"] = True
          return templates
      except Exception as e:
          print(f"[Templates] Failed to load builtin-templates.json: {e}")
          return []
  ```

  Also remove `import glob` from line 5 of `routes.py` — it is only used by `_load_builtin_templates` and is no longer needed.

- [ ] **Step 5: Verify backend with curl**

  Restart the Flask server, then:

  ```bash
  curl -s http://localhost:8080/api/prompt-templates | python3 -c "
  import json, sys
  data = json.load(sys.stdin)
  builtins = [t for t in data if t.get('is_builtin')]
  featured = [t for t in builtins if t.get('featured')]
  print(f'{len(builtins)} builtins, {len(featured)} featured')
  for t in builtins:
      print(t['id'][:8], t['domain'], t['name'])
  "
  ```

  Expected: `13 builtins, 4 featured` with all 13 entries listed.

- [ ] **Step 6: Delete the `.txt` files**

  ```bash
  rm data/custom-prompts/builtin/01-meeting-minutes.txt \
     data/custom-prompts/builtin/02-interview-analysis.txt \
     data/custom-prompts/builtin/03-sales-purchase-indication.txt \
     data/custom-prompts/builtin/04-study-lecture-note.txt \
     data/custom-prompts/builtin/05-product-requirement-review.txt \
     data/custom-prompts/builtin/06-brainstorming.txt \
     data/custom-prompts/builtin/07-team-meeting.txt \
     data/custom-prompts/builtin/08-customer-requirement-analysis.txt \
     data/custom-prompts/builtin/09-SPIN-selling.txt \
     data/custom-prompts/builtin/10-B2B-BANT-MEDDIC-analysis.txt \
     data/custom-prompts/builtin/11-GPCT-sales-summary.txt \
     data/custom-prompts/builtin/12-MEDDIT-sales-report.txt \
     data/custom-prompts/builtin/13-FAINT-sales-opportunities.txt
  rmdir data/custom-prompts/builtin
  ```

- [ ] **Step 7: Verify server still returns all 13 after .txt deletion**

  ```bash
  curl -s http://localhost:8080/api/prompt-templates | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d), 'templates')"
  ```

  Expected: `13 templates`

- [ ] **Step 8: Commit**

  ```bash
  git add data/custom-prompts/builtin-templates.json app/config.py app/routes.py
  git rm data/custom-prompts/builtin/01-meeting-minutes.txt \
         data/custom-prompts/builtin/02-interview-analysis.txt \
         data/custom-prompts/builtin/03-sales-purchase-indication.txt \
         data/custom-prompts/builtin/04-study-lecture-note.txt \
         data/custom-prompts/builtin/05-product-requirement-review.txt \
         data/custom-prompts/builtin/06-brainstorming.txt \
         data/custom-prompts/builtin/07-team-meeting.txt \
         data/custom-prompts/builtin/08-customer-requirement-analysis.txt \
         data/custom-prompts/builtin/09-SPIN-selling.txt \
         data/custom-prompts/builtin/10-B2B-BANT-MEDDIC-analysis.txt \
         data/custom-prompts/builtin/11-GPCT-sales-summary.txt \
         data/custom-prompts/builtin/12-MEDDIT-sales-report.txt \
         data/custom-prompts/builtin/13-FAINT-sales-opportunities.txt
  git commit -m "feat: consolidate builtin templates into single JSON file, remove .txt files"
  ```

---

## Task 2: Frontend HTML — replace template section + add i18n keys + state vars

**Files:**
- Modify: `static/index.html` lines ~106–132 (template HTML section)
- Modify: `static/index.html` i18n `zh` object (~line 544)
- Modify: `static/index.html` i18n `en` object (~line 693)
- Modify: `static/index.html` state variable block (~line 2194)

- [ ] **Step 1: Replace the template section HTML**

  Find and replace this entire block (lines ~106–132):

  ```html
  <!-- OLD — remove entirely -->
  <div style="margin-bottom:12px;">
    <div style="margin-bottom:10px;padding:10px 12px;background:#f8f9ff;border:1px solid #e0e4ff;border-radius:8px;">
      <label id="template-section-label" ...>📋 提示词模板</label>
      <select id="template-select" onchange="onTemplateSelect(this.value)" ...>
        <option value="">── 选择模板 ──</option>
      </select>
      <button id="delete-template-btn" ...>删除模板</button>
    </div>
    <!-- Collapsible custom prompt editor -->
    <label id="prompt-toggle-label" ...>▶ 自定义提示词</label>
    <div id="prompt-editor" style="display:none;margin-top:8px;">
      ...
    </div>
  </div>
  ```

  Replace with:

  ```html
  <div style="margin-bottom:12px;">
    <div style="margin-bottom:10px;padding:10px 12px;background:#f8f9ff;border:1px solid #e0e4ff;border-radius:8px;">
      <label id="template-section-label" style="font-size:0.85rem;font-weight:600;color:#333;display:block;margin-bottom:8px;">📋 提示词模板</label>
      <!-- Compact bar -->
      <div style="display:flex;align-items:center;gap:8px;">
        <div id="template-bar-label" style="flex:1;background:#fff;border:1px solid #ddd;border-radius:6px;padding:6px 10px;font-size:0.85rem;color:#888;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">── 选择模板 ──</div>
        <button id="template-browse-btn" onclick="toggleTemplateBrowser()" style="background:#4361ee;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:0.82rem;cursor:pointer;white-space:nowrap;">浏览 ▾</button>
      </div>
      <!-- Browse panel -->
      <div id="template-browser" style="display:none;margin-top:10px;background:#fff;border:1px solid #e0e4ff;border-radius:8px;padding:12px;">
        <div id="template-featured-label" style="font-size:0.7rem;font-weight:700;color:#888;letter-spacing:0.05em;margin-bottom:7px;">⭐ 常用模板</div>
        <div id="template-featured-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;"></div>
        <div id="template-domain-label" style="font-size:0.7rem;font-weight:700;color:#888;letter-spacing:0.05em;margin-bottom:7px;">🗂 按领域浏览</div>
        <div id="template-domain-chips" style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;"></div>
        <div id="template-card-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:7px;"></div>
        <!-- Preview pane (hidden until a domain card is clicked) -->
        <div id="template-preview-pane" style="display:none;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div>
              <div id="template-preview-name" style="font-size:0.88rem;font-weight:700;color:#1a237e;"></div>
              <div id="template-preview-meta" style="font-size:0.75rem;color:#888;"></div>
            </div>
            <button id="template-preview-back-btn" onclick="cancelPreview()" style="background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:3px 10px;font-size:0.75rem;cursor:pointer;">← 返回</button>
          </div>
          <textarea id="template-preview-content" rows="6" readonly style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #e0e4ff;border-radius:6px;font-size:0.78rem;font-family:inherit;resize:none;background:#fafbff;color:#333;"></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:8px;gap:6px;">
            <button id="template-preview-cancel-btn" onclick="cancelPreview()" style="background:#f5f5f5;border:1px solid #ddd;border-radius:6px;padding:6px 14px;font-size:0.82rem;cursor:pointer;color:#666;">取消</button>
            <button id="template-preview-use-btn" onclick="applyPreviewedTemplate()" style="background:#4361ee;color:#fff;border:none;border-radius:6px;padding:6px 16px;font-size:0.82rem;cursor:pointer;">✓ 使用此模板</button>
          </div>
        </div>
      </div>
      <!-- Delete button for user-saved templates -->
      <button id="delete-template-btn" onclick="deleteCurrentTemplate()" style="display:none;margin-top:6px;padding:4px 12px;font-size:0.78rem;background:#fff0f0;border:1px solid #e53935;border-radius:4px;cursor:pointer;color:#e53935;">删除模板</button>
    </div>
    <!-- Collapsible custom prompt editor (unchanged) -->
    <label id="prompt-toggle-label" style="font-size:0.85rem;color:#4361ee;cursor:pointer;user-select:none;" onclick="togglePromptEditor()">▶ 自定义提示词</label>
    <div id="prompt-editor" style="display:none;margin-top:8px;">
      <textarea id="llm-prompt" rows="8" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;font-family:inherit;resize:vertical;line-height:1.5;"></textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;">
        <button id="save-template-btn" onclick="showSaveTemplateInput()" style="padding:4px 12px;font-size:0.78rem;background:#f0f4ff;border:1px solid #4361ee;border-radius:4px;cursor:pointer;color:#4361ee;">另存为模板</button>
        <button id="prompt-reset-btn" onclick="resetPrompt()" style="padding:4px 12px;font-size:0.78rem;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;color:#666;">恢复默认</button>
      </div>
      <div id="save-template-input-area" style="display:none;margin-top:8px;">
        <div style="display:flex;gap:6px;align-items:center;">
          <input type="text" id="save-template-name" placeholder="模板名称..." maxlength="80" style="flex:1;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:0.82rem;">
          <button id="save-template-confirm-btn" onclick="confirmSaveTemplate()" style="padding:5px 12px;font-size:0.78rem;background:#4361ee;color:#fff;border:none;border-radius:4px;cursor:pointer;">保存</button>
          <button id="save-template-cancel-btn" onclick="cancelSaveTemplate()" style="padding:5px 10px;font-size:0.78rem;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;color:#666;">取消</button>
        </div>
        <div id="save-template-error" style="display:none;font-size:0.78rem;color:#e53935;margin-top:4px;"></div>
      </div>
    </div>
  </div>
  ```

- [ ] **Step 2: Add new i18n keys to the `zh` object**

  Find the line `templateSaveCancel: "取消"` in the `zh` block (~line 553) and add after it:

  ```js
      browseBtnOpen: "浏览 ▾",
      browseBtnClose: "收起 ▴",
      sectionCommonUse: "⭐ 常用模板",
      sectionDomain: "🗂 按领域浏览",
      domainMeeting: "会议",
      domainSales: "销售",
      domainHr: "招聘",
      domainProduct: "产品",
      domainStudy: "学习",
      domainLaw: "法律",
      domainMyTemplates: "我的模板",
      previewBack: "← 返回",
      previewUse: "✓ 使用此模板"
  ```

- [ ] **Step 3: Add new i18n keys to the `en` object**

  Find `templateSaveCancel: "Cancel"` in the `en` block (~line 696) and add after it:

  ```js
      browseBtnOpen: "Browse ▾",
      browseBtnClose: "Close ▴",
      sectionCommonUse: "⭐ COMMON USE",
      sectionDomain: "🗂 DOMAIN",
      domainMeeting: "Meeting",
      domainSales: "Sales",
      domainHr: "HR",
      domainProduct: "Product",
      domainStudy: "Study",
      domainLaw: "Law",
      domainMyTemplates: "My Templates",
      previewBack: "← Back",
      previewUse: "✓ Use This Template"
  ```

- [ ] **Step 4: Add new state variables**

  Find the block (~line 2194):

  ```js
  // Prompt template state (must be before applyLanguage())
  let _promptTemplates = [];
  let _selectedTemplateId = null;
  ```

  Replace with:

  ```js
  // Prompt template state (must be before applyLanguage())
  let _promptTemplates = [];
  let _selectedTemplateId = null;
  let _templateBrowserOpen = false;
  let _activeDomain = null;
  let _previewTemplateId = null;
  ```

- [ ] **Step 5: Reload page and verify structure loads without JS errors**

  Open browser console. Reload page. Confirm:
  - No JS errors
  - The compact bar renders with "── 选择模板 ──" label and "浏览 ▾" button
  - Clicking "浏览 ▾" does nothing yet (functions not defined) — a `ReferenceError` in console is expected and will be fixed in Task 3

- [ ] **Step 6: Commit**

  ```bash
  git add static/index.html
  git commit -m "feat: replace template select with compact bar + browser panel HTML skeleton"
  ```

---

## Task 3: Frontend JS — panel core (open/close, featured, domain filter, card grid)

**Files:**
- Modify: `static/index.html` — add new functions after the `// ── Prompt Templates ──` section comment (~line 2204); update `loadPromptTemplates()`

- [ ] **Step 1: Add helper functions and `_applyTemplate`**

  Find the `// ── Prompt Templates ──` comment block (~line 2204). Insert the following block of new functions **before** the existing `async function loadPromptTemplates()`:

  ```js
  function _getAvailableDomains() {
    const seen = new Set();
    const domains = [];
    _promptTemplates.filter(t => t.is_builtin).forEach(t => {
      if (t.domain && !seen.has(t.domain)) { seen.add(t.domain); domains.push(t.domain); }
    });
    return domains;
  }

  function _domainLabel(domain) {
    const map = { meeting: t("domainMeeting"), sales: t("domainSales"), hr: t("domainHr"), product: t("domainProduct"), study: t("domainStudy"), law: t("domainLaw") };
    return map[domain] || domain;
  }

  function _applyTemplate(id) {
    const tpl = _promptTemplates.find(item => item.id === id);
    if (!tpl) return;
    _selectedTemplateId = id;
    document.getElementById("llm-prompt").value = tpl.content;
    localStorage.setItem("llm_custom_prompt", tpl.content);
    const barLabel = document.getElementById("template-bar-label");
    if (barLabel) { barLabel.textContent = tpl.name; barLabel.style.color = "#333"; }
    const deleteBtn = document.getElementById("delete-template-btn");
    if (deleteBtn) {
      deleteBtn.style.display = tpl.is_builtin ? "none" : "";
      if (!tpl.is_builtin) deleteBtn.textContent = t("deleteTemplate");
    }
    closeBrowserPanel();
  }
  ```

- [ ] **Step 2: Add `toggleTemplateBrowser`, `openBrowserPanel`, `closeBrowserPanel`**

  Immediately after the block above, add:

  ```js
  function toggleTemplateBrowser() {
    _templateBrowserOpen ? closeBrowserPanel() : openBrowserPanel();
  }

  function openBrowserPanel() {
    _templateBrowserOpen = true;
    _previewTemplateId = null;
    document.getElementById("template-browser").style.display = "block";
    document.getElementById("template-browse-btn").textContent = t("browseBtnClose");
    if (_activeDomain === null) {
      const cur = _promptTemplates.find(item => item.id === _selectedTemplateId);
      _activeDomain = (cur && cur.domain) ? cur.domain : (_getAvailableDomains()[0] || null);
    }
    renderBrowserPanel();
  }

  function closeBrowserPanel() {
    _templateBrowserOpen = false;
    _previewTemplateId = null;
    document.getElementById("template-browser").style.display = "none";
    document.getElementById("template-browse-btn").textContent = t("browseBtnOpen");
  }
  ```

- [ ] **Step 3: Add `renderBrowserPanel`, `renderFeaturedChips`, `renderDomainChips`, `renderTemplateCards`**

  ```js
  function renderBrowserPanel() {
    document.getElementById("template-featured-label").textContent = t("sectionCommonUse");
    document.getElementById("template-domain-label").textContent = t("sectionDomain");
    renderFeaturedChips();
    renderDomainChips();
    renderTemplateCards();
  }

  function renderFeaturedChips() {
    const container = document.getElementById("template-featured-chips");
    container.textContent = "";
    _promptTemplates.filter(tpl => tpl.featured).forEach(tpl => {
      const chip = document.createElement("div");
      chip.style.cssText = "background:#fff7e6;border:1px solid #ffd591;border-radius:20px;padding:3px 11px;font-size:0.77rem;cursor:pointer;color:#ad6800;";
      chip.textContent = tpl.name;
      chip.onclick = () => _applyTemplate(tpl.id);
      container.appendChild(chip);
    });
  }

  function renderDomainChips() {
    const container = document.getElementById("template-domain-chips");
    container.textContent = "";
    _getAvailableDomains().forEach(domain => {
      const active = domain === _activeDomain;
      const chip = document.createElement("div");
      chip.style.cssText = active
        ? "background:#4361ee;color:#fff;border-radius:20px;padding:3px 10px;font-size:0.73rem;cursor:pointer;"
        : "background:#f0f4ff;color:#4361ee;border:1px solid #c5ceff;border-radius:20px;padding:3px 10px;font-size:0.73rem;cursor:pointer;";
      chip.textContent = _domainLabel(domain);
      chip.onclick = () => onDomainChipClick(domain);
      container.appendChild(chip);
    });
    if (_promptTemplates.some(tpl => !tpl.is_builtin)) {
      const active = _activeDomain === "__user__";
      const chip = document.createElement("div");
      chip.style.cssText = active
        ? "background:#722ed1;color:#fff;border-radius:20px;padding:3px 10px;font-size:0.73rem;cursor:pointer;"
        : "background:#f5f0ff;color:#722ed1;border:1px solid #d3adf7;border-radius:20px;padding:3px 10px;font-size:0.73rem;cursor:pointer;";
      chip.textContent = t("domainMyTemplates");
      chip.onclick = () => onDomainChipClick("__user__");
      container.appendChild(chip);
    }
  }

  function renderTemplateCards() {
    document.getElementById("template-preview-pane").style.display = "none";
    const grid = document.getElementById("template-card-grid");
    grid.style.display = "grid";
    grid.textContent = "";
    const filtered = _activeDomain === "__user__"
      ? _promptTemplates.filter(tpl => !tpl.is_builtin)
      : _promptTemplates.filter(tpl => tpl.is_builtin && tpl.domain === _activeDomain);
    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "color:#aaa;font-size:0.8rem;padding:8px;grid-column:1/-1;";
      empty.textContent = "No templates in this domain.";
      grid.appendChild(empty);
      return;
    }
    filtered.forEach(tpl => {
      const isSelected = tpl.id === _selectedTemplateId;
      const card = document.createElement("div");
      card.style.cssText = isSelected
        ? "background:#e8edff;border:1.5px solid #4361ee;border-radius:7px;padding:8px 9px;cursor:pointer;"
        : "background:#f8f9ff;border:1px solid #e0e4ff;border-radius:7px;padding:8px 9px;cursor:pointer;";
      const name = document.createElement("div");
      name.style.cssText = "font-size:0.8rem;font-weight:600;color:" + (isSelected ? "#1a237e" : "#333") + ";margin-bottom:2px;";
      name.textContent = tpl.name;
      const desc = document.createElement("div");
      desc.style.cssText = "font-size:0.7rem;color:#555;line-height:1.3;";
      desc.textContent = tpl.description || "";
      card.appendChild(name);
      card.appendChild(desc);
      card.onclick = () => showTemplatePreview(tpl.id);
      grid.appendChild(card);
    });
  }

  function onDomainChipClick(domain) {
    _activeDomain = domain;
    _previewTemplateId = null;
    renderDomainChips();
    renderTemplateCards();
  }
  ```

- [ ] **Step 4: Update `loadPromptTemplates()` to use bar label instead of `<select>`**

  Find the existing `async function loadPromptTemplates()` and replace it entirely:

  ```js
  async function loadPromptTemplates() {
    try {
      const resp = await fetch("/api/prompt-templates");
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      _promptTemplates = await resp.json();
      populateTemplateDropdown();
      const firstFeatured = _promptTemplates.find(item => item.is_builtin && item.featured);
      const firstBuiltin  = firstFeatured || _promptTemplates.find(item => item.is_builtin);
      if (firstBuiltin) {
        _selectedTemplateId = firstBuiltin.id;
        document.getElementById("llm-prompt").value = firstBuiltin.content;
        localStorage.setItem("llm_custom_prompt", firstBuiltin.content);
        const barLabel = document.getElementById("template-bar-label");
        if (barLabel) { barLabel.textContent = firstBuiltin.name; barLabel.style.color = "#333"; }
      }
    } catch (e) {
      console.warn("Failed to load prompt templates", e);
      const browseBtn = document.getElementById("template-browse-btn");
      if (browseBtn) browseBtn.disabled = true;
    }
  }
  ```

- [ ] **Step 5: Verify in browser**

  Reload the page. Confirm:
  - Bar shows "Meeting Minutes" (first featured template)
  - Clicking "Browse ▾" opens the panel showing featured chips and domain filter chips
  - Clicking a featured chip applies the template (bar label updates, panel closes)
  - Clicking a domain chip switches the card grid to that domain
  - Each card shows name + description in a responsive grid
  - Clicking "Close ▴" closes the panel

- [ ] **Step 6: Commit**

  ```bash
  git add static/index.html
  git commit -m "feat: add template browser panel core — open/close, featured chips, domain filter, card grid"
  ```

---

## Task 4: Frontend JS — preview state + update save/delete/dropdown/applyLanguage

**Files:**
- Modify: `static/index.html` — add preview functions; update `showTemplatePreview`, `confirmSaveTemplate`, `deleteCurrentTemplate`, `populateTemplateDropdown`, `applyLanguage`

- [ ] **Step 1: Add `showTemplatePreview`, `applyPreviewedTemplate`, `cancelPreview`**

  Add these functions after `onDomainChipClick`:

  ```js
  function showTemplatePreview(id) {
    const tpl = _promptTemplates.find(item => item.id === id);
    if (!tpl) return;
    _previewTemplateId = id;
    document.getElementById("template-card-grid").style.display = "none";
    document.getElementById("template-preview-pane").style.display = "block";
    document.getElementById("template-preview-name").textContent = tpl.name;
    const domainStr = tpl.is_builtin
      ? (_domainLabel(tpl.domain || "") + " · Built-in")
      : t("domainMyTemplates");
    document.getElementById("template-preview-meta").textContent = domainStr;
    document.getElementById("template-preview-content").value = tpl.content;
    document.getElementById("template-preview-back-btn").textContent = t("previewBack");
    document.getElementById("template-preview-cancel-btn").textContent = t("templateSaveCancel");
    document.getElementById("template-preview-use-btn").textContent = t("previewUse");
  }

  function applyPreviewedTemplate() {
    if (_previewTemplateId) _applyTemplate(_previewTemplateId);
  }

  function cancelPreview() {
    _previewTemplateId = null;
    document.getElementById("template-preview-pane").style.display = "none";
    document.getElementById("template-card-grid").style.display = "grid";
  }
  ```

- [ ] **Step 2: Update `confirmSaveTemplate()` — remove old `<select>` references**

  Find `confirmSaveTemplate()`. Replace the success block inside the `try` (after `const newTpl = await resp.json();`):

  ```js
  // Old block to remove:
  const newTpl = await resp.json();
  _promptTemplates.push(newTpl);
  populateTemplateDropdown();
  document.getElementById("template-select").value = newTpl.id;
  _selectedTemplateId = newTpl.id;
  const deleteBtn = document.getElementById("delete-template-btn");
  if (deleteBtn) deleteBtn.style.display = "";
  cancelSaveTemplate();

  // New block:
  const newTpl = await resp.json();
  _promptTemplates.push(newTpl);
  populateTemplateDropdown();
  _applyTemplate(newTpl.id);
  cancelSaveTemplate();
  ```

- [ ] **Step 3: Update `deleteCurrentTemplate()` — remove old `<select>` references**

  Find `deleteCurrentTemplate()`. Replace the success block after `_promptTemplates = _promptTemplates.filter(...)`:

  ```js
  // Old block to remove:
  _promptTemplates = _promptTemplates.filter(item => item.id !== _selectedTemplateId);
  _selectedTemplateId = null;
  populateTemplateDropdown();
  document.getElementById("template-select").value = "";
  const deleteBtn = document.getElementById("delete-template-btn");
  if (deleteBtn) deleteBtn.style.display = "none";

  // New block:
  _promptTemplates = _promptTemplates.filter(item => item.id !== _selectedTemplateId);
  _selectedTemplateId = null;
  populateTemplateDropdown();
  const barLabel = document.getElementById("template-bar-label");
  if (barLabel) { barLabel.textContent = t("selectTemplatePlaceholder"); barLabel.style.color = "#888"; }
  const deleteBtn = document.getElementById("delete-template-btn");
  if (deleteBtn) deleteBtn.style.display = "none";
  ```

- [ ] **Step 4: Update `populateTemplateDropdown()` to target rerun select only**

  Find `function populateTemplateDropdown()` (~line 2263). Replace the entire function:

  ```js
  function populateTemplateDropdown() {
    _buildTemplateSelect(document.getElementById("rerun-template-select"));
  }
  ```

- [ ] **Step 5: Update `applyLanguage()` — remove old template-select wiring, add new**

  Find the template-related block inside `applyLanguage()` (~lines 2096–2112):

  ```js
  // Old block to remove:
  const tplLabel = document.getElementById("template-section-label");
  if (tplLabel) tplLabel.textContent = "📋 " + t("promptTemplateLabel");
  const saveTplBtn = document.getElementById("save-template-btn");
  if (saveTplBtn) saveTplBtn.textContent = t("saveAsTemplate");
  const deleteTplBtn = document.getElementById("delete-template-btn");
  if (deleteTplBtn) deleteTplBtn.textContent = t("deleteTemplate");
  const tplNameInput = document.getElementById("save-template-name");
  if (tplNameInput) tplNameInput.placeholder = t("templateNamePlaceholder");
  const saveTplConfirmBtn = document.getElementById("save-template-confirm-btn");
  if (saveTplConfirmBtn) saveTplConfirmBtn.textContent = t("templateSaveConfirm");
  const saveTplCancelBtn = document.getElementById("save-template-cancel-btn");
  if (saveTplCancelBtn) saveTplCancelBtn.textContent = t("templateSaveCancel");
  ["template-select", "rerun-template-select"].forEach(id => {
    const sel = document.getElementById(id);
    if (sel && sel.options[0] && sel.options[0].value === "") sel.options[0].textContent = t("selectTemplatePlaceholder");
  });
  if (_promptTemplates.length) populateTemplateDropdown();
  ```

  Replace with:

  ```js
  const tplLabel = document.getElementById("template-section-label");
  if (tplLabel) tplLabel.textContent = "📋 " + t("promptTemplateLabel");
  const browseBtnEl = document.getElementById("template-browse-btn");
  if (browseBtnEl) browseBtnEl.textContent = _templateBrowserOpen ? t("browseBtnClose") : t("browseBtnOpen");
  const barLabelEl = document.getElementById("template-bar-label");
  if (barLabelEl && !_selectedTemplateId) barLabelEl.textContent = t("selectTemplatePlaceholder");
  const saveTplBtn = document.getElementById("save-template-btn");
  if (saveTplBtn) saveTplBtn.textContent = t("saveAsTemplate");
  const deleteTplBtn = document.getElementById("delete-template-btn");
  if (deleteTplBtn) deleteTplBtn.textContent = t("deleteTemplate");
  const tplNameInput = document.getElementById("save-template-name");
  if (tplNameInput) tplNameInput.placeholder = t("templateNamePlaceholder");
  const saveTplConfirmBtn = document.getElementById("save-template-confirm-btn");
  if (saveTplConfirmBtn) saveTplConfirmBtn.textContent = t("templateSaveConfirm");
  const saveTplCancelBtn = document.getElementById("save-template-cancel-btn");
  if (saveTplCancelBtn) saveTplCancelBtn.textContent = t("templateSaveCancel");
  const rerunSel = document.getElementById("rerun-template-select");
  if (rerunSel && rerunSel.options[0] && rerunSel.options[0].value === "") rerunSel.options[0].textContent = t("selectTemplatePlaceholder");
  if (_promptTemplates.length) populateTemplateDropdown();
  if (_templateBrowserOpen) renderBrowserPanel();
  ```

- [ ] **Step 6: Remove orphaned `onTemplateSelect` function**

  Find `function onTemplateSelect(id)` (~line 2268, formerly triggered by the old `<select>`) and delete the entire function (it is no longer called anywhere — replaced by `_applyTemplate`).

  Verify nothing else calls it:

  ```bash
  grep -n "onTemplateSelect" static/index.html
  ```

  Expected: zero results after deletion.

- [ ] **Step 7: Full browser verification**

  Reload page. Test the complete flow:

  1. Bar shows "Meeting Minutes" on load
  2. Click "Browse ▾" → panel opens, featured chips visible, "Meeting" domain active with 2 cards
  3. Click "Sales" domain chip → cards switch to Sales domain (7 cards)
  4. Click a card → preview pane slides in showing full prompt, "← Back" and "✓ Use This Template"
  5. Click "← Back" → returns to card grid, no template applied
  6. Click a card again → click "✓ Use This Template" → bar updates, panel closes, prompt textarea filled
  7. Click a featured chip → same result in one click
  8. Open prompt editor, edit prompt, click "另存为模板" → save dialog → save → new template appears in "My Templates" domain with delete button visible
  9. Switch language to EN → all labels update correctly
  10. Re-run dialog: click "Re-run LLM" → rerun template `<select>` still shows all templates in optgroups

- [ ] **Step 8: Commit**

  ```bash
  git add static/index.html
  git commit -m "feat: add template preview state, wire up save/delete/applyLanguage to new browser panel"
  ```
