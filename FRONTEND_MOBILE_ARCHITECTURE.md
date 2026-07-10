# SkillDrive Frontend Architecture — Mobile-First Design Guide

## Overview

**SkillDrive** is a mobile-optimized React application for booking driving lessons. This document focuses exclusively on the frontend UI/UX, component architecture, and responsive design patterns optimized for **mobile devices**.

### Frontend Stack
- **React 19.2.0** with automatic batching & hooks
- **TypeScript 5.9** (strict mode)
- **React Router v7** for navigation
- **Tailwind CSS 4.1.18** with custom utilities
- **Zustand** for lightweight auth state (mobile-aware)
- **Lucide React Icons** (562 KB, tree-shakeable)
- **date-fns** for date handling (mobile date pickers)

---

## Mobile Design System

### Breakpoints & Responsive Behavior
```css
/* Tailwind breakpoints */
sm:  640px   /* Small tablets */
md:  768px   /* Medium tablets */
lg:  1024px  /* Desktops */
xl:  1280px  /* Large screens */

/* Mobile-first approach */
/* Default: Mobile (< 640px) */
/* md:  — Tablet optimizations */
/* lg:  — Desktop optimizations */
```

### Color Palette (Mobile-Safe)
```css
--ink: #0A1024;           /* Deep navy text */
--ink-2: #1A2240;         /* Secondary text */
--ink-mute: #5B6587;      /* Muted/tertiary text */
--paper: #F4EFE3;         /* Background (warm beige) */
--paper-2: #ECE6D5;       /* Secondary background */
--surface: #FFFFFF;       /* Card/modal background */
--cobalt: #1B3CFF;        /* Primary action (bright blue) */
--cobalt-deep: #0F2BC9;   /* Hover/active state */
--signal: #FFD60A;        /* Warning/attention (yellow) */
--coral: #FF5A4F;         /* Error/danger */
--green: #1FA85F;         /* Success/approved */
--line: #E2DDD0;          /* Borders (light) */
```

**Mobile Considerations:**
- High contrast for readability on bright screens
- Warm tones reduce eye strain
- Primary accent (cobalt) stands out on small screens
- Signal yellow for CTAs (high visibility)

### Typography System
```typescript
Font Stacks:
- Display: "Instrument Serif" → times serif (headlines)
- Sans: "Space Grotesk" → system ui fonts (body)
- Mono: "JetBrains Mono" → code/details

Mobile Font Sizes:
- h1: clamp(64px, 9vw, 132px)  /* Scales with viewport */
- h2: 28px–36px
- body: 14px–17px (readable on small screens)
- captions: 12px–13px
```

### Spacing System
```css
Gap utilities:
.sd-gap-1  = 4px
.sd-gap-2  = 8px
.sd-gap-3  = 12px
.sd-gap-4  = 16px
.sd-gap-5  = 20px
.sd-gap-6  = 24px
.sd-gap-8  = 32px

Mobile padding: 28px horizontal (safe for narrow screens)
```

### Mobile Container & Layout
```typescript
.sd-shell           /* Main wrapper: min-height 100vh */
.sd-container       /* Max-width: 1280px; Padding: 28px */
.sd-row             /* display: flex; flex-direction: row */
.sd-col             /* display: flex; flex-direction: column */
.sd-between         /* justify-content: space-between */
.sd-acenter         /* align-items: center */
.sd-center          /* Centered content */
.sd-screen          /* Fade-in animation on route change */
```

**Mobile-First Grid:**
```css
/* Default: 1 column (mobile) */
grid-cols-1

/* Tablet: 2 columns */
md:grid-cols-2

/* Desktop: 3+ columns */
lg:grid-cols-3
```

---

## Component Hierarchy

### Layout Components

#### 1. **Navbar** (Sticky Header)
**File:** `components/Navbar.tsx`

**Mobile Features:**
- Fixed at top (sticky, z-50)
- Logo + brand on left
- Navigation pill (rounded background) with horizontal scroll on mobile
- User menu (avatar + dropdown) on right
- Responsive: Collapses nav items below `md` breakpoint

**Structure:**
```
┌─────────────────────────────────────┐
│ [Logo] SkillDrive  [Nav Items]  [👤] │
└─────────────────────────────────────┘
  [Home] [Find Instructor] [Teach] [Dashboard] [Admin]
```

