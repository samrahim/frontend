# Theme-UI Quick Reference Card

**Quick lookup for common theme-ui patterns and values.**

## Import Examples

```typescript
// Components
import { Box, Button, Text, Grid, Flex } from "theme-ui";

// Hooks
import { useThemeUI } from "theme-ui";
import { useTheme } from "../contexts/ThemeContext";

// Global styles
import { Global } from "@emotion/react";
import { globalStyles } from "./styles/globalStyles";

// Utilities
import { flexLayout, gridLayout, media } from "../utils/styleUtils";
```

## Component Usage

### Box (Generic Container)

```typescript
<Box sx={{ p: 4, bg: 'background', color: 'text' }} />
```

### Button

```typescript
<Button
  onClick={handleClick}
  sx={{
    bg: 'primary',
    color: 'white',
    px: 4, py: 2,
    borderRadius: 'base',
    '&:hover': { bg: '#2563eb' },
  }}
>
  Click
</Button>
```

### Text / Typography

```typescript
<Text as="h1" sx={{ fontSize: 5, fontWeight: 'heading' }}>Heading</Text>
<Text as="p" sx={{ fontSize: 2, lineHeight: 'body' }}>Paragraph</Text>
```

### Grid (Responsive)

```typescript
<Grid
  sx={{
    gridTemplateColumns: ['1fr', '1fr 1fr', '1fr 1fr 1fr'],
    gap: 4,
  }}
>
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</Grid>
```

### Flex (Flexbox)

```typescript
<Flex sx={{ flexDirection: 'column', gap: 2, alignItems: 'center' }}>
  {/* Flex items */}
</Flex>
```

## Theme Values

### Colors

| Category       | Value        | Hex       |
| -------------- | ------------ | --------- |
| **Primary**    | `primary`    | #3b82f6   |
| **Success**    | `success`    | #10b981   |
| **Danger**     | `danger`     | #ef4444   |
| **Info**       | `info`       | #9c27b0   |
| **Warning**    | `warning`    | #f59e0b   |
| **Text**       | `text`       | #111827   |
| **Background** | `background` | #ffffff   |
| **Border**     | `border`     | #e5e7eb   |
| **Muted**      | `muted`      | #f3f4f6   |
| **Gray**       | `gray.0-900` | Grayscale |

### Spacing (px values)

| Scale | Value |
| ----- | ----- |
| 0     | 0px   |
| 1     | 4px   |
| 2     | 8px   |
| 3     | 12px  |
| 4     | 16px  |
| 5     | 20px  |
| 6     | 24px  |
| 7     | 32px  |
| 8     | 40px  |
| 9+    | 48px+ |

**Usage:** `sx={{ p: 4 }}` = `padding: 16px`

### Font Sizes (px)

| Scale | Value |
| ----- | ----- |
| 0     | 12px  |
| 1     | 14px  |
| 2     | 16px  |
| 3     | 18px  |
| 4     | 20px  |
| 5     | 24px  |
| 6     | 28px  |
| 7     | 32px  |

**Usage:** `sx={{ fontSize: 2 }}` = `font-size: 16px`

### Border Radius

```
none=0     sm=4px    base=6px    md=8px    lg=12px    xl=16px    full=9999px
```

### Shadows

```
sm  √  base  √  md  √  lg  √  xl  √
```

### Z-Index

| Name     | Value |
| -------- | ----- |
| hide     | -1    |
| base     | 0     |
| dropdown | 100   |
| sticky   | 500   |
| modal    | 1000  |
| tooltip  | 1100  |

## Common Patterns

### Button Variants

```typescript
// Primary
<Button sx={{ bg: 'primary', color: 'white' }}>
  Primary Button
</Button>

// Success (Green)
<Button sx={{ bg: 'success', color: 'white' }}>
  Success Button
</Button>

// Danger (Red)
<Button sx={{ bg: 'danger', color: 'white' }}>
  Danger Button
</Button>

// Secondary (Gray)
<Button sx={{ bg: 'muted', color: 'text', border: '1px solid', borderColor: 'border' }}>
  Secondary Button
</Button>
```

### Card/Container

```typescript
<Box
  sx={{
    p: 4,
    borderRadius: 'lg',
    border: '1px solid',
    borderColor: 'border',
    bg: 'background',
    boxShadow: 'md',
  }}
>
  Content
</Box>
```

