import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <p className="micro-label">404</p>
      <h1 className="text-[21px] font-bold">Page not found</h1>
      <p className="text-[13px] text-muted">The page you are looking for does not exist.</p>
      <Link href="/content" className="btn btn-primary mt-2">
        Back to content
      </Link>
    </main>
  );
}
