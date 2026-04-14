# POS Settings Design Proposal

## 1. Current State Analysis
The current POS interface (`components/pos/pos-workspace.tsx`) uses a hardcoded responsive layout strategy. The interface primarily adapts between desktop and mobile viewport sizes using static CSS media queries and predefined layout flags (e.g., `layout="inline"` vs `layout="review"` for `PosCartRail`).
- **Stores:** `stores/pos-cart.ts` handles cart logic, items, customers, and payment states, but does **not** persist any UI layout, display density, or user workflow preferences.
- **Customization:** There are currently no user-facing settings to adjust product grid density, cart position, accessibility features, or workflow defaults (like auto-print).

## 2. All Customizable Settings
To provide a tailored experience across diverse retail environments, the following settings are proposed:

### Product Grid
- **Grid Density:** `Comfortable` | `Compact`. (Rationale: Reduces padding and font sizes so users with large inventories can see more items on screen without scrolling).
- **Thumbnail Size:** `Small` | `Medium` | `Large` | `Hidden`. (Rationale: Retailers reliant on barcodes or pure text lists don't need thumbnails, saving screen space).
- **Fields Visibility:** Toggle display of `SKU`, `Stock Count`, `Category Label`. (Rationale: Reduces visual clutter for cashiers who only need product names and prices).

### Cart Display
- **Cart Position (Desktop):** `Left` | `Right`. (Rationale: Supports Left-Handed vs Right-Handed operators or aligns with physical register/scanner placement).
- **Cart Width:** `Standard` | `Wide`. (Rationale: Useful for products with very long Arabic names that require more text-wrapping space).
- **Cart Density:** `Comfortable` | `Compact`. (Rationale: Allows large transactions to fit without scrolling).

### Payment Options
- **Quick Actions:** Toggle display of quick cash amounts (e.g., 50, 100, 500). (Rationale: Speeds up cash transactions; irrelevant for card-only terminals).
- **Default Payment Method:** `Cash` | `Card` | `None`. (Rationale: Saves a click if 90% of transactions use the same method).

### Visual & Accessibility
- **Font Size:** `Standard` | `Large` | `Extra Large`. (Rationale: Crucial for visually impaired operators or older tablets).
- **High Contrast Mode:** `On` | `Off`. (Rationale: Meets WCAG guidelines and helps in high-glare environments).
- **Reduced Motion:** Toggle animations (e.g., slide-ins, modal transitions). (Rationale: Improves performance on low-end hardware and aids vestibular accessibility).

### Workflow
- **Auto-print Receipt:** `On` | `Off`. (Rationale: Automatically triggers the print dialog upon successful payment).
- **Auto-clear Cart:** `On` | `Off`. (Rationale: Determines if the cart clears immediately after a sale or waits for manual dismissal).
- **Search Default:** `Barcode` | `Text`. (Rationale: Auto-focuses the correct input field based on hardware presence).

## 3. Settings Panel UI Design (Wireframe Concept)

```text
+-------------------------------------------------------------+
| X  إعدادات نقطة البيع (POS Settings)                          |
+-------------------------------------------------------------+
| [ واجهة العرض ] [ السلة والدفع ] [ سير العمل ] [ إمكانية الوصول ]|
+-------------------------------------------------------------+
|                                                             |
|  حجم شبكة المنتجات (Product Grid Density)                   |
|  ( ) مريح (Comfortable)   (•) مدمج (Compact)                |
|                                                             |
|  حجم الصور (Thumbnail Size)                                 |
|  ( ) مخفي   ( ) صغير   (•) وسط   ( ) كبير                   |
|                                                             |
|  إظهار الحقول (Show Fields)                                  |
|  [x] الباركود (SKU)   [x] المخزون (Stock)                   |
|                                                             |
|  ---------------------------------------------------------  |
|  موقع السلة (Cart Position)                                  |
|  ( ) اليمين (Right)   (•) اليسار (Left)                     |
|                                                             |
|                                                             |
+-------------------------------------------------------------+
|                     [ استعادة الافتراضي ]      [ حفظ وإغلاق ] |
+-------------------------------------------------------------+
```
*(The panel will be a centered modal or a right-side sliding drawer standard to Aya Mobile's UI patterns, fully localized in Arabic).*

## 4. How User Accesses Settings
- **Location:** A new "Settings" (إعدادات) gear icon added to the POS Header/Toolbar (`components/pos/toolbar.tsx`), likely next to the "Held Carts" button.
- **Navigation:** Clicking the icon opens the settings panel via a modal or bottom-sheet (on mobile). This ensures cashiers can tweak settings without leaving the active sales screen or losing their current cart.

## 5. How Settings are Saved and Applied
- **Immediate Preview:** Selecting a visual setting applies a CSS class/variable to the POS wrapper immediately for preview.
- **Commit:** Clicking "Save" persists the settings to `localStorage`.
- **Scope:** Settings are specific to the device/browser. (e.g., The main iPad register might have "Left Cart", while the mobile phone register has "Auto-print Off").
- **Application:** A dedicated React Context or Zustand store (`stores/pos-settings.ts`) provides these values to `PosWorkspace`, which dynamically adjusts CSS modules and conditional rendering.

## 6. Technical Approach
- **State Management:** Create a new Zustand store (`stores/pos-settings.ts`) completely separate from `pos-cart.ts` to cleanly divide UI preferences from transactional state.
- **Persistence:** Use Zustand's `persist` middleware configured with `localStorage`.
- **CSS Strategy:**
  - Expose layout variables as React props to top-level containers.
  - Map density/position preferences to top-level data attributes (e.g., `<div data-pos-density="compact" data-cart-pos="left">`).
  - Update `pos-view.module.css` to use CSS descendant selectors based on these data attributes to adjust widths, flex directions, and paddings without re-rendering internal components unnecessarily.

## 7. Implementation Phases
- **Phase 1: Foundation.** Create `stores/pos-settings.ts` with default values and persistence. Wrap POS with a settings provider/hooks.
- **Phase 2: CSS Refactoring.** Update `pos-view.module.css` and related modules to react to data-attributes for density, widths, and grid sizes.
- **Phase 3: Logic Implementation.** Wire up conditional rendering (hiding thumbnails, workflow rules like auto-print) in `pos-workspace.tsx` and cart components.
- **Phase 4: UI Panel.** Build the actual `PosSettingsModal` component, wire it to the toolbar, and link inputs to the Zustand store.

## 8. Risks and Solutions
- **Risk 1: Layout Breakage on Mobile.**
  - *Solution:* Ignore Desktop-specific settings (like "Cart Position") when a mobile viewport is detected, falling back to the standard mobile bottom-sheet cart.
- **Risk 2: Performance Hits from Re-renders.**
  - *Solution:* Rely heavily on CSS data-attributes for visual changes (density, sizes, colors) rather than React conditional rendering, preventing expensive DOM rebuilds of large product lists.
- **Risk 3: Loss of Settings across Devices.**
  - *Solution:* Since settings are local, clearly communicate this in the UI. If multi-device sync is requested later, we can migrate the store's persistence layer to Supabase user profiles.

## 9. Additional Settings to Consider
Beyond the core layout and workflow configurations, the following settings could be valuable for a fully customizable POS experience:
- **Receipt Format:** `Full Details` | `Summary Only` | `Eco-mode (No Header/Footer)`. (Rationale: Allows stores to save paper for quick transactions while keeping full receipts for expensive items).
- **On-Screen Keyboard Layout:** `System Default` | `Numpad Priority`. (Rationale: Forces a numeric keypad to appear by default for cashiers entering quantities/amounts rather than full text).
- **Payment Timeout Warning:** `15s` | `30s` | `60s` | `Off`. (Rationale: Alerts the cashier if a cart has been held open in the payment screen for too long without finalizing, preventing abandoned active states).
- **Scan Beep Volume:** `Mute` | `Low` | `High`. (Rationale: Useful for hardware scanners or camera scanning to confirm item addition without looking at the screen).

## 10. Tablet-First Approach
Since 90% of our user base operates on tablets (specifically iPad 10.2"), this feature must be designed primarily for a touch-based, landscape environment. Desktop usage is secondary, and mobile (2%) can fall back to defaults or ignore certain settings.
- **Orientation Constraints:** The POS settings panel will be designed assuming landscape iPad usage. Vertical space is limited, so scrolling within the modal is preferred over pagination.
- **Touch Targets:** All interactive elements (radio buttons, toggles, save buttons) within the settings panel must have a minimum touch target size of 44x44px.
- **Gestures:** The settings panel should be dismissible by tapping outside the modal (backdrop tap) to maintain standard tablet UX flows.
- **Drawer vs Modal:** On iPad, a wide right-side sliding drawer (approx 40% width) is often more ergonomic than a center modal, allowing the cashier to still see part of the POS interface while adjusting settings.

## 11. Tablet Validation Checklist
Before moving to full implementation, we must validate the design against this tablet-first criteria:
- [ ] **Touch Target Verification:** Are all toggles and buttons easily tappable by a finger without accidental misclicks? (Minimum 44x44px).
- [ ] **Orientation Handling:** If the iPad is rotated to portrait, does the settings panel remain usable without elements overlapping?
- [ ] **On-Screen Keyboard Interaction:** When typing in a text field (e.g., custom timeout), does the virtual keyboard cover the "Save" button? If so, does the panel scroll up correctly?
- [ ] **Performance Profile:** When switching "Grid Density" or "High Contrast Mode", does the tablet freeze, or does it apply instantly via CSS variable injection?
- [ ] **Persistence Check:** If the cashier closes Safari/Chrome on the iPad and reopens it, do the settings persist correctly via `localStorage`?
