# 任务卡：找货卖货模块

## 优先级：P2

## 背景
找货卖货=同行市集，核心是"帮别的店找货"和"把库存共享给同行"。
后端已有：Device.franchiseListingStatus + BatchListing API(批量上/下架) + ListingSyncOutbox + hqListDevice/hqDelistDevice。
前端marketplace页面目前是占位页面（"即将上线"）。
⚠️ 批量上架需要**总部门店权限**(hq:listing_publish)，非总部不能上架。

## 现有文件（S2验证）
- ✅ Device.franchiseListingStatus — FranchiseListingStatus枚举(NOT_LISTED/LISTED/DELISTED)
- ✅ Device.findMyDeviceOff — Boolean @default(false)
- ✅ Device.platformListings — Json?
- ✅ Device.marketRefPrice — Decimal? @db.Decimal(14,2)
- ✅ Device.skuId → Sku → Sku.modelId → Model.name（型号名通过Sku关联Model）
- ✅ src/app/api/inventory/batch-listing/route.ts — 批量上/下架（需总部门店+hq:listing_publish权限）
- ✅ src/lib/inventory.ts — hqListDevice/hqDelistDevice（校验总部+在库状态）
- ✅ app/(tabs)/marketplace.tsx — 存在（占位页面，用BRAND_COLOR）
- ✅ components/device/DeviceCard.tsx — 存在
- ❌ src/app/api/marketplace/search/route.ts — 需新建
- ❌ src/app/api/marketplace/my-listings/route.ts — 需新建
- ❌ services/marketplace-service.ts — 需新建

## 后端Schema（S1验证，grep确认）

### Device listing相关字段
```
franchiseListingStatus: FranchiseListingStatus @default(NOT_LISTED)
findMyDeviceOff: Boolean @default(false)
platformListings: Json?
marketRefPrice: Decimal? @db.Decimal(14,2)
skuId: String?  → Sku → Sku.modelId → Model.name
inventoryStatus: InventoryStatus @default(IN_STOCK)
```

### FranchiseListingStatus枚举
```
NOT_LISTED / LISTED / DELISTED
```

### BatchListing POST API
路径：POST /api/inventory/batch-listing
body: `{ storeId, ids: string[], action: "LIST" | "DELIST" }`
权限：userHasPermissionOnStore(uid, storeId, "hq:listing_publish") + 总部门店(store.Organization.isHeadquarters)
返回：`{ ok, requested, processed, succeeded, skipped, failed, succeededSns, skippedDetails, errors }`

## 任务

### Part A: 后端API

#### 1. 新建 src/app/api/marketplace/search/route.ts
找货搜索：查询其他门店已上架的设备
```typescript
// GET /api/marketplace/search?organizationId=&keyword=&brandId=&categoryId=&minPrice=&maxPrice=
// 查询: Device where {
//   franchiseListingStatus: "LISTED",
//   inventoryStatus: "IN_STOCK",
//   storeId != currentUserStoreId,  // 排除本店
//   organizationId: currentUserOrgId
// }
// include: { Sku: { include: { Model: true } }, Store: true }
// ⚠️ Device.skuId是String?（可选），skuId为null时无法关联Model，需返回"未知型号"
// 返回设备列表（型号名=Model.name ?? "未知型号"、门店名=Store.name、marketRefPrice）
// 权限: getSessionUserId
```

#### 2. 新建 src/app/api/marketplace/my-listings/route.ts
我的上架列表
```typescript
// GET /api/marketplace/my-listings?organizationId=&storeId=
// 查询: Device where { franchiseListingStatus: "LISTED", storeId }
// include: { Sku: { include: { Model: true } } }
// 返回设备列表 + 型号名
```

### Part B: 前端

#### 3. 新建 services/marketplace-service.ts
```typescript
import { api } from '../lib/api';

export async function searchMarketplace(params: {
  organizationId: string;
  storeId: string;  // 用于排除本店
  keyword?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const res = await api.get('/api/marketplace/search', { params });
  return res.data;
}

export async function getMyListings(params: {
  organizationId: string;
  storeId: string;
}) {
  const res = await api.get('/api/marketplace/my-listings', { params });
  return res.data;
}

export async function batchListDevices(params: {
  storeId: string;
  ids: string[];
  action: 'LIST' | 'DELIST';
}) {
  const res = await api.post('/api/inventory/batch-listing', params);
  return res.data;
}
```

#### 4. 改造 app/(tabs)/marketplace.tsx
从占位页面改为功能页面，2个Tab（SegmentedButtons切换）：

**Tab 1: 找货（同行库存搜索）**
- SearchBar搜索栏
- 筛选：品类/品牌/价格区间（AdvancedFilterSheet或BottomSheetFilter）
- 搜索结果（FlashList）
- 每条设备卡片：
  - 型号名（从Model.name）
  - marketRefPrice（参考价）
  - 所属门店名（Store.name）
  - "联系卖家"按钮（Alert.alert("功能开发中")）

**Tab 2: 卖货（我的上架管理）**
- 顶部统计：已上架X台
- "上架设备"按钮 → Alert提示"请从库存列表选择设备上架"（暂不实现选择器）
- 已上架列表（FlashList）
- 每条：型号名 / 参考价
- 滑动操作：下架（调用batchListDevices({ action: "DELIST" })）
- ⚠️ 需要总部门店权限，非总部显示"仅总部可上架"

### 5. UI规范
- 品牌色用 `import { BRAND_COLOR } from '../../lib/theme'`
- 列表用 TypedFlashList（从../../components/ui/TypedFlashList导入）
- 价格用 AmountText
- 空状态用 EmptyState
- 搜索用 SearchBar（components/common/SearchBar.tsx）
- 筛选用 AdvancedFilterSheet 或 BottomSheetFilter

## 自审清单
- [ ] FranchiseListingStatus枚举值正确（NOT_LISTED/LISTED/DELISTED）
- [ ] BatchListing需要总部门店+hq:listing_publish权限（前端提示）
- [ ] 找货搜索排除本店设备（storeId过滤）
- [ ] 型号名通过Device.skuId→Sku→Model.name关联（不是直接字段）
- [ ] marketRefPrice是可选字段（Decimal?）
- [ ] import路径正确（BRAND_COLOR不是COLORS）
- [ ] TypedFlashList从正确路径导入
- [ ] 无硬编码颜色
- [ ] build通过
