"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Pencil, LogOut } from "lucide-react";
import { useLogout } from "@/components/LogoutProvider";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LanguageMenuItems } from "@/components/layout/language-switcher";

// Shared between the desktop sidebar and mobile bottom nav so the account
// menu never drifts between the two surfaces.
export function AccountMenuItems() {
  const t = useTranslations("nav");
  const { handleLogout } = useLogout();

  return (
    <>
      <DropdownMenuItem render={<Link href="/profile" />}>
        <Pencil className="text-muted-foreground" />
        {t("editProfile")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <LanguageMenuItems />
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="text-destructive" />
        {t("logout")}
      </DropdownMenuItem>
    </>
  );
}
