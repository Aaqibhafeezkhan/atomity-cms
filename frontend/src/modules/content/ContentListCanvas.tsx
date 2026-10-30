"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, SearchX } from "lucide-react";
import { DataTable, type DataTableColumn, type DataTableSort } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { PostStatusChip } from "@/components/ui/StatusChip";
import { TypeChip } from "@/components/ui/TypeChip";
import { useAsync } from "@/hooks/useAsync";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDateTime, timeAgo } from "@/lib/format";
import { POST_STATUSES, type ContentTypeDefinition, type PostSortKey, type PostStatus, type PostSummary } from "@/types/post";
import { getContentTypes, listPosts } from "./api";
import { describeDestination, typeLabel } from "./form";

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<PostStatus, string> = { DRAFT: "Drafts", PUBLISHED: "Published", ARCHIVED: "Archived" };

export function ContentListCanvas() {
  const router = useRouter();

  const [type, setType] = useState("");
  const [status, setStatus] = useState<PostStatus | "">("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<DataTableSort>({ key: "updatedAt", direction: "desc" });
  const [page, setPage] = useState(0);
  const [choosingType, setChoosingType] = useState(false);
  const debouncedQuery = useDebouncedValue(query);

  const types = useAsync(getContentTypes, []);
  const posts = useAsync(
    () =>
      listPosts({
        type: type || undefined,
        status: status || undefined,
        q: debouncedQuery,
        sort: sort.key as PostSortKey,
        direction: sort.direction,
        page,
        size: PAGE_SIZE,
      }),
    [type, status, debouncedQuery, sort, page],
  );

  const hasFilters = Boolean(type || status || query);
  const rows = posts.data?.items ?? [];
  const isFirstLoad = posts.loading && !posts.data;

  const columns: DataTableColumn<PostSummary>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (item) => (
        <div className="min-w-0">
          <div className={item.title ? "truncate font-semibold" : "truncate font-semibold text-muted italic"}>{item.title || "Untitled"}</div>
          <div className="truncate font-mono text-[11px] text-muted">/{item.slug}</div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      width: "150px",
      render: (item) => <TypeChip>{typeLabel(types.data, item.type)}</TypeChip>,
    },
    { key: "status", header: "Status", width: "112px", render: (item) => <PostStatusChip status={item.status} /> },
    {
      key: "updatedAt",
      header: "Updated",
      width: "116px",
      sortable: true,
      render: (item) => (
        <span title={formatDateTime(item.updatedAt)} className="text-secondary">
          {timeAgo(item.updatedAt)}
        </span>
      ),
    },
  ];

  const onSortChange = (key: string) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : key === "title" ? "asc" : "desc",
    }));
    setPage(0);
  };

  const newContentButton = (small = false) => (
    <button type="button" className={small ? "btn btn-primary btn-sm" : "btn btn-primary"} onClick={() => setChoosingType(true)}>
      <Plus size={small ? 13 : 14} aria-hidden />
      New content
    </button>
  );

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 p-[var(--page-pad)]">
      <PageHeader title="Content" description="News, careers, documentation and knowledge-base articles." actions={newContentButton()} />

      <div className="rounded-lg border-[1.5px] border-line bg-card shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3.5 py-3">
          <div className="min-w-[220px] flex-1">
            <SearchInput
              label="Search content"
              placeholder="Search title, slug or content"
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(0);
              }}
            />
          </div>
          <Select
            aria-label="Filter by type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(0);
            }}
            className="w-[170px]"
            options={[{ value: "", label: "All types" }, ...(types.data ?? []).map((t) => ({ value: t.key, label: t.displayName }))]}
          />
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PostStatus | "");
              setPage(0);
            }}
            className="w-[150px]"
            options={[{ value: "", label: "All statuses" }, ...POST_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))]}
          />
          {hasFilters && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setQuery("");
                setType("");
                setStatus("");
                setPage(0);
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="px-1">
          {posts.error ? (
            <div className="p-4">
              <ErrorState title="Couldn't load content" error={posts.error} onRetry={posts.reload} />
            </div>
          ) : !isFirstLoad && rows.length === 0 ? (
            <div className="p-4">
              {hasFilters ? (
                <EmptyState icon={SearchX} title="Nothing matches" description="Try a different search, type or status." />
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No content yet"
                  description="Your first item is one click away."
                  action={newContentButton(true)}
                />
              )}
            </div>
          ) : (
            <DataTable
              caption="Content"
              columns={columns}
              rows={rows}
              rowKey={(item) => item.id}
              onRowClick={(item) => router.push(`/content/${item.id}`)}
              sort={sort}
              onSortChange={onSortChange}
              loading={isFirstLoad}
            />
          )}
        </div>

        {posts.data && posts.data.meta.totalElements > 0 && (
          <div className="border-t border-line px-3.5 py-2">
            <Pagination meta={posts.data.meta} onPageChange={setPage} noun="items" />
          </div>
        )}
      </div>

      {choosingType && (
        <TypePickerModal
          types={types.data}
          error={types.error}
          onRetry={types.reload}
          onClose={() => setChoosingType(false)}
          onPick={(key) => router.push(`/content/new?type=${encodeURIComponent(key)}`)}
        />
      )}
    </div>
  );
}

/** First step of "New content": what kind of item is it? The editor then builds its form from that type. */
function TypePickerModal({
  types,
  error,
  onRetry,
  onClose,
  onPick,
}: {
  types: ContentTypeDefinition[] | undefined;
  error: Error | undefined;
  onRetry: () => void;
  onClose: () => void;
  onPick: (key: string) => void;
}) {
  return (
    <Modal
      title="New content"
      description="What are you writing?"
      onClose={onClose}
      maxWidth={520}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
      }
    >
      {error ? (
        <ErrorState title="Couldn't load the content types" error={error} onRetry={onRetry} />
      ) : !types ? (
        <div className="flex flex-col gap-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[58px] !rounded-md" />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {types.map((type) => (
            <li key={type.key}>
              <button
                type="button"
                onClick={() => onPick(type.key)}
                className="flex w-full cursor-pointer flex-col gap-0.5 rounded-md border-[1.5px] border-line px-3.5 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-subtle"
              >
                <span className="text-[13px] font-bold">{type.displayName}</span>
                <span className="text-[12px] text-secondary">{type.description}</span>
                <span className="font-mono text-[10.5px] text-muted">{describeDestination(type)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
