let client=null;
const table=()=>window.LEADY_HORSES_TABLE||"chevaux";
function msg(t,type=""){const e=document.getElementById("admin-message");e.textContent=t;e.className="message "+type;}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
async function boot(){
  try{
    client=window.supabase.createClient(window.LEADY_SUPABASE_URL,window.LEADY_SUPABASE_ANON_KEY);
    const {data:{session}}=await client.auth.getSession();
    if(!session){location.href="login.html";return;}
    await load();
  }catch(e){msg("Erreur : "+e.message,"error");}
}
async function load(){
  const box=document.getElementById("horse-list");
  const {data,error}=await client.from(table()).select("*");
  if(error){box.innerHTML=`<div class="empty">${esc(error.message)}</div>`;return;}
  if(!data?.length){box.innerHTML='<div class="empty">Aucun cheval.</div>';return;}
  box.innerHTML=data.map(h=>`<div class="admin-item">
    <div><strong>${esc(h.nom||h.name||"Sans nom")}</strong><div class="meta">${esc(h.discipline||"")} · ${esc(h.sexe||h.sex||"")} · ${esc(h.age||"")} ans</div></div>
    <button class="delete" data-id="${esc(h.id)}">Supprimer</button>
  </div>`).join("");
  box.querySelectorAll(".delete").forEach(b=>b.addEventListener("click",async()=>{
    if(!confirm("Supprimer ce cheval ?"))return;
    const {error}=await client.from(table()).delete().eq("id",b.dataset.id);
    if(error){msg("Suppression impossible : "+error.message,"error");return;}
    msg("Cheval supprimé.","success");load();
  }));
}
document.addEventListener("DOMContentLoaded",()=>{
  boot();
  document.getElementById("logout").addEventListener("click",async()=>{await client.auth.signOut();location.href="login.html";});
  document.getElementById("horse-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const row={
      nom:document.getElementById("nom").value.trim(),
      discipline:document.getElementById("discipline").value.trim(),
      sexe:document.getElementById("sexe").value.trim(),
      age:document.getElementById("age").value.trim(),
      prix:document.getElementById("prix").value||null,
      photo:document.getElementById("photo").value.trim(),
      description:document.getElementById("description").value.trim(),
      vendu:document.getElementById("vendu").checked
    };
    const {error}=await client.from(table()).insert(row);
    if(error){msg("Ajout impossible : "+error.message,"error");return;}
    msg("Cheval ajouté.","success");e.target.reset();load();
  });
});
