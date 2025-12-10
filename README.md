# QA Framework 

AI統合SCMプラットフォーム向けにプロダクト改善と自動化のために構築した統合テストフレームワークです。  
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

## 実行ログ（抜粋）　※APIはダミーのため企業環境では正常に作動
```
Running 52 tests using 3 workers

  ✘   1 …SCM API - Inventory Endpoints › GET /inventory › should return inventory list with pagination (162ms)
  ✓   2 ….spec.ts:26:9 › SCM Inventory Management › 基本操作 › should update stock on inbound operation (18ms)
  ✓   3 …-flow.spec.ts:26:9 › SCM Purchase Flow › 発注作成 › should create purchase order successfully (320ms)
  ✓   4 ….spec.ts:47:9 › SCM Inventory Management › 基本操作 › should update stock on outbound operation (2ms)
  ✓   5 …2e\inventory.spec.ts:62:9 › SCM Inventory Management › 基本操作 › should prevent negative stock (3ms)
  ✓   6 … SCM Inventory Management › 安全在庫アラート › should alert when stock falls below safety level (4ms)
  ✓   7 …s:94:9 › SCM Inventory Management › 安全在庫アラート › should recommend order when stock is low (2ms)
  ✓   8 …3:9 › SCM Inventory Management › 同時更新（競合制御） › should handle concurrent updates safely (2ms)
  ✘   9 … Inventory Management › 同時更新（競合制御） › should maintain transaction integrity under load (3ms)
  ✓  10 …ow.spec.ts:52:9 › SCM Purchase Flow › 発注作成 › should validate order quantity before creation (9ms)
  ✓  11 …:9 › SCM Purchase Flow › 発注作成 › should calculate expected delivery date based on lead time (12ms)
  ✓  12 …c.ts:94:9 › SCM Purchase Flow › 承認フロー › should require approval for orders above threshold (2ms)
  ✓  13 …low.spec.ts:112:9 › SCM Purchase Flow › 承認フロー › should auto-approve orders below threshold (4ms)
  ✓  14 …ow.spec.ts:130:9 › SCM Purchase Flow › 承認フロー › should handle approval rejection gracefully (4ms)
  ✓  15 …e-flow.spec.ts:149:9 › SCM Purchase Flow › 緊急発注 › should handle urgent orders with priority (4ms)
  ✓  16 …low.spec.ts:176:9 › SCM Purchase Flow › 緊急発注 › should notify stakeholders for urgent orders (4ms)
  ✓  17 …1:9 › SCM Purchase Flow › サプライヤー連携 › should validate supplier availability before order (4ms)
  ✓  18 …ts:223:9 › SCM Purchase Flow › サプライヤー連携 › should handle supplier API timeout gracefully (2ms)
  ✓  19 …pec.ts:247:9 › SCM Purchase Flow › サプライヤー連携 › should track supplier performance metrics (3ms)
  ✓  20 …flow.spec.ts:272:9 › SCM Purchase Flow › 発注履歴管理 › should maintain order history for audit (3ms)
  ✓  21 …se-flow.spec.ts:292:9 › SCM Purchase Flow › 発注履歴管理 › should detect unusual order patterns (4ms)
  ✓  22 …316:9 › SCM Purchase Flow › コスト最適化 › should calculate total order cost including shipping (4ms)
  ✘  23 …w.spec.ts:335:9 › SCM Purchase Flow › コスト最適化 › should suggest bulk order for cost savings (8ms)
  ✓  24 ….spec.ts:150:9 › SCM Inventory Management › 需要予測 › should forecast demand based on history (17ms)
  ✘  25 …:42:9 › SCM API - Inventory Endpoints › GET /inventory › should return specific product by ID (170ms)
  ✓  26 …spec.ts:171:9 › SCM Inventory Management › 需要予測 › should recommend order based on lead time (2ms)
  ✓  27 …SCM Inventory Management › エッジケース（営業経験ベース） › should handle zero stock gracefully (3ms)
  ✓  28 …SCM Inventory Management › エッジケース（営業経験ベース） › should handle large quantity orders (2ms)
  ✘  29 … Inventory Management › エッジケース（営業経験ベース） › should handle rapid sequential updates (4ms)
  ✓  30 … Purchase Flow › エッジケース（営業経験ベース） › should handle supplier out-of-stock scenario (18ms)
  ✓  31 … SCM Purchase Flow › エッジケース（営業経験ベース） › should handle currency fluctuation impact (2ms)
  ✓  32 …Flow › エッジケース（営業経験ベース） › should prioritize critical components over non-critical (5ms)
  ✓  33 …3:9 › SCM Inventory Management › レポート生成 › should generate comprehensive inventory report (24ms)
  ✘  34 …› SCM API - Inventory Endpoints › GET /inventory › should return 404 for non-existent product (143ms)
  ✘  35 …SCM API - Inventory Endpoints › GET /inventory › should handle query parameters for filtering (135ms)
  ✘  36 ….ts:92:9 › SCM API - Inventory Endpoints › POST /inventory › should create new inventory item (157ms)
  ✓  37 ….ts:115:9 › SCM API - Inventory Endpoints › POST /inventory › should validate required fields (194ms)
  ✓  38 …pec.ts:135:9 › SCM API - Inventory Endpoints › POST /inventory › should prevent duplicate SKU (136ms)
  ✘  39 …9 › SCM API - Inventory Endpoints › PUT /inventory/:id › should update existing inventory item (64ms)
  ✘  40 … › SCM API - Inventory Endpoints › PUT /inventory/:id › should handle partial updates (PATCH) (118ms)
  ✘  41 …:204:9 › SCM API - Inventory Endpoints › DELETE /inventory/:id › should delete inventory item (136ms)
  ✓  42 …ntory Endpoints › DELETE /inventory/:id › should prevent deletion of items with active orders (129ms)
  ✘  43 …- Purchase Order Endpoints › POST /purchase-orders › should create purchase order successfully (61ms)
  ✓  44 …hase Order Endpoints › POST /purchase-orders › should validate business rules before creation (171ms)
  ✘  45 …r Endpoints › GET /purchase-orders/:id/status › should return order status with tracking info (121ms)
  ✘  46 … - Purchase Order Endpoints › PUT /purchase-orders/:id/approve › should approve pending order (230ms)
  ✘  47 …ts:325:7 › SCM API - Performance & Reliability › should respond within acceptable time (< 2s) (128ms)
  ✘  48 …pec.ts:341:7 › SCM API - Performance & Reliability › should handle concurrent requests safely (176ms)
  ✓  49 …s.spec.ts:360:7 › SCM API - Performance & Reliability › should handle rate limiting gracefully (4.6s)
  ✓  50 …nts.spec.ts:385:7 › SCM API - Performance & Reliability › should return proper error structure (47ms)
Error Response: {}
  ✘  51 …m-endpoints.spec.ts:409:7 › SCM API - Data Integrity › should maintain transaction consistency (51ms)
  ✘  52 …ts.spec.ts:434:7 › SCM API - Data Integrity › should prevent race conditions in stock updates (148ms)


  1) tests\api\scm-endpoints.spec.ts:24:9 › SCM API - Inventory Endpoints › GET /inventory › should return inventory list with pagination

    Error: expect(received).toBeTruthy()

    Received: false

      27 |
      28 |       // Assert
    > 29 |       expect(response.ok()).toBeTruthy();
         |                             ^
      30 |       expect(response.status()).toBe(200);
      31 |
      32 |       const data = await response.json();
        at C:\Users\***\Desktop\qa-framework\tests\api\scm-endpoints.spec.ts:29:29
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
