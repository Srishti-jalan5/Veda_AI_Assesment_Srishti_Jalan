# UI / UX Design & Architecture Analysis

> **Source of Truth**: Visual specifications, layouts, and components extracted directly from attached desktop and mobile interface screenshots (`VedaAI` Assessment Analysis Platform).

---

## 1. Screen Inventory

| Screen ID | Screen Name | Platform / Viewport | State | Core Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **SCR-01A** | Document Upload Screen | Desktop (≥ 1024px) | **Empty / Initial** | Initial landing where teacher uploads Question Paper & Answer Sheet into side-by-side dropzones. |
| **SCR-01B** | Document Upload Screen | Mobile (< 768px) | **Empty / Initial** | Mobile layout for uploading Question Paper & Answer Sheet into stacked dropzones. |
| **SCR-02A** | Document Upload Screen | Desktop (≥ 1024px) | **Filled / Ready** | Both files uploaded (`Class_10_maths_unit_test.pdf` & `student_1_answer_sheet`), CTA enabled. |
| **SCR-02B** | Document Upload Screen | Mobile (< 768px) | **Filled / Ready** | Mobile view with both files populated in dashed cards, "Start Mapping →" button active. |
| **SCR-03A** | Extraction / Processing Screen | Desktop (≥ 1024px) | **Loading / Processing** | Animated orange sparkles with status "Extracting... This may take a while" after starting mapping. |
| **SCR-03B** | Extraction / Processing Screen | Mobile (< 768px) | **Loading / Processing** | Mobile responsive view of the extraction loading state. |

---

## 2. Component Inventory

### A. App Shell & Layout Structure

#### 1. Desktop Sidebar (Collapsible)
* **Expanded State (`~250px` width)**:
  * **Brand Header**: Black rounded-square icon with white `V` logo + `VedaAI` logotype + sidebar collapse toggle icon (`◫`).
  * **Featured Action Button**: Pill-shaped dark button with orange/coral outer glow/border and sparkle prefix: `✦ AI Teacher's Toolkit`.
  * **Navigation Links**:
    * ⊞ **Home** (Icon + Label)
    * 👥 **My Classroom** (Icon + Label)
    * 📄 **Assignments** (Icon + Label)
    * 📋 **Exams** (Active State: Light grey rounded rectangular background `#EDEDF0`, bold dark text)
    * 🕒 / 📊 **My Library** (Icon + Label)
  * **School Profile Card (Bottom)**: Light grey rounded card featuring school crest / logo (`Delhi Public School`), institution name, and location (`Bokaro Steel City`).
* **Collapsed State (`~64px` width)**:
  * Top: `V` brand icon.
  * Secondary: Circular dark button with orange accent and `✦` sparkle icon.
  * Icon-only navigation column: Home, Classroom, Assignments, Exams, Library.
  * Bottom: School crest badge and expand chevron icon (`>>`).

#### 2. Desktop Top Navigation Bar
* **Left Section**:
  * Back Arrow (`←`).
  * Context Section / Breadcrumb: Document icon + `Exams`.
* **Right Utility Cluster**:
  * `?` Help / Support circle icon button.
  * Notification Bell (`🔔`) with active red/orange unread badge indicator.
  * AI Sparkle Icon (`✦`).
  * User Profile Dropdown: Circular user avatar (illustrated flame head) + Full Name `Madhur Rastogi` + chevron dropdown arrow (`∨`).

#### 3. Mobile Header / App Bar
* Back Arrow (`←`) + Brand Text `VedaAI`.
* Right Actions: Notification Bell with orange badge, User avatar circle, and Hamburger menu icon (`☰`).

---

### B. Main Page Content Components

#### 1. Header & Central Hero Graphic
* **Page Title**: "Upload **Question Paper & Answer Sheets**"
  * Keyword highlighting: "Question Paper & Answer Sheets" in coral/orange text (`#FF5B26`), with an underline under "Question".
* **Subheading**: "Upload both files to get started" (Desktop) / "Upload Question Paper & Answer Sheets" (Mobile).
* **Avatar Illustration**: Circular orange gradient ring with orbiting orange badge icons around a central illustrated female teacher holding a book.

#### 2. File Upload Dropzone Containers
* **Container Styling**: Generous rounded rectangular card with light grey dashed border (`border-dashed border-2 border-slate-300`).
* **State 1 - Empty Dropzone**:
  * Centered square upload icon (`⇡` / upward arrow inside tray).
  * Primary Label: "Upload **Question Paper**" (with "Question Paper" in orange text).
  * Primary Label (Card 2): "Upload **Answer Sheet**" (with "Answer Sheet" in orange text).
  * Helper constraint: "Max 10MB".
