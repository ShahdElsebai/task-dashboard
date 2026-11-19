import { definePreset } from '@openng/optimus-ui-themes';
import avatar from '@openng/optimus-ui-themes/aura/avatar';
import base from '@openng/optimus-ui-themes/aura/base';
import button from '@openng/optimus-ui-themes/aura/button';
import confirmdialog from '@openng/optimus-ui-themes/aura/confirmdialog';
import auraCss from '@openng/optimus-ui-themes/aura/css';
import datepicker from '@openng/optimus-ui-themes/aura/datepicker';
import dialog from '@openng/optimus-ui-themes/aura/dialog';
import drawer from '@openng/optimus-ui-themes/aura/drawer';
import iconfield from '@openng/optimus-ui-themes/aura/iconfield';
import inputtext from '@openng/optimus-ui-themes/aura/inputtext';
import menu from '@openng/optimus-ui-themes/aura/menu';
import ripple from '@openng/optimus-ui-themes/aura/ripple';
import select from '@openng/optimus-ui-themes/aura/select';
import selectbutton from '@openng/optimus-ui-themes/aura/selectbutton';
import skeleton from '@openng/optimus-ui-themes/aura/skeleton';
import textarea from '@openng/optimus-ui-themes/aura/textarea';
import toast from '@openng/optimus-ui-themes/aura/toast';
import togglebutton from '@openng/optimus-ui-themes/aura/togglebutton';
import { Preset } from '@openng/optimus-ui-themes/types';

/**
 * Aura with only the components this app uses.
 *
 * The full Aura preset bundles design tokens for ~80 components (datatable, galleria, treetable …)
 * into the initial chunk, about 130 kB. Listing the used ones keeps the same look for a fraction
 * of the size. A component added later needs its tokens added here, or it renders unstyled.
 * `togglebutton` is listed because `selectbutton` is built from it.
 */
const AURA_CSS: string = String(auraCss);

const SlimAura: Preset = {
  ...base,
  components: {
    avatar,
    button,
    confirmdialog,
    datepicker,
    dialog,
    drawer,
    iconfield,
    inputtext,
    menu,
    ripple,
    select,
    selectbutton,
    skeleton,
    textarea,
    toast,
    togglebutton,
  },
  css: AURA_CSS,
};

export const AppThemePreset: Preset = definePreset(SlimAura, {
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
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#6b6b6b',
      600: '#5f5f5f',
      700: '#4a4a4a',
      800: '#424242',
      900: '#212121',
      950: '#121212',
    },
  },
  semantic: {
    focusRing: { width: '2px', style: 'solid', color: '{primary.color}', offset: '2px' },
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
