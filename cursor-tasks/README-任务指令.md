# Cursor 全量任务指令

## 当前状态
- 23张天花板任务卡已完成（P0+P1+P2全过，build通过）
- Phase1-4后端修复已完成（安全+断链+模型+UI）
- Day1-6待开发模块：**全部未实现，需按任务卡逐卡开发**

## 任务清单（按优先级）

### 🔴 第一批：Day1-6 待开发模块（全部未做）

按顺序执行，每张卡的任务说明在同目录下 `dayX-xxx.md`：

| 顺序 | 文件 | 模块 | 优先级 | 需新建API |
|------|------|------|--------|-----------|
| 1 | day1-settlement.md | 日结3Tab | P0 | ❌ |
| 2 | day2-handover.md | 交接班增强 | P0 | ❌ |
| 3 | day3-warranty.md | 质保查询 | P1 | ❌ |
| 4 | day4-trade.md | 回收登记 | P1 | ✅ 后端2个API |
| 5 | day5-notification.md | 通知栏 | P1 | ✅ 后端2个API |
| 6 | day6-marketplace.md | 找货卖货 | P2 | ✅ 后端2个API |

**注意：**
- Day4/5/6需要先建后端API再写前端
- 每张卡末尾都有自审清单，必须逐项检查
- 品牌色用 BRAND_COLOR（不是COLORS）
- 金额用 AmountText 或 yuan()，禁止 Math.round
- build必须通过：APP `npx expo export --platform android`，后端 `npm run build`（后端仓库在 ~/used-3c-erp-mvp）

### 🟡 第二批：已完成的模块做逐项验收对照

1. MVP主线(00-20)：对照README任务卡逐条确认
2. 小程序全量：检查API路径/动效/交互
3. 23张天花板卡：逐条对照确认

### ⚪ 跳过项
- ExpenseAI薪酬任务卡（无工程）
- RN Phase3外设（BLE不兼容）
- 05体验极致化（持续性标准）
- 全量代码审计（不是开发里程碑）

## 执行规则
1. 每完成一张卡，在卡文件末尾标注完成状态
2. 遇到阻塞标注原因
3. 所有改动完成后确保 build 通过
4. 不要修改任务卡内容，只改代码
