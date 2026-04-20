# VT-100 Hybrid Redesign — Design Spec

**Date:** 2026-04-18  
**Branch:** feature/new-design  
**Approach:** `vt100-hybrid` — terminal chrome in amber monospace, article body in readable sans-serif

---

## 1. Visual System

### Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--amber` | `#FFB000` | Header, sidebar, borders, prompts, nav active |
| `--amber-dim` | `#996600` | Inactive nav, secondary labels, visited links |
| `--body-text` | `#E0E0E0` | Article body, excerpts |
| `--code-green` | `#33FF33` | Code blocks, inline `code` |
| `--link` | `#5BC8FF` | Body text links (cyan) |
| `--link-visited` | `#FFB000` | Visited links → amber |
| `--border` | `#333333` | Structural dividers |
| `--bg-card` | `#111111` | Card backgrounds |
| `--bg-body` | `#0A0A0A` | Page background (near-black) |

### Typography

| Context | Font | Color |
|---|---|---|
| Header, sidebar, nav, labels, dates | `Share Tech Mono` / `coders-crux` | amber |
| Article body (p, lists) | `Monda` | `#E0E0E0` |
| Article headings (h2, h3) | `Share Tech Mono` | amber / `#E0E0E0` |
| Code blocks | `Share Tech Mono` / `coders-crux` | `#33FF33` |
| Blockquotes | `Monda` italic | `#AAAAAA` |

All fonts already present in repository — no new font loading required.

### Cursor
Atari ST mouse pointer retained (`/images/atari-st-mouse-pointer.png`, `/images/atari-st-mouse-hand.png`).

---

## 2. Layout Structure

Full-width header → split-pane body (sidebar 20% / content 80%) → minimal footer.

```
┌─────────────────────────────────────────────────────────┐
│  HEADER — amber strip, scanlines, typewriter            │
│  FX_JavaDevBlog@terminal:~$ █              [FR] · [EN]  │
└─────────────────────────────────────────────────────────┘
┌──────────────────┐ ┌───────────────────────────────────┐
│  SIDEBAR (20%)   │ │  CONTENT AREA (80%)               │
│  amber chrome    │ │  white body / article cards       │
│  scanlines on    │ │  no scanlines                     │
└──────────────────┘ └───────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  FOOTER — amber, one line, text social links            │
└─────────────────────────────────────────────────────────┘
```

**Mobile:** Sidebar collapses. Header shows `[≡ MENU]` amber monospace hamburger → dropdown nav.

---

## 3. Navigation & Directory Structure

### Sidebar Nav (index pages)

```
$ ls /dev/
──────────────────
> /dev/java        ← active: bright amber + blinking █
  /dev/retro
  /dev/blanka
  /dev/about
──────────────────
$ _
```

- Active item: `> /dev/java █` with CSS blink cursor
- Hover: `0.15s` color transition amber-dim → amber, `>` prefix appears
- Visited: amber-dim `#996600`

### URL/Path Mapping

| Current | New path label |
|---|---|
| `/` (Articles) | `/dev/java` |
| `/retro-programming/` | `/dev/retro` |
| `/blanka-cave/` | `/dev/blanka` |
| `/astuces/` | Merged into `/dev/java` |
| `/links/` | Dropped |
| `/about/` | `/dev/about` |

> Note: Actual URLs remain unchanged for SEO. Labels are display-only.

### Breadcrumb

Every page shows above content:
```
~/dev/java/eclipse-collections $
```
Amber monospace. No decoration.

### Search (sidebar)

```
$ grep -r "________________"
```
Input: amber text, `#111` background, 1px amber bottom border only, no border-radius. Placeholder: `search...`

### Tags (sidebar)

```
#java  #quarkus  #retro  #jvm
#loom  #linux    #api
```
Amber-dim at rest, amber on hover. No background, no pill shape.

### Language Toggle (header, top-right)

```
[FR] · [EN]
```
Active = amber bright. Inactive = amber-dim. Monospace. No flags.

---

## 4. Article Cards (Index)

Each post renders as a Unicode box:

```
┌─────────────────────────────────────────────────────────────┐
│ /dev/java/eclipse-collections                    2026-04-03 │
│ Eclipse Collections : le meilleur allié de vos listes Java  │
│ Meilleures performances, API fluente, types primitifs...     │
├─────────────────────────────────────────────────────────────┤
│ #java  #collections  #performance       [▶ READ_MORE ░░░░░] │
└─────────────────────────────────────────────────────────────┘
```

**Spec:**
- Box border: `#444` (not amber — reduces noise on stacked cards)
- Path + date row: amber monospace
- Title: `Monda` semi-bold, `#E0E0E0`, 1.4em
- Excerpt: `Monda`, `#AAAAAA`, 2 lines max, `overflow: hidden`
- Tags: amber-dim `#tag` tokens, left-aligned
- `[▶ READ_MORE]`: right-aligned, amber monospace. Hover = amber background + black text (terminal selection)
- Logo images: dropped from cards. Path replaces logo. Logo kept small (32px) on article page only.
- Card hover: border `#444` → `#666`, no transform/lift

**Pagination:**
```
[◀ PREV]  page 2/7  [NEXT ▶]
```
Amber monospace. No rounded buttons.

---

## 5. Article Page Layout

