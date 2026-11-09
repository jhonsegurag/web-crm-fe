# Fluvo Brand Kit v0.2

Everything you need to build the Fluvo app with the approved identity.
**From chat to order, in one flow.** (ES: *Del chat al pedido, en un solo flujo.*)
Brand guide: https://claude.ai/artifact/7KTMU7ogdXG5rNFytMtK1X

## Folders

| Folder | What's inside | Use it for |
|---|---|---|
| `logo/` | The Current mark, the wordmark and the horizontal lockup as SVG and PNG | App screens, website, social media, decks |
| `app-icon/` | App icon at 1024, 512, 192, 180 and 48 px, plus Android adaptive layers | App Store, Google Play, web app manifest |
| `colors/` | Tokens as JSON, CSS, Tailwind, SwiftUI, Android XML and Flutter | Paste straight into your codebase |
| `fonts/` | Unbounded, Manrope and DM Mono (.ttf) with their licenses | Bundle in the app or install for design work |

SVG is the master format. The wordmark is converted to outlines, so it renders the same everywhere without the font installed.

## Logo

The mark is three streams (your WhatsApp chats) that meet in one orange point (the order).

| Background | Mark | Lockup |
|---|---|---|
| Light (white, Shallows) | `fluvo-mark-on-light.svg` | `fluvo-lockup-on-light.svg` |
| Dark (Riverbed) | `fluvo-mark-on-dark.svg` | `fluvo-lockup-on-dark.svg` |
| Orange (Current) | `fluvo-mark-on-orange.svg` | `fluvo-lockup-on-orange.svg` |

The wordmark alone (`fluvo-wordmark-deep.svg` / `fluvo-wordmark-light.svg`) is for tight horizontal spaces.

Rules: keep clear space around the logo equal to the diameter of the orange dot. The mark should be at least 24 px and the lockup at least 96 px wide. Never stretch, rotate, recolor or add shadows. The dot is always orange, except on an orange background, where it turns white.

## App icon

- **iOS:** use `fluvo-app-icon-1024.png` as the single 1024 px icon in Xcode's AppIcon set. iOS rounds the corners itself.
- **Google Play:** `fluvo-app-icon-512.png`.
- **Android adaptive icon:** `android-adaptive-foreground` (mark on transparent) and `android-adaptive-background` (solid Riverbed), 432 px. The mark sits inside the 66% safe zone.
- **Web / PWA:** use the 192 and 512 PNGs in `manifest.json` and 180 as `apple-touch-icon`. For the favicon, use `logo/fluvo-mark-on-light-32.png`.

## Colors

| Name | Hex | Role | Share of a screen |
|---|---|---|---|
| Riverbed | `#231A33` | Text, icon background, dark surfaces | ~40% |
| Shallows | `#F1EEF8` | Light backgrounds and cards | ~30% |
| Stream | `#B8A7FF` | Secondary UI, pipeline, charts | ~15% |
| Current | `#FF6B2C` | Main buttons, the order point | ~10% |
| Ready | `#22A565` | Confirmed and ready orders only | ~5% |

Stream Ink `#8A76E8` is a darker Stream for lines and icons on white.

### Order status colors

| Status | Color |
|---|---|
| New | Stream `#B8A7FF` |
| Confirmed | Current `#FF6B2C` |
| Preparing | Amber `#F2B33D` (status only, not a brand color) |
| Ready | Ready `#22A565` |

### Contrast (WCAG AA)

| Text on background | Ratio | Use |
|---|---|---|
| Riverbed on light background `#F8F7FB` | 15.5 : 1 | Any text |
| Shallows on Riverbed | 14.5 : 1 | Any text |
| Riverbed on Amber | 8.9 : 1 | Any text |
| Riverbed on Stream | 7.9 : 1 | Any text |
| Muted text `#5E566E` on light background | 6.5 : 1 | Any text |
| Riverbed on Current | 5.8 : 1 | Any text: **use this for orange buttons** |
| Riverbed on Ready | 5.2 : 1 | Any text |
| White on Ready | 3.2 : 1 | Only bold labels of 19 px or more |
| White on Current | 2.8 : 1 | Never |

## Fonts

| Role | Family | Weights | Where |
|---|---|---|---|
| Display | Unbounded | 700, 800 | Headlines only, used sparingly |
| Body | Manrope | 400, 500, 600, 700 | UI, chats, long text |
| Data | DM Mono | 400, 500 | Order numbers, prices, SKUs |

Type scale (px): Display 48 · H1 32 · H2 24 · H3 18 · Body 16 · Small 14 · Caption 12.

All three fonts are free under the SIL Open Font License (see `fonts/OFL-*.txt`). You can use them in the app, on the web and in ads, and bundle them, with no fee.
Also available on Google Fonts: https://fonts.google.com/specimen/Unbounded, https://fonts.google.com/specimen/Manrope, https://fonts.google.com/specimen/DM+Mono

Unbounded and Manrope are variable fonts, so one file covers every weight. If your build tool needs static files, download the static weights from the Google Fonts pages above.

## Voice in the UI

Use short sentences that say the next step, with no jargon. English is the master language, and Spanish uses "tú".

- "Laura wants 2 chicken bowls for 1 pm. Create the order?" / "Laura quiere 2 bowls de pollo para la 1 pm. ¿Creamos el pedido?"
- "5 chats are waiting for a reply. Oldest first." / "5 chats esperan respuesta. Primero el más antiguo."
- "Order #1048 is ready. Let Laura know?" / "El pedido #1048 está listo. ¿Le avisamos a Laura?"

## Design tools

- **Figma:** drag the SVGs in, add the colors as color styles, and add the three fonts as text styles using the type scale above.
- **Canva:** upload the SVG logos and add the hex codes to your Brand Kit.

Before launch, run a trademark search and a domain check for the name "Fluvo".
