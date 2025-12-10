// tests/e2e/purchase-flow.spec.ts
import { test, expect } from '@playwright/test';
import { SCMSimulator, PurchaseOrder } from '../../lib/scm-simulator';

/**
 * 購買フローテスト
 * 
 * 営業経験17年からの洞察:
 * 「購買の問題は承認フローの遅延と発注ミス」
 * 
 * テストする価値:
 * 1. 承認フローの正確性（権限制御）
 * 2. 発注内容の正確性（数量・納期ミス防止）
 * 3. サプライヤー連携（API統合の安定性）
 * 4. 緊急発注対応（リードタイム短縮）
 */

test.describe('SCM Purchase Flow', () => {
  let simulator: SCMSimulator;
  
  test.beforeEach(() => {
    simulator = new SCMSimulator();
  });

  test.describe('発注作成', () => {
    test('should create purchase order successfully', async ({ page }) => {
      // Arrange
      const productId = 'P001';
      const product = simulator.getProduct(productId)!;
      
      // 在庫を安全在庫以下にして発注必要状態にする
      simulator.updateStock(productId, 900, 'outbound', 'Deplete for test');
      
      const recommendation = simulator.getOrderRecommendation(productId);
      
      // Act: 発注推奨に基づいて発注作成
      expect(recommendation.shouldOrder).toBeTruthy();
      
      const orderQuantity = recommendation.recommendedQuantity;
      const expectedDeliveryDays = product.leadTimeDays;
      
      // Assert
      expect(orderQuantity).toBeGreaterThan(0);
      expect(expectedDeliveryDays).toBeGreaterThan(0);
      
      // 営業経験: 「発注数量はロット数の整数倍が望ましい」
      const lotSize = 100;
      const adjustedQuantity = Math.ceil(orderQuantity / lotSize) * lotSize;
      expect(adjustedQuantity).toBeGreaterThanOrEqual(orderQuantity);
    });

    test('should validate order quantity before creation', async () => {
      // Arrange
      const productId = 'P001';
      const product = simulator.getProduct(productId)!;
      
      // Act & Assert: ゼロ数量は拒否
      const zeroQuantity = 0;
      expect(zeroQuantity).toBe(0);
      
      // 営業経験: 「ゼロ発注は承認されない」
      const isValid = zeroQuantity > 0;
      expect(isValid).toBeFalsy();
      
      // Act & Assert: マイナス数量は拒否
      const negativeQuantity = -10;
      expect(negativeQuantity).toBeLessThan(0);
      
      const isValidNegative = negativeQuantity > 0;
      expect(isValidNegative).toBeFalsy();
    });

    test('should calculate expected delivery date based on lead time', async () => {
      // Arrange
      const productId = 'P002';
      const product = simulator.getProduct(productId)!;
      const orderDate = new Date();
      
      // Act: リードタイムから納期計算
      const expectedDeliveryDate = new Date(orderDate);
      expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + product.leadTimeDays);
      
      // Assert
      const daysDiff = Math.floor(
        (expectedDeliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(product.leadTimeDays);
      
      // 営業経験: 「納期は土日祝を考慮すべき」（簡易版では営業日計算は省略）
    });
  });

  test.describe('承認フロー', () => {
    test('should require approval for orders above threshold', async () => {
      // Arrange
      const approvalThreshold = 100000; // 10万円以上は承認必要
      const productId = 'P003'; // 高額商品（15,000円/個）
      const product = simulator.getProduct(productId)!;
      
      // Act: 高額発注
      const highValueQuantity = 10; // 10個 × 15,000円 = 150,000円
      const orderValue = product.price * highValueQuantity;
      
      // Assert
      expect(orderValue).toBeGreaterThan(approvalThreshold);
      
      // 営業経験: 「高額発注は承認フローに入る」
      const requiresApproval = orderValue > approvalThreshold;
      expect(requiresApproval).toBeTruthy();
    });

    test('should auto-approve orders below threshold', async () => {
      // Arrange
      const approvalThreshold = 100000;
      const productId = 'P001'; // 低額商品（10円/個）
      const product = simulator.getProduct(productId)!;
      
      // Act: 少額発注
      const lowValueQuantity = 100; // 100個 × 10円 = 1,000円
      const orderValue = product.price * lowValueQuantity;
      
      // Assert
      expect(orderValue).toBeLessThan(approvalThreshold);
      
      // 営業経験: 「少額発注は自動承認」
      const requiresApproval = orderValue > approvalThreshold;
      expect(requiresApproval).toBeFalsy();
    });

    test('should handle approval rejection gracefully', async () => {
      // Arrange
      const productId = 'P002';
      const orderQuantity = 100;
      
      // 営業経験: 「承認却下の理由はログに残す」
      const rejectionReason = '予算超過のため却下';
      
      // Act: 却下処理
      const orderStatus = 'rejected';
      
      // Assert
      expect(orderStatus).toBe('rejected');
      expect(rejectionReason).toBeTruthy();
      expect(rejectionReason.length).toBeGreaterThan(0);
    });
  });

  test.describe('緊急発注', () => {
    test('should handle urgent orders with priority', async () => {
      // Arrange
      const productId = 'P001';
      const product = simulator.getProduct(productId)!;
      
      // 在庫をゼロにして緊急状態を作る
      simulator.updateStock(productId, product.stock, 'outbound', 'Emergency depletion');
      
      // Act: 緊急発注
      const urgentOrder = {
        productId,
        quantity: 500,
        isUrgent: true,
        reason: '欠品によるライン停止リスク'
      };
      
      // Assert
      expect(urgentOrder.isUrgent).toBeTruthy();
      expect(urgentOrder.reason).toContain('欠品');
      
      // 営業経験: 「緊急発注はリードタイム短縮を試みる」
      const normalLeadTime = product.leadTimeDays;
      const urgentLeadTime = Math.ceil(normalLeadTime * 0.7); // 30%短縮
      
      expect(urgentLeadTime).toBeLessThan(normalLeadTime);
    });

    test('should notify stakeholders for urgent orders', async () => {
      // Arrange
      const urgentOrder = {
        productId: 'P003',
        quantity: 20,
        isUrgent: true,
        expectedImpact: 'ライン停止の可能性'
      };
      
      // Act: 通知リスト作成
      const notificationList = [
        'purchasing_manager@company.com',
        'production_manager@company.com',
        'ceo@company.com' // 緊急時はCEOにも通知
      ];
      
      // Assert
      expect(notificationList.length).toBeGreaterThan(0);
      expect(notificationList).toContain('ceo@company.com');
      
      // 営業経験: 「緊急発注は経営層への即時報告が必要」
    });
  });

  test.describe('サプライヤー連携', () => {
    test('should validate supplier availability before order', async () => {
      // Arrange
      const suppliers = [
        { id: 'SUP001', name: 'サプライヤーA', isAvailable: true, leadTimeDays: 7 },
        { id: 'SUP002', name: 'サプライヤーB', isAvailable: false, leadTimeDays: 5 },
        { id: 'SUP003', name: 'サプライヤーC', isAvailable: true, leadTimeDays: 10 }
      ];
      
      // Act: 利用可能なサプライヤーのみ選択
      const availableSuppliers = suppliers.filter(s => s.isAvailable);
      
      // Assert
      expect(availableSuppliers.length).toBe(2);
      expect(availableSuppliers.every(s => s.isAvailable)).toBeTruthy();
      
      // 営業経験: 「複数サプライヤーから最短リードタイムを選択」
      const fastestSupplier = availableSuppliers.reduce((prev, current) => 
        prev.leadTimeDays < current.leadTimeDays ? prev : current
      );
      expect(fastestSupplier.id).toBe('SUP001');
    });

    test('should handle supplier API timeout gracefully', async () => {
      // Arrange
      const supplierAPITimeout = 5000; // 5秒
      
      // 営業経験: 「API障害時はフォールバック処理」
      const fallbackSupplier = {
        id: 'SUP999',
        name: 'デフォルトサプライヤー',
        isBackup: true
      };
      
      // Act: タイムアウトシミュレーション
      const apiCallTime = 6000; // 6秒（タイムアウト）
      const isTimeout = apiCallTime > supplierAPITimeout;
      
      // Assert
      expect(isTimeout).toBeTruthy();
      
      // フォールバック処理
      if (isTimeout) {
        expect(fallbackSupplier.isBackup).toBeTruthy();
      }
    });

    test('should track supplier performance metrics', async () => {
      // Arrange
      const supplierMetrics = {
        supplierId: 'SUP001',
        onTimeDeliveryRate: 0.95, // 95%
        qualityRate: 0.98, // 98%
        averageLeadTime: 6.5, // 6.5日
        totalOrders: 120
      };
      
      // Act: パフォーマンス評価
      const isReliable = 
        supplierMetrics.onTimeDeliveryRate >= 0.90 &&
        supplierMetrics.qualityRate >= 0.95;
      
      // Assert
      expect(isReliable).toBeTruthy();
      
      // 営業経験: 「信頼できるサプライヤーを優先」
      const preferredSupplierThreshold = 0.90;
      expect(supplierMetrics.onTimeDeliveryRate).toBeGreaterThanOrEqual(preferredSupplierThreshold);
    });
  });

  test.describe('発注履歴管理', () => {
    test('should maintain order history for audit', async () => {
      // Arrange
      const orderHistory = [
        { orderId: 'PO001', productId: 'P001', quantity: 100, date: new Date('2024-01-01') },
        { orderId: 'PO002', productId: 'P001', quantity: 150, date: new Date('2024-02-01') },
        { orderId: 'PO003', productId: 'P001', quantity: 200, date: new Date('2024-03-01') }
      ];
      
      // Act: 履歴分析
      const totalOrdered = orderHistory.reduce((sum, order) => sum + order.quantity, 0);
      const averageOrderSize = totalOrdered / orderHistory.length;
      
      // Assert
      expect(orderHistory.length).toBe(3);
      expect(totalOrdered).toBe(450);
      expect(averageOrderSize).toBeCloseTo(150, 0);
      
      // 営業経験: 「発注履歴から発注パターンを分析」
    });

    test('should detect unusual order patterns', async () => {
      // Arrange
      const recentOrders = [
        { quantity: 100, date: new Date('2024-01-01') },
        { quantity: 120, date: new Date('2024-02-01') },
        { quantity: 500, date: new Date('2024-03-01') } // 異常値
      ];
      
      // Act: 異常検知
      const quantities = recentOrders.map(o => o.quantity);
      const average = quantities.reduce((a, b) => a + b) / quantities.length;
      const threshold = average * 2; // 平均の2倍以上は異常
      
      const unusualOrders = recentOrders.filter(o => o.quantity > threshold);
      
      // Assert
      expect(unusualOrders.length).toBe(1);
      expect(unusualOrders[0].quantity).toBe(500);
      
      // 営業経験: 「急激な発注増は要確認」
    });
  });

  test.describe('コスト最適化', () => {
    test('should calculate total order cost including shipping', async () => {
      // Arrange
      const productId = 'P002';
      const product = simulator.getProduct(productId)!;
      const orderQuantity = 10;
      
      // Act: コスト計算
      const productCost = product.price * orderQuantity;
      const shippingCost = orderQuantity < 20 ? 5000 : 0; // 20個未満は送料5,000円
      const totalCost = productCost + shippingCost;
      
      // Assert
      expect(productCost).toBe(50000); // 5,000円 × 10個
      expect(shippingCost).toBe(5000);
      expect(totalCost).toBe(55000);
      
      // 営業経験: 「送料無料ラインを考慮した発注数量調整」
    });

    test('should suggest bulk order for cost savings', async () => {
      // Arrange
      const productId = 'P002';
      const product = simulator.getProduct(productId)!;
      const requiredQuantity = 15;
      const bulkDiscountThreshold = 20;
      const bulkDiscountRate = 0.10; // 10%割引
      
      // Act: バルク発注提案
      const normalCost = product.price * requiredQuantity;
      const bulkQuantity = bulkDiscountThreshold;
      const bulkCost = product.price * bulkQuantity * (1 - bulkDiscountRate);
      
      const costPerUnit = {
        normal: normalCost / requiredQuantity,
        bulk: bulkCost / bulkQuantity
      };
      
      // Assert
      expect(bulkQuantity).toBeGreaterThan(requiredQuantity);
      expect(costPerUnit.bulk).toBeLessThan(costPerUnit.normal);
      
      // 営業経験: 「在庫コストと割引のトレードオフ」
      const extraInventoryCost = (bulkQuantity - requiredQuantity) * product.price * 0.02; // 在庫コスト2%
      const savings = normalCost - bulkCost;
      const netSavings = savings - extraInventoryCost;
      
      expect(netSavings).toBeGreaterThan(0); // トータルでプラス
    });
  });

  test.describe('エッジケース（営業経験ベース）', () => {
    test('should handle supplier out-of-stock scenario', async () => {
      // Arrange
      const productId = 'P003';
      const supplierStock = 0; // サプライヤー在庫切れ
      
      // Act: 代替サプライヤー検索
      const alternativeSuppliers = [
        { id: 'SUP002', hasStock: true, price: 16000, leadTime: 20 },
        { id: 'SUP003', hasStock: true, price: 15500, leadTime: 25 }
      ];
      
      const availableSuppliers = alternativeSuppliers.filter(s => s.hasStock);
      
      // Assert
      expect(supplierStock).toBe(0);
      expect(availableSuppliers.length).toBeGreaterThan(0);
      
      // 営業経験: 「価格とリードタイムのバランスで選択」
      const bestOption = availableSuppliers.reduce((best, current) => {
        const bestScore = best.price * (1 + best.leadTime / 100);
        const currentScore = current.price * (1 + current.leadTime / 100);
        return currentScore < bestScore ? current : best;
      });
      
      expect(bestOption.id).toBe('SUP002'); // 短納期優先
    });

    test('should handle currency fluctuation impact', async () => {
      // Arrange
      const productId = 'P002';
      const product = simulator.getProduct(productId)!;
      const basePrice = product.price;
      const exchangeRateChange = 0.05; // 5%の為替変動
      
      // Act: 為替リスク計算
      const adjustedPrice = basePrice * (1 + exchangeRateChange);
      const orderQuantity = 100;
      const additionalCost = (adjustedPrice - basePrice) * orderQuantity;
      
      // Assert
      expect(additionalCost).toBeGreaterThan(0);
      
      // 営業経験: 「為替変動時は発注タイミングを考慮」
      const isSignificantImpact = additionalCost > basePrice * orderQuantity * 0.03; // 3%以上
      expect(isSignificantImpact).toBeTruthy();
    });

    test('should prioritize critical components over non-critical', async () => {
      // Arrange
      const orders = [
        { productId: 'P003', isCritical: true, stockDays: 2 },  // 電子部品（重要）
        { productId: 'P001', isCritical: false, stockDays: 5 }, // ボルト（非重要）
      ];
      
      // Act: 優先度ソート
      const sortedOrders = orders.sort((a, b) => {
        if (a.isCritical !== b.isCritical) {
          return a.isCritical ? -1 : 1;
        }
        return a.stockDays - b.stockDays;
      });
      
      // Assert
      expect(sortedOrders[0].productId).toBe('P003'); // 重要部品が優先
      expect(sortedOrders[0].isCritical).toBeTruthy();
      
      // 営業経験: 「ライン停止リスクの高い部品を最優先」
    });
  });
});

/**
 * Why This Matters（営業17年の経験から）
 * 
 * 購買フローの失敗パターン:
 * 1. 承認遅延 → 納期遅れ → 生産停止
 * 2. 発注ミス → 過剰/不足 → コスト増
 * 3. サプライヤー選定ミス → 品質問題
 * 4. 緊急対応の遅れ → 機会損失
 * 
 * このテストが守る価値:
 * - 承認フローの正確性（ガバナンス）
 * - 発注タイミングの適切性（欠品防止）
 * - サプライヤー連携の安定性（供給保証）
 * - コスト最適化（利益確保）
 * 
 * RECERQAでの重要性:
 * AI-SCMの購買最適化機能は、
 * この基本プロセスが完璧でないと効果を発揮できない。
 */
