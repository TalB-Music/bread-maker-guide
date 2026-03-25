import { useState, useEffect, useRef, useCallback } from "react";

// ── THEME ─────────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:"#f2f2f0", surface:"#ffffff", card:"#ffffff", cardBorder:"#ddddd8",
  accent:"#5a8a80", accentLight:"#7aada4", accentDim:"#3d6860",
  text:"#1c1c1e", textSub:"#3a3a3c", textDim:"#8e8e93",
  danger:"#b03020", success:"#2e7d5e",
  lcdBg:"#2a4030", lcd:"#90c890",
  highlight:"#ebebea", inputBg:"#f5f5f3",
  navBg:"#eaeae8", pill:"#e0e0de",
};
const DARK = {
  bg:"#18181a", surface:"#232325", card:"#2a2a2c", cardBorder:"#3c3c3e",
  accent:"#6aada4", accentLight:"#8ac8c0", accentDim:"#4a8078",
  text:"#f0f0f2", textSub:"#c0c0c4", textDim:"#7a7a80",
  danger:"#d05545", success:"#50c878",
  lcdBg:"#1a2e20", lcd:"#80b880",
  highlight:"#343436", inputBg:"#1e1e20",
  navBg:"#1a1a1c", pill:"#3a3a3e",
};

// ── COMPLEXITY ICONS (effort/hands-on level) ──────────────────────────────────
// 🟢 = dead easy, set-and-forget | 🔥 = more work involved
const EFFORT = ["🟢","🌿","🧑‍🍳","🔥","⚗️"];
const EFFORT_LABEL = ["Set & forget","Easy","A bit of prep","Hands-on","Advanced"];

// ── MANUAL LINK ──────────────────────────────────────────────────────────────
const MANUAL_URL = "https://www.manualslib.com/manual/1190682/Kuchef-104906.html";

// ── PROGRAMS ─────────────────────────────────────────────────────────────────
const PROGRAMS = [
  {num:1,name:"Basic",sizes:[750,1000,1250],color:true,rapid:true,timer:true,dispenser:true,warm:true,times:{750:"3:23",1000:"3:26",1250:"3:30"}},
  {num:2,name:"French",sizes:[750,1000,1250],color:true,rapid:true,timer:true,dispenser:false,warm:false,times:{750:"3:39",1000:"3:43",1250:"3:48"}},
  {num:3,name:"Wholemeal",sizes:[750,1000,1250],color:true,rapid:true,timer:true,dispenser:true,warm:true,times:{750:"3:24",1000:"3:27",1250:"3:31"}},
  {num:4,name:"Sweet",sizes:[750,1000,1250],color:true,rapid:false,timer:false,dispenser:true,warm:true,times:{750:"3:16",1000:"3:19",1250:"3:22"}},
  {num:5,name:"Gluten-free",sizes:[750,1000,1250],color:true,rapid:false,timer:false,dispenser:true,warm:true,times:{750:"3:15",1000:"3:18",1250:"3:20"}},
  {num:6,name:"Rye",sizes:[750,1000,1250],color:true,rapid:false,timer:true,dispenser:true,warm:true,times:{750:"3:48",1000:"3:51",1250:"3:55"}},
  {num:7,name:"Quick",sizes:[1250],color:false,rapid:false,timer:false,dispenser:false,warm:true,times:{1250:"1:20"}},
  {num:8,name:"Italian",sizes:[750,1000,1250],color:true,rapid:false,timer:false,dispenser:false,warm:false,times:{750:"3:34",1000:"3:37",1250:"3:40"}},
  {num:9,name:"Dough",sizes:[],color:false,rapid:false,timer:false,dispenser:false,warm:false,times:{default:"1:30"}},
  {num:10,name:"Pasta",sizes:[],color:false,rapid:false,timer:false,dispenser:false,warm:false,times:{default:"0:14"}},
  {num:11,name:"Milk Bread",sizes:[750,1000,1250],color:true,rapid:false,timer:true,dispenser:true,warm:true,times:{750:"3:17",1000:"3:20",1250:"3:24"}},
  {num:12,name:"Jam",sizes:[],color:false,rapid:false,timer:false,dispenser:false,warm:false,times:{default:"1:05"}},
  {num:13,name:"Bake Only",sizes:[],color:false,rapid:false,timer:false,dispenser:false,warm:true,times:{default:"1:00"}},
];

// ── VOLUME HELPERS ────────────────────────────────────────────────────────────
// Australian cup = 250ml
// Bread flour ~150g/cup (lightly spooned), water 250ml/cup
// All recipes below use volume. Scale factors: 750→1.0, 1000→1.33, 1250→1.67

function fraction(n) {
  if (!n && n!==0) return "—";
  const frac = (v)=>{
    const parts = [[1/8,"⅛"],[1/6,"⅙"],[1/4,"¼"],[1/3,"⅓"],[3/8,"⅜"],[1/2,"½"],[2/3,"⅔"],[3/4,"¾"],[7/8,"⅞"]];
    const whole = Math.floor(v); const rem = v - whole;
    const closest = parts.reduce((a,b)=>Math.abs(b[0]-rem)<Math.abs(a[0]-rem)?b:a,[0,""]);
    if (Math.abs(rem)<0.04) return whole ? `${whole}` : "0";
    if (Math.abs(rem-closest[0])<0.07) return whole ? `${whole} ${closest[1]}` : closest[1];
    return (Math.round(v*4)/4).toFixed(2).replace(/\.?0+$/,"");
  };
  return frac(n);
}

function scaleVol(base750, size) {
  const f = size===750?1:size===1000?1.33:1.67;
  return base750*f;
}

