import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  "stories": [
    "../components/**/*.mdx",
    "../components/**/*.stories.@(ts|tsx)",
    "../app/**/*.stories.@(ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": ["../public"]
};
export default config;