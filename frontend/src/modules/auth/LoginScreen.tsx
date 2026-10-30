import { Logo } from "@/components/shell/Logo";
import { LoginForm } from "./LoginForm";

/** Two-panel sign-in (after atomity-product's auth layout): form left, dark brand panel right on wide screens. */
export function LoginScreen({ next }: { next?: string }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col px-8 py-8 xl:w-[58%]">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.18em] text-muted uppercase before:h-0.5 before:w-[18px] before:bg-green-dark before:content-['']">
                Admin
              </div>
              <h1 className="mb-2 text-[30px] leading-tight font-bold tracking-[-0.02em]">Sign in to Atomity CMS</h1>
              <p className="text-[13px] text-muted">Write, manage and publish your news, careers, docs and knowledge-base content.</p>
            </div>
            <LoginForm next={next} />
          </div>
        </div>
      </div>
      <div className="hidden flex-1 flex-col justify-end bg-dark p-12 text-on-dark xl:flex">
        <p className="max-w-[420px] text-[26px] leading-snug font-bold tracking-[-0.01em]">
          Drafts, reviews and publishing — <span className="text-green">all in one place.</span>
        </p>
        <p className="mt-3 max-w-[420px] text-[13px] opacity-60">An open-source CMS for Atomity content.</p>
      </div>
    </div>
  );
}
