import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Switch } from "./switch";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Labeled on/off toggle backed by a native checkbox, used for rule enable/disable. Keyboard-operable (Space/Tab) and announced as a switch to screen readers via role=\"switch\".",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

function Controlled({ initial = true, disabled = false }: { initial?: boolean; disabled?: boolean }) {
  const [checked, setChecked] = useState(initial);
  return <Switch checked={checked} onCheckedChange={setChecked} disabled={disabled} aria-label="Toggle rule" />;
}

export const On: Story = {
  render: () => <Controlled initial={true} />,
};

export const Off: Story = {
  render: () => <Controlled initial={false} />,
};

export const DisabledOn: Story = {
  render: () => <Controlled initial={true} disabled />,
};

export const DisabledOff: Story = {
  render: () => <Controlled initial={false} disabled />,
};

export const DarkMode: Story = {
  parameters: {
    themes: {
      default: "dark",
    },
  },
  render: () => <Controlled initial={true} />,
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => <Controlled initial={true} />,
};
