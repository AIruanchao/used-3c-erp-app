#!/bin/bash
# L3防护：EAS Build前置检查
# 放在 eas.json 的 preBuild 钩子中调用

set -e
echo "=== EAS Pre-Build 防护检查 ==="

# 1. 检查newArchEnabled=false
if ! grep -q "newArchEnabled.*false" app.config.ts app.config.js 2>/dev/null; then
  echo "❌ app.config 中 newArchEnabled 不是 false！"
  exit 1
fi

# 2. 检查reanimated不在node_modules
if [ -d "node_modules/react-native-reanimated" ]; then
  echo "❌ node_modules/react-native-reanimated 存在！EAS build 必定失败！"
  echo "   修复：确认 package.json overrides 排除了 reanimated，重新 npm install"
  exit 1
fi

# 3. 检查edgeToEdgeEnabled=false
if ! grep -q "edgeToEdgeEnabled.*false" app.config.ts app.config.js 2>/dev/null; then
  echo "⚠️  edgeToEdgeEnabled 未设为 false（可能导致黑屏）"
fi

echo "✅ EAS Pre-Build 检查通过"
