# Golazo — Design & UX Guidelines

> Last updated: 2026-03-29

## Design Philosophy

> *"Pro athlete's training app that a 12-year-old loves using."*

The design must walk a tightrope: professional enough that a teenager doesn't feel it's "for kids," but engaging enough that they open it every day. Think Nike Training Club meets Strava — clean, premium, data-rich, motivating.

## Design Direction: Nike/Adidas Clean Premium

### Moving FROM (current dark FIFA/EA FC theme)

- Pure black backgrounds (#0a0f0a)
- Neon green accents
- Heavy gaming aesthetic
- Card-heavy layouts with decorative borders

### Moving TO

- Light/neutral base with high contrast
- Bold, confident accent colors
- Professional sports typography
- Breathing space — generous whitespace
- Data-forward but not cluttered
- Photography and illustration as hero elements (not emoji-heavy)

## Color System

### Primary Palette

| Token | Value | Usage |
| --- | --- | --- |
| `--color-bg` | `#FAFAFA` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-surface-alt` | `#F5F5F5` | Subtle surface distinction |
| `--color-text` | `#1A1A1A` | Primary text |
| `--color-text-secondary` | `#6B7280` | Secondary / muted text |
| `--color-border` | `#E5E7EB` | Subtle borders |

### Accent Colors

| Token | Value | Usage |
| --- | --- | --- |
| `--color-accent` | `#10B981` | Primary accent (pitch green — kept from current) |
| `--color-accent-dark` | `#059669` | Hover/active states |
| `--color-accent-light` | `#D1FAE5` | Badges, light backgrounds |
| `--color-danger` | `#EF4444` | Errors, warnings, low mood alerts |
| `--color-warning` | `#F59E0B` | Caution states |
| `--color-info` | `#3B82F6` | Informational highlights |

### Rank Colors (kept — these work well)

| Rank | Color | Hex |
| --- | --- | --- |
| Beginner | Bronze | `#CD7F32` |
| Amateur | Silver | `#C0C0C0` |
| Semi-Pro | Gold | `#FFD700` |
| Professional | Diamond | `#B9F2FF` |
| Legend | Platinum | `#E5E4E2` |

### Dark Mode (optional, future)

The current dark theme can become an optional dark mode toggle. Some players prefer dark. But the DEFAULT is light.

## Typography

### Font Stack

| Purpose | Font | Weight | Fallback |
| --- | --- | --- | --- |
| Headings | **Inter** | 700 (Bold) | system-ui, sans-serif |
| Body | **Inter** | 400 (Regular) | system-ui, sans-serif |
| Data/Stats | **Inter** | 600 (SemiBold) | system-ui, sans-serif |
| Monospace (stats) | **JetBrains Mono** | 400 | monospace |

### Scale

| Token | Size | Usage |
| --- | --- | --- |
| `--text-xs` | 0.75rem (12px) | Captions, timestamps |
| `--text-sm` | 0.875rem (14px) | Secondary text, labels |
| `--text-base` | 1rem (16px) | Body text |
| `--text-lg` | 1.125rem (18px) | Card titles |
| `--text-xl` | 1.25rem (20px) | Section headers |
| `--text-2xl` | 1.5rem (24px) | Page titles |
| `--text-3xl` | 2rem (32px) | Hero numbers (XP, stats) |

## Layout Principles

### Mobile-First (375px primary)

- Single-column layout, max-width 480px centered
- Bottom navigation (5 tabs)
- No horizontal scrolling
- Content above the fold matters — front-load value

### Spacing System

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | 4px | Tight padding |
| `--space-2` | 8px | Internal component padding |
| `--space-3` | 12px | Between related elements |
| `--space-4` | 16px | Card padding, section gaps |
| `--space-6` | 24px | Between sections |
| `--space-8` | 32px | Major section separation |

### Cards

- Background: white
- Border: 1px solid `--color-border`
- Border-radius: 12px
- Shadow: `0 1px 3px rgba(0,0,0,0.05)` (subtle, not heavy)
- Padding: 16px
- No decorative borders or glow effects

### Touch Targets

- Minimum 44px height for all interactive elements
- Minimum 8px gap between adjacent tap targets
- Buttons: 48px height, full-width on mobile

## Component Patterns

### XP / Progress Bar

- Thin (6px), rounded, accent-colored fill
- Number label right-aligned or centered
- No glow or animation on idle — animate only on XP gain

### Skill Radar

- Clean SVG spider chart
- Light grid lines (#E5E7EB)
- Filled area with accent color at 20% opacity
- Data points as small circles
- Labels outside the chart, not inside

### Stat Cards

- Large number dominant (--text-3xl, bold)
- Small label below (--text-xs, secondary color)
- Optional trend indicator (↑ green, ↓ red, → gray)
- Tight, dashboard-style grid (2 columns on mobile)

### Emoji Ratings

Keep the 5-point emoji scale — it's intuitive for kids:
😴 😐 🙂 😄 🔥

But use them sparingly. In stat views, show numerical values with small emoji indicators, not emoji-dominant displays.

### Daily Check-in Flow

1. **Mood**: 5 emoji choices, single tap
2. **Energy**: 5 emoji choices, single tap
3. **Optional note**: expandable text field
4. → "Done" button → confetti if streak maintained
5. Total time: <30 seconds

### Bottom Navigation

5 tabs max. Proposed:

| Icon | Label | Page |
| --- | --- | --- |
| 🏠 | Home | Dashboard |
| ⚽ | Log | Training/Match/Tournament entry |
| 📊 | Progress | Charts, stats, physical tracking |
| 📚 | Learn | Exercises, articles, quizzes |
| 👤 | Profile | Player card, settings, teams |

## UX Principles

### 1. "One-Thumb Rule"

Everything reachable with one thumb on a phone held in one hand. Primary actions at bottom. No important interaction at the top of the screen.

### 2. "3-Tap Rule"

Any core action (log training, check progress, start challenge) is ≤3 taps from the home screen.

### 3. "30-Second Value"

Opening the app should show something valuable within 30 seconds — today's streak, AI recommendation, or a daily challenge.

### 4. Progressive Disclosure

Don't overwhelm. Show basics first, let users expand for details.

- Match log: quick mode (score + rating) vs detailed mode (full stats)
- Progress: summary cards on top, expandable charts below
- Exercises: browse mode vs deep dive mode

### 5. Celebrate Progress

Every state change deserves feedback:

- Logged training → XP animation + streak update
- Reached new level → celebration screen
- Completed challenge → badge unlock + confetti
- Consistent week → weekly summary card

### 6. Zero Dead Ends

No empty states without guidance. If a page has no data:

- Show what the page will look like with data
- Provide a clear CTA to add data
- Include a motivational message

### 7. Age-Appropriate Language

- U8-U10: Short sentences, big buttons, lots of emoji
- U12-U14: Normal language, motivation-focused copy
- U16+: Professional tone, data-forward copy

## Accessibility

- Color contrast: 4.5:1 minimum for text
- All interactive elements have `aria-label`
- Keyboard navigable (for desktop/coach view future)
- No color-only indicators — always pair with text or icon
- Touch targets 44px minimum
- Readable font sizes (16px minimum body text on mobile)

## Animation Guidelines

- **Use**: XP gains, level-ups, streak celebrations, page transitions
- **Avoid**: Constant motion, loading spinners (prefer skeleton screens), bouncing elements
- **Library**: Framer Motion (already installed)
- **Duration**: 200-400ms for micro-interactions, up to 800ms for celebrations
- **Easing**: `ease-out` for entries, `ease-in` for exits

## Iconography

- Use Lucide React icons (consistent, clean line style)
- 20px default size, 24px for navigation
- Stroke width: 1.5px
- Color: inherit from text color

## Do / Don't

| ✅ Do | ❌ Don't |
| --- | --- |
| Use white/light backgrounds for readability | Use pure black backgrounds |
| Center large stat numbers | Make everything the same size |
| Use accent color sparingly for emphasis | Paint everything green |
| Show one primary CTA per screen | Give 4 equally styled buttons |
| Use real match/training data in examples | Show placeholder "Lorem ipsum" |
| Animate achievements and milestones | Animate every interaction |
| Design for one-handed mobile use | Require two-hand gestures |
| Make empty states helpful and encouraging | Show blank screens with no guidance |
