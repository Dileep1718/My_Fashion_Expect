/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // MY Outfit (Mo) — Design DNA Palette
        obsidian: '#0B0B0B',      // Primary backgrounds
        cream: '#FFFDD0',          // Surface, text on dark
        silver: '#E2E2E2',         // Borders, dividers
        mist: '#F5F5F0',           // Secondary surface
        charcoal: '#1A1A1A',       // Secondary backgrounds, modals
        accent: '#C4A882',         // CTA buttons, active states
        blush: '#E03E3E',          // Errors
        sage: '#4CAF78',           // Success
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        cabinet: ['CabinetGrotesk', 'sans-serif'],
      },
      fontSize: {
        display: ['36px', { lineHeight: '1.1', fontWeight: '800' }],
        h1: ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['22px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '1.35', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        label: ['11px', { lineHeight: '1.2', fontWeight: '600' }],
      },
      borderRadius: {
        'bento-sm': '16px',
        'bento-lg': '24px',
      },
      spacing: {
        // Bento 2.0 Grid Tokens
        'margin': '24px',
        'gutter': '16px',
        'module': '8px',
      },
    },
  },
  plugins: [],
};
