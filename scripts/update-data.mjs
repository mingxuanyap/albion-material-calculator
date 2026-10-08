import fs from "node:fs/promises";
import path from "node:path";
const ROOT = process.cwd();
const BASE = "https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/";
const local = (name) => path.join(ROOT, "data", "source", name);
const output = path.join(ROOT, "data", "recipes.json");
const asArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
async function load(name, url) {
  const filePath = local(name);

  try {
    const txt = await fs.readFile(filePath, "utf8");
    console.log("读取本地文件:", name);
    return JSON.parse(txt);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`下载 ${name}，第 ${attempt} 次尝试...`);

      const res = await fetch(url, {
        signal: AbortSignal.timeout(180000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${url}`);
      }

      const txt = await res.text();
      const data = JSON.parse(txt);

      await fs.writeFile(filePath, txt, "utf8");

      console.log(`下载成功并缓存: ${name}`);
      return data;
    } catch (e) {
      console.error(`下载失败: ${e.cause?.code || e.message}`);

      if (attempt === 3) throw e;
    }
  }
}
function category(id) {
  if (/^T[4-8]_(MAIN_|2H_)/.test(id)) return "weapon";
  if (/^T[4-8]_ARMOR_/.test(id)) return "armor";
  if (/^T[4-8]_HEAD_/.test(id)) return "helmet";
  if (/^T[4-8]_SHOES_/.test(id)) return "shoes";
  if (/^T[4-8]_OFF_/.test(id)) return "offhand";
  if (/^T[4-8]_BAG(?:_|$)/.test(id) || /^T[4-8]_BACKPACK_/.test(id))
    return "bag";
  if (/^T[4-8]_(?:CAPE(?:_|$)|CAPEITEM_)/.test(id)) return "cape";
  return null;
}
function armorType(id) {
  const x = id.match(/_(CLOTH|LEATHER|PLATE)_/);
  return x ? { CLOTH: "布甲", LEATHER: "皮甲", PLATE: "板甲" }[x[1]] : null;
}
function requirement(v) {
  return asArray(v?.craftingrequirements)[0];
}
function sourceId(r) {
  const id = String(r["@uniquename"] || "");
  const lvl = Number(r["@enchantmentlevel"] || 0);
  return lvl && !id.includes("@") ? `${id}@${lvl}` : id;
}
function buildMaterials(req, names) {
  return asArray(req?.craftresource)
    .map((r) => {
      const id = sourceId(r);
      const amount = Number(r["@count"]);
      return {
        id,
        name: names.get(id) || "",
        amount,
        returnable: String(r["@maxreturnamount"] || "") !== "0",
      };
    })
    .filter(
      (m) => m.id && m.name && Number.isSafeInteger(m.amount) && m.amount > 0,
    );
}
function nameMap(data) {
  const names = new Map();
  const entries = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Object.values(data || {}).flatMap((v) => (Array.isArray(v) ? v : []));
  for (const e of entries) {
    const id = e.UniqueName || e.uniqueName || e["@uniquename"];
    const cn = e.LocalizedNames?.["ZH-CN"] || e.localizedNames?.["ZH-CN"];
    if (id && typeof cn === "string" && cn.trim()) names.set(id, cn.trim());
  }
  return names;
}
try {
  const raw = await load("items.json", BASE + "items.json");

  const formatted = await load(
    "formatted-items.json",
    BASE + "formatted/items.json",
  );
  const names = nameMap(formatted);
  const overrides = JSON.parse(
    await fs.readFile(path.join(ROOT, "data", "name-overrides.json"), "utf8"),
  );
  for (const [k, v] of Object.entries(overrides)) {
    if (typeof v === "string" && v.trim()) names.set(k, v.trim());
  }
  const all = [
    ...asArray(raw.items?.equipmentitem),
    ...asArray(raw.items?.weapon),
    ...asArray(raw.items?.transformationweapon),
  ];
  const found = new Map();
  let missingName = 0,
    missingMaterial = 0,
    unclassifiedWeapons = 0;
  const weaponSubcategories = {
    sword: "剑",
    axe: "斧",
    hammer: "战锤",
    mace: "钉头锤",
    quarterstaff: "长棍",
    spear: "长矛",
    dagger: "匕首",
    knuckles: "战斗手套",
    bow: "弓",
    crossbow: "弩",
    firestaff: "火焰法杖",
    froststaff: "冰霜法杖",
    arcanestaff: "奥术法杖",
    cursestaff: "诅咒法杖",
    holystaff: "神圣法杖",
    naturestaff: "自然法杖",
    shapeshifterstaff: "变形法杖",
  };
  function add(id, cat, req, item) {
    const name = names.get(id) || names.get(id.replace(/@\d+$/, ""));
    if (!name) {
      missingName++;
      return;
    }
    const rows = asArray(req?.craftresource);
    if (!rows.length) return;
    const ms = buildMaterials(req, names);
    if (ms.length !== rows.length) {
      missingMaterial++;
      return;
    }
    const sub =
      item?.["@shopsubcategory1"] || item?.["@craftingcategory"] || "";
    const family = cat === "weapon" ? weaponSubcategories[sub] || null : null;
    if (cat === "weapon" && !family) unclassifiedWeapons++;
    found.set(id, {
      id,
      name,
      category: cat,
      armorType: armorType(id),
      weaponFamily: family || undefined,
      subtitle: "",
      source: "ao-bin-dumps",
      materials: ms,
    });
  }
  for (const item of all) {
    const id = item?.["@uniquename"];
    const cat =
      item?.["@shopcategory"] === "weapons" ||
      item?.["@shopsubcategory1"] === "shapeshifterstaff"
        ? "weapon"
        : category(id || "");
    if (!cat || item["@showinmarketplace"] === "false") continue;
    add(id, cat, requirement(item), item);
    for (const e of asArray(item.enchantments?.enchantment)) {
      const lv = Number(e["@enchantmentlevel"]);
      if (Number.isInteger(lv) && lv >= 1 && lv <= 4)
        add(`${id}@${lv}`, cat, requirement(e), item);
    }
  }
  if (found.size < 100)
    throw Error(
      `仅解析到 ${found.size} 项；中文名称 ${names.size} 条。拒绝覆盖旧数据，请检查源文件格式。`,
    );
  const out = [...found.values()].sort(
    (a, b) => a.name.localeCompare(b.name, "zh-CN") || a.id.localeCompare(b.id),
  );
  await fs.writeFile(output, JSON.stringify(out, null, 2) + "\n");
  await fs.writeFile(
    path.join(ROOT, "data", "update-report.json"),
    JSON.stringify(
      {
        updatedAt: new Date().toISOString(),
        recipeCount: out.length,
        missingName,
        missingMaterial,
        unclassifiedWeapons,
        source: "ao-bin-dumps",
        note: "只写入有完整中文名称与完整材料清单的配方",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `成功导入 ${out.length} 条完整中文配方；跳过名称缺失 ${missingName}、材料中文名不全 ${missingMaterial}，未分类武器 ${unclassifiedWeapons}。`,
  );
} catch (e) {
  console.error("更新失败，原有 recipes.json 未被修改:", e.message);
  process.exitCode = 1;
}
