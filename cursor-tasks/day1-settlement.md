# 任务卡：日结模块完善

## 优先级：P0

## 背景
日结基础页面(app/settlement/index.tsx)和服务(services/stats-service.ts)已存在。
后端API已完整：GET/POST /api/daily-settlements + GET /api/dashboard/daily-report。
分身已修复：日结汇总现在包含REPAIR_INCOME（维修收入）。

## 现有文件（S2验证）
- ✅ app/settlement/index.tsx — 存在，基础日报展示（用yuan/formatDate）
- ✅ services/stats-service.ts — 存在，getDailyReport函数+DailyReport类型
- ✅ components/common/StatsCard.tsx — 存在
- ✅ components/common/PageHeader.tsx — 存在，showBack(boolean)
- ✅ lib/theme.ts — 导出BRAND_COLOR/BRAND_ACCENT/BrandPalette（没有COLORS）
- ✅ components/finance/AmountText.tsx — 存在
- ✅ components/common/NumericKeypad.tsx — 存在
- ❌ services/settlement-service.ts — 需新建
- ❌ types/settlement.ts — 需新建

## 后端API规格（S1验证，grep schema确认）

### GET /api/daily-settlements?organizationId=&storeId=&date=
返回：`{ items: DailySettlement[] }`
后端对Decimal字段做toNum转换后返回number。
GET返回全部字段（`...i`展开 + toNum转换7个Decimal字段）。

DailySettlement完整字段（grep prisma/schema.prisma确认）：
```
id(String), storeId(String), organizationId(String), date(DateTime)
settledById(String), settledAt(DateTime)
nextShiftId(String?)           ← 卡片1遗漏，已补
shiftStartedAt(DateTime?)     ← 卡片1遗漏，已补
shiftEndedAt(DateTime?)       ← 卡片1遗漏，已补
openingCash(Decimal→number), closingCash(Decimal→number)
expectedCash(Decimal→number), cashDifference(Decimal→number)
totalSales(Decimal→number), totalPurchases(Decimal→number)
totalRefunds(Decimal→number), totalExpenses(Decimal→number)
devicesIn(Int), devicesOut(Int)
paymentBreakdown(Json?)
discrepancyNote(String?)
isBalanced(Boolean), approvedById(String?), approvedAt(DateTime?)
status(String @default("PENDING"))  ← 不是枚举，是String
```

### POST /api/daily-settlements
body: `{ storeId, organizationId, openingCash(number), closingCash(number), discrepancyNote?(string) }`
返回：`{ success: "日结已创建", id, isBalanced, cashDifference }`
注意：success是string不是boolean。

### GET /api/dashboard/daily-report?organizationId=&storeId=&date=
参数名是`date`（不是dateStr）。
返回DailyReportPayload（与services/stats-service.ts中的DailyReport接口一致）：
```
{ date, purchase: {count,cost}, sales: {count,amount}, netCashFlow, profitTop5, stockAgeWarning, receivableDue, payableDue }
```

## 任务

### 1. 新建 types/settlement.ts
```typescript
export interface DailySettlement {
  id: string;
  storeId: string;
  organizationId: string;
  date: string;
  settledById: string;
  settledAt: string;
  nextShiftId?: string;        // 交接班关联
  shiftStartedAt?: string;
  shiftEndedAt?: string;
  openingCash: number;
  closingCash: number;
  expectedCash: number;
  cashDifference: number;
  totalSales: number;
  totalPurchases: number;
  totalRefunds: number;
  totalExpenses: number;
  devicesIn: number;
  devicesOut: number;
  paymentBreakdown?: Record<string, number>;
  discrepancyNote?: string;
  isBalanced: boolean;
  approvedById?: string;
  approvedAt?: string;
  status: string;  // "PENDING" | "APPROVED"，后端是String不是枚举
}
```

### 2. 新建 services/settlement-service.ts
封装日结API调用：
```typescript
import { api } from '../lib/api';
import type { DailySettlement } from '../types/settlement';

export async function getSettlementList(params: {
  organizationId: string;
  storeId: string;
  date?: string;
}): Promise<{ items: DailySettlement[] }> {
  const res = await api.get('/api/daily-settlements', { params });
  return res.data;
}

export async function createSettlement(params: {
  storeId: string;
  organizationId: string;
  openingCash: number;
  closingCash: number;
  discrepancyNote?: string;
}): Promise<{ success: string; id: string; isBalanced: boolean; cashDifference: number }> {
  const res = await api.post('/api/daily-settlements', params);
  return res.data;
}
```

### 3. 改造 app/settlement/index.tsx
当前：只展示daily-report概览数据（已有yuan/formatDate/printerService引用）
改造为3个Tab（用react-native-paper的SegmentedButtons切换）：

**Tab 1: 经营日报**（复用现有daily-report）
- 顶部：日期选择器（默认今天）
- 收支汇总卡片（用StatsCard）
- 库存变动
- 毛利TOP5（profitTop5数据）
- 预警提示

**Tab 2: 确认日结**
- 期初现金（TextInput + NumericKeypad）
- 期末现金（TextInput + NumericKeypad）
- 系统计算：应有现金 = 期初 + 收入 - 支出
- 差额：自动计算，红/绿色显示
- 备注（TextInput multiline，选填）
- 确认日结按钮（mutation → createSettlement）
- 今日已日结→显示日结结果，禁用确认按钮
  先查getSettlementList({ date: today })，有记录则展示

**Tab 3: 历史记录**
- getSettlementList → FlashList列表
- 每条：日期 / 总收入 / 总支出 / 差额 / 状态Badge
- 打印按钮（复用现有printerService.printDailySettlement）

### 4. UI规范
- ⚠️ 品牌色用 `import { BRAND_COLOR } from '../../lib/theme'`（不是COLORS）
- 金额显示用 AmountText 组件或 yuan() 函数
- 页面头部用 PageHeader，showBack={true}
- 空状态用 EmptyState，错误用 QueryError
- ⚠️ 现有代码有硬编码颜色(#fafaba等)，改造时替换为theme.colors引用

## 自审清单
- [ ] API路径与后端route.ts一致
- [ ] Decimal字段在后端已做toNum，前端接收number
- [ ] types字段与schema一致（含storeId/organizationId/nextShiftId/shiftStartedAt/shiftEndedAt/approvedById/approvedAt）
- [ ] 可选字段(String?/DateTime?)在type中用 `| null`（后端返回null不是undefined）
- [ ] status是String不是枚举（后端定义）
- [ ] import路径正确（BRAND_COLOR不是COLORS）
- [ ] 无硬编码颜色（现有#fafaba等需替换）
- [ ] 无Math.round用于金额（用yuan()函数）
- [ ] 金额显示用AmountText或yuan()
- [ ] POST返回success是string不是boolean
- [ ] GET返回用...i展开（所有schema字段都会出现，type不能遗漏）
- [ ] build通过：npx expo export --platform android
