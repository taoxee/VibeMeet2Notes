# ASRtoLLM 项目对话记录

## Conversation 1 (32 messages)

### Task 1: 项目初始化 — Flask + 前端 Web App
- 搭建 Flask 后端 + 原生 HTML/JS 前端，接受音视频文件，调用 ASR 转写后送 LLM 生成摘要
- 端口从 5000 改为 8080（macOS AirPlay 占用 5000）
- 文件：`app.py`, `static/index.html`, `requirements.txt`

### Task 2: 供应商凭证管理（动态字段）
- `app.py` 中 VENDORS 字典定义每个供应商的凭证字段，`secret: False` 的字段明文显示
- 密钥字段用 `type="text"` + CSS `-webkit-text-security: disc`（避免 macOS 切换输入法）
- 凭证自动保存到 localStorage，ASR/LLM 下拉框只显示凭证完整的供应商
- 供应商区域可折叠

### Task 3: Git 初始化与推送
- 创建 `.gitignore` 和 `README.md`，推送到 `https://github.com/taoxee/ASRtoLLM.git`

### Task 4: 任务输出目录
- 每次任务保存到 `output/<YYYYMMDD_HHMMSS_shortid>/`
- 包含：`meta.json`, `transcript.txt`, `summary.txt`, `asr_log.json`, `llm_log.json`, `source_<filename>`
- 添加 `/api/tasks` 和 `/api/tasks/<task_id>` 接口，前端有可折叠"历史任务"区域

### Task 5: 代理自动检测
- `_detect_proxy()` 通过 `scutil --proxy` 读取 macOS 系统代理
- 所有 API 调用使用共享 `requests.Session()` 配置代理
- 依赖 `requests[socks]`

### Task 6: SSE 进度条 + 分步预览
- `/api/process` 使用 Server-Sent Events 流式返回
- 前端显示进度条、步骤指示器，转写和摘要结果逐步展示

### Task 7: 重复文件缓存检测
- `_find_cached()` 在 `output/` 中查找相同文件名+供应商组合的历史结果
- 命中缓存时显示"✅ 命中缓存"

### Task 8: 说话人分离 + 会议纪要（核心功能转型）
- 从通用"摘要"转型为说话人分离 + 结构化会议纪要
- 创建 `ASR_prompt.txt` 和 `LLM_prompt.txt`，启动时加载
- ASR 输出结构化 JSON：`{metadata, segments}`，每段含 speaker/start_time/end_time/text
- LLM 接收分离后的 JSON，输出 Markdown 会议纪要
- 前端：说话人标签彩色显示（5色），摘要渲染 Markdown
- UI 标签更新："智能摘要"→"会议纪要"，"语音转文字"→"语音转文字 + 说话人分离"

### Task 9: 全部 11 个 ASR 供应商实现
- **OpenAI** — Whisper，OpenAI 兼容 API（verbose_json，单说话人）
- **Groq** — Whisper-large-v3，OpenAI 兼容 API
- **Deepgram** — Nova-2，原生分离（`diarize=true&utterances=true`）
- **ElevenLabs** — Scribe v1，分离 + 3次重试 + 代理回退
- **Soniox** — 异步上传 API，`enable_speaker_diarization`
- **火山云** — openspeech.bytedance.com submit+query API
- **腾讯云** — TC3-HMAC-SHA256 签名，`CreateRecTask` + 轮询，`SpeakerDiarization=1`
- **微软-Global** — Azure Fast Transcription REST API + `diarizationSettings`，Key + Region（默认 eastus）
- **微软-世纪互联** — 同 Global，中国端点（`{region}.api.cognitive.azure.cn`）
- **阿里云** — DashScope Paraformer-v2，OSS 上传凭证 API，`diarization_enabled=true`
- **讯飞** — raasr.xfyun.cn v2 API，分块上传，HMAC-SHA1 签名

### Task 10: 全部 7 个 LLM 供应商实现
- OpenAI (gpt-4o), Groq (llama-3.3-70b), 智谱 (glm-4-flash), Minimax-CN, Minimax-Global, 腾讯云 (deepseek-v3), 阿里云 (qwen-plus)

### Task 11: 凭证导入/导出/清除按钮
- 📥 一键导入凭证 — 调用 `/api/import-keys`（`import_keys.py` 自动检测环境变量/.env/vendor_keys.csv）
- 📁 从文件导入（CSV/JSON）— 自动识别格式
- 📤 导出凭证 — 下载 `vendor_creds.json`
- 🗑️ 清除所有凭证 — 清除 localStorage
- 创建 `import_keys.py`

### Task 12: 供应商字段调整
- 讯飞：添加 `language` 字段，默认 `autodialect`
- 微软-Global：简化为 Key + Region（移除密钥2/终结点）

### Task 13: 双语 README + Star History
- README 改为中英双语，含功能亮点、分离支持表、使用说明、输出结构、Star History 图表

### Task 14: 推荐提示横幅
- 页面顶部可关闭提示条："ASR 推荐 Deepgram，LLM 推荐 阿里云"
- 关闭后 localStorage 记住状态

