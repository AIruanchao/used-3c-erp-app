# 任务卡：回收登记模块

## 优先级：P1

## 背景
回收登记Schema完整但**零API**。需要先建后端API再写前端。
Schema: TradeOrder + TradeInItem + TradeOutItem（已grep确认）

## 后端Schema（S1验证，grep prisma/schema.prisma确认）

### TradeOrder字段
```
id(String @id), storeId(String), organizationId(String)
customerName(String?), customerPhone(String?)
priceDifference(Decimal @default(0) @db.Decimal(14,2))
paymentMethod(String?), invoiceId(String?)
status: TradeOrderStatus @default(DRAFT)  ← 是枚举
userId(String), createdAt(DateTime), updatedAt(DateTime)
关联: Payment[], Shipment[], TradeInItem[], TradeOutItem[]
```

### TradeOrderStatus枚举（已确认存在）
```
DRAFT / COMPLETED / CANCELLED
```

### TradeInItem字段
```
id(String @id), tradeOrderId(String)
deviceId(String?), sn(String?), skuId(String?)
appraisedValue(Decimal @db.Decimal(14,2))  ← 必填，不是可选
condition(String?), note(String?)
inspectionResult(Json?)
marketRefPrice(Decimal? @db.Decimal(14,2))
tradeOfferPrice(Decimal? @db.Decimal(14,2))
photos(String[] @default([]))
关联: Device?, TradeOrder
```

### TradeOutItem字段
```
id(String @id), tradeOrderId(String)
deviceId(String)   ← 必填
salePrice(Decimal @db.Decimal(14,2))
关联: Device, TradeOrder
```

## 现有文件（S2验证）
- ✅ src/lib/session.ts — getSessionUserId + requireOrgMember函数存在
- ✅ src/lib/errors.ts — withErrorHandling等错误类
- ❌ src/app/api/trade-orders/route.ts — 需新建
- ❌ src/app/api/trade-orders/[id]/route.ts — 需新建
- ❌ src/actions/trade-order-actions.ts — 需新建
- ❌ app/trade/index.tsx — 需新建
- ❌ app/trade/new.tsx — 需新建
- ❌ services/trade-order-service.ts — 需新建
- ❌ types/trade-order.ts — 需新建

## 任务

### Part A: 后端API（先做）

#### 1. 新建 src/app/api/trade-orders/route.ts
```typescript
// GET: 查询回收订单列表
// ?organizationId=&storeId=&status=
// 返回 { items: TradeOrder[] }（include TradeInItem）

// POST: 创建回收订单
// body: { storeId, organizationId, customerName?, customerPhone?, items: TradeInItemInput[] }
// items中每个: { sn?, skuId?, appraisedValue, condition?, note?, inspectionResult?, marketRefPrice?, tradeOfferPrice?, photos? }
// 注意：appraisedValue是必填（Decimal）
```

#### 2. 新建 src/app/api/trade-orders/[id]/route.ts
```typescript
// GET: 获取回收订单详情（include TradeInItem + TradeOutItem + Payment）
// PATCH: 更新订单状态 { status: "COMPLETED" | "CANCELLED" }
// 完成时需创建Payment（参考repair-payment-actions.ts模式）
```

#### 3. 新建 src/actions/trade-order-actions.ts
- `createTradeOrder`: 创建回收单 + TradeInItem（在$transaction中）
- `completeTradeOrder`: 完成回收 → 更新status + 创建Payment
- 权限：getSessionUserId + requireOrgMember(organizationId)
- Payment创建参考repair-payment-actions.ts：
  ```typescript
  // 在tx中：
  // 1. TradeOrder update status → COMPLETED
  // 2. Payment.create({ saleOrderId/tradeOrderId, totalAmount, ... })
  // 3. PaymentItem.create({ paymentId, method, amount })
  // 4. LedgerEntry.create({ type: "SALE_INCOME", ... })
  ```

### Part B: 前端（后端完成后做）

#### 4. 新建 types/trade-order.ts
```typescript
export interface TradeOrder {
  id: string;
  storeId: string;
  organizationId: string;
  customerName?: string;
  customerPhone?: string;
  priceDifference: number;
  paymentMethod?: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  userId: string;
  createdAt: string;
  updatedAt: string;
  items?: TradeInItem[];
}
export interface TradeInItem {
  id: string;
  tradeOrderId: string;
  deviceId?: string;
  sn?: string;
  skuId?: string;
  appraisedValue: number;
  condition?: string;
  note?: string;
  inspectionResult?: Record<string, boolean>;
  marketRefPrice?: number;
  tradeOfferPrice?: number;
  photos?: string[];
}
```

#### 5. 新建 services/trade-order-service.ts
API封装

#### 6. 新建 app/trade/index.tsx
回收订单列表（FlashList + 3个Tab按状态筛选：全部/进行中/已完成）

#### 7. 新建 app/trade/new.tsx
回收登记流程（参考截图设计）：

**Section 1: 设备信息**（用FormSection组件）
- 型号选择（品类→品牌→型号，复用BrandModelPicker）
- IMEI/SN扫码（BarcodeScannerView）
- 成色选择

**Section 2: 功能检测（10项）**
每项用Switch/Toggle：正常/异常
- 屏幕 / 触摸 / 摄像头 / 充电 / WiFi
- 蓝牙 / 扬声器 / 麦克风 / 指纹面容 / 按键
- 存入inspectionResult(Json)：{ "screen": true, "touch": false, ... }

**Section 3: 评估定价**
- 市场参考价（TextInput numeric）→ marketRefPrice
- 回收报价（TextInput numeric）→ appraisedValue
- ⚠️ appraisedValue是必填字段（schema没有?标记）

**Section 4: 客户信息**
- 客户姓名/电话（TextInput，选填）

**Section 5: 拍照留档**
- PhotoPickerGrid（最多6张）
- 存入photos(String[])

**Section 6: 确认回收**
- 提交按钮 → createTradeOrder mutation

### 8. UI规范
- 品牌色用 `import { BRAND_COLOR } from '../../lib/theme'`
- Section用 FormSection 组件
- 金额输入用 TextInput keyboardType="decimal-pad"
- 金额显示用 AmountText
- 扫码用 BarcodeScannerView, onBarcodeScanned(code, format)
- 图片用 PhotoPickerGrid
- 空状态用 EmptyState

## 自审清单
- [ ] TradeOrder字段与schema一致（priceDifference有@default(0)）
- [ ] TradeInItem.appraisedValue是必填（没有?）
- [ ] TradeOrderStatus是枚举（DRAFT/COMPLETED/CANCELLED）
- [ ] Payment创建在$transaction中
- [ ] Decimal精度正确（@db.Decimal(14,2)）
- [ ] 权限：getSessionUserId + requireOrgMember
- [ ] import路径正确
- [ ] 无硬编码颜色
- [ ] FormSection props: { title: string, required?: boolean, children }
- [ ] build通过（后端npm run build + 前端npx expo export）