// ── RECIPES ───────────────────────────────────────────────────────────────────
// Ingredient amounts given as {base750, unit} — scaled at render time
// unit: "cups" | "tbsp" | "tsp" | "ml" | "pcs"
const BASE_RECIPES = [
  // ── BASIC (1) ──────────────────────────────────────────────────────────────
  {
    id:"never-fail",program:1,programName:"Basic",
    title:"Never-Fail White Loaf",emoji:"⭐",category:"breads",effort:0,
    defaultSize:750,supportedSizes:[750,1000,1250],color:"Medium",
    times:{750:"3:23",1000:"3:26",1250:"3:30"},
    tagline:"The foolproof everyday loaf. Ingredients in, walk away.",
    precision:"This recipe uses a 1:1 flour-to-water ratio by volume — that's what makes it reliable. Don't be tempted to reduce the water.",
    dispenser:null,
    ingredients:[
      {item:"White bread flour",base750:3,unit:"cups",note:""},
      {item:"Water",base750:3,unit:"cups",note:"Room temp"},
      {item:"Butter (melted, cooled)",base750:3.5,unit:"tbsp",note:"~50g"},
      {item:"Sugar",base750:2,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:1.5,unit:"tsp",note:""},
      {item:"Salt",base750:1.5,unit:"tsp",note:""},
    ],
    steps:[
      "Remove the tin. Seat both kneading blades on their spindles.",
      "Pour water into the tin, then add the melted butter.",
      "Add all the flour.",
      "Make a small well on one side of the flour — add yeast. Cover it.",
      "Make a well on the opposite side — add salt. Cover it.",
      "Sprinkle sugar on top.",
      "Lock tin in until it clicks. Close the lid.",
      "Press MENU until Menu 1 (Basic). Set Loaf to {SIZE}. Set Colour to Medium.",
      "Press START. Total time: {TIME}. Walk away.",
      "When the machine beeps and shows 0:00, press STOP, unplug, remove tin with oven mitts.",
      "Cool on a wire rack 20 min before slicing.",
    ],
  },
  {
    id:"basic-timer",program:1,programName:"Basic",
    title:"Wake-Up Loaf (Delay Timer)",emoji:"⏰",category:"breads",effort:0,
    defaultSize:1250,supportedSizes:[750,1000,1250],color:"Medium",
    times:{750:"3:23",1000:"3:26",1250:"3:30"},
    tagline:"Set it before bed. Wake up to fresh bread.",
    precision:"NEVER use perishables (milk, eggs, butter) with the timer — only water and olive oil. Set the DELAY (waiting time), not the finish time. Example: bed at 10pm, want bread at 7am = 9 hours minus 3:30 = set 5:30 delay.",
    dispenser:null,
    ingredients:[
      {item:"White bread flour",base750:3,unit:"cups",note:""},
      {item:"Water",base750:1.25,unit:"cups",note:"Room temp — no butter with timer!"},
      {item:"Extra virgin olive oil",base750:2,unit:"tbsp",note:"Use oil, not butter, for timer recipes"},
      {item:"Sugar",base750:2,unit:"tbsp",note:""},
      {item:"Milk powder",base750:2,unit:"tbsp",note:"Replaces fresh milk safely"},
      {item:"Instant dried yeast",base750:1.5,unit:"tsp",note:""},
      {item:"Salt",base750:1.5,unit:"tsp",note:""},
    ],
    steps:[
      "Load ingredients into the tin in the usual order: water → oil → flour → yeast well + salt well → sugar + milk powder.",
      "Lock tin. Close lid.",
      "Press MENU → Menu 1 (Basic). Set Loaf to {SIZE}. Set Colour to Medium.",
      "Calculate your delay: (desired finish time) − (program time {TIME}) = delay to set.",
      "Press ▲ or ▼ to set the delay time. The display shows total countdown.",
      "Press START. The machine waits, then bakes automatically.",
      "Wake up to fresh bread. Remove and cool as normal.",
    ],
  },
  // ── FRENCH (2) ─────────────────────────────────────────────────────────────
  {
    id:"french",program:2,programName:"French",
    title:"French Country Bread",emoji:"🥖",category:"breads",effort:0,
    defaultSize:1250,supportedSizes:[750,1000,1250],color:"Dark",
    times:{750:"3:39",1000:"3:43",1250:"3:48"},
    tagline:"Crispy crust, airy interior. Just four ingredients.",
    precision:"The French program runs longer and hotter than Basic — that's what gives it the crispy crust. No dispenser. No keep-warm cycle — remove promptly when done.",
    dispenser:null,
    ingredients:[
      {item:"White bread flour",base750:3,unit:"cups",note:"High-protein if possible"},
      {item:"Water",base750:1,unit:"cups",note:"Room temp"},
      {item:"Extra virgin olive oil",base750:2,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:1,unit:"tsp",note:""},
      {item:"Salt",base750:1.5,unit:"tsp",note:""},
      {item:"Sugar",base750:1,unit:"tbsp",note:"Just a touch"},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour water and olive oil into tin.",
      "Add flour.",
      "Well on one side → yeast. Well on opposite side → salt.",
      "Sprinkle sugar on top.",
      "Lock tin. Press MENU → Menu 2 (French). Set Loaf {SIZE}. Set Colour Dark.",
      "Press START. Time: {TIME}.",
      "No keep-warm on French — remove as soon as it beeps.",
      "Cool on a rack. Best eaten same day.",
    ],
  },
  // ── WHOLEMEAL (3) ──────────────────────────────────────────────────────────
  {
    id:"harvest",program:3,programName:"Wholemeal",
    title:"Harvest Seeded Loaf",emoji:"🌾",category:"breads",effort:2,
    defaultSize:1250,supportedSizes:[750,1000,1250],color:"Dark",
    times:{750:"3:24",1000:"3:27",1250:"3:31"},
    tagline:"Nutty, dense, packed with seeds. The pre-soak is the secret.",
    precision:"PRE-SOAK oats and flax in boiling water for 15 min before loading — this counts as part of your liquid. Seeds go in the dispenser; auto-released automatically.",
    dispenser:"½ cup mixed seeds (sunflower, pumpkin, sesame) — load into the lid dispenser",
    ingredients:[
      {item:"White bread flour",base750:1.5,unit:"cups",note:""},
      {item:"Wholemeal flour",base750:1.25,unit:"cups",note:""},
      {item:"Water (room temp)",base750:0.75,unit:"cups",note:""},
      {item:"Rolled oats — PRE-SOAK",base750:0.25,unit:"cups",note:"Cover with ½ cup boiling water, cool 15 min"},
      {item:"Ground flaxseed — PRE-SOAK",base750:2,unit:"tbsp",note:"Add to same soak bowl"},
      {item:"Honey",base750:2,unit:"tbsp",note:"Or brown sugar"},
      {item:"Extra virgin olive oil",base750:2,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:1.5,unit:"tsp",note:""},
      {item:"Salt",base750:1.5,unit:"tsp",note:""},
      {item:"Mixed seeds (dispenser)",base750:0.5,unit:"cups",note:"Load into dispenser BEFORE start"},
    ],
    steps:[
      "PRE-SOAK: Combine oats + flaxseed in a small bowl. Cover with boiling water. Stir and cool 15 min.",
      "Remove tin. Seat both blades.",
      "Pour room-temp water into tin. Add the cooled oat soak, honey, and olive oil.",
      "Add white flour, then wholemeal flour.",
      "Well one side → yeast. Opposite side → salt.",
      "Load the seed mix into the fruit dispenser on the lid.",
      "Lock tin. Menu 3 (Wholemeal) → Loaf {SIZE} → Colour Dark.",
      "Press START. Time: {TIME}. Seeds auto-release ~20 min in.",
      "Cool completely before slicing — wholemeal needs it.",
    ],
  },
  // ── SWEET (4) ──────────────────────────────────────────────────────────────
  {
    id:"cinnamon-raisin",program:4,programName:"Sweet",
    title:"Cinnamon Raisin Bread",emoji:"🍇",category:"breads",effort:1,
    defaultSize:1250,supportedSizes:[750,1000,1250],color:"Light",
    times:{750:"3:16",1000:"3:19",1250:"3:22"},
    tagline:"Warm spice and sweet raisins. Makes incredible French toast the next day.",
    precision:"Use Light colour — the sugar content will brown the crust naturally. Dark will burn it. Raisins go into the dispenser; auto-released ~20 min in.",
    dispenser:"¾ cup raisins — load into lid dispenser before pressing START",
    ingredients:[
      {item:"White bread flour",base750:3,unit:"cups",note:""},
      {item:"Milk",base750:0.75,unit:"cups",note:"Warm"},
      {item:"Water",base750:0.375,unit:"cups",note:""},
      {item:"Butter (room temp)",base750:3,unit:"tbsp",note:"Cubed"},
      {item:"Brown sugar",base750:3,unit:"tbsp",note:"Packed"},
      {item:"Ground cinnamon",base750:1.5,unit:"tsp",note:"Generous"},
      {item:"Instant dried yeast",base750:1.5,unit:"tsp",note:""},
      {item:"Salt",base750:1,unit:"tsp",note:""},
      {item:"Raisins (dispenser)",base750:0.5,unit:"cups",note:"Into dispenser"},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour water and milk into tin. Add butter cubes.",
      "Add all flour.",
      "Well one side → yeast. Opposite → salt.",
      "Sprinkle brown sugar and cinnamon.",
      "Load raisins into the lid dispenser.",
      "Lock tin. Menu 4 (Sweet) → Loaf {SIZE} → Colour Light.",
      "Press START. Time: {TIME}. Raisins auto-release ~20 min in.",
      "Remove promptly when done. Cool before slicing.",
    ],
  },
  {
    id:"choc-swirl",program:4,programName:"Sweet",
    title:"Dark Chocolate Chip Bread",emoji:"🍫",category:"breads",effort:1,
    defaultSize:1250,supportedSizes:[750,1000,1250],color:"Light",
    times:{750:"3:16",1000:"3:19",1250:"3:22"},
    tagline:"Between bread and dessert. Chocolate rivers in every slice.",
    precision:"Always use Light colour for this — the sugar and cocoa will make the crust dark on their own. Chocolate chips go in the dispenser.",
    dispenser:"½ cup dark chocolate chips — load into lid dispenser before START",
    ingredients:[
      {item:"White bread flour",base750:2.5,unit:"cups",note:""},
      {item:"Wholemeal flour",base750:0.5,unit:"cups",note:"Adds nuttiness"},
      {item:"Water",base750:0.875,unit:"cups",note:""},
      {item:"Butter (room temp)",base750:3,unit:"tbsp",note:"Cubed"},
      {item:"Cocoa powder",base750:2,unit:"tbsp",note:"Dutch-process if possible"},
      {item:"Sugar",base750:3,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:1.5,unit:"tsp",note:""},
      {item:"Salt",base750:1,unit:"tsp",note:""},
      {item:"Dark chocolate chips (dispenser)",base750:0.5,unit:"cups",note:"Into dispenser"},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour water in. Add butter cubes.",
      "Add both flours and cocoa powder.",
      "Well one side → yeast. Opposite → salt. Sprinkle sugar.",
      "Load chocolate chips into the lid dispenser.",
      "Lock tin. Menu 4 (Sweet) → Loaf {SIZE} → Colour Light.",
      "Press START. Time: {TIME}. Chips auto-release ~20 min in.",
      "Cool completely — the chocolate rivers need to set.",
    ],
  },
  // ── GLUTEN-FREE (5) ────────────────────────────────────────────────────────
  {
    id:"gf-white",program:5,programName:"Gluten-free",
    title:"Gluten-Free White Loaf",emoji:"🌾🚫",category:"breads",effort:1,
    defaultSize:1000,supportedSizes:[750,1000,1250],color:"Medium",
    times:{750:"3:15",1000:"3:18",1250:"3:20"},
    tagline:"A proper sandwich loaf without any gluten. The batter looks wrong — trust the process.",
    precision:"GF batter is much wetter than wheat dough — it won't form a ball, it will look like thick cake batter. That's correct. Don't add more flour. Use a supermarket GF bread flour blend (contains xanthan gum). Both blades must be fitted. Don't open the lid.",
    dispenser:null,
    ingredients:[
      {item:"GF bread flour blend",base750:2.75,unit:"cups",note:"Must contain xanthan gum"},
      {item:"Warm water",base750:1.125,unit:"cups",note:"Slightly warm, not hot"},
      {item:"Eggs",base750:2,unit:"pcs",note:"Room temp, beaten"},
      {item:"Vegetable oil",base750:3,unit:"tbsp",note:""},
      {item:"Apple cider vinegar",base750:1,unit:"tsp",note:"Helps the structure"},
      {item:"Sugar",base750:2,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:2,unit:"tsp",note:"GF needs a bit more"},
      {item:"Salt",base750:1,unit:"tsp",note:""},
    ],
    steps:[
      "Remove tin. Seat BOTH blades — critical for GF.",
      "Whisk eggs, water, oil and vinegar together first.",
      "Pour wet mix into tin.",
      "Add GF flour.",
      "Well one side → yeast. Opposite → salt. Sprinkle sugar.",
      "Lock tin. Menu 5 (Gluten-free) → Loaf {SIZE} → Colour Medium.",
      "Press START. Time: {TIME}.",
      "Do NOT open the lid. GF bread is fragile while rising.",
      "Cool completely in the tin for 15 min, then on a rack 1 hour before slicing.",
    ],
  },
  // ── RYE (6) ────────────────────────────────────────────────────────────────
  {
    id:"rye",program:6,programName:"Rye",
    title:"Dark Rye Bread",emoji:"🖤",category:"breads",effort:1,
    defaultSize:1250,supportedSizes:[750,1000,1250],color:"Dark",
    times:{750:"3:48",1000:"3:51",1250:"3:55"},
    tagline:"Dense, earthy, Northern European. Slice thin with smoked salmon.",
    precision:"Never exceed 70% rye flour — rye has no gluten and won't rise without wheat flour. Minimum 30% wheat is required. The Rye program includes a special hold phase for the grains.",
    dispenser:"1 tbsp caraway seeds (optional) — into dispenser",
    ingredients:[
      {item:"Rye flour",base750:1.5,unit:"cups",note:"Max 70% of total flour"},
      {item:"White bread flour",base750:1,unit:"cups",note:"Min 30% — required for rise"},
      {item:"Water",base750:1.125,unit:"cups",note:""},
      {item:"Extra virgin olive oil",base750:2,unit:"tbsp",note:""},
      {item:"Brown sugar",base750:2,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:1,unit:"tsp",note:""},
      {item:"Salt",base750:1.5,unit:"tsp",note:""},
      {item:"Caraway seeds (opt.)",base750:1,unit:"tbsp",note:"Into dispenser"},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour water and oil into tin.",
      "Add rye flour, then white flour.",
      "Well one side → yeast. Opposite → salt. Sprinkle brown sugar.",
      "Load caraway seeds into dispenser if using.",
      "Lock tin. Menu 6 (Rye) → Loaf {SIZE} → Colour Dark.",
      "Press START. Time: {TIME}. Longest bread program.",
      "Cool completely before slicing. Rye must be fully cooled.",
    ],
  },
  // ── QUICK (7) ──────────────────────────────────────────────────────────────
  {
    id:"quick-white",program:7,programName:"Quick",
    title:"Quick Emergency Loaf",emoji:"⚡",category:"breads",effort:0,
    defaultSize:1250,supportedSizes:[1250],color:"N/A",
    times:{1250:"1:20"},
    tagline:"1 hour 20 minutes from ingredients to bread. Denser but totally edible.",
    precision:"Quick program skips the long rest and rise stages — bread will be more compact and firm than Basic. Only available in 1250g. No colour options. Great for when you need bread fast.",
    dispenser:null,
    ingredients:[
      {item:"White bread flour",base750:3,unit:"cups",note:""},
      {item:"Water",base750:1.375,unit:"cups",note:"Slightly warm — helps the speed rise"},
      {item:"Extra virgin olive oil",base750:2,unit:"tbsp",note:""},
      {item:"Sugar",base750:2,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:2,unit:"tsp",note:"Extra yeast for the fast cycle"},
      {item:"Salt",base750:1.5,unit:"tsp",note:""},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour slightly warm water and oil into tin.",
      "Add flour.",
      "Well one side → yeast. Opposite → salt. Sprinkle sugar.",
      "Lock tin. Menu 7 (Quick). (No size or colour options for this program.)",
      "Press START. Total time: 1:20.",
      "Bread will be denser than Basic — that's normal for Quick cycle.",
      "Cool 20 min before slicing.",
    ],
  },
  // ── ITALIAN (8) ────────────────────────────────────────────────────────────
  {
    id:"italian-herb",program:8,programName:"Italian",
    title:"Italian Herb & Olive Oil Bread",emoji:"🌿",category:"breads",effort:1,
    defaultSize:1250,supportedSizes:[750,1000,1250],color:"Medium",
    times:{750:"3:34",1000:"3:37",1250:"3:40"},
    tagline:"Light, fragrant, golden. Tear and dip into balsamic.",
    precision:"Italian program gives a lighter, airier crumb. No dispenser, no timer, no keep-warm on this program. Add herbs directly to the pan — don't use the dispenser.",
    dispenser:null,
    ingredients:[
      {item:"White bread flour",base750:3,unit:"cups",note:""},
      {item:"Water",base750:1,unit:"cups",note:""},
      {item:"Extra virgin olive oil",base750:3,unit:"tbsp",note:"Extra virgin"},
      {item:"Dried oregano",base750:1,unit:"tbsp",note:"Or mixed Italian herbs"},
      {item:"Dried rosemary",base750:2,unit:"tsp",note:"Crushed"},
      {item:"Garlic powder",base750:1,unit:"tsp",note:"Optional"},
      {item:"Sugar",base750:1,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:1,unit:"tsp",note:""},
      {item:"Salt",base750:1.5,unit:"tsp",note:""},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour water and olive oil into tin.",
      "Add flour, oregano, rosemary, and garlic powder.",
      "Well one side → yeast. Opposite → salt. Sprinkle sugar.",
      "Lock tin. Menu 8 (Italian) → Loaf {SIZE} → Colour Medium.",
      "Press START. Time: {TIME}.",
      "No keep-warm on Italian — remove as soon as it beeps.",
      "Best eaten same day.",
    ],
  },
  // ── DOUGH (9) ──────────────────────────────────────────────────────────────
  {
    id:"pita",program:9,programName:"Dough",
    title:"Soft-Puff Pita",emoji:"🫓",category:"dough",effort:3,
    defaultSize:null,supportedSizes:[],color:"N/A",
    times:{default:"1:30"},
    tagline:"Machine kneads and rises. You do the 2-minute stovetop magic.",
    precision:"Menu 9 (Dough), NOT Menu 10 (Pasta). Dough has heat for yeast activation. Pasta runs 14 min with no heat.",
    dispenser:null,
    ingredients:[
      {item:"White bread flour",base750:3,unit:"cups",note:""},
      {item:"Lukewarm water",base750:1.25,unit:"cups",note:"Warm, not hot"},
      {item:"Olive oil",base750:3,unit:"tbsp",note:""},
      {item:"Sugar",base750:1,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:2,unit:"tsp",note:""},
      {item:"Salt",base750:1.5,unit:"tsp",note:""},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour lukewarm water and olive oil in.",
      "Add flour. Well one side → yeast. Opposite → salt. Sprinkle sugar.",
      "Lock tin. Menu 9 (Dough). Press START. Time: 1:30.",
      "After 5 min peek through window — you want a smooth ball, not batter.",
      "When done, remove dough. Divide into 10 equal balls. Cover, rest 10 min.",
      "Roll each ball to ~5mm thick disc — no holes or thin spots.",
      "Place each on a square of baking paper. Cover, rest 10 more min.",
      "Heat a heavy pan to medium-high. Flip pita every 15 sec.",
      "It will puff into a pillow within 2 min. Remove immediately.",
      "Wrap in a dry towel right away — this keeps them soft.",
    ],
  },
  {
    id:"pizza-dough",program:9,programName:"Dough",
    title:"Pizza Dough",emoji:"🍕",category:"dough",effort:2,
    defaultSize:null,supportedSizes:[],color:"N/A",
    times:{default:"1:30"},
    tagline:"1:30 of machine work. 4 pizza bases ready for Friday night.",
    precision:"Use Menu 9 (Dough) not Menu 10. Cold-rise option: refrigerate dough balls 12–24h for much better flavour.",
    dispenser:null,
    ingredients:[
      {item:"White bread flour",base750:3.5,unit:"cups",note:"High-protein preferred"},
      {item:"Water",base750:1.125,unit:"cups",note:"Lukewarm"},
      {item:"Olive oil",base750:3,unit:"tbsp",note:""},
      {item:"Sugar",base750:1,unit:"tbsp",note:"Optional"},
      {item:"Instant dried yeast",base750:1,unit:"tsp",note:""},
      {item:"Salt",base750:1,unit:"tsp",note:""},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour lukewarm water and olive oil in. Add flour.",
      "Well one side → yeast. Opposite → salt. Sprinkle sugar.",
      "Lock tin. Menu 9 (Dough). Press START. Time: 1:30.",
      "When done, divide into 4 balls (thin) or 3 (thick).",
      "Use now: rest covered 15 min, then stretch and top.",
      "Or cold-rise: wrap each ball in cling film. Fridge 12–24h. Take out 1h before baking.",
      "Bake at max oven temp (220°C fan) for 10–15 min.",
    ],
  },
  // ── PASTA (10) ─────────────────────────────────────────────────────────────
  {
    id:"fresh-pasta",program:10,programName:"Pasta",
    title:"Fresh Egg Pasta",emoji:"🍝",category:"dough",effort:3,
    defaultSize:null,supportedSizes:[],color:"N/A",
    times:{default:"0:14"},
    tagline:"14 minutes of machine kneading, then roll and cut by hand.",
    precision:"Menu 10 (Pasta) only — no heat, no rise, just kneading. 14-minute cycle. Dough will be firm — rest 30 min wrapped before rolling. Use plain flour, not bread flour.",
    dispenser:null,
    ingredients:[
      {item:"Plain flour (00 or all-purpose)",base750:4,unit:"cups",note:"NOT bread flour"},
      {item:"Eggs (large)",base750:4,unit:"pcs",note:"Room temp"},
      {item:"Olive oil",base750:1,unit:"tbsp",note:"Optional"},
      {item:"Salt",base750:0.5,unit:"tsp",note:"Optional"},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Crack eggs directly into tin. Add olive oil.",
      "Add flour and salt.",
      "Lock tin. Menu 10 (Pasta). Press START. Time: 14 min.",
      "Remove firm dough. Wrap tightly in cling film.",
      "Rest at room temperature 30 min minimum.",
      "Divide into portions. Roll with pasta machine or rolling pin.",
      "Cut into fettuccine, pappardelle, or lasagne sheets.",
      "Cook fresh pasta in boiling salted water 2–3 min.",
    ],
  },
  // ── MILK BREAD (11) ────────────────────────────────────────────────────────
  {
    id:"milk-bread",program:11,programName:"Milk Bread",
    title:"Japanese Milk Bread",emoji:"🥛",category:"breads",effort:1,
    defaultSize:1250,supportedSizes:[750,1000,1250],color:"Light",
    times:{750:"3:17",1000:"3:20",1250:"3:24"},
    tagline:"Impossibly soft, pillowy, slightly sweet. The fluffiest bread your machine can make.",
    precision:"The Milk Bread program uses a gentler temperature curve to preserve milk proteins. Use Light colour — this bread is naturally golden from the milk and eggs. Don't substitute water for milk here.",
    dispenser:"Optional: ½ cup dried cranberries or raisins via dispenser",
    ingredients:[
      {item:"White bread flour",base750:3,unit:"cups",note:""},
      {item:"Full-cream milk (warm)",base750:0.75,unit:"cups",note:"Slightly warm"},
      {item:"Water (warm)",base750:0.375,unit:"cups",note:""},
      {item:"Butter (soft)",base750:3,unit:"tbsp",note:"Cubed, room temp"},
      {item:"Egg",base750:1,unit:"pcs",note:"Room temp, beaten"},
      {item:"Sugar",base750:3,unit:"tbsp",note:""},
      {item:"Instant dried yeast",base750:1.5,unit:"tsp",note:""},
      {item:"Salt",base750:1,unit:"tsp",note:""},
    ],
    steps:[
      "Remove tin. Seat both blades.",
      "Pour warm milk and water in. Add beaten egg and butter cubes.",
      "Add flour.",
      "Well one side → yeast. Opposite → salt. Sprinkle sugar.",
      "Lock tin. Menu 11 (Milk Bread) → Loaf {SIZE} → Colour Light.",
      "Press START. Time: {TIME}.",
      "This is the softest loaf the machine makes. Cool 30 min — it's fragile when hot.",
    ],
  },
  // ── JAM (12) ───────────────────────────────────────────────────────────────
  {
    id:"jam",program:12,programName:"Jam",
    title:"Mixed Fruit Jam",emoji:"🍓",category:"more",effort:1,
    defaultSize:null,supportedSizes:[],color:"N/A",
    times:{default:"1:05"},
    tagline:"Yes, your bread maker makes jam. About 2 jars in just over an hour.",
    precision:"Do NOT exceed the quantities listed — jam boils and can overflow. Use oven mitts on the hot pan. Jam thickens as it cools — it will seem thin when hot. Best fruits listed below.",
    dispenser:null,
    ingredients:[
      {item:"Fruit (see note)",base750:2,unit:"cups",note:"Hulled/chopped. See recommended fruits."},
      {item:"White sugar",base750:1.25,unit:"cups",note:""},
      {item:"Fresh lemon juice",base750:2,unit:"tbsp",note:"Helps it set"},
    ],
    steps:[
      "Place blades on spindles in the tin.",
      "Add all ingredients: fruit, sugar, lemon juice.",
      "Lock tin. Menu 12 (Jam). Press START. Time: 1:05.",
      "Use oven mitts to remove the pan — contents are extremely hot.",
      "Pour into clean, heat-resistant jars. Leave 1cm space at top.",
      "Seal tightly. Jam thickens significantly as it cools.",
      "Store in the fridge. Use within 3 weeks.",
    ],
    extraNote:"Recommended fruits: Strawberries (easiest, most reliable) · Blueberries · Raspberries · Apricots (peeled, pitted) · Peaches (peeled, pitted) · Plums (pitted) · Mixed berry blend. Avoid: Citrus peel, very watery fruits like watermelon. Stone fruits may need an extra tbsp of lemon juice to set.",
  },
  // ── BAKE ONLY (13) ─────────────────────────────────────────────────────────
  {
    id:"banana-cake",program:13,programName:"Bake Only",
    title:"Banana Bread Cake",emoji:"🍌",category:"more",effort:2,
    defaultSize:null,supportedSizes:[],color:"N/A",
    times:{default:"1:00"},
    tagline:"Mix by hand, pour in, press bake. Uses up brown bananas.",
    precision:"Menu 13 (Bake Only) has no kneading — just bakes. Mix batter before loading. Use self-raising flour, not bread flour. Run the program a second time if the skewer comes out wet. Makes 1 full loaf in the bread tin.",
    dispenser:null,
    ingredients:[
      {item:"Ripe bananas",base750:3,unit:"pcs",note:"Mashed — the browner, the better"},
      {item:"Eggs (large)",base750:2,unit:"pcs",note:"Beaten"},
      {item:"Butter (melted, cooled)",base750:5,unit:"tbsp",note:""},
      {item:"Brown sugar",base750:0.75,unit:"cups",note:""},
      {item:"Self-raising flour",base750:1.75,unit:"cups",note:"NOT bread flour"},
      {item:"Vanilla extract",base750:1,unit:"tsp",note:""},
      {item:"Baking soda",base750:1,unit:"tsp",note:""},
      {item:"Ground cinnamon",base750:1,unit:"tsp",note:""},
      {item:"Walnuts (optional)",base750:0.5,unit:"cups",note:"Chopped, fold in last"},
    ],
    steps:[
      "Mix batter by hand: mash bananas, stir in eggs, butter, sugar, vanilla.",
      "In a second bowl combine self-raising flour, baking soda, cinnamon.",
      "Fold dry into wet until just combined. Don't overmix. Fold in walnuts if using.",
      "Lightly grease or spray the baking tin.",
      "Seat blades on spindles (they won't spin, but must be installed).",
      "Pour batter into tin. Smooth the top.",
      "Lock tin. Menu 13 (Bake Only). Press START. Bakes 1 hour.",
      "Test with a skewer — if wet, run Menu 13 again (up to 30 more min).",
      "Cool in tin 10 min, then turn out onto a rack.",
    ],
  },
];