### 用户纠正与偏好
- 端口 8080（非 5000）
- 不用 `type="password"`，用 CSS 遮罩
- 系统代理自动检测（ShadowsocksX-NG）
- zsh 中 `pip install 'requests[socks]'` 需引号
- 位置/区域/终结点/url 字段明文显示
- 供应商区域可折叠，上传功能突出
- 下拉框只显示凭证完整的供应商
- 微软-Global 只有 Key + Region
- 不自动 push，用户控制推送时机
- 目标是会议纪要（非字幕生成）

---

## Conversation 2 (3 messages)

### Task: 提交未暂存更改
- 将 Conversation 1 末尾未提交的更改（ElevenLabs 重试修复 + 推荐提示横幅）提交为 `21d17c4`
- 提交信息：`feat: add recommendation tip banner + ElevenLabs retry fix`
- 涉及文件：`app.py`, `static/index.html`, `LLM_prompt.txt`

### Task: 对话记录
- 将两次对话的完整摘要写入 `conversationHist.md`

### Git 状态
- 本地 main 领先 origin/main 4 个 commit（推送后同步）
- 最新 commit：`21d17c4`

---

## Conversation 3 (8 messages)

### Task 1: 多任务并行队列 + Token 用量记录
- 后端：`app.py` 新增 `threading` + `OrderedDict` 任务队列，`_task_lock` 线程安全，`/api/queue` 端点
- LLM handlers 改为返回 `(content, token_info)` 元组，`token_info` 含 model/prompt_tokens/completion_tokens/total_tokens
- Token 用量保存到 `meta.json` 的 `token_usage` 字段和 `llm_log.json`
- 前端：文件选择支持多选（`multiple`），前端维护 `taskQueue` 对象，最多 `MAX_PARALLEL=3` 个任务并行
- 每个任务独立 SSE 流，队列 UI 显示各任务状态/进度/token 用量
- 历史任务列表也显示 token 用量
- 文件：`app.py`, `static/index.html`

### Task 2: 处理结果显示文件名
- 结果卡片顶部新增 `#result-filename` 元素，显示 `📄 filename`
- 实时处理和历史任务加载均显示对应文件名

### Task 3: 任务队列可折叠 + 完成通知
- 任务队列标题可点击折叠/展开，显示任务计数（进行中/已完成/总数）
- 任务完成或失败时右上角弹出通知横幅（`.task-notify`）
- 通知 10 秒后自动消失，点 ✕ 可立即关闭
- 点击通知跳转到对应任务的处理结果

### Git 状态
- 提交 `c12de11`：`feat: multi-task queue with parallel processing, token usage tracking, collapsible queue, completion notifications`
- 已推送到 origin/main

---

## Conversation 4 (12 messages)

### Task 1: 项目结构重构
- 将单体 `app.py`（~1500行）拆分为模块化结构：
  - `app/__init__.py` — Flask 应用工厂 `create_app()`
  - `app/config.py` — 配置（路径、代理检测、VENDORS 字典、Prompt 模板）
  - `app/utils.py` — 工具函数（`allowed_file`, `seconds_to_hms`, `find_cached`）
  - `app/services.py` — 全部 ASR/LLM handler 函数及 handler 字典
  - `app/routes.py` — 所有 Flask 路由（Blueprint）
- `run.py` 作为项目唯一入口，删除根目录 `app.py`
- 数据文件移入 `data/`：`ASR_prompt.txt`, `LLM_prompt.txt`, `conversationHist.md`, `vendor_keys.csv`
- `config.py` 加载 prompt 时先查 `data/`，再回退根目录
- 修复 `send_from_directory` 404 问题（改用绝对路径）
- 删除根目录重复数据文件，`data/` 为唯一数据源

### Git 状态
- 提交 `6e42f2d`：`refactor: split monolithic app.py into modular structure`
- 已推送到 origin/main

---

## Conversation 5 (40 messages)

### Task 1: 删除根目录重复文档
- 删除根目录 `ASR_prompt.txt`, `LLM_prompt.txt`, `conversationHist.md`, `vendor_keys.csv`（已在 `data/` 中有副本）
- `data/` 为唯一数据源，`config.py` 先查 `data/` 再回退根目录

### Task 2: 更新 README.md
- 新增功能特性：多任务并行、Token 用量追踪、任务完成通知
- 启动命令从 `python app.py` 改为 `python run.py`
- 新增「项目结构」章节，展示模块化目录树

### Task 3: 更新 conversationHist.md
- 追加 Conversation 4 和 Conversation 5 摘要

### Git 状态
- 提交 `db713a3`：`docs: update README with new project structure, update conversation history`
- 已推送到 origin/main

---

## Conversation 6 (30+ messages)

### Task 1: 仓库重命名
- GitHub 仓库从 `ASRtoLLM` 重命名为 `VibeMeet2Notes`
- 更新本地 git remote URL：`git remote set-url origin https://github.com/taoxee/VibeMeet2Notes.git`
- 更新所有 README 中的 Star History 徽章 URL

