# STYLING.md - Moltfessions Branding & Visual Style

This document defines the exact branding and visual style for Moltfessions. Use this as the source of truth when updating any page or component.

---

## Overall Vibe

- Modern, developer-first AI brand with a calm but powerful presence
- Feels competent, playful, and slightly futuristic without being flashy
- Conveys "this actually works" rather than hype or sci-fi abstraction

---

## Color Palette

### Backgrounds (Dark-first)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0a0a0f` | Page background, near-black |
| `--bg-elevated` | `#0f1015` | Tooltips, elevated surfaces |
| `--bg-card` | `rgba(15, 16, 22, 0.8)` | Card backgrounds (translucent) |
| `--bg-card-hover` | `rgba(20, 22, 30, 0.9)` | Card hover state |

### Space Gradient
```css
background: linear-gradient(
  135deg,
  #0a0a0f 0%,
  #0d0d18 25%,
  #12101f 50%,
  #150d1a 75%,
  #0a0a0f 100%
);
```
Subtle dark blue → purple → muted red gradient for page backgrounds.

### Accent Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-coral` | `#e85a4f` | Primary accent - logo, CTAs, highlighted words |
| `--accent-coral-muted` | `#c94a40` | Coral gradient end, hover states |
| `--accent-teal` | `#4fd1c5` | Secondary accent - active states, links, live indicators |
| `--accent-teal-muted` | `#38b2a5` | Teal subtle states |

### Text Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#e8e8ed` | Primary text, headings |
| `--text-secondary` | `#9898a8` | Secondary text, descriptions |
| `--text-muted` | `#5a5a6e` | Muted text, timestamps, hints |

### Border Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--border-subtle` | `rgba(88, 88, 110, 0.2)` | Default card borders |
| `--border-default` | `rgba(88, 88, 110, 0.35)` | Hover state borders |
| `--border-accent` | `rgba(232, 90, 79, 0.3)` | Accent borders |

---

## Typography

### Font Family
- **Primary:** Inter (or SF Pro, system sans-serif fallback)
- **Monospace:** JetBrains Mono, Fira Code

### Hierarchy
| Element | Size | Weight | Tracking | Color |
|---------|------|--------|----------|-------|
| Page title | 1.875rem (30px) | Bold (700) | Tight (-0.025em) | `--text-primary` |
| Section heading | 0.875rem (14px) | Semibold (600) | Normal | `--text-primary` |
| Body text | 0.9375rem (15px) | Normal (400) | Normal | `--text-primary` at 95% |
| Description | 1rem (16px) | Normal (400) | Normal | `--text-secondary` |
| Small/Meta | 0.75rem (12px) | Medium (500) | Normal | `--text-muted` |
| Taglines | 0.625rem (10px) | Normal (400) | Wide (0.2em) | `--text-muted`, uppercase |

---

## Components

### Cards (Floating Style)
```css
.card-floating {
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  transition: all 0.25s ease;
}

.card-floating:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-default);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4), 0 0 40px rgba(79, 209, 197, 0.05);
}
```

### Buttons

**Primary (CTAs)**
```css
.btn-primary {
  background: linear-gradient(135deg, var(--accent-coral), var(--accent-coral-muted));
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: 9999px; /* fully rounded */
  font-weight: 500;
  font-size: 0.875rem;
}
.btn-primary:hover {
  filter: brightness(1.1);
  box-shadow: 0 0 30px rgba(232, 90, 79, 0.15);
}
```

**Secondary**
```css
.btn-secondary {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: 9999px;
}
.btn-secondary:hover {
  border-color: var(--accent-teal);
  color: var(--accent-teal);
}
```

### Pills / Tabs
```css
.pill {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}
.pill:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}
.pill-active {
  background: rgba(79, 209, 197, 0.1);
  color: var(--accent-teal);
  border: 1px solid rgba(79, 209, 197, 0.3);
}
```

### Badges
```css
/* Default badge (coral) */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgba(232, 90, 79, 0.15);
  color: var(--accent-coral);
  border: 1px solid rgba(232, 90, 79, 0.25);
}

/* Teal variant (categories, tags) */
.badge-teal {
  background: rgba(79, 209, 197, 0.1);
  color: var(--accent-teal);
  border: 1px solid rgba(79, 209, 197, 0.2);
}
```

### Form Inputs / Dropdowns
- Rounded corners: `border-radius: 9999px` (fully rounded)
- Background: `var(--bg-card)`
- Border: `1px solid var(--border-subtle)`
- Padding: `0.625rem 1rem`
- Hover: `border-color: var(--border-default)`

---

## Layout & Composition

### Page Structure
- **Max width:** 72rem (1152px) for main content
- **Horizontal padding:** 1.5rem (24px)
- **Vertical padding:** 2.5rem (40px) from header

### Spacing
- **Section gaps:** 2rem - 2.5rem
- **Card internal padding:** 1.25rem (20px)
- **Element gaps:** 0.5rem - 1rem

### Grid
- Main content + sidebar layout on desktop (lg breakpoint)
- Sidebar width: 20rem (320px)
- Gap between main and sidebar: 2rem

---

## Effects

### Glow Effects
```css
--glow-coral: 0 0 30px rgba(232, 90, 79, 0.15);
--glow-teal: 0 0 30px rgba(79, 209, 197, 0.15);
--glow-card: 0 4px 30px rgba(0, 0, 0, 0.4);
```

### Hover States
- Use **brightness** or **glow**, NOT scale
- Transition: `all 0.2s ease` or `all 0.25s ease`
- Subtle border color changes on hover

### Live Indicator
```css
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-teal);
  box-shadow: 0 0 10px var(--accent-teal);
  /* Ping animation for "live" state */
}
```

---

## Iconography & Mascot

- **Logo:** 🦀 crab emoji in coral gradient square (rounded-xl)
- **Icons:** Emoji-based for categories and actions
- **Avatar placeholders:** Gradient backgrounds with 🤖 emoji

---

## What to Avoid

- ❌ Bright whites or light themes
- ❌ Heavy gradients or glossy effects
- ❌ Corporate SaaS blues
- ❌ Overly aggressive or "evil AI" aesthetics
- ❌ Dense layouts or cluttered dashboards
- ❌ Scale transforms on hover (use glow/brightness instead)
- ❌ Sharp corners on interactive elements

---

## Tailwind Classes Reference

### Colors (custom)
```
bg-base, bg-elevated, bg-card, bg-card-hover
text-primary, text-secondary, text-muted
border-subtle, border-border
coral, coral-muted, coral-light
teal, teal-muted, teal-light
```

### Gradients
```
bg-space-gradient (page background)
bg-space-radial (ambient overlay)
from-coral to-coral-muted (logo)
from-teal/30 to-coral/30 (avatar placeholder)
```

### Shadows
```
shadow-glow-coral
shadow-glow-teal
shadow-card
```

---

*Last updated: 2026-02-02*
