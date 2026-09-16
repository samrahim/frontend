# Theme-UI Migration Checklist

**Track your progress migrating components to theme-ui.**

## Pre-Migration Setup

- [ ] theme-ui and dependencies installed
- [ ] `src/theme/theme.ts` created
- [ ] `src/contexts/ThemeContext.tsx` created
- [ ] `src/styles/globalStyles.ts` created
- [ ] `src/utils/styleUtils.ts` created
- [ ] `Global` styles imported in `main.tsx`
- [ ] `ThemeProvider` wraps app in `App.tsx`
- [ ] Documentation files created (THEME_UI_GUIDE.md, etc.)

## Migration Phases

### Phase 1: Layout Components

These components set up the page structure and should be updated first:

- [ ] AppLayout / MainLayout
  - [ ] Replace CSS classes with `sx` props
  - [ ] Update sidebar/header styling
  - [ ] Test responsive layout
- [ ] PageHeader
  - [ ] Use `Box` + `Text` components
  - [ ] Replace background colors with theme colors
- [ ] PageFooter
  - [ ] Apply theme spacing and colors
- [ ] Navigation / Sidebar
  - [ ] Use theme colors and spacing
  - [ ] Add dark mode support
- [ ] Breadcrumbs
  - [ ] Use theme spacing and colors

### Phase 2: Form Components

These handle user input and benefit from consistent styling:

- [ ] Form component
  - [ ] Use theme spacing (`gap`, `p`)
  - [ ] Apply global input styles
- [ ] Input fields
  - [ ] Apply theme border colors
  - [ ] Use theme spacing
  - [ ] Add focus states from global styles
- [ ] Select/Dropdown
  - [ ] Theme colors and borders
- [ ] Checkbox/Radio
  - [ ] Theme colors
- [ ] Form labels
  - [ ] Use theme typography
- [ ] Form validation messages
  - [ ] Use `danger` color for errors
  - [ ] Use `warning` for warnings

### Phase 3: Data Display Components

These show information to users:

- [ ] Table/DataTable
  - [ ] Use theme colors for headers
  - [ ] Apply theme spacing
  - [ ] Use theme shadows for subtle borders
- [ ] Card
  - [ ] Use theme `p`, `borderRadius`, `boxShadow`
  - [ ] Apply background colors
- [ ] List components
  - [ ] Use theme spacing (`gap`)
  - [ ] Color-coded items
- [ ] Badge/Chip
  - [ ] Use semantic colors (success/danger/info)
- [ ] Avatar
  - [ ] Consistent sizing using theme scale

### Phase 4: Modals & Overlays

These need careful styling for accessibility:

- [ ] Modal/Dialog
  - [ ] Use `.modal-overlay` and `.modal-content` from global styles
  - [ ] Apply theme spacing and colors
  - [ ] Verify z-index placement
- [ ] Dropdown Menu
  - [ ] Use theme `boxShadow`
  - [ ] Correct z-index
- [ ] Tooltip
  - [ ] Theme colors and fonts
- [ ] Notification/Alert
  - [ ] Use semantic colors (success/danger/warning/info)
- [ ] Confirmation Dialog
  - [ ] Use appropriate button colors (danger for destructive)

### Phase 5: Button Components

Critical for user interactions:

- [ ] Primary Button
  - [ ] Apply theme `bg: 'primary'`
  - [ ] Add hover states from theme
- [ ] Secondary Button
  - [ ] Use `bg: 'muted'`
  - [ ] Gray borders from theme
- [ ] Danger Button
  - [ ] Use `bg: 'danger'`
  - [ ] Appropriate hover/active states
- [ ] Success Button (Enroll, Save)
  - [ ] Use `bg: 'success'`
- [ ] Icon Button
  - [ ] Consistent sizing
  - [ ] Proper hover states
- [ ] Button Group
  - [ ] Theme spacing between buttons

### Phase 6: Advanced Components

Complex, feature-rich components:

