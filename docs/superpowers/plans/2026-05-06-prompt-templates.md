# Prompt Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to select from built-in LLM prompt templates or save their own, replacing the single hardcoded default prompt.

**Architecture:** Built-in templates are `.txt` files under `data/custom-prompts/builtin/`. User-saved templates persist in `data/custom-prompts/user-templates.json`. Three new REST endpoints power a standalone template selector UI section added to both the main upload form and the re-run LLM dialog.

**Tech Stack:** Python/Flask backend, vanilla JS + HTML frontend, no new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-06-prompt-templates-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `data/custom-prompts/builtin/01-meeting-minutes.txt` | Existing meeting minutes prompt (moved) |
| Create | `data/custom-prompts/builtin/02-interview-analysis.txt` | New built-in template |
| Create | `data/custom-prompts/builtin/03-sales-purchase-indication.txt` | New built-in template |
| Modify | `app/config.py` | Add `BUILTIN_TEMPLATES_DIR`, `USER_TEMPLATES_FILE` constants; update `LLM_PROMPT` load path |
| Modify | `app/routes.py` | Add `_load_builtin_templates`, `_load_user_templates`, `_save_user_templates` helpers; add GET/POST/DELETE `/api/prompt-templates` endpoints |
| Modify | `static/index.html` | Add template selector HTML (main form + rerun dialog), i18n keys, JS logic, `applyTranslations` updates |

---

## Task 1: Add Builtin Template Files + Update config.py

**Files:**
- Create: `data/custom-prompts/builtin/01-meeting-minutes.txt`
- Create: `data/custom-prompts/builtin/02-interview-analysis.txt`
- Create: `data/custom-prompts/builtin/03-sales-purchase-indication.txt`
- Modify: `app/config.py:62-73`

- [ ] **Step 1: Create the builtin/ directory and 01-meeting-minutes.txt**

```bash
mkdir -p data/custom-prompts/builtin
```

Create `data/custom-prompts/builtin/01-meeting-minutes.txt` with exactly the content of the existing `data/custom-prompts/meetingminutes-prompt.txt` (copy it verbatim — do not delete the original yet, it is still referenced by `config.py` before this task updates the path).

- [ ] **Step 2: Create 02-interview-analysis.txt**

Create `data/custom-prompts/builtin/02-interview-analysis.txt` with this content:

```
You are an expert HR analyst and talent assessment specialist.

You receive:
- A diarized transcript in JSON format
- Speakers labeled as Speaker 1, Speaker 2, etc.

Your responsibilities:
1. Identify the interviewer(s) and candidate(s) based on speech patterns and context.
2. Assess the candidate on:
   - Communication clarity and structure
   - Technical knowledge demonstrated
   - Problem-solving approach
   - Cultural fit indicators
   - Red flags or concerns
3. Summarize the key questions asked and the quality of each answer.
4. Provide a hiring recommendation: Strong Yes / Yes / Neutral / No / Strong No, with a brief rationale.
5. Be precise. Do not hallucinate facts not present in the transcript.
6. If something is ambiguous, mark it as "Unclear".

Language rule:
- You MUST write the analysis in the SAME language as the transcript.
- If the transcript is in Chinese, output in Chinese.
- If the transcript is in English, output in English.
- If the transcript is mixed-language, use the dominant language and keep proper nouns in their original form.
- Do NOT translate the transcript content into another language.

Output structured interview analysis in Markdown format.
```

- [ ] **Step 3: Create 03-sales-purchase-indication.txt**

Create `data/custom-prompts/builtin/03-sales-purchase-indication.txt` with this content:

