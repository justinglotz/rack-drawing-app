# Code Review - 2026-02-27
Branch: `drawing-page`
Reviewer: frontend-reviewer

## Test Results
⚠️ No tests found

## Critical Issues

- [x] **app/job/[jobId]/page.tsx:13-14** - Missing error handling for invalid jobId and failed API fetch
  - Impact: Invalid URLs like `/job/abc` will cause runtime errors. Server-side API failures will show unhelpful Next.js error pages.
  - Fix: Add `app/job/[jobId]/error.tsx` error boundary and validate jobId parameter with `isNaN()` check before parseInt.
  - ✅ FIXED: Added isNaN() check, created error.tsx boundary

- [x] **app/job/[jobId]/page.tsx:17** - Missing width/height on flex container causes potential CLS (Cumulative Layout Shift)
  - Impact: Page layout may shift as sidebar loads. CLS > 0.1 is considered poor for Core Web Vitals.
  - Fix: Add `overflow-hidden` to prevent scrollbar-induced layout shifts: `<div className="flex h-screen overflow-hidden">`
  - ✅ FIXED: Added overflow-hidden class

- [x] **components/equipment/EquipmentSidebar.tsx:91** - Non-null assertion operator used unsafely
  - Impact: If Map.get() returns undefined, this will throw a runtime error crashing the component.
  - Fix: Use safe access pattern: `const items = groupedItems.get(item.flexSection); if (items) items.push(item);`
  - ✅ FIXED: Replaced unsafe ! operator with safe guard clause

## Warnings

- [ ] **app/job/[jobId]/page.tsx** - Missing loading.tsx file for async data fetching
  - Impact: Users see blank screen while job data loads. Poor perceived performance and potential INP issues.
  - Fix: Create `app/job/[jobId]/loading.tsx` with loading skeleton.

- [ ] **components/equipment/EquipmentSidebar.tsx:43** - Button missing accessible name when icon changes
  - Impact: Screen reader users don't get proper feedback about collapsible state.
  - Fix: Add `aria-expanded={open}` and `aria-label={`Toggle ${section.label} section`}` to button.

- [ ] **components/equipment/EquipmentSidebar.tsx:58-70** - Draggable items missing keyboard navigation support
  - Impact: Keyboard-only users cannot interact with equipment items. WCAG 2.1 Level A violation (2.1.1 Keyboard).
  - Fix: Add `tabIndex={0}`, `onKeyDown` handlers, and aria-label for keyboard accessibility.

- [x] **components/equipment/EquipmentSidebar.tsx:17-23** - Hardcoded generic items with magic IDs could conflict with real data
  - Impact: If pullsheet items have IDs 0-9, React key collisions will occur causing rendering bugs.
  - Fix: Use negative IDs or string prefixes: `{ id: -1, ... }` or `{ id: "generic-0", ... }`
  - ✅ FIXED: Changed IDs from 0-9 to -1 through -10 with explanatory comment

- [x] **api/client.ts:23-24** - Error message may expose internal implementation details
  - Impact: Production errors may leak backend stack traces or sensitive info to users.
  - Fix: Sanitize error messages in production: check `process.env.NODE_ENV === 'production'` and return generic message.
  - ✅ FIXED: Added NODE_ENV check to return generic message in production

- [x] **hooks/usePullsheetItems.ts:5-10** - Missing staleTime and refetchOnWindowFocus configuration
  - Impact: Unnecessary API calls on every window focus. Poor performance and increased server load.
  - Fix: Add `staleTime: 1000 * 60 * 5` (5 min) and `refetchOnWindowFocus: false` to useQuery options.
  - ✅ FIXED: Added staleTime (5 min) and refetchOnWindowFocus config

- [x] **components/forms/FlexUrlForm.tsx:61-75** - Loading overlay is not focusable and may trap focus
  - Impact: Keyboard users can tab behind the loading overlay. Focus should be trapped in modal contexts.
  - Fix: Add `aria-modal="true"`, `tabIndex={-1}`, and ref to focus the dialog.
  - ✅ FIXED: Added aria-modal, tabIndex, useRef, and useEffect for focus trap

## Suggestions

- [ ] **app/job/[jobId]/page.tsx:21** - Missing dynamic metadata for SEO
  - Benefit: All job pages show same generic title/description in browser tabs and search results. Add `generateMetadata` function for dynamic titles.

- [ ] **components/equipment/EquipmentSidebar.tsx:95-97** - Array.from().map() could be replaced with more efficient pattern
  - Benefit: Minor optimization - avoid creating intermediate array.

- [ ] **app/providers.tsx:7** - QueryClient created with default settings
  - Benefit: Configure global defaults (staleTime, retry) for better caching behavior across the app.

- [ ] **types/jobTypes.ts:10-24** - Zod schema uses .nullish() inconsistently
  - Benefit: Add JSDoc comments to explain why some fields are nullish vs required. Improves maintainability.

- [ ] **components/equipment/EquipmentSidebar.tsx:100** - Consider extracting magic numbers to constants
  - Benefit: Easier to maintain consistent sizing if sidebar width changes later.

## Summary

- Total issues: 15 (Critical: 3 ✅, Warnings: 7, Suggestions: 5)
- Status: **Critical issues resolved** ✅ | **4 Warnings fixed** ✅ | 3 Warnings & 5 Suggestions pending
- ESLint: ✅ Passed
- TypeScript: ✅ No errors

**Architecture**: Code follows Next.js best practices with appropriate use of Server and Client Components. Good TypeScript usage and Zod validation throughout.

**Main Concerns**: Error handling, accessibility for keyboard users, and missing loading states.

**Priority Actions**:
1. Add error boundary for job page
2. Validate jobId before parsing
3. Fix unsafe non-null assertion
4. Add keyboard accessibility to draggable items
5. Configure React Query caching

---
Generated by `/quality-check` on 2026-02-27
