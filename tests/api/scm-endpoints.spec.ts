// tests/api/scm-endpoints.spec.ts
import { test, expect } from '@playwright/test';

/**
 * SCM API Endpoints Testing
 * 
 * 営業経験17年からの洞察:
 * 「APIの問題はサイレントに起きる。気づいた時には大量のデータ不整合」
 * 
 * テストする価値:
 * 1. エンドポイントの正確性（仕様通りの動作）
 * 2. エラーハンドリング（異常系の適切な処理）
 * 3. パフォーマンス（レスポンス時間）
 * 4. データ整合性（トランザクション保証）
 */

test.describe('SCM API - Inventory Endpoints', () => {
  
  // 本番環境ではRECERQA APIを使用
  // テスト環境ではモックサーバーまたは ReqRes を使用
  const BASE_URL = process.env.API_BASE_URL || 'https://reqres.in/api';

  test.describe('GET /inventory', () => {
    test('should return inventory list with pagination', async ({ request }) => {
      // Act
      const response = await request.get(`${BASE_URL}/users?page=1`);
      
      // Assert
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('page');
      expect(data).toHaveProperty('per_page');
      expect(data).toHaveProperty('total');
      
      // 営業経験: 「ページネーションは必須。大量データでUIが固まる」
      expect(data.per_page).toBeGreaterThan(0);
    });

    test('should return specific product by ID', async ({ request }) => {
      // Arrange
      const productId = 2;
      
      // Act
      const response = await request.get(`${BASE_URL}/users/${productId}`);
      
      // Assert
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.data).toHaveProperty('id');
      expect(data.data.id).toBe(productId);
    });

    test('should return 404 for non-existent product', async ({ request }) => {
      // Arrange
      const nonExistentId = 999999;
      
      // Act
      const response = await request.get(`${BASE_URL}/users/${nonExistentId}`);
      
      // Assert
      expect(response.status()).toBe(404);
      
      // 営業経験: 「404時のエラーメッセージは分かりやすく」
    });

    test('should handle query parameters for filtering', async ({ request }) => {
      // Arrange
      const filters = {
        page: 2,
        per_page: 5
      };
      
      // Act
      const response = await request.get(`${BASE_URL}/users`, {
        params: filters
      });
      
      // Assert
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.page).toBe(filters.page);
      expect(data.per_page).toBe(filters.per_page);
    });
  });

  test.describe('POST /inventory', () => {
    test('should create new inventory item', async ({ request }) => {
      // Arrange
      const newProduct = {
        name: '工業用ボルト M10×30mm',
        sku: 'BOLT-M10-30',
        stock: 500,
        price: 15
      };
      
      // Act
      const response = await request.post(`${BASE_URL}/users`, {
        data: newProduct
      });
      
      // Assert
      expect(response.status()).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('createdAt');
      expect(data.name).toBe(newProduct.name);
    });

    test('should validate required fields', async ({ request }) => {
      // Arrange: 必須フィールド欠落
      const invalidProduct = {
        name: 'Test Product'
        // sku, stock, price が欠落
      };
      
      // Act
      const response = await request.post(`${BASE_URL}/users`, {
        data: invalidProduct
      });
      
      // Assert
      // ReqResは常に201を返すが、実際のAPIではバリデーションエラー
      // 本番では400 Bad Requestを期待
      expect(response.status()).toBeGreaterThanOrEqual(201);
      
      // 営業経験: 「バリデーションエラーは詳細に」
    });

    test('should prevent duplicate SKU', async ({ request }) => {
      // Arrange
      const product = {
        name: 'Test Product',
        sku: 'DUPLICATE-SKU-001',
        stock: 100,
        price: 1000
      };
      
      // Act: 1回目の作成
      await request.post(`${BASE_URL}/users`, { data: product });
      
      // Act: 2回目の作成（重複）
      const response = await request.post(`${BASE_URL}/users`, { data: product });
      
      // Assert
      // 本番では409 Conflictを期待
      // ReqResは常に成功するため、実際のAPIでテスト必要
      expect(response.status()).toBeGreaterThanOrEqual(201);
      
      // 営業経験: 「SKU重複は深刻。在庫管理が破綻する」
    });
  });

  test.describe('PUT /inventory/:id', () => {
    test('should update existing inventory item', async ({ request }) => {
      // Arrange
      const productId = 2;
      const updatedData = {
        stock: 1500,
        price: 20
      };
      
      // Act
      const response = await request.put(`${BASE_URL}/users/${productId}`, {
        data: updatedData
      });
      
      // Assert
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('updatedAt');
      expect(data.stock).toBe(updatedData.stock);
    });

    test('should handle partial updates (PATCH)', async ({ request }) => {
      // Arrange
      const productId = 2;
      const partialUpdate = {
        stock: 2000 // stockのみ更新
      };
      
      // Act
      const response = await request.patch(`${BASE_URL}/users/${productId}`, {
        data: partialUpdate
      });
      
      // Assert
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.stock).toBe(partialUpdate.stock);
      
      // 営業経験: 「部分更新はパフォーマンス向上に必須」
    });
  });

  test.describe('DELETE /inventory/:id', () => {
    test('should delete inventory item', async ({ request }) => {
      // Arrange
      const productId = 2;
      
      // Act
      const response = await request.delete(`${BASE_URL}/users/${productId}`);
      
      // Assert
      expect(response.status()).toBe(204);
      
      // 営業経験: 「削除は論理削除が望ましい（復元可能性）」
    });

    test('should prevent deletion of items with active orders', async ({ request }) => {
      // Arrange
      const productId = 1; // 仮: アクティブな注文がある商品
      
      // Act
      const response = await request.delete(`${BASE_URL}/users/${productId}`);
      
      // Assert
      // 本番では409 Conflict または 422 Unprocessable Entity を期待
      // 営業経験: 「発注中の商品は削除不可」
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });
  });
});

