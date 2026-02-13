# PR Summary: Homepage Visual Refresh & Mobile Optimization

This Pull Request introduces a comprehensive visual refresh for the homepage, with a strong focus on mobile responsiveness, accessibility, and a premium aesthetic update.

## 📝 Detailed Stylesheet & Component Changes

### 1. Homepage Layout & Structure (`page.tsx`)
- **Responsive Grid System**:
  - Implemented a `Grid2` layout that dynamically adapts between mobile and desktop.
  - **Mobile**: Stacks Content in a specific order: Public Games (Top) -> Play Mode (Middle) -> News (Bottom).
  - **Desktop**: Maintains a 3-column horizontal layout.
- **Footer Disclaimer**:
  - **Mobile**: Changed positioning from `absolute` to `relative` with a `4rem` top margin to prevent overlapping content.
  - **Typography**: Increased disclaimer font size from `0.75rem` to `1.4rem` for mobile readability.

### 2. Navigation & Control Hub (`ControlHub.tsx`)
- **Hamburger Menu Overhaul**:
  - **Visuals**: Updated `drawerPaper` with a glassmorphic dark background (`rgba(15, 15, 15, 0.85)`), blur effect, and a refined width of `230px`.
  - **Branding**: Added a bold "KARABAST" header in **Gold (#FFD700)** with a glow effect inside the drawer.
  - **Navigation Items**:
    - Replaced plain text links with `ListItemIcon` + `ListItemText` layout.
    - Added specific icons for all routes (Decks, Preferences, Terms, Moderators, etc.).
    - Implemented a smooth slide-right hover animation with gold accents.
  - **Typography**: Updated font sizes and weights for menu links to be more legible.

### 3. Banner & Branding (`Banner.tsx`)
- **Typography Scaling**:
  - **Title**: Massive increase in "KARABAST" font size to `5.5rem` (mobile) and `4.5rem` (desktop).
  - **Subtitles**: Increased secondary text size to `2.2rem` (mobile) / `1.6rem` (desktop) for better hierarchy.
- **Layout**: Adjusted container margins to accommodate the larger text footprint.

### 4. Game Modes & Interactions (`HomePagePlayMode.tsx`)
- **Mobile Optimization**:
  - **Padding**: Removed top padding (`pt: 0`) from the main card wrapper on mobile to align tabs flush with the container edge.
- **Visuals**: Applied new `black` card variant styling.

### 5. Games Lists & Lobbies
- **Public Games (`PublicGames.tsx` & `JoinableGame.tsx`)**:
  - **Card Styling**: Added padding, rounded corners (`0.5rem`), and a bottom border to lobby items.
  - **Typography**: Increased font sizes for Match Type (`1.6em`), Tags, and "Join" button.
  - **Visuals**: Added a transition effect on hover and a custom gradient divider.
  - **Card Previews**: Increased the size of card previews in lobby list items (`clamp(4.5rem, 15vw, 10rem)`).
- **Games in Progress (`GamesInProgress.tsx` & `PublicMatch.tsx`)**:
  - **Typography**: Increased header and game count font sizes.
  - **List Items**: Added padding, borders, and hover transitions to match lines.

### 6. News Section (`News.tsx` & `NewsItem.tsx`)
- **Layout**: Simplified news image styling for a cleaner look.
- **Styling**: Added a gold gradient divider between title and content.
- **Typography**: Increased Title (`1.9rem`) and Date font sizes on mobile.

### 7. Form Elements (`QuickGameForm.tsx` & `CreateGameForm.tsx`)
- **Accessibility**: Significantly increased font sizes for all input fields (`StyledTextField`), Dropdowns (`Select`), and Menu Items (`MenuItem`) to `1.5rem` on mobile.
  - *Note: This prevents iOS from auto-zooming when focusing an input.*

### 8. Global Theme Updates (`theme.ts`)
- **New Card Variant**: Added `black` variant to `MuiCard` components with consistent backdrop blur and border styling.
- **Breakpoints**: Added `desktopHD` and mobile-specific breakpoints.
- **Global Overrides**:
  - `MuiButton`: Added custom hover transition.
  - `MuiOutlinedInput`: Increased default font sizes.
  - `.news-content`: Added global styles for HTML-parsed news content for better readability.