```
┌──────────────────┐ ┌──────────────────────────────────────┐
│  NAV (as index)  │ │  ~/dev/java/eclipse-collections $    │
│                  │ │  ───────────────────────────────     │
│  ─────────────   │ │  [☕ 32px] Eclipse Collections       │
│  TABLE OF        │ │           le meilleur allié...       │
│  CONTENTS        │ │  2026-04-03  [FR] · [EN]             │
│                  │ │  ───────────────────────────────     │
│  § Introduction  │ │                                      │
│  § Part 1        │ │  [article body]                      │
│  § Part 2        │ │                                      │
│  § Conclusion    │ │  ## heading → amber Share Tech Mono  │
│                  │ │  ### heading → #E0E0E0 smaller       │
│  ─────────────   │ │  p → Monda #E0E0E0                   │
│  SHARE           │ │  code → green Share Tech Mono        │
│  [gh] [li] [tw]  │ │  blockquote → amber left border     │
└──────────────────┘ └──────────────────────────────────────┘
```

### Article Header
- Breadcrumb `~/dev/java/slug $` amber monospace
- Logo: 32px inline-left of title
- Title: `Monda` bold `#E0E0E0` 1.8em
- Subtitle: `Share Tech Mono` amber-dim italic
- Date + language selector: same line, amber-dim monospace

### Headings (CSS `::before`)
- `h2`: amber `#FFB000`, `Share Tech Mono` — `::before { content: "## " }`
- `h3`: `#E0E0E0`, `Share Tech Mono` smaller — `::before { content: "### " }`

### Code Blocks
- Existing CRT scanline + green phosphor effect from `_fx.scss` retained
- Border: 1px amber, `border-radius: 0`
- Line numbers: amber-dim left gutter

### TOC (sidebar, article pages only)
- Replaces nav items on article pages
- Format: `§ Section name`, amber-dim at rest, amber on hover
- Active section (scroll spy): amber bright

### Comments
- Disqus collapsed by default
- Toggle: `[COMMENTS ▼]` / `[COMMENTS ▲]` amber monospace button

### Share
- Plain text links: `[gh]` `[li]` `[tw]` — no zocial buttons

---

## 6. Effects & Animations

### Scanlines
```scss
// CSS overlay, pointer-events: none
background: repeating-linear-gradient(
  0deg,
  rgba(0,0,0,0.08),
  rgba(0,0,0,0.08) 1px,
  transparent 1px,
  transparent 2px
);
```
Applied to: header, sidebar. NOT content area or article body.

### Phosphor Glow
```scss
// Amber elements
text-shadow: 0 0 8px #FFB000;
// Hover state
&:hover { text-shadow: 0 0 12px #FFB000; }
```
Applied to: amber chrome elements in header/sidebar only.

### Cursor Blink
```scss
@keyframes blink { 50% { opacity: 0; } }
.active-nav::after { content: "█"; animation: blink 1s step-end infinite; }
```

### Typewriter
TypewriterJS retained on site name. Loop:
- `FX_JavaDevBlog@terminal:~$ ` → types taglines → deletes → repeats

### Hover Transitions
- All: `transition: color 0.15s` only. No transform, scale, box-shadow lift.

### Removed
- Background image `3132.jpg` → flat `#0A0A0A`
- Glitch animations (`_fx.scss` glitch keyframes)
- Chrome/street text effects
- Hover animation library (`hover.css` / `hvr-*` classes)
- Zocial social buttons
- Font Awesome (replaced by Unicode)
- `bounce-out`, `bob`, `buzz-out` hover effects on logos

### Retained
- Atari ST cursor
- Typewriter on site name
- Asciinema player (unchanged)
- Mermaid diagrams (unchanged)
- CRT scanline on code blocks (`_fx.scss .preformatted`)

---

## 7. SCSS Architecture Changes

### Files to rewrite
| File | Change |
|---|---|
| `_variables.scss` | New color tokens, keep existing fonts |
| `_base-rules.scss` | New body bg, remove bg-image, new link colors |
| `_nav.scss` | Full rewrite — sidebar layout, directory style |
| `_front-post.scss` | Full rewrite — Unicode box card design |
| `_fx.scss` | Remove glitch/chrome/street effects, keep `.preformatted` |

### Files to create
| File | Purpose |
|---|---|
| `_header.scss` | Header strip, typewriter container, scanlines |
| `_sidebar.scss` | Sidebar layout, nav, search, tags |
| `_article.scss` | Article page layout, heading `::before`, TOC |
| `_cards.scss` | Article card Unicode box component |
| `_footer.scss` | Minimal footer, text social links |

### Files to remove/empty
- `_article-list-post-footer.scss` — replaced by `_cards.scss`
- References to `hover.css` and `blink.css` in `default.html`
- Font Awesome CDN link in `default.html`
- Zocial CDN link in `default.html`

### `default.html` changes
- Remove Font Awesome, Zocial, hover.css, blink.css links
- Add `<meta name="theme-color" content="#0A0A0A">`
- Language toggle moved to header right

---

## 8. Jekyll / Config Changes

### `_config.yml` — display labels only (URLs unchanged)
Nav labels updated for FR/EN to reflect `/dev/*` naming. Actual `url:` values stay the same.

### Categories preserved
`articles`, `retro-prog`, `blanka-cave` — no changes to post front matter or file structure.

---

## 9. Out of Scope

- No changes to post content or front matter
- No changes to URL structure (SEO preserved)
- No changes to Disqus integration logic
- No changes to Asciinema or Mermaid
- No new JavaScript beyond existing TypewriterJS
- No changes to CI/CD pipeline