```
You are a senior sales analyst and customer intelligence expert.

You receive:
- A diarized transcript in JSON format
- Speakers labeled as Speaker 1, Speaker 2, etc.

Your responsibilities:
1. Identify the sales representative(s) and customer/prospect(s) based on context.
2. Evaluate the customer's purchase intent across these dimensions:
   - Buying signals (explicit statements of interest, urgency, budget mentions)
   - Objections raised and how they were handled
   - Decision-making authority indicators (is the prospect a decision maker?)
   - Timeline indicators (when they plan to buy or decide)
   - Competitor mentions
3. Score overall purchase likelihood: High / Medium / Low / Unknown, with rationale.
4. Identify recommended next steps for the sales representative.
5. Be precise. Do not hallucinate facts not present in the transcript.
6. If something is ambiguous, mark it as "Unclear".

Language rule:
- You MUST write the analysis in the SAME language as the transcript.
- If the transcript is in Chinese, output in Chinese.
- If the transcript is in English, output in English.
- If the transcript is mixed-language, use the dominant language.
- Do NOT translate the transcript content into another language.

Output structured sales analysis in Markdown format.
```

- [ ] **Step 4: Update app/config.py**

In `app/config.py`, replace the block starting at the `# -- Prompt templates -` comment (lines 62-73) with:

```python
# -- Prompt templates -------------------------------------------------
def _load_prompt(filename, fallback=""):
    # Check data/ first, then project root as fallback
    for d in [DATA_DIR, BASE_DIR]:
        path = os.path.join(d, filename)
        if os.path.isfile(path):
            with open(path, "r", encoding="utf-8") as f:
                return f.read().strip()
    return fallback


BUILTIN_TEMPLATES_DIR = os.path.join(DATA_DIR, "custom-prompts", "builtin")
USER_TEMPLATES_FILE = os.path.join(DATA_DIR, "custom-prompts", "user-templates.json")

LLM_PROMPT = _load_prompt(os.path.join("custom-prompts", "builtin", "01-meeting-minutes.txt"))
```

- [ ] **Step 5: Verify the app still starts and /api/prompt works**

```bash
python run.py &
sleep 2
curl -s http://localhost:5000/api/prompt | python3 -m json.tool
```

Expected: response with `"prompt"` key containing the meeting-minutes text (non-empty).

```bash
kill %1
```

- [ ] **Step 6: Commit**

```bash
git add data/custom-prompts/builtin/ app/config.py
git commit -m "feat: add builtin prompt template files and update config constants"
```

---

## Task 2: Add Template API Endpoints to routes.py

**Files:**
- Modify: `app/routes.py`

- [ ] **Step 1: Add the glob import**

In `app/routes.py`, add `import glob` to the stdlib imports block. Find:

```python
import os
import json
import uuid
import shutil
import hashlib
import threading
from datetime import datetime
from collections import OrderedDict
```

Replace with:

```python
import os
import json
import uuid
import glob
import shutil
import hashlib
import threading
from datetime import datetime
from collections import OrderedDict
```

- [ ] **Step 2: Add helper functions**

After the `_task_queue = OrderedDict()` line, insert:

```python

# -- Prompt template helpers ------------------------------------------
def _load_builtin_templates():
    from app.config import BUILTIN_TEMPLATES_DIR
    templates = []
    if not os.path.isdir(BUILTIN_TEMPLATES_DIR):
        print(f"[Templates] builtin dir not found: {BUILTIN_TEMPLATES_DIR}")
        return templates
    for path in sorted(glob.glob(os.path.join(BUILTIN_TEMPLATES_DIR, "*.txt"))):
        stem = os.path.splitext(os.path.basename(path))[0]
        tid = "builtin_" + stem.replace("-", "_")
        parts = stem.split("-")
        name_parts = parts[1:] if parts and parts[0].isdigit() else parts
        name = " ".join(w.capitalize() for w in name_parts)
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read().strip()
            templates.append({"id": tid, "name": name, "content": content, "is_builtin": True})
        except Exception as e:
            print(f"[Templates] Failed to load {path}: {e}")
    return templates


def _load_user_templates():
    from app.config import USER_TEMPLATES_FILE
    if not os.path.isfile(USER_TEMPLATES_FILE):
        return []
    try:
        with open(USER_TEMPLATES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"[Templates] Failed to load user templates: {e}")
        return []


def _save_user_templates(templates):
    from app.config import USER_TEMPLATES_FILE
    tmp_path = USER_TEMPLATES_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(templates, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, USER_TEMPLATES_FILE)

```

- [ ] **Step 3: Add the GET endpoint**

After the existing `get_default_prompt` route (the one at `/api/prompt`), add:

