// tests/e2e/inventory.spec.ts
import { test, expect } from '@playwright/test';
import { SCMSimulator } from '../../lib/scm-simulator';

/**
 * 在庫管理テスト
 * 
 * 営業経験17年からの洞察:
 * 「在庫管理の問題は数字の不一致。これが信頼を失う」
 * 
 * テストする価値:
 * 1. 在庫数の正確性（トランザクション整合性）
 * 2. リアルタイム反映（遅延の検知）
 * 3. 同時更新の安全性（競合制御）
 * 4. 安全在庫アラート（欠品防止）
 */

test.describe('SCM Inventory Management', () => {
  let simulator: SCMSimulator;
  
  test.beforeEach(() => {
    simulator = new SCMSimulator();
  });

  test.describe('基本操作', () => {
    test('should update stock on inbound operation', async () => {
      // Arrange
      const productId = 'P001';
      const initialProduct = simulator.getProduct(productId);
      const initialStock = initialProduct!.stock;
      const inboundQuantity = 100;
      
      // Act
      const result = simulator.updateStock(productId, inboundQuantity, 'inbound', 'Supplier delivery');
      
      // Assert
      expect(result.success).toBeTruthy();
      expect(result.currentStock).toBe(initialStock + inboundQuantity);
      
      // トランザクション記録確認
      const transactions = simulator.getTransactionHistory(productId);
      const lastTransaction = transactions[transactions.length - 1];
      expect(lastTransaction.type).toBe('inbound');
      expect(lastTransaction.quantity).toBe(inboundQuantity);
    });

    test('should update stock on outbound operation', async () => {
      // Arrange
      const productId = 'P001';
      const initialProduct = simulator.getProduct(productId);
      const initialStock = initialProduct!.stock;
      const outboundQuantity = 50;
      
      // Act
      const result = simulator.updateStock(productId, outboundQuantity, 'outbound', 'Customer order');
      
      // Assert
      expect(result.success).toBeTruthy();
      expect(result.currentStock).toBe(initialStock - outboundQuantity);
    });

    test('should prevent negative stock', async () => {
      // Arrange
      const productId = 'P001';
      const product = simulator.getProduct(productId)!;
      const excessiveQuantity = product.stock + 100;
      
      // Act
      const result = simulator.updateStock(productId, excessiveQuantity, 'outbound', 'Excessive order');
      
      // Assert
      expect(result.success).toBeFalsy();
      expect(result.message).toContain('Insufficient stock');
      expect(result.currentStock).toBe(product.stock); // 在庫は変更されない
    });
  });

  test.describe('安全在庫アラート', () => {
    test('should alert when stock falls below safety level', async () => {
      // Arrange
      const productId = 'P001';
      const product = simulator.getProduct(productId)!;
      const quantityToTakeBelowSafety = product.stock - product.safetyStock + 10;
      
      // Act
      const result = simulator.updateStock(productId, quantityToTakeBelowSafety, 'outbound', 'Large order');
      
      // Assert
      expect(result.success).toBeTruthy();
      expect(result.message).toContain('Below safety stock');
      expect(result.currentStock).toBeLessThan(product.safetyStock);
    });

    test('should recommend order when stock is low', async () => {
      // Arrange
      const productId = 'P001';
      const product = simulator.getProduct(productId)!;
      
      // 在庫を安全在庫以下にする
      simulator.updateStock(productId, product.stock - 50, 'outbound', 'Deplete stock');
      
      // Act
      const recommendation = simulator.getOrderRecommendation(productId);
      
      // Assert
      expect(recommendation.shouldOrder).toBeTruthy();
      expect(recommendation.recommendedQuantity).toBeGreaterThan(0);
      expect(recommendation.reason).toContain('below required');
    });
  });

  test.describe('同時更新（競合制御）', () => {
    test('should handle concurrent updates safely', async () => {
      // Arrange
      const productId = 'P001';
      const initialStock = simulator.getProduct(productId)!.stock;
      const concurrency = 50;
      
      // Act
      const result = await simulator.chaosTest(productId, concurrency);
      
      // Assert
      expect(result.totalAttempts).toBe(concurrency);
      expect(result.successCount + result.failureCount).toBe(concurrency);
      
      // 営業経験: 「在庫がマイナスにならないことが最重要」
      expect(result.finalStock).toBeGreaterThanOrEqual(0);
      
      // トランザクション記録の一貫性
      expect(result.transactionLog.length).toBe(result.successCount);
    });

    test('should maintain transaction integrity under load', async () => {
      // Arrange
      const productId = 'P002';
      
      // Act: 大量の同時更新
      await simulator.chaosTest(productId, 100);
      
      // Assert: トランザクション整合性検証
      const integrity = simulator.validateIntegrity(productId);
      
      // 営業経験: 「数字が合わないと信頼を失う」
      expect(integrity.isValid).toBeTruthy();
      expect(Math.abs(integrity.details.difference)).toBeLessThan(1);
    });
  });

  test.describe('需要予測', () => {
    test('should forecast demand based on history', async () => {
      // Arrange
      const productId = 'P001';
      
      // 過去のトランザクション記録を作成
      for (let i = 0; i < 10; i++) {
        simulator.updateStock(productId, 10, 'outbound', `Historical order ${i}`);
      }
      
      // Act
      const forecast = simulator.forecastDemand(productId, 30);
      
      // Assert
      expect(forecast).toBeGreaterThan(0);
      
      // 営業経験: 「過去平均×1.2が現実的」
      // 10回 × 10個 ÷ 10 = 平均10個/日
      // 30日 × 10個 × 1.2 = 360個
      expect(forecast).toBeCloseTo(360, 0);
    });

    test('should recommend order based on lead time', async () => {
      // Arrange
      const productId = 'P003'; // リードタイム30日の商品
      const product = simulator.getProduct(productId)!;
      
      // 在庫を減らす
      simulator.updateStock(productId, 30, 'outbound', 'Deplete stock');
      
      // Act
      const recommendation = simulator.getOrderRecommendation(productId);
      
      // Assert
      if (recommendation.shouldOrder) {
        // 営業経験: 「リードタイム分の需要 + 安全在庫が必要」
        expect(recommendation.recommendedQuantity).toBeGreaterThan(product.safetyStock);
      }
    });
  });

  test.describe('エッジケース（営業経験ベース）', () => {
    test('should handle zero stock gracefully', async () => {
      // Arrange
      const productId = 'P001';
      const product = simulator.getProduct(productId)!;
      
      // 在庫をゼロにする
      simulator.updateStock(productId, product.stock, 'outbound', 'Deplete to zero');
      
      // Act: ゼロ在庫からの出庫試行
      const result = simulator.updateStock(productId, 1, 'outbound', 'Order from zero stock');
      
      // Assert
      expect(result.success).toBeFalsy();
      expect(result.currentStock).toBe(0);
    });

    test('should handle large quantity orders', async () => {
      // Arrange
      const productId = 'P002';
      const largeQuantity = 10000;
      
      // Act: 大量入庫
      const result = simulator.updateStock(productId, largeQuantity, 'inbound', 'Bulk order');
      
      // Assert
      expect(result.success).toBeTruthy();
      expect(result.currentStock).toBeGreaterThan(largeQuantity);
    });

    test('should handle rapid sequential updates', async () => {
      // Arrange
      const productId = 'P001';
      const iterations = 100;
      
      // Act: 連続更新
      for (let i = 0; i < iterations; i++) {
        const quantity = i % 2 === 0 ? 10 : -5; // 入出を繰り返す
        const type = quantity > 0 ? 'inbound' : 'outbound';
        simulator.updateStock(productId, Math.abs(quantity), type, `Rapid update ${i}`);
      }
      
      // Assert: トランザクション記録の正確性
      const transactions = simulator.getTransactionHistory(productId);
      expect(transactions.length).toBeGreaterThanOrEqual(iterations);
      
      // 整合性検証
      const integrity = simulator.validateIntegrity(productId);
      expect(integrity.isValid).toBeTruthy();
    });
  });

  test.describe('レポート生成', () => {
    test('should generate comprehensive inventory report', async () => {
      // Arrange: いくつかの在庫を安全在庫以下にする
      simulator.updateStock('P001', 950, 'outbound', 'Large order');
      simulator.updateStock('P003', 35, 'outbound', 'Large order');
      
      // Act
      const report = simulator.generateReport();
      
      // Assert
      expect(report.products.length).toBeGreaterThan(0);
      expect(report.lowStockProducts.length).toBeGreaterThan(0);
      expect(report.orderRecommendations.length).toBeGreaterThan(0);
      expect(report.totalTransactions).toBeGreaterThan(0);
      
      // 営業経験: 「低在庫商品は発注推奨に含まれる」
      report.lowStockProducts.forEach(product => {
        const hasRecommendation = report.orderRecommendations.some(
          r => r.product.id === product.id
        );
        expect(hasRecommendation).toBeTruthy();
      });
    });
  });
});

/**
 * Why This Matters（営業17年の経験から）
 * 
 * 在庫管理の失敗パターン:
 * 1. 在庫数の不一致 → 顧客への説明コスト増
 * 2. 欠品 → 販売機会損失 → 売上減
 * 3. 過剰在庫 → キャッシュフロー悪化
 * 4. 発注タイミングミス → リードタイム考慮不足
 * 
 * このテストが守る価値:
 * - 数字の正確性（信頼の基盤）
 * - リアルタイム性（意思決定の速度）
 * - 予測可能性（計画的な調達）
 * 
 * RECERQAでの重要性:
 * AI統合SCMでは、これらの基本が完璧でないと
 * AIの予測精度も意味を持たない。
 */