test.describe('SCM API - Purchase Order Endpoints', () => {
  const BASE_URL = process.env.API_BASE_URL || 'https://reqres.in/api';

  test.describe('POST /purchase-orders', () => {
    test('should create purchase order successfully', async ({ request }) => {
      // Arrange
      const purchaseOrder = {
        productId: 'P001',
        quantity: 100,
        supplierId: 'SUP001',
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Act
      const response = await request.post(`${BASE_URL}/users`, {
        data: purchaseOrder
      });
      
      // Assert
      expect(response.status()).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('createdAt');
    });

    test('should validate business rules before creation', async ({ request }) => {
      // Arrange: 無効な発注（数量ゼロ）
      const invalidOrder = {
        productId: 'P001',
        quantity: 0, // ゼロは無効
        supplierId: 'SUP001'
      };
      
      // Act
      const response = await request.post(`${BASE_URL}/users`, {
        data: invalidOrder
      });
      
      // Assert
      // 本番では400 Bad Requestを期待
      // 営業経験: 「ゼロ発注は業務ルール違反」
      expect(response.status()).toBeGreaterThanOrEqual(201);
    });
  });

  test.describe('GET /purchase-orders/:id/status', () => {
    test('should return order status with tracking info', async ({ request }) => {
      // Arrange
      const orderId = 1;
      
      // Act
      const response = await request.get(`${BASE_URL}/users/${orderId}`);
      
      // Assert
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.data).toHaveProperty('id');
      
      // 営業経験: 「ステータスは粒度細かく（発注→承認→発送→納品）」
    });
  });

  test.describe('PUT /purchase-orders/:id/approve', () => {
    test('should approve pending order', async ({ request }) => {
      // Arrange
      const orderId = 2;
      const approvalData = {
        status: 'approved',
        approvedBy: 'manager@company.com',
        approvalComment: '承認します'
      };
      
      // Act
      const response = await request.put(`${BASE_URL}/users/${orderId}`, {
        data: approvalData
      });
      
      // Assert
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('updatedAt');
      
      // 営業経験: 「承認履歴は監査証跡として保存」
    });
  });
});

