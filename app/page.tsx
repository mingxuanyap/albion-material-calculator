"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Hammer,
  SlidersHorizontal,
  Shield,
  Coins,
  RotateCcw,
  Info,
  Check,
  X,
  Plus,
  Trash2,
  Copy,
  Swords,
  Shirt,
  HardHat,
  Footprints,
  BookOpen,
  Flag,
  Backpack,
  Axe,
  Target,
  WandSparkles,
} from "lucide-react";
import {
  calc,
  categories,
  fmt,
  recipes,
  type Category,
  type Recipe,
  type Material,
  weaponFamilies,
  weaponFamily,
} from "../lib/recipes";
const number = (v: string, min = 0) => Math.max(min, Number(v) || 0);
const round = (n: number) => Math.round(n);
const money = (n: number) => `${fmt(round(n))} 银币`;
const defaultPrices: Record<string, number> = {};
const categoryIcons = {
  weapon: Swords,
  armor: Shirt,
  helmet: HardHat,
  shoes: Footprints,
  offhand: BookOpen,
  cape: Flag,
  bag: Backpack,
};
const weaponIcons: Record<string, typeof Swords> = {
  剑: Swords,
  斧: Axe,
  弓: Target,
  弩: Target,
  火焰法杖: WandSparkles,
  冰霜法杖: WandSparkles,
  奥术法杖: WandSparkles,
  诅咒法杖: WandSparkles,
  神圣法杖: WandSparkles,
  自然法杖: WandSparkles,
  变形法杖: WandSparkles,
};
export default function Home() {
  const [category, setCategory] = useState<Category>("weapon");
  const [armorFilter, setArmorFilter] = useState<
    "全部" | "布甲" | "皮甲" | "板甲"
  >("全部");
  const [weaponFilter, setWeaponFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [tier, setTier] = useState(5);
  const [enchant, setEnchant] = useState(3);
  const [count, setCount] = useState(1);
  const [rrr, setRrr] = useState(36.7);
  const [prices, setPrices] = useState<Record<string, number>>(defaultPrices);
  const [salePrice, setSalePrice] = useState(0);
  const [craftFee, setCraftFee] = useState(0);
  const [marketFee, setMarketFee] = useState(6.5);
  const [advanced, setAdvanced] = useState(false);
  const [editRecipe, setEditRecipe] = useState(false);
  const [custom, setCustom] = useState<Recipe[]>([]);
  const [customName, setCustomName] = useState("自定义装备");
  const [customWeaponFamily, setCustomWeaponFamily] = useState("剑");
  const [customMaterials, setCustomMaterials] = useState<Material[]>([
    { id: "leather", name: "皮革", amount: 16, returnable: true },
  ]);
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const dataReady = recipes.some((r) => r.source === "ao-bin-dumps");
  useEffect(() => {
    try {
      const v = localStorage.getItem("albion-forge-v4");
      if (v) {
        const s = JSON.parse(v);
        if (s.prices) setPrices(s.prices);
        if (s.custom) setCustom(s.custom);
        if (s.rrr !== undefined) setRrr(s.rrr);
        if (s.marketFee !== undefined) setMarketFee(s.marketFee);
        if (s.salePrice !== undefined) setSalePrice(s.salePrice);
        if (s.craftFee !== undefined) setCraftFee(s.craftFee);
        if (s.selectedId) setSelectedId(s.selectedId);
        if (s.category) setCategory(s.category);
        if (s.tier) setTier(s.tier);
        if (s.enchant !== undefined) setEnchant(s.enchant);
      }
    } catch {
    } finally {
      setHydrated(true);
    }
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "albion-forge-v4",
        JSON.stringify({
          prices,
          custom,
          rrr,
          marketFee,
          salePrice,
          craftFee,
          selectedId,
          category,
          tier,
          enchant,
        }),
      );
    } catch {}
  }, [
    hydrated,
    prices,
    custom,
    rrr,
    marketFee,
    salePrice,
    craftFee,
    selectedId,
    category,
    tier,
    enchant,
  ]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const all = [...recipes, ...custom];
  const variants = all.filter(
    (r) =>
      r.category === category &&
      (category !== "weapon" ||
        weaponFilter === "全部" ||
        weaponFamily(r) === weaponFilter) &&
      (armorFilter === "全部" ||
        !["armor", "helmet", "shoes"].includes(category) ||
        r.armorType === armorFilter),
  );
  const baseId = (id: string) =>
    id.replace(/^T[4-8]_/, "T4_").replace(/@\d+$/, "");
  const matches = variants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      r.id.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const distinct = new Map<string, Recipe>();
  for (const r of matches) {
    const key = r.source === "ao-bin-dumps" ? baseId(r.id) : r.id;
    if (!distinct.has(key)) distinct.set(key, r);
  }
  const visible = [...distinct.values()].slice(0, 100);
  const chosen = all.find((r) => r.id === selectedId);
  const wanted =
    chosen?.source === "ao-bin-dumps"
      ? `T${tier}_${chosen.id.replace(/^T[4-8]_/, "").replace(/@\d+$/, "")}${enchant ? `@${enchant}` : ""}`
      : chosen?.id;
  const recipe =
    all.find((r) => r.id === wanted && r.category === category) ||
    (chosen?.source !== "ao-bin-dumps" && chosen?.category === category
      ? chosen
      : undefined);
  const canCalculate = Boolean(recipe?.materials.length);
  const safeRecipe: Recipe = recipe || {
    id: "missing",
    name: "尚未选择可用配方",
    category,
    subtitle: "",
    materials: [],
  };
  const calculated = useMemo(
    () => calc(safeRecipe, count, rrr, prices),
    [recipe, count, rrr, prices],
  );
  const crafting = craftFee * count;
  const grossSales = salePrice * count;
  const salesFees = (grossSales * marketFee) / 100;
  const totalCost = calculated.baseCost + crafting + salesFees;
  const profit = grossSales - totalCost;
  const hasPrice =
    canCalculate &&
    salePrice > 0 &&
    calculated.materials.every((m) => m.price > 0);
  function pickCategory(c: Category) {
    setCategory(c);
    setSelectedId("");
    setArmorFilter("全部");
    setWeaponFilter("全部");
    setSearch("");
    setOpen(false);
  }
  function createCustom() {
    const id = "custom-" + Date.now();
    const created: Recipe = {
      id,
      name: customName.trim() || "自定义装备",
      subtitle: "我的配方 · 可自行修改",
      category,
      weaponFamily: category === "weapon" ? customWeaponFamily : undefined,
      armorType:
        (["armor", "helmet", "shoes"] as Category[]).includes(category) &&
        armorFilter !== "全部"
          ? armorFilter
          : null,
      materials: customMaterials
        .filter((m) => m.name && m.amount > 0)
        .map((m, i) => ({ ...m, id: `${id}-${i}` })),
    };
    if (!created.materials.length) return;
    setCustom((c) => [...c, created]);
    setSelectedId(id);
    setEditRecipe(false);
    setSearch("");
  }
  function openEditor() {
    setCustomWeaponFamily(
      category === "weapon" ? recipe?.weaponFamily || "剑" : "剑",
    );
    setCustomName(recipe?.name || "自定义装备");
    setCustomMaterials(
      recipe?.materials.map((m) => ({ ...m })) || [
        { id: "new", name: "", amount: 1, returnable: true },
      ],
    );
    setEditRecipe(true);
  }
  function copySummary() {
    const str =
      `${safeRecipe.name} T${tier}.${enchant} × ${count}\n返还率 ${rrr}%\n` +
      calculated.materials
        .map(
          (m) =>
            `${m.name}: 原始 ${fmt(m.gross)} / 净消耗约 ${fmt(Math.ceil(m.net))}`,
        )
        .join("\n");
    navigator.clipboard
      ?.writeText(str)
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
      })
      .catch(() => {});
  }
  return (
    <div className="site">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brandmark">
              <Hammer size={24} />
            </div>
            <div>
              <div className="brandname">
                阿尔比恩 <span>锻造工坊</span>
              </div>
              <div className="brandcaption">装备制作与利润计算</div>
            </div>
          </div>
          <span className="topnote">全中文 · 无数据库 · 本地保存</span>
        </div>
      </header>
      <main className="main">
        <div className="eyebrow">
          <span className="line" /> 阿尔比恩 · 装备制作工具{" "}
          <span className="line" />
        </div>
        <h1>
          装备制作<span>计算器</span>
        </h1>
        <p className="intro">选装备、填数量，材料和预计利润一眼看清。</p>
        <section className="panel mainpanel">
          <div className="panel-title">
            <span className="step">01</span>
            <div>
              <h2>选择装备</h2>
              <p>先选分类，再搜索名称</p>
            </div>
          </div>
          <div className="category-list">
            {categories.map((c) => (
              <button
                key={c.id}
                className={`category ${category === c.id ? "active" : ""}`}
                onClick={() => pickCategory(c.id)}
              >
                <span className="category-symbol">
                  {(() => {
                    const Icon = categoryIcons[c.id];
                    return <Icon size={26} strokeWidth={1.8} />;
                  })()}
                </span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
          {category === "weapon" && (
            <div className="weapon-filter" aria-label="武器分类">
              {["全部", ...weaponFamilies].map((x) => (
                <button
                  key={x}
                  className={weaponFilter === x ? "active" : ""}
                  onClick={() => {
                    setWeaponFilter(x);
                    setSelectedId("");
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  {x}
                </button>
              ))}
            </div>
          )}
          {(["armor", "helmet", "shoes"] as Category[]).includes(category) && (
            <div className="armor-filter">
              {(["全部", "布甲", "皮甲", "板甲"] as const).map((x) => (
                <button
                  key={x}
                  className={armorFilter === x ? "active" : ""}
                  onClick={() => {
                    setArmorFilter(x);
                    setSelectedId("");
                    setSearch("");
                  }}
                >
                  {x}
                </button>
              ))}
            </div>
          )}
          <div className="equipment-area">
            <div className="equipment-select" ref={listRef}>
              <label className="fieldlabel">装备名称</label>
              <button
                className={`searchbutton ${open ? "focus" : ""}`}
                onClick={() => setOpen((o) => !o)}
              >
                <Search size={17} />
                <span className="name">
                  {recipe?.category === category ? recipe.name : "搜索装备..."}
                </span>
                <span className="searchhint">输入名称即可搜索</span>
                <ChevronDown size={16} />
              </button>
              {open && (
                <div className="dropdown">
                  <div className="searchline">
                    <Search size={17} />
                    <input
                      value={search}
                      autoFocus
                      placeholder="输入装备名称搜索..."
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button onClick={() => setSearch("")} aria-label="清除">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="options">
                    {visible.length ? (
                      visible.map((r) => (
                        <button
                          key={r.id}
                          className={`option ${selectedId === r.id ? "selected" : ""}`}
                          onClick={() => {
                            setSelectedId(r.id);
                            setOpen(false);
                            setSearch("");
                          }}
                        >
                          <div className="equipment-glyph">
                            {(() => {
                              const Icon =
                                r.category === "weapon"
                                  ? weaponIcons[weaponFamily(r)] || Swords
                                  : categoryIcons[r.category];
                              return <Icon size={21} strokeWidth={1.8} />;
                            })()}
                          </div>
                          <div>
                            <strong>{r.name}</strong>
                          </div>
                          {selectedId === r.id && <Check size={16} />}
                        </button>
                      ))
                    ) : (
                      <div className="noresults">
                        没有找到有完整中文配方的装备。请先运行数据更新，或使用自定义配方。
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="custom-link" onClick={openEditor}>
              <Plus size={15} /> 自定义配方
            </button>
          </div>
          <div className="settings-grid">
            <div className="field">
              <label className="fieldlabel">装备等级</label>
              <div className="tier-group">
                <select
                  value={tier}
                  onChange={(e) => setTier(+e.target.value)}
                  aria-label="Tier"
                >
                  {[4, 5, 6, 7, 8].map((t) => (
                    <option key={t} value={t}>
                      T{t}
                    </option>
                  ))}
                </select>
                <select
                  value={enchant}
                  onChange={(e) => setEnchant(+e.target.value)}
                  aria-label="附魔"
                >
                  {[0, 1, 2, 3, 4].map((e) => (
                    <option key={e} value={e}>
                      .{e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="fieldlabel">制作数量</label>
              <div className="qty">
                <button
                  onClick={() => setCount((n) => Math.max(1, n - 1))}
                  aria-label="减少"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={count}
                  onChange={(e) =>
                    setCount(Math.max(1, number(e.target.value)))
                  }
                />
                <button
                  onClick={() => setCount((n) => n + 1)}
                  aria-label="增加"
                >
                  +
                </button>
              </div>
            </div>
            <div className="field">
              <label className="fieldlabel">
                资源返还率{" "}
                <span
                  className="help"
                  title="游戏内显示的返还率；仅用于可返还材料"
                >
                  ⓘ
                </span>
              </label>
              <div className="percent-input">
                <input
                  type="number"
                  min="0"
                  max="99"
                  step="0.1"
                  value={rrr}
                  onChange={(e) => setRrr(Math.min(99, number(e.target.value)))}
                />
                <span>%</span>
              </div>
            </div>
          </div>
          <div className="notice">
            <Info size={15} />
            <span>
              {dataReady
                ? "已载入游戏数据中文配方；仍请根据游戏版本检查。"
                : "目前尚未导入已验证的游戏数据。先运行 npm run update:data，或添加自定义配方。"}
            </span>
          </div>
        </section>
        <section className="panel resultpanel">
          <div className="panel-title compact">
            <span className="step">02</span>
            <div>
              <h2>材料清单</h2>
              <p>
                {safeRecipe.name} · T{tier}.{enchant} · {fmt(count)} 件
              </p>
            </div>
            <button
              className="iconbutton"
              onClick={copySummary}
              title="复制材料清单"
            >
              {saved ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          {!canCalculate && (
            <div className="empty-state">
              当前选择没有对应 T{tier}.{enchant}{" "}
              的完整中文配方，不显示猜测材料。可以更换等级、更新数据或创建自定义配方。
            </div>
          )}
          <div className="tablewrap">
            <table className="materialtable">
              <thead>
                <tr>
                  <th>材料</th>
                  <th>原始需求</th>
                  <th>返还预估</th>
                  <th>净消耗约</th>
                </tr>
              </thead>
              <tbody>
                {calculated.materials.map((m, i) => (
                  <tr key={i}>
                    <td>
                      <div className="materialname">
                        <div
                          className={`materialicon ${m.returnable ? "" : "artifact"}`}
                        >
                          {m.returnable ? "◆" : "✦"}
                        </div>
                        <div>
                          <strong>
                            {m.name}{" "}
                            <span className="grade">
                              {m.returnable && m.id.match(/^T[4-8]_/) ? "" : ""}
                            </span>
                          </strong>
                          <small>
                            {m.returnable ? "普通材料" : "神器 / 不返还"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{fmt(m.gross)}</td>
                    <td className="muted">
                      {m.returnable ? fmt(round(m.returned)) : "—"}
                    </td>
                    <td className="gold">
                      <strong>{fmt(Math.ceil(m.net))}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="footnote">
            返还为理论平均估算；净消耗按每种材料向上取整，仅供备料参考。神器类材料不会参与普通资源返还。
          </div>
        </section>
        <section className="panel profitpanel">
          <div className="panel-title compact">
            <span className="step">03</span>
            <div>
              <h2>成本与利润</h2>
              <p>只要填写材料单价和装备售价</p>
            </div>
          </div>
          <div className="priceheader">
            <h3>
              <Coins size={17} /> 材料单价
            </h3>
            <span>银币 / 个</span>
          </div>
          <div className="pricegrid">
            {calculated.materials.map((m, i) => (
              <div className="pricefield" key={`${m.id}-${i}`}>
                <label>{m.name}</label>
                <div className="silverinput">
                  <input
                    type="number"
                    min="0"
                    placeholder="输入单价"
                    value={prices[m.id] || ""}
                    onChange={(e) =>
                      setPrices((p) => ({
                        ...p,
                        [m.id]: number(e.target.value),
                      }))
                    }
                  />
                  <span>银币</span>
                </div>
              </div>
            ))}
          </div>
          <div className="twocol">
            <div className="pricefield">
              <label>装备出售单价</label>
              <div className="silverinput">
                <input
                  type="number"
                  min="0"
                  placeholder="输入售价"
                  value={salePrice || ""}
                  onChange={(e) => setSalePrice(number(e.target.value))}
                />
                <span>银币</span>
              </div>
            </div>
            <div className="pricefield">
              <label>每件制作费用</label>
              <div className="silverinput">
                <input
                  type="number"
                  min="0"
                  placeholder="可选"
                  value={craftFee || ""}
                  onChange={(e) => setCraftFee(number(e.target.value))}
                />
                <span>银币</span>
              </div>
            </div>
          </div>
          <button
            className="advanced-toggle"
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal size={15} /> 市场费用设置{" "}
            <ChevronDown size={15} className={advanced ? "flip" : ""} />
          </button>
          {advanced && (
            <div className="advanced">
              <label>市场综合费用率 (%)</label>
              <div className="percent-input small">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={marketFee}
                  onChange={(e) =>
                    setMarketFee(Math.min(100, number(e.target.value)))
                  }
                />
                <span>%</span>
              </div>
              <p>
                默认 6.5% 仅为可修改的示例值，请根据账号状态与实际市场费用调整。
              </p>
            </div>
          )}
          <div className="profit-summary">
            <div>
              <small>预计材料成本</small>
              <strong>{hasPrice ? money(calculated.baseCost) : "—"}</strong>
            </div>
            <div>
              <small>预计总成本（含费用）</small>
              <strong>{hasPrice ? money(totalCost) : "—"}</strong>
            </div>
            <div
              className={`highlight ${profit < 0 && hasPrice ? "negative" : ""}`}
            >
              <small>预计总利润</small>
              <strong>
                {hasPrice
                  ? `${profit >= 0 ? "+" : "−"} ${money(Math.abs(profit))}`
                  : "等待价格输入"}
              </strong>
              <span>
                {hasPrice
                  ? `每件 ${money(profit / Math.max(1, count))} · ROI ${totalCost ? ((profit / totalCost) * 100).toFixed(1) : "0.0"}%`
                  : "填完材料单价与售价后显示"}
              </span>
            </div>
          </div>
        </section>
        <footer>
          <Shield size={15} /> 非官方 Albion Online 工具 · 制造人 MrPapaya622
        </footer>
      </main>
      {editRecipe && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditRecipe(false);
          }}
        >
          <div className="modal">
            <div className="modalhead">
              <div>
                <h2>自定义装备配方</h2>
                <p>适合神器装备、游戏版本更新或尚未收录的装备</p>
              </div>
              <button
                className="iconbutton"
                onClick={() => setEditRecipe(false)}
              >
                <X size={20} />
              </button>
            </div>
            <label className="fieldlabel">装备名称</label>
            <input
              className="modalinput"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            {category === "weapon" && (
              <>
                <label className="fieldlabel">武器系</label>
                <select
                  className="modalinput"
                  value={customWeaponFamily}
                  onChange={(e) => setCustomWeaponFamily(e.target.value)}
                >
                  {weaponFamilies
                    .filter((x) => x !== "其他武器")
                    .map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                </select>
              </>
            )}
            <div className="recipehead">
              <strong>每件材料数量</strong>
              <small>勾选「可返还」代表普通材料</small>
            </div>
            {customMaterials.map((m, i) => (
              <div className="recipeitem" key={i}>
                <input
                  aria-label="材料名称"
                  value={m.name}
                  placeholder="材料名"
                  onChange={(e) =>
                    setCustomMaterials((ms) =>
                      ms.map((v, j) =>
                        j === i ? { ...v, name: e.target.value } : v,
                      ),
                    )
                  }
                />
                <input
                  aria-label="每件数量"
                  type="number"
                  min="1"
                  value={m.amount}
                  onChange={(e) =>
                    setCustomMaterials((ms) =>
                      ms.map((v, j) =>
                        j === i ? { ...v, amount: number(e.target.value) } : v,
                      ),
                    )
                  }
                />
                <label className="checklabel">
                  <input
                    type="checkbox"
                    checked={m.returnable}
                    onChange={(e) =>
                      setCustomMaterials((ms) =>
                        ms.map((v, j) =>
                          j === i ? { ...v, returnable: e.target.checked } : v,
                        ),
                      )
                    }
                  />
                  可返还
                </label>
                <button
                  aria-label="删除材料"
                  className="iconbutton"
                  onClick={() =>
                    setCustomMaterials((ms) => ms.filter((_, j) => j !== i))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              className="addmaterial"
              onClick={() =>
                setCustomMaterials((ms) => [
                  ...ms,
                  { id: "custom", name: "新材料", amount: 1, returnable: true },
                ])
              }
            >
              <Plus size={16} /> 添加材料
            </button>
            <button className="savebutton" onClick={createCustom}>
              保存并选择配方 <ChevronRight size={17} />
            </button>
            <p className="modalfoot">
              自定义配方会保存在当前浏览器，刷新不丢失。清理浏览器数据会删除它；正式公开配方请写入
              data/recipes.json。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
