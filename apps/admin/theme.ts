import { createSystem, defaultConfig, defineConfig, defineSlotRecipe } from "@chakra-ui/react"
import { switchAnatomy } from "@chakra-ui/react/anatomy"

// Custom switch recipe to fix RTL direction issue
const switchSlotRecipe = defineSlotRecipe({
  className: "chakra-switch",
  slots: switchAnatomy.keys(),
  base: {
    root: {
      // Force LTR direction on the switch root
      direction: "ltr",
    },
  },
})

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: "brand",
    },
    // Custom scrollbar styles for dark mode
    ".dark ::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    ".dark ::-webkit-scrollbar-track": {
      background: "#111827",
    },
    ".dark ::-webkit-scrollbar-thumb": {
      background: "#374151",
      borderRadius: "4px",
    },
    ".dark ::-webkit-scrollbar-thumb:hover": {
      background: "#4B5563",
    },
    // Dialogs are width:100% of the viewport, so on mobile they touch the
    // screen edges. Add side padding on the positioner - the backdrop still
    // covers the full screen, only the content is inset.
    ".chakra-dialog__positioner": {
      paddingInline: { base: "4", md: "0" },
    },
  },
  theme: {
    tokens: {
      fonts: {
        heading: { value: "Inter, system-ui, sans-serif" },
        body: { value: "Inter, system-ui, sans-serif" },
      },
      colors: {
        // Purcari wine burgundy — accent of the estate, not a template color
        brand: {
          50: { value: "#fdf3f4" },
          100: { value: "#f9e2e4" },
          200: { value: "#f2c3c8" },
          300: { value: "#e6959e" },
          400: { value: "#d55c6a" },
          500: { value: "#b13a48" },
          600: { value: "#992e3c" },
          700: { value: "#7d2532" },
          800: { value: "#66202a" },
          900: { value: "#541c24" },
          950: { value: "#2e0e12" },
        },
        // Dark mode specific colors from design
        dark: {
          bg: { value: "#111827" },
          surface: { value: "#1F2937" },
          border: { value: "#374151" },
          borderHover: { value: "#4B5563" },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Brand color semantic tokens
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "white" },
          fg: { value: { _light: "{colors.brand.700}", _dark: "{colors.brand.400}" } },
          muted: { value: { _light: "{colors.brand.100}", _dark: "rgba(59, 130, 246, 0.1)" } },
          subtle: { value: { _light: "{colors.brand.50}", _dark: "rgba(59, 130, 246, 0.1)" } },
          emphasized: { value: { _light: "{colors.brand.200}", _dark: "rgba(59, 130, 246, 0.2)" } },
          focusRing: { value: "{colors.brand.500}" },
        },
        // Background tokens - Dark mode: #111827 (dark-bg), #1F2937 (dark-surface)
        bg: {
          DEFAULT: { value: { _light: "#f5f7f8", _dark: "#111827" } },
          subtle: { value: { _light: "#f8fafc", _dark: "#1F2937" } },
          muted: { value: { _light: "#f1f5f9", _dark: "#374151" } },
          panel: { value: { _light: "white", _dark: "#1F2937" } },
          hover: { value: { _light: "#f1f5f9", _dark: "rgba(17, 24, 39, 0.5)" } },
        },
        // Border tokens - Dark mode: #374151 (dark-border)
        border: {
          DEFAULT: { value: { _light: "#e5e7eb", _dark: "#374151" } },
          muted: { value: { _light: "#f1f5f9", _dark: "#4B5563" } },
          hover: { value: { _light: "#d1d5db", _dark: "#4B5563" } },
        },
        // Foreground/text tokens - Dark mode: #F3F4F6 (text-main), #9CA3AF (text-muted)
        fg: {
          DEFAULT: { value: { _light: "#0d131c", _dark: "#F3F4F6" } },
          muted: { value: { _light: "#64748b", _dark: "#9CA3AF" } },
          subtle: { value: { _light: "#94a3b8", _dark: "#6B7280" } },
          inverted: { value: { _light: "white", _dark: "white" } },
        },
      },
    },
    slotRecipes: {
      switch: switchSlotRecipe,
    },
  },
})

export const system = createSystem(defaultConfig, config)
