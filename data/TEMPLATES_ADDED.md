# New Prompt Templates — Session Update

## Summary
Added 10 new builtin meeting minutes templates to expand use cases beyond generic meetings.

---

## Templates Added (Files 04-13)

| # | File | Template Name | Use Case |
|---|---|---|---|
| 04 | `04-study-lecture-note.txt` | Study Lecture Note | Educational recordings, lectures, online courses |
| 05 | `05-product-requirement-review.txt` | Product Requirement Review | PRD discussions, feature reviews, requirement walkthroughs |
| 06 | `06-brainstorming.txt` | Brainstorming | Creative ideation sessions, whiteboarding calls |
| 07 | `07-team-meeting.txt` | Team Meeting | General team syncs, standup summaries |
| 08 | `08-customer-requirement-analysis.txt` | Customer Requirement Analysis | Pre-sales discovery, customer needs assessment |
| 09 | `09-spin-selling.txt` | SPIN Selling | Sales conversations using SPIN methodology (Situation, Problem, Implication, Need-Payoff) |
| 10 | `10-bant-meddic-analysis.txt` | BANT-MeDDIC Analysis | Sales qualification using BANT + MeDDIC frameworks |
| 11 | `11-gpct-sales-summary.txt` | GPCT Sales Summary | Sales deals analyzed via GPCT framework (Goals, Plans, Concerns, Timeline) |
| 12 | `12-meddic-sales-report.txt` | MEDDIC Sales Report | Comprehensive deal analysis using MEDDIC methodology |
| 13 | `13-faint-sales-opportunities.txt` | FAINT Sales Opportunities | Opportunity assessment using FAINT framework (Foundation, Authority, Intention, Negative, Timing) |

---

## Template Characteristics

All templates follow the project's standard structure:
- ✅ Clear role/expertise statement
- ✅ Explanation of JSON diarized input format
- ✅ Specific extraction and analysis responsibilities
- ✅ Language rule (preserve original language, no translation)
- ✅ Markdown output format specification

---

## How They Work

The app's `_load_builtin_templates()` function automatically:
1. Scans `data/custom-prompts/builtin/` for all `.txt` files
2. Converts filenames to readable template names:
   - `09-spin-selling.txt` → Template ID: `builtin_09_spin_selling`
   - Display name: "Spin Selling"
3. Makes them available in the template dropdown immediately

**No code changes required** — templates are instantly available!

---

## Status

All templates committed and shipped (2026-05-06). No outstanding next steps.

---

## Template Descriptions

### Educational & Team
- **Study/Lecture Note**: Hierarchical learning materials with key concepts, examples, and takeaways
- **Product Requirement Review**: Structured PRD analysis with scope, dependencies, and trade-offs
- **Brainstorming**: Idea capture organized by theme, novelty, and feasibility
- **Team Meeting**: Team status, blockers, decisions, and cross-team dependencies

### Pre-Sales & Discovery
- **Customer Requirement Analysis**: Business pain points, success metrics, implementation readiness
- **SPIN Selling**: Question categorization (Situation, Problem, Implication, Need-Payoff) with effectiveness assessment

### Sales Qualification & Closing
- **BANT-MeDDIC Analysis**: Combines Budget/Authority/Need/Timeline with Metrics/Economic Buyer/Decision Criteria/Process/Pain/Champion
- **GPCT Sales Summary**: Goals-Plans-Concerns-Timeline framework showing gaps and opportunities
- **MEDDIC Sales Report**: Deep deal analysis with champion strength, economic buyer engagement, and risk assessment
- **FAINT Opportunities**: Foundation/Authority/Intention/Negative/Timing assessment of deal viability

---

Generated: 2026-05-06
