import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Next.js 15 + React 19 + TypeScript',
  description: 'Client-side converter platform with TypeScript, Tailwind CSS 4, and shadcn/ui',
};

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">Next.js 15 + React 19</h1>
          <p className="text-xl text-[hsl(var(--muted-foreground))]">
            Client-side converter platform with TypeScript, Tailwind CSS 4, and shadcn/ui
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold">Stack Status</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                All components configured and ready for feature development
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-lg bg-[hsl(var(--background))] p-4">
                <h3 className="font-semibold">Runtime</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>Next.js 15.1.9</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>React 19</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>TypeScript 5.6+ (strict mode)</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 rounded-lg bg-[hsl(var(--background))] p-4">
                <h3 className="font-semibold">Styling & Components</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>Tailwind CSS 4 with JIT</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>CSS Variables for theming</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>shadcn/ui foundation</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 rounded-lg bg-[hsl(var(--background))] p-4">
                <h3 className="font-semibold">Developer Tools</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>ESLint + Prettier</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>PNPM package manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>TypeScript strict mode</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 rounded-lg bg-[hsl(var(--background))] p-4">
                <h3 className="font-semibold">Client-Side Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>App Router configured</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>src/ directory structure</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--primary))]"></span>
                    <span>CORS headers for workers</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8">
            <h3 className="text-xl font-semibold">Available Commands</h3>
            <div className="space-y-2 font-mono text-sm">
              <div className="rounded bg-[hsl(var(--background))] p-3">
                <code className="text-[hsl(var(--primary))]">pnpm dev</code>
                <span className="ml-2 text-[hsl(var(--muted-foreground))]">
                  - Start development server
                </span>
              </div>
              <div className="rounded bg-[hsl(var(--background))] p-3">
                <code className="text-[hsl(var(--primary))]">pnpm build</code>
                <span className="ml-2 text-[hsl(var(--muted-foreground))]">
                  - Build for production
                </span>
              </div>
              <div className="rounded bg-[hsl(var(--background))] p-3">
                <code className="text-[hsl(var(--primary))]">pnpm lint</code>
                <span className="ml-2 text-[hsl(var(--muted-foreground))]">
                  - Run ESLint
                </span>
              </div>
              <div className="rounded bg-[hsl(var(--background))] p-3">
                <code className="text-[hsl(var(--primary))]">pnpm type-check</code>
                <span className="ml-2 text-[hsl(var(--muted-foreground))]">
                  - Run TypeScript check
                </span>
              </div>
              <div className="rounded bg-[hsl(var(--background))] p-3">
                <code className="text-[hsl(var(--primary))]">pnpm format</code>
                <span className="ml-2 text-[hsl(var(--muted-foreground))]">
                  - Format code with Prettier
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[hsl(var(--border))] pt-8 text-center">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              ✅ Global styles and theme loaded successfully.
              <br />
              Ready for feature development.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
