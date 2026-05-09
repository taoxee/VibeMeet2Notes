// ── Shared globals ──────────────────────────────────────────────────────────
let VENDORS = {};
let saveTimeout = null;
let currentLang = localStorage.getItem("app_lang") || "zh";

const vendorNames = {
  "腾讯云": { en: "Tencent Cloud" },
  "火山云": { en: "Volcengine" },
  "微软-世纪互联": { en: "Microsoft 21Vianet" },
  "Minimax-CN": { en: "Minimax-CN" },
  "阿里云": { en: "Alibaba Cloud" },
  "Minimax-Global": { en: "Minimax-Global" },
  "ElevenLabs": { en: "ElevenLabs" },
  "Soniox": { en: "Soniox" },
  "微软-Global": { en: "Microsoft" },
  "Groq": { en: "Groq" },
  "Deepgram": { en: "Deepgram" },
  "智谱": { en: "Zhipu AI" },
  "讯飞": { en: "iFlytek" },
  "OpenAI": { en: "OpenAI" },
  "FishAudio": { en: "FishAudio" },
  "BytePlus": { en: "BytePlus" },
  "阶跃星辰": { en: "StepFun" }
};

// ── i18n ────────────────────────────────────────────────────────────────────
const i18n = {
  zh: {
    title: "🎙️ 灵感纪要 · VibeMeet2Notes",
    subtitle: "上传音视频文件 → ASR 语音识别（说话人分离）→ LLM 会议纪要",
    tipBanner: "💡 推荐组合：ASR 选 <strong>Soniox</strong>，LLM 选 <strong>阿里云</strong>（速度快、识别准、性价比高）",
    uploadTitle: "📁 上传文件并处理",
    selectFile: "选择音视频文件（可多选）",
    asrVendor: "ASR 供应商（语音转文字 + 说话人分离）",
    llmVendor: "LLM 供应商（会议纪要）",
    selectPlaceholder: "-- 请选择 --",
    noAsrVendor: "⚠️ 暂无已配置的 ASR 供应商，请先在下方配置凭证",
    noLlmVendor: "⚠️ 暂无已配置的 LLM 供应商，请先在下方配置凭证",
    startBtn: "🚀 开始处理",
    queueTitle: "📋 任务队列",
    queueCollapse: "▲ 收起",
    queueExpand: "▼ 展开",
    resultsTitle: "📝 处理结果",
    transcript: "转录文本",
    summary: "会议纪要",
    tokenUsage: "🔢 Token 用量",
    historyTitle: "📂 历史任务",
    credsTitle: "🔑 供应商凭证管理",
    credsDesc: "凭证仅保存在浏览器本地，输入即自动保存，刷新页面后自动恢复。",
    importBtn: "📥 一键导入凭证",
    importFileBtn: "📁 从文件导入（CSV/JSON）",
    exportBtn: "📤 导出凭证",
    clearBtn: "🗑️ 清除所有凭证",
    vendorTableTitle: "📋 供应商能力一览",
    vendorCol: "供应商",
    typesCol: "支持的产品类型",
    credsCol: "所需凭证",
    optional: "(选填)",
    noHistory: "暂无历史任务",
    loadFailed: "加载失败",
    saved: "✅ 已自动保存",
    noCreds: "尚未配置任何供应商凭证",
    configured: "已配置",
    confirmClear: "确定要清除所有已保存的供应商凭证吗？此操作不可撤销。",
    noCredsExport: "没有可导出的凭证",
    exported: "✅ 凭证已导出为 vendor_creds.json",
    cleared: "🗑️ 所有凭证已清除",
    importSuccess: "✅ 已导入",
    vendors: "个供应商的",
    fields: "个凭证字段",
    noCredsDetected: "未检测到凭证。可通过环境变量、.env 文件或 vendor_keys.csv 配置。",
    importFailed: "导入失败",
    fileParseFailed: "文件解析失败",
    noValidCreds: "未从文件中解析到有效凭证",
    selectFileAlert: "请选择一个或多个音视频文件",
    selectAsrAlert: "请选择 ASR 供应商",
    selectLlmAlert: "请选择 LLM 供应商",
    missingCreds: "缺少必填凭证",
    loadTaskFailed: "加载任务失败",
    requestFailed: "请求失败",
    statusWaiting: "⏳ 等待中",
    statusRunning: "🔄 处理中",
    statusDone: "✅ 完成",
    statusError: "❌ 失败",
    success: "✅ 成功",
    queueRunning: "进行中",
    queueDone: "已完成",
    queueTotal: "共",
    speakersDetected: "🗣️ 识别到",
    speakersUnit: "位说话人",
    langLabel: "语言",
    modelLabel: "模型",
    inputLabel: "输入",
    outputLabel: "输出",
    totalLabel: "合计",
    tokensUnit: "tokens",
    taskIdLabel: "任务ID",
    processing: "处理中",
    voiceClone: "声音复刻",
    translation: "翻译",
    langParam: "语言参数",
    taskDone: "✅ 任务完成",
    taskFailed: "❌ 任务失败",
    queuing: "排队中...",
    uploading: "正在上传...",
    collapseText: "▲ 收起",
    expandText: "▼ 展开",
    errorDetail: "错误信息",
    modelDefault: "-- 默认 --",
    modelLoading: "加载模型中...",
    promptLabel: "系统提示词",
    promptToggle: "自定义提示词",
    promptReset: "恢复默认",
    stepUpload: "上传",
    stepTranscode: "转码",
    stepAsr: "语音识别",
    stepLlm: "会议纪要",
    stepDone: "完成",
    fwTitle: "📂 文件夹监控",
    fwEnable: "启用",
    fwSetDefault: "📂 设置默认监控文件夹",
    fwAddFolder: "+ 添加文件夹",
    fwAutoProcess: "自动处理",
    fwCustomPrompt: "自定义提示词",
    fwDetectedCount: "个新文件被检测到",
    fwRefresh: "刷新",
    fwProcess: "处理",
    fwSkip: "跳过",
    fwPermNeeded: "⚠ 需要授权",
    fwReauthorize: "重新授权",
    fwUseGlobal: "-- 使用全局设置 --",
    fwCompatTitle: "浏览器兼容性",
    fwCompatChrome: "Chrome / Edge: ✅ 完整支持",
    fwCompatFirefox: "Firefox: ❌ 不支持（功能不可用）",
    fwCompatSafari: "Safari: ⚠️ macOS 15.2+ 部分支持，每次启动需重新授权",
    fwCompatRec: "推荐使用 Chrome 或 Edge 浏览器",
    fwSelectVendorFirst: "请先配置 ASR 和 LLM 供应商凭证",
    fwClose: "关闭",
    fwNotSupported: "您的浏览器不支持文件夹监控功能",
    fwMaxFolders: "最多支持 3 个文件夹",
    fwHowItWorks: "原理：浏览器通过文件系统权限直接读取本地文件夹，每 10 秒检测是否有新录音文件，无需安装任何插件或本地程序。",
    copyBtn: "复制",
    downloadBtn: "下载",
    copied: "✅ 已复制",
    rerunBtn: "重新生成纪要",
    rerunSubmit: "生成",
    rerunLlmLabel: "LLM 供应商",
    rerunModelLabel: "模型",
    rerunPromptToggle: "自定义提示词",
    editBtn: "编辑",
    saveBtn: "保存",
    cancelBtn: "取消",
    batchProgress: "批次",
    batchAllDone: "全部 {n} 个文件处理完成",
    viewResult: "查看结果",
    onboardingTitle: "欢迎使用 VibeMeet2Notes！",
    onboardingMsg: "开始使用前，请先配置 ASR（语音识别）和 LLM（会议纪要）供应商凭证。凭证仅保存在浏览器本地，输入后自动保存。",
    onboardingBtn: "🔑 前往配置凭证 →",
    historySearch: "搜索历史记录...",
    deleteBtn: "删除",
    confirmDelete: "确认删除此条历史记录？删除后无法恢复。",
    promptTemplateLabel: "提示词模板",
    selectTemplatePlaceholder: "── 选择模板 ──",
    saveAsTemplate: "另存为模板",
    deleteTemplate: "删除模板",
    templateNamePlaceholder: "模板名称...",
    templateBuiltinGroup: "内置模板",
    templateUserGroup: "我的模板",
    templateNameRequired: "请输入模板名称",
    templateSaveConfirm: "保存",
    templateSaveCancel: "取消",
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
    previewUse: "✓ 使用此模板",
    navProcess: "处理",
    navVendors: "供应商"
  },
  en: {
    title: "🎙️ VibeMeet2Notes · 灵感纪要",
    subtitle: "Upload audio/video → ASR transcription (speaker diarization) → LLM meeting minutes",
    tipBanner: "💡 Recommended: ASR use <strong>Soniox</strong>, LLM use <strong>Open AI</strong> (fast, accurate, cost-effective)",
    uploadTitle: "📁 Upload & Process",
    selectFile: "Select audio/video files (multiple allowed)",
    asrVendor: "ASR Vendor (STT + Speaker Diarization)",
    llmVendor: "LLM Vendor (Meeting Minutes)",
    selectPlaceholder: "-- Select --",
    noAsrVendor: "⚠️ No ASR vendor configured. Please add credentials on the Vendors page.",
    noLlmVendor: "⚠️ No LLM vendor configured. Please add credentials on the Vendors page.",
    startBtn: "🚀 Start Processing",
    queueTitle: "📋 Task Queue",
    queueCollapse: "▲ Collapse",
    queueExpand: "▼ Expand",
    resultsTitle: "📝 Results",
    transcript: "Transcript",
    summary: "Meeting Minutes",
    tokenUsage: "🔢 Token Usage",
    historyTitle: "📂 Task History",
    credsTitle: "🔑 Vendor Credentials",
    credsDesc: "Credentials are stored locally in your browser only. Auto-saved on input.",
    importBtn: "📥 Auto Import",
    importFileBtn: "📁 Import from File (CSV/JSON)",
    exportBtn: "📤 Export",
    clearBtn: "🗑️ Clear All",
    vendorTableTitle: "📋 Vendor Capabilities",
    vendorCol: "Vendor",
    typesCol: "Supported Types",
    credsCol: "Required Credentials",
    optional: "(optional)",
    noHistory: "No task history",
    loadFailed: "Load failed",
    saved: "✅ Auto-saved",
    noCreds: "No vendor credentials configured",
    configured: "Configured",
    confirmClear: "Are you sure you want to clear all saved credentials? This cannot be undone.",
    noCredsExport: "No credentials to export",
    exported: "✅ Credentials exported as vendor_creds.json",
    cleared: "🗑️ All credentials cleared",
    importSuccess: "✅ Imported",
    vendors: "vendors with",
    fields: "credential fields",
    noCredsDetected: "No credentials detected. Configure via environment variables, .env file, or vendor_keys.csv.",
    importFailed: "Import failed",
    fileParseFailed: "File parse failed",
    noValidCreds: "No valid credentials found in file",
    selectFileAlert: "Please select one or more audio/video files",
    selectAsrAlert: "Please select an ASR vendor",
    selectLlmAlert: "Please select an LLM vendor",
    missingCreds: "Missing required credentials",
    loadTaskFailed: "Failed to load task",
    requestFailed: "Request failed",
    statusWaiting: "⏳ Waiting",
    statusRunning: "🔄 Processing",
    statusDone: "✅ Done",
    statusError: "❌ Failed",
    success: "✅ Success",
    queueRunning: "running",
    queueDone: "done",
    queueTotal: "total",
    speakersDetected: "🗣️ Detected",
    speakersUnit: "speakers",
    langLabel: "Language",
    modelLabel: "Model",
    inputLabel: "Input",
    outputLabel: "Output",
    totalLabel: "Total",
    tokensUnit: "tokens",
    taskIdLabel: "Task ID",
    processing: "Processing",
    voiceClone: "Voice Clone",
    translation: "Translation",
    langParam: "Language",
    taskDone: "✅ Task Complete",
    taskFailed: "❌ Task Failed",
    queuing: "Queuing...",
    uploading: "Uploading...",
    collapseText: "▲ Collapse",
    expandText: "▼ Expand",
    errorDetail: "Error Details",
    modelDefault: "-- Default --",
    modelLoading: "Loading models...",
    promptLabel: "System Prompt",
    promptToggle: "Custom Prompt",
    promptReset: "Reset to Default",
    stepUpload: "Upload",
    stepTranscode: "Transcode",
    stepAsr: "ASR",
    stepLlm: "LLM",
    stepDone: "Done",
    fwTitle: "📂 Folder Watch",
    fwEnable: "Enable",
    fwSetDefault: "📂 Set Default Watch Folder",
    fwAddFolder: "+ Add Folder",
    fwAutoProcess: "Auto-process",
    fwCustomPrompt: "Custom Prompt",
    fwDetectedCount: "new files detected",
    fwRefresh: "Refresh",
    fwProcess: "Process",
    fwSkip: "Skip",
    fwPermNeeded: "⚠ Permission needed",
    fwReauthorize: "Re-authorize",
    fwUseGlobal: "-- Use global setting --",
    fwCompatTitle: "Browser Compatibility",
    fwCompatChrome: "Chrome / Edge: ✅ Full support",
    fwCompatFirefox: "Firefox: ❌ Not supported",
    fwCompatSafari: "Safari: ⚠️ macOS 15.2+ partial, re-auth each session",
    fwCompatRec: "Recommended: Chrome or Edge",
    fwSelectVendorFirst: "Please configure ASR and LLM vendor credentials first",
    fwClose: "Close",
    fwNotSupported: "Your browser doesn't support Folder Watch",
    fwMaxFolders: "Maximum 3 folders supported",
    fwHowItWorks: "How it works: the browser reads your local folders directly via file system permissions, checking every 10 seconds for new recordings — no plugin or local app required.",
    copyBtn: "Copy",
    downloadBtn: "Download",
    copied: "✅ Copied",
    rerunBtn: "Re-run Notes",
    rerunSubmit: "Generate",
    rerunLlmLabel: "LLM Vendor",
    rerunModelLabel: "Model",
    rerunPromptToggle: "Custom Prompt",
    editBtn: "Edit",
    saveBtn: "Save",
    cancelBtn: "Cancel",
    batchProgress: "Batch",
    batchAllDone: "All {n} files complete",
    viewResult: "View results",
    onboardingTitle: "Welcome to VibeMeet2Notes!",
    onboardingMsg: "To get started, configure at least one ASR (speech-to-text) and one LLM (meeting notes) vendor. Credentials are saved only in your browser.",
    onboardingBtn: "🔑 Set Up Credentials →",
    historySearch: "Search history...",
    deleteBtn: "Delete",
    confirmDelete: "Delete this history entry? This cannot be undone.",
    promptTemplateLabel: "Prompt Template",
    selectTemplatePlaceholder: "── Select a template ──",
    saveAsTemplate: "Save as Template",
    deleteTemplate: "Delete Template",
    templateNamePlaceholder: "Template name...",
    templateBuiltinGroup: "Built-in",
    templateUserGroup: "My Templates",
    templateNameRequired: "Name required",
    templateSaveConfirm: "Save",
    templateSaveCancel: "Cancel",
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
    previewUse: "✓ Use This Template",
    navProcess: "Process",
    navVendors: "Vendors"
  }
};