**Mobile Implementation:**
- Logo size: 32px
- Font size: 22px (display serif)
- Nav items: Horizontal pill with overflow scroll
- Backdrop blur: `blur(10px)` for glass effect
- Safe padding on mobile edges

**Conditional Nav Items:**
- `user` present → Show "Dashboard"
- `isAdmin` true → Show "Admin"
- Always show: "Home", "Find Instructor", "Teach"

---

### Screen Components (Full-Page Routes)

#### 2. **Home** (`pages/Home.tsx`)
**Purpose:** Landing page with hero, instructor search, testimonials

**Mobile Sections:**
```
1. HERO SECTION (80px top, 100px bottom padding)
   ├─ Badges: "New • Feature" + "580 instructors"
   ├─ Headline: "The driving instructor you'd recommend to your sister"
   │  (Uses clamp() for responsive sizing: 64px–132px)
   ├─ Subheading: 20px, muted gray
   └─ Search Box (inline-flex, full width on mobile)
      ├─ Pin icon
      ├─ Input: "Suburb or postcode (try 2010)"
      └─ Button: "Compare instructors"

2. SOCIAL PROOF
   ├─ Avatar stack (overlap -10px margin)
   ├─ Rating: "4.94 avg. from 52,400 lessons"
   └─ Badge: "Verified by Roads & Maritime Services"

3. FEATURED INSTRUCTORS (Grid: 1 col mobile → 3 col desktop)
   └─ InstructorCard × 3

4. TESTIMONIALS (Carousel/Grid)
   └─ Quote cards with student name + location

5. CTA SECTION
   └─ Large button: "Start your lesson journey"
```

**Mobile Optimizations:**
- Hero padding: `padding: 80px 28px 100px` (safe margins)
- Floating preview card: `hidden xl:block` (desktop only)
- Search form: Full width, rounded, shadow
- Touchable buttons: min 44px height (accessibility)

---

#### 3. **SearchResults** (`pages/SearchResults.tsx`)
**Purpose:** Discover & filter instructors by location/rating/availability

**Mobile Layout:**
```
┌──────────────────────────────┐
│ Search Filters (Sidebar)     │ ← Sticky on mobile
├──────────────────────────────┤
│ Instructor Cards (Grid)      │
│ ┌──────────────────────────┐ │
│ │ [Card] [Card] [Card]     │ │ 1 col mobile
│ │ [Card] [Card] [Card]     │ │ 2 col tablet
│ └──────────────────────────┘ │ 3 col desktop
└──────────────────────────────┘
```

**Filters (Mobile Drawer):**
- Postcode/suburb input
- Rating range (slider)
- Vehicle type (checkbox)
- Availability (day picker)
- Dual control (toggle)
- Price range (slider)

**Card Components:**
- Instructor photo (responsive)
- Name + rating + review count
- Vehicle preview
- Hourly rate
- "View Profile" CTA

**Mobile Considerations:**
- Filters: Drawer or sticky section
- Cards: Stack vertically on mobile
- Pagination: Lazy load on scroll

---

#### 4. **InstructorProfile** (`pages/InstructorProfile.tsx`)
**Purpose:** Detailed instructor view with booking CTA

**Mobile Sections:**
```
1. HERO SECTION
   ├─ Cover image (full width, ~200px height on mobile)
   ├─ Instructor photo (absolute overlay, -60px from top)
   ├─ Name, rating, review count
   └─ Contact info (phone, suburbs covered)

2. TABS/ACCORDION (Mobile-friendly)
   ├─ About
   │  ├─ Bio text
   │  ├─ Suburbs served
   │  └─ Verification badges
   ├─ Vehicle
   │  ├─ Car photo (carousel on mobile)
   │  ├─ Model, year, transmission
   │  └─ Features (dual control, etc.)
   ├─ Packages
   │  └─ Package cards (vertical stack)
   └─ Reviews
      └─ Review cards (expandable)

3. BOOKING SECTION (Sticky on mobile)
   ├─ CTA: "Book a lesson"
   └─ Quick stats: "580 bookings", "4.94 rating"
```

**Mobile Features:**
- Hero image: Full viewport width
- Photo overlay: Centered
- Tabs: Horizontal scroll on mobile (or accordion)
- Sticky footer CTA: "Book" button floats above bottom nav
- Reviews: Truncated to 2 lines, expand on tap

---

