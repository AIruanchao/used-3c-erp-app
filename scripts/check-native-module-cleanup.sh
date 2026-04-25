#!/bin/bash
# native-module-cleanup 门禁 — pre-commit hook
# 检测：如果 package.json 中移除了 expo-* / react-native-* 模块，
#       但代码或 config 中仍有引用，则阻止提交
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || true)

# 只在 package.json 有变更时运行
if ! echo "$STAGED_FILES" | grep -q "package.json"; then
  exit 0
fi

echo "[pre-commit] 检查原生模块移除完整性..."

# 获取被删除的 expo-* 和 react-native-* 模块
REMOVED=$(git diff --cached package.json | grep '^-.*"expo-\|^-"react-native-' | \
  sed 's/.*"\(expo-[^"]*\|react-native-[^"]*\)".*/\1/' | sort -u)

if [ -z "$REMOVED" ]; then
  exit 0
fi

ERRORS=0
for MODULE in $REMOVED; do
  echo "🔍 检测到移除: $MODULE"
  
  IMPORTS=$(grep -rn "$MODULE" "$REPO_ROOT/app/" "$REPO_ROOT/components/" "$REPO_ROOT/lib/" \
    --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules || true)
  
  if [ -n "$IMPORTS" ]; then
    echo "❌ $MODULE 在代码中仍有引用:"
    echo "$IMPORTS"
    ERRORS=$((ERRORS+1))
  fi
  
  CONFIG=$(grep -n "$MODULE" "$REPO_ROOT/app.config.ts" 2>/dev/null || \
           grep -n "$MODULE" "$REPO_ROOT/app.config.js" 2>/dev/null || true)
  if [ -n "$CONFIG" ]; then
    echo "❌ $MODULE 在 app.config 中仍有引用:"
    echo "$CONFIG"
    ERRORS=$((ERRORS+1))
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "🚫 提交被阻止：原生模块移除不彻底！"
  echo "   参考：knowledge/gotchas/expo-native-module-removal.md"
  exit 1
fi

echo "✅ 原生模块移除检查通过"