### Task 2: README 英文版供应商名称翻译
- `README_EN.md` 中的中文供应商名称翻译为英文：
  - 腾讯云 → Tencent Cloud
  - 阿里云 → Alibaba Cloud
  - 火山云 → Volcengine
  - 微软-世纪互联 → Microsoft 21Vianet
  - 讯飞 → iFlytek
  - 智谱 → Zhipu AI

### Task 3: Web App 国际化 (i18n)
- 添加语言切换器（右上角下拉框）：🌐 中文 / 🌐 English
- 创建 `i18n` 对象，包含所有 UI 文本的中英文翻译
- 创建 `vendorNames` 对象，供应商名称中英文映射
- `t(key)` 函数获取当前语言的翻译文本
- `getVendorDisplayName(vendor)` 根据当前语言返回供应商显示名称
- `applyLanguage()` 函数切换语言时更新所有 UI 元素
- 语言偏好保存到 `localStorage`
- 所有 `alert()` 调用改用 `t()` 获取翻译文本

### Git 状态
- 提交 `047e271`：`docs: fix repo name in Star History badges, translate vendor names in README_EN`
- 已推送到 origin/main

### 用户纠正与偏好（持续有效）
- 入口：`python run.py`（非 `python app.py`）
- 不自动 push，用户控制推送时机
- `data/` 为数据文件唯一来源
- 端口 8080
- 密钥字段用 CSS `-webkit-text-security: disc`（非 `type="password"`）
- 目标功能：说话人分离 + 会议纪要（非字幕生成）
- 语言切换器不使用国旗图标，使用 🌐 + 语言名称

---

## Conversation 7 (completed)

### Task: i18n 收尾 + 翻译遗漏修复

- 修复 `showTaskNotification` 嵌套函数定义 bug（导致函数体未正确关闭）
- 新增 i18n key：`taskDone`, `taskFailed`, `queuing`, `uploading`, `collapseText`, `expandText`
- `processFiles` 中 `"排队中..."` 改为 `t("queuing")`
- `processSingleFile` 中 `"正在上传..."` 改为 `t("uploading")`
- `toggleSummary`, `toggleTranscript`, `toggleHistory`, `toggleCreds` 中硬编码 `▲ 收起` / `▼ 展开` 改为 `t("collapseText")` / `t("expandText")`
- `applyLanguage()` 中 history/creds/transcript/summary toggle 改用 `collapseText`/`expandText`（而非 `queueCollapse`/`queueExpand`）
- `applyLanguage()` 新增 `document.getElementById("page-title").textContent` 更新浏览器标签标题
- `updateCredsSummary` 中已配置供应商列表改用 `getVendorDisplayName()` 显示翻译名称
- 删除重复的 `getVendorDisplayName` 和 `getVendorTooltip` 函数定义
- EN i18n `tipBanner` 中 `阿里云` 改为 `Alibaba Cloud`
- Minimax-CN `接口密钥` 字段标签改为 `Key`（`app/config.py`）
- 文件：`static/index.html`, `app/config.py`, `data/conversationHist.md`

### Git 状态
- 提交 `90c12ee`：`fix: i18n completeness - toggle text, task notifications, page title, vendor names`
- 提交 `640031e`：`fix: translate Minimax-CN api_key label from 接口密钥 to Key`

---

## Conversation 8 (completed)

### Task 1: 品牌重命名 + 版权更新
- 页面标题/h1 更新为 `🎙️ 灵感纪要 · VibeMeet2Notes`（中文）/ `🎙️ VibeMeet2Notes · 灵感纪要`（英文）
- 浏览器标签 `<title>` 更新为 `灵感纪要 · VibeMeet2Notes`
- 所有 README 标题更新为 `VibeMeet2Notes · 灵感纪要`
- License 从 MIT 改为 Apache 2.0，`LICENSE` 文件补充版权人：`taoxee (https://github.com/taoxee)`
- 所有 README License 章节更新为 `Apache License 2.0 © taoxee`

### Task 2: 页面底部作者署名
- 页面底部新增 footer：`Made by taoxee · Apache 2.0`，taoxee 链接到 `https://github.com/taoxee`

### Task 3: README 前提条件 + ffmpeg 安装说明
- CN/EN README 新增「前提条件」章节：API Key + ffmpeg
- ffmpeg 支持 `pip install static-ffmpeg`（跨平台）或系统包管理器
- 新增功能特性：🔄 智能转码

### Task 4: ffmpeg 音频转码
- `app/utils.py` 新增 `transcode_audio()` — 上传文件自动转为 16kHz 单声道 MP3
- 支持系统 ffmpeg 和 `pip install static-ffmpeg`
- `app/routes.py` 在 ASR 调用前插入转码步骤，SSE 显示转码进度
- `run.py` 启动时检测 ffmpeg，未安装时打印安装提示
- 转码信息保存到 `meta.json` 的 `transcode` 字段

### Task 5: 代码清理
- 删除 `services.py` 中重复的 `transcribe_openai_compatible` 函数
- 删除 `index.html` 中未使用的 `getVendorTooltip` 函数
- 修复 `loadTask` 中 LLM 供应商名称未翻译问题