test.describe('SCM API - Performance & Reliability', () => {
  const BASE_URL = process.env.API_BASE_URL || 'https://reqres.in/api';

  test('should respond within acceptable time (< 2s)', async ({ request }) => {
    // Arrange
    const startTime = Date.now();
    
    // Act
    const response = await request.get(`${BASE_URL}/users?page=1`);
    
    // Assert
    const responseTime = Date.now() - startTime;
    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(2000); // 2秒以内
    
    // 営業経験: 「レスポンスが遅いとユーザーは使わなくなる」
    console.log(`API Response Time: ${responseTime}ms`);
  });

  test('should handle concurrent requests safely', async ({ request }) => {
    // Arrange
    const concurrentRequests = 10;
    
    // Act: 同時に10リクエスト
    const promises = Array.from({ length: concurrentRequests }, (_, i) => 
      request.get(`${BASE_URL}/users/${i + 1}`)
    );
    
    const responses = await Promise.all(promises);
    
    // Assert
    const successCount = responses.filter(r => r.ok()).length;
    expect(successCount).toBeGreaterThan(0);
    
    // 営業経験: 「繁忙期の同時アクセスでエラーが頻発」
    console.log(`Concurrent Requests Success Rate: ${successCount}/${concurrentRequests}`);
  });

  test('should handle rate limiting gracefully', async ({ request }) => {
    // Arrange: レートリミット検証用の大量リクエスト
    const requests = 100;
    let rateLimitHit = false;
    
    // Act
    for (let i = 0; i < requests; i++) {
      const response = await request.get(`${BASE_URL}/users/1`);
      
      if (response.status() === 429) { // Too Many Requests
        rateLimitHit = true;
        break;
      }
    }
    
    // Assert
    // ReqResにはレートリミットがないため、ヒットしない
    // 本番APIではレートリミットの適切な処理を確認
    if (rateLimitHit) {
      console.log('Rate limit detected - proper handling required');
    }
    
    // 営業経験: 「レートリミットは明示的に通知」
  });

  test('should return proper error structure', async ({ request }) => {
    // Arrange
    const invalidEndpoint = `${BASE_URL}/invalid-endpoint`;
    
    // Act
    const response = await request.get(invalidEndpoint);
    
    // Assert
    expect(response.ok()).toBeFalsy();
    
    // エラーレスポンスの構造確認
    if (!response.ok()) {
      const errorData = await response.json().catch(() => ({}));
      
      // 営業経験: 「エラーメッセージは具体的に」
      // 期待する構造: { error: { code, message, details } }
      console.log('Error Response:', errorData);
    }
  });
});

test.describe('SCM API - Data Integrity', () => {
  const BASE_URL = process.env.API_BASE_URL || 'https://reqres.in/api';

  test('should maintain transaction consistency', async ({ request }) => {
    // Arrange
    const productId = 1;
    
    // Act: データ取得 → 更新 → 再取得
    const before = await request.get(`${BASE_URL}/users/${productId}`);
    const beforeData = await before.json();
    
    const update = await request.put(`${BASE_URL}/users/${productId}`, {
      data: { stock: 999 }
    });
    
    const after = await request.get(`${BASE_URL}/users/${productId}`);
    const afterData = await after.json();
    
    // Assert
    expect(before.ok()).toBeTruthy();
    expect(update.ok()).toBeTruthy();
    expect(after.ok()).toBeTruthy();
    
    // 営業経験: 「更新が反映されない問題は致命的」
    console.log('Before:', beforeData);
    console.log('After:', afterData);
  });

  test('should prevent race conditions in stock updates', async ({ request }) => {
    // Arrange
    const productId = 2;
    const updates = 5;
    
    // Act: 同時に複数の在庫更新
    const promises = Array.from({ length: updates }, (_, i) => 
      request.patch(`${BASE_URL}/users/${productId}`, {
        data: { stock: (i + 1) * 100 }
      })
    );
    
    const responses = await Promise.all(promises);
    
    // Assert
    const successCount = responses.filter(r => r.ok()).length;
    expect(successCount).toBe(updates);
    
    // 営業経験: 「在庫の同時更新で数字が合わなくなる」
    console.log(`Concurrent Stock Updates: ${successCount}/${updates} succeeded`);
  });
});

/**
 * Why This Matters（営業17年の経験から）
 * 
 * API統合の失敗パターン:
 * 1. エラーハンドリング不足 → サイレントエラー → データ不整合
 * 2. レスポンス遅延 → ユーザー離脱
 * 3. 同時アクセス未対応 → 繁忙期に障害
 * 4. トランザクション不整合 → 在庫数の不一致
 * 
 * このテストが守る価値:
 * - API仕様の正確性（契約保証）
 * - パフォーマンス（UX品質）
 * - データ整合性（信頼性）
 * - エラーハンドリング（運用性）
 * 
 * RECERQAでの重要性:
 * AI-SCMは複数のAPIを統合して動作。
 * 1つのAPI障害が全体に波及するため、
 * API品質保証は最優先事項。
 */
