export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>TeamSpark AI - Test Page</h1>
      <p>開発サーバーは正常に動作しています！✅</p>

      <h2>利用可能なサービス:</h2>
      <ul>
        <li>
          <a href="/api/health">Health Check API</a>
        </li>
        <li>
          <a href="/api-docs">API Documentation (Swagger)</a>
        </li>
        <li>
          <a href="/dev">開発者ダッシュボード</a>
        </li>
      </ul>

      <h2>ログイン情報:</h2>
      <ul>
        <li>Admin: admin@demo.com</li>
        <li>Manager: sarah.manager@demo.com</li>
        <li>Developer: john.dev@demo.com</li>
        <li>Sales: emily.sales@demo.com</li>
      </ul>
    </div>
  );
}
