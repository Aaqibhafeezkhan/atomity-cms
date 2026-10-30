"use client";

/* eslint-disable @next/next/no-img-element -- library images are user uploads (data/remote URLs) */
import { useRef, useState } from "react";
import { Check, ImageOff, Upload } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useAsync } from "@/hooks/useAsync";
import { cn } from "@/lib/utils";
import { ACCEPTED_IMAGE_TYPES, type Media } from "@/types/media";
import { listMedia, uploadMedia } from "./api";

export interface MediaPickerModalProps {
  title?: string;
  onSelect: (media: Media) => void;
  onClose: () => void;
}

/**
 * Pick an image from the library or upload a new one. A fresh upload is selected
 * straight away, since that's almost always why it was uploaded.
 */
export function MediaPickerModal({ title = "Choose an image", onSelect, onClose }: MediaPickerModalProps) {
  const toast = useToast();
  const media = useAsync(listMedia, []);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const items = (media.data ?? []).filter((m) => {
    const needle = query.trim().toLowerCase();
    return !needle || m.originalFilename.toLowerCase().includes(needle) || m.altText.toLowerCase().includes(needle);
  });
  const selected = media.data?.find((m) => m.id === selectedId) ?? null;

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const created = await uploadMedia(file);
      toast.success(`Uploaded ${created.originalFilename}.`);
      onSelect(created);
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
      setUploading(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      maxWidth={760}
      footer={
        <>
          <button type="button" className="btn btn-secondary mr-auto" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? <Spinner size={12} /> : <Upload size={13} aria-hidden />}
            Upload new
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              onSelect(selected);
              onClose();
            }}
          >
            Use image
          </button>
        </>
      }
    >
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />

      <div className="mb-3">
        <SearchInput label="Search images" placeholder="Search by file name or alt text" value={query} onChange={setQuery} />
      </div>

      {media.error ? (
        <ErrorState title="Couldn't load the library" error={media.error} onRetry={media.reload} />
      ) : media.loading && !media.data ? (
        <div className="grid grid-cols-4 gap-2.5">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton aspect-[4/3]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title={query ? "No images match" : "The library is empty"}
          description={query ? "Try another search." : "Upload an image to get started."}
        />
      ) : (
        <div role="listbox" aria-label="Images" className="grid grid-cols-4 gap-2.5">
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => setSelectedId(item.id)}
                onDoubleClick={() => {
                  onSelect(item);
                  onClose();
                }}
                title={item.originalFilename}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-md border-[1.5px] bg-subtle text-left transition-shadow",
                  isSelected ? "border-ink shadow-[var(--focus-ring)]" : "border-line hover:border-line-strong",
                )}
              >
                <img src={item.url} alt={item.altText} className="aspect-[4/3] w-full object-cover" />
                <span className="block truncate px-2 py-1 text-[11px] text-secondary">{item.originalFilename}</span>
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-on-dark">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
