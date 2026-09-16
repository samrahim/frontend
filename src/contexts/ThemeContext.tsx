import { useColorMode as useThemeUIColorMode } from 'theme-ui'

/**
 * Custom hook that wraps theme-ui's useColorMode hook
 * Provides easy access to color mode and toggle function
 * 
 * Color mode is automatically persisted to localStorage by theme-ui
 * and respects system preferences (prefers-color-scheme)
 */
export const useColorMode = () => {
    const [colorMode, setColorMode] = useThemeUIColorMode()

    const isDark = colorMode === 'dark'
    const toggleColorMode = () => {
        setColorMode(isDark ? 'light' : 'dark')
    }

    return {
        colorMode,
        setColorMode,
        isDark,
        toggleColorMode,
    }
}