#### 5. **Dashboard** (`pages/Dashboard.tsx`)
**Purpose:** User hub for bookings, logbook, profile management

**Mobile Layout (Tabbed):**
```
Tabs: [Bookings] [Logbook] [Schedule] [Profile]
      └─ Swipeable on mobile

BOOKINGS TAB:
├─ Upcoming lessons (cards, soonest first)
│  ├─ Instructor name + photo
│  ├─ Date/time + location
│  ├─ Status badge
│  └─ Actions: [Reschedule] [View Details]
└─ Past lessons (collapsed)

LOGBOOK TAB:
├─ Hours summary (stat tile)
│  ├─ Total hours: "48 hours"
│  ├─ Lessons: "14 lessons"
│  └─ Bonus: "8 hours applied"
└─ Logbook entries (vertical list)
   ├─ Date + instructor
   ├─ Duration + hours credited
   └─ Lesson type badge

SCHEDULE TAB (Instructors only):
├─ Weekly calendar view
├─ Availability editor
└─ Package manager

PROFILE TAB:
├─ User info
├─ Documents (if instructor)
└─ Settings
```

**Mobile Considerations:**
- Tabs: Bottom tab bar (sticky) on mobile
- Cards: Full width with safe padding
- Modals: Full-height slide-up from bottom
- Actions: Touch-friendly (min 48px tap target)

---

#### 6. **BookingModal** (`components/BookingModal.tsx`)
**Purpose:** Create/edit booking inline

**Mobile Implementation:**
```
Full-height modal (slide-up from bottom)
├─ Header: "Book a lesson" + close (X)
├─ Instructor preview (photo, name, rate)
├─ Date picker (calendar or date input)
├─ Time picker (slot buttons or time input)
├─ Duration selector (30 min, 60 min, 90 min buttons)
├─ Pickup address input (with map preview)
├─ Price summary
│  ├─ Rate × duration
│  └─ Total: "$80"
└─ CTA: "Proceed to checkout"
```

**Mobile UX:**
- Modal: Full viewport height, bottom-up
- Date picker: Native mobile date input (better UX)
- Time slots: Grid of buttons (each 44px+ tap target)
- Address field: Expandable with map preview below
- Floating footer: Sticky CTA at bottom

---

#### 7. **RescheduleModal** (`components/RescheduleModal.tsx`)
**Purpose:** Change booking date/time

**Mobile Flow:**
```
1. Select new date (calendar picker)
2. Select new time (slot buttons)
3. Review changes
4. Confirm
```

**Similar to BookingModal but:**
- Shows original booking details for comparison
- "Reschedule" CTA instead of "Book"
- Optional cancellation reason if user chooses to cancel instead

---

#### 8. **Checkout** (`pages/Checkout.tsx`)
**Purpose:** Stripe payment for bookings

**Mobile Layout:**
```
┌─────────────────────────┐
│ Booking Summary         │
│ Instructor: Amelia      │
│ Date: Sat, 15 Aug 2pm   │
│ Duration: 60 minutes    │
│ Total: $80.00           │
├─────────────────────────┤
│ Stripe Card Form        │
│ [Card number field]     │
│ [Exp] [CVC]            │
│ [Billing zip]          │
├─────────────────────────┤
│ [Complete Payment]      │
└─────────────────────────┘
```

**Mobile Features:**
- Stripe Elements: Mobile-responsive form
- Summary card: Clear pricing breakdown
- Full-width button
- Error handling: Toast notifications

---

#### 9. **Login & Signup** (`pages/Login.tsx`, `pages/Signup.tsx`)
**Purpose:** Authentication flows

**Mobile Auth Flow:**
```
LOGIN:
├─ Email input (type="email", autocomplete)
├─ Password input (type="password")
├─ "Sign in" button
└─ Link: "Don't have an account? Sign up"

SIGNUP:
├─ Email input
├─ Password input (with strength indicator)
├─ Full name input
├─ Role selector
│  ├─ [Learner]
│  └─ [Instructor]
├─ Terms checkbox
└─ "Create account" button
```

**Mobile UX:**
- Full viewport height
- Form inputs: 44px+ tap targets
- Email keyboard (autocomplete enabled)
- Password visible toggle icon
- Links: Easy to tap

---

#### 10. **InstructorOnboarding** (`pages/InstructorOnboarding.tsx`)
**Purpose:** Multi-step instructor signup

