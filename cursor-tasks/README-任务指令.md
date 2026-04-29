# 继续开发任务指令（RN App · `used-3c-erp-app`）

本文件约定：**在本仓库继续迭代时**，优先读什么、跑什么门禁、与哪些「任务卡」对齐。  
全项目 34 份桌面任务包路径：`~/Desktop/Cursor任务卡-待开发模块/`（与 MVP 内 `~/used-3c-erp-mvp/cursor-tasks/` 有重叠时以**代码与门禁**为准）。

---

## 1. 仓库地图（改代码前先确认落点）

| 仓库 | 路径 | 职责 |
|------|------|------|
| **本 RN 客户端** | `~/used-3c-erp-app` | Expo Router：门店移动作业壳，数据一律走 HTTP API |
| **ERP 后端 + H5 `/m` + 企微小程序** | `~/used-3c-erp-mvp` | Next.js + Prisma；小程序在 `miniapp/` |
| **PayHub**（若任务涉及） | `~/payhub` 或 `~/Desktop/payhub`（可符号链接） | 独立仓库，非本 RN 目录 |
| **ExpenseAI 薪酬**（若任务涉及） | 由 `EXPENSEAI_ROOT` 指向完整检出目录 | 桌面默认占位路径常**无完整 `package.json`**，缺仓库则**不可验收** |

---

## 2. 每轮合并前门禁（本仓库）

在 **`~/used-3c-erp-app`** 根目录执行：

```bash
npm run typecheck
npm run test
npx expo export --platform web
```

（若需 Android 产物可自行加 `--platform android`；与 CI/本机环境一致即可。）

---

## 3. 与后端协作时的门禁（按需）

涉及 API、Schema、金额逻辑时，在 **`~/used-3c-erp-mvp`**：

```bash
bash scripts/quality-gate.sh --ci
```

满配且已检出 ExpenseAI 时可用 `--full`（见脚本注释）。

---

## 4. 本目录 `day1`～`day6`（RN 增量主线）

同目录下已有：

- `day1-settlement.md` — 日结
- `day2-handover.md` — 交接班
- `day3-warranty.md` — 质保
- `day4-trade.md` — 回收登记
- `day5-notification.md` — 通知
- `day6-marketplace.md` — 找货卖货

**执行方式：**按优先级 **Day1 → Day6** 打开对应 md，以文中 **「现有文件 / 缺口 / 验收」** 为准开发；每张卡末尾的自审清单需逐项勾过。  
卡片内若写「需新建 `xxx-service.ts`」等，以**当前分支实际文件是否存在**为准，避免重复造轮子。

---

## 5. 桌面文件夹中与 RN 强相关的其它任务卡

打开 **`~/Desktop/Cursor任务卡-待开发模块/`**：

| 文件 | 说明 |
|------|------|
| `rn-app-master.md` | RN 天花板规范（列表 FlashList、金额展示策略等），改 UI/列表时对照 |
| `rn-app-phase0-init.md` … `phase3` | Phase3（蓝牙打印、FCM、release APK）曾标注依赖与环境限制，实施前读 `services/printer-service.ts` 与任务卡验收项 |
| `day1`～`day6`（桌面版） | 若与本目录同名卡内容不一致，以 **两边较新 + 实码** 为准 |

---

## 6. 金额与安全（铁律）

- **前端**：金额只做展示与提交原始字符串；不做 `parseFloat`/`Number` 参与业务加减乘除（与任务卡、`erp-safety` 规则一致）。
- **后端改动**：必须在 **`~/used-3c-erp-mvp`** 用 Prisma `Decimal`、事务内写入；勿在仓库引入 JS 原生金额运算。

---

## 7. 明确阻塞或「非一次性开发完成」项

以下**不要**在本 RN 仓库强行冒充已完成：

| 项 | 原因 |
|----|------|
| **ExpenseAI 薪酬任务卡** | 无完整 ExpenseAI 工程时无法对接与验收 |
| **`05-体验极致化.md`（MVP）** | 持续性标准，非单次 MR 可证毕 |
| **`全量代码审计任务卡.md`** | 审计口径，不是功能交付清单 |
| **RN Phase3 蓝牙/FCM/APK** | 任务卡仍有硬件与签名环境依赖，按卡内验收项逐项关闭 |

---

## 8. 协作约定

1. **优先修缺口**：任务卡中的 ❌ /「需新建」对照 git 现状再动手。
2. **每完成一张 day 卡**：可在该 md 末尾简短注明日期与 PR 链接（可选）。
3. **跨仓库需求**：先确认 API 已在 MVP 存在且契约一致，再写 RN。
4. **不要改任务卡正文编造进度**；进度以代码与门禁为准。

---

## 9. 小程序 / MVP H5

小程序与 `/m` 主线不在本仓库；门禁分别在：

- `~/used-3c-erp-mvp/miniapp/`：`npm run validate`、`npm run build:weapp`
- MVP：`bash scripts/quality-gate.sh --ci`

详细清单见桌面 **`小程序全量业务开发任务卡.md`**、MVP **`cursor-tasks/README.md`**。
