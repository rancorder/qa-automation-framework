# Contributing to QA Automation Framework

このプロジェクトへの貢献に興味を持っていただき、ありがとうございます！

---

## 📋 貢献方法

### 1. Issue報告

バグや改善提案がある場合:

1. [Issues](https://github.com/rancorder/qa-automation-framework/issues) を確認
2. 重複がなければ新規Issue作成
3. 以下の情報を含める:
   - 問題の説明
   - 再現手順
   - 期待される動作
   - 実際の動作
   - 環境情報（OS, Node.js version等）

---

### 2. Pull Request

コード改善を提案する場合:

1. このリポジトリをFork
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

---

## 🎨 コーディング規約

### TypeScript

```typescript
// ✅ Good
export interface TestConfig {
  timeout: number;
  retries: number;
}

// ❌ Bad
export interface testConfig {
  Timeout: number;
  Retries: number;
}
```

### テストケース

```typescript
// ✅ Good
test('should update stock on inbound operation', async () => {
  // Arrange
  const simulator = new SCMSimulator();
  
  // Act
  simulator.updateStock('PROD-001', 100, 'inbound');
  
  // Assert
  expect(simulator.getStock('PROD-001')).toBe(100);
});

// ❌ Bad
test('test1', async () => {
  simulator.updateStock('PROD-001', 100, 'inbound');
  expect(simulator.getStock('PROD-001')).toBe(100);
});
```

---

## 📝 コミットメッセージ

Conventional Commits形式を推奨:

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント変更
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
chore: その他の変更
```

**例:**
```
feat: Add AI test generator for SCM domain
fix: Resolve race condition in stock updates
docs: Update setup instructions for Windows
```

---

## 🧪 テスト

Pull Request前に必ず実行:

```bash
# 型チェック
npm run type-check

# Lint
npm run lint

# テスト実行
npm test
```

---

## 📚 ドキュメント

新機能追加時は以下も更新:

- README.md
- 該当するドキュメント (SETUP.md, COMMANDS.md等)
- コード内コメント

---

## ⚖️ ライセンス

このプロジェクトに貢献することで、MIT Licenseに同意したものとみなされます。

---

## 🙏 質問・相談

質問や相談がある場合:

- [Discussions](https://github.com/rancorder/qa-automation-framework/discussions) で質問
- または Issues で質問

---

**貢献をお待ちしています！🚀**
