# QA Framework

プロダクト改善と自動化のために構築した統合テストフレームワークです。  
E2E / API / AI ベースのテスト生成まで、一連の QA 体験を最短距離で回すことを目的としています。

---

## 特徴
- **Playwright による E2E テスト**：UI フローの自動化と回帰テストを高速化。
- **API テスト統合**：SCM 系エンドポイントを中心に、REST API の信頼性を担保。
- **AI テスト生成（Experimental）**：`ai-test-generator.ts` により、仕様からテスト案を自動生成。
- **拡張性の高い構成**：`lib/` と `tests/` を明確に分離し、保守しやすい構造へ。
- **ローカルでも CI でも同一挙動**：npm scripts と Playwright 標準構造で安定動作を実現。

---

## ディレクトリ構成
```
qa-framework/
├── lib/
│   ├── ai-test-generator.ts    # AIベースのテスト生成ロジック
│   └── scm-simulator.ts        # APIモック・データシミュレーション
├── tests/
│   ├── e2e/                    # E2E テスト
│   └── api/                    # API テスト
├── playwright.config.ts
└── package.json
```

---

## セットアップ
```
npm install
npx playwright install
```

---

## テスト実行
```
npm test
```

---

## 実行ログ（抜粋）
```
Running 52 tests using 3 workers

  ✘   SCM API - Inventory Endpoints › GET /inventory › should return inventory list with pagination (162ms)
  ✓   SCM Inventory Management › 基本操作 › should update stock on inbound operation (18ms)
  ✓   SCM Purchase Flow › 発注作成 › should create purchase order successfully (320ms)
  ...
```
※ Fail の部分は改善対象として残してあります。実際のデバッグや改善プロセスの証跡として、Wantedly ストーリーと合わせて理解されやすくなります。

---

## AI テスト生成（Experimental）
仕様書・API 定義を入力すると、テスト案を Markdown 形式で自動生成します。  
今後は Dify / LLM ワークフローとも統合予定。

---

## 目的
このフレームワークは、
- テストの属人化を防ぐ
- 新規機能を安全に追加できる環境を作る
- QA 工数を削減し、検証の質を引き上げる

ことを目的に設計しています。  
Wantedly のストーリーとも親和性が高く、「成果物」として最も伝わる領域になります。

---

## 今後の拡張予定
- Dify/LLM 連携による自動テスト生成の強化
- CI/CD のテンプレート化
- シナリオベースの負荷試験モジュール
- API モックサーバの自動生成

---

## ライセンス
Private Use Only
