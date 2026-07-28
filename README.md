# 拾遗 · 算法与知识笔记庭院

一个侘寂（wabi-sabi）风格的纯静态网站，把学习过程中的算法题、手撕题、基础知识与简历都收纳在一处。
无需后端、无需构建，直接托管于 GitHub Pages。数据默认存于浏览器本地，并可选同步到你的私有 GitHub 仓库，实现多设备通用。

进入网站是一个艺术化的首页，四个模块以卡片呈现，顶栏也可随时切换：

| 模块 | 说明 |
|---|---|
| **热题 100** | [LeetCode 官方精选](https://leetcode.cn/studyplan/top-100-liked/)，17 分类 / 100 题，双栏题笔记与进度追踪 |
| **手撕题库** | 自定义添加非 LeetCode 题目，自定题名与分类，题面与解法各自成册 |
| **知识库** | 基础知识笔记，支持文件夹归档，Markdown 与 PDF |
| **简历** | 多版本简历的收纳、查看与上传下载（PDF / Markdown） |

## 功能一览

### ① 热题 100
- 与官方 top-100-liked 完全一致的 100 题、17 类分组与难度标记。
- 详情页左右两栏**各自独立滚动**：
  - **左栏＝题目描述**：可编辑 / 预览的 Markdown，支持**上传 `.md`** 或**上传 PDF 题面**（内嵌查看），并保留一键跳转 LeetCode 原题。
  - **右栏＝解题笔记**：Markdown 编辑 / 预览、上传 / 下载 `.md`。
- 标记：未开始 / 已解决 / 待复习 三态与收藏（★）；首页进度环与统计。
- 筛选：按题号 / 题名搜索，按难度、收藏过滤。

### ② 手撕题库
- 自建条目，自定义**题目名称 + 分类**，列表按分类分组、可搜索。
- 点进去是与热题一致的双栏：左「题目详情」（Markdown + PDF），右「解法笔记」。
- 条目可随时重命名、改分类、删除。

### ③ 知识库
- 可**新建文件夹**（多层嵌套，带面包屑导航）归档笔记。
- 笔记支持 **Markdown**（编辑 / 预览）与 **PDF**（上传 / 内嵌查看）。
- 卡片悬停即可重命名 / 删除。

### ④ 简历
- 左侧窄栏为版本目录，中间与右侧大区域展示简历内容。
- 上传 **PDF** 或 **Markdown** 作为不同版本，逐版查看、下载、重命名、删除。
- PDF 整块内嵌预览；Markdown 以居中卡片式排版呈现，也可直接编辑。

### 通用
- **主题**：侘寂配色，深色 / 浅色一键切换，随系统偏好初始化，预览代码高亮（highlight.js）。
- **保存**：编辑实时自动保存，`Ctrl/Cmd + S` 手动保存。
- **备份**：右上角一键导出 / 导入热题 100 的笔记与进度（`.json`）。
- **离线自足**：Markdown 相关依赖已内置于 `js/vendor`、`css/vendor`，不依赖任何 CDN。

## 目录结构

```
index.html          入口（顶栏导航 + 各模块脚本）
css/style.css       侘寂主题样式
css/vendor/         highlight.js 代码高亮主题
js/data.js          热题 100 题库数据
js/storage.js       本地存储（笔记 / 状态 / 主题）+ PDF 的 IndexedDB 封装
js/github.js        GitHub 云同步层（Sync 模块）
js/app.js           路由、主题、热题 100 列表与详情
js/modules.js       首页 + 手撕题库 + 知识库 + 简历
js/vendor/          marked / dompurify / highlight.js
```

路由采用 hash 形式，避免 GitHub Pages 子路径 404：

```
#/            首页        #/hot100        热题列表     #/p/<题号>       热题详情
#/custom      手撕题库     #/custom/<id>   手撕详情
#/kb          知识库根     #/kb/f/<id>     文件夹        #/kb/n/<id>      笔记
#/resume      简历        #/resume/<id>   指定版本
```

## 部署到 GitHub Pages

该仓库 `lyh358.github.io` 是「用户主页仓库」，默认分支根目录的内容会直接发布在
`https://lyh358.github.io/`。把本项目的**全部文件放到仓库根目录**即可：

```bash
# 在本项目目录内执行（首次）
git init
git add .
git commit -m "拾遗：算法与知识笔记庭院"
git branch -M main
git remote add origin https://github.com/lyh358/lyh358.github.io.git
git push -u origin main
```

> 若仓库已有内容需覆盖，可 `git push -f origin main`（会用本地内容替换远端）。

推送后，在仓库 **Settings → Pages** 确认 Source 为 `main` 分支根目录。
稍等一两分钟，访问 <https://lyh358.github.io/> 即可。

## 数据的存储与云同步

所有数据默认存在**当前浏览器的本地存储**（localStorage，PDF 存 IndexedDB），并可选择**同步到一个私有 GitHub 仓库**，实现多设备通用。

### 本地（默认，开箱即用）

无需任何配置。换电脑或清缓存会丢，请用右上角**导出**定期备份，或用各处的**下载**按钮存档。

### GitHub 云同步（推荐，跨设备）

点右上角的 **GitHub 图标**，填入仓库信息与访问令牌即可。仓库内容组织如下：

```
notes/<题号>-<英文名>.md     热题解题笔记
desc/<题号>-<英文名>.md      热题的题目描述（自填）
desc/<题号>-<英文名>.pdf     热题上传的 PDF 题面
meta.json                    完成状态与收藏
custom/index.json            手撕题库目录
custom/<id>-desc.md          手撕题面        custom/<id>-note.md   手撕解法
custom/<id>-desc.pdf         手撕 PDF 题面
kb/index.json                知识库目录（文件夹树）
kb/notes/<id>.md / .pdf      知识库笔记内容
resume/index.json            简历版本目录
resume/<id>.md / .pdf        简历各版本内容
```

> PDF 在本地用浏览器 IndexedDB 缓存；连了 GitHub 时也会同步一份到仓库，换设备后自动拉回。
> 单个 PDF 超过 10MB 的不上传（仅存本设备），以规避 GitHub 单文件限制。

**准备步骤：**

1. 在 GitHub 新建一个**私有仓库**，例如 `leetweb-notes`（可以是空仓库）。
2. 生成一个**细粒度访问令牌**（Fine-grained personal access token）：
   打开 <https://github.com/settings/personal-access-tokens/new> →
   - **Repository access** 选 *Only select repositories*，勾选刚建的 `leetweb-notes`；
   - **Permissions → Repository permissions → Contents** 设为 **Read and write**；
   - 生成并复制以 `github_pat_` 开头的令牌。
3. 回到网站点 GitHub 图标，填 owner（`lyh358`）、repo（`leetweb-notes`）、branch（`main`）、Token，
   点「测试并保存」。连接成功后会自动拉取云端已有内容。

> **安全说明**：Token 只保存在你自己浏览器的 localStorage 里，**不会写进代码、也不会提交到任何仓库**。
> 只授权 Contents 读写、且只对那一个仓库，风险可控。若在公用电脑上用完，进设置点「断开」即可清除。
> 切勿把 Token 写进公开仓库的代码——GitHub 的密钥扫描会自动将其吊销。一旦泄露，去设置里 Revoke 重新生成。

同步为「本地优先」：编辑先存本地再推 GitHub；打开某条目时若云端有更新且你尚未改动，会自动载入云端版本。
右上角图标上的小圆点表示同步状态（灰＝未连接，绿＝已同步，黄＝同步中，红＝失败）。

## 数据来源与版权

题目分类、题号、难度整理自 LeetCode 热题 100 学习计划。LeetCode 原题描述受版权保护，
本站不转载，仅在详情页提供跳转链接。笔记与你上传的所有内容归你自己所有。