- [ ] Search/Filter
  - [ ] Input styling from global
  - [ ] Button styling from theme
  - [ ] Proper spacing
- [ ] Pagination
  - [ ] Button styling
  - [ ] Page number styling
- [ ] Breadcrumbs
  - [ ] Color-coded separators
- [ ] Stepper/Progress
  - [ ] Theme colors for states
- [ ] Loading Spinner
  - [ ] Use `primary` color
- [ ] Empty State
  - [ ] Theme typography and spacing
- [ ] Error Boundary
  - [ ] Use theme colors and spacing

### Phase 7: Page Components

Specific pages that tie everything together:

- [ ] Dashboard Page
  - [ ] Grid layout using `gridLayout()` utility
  - [ ] Cards with theme styling
  - [ ] Typography from theme
- [ ] List Page (Students, Teachers, etc.)
  - [ ] Table with theme colors
  - [ ] Filter/search bar styling
  - [ ] Button styling
- [ ] Detail Page
  - [ ] Responsive layout
  - [ ] Form styling
  - [ ] Action buttons
- [ ] Create/Edit Page
  - [ ] Form layout with theme spacing
  - [ ] Input styling
  - [ ] Submit/Cancel buttons

### Phase 8: Dark Mode Support

Add dark mode awareness:

- [ ] Verify all colors work in dark mode
  - [ ] Text color changes
  - [ ] Background contracts
  - [ ] Border visibility
- [ ] Add `useTheme()` hook where needed
  - [ ] Components with conditional styling
- [ ] Test theme toggle
  - [ ] Light → Dark → Light
  - [ ] Persistence across page refresh
- [ ] Add dark mode toggle UI
  - [ ] Header or settings menu

### Phase 9: CSS Module Migration

Move from CSS modules to theme-ui:

**Identify CSS Files:**

```bash
find src -name "*.module.css" -o -name "*.css" | grep -v node_modules
```

For each CSS file:

- [ ] Document what the CSS does
- [ ] Port styles to `sx` props
- [ ] Delete CSS file
- [ ] Update component imports

**Common CSS Patterns to Convert:**

| CSS                    | Theme-UI                         |
| ---------------------- | -------------------------------- |
| `padding: 16px`        | `sx={{ p: 4 }}`                  |
| `margin: 8px`          | `sx={{ m: 2 }}`                  |
| `gap: 16px`            | `sx={{ gap: 4 }}`                |
| `color: #3b82f6`       | `sx={{ color: 'primary' }}`      |
| `background: #fff`     | `sx={{ bg: 'background' }}`      |
| `border-radius: 8px`   | `sx={{ borderRadius: 'md' }}`    |
| `box-shadow: ...`      | `sx={{ boxShadow: 'md' }}`       |
| `transition: all 0.2s` | `sx={{ transition: 'default' }}` |
| Flex layout            | `sx={flexLayout(gap, dir)}`      |
| Grid layout            | `sx={gridLayout(minWidth)}`      |

### Phase 10: Testing & QA

Verify everything looks correct:

- [ ] Visual regression testing
  - [ ] Compare before/after screenshots
- [ ] Responsive design
  - [ ] Mobile (< 640px)
  - [ ] Tablet (640px - 1024px)
  - [ ] Desktop (> 1024px)
- [ ] Dark mode testing
  - [ ] All colors readable
  - [ ] Proper contrast
- [ ] Accessibility
  - [ ] Focus states visible
  - [ ] Button hover states clear
  - [ ] Links underlined or colored
- [ ] Cross-browser
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari

## Quick Reference: Migration Examples

### Example 1: Button Component

**Before (CSS Module):**

```typescript
import styles from './Button.module.css'

export const Button = ({ label, onClick, variant = 'primary' }) => (
  <button className={styles[variant]} onClick={onClick}>
    {label}
  </button>
)
```

```css
/* Button.module.css */
.primary {
  padding: 10px 16px;
  background-color: #3b82f6;
  color: white;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary:hover {
  background-color: #2563eb;
}
```