### Task 6: LLM Prompt 语言规则
- `data/LLM_prompt.txt` 新增明确的语言规则：输出语言必须与转录文本语言一致

### Task 7: 任务队列 + 历史任务 UI 优化
- 任务队列卡片改为紧凑布局（减小 padding/margin/font）
- 任务完成时间显示在卡片右侧（年月日时分秒）
- 任务队列按时间倒序排列（最新在上）
- 队列列表限高 300px 可滚动
- 历史任务卡片显示创建时间
- 点击失败的历史任务可跳转并显示错误原因

### Git 状态
- 提交 `704737e` → `0dbc4e9` → `af1a628` → `9e413f5`

---

## Conversation 9 (completed)

### Task 1: 修复中文模式下显示英文字符串问题
- `applyLanguage()` 切换语言后未重新渲染动态内容（任务队列、历史任务列表）
- 在 `applyLanguage()` 末尾新增 `updateQueueUI()` 和 `if (historyExpanded) loadTaskHistory()` 调用
- 修复：切换语言后，任务队列卡片和历史任务列表立即以新语言重新渲染

### Task 2: 修复失败任务不显示错误信息
- `loadTask()` 中错误显示条件 `!data.transcript && !data.summary` 过于严格
- ASR 成功/缓存后 LLM 失败的任务有 `transcript.txt`，导致错误被跳过
- 新增独立 `#error-section` 元素，只要 `data.meta.error` 存在就显示，不受 transcript/summary 影响
- 新增 i18n key `errorDetail`（中文「错误信息」/ 英文「Error Details」）
- `applyLanguage()` 中同步更新 error label

### Task 3: 修复切换语言后转录元数据仍显示中文
- `renderTranscript` 中 `🗣️ 识别到 X 位说话人 · 语言: zh` 使用 `t()` 但切换语言后不会重新渲染
- 新增 `_lastTranscriptMeta` 变量缓存最近一次转录的 speakers/lang
- `applyLanguage()` 中检测并刷新 transcript-meta 行

### Task 4: Markdown 表格渲染改进
- LLM 输出的会议纪要包含 Markdown 表格，但自定义 `renderMarkdown` 无表格解析能力
- 引入 `marked.js`（CDN: `cdn.jsdelivr.net/npm/marked/marked.min.js`）替代自定义渲染
- 保留 fallback：若 CDN 加载失败则使用简化版正则渲染
- 表格、代码块、嵌套列表等均可正确渲染

### Git 状态
- 提交 `271cc7b`：`fix: re-render queue and history on language switch`
- 提交 `f330539`：`fix: always show error details for failed tasks`

---

## Conversation 10 

### Task 1: 删除未使用的 ASR_prompt.txt + 清理死代码
- 删除 `data/ASR_prompt.txt`（ASR 供应商不接受文本 prompt）
- 移除 `app/config.py` 中 `ASR_PROMPT = _load_prompt("ASR_prompt.txt")`

### Task 2: LLM 模型选择器
- 后端 `app/routes.py`：新增 `/api/models` POST 端点，查询各 LLM 供应商可用模型列表
- 后端 `app/routes.py`：`/api/process` 读取 `llm_model` 参数并传递给 LLM handler
- 后端 `app/services.py`：所有 LLM handler 接受可选 `model` 参数，默认使用各供应商预设模型
- 前端 `static/index.html`：LLM 供应商旁新增模型下拉框，切换供应商时自动获取模型列表
- 模型选择按供应商保存到 localStorage，默认模型标 ★
- 新增 i18n key：`modelDefault`, `modelLoading`

### Task 3: 修复缓存匹配 bug（模型维度）
- `app/utils.py` 的 `find_cached()` 原本只匹配 file + asr_vendor + llm_vendor
- 新增 `llm_model` 参数，缓存摘要必须模型也匹配才命中
- `app/routes.py` 调用 `find_cached()` 时传入 `llm_model`

### Task 4: 长转录文本分块摘要（Map-Reduce）
- `app/services.py` 新增 `_chunk_transcript()` — JSON 感知分块，按说话人段落边界切分
- `_summarize_with_chunking()` 包装器：短文本单次调用，长文本 map-reduce
- 阈值 ~160k 字符（~80k tokens），大多数会议不会触发分块
- Reduce 步骤使用专用 `_REDUCE_PROMPT` 合并去重
- 所有 7 个 LLM 供应商均通过分块包装器调用
- Token 用量跨所有调用（map + reduce）累加

### Task 5: 不支持 system role 的模型兼容
- 部分模型（如 `qwen-mt-lite`）只接受 user/assistant role，不支持 system
- `summarize_openai_compatible` 和 `summarize_minimax` 新增 400 错误重试逻辑
- 检测到 role 相关错误时，自动将 system prompt 合并到 user message 重试

### Task 6: LLM 超时调整
- 所有 LLM 调用超时从 120s 提升到 300s（与 ASR 一致）
- 解决小模型（如 `qwen2.5-14b-instruct`）处理长转录超时问题

