let authClient = null;
function show(msg,type="error"){
  const el=document.getElementById("login-message");
  el.textContent=msg; el.className="message "+type;
}
document.addEventListener("DOMContentLoaded",async()=>{
  try{
    if(!window.supabase) throw new Error("Bibliothèque Supabase absente.");
    if(!window.LEADY_SUPABASE_URL || window.LEADY_SUPABASE_URL==="VOTRE_URL_SUPABASE") throw new Error("URL Supabase non configurée.");
    if(!window.LEADY_SUPABASE_ANON_KEY || window.LEADY_SUPABASE_ANON_KEY==="VOTRE_CLE_ANON_PUBLIQUE") throw new Error("Clé Supabase non configurée.");
    authClient=window.supabase.createClient(window.LEADY_SUPABASE_URL,window.LEADY_SUPABASE_ANON_KEY);
  }catch(e){show(e.message);return;}
  const {data:{session}}=await authClient.auth.getSession();
  if(session) location.href="gestion.html";
  document.getElementById("login-form").addEventListener("submit",async e=>{
    e.preventDefault();
    const b=document.getElementById("login-button");
    b.disabled=true;b.textContent="Connexion...";
    show("");
    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;
    const {data,error}=await authClient.auth.signInWithPassword({email,password});
    if(error){
      show("Connexion refusée : "+error.message,"error");
      b.disabled=false;b.textContent="Se connecter";return;
    }
    if(!data.session){show("Aucune session créée.","error");b.disabled=false;b.textContent="Se connecter";return;}
    show("Connexion réussie. Redirection...","success");
    location.href="gestion.html";
  });
});