### Modal Overlay

```typescript
<Box
  sx={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    bg: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 'modal',
  }}
>
  <Box sx={{ bg: 'background', p: 5, borderRadius: 'lg' }}>
    Modal content
  </Box>
</Box>
```

### Responsive Layout

```typescript
// Main content + sidebar
<Box sx={{ display: 'grid', gridTemplateColumns: ['1fr', '1fr', '3fr 1fr'], gap: 4 }}>
  <Box>{/* Main */}</Box>
  <Box>{/* Sidebar */}</Box>
</Box>

// Using utility
<Box sx={gridLayout(300)}>
  {/* Auto-fit grid with 300px min-width */}
</Box>
```

### Dark Mode Aware

```typescript
const { isDark } = useTheme()

<Box sx={{ bg: isDark ? 'gray.900' : 'white' }}>
  Content that adapts to theme
</Box>
```

### Hover States

```typescript
<Box
  sx={{
    p: 3,
    borderRadius: 'md',
    transition: 'all 0.2s ease',
    '&:hover': {
      bg: 'primary',
      color: 'white',
      boxShadow: 'lg',
      transform: 'translateY(-2px)',
    },
  }}
>
  Hover me!
</Box>
```

### Flex with Gap

```typescript
// Column layout
<Flex sx={{ flexDirection: 'column', gap: 2 }}>
  {items}
</Flex>

// Or using utility
<Box sx={flexLayout(16, 'column')}>
  {items}
</Box>
```

### Input/Form Field

```typescript
<input
  type="text"
  placeholder="Enter text..."
  style={{
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '16px',
    fontFamily: 'inherit',
  }}
/>
```

## Pseudo-classses

```typescript
sx={{
  bg: 'primary',
  // Hover
  '&:hover': { bg: 'primaryDark', boxShadow: 'lg' },
  // Active/Pressed
  '&:active': { transform: 'scale(0.98)' },
  // Focus
  '&:focus': { outline: 'none', boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)' },
  // Disabled
  '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
  // First child
  '&:first-child': { mt: 0 },
}}
```

## Media Queries

```typescript
// Array syntax (mobile-first)
sx={{ fontSize: [1, 2, 3] }}  // Mobile: 14px, Tablet: 16px, Desktop: 18px
sx={{ gridTemplateColumns: ['1fr', '1fr 1fr', '1fr 1fr 1fr'] }}

// Using media utility
import { media } from '../utils/styleUtils'
sx={{
  fontSize: 2,
  [media.mobile]: { fontSize: 1 },
  [media.desktop]: { fontSize: 3 },
}}
```

## Frequently Used Elements

### Heading

```typescript
<Text as="h1" sx={{ fontSize: 5, fontWeight: 'heading', mb: 3 }}>
  Page Title
</Text>
```

### List

```typescript
<ul style={{ listStyle: 'none', padding: 0 }}>
  {items.map(item => (
    <li key={item.id} style={{ mb: 2 }}>
      {item.name}
    </li>
  ))}
</ul>
```

### Link

```typescript
<a href="/page" style={{ color: 'primary', textDecoration: 'none' }}>
  Link
</a>
```

### Table

```typescript
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
  <thead style={{ bg: 'muted' }}>
    <tr>
      <th style={{ p: 2, textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
        Header
      </th>
    </tr>
  </thead>
</table>
```

## Tips & Tricks

### ✅ DO:

- Use theme scale values: `sx={{ p: 4, gap: 2 }}`
- Use semantic colors: `sx={{ color: 'success', bg: 'background' }}`
- Mobile-first responsive: `sx={{ fontSize: [1, 2, 3] }}`
- Reuse utilities: `sx={flexLayout(16, 'column')}`

### ❌ DON'T:

- Hardcoded values: `sx={{ padding: '16px', gap: '8px' }}`
- Hex colors directly: `sx={{ color: '#3b82f6' }}`
- Skip ThemeProvider: Must wrap app at root level
- Forget Global styles: Import in main.tsx

## Full Setup

```typescript
// main.tsx
import { Global } from '@emotion/react'
import { globalStyles } from './styles/globalStyles'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Global styles={globalStyles} />
  <App />
)

// App.tsx
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      {/* Your app */}
    </ThemeProvider>
  )
}
```

---

**Save this card for quick reference while building components!**
