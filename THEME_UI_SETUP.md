# Quick Setup Checklist

This guide walks you through integrating the theme-ui setup into your React app.

## Installation Status

- ✅ `theme-ui` installed
- ✅ `@emotion/react` and `@emotion/styled` installed
- ✅ All theme files created

## Integration Steps

### 1. Update `src/main.tsx`

Add global styles at the very top:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Global } from '@emotion/react'
import { globalStyles } from './styles/globalStyles'
import App from './App.tsx'
import './index.css' // Your existing styles (if any)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Global styles={globalStyles} />
    <App />
  </React.StrictMode>,
)
```

### 2. Update `src/App.tsx`

Wrap your app with ThemeProvider:

```typescript
import { ThemeProvider } from './contexts/ThemeContext'
import YourMainComponent from './pages/YourMainComponent'

function App() {
  return (
    <ThemeProvider>
      <YourMainComponent />
    </ThemeProvider>
  )
}

export default App
```

### 3. (Optional) View the Demo

To see the theme in action, temporarily add the example component:

```typescript
import ThemeExampleComponent from './components/ThemeExampleComponent'

function App() {
  return (
    <ThemeProvider>
      <ThemeExampleComponent />
    </ThemeProvider>
  )
}
```

Then remove it once you're satisfied with the setup.

### 4. Start Using Theme-UI

#### In your components:

```typescript
import { Box, Button, Text } from 'theme-ui'
import { useTheme } from '../contexts/ThemeContext'

export const MyComponent = () => {
  const { isDark, toggleTheme } = useTheme()

  return (
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
      <Text as="h1">Welcome</Text>
      <Button onClick={toggleTheme}>
        Toggle {isDark ? 'Light' : 'Dark'} Mode
      </Button>
    </Box>
  )
}
```

## File Structure

```
frontend/
├── src/
│   ├── theme/
│   │   └── theme.ts              # Design system definition
│   ├── contexts/
│   │   └── ThemeContext.tsx       # Theme provider & hook
│   ├── styles/
│   │   └── globalStyles.ts        # Base CSS for HTML elements
│   ├── utils/
│   │   └── styleUtils.ts          # Helper functions
│   ├── components/
│   │   └── ThemeExampleComponent.tsx  # Demo component
│   ├── main.tsx                   # Apply global styles here
│   └── App.tsx                    # Wrap with ThemeProvider
├── THEME_UI_GUIDE.md             # Full documentation
└── THEME_UI_SETUP.md             # This file
```

## Common Patterns

### Button Example

```typescript
<Button
  onClick={() => alert('Clicked!')}
  sx={{
    bg: 'primary',
    color: 'white',
    px: 4,
    py: 2,
    borderRadius: 'base',
    transition: 'default',
    '&:hover': {
      bg: '#2563eb',
      boxShadow: 'md',
    },
  }}
>
  Click Me
</Button>
```

### Responsive Grid

```typescript
<Box
  sx={{
    display: 'grid',
    gridTemplateColumns: ['1fr', '1fr 1fr', '1fr 1fr 1fr'],
    gap: 4,
  }}
>
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</Box>
```

### Dark Mode Aware

```typescript
import { useTheme } from '../contexts/ThemeContext'

const Component = () => {
  const { isDark } = useTheme()

  return (
    <Box
      sx={{
        bg: isDark ? 'gray.900' : 'white',
        color: isDark ? 'gray.100' : 'text',
      }}
    />
  )
}
```

## Theme Values Reference

### Colors

- `primary`, `success`, `danger`, `info`, `warning`
- `text`, `background`, `border`, `muted`, `subtle`
- Grayscale: `gray.0` through `gray.900`

### Spacing (0-13)

- `0`, `1`, `2`, `3`, `4` (16px), `5`, `6`, `7`, `8`, etc.

### Font Sizes (0-9)

- `0`: 12px
- `1`: 14px
- `2`: 16px
- `3`: 18px
- `4`: 20px
- `5`: 24px
- etc.

### Border Radius

- `none`, `sm`, `base`, `md`, `lg`, `xl`, `full`

### Shadows

- `sm`, `base`, `md`, `lg`, `xl`

### Z-Index

- `hide` (-1), `base` (0), `dropdown` (100), `sticky` (500), `modal` (1000), `tooltip` (1100)

## Customization

### Adding Custom Colors

Edit `src/theme/theme.ts`:

```typescript
const colors = {
  // ... existing colors
  customColor: "#your-hex-code",
};
```

Then use:

```typescript
sx={{ color: 'customColor', bg: 'customColor' }}
```

### Extending Theme Values

Edit the theme object in `src/theme/theme.ts`:

```typescript
const customBreakpoints = ["640px", "768px", "1024px", "1280px"];

export const lightTheme = {
  // ... existing
  breakpoints: customBreakpoints,
};
```

### Modifying Global Styles

Edit `src/styles/globalStyles.ts` to change:

- Default font sizes, colors, spacing
- Button, input, link appearance
- Modal, table styles
- Mobile breakpoints

## Next Steps

1. ✅ Install theme-ui (done)
2. ✅ Create theme files (done)
3. **TODO:** Integrate ThemeProvider in App.tsx
4. **TODO:** Add global styles in main.tsx
5. **TODO:** Replace existing CSS with theme-ui `sx` props
6. **TODO:** Update components to use `useTheme` hook for dark mode
7. **TODO:** Customize colors/spacing as needed

## Troubleshooting

### Theme not applying?

- Check that ThemeProvider wraps your entire app
- Ensure global styles are imported in main.tsx
- Check browser DevTools for CSS being applied

### Colors not working?

- Use lowercase theme color names: `primary` ✅, `PRIMARY` ❌
- Use `bg` not `backgroundColor`: `sx={{ bg: 'primary' }}` ✅

### Dark mode not working?

- Verify useTheme hook is imported from `./contexts/ThemeContext`
- Check localStorage value: `localStorage.getItem('theme-mode')`

### Performance issues?

- Avoid creating new objects in `sx` prop directly
- Use `useMemo` for complex sx objects
- Memoize components with theme-dependent styles

## Resources

- [Full Theme-UI Guide](./THEME_UI_GUIDE.md)
- [Theme-UI Docs](https://theme-ui.com/)
- [Emotion CSS-in-JS](https://emotion.sh/)
- [System-UI Theme Spec](https://system-ui.com/theme)

---

**Once you complete the setup, you're ready to build UI components with theme-ui!**
Start with the example component or check the guide for more patterns.