```python

@bp.route("/api/prompt-templates")
def get_prompt_templates():
    """Return all prompt templates: built-ins first, then user-saved."""
    return jsonify(_load_builtin_templates() + _load_user_templates())

```

- [ ] **Step 4: Add the POST endpoint**

Immediately after the GET endpoint:

```python

@bp.route("/api/prompt-templates", methods=["POST"])
def create_prompt_template():
    """Save a new user-defined prompt template."""
    body = request.get_json(force=True, silent=True) or {}
    name = (body.get("name") or "").strip()
    content = (body.get("content") or "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400
    if len(name) > 80:
        return jsonify({"error": "Name must be 80 characters or fewer"}), 400
    if not content:
        return jsonify({"error": "Content is required"}), 400
    template = {
        "id": str(uuid.uuid4()),
        "name": name,
        "content": content,
        "is_builtin": False,
    }
    templates = _load_user_templates()
    templates.append(template)
    _save_user_templates(templates)
    return jsonify(template), 201

```

- [ ] **Step 5: Add the DELETE endpoint**

Immediately after the POST endpoint:

```python

@bp.route("/api/prompt-templates/<template_id>", methods=["DELETE"])
def delete_prompt_template(template_id):
    """Delete a user-defined prompt template. Returns 403 for built-ins."""
    if template_id.startswith("builtin_"):
        return jsonify({"error": "Cannot delete built-in templates"}), 403
    templates = _load_user_templates()
    new_templates = [t for t in templates if t.get("id") != template_id]
    if len(new_templates) == len(templates):
        return jsonify({"error": "Template not found"}), 404
    _save_user_templates(new_templates)
    return jsonify({"ok": True})

```

- [ ] **Step 6: Start the server and run curl tests**

```bash
python run.py &
sleep 2
```

**Test 1 — GET returns 3 builtins:**
```bash
curl -s http://localhost:5000/api/prompt-templates | python3 -m json.tool
```
Expected: JSON array with 3 objects, each `"is_builtin": true`, IDs like `"builtin_01_meeting_minutes"`.

**Test 2 — POST creates a user template:**
```bash
curl -s -X POST http://localhost:5000/api/prompt-templates \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Template","content":"You are a test assistant."}' \
  | python3 -m json.tool
```
Expected: 201 response with a UUID `id` and `"is_builtin": false`. Copy the UUID for the next tests.

**Test 3 — GET now includes the user template (4 total):**
```bash
curl -s http://localhost:5000/api/prompt-templates | python3 -m json.tool
```
Expected: 4 items, user template last.

**Test 4 — POST with empty name returns 400:**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/prompt-templates \
  -H "Content-Type: application/json" -d '{"name":"","content":"x"}'
```
Expected: `400`

**Test 5 — DELETE user template:**
```bash
# Replace <UUID> with the id from Test 2
curl -s -X DELETE http://localhost:5000/api/prompt-templates/<UUID> | python3 -m json.tool
```
Expected: `{"ok": true}`

**Test 6 — DELETE builtin returns 403:**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE http://localhost:5000/api/prompt-templates/builtin_01_meeting_minutes
```
Expected: `403`

**Test 7 — DELETE unknown ID returns 404:**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE http://localhost:5000/api/prompt-templates/does-not-exist
```
Expected: `404`

```bash
kill %1
```

- [ ] **Step 7: Commit**

```bash
git add app/routes.py
git commit -m "feat: add /api/prompt-templates GET, POST, DELETE endpoints"
```

---

## Task 3: Add Template Selector HTML to index.html

**Files:**
- Modify: `static/index.html`

- [ ] **Step 1: Add i18n keys to the zh object**

In `static/index.html`, find the last two entries of the `zh` i18n object (around line 521-522):

```javascript
    deleteBtn: "删除",
    confirmDelete: "确认删除此条历史记录？删除后无法恢复。"
