# Figma Authoritative Specification & Measurement Registry

## Overview
Authoritative tokens, layout metrics, exact CSS properties, and frame-by-frame structural mapping for the **VedaAI** Assessment & Question-Answer Mapping application (Desktop 1440px).

---

## 1. Global Tokens & Typography
* **Font Family**:
  * Primary Headings & UI: `Bricolage Grotesque` (`font-bricolage`, Google Fonts weights: 400, 500, 600, 700, 800)
  * Secondary / Labels: `Inter`
* **Color Palette**:
  * Canvas Gradient: `linear-gradient(180deg, #F5F5F5 0%, #E9E5E5 100%)` (Upload) / `linear-gradient(180deg, #EEEEEE 0%, #DADADA 100%)` (Results & Loading)
  * Primary Brand Orange: `#FF5623` / `#FF5B26` / `#FF8D36`
  * Text Primary: `#303030` / `#2B2B2B` / `#0E1513`
  * Text Secondary Default: `rgba(94, 94, 94, 0.8)`
  * Text Secondary Muted: `rgba(94, 94, 94, 0.55)`
  * Success Green: `#34AC15` / `#3DD218` (Background: `rgba(69, 181, 41, 0.1)` / `rgba(94, 255, 53, 0.1)`)
  * Warning / Partial Orange: `#E3600F` (Background: `rgba(255, 153, 0, 0.1)`)
  * Alert / Red: `#C0350A` (Background: `#FFE9E2`)

---

## 2. Desktop Screens & Components

### A. Sidebar Component (`Sidebar.tsx`)
* **Expanded State (`304px × 763px`)**:
  * Position: `left: 12px, top: 12px`, Radius: `16px`, Background: `#FFFFFF`
  * Shadow: `0px 16px 48px rgba(0, 0, 0, 0.12), 0px 32px 48px rgba(0, 0, 0, 0.2)`
  * `Component 1` (Logo Icon): `40px × 40px`, radius `10px`, fill `#303030` with dual chevron paths
  * `VedaAI` text: `Bricolage Grotesque 700`, `28px`, `-0.06em`, `#303030`
  * AI Teacher's Toolkit Button: `251px × 42px`, `#272727`, radius `100px`, inner white glow
  * Nav Items: `Home`, `My Classroom`, `Assignments`, `Exams` (active `bg-[#F0F0F0]`), `My Library`
  * Footer: `Settings` button + `Delhi Public School` card (`256px × 84px`, `#F0F0F0`, radius `16px`)
* **Collapsed Rail State (`64px × 765px`)**:
  * Position: `left: 10px, top: 11px`, Radius: `16px`, Background: `#FFFFFF`
  * AI Teacher's Toolkit Pill: `44px × 42px`, `#272727`, radius `100px`, sparkle icon
  * Menu Icons: `36px × 36px` icon boxes
  * Footer: DPS badge icon (`46.48px × 47.2px`, `#F0F0F0`, radius `11.52px`) + `Chevrons right` expand button

### B. Top Navigation Bar (`TopNavbar.tsx`)
* Dimensions: `1100px × 56px` (Upload) / `1341px × 56px` (Results/Loading), Radius: `16px`
* Background: `rgba(255, 255, 255, 0.75)`, `backdrop-blur-md`
* Left Arrow Circle (`Frame 1984077294`): `40px × 40px`, `#FFFFFF`, radius `100px`
* Breadcrumb (`Frame 1618872410`): Clipboard icon + `Exams` text (`16px`, `#A9A9A9`)
* Desktop Right Controls:
  * Help button (`Frame 1984077296`): `36px × 36px`, `#F6F6F6`, circle with `?`
  * Notifications button (`Frame 1984077295`): `36px × 36px`, `#F6F6F6`, bell + `8px` `#FF5623` dot
  * AI Sparkle button (`Frame 1984077963`): `36px × 36px`, `#FFFFFF`, 4-point diamond star vector
  * User Profile (`Frame 1984077965`): `207px × 44px`, 32px flame avatar + `Madhur Rastogi` (16px) + Chevron

### C. Upload Screen (`UploadScreen.tsx` & `FileDropzone.tsx`)
* **Title Group (`Frame 1984078307`)**:
  * `Upload` in `#2B2B2B` (40px bold) + `Question Paper & Answer Sheets` in badge `rgba(255, 147, 80, 0.15)` (40px `#FF5623`)
  * Subtitle: `Upload both files to get started` (20px `#303030`)
* **Teacher Avatar Graphic (`Frame 1618872259`)**:
  * Concentric rings: `138px × 138px` and `108px × 108px` + Teacher illustration + 4 orbiting gradient badges
* **Dropzones Container (`Frame 1984078196` / `Frame 1984077806`)**:
  * Width: `789px`, Height: `205px`, Background: `rgba(255, 255, 255, 0.5)`, Radius: `24px`, Padding: `12px`
  * Empty State: `374.5px × 181px`, `#FFFFFF`, `1.5px dashed #CECECE`, radius `20px`, 48px icon box
  * Filled State (`Frame 1984078240`): `298px / 261px × 66px`, `#F6F6F6`, radius `12px`, red PDF icon, filename (16px 700), `2MB • 2 Pages`, dark close button (`25.6px`, `rgba(43,43,43,0.8)`)
* **CTA Button (`Frame 1984078309`)**:
  * `161px × 44px`, `#303030`, border `2px solid rgba(255,255,255,0.15)`, radius `64px`, opacity `0.25` (disabled) / `1` (active)
  * Footnote: `Once both files are uploaded, you’ll able to map answers with questions` (14px)

### D. Loading State (`ProcessingScreen.tsx`)
* Container (`Frame 1984077862`): `1343px × 696px`, `#FFFFFF`, Radius `24px`
* Animated Sparkle Graphic (`AnalysingLoader`): `128.15px × 134.49px`, glowing `#FF5623` diamonds
* Title: `Extracting...` (`30px`, Bricolage Grotesque 700, linear gradient text shimmer)
* Subtitle: `This may take a while` (`20px`, `rgba(70, 70, 70, 0.75)`)

### E. Question - Answer Mapping Screen (`AssessmentReviewWorkspace.tsx`)
* **Left Panel (`Frame 1984077861`)**: `672px` wide, `bg-white/50`, radius `20px`, padding `16px`:
  * Header: `Extracted Questions (from question paper)` (16px bold) + `Expand All` white pill button (`101px × 44px`, radius 64px)
  * 13 Questions (Q1 to Q13 with 11a and 11b):
    * Inactive cards: Dark circle `rgba(43, 43, 43, 0.8)` with white number, Question text (16px), Score badge (2/2, 0/2, 3/5, etc.)
    * Active Question 2: Border `2px solid #FF8D36`, Orange circle `bg-[#FF5623]`, `AI Feedback` card (`bg-[#F6F6F6]`, radius 16px, padding 16px 24px)
* **Right Panel (`Frame 1984077825`)**: `659px` wide, `bg-white`, border `1.25px solid rgba(0,0,0,0.1)`, radius `20px`:
  * Dark Toolbar (`Frame 1984077826`): `64px`, `bg-[#303030]`, `Answer Sheet`, zoom `100%`, `Page 1 of 4`
  * Paper Canvas: Handwritten student answers with diagrams
  * Active Q2 Bounding Box (`Frame 1984078206`): `border: 2px solid #3DD218`, `bg-[rgba(94,255,53,0.1)]`, radius `16px`, green tab header `Q2` (`bg-[#34AC15]`, radius `12px 12px 0 0`)