**Mobile Stepper:**
```
Progress: ●━━○○ Step 1/4

Step 1: Profile Information
├─ Full name
├─ Phone
├─ Bio (textarea)
├─ Profile photo upload
└─ [Next]

Step 2: Vehicle Details
├─ Vehicle model
├─ Year
├─ Transmission (radio)
├─ Vehicle photo upload
└─ [Next]

Step 3: Packages
├─ Add package form
│  ├─ Name
│  ├─ Type (dropdown)
│  ├─ Price
│  ├─ Duration
│  └─ Features (checkboxes)
└─ [Next]

Step 4: Availability
├─ Weekly schedule editor
├─ Day selector (Sun–Sat)
├─ Time range inputs
└─ [Save & Continue]
```

**Mobile Implementation:**
- Steps: Linear flow (no skipping)
- Progress bar: Visual indicator of completion
- Full-width inputs
- Touch-friendly toggles/radio buttons
- Submit on final step

---

#### 11. **InstructorVerification** (`pages/InstructorVerification.tsx`)
**Purpose:** Compliance document uploads

**Mobile Document Upload:**
```
Verification Status: ⏳ Pending Review

Required Documents:
├─ DI Licence
│  ├─ Upload button
│  └─ Status: ⏳ Under review
├─ WWCC (Working with Children Check)
│  ├─ Upload button
│  └─ Status: ✅ Approved
├─ Vehicle Registration
│  ├─ Upload button
│  └─ Status: ❌ Expired (Re-upload)
└─ ID Verification
   ├─ Upload button
   └─ Status: ✅ Verified

Actions:
├─ [Upload Document] (per item)
└─ [Save & Submit]
```

**Mobile Features:**
- File upload: Native file picker
- Document preview: Thumbnail or open in new tab
- Status badges: Color-coded (pending, approved, expired)
- Large touch buttons

---

#### 12. **AdminDashboard** (`pages/AdminDashboard.tsx`)
**Purpose:** Admin control panel (tickets, users, audit logs)

**Mobile Admin Layout:**
```
Tabs: [Tickets] [Users] [Audit Log]

TICKETS TAB:
├─ Filter: Status (all, open, in progress, resolved)
├─ Search: By user/subject
└─ Ticket list
   ├─ Category badge
   ├─ Subject
   ├─ User name + email
   ├─ Status
   └─ [Expand for details]

TICKET DETAIL (Modal):
├─ Subject + category
├─ User info
├─ Messages thread
├─ Admin notes (textarea)
├─ Status selector (dropdown)
└─ [Save]

USERS TAB:
├─ Filter: Role, verification status
├─ User list (cards or table)
└─ Actions: [View Profile] [Suspend] [Verify]

AUDIT LOG:
├─ Activity feed (reverse chronological)
├─ Filter: Action type, date range
└─ Entry details:
   ├─ Timestamp
   ├─ Actor (admin name)
   ├─ Action (e.g., "booking_created")
   └─ Details JSON
```

**Mobile Considerations:**
- Tablets favored (wider for tables)
- Modals for details
- Swipeable list actions
- Color-coded status badges

---

## Reusable UI Components

### Card Components

#### **InstructorCard**
Displays instructor summary in grid/list.

**Mobile Version:**
```
┌─────────────────────┐
│ [Photo - full width]│
├─────────────────────┤
│ Name                │
│ ★ 4.8 (42 reviews)  │
│ $80/hour            │
├─────────────────────┤
│ • Manual, Auto      │
│ • Suburbs: Bondi... │
├─────────────────────┤
│ [View Profile]      │
└─────────────────────┘
```

**Responsive:**
- Mobile: 1 column, full width
- Tablet: 2 columns
- Desktop: 3+ columns

---

#### **LogbookCard**
Single lesson entry.

**Mobile:**
```
┌───────────────────────────┐
│ 15 Aug 2024, 2:00–3:00 PM │
│ Instructor: Amelia        │
│ Duration: 60 min          │
│ Hours credited: 1.0       │
│ Status: Completed ✅      │
└───────────────────────────┘
```

---

### Modal & Dialog Components

#### **BookingModal / RescheduleModal**
- Full-height on mobile
- Slide-up animation
- Close: X button (top right) or back swipe
- Safe area padding

---

### Form Components

#### **AvailabilityEditor**
Week view for instructors.

