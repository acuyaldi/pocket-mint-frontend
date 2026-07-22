"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import {
  useCreateMerchantMapping,
  useDeleteMerchantMapping,
  useMerchantMappings,
  useUpdateMerchantMapping,
  type CreateMerchantMappingDto,
  type UpdateMerchantMappingDto,
} from "@/src/features/merchantMapping/hooks/useMerchantMappings";
import type { MerchantMappingDto } from "@/src/types/merchantMapping";
import { CreateMerchantMappingModal } from "./components/CreateMerchantMappingModal";
import { EditMerchantMappingModal } from "./components/EditMerchantMappingModal";
import { DeleteMerchantMappingModal } from "./components/DeleteMerchantMappingModal";
import { MerchantMappingRow } from "./components/MerchantMappingRow";

export default function MerchantMappingPage() {
  const t = useTranslations("merchantMappings");

  const [search, setSearch] = useState("");
  const { data: mappings = [], isLoading, isError } = useMerchantMappings(search);
  const { data: categories = [] } = useCategories();
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const createMapping = useCreateMerchantMapping();
  const updateMapping = useUpdateMerchantMapping();
  const deleteMapping = useDeleteMerchantMapping();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<MerchantMappingDto | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MerchantMappingDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = useCallback(
    async (dto: CreateMerchantMappingDto) => {
      setIsCreating(true);
      try {
        await createMapping.mutateAsync(dto);
        setIsCreateOpen(false);
        toast(t("toastCreated"));
      } finally {
        setIsCreating(false);
      }
    },
    [createMapping, t],
  );

  const handleUpdate = useCallback(
    async (dto: UpdateMerchantMappingDto) => {
      if (!editTarget) return;
      setIsUpdating(true);
      try {
        await updateMapping.mutateAsync({ id: editTarget.id, ...dto });
        setEditTarget(null);
        toast(t("toastUpdated"));
      } finally {
        setIsUpdating(false);
      }
    },
    [editTarget, updateMapping, t],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMapping.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast(t("toastDeleted"));
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? t("toastDeleteFailed"), "error");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, deleteMapping, t]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("addMapping")}
        </button>
      </div>

      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-1 focus:ring-primary"
          placeholder={t("searchPlaceholder")}
          type="text"
          aria-label={t("searchAria")}
        />
      </div>

      {isLoading ? (
        <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
          {t("loading")}
        </p>
      ) : isError ? (
        <p className="rounded-xl border border-coral/30 bg-coral/10 py-10 text-center text-sm text-coral">
          {t("loadError")}
        </p>
      ) : mappings.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? t("noSearchResults", { search }) : t("empty")}
          </p>
          {!search && <p className="text-xs text-muted-foreground">{t("emptyDescription")}</p>}
          {!search && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              {t("addMapping")}
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {mappings.map((mapping) => (
            <MerchantMappingRow
              key={mapping.id}
              mapping={mapping}
              categoryName={categoryNameById.get(mapping.categoryId) ?? "—"}
              editLabel={t("edit")}
              deleteLabel={t("delete")}
              editAriaLabel={t("editAria", { name: mapping.merchantName })}
              deleteAriaLabel={t("deleteAria", { name: mapping.merchantName })}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </ul>
      )}

      <CreateMerchantMappingModal
        key={isCreateOpen ? "create-open" : "create-closed"}
        isOpen={isCreateOpen}
        isSaving={isCreating}
        categories={categories}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <EditMerchantMappingModal
        key={editTarget?.id ?? "edit-closed"}
        isOpen={editTarget !== null}
        isSaving={isUpdating}
        mapping={editTarget}
        categories={categories}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
      />
      <DeleteMerchantMappingModal
        mapping={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
