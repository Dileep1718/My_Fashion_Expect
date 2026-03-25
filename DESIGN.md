# DESIGN.md — MY Outfit (Mo) Visual Source of Truth
> Extracted from Stitch Project `16299482630115728064` on 2026-03-24

---

## 1. Color Palette

| Token | Name | Hex | Usage |
|---|---|---|---|
| `obsidian` | Obsidian Black | `#0B0B0B` | Primary backgrounds, navbars |
| `cream` | Cream Silk | `#FFFDD0` | Surface cards, text on dark bg |
| `silver` | Silver Birch | `#E2E2E2` | Borders, dividers, accent lines |
| `mist` | Soft Mist | `#F5F5F0` | Secondary surface, input fills |
| `charcoal` | Charcoal | `#1A1A1A` | Secondary backgrounds, modals |
| `accent` | Warm Taupe | `#C4A882` | CTA buttons, active states |
| `error` | Blush Red | `#E03E3E` | Errors, destructive actions |
| `success` | Sage Green | `#4CAF78` | Success states, positive signals |

### Usage Rules
- **Dark screens** (Home Feed, Profile, Try-On): `bg-obsidian`, text `cream`
- **Light screens** (Auth, Style Quiz, Settings): `bg-mist`, text `obsidian`
- **Cards / Bento modules**: `bg-charcoal` with `cream` text, `silver` border at 0.5px
- **CTA Buttons**: `bg-accent` with `obsidian` text, `rounded-2xl`

---

## 2. Typography

### Font Families
| Role | Family | Source |
|---|---|---|
| **Primary / Headings** | `Inter` | Google Fonts |
| **Secondary / Labels** | `Cabinet Grotesk` | Fontshare / Google Fonts |
| **Monospace / Tags** | `JetBrains Mono` | Google Fonts (optional) |

### Type Scale
| Name | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `display` | 36px / 2.25rem | 800 | 1.1 | Hero headlines, Splash logo |
| `h1` | 28px / 1.75rem | 700 | 1.2 | Screen titles |
| `h2` | 22px / 1.375rem | 600 | 1.3 | Section headings |
| `h3` | 18px / 1.125rem | 600 | 1.35 | Card titles |
| `body` | 15px / 0.9375rem | 400 | 1.5 | Body copy |
| `caption` | 12px / 0.75rem | 400 | 1.4 | Tags, metadata |
| `label` | 11px / 0.6875rem | 600 | 1.2 | All-caps UI labels |

### Typography Rules
- Use `Cabinet Grotesk` for all **navigation labels** and **button text**
- Use `Inter` for all **body text**, **captions**, and **descriptions**
- Minimum touch target for text labels: **44×44pt**
- Letter spacing for `label`: `+0.08em` (tracking-wider)

---

## 3. Bento 2.0 Grid System

### Core Dimensions
| Property | Value |
|---|---|
| Outer Margin | `24px` each side |
| Column Gutter | `16px` |
| Row Gutter | `16px` |
| Module Padding | `8px` |
| Card Border Radius | `16px` (sm) / `24px` (lg) |
| Min Card Height | `120px` |

### Module Configurations
```
┌─────────────────────────────────────┐  ← 24px
│  ┌──────────┐  ┌──────────────────┐ │
│  │  1 × 1   │  │     1 × 2        │ │  16px gutter
│  │ (square) │  │  (wide card)     │ │
│  └──────────┘  └──────────────────┘ │
│  ┌──────────────────────────────┐   │
│  │         2 × 2 (feature)      │   │
│  │   image must be ≥ 50% area   │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Bento Rules
1. **High-impact imagery** must occupy **≥ 50%** of any card's surface area
2. A 2×2 card always has `rounded-3xl` (24px), 1×1 uses `rounded-2xl` (16px)
3. Cards use **glassmorphism** on dark backgrounds: `bg-white/5 backdrop-blur-md`
4. Minimum 2-column grid; never single-column on screens wider than 375px
5. Overflow scroll is **horizontal** on "Row" sections (Follower Feed, Suggestions)

---

## 4. Component Tokens

### Buttons
| Variant | Background | Text | Radius | Height |
|---|---|---|---|---|
| Primary | `#C4A882` | `#0B0B0B` | `rounded-2xl` | `56px` |
| Secondary | `transparent` | `#FFFDD0` | `rounded-2xl` border `#E2E2E2` | `56px` |
| Ghost | `transparent` | `#C4A882` | `rounded-xl` | `44px` |
| Destructive | `#E03E3E` | `#FFFDD0` | `rounded-2xl` | `56px` |