**Mobile:**
```
Sun | Mon | Tue | Wed | Thu | Fri | Sat
─────────────────────────────────────
[08-12] [08-17] [OFF] [09-12] ...

Tap day to edit:
└─ Start time: [09:00]
└─ End time: [17:00]
└─ Active: [toggle]
```

---

#### **Date & Time Pickers**
- **Date:** Native `<input type="date">` (mobile-optimized)
- **Time:** Native `<input type="time">` or custom slot buttons
- Fallback to text inputs if needed

---

### Status & Info Components

#### **Badges & Chips**
```typescript
.sd-chip               /* Default: paper-2 bg */
.sd-chip-cobalt        /* Blue accent */
.sd-chip-signal        /* Yellow warning */
.sd-chip-lime          /* Green success */
.sd-chip-ink           /* Dark ink */

Usage:
├─ Status: "Confirmed" (chip-cobalt)
├─ Warning: "Unverified" (chip-signal)
├─ Success: "Completed" (chip-lime)
└─ Category: "Billing" (chip-ink)
```

---

#### **Stat Tiles**
Display key metrics on Dashboard/Admin.

```
┌───────────────────┐
│ 48 hours          │ ← Large number
│ Total hours       │ ← Label
└───────────────────┘

Or stacked:
┌─────────┬─────────┐
│ 48 hrs  │ 14 🎓  │
│ Total   │ Lessons │
└─────────┴─────────┘
```

---

### Navigation & Menus

#### **Tab Navigation (Mobile)**
```
Sticky footer tabs:
┌──────────────────────────────────┐
│ [🏠 Home] [🔍 Search] [👤 Profile] │
└──────────────────────────────────┘

Or horizontal scroll tabs (Dashboard):
[Bookings⟵scroll→] [Logbook] [Schedule]
```

---

#### **Dropdown / Select Menus**
- Native `<select>` on mobile (respects OS styling)
- Custom select for complex options

---

## Mobile Navigation Flow

### User Journeys

#### **Learner Flow:**
```
1. Home (/):
   Enter postcode → Search

2. SearchResults (/search):
   Browse instructors → Tap card

3. InstructorProfile (/instructor/:id):
   Review details → [Book]

4. BookingModal → Checkout (/checkout):
   Stripe payment

5. Dashboard (/dashboard):
   View bookings + logbook

6. During lesson:
   GPS telemetry recording (in-app)
```

#### **Instructor Flow:**
```
1. Home (/teach):
   Landing page

2. Signup (/signup):
   Choose instructor role

3. InstructorOnboarding (/instructor-onboarding):
   4-step form

4. InstructorVerification (/verify):
   Upload docs

5. Dashboard (/dashboard):
   Manage availability + packages

6. After booking:
   Lesson delivery + marks complete
```

#### **Admin Flow:**
```
1. Login (/login)

2. AdminDashboard (/admin):
   Manage tickets + audit log

3. Ticket detail:
   Review + update status

4. User verification:
   Approve/reject instructors
```

---

## Responsive Design Patterns

### Mobile-First Grid System

**1-Column Layout (Mobile)**
```tsx
<div className="grid grid-cols-1 gap-4">
  {/* Each item: 100% width */}
</div>
```

**2-Column Layout (Tablet)**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Mobile: 1 col; Tablet: 2 cols */}
</div>
```

**3-Column Layout (Desktop)**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1; Tablet: 2; Desktop: 3 */}
</div>
```

---

### Flexible Spacing

**Padding Adjustments:**
```css
/* Mobile: Smaller padding */
padding: 16px;

/* Tablet: Medium padding */
md:padding: 24px;

/* Desktop: Large padding */
lg:padding: 32px;
```

**Margin Utilities:**
```tsx
/* Margin between sections */
<section className="my-4 md:my-6 lg:my-8" />

/* Gap between items */
<div className="flex gap-2 md:gap-4 lg:gap-6" />
```

---

### Image Optimization

**Responsive Images:**
```tsx
<img 
  src="image.jpg" 
  alt="Description"
  style={{ 
    width: '100%',      // Full width
    maxWidth: '100%',   // Prevent overflow
    height: 'auto',     // Maintain aspect ratio
    objectFit: 'cover'  // Cover container
  }} 
/>
```