```

Replace with:

```javascript
    deleteBtn: "删除",
    confirmDelete: "确认删除此条历史记录？删除后无法恢复。",
    promptTemplateLabel: "提示词模板",
    selectTemplatePlaceholder: "── 选择模板 ──",
    saveAsTemplate: "另存为模板",
    deleteTemplate: "删除模板",
    templateNamePlaceholder: "模板名称...",
    templateBuiltinGroup: "内置模板",
    templateUserGroup: "我的模板",
    templateNameRequired: "请输入模板名称"
```

- [ ] **Step 2: Add i18n keys to the en object**

Find the last two entries of the `en` i18n object (around line 656-657):

```javascript
    deleteBtn: "Delete",
    confirmDelete: "Delete this history entry? This cannot be undone."
```

Replace with:

```javascript
    deleteBtn: "Delete",
    confirmDelete: "Delete this history entry? This cannot be undone.",
    promptTemplateLabel: "Prompt Template",
    selectTemplatePlaceholder: "── Select a template ──",
    saveAsTemplate: "Save as Template",
    deleteTemplate: "Delete Template",
    templateNamePlaceholder: "Template name...",
    templateBuiltinGroup: "Built-in",
    templateUserGroup: "My Templates",
    templateNameRequired: "Name required"
```

- [ ] **Step 3: Replace the main-form prompt section**

Find this exact block (lines 106-114):

```html
    <div style="margin-bottom:12px;">
      <label id="prompt-toggle-label" style="font-size:0.85rem;color:#4361ee;cursor:pointer;user-select:none;" onclick="togglePromptEditor()">▶ 自定义提示词</label>
      <div id="prompt-editor" style="display:none;margin-top:8px;">
        <textarea id="llm-prompt" rows="8" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;font-family:inherit;resize:vertical;line-height:1.5;"></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:4px;">
          <button id="prompt-reset-btn" onclick="resetPrompt()" style="padding:4px 12px;font-size:0.78rem;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;color:#666;">恢复默认</button>
        </div>
      </div>
    </div>
```

Replace with:

```html
    <div style="margin-bottom:12px;">
      <!-- Prompt Template selector (always visible) -->
      <div style="margin-bottom:10px;padding:10px 12px;background:#f8f9ff;border:1px solid #e0e4ff;border-radius:8px;">
        <label id="template-section-label" style="font-size:0.85rem;font-weight:600;color:#333;display:block;margin-bottom:8px;">📋 提示词模板</label>
        <select id="template-select" onchange="onTemplateSelect(this.value)" style="width:100%;padding:7px 10px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;margin-bottom:8px;background:#fff;">
          <option value="">── 选择模板 ──</option>
        </select>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button id="save-template-btn" onclick="showSaveTemplateInput()" style="padding:4px 12px;font-size:0.78rem;background:#f0f4ff;border:1px solid #4361ee;border-radius:4px;cursor:pointer;color:#4361ee;">另存为模板</button>
          <button id="delete-template-btn" onclick="deleteCurrentTemplate()" style="display:none;padding:4px 12px;font-size:0.78rem;background:#fff0f0;border:1px solid #e53935;border-radius:4px;cursor:pointer;color:#e53935;">删除模板</button>
        </div>
        <div id="save-template-input-area" style="display:none;margin-top:8px;">
          <div style="display:flex;gap:6px;align-items:center;">
            <input type="text" id="save-template-name" placeholder="模板名称..." maxlength="80" style="flex:1;padding:6px 8px;border:1px solid #ddd;border-radius:4px;font-size:0.82rem;">
            <button onclick="confirmSaveTemplate()" style="padding:5px 12px;font-size:0.78rem;background:#4361ee;color:#fff;border:none;border-radius:4px;cursor:pointer;">保存</button>
            <button onclick="cancelSaveTemplate()" style="padding:5px 10px;font-size:0.78rem;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;color:#666;">取消</button>
          </div>
          <div id="save-template-error" style="display:none;font-size:0.78rem;color:#e53935;margin-top:4px;"></div>
        </div>
      </div>
      <!-- Existing collapsible prompt editor (unchanged) -->
      <label id="prompt-toggle-label" style="font-size:0.85rem;color:#4361ee;cursor:pointer;user-select:none;" onclick="togglePromptEditor()">▶ 自定义提示词</label>
      <div id="prompt-editor" style="display:none;margin-top:8px;">
        <textarea id="llm-prompt" rows="8" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #ddd;border-radius:6px;font-size:0.85rem;font-family:inherit;resize:vertical;line-height:1.5;"></textarea>
        <div style="display:flex;justify-content:flex-end;margin-top:4px;">
          <button id="prompt-reset-btn" onclick="resetPrompt()" style="padding:4px 12px;font-size:0.78rem;background:#f5f5f5;border:1px solid #ddd;border-radius:4px;cursor:pointer;color:#666;">恢复默认</button>
        </div>
      </div>
    </div>
