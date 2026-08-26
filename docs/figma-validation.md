# Figma Frame Validation Matrix — VedaAI Extraction Flow

This matrix tracks the visual QA and structural compliance for every individual Figma frame in the `Extraction flow` page against the running application.

---

## 1. Frame Validation Table

| Figma Frame Name | Target Device | Authoritative Viewport | Implemented Components | Visual QA Status | Verification Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`Upload Screen - Empty State` [DESKTOP]** | Desktop | `1440 × 787` | Expanded `Sidebar` (`240px`), Topbar, `UploadScreen`, 2 empty dashed dropzones, disabled CTA | **VERIFIED** | Matches `1440 × 787` layout, title `1100 × 56` with orange underline under "Question", centered teacher avatar, dashed boxes, and `#B0B4BA` disabled button. |
| **`Upload Screen - filled state` [DESKTOP]** | Desktop | `1440 × 787` | Expanded `Sidebar` (`240px`), `UploadScreen` with 2 PDF cards (`Class_10_maths_unit_test.pdf` & `student_1_answer_sheet`), active `#18181B` CTA | **VERIFIED** | Matches side-by-side filled cards with red PDF badges, file sizes, page counts, `×` remove buttons, and active "Start Mapping &rarr;" pill button. |
| **`Loading state` [DESKTOP]** | Desktop | `1440 × 787` | Narrow `Sidebar` rail (`72px`), Compact Header (`← Exams`), `ProcessingScreen` with glowing 4-star sparkle cluster | **VERIFIED** | Matches vector-accurate coral sparkle cluster, pulsating ambient glow, "Extracting...", and "This may take a while". |
| **`Question - Answer mapping screen` [DESKTOP]** | Desktop | `1440 × 787` | Narrow `Sidebar` rail (`72px`), Compact Header (`← 📄 Exams`), 2-Panel `AssessmentReviewWorkspace` (`42%` Left Questions / `58%` Right Answer Sheet) | **VERIFIED** | Matches exact 2-panel layout, `Extracted Questions` + `Expand All`, Q1-Q9 cards, Q2 active orange border with AI feedback, and right ruled notebook answer sheet with green bounding box highlight (`Q2`). |
| **`Upload Screen - Empty State (phone)`** | Mobile | `390 × 844` | Mobile App Bar (`← VedaAI`, bell, avatar, `☰`), Stacked Hero & 2 dashed empty dropzones, disabled CTA | **VERIFIED** | Full-width touch-friendly mobile layout with stacked dropzones and disabled "Start Mapping &rarr;" button. |
| **`Upload Screen - filled state (phone)`** | Mobile | `390 × 844` | Mobile App Bar, 2 stacked filled PDF cards with remove buttons, active CTA | **VERIFIED** | Vertical stack with responsive PDF pills and enabled CTA. |
| **`Loading state (phone)`** | Mobile | `390 × 844` | Mobile App Bar, Centered glowing sparkles & "Extracting..." status | **VERIFIED** | Centered mobile loading card with simulated progress bar. |
| **`Question - Answer mapping screen - Question toggle (phone)`** | Mobile | `390 × 844` | Mobile App Bar, Top Segmented Toggle (`Questions` active), Full viewport Question List with score pills & AI feedback | **VERIFIED** | Independent mobile view for scrolling questions, viewing scores, and expanding AI feedback cards. |
| **`Question - Answer mapping screen - answer toggle (phone)`** | Mobile | `390 × 844` | Mobile App Bar, Top Segmented Toggle (`Answer Sheet` active), Full viewport Dark Header + Ruled Answer Sheet with Green Bounding Box | **VERIFIED** | Full-height notebook canvas with zoom & page controls and live green bounding box for the active question. |

---

## 2. Key Differences Resolved

1. **Eliminated Generic 3-Column Dashboard**:
   - The incorrect 3-column grading dashboard, large exam summary cards, and manual rubric editing panels have been completely removed from this screen.
2. **Dedicated Mobile Frame Implementation**:
   - Rather than relying on generic CSS flex wrapping, the mobile Question-Answer mapping screen implements dedicated `Question toggle` and `Answer toggle` frames per Figma specifications.
3. **Exact Desktop 2-Panel Workspace**:
   - Desktop view at `1440 × 787` renders a fixed narrow navigation rail (`72px`), compact header (`← 📄 Exams`), left question panel (`~42%`), and right large student answer sheet viewer (`~58%`) with normalized bounding box coordinates.