**Picture Element (srcset):**
```tsx
<picture>
  <source media="(max-width: 640px)" srcSet="image-sm.jpg" />
  <source media="(max-width: 1024px)" srcSet="image-md.jpg" />
  <img src="image-lg.jpg" alt="Description" />
</picture>
```

---

### Touch-Friendly Targets

**Mobile Button Sizing:**
```css
/* Minimum tap target: 44×44px (iOS) */
.sd-btn {
  padding: 12px 18px;          /* ~44px height */
  min-width: 44px;
  min-height: 44px;
}

/* Large CTA buttons */
.sd-btn-lg {
  padding: 16px 26px;          /* ~48px height */
}

/* On mobile, increase padding */
@media (max-width: 640px) {
  .sd-btn {
    width: 100%;               /* Full width for easy tapping */
    padding: 14px 20px;
  }
}
```

**Touchable Text Links:**
```css
/* Min 44px tap target */
a {
  padding: 8px;                /* Invisible padding */
  display: inline-block;
}
```

---

### Safe Area & Notch Handling

**iOS Notch Safe Area:**
```css
/* Sticky header safe area */
.sd-navbar {
  padding-top: max(16px, env(safe-area-inset-top));
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
}

/* Sticky footer above home indicator */
.sd-footer-nav {
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}
```

---

## Performance Optimization (Mobile)

### Code Splitting & Lazy Loading

**Route-based code splitting:**
```tsx
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const InstructorProfile = lazy(() => import('./pages/InstructorProfile'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

**Benefits:**
- Initial bundle: Only core + Home
- Dashboard bundle: Loaded on-demand
- Faster mobile load times

---

### Memoization & Re-render Optimization

**Component Memoization:**
```tsx
export const InstructorCard = memo(({ instructor, onBook }) => {
  return (
    <div className="sd-card">
      {/* Prevents re-render if props unchanged */}
    </div>
  );
});
```

**Hook Dependencies:**
```tsx
const handleSearch = useCallback((postcode) => {
  // Only recreates if dependencies change
  navigate(`/search?postcode=${postcode}`);
}, [navigate]);
```

---

### Image Optimization

**Responsive Image Sizes:**
```tsx
<img 
  src="instructor.jpg"
  srcSet="
    instructor-200.jpg 200w,
    instructor-400.jpg 400w,
    instructor-800.jpg 800w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  alt="Instructor"
/>
```

---

### Bundle Analysis

**Lighthouse Mobile Audit:**
- Target: FCP < 1.8s (First Contentful Paint)
- Target: LCP < 2.5s (Largest Contentful Paint)
- Target: CLS < 0.1 (Cumulative Layout Shift)

**Monitor via:**
```bash
npm run build  # Check dist/ size
# Use: web.dev/tools/lighthouse
```

---

## Accessibility (Mobile)

### Touch Accessibility

**Button Sizing:**
- Minimum 44×44px touch target
- Spacing between targets: 8px+ (avoid accidental taps)

**Color Contrast:**
- Text on background: 4.5:1 ratio (WCAG AA)
- Large text: 3:1 ratio
- Used tools: Color blindness simulator

**Semantic HTML:**
```tsx
<button onClick={handleBook}>
  Book a lesson
</button>

<a href="/search">
  Search
</a>

<input 
  type="email" 
  placeholder="your@email.com"
  aria-label="Email address"
/>
```

### Mobile Screen Reader Support

**ARIA Labels:**
```tsx
<button 
  aria-label="Open navigation menu"
  onClick={toggleMenu}
>
  ☰
</button>

<span 
  role="status" 
  aria-live="polite"
  aria-label="Booking confirmed"
>
  ✅ Booking confirmed
