# TypeScript 厳格型付け移行ガイド

## 現在の状況

2025年6月28日時点で、TypeScript の厳格な型チェックを有効化しましたが、163個のエラーが存在します。

## エラーの種類と修正方法

### 1. process.env インデックスアクセス (TS4111)

**問題:**
```typescript
// ❌ エラー
process.env.NEXT_PUBLIC_APP_URL
```

**修正:**
```typescript
// ✅ 正しい
process.env['NEXT_PUBLIC_APP_URL']
```

### 2. Object is possibly 'undefined' (TS2532, TS18048)

**問題:**
```typescript
// ❌ エラー
const value = obj.property; // obj が undefined の可能性
```

**修正:**
```typescript
// ✅ 正しい - Optional chaining
const value = obj?.property;

// ✅ 正しい - Nullish coalescing
const value = obj?.property ?? defaultValue;

// ✅ 正しい - Type guard
if (obj) {
  const value = obj.property;
}
```

### 3. 未使用パラメータ (TS6133)

**問題:**
```typescript
// ❌ エラー
async function handler(request: NextRequest) {
  // request を使用していない
}
```

**修正:**
```typescript
// ✅ 正しい - アンダースコアプレフィックス
async function handler(_request: NextRequest) {
  // 意図的に未使用
}
```

### 4. any 型の排除

**問題:**
```typescript
// ❌ エラー
function process(data: any) {
  return data.value;
}
```

**修正:**
```typescript
// ✅ 正しい - 適切な型定義
interface ProcessData {
  value: string;
}

function process(data: ProcessData) {
  return data.value;
}

// ✅ 正しい - 型ガード
function isProcessData(data: unknown): data is ProcessData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    typeof (data as ProcessData).value === 'string'
  );
}
```

## 段階的移行計画

### Phase 1: Critical Errors (優先度: 高)
- [ ] API routes の未使用パラメータを修正
- [ ] process.env のアクセス方法を修正
- [ ] null/undefined チェックを追加

### Phase 2: Type Safety (優先度: 中)
- [ ] any 型を適切な型に置き換え
- [ ] 型ガードを実装
- [ ] ジェネリック型を活用

### Phase 3: Optimization (優先度: 低)
- [ ] 未使用の import を削除
- [ ] 型定義の最適化
- [ ] 共通型の抽出

## 一時的な回避策

移行期間中、特定のファイルで一時的にルールを無効化する場合：

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const temp: any = complexData;

// @ts-expect-error - 移行中
const value = process.env.SOME_VAR;
```

## チーム向けガイドライン

1. **新規コードは厳格なルールに従う**
2. **既存コードは段階的に修正**
3. **PR 時に型エラーがないことを確認**
4. **any 型の使用は技術的負債として記録**

## 有用なツール

```bash
# 型エラーをチェック
npm run type-check

# 特定のファイルの型エラーを確認
npx tsc --noEmit src/path/to/file.ts

# any 型の使用箇所を検索
grep -r "any" src/ --include="*.ts" --include="*.tsx" | grep -v "@ts-"
```

## 参考資料

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Type-Safe Environment Variables](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)