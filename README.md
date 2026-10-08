# 阿尔比恩装备制作计算器 Project B · V6 薰衣草紫白中文版

Next.js + TypeScript，无后端、无数据库。保留装备分类、搜索、材料返还、成本与利润及自定义配方。**项目不包含编造的游戏配方。**

## 首次运行（Windows PowerShell）
```powershell
npm install
npm run update:data
npm run dev
```
打开 http://localhost:3000。更新脚本运行时需连接 GitHub；网站使用时不需要连接配方源。

## 完整中文游戏数据
`npm run update:data` 从 ao-data/ao-bin-dumps 下载原始 `items.json` 和 `formatted/items.json`，以 **UniqueName** 连接官方游戏本地化 `LocalizedNames['ZH-CN']`、游戏配方 `craftingrequirements`。导入 T4–T8 武器、身体、头部、鞋子、副手、披风和背包；包含对应的附魔配方。头、身、鞋按 `CLOTH / LEATHER / PLATE` 分成布甲、皮甲、板甲。只导入所有材料、装备均具有简体中文名称且数量为有效正整数的配方，不会自动编造翻译；遇到不完整的配方会跳过并记录在 `data/update-report.json`。

如果所在网络无法访问 GitHub，可自行下载以下两个 URL：
- https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/items.json
- https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json

分别放到 `data/source/items.json` 和 `data/source/formatted-items.json`，然后运行 `npm run update:data`。`data/name-overrides.json` 允许按游戏内部物品 ID 手动修正简体中文名称，更新命令会应用覆盖。

## 准确性与局限
- 以生成时的源数据为准；游戏更新后须再次运行 `npm run update:data` 并重新部署。
- 解析不出的名称或材料不会被猜测填充。未导入前搜索列表为空。
- 资源返还是按用户输入的游戏内 RRR 计算**长期预期值**，单次制作的实际返还有波动。
- 神器、令牌等是否可返还由游戏资料中的 `maxreturnamount` 判定。
- 银币制作费用为用户自行输入的每件费用；市场综合费率是可修改的示例值，非自动实时费率。
- 自定义配方、银币价格储存在当前浏览器 `localStorage`，不同电脑不共享，清理网站数据会丢失。
- 目前不包含实时市场价格、自动汇率或账户同步。

## 内容来源
Albion Online 的社区数据导出：https://github.com/ao-data/ao-bin-dumps 。非官方粉丝工具。


## V5 暗夜骑士更新

- 黑蓝 + 香槟金配色；更高对比度及更大的中文字号。
- 武器增加 17 个标准武器系筛选 + 其他武器兜底。新数据按物品 ID 尝试映射，未知项目保留在「其他武器」。
- 分类图标使用 Lucide 的武器、衣服、头盔、鞋子、书、旗帜、背包图标；不再使用棋子字符。
- 装备下拉框仅显示中文装备名；不显示「游戏数据」等元信息。
- 运行 `npm run update:data` 更新本地中文配方。尚未运行导入命令前没有完整配方，计算器不会杜撰材料。

## V6 薰衣草紫白与武器系修复
- 配色：背景 `#F5F0FF`，卡片 `#FFFFFF`，强调色 `#8052BC`，主要文字 `#302641`。
- 武器**不再使用装备 ID 关键词猜测**；`npm run update:data` 直接读取游戏数据里的 `@shopsubcategory1`，并映射 17 个武器系。
- 无法识别的源分类保留在「其他武器」而不是错误地强行归入某个系。检查 `data/update-report.json` 的 `unclassifiedWeapons`。
- 玩家自建武器配方时，可以选择武器系；旧版已储存在 localStorage 的自定义配方若缺少武器系，会进入「其他武器」。
- **重要**：升级 V6 后应再次运行 `npm run update:data`，否则旧版 `recipes.json` 的武器没有 `weaponFamily` 字段，会被识别为「其他武器」。