```

- [ ] **Step 4: Add template selector to the re-run dialog**

Find this exact block (around line 212):

```html
      <div style="margin-bottom:10px;">
        <label id="rerun-prompt-toggle-label" style="font-size:0.82rem;color:#4361ee;cursor:pointer;user-select:none;" onclick="toggleRerunPrompt()">▶ <span id="rerun-prompt-toggle-text">自定义提示词</span></label>
        <div id="rerun-prompt-editor" style="display:none;margin-top:6px;">
          <textarea id="rerun-llm-prompt" rows="5" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #ddd;border-radius:5px;font-size:0.82rem;font-family:inherit;resize:vertical;line-height:1.5;"></textarea>
        </div>
      </div>
```

Replace with:

```html
      <div style="margin-bottom:10px;">
        <select id="rerun-template-select" onchange="onRerunTemplateSelect(this.value)" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:5px;font-size:0.82rem;margin-bottom:8px;background:#fff;">
          <option value="">── 选择模板 ──</option>
        </select>
        <label id="rerun-prompt-toggle-label" style="font-size:0.82rem;color:#4361ee;cursor:pointer;user-select:none;" onclick="toggleRerunPrompt()">▶ <span id="rerun-prompt-toggle-text">自定义提示词</span></label>
        <div id="rerun-prompt-editor" style="display:none;margin-top:6px;">
          <textarea id="rerun-llm-prompt" rows="5" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #ddd;border-radius:5px;font-size:0.82rem;font-family:inherit;resize:vertical;line-height:1.5;"></textarea>
        </div>
      </div>
```

- [ ] **Step 5: Commit**

```bash
git add static/index.html
git commit -m "feat: add prompt template selector HTML to main form and rerun dialog"
```

---

## Task 4: Add Template Selector JavaScript + Wire Up

**Files:**
- Modify: `static/index.html`

- [ ] **Step 1: Add the template JS block**

Find this comment line in `static/index.html` (around line 2137):

```javascript
// ── Custom LLM Prompt ───────────────────────────────────────────────
```

Insert the following new block **immediately before** that comment. Note: `populateTemplateDropdown` uses only DOM methods (createElement/textContent/label attribute) — never innerHTML with user data — to avoid XSS.

```javascript
// -- Prompt Templates ------------------------------------------------

let _promptTemplates = [];
let _selectedTemplateId = null;

async function loadPromptTemplates() {
  try {
    const resp = await fetch("/api/prompt-templates");
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    _promptTemplates = await resp.json();
    populateTemplateDropdown();
  } catch (e) {
    console.warn("Failed to load prompt templates", e);
    const sel = document.getElementById("template-select");
    if (sel) {
      sel.disabled = true;
      sel.options[0].textContent = "Failed to load templates";
    }
  }
}