### Task 7: 进度条增强
- 任务队列进度条新增步骤指示器：上传 → 转码 → 语音识别 → 会议纪要 → 完成
- 当前步骤蓝色高亮，已完成步骤绿色 ✓
- 进度条加粗（4px → 6px），右侧显示百分比
- 下方显示后端返回的描述性消息
- 新增 i18n key：`stepUpload`, `stepTranscode`, `stepAsr`, `stepLlm`, `stepDone`

### Task 8: 任务失败时刷新历史列表
- error 事件处理中新增 `loadTaskHistory()` 调用
- 无论成功或失败，任务完成后均刷新历史任务列表

### Task 9: 长转录文本分块摘要（Map-Reduce）
- `app/services.py` 新增 `_chunk_transcript()` — JSON 感知分块，按说话人段落边界切分
- `_summarize_with_chunking()` 包装器：短文本单次调用，长文本 map-reduce
- 阈值 ~160k 字符（~80k tokens），大多数会议不会触发分块
- Reduce 步骤使用专用 `_REDUCE_PROMPT` 合并去重
- 所有 7 个 LLM 供应商均通过分块包装器调用
- Token 用量跨所有调用（map + reduce）累加

### Task 10: 不支持 system role 的模型兼容
- 部分模型（如 `qwen-mt-lite`）只接受 user/assistant role
- `summarize_openai_compatible` 和 `summarize_minimax` 新增 400 错误重试
- 检测到 role 相关错误时，自动将 system prompt 合并到 user message 重试

### Task 11: LLM 超时调整
- 所有 LLM 调用超时从 120s 提升到 300s（与 ASR 一致）
- 解决小模型处理长转录超时问题

### Task 12: 进度条增强
- 任务队列进度条新增步骤指示器：上传 → 转码 → 语音识别 → 会议纪要 → 完成
- 当前步骤蓝色高亮，已完成步骤绿色 ✓
- 进度条显示百分比和描述性消息
- 新增 i18n key：`stepUpload`, `stepTranscode`, `stepAsr`, `stepLlm`, `stepDone`

### Task 13: 任务失败时刷新历史列表
- error 事件处理中新增 `loadTaskHistory()` 调用
- 无论成功或失败，任务完成后均刷新历史任务列表

### Task 14: 更新文档
- 更新 `README_CN.md` 和 `README_EN.md`：新增 LLM 模型选择、分块摘要、模型兼容等功能描述
- 移除项目结构中已删除的 `ASR_prompt.txt`
- 更新缓存检测描述（新增模型维度）
- 更新 `conversationHist.md`

### Task 15: 前端自定义 LLM 提示词
- 后端 `app/routes.py`：新增 `/api/prompt` GET 端点，返回默认 LLM 系统提示词
- 后端 `app/routes.py`：`/api/process` 读取 `llm_prompt` 参数并传递给 LLM handler
- 后端 `app/services.py`：所有 LLM handler 和 `_summarize_with_chunking` 新增 `system_prompt` 参数
- 当 `system_prompt` 非空时覆盖默认 `LLM_PROMPT`，空值回退默认
- 清理 `_summarize_with_chunking` 中线程不安全的全局 `_cfg.LLM_PROMPT` 交换，改为直接传参
- 前端 `static/index.html`：模型选择器下方新增可折叠「自定义提示词」区域
- 页面加载时从 `/api/prompt` 获取默认提示词填充 textarea
- 编辑自动保存到 localStorage（`llm_custom_prompt`），「恢复默认」按钮一键重置
- 提交任务时将自定义提示词随 formData 发送
- 新增 i18n key：`promptLabel`, `promptToggle`, `promptReset`
- 修复：`_promptExpanded` 变量声明移至 `applyLanguage()` 调用之前，避免 temporal dead zone 导致 toggle 失效

### Task 16: 更新文档 + requirements.txt
- `requirements.txt`：移除未使用的 `openai` 依赖，改用 `>=` 版本约束
- `README_CN.md` / `README_EN.md`：新增自定义提示词功能描述，使用流程新增第 4 步
- `conversationHist.md`：追加 Tasks 15-16

### Task 17: 智能缓存 — 提示词维度比对
- `app/utils.py` `find_cached()` 新增 `llm_prompt` 参数，计算 SHA-256 哈希后与 `meta.json` 中的 `llm_prompt_hash` 比对
- 分步比对逻辑：Step 1 ASR 匹配（file + asr_vendor）→ Step 2 LLM 匹配（+ llm_vendor + llm_model + llm_prompt_hash）
- ASR 命中但提示词不同时返回 `(transcript, None)`，仅重跑 LLM；ASR 不同则返回 `(None, None)` 全部重跑
- `app/routes.py` 保存 `llm_prompt_hash` 到 `meta.json`，调用 `find_cached()` 时传入 `llm_prompt`
- 新增 `import hashlib` 到 `routes.py` 顶部导入

### Git 状态
- 提交 `b75845c`：`feat: LLM model selector + cache fix + cleanup`
- 提交 `fa7f010`：`feat: custom LLM prompt from frontend + requirements cleanup`
- 后续更改待提交（Task 17）

---

## Conversation 11 

