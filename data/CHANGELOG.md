# Changelog

All notable changes to VibeMeet2Notes are documented here.

## 2026-05-06

### Features
- Prompt template system — select from built-in templates or save your own custom templates server-side; user templates persisted to `data/custom-prompts/user-templates.json` with atomic writes and concurrent-access protection
- Template selector in main form and re-run LLM dialog, with i18n support (EN/CN)
- Template Browser — compact bar + expandable inline panel replaces flat dropdown; featured one-click pills for common use cases, domain-filtered card grid (Meeting, Sales, HR, Product, Study, Law), preview pane before applying
- 13 builtin templates consolidated from `.txt` files into single `data/custom-prompts/builtin-templates.json` with stable UUIDs, domain, featured, and description fields
- 10 new builtin templates added: Study Lecture Note, Product Requirement Review, Brainstorming, Team Meeting, Customer Requirement Analysis, SPIN Selling, BANT/MEDDIC Analysis, GPCT Sales Summary, MEDDIC Sales Report, FAINT Sales Opportunities

### Bug Fixes
- Fixed pre-existing bug where Re-run LLM always returned 500 due to unreachable SSE response statement
- Delete template button moved into preview action row (alongside Cancel / Use This Template); delete now operates on the previewed template and closes the panel on success

## 2026-05-05

### Features
- Enhanced vibemeet2note branding with logos and reorganized prompt templates

## 2026-05-04

### Features
- Multi-file batch processing with improved visibility
- Editable meeting notes - modify generated summaries in-place
- Upload progress indicator, onboarding guide, and history search/delete functionality
- Re-run notes feature - regenerate summaries with different LLM/model/prompt without re-transcribing
- Copy and download result buttons, automatic vendor selection persistence

### Bug Fixes
- Fixed compatibility issue with OpenAI 5.x models (max_tokens and temperature settings)

## 2026-05-01

### Bug Fixes
- Fixed temporal dead zone errors in Folder Watch feature

### Features
- Folder Watch as dedicated card with improved caching controls (hidden now, since not stable)

## 2026-03-23

### Features
- Added 3 new vendors: FishAudio, BytePlus, StepFun

## 2026-03-06

### Features
- Intelligent prompt-aware caching - only re-run LLM when prompts actually change
- Custom LLM prompt editor for flexible prompt templates
- Chunked summarization for better handling of long transcripts, system role support
- Improved Markdown rendering with proper table support

## 2026-03-05

### Features
- LLM model selector - choose specific models for each vendor
- Redesigned task queue with compact cards, completion times, and improved history display
- Audio transcoding support with ffmpeg before speech recognition

### Bug Fixes
- Fixed UI refresh on language switch, improved error display and recommendations
- Improved error display - always show details even for partial results
- Fixed stale text in task queue and history when switching languages
- Fixed LLM prompt handling to match transcript language
- Fixed vendor display names in task history

## 2026-03-03

### Features
- Updated branding and licensing (Apache 2.0)
- Multi-language support with Chinese/English switcher

### Bug Fixes
- Fixed Chinese language translation for API key field
- Completed i18n translations for all UI elements

## 2026-03-02

### Features
- Task queue system with parallel processing, token tracking, and notifications

### Improvements
- Refactored application structure with modular architecture (config, utils, services, routes)

## 2026-02-28

### Features
- Recommendation banner and ElevenLabs service retry logic
- Completed all speech recognition vendor integrations
- API credential management - import/export with auto-detection
- Speaker identification and automatic meeting minutes generation

### Bug Fixes
- Fixed Aliyun ASR to use DashScope OSS upload for better reliability