const CATEGORIES = {
  breads:{label:"Breads",emoji:"🍞"},
  dough:{label:"Dough & Shapes",emoji:"🍕"},
  more:{label:"Extras",emoji:"🍰"},
};

// ── SCALE INGREDIENTS ─────────────────────────────────────────────────────────
function getScaled(recipe, selectedSize) {
  const factor = !selectedSize || !recipe.supportedSizes.length ? 1
    : selectedSize===750?1:selectedSize===1000?4/3:5/3;
  return recipe.ingredients.map(ing => {
    if (ing.unit==="pcs") {
      const n = Math.round(ing.base750*factor);
      return {...ing, display:`${n} pcs`};
    }
    const val = ing.base750*factor;
    return {...ing, display:`${fraction(val)} ${ing.unit}`};
  });
}

function interpolateSteps(steps, size, times) {
  const t = times?.[size]||times?.default||"";
  return steps.map(s=>s.replace("{SIZE}",size?`${size}g`:"").replace("{TIME}",t?`~${t}`:""));
}

// ── AI SYSTEM PROMPT ──────────────────────────────────────────────────────────
const SYS = `You are a warm, practical bread machine expert specialising in the Ambiano 104906 (also sold as KuChef 104906, an Aldi Australia product). You know this exact machine inside out.

KEY MACHINE FACTS:
- 13 programs: 1=Basic, 2=French, 3=Wholemeal, 4=Sweet, 5=Gluten-free, 6=Rye, 7=Quick, 8=Italian, 9=Dough (with heat, 1:30), 10=Pasta (no heat, 14 min), 11=Milk Bread, 12=Jam, 13=Bake Only
- 3 sizes: 750g, 1000g, 1250g
- Setting is called COLOUR (not "crust"): Light / Medium / Dark
- Rapid mode: programs 1, 2, 3 only
- Fruit & nut dispenser (lid): programs 1, 3, 4, 5, 6, 11. Auto-releases ~20 min in.
- Delay timer: programs 1, 2, 3, 6, 11. Max 15h. NEVER use perishables (milk, eggs) with timer.
- TWO kneading blades — both must be fitted every time
- Error codes: E01=too hot, E00=too cold, EEE/HHH=electrical fault → call Tempo 1300 886 649
- No keep-warm on programs 2 (French), 8 (Italian)
- Ingredient order: liquids → flour → yeast (one well) + salt (opposite well, don't touch yeast) → other dry on top

COMMON ISSUES AND SOLUTIONS:
- Flour in powder after first knead / no dough ball: blades not fitted, OR not enough liquid, OR too much flour. Ask: "did both blades click onto the spindles?" and "did you add liquids before the flour?"
- Bread not rising: old yeast, yeast touched salt before kneading, wrong yeast type (needs instant/ready-to-use)
- Bread collapses: too much liquid (reduce 10-20ml), too much yeast, lid opened mid-bake
- Dense bread: not enough liquid, old yeast, wrong flour
- Blades stuck in bread: completely normal — soak in warm water 30 min then use the included hook

STYLE: Friendly, concise, Australian-friendly. Give specific actionable advice. Ask clarifying questions if needed. You can search for additional recipes or tips online.`;

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function App() {
  const [isDark, setIsDark] = useState(()=>window.matchMedia?.("(prefers-color-scheme: dark)").matches??false);
  const C = isDark?DARK:LIGHT;
  const [section, setSection] = useState("recipes");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [recipes, setRecipes] = useState(BASE_RECIPES);
  const [sizes, setSizes] = useState(()=>{const m={};BASE_RECIPES.forEach(r=>{m[r.id]=r.defaultSize||(r.supportedSizes[0]||null)});return m;});
  const [chatOpen, setChatOpen] = useState(false);
  const [msgs, setMsgs] = useState([{role:"assistant",content:"Hi! I'm your Ambiano 104906 specialist. Ask me anything — programs, troubleshooting, recipes, or what went wrong with your last loaf. 🍞"}]);
  const [chatIn, setChatIn] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newR, setNewR] = useState({title:"",emoji:"🍞",category:"breads",effort:1,program:1,defaultSize:1250,supportedSizes:[750,1000,1250],color:"Medium",tagline:"",precision:"",dispenser:"",ingredientsRaw:"",stepsRaw:"",imageData:""});
  const [imgs, setImgs] = useState({});
  const chatEnd = useRef(null);
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:"smooth"});},[msgs,chatLoading]);

  const sendChat = useCallback(async()=>{
    const text=chatIn.trim(); if(!text||chatLoading)return;
    setChatIn(""); const updated=[...msgs,{role:"user",content:text}]; setMsgs(updated); setChatLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYS,messages:updated.map(m=>({role:m.role,content:m.content}))})});
      const data=await res.json();
      const reply=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("\n")||"Sorry, couldn't get a response.";
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"Connection error — please try again."}]);}
    setChatLoading(false);
  },[chatIn,msgs,chatLoading]);

  const compress = (file,cb)=>{const canvas=document.createElement("canvas");const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{let w=img.width,h=img.height;if(w>800){h=h*(800/w);w=800;}if(h>600){w=w*(600/h);h=600;}canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);cb(canvas.toDataURL("image/webp",0.82));URL.revokeObjectURL(url);};img.src=url;};

  const addRecipe=()=>{
    const ings=newR.ingredientsRaw.split("\n").filter(Boolean).map((l,i)=>{const p=l.split(",").map(s=>s.trim());return{item:p[0]||`Ingredient ${i+1}`,base750:parseFloat(p[1])||1,unit:p[2]||"cups",note:p[3]||""};});
    const steps=newR.stepsRaw.split("\n").filter(Boolean);
    const id="custom-"+Date.now();
    const prog=PROGRAMS.find(p=>p.num===newR.program)||PROGRAMS[0];
    const r={...newR,id,programName:prog.name,times:prog.times,ingredients:ings,steps,isCustom:true};
    setRecipes(p=>[r,...p]);setSizes(p=>({...p,[id]:r.defaultSize}));
    if(newR.imageData)setImgs(p=>({...p,[id]:newR.imageData}));
    setAddOpen(false);setNewR({title:"",emoji:"🍞",category:"breads",effort:1,program:1,defaultSize:1250,supportedSizes:[750,1000,1250],color:"Medium",tagline:"",precision:"",dispenser:"",ingredientsRaw:"",stepsRaw:"",imageData:""});
  };

  // Style helpers
  const inp = {background:C.inputBg,border:`1px solid ${C.cardBorder}`,borderRadius:8,color:C.text,fontSize:14,padding:"8px 12px",width:"100%",boxSizing:"border-box",outline:"none"};
  const lbl = {fontSize:11,color:C.textDim,marginBottom:4,display:"block",fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"};
  const chip=(a)=>({background:a?C.accent:C.pill,color:a?"#fff":C.textSub,border:`1px solid ${a?C.accent:C.cardBorder}`,borderRadius:20,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s"});
  const btn=(bg,col)=>({background:bg,color:col,border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:14,fontWeight:600});
  const card={background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:20};

  const filtered=filter==="all"?recipes:recipes.filter(r=>r.category===filter);

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif",background:C.bg,color:C.text,minHeight:"100vh"}}>

      {/* HEADER */}
      <header style={{background:C.surface,borderBottom:`1px solid ${C.cardBorder}`,padding:"13px 20px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:760,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:8}}>
              <span style={{fontSize:20,fontWeight:700,letterSpacing:-0.3}}>Ambiano</span>
              <span style={{fontSize:12,color:C.textDim,fontWeight:500}}>104906</span>
            </div>
            <div style={{fontSize:10,color:C.accent,fontWeight:700,letterSpacing:1.2,textTransform:"uppercase"}}>Bread Maker Guide</div>
          </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer" style={{...btn(C.highlight,C.textSub),borderRadius:20,padding:"7px 12px",fontSize:12,border:`1px solid ${C.cardBorder}`,textDecoration:"none",whiteSpace:"nowrap"}}>
              📄 Manual
            </a>
            <button onClick={()=>setChatOpen(o=>!o)} style={{...btn(chatOpen?C.accent:C.highlight,chatOpen?"#fff":C.textSub),borderRadius:20,padding:"7px 14px",fontSize:13,border:`1px solid ${chatOpen?C.accent:C.cardBorder}`}}>
              💬 AI Help
            </button>
            <button onClick={()=>setIsDark(d=>!d)} style={{background:"none",border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",fontSize:16}}>
              {isDark?"☀️":"🌙"}
            </button>
          </div>
        </div>
      </header>

      {/* NAV */}
      <nav style={{background:C.navBg,borderBottom:`1px solid ${C.cardBorder}`,display:"flex",justifyContent:"center",position:"sticky",top:57,zIndex:99}}>
        {[["recipes","Recipes","📖"],["programs","Programs","📊"],["machine","Machine","🎛️"]].map(([id,label,icon])=>(
          <button key={id} onClick={()=>{setSection(id);setSelected(null);}} style={{background:"none",border:"none",borderBottom:`2px solid ${section===id?C.accent:"transparent"}`,color:section===id?C.accent:C.textDim,padding:"11px 28px",cursor:"pointer",fontSize:14,fontWeight:section===id?700:400,transition:"all .15s"}}>
            {icon} {label}
          </button>
        ))}
      </nav>

      <main style={{maxWidth:760,margin:"0 auto",padding:"20px 16px 100px"}}>

        {/* ── RECIPES LIST ── */}
        {section==="recipes"&&!selected&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[["all","All"],["breads","🍞 Breads"],["dough","🍕 Dough"],["more","🍰 Extras"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setFilter(k)} style={chip(filter===k)}>{l}</button>
                ))}
              </div>
              <button onClick={()=>setAddOpen(true)} style={{...btn(C.accent,"#fff"),borderRadius:20,padding:"7px 16px",fontSize:13}}>+ Add Recipe</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
              {filtered.map(r=>{
                const img=imgs[r.id];
                return(
                  <button key={r.id} onClick={()=>setSelected(r)} style={{background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:14,padding:0,cursor:"pointer",textAlign:"left",overflow:"hidden",transition:"transform .15s, box-shadow .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,${isDark?.25:.1})`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    <div style={{height:130,background:img?`url(${img}) center/cover`:C.highlight,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                      {!img&&<span style={{fontSize:46,opacity:.45}}>{r.emoji}</span>}
                      <span style={{position:"absolute",top:8,right:8,background:C.accentDim,color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:10,fontWeight:700}}>Menu {r.program}</span>
                    </div>
                    <div style={{padding:"12px 14px"}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{r.emoji} {r.title}</div>
                      <div style={{fontSize:12,color:C.textDim,marginBottom:8,lineHeight:1.4}}>{r.tagline}</div>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                        <span style={{fontSize:13}} title={EFFORT_LABEL[r.effort]}>{EFFORT[r.effort]}</span>
                        <span style={{fontSize:11,color:C.textSub,background:C.pill,borderRadius:8,padding:"2px 7px"}}>
                          {r.programName}
                        </span>
                        <span style={{fontSize:11,color:C.textSub,background:C.pill,borderRadius:8,padding:"2px 7px"}}>
                          ⏱ {r.times[r.defaultSize||"default"]||r.times.default}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RECIPE DETAIL ── */}
        {section==="recipes"&&selected&&(()=>{
          const r=selected;
          const hasSizes=r.supportedSizes.length>0;
          const sz=sizes[r.id]||r.defaultSize||null;
          const scaledIngs=getScaled(r,sz);
          const steps=interpolateSteps(r.steps,sz,r.times);
          const img=imgs[r.id];
          return(
            <div>
              <button onClick={()=>setSelected(null)} style={{...btn("none",C.accent),paddingLeft:0,marginBottom:12,fontSize:14}}>← All recipes</button>
              <div style={card}>
                {/* Hero */}
                <div style={{height:190,borderRadius:10,overflow:"hidden",background:img?`url(${img}) center/cover`:C.highlight,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18,position:"relative"}}>
                  {!img&&<span style={{fontSize:70,opacity:.35}}>{r.emoji}</span>}
                  <label style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.55)",color:"#fff",borderRadius:8,padding:"5px 10px",fontSize:12,cursor:"pointer",fontWeight:600}}>
                    📷 {img?"Replace photo":"Upload photo"}
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])compress(e.target.files[0],d=>setImgs(p=>({...p,[r.id]:d})));}}/>
                  </label>
                </div>

                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:6}}>
                  <h2 style={{margin:0,fontSize:21,fontWeight:700}}>{r.emoji} {r.title}</h2>
                  <span style={{background:C.accent,color:"#fff",borderRadius:12,padding:"3px 12px",fontSize:12,fontWeight:700}}>Menu {r.program} — {r.programName}</span>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                  <span style={{fontSize:14}} title={EFFORT_LABEL[r.effort]}>{EFFORT[r.effort]}</span>
                  <span style={{fontSize:12,color:C.textDim}}>{EFFORT_LABEL[r.effort]}</span>
                  {r.color!=="N/A"&&<span style={{fontSize:12,color:C.textDim,background:C.pill,borderRadius:8,padding:"2px 8px"}}>Colour: {r.color}</span>}
                </div>
                <p style={{color:C.textSub,fontSize:14,margin:"0 0 14px",lineHeight:1.5}}>{r.tagline}</p>

                {r.precision&&<div style={{background:isDark?"rgba(106,173,164,.12)":"rgba(90,138,128,.1)",borderLeft:`3px solid ${C.accent}`,borderRadius:"0 8px 8px 0",padding:"10px 14px",marginBottom:12,fontSize:13,color:C.textSub,lineHeight:1.55}}><strong style={{color:C.accent}}>📌 Note: </strong>{r.precision}</div>}
                {r.dispenser&&<div style={{background:isDark?"rgba(80,200,120,.1)":"rgba(46,125,94,.08)",borderLeft:`3px solid ${C.success}`,borderRadius:"0 8px 8px 0",padding:"10px 14px",marginBottom:14,fontSize:13,color:C.textSub}}><strong style={{color:C.success}}>🔩 Dispenser: </strong>{r.dispenser}</div>}

                {/* Size selector */}
                {hasSizes&&(
                  <div style={{marginBottom:20}}>
                    <label style={lbl}>Loaf size</label>
                    <div style={{display:"flex",gap:8}}>
                      {r.supportedSizes.map(s=>(
                        <button key={s} onClick={()=>setSizes(p=>({...p,[r.id]:s}))} style={chip(sz===s)}>{s}g</button>
                      ))}
                    </div>
                    <div style={{fontSize:12,color:C.textDim,marginTop:5}}>⏱ {r.times[sz]||r.times.default}</div>
                  </div>
                )}

                {/* Ingredients */}
                <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 10px",color:C.accent}}>Ingredients{hasSizes?` — ${sz}g`:""}</h3>
                <div style={{overflowX:"auto",marginBottom:22}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
                    <thead><tr style={{borderBottom:`2px solid ${C.accent}`}}>
                      <th style={{textAlign:"left",padding:"6px",color:C.textDim,fontWeight:600,fontSize:11,textTransform:"uppercase"}}>Ingredient</th>
                      <th style={{textAlign:"right",padding:"6px",color:C.textDim,fontWeight:600,fontSize:11,textTransform:"uppercase"}}>Amount</th>
                      <th style={{textAlign:"left",padding:"6px",color:C.textDim,fontWeight:600,fontSize:11,textTransform:"uppercase"}}>Note</th>
                    </tr></thead>
                    <tbody>{scaledIngs.map((ing,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${C.cardBorder}`}}>
                        <td style={{padding:"8px 6px",fontWeight:600}}>{ing.item}</td>
                        <td style={{padding:"8px 6px",textAlign:"right",fontFamily:"ui-monospace,monospace",color:C.accent,fontWeight:700}}>{ing.display}</td>
                        <td style={{padding:"8px 6px",color:C.textDim,fontSize:12}}>{ing.note||"—"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>

                {/* Steps */}
                <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 10px",color:C.accent}}>Method</h3>
                <ol style={{margin:0,paddingLeft:22,color:C.textSub,fontSize:14,lineHeight:1.8}}>
                  {steps.map((step,i)=><li key={i} style={{marginBottom:7}}>{step}</li>)}
                </ol>

                {r.extraNote&&(
                  <div style={{marginTop:18,background:C.highlight,borderRadius:10,padding:"12px 16px",fontSize:13,color:C.textSub,lineHeight:1.6}}>
                    <strong style={{color:C.text}}>ℹ️ {r.extraNote.split(":")[0]}:</strong> {r.extraNote.split(":").slice(1).join(":")}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── PROGRAMS ── */}
        {section==="programs"&&(
          <div>
            <h2 style={{fontSize:19,fontWeight:700,margin:"0 0 6px"}}>All 13 Programs</h2>
            <p style={{color:C.textDim,fontSize:13,marginBottom:14}}>"Colour" is the browning level (Light / Medium / Dark), not "crust".</p>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead><tr style={{borderBottom:`2px solid ${C.accent}`}}>
                  {["#","Program","Sizes","Colour","Rapid","Timer","Dispenser","Warm","Time (1250g)"].map(h=>(
                    <th key={h} style={{padding:"7px 5px",textAlign:"left",color:C.accent,fontWeight:700,fontSize:11,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{PROGRAMS.map(p=>(
                  <tr key={p.num} style={{borderBottom:`1px solid ${C.cardBorder}`}}>
                    <td style={{padding:"7px 5px",fontWeight:700,color:C.accent}}>{p.num}</td>
                    <td style={{padding:"7px 5px",fontWeight:600}}>{p.name}</td>
                    <td style={{padding:"7px 5px",color:C.textDim}}>{p.sizes.length?p.sizes.join(", "):"—"}</td>
                    <td style={{padding:"7px 5px"}}>{p.color?"✓":"—"}</td>
                    <td style={{padding:"7px 5px"}}>{p.rapid?"✓":"—"}</td>
                    <td style={{padding:"7px 5px"}}>{p.timer?"✓":"—"}</td>
                    <td style={{padding:"7px 5px"}}>{p.dispenser?"✓":"—"}</td>
                    <td style={{padding:"7px 5px"}}>{p.warm?"✓":"—"}</td>
                    <td style={{padding:"7px 5px",fontFamily:"ui-monospace,monospace"}}>{p.times[1250]||p.times.default||"—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{marginTop:16,background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:10,padding:"12px 16px"}}>
              <div style={{fontWeight:700,color:C.accent,marginBottom:8,fontSize:13}}>Legend</div>
              <div style={{color:C.textSub,fontSize:13,lineHeight:1.8}}>
                <strong style={{color:C.text}}>Colour:</strong> Light = pale, Medium = golden, Dark = crispy. The Ambiano calls it Colour, not Crust.<br/>
                <strong style={{color:C.text}}>Rapid:</strong> Shortens cycle by ~1h. Bread will be denser.<br/>
                <strong style={{color:C.text}}>Timer:</strong> Supports up to 15h delayed start. Never use perishables with timer.<br/>
                <strong style={{color:C.text}}>Dispenser:</strong> Lid compartment auto-releases nuts/seeds/fruit ~20 min in.<br/>
                <strong style={{color:C.text}}>Warm:</strong> 1h keep-warm after baking.
              </div>
            </div>
          </div>
        )}

        {/* ── MACHINE ── */}
        {section==="machine"&&<MachineGuide C={C} inp={inp} lbl={lbl}/>}
      </main>

      {/* ── AI CHAT ── */}
      {chatOpen&&(
        <div style={{position:"fixed",bottom:0,right:0,width:"min(380px,100vw)",height:"min(520px,85vh)",background:C.card,borderTop:`1px solid ${C.cardBorder}`,borderLeft:`1px solid ${C.cardBorder}`,borderTopLeftRadius:16,display:"flex",flexDirection:"column",zIndex:200,boxShadow:`0 -4px 24px rgba(0,0,0,${isDark?.3:.12})`}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.cardBorder}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,fontSize:15}}>💬 AI Bread Helper</div><div style={{fontSize:11,color:C.accent}}>Ambiano 104906 specialist · searches online</div></div>
            <button onClick={()=>setChatOpen(false)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:22}}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",background:m.role==="user"?C.accentDim:C.highlight,color:m.role==="user"?"#fff":C.text,borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 13px",maxWidth:"88%",fontSize:13,lineHeight:1.55,whiteSpace:"pre-wrap"}}>
                {m.content}
              </div>
            ))}
            {chatLoading&&<div style={{alignSelf:"flex-start",background:C.highlight,borderRadius:"16px 16px 16px 4px",padding:"10px 14px",fontSize:13,color:C.textDim}}>● ● ●</div>}
            <div ref={chatEnd}/>
          </div>
          <div style={{padding:"10px 12px",borderTop:`1px solid ${C.cardBorder}`,display:"flex",gap:8}}>
            <input value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();}}} placeholder="Ask about your machine..." style={{...inp,flex:1,borderRadius:20,padding:"9px 14px"}}/>
            <button onClick={sendChat} disabled={chatLoading||!chatIn.trim()} style={{...btn(C.accent,"#fff"),borderRadius:"50%",width:38,height:38,padding:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,opacity:chatLoading||!chatIn.trim()?.45:1}}>↑</button>
          </div>
        </div>
      )}

      {/* ── ADD RECIPE ── */}
      {addOpen&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:C.card,borderRadius:16,padding:24,width:"min(540px,100%)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:18}}>
              <h2 style={{margin:0,fontSize:18}}>Add Custom Recipe</h2>
              <button onClick={()=>setAddOpen(false)} style={{background:"none",border:"none",color:C.textDim,cursor:"pointer",fontSize:22}}>×</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"60px 1fr",gap:10}}>
                <div><label style={lbl}>Emoji</label><input value={newR.emoji} onChange={e=>setNewR(p=>({...p,emoji:e.target.value}))} style={{...inp,textAlign:"center",fontSize:22,padding:"6px"}} maxLength={2}/></div>
                <div><label style={lbl}>Recipe name *</label><input value={newR.title} onChange={e=>setNewR(p=>({...p,title:e.target.value}))} style={inp} placeholder="e.g. My Sourdough Style"/></div>
              </div>
              <div><label style={lbl}>Tagline</label><input value={newR.tagline} onChange={e=>setNewR(p=>({...p,tagline:e.target.value}))} style={inp} placeholder="One sentence description"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>Program</label>
                  <select value={newR.program} onChange={e=>setNewR(p=>({...p,program:parseInt(e.target.value)}))} style={inp}>
                    {PROGRAMS.map(p=><option key={p.num} value={p.num}>{p.num}. {p.name}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Category</label>
                  <select value={newR.category} onChange={e=>setNewR(p=>({...p,category:e.target.value}))} style={inp}>
                    {Object.entries(CATEGORIES).map(([k,v])=><option key={k} value={k}>{v.emoji} {v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div><label style={lbl}>Colour</label>
                  <select value={newR.color} onChange={e=>setNewR(p=>({...p,color:e.target.value}))} style={inp}>
                    {["Light","Medium","Dark","N/A"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Effort level</label>
                  <select value={newR.effort} onChange={e=>setNewR(p=>({...p,effort:parseInt(e.target.value)}))} style={inp}>
                    {EFFORT.map((e,i)=><option key={i} value={i}>{e} {EFFORT_LABEL[i]}</option>)}
                  </select>
                </div>
              </div>
              <div><label style={lbl}>Notes / tips</label><input value={newR.precision} onChange={e=>setNewR(p=>({...p,precision:e.target.value}))} style={inp} placeholder="Any critical tips?"/></div>
              <div>
                <label style={lbl}>Ingredients — one per line: Name, amount, unit (cups/tbsp/tsp/ml/pcs), note</label>
                <textarea value={newR.ingredientsRaw} onChange={e=>setNewR(p=>({...p,ingredientsRaw:e.target.value}))} style={{...inp,height:100,resize:"vertical",fontFamily:"ui-monospace,monospace",fontSize:12}} placeholder={"White bread flour, 3, cups\nWater, 1.5, cups, Room temp\nYeast, 1.5, tsp"}/>
              </div>
              <div>
                <label style={lbl}>Steps — one per line</label>
                <textarea value={newR.stepsRaw} onChange={e=>setNewR(p=>({...p,stepsRaw:e.target.value}))} style={{...inp,height:110,resize:"vertical",fontSize:13}} placeholder={"Pour water into tin.\nAdd flour on top.\n..."}/>
              </div>
              <div>
                <label style={lbl}>Photo (optional)</label>
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                  <span style={{background:C.pill,border:`1px solid ${C.cardBorder}`,color:C.textSub,borderRadius:8,padding:"7px 14px",fontSize:13}}>📷 Choose image</span>
                  {newR.imageData&&<span style={{fontSize:12,color:C.success}}>✓ Image ready</span>}
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])compress(e.target.files[0],d=>setNewR(p=>({...p,imageData:d})));}}/>
                </label>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
                <button onClick={()=>setAddOpen(false)} style={btn(C.pill,C.textSub)}>Cancel</button>
                <button onClick={addRecipe} disabled={!newR.title.trim()} style={{...btn(C.accent,"#fff"),opacity:newR.title.trim()?1:.4}}>Save Recipe</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MachineGuide({C,inp,lbl}){
  const [open,setOpen]=useState(null);
  const secs=[
    {title:"📦 First-Time Setup",items:[
      ["Wash before first use","Wash blades, measuring spoon and cup with warm soapy water. Wipe the baking tin with a damp soft cloth — do NOT submerge it."],
      ["Install both kneading blades","Place both blades on the spindles. They only fit one way. Both must be fitted every single time."],
      ["Fit the tin","Insert and press firmly on both sides until it clicks. If it sits at an angle, wiggle and retry."],
      ["Location","Flat heat-resistant surface. 10 cm clearance all sides. Don't block ventilation holes."],
    ]},
    {title:"🎛️ Controls",items:[
      ["Ingredient order","ALWAYS: Liquids first → flour → yeast (one well on one side) + salt (opposite well, never touching yeast) → remaining dry on top."],
      ["MENU","Cycles through 13 programs. Press repeatedly to step through."],
      ["LOAF","Sets size: 750g / 1000g / 1250g. Only shows for multi-size programs."],
      ["COLOUR","Sets browning: Light → Medium → Dark → Rapid. Called COLOUR on this machine — not 'Crust'."],
      ["Delayed start ▲▼","Sets the delay waiting period (not the finish time). Max 15h. NEVER use perishables with delayed start."],
      ["Fruit & nut dispenser","Load before pressing START. Auto-releases ~20 min into kneading. Supported: programs 1, 3, 4, 5, 6, 11."],
    ]},
    {title:"🧽 Cleaning",items:[
      ["Baking tin","Soft cloth, warm water, mild detergent only. Abrasives damage the non-stick."],
      ["Blades","Same as tin. Stuck on spindle? Fill with warm water, soak 30 min."],
      ["Lid & dispenser","Lift lid firmly upward off the hinge. Wipe clean. Remove dispenser tray and hand-wash."],
      ["Housing","Damp cloth on exterior only. Never immerse. Never clean while plugged in."],
      ["NEVER","Dishwasher. Abrasive cleaners. Immersing the body. Cleaning while still warm or plugged in."],
    ]},
    {title:"🔧 Troubleshooting",items:[
      ["Flour stays powdery / no dough ball","Blades not fitted — remove tin, check both blades click onto spindles. Or: not enough liquid."],
      ["Bread doesn't rise","Check yeast expiry. Yeast must not touch water or salt before kneading. Use instant/ready-to-use yeast only."],
      ["Bread collapses after rising","Too much liquid (try 10–20ml less). Too much yeast. Lid was opened mid-bake."],
      ["Dense or dry loaf","Not enough liquid (try 10–20ml more). Old yeast. Baker's flour absorbs more water."],
      ["Burnt crust","Too much sugar for colour selected. Use Light colour for sweet recipes."],
      ["Blades stuck in bread","Normal! Wait until completely cool then use the included hook. Or soak in warm water 30 min."],
      ["Error E01","Machine too hot (>50°C). Remove tin, cool down, then retry."],
      ["Error E00","Machine too cold. Bring to room temperature."],
      ["Error EEE / HHH","Internal electrical fault. Unplug immediately. Call Tempo: 1300 886 649."],
    ]},
  ];
  return(
    <div>
      <h2 style={{fontSize:19,fontWeight:700,margin:"0 0 16px"}}>Machine Guide</h2>
      {secs.map((sec,si)=>(
        <div key={si} style={{marginBottom:10}}>
          <button onClick={()=>setOpen(open===si?null:si)} style={{width:"100%",background:C.card,border:`1px solid ${C.cardBorder}`,borderRadius:open===si?"10px 10px 0 0":10,padding:"13px 16px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",color:C.text,fontSize:14,fontWeight:700,textAlign:"left"}}>
            {sec.title}
            <span style={{color:C.accent,fontSize:18,transform:open===si?"rotate(45deg)":"none",transition:"transform .2s"}}>+</span>
          </button>
          {open===si&&(
            <div style={{background:C.surface,border:`1px solid ${C.cardBorder}`,borderTop:"none",borderRadius:"0 0 10px 10px"}}>
              {sec.items.map(([h,t],ii)=>(
                <div key={ii} style={{padding:"11px 15px",borderBottom:ii<sec.items.length-1?`1px solid ${C.cardBorder}`:"none"}}>
                  <div style={{fontWeight:700,fontSize:12,color:C.accent,marginBottom:3,textTransform:"uppercase",letterSpacing:.3}}>{h}</div>
                  <div style={{fontSize:13,color:C.textSub,lineHeight:1.6}}>{t}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