### Task 1: 新增 3 个供应商（FishAudio, BytePlus, 阶跃星辰）
- `app/config.py` 新增 VENDORS 配置：
  - **FishAudio** — TTS only，字段：`api_key`
  - **BytePlus** — ASR, TTS, 声音复刻（火山海外版），字段：`app_id`, `access_token`, `secret_key`
  - **阶跃星辰** — ASR, TTS, 声音复刻, LLM，字段：`api_key`
- `app/services.py` 新增 ASR handlers：
  - `transcribe_byteplus()` — BytePlus ASR via openspeech API
  - `transcribe_stepfun()` — 阶跃星辰 ASR via OpenAI-compatible endpoint
- `app/services.py` 新增 LLM handler：阶跃星辰 via OpenAI-compatible API，默认模型 `step-1-8k`
- `app/routes.py` 新增 `阶跃星辰` 到 `_LLM_BASE_URLS` 和 `LLM_DEFAULT_MODELS`
- `tests/test_new_vendors.py` 新增 13 个测试用例覆盖新供应商

### Task 2: 火山云 ASR 错误 1022 修复
- 原 VC API (`/api/v1/vc/`) 返回 `error 1022: resource not granted`
- `transcribe_volcengine()` 改用 SAMI Large Model API (`/api/v3/sauc/bigmodel`)
- 新增 `_transcribe_volcengine_legacy()` 作为 fallback
- 若 SAMI 失败则自动回退到 legacy API

### Task 3: import_keys.py 支持新供应商 + JSON 导入
- `ENV_MAPPINGS` 新增 BytePlus, FishAudio, 阶跃星辰 环境变量映射
- `LABEL_TO_FIELD` 新增 CSV 字段映射
- 新增 `JSON_FIELD_MAPPINGS` 处理 JSON 字段名转换：
  - FishAudio: `Key` → `api_key`
  - BytePlus: `APPID` → `app_id`, `AccessToken` → `access_token`, `Secret Key` → `secret_key`
  - 阶跃星辰: `tts_stepfun_key` → `api_key`
- 新增 `parse_json_creds_file()` 函数解析 JSON 凭证文件
- `detect_all()` 支持 `--json` 参数，自动扫描 `data/20260323vendor_creds_format.json`

### Task 4: 前端 i18n 翻译补全
- `vendorNames` 新增 FishAudio, BytePlus, 阶跃星辰 英文名
- `translateFieldLabel()` 新增字段翻译：密钥1→Key 1, 密钥2→Key 2, 位置/区域→Region, 终结点→Endpoint
- `translateNote()` 新增 BytePlus note 翻译
- 新增 `translateError()` 函数翻译错误消息：API 调用失败→API call failed 等
- 错误显示处调用 `translateError()` 确保中英文切换

### 文件变更汇总
- `app/config.py` — 新增 3 个供应商定义
- `app/services.py` — 新增 2 个 ASR handler + 1 个 LLM handler + 火山云 SAMI API
- `app/routes.py` — 新增阶跃星辰 LLM 配置
- `import_keys.py` — 新增 JSON 导入 + 新供应商映射
- `static/index.html` — 新增翻译函数 + vendorNames
- `tests/test_new_vendors.py` — 新建测试文件

---

## Conversation 12 (current)

### Task 1: 文件夹监控（Folder Watch）功能实现

完整实现文件夹监控自动处理功能，仅修改 `static/index.html`：

- **Browser File System Access API**：`showDirectoryPicker()`，最多 3 个监控文件夹
- **IndexedDB 持久化**：DB `vibemeet_folderwatch`，存储 `FileSystemDirectoryHandle`
- **localStorage 配置**：`folder_watch_configs`（每文件夹配置）、`folder_seen_files`（已处理文件指纹）、`folder_watch_enabled`（主开关）
- **自动扫描**：`init()` 时启动 + `setInterval(runFolderScan, 10000)` 每 10 秒轮询
- **检测区域**：新文件以绿色 badge 展示在上传卡片中，含处理/跳过按钮
- **自动处理**：每个文件夹可独立配置 `autoProcess`，检测到新文件时自动入队
- **并发队列**：提取 `scheduleQueuedTask` + `drainQueue`，文件夹文件复用同一并发逻辑
- **浏览器兼容**：Chrome/Edge 完整支持；`i` 按钮显示 Firefox 不支持 / Safari 受限提示
- **i18n**：新增 20+ 个 Folder Watch 相关翻译 key，`applyLanguage()` 完整覆盖

### Task 2: 折叠/展开控件修复

- 原始实现：展开按钮（`<button>`）嵌套在 `<label>` 内，浏览器 label 拦截点击导致无响应
- 修复：将外层 `<label>` 改为 `<div onclick="toggleFwExpand()">`，展开标记改为 `<span>`，"i" 按钮加 `event.stopPropagation()`
- 最终重构（仿 history-toggle）：整个区域移出 Upload 卡片，成为独立卡片；h2 持有 `onclick`，展开标记 `<span>` 在 h2 内；`<button>` 移到 h2 **外侧**，彻底规避嵌套交互元素问题

### Task 3: 页面刷新后文件夹丢失修复

