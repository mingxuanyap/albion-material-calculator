# Albion Online 装备制作计算器 — Project B V6

**薰衣草紫白 · 简体中文版**

基于 Next.js + TypeScript 开发的 Albion Online 装备制作材料与利润计算器。

项目无需后端或数据库，支持装备分类、中文搜索、材料计算、资源返还、成本利润计算以及自定义配方。

装备数据来自 [ao-data/ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps)，不使用人为编造的游戏配方。

---

## 1. 项目功能

- 简体中文操作界面
- 薰衣草紫白主题
- T4–T8 装备及附魔等级选择
- 武器、头部、身体、鞋子、副手、披风、背包分类
- 武器 17 个武器系筛选
- 布甲、皮甲、板甲细分类
- 中文装备名称搜索
- 制作数量及材料需求计算
- 资源返还率（RRR）计算
- 神器及不可返还材料处理
- 材料价格与装备售价输入
- 制作成本、销售费用与利润估算
- 自定义配方保存
- 本地游戏数据导入及缓存

## 2. 技术架构

| 技术 | 用途 |
|---|---|
| Next.js | 网站框架 |
| TypeScript | 类型安全与计算逻辑 |
| Tailwind CSS | 页面样式 |
| JSON | 保存游戏装备配方 |
| localStorage | 保存玩家个人设置 |
| Vercel | 网站部署 |

不需要 Laravel、数据库或独立 API Server。

## 3. 首次运行

使用 Windows PowerShell 或 Git Bash：

```bash
npm install
npm run update:data
npm run dev
```

打开：

http://localhost:3000

如果 Port 3000 被占用，Next.js 可能自动改用 3001。

**正式构建检查：**

```bash
npm run build
```

只有构建成功后，才建议部署到正式网站。

## 4. 装备数据来源

原始游戏数据：

- https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json
- https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json

更新命令：

```bash
npm run update:data
```

导入脚本会：

1. 读取原始装备资料和制作配方。
2. 使用物品 UniqueName 关联中文本地化名称。
3. 获取装备制作材料、数量及返还相关属性。
4. 按装备类别、Tier、附魔等级生成配方。
5. 跳过不完整或无法解析的配方。
6. 将成功解析的数据写入 `data/recipes.json`。
7. 生成 `data/update-report.json` 供检查。

只有成功解析的数据会进入计算器。

**注意：** 数据准确性取决于源数据、解析规则与版本匹配情况。成功导入不代表全部游戏装备已收录，也不能保证全部配方已经逐项验证。

## 5. 数据下载与本地缓存

更新程序优先使用：

```text
data/source/
├── items.json
└── formatted-items.json
```

如果本地文件不存在，程序会尝试从 GitHub 下载。

更新后的下载逻辑支持：

- 下载失败重试
- 下载超时处理
- 自动缓存成功下载的 JSON
- 本地文件读取
- 顺序下载，便于排查问题

### 获取最新数据

由于本地缓存优先，正常运行 `npm run update:data` 不一定重新下载最新文件。

如果要强制更新游戏数据，先删除：

```text
data/source/items.json
data/source/formatted-items.json
```

然后执行：

```bash
npm run update:data
```

### GitHub 下载失败

如果 Node.js 无法下载数据，可以使用 Git Bash：

```bash
mkdir -p data/source

curl -fL --retry 3 \
  -o data/source/items.json \
  https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json

curl -fL --retry 3 \
  -o data/source/formatted-items.json \
  https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json

npm run update:data
```

这样脚本会直接使用本地下载好的文件。

建议不要将原始下载缓存提交到 GitHub，在 `.gitignore` 中加入：

```gitignore
data/source/
```

但必须保留生成后的：

```text
data/recipes.json
```

网站需要使用这个文件。

## 6. 装备分类

### 主要分类

- 武器
- 身体
- 头部
- 鞋子
- 副手
- 披风
- 背包

### 武器第二层分类

包含以下 17 个武器系：

1. 剑
2. 斧
3. 战锤
4. 钉头锤
5. 长棍
6. 长矛
7. 匕首
8. 战斗手套
9. 弓
10. 弩
11. 火焰法杖
12. 冰霜法杖
13. 奥术法杖
14. 诅咒法杖
15. 神圣法杖
16. 自然法杖
17. 变形法杖

V6 根据游戏数据中的 `@shopsubcategory1` 识别武器系，不再单纯依赖装备 ID 的英文关键词推断。

无法识别的装备保留在「其他武器」，避免错误归类。

### 头部、身体、鞋子

增加第二层分类：

- 布甲（Cloth）
- 皮甲（Leather）
- 板甲（Plate）

### 披风

披风分类支持以下物品 ID 形式：

```text
T4_CAPE
T4_CAPEITEM_...
```

对应分类判断：

```javascript
if (/^T[4-8]_(?:CAPE(?:_|$)|CAPEITEM_)/.test(id)) {
  return "cape";
}
```

用于识别普通披风及使用 `CAPEITEM_` 前缀的特殊披风。

**注意：** 识别披风类别并不保证导入成功。没有完整中文名称或材料资料的配方仍可能被跳过。

