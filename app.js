const configError = "Supabase n'est pas configuré. Vérifie supabase-config.js.";

let supabaseClient = null;
let horses = [];

function initSupabase() {
  if (!window.supabase) throw new Error("La bibliothèque Supabase n'est pas chargée.");
  if (!window.LEADY_SUPABASE_URL || window.LEADY_SUPABASE_URL === "VOTRE_URL_SUPABASE")
    throw new Error(configError);
  if (!window.LEADY_SUPABASE_ANON_KEY || window.LEADY_SUPABASE_ANON_KEY === "VOTRE_CLE_ANON_PUBLIQUE")
    throw new Error(configError);
  supabaseClient = window.supabase.createClient(
    window.LEADY_SUPABASE_URL,
    window.LEADY_SUPABASE_ANON_KEY
  );
}
function pick(o, keys) {
  for (const k of keys) if (o?.[k] !== undefined && o?.[k] !== null && o?.[k] !== "") return o[k];
  return "";
}
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
function price(v) {
  if (v === "" || v == null) return "Prix sur demande";
  const n = Number(v);
  return Number.isFinite(n) ? new Intl.NumberFormat("fr-FR").format(n) + " €" : String(v);
}
function render() {
  const q = document.getElementById("search")?.value.toLowerCase().trim() || "";
  const d = document.getElementById("discipline")?.value || "";
  const s = document.getElementById("sexe")?.value || "";
  const a = document.getElementById("age")?.value || "";
  const sort = document.getElementById("sort")?.value || "";
  let rows = horses.filter(h =>
    (!q || String(pick(h,["nom","name"])).toLowerCase().includes(q)) &&
    (!d || String(pick(h,["discipline"])).toLowerCase() === d.toLowerCase()) &&
    (!s || String(pick(h,["sexe","sex"])).toLowerCase() === s.toLowerCase()) &&
    (!a || String(pick(h,["age"])).toLowerCase() === a.toLowerCase())
  );
  rows.sort((x,y)=>{
    if(sort==="name") return String(pick(x,["nom","name"])).localeCompare(String(pick(y,["nom","name"])),"fr");
    if(sort==="priceAsc") return Number(pick(x,["prix","price"])||0)-Number(pick(y,["prix","price"])||0);
    if(sort==="priceDesc") return Number(pick(y,["prix","price"])||0)-Number(pick(x,["prix","price"])||0);
    return String(pick(y,["created_at","date_creation","id"])).localeCompare(String(pick(x,["created_at","date_creation","id"])));
  });
  const grid=document.getElementById("horse-grid");
  grid.innerHTML=rows.map(h=>{
    const name=pick(h,["nom","name"])||"Sans nom";
    const image=pick(h,["photo","image","image_url","photo_url"]);
    const sold=Boolean(pick(h,["vendu","sold","is_sold"]));
    return `<article class="horse-card" data-id="${esc(h.id)}" style="cursor:pointer;">
      <div class="horse-photo">${image?`<img src="${esc(image)}" alt="${esc(name)}" loading="lazy">`:`<span class="photo-empty">PHOTO À VENIR</span>`}</div>
      <div class="horse-body">${sold?`<span class="status sold">VENDU</span>`:""}
        <h3>${esc(name)}</h3>
        <div class="meta">${esc(pick(h,["discipline"]))}${pick(h,["sexe","sex"])?` · ${esc(pick(h,["sexe","sex"]))}`:""}${pick(h,["age"])?` · ${esc(pick(h,["age"]))} ans`:""}</div>
        <p class="desc">${esc(pick(h,["description","desc"]))}</p>
        <div class="price">${esc(price(pick(h,["prix","price"])))}</div>
      </div>
    </article>`;
  }).join("");
  document.getElementById("empty").hidden=rows.length!==0;
}
function fill(id, keys) {
  const el=document.getElementById(id); if(!el)return;
  const values=[...new Set(horses.map(h=>pick(h,keys)).filter(v=>v!==""&&v!=null).map(String))].sort((a,b)=>a.localeCompare(b,"fr"));
  values.forEach(v=>{const o=document.createElement("option");o.value=v;o.textContent=v;el.appendChild(o);});
}
async function loadHorses() {
  const grid = document.getElementById("horse-grid");

  try {
    initSupabase();

    console.log("Connexion Supabase OK");
    console.log(
      "Table utilisée :",
      window.LEADY_HORSES_TABLE || "chevaux"
    );

    const { data, error } = await supabaseClient
      .from(window.LEADY_HORSES_TABLE || "chevaux")
      .select("*");

    if (error) {
      console.error("Erreur Supabase :", error);
      throw error;
    }

    console.log("Chevaux récupérés :", data);

    horses = data || [];

    fill("discipline", ["discipline"]);
    fill("sexe", ["sexe", "sex"]);
    fill("age", ["age"]);

    render();

  } catch (e) {
    console.error("Erreur chargement chevaux :", e);

    grid.innerHTML = `
      <div class="empty">
        Impossible de charger les chevaux.<br>
        <small>${esc(e.message)}</small>
      </div>
    `;
  }
}
["search","discipline","sexe","age","sort"].forEach(id=>{
  document.getElementById(id)?.addEventListener("input",render);
  document.getElementById(id)?.addEventListener("change",render);
});
document.addEventListener("DOMContentLoaded",loadHorses);
