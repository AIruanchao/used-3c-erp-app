#!/bin/bash
# L2防护：pre-commit hook检查，阻止reanimated/worklets被引入
# 规则：newArchEnabled=false的项目中不允许有reanimated/worklets

set -e
echo "🔍 检查 react-native-reanimated / react-native-worklets ..."

# 1. 检查package.json的dependencies和devDependencies（不含overrides）
HAS_DEP=$(node -e "
  const pkg = require('./package.json');
  const deps = {...(pkg.dependencies || {}), ...(pkg.devDependencies || {})};
  const bad = ['react-native-reanimated', 'react-native-worklets'];
  for (const b of bad) {
    if (deps[b]) { console.log(b); process.exit(0); }
  }
  console.log('');
" 2>/dev/null)
if [ -n "$HAS_DEP" ]; then
  echo "❌ package.json dependencies 包含 $HAS_DEP！"
  echo "   reanimated/worklets强制要求newArchEnabled=true，与当前配置冲突"
  exit 1
fi

# 2. 检查overrides是否配置了排除
if [ -f "package.json" ]; then
  OVERRIDES_OK=$(node -e "
    const pkg = require('./package.json');
    const ov = pkg.overrides || {};
    if (!ov['react-native-reanimated'] || !ov['react-native-worklets']) {
      console.log('missing');
      process.exit(1);
    }
    console.log('ok');
  " 2>/dev/null || echo "missing")
  if [ "$OVERRIDES_OK" != "ok" ]; then
    echo "⚠️  package.json overrides 中缺少 reanimated/worklets 排除配置"
  fi
fi

# 3. 检查node_modules是否被安装了（提交前要npm install过）
if [ -d "node_modules" ]; then
  if [ -d "node_modules/react-native-reanimated" ]; then
    echo "❌ node_modules/react-native-reanimated 存在！"
    echo "   可能是某个依赖的peer dep自动安装，检查overrides配置后重新npm install"
    exit 1
  fi
  if [ -d "node_modules/react-native-worklets" ]; then
    echo "❌ node_modules/react-native-worklets 存在！"
    exit 1
  fi
fi

# 4. 检查babel.config.js
if [ -f "babel.config.js" ]; then
  if grep -q "react-native-reanimated/plugin" babel.config.js; then
    echo "❌ babel.config.js 仍引用 reanimated plugin！"
    exit 1
  fi
fi

# 5. 检查app.config中newArchEnabled=false
if [ -f "app.config.ts" ] || [ -f "app.config.js" ]; then
  NEW_ARCH=$(grep -r "newArchEnabled" app.config.* 2>/dev/null | grep "false" || echo "")
  if [ -z "$NEW_ARCH" ]; then
    echo "⚠️  app.config 中未找到 newArchEnabled: false"
  fi
fi

echo "✅ reanimated/worklets 防护检查通过"
