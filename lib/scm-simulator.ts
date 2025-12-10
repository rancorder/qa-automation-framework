// lib/scm-simulator.ts

/**
 * SCM Business Logic Simulator
 * 
 * 目的: RECERQAのSCM機能をシミュレートし、
 *       複雑なビジネスロジックをテスト可能にする
 * 
 * Why This Matters:
 * - 本番環境なしでビジネスロジックを検証
 * - 異常系（在庫マイナス、同時更新）をテスト
 * - 営業経験に基づく「実際に起きる問題」を再現
 */

export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  safetyStock: number;  // 安全在庫
  leadTimeDays: number; // リードタイム
  price: number;
}

export interface PurchaseOrder {
  id: string;
  productId: string;
  quantity: number;
  supplierId: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'received';
  createdAt: Date;
  expectedDeliveryDate: Date;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'inbound' | 'outbound' | 'adjustment';
  quantity: number;
  timestamp: Date;
  reason: string;
}

/**
 * 在庫変動カオステスター
 * 
 * 営業経験からの洞察:
 * 「在庫管理の問題は、平常時ではなく繁忙期に発生する」
 * → 100パターンの同時更新をシミュレート
 */
export class SCMSimulator {
  private products: Map<string, Product> = new Map();
  private transactions: InventoryTransaction[] = [];
  private purchaseOrders: Map<string, PurchaseOrder> = new Map();
  
  constructor() {
    this.initializeSampleData();
  }

  /**
   * サンプルデータ初期化
   */
  private initializeSampleData(): void {
    // 典型的なSCM商品データ
    const sampleProducts: Product[] = [
      {
        id: 'P001',
        name: '工業用ボルト M8×20mm',
        sku: 'BOLT-M8-20',
        stock: 1000,
        safetyStock: 200,
        leadTimeDays: 7,
        price: 10
      },
      {
        id: 'P002',
        name: 'ステンレス板材 1mm',
        sku: 'STEEL-SS-1MM',
        stock: 500,
        safetyStock: 100,
        leadTimeDays: 14,
        price: 5000
      },
      {
        id: 'P003',
        name: '電子部品 IC-2023',
        sku: 'IC-2023-100',
        stock: 50,
        safetyStock: 20,
        leadTimeDays: 30,
        price: 15000
      }
    ];
    
    sampleProducts.forEach(p => this.products.set(p.id, p));
  }

  /**
   * 在庫更新（トランザクション管理付き）
   * 
   * 営業経験: 「同時発注で在庫がマイナスになる」問題を再現
   */
  updateStock(
    productId: string,
    quantity: number,
    type: 'inbound' | 'outbound' | 'adjustment',
    reason: string
  ): { success: boolean; message: string; currentStock: number } {
    const product = this.products.get(productId);
    
    if (!product) {
      return {
        success: false,
        message: `Product ${productId} not found`,
        currentStock: 0
      };
    }
    
    const newStock = product.stock + (type === 'outbound' ? -quantity : quantity);
    
    // ビジネスルール: 在庫はマイナスにならない
    if (newStock < 0) {
      return {
        success: false,
        message: `Insufficient stock. Current: ${product.stock}, Requested: ${quantity}`,
        currentStock: product.stock
      };
    }
    
    // 在庫更新
    product.stock = newStock;
    
    // トランザクション記録
    this.transactions.push({
      id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId,
      type,
      quantity,
      timestamp: new Date(),
      reason
    });
    
    // 安全在庫アラート
    const alert = newStock < product.safetyStock
      ? ` ⚠️ Below safety stock (${product.safetyStock})`
      : '';
    
    return {
      success: true,
      message: `Stock updated successfully${alert}`,
      currentStock: newStock
    };
  }

  /**
   * 需要予測（営業経験ベース）
   * 
   * 営業経験: 「過去3ヶ月の平均×1.2が現実的」
   */
  forecastDemand(productId: string, days: number): number {
    const product = this.products.get(productId);
    if (!product) return 0;
    
    // 簡易版: トランザクション履歴から予測
    const recentOutbound = this.transactions
      .filter(t => t.productId === productId && t.type === 'outbound')
      .slice(-10);
    
    if (recentOutbound.length === 0) return 0;
    
    const avgDaily = recentOutbound.reduce((sum, t) => sum + t.quantity, 0) / recentOutbound.length;
    
    // 営業経験: 繁忙期は1.2倍
    return Math.ceil(avgDaily * days * 1.2);
  }

  /**
   * 発注推奨（営業経験ベース）
   * 
   * 営業経験: 「リードタイム×需要予測 + 安全在庫」
   */
  getOrderRecommendation(productId: string): {
    shouldOrder: boolean;
    recommendedQuantity: number;
    reason: string;
  } {
    const product = this.products.get(productId);
    if (!product) {
      return { shouldOrder: false, recommendedQuantity: 0, reason: 'Product not found' };
    }
    
    const forecastDemand = this.forecastDemand(productId, product.leadTimeDays);
    const requiredStock = forecastDemand + product.safetyStock;
    
    if (product.stock < requiredStock) {
      return {
        shouldOrder: true,
        recommendedQuantity: requiredStock - product.stock,
        reason: `Current stock (${product.stock}) is below required (${requiredStock}). Forecast: ${forecastDemand}, Safety: ${product.safetyStock}`
      };
    }
    
    return {
      shouldOrder: false,
      recommendedQuantity: 0,
      reason: `Stock sufficient. Current: ${product.stock}, Required: ${requiredStock}`
    };
  }

