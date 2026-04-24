# 天花板方案 · 深度审计（main）待修复清单

> 审计目标：找出会“上线即炸/资损/串号串店/核心链路失效”的问题，并按天花板标准给出最小可落地修复方案与验收点。
>
> 审计分支：`main`（以当前代码为准）
>
> 审计日期：2026-04-24

---

## 总览结论

当前 `main` 分支存在多项 **P0 阻断级问题**（Auth Cookie 兼容性 + 伪造 token、401 跳转路径、打印运行时依赖、切店缓存串数据、离线队列 URL 注入/误调用风险、金额 parseFloat/浮点与 NaN 风险）。若按天花板标准上线，需先完成本清单中的 P0。

---

## 🔴 P0（阻断上线级）

### P0-Auth-1：NextAuth Cookie 名不兼容 + 伪造 token 兜底（可能“登录成功但全 401”）

- **影响**：生产 HTTPS 常见 cookie 名为 `__Secure-next-auth.session-token` / `__Host-next-auth.session-token`，当前只匹配 `next-auth.session-token`，提取失败后还会伪造 token → UI 进入 tabs，但接口全 401。
- **证据**
  - `services/auth-service.ts`
    - `extractTokenFromHeaders` 只匹配 `next-auth.session-token`（L4-L12）
    - `extractSessionCookie` 只提取 `next-auth.session-token=...`（L14-L24）
    - token 提取失败后伪造：`token = session-${session.user.id}`（L65-L71）
- **最小修复建议（天花板）**
  - **不要伪造 token**：提取失败即视为登录失败并提示“未获取到会话 Cookie/Set-Cookie 不可见/不兼容”。
  - 支持 cookie 名变体：`(__Secure-|__Host-)?next-auth.session-token`
  - 建议直接存“`name=value` 串”并在请求里原样注入（不要只存 value）。
- **验收点**
  - 生产真机登录后，业务请求 header 必须携带正确 cookie（含前缀时也必须工作）
  - 冷启动 hydrate 后仍可拉取日报/库存

### P0-Auth-2：`URLSearchParams` 运行时兼容性（可能导致“部分机型无法登录”）

- **影响**：部分 RN/Hermes 环境 `URLSearchParams` 不保证存在 → 登录时直接崩。
- **证据**
  - `services/auth-service.ts`：`new URLSearchParams()`（L34-L38）
- **最小修复建议**
  - 改为手工拼 `application/x-www-form-urlencoded` 字符串（`encodeURIComponent`）。
- **验收点**
  - Android 10/11 与 Android 12+ 各 1 台真机登录成功

### P0-Auth-3：请求 Cookie 注入硬编码 + 覆盖写入（可能导致“Cookie 不生效/缺配套 cookie”）

- **影响**
  - 只注入 `next-auth.session-token=${token}`，无法兼容 secure/host 前缀
  - 直接覆盖 `config.headers['Cookie']`，未来需要携带多个 cookie 时会互相覆盖
  - axios v1 下 `headers` 可能不是普通对象（建议兼容 `headers.set()`）
- **证据**
  - `lib/api.ts`：`config.headers['Cookie'] = \`next-auth.session-token=${token}\``（L16-L23）
- **最小修复建议**
  - 改为：优先读取“已存的完整 cookie header 串”，并**合并**已有 Cookie
  - axios v1 兼容 `config.headers.set('Cookie', ...)`

### P0-401：401 跳转路径错误 + 未做并发防护（可能导致“401 后不回登录/循环”）

- **影响**
  - 路由写法使用 `'(auth)/login'`（缺少 `/`），与项目其它地方 `/(auth)/login` 不一致，可能跳转失败
  - 无 `isHandling401` 防抖：并发请求多次 401 会触发多次 logout/导航抖动
  - 只清 token，不清 Query 缓存：可能换号后闪现旧数据
- **证据**
  - `lib/api.ts`：401 时 `globalNavigationRef('(auth)/login')`（L40-L46）
- **最小修复建议**
  - 统一为 `/(auth)/login`
  - 增加 `isHandling401` 时间窗/完成态复位
  - 401 自动登出链路应包含：清会话 + 清 Zustand + 清 React Query cache + replace 登录

