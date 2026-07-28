# 拾遗 · LeetCode 热题 100 笔记

一个侘寂（wabi-sabi）风格的静态网站，为 [LeetCode 热题 100](https://leetcode.cn/studyplan/top-100-liked/) 而作。
按官方的 17 个分类组织全部 100 道题，支持为每道题撰写 Markdown 笔记（编辑 / 预览 / 上传 / 下载），
支持完成状态标记、收藏、深浅色主题。纯前端，无需后端与构建工具，直接托管于 GitHub Pages。

## 功能

- **题库**：与官方 top-100-liked 完全一致的 100 题与 17 类分组、难度标记。
- **笔记**：每题一份 Markdown 笔记，实时自动保存到浏览器本地（localStorage）。
  - 编辑 / 预览 双模式，预览带代码高亮（highlight.js）。
  - 上传 `.md` 文件导入，或把笔记下载为 `.md` 文件。
  - `Ctrl/Cmd + S` 保存。
- **标记**：未开始 / 已解决 / 待复习 三态，收藏（★），首页进度环与统计。
- **筛选**：按题号 / 题名搜索，按难度、收藏过滤。
- **详情页**：左栏题目信息 + 一键跳转 LeetCode 原题，右栏 Markdown 笔记。
- **主题**：侘寂配色，深色 / 浅色一键切换，随系统偏好初始化。
- **备份**：右上角一键导出 / 导入全部笔记与进度（`.json`）。
- **离线自足**：Markdown 相关依赖已内置于 `js/vendor`、`css/vendor`，不依赖任何 CDN。

## 目录结构

```
index.html          入口
css/style.css       侘寂主题样式
css/vendor/         highlight.js 代码高亮主题
js/data.js          热题 100 题库数据
js/storage.js       本地存储（笔记 / 状态 / 主题）
js/app.js           路由与界面逻辑
js/vendor/          marked / dompurify / highlight.js
```

## 部署到 GitHub Pages

该仓库 `lyh358.github.io` 是「用户主页仓库」，默认分支根目录的内容会直接发布在
`https://lyh358.github.io/`。把本项目的**全部文件放到仓库根目录**即可：

```bash
# 在本项目目录内执行（首次）
git init
git add .
git commit -m "拾遗：LeetCode 热题 100 笔记站"
git branch -M main
git remote add origin https://github.com/lyh358/lyh358.github.io.git
git push -u origin main
```

> 若仓库已有内容，先 `git clone` 下来，把本项目文件拷进去再提交推送。

推送后，在仓库 **Settings → Pages** 确认 Source 为 `main` 分支根目录。
稍等一两分钟，访问 <https://lyh358.github.io/> 即可。

## 笔记的存储与云同步

笔记默认存在**当前浏览器的本地存储**（localStorage），并可选择**同步到一个私有 GitHub 仓库**，实现多设备通用。

### 本地（默认，开箱即用）

无需任何配置。换电脑或清缓存会丢，请用右上角**导出**定期备份为 `.json`，或用每题的**下载 .md** 存档，
新设备用**导入**读回。

### GitHub 云同步（推荐，跨设备）

点右上角的 **GitHub 图标**，填入仓库信息与访问令牌即可。笔记会以
`notes/<题号>-<英文名>.md` 存进仓库，完成状态与收藏存进根目录 `meta.json`。

**准备步骤：**

1. 在 GitHub 新建一个**私有仓库**，例如 `leetweb-notes`（可以是空仓库）。
2. 生成一个**细粒度访问令牌**（Fine-grained personal access token）：
   打开 <https://github.com/settings/personal-access-tokens/new> →
   - **Repository access** 选 *Only select repositories*，勾选刚建的 `leetweb-notes`；
   - **Permissions → Repository permissions → Contents** 设为 **Read and write**；
   - 生成并复制以 `github_pat_` 开头的令牌。
3. 回到网站点 GitHub 图标，填 owner（`lyh358`）、repo（`leetweb-notes`）、branch（`main`）、Token，
   点「测试并保存」。连接成功后会自动拉取云端已有笔记。

> **安全说明**：Token 只保存在你自己浏览器的 localStorage 里，**不会写进代码、也不会提交到任何仓库**。
> 只授权 Contents 读写、且只对那一个仓库，风险可控。若在公用电脑上用完，进设置点「断开」即可清除。
> 不要把 Token 贴给任何人；一旦泄露，去 GitHub 设置里 Revoke 重新生成。

同步为「本地优先」：编辑先存本地再推 GitHub；打开某题时若云端有更新且你尚未改动，会自动载入云端版本。
右上角图标上的小圆点表示同步状态（灰=未连接，绿=已同步，黄=同步中，红=失败）。

## 数据来源与版权

题目分类、题号、难度整理自 LeetCode 热题 100 学习计划。LeetCode 原题描述受版权保护，
本站不转载，仅在详情页提供跳转链接。笔记内容归你自己所有。
