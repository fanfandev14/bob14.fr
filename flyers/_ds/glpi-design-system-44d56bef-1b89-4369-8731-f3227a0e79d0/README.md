# GLPI Design System

A design system reference for **GLPI** — Gestionnaire Libre de Parc Informatique. Open-source IT Service Management (ITSM) and asset-tracking software published by Teclib' and contributors, licensed under GPL-3.0.

Tokens, palettes, logos and patterns here are extracted from `glpi-project/glpi @ 11.0/bugfixes` (the current stable branch).

---

## Product context

GLPI is a dense, data-heavy admin product. It has two primary surfaces:

| Surface | Who uses it | Character |
|---|---|---|
| **Technician / admin app** | IT staff | 14-px base size, sidebar + contextbar + workspace tabs, tables everywhere, flat-leaning visuals |
| **Helpdesk / self-service portal** | End users reporting issues | Softer, lighter chrome, illustration-driven, big tiles |

The UI is built on **Tabler** (a Bootstrap 5 UI kit), so most tokens are exposed with both the Tabler prefix (`--tblr-*`) and GLPI's own (`--glpi-*`). A single install picks one named palette at a time via `<html data-glpi-theme="…">`.

## Files

```
tokens.css          all CSS custom properties (color, type, spacing, palettes)
assets/logos/       GLPI wordmark and G monogram, PNGs, light + dark
assets/favicon.ico  32×32 favicon
ds/colors.html      color system reference
ds/type.html        type scale + applied examples
ds/spacing.html     spacing, radii, shadows, layout heights
ds/components.html  buttons, badges, forms, tabs, timeline, nav, alerts
ds/brand.html       logo usage, clear space, voice & tone
```

## Content fundamentals

- **Vocabulary is ITIL.** Tickets, assets, entities, requesters, technicians, SLAs, approvals.
- **Ticket IDs are identity.** Show `#10 456` prominently in monospace — users memorise them.
- **Imperative, short UI copy.** `Save`, `Assign`, `Resolve`, `Close`. No marketing prose in the product chrome.
- **Translation-first.** GLPI runs in 50+ languages; keep strings atomic and context-labelled.
- **Teclib' publishes; GLPI is the product.** Don't collapse them in copy.

## Visual foundations

- **Flat-leaning.** Shadows are subtle; radii are small (3–8 px). Tables have hairline borders, not cards-in-cards.
- **Dense.** Body is 14 px, table small text is 11 px. Use the spacing scale (`--glpi-space-1..8`, 4-px grid) to keep rhythm.
- **Navy sidebar by default.** `#2F3F64` is the signature; amber `rgb(254,201,92)` is the accent / CTA. Links are deep indigo.
- **ITIL timeline has reserved colors.** The five timeline backgrounds (content / follow-up / task / solution / document) are semantic — don't reuse them elsewhere.
- **Dark mode is a flag, not a fork.** Set `data-glpi-theme-dark="1"` on `<html>` alongside the named palette.

## Iconography

GLPI 11 uses **Tabler Icons** (line weight, 24 × 24, 1.75 stroke). Load with:

```html
<link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css" rel="stylesheet">
<i class="ti ti-ticket"></i>
```

Common glyphs: `ti-ticket`, `ti-device-desktop`, `ti-layout-dashboard`, `ti-book`, `ti-file-dollar`, `ti-settings`, `ti-user`, `ti-alert-triangle`, `ti-check`, `ti-clock`.

Don't use emoji in product chrome.

## Palettes

Five of GLPI's 18 shipped palettes are tokenised here. Switch with `<html data-glpi-theme="…">`:

- **auror** — default. Navy sidebar, amber accent.
- **teclib** — publisher's palette. Purple sidebar, lime accent.
- **lightblue** — airy blue sidebar.
- **dark** — charcoal chrome on light body.
- **midnight** — fully dark (body + nav both black).

## License

Code & assets in this folder trace back to GLPI, GPL-3.0. Logos remain trademarks of Teclib'.
