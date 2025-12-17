# Font Configuration Backup

## Current Configuration (Before Change)
**Date:** Current session

### Heading Font
- **Font Family:** Playfair Display (serif)
- **Weights:** 400, 600, 700
- **CSS Variable:** `--font-playfair`
- **Usage:** Headers (ESCORT.DE, page titles, section headings)

### Body Font
- **Font Family:** Inter (sans-serif)
- **Weights:** 300, 400, 500, 600, 700
- **CSS Variable:** `--font-inter`
- **Usage:** Body text, UI elements, buttons, filters, etc.

### Implementation
- Imported via `next/font/google` in `app/layout.tsx`
- CSS variables defined in `app/globals.css`
- Applied via `.font-header` and `.font-body` classes

### To Revert:
1. Restore `app/layout.tsx` to use Playfair_Display and Inter
2. Restore font weights as shown above
3. Ensure CSS variables match: `--font-playfair` and `--font-inter`