- **根因**：`requestPermission()` 需要用户手势，在 `init()` 中静默调用必然失败（Chrome 抛 DOMException，被 `catch` 吞掉），`_folderHandles` 始终为空，文件夹显示「⚠ 需要授权」
- **修复**：移除启动时的静默 `queryPermission/requestPermission` 流程；页面加载时对所有已存储文件夹**始终**显示 Re-authorize badge
- **重授权 UX 改进**：`reauthorizeFolder()` 先尝试对 IDB 中的原 handle 调用 `handle.requestPermission()`（无需重新选择文件夹），失败时才回退到 `showDirectoryPicker()`

### Task 4: 文件夹监控迁移为独立卡片

- 从 Upload & Process 卡片中移除 `#fw-detected-area` 和 `#fw-settings-section`
- 新增独立 `#fw-card`，位置在 Upload 卡片与 Task Queue 卡片之间
- 卡片结构：h2（可点击折叠）+ `#fw-body`（含 Enable 复选框、检测区域、文件夹列表）
- `toggleFwCard()` 完全仿照 `toggleHistory()` 实现，使用 `fwCardExpanded` 布尔变量

### Task 5: Chrome 缓存修复

- `send_from_directory` 默认设置 12 小时缓存，导致普通刷新仍加载旧文件
- `app/routes.py` 根路由新增响应头：`Cache-Control: no-cache, no-store, must-revalidate`

### Task 6: 修复 Folder Watch 折叠展开 TDZ 错误

- **根因**：`let _fwDB`, `_folderHandles`, `_pendingFolderFiles`, `FW_ALLOWED_EXT`, `fwCardExpanded` 均声明在 `init()` 和 `applyLanguage()` 调用之后（行 ~1670–1711），`let` 的 temporal dead zone 导致调用时抛出 `ReferenceError: Cannot access '...' before initialization`
- **修复**：将全部 5 个模块级变量声明移至 `init()` / `applyLanguage()` 调用行之前（行 1629–1633）

### 文件变更汇总
- `static/index.html` — Folder Watch 功能全实现 + 折叠修复 + 迁移为独立卡片 + TDZ 修复
- `app/routes.py` — 根路由新增 no-cache 响应头

---

## Conversation 13

### Task 1: OpenAI 5.x API 兼容修复
- **max_tokens 不支持**：检测 400 错误消息同时含 "max_tokens" 和 "max_completion_tokens" 时，将 `max_tokens` 替换为 `max_completion_tokens: 4096` 并重试
- **temperature 不支持**：检测 400 错误消息含 "temperature" 时，移除参数后重试
- 两种修复合并为一次重试（避免双重请求）
- 位置：`app/services.py` `summarize_openai_compatible()` 的 400 错误处理块

### Task 2: 双分支 Git 策略
- `main` = 稳定版（仅接收 bug fix cherry-pick）
- `dev` = 活跃开发分支（所有新功能）
- Folder Watch 在 dev 上隐藏（`display:none`），等待成熟后上线

### Task 3: 产品审计 + P0 功能实现

**产品审计**：以 PM/销售视角梳理核心上传→处理→查看循环，发现缺失功能，保存为 `data/feature-list.md`（P0~P3 分级）

**P0 — 复制/下载按钮（`33e6fa8`）**
- 转录和会议纪要标题行新增 📋 复制 / ⬇️ 下载按钮
- 复制：JSON 格式转录输出 `[Speaker] text`，纯文本直接复制
- 下载：`_transcript.txt` / `_notes.md`，`URL.createObjectURL(new Blob(...))`
- 新增 `_flashBtn()` 工具函数，复制后临时显示"✅ 已复制"

**P0 — 供应商选择跨刷新记忆（`33e6fa8`）**
- ASR/LLM `<select>` 新增 `onchange` 写 `localStorage`
- `populateSelects()` 恢复时优先用当前 session 值，其次 localStorage

**P0 — Re-run Notes 面板（`b302259`）**
- 后端：`POST /api/tasks/<task_id>/rerun-llm` — 读取缓存 `transcript.txt`，流式 SSE，覆写 `summary.txt` + `meta.json`
- 前端：结果卡片底部「重新生成纪要」按钮，展开面板含 LLM 供应商/模型/自定义提示词选择
- 生成中按钮文字改为 "⏳ 处理中..." 并禁用，完成后恢复

### Task 4: P1 — 上传进度条（`9a836d4`）
- `processSingleFile` 从 `fetch` 改为 `XMLHttpRequest`
- `xhr.upload.addEventListener("progress")` 更新 `task.percent`（0–8%）和"上传中... X/Y MB"消息
- `xhr.addEventListener("progress")` 增量读取 `xhr.response` 解析 SSE 流，行为与原 fetch 版完全一致

### Task 5: P1 — 新用户引导横幅（`9a836d4`）
- 当 ASR 和 LLM 均无已配置供应商时，页面顶部显示蓝色横幅
- 包含说明文字 + "🔑 立即配置凭证 →" 按钮
- 按钮调用 `scrollToCreds()`：展开凭证区域并平滑滚动到位
- 任意供应商配置完成后横幅自动隐藏（`populateSelects()` 驱动）
- 完整 zh/en i18n