function _buildTemplateSelect(sel) {
  if (!sel) return;
  sel.textContent = "";  // safe DOM clear (no innerHTML)
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = t("selectTemplatePlaceholder");
  sel.appendChild(placeholder);

  const builtins = _promptTemplates.filter(tpl => tpl.is_builtin);
  const userTpls = _promptTemplates.filter(tpl => !tpl.is_builtin);

  if (builtins.length > 0) {
    const grp = document.createElement("optgroup");
    grp.label = t("templateBuiltinGroup");
    builtins.forEach(tpl => {
      const opt = document.createElement("option");
      opt.value = tpl.id;
      opt.textContent = tpl.name;  // textContent: safe, no HTML interpretation
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  }

  if (userTpls.length > 0) {
    const grp = document.createElement("optgroup");
    grp.label = t("templateUserGroup");
    userTpls.forEach(tpl => {
      const opt = document.createElement("option");
      opt.value = tpl.id;
      opt.textContent = tpl.name;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  }
}

function populateTemplateDropdown() {
  _buildTemplateSelect(document.getElementById("template-select"));
  _buildTemplateSelect(document.getElementById("rerun-template-select"));
}

function onTemplateSelect(id) {
  _selectedTemplateId = id || null;
  const tpl = _promptTemplates.find(tpl => tpl.id === id);
  const deleteBtn = document.getElementById("delete-template-btn");
  if (tpl) {
    document.getElementById("llm-prompt").value = tpl.content;
    localStorage.setItem("llm_custom_prompt", tpl.content);
    if (!_promptExpanded) togglePromptEditor();
    if (deleteBtn) deleteBtn.style.display = tpl.is_builtin ? "none" : "";
  } else {
    if (deleteBtn) deleteBtn.style.display = "none";
  }
}

function onRerunTemplateSelect(id) {
  const tpl = _promptTemplates.find(tpl => tpl.id === id);
  if (tpl) {
    document.getElementById("rerun-llm-prompt").value = tpl.content;
    if (!rerunPromptOpen) toggleRerunPrompt();
  }
}

function showSaveTemplateInput() {
  document.getElementById("save-template-input-area").style.display = "block";
  document.getElementById("save-template-name").focus();
  document.getElementById("save-template-error").style.display = "none";
}

function cancelSaveTemplate() {
  document.getElementById("save-template-input-area").style.display = "none";
  document.getElementById("save-template-name").value = "";
  document.getElementById("save-template-error").style.display = "none";
}

async function confirmSaveTemplate() {
  const nameEl = document.getElementById("save-template-name");
  const errorEl = document.getElementById("save-template-error");
  const name = nameEl.value.trim();
  if (!name) {
    errorEl.textContent = t("templateNameRequired");
    errorEl.style.display = "block";
    return;
  }
  const content = document.getElementById("llm-prompt").value;
  try {
    const resp = await fetch("/api/prompt-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      errorEl.textContent = err.error || "Save failed";
      errorEl.style.display = "block";
      return;
    }
    const newTpl = await resp.json();
    _promptTemplates.push(newTpl);
    populateTemplateDropdown();
    document.getElementById("template-select").value = newTpl.id;
    _selectedTemplateId = newTpl.id;
    const deleteBtn = document.getElementById("delete-template-btn");
    if (deleteBtn) deleteBtn.style.display = "";
    cancelSaveTemplate();
  } catch (e) {
    errorEl.textContent = "Save failed: " + e.message;
    errorEl.style.display = "block";
  }
}

async function deleteCurrentTemplate() {
  if (!_selectedTemplateId) return;
  const tpl = _promptTemplates.find(tpl => tpl.id === _selectedTemplateId);
  if (!tpl || tpl.is_builtin) return;
  try {
    const resp = await fetch("/api/prompt-templates/" + encodeURIComponent(_selectedTemplateId), {
      method: "DELETE",
    });
    if (!resp.ok) {
      const err = await resp.json();
      alert(err.error || "Delete failed");
      return;
    }
    _promptTemplates = _promptTemplates.filter(tpl => tpl.id !== _selectedTemplateId);
    _selectedTemplateId = null;
    populateTemplateDropdown();
    document.getElementById("template-select").value = "";
    const deleteBtn = document.getElementById("delete-template-btn");
    if (deleteBtn) deleteBtn.style.display = "none";
  } catch (e) {
    alert("Delete failed: " + e.message);
  }
}

```

- [ ] **Step 2: Call loadPromptTemplates() at startup**

Find this line (around line 2169):

```javascript
loadDefaultPrompt();
```

Replace with:

```javascript
loadDefaultPrompt();
loadPromptTemplates();
```

- [ ] **Step 3: Update applyTranslations() to refresh template section labels**

Find the closing lines of `applyTranslations()` (around lines 2047-2049):

```javascript
  const rerunPTText = document.getElementById("rerun-prompt-toggle-text");
  if (rerunPTText) rerunPTText.textContent = t("rerunPromptToggle");
}
```

Replace with:

```javascript
  const rerunPTText = document.getElementById("rerun-prompt-toggle-text");
  if (rerunPTText) rerunPTText.textContent = t("rerunPromptToggle");

  const tplLabel = document.getElementById("template-section-label");
  if (tplLabel) tplLabel.textContent = "📋 " + t("promptTemplateLabel");
  const saveTplBtn = document.getElementById("save-template-btn");
  if (saveTplBtn) saveTplBtn.textContent = t("saveAsTemplate");
  const deleteTplBtn = document.getElementById("delete-template-btn");
  if (deleteTplBtn && deleteTplBtn.style.display !== "none") deleteTplBtn.textContent = t("deleteTemplate");
  const tplNameInput = document.getElementById("save-template-name");
  if (tplNameInput) tplNameInput.placeholder = t("templateNamePlaceholder");
  if (_promptTemplates.length) populateTemplateDropdown();
}
```

- [ ] **Step 4: Sync the rerun dropdown when the panel opens**

Find the end of `_initRerunPanel()` (around line 1453-1455):

```javascript
  // Pre-fill prompt from main editor
  const mainPrompt = document.getElementById("llm-prompt").value;
  document.getElementById("rerun-llm-prompt").value = mainPrompt;
}
```

Replace with:

```javascript
  // Pre-fill prompt from main editor
  const mainPrompt = document.getElementById("llm-prompt").value;
  document.getElementById("rerun-llm-prompt").value = mainPrompt;

  // Sync rerun template dropdown from already-loaded templates
  if (_promptTemplates.length) populateTemplateDropdown();
  const rerunSel = document.getElementById("rerun-template-select");
  if (rerunSel) rerunSel.value = "";
}
```

- [ ] **Step 5: Manual browser test**

Start the app:
```bash
python run.py
```

Open `http://localhost:5000` and verify:

