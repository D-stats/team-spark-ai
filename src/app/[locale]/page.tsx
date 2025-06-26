import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <main className="flex flex-col items-center gap-8 px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight">TeamSpark AI</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Boost employee engagement and accelerate team growth with our AI-powered HR platform
          designed for modern teams
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t('common.login')}
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-input bg-background px-6 py-3 font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Get Started Free
          </Link>
        </div>
      </main>
    </div>
  );
}
