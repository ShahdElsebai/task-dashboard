import { definePreset } from '@openng/optimus-ui-themes';
import Aura from '@openng/optimus-ui-themes/aura';

/**
 * App theme preset built on top of Optimus UI's Aura preset.
 *
 * Colors come from the Task Manager design. Overriding them here means every
 * Optimus component and the Tailwind `primary-*` / `surface-*` utilities share
 * one palette. Priority/status colors live in `src/assets/tailwind.css`.
 */
export const AppThemePreset = definePreset(Aura, {
  primitive: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
      950: '#082a5e',
    },
    /** Neutral greys: page background, borders, body and muted text. */
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
      950: '#121212',
    },
  },
  semantic: {
    primary: {
      50: '{brand.50}',
      100: '{brand.100}',
      200: '{brand.200}',
      300: '{brand.300}',
      400: '{brand.400}',
      500: '{brand.500}',
      600: '{brand.600}',
      700: '{brand.700}',
      800: '{brand.800}',
      900: '{brand.900}',
      950: '{brand.950}',
    },
    colorScheme: {
      light: {
        surface: {
          0: '{neutral.0}',
          50: '{neutral.50}',
          100: '{neutral.100}',
          200: '{neutral.200}',
          300: '{neutral.300}',
          400: '{neutral.400}',
          500: '{neutral.500}',
          600: '{neutral.600}',
          700: '{neutral.700}',
          800: '{neutral.800}',
          900: '{neutral.900}',
          950: '{neutral.950}',
        },
        // The design's blue is the 700 shade (#1976d2), hover is 800 (#1565c0).
        primary: {
          color: '{brand.700}',
          contrastColor: '#ffffff',
          hoverColor: '{brand.800}',
          activeColor: '{brand.900}',
        },
        highlight: {
          background: '{brand.50}',
          focusBackground: '{brand.100}',
          color: '{brand.700}',
          focusColor: '{brand.800}',
        },
      },
      // Not in the design; a lighter blue keeps contrast on dark surfaces.
      dark: {
        surface: {
          0: '#ffffff',
          50: '{neutral.50}',
          100: '{neutral.100}',
          200: '{neutral.200}',
          300: '{neutral.300}',
          400: '{neutral.400}',
          500: '{neutral.500}',
          600: '{neutral.600}',
          700: '{neutral.700}',
          800: '{neutral.800}',
          900: '{neutral.900}',
          950: '{neutral.950}',
        },
        primary: {
          color: '{brand.400}',
          contrastColor: '{neutral.950}',
          hoverColor: '{brand.300}',
          activeColor: '{brand.200}',
        },
      },
    },
  },
});