* **State 2 - Filled File Card**:
  * Inner white rounded pill / container containing:
    * Red PDF badge icon (`PDF`).
    * File name label (e.g., `Class_10_maths_unit_test.pdf` / `student_1_answer_sheet`).
    * File metadata: File size and page count (e.g., `2MB • 2 Pages` / `8MB • 6 Pages`).
    * Remove Action: Circular dark grey close button (`×`) in upper right corner.

#### 3. Action Buttons & Helper Text
* **Primary Action CTA (`Start Mapping →`)**:
  * **Disabled State**: Muted grey pill background (`#B0B4BA` / `#C4C8D0`), white text, disabled cursor.
  * **Active / Enabled State**: Solid dark charcoal/black pill (`#18181B`), crisp white text and trailing arrow (`→`).
* **Informational Helper Note**: "Once both files are uploaded, you'll able to map answers with questions" (centered, muted grey text).

#### 4. Extraction / Processing State
* **Animation Centerpiece**: Large multi-point glowing orange/coral stars and sparkle graphics with soft ambient glow.
* **Status Headline**: "Extracting..." (Large bold font).
* **Status Subtext**: "This may take a while" (Muted grey font).

---

## 3. Typography Inventory

| UI Element | Font Weight | Approx Size (Desktop) | Approx Size (Mobile) | Color |
| :--- | :--- | :--- | :--- | :--- |
| **Main Page Title (H1)** | Bold / Extra Bold (700/800) | `30px - 34px` | `22px - 24px` | Primary Black `#18181B` / Accent Coral `#FF5B26` |
| **Page Subtitle** | Medium (500) | `14px - 15px` | `13px - 14px` | Muted Grey `#6B7280` |
| **Dropzone Header** | Semi-Bold (600) | `16px - 18px` | `15px - 16px` | Dark Neutral / Accent Coral |
| **File Metadata (Size/Pages)** | Regular (400) | `12px - 13px` | `11px - 12px` | Muted Grey `#71717A` |
| **CTA Button Text** | Semi-Bold (600) | `14px - 15px` | `14px - 15px` | Pure White `#FFFFFF` |
| **Footer Helper Text** | Regular (400) | `12px - 13px` | `11px - 12px` | Muted Grey `#71717A` |
| **Sidebar Nav Items** | Medium (500) / Semi-Bold (600) | `14px` | N/A (drawer) | Neutral Slate `#374151` (Active: `#111827`) |
| **School Card Title** | Bold (700) | `13px` | N/A | Dark Charcoal `#18181B` |
| **School Card Subtitle** | Regular (400) | `11px` | N/A | Muted Grey `#71717A` |
| **Loading Headline** | Bold (700) | `24px - 28px` | `20px - 22px` | Dark Charcoal `#18181B` |
| **Loading Subtext** | Regular (400) | `14px` | `13px` | Muted Grey `#71717A` |

---

## 4. Color Inventory

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Brand & Accents                                                       │
│  ■ Primary Orange/Coral: #FF5B26 / #FF6433 (Headings, badges, icons)   │
│  ■ Soft Orange Glow:     #FFF0EB / #FFE8E0 (Avatar rings, button halo) │
│                                                                        │
│  Dark & Primary Neutrals                                               │
│  ■ Dark Primary (Pill/CTA): #18181B / #1F242D                          │
│  ■ Dark Text:               #0F172A / #111827                          │
│                                                                        │
│  Backgrounds & Surfaces                                                │
│  ■ Shell Background:        #ECEEF2 / #F3F4F6                          │
│  ■ Main Card Background:    #FFFFFF (Pure White)                       │
│  ■ Active Nav Background:   #EDEDF0 / #F1F3F6                          │
│  ■ Dropzone Inner Pill:     #F8F9FA                                    │
│                                                                        │
│  Borders & Dividers                                                    │
│  ■ Dashed Dropzone Border:  #D1D5DB / #CBD5E1                          │
│  ■ Card / Shell Border:     #E2E8F0 / #E5E7EB                          │
│                                                                        │
│  Status & Feedback                                                     │
│  ■ Unread Dot Badge:        #FF3B30 / #FF4D4D                          │
│  ■ PDF Icon Badge:          #E53935 / #EF4444                          │
│  ■ Disabled CTA Button:     #B0B4BA / #C4C8D0                          │
│  ■ Muted / Metadata Text:   #6B7280 / #8E95A0                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Spacing & Layout Analysis

### Desktop Layout Structure
* **Outer Canvas**: Subtle cool-grey background (`#ECEEF2`).
* **Sidebar**: Fixed on left, `240px` to `260px` when expanded, `64px` when collapsed. Full height with sticky position.
* **Top Header**: Height `56px - 64px`, horizontal flexbox with space-between alignment.
* **Main Card Area**:
  * Inset from canvas with ~16px outer margin, rounded corners (`rounded-3xl` / `24px`).
  * White background (`#FFFFFF`), shadow-sm, containing the main workflow.