## 7. 中文名称

装备和材料优先读取：

```javascript
LocalizedNames["ZH-CN"]
```

可通过以下文件手动覆盖名称：

```text
data/name-overrides.json
```

例如：

```json
{
  "T4_MAIN_SWORD": "阔剑",
  "T4_METALBAR": "T4 金属锭"
}
```

修改后重新执行：

```bash
npm run update:data
```

覆盖名称需要与物品内部 ID 正确对应。

如果装备或材料缺少中文名称，导入脚本不会随意生成翻译。

## 8. 材料与返还计算

基础材料数量：

```text
材料原始需求 = 每件所需数量 × 制作数量
```

普通可返还材料的长期预计净消耗：

```text
预计净消耗 = 原始需求 × (1 - RRR / 100)
```

不可返还材料不应用 RRR。

游戏数据中的 `maxreturnamount` 用于辅助判断材料返还规则。

这里的返还计算是平均预期估算，实际单次制作结果可能不同。

## 9. 成本与利润

支持玩家手动输入：

- 材料购买单价
- 装备出售价格
- 每件制作费用
- 市场相关费率
- 资源返还率

预计利润：

```text
预计利润 =
出售收入
- 材料净成本
- 制作费用
- 市场相关费用
```

计算结果用于制作决策参考，不代表实际最终利润。

目前不自动获取 Albion Online 的实时市场价格，也不自动计算特定城市的最新制作站费用。

## 10. 自定义配方与本地储存

自定义配方及玩家输入的价格等数据可使用浏览器 `localStorage` 储存。

特点：

- 刷新页面后通常仍保留
- 不需要注册账号
- 不需要数据库
- 不会自动同步到其他设备

注意：

- 使用其他浏览器不会自动取得原本的数据。
- 清除浏览器网站数据可能导致内容丢失。
- 自定义配方不会自动写入网站的 `recipes.json`。
- 网站部署更新后，玩家原本的浏览器数据通常仍然保留，前提是网站来源不变且储存格式兼容。

## 11. 数据导入检查

每次更新完成后检查：

```text
data/update-report.json
```

重点字段：

| 字段 | 意思 |
|---|---|
| `recipeCount` | 成功生成的配方数量 |
| `missingName` | 因装备中文名称缺失而跳过的次数 |
| `missingMaterial` | 因材料信息不完整而跳过的次数 |
| `unclassifiedWeapons` | 尚未识别武器系的配方数量 |
| `updatedAt` | 本次生成时间 |

检查披风数量：

```bash
node -e "const d=require('./data/recipes.json'); console.log('披风配方:',d.filter(x=>x.category==='cape').length)"
```

检查武器分类：

```bash
node -e "const d=require('./data/recipes.json'); console.log([...new Set(d.filter(x=>x.category==='weapon').map(x=>x.weaponFamily||'其他武器'))])"
```

这些检查只显示已导入的数据，并不能直接证明缺失装备已经全部解决。

## 12. 部署到 Vercel

项目支持部署到 Vercel。

首次部署之前，先执行：

```bash
npm install
npm run update:data
npm run build
```

确认 `data/recipes.json` 已生成，并检查网站正常运行。

随后提交到 GitHub：

```bash
git add .
git commit -m "Update Albion calculator and equipment data"
git push origin Master
```

在 Vercel 导入 GitHub Repository，Framework 选择 Next.js，完成部署。

如果 Vercel 的 Production Branch 是 `Master`，以后 Push 到该分支即可触发自动部署。

不需要重新上传 ZIP。

## 13. 项目更新流程

一般代码更新：

```bash
git add .
git commit -m "Update Albion calculator"
git push origin Master
```

装备数据更新：

```bash
npm run update:data
npm run build
git add .
git commit -m "Update Albion equipment recipes"
git push origin Master
```

**重要：** 若需要获取最新游戏源数据，必须先清除旧的 `data/source/` 缓存，再运行更新命令。

## 14. 当前限制

- 尚未保证所有 Albion 装备都有对应配方。
- 缺少中文名称或完整材料资料的装备可能不被导入。
- 某些特殊武器可能暂时归入「其他武器」。
- 部分特殊披风、背包和附魔配方可能需要额外验证。
- 没有实时市场价格。
- 没有自动材料价格同步。
- 没有多设备账户同步。
- 制作返还与利润属于估算，实际结果可能不同。

## 15. 项目主题

**V6 — 薰衣草紫白**

| 颜色用途 | 色码 |
|---|---|
| 页面背景 | `#F5F0FF` |
| 卡片背景 | `#FFFFFF` |
| 主要强调色 | `#8052BC` |
| 主要文字 | `#302641` |

页面保持简约布局，优先保证中文内容、装备名称和数字清晰易读。

## 16. 数据来源与声明

Albion Online 社区游戏数据：

https://github.com/ao-data/ao-bin-dumps

本项目为非官方粉丝制作工具，与游戏开发商无官方关联。

装备配方和游戏规则可能随版本更新，使用前应检查资料是否与当前游戏版本一致。