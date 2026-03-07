import type { LucideIcon } from "lucide-react";
import { Bot, Code2, Sparkles } from "lucide-react";
import type { HookPlatform } from "@/types/hooks";

export interface HookPlatformOption {
  description: string;
  icon: LucideIcon;
  id: HookPlatform;
  title: string;
}

export const hookPlatformOptions: HookPlatformOption[] = [
  {
    id: "VSCode",
    title: "VS Code",
    description: "Registers a Galactic hook file in VS Code settings.",
    icon: Code2,
  },
  {
    id: "Claude",
    title: "Claude Code",
    description: "Installs a local Galactic plugin through the Claude CLI.",
    icon: Bot,
  },
  {
    id: "Cursor",
    title: "Cursor",
    description: "Prepares Galactic assets and leaves the final registration to you.",
    icon: Sparkles,
  },
];
