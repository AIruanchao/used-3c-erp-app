# 任务卡：质保查询模块

## 优先级：P1

## 背景
质保查询后端API已完整：GET /api/repair/check-warranty?sn=XXX
分身已修复：现在返回repairHistory（最近10条维修记录）
前端无现有页面，需新建。

## 现有文件（S2验证）
- ✅ services/repair-service.ts — 存在，有createRepair等函数
- ✅ components/scanner/BarcodeScannerView.tsx — 存在，props: { onBarcodeScanned(code,format), isActive? }
- ✅ components/common/PageHeader.tsx — 存在，showBack(boolean)
- ✅ components/common/EmptyState.tsx — 存在
- ✅ components/common/StatusBadge.tsx — 存在，props: { status: string, variant? }
- ✅ lib/theme.ts — 导出BRAND_COLOR
- ❌ app/warranty/index.tsx — 需新建
- ❌ services/warranty-service.ts — 需新建

## 后端API规格（S1验证，grep确认）

### GET /api/repair/check-warranty?sn=XXX
返回：
```typescript
{
  found: boolean;
  deviceId?: string;
  isInWarranty?: boolean;
  warrantyType?: 'STORE' | 'MANUFACTURER' | 'NONE';  // WarrantyType枚举
  warrantyTypeLabel?: string;     // "店保"|"厂保"|"无保"
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyDays?: number;
  warrantyLabel?: string;         // "保修期内-店保"|"已过保"
  repairHistory?: Array<{
    id: string;
    orderNo: string;
    status: string;               // 注意：是String不是枚举
    createdAt: string;
    completedAt: string | null;
  }>;
}
```
注意：
- RepairOrder没有deletedAt字段（分身已去除该过滤条件）
- RepairOrder.status是String不是枚举（默认"REGISTERED"）
- RepairOrder.deviceId是String?（可选）

## 任务

### 1. 新建 services/warranty-service.ts
```typescript
import { api } from '../lib/api';

export interface WarrantyResult {
  found: boolean;
  deviceId?: string;
  isInWarranty?: boolean;
  warrantyType?: string;
  warrantyTypeLabel?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyDays?: number;
  warrantyLabel?: string;
  repairHistory?: Array<{
    id: string;
    orderNo: string;
    status: string;
    createdAt: string;
    completedAt: string | null;
  }>;
}

export async function checkWarranty(sn: string): Promise<WarrantyResult> {
  const res = await api.get(`/api/repair/check-warranty?sn=${encodeURIComponent(sn)}`);
  return res.data;
}
```

### 2. 新建 app/warranty/index.tsx

**顶部：搜索栏**
- TextInput + 扫码按钮
- 扫码调用BarcodeScannerView，回调onBarcodeScanned(code, format)
- 搜索按钮 → 调用checkWarranty(sn)

**结果区域（found=true时显示）**：

**卡片1: 设备保修信息**
- 保修状态：用warrantyLabel显示（"保修期内-店保"绿色/"已过保"红色）
- 保修类型：warrantyTypeLabel
- 保修起止日期：formatDate(warrantyStartDate) ~ formatDate(warrantyEndDate)
- 保修天数：warrantyDays + "天"

**卡片2: 维修记录**
- repairHistory列表
- 每条：工单号orderNo / StatusBadge(status) / formatDate(createdAt) / completedAt
- 维修状态翻译：
  - REGISTERED → "已登记"
  - IN_PROGRESS → "维修中"
  - COMPLETED → "已完成"
  - CANCELLED → "已取消"
- 空状态："无维修记录"

**底部操作**
- "创建维修单"按钮 → router.push(`/repair/new?deviceId=${deviceId}`)
  注意：现有repair/new页面可能需要适配deviceId参数
- "打印保修凭证"按钮 → 暂时Alert.alert("功能开发中")

**未找到（found=false）**
- EmptyState: "未找到该设备，请确认IMEI/SN是否正确"

### 3. 在首页添加入口
在app/(tabs)/index.tsx的快捷操作区添加"质保查询"按钮。
用已有的快捷操作样式（参考现有按钮），导航到/warranty。
图标用"shield-check"（react-native-paper自带）。

### 4. UI规范
- 品牌色用 `import { BRAND_COLOR } from '../../lib/theme'`
- 日期格式化用 formatDate from lib/utils
- 状态Badge用 StatusBadge
- 扫码用 BarcodeScannerView，回调签名 onBarcodeScanned(code: string, format: string)

## 自审清单
- [ ] API路径 /repair/check-warranty 正确
- [ ] sn参数用encodeURIComponent编码
- [ ] repairHistory中status是String不是枚举
- [ ] RepairOrder没有deletedAt字段
- [ ] import路径正确（BRAND_COLOR不是COLORS）
- [ ] BarcodeScannerView回调签名正确(code,format)
- [ ] StatusBadge props正确(status:string)
- [ ] 无硬编码颜色
- [ ] build通过