**After (Theme-UI):**

```typescript
import { Button } from 'theme-ui'

export const MyButton = ({ label, onClick, variant = 'primary' }) => (
  <Button
    onClick={onClick}
    sx={{
      bg: variant,
      color: 'white',
      px: 4,
      py: 2,
      borderRadius: 'base',
      transition: 'default',
      '&:hover': {
        bg: '#2563eb',
      },
    }}
  >
    {label}
  </Button>
)
```

### Example 2: Card Component

**Before (CSS):**

```typescript
import './Card.css'

export const Card = ({ children }) => (
  <div className="card">{children}</div>
)
```

```css
.card {
  padding: 24px;
  border-radius: 12px;
  background-color: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

**After (Theme-UI):**

```typescript
import { Box } from 'theme-ui'

export const Card = ({ children }) => (
  <Box
    sx={{
      p: 6,
      borderRadius: 'lg',
      bg: 'background',
      border: '1px solid',
      borderColor: 'border',
      boxShadow: 'sm',
    }}
  >
    {children}
  </Box>
)
```

### Example 3: Responsive Layout

**Before (CSS Media Queries):**

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
```

**After (Theme-UI):**

```typescript
<Box
  sx={{
    display: 'grid',
    gridTemplateColumns: ['1fr', '1fr 1fr', '1fr 1fr 1fr'],
    gap: 4,
  }}
>
  {/* Items */}
</Box>
```

### Example 4: Dark Mode Support

**Before (Manual dark class):**

```javascript
body.classList.add("dark-mode");
```

```css
body.dark-mode {
  background-color: #111827;
  color: #f3f4f6;
}

body.dark-mode .card {
  background-color: #1f2937;
}
```

**After (Theme Context):**

```typescript
const { isDark } = useTheme()

<Box
  sx={{
    bg: isDark ? 'gray.900' : 'white',
    color: isDark ? 'gray.100' : 'text',
  }}
/>
```

## Component Prioritization

Priority order for better impact:

**High Priority** (Used in many places):

1. Button (5-10 variants)
2. Input/Form fields
3. Layout/Container
4. Colors (brand consistency)

**Medium Priority** (Important but fewer instances): 5. Modal/Dialog 6. Card 7. Table 8. Badge/Tag

**Low Priority** (Nice to have): 9. Animations 10. Micro-interactions 11. Edge cases

## Common Issues & Solutions

### Issue: Colors not changing in dark mode

**Solution:** Use `useTheme()` hook to check `isDark`, then apply conditional colors

### Issue: Global styles override component styles

**Solution:** Add `&&` hack in specific component styles, or increase specificity

### Issue: Responsive arrays not working

**Solution:** Arrays are mobile-first; ensure correct order: `[mobile, tablet, desktop]`

### Issue: Components require both layout and color changes

**Solution:** Break into two parts: layout via `sx` props, colors via `useTheme()`

## Performance Considerations

- [ ] Memoize components with heavy `sx` object rebuilds
- [ ] Move `sx` objects outside component if static
- [ ] Use `useMemo` for computed `sx` values
- [ ] Avoid creating new objects in render

```typescript
// BAD: New object on every render
<Box sx={{ p: 4, gap: 2, ... }} />

// GOOD: Compute once
const boxStyles = useMemo(() => ({ p: 4, gap: 2, ... }), [])
<Box sx={boxStyles} />
```

## Resources

- [THEME_UI_SETUP.md](./THEME_UI_SETUP.md) - Initial setup guide
- [THEME_UI_GUIDE.md](./THEME_UI_GUIDE.md) - Full documentation
- [THEME_UI_QUICK_REFERENCE.md](./THEME_UI_QUICK_REFERENCE.md) - Quick reference card
- [Example Component](./src/components/ThemeExampleComponent.tsx) - Live demo

---

**Print this checklist and track progress as you migrate components!**

**Estimated Time:** 2-4 weeks depending on component count and complexity