1. **Page load** — "Prompt Template" card is always visible, dropdown shows 3 built-in templates grouped under "内置模板" / "Built-in".
2. **Select "Meeting Minutes"** — textarea expands and fills with the meeting-minutes prompt. Delete button hidden.
3. **Select "Interview Analysis"** — textarea updates with interview prompt. Delete button still hidden.
4. **Edit textarea, click "另存为模板"** — name input appears. Leave blank and click Save — "请输入模板名称" error shows, no network call made.
5. **Enter a name and click 保存** — new template appears in dropdown under a second optgroup, auto-selected, Delete button visible.
6. **Click 删除模板** — template removed from dropdown, selection resets to placeholder, Delete button hidden.
7. **Open a past task, click "重新生成纪要"** — rerun panel shows a template dropdown above the prompt toggle with the same built-in options.
8. **Select a template in the rerun dropdown** — rerun textarea populates and expands.
9. **Switch language toggle to EN** — section label becomes "Prompt Template", buttons become "Save as Template" / "Delete Template", dropdown placeholder becomes "── Select a template ──".

- [ ] **Step 6: Commit**

```bash
git add static/index.html
git commit -m "feat: add prompt template JS logic, i18n keys, and applyTranslations wiring"
```

---

## Finishing Up

- [ ] **Gitignore user-templates.json**

```bash
echo "data/custom-prompts/user-templates.json" >> .gitignore
git add .gitignore
git commit -m "chore: gitignore user-templates.json"
```

---

## Final State Checklist

After all tasks complete, verify:

- [ ] `GET /api/prompt-templates` returns 3 built-ins + any user-saved templates
- [ ] Main form has a standalone "Prompt Template" section (always visible, above the collapsible textarea)
- [ ] Selecting a template populates the textarea and auto-expands it
- [ ] Saving a template persists to `data/custom-prompts/user-templates.json`
- [ ] Deleting a user template removes it; deleting a builtin returns 403
- [ ] Re-run LLM dialog has the same template dropdown
- [ ] CN/EN toggle updates all template section labels and option group labels
- [ ] `GET /api/prompt` (existing endpoint) still works unchanged