// ── Core utilities ───────────────────────────────────────────────────────────
function t(key) {
  return i18n[currentLang]?.[key] || i18n.zh[key] || key;
}

function getVendorDisplayName(vendor) {
  const info = vendorNames[vendor];
  if (!info) return vendor;
  return currentLang === "zh" ? vendor : (info.en || vendor);
}

function getStoredCreds() {
  try { return JSON.parse(localStorage.getItem("vendor_creds") || "{}"); } catch { return {}; }
}

function getVendorCreds(vendor) {
  return getStoredCreds()[vendor] || {};
}

function isVendorReady(vendor) {
  const info = VENDORS[vendor];
  if (!info) return false;
  const creds = getStoredCreds()[vendor] || {};
  const required = info.fields.filter(f => !f.optional);
  return required.length > 0 && required.every(f => (creds[f.key] && creds[f.key].trim()) || (f.default && f.default.trim()));
}

function validateVendorCreds(vendor) {
  const info = VENDORS[vendor];
  const creds = getVendorCreds(vendor);
  const missing = info.fields.filter(f => !f.optional && (!creds[f.key] || !creds[f.key].trim()));
  if (missing.length > 0) {
    return `${getVendorDisplayName(vendor)} ${t("missingCreds")}: ${missing.map(f => f.label).join(", ")}`;
  }
  return null;
}

