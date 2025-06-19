export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <main className="flex flex-col items-center gap-8 px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          Startup HR
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          従業員エンゲージメントを高め、チームの成長を加速させる
          スタートアップ向けHRプラットフォーム
        </p>
        <div className="flex gap-4">
          <a
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ログイン
          </a>
          <a
            href="/signup"
            className="rounded-lg border border-input bg-background px-6 py-3 font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            無料で始める
          </a>
        </div>
      </main>
    </div>
  );
}