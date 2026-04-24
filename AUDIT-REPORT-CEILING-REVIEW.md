# 天花板方案 · 修复后复审报告（Ceiling Review）

> 复审目标：在“上线阻断项（P0）+ 天花板基线”维度，验证已修复项是否**真实闭环**，并记录**证据点**、**残余风险**与**下一步建议**。
>
> 复审范围：`/Users/mac/used-3c-erp-app/`（以代码为准；运行时/后端合同需另行验收）
>
> 复审日期：2026-04-24

---

## 结论总览

- **P0-Auth/Cookie**：已完成“兼容 cookie 名 + 禁止伪造 token + 失败即失败”的代码闭环；仍需验证**真机能否读取 `Set-Cookie`**（这是部署/运行时合同问题）。
- **P0-401 自动登出闭环**：已升级为 **logout + Query cache clear + replace login**，并统一路由 `/(auth)/login`。
- **P0-金额止血线**：已实现“输入白名单 + finite + 上限”并覆盖入库/收银/维修报价；但目前仍以 `number` 传输/提交（止血线已做，端到端 Decimal 体系仍未完全落地）。
- **P0-打印稳定性**：已移除对 `btoa/TextEncoder` 的运行时依赖，新增 BLE 分片写入；仍需验证**中文编码/机型 UUID/MTU**。
- **P0-切店/换号串数据**：已把 `storeId` 纳入关键 queryKey，且切店会 `queryClient.clear()`；降低“闪现/串店”风险。
- **离线队列路径注入**：已加入 action type 白名单，拒绝任意路径拼接。

---

## 证据与校验点（代码级）

### 1) 收银支付字段名（`Payment` → `payment`）

- **结论**：代码中已不再出现 `Payment:` 入参（仅旧审计报告中出现）。
- **证据**：
  - 全仓 `Payment:` 只命中 `AUDIT-REPORT.md` 的历史描述（无实际代码命中）。
  - `types/api.ts`：`CashierRequest.payment: Array<{...}>`
  - `app/cashier.tsx`：提交字段为 `payment: [{ method, amount }]`

### 2) 库存/出库/设备详情 queryKey 纳入 storeId

- **结论**：关键 queryKey 已包含 `storeId`，避免切店/换号复用缓存。
- **证据（关键位置）**：
  - `app/(tabs)/inventory.tsx`：`['inventorySearch', storeId, organizationId, search]`
  - `app/(tabs)/outbound.tsx`：`['outboundSearch', storeId, organizationId, search]`
  - `app/device/[id].tsx`：`['device', id, storeId, organizationId]`

### 3) 401 自动登出闭环与路由一致性

- **结论**：401 触发时跳转路由已统一 `/(auth)/login`，并通过 root 注册的 `logoutRef` 执行全量清理（含 Query cache）。
- **证据（关键位置）**：
  - `lib/api.ts`：`globalNavigationRef('/(auth)/login')`
  - `app/_layout.tsx`：`fullLogout = logout(); queryClient.clear(); router.replace('/(auth)/login')`，并 `setLogoutRef(fullLogout)`

### 4) 离线队列 action type 白名单

- **结论**：已阻断 `POST /api/${action.type}` 任意拼接风险。
- **证据（关键位置）**：
  - `hooks/useOffline.ts`：`OFFLINE_ACTION_WHITELIST` + `isAllowedActionType()` + `enqueueAction` 拒绝非白名单

### 5) 打印：移除 `btoa/TextEncoder` 依赖 + 分片写入

- **结论**：
  - Base64：已使用 `uint8ArrayToBase64()`（纯 JS）替代 `btoa`
  - 编码：已使用 `encodeUtf8()`（纯 JS）替代 `TextEncoder`
  - BLE 写入：已按 `CHUNK_SIZE=180` 分片写入并带片内重试/片间延迟
- **证据（关键位置）**：
  - `services/printer-service.ts`：`writeToPrinter()` 内分片写入、`uint8ArrayToBase64()`、`encodeUtf8()`

### 6) 金额止血线：输入白名单 + finite + 上限

- **结论**：入库/收银/维修报价已统一使用 `isValidMoneyInput()` 做输入白名单与有限性校验，禁止科学计数法/Infinity/多小数位。
- **证据（关键位置）**：
  - `lib/utils.ts`：`isValidMoneyInput()`（`MONEY_RE` + `Number.isFinite` + `MAX_MONEY`）
  - `app/(tabs)/inbound.tsx`：unitCost/peerPrice/retailPrice 走 `isValidMoneyInput`
  - `app/cashier.tsx`：salePrice 走 `isValidMoneyInput`
  - `app/repair/[id].tsx`：labor/partCost/partPrice 走 `isValidMoneyInput`

---

## 残余风险（仍需验收/仍未达“端到端天花板”）

### A) Auth（运行时/后端合同）

- **仍需验收**：React Native 环境下 axios 是否能可靠读取 `Set-Cookie`（不同网关/HTTP2/拦截器可能导致不可见）。
- **仍需验收**：cookie 可能不止 session-token，服务端是否要求同时携带 csrf-token（若要求，应扩展“白名单 cookie 集合”一起注入）。
- **已止血**：登录请求已改为手工 form-urlencoded 拼接，避免 `URLSearchParams` 运行时缺失风险（仍需真机回归）。

### B) 金额（端到端 Decimal 体系）

- **现状定位**：本次实现是“止血线”（输入严校验 + finite），但请求仍以 `number` 发送，仍存在浮点表示的边界风险。
- **建议下一步（天花板）**：金额在接口层统一用 string（或 Decimal-like），展示用格式化，计算尽可能服务端完成。

### C) 打印（机型/编码/UUID）

- **仍需验收**：
  - 中文编码/码页与打印机型号适配（当前仍是 ESC/POS 基础模式）
  - 固定 UUID 仅适配部分 BLE 打印机；需形成“现场型号白名单”
  - 分片参数（180/20ms）在目标机型上需做 10 连长小票验证

### D) findOrCreateCustomer（本质仍需后端原子接口）

- **改动**：前端 take 从 20 提升到 50，降低漏命中概率。
- **残余风险**：仍然不是原子查重；根治需要后端提供 by-phone 精确查询或 find-or-create 原子接口。

---

## 建议的“天花板验收脚本”（非代码）

> 本节用于把代码复审落到可执行验收；任何失败都应按模块降级/No-Go 处理。

1. **Auth**：生产真机登录 → 校验业务请求携带 Cookie → 冷启动后仍可用
2. **401**：制造 401 → 自动登出回登录 → 换号登录后库存搜索页不闪旧数据
3. **金额**：入库/收银各用 `0.1/0.2/99.99` 走一笔 → 后台核对落库到分一致且无 NaN
4. **切店**：门店 A 搜索 SN 有结果 → 切到门店 B → 同 SN 不得复用 A 缓存
5. **打印**：Android 真机长中文小票 10 连，不半张、不乱码、不崩溃

---

## 复审范围外（需要产品/后端/运维确认的 12 个问题）

与原报告“必须得到明确答案的 12 个问题”一致（cookie 名、set-cookie 可见性、csrf cookie 需求、金额类型与舍入、Payment 字段合同、库存 search shape/是否列表、打印机型号 UUID 等）。

