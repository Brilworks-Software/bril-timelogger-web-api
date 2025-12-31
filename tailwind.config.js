/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: ['text-text-dark'],
  theme: {
    extend: {
      colors: {
        'text-light': '#FFFFFF',
        'text-dark': '#2C3E50',
        'navy': {
          DEFAULT: '#0A1929', // Dark Navy/Black
          50: '#1A1A1A',
          100: '#2C3E50', // Dark Gray/Charcoal
          200: '#333333',
        },
        'blue': {
          DEFAULT: '#0080FF', // Bright Blue
          50: '#EBF5FF', // Light Blue/Cyan
          100: '#E3F2FD',
          200: '#BBDEFB',
          300: '#90CAF9',
          400: '#64B5F6',
          500: '#0080FF',
          600: '#007BFF',
          700: '#0066CC',
          800: '#0052A3',
          900: '#003D7A',
        },
        primary: {
          DEFAULT: '#0080FF', // Bright Blue
          50: '#EBF5FF', // Light Blue/Cyan
          100: '#E3F2FD',
          200: '#BBDEFB',
          300: '#90CAF9',
          400: '#64B5F6',
          500: '#0080FF',
          600: '#007BFF',
          700: '#0066CC',
          800: '#0052A3',
          900: '#003D7A',
        },
        secondary: {
          DEFAULT: '#4A90E2', // Book Icon Blue
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#4A90E2',
          500: '#3A7BC2',
          600: '#2E6BA8',
          700: '#235A8E',
          800: '#1A4974',
          900: '#11385A',
        },
        success: {
          DEFAULT: '#4CAF50', // Green
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#388E3C',
          700: '#2E7D32',
          800: '#1B5E20',
          900: '#0D4F14',
        },
        danger: {
          DEFAULT: '#E91E63', // Red/Pink
          50: '#FCE4EC',
          100: '#F8BBD0',
          200: '#F48FB1',
          300: '#F06292',
          400: '#EC407A',
          500: '#E91E63',
          600: '#C2185B',
          700: '#AD1457',
          800: '#880E4F',
          900: '#4A148C',
        },
        warning: {
          DEFAULT: '#FFC107', // Yellow
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFC107',
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#F57C00',
        },
        orange: {
          DEFAULT: '#FF9800',
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        gray: {
          50: '#FAFAFA', // Light Gray
          100: '#F5F5F5',
          200: '#EBF5FF', // Light Blue/Cyan
          300: '#E3F2FD',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#2C3E50', // Dark Gray/Charcoal
          900: '#1A1A1A', // Dark Navy/Black
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'system-ui', 'sans-serif'],
      },
      spacing: {
        sidebar: '20%',
      },
      transitionDuration: {
        200: '200ms',
        300: '300ms',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [],
};
