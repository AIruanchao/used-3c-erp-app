# 任务卡：通知栏模块

## 优先级：P1

## 背景
通知栏是APP的核心信息入口，聚合3类通知：操作日志/系统预警/业务提醒。
后端AuditLog写入已完成（27处写入点，grep确认）。
AlertLog和CustomerNotification表已存在但零API。
NotificationTemplate已有CRUD API。
已有audit/export API（CSV导出）但**没有查询API**。
后端已有labelAuditAction函数翻译动作码为中文。

## 现有文件（S2验证）
- ✅ AuditLog表 — 存在，27处写入点（不含storeId字段，只有organizationId）
- ✅ AlertLog表 — 存在
- ✅ CustomerNotification表 — 存在
- ✅ src/app/api/notification-templates/route.ts — 存在（模板CRUD）
- ✅ src/app/api/audit/export/route.ts — 存在（CSV导出，参数：scope/storeId/from/to/actionContains/entityContains/sn）
- ✅ src/lib/audit-log.ts — 存在（createEntry等工具函数）
- ✅ src/lib/audit-payload-display.ts — 存在（labelAuditAction翻译函数）
- ❌ src/app/api/audit-logs/route.ts — 需新建（查询操作日志，JSON格式）
- ❌ src/app/api/alert-logs/route.ts — 需新建（查询预警）
- ❌ app/notification/index.tsx — 需新建
- ❌ services/notification-bar-service.ts — 需新建

## 后端Schema（S1验证，grep确认）

### AuditLog字段
```
id(String), organizationId(String?), userId(String?)
action(String), entityType(String), entityId(String?)
payload(String?)  ← JSON字符串，需要JSON.parse
ip(String?), userAgent(String?)
createdAt(DateTime), payloadSns(String[])
@@index([organizationId, createdAt])
@@index([userId, createdAt])
```
⚠️ AuditLog**没有storeId字段**，只有organizationId。查询时按organizationId过滤。

### AuditLog已有action值（从labelAuditAction翻译表grep确认）
INBOUND→入库, SALE→销售, SALE_BATCH→批量销售, TRADE_ORDER_COMPLETE→换机过账完成,
SHIPMENT_CREATE→创建发货单, HQ_LIST→总部点上架, PURCHASE_ORDER_CREATE→新建采购单,
GOODS_INBOUND_CREATE→新建数量入库单, GOODS_INBOUND_POST→数量入库过账,
SUPPLIER_CREATE→新增供货商, PURCHASE_RETURN_CREATE→新建采购退货单 等

### AlertLog字段
```
id(String), organizationId(String), alertType(String), severity(String)
entityType(String?), entityId(String?), fieldName(String?)
message(String), triggeredById(String?), triggeredAt(DateTime)
isRead(Boolean)
@@index([organizationId, isRead])
```
⚠️ AlertLog也**没有storeId字段**。

### CustomerNotification字段
```
id(String), organizationId(String), customerId(String)
channel(String), title(String), content(String)
isRead(Boolean @default(false)), sentAt(DateTime)
@@index([customerId, isRead])
@@index([organizationId])
```

## 任务

### Part A: 后端API（先做）

#### 1. 新建 src/app/api/audit-logs/route.ts
```typescript
// GET /api/audit-logs?organizationId=&action=&from=&to=&limit=50
// 查询操作日志（按organizationId过滤，不是storeId）
// 返回 { items: AuditLog[], total: number }
// 权限：getSessionUserId
// payload字段需要JSON.parse后返回（或前端解析）
```

#### 2. 新建 src/app/api/alert-logs/route.ts
```typescript
// GET /api/alert-logs?organizationId=&isRead=&severity=
// 返回 { items: AlertLog[] }
// PATCH /api/alert-logs  body: { ids: string[] }
// 标记已读
// 权限：getSessionUserId
```

### Part B: 前端

#### 3. 新建 services/notification-bar-service.ts
- `getAuditLogs(params)` → GET /api/audit-logs
- `getAlertLogs(params)` → GET /api/alert-logs
- `markAlertsRead(ids)` → PATCH /api/alert-logs

#### 4. 新建 app/notification/index.tsx
3个Tab（SegmentedButtons切换）：

**Tab 1: 操作日志**
- FlashList列表
- 每条：action中文翻译 / 时间 / payload摘要
- ⚠️ action翻译不在前端做，后端labelAuditAction只用于导出
- 前端自己维护一个翻译Map（从后端的动作展示复制关键项）：
  ```typescript
  const ACTION_LABELS: Record<string, string> = {
    INBOUND: "入库", SALE: "销售", SALE_BATCH: "批量销售",
    REPAIR_CALLBACK: "回访", REPAIR_CLOSE: "完工", REPAIR_CANCEL: "取消维修",
    REPAIR_PAYMENT: "收款", SHIPMENT_CREATE: "发货", HQ_LIST: "上架",
  };
  ```

**Tab 2: 系统预警**
- AlertLog列表（severity分色）
- ⚠️ **当前AlertLog零写入**（alert-trigger.ts全是TODO），列表会显示空
- 先实现UI框架，数据等后端实现触发逻辑后再填充
- 预警类型：INVENTORY_LOW→库存不足 / DEVICE_AGING→库龄过长 / ORDER_STATUS_CHANGE→订单变更 / PURCHASE_ARRIVAL→采购到货

**Tab 3: 业务提醒**（CustomerNotification）
- 通知列表
- 每条：title / content / sentAt / isRead

### 5. 添加入口
在app/(tabs)/index.tsx或Tab导航添加通知铃铛图标

### UI规范
- 品牌色用 `import { BRAND_COLOR } from '../../lib/theme'`
- 时间格式化用 formatDate from lib/utils
- 空状态用 EmptyState

## 自审清单
- [ ] AuditLog**没有storeId**，查询用organizationId
- [ ] AlertLog**没有storeId**，查询用organizationId
- [ ] payload是JSON字符串，前端需JSON.parse
- [ ] API权限getSessionUserId
- [ ] import路径正确（BRAND_COLOR）
- [ ] FlashList用于列表
- [ ] 无硬编码颜色（预警颜色除外）
- [ ] build通过
