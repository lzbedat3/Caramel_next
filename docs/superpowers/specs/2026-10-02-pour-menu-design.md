# The Pour: new public menu and matching admin portal for Caramel

Date: 2026-10-02 (revised after the owner's decision to build inside `Caramel_next`)
Reference prototype: `docs/superpowers/specs/2026-10-02-pour-prototype.html` (the version the owner approved: the pour, "my table", the summary view, the links and rights line at the end, no "Akko", no scroll hint)

## 1. Goal

Replace the current public menu in this repository with "The Pour": a ribbon of liquid caramel flows down the screen as the guest scrolls, wraps each dish and lights it up. Restyle the admin portal so it shares the same dark caramel look.

The work must:

- Happen on a git branch (`pour-menu`), so `main` keeps the current site until the owner merges.
- Keep the Supabase schema, storage, server actions, auth and data services unchanged.
- Be mobile first.
- Keep restaurant-specific content out of public components: content from the database, interface text from dictionaries, brand choices from config.
- Keep the pour itself as a self-contained engine so it can serve another restaurant later.
- Load media faster than the current site.
- Be a first-class installable PWA.

Order of work: admin portal restyle first (owner's request), then the public menu.

## 2. Decisions made by the owner

| Decision | Choice |
|---|---|
| Concept | The Pour, as in the reference prototype |
| Where | Inside `Caramel_next`, replacing the old public menu, which the owner does not want kept |
| Cart | "My table" with quantities and total, and a summary view labelled "סיכום" |
| Ending | Address, Waze button, phone, social links, and a rights line crediting Darb Rest with a link to darb.co.il |
| Icons | Inline SVG only: no icon fonts, emoji or image icons |
| Opening | No city name and no scroll hint |
| Fonts | Heebo for Hebrew, Cairo for Arabic, Ubuntu for Latin text and numbers |
| PWA | Best possible installable experience |
| Admin | Restyled to match the new look |

## 3. Defaults chosen in this spec

1. **Freshness.** Unchanged: the menu is read on every visit, so admin edits appear immediately, as today.
2. **Languages.** Public interface text ships in Hebrew, Arabic and English dictionaries. Caramel runs Hebrew only, because dish names exist only in Hebrew in the database. Admin text stays as it is.
3. **Offline.** The service worker keeps the last menu the guest saw, so the installed app opens without a connection, with a banner saying prices may be out of date. Today only a fallback page is cached.
4. **About text.** The ending shows the about text when the profile has one. (Weekly hours in the ending are an owner decision: kept, collapsed by default.)
5. **Hero slides.** The Pour has no slideshow, so the admin "hero" page and its dashboard tile are hidden from navigation. The page, its data and its route are left intact.
6. **Old public UI.** The old public components and their styles are deleted once nothing imports them. They remain in git history.

## 4. Out of scope

- Sending orders to the kitchen, payments, table numbers.
- Any change to the database, storage, auth, server actions or data services.
- Translated dish names (needs new database columns).
- Category images and subtitles: still editable in admin, not displayed by the Pour.
- A denser layout for drinks, search, or filters.
- Changing admin behaviour, layout structure or wording. The admin change is visual only.

## 5. Architecture

### 5.1 Stack

Unchanged: Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4. Before writing code that touches a Next.js API, read the relevant guide in `node_modules/next/dist/docs/`. One new dev dependency: Vitest, for unit tests.

### 5.2 Theme tokens

`styles/globals.css` already drives both admin and public UI through CSS variables (`--background`, `--surface`, `--foreground`, `--caramel`, ...), and admin components use almost no hardcoded colours. The restyle replaces the token values with the dark caramel palette from the prototype:

| Token | New value | Role |
|---|---|---|
| `--background` | `#0d0806` | page |
| `--background-deep` | `#070402` | deepest areas |
| `--surface` | `#17100b` | cards, inputs |
| `--surface-warm` | `#21160e` | sidebar, hover, wells |
| `--foreground` | `#f5e8d2` | text |
| `--muted` | `#b7a48a` | secondary text |
| `--muted-soft` | `#8d7a63` | tertiary text |
| `--border` | `rgb(245 232 210 / 0.12)` | hairlines |
| `--caramel` | `#e9a43a` | accent |
| `--caramel-deep` | `#f6c062` | accent text on dark (must stay readable) |
| `--caramel-soft` | `#b9650f` | accent fills |
| `--ring` | `rgb(246 192 98 / 0.6)` | focus ring |
| `--open` / `--closed` | `#7fd18f` / `#f08a8a` | status text on dark |
| `--open-soft` / `--closed-soft` | `rgb(127 209 143 / 0.14)` / `rgb(240 138 138 / 0.14)` | status fills |

A glossy caramel gradient and matching shadows are added for the surface used by primary buttons and the table pill. The light `body` background gradient is replaced by the dark background with a faint warm glow.

### 5.3 Layout of the code

```
config/site.ts               adds: credit {name, url}, eyebrow
config/pour-theme.ts         the pour's material: layer colours, highlight, widths, lag
lib/i18n/                    he.ts, ar.ts, en.ts, index.ts (dictionary for the configured locale)
features/pour/
  engine/                    framework-free TypeScript, no React, no restaurant knowledge
  table/                     cart reducer, reconciliation, storage
  pour-menu.tsx              server component: semantic page from PublicHomeContent
  pour-stage.tsx             client: mounts the engine, lights dishes
  category-nav.tsx           client: sticky pill
  dish-dialog.tsx            client: expanded dish
  my-table.tsx               client: pill, sheet, summary view
  ending.tsx                 server: ending pool, links, hours, rights line
styles/pour.css              the public experience's styles
components/icons/            existing outline icons + brand marks (Waze, Instagram, Facebook, ...)
components/pwa/              install prompt, offline banner, update prompt, restyled
public/sw.js                 new caching rules
```

`app/(public)/page.tsx` keeps calling `getPublicHomeContent()` and `getPublicSeoContent()` and renders `PourMenu` instead of `PublicHome`. `RestaurantJsonLd`, metadata, sitemap and robots are unchanged.

**Engine boundary.** `features/pour/engine` is the prototype's canvas code as typed modules with no DOM lookups by id and no imports from the rest of the app. It receives the elements it draws on and positions, plain data (category and dish counts) and the theme, and reports which dishes and pools the caramel has reached through callbacks.

## 6. Admin portal restyle

Visual only. Same routes, components, forms, server actions and wording.

- **Tokens.** Section 5.2. This re-themes the shell, sidebar, cards, forms and dashboard at once.
- **Primitives.**
  - `Button` primary: glossy caramel with dark text, as in the prototype's buttons. Ghost and outline tuned for dark.
  - `Surface`: dark card with a hairline border and soft depth instead of the warm shadow.
  - `Pill`, inputs, selects, textareas, checkboxes, file inputs: dark fields, caramel focus ring, `color-scheme: dark` so native controls match.
- **Shell.** Sidebar and header on the dark surfaces; active navigation item marked with caramel; mobile drawer overlay darkened.
- **Sign-in page, access-denied, loading, error and not-found screens.** Same treatment.
- **Sweep.** Every admin screen is checked for leftover light-theme assumptions: hardcoded colours, `text-white` on caramel, `ring-white`, shadows that assume a light page, image placeholders.
- **Contrast.** Body text, muted text, placeholders, disabled states and focus rings meet WCAG AA on the new surfaces.
- **Hero page** hidden from navigation and from the dashboard (section 3.5).

Until the public menu is replaced, the old public page keeps its own scoped paper palette (`.public-menu`), so it is unaffected by the token change.

## 7. The public experience

The reference prototype defines look and motion. This section records behaviour and what changes from it.

### 7.1 Opening

Brand name and subtitle from `restaurant_profile`. The optional small line above the brand comes from `siteConfig.eyebrow` and is omitted when empty. Open or closed status sits under the subtitle. The pour starts from the brand and runs once on load. No city name, no scroll hint.

### 7.2 The pour

- Native vertical scroll. The ribbon's poured length follows scroll with a lag; scrolling up un-pours.
- Dishes alternate sides. A dish is dim until the caramel reaches it, then lights with a gloss sweep, and its name and price fade in.
- A faint dotted track shows where the caramel will go.

### 7.3 Dish states

| State | Treatment |
|---|---|
| With photo | Oval photo in a caramel ring |
| No photo | Same ring, dark fill, dish name lettered inside |
| Unavailable | Lit but desaturated, "unavailable now" label; cannot be added to the table |
| Has description | Shown in the expanded dish |

### 7.4 Categories

Each visible category is a caramel pool with its name and its position and count ("01 — 27", computed). The sticky pill follows the active category and jumps on tap. The `?category=` URL parameter of the old site is dropped.

### 7.5 Expanded dish

Tapping a dish grows it into a 4:3 photo in a caramel frame with category, name, description, price and an "add to my table" button. It is a real dialog: focus moves in, Escape or the close button closes it, focus returns to the dish.

### 7.6 My table and the summary view

- Adding a dish drops a caramel drop into a pill at the bottom showing the last dishes added and the total.
- The pill opens a sheet: each dish with photo, name, quantity controls and line total, then the grand total.
- The "סיכום" button switches the sheet to a light, large-text summary of quantities and names with the total, for showing to the waiter.
- State is kept in `localStorage`. On load it is reconciled with the current menu: dishes that no longer exist or are unavailable are removed, and prices always come from the current menu.
- Nothing is sent anywhere.

### 7.7 Ending

A larger pool with the closing line from the dictionary, followed by, in order:

1. Restaurant name and subtitle, and the about text when present.
2. Address with a pin icon.
3. A caramel "navigate with Waze" button, from `restaurant_profile.waze_url`.
4. The phone number as a tap-to-call link.
5. Opening hours, as on the current site but collapsed to save space: one row showing today's hours and the open or closed status; tapping it expands the full week with today highlighted.
6. One round button per visible row in `social_links`, in `sort_order`. Platforms without a dedicated mark use a generic link mark.
7. A rights line: "© {current year} all rights reserved to Darb Rest", where the name links to `https://darb.co.il`. The sentence comes from the dictionary; the name and URL come from `siteConfig.credit`.

Parts 1 to 6 are each omitted when their data is empty. External links open in a new tab with `rel="noopener noreferrer"`. The old footer's hardcoded tagline and dedication are not carried over.

**Icons.** Every icon is an inline SVG component that inherits `currentColor`. Waze, Instagram, Facebook and the other social platforms use their recognisable brand marks; phone, pin, close and similar use the existing outline marks.

### 7.8 Empty and error states

| Situation | Behaviour |
|---|---|
| Restaurant profile missing or inactive | Brand screen with a "menu is not available right now" message; `noindex`, as today |
| No categories or items | Opening and ending only |
| An image fails to load | The dish falls back to the no-photo treatment |
| Canvas unsupported or it throws | The semantic list stays usable with all dishes lit |
| Offline | Section 9.3 |

## 8. Media

- Dish photos go through `next/image` with AVIF added alongside WebP, and `sizes` matched to real use: about 170 px for the oval, about 400 px for the expanded photo, 58 px for the table.
- The first three dishes load with priority. The rest load lazily.
- The expanded photo is preloaded when the guest touches a dish.
- Every dish paints a dark caramel-ringed placeholder immediately, so nothing pops in on a white box.
- Originals in Supabase are not modified.

## 9. Quality bar

### 9.1 Accessibility

- The canvas is decorative and hidden from assistive technology. The content is a semantic list with a heading per category.
- Dishes, the category pill, the table pill and all controls are keyboard-operable with visible focus.
- With reduced motion, the ribbon is drawn complete, all dishes are lit, and nothing animates on scroll.
- Text contrast meets WCAG AA, including the dim state of names not yet reached.

### 9.2 Performance

- Smooth scrolling on a mid-range Android phone and a recent iPhone, verified on real devices.
- Canvas pixel ratio capped at 2; static caramel painted once per layout; per-frame work limited to the moving head.
- The engine pauses when the tab is hidden.

### 9.3 PWA

- Manifest: dark theme and background colours, name from config, standalone display, existing icons from `public/Caramel_Assets`.
- Service worker:
  - Menu page: network first, falling back to the last cached copy.
  - Build assets and fonts: cached, refreshed in the background.
  - Optimised dish images: cache first, with a cap and oldest-first eviction.
  - Admin, portal, auth and server actions are never cached.
- Offline: the app opens to the last menu seen with a banner; with nothing cached, the branded offline page, restyled dark.
- Install prompt on supporting browsers and home-screen instructions on iOS Safari; dismissible; never shown inside the installed app.
- A new version waits and offers a "refresh" prompt.
- Safe-area insets respected, including the table pill.
- The old corner splash is removed; the pour's own opening is the entrance.

### 9.4 SEO

Unchanged behaviour: metadata, Open Graph, canonical URL, robots, sitemap and Restaurant JSON-LD from the same services. `themeColor` changes to the dark background.

## 10. Testing

| Level | Covers |
|---|---|
| Unit (Vitest) | Scroll-to-poured-length physics; cart reducer and reconciliation against a changed menu; dictionary completeness across locales |
| Browser checks (playwright-cli, phone viewport, Chromium and WebKit) | Page loads with real data; scrolling lights dishes; category jump; add dishes, change quantity, summary view; reduced motion; every admin screen after the restyle |
| Static | `lint`, `typecheck`, `build` |
| Manual by the owner | Real iPhone and Android: scroll smoothness, install, offline, safe areas |

Admin screens are viewed with the owner's sign-in. Browser checks never submit an admin form, because the admin writes to the live database.

## 11. Rollout and revert

1. All work happens on the `pour-menu` branch. `main` is not touched.
2. The owner tests the branch locally and on a Vercel preview deployment.
3. Merging `pour-menu` into `main` makes it live.
4. To revert after merging, revert the merge commit.

## 12. Later

- Ordering and table numbers, built on "my table".
- A shareable link to a table.
- Translated dish names.
- A second theme material for the next restaurant.
