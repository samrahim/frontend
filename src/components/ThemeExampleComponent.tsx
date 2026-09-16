import React from 'react';
import { Box, Button, Text, useThemeUI } from 'theme-ui';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Example component demonstrating how to use theme-ui
 * 
 * This shows:
 * - Using theme-ui components (Box, Button, Text)
 * - Using the useThemeUI hook to access the current theme
 * - Using the useTheme hook to toggle dark/light mode
 * - Using theme scale values (colors, space, radii, etc.)
 */
export const ThemeExampleComponent: React.FC = () => {
    const { theme } = useThemeUI();
    const { isDark, toggleTheme } = useTheme();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bg: 'background',
                color: 'text',
            }}
        >
            <Box
                sx={{
                    textAlign: 'center',
                    p: 5,
                    borderRadius: 'lg',
                    bg: isDark ? 'gray.800' : 'muted',
                    boxShadow: 'md',
                    maxWidth: '600px',
                    width: '90%',
                }}
            >
                <Text
                    as="h1"
                    sx={{
                        fontSize: 5,
                        fontWeight: 'heading',
                        mb: 3,
                    }}
                >
                    Design System Demo
                </Text>

                <Text
                    sx={{
                        fontSize: 2,
                        mb: 4,
                        color: isDark ? 'gray.300' : 'gray.600',
                    }}
                >
                    Welcome to the theme-ui powered design system!
                    {isDark ? ' (Dark Mode)' : ' (Light Mode)'}
                </Text>

                {/* Button Examples */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: ['1fr', '1fr 1fr'],
                        gap: 3,
                        mb: 4,
                    }}
                >
                    <Button
                        sx={{
                            bg: 'primary',
                            color: 'white',
                            px: 4,
                            py: 2,
                            borderRadius: 'base',
                            cursor: 'pointer',
                            '&:hover': {
                                bg: 'primaryDark',
                                boxShadow: 'md',
                            },
                        }}
                    >
                        Primary Button
                    </Button>

                    <Button
                        sx={{
                            bg: 'success',
                            color: 'white',
                            px: 4,
                            py: 2,
                            borderRadius: 'base',
                            cursor: 'pointer',
                            '&:hover': {
                                bg: 'successDark',
                                boxShadow: 'md',
                            },
                        }}
                    >
                        Success Button
                    </Button>

                    <Button
                        sx={{
                            bg: 'danger',
                            color: 'white',
                            px: 4,
                            py: 2,
                            borderRadius: 'base',
                            cursor: 'pointer',
                            '&:hover': {
                                bg: 'dangerDark',
                                boxShadow: 'md',
                            },
                        }}
                    >
                        Danger Button
                    </Button>

                    <Button
                        sx={{
                            bg: 'muted',
                            color: 'text',
                            px: 4,
                            py: 2,
                            borderRadius: 'base',
                            border: '1px solid',
                            borderColor: 'border',
                            cursor: 'pointer',
                            '&:hover': {
                                bg: isDark ? 'gray.700' : 'gray.200',
                            },
                        }}
                    >
                        Secondary Button
                    </Button>
                </Box>

                {/* Color Palette */}
                <Box
                    sx={{
                        mb: 4,
                        textAlign: 'left',
                    }}
                >
                    <Text as="h3" sx={{ fontSize: 2, mb: 2, fontWeight: 'heading' }}>
                        Color Palette:
                    </Text>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                            gap: 2,
                        }}
                    >
                        {[
                            { name: 'Primary', colorKey: 'primary' },
                            { name: 'Success', colorKey: 'success' },
                            { name: 'Danger', colorKey: 'danger' },
                            { name: 'Info', colorKey: 'info' },
                            { name: 'Warning', colorKey: 'warning' },
                        ].map((item) => (
                            <Box key={item.name}>
                                <Box
                                    sx={{
                                        height: '60px',
                                        bg: item.colorKey as any,
                                        borderRadius: 'md',
                                        mb: 2,
                                        boxShadow: 'sm',
                                    }}
                                />
                                <Text sx={{ fontSize: 0, fontWeight: 'bold' }}>
                                    {item.name}
                                </Text>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Theme Toggle */}
                <Button
                    onClick={toggleTheme}
                    sx={{
                        bg: 'info',
                        color: 'white',
                        px: 5,
                        py: 2,
                        borderRadius: 'base',
                        fontSize: 1,
                        fontWeight: 'heading',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bg: 'infoDark',
                            boxShadow: 'md',
                        },
                    }}
                >
                    Toggle {isDark ? 'Light' : 'Dark'} Mode
                </Button>

                {/* Theme Info */}
                <Box
                    sx={{
                        mt: 4,
                        p: 2,
                        bg: isDark ? 'gray.700' : 'gray.100',
                        borderRadius: 'md',
                        fontSize: 0,
                        fontFamily: 'mono',
                    }}
                >
                    <Text sx={{ color: 'text', mb: 1 }}>
                        Current theme: {isDark ? 'dark' : 'light'}
                    </Text>
                    <Text sx={{ color: 'text' }}>
                        Space scale index: {theme?.space?.length || 'N/A'} values
                    </Text>
                </Box>
            </Box>
        </Box>
    );
};

export default ThemeExampleComponent;
