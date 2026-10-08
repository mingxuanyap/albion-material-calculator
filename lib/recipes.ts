import bundledRecipes from '../data/recipes.json';
export type Category = 'weapon'|'armor'|'offhand'|'helmet'|'shoes'|'cape'|'bag';
export type ArmorType = '布甲'|'皮甲'|'板甲'|null;
export type Material = {id:string; name:string; amount:number; returnable:boolean};
export type Recipe = {id:string; name:string; category:Category; armorType?:ArmorType; subtitle:string; materials:Material[]; source?:string; weaponFamily?:string};
export const recipes=bundledRecipes as Recipe[];
export const categories:{id:Category; label:string}[]=[{id:'weapon',label:'武器'},{id:'armor',label:'身体'},{id:'helmet',label:'头部'},{id:'shoes',label:'鞋子'},{id:'offhand',label:'副手'},{id:'cape',label:'披风'},{id:'bag',label:'背包'}];
export const weaponFamilies=['剑','斧','战锤','钉头锤','长棍','长矛','匕首','战斗手套','弓','弩','火焰法杖','冰霜法杖','奥术法杖','诅咒法杖','神圣法杖','自然法杖','变形法杖','其他武器'] as const;
// Official Albion shopsubcategory1 is the source of truth. Never guess from item names.
export const weaponSubcategories:Record<string,string>={
 sword:'剑',axe:'斧',hammer:'战锤',mace:'钉头锤',quarterstaff:'长棍',
 spear:'长矛',dagger:'匕首',knuckles:'战斗手套',bow:'弓',crossbow:'弩',
 firestaff:'火焰法杖',froststaff:'冰霜法杖',arcanestaff:'奥术法杖',
 cursestaff:'诅咒法杖',holystaff:'神圣法杖',naturestaff:'自然法杖',
 shapeshifterstaff:'变形法杖'
};
export function weaponFamily(recipe:Recipe):string {
 return recipe.weaponFamily || '其他武器';
}
export const fmt=(n:number)=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
export function calc(recipe:Recipe,count:number,rrr:number,prices:Record<string,number>){const materials=recipe.materials.map(m=>{const gross=m.amount*count;const returned=m.returnable?gross*(rrr/100):0;const net=gross-returned;const price=prices[m.id]||0;return {...m,gross,returned,net,price,cost:net*price}});return {materials,baseCost:materials.reduce((s,m)=>s+m.cost,0)}}
