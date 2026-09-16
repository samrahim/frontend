# Theme-UI Implementation Guide

## Overview

This project uses **theme-ui** for consistent styling and theming across the React application. The design system is organized with:

- **Color system**: Brand colors, semantic colors, and grayscale palette
- **Typography**: Font families, sizes, weights, and line heights
- **Spacing & Layout**: Consistent spacing scale and responsive layouts
- **Theme management**: Light/dark mode support with localStorage persistence

## Architecture

### 1. Theme Definition (`src/theme/theme.ts`)

Contains the complete design system:

```typescript
// Colors
colors: {
  success: '#10b981',
  danger: '#ef4444',
  primary: '#3b82f6',
  info: '#9c27b0',
  warning: '#f59e0b',
  // ... + grayscale palette
}

// Typography
fonts, fontSizes, fontWeights, lineHeights, letterSpacings

// Layout
space, sizes, radii, shadows, transitions, zIndices

// Component variants
buttons: { primary, success, danger, secondary }
```

### 2. Theme Provider (`src/contexts/ThemeContext.tsx`)

Provides theme context and theme switching functionality:

```typescript
export const useTheme = () => {
  const { isDark, toggleTheme } = useTheme();
  // Use in components for dark/light mode
};
```

### 3. Global Styles (`src/styles/globalStyles.ts`)

Base CSS for HTML elements (headings, buttons, inputs, modals, tables).

Import in `main.tsx` or `App.tsx`:

```typescript
import { Global } from '@emotion/react';
import { globalStyles } from './styles/globalStyles';

<Global styles={globalStyles} />
```

### 4. Style Utilities (`src/utils/styleUtils.ts`)

Helper functions for common styling patterns:

```typescript
getColor(theme, 'colors.primary')
flexLayout(gap, direction)
gridLayout(minWidth)
colorUtils
media breakpoints
spacingMap
```

## Usage Examples

### Using Theme-UI Components

```typescript
import { Box, Button, Text } from 'theme-ui';

export const MyComponent = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      p: 4,
      bg: 'background',
      color: 'text',
    }}
  >
    <Text as="h1" sx={{ fontSize: 5 }}>
      Heading
    </Text>

    <Button
      sx={{
        bg: 'primary',
        color: 'white',
        px: 4,
        py: 2,
      }}
    >
      Click me
    </Button>
  </Box>
);
```

### Theme Scale References

```typescript
// Colors (from theme.colors)
sx={{ color: 'primary', bg: 'background' }}

// Spacing (0-13, represents 0px to 80px)
sx={{ p: 4, gap: 2 }}  // padding: 16px, gap: 8px

// Font sizes (array index)
sx={{ fontSize: 2 }}   // 16px

// Border radius (from radii)
sx={{ borderRadius: 'md' }}  // 8px

// Box shadows
sx={{ boxShadow: 'md' }}

// Z-index
sx={{ zIndex: 'modal' }}   // 1000
```

### Using the useTheme Hook

```typescript
import { useTheme } from '../contexts/ThemeContext';
import { useThemeUI } from 'theme-ui';

export const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();
  const { theme } = useThemeUI();

  return (
    <button
      onClick={toggleTheme}
      style={{
        bg: isDark ? '#374151' : '#e5e7eb',
      }}
    >
      Switch to {isDark ? 'Light' : 'Dark'} Mode
    </button>
  );
};
```

### Responsive Styles

```typescript
import { flexLayout, gridLayout, media } from '../utils/styleUtils';

export const ResponsiveBox = () => (
  <Box
    sx={{
      ...gridLayout(300),  // Grid with 300px min-width items
      [media.mobile]: {
        gridTemplateColumns: '1fr',  // Single column on mobile
      },
    }}
  >
    {/* Children */}
  </Box>
);
```

### Creating Styled Components with CSS Injection

```typescript
import { css } from '@emotion/react';

const cardStyle = css`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 640px) {
    padding: 16px;
  }
`;

export const Card = () => <div css={cardStyle}>{/* ... */}</div>;
```

## Color Mapping

| Use Case               | Color                | Hex                   |
| ---------------------- | -------------------- | --------------------- |
| **Success/Enroll**     | `.success`           | `#10b981`             |
| **Danger/Stop/Delete** | `.danger`            | `#ef4444`             |
| **Primary CTA**        | `.primary`           | `#3b82f6`             |
| **Secondary Info**     | `.info`              | `#9c27b0`             |
| **Warnings**           | `.warning`           | `#f59e0b`             |
| **Text**               | `.text`              | `#111827`             |
| **Background**         | `.background`        | `#ffffff`             |
| **Borders**            | `.border`            | `#e5e7eb`             |
| **Subtle/Muted**       | `.muted` / `.subtle` | `#f3f4f6` / `#d1d5db` |

