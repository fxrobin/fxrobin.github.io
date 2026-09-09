# Editorial Sources (19)

Annotated bibliography behind the fxjavadevblog design guidelines.
Consulted September 2026. Rule of thumb extracted from each source.

## Standfirst / lede craft

1. **Stuff & Nonsense, Andy Clarke - "Designing standfirst paragraphs"**
   (stuffandnonsense.co.uk). 15 concrete techniques: multi-column span,
   thick underlines, exaggerated leading, floated standfirst, banner,
   deconstructed text, drop/initial caps, first-line styling. Core rule:
   a standfirst must stand apart AND stand out, through type - never a box.
2. **Smashing Magazine - "Drop Caps: Historical Use And Current Best
   Practices"** (smashingmagazine.com). Implementation methods
   (`::first-letter` recommended), plus the history that justifies our
   rubricated cap: red initials in 1476/1480 incunabula.
3. **A List Apart - article pages** (alistapart.com). Lede paragraph simply
   set larger; 2013 redesign ("content first") removed brand chrome around
   text. Writing guide: intro must open with a bang, no meandering.
4. **Pravin Kumar - "Why I Use Editorial Drop Caps" (2026)**
   (pravinkumar.co). Eye-tracking data: +18% first-paragraph completion,
   3-line cap ratio, `::first-letter` per-post automation, 64% of award
   sites keep the cap the same color as body (we diverge deliberately with
   a single rubricated accent).
5. **Carmen Ansio - "Editorial Typography in CSS"** (carmenansio.com).
   Modern primitives: `clamp()` scales, `text-wrap: balance/pretty`,
   `initial-letter`, optical sizing.
6. **OddBird - "What's Old is New: Drop Caps in CSS"** (oddbird.net).
   `::first-letter` float technique reference.
7. **Wikipedia - "Lead paragraph" + journalism guides** (Poynter via
   Journalism University, CCC pressbooks). Lede vs standfirst distinction:
   our excerpt is a standfirst ("the sell"), styled apart from running text.

## News/editorial references

8. **The New York Times** (nytimes.com + NYT Open "Design at the Speed of
   News"). Cheltenham headlines, Georgia body, generous whitespace,
   hairline rules between sections, modular story packaging.
9. **The Washington Post** (washingtonpost.com, via Webflow roundup).
   Digital broadsheet: typographic hierarchy carries trust, Pulitzer-style
   headline stacking.
10. **BBC** (bbc.com, via Webflow roundup). Serif lede, minimal chrome,
    section nav over decoration.
11. **The Guardian** (theguardian.com, via Slider Revolution roundup).
    Bold standfirst + thin rules, strong grid.
12. **Slate on the NYT redesign** (slate.com). "There can never be enough
    white space" - whitespace as the primary luxury signal.
13. **Monocle / Medium / broadsheet styles** (via Refero Styles editorial
    gallery, styles.refero.design). Cream-paper broadsheet, type-led rhythm,
    density variation across sections.

## Product/blog design systems

14. **Stripe design language** (via opendesigner.io DESIGN.md recreation +
    Dembrandt tokens). Sohne Display + 17px/1.55 body, lede at 20px,
    "primary is the punctuation, not the chrome", pull-quotes in display
    italic.
15. **Linear design language** (same source). Inter-only, dark-first,
    "accent at most once per scroll viewport", explicit anti-pattern list
    (no gradients, radii over 8px, shadows on cards).
16. **Vercel design language** (vercel.com/geist/typography + DESIGN.md +
    "How our agents build on-brand pages", 2026). Pure black/white, no
    muddy mid-grays, tight tracking on display, radii max 12px, and an
    explicit named-pattern ban list against generated-looking design.
17. **Pixeldarts - "Four design principles behind Stripe, Linear, Vercel"**
    (pixeldarts.com). Synthesis: high contrast, double the whitespace,
    monochrome base + one accent, sharp typography. "Not beautiful, not
    clever - inevitable."
18. **Webflow Blog - typography 101 + news-site roundup**
    (webflow.com/blog). Type scale discipline, relative units, measure
    (~65-75ch), hierarchy before decoration.
19. **Spell UI + design.dev + Refero prompting guide** (spell.sh,
    design.dev, styles.refero.design). Modular 1.25 scale, body 1.5-1.7
    leading, `text-wrap: balance` on headings, "typography should be
    invisible - serve the content, never overshadow it".

## How we applied them

- Lede = Clarke #12 (exaggerated leading) + Smashing rubrication +
  Kumar data, minus the tinted box (code smell per Linear/Vercel lists).
- Accent discipline = Stripe punctuation rule + Linear once-per-viewport.
- Layout = NYT whitespace + ALA content-first + Webflow measure.
- Code blocks = GitHub-like light / near-black dark, Geist/Vercel restraint.