function saveCred(vendor, fieldKey, value) {
  const all = getStoredCreds();
  if (!all[vendor]) all[vendor] = {};
  all[vendor][fieldKey] = value;
  localStorage.setItem("vendor_creds", JSON.stringify(all));
  showToast();
  // Page-specific hook: vendors page updates indicators; process page repopulates selects
  window._onCredSaved?.(vendor);
}

function showToast() {
  const toast = document.getElementById("save-toast");
  if (!toast) return;
  toast.style.display = "block";
  toast.style.opacity = "1";
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 1200);
}

function escapeHtml(str) {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function renderMarkdown(text) {
  if (window.marked) {
    try { return marked.parse(text); } catch { /* fall through */ }
  }
  return escapeHtml(text).replace(/\n/g, "<br>");
}

// ── Translation helpers ──────────────────────────────────────────────────────
function translateType(type) {
  const map = { "声音复刻": t("voiceClone"), "翻译": t("translation") };
  return map[type] || type;
}

function translateNote(note) {
  if (currentLang === "zh") return note;
  const translations = {
    "方言自由说ASR，语言参数：autodialect（自动识别中英及中文方言）":
      "Dialect ASR. Language param: autodialect (auto-detect Chinese/English/dialects)",
    "火山海外版 BytePlus，服务海外用户":
      "BytePlus (International Volcengine) for overseas users",
  };
  return translations[note] || note;
}

function translateFieldLabel(label) {
  if (currentLang === "zh") return label;
  const map = {
    "语言参数": "Language",
    "密钥1": "Key 1",
    "密钥2": "Key 2",
    "位置/区域": "Region",
    "终结点": "Endpoint",
  };
  return map[label] || label;
}

function translateError(msg) {
  if (currentLang === "zh") return msg;
  return msg
    .replace("API 调用失败:", "API call failed:")
    .replace("处理失败:", "Processing failed:")
    .replace("转录结果为空，请检查音频文件是否包含语音内容", "Transcription is empty. Please check if the audio contains speech.")
    .replace("请上传有效的音视频文件", "Please upload a valid audio/video file")
    .replace("凭证格式错误", "Invalid credentials format")
    .replace("请选择 ASR 供应商并填写凭证", "Please select an ASR vendor and fill in credentials")
    .replace("请选择 LLM 供应商并填写凭证", "Please select an LLM vendor and fill in credentials");
}

// ── Language switching ───────────────────────────────────────────────────────
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("app_lang", lang);
  applyLanguage();
}

function applyLanguage() {
  const langSel = document.getElementById("lang-select");
  if (langSel) langSel.value = currentLang;

  // Nav logo toggle (CN/EN)
  const cnLogo = document.getElementById("nav-logo-cn");
  const enLogo = document.getElementById("nav-logo-en");
  if (cnLogo) cnLogo.style.display = currentLang === "en" ? "none" : "block";
  if (enLogo) enLogo.style.display = currentLang === "en" ? "block" : "none";

  // Page title
  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.textContent = currentLang === "en" ? "VibeMeet2Notes · 灵感纪要" : "灵感纪要 · VibeMeet2Notes";

  // Save toast text
  const toast = document.getElementById("save-toast");
  if (toast) toast.textContent = t("saved");

  // Delegate the rest to each page
  window._applyPageLanguage?.();
}

// ── Vendor data fetch ────────────────────────────────────────────────────────
async function fetchVendors() {
  const resp = await fetch("/api/vendors");
  VENDORS = await resp.json();
}