### Task 6: P1 — 历史记录搜索 + 删除（`9a836d4`）
- 历史区域新增搜索输入框，按文件名实时过滤（客户端，无需重新请求）
- 每条历史记录新增 🗑️ 删除按钮
- 删除调用 `DELETE /api/tasks/<task_id>`（新后端端点，`shutil.rmtree`），立即从内存列表中移除并重渲染
- `_historyTasks` 模块变量存储已获取的任务列表，`renderHistory(filterText)` 统一渲染逻辑

### Task 7: P1 — 会议纪要可编辑（`289095c`）
- 会议纪要标题行新增 ✏️ 编辑 / ✅ 保存 / ✕ 取消 按钮
- 编辑模式：隐藏渲染 div，显示 `<textarea>` 填充原始 Markdown
- 保存：更新 `_currentSummaryRaw`，重新渲染 Markdown，调用 `PUT /api/tasks/<task_id>/summary` 持久化到 `summary.txt`
- 取消：不修改，恢复渲染视图
- 新 LLM 结果到来（队列处理或 re-run）时自动退出编辑模式
- 完整 zh/en i18n

### Task 8: P2 — 批量处理可见性（`686f4e5`）
- **自动展开队列**：上传 >1 个文件时，队列卡片自动展开（无需手动点击）
- **批次计数器**：队列标题显示 "批次: X/N"，随任务完成实时更新
- **批量完成通知**：最后一个文件完成时触发独立 toast（区别于每文件单独 toast）
- **"查看结果"提示**：已完成任务条目右下角显示 "👁 查看结果"，提示可点击
- `_batchIds` (Set) + `_batchNotified` (bool) 追踪当前批次状态，`processFiles()` 每次提交重置


### Git 提交记录（dev 分支）
- `33e6fa8`：`feat: P0 copy/download buttons + remember vendor selection`
- `b302259`：`feat: P0 re-run notes panel + backend endpoint + button feedback`
- `9a836d4`：`feat: P1 upload progress bar, onboarding banner, history search + delete`
- `289095c`：`feat: P1 editable meeting notes`
- `686f4e5`：`feat: P2 multi-file batch visibility`

---

## Conversation 14 (current)

### Task 1: Logo 集成 + Prompt 文件重组织

**问题描述**：用户添加了 3 个 logo 文件到 `data/logos/`，需要集成到 UI 中；同时建立 `custom-prompts/` 目录用于后续自定义 prompt 功能

**实现方案**：

**初始方案（两次迭代）**：
1. 第一版：直接复制 logo 文件到 `static/logos/`，HTML 引用 `/static/logos/xxx.png`
   - 提交 `db3a6a5`：`feat: add logos and reorganize prompts`
   - 添加 favicon：`<link rel="icon" href="/static/logos/web-tab-logo.png">`
   - 添加 EN banner logo，初始隐藏，via `applyLanguage()` 基于语言切换显示/隐藏
   - `app/config.py` line 73 更新：`LLM_PROMPT = _load_prompt("custom-prompts/meetingminutes-prompt.txt")`
   - 移动 `data/LLM_prompt.txt` → `data/custom-prompts/meetingminutes-prompt.txt`
   
2. 用户反馈：logo 太小且位置不对（左对齐）
   - 第二版：调整 `max-height: 300px`，改用 flexbox 实现中心对齐 `display:flex; justify-content:center`

**最终优化（消除重复）**：
3. 用户提问：为何 `/static/logos/` 存在，本不需要在此复制文件
   - 分析：单一真实源原则 — logo 来源是 `data/logos/`，不应在 `static/` 中复制
   - 提交 `956ceeb`：`refactor: serve logos from data/ via Flask route instead of static duplication`
   - `app/routes.py` 新增路由：`@bp.route("/logos/<filename>")` → `send_from_directory(os.path.join(BASE_DIR, "data", "logos"), ...)`
   - HTML 更新：`/static/logos/xxx` → `/logos/xxx`
   - 删除 `static/logos/` 目录

**logo 尺寸调整说明**：
- 用户要求 logo 尺寸可调
- 提交 `2035d8d`：`docs: add logo size adjustment comments`
- HTML 中添加详细注释说明如何调整：
  - `max-height:300px` 控制大小（改为 200px 缩小，改为 400px 放大）
  - `margin-bottom:24px` 控制与下方内容的距离
  - 包含 EN/CN 语言切换逻辑说明

**文件变更汇总**：
- `static/index.html` — favicon + EN logo 标记 + `applyLanguage()` 切换逻辑 + 尺寸调整注释
- `app/config.py` — prompt 路径 update
- `app/routes.py` — logo 服务路由 + 文件移动处理
- `data/LLM_prompt.txt` → `data/custom-prompts/meetingminutes-prompt.txt`

### Git 提交记录（dev 分支 + 最新）
- `686f4e5`：`feat: P2 multi-file batch visibility`
- `db3a6a5`：`feat: add logos and reorganize prompts`
- `956ceeb`：`refactor: serve logos from data/ via Flask route instead of static duplication`
- `2035d8d`：`docs: add logo size adjustment comments`

