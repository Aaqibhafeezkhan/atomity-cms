"use client";

/* eslint-disable @next/next/no-img-element -- library images are user uploads (data/remote URLs) */
import { useRef, useState } from "react";
import { ImageOff, Trash2, Upload } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Spinner } from "@/components/ui/Spinner";
import { StatusChip } from "@/components/ui/StatusChip";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { formatBytes, formatDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, type Media } from "@/types/media";
import { deleteMedia, listMedia, updateMediaAlt, uploadMedia } from "./api";

export function MediaLibraryCanvas() {
  const toast = useToast();
  const media = useAsync(listMedia, []);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const needle = query.trim().toLowerCase();
  const items = (media.data ?? []).filter(
    (m) => !needle || m.originalFilename.toLowerCase().includes(needle) || m.altText.toLowerCase().includes(needle),
  );
  const open = media.data?.find((m) => m.id === openId) ?? null;

  /** Uploads one at a time so a failure names the file it was about. */
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(files.length);
    let done = 0;
    for (const file of files) {
      try {
        await uploadMedia(file);
        done++;
      } catch (error) {
        toast.error((error as Error).message);
      }
      setUploading((n) => n - 1);
    }
    if (done > 0) toast.success(`Uploaded ${pluralize(done, "image")}.`);
    media.reload();
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 p-[var(--page-pad)]"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void uploadFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <PageHeader
        title="Media"
        description={`Images used in your content. JPEG, PNG, WebP or GIF, up to ${formatBytes(MAX_IMAGE_BYTES)}.`}
        actions={
          <button type="button" className="btn btn-primary" onClick={() => fileInput.current?.click()} disabled={uploading > 0}>
            {uploading > 0 ? <Spinner size={12} /> : <Upload size={14} aria-hidden />}
            {uploading > 0 ? `Uploading ${uploading}…` : "Upload"}
          </button>
        }
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void uploadFiles(files);
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <div className="w-full max-w-[320px]">
          <SearchInput label="Search images" placeholder="Search by file name or alt text" value={query} onChange={setQuery} />
        </div>
        {media.data && <span className="text-[12px] text-muted">{pluralize(media.data.length, "image")}</span>}
      </div>

      <div
        className={cn(
          "rounded-lg border-[1.5px] border-dashed p-3 transition-colors",
          dragging ? "border-green-dark bg-green-tint" : "border-transparent",
        )}
      >
        {dragging && <p className="mb-3 text-center text-[12.5px] font-semibold">Drop images to upload</p>}
        {media.error ? (
          <ErrorState title="Couldn't load the library" error={media.error} onRetry={media.reload} />
        ) : media.loading && !media.data ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="skeleton aspect-[4/3] !rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={ImageOff}
            title={needle ? "No images match" : "No images yet"}
            description={needle ? "Try another search." : "Upload images or drag them onto this page."}
          />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  className="group w-full cursor-pointer overflow-hidden rounded-lg border-[1.5px] border-line bg-card text-left shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="relative bg-subtle">
                    <img src={item.url} alt={item.altText} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    {!item.altText && (
                      <StatusChip tone="draft" className="absolute top-2 left-2">
                        No alt text
                      </StatusChip>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="truncate text-[12px] font-semibold">{item.originalFilename}</div>
                    <div className="flex justify-between font-mono text-[10.5px] text-muted">
                      <span>
                        {item.width}×{item.height} · {formatBytes(item.sizeBytes)}
                      </span>
                      <span>{item.usageCount > 0 ? `used ${item.usageCount}×` : "unused"}</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && <MediaDetailDialog media={open} onClose={() => setOpenId(null)} onChanged={media.reload} />}
    </div>
  );
}

function MediaDetailDialog({ media, onClose, onChanged }: { media: Media; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [alt, setAlt] = useState(media.altText);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inUse = media.usageCount > 0;

  const saveAlt = async () => {
    setSaving(true);
    try {
      await updateMediaAlt(media.id, alt);
      toast.success("Alt text saved.");
      onChanged();
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
      setSaving(false);
    }
  };

  const rows: [string, string][] = [
    ["File", media.originalFilename],
    ["Type", media.contentType],
    ["Dimensions", `${media.width} × ${media.height}px`],
    ["Size", formatBytes(media.sizeBytes)],
    ["Uploaded", formatDate(media.createdAt)],
    ["Used in", inUse ? pluralize(media.usageCount, "place") : "Nothing yet"],
  ];

  return (
    <Modal
      title="Image details"
      onClose={onClose}
      maxWidth={760}
      footer={
        <>
          <button
            type="button"
            className="btn btn-ghost mr-auto !text-error-text"
            onClick={() => setConfirmDelete(true)}
            disabled={inUse}
            title={inUse ? "Remove this image from every content item first" : undefined}
          >
            <Trash2 size={13} aria-hidden /> Delete
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void saveAlt()} disabled={saving || alt === media.altText}>
            {saving && <Spinner size={12} />}
            Save
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex items-center justify-center overflow-hidden rounded-md border border-line bg-subtle">
          <img src={media.url} alt={media.altText} className="max-h-[360px] w-full object-contain" />
        </div>
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd className="truncate text-right" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <Field
            label="Alt text"
            htmlFor="media-alt"
            count={{ current: alt.length, max: 300 }}
            hint="Describes the image for screen readers and search engines."
          >
            <textarea id="media-alt" rows={3} className="input" value={alt} onChange={(e) => setAlt(e.target.value)} />
          </Field>
          {inUse && <p className="text-[11.5px] text-muted">This image can’t be deleted while it’s in use.</p>}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this image?"
          message={`${media.originalFilename} will be permanently removed from the library.`}
          confirmLabel="Delete"
          danger
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            try {
              await deleteMedia(media.id);
              toast.success("Image deleted.");
              onChanged();
              onClose();
            } catch (error) {
              toast.error((error as Error).message);
              throw error;
            }
          }}
        />
      )}
    </Modal>
  );
}
