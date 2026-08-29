# Caramel

Caramel is a production-oriented restaurant menu and content-management web application. It delivers a public, SEO-oriented restaurant site and an authenticated administration portal. Restaurant identity, menu catalog, media, hours, and SEO copy are stored in Supabase; the application does not hardcode business content.

## Overview

The public site is a Hebrew RTL restaurant experience: profile, hero media, category navigation, menu, availability and pricing, about copy, location (including Waze), weekly hours with open/closed state, and social links. Content is loaded from PostgreSQL at request time.

The admin portal is a protected App Router area. Signed-in members of `private.admin_users` can manage the same content, including sort order, visibility, availability, media uploads, overnight opening intervals, and SEO fields. Mutations run as authenticated server actions; the browser never uses a service-role key.

Public reads are gated on an active restaurant profile. When the profile is inactive or missing, the public UI stays empty of catalog data and search engines are instructed not to index.

## Architecture

### Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript (strict)
- Tailwind CSS v4
- Server Components by default
- Client Components limited to interactive surfaces (auth forms, media players, menus, admin editors)

Route groups isolate the public site (`app/(public)`), the CMS (`app/admin`), and auth callbacks (`app/auth`). `proxy.ts` refreshes the Supabase cookie session.

### Backend / data

- Supabase (PostgreSQL, Auth, Storage)
- Row Level Security on application tables and storage objects
- SQL migrations under `supabase/migrations/`
- Generated TypeScript types in `types/database.ts`

Application data access lives in `services/` (read models) and `features/*/actions.ts` (writes). Domain helpers sit in `lib/`.

### Deployment

Intended deployment is Vercel for the Next.js app and a hosted Supabase project for database, auth, and storage. Required public environment variables are listed in `.env.example`.

## Main application areas

### Public restaurant experience

- Restaurant profile (name, subtitle, about, phone, address, Waze URL, logo) from Supabase
- Responsive hero images and video, with a fallback when no media is published
- Open/closed status derived from opening hours in `Asia/Jerusalem`, including overnight intervals
- Circular category navigation; selected category is reflected in the URL (`?category=`)
- Horizontal, responsive menu sections and item cards; unavailable items remain visible with an unavailable state
- Item detail dialog for name, price, description, and image
- About, location, weekly hours, and social links
- Dynamic metadata, Open Graph image, favicon, sitemap, robots, and Restaurant JSON-LD

### Administration portal

Authenticated administrators can manage:

- Restaurant profile and logo
- Hero images and videos (order, visibility, alt text)
- Categories (create, update, delete, sort, images)
- Menu items (create, update, delete, category assignment, sort per category, visibility, availability, price, images, descriptions)
- Opening hours (multiple intervals per weekday, including intervals that cross midnight)
- Social links (platform, URL, visibility, order)
- SEO title and description overrides

## Security

- RLS policies on public tables; writes require `private.is_admin()`
- Admin membership lives in `private.admin_users` (not exposed through the Data API)
- `public.current_user_is_admin()` RPC for server-side checks
- Public `SELECT` policies additionally require an active restaurant profile
- Browser and server clients use the publishable (anon) key only
- Storage policies: public read on restaurant buckets; insert/update/delete restricted to admins; MIME and size limits on buckets
- Client-side upload validation before Storage writes; orphaned objects cleaned up on failed writes where implemented
- Internal redirects validated (`lib/safe-redirect.ts`) to block open redirects
- `/admin` and `/auth` are `noindex, nofollow`
- Session refresh in `proxy.ts` and authorization checks in the protected CMS layout

Do not place the service role key in frontend environment variables.

## Database

Migrations are applied in timestamp order. Core relations:

| Relation | Role |
| --- | --- |
| `restaurant_profile` | Singleton identity, contact, about, logo, active flag |
| `opening_hours` | Weekday intervals (`start_time`, `end_time`; overnight when end ≤ start) |
| `social_links` | Platform, URL, visibility, sort order |
| `hero_media` | Image or video slides, sort order, visibility |
| `categories` | Menu sections, images, sort order |
| `menu_items` | Dishes; `category_id` → `categories`; price, availability, visibility, sort order |
| `site_settings` | SEO title/description overrides |
| `private.admin_users` | Auth user ids allowed to administer |

`menu_items.category_id` is a foreign key to `categories`. Public menu rendering groups items by category sort order, then item sort order.

After schema changes, regenerate types:

```bash
npm run db:types          # local Supabase
npm run db:types:linked   # linked hosted project
```

Bootstrap the first admin by inserting the Auth user UUID into `private.admin_users` (SQL editor or a privileged session). Subsequent admin checks use `private.is_admin()`.

## Media / storage

Public buckets (read for everyone; write for admins):

- `branding` — restaurant logo (includes SVG)
- `hero` — hero images and video (larger size limit)
- `categories` — category images
- `menu-items` — dish images

`next/image` is configured for Supabase public object URLs. Uploads go through the publishable client with bucket MIME/size constraints.

## SEO

- `generateMetadata` on the public home from profile + `site_settings`
- Canonical URL from `NEXT_PUBLIC_SITE_URL`
- Open Graph and Twitter card fields; generated OG image and icon
- `app/sitemap.ts` and `app/robots.ts`
- Restaurant JSON-LD (`features/public/seo/restaurant-json-ld.tsx`) including hours and social URLs when present
- Inactive or missing restaurant profile → `noindex`

Admin and auth layouts force `robots: { index: false, follow: false }`.

## Performance

- Server Components for data fetching on public and admin pages
- Client islands for carousel, menu interactions, and forms
- `next/image` with `sizes` tuned to card and hero breakpoints
- Lazy loading for below-the-fold imagery; priority loading for LCP (first hero slide, logo)
- Hero video plays after mount; respects `prefers-reduced-motion`
- Public home is `force-dynamic` so catalog edits appear without a static snapshot
- Server actions call `revalidatePath` after writes
- Dashboard and shell loaders share queries where possible (`services/admin-dashboard.ts`)

## Accessibility

- Semantic landmarks, skip link to main content
- Keyboard-operable category rail, menu cards, and dialogs
- Visible focus rings on interactive controls
- `prefers-reduced-motion` disables non-essential animation
- Dialogs use native `<dialog>` with labelled titles
- RTL layout (`dir="rtl"`, `lang="he"`)

## Local development

Requirements: Node.js 20.9 or newer, npm.

```bash
git clone <repository-url>
cd Caramel_next
npm install
cp .env.example .env.local
```

Set in `.env.local` (no trailing slash on the site URL):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap, robots, and auth redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key |

```bash
npm run dev
```

The public site does not require a session. The CMS is available to authorized operators.

## Database development

```bash
npm run db:start    # local Supabase stack
npm run db:stop
npm run db:reset    # apply migrations locally
npm run db:types
npm run db:types:linked
```

Migrations live in `supabase/migrations/`. Use the Supabase CLI (`supabase db push`) against a linked project to apply them to hosted Postgres.

## Quality checks

There is no automated test suite. Use:

```bash
npm run lint
npm run typecheck
npm run build
```

Optional formatting:

```bash
npm run format:check
npm run format
```

## Project status

This repository is the v1 application foundation: public restaurant experience, CMS, auth, RLS, storage, and SEO. Live restaurant copy and media are managed through the admin portal against a Supabase project.
