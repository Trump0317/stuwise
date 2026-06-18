# M3 Bug 记录

## B5: Vue emit 多参数丢失

**状态**: 已修复

**现象**: 点击会话「置顶」无反应。`$event` 只捕获 emit 的第一个参数，`...$event` 在字符串上展开为字符。

**修复**: 所有 emit 链改用显式箭头函数：`(id, pinned) => emit('pin', id, pinned)`。

## B6: Skill toggle 开关冲突

**状态**: 已修复

**现象**: `<label>` 包裹 `<input type="checkbox">`，浏览器原生 toggle 与 Vue `:checked` 绑定冲突，开关无效。

**修复**: 去掉 `<input>`，改为纯 `<div>` + `.on` class 控制样式。

## B7: pi-agent-core loadSkills Windows 路径 bug

**状态**: 已修复

**现象**: Bun 编译的 exe 运行时，`loadSkills` 内的 `relativeEnvPath` 函数用 `/` 匹配路径前缀，Windows `\` 分隔符导致 `startsWith` 永远 false，返回绝对路径。`ignores` 库要求相对路径抛 `RangeError`。

**根因**: pi-agent-core `skills.js` 的 `relativeEnvPath`:
```js
normalizedPath.startsWith(`${normalizedRoot}/`)  // Windows 上 root 和 path 都用 \
```

**修复**: 自写 `server/skills-loader.ts`，纯 Node.js `fs` 实现，不依赖 `ignores`。

## B8: nexe/pkg 不兼容 Node 24

**状态**: 已解决

**现象**: nexe 无 Node 24 预编译二进制，`--build` 需 VS C++ 工具链编译失败。pkg 只支持到 Node 18。

**解决**: 改用 Bun 的 `bun build --compile`。

## B9: Bun compile 打包 .gitkeep

**状态**: 已修复

**现象**: skills 目录下的 `.gitkeep` 文件被 Bun 打包进 exe，引发路径转换错误。

**修复**: `scripts/build-dist.ts` 复制时跳过 `.gitkeep`。

## B10: 新建会话立即创建空 session

**状态**: 已修复

**现象**: 点击「新建会话」立即在列表创建空条目，造成膨胀。

**修复**: 延迟创建 — 首条消息才 POST /api/session。

## B11: 工具关闭后模型仍可使用

**状态**: 已修复

**现象**: 新建会话 rebuild harness 时，`activeToolNames` 取全部工具，未读取 `$.toolEnabled` 开关状态。

**修复**: `build.ts` 传入 `activeToolNames: $.allToolNames.filter(n => $.toolEnabled.get(n) !== false)`。