### P0-Printer：打印依赖 `TextEncoder`/`btoa`（RN 不保证存在）+ BLE 不分片写入

- **影响**：打印入口可能直接抛 `ReferenceError`，或写入过大导致半张纸/失败。
- **证据**
  - `services/printer-service.ts`
    - `new TextEncoder()`（L172-L185）
    - `arrayToBase64()` 使用 `btoa()`（文件后部，当前文件仍存在 `TextEncoder` 与 base64 一次性写入）
    - `writeWithResponse(base64)` 一次性写入（L132-L149）
- **最小修复建议**
  - 用稳定实现替换 `TextEncoder/btoa`（Buffer polyfill 或纯 JS 编码+base64）
  - `commands` 按 chunk（如 180 bytes）分片写入 + 片间延迟 + 片内重试
- **验收点**
  - Android 真机长中文小票连续打印 10 次不半张、不乱码、不崩

### P0-Cache：库存/出库/设备详情 queryKey 缺 storeId（切店/换号易串数据）

- **影响**：切门店后搜索 key 不变（orgId+search），可能复用旧缓存导致“串店/闪现”。
- **证据**
  - `app/(tabs)/inventory.tsx`：`['inventorySearch', organizationId, search]`（L19-L27）
  - `app/(tabs)/outbound.tsx`：`['outboundSearch', organizationId, search]`（L20-L28）
  - `app/device/[id].tsx`：`['device', id, organizationId]`（L21-L25）
- **最小修复建议**
  - queryKey 纳入 `storeId`（或 currentStore 唯一标识）
  - 切店时 `queryClient.clear()` 或全量 invalidate

### P0-Offline：离线队列可写任意 URL（误调用/注入风险）

- **影响**：当前离线队列存的是 `url`，没有白名单/校验，调用方若传错可造成错误接口调用或风险扩大。
- **证据**
  - `services/offline-queue.ts`：`enqueueAction(url, method, ...)` 直接存 `url`（L35-L55）
  - `hooks/useOffline.ts`：flush 时直接 `api.request({ url: action.url, method, data })`（L29-L45）
- **最小修复建议**
  - 白名单 action（推荐）或校验 url 必须以 `/api/` 开头且在白名单集合内
  - 写操作必须加入幂等键（requestId）并由服务端支持（避免弱网重试重复单据）

### P0-Money：金额链路仍大量 `parseFloat`/number 参与提交

- **影响**：科学计数法/Infinity/NaN 穿透，浮点精度导致 0.01 级误差，且与后端 Decimal/string 不对齐风险高。
- **证据（需按全仓 grep 确认点位）**
  - `app/(tabs)/inbound.tsx` / `app/cashier.tsx` / `lib/utils.ts` / `components/finance/AmountText.tsx` 等仍存在 `parseFloat(...)`
- **最小修复建议**
  - 输入层做正则白名单（最多 2 位小数，禁止科学计数法/Infinity/前缀数字）
  - schema 层 `z.coerce.number().finite()` 或改为 string 全链路
  - 提交优先用 string（到分）并由后端做 rounding 与校验

---

## 🟡 P1/P2（不阻断但应尽快修）

### P1-Auth：Set-Cookie 可见性与 header 形态兼容
- **风险**：`headers['set-cookie']` 在 RN/代理层不一定存在或不一定是数组。
- **建议**：兼容 `set-cookie`/`Set-Cookie` 等 key，且同时处理 string/string[]。

### P1-Printer：扫描列表丢弃 `device.name` 为空的设备
- **证据**：`services/printer-service.ts`：只在 `if (device?.name)` 时加入列表（L65-L67）
- **建议**：允许展示 name 为空的设备（用“未知设备 + id”）

---

## 立即可执行的验收脚本（跑完 1 小时以内）

1. **Auth**：生产真机登录 → 日报/库存可拉数据；冷启动后仍可用
2. **401**：触发 401 → 必须回 `/(auth)/login` → 换号后库存搜索不得闪旧数据
3. **切店**：门店 A 搜索 → 切门店 B → 同搜索不得复用 A 结果
4. **金额**：入库/收银各跑 `0.1/0.2/99.99`，后台落库到分一致且无 NaN
5. **打印**：目标机型打印长中文小票 10 连

