import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: '@storybook/react-vite',
  viteFinal: async (config) => {
    config.css = {
      ...config.css,
      postcss: {
        plugins: [(await import('@tailwindcss/postcss')).default],
      },
    }
    return config
  },
}

export default config
