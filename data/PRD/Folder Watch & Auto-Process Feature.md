# Folder Watch & Auto-Process Feature

## Context

The user (non-technical, 60 years old) suffers through many meetings and wants meeting recordings to be automatically detected and processed into notes without manual file selection. The app is currently a local Flask + vanilla JS web app, but is planned to become a hosted web service. Therefore, folder watching must live entirely in the browser (File System Access API), not the Python backend — this is the only architecture that works both locally and as a deployed service.

**Design decisions:**
- Browser-side watching via `showDirectoryPicker()` (File System Access API)
- `DirectoryHandle` persisted in IndexedDB (can't go in localStorage)
- Per-folder settings (auto-process toggle, ASR/LLM vendor/model/prompt) in localStorage
- Detected files appear as a badge/list inside the existing Upload & Process card
- Up to 3 folders: 1 default + 2 optional; all start with auto-process OFF
- Check on app open + every 10s via `setInterval`
- Browser compat "i" button: Chrome/Edge full support, Firefox/Safari limited
- **No backend changes required** — detected files POST to the existing `/api/process` endpoint

---

## Critical File

**Only one file changes:** `static/index.html` (1,575 lines)

---

## Data Model

### localStorage

**`folder_watch_configs`** — Array of up to 3 folder config objects:
```json
[
  {
    "id": "fw_1714000000000",
    "label": "Zoom Recordings",
    "isDefault": true,
    "autoProcess": false,
    "asrVendor": "",
    "llmVendor": "",
    "llmModel": "",
    "llmPrompt": ""
  }
]
```
Empty strings for vendor/model/prompt mean "use the global UI selection at processing time."

**`folder_seen_files`** — Map of folder ID → array of fingerprint strings:
```json
{
  "fw_1714000000000": ["meeting.mp4::102400::1714000000000"]
}
```
Fingerprint: `"${name}::${size}::${lastModified}"`

**`folder_watch_enabled`** — `"1"` or `"0"` (master toggle)

### IndexedDB

- DB name: `vibemeet_folderwatch`, version 1
- Object store: `handles`, keyPath: `"id"`
- Records: `{ id: "fw_...", handle: FileSystemDirectoryHandle }`
- Module-level cache: `let _fwDB = null` (avoid reopening DB repeatedly)
- Live handles: `let _folderHandles = new Map()` (only handles with active permission)

---

## HTML Changes (static/index.html)

### 1. Detected Files Badge — inside Upload & Process card

**Insert after line 58** (`<h2>📁 上传文件并处理</h2>`), before the file input form-row:

```html
<!-- Folder Watch: Detected files badge area -->
<div id="fw-detected-area" style="display:none;margin-bottom:12px;padding:10px 14px;background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
    <span style="font-size:0.88rem;font-weight:600;color:#2e7d32;">
      📂 <span id="fw-detected-count">0</span> <span id="fw-detected-label">new files detected</span>
    </span>
    <button onclick="runFolderScan()" style="font-size:0.78rem;padding:2px 8px;border:1px solid #c8e6c9;border-radius:4px;background:#fff;cursor:pointer;color:#2e7d32;">
      ↻ <span id="fw-refresh-label">Refresh</span>
    </button>
  </div>
  <div id="fw-detected-list"></div>
</div>
```

### 2. Folder Watch Settings — inside Upload & Process card

**Insert after line 90** (end of prompt editor `</div>`), before the process button:

```html
<!-- Folder Watch Settings -->
<div id="fw-settings-section" style="margin-bottom:12px;border:1px solid #e9ecef;border-radius:8px;padding:12px 14px;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
    <label style="font-size:0.9rem;font-weight:600;color:#555;display:flex;align-items:center;gap:6px;">
      <span id="fw-section-title">📂 Folder Watch</span>
      <button onclick="showFolderWatchCompatInfo()" style="background:none;border:1px solid #ccc;border-radius:50%;width:18px;height:18px;font-size:0.7rem;cursor:pointer;color:#888;padding:0;line-height:1;">i</button>
    </label>
    <label style="font-size:0.82rem;color:#888;display:flex;align-items:center;gap:6px;cursor:pointer;">
      <input type="checkbox" id="fw-master-toggle" onchange="toggleFolderWatchMaster(this.checked)">
      <span id="fw-master-label">Enable</span>
    </label>
  </div>
  <div id="fw-folders-container"><!-- filled by renderFolderWatchSettings() --></div>
</div>
```

### 3. CSS additions

```css
.fw-folder-row { padding:8px 0; border-bottom:1px solid #f0f0f0; }
.fw-folder-row:last-child { border-bottom:none; }
#fw-detected-list .fw-file-row { display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #e0e0e0;font-size:0.85rem; }
#fw-detected-list .fw-file-row:last-child { border-bottom:none; }
```

---

## i18n Strings

| Key | zh | en |
|---|---|---|
| `fwTitle` | `"📂 文件夹监控"` | `"📂 Folder Watch"` |
| `fwEnable` | `"启用"` | `"Enable"` |
| `fwSetDefault` | `"📂 设置默认监控文件夹"` | `"📂 Set Default Watch Folder"` |
| `fwAddFolder` | `"+ 添加文件夹 ({n}/3)"` | `"+ Add Folder ({n}/3)"` |
| `fwAutoProcess` | `"自动处理"` | `"Auto-process"` |
| `fwCustomPrompt` | `"自定义提示词"` | `"Custom Prompt"` |
| `fwDetectedCount` | `"个新文件被检测到"` | `"new files detected"` |
| `fwRefresh` | `"刷新"` | `"Refresh"` |
| `fwProcess` | `"处理"` | `"Process"` |
| `fwSkip` | `"跳过"` | `"Skip"` |
| `fwPermNeeded` | `"⚠ 需要授权"` | `"⚠ Permission needed"` |
| `fwReauthorize` | `"重新授权"` | `"Re-authorize"` |
| `fwUseGlobal` | `"-- 使用全局设置 --"` | `"-- Use global setting --"` |
| `fwCompatTitle` | `"浏览器兼容性"` | `"Browser Compatibility"` |
| `fwCompatChrome` | `"Chrome / Edge: ✅ 完整支持"` | `"Chrome / Edge: ✅ Full support"` |
| `fwCompatFirefox` | `"Firefox: ❌ 不支持（功能不可用）"` | `"Firefox: ❌ Not supported"` |
| `fwCompatSafari` | `"Safari: ⚠️ macOS 15.2+ 部分支持，每次启动需重新授权"` | `"Safari: ⚠️ macOS 15.2+ partial, re-auth each session"` |
| `fwCompatRec` | `"推荐使用 Chrome 或 Edge 浏览器"` | `"Recommended: Chrome or Edge"` |
| `fwSelectVendorFirst` | `"请先选择 ASR 和 LLM 供应商"` | `"Please configure ASR and LLM vendors first"` |
| `fwClose` | `"关闭"` | `"Close"` |
| `fwNotSupported` | `"您的浏览器不支持文件夹监控功能"` | `"Your browser doesn't support Folder Watch"` |

---

## New JavaScript Functions

All added inside `<script>` after the `fetchModels()` block (~line 1480).

### IndexedDB Layer

```
openFolderWatchDB()      → Promise<IDBDatabase>  — open/create DB, cache in _fwDB
idbSaveHandle(id, hdl)  → Promise<void>          — put {id, handle} in store
idbGetHandle(id)         → Promise<handle|null>   — get single handle
idbDeleteHandle(id)      → Promise<void>          — delete handle
idbGetAllHandles()       → Promise<[{id,handle}]> — get all handles
```

### Config Helpers (localStorage)

```
getFolderConfigs()           → Array
saveFolderConfigs(arr)       → void
getSeenFiles()               → Object  (folderId → fingerprint[])
saveSeenFiles(obj)           → void
isFileSeen(folderId, file)   → boolean
markFileSeen(folderId, file) → void
```

### UI Rendering

**`renderFolderWatchSettings()`** — builds `#fw-folders-container`; each row has label, remove, auto-process toggle, conditional vendor/model/prompt fields; uses `t()` throughout for i18n.

**`saveFolderSetting(id, key, value)`** — updates config array; if `key === "llmVendor"` also calls `fetchModelsForFolder`.

**`fetchModelsForFolder(folderId, vendor)`** — same as `fetchModels()` but targets `#fw-llm-model-${folderId}`; reuses shared `_modelCache`.

**`showFolderWatchCompatInfo()`** — shows a `<dialog>` modal with Chrome/Edge/Firefox/Safari compat info.

**`toggleFolderWatchMaster(enabled)`** — writes `"1"` or `"0"` to `localStorage`.

### Folder Management

**`addFolderWatch(isDefault)`** — guards for browser support + 3-folder max; calls `showDirectoryPicker()`; saves handle to IDB and config to localStorage; adds to `_folderHandles`; re-renders and scans.

**`removeFolderWatch(id)`** — removes config, IDB handle, `_folderHandles` entry, seen-files entry.

**`reauthorizeFolder(id)`** — re-picks folder via `showDirectoryPicker()`, overwrites IDB handle, updates map, hides badge.

### Detection Engine

**`runFolderScan()`** — returns if master toggle off; iterates `_folderHandles`; calls `scanFolder` for each granted handle; calls `renderDetectedFiles(allNew)`; auto-queues files where `config.autoProcess === true`.

**`scanFolder(config, handle)`** → async; `for await` over handle entries; filters by extension; returns new unseen `{config, file}` pairs.

**`renderDetectedFiles(newFiles)`** — shows/hides `#fw-detected-area`; builds file rows with Process/Skip buttons; stores pending list in `_pendingFolderFiles`.

**`queueFolderFile(config, file)`** — resolves ASR/LLM from config or global UI fallback; adds to `taskQueue`; calls `scheduleQueuedTask(qid)`.

**`manualProcessFolderFile(config, file)`** — same as above but validates vendors first and alerts if missing.

### Permission Recovery

**`requestPermissionsForStoredHandles()`** → async; called in `init()`; iterates all IDB handles; `queryPermission` → if granted adds to `_folderHandles`, if "prompt" tries `requestPermission`, if denied shows badge; then calls `runFolderScan()`.

**`showPermBadge(id)` / `hidePermBadge(id)`** — toggles `#fw-perm-badge-${id}` and re-authorize button visibility.

### Queue Refactor

Extract `runNext` closure from `processFiles()` into two module-level functions:

**`scheduleQueuedTask(qid)`** — if under `MAX_PARALLEL`: runs task, then calls `drainQueue()`.

**`drainQueue()`** — starts waiting tasks up to concurrency limit.

`processFiles()` updated to use these instead of the inline closure. Behavior identical.

---

## init() Changes

```js
// After existing calls:
document.getElementById("fw-master-toggle").checked =
  localStorage.getItem("folder_watch_enabled") === "1";
renderFolderWatchSettings();
await requestPermissionsForStoredHandles();
setInterval(runFolderScan, 10000);
```

## applyLanguage() Changes

Add at the end (after `updateQueueUI()`):
- Update static DOM labels: `#fw-section-title`, `#fw-master-label`, `#fw-detected-label`, `#fw-refresh-label`
- Call `renderFolderWatchSettings()` to re-render all dynamic folder rows with new language

---

## Implementation Sequence

1. Add CSS to `<style>` block
2. Insert detected-files badge HTML after line 58
3. Insert folder-watch settings HTML after line 90
4. Add i18n strings to both `zh` and `en` objects
5. Add IndexedDB helper functions
6. Add localStorage config helpers
7. Refactor `processFiles()` → extract `scheduleQueuedTask` + `drainQueue`
8. Add folder management: `addFolderWatch`, `removeFolderWatch`, `reauthorizeFolder`, `saveFolderSetting`
9. Add UI rendering: `renderFolderWatchSettings`, `fetchModelsForFolder`, `showFolderWatchCompatInfo`, `toggleFolderWatchMaster`
10. Add detection engine: `scanFolder`, `runFolderScan`, `renderDetectedFiles`, `queueFolderFile`, `manualProcessFolderFile`
11. Add permission recovery: `requestPermissionsForStoredHandles`, `showPermBadge`, `hidePermBadge`
12. Update `init()` and `applyLanguage()`

---

## Verification

1. Open Chrome → `http://127.0.0.1:8080`
2. Upload & Process card shows "📂 Folder Watch" section
3. Enable master toggle → click "Set Default Watch Folder" → pick a folder
4. Drop a new audio file into that folder → within 10s badge appears with filename
5. Click "Process" → file enters task queue and processes normally
6. Enable "Auto-process" → drop another file → auto-queues without clicking
7. Refresh page → folder reappears, requests permission
8. Click "i" → compat modal shows browser info
9. Switch to EN → all Folder Watch labels update
10. Open in Firefox → "i" shows not-supported info; Add Folder button disabled

---

## Risks

- `requestPermission()` at startup may silently fail (needs user gesture in Chrome). Per-folder "Re-authorize" badge is the reliable fallback.
- Safari IDB handle persistence unreliable — always show re-authorize badge if permission not `"granted"`.
- Large folders: `handle.values()` is O(n) but fast (no content read). Cap at 200 entries if needed.
- `ALLOWED_EXTENSIONS` duplicated client-side — keep in sync with `app/config.py`.