### Tag Chips
- Background: `#1A1A1A`
- Border: `0.5px solid #E2E2E2`
- Text: `Cabinet Grotesk 11px 600 #FFFDD0`
- Padding: `4px 12px`
- Radius: `rounded-full`

### Bottom Tab Bar
- Background: `#0B0B0B` with `border-t border-silver/20`
- Height: `72px` (plus safe area)
- Active icon: `#C4A882`
- Inactive icon: `#E2E2E2 opacity-40`
- Label: `Cabinet Grotesk 10px`

### Input Fields
- Background: `#1A1A1A`
- Border: `1px solid #E2E2E2/30`
- Text: `Inter 15px #FFFDD0`
- Placeholder: `#E2E2E2 opacity-40`
- Radius: `rounded-xl`
- Height: `52px`
- Focus border: `#C4A882`

---

## 5. Screen Inventory (19 Screens)

| # | Screen | File | Navigator |
|---|---|---|---|
| 1 | PRD Document | *(design reference only)* | — |
| 2 | Splash | `SplashScreen.tsx` | Root Stack |
| 3 | Onboarding | `OnboardingScreen.tsx` | Auth Stack |
| 4 | Login / Auth | `LoginScreen.tsx` | Auth Stack |
| 5 | Register | `RegisterScreen.tsx` | Auth Stack |
| 6 | Style Quiz | `StyleQuizScreen.tsx` | Auth Stack |
| 7 | Body Ratio Input | `BodyRatioScreen.tsx` | Auth Stack |
| 8 | Home Feed | `HomeFeedScreen.tsx` | Main Tab |
| 9 | Outfit Suggestion | `OutfitSuggestionScreen.tsx` | Main Tab |
| 10 | AI Try-On | `TryOnScreen.tsx` | Main Tab |
| 11 | Virtual Closet | `VirtualClosetScreen.tsx` | Main Tab |
| 12 | OOTD Posting | `OOTDPostScreen.tsx` | Main Tab |
| 13 | Follower Feed | `FollowerFeedScreen.tsx` | Main Tab |
| 14 | Fit Check | `FitCheckScreen.tsx` | Main Tab |
| 15 | Wardrobe Categories | `WardrobeCategoryScreen.tsx` | Main Tab |
| 16 | Style Filter | `StyleFilterScreen.tsx` | Modal |
| 17 | Profile | `ProfileScreen.tsx` | Main Tab |
| 18 | History | `HistoryScreen.tsx` | Profile Stack |
| 19 | Settings | `SettingsScreen.tsx` | Profile Stack |

---

## 6. Motion & Animation Tokens

| Token | Value | Usage |
|---|---|---|
| `duration.fast` | `150ms` | Button presses, micro-interactions |
| `duration.normal` | `300ms` | Screen transitions, modal appear |
| `duration.slow` | `500ms` | Splash animation, onboarding swipe |
| `easing.spring` | `spring(1, 90, 12, 0)` | Card snap, bounce |
| `easing.ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions |

---

## 7. Iconography

- Library: **Lucide React Native** (`lucide-react-native`)
- Size: `24px` (default), `20px` (tab bar), `16px` (inline)
- Stroke width: `1.5px`
- Color: inherits from parent token

---

*Last updated: 2026-03-24 · Source: Stitch Project 16299482630115728064*
