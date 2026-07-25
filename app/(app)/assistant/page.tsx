"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Foundation-only placeholder (Phase 23.1). Chat, conversation UI, drafts,
 * and clarification screens are built in a later phase.
 */
export default function AssistantPage() {
  const t = useTranslations("assistant");

  return (
    <>
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
      <p role="status" className="text-sm text-muted-foreground">
        {t("underDevelopment")}
      </p>
    </>
  );
}
