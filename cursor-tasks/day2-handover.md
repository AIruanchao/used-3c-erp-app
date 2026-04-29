# 任务卡：交接班模块完善

## 优先级：P0

## 背景
交接班页面(app/handover/)和服务(services/handover-service.ts)已存在且功能基本完整。
后端API已完整：GET/POST /api/shift-handovers。
分身已修复：交接班现在查询维修中/待取机订单（存入pendingReturns）。

## 现有文件（S2验证）
- ✅ app/handover/index.tsx — 存在，交接班列表（用FlashList+AmountText）
- ✅ app/handover/new.tsx — 存在，新建交接班（选人+现金+钥匙+保险柜+备注）
- ✅ services/handover-service.ts — 存在，getHandoverList/createHandover/getStoreTeam
- ✅ types/handover.ts — 存在，HandoverItem+StoreTeamMember
- ✅ components/common/PageHeader.tsx — 存在
- ✅ components/finance/AmountText.tsx — 存在

## 后端Schema（S1验证，grep确认）

### ShiftHandover完整字段
```
id(String), storeId(String), organizationId(String)
fromUserId(String), toUserId(String), handoverAt(DateTime @default(now()))
pendingOrders(Json?)        ← 后端写入 { count: number }
pendingPickups(Json?)       ← 后端写入 { count: number }
pendingShipments(Json?)     ← 后端写入 { count: number }
pendingReturns(Json?)       ← 分身新增: { pendingRepairs: number, pendingPickupRepairs: number }
cashHandover(Decimal? @db.Decimal(14,2))
keyHandover(Boolean @default(false))
safeHandover(Boolean @default(false))
specialNotes(String?)
fromConfirmed(Boolean @default(false))
toConfirmed(Boolean @default(false))
status(String @default("PENDING"))  ← 是String不是枚举
```

### GET /api/shift-handovers?organizationId=&storeId=
返回：`{ items: ShiftHandover[] }`
后端GET只做cashHandover的Number转换，其他Json字段原样返回。

### POST /api/shift-handovers
body: `{ storeId, organizationId, toUserId, cashHandover?(number), keyHandover(boolean), safeHandover(boolean), specialNotes?(string) }`
返回：`{ ok: true, message: "交接已记录", id }`
注意：返回ok(boolean)不是success(string)。

## 任务

### 1. 更新 types/handover.ts
在HandoverItem中新增pendingReturns的类型：
```typescript
export interface PendingReturns {
  pendingRepairs: number;       // 维修中
  pendingPickupRepairs: number; // 待取机
}

// 在HandoverItem中增加：
export interface HandoverItem {
  // ... 保留现有字段 ...
  pendingReturns: PendingReturns | null;  // 新增
}
```
注意：不要删除现有字段，只新增pendingReturns。

### 2. 改造 app/handover/new.tsx
现有功能：选择接班人+现金+钥匙+保险柜+备注（已完整可用）
改造：增加**业务概况展示区**（POST创建后后端自动填充，但前端可以在创建前预览）

在提交按钮**上方**增加"今日业务概况"区块：
- 用useQuery调用getDailyReport获取今日数据
- 展示：入库X台 / 出库X台 / 净现金流¥X
- 展示：维修中X台（需要新增查询，暂用daily-report数据）

注意：
- 不要删除现有的任何功能（选人/现金/钥匙/保险柜/备注/提交）
- 新增的区块只是信息展示，不影响提交逻辑
- POST后后端会自动在pendingOrders/pendingReturns中填充实际数据

### 3. 改造 app/handover/index.tsx
增强列表展示：
- 点击展开详情时，显示pendingReturns中的维修数据
- 如果pendingRepairs > 0，显示"⚠️ 有{N}台维修中"
- 如果pendingPickupRepairs > 0，显示"📦 有{N}台待取机"
- ⚠️ 接班人确认：后端**没有PATCH endpoint**，toConfirmed/status无法更新。
  暂时只在UI上展示状态Badge（"待确认"/"已确认"），不实现确认按钮。
  后续需新建PATCH /api/shift-handovers/[id] 来支持接班确认。

注意：不要破坏现有的展开/折叠逻辑。

### 4. UI规范
- 品牌色用 `import { BRAND_COLOR } from '../../lib/theme'`（不是COLORS）
- 金额用 AmountText 组件
- 状态Badge用 StatusBadge（绿色/黄色）

## 自审清单
- [ ] pendingReturns是Json?类型（后端），前端用PendingReturns | null
- [ ] status是String不是枚举
- [ ] POST返回ok(boolean)不是success(string)
- [ ] 现有功能不删除，只增强
- [ ] types/handover.ts只新增字段，不删改现有
- [ ] import路径正确（BRAND_COLOR）
- [ ] 无硬编码颜色
- [ ] 现金金额无Math.round
- [ ] build通过
