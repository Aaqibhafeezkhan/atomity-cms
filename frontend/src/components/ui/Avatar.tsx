/* eslint-disable @next/next/no-img-element -- avatars are user uploads (data/remote URLs), not static assets */
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MediaRef } from "@/types/media";

export interface AvatarProps {
  name: string;
  image?: MediaRef | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, image, size = 24, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.38)) };
  if (image) {
    return (
      <img
        src={image.url}
        alt={name}
        title={name}
        className={cn("shrink-0 rounded-full border-[1.5px] border-card object-cover", className)}
        style={style}
      />
    );
  }
  return (
    <span
      title={name}
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-card bg-green font-mono font-bold text-ink",
        className,
      )}
      style={style}
    >
      {initials(name)}
    </span>
  );
}

/** Overlapping avatars for a post's authors. */
export function AvatarStack({ people, max = 3, size = 22 }: { people: { id: string; name: string; avatar: MediaRef | null }[]; max?: number; size?: number }) {
  if (people.length === 0) return <span className="text-muted">—</span>;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="flex items-center" title={people.map((p) => p.name).join(", ")}>
      {shown.map((person, i) => (
        <Avatar key={person.id} name={person.name} image={person.avatar} size={size} className={i > 0 ? "-ml-1.5" : undefined} />
      ))}
      {rest > 0 && <span className="ml-1 font-mono text-[10px] text-muted">+{rest}</span>}
    </span>
  );
}