</span>
```

---

## Common Mobile Issues & Solutions

| Issue | Cause | Mobile Fix |
|-------|-------|-----------|
| Inputs zoom to 16px | Font < 16px | Use `font-size: 16px` on inputs |
| Viewport jank | Layout shifts | Add `contain: layout` to fixed elements |
| Slow scroll | Expensive re-renders | Use `will-change: transform` on scroll items |
| Date picker not appearing | Hidden behind keyboard | Use `position: fixed; z-index: 1000` |
| Tap delays | No touch-action | Add `touch-action: manipulation` to buttons |
| Pinch zoom unresponsive | Viewport config | `<meta name="viewport" content="...width=device-width...">` |

---

## Testing Mobile UI

### Viewport Emulation
```bash
# Browser DevTools:
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Select device (iPhone 14, Pixel 6, iPad, etc.)
4. Test orientation changes
5. Throttle network (Fast 3G, Slow 4G)
```

### Real Device Testing
```bash
# localhost on mobile
1. npm run dev  # Start local server
2. Note local IP (e.g., 192.168.1.10)
3. Open: http://192.168.1.10:5173 on phone
4. Test on actual network conditions
```

### Performance Metrics
```javascript
// In console, measure Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getFCP(console.log);  // First Contentful Paint
getLCP(console.log);  // Largest Contentful Paint
getTTFB(console.log); // Time to First Byte
```

---

## Best Practices Summary

### ✅ DO
- Use mobile-first CSS (default mobile, then `md:`, `lg:` overrides)
- Test on real devices (not just browser emulation)
- Use native inputs for date/time (respects OS)
- Min 44×44px touch targets
- Full-width CTAs on mobile
- Sticky navigation/footer for quick access
- Lazy load images & routes
- Throttle CSS animations on low-end devices

### ❌ DON'T
- Assume desktop UX works on mobile
- Use hover states as primary interaction
- Set fixed widths (use max-width + flex)
- Require pinch-zoom
- Auto-play media
- Excessive animations (janky on 60 fps)
- Hide important content on mobile

---

## Deployment Checklist

Before shipping to production:

- [ ] Test on iPhone 12/14 (Safari)
- [ ] Test on Android (Chrome)
- [ ] Run Lighthouse mobile audit
- [ ] Check responsive images load correctly
- [ ] Verify touch target sizes (DevTools)
- [ ] Test on slow 3G network
- [ ] Confirm form inputs work (autocomplete enabled)
- [ ] Check keyboard navigation (Tab key works)
- [ ] Verify modal stacking (z-index layer order)
- [ ] Test with screen reader (VoiceOver/TalkBack)
- [ ] Validate color contrast ratios
- [ ] Check for layout shifts (CLS < 0.1)

---

## File Reference

### Component Files
```
src/components/
├── Navbar.tsx                (97 lines)  — Sticky header
├── BookingModal.tsx          (150 lines) — Booking form
├── RescheduleModal.tsx       (118 lines) — Reschedule UI
├── InstructorCard.tsx        (112 lines) — Instructor summary
├── AvailabilityEditor.tsx    (110 lines) — Schedule editor
├── SupportPanel.tsx          (144 lines) — Support tickets
├── LessonTracker.tsx         (61 lines)  — Progress display
├── LogbookCard.tsx           (55 lines)  — Lesson entry
├── RouteMap.tsx              (72 lines)  — GPS visualization
├── Icon.tsx                  (84 lines)  — Icon system
└── ProtectedRoute.tsx        (34 lines)  — Auth guard
```

### Page Files
```
src/pages/
├── Home.tsx                  (20 KB)  — Landing page
├── SearchResults.tsx         (18 KB)  — Instructor search
├── InstructorProfile.tsx     (33 KB)  — Profile + reviews
├── Dashboard.tsx             (40 KB)  — User hub (largest)
├── BookingModal.tsx          (Reusable component)
├── Checkout.tsx              (4 KB)   — Stripe payment
├── Login.tsx                 (6 KB)   — Sign in
├── Signup.tsx                (8 KB)   — Register
├── InstructorOnboarding.tsx  (15 KB)  — Multi-step signup
├── InstructorVerification.tsx (15 KB) — Doc upload
└── AdminDashboard.tsx        (33 KB)  — Admin controls
```

### Styling
```
src/
├── index.css                 (12 KB)  — Global Tailwind + utilities
├── App.css                   (607 bytes) — Component styles
```

---

## Summary

SkillDrive's **mobile-first frontend** provides:

✅ **Responsive Design**: Works seamlessly on phones → tablets → desktops  
✅ **Touch-Optimized**: 44×44px buttons, full-width CTAs, gesture support  
✅ **Performance**: Lazy loading, code splitting, optimized images  
✅ **Accessibility**: ARIA labels, color contrast, semantic HTML  
✅ **Modern UX**: Modals, animations, live search, status tracking  
✅ **Consistent Design**: Unified color palette, typography, spacing system  

This architecture makes it easy to:
- Add new mobile features
- Optimize for different screen sizes
- Maintain accessibility standards
- Monitor performance metrics
- Scale the component library

