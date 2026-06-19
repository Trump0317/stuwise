# M4 Bug 记录

| # | 问题 | 状态 | 修复 |
|---|------|------|------|
| B12 | 上传按钮 📎 无效 | [x] | script 缺少 triggerUpload/uploading/fileInput/handleFile 定义 |
| B13 | 产物面板看不到文件 | [x] | sessionScope 过滤掉 data/outputs/ 全局文件 |

## B13 定位

- SKILL.md 指令 `写入 data/outputs/<报告名称>.md`
- 前端带 `?sessionId=xxx` 调用 `/api/outputs`
- `listOutputs(sessionId)` 只扫描 `data/sessions/<id>/outputs/`
- 产物落在 `data/outputs/` 不会被查到

**方案**：`listOutputs` 有 sessionId 时也扫描 `data/outputs/`，或 SKILL.md 改为写入 `data/` 根目录已可被 sessionId=undefined 扫描。

## B12 定位

需排查 ChatInput.vue 的上传按钮事件绑定。
