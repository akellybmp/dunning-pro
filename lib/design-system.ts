/**
 * DunningPro Design System
 * 
 * A comprehensive design system for the DunningPro application,
 * providing consistent colors, typography, spacing, and component styles.
 */

export const designSystem = {
  colors: {
    // Brand colors - Primary green theme
    brand: {
      50: '#f0f9f4',
      100: '#dcf2e3',
      200: '#bce5cc',
      300: '#8dd1a8',
      400: '#71AF81', // Primary brand color
      500: '#4ade80',
      600: '#22c55e',
      700: '#16a34a',
      800: '#15803d',
      900: '#166534',
    },
    
    // Neutral grays - Professional and clean
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    
    // Status colors - Clear feedback
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  shadows: {
    soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    strong: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
  },
  
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
  },
  
  animations: {
    fadeIn: 'fadeIn 0.5s ease-in-out',
    slideUp: 'slideUp 0.3s ease-out',
    scaleIn: 'scaleIn 0.2s ease-out',
  },
} as const;

/**
 * Component-specific design tokens
 */
export const components = {
  card: {
    base: 'bg-white rounded-xl shadow-soft border border-gray-200',
    hover: 'hover:shadow-medium transition-all duration-200',
  },
  
  button: {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    danger: 'bg-error-500 text-white hover:bg-error-600 focus:ring-2 focus:ring-error-500 focus:ring-offset-2',
  },
  
  input: {
    base: 'block w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500',
    error: 'border-error-300 focus:border-error-500 focus:ring-error-500',
  },
  
  badge: {
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    info: 'bg-brand-100 text-brand-800',
  },
  
  table: {
    header: 'bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider',
    row: 'hover:bg-gray-50 transition-colors duration-150',
    cell: 'px-6 py-4 whitespace-nowrap text-sm',
  },
} as const;

/**
 * Accessibility guidelines and utilities
 */
export const accessibility = {
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
  screenReaderOnly: 'sr-only',
  highContrast: {
    text: 'text-gray-900',
    muted: 'text-gray-600',
    subtle: 'text-gray-500',
  },
} as const;

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export default designSystem;