## Spacing Scale

```
0: 0px
1: 4px
2: 8px
3: 12px
4: 16px  (p: 4 = padding: 16px)
5: 20px
6: 24px
7: 32px
8: 40px
...
13: 80px
```

## Typography Scale

```
Font sizes (0-9):
- 0: 12px
- 1: 14px
- 2: 16px (body)
- 3: 18px
- 4: 20px
- 5: 24px
- 6: 28px
- 7: 32px (h1)
```

## Best Practices

1. **Always use theme scale values** instead of hardcoded values
   - ✅ `sx={{ p: 4, gap: 2 }}`
   - ❌ `sx={{ padding: '16px', gap: '8px' }}`

2. **Use semantic color names**
   - ✅ `sx={{ color: 'success', bg: 'background' }}`
   - ❌ `sx={{ color: '#10b981', bg: '#fff' }}`

3. **Prefer theme-ui components** (Box, Button, Text) for consistency
   - ✅ `<Box sx={{ ... }}>`
   - ❌ Custom divs with inline styles

4. **Responsive design with media queries**

   ```typescript
   sx={{
     fontSize: 2,
     [media.mobile]: { fontSize: 1 },
   }}
   ```

5. **Use CSS Modules or Emotion CSS** for complex component styles
   - Keeps styles scoped and reusable
   - Better IDE autocomplete

6. **Dark mode support**
   - Use `useTheme()` to check `isDark`
   - Conditional styling: `bg: isDark ? 'gray.900' : 'white'`

## Setup in App.tsx

```typescript
import { ThemeProvider } from './contexts/ThemeContext';
import { Global } from '@emotion/react';
import { globalStyles } from './styles/globalStyles';

function App() {
  return (
    <ThemeProvider>
      <Global styles={globalStyles} />
      {/* Rest of your app */}
    </ThemeProvider>
  );
}

export default App;
```

## Migration from CSS Files

### Before (Traditional CSS)

```css
/* styles.css */
.button {
  padding: 10px 16px;
  background-color: #3b82f6;
  color: white;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.button:hover {
  background-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}
```

```typescript
import './styles.css';
import { Button } from './styles.module.css';

<button className={Button}>Click</button>
```

### After (Theme-UI)

```typescript
<Button
  sx={{
    px: 4,
    py: 2,
    bg: 'primary',
    color: 'white',
    borderRadius: 'base',
    transition: 'default',
    '&:hover': {
      bg: '#2563eb',
      boxShadow: 'md',
    },
  }}
>
  Click
</Button>
```

## Adding New Colors

1. Add to `src/theme/theme.ts`:

```typescript
const colors = {
  // ... existing
  newColor: "#hexcode",
};
```

2. Use in components:

```typescript
sx={{ color: 'newColor' }}
```

## Component Patterns

### Button with Loading State

```typescript
<Button
  disabled={isLoading}
  sx={{
    bg: 'primary',
    opacity: isLoading ? 0.6 : 1,
    cursor: isLoading ? 'not-allowed' : 'pointer',
  }}
>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

### Card with Border

```typescript
<Box
  sx={{
    p: 4,
    borderRadius: 'lg',
    border: '1px solid',
    borderColor: 'border',
    bg: 'background',
    boxShadow: 'sm',
  }}
>
  {/* Content */}
</Box>
```

### Responsive Grid

```typescript
<Box
  sx={{
    display: 'grid',
    gridTemplateColumns: ['1fr', 'repeat(2, 1fr)', 'repeat(3, 1fr)'],
    gap: 4,
  }}
>
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</Box>
```

## Resources

- [Theme-UI Documentation](https://theme-ui.com/)
- [emotion CSS-in-JS](https://emotion.sh/)
- [System-UI Theme Specification](https://system-ui.com/theme)

## Troubleshooting

**Colors not applying?**

- Ensure ThemeProvider wraps your app
- Use lowercase theme color names: `primary`, not `PRIMARY`
- Check that you're using the `sx` prop on theme-ui components

**Dark mode not persisting?**

- Check browser localStorage for `theme-mode` key
- Ensure ThemeProvider is at app root

**Responsive styles not working?**

- Use array syntax: `sx={{ fontSize: [1, 2, 3] }}`
- Mobile first approach: smallest screen first

**Performance issues?**

- Avoid creating new object references in `sx` props
- Use `useMemo` for complex `sx` objects
- Prefer theme scale values over custom values