* **Upload Card Grid**:
  * 2 equal columns (`grid-cols-2` or flex-1 side by side) with `24px - 32px` gap.
  * Maximum content container width: `~960px - 1100px`.
* **Vertical Rhythm**:
  * Top spacing to title: `32px - 40px`.
  * Title to Avatar graphic: `20px - 24px`.
  * Avatar graphic to Upload boxes: `24px - 32px`.
  * Upload boxes to CTA button: `24px - 32px`.
  * CTA to footnote: `12px - 16px`.

### Mobile Layout Structure
* **Canvas**: Full width single column container (`100vw`).
* **Header**: Fixed top app bar (`56px` height) with `16px` horizontal padding.
* **Content Flow**:
  * Title and teacher avatar graphic at top with compact spacing (`16px - 20px`).
  * Upload Dropzones stacked vertically (`grid-cols-1` with `16px` gap).
  * Dropzone minimum height: `~120px` each.
  * CTA button full width or centered pill (`min-w-[200px]`).
  * Bottom safe area spacing: `24px - 32px`.

---

## 6. Interaction & State Analysis

```mermaid
stateDiagram-v2
    [*] --> InitialEmpty: Load Page / Upload Screen
    InitialEmpty --> OneFileUploaded: Upload Question Paper OR Answer Sheet
    OneFileUploaded --> InitialEmpty: Remove file (Click X)
    OneFileUploaded --> BothFilesUploaded: Upload second file
    BothFilesUploaded --> OneFileUploaded: Remove any file (Click X)
    
    state InitialEmpty {
        note right of InitialEmpty
            • Both dropzones dashed empty
            • CTA button DISABLED (Greyed out)
        end note
    }
    
    state BothFilesUploaded {
        note right of BothFilesUploaded
            • Both files show PDF card with metadata
            • CTA button ENABLED (Black pill)
        end note
    }
    
    BothFilesUploaded --> ExtractionLoading: Click "Start Mapping →"
    
    state ExtractionLoading {
        note right of ExtractionLoading
            • Main view displays animated orange sparkles
            • Shows "Extracting... This may take a while"
            • Triggers backend document parsing & question mapping
        end note
    }
```

### Key Interactions:
1. **Sidebar Collapse / Expand**:
   * Clicking `◫` on expanded sidebar shrinks it to icon-only mode.
   * Clicking `>>` on collapsed sidebar restores full expanded menu with labels.
2. **File Drag & Drop / File Selector**:
   * Drag over dropzone highlights border and displays active drop state.
   * Clicking dropzone opens system file picker (filters: `.pdf`, `.png`, `.jpg`, max 10MB).
   * Selected file replaces empty state with PDF badge, filename, file size, and page count.
3. **File Removal**:
   * Clicking the `×` circle button on an uploaded item immediately clears that file slot, resetting the dropzone to empty dashed state and disabling the CTA button.
4. **Primary CTA Gating**:
   * "Start Mapping →" remains disabled (`opacity-60 pointer-events-none`) until **both** Question Paper and Answer Sheet slots are filled.
5. **Extraction Transition**:
   * Clicking enabled "Start Mapping →" shifts screen into the animated loading state with glowing stars and "Extracting... This may take a while".

---

## 7. Responsive Behavior Analysis

| Viewport Dimension | Breakpoint | Sidebar Behavior | Header Layout | Upload Dropzones |
| :--- | :--- | :--- | :--- | :--- |
| **Desktop / Laptop** (≥ 1024px) | `lg:` / `xl:` | Left sidebar visible (Expanded or Collapsed) | Full Topbar with breadcrumb, help, notifications, AI shortcut, user name dropdown | 2-Column horizontal grid (`grid-cols-2`, `gap-6`) |
| **Tablet** (768px - 1023px) | `md:` | Sidebar defaults to collapsed icon strip or drawer | Compact Topbar | 2-Column or stacked based on width |
| **Mobile** (< 768px) | `< md:` | Sidebar hidden, accessible via hamburger `☰` menu | Mobile App Bar (`← VedaAI`, bell with badge, avatar, `☰`) | 1-Column vertical stack (`grid-cols-1`, `gap-4`) |

---

## Summary Checklist for Implementation Phase

- [x] Exact color palette extracted (Orange `#FF5B26`, Dark `#18181B`, Surface `#ECEEF2`, Canvas `#FFFFFF`).
- [x] Responsive layout rules defined for Desktop 2-column grid vs Mobile 1-column stack.
- [x] All 3 core views cataloged (Empty Upload State, Filled Upload State, Extraction Loading State).
- [x] Component hierarchy mapped (Sidebar, Topbar, Dropzone cards, File pills, CTA buttons, Loader).
- [x] State flow and disabled/enabled logic documented without altering visual fidelity.
