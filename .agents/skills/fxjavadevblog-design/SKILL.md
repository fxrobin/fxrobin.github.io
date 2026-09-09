---
name: fxjavadevblog-design
description: Use when styling or reviewing the fxjavadevblog Classic (light) and Dark themes, article layouts, standfirst/lede excerpts, or any visual change that must look editorial and human - never generic AI output. Encodes the design guidelines distilled from 19 editorial and web-design sources (see references/editorial-sources.md).
---

# fxjavadevblog Design Guidelines

Applies to the **Classic** (`_sass/_theme-classic.scss`, `html[data-theme="classic"]`)
and **Dark** (`_sass/_theme-dark.scss`, `html[data-theme="dark"]`) themes only.
**Retro is frozen**: phosphor/CRT aesthetic, never touch it for a "pro" request.

## Principle 1 - Typography carries the design

Whitespace + type scale do the work. No decorative containers around text.
Sources: NYT, A List Apart ("content first" 2013 redesign), Vercel ("shadows
replace borders, spacing replaces dividers"), Slate.

- Body measure 65-75ch. Lede slightly narrower, never full-bleed box.
- Headings use `text-wrap: balance`. Body line-height 1.6-1.8.
- Serif (Fraunces) for titles and lede, sans (Inter) for UI and body,
  mono (JetBrains Mono) for code and kickers. Three families maximum.

## Principle 2 - Accent is punctuation, not chrome

One Java-orange accent, used sparingly. Sources: Stripe ("primary is the
punctuation, not the chrome"), Linear ("accent at most once per scroll
viewport"), Pixeldarts analysis of Stripe/Linear/Vercel.

- Classic accent `#C2410C` (hover `#9A3412`, soft `#FFF7ED`).
- Dark accent `#F0883E` (hover `#FFAB70`, soft `rgba(240,136,62,0.12)`).
- Reserve accent for: links, one active nav state, one CTA per card,
  the lede drop cap. Never for large surfaces, borders everywhere, or gradients.

## Principle 3 - Standfirst/lede treatment (chosen pattern)

No box, no side bar, no tinted background. Distinction through type alone:

- Fraunces ~1.18rem, line-height 1.8 ("exaggerated leading", Andy Clarke).
- Rubricated drop cap: `p:first-child::first-letter`, Fraunces 700,
  ~3.3em, accent color. Grounded in print history (red initials of early
  printed books, Smashing Magazine) and 2026 eye-tracking data (drop caps
  raise first-paragraph completion; 64% of award sites keep the cap tonal).
- `strong` inside the lede stays ink-colored semibold, never orange.
- Graceful degradation: if the excerpt does not open with a `<p>`, there is
  simply no drop cap - still clean.

Full method catalog (14 alternatives: thick underlines, first-line styling,
floated standfirst, banner, oversized margins...): see Andy Clarke,
"Designing standfirst paragraphs", summarized in references/.

## Principle 4 - Anti AI-slop blocklist

Never ship these in Classic/Dark; each one reads as generated:

- Tinted callout box with thick colored left border for excerpts or notes.
- Purple/blue gradients, glassmorphism, glow shadows on cards.
- Inter (or system sans) at every size with no serif contrast.
- Emoji bullets or emoji section markers (use `#`, `§`, hairline rules).
- Rounded-everything pills on large components, drop shadows on flat cards.
- Oversized hero with centered marketing copy on article pages.
- More than two accent colors per page; orange links on orange background.

Vercel's own 2026 anti-pattern list (from their design.md work) bans the same
family: gradient backgrounds, oversized radii, shadows on cards. When in doubt,
remove chrome instead of adding it.

## Principle 5 - Article layout rules

- Reading column first: 1400px pro shell, slim left sidebar (232px),
  roomy gap, body measure that breathes; code blocks get the extra room.
- Right rail (`post-aside.html`: TOC + share + page tags) is sticky,
  capped (`max-height`, TOC list scrolls past 38vh) and filled top to
  bottom - no tall void under a short TOC. `.pro-aside-block` stays hidden
  in Retro. Rail `top` offset clears the condensed header (84px pro,
  96px retro). On mobile the rail stacks above content, TOC first.
- Sticky header condenses on article scroll (`js/header-shrink.js` toggles
  `.is-condensed` on `.wrapper-masthead` once `.post-header` leaves the
  viewport, all 3 themes, article pages only): slimmer padding, smaller
  title, social row hidden, theme switch kept. Entry `h2`/`h3` carry
  `scroll-margin-top` so TOC anchor jumps never hide under the header.
  Honor `prefers-reduced-motion` (no transition).
- Homepage index (`.posts-grid .post-card`, Classic/Dark only, Retro
  untouched): first card featured (2rem serif title, excerpt clamped to
  8 lines), following cards compact (1.15rem title, excerpt clamped to
  3 lines). Card excerpts hide `pre`, `table`, `img` everywhere and
  `ul`/`ol` in compact cards - cards are teasers, full content is one
  click away. Pure CSS (`:first-child` / `+` selectors, `-webkit-line-clamp`),
  zero markup change, zero Retro impact.
- Motion (`js/cards-reveal.js`, all themes): homepage cards fade in
  successively - IntersectionObserver, stagger 60ms per card capped at
  300ms, 0.35s fade + 10px rise. `html.js` set in `<head>` pre-paint;
  no-JS = cards visible; no-IO = all revealed; `prefers-reduced-motion`
  = no animation. Preserve existing hover transitions when adding reveal
  transitions.
- Separate header/meta/lede/body with hairline rules (`1px` border color),
  not boxes. Meta row: muted text + one pill (reading time).
- Code: light GitHub-like blocks in Classic (`#F8F7F5`), near-black in Dark
  (`#010409`), JetBrains Mono, Rouge tokens retinted per theme. Language
  label in small caps sans, never pixel font in pro themes.
- Every pro-theme change is verified with screenshots on desktop (1440px) and
  smartphone emulation (390px), in all three themes, with zero console errors.

## Touchpoints

| File | Role |
|------|------|
| `_sass/_theme-classic.scss` | All Classic overrides under `html[data-theme="classic"]` |
| `_sass/_theme-dark.scss` | All Dark overrides under `html[data-theme="dark"]` |
| `_sass/_fonts.scss` | Fraunces + Inter + JetBrains Mono imports |
| `_layouts/default.html` | Theme switch, sidebar prompt dual labels |
| `_includes/search.html` | Search label dual retro/pro wording |
| `js/theme-switcher.js` | 3-theme state (`FXTheme.set/cycle/current`) |

Dual retro/pro labels (`.prompt-retro` / `.prompt-classic`) switch in pure CSS
so Retro markup and styling stay byte-identical.
