---
name: Le Baron
description: A bilingual portfolio that maps Jules’s public GitHub projects.
colors:
  paper: "#f3f0e8"
  map-ground: "#faf9f4"
  surface: "#fffefa"
  soft: "#e9e7df"
  ink: "#202c3b"
  navy: "#192d45"
  muted: "#526172"
  line: "#c9c9c1"
  line-strong: "#9ca5a9"
  cobalt: "#1539d3"
  coral: "#e6533d"
  sky: "#3481b8"
  lime: "#a2bd29"
  violet: "#6956a8"
  amber: "#bf7918"
  active: "#d3f150"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(36px, 5.5vw, 68px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Barlow, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Mono, ui-monospace, monospace"
    fontSize: "9px"
    fontWeight: 500
    letterSpacing: "0.04em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "10px"
  lg: "15px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.active}"
    textColor: "#172433"
    rounded: "{rounded.md}"
    padding: "11px 16px"
    height: "46px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "11px 16px"
    height: "46px"
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "39px"
  category-filter:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
    height: "34px"
  map-panel:
    backgroundColor: "{colors.map-ground}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
---

# Design System: Le Baron

## Overview

**Creative North Star: “The Metadata Transit Map”**

Le Baron presents Jules’s public repositories as destinations in a compact, navigable atlas. The surface combines mineral paper tones, dark station-like headings, condensed display type, and small monospaced coordinates. Project artwork is generated from repository facts and CSS/SVG geometry; the map is a visual index that helps visitors explore the catalogue.

The interface supports French and English, light and dark themes, and the same project discovery, category, saved-match, and profile areas across screen sizes. A map route means only that projects share a category or programming language. It does not describe dependencies, imports, or technical relationships.

**Key Characteristics:**
- A paper-and-ink base with bright route colors and a lime active state.
- Condensed Barlow headlines paired with readable Barlow body copy and DM Mono metadata.
- Repository facts shape the project map and CSS/SVG artwork.
- Responsive, touch-ready project exploration with reduced-motion support.

## Colors

The light palette is grounded in warm mineral paper and slate ink; distinct route colors organize categories, while lime identifies selection and primary action. Dark mode remaps the main surfaces and accents for contrast.

### Primary
- **Signal Cobalt**: Used for active navigation, links, focus context, and the cobalt project route family.
- **Signal Coral**: Marks an alternate route family, saved-match details, and some profile timeline accents.
- **Open Sky**: Identifies another project route family.
- **Field Violet**: Identifies another project route family.
- **Amber Marker**: Identifies a route family and labels demo or placeholder profile content.

### Tertiary
- **Survey Lime**: Selection, primary actions, and highlighted project nodes.

### Neutral
- **Mineral Paper**: Main light page background.
- **Map Ground**: Background of the project map.
- **Chalk Surface**: Cards and controls.
- **Soft Stone**: Secondary fills and project-art surround.
- **Slate Ink**: Main text in light mode.
- **Station Navy**: Intro screen and selected navigation/filter surfaces.
- **Muted Slate**: Supporting text and metadata.
- **Fine Cartography**: Default dividers and borders.
- **Strong Cartography**: Emphasized borders and separators.

### Named Rules
**The Metadata Route Rule.** Route colors and connecting lines encode shared category or language only; never describe them as code dependencies or architecture.

**The Active Lime Rule.** Use lime to identify selection and primary action, keeping category identity with the route palette.

## Typography

**Display Font:** Barlow Condensed (with Arial Narrow, sans-serif fallbacks)
**Body Font:** Barlow (with Arial, sans-serif fallbacks)
**Label/Mono Font:** DM Mono (with ui-monospace, monospace fallbacks)

**Character:** Condensed, high-weight headlines give the project catalogue a clear wayfinding voice. Barlow keeps paragraphs and controls familiar; DM Mono makes counts, categories, coordinates, and status labels read like compact metadata.

### Hierarchy
- **Display** (700, responsive 36–68px on standard view headings, 0.98 line-height): Main page titles; the intro title grows to 58–112px on wider screens.
- **Headline** (700, responsive 38–68px, 0.98 line-height): View titles and major section headings.
- **Title** (600–700, typically 15–29px): Project names, panels, and profile sections.
- **Body** (400, typically 12–15px, 1.45–1.6 line-height): Descriptions and explanatory copy; the intro copy scales up to 20px.
- **Label** (DM Mono 500, commonly 8–11px, tracked and often uppercase): Coordinates, category metadata, counts, status, and footer details.

### Named Rules
**The Three Register Rule.** Use condensed Barlow for hierarchy, Barlow for reading, and DM Mono for factual metadata and compact labels.

## Layout

The desktop discovery view uses a two-column map and project inspector, with the map receiving the larger share of space. The main content is capped at 1660px; page padding scales with viewport width. At 1100px, gutters and map sizing tighten. At 820px, discovery, profile, and saved-match details stack, and primary navigation moves to a fixed four-item bottom bar with safe-area padding. At 560px, typography, map, artwork, and controls compress for narrow screens; the map remains above the active project detail. The document supports a 320px minimum width.

Spacing is compact and functional: 4–8px for label and control internals, 10–17px for component padding, and roughly 15–24px between major surfaces. The network map is at least 462px tall on wide layouts, 420px below 1100px, 350px below 820px, and 180px below 560px.

## Elevation & Depth

The system uses tonal separation and fine borders throughout, with a shared soft shadow on major panels and buttons on hover. Cards sit above page and map grounds through their fill, border, and shadow; route and selection states are conveyed by color and line emphasis. The dark theme deepens the shared shadow.

### Shadow Vocabulary
- **Panel Lift** (`0 18px 42px rgba(26, 43, 66, .11)` in light mode): Shared by the map panel, project inspector, and contact card.
- **Action Hover Lift**: Buttons use the shared panel shadow on hover alongside a small upward shift.

## Shapes

Controls and panels use gently rounded corners, from compact 4–8px labels and filters to 10px buttons, 15–16px cards and map surfaces. Project nodes and legend markers are circular. Borders are thin and quiet; the profile timeline and route artwork use straight, geometric strokes. The map clips overflow to keep the network within its panel.

## Components

### Buttons
- **Character:** Compact, confident controls with a clear lime primary action.
- **Shape:** Gently rounded corners (10px); standard controls are at least 46px high.
- **Primary:** Lime fill, dark text, and 11px × 16px padding; hover brightens the lime and lifts the button.
- **Secondary:** Surface fill, ink text, and a quiet border; hover lifts with the shared shadow.
- **Focus:** Keyboard focus uses a 3px coral outline with a 4px offset.

### Chips
- **Style:** Category filters are compact, bordered controls (8px radius), with muted text and transparent fill by default.
- **State:** Hover introduces cobalt; selected filters use a navy fill and white text, switching to cobalt fill in dark mode.

### Cards / Containers
- **Corner Style:** Map and inspector cards use rounded 15–16px corners; contact cards use 15px.
- **Background:** Map uses the map ground; inspector and contact cards use the surface fill.
- **Shadow Strategy:** Shared panel lift separates major cards from the page.
- **Border:** One-pixel neutral border; map headers and footers have dividing rules.
- **Internal Padding:** Map headings use 17px horizontal padding; inspector content is responsive, with 13px on narrow screens.

### Navigation
- **Desktop:** Sticky, 78px minimum-height header with centered links, muted at rest and ink when hovered or active. Active links receive a 3px cobalt underline.
- **Mobile:** At 820px and below, replace desktop links with a fixed four-column bottom navigation sized for safe-area insets. Active items use cobalt and a short top marker.

### Project Map
The map is the signature catalogue surface. Nodes are circular and category-colored; the active node gains a lime fill and navy center, while saved and previously seen states receive small markers or a dashed outline. Connecting SVG lines may emphasize the active selection, but encode shared category or language metadata only. They must not imply dependency or import relationships.

### Project Artwork
Repository panels are composed in CSS from repository metadata, with generated geometric strokes and compact labels. They are data-led artwork, not raster illustrations or user portraits.

## Do's and Don'ts

### Do:
- **Do** preserve the warm paper, chalk surface, and slate ink relationships in light mode; use the implemented dark theme mappings when a dark theme is needed.
- **Do** keep repository category and language as the only semantics represented by map connections.
- **Do** use Barlow Condensed for display hierarchy, Barlow for reading, and DM Mono for metadata.
- **Do** retain the four-item bottom navigation and safe-area spacing at mobile sizes.
- **Do** respect `prefers-reduced-motion`; the interface reduces animation and transition duration when requested.

### Don't:
- **Don't** call map connections dependencies, imports, or architecture; category/language sharing is their complete meaning.
- **Don't** introduce raster artwork as if it were an existing portfolio asset; project visuals are currently composed in CSS/SVG from metadata.
- **Don't** use the demo profile content as confirmed biographical claims; the interface marks it as sample material.
