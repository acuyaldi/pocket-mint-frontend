import * as React from "react";
import type { Decorator, Preview } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "../app/globals.css";

/**
 * Minimal deterministic providers matching app/layout.tsx's real provider
 * order, without any live network, auth, or Supabase dependency.
 */
const WithProviders: Decorator = (Story) => {
  const [queryClient] = React.useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );

  return (
    <NextIntlClientProvider locale="id" messages={{}}>
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
};

/** Toggles the `.dark` ancestor class the app's Tailwind `dark:` variant relies on. */
const WithTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === "dark" ? "dark" : "";
  return (
    <div
      className={theme}
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' surfaces violations in the Storybook a11y panel without failing CI.
      test: "todo",
    },
    backgrounds: {
      options: {
        light: { name: "Light", value: "#f9f9f8" },
        dark: { name: "Dark", value: "#0f172a" },
      },
    },
  },
  initialGlobals: {
    backgrounds: { value: "light" },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Pocket Mint color scheme",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [WithProviders, WithTheme],
};

export default preview;