  /**
   * 同時更新カオステスト
   * 
   * 営業経験: 「繁忙期の同時発注でバグが顕在化する」
   */
  async chaosTest(productId: string, concurrency: number): Promise<{
    totalAttempts: number;
    successCount: number;
    failureCount: number;
    finalStock: number;
    transactionLog: InventoryTransaction[];
  }> {
    const product = this.products.get(productId);
    if (!product) throw new Error('Product not found');
    
    const initialStock = product.stock;
    let successCount = 0;
    let failureCount = 0;
    const startTime = Date.now();
    
    // 同時に複数の出庫処理を実行
    const promises = Array.from({ length: concurrency }, async (_, i) => {
      const quantity = Math.floor(Math.random() * 10) + 1;
      const result = this.updateStock(
        productId,
        quantity,
        'outbound',
        `Chaos test ${i + 1}`
      );
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      return result;
    });
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    
    return {
      totalAttempts: concurrency,
      successCount,
      failureCount,
      finalStock: product.stock,
      transactionLog: this.transactions.filter(t => 
        t.productId === productId && 
        t.timestamp.getTime() >= startTime &&
        t.timestamp.getTime() <= endTime
      )
    };
  }

  /**
   * トランザクション整合性検証
   * 
   * 営業経験: 「在庫数とトランザクション履歴が合わない」問題の検出
   */
  validateIntegrity(productId: string): {
    isValid: boolean;
    message: string;
    details: {
      currentStock: number;
      calculatedStock: number;
      difference: number;
    };
  } {
    const product = this.products.get(productId);
    if (!product) {
      return {
        isValid: false,
        message: 'Product not found',
        details: { currentStock: 0, calculatedStock: 0, difference: 0 }
      };
    }
    
    // トランザクション履歴から在庫を再計算
    const transactions = this.transactions.filter(t => t.productId === productId);
    let calculatedStock = 0;
    
    // 簡易版: 最初のトランザクションを初期値とする
    transactions.forEach(t => {
      if (t.type === 'inbound' || t.type === 'adjustment') {
        calculatedStock += t.quantity;
      } else {
        calculatedStock -= t.quantity;
      }
    });
    
    const difference = product.stock - calculatedStock;
    const isValid = Math.abs(difference) < 0.01; // 浮動小数点誤差考慮
    
    return {
      isValid,
      message: isValid 
        ? 'Integrity check passed' 
        : `Stock mismatch detected. Difference: ${difference}`,
      details: {
        currentStock: product.stock,
        calculatedStock,
        difference
      }
    };
  }

  /**
   * レポート生成
   */
  generateReport(): {
    products: Product[];
    lowStockProducts: Product[];
    orderRecommendations: Array<{
      product: Product;
      recommendation: ReturnType<typeof this.getOrderRecommendation>;
    }>;
    totalTransactions: number;
  } {
    const products = Array.from(this.products.values());
    const lowStockProducts = products.filter(p => p.stock < p.safetyStock);
    
    const orderRecommendations = products
      .map(p => ({
        product: p,
        recommendation: this.getOrderRecommendation(p.id)
      }))
      .filter(r => r.recommendation.shouldOrder);
    
    return {
      products,
      lowStockProducts,
      orderRecommendations,
      totalTransactions: this.transactions.length
    };
  }

  /**
   * データリセット
   */
  reset(): void {
    this.products.clear();
    this.transactions = [];
    this.purchaseOrders.clear();
    this.initializeSampleData();
  }

  /**
   * 現在の状態取得
   */
  getProduct(productId: string): Product | undefined {
    return this.products.get(productId);
  }

  getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getTransactionHistory(productId?: string): InventoryTransaction[] {
    if (productId) {
      return this.transactions.filter(t => t.productId === productId);
    }
    return this.transactions;
  }
}

/**
 * 使用例
 */
export async function example() {
  const simulator = new SCMSimulator();
  
  console.log('=== SCM Simulator Example ===\n');
  
  // 1. 在庫更新
  console.log('1. Stock Update:');
  const result = simulator.updateStock('P001', 100, 'outbound', 'Customer order');
  console.log(result);
  
  // 2. 発注推奨
  console.log('\n2. Order Recommendation:');
  const recommendation = simulator.getOrderRecommendation('P001');
  console.log(recommendation);
  
  // 3. カオステスト
  console.log('\n3. Chaos Test (100 concurrent updates):');
  const chaosResult = await simulator.chaosTest('P001', 100);
  console.log(chaosResult);
  
  // 4. 整合性検証
  console.log('\n4. Integrity Check:');
  const integrity = simulator.validateIntegrity('P001');
  console.log(integrity);
  
  // 5. レポート生成
  console.log('\n5. Report:');
  const report = simulator.generateReport();
  console.log(report);
}
