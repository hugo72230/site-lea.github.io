
let client=null;

const table=()=>window.LEADY_HORSES_TABLE||"chevaux";

const STORAGE_BUCKET="chevaux";


function msg(t,type=""){
  const e=document.getElementById("admin-message");
  e.textContent=t;
  e.className="message "+type;
}


function esc(v){
  return String(v??"").replace(
    /[&<>"']/g,
    c=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[c])
  );
}


async function boot(){

  try{

    client=window.supabase.createClient(
      window.LEADY_SUPABASE_URL,
      window.LEADY_SUPABASE_ANON_KEY
    );

    const {data:{session}}=await client.auth.getSession();

    if(!session){
      location.href="login.html";
      return;
    }

    await load();

  }catch(e){

    msg("Erreur : "+e.message,"error");

  }

}


async function load(){

  const box=document.getElementById("horse-list");

  const {data,error}=await client
    .from(table())
    .select("*");

  if(error){

    box.innerHTML=
      `<div class="empty">${esc(error.message)}</div>`;

    return;

  }

  if(!data?.length){

    box.innerHTML=
      '<div class="empty">Aucun cheval.</div>';

    return;

  }

  box.innerHTML=data.map(h=>`

    <div class="admin-item">

      <div>

        <strong>
          ${esc(h.nom||h.name||"Sans nom")}
        </strong>

        <div class="meta">
          ${esc(h.discipline||"")}
          ·
          ${esc(h.sexe||h.sex||"")}
          ·
          ${esc(h.age||"")} ans
        </div>

      </div>

      <button
        class="delete"
        data-id="${esc(h.id)}"
      >
        Supprimer
      </button>

    </div>

  `).join("");


  box.querySelectorAll(".delete").forEach(b=>b.addEventListener("click",async()=>{

    if(!confirm("Supprimer ce cheval ?"))
      return;

    const {error}=await client
      .from(table())
      .delete()
      .eq("id",b.dataset.id);

    if(error){

      msg(
        "Suppression impossible : "+
        error.message,
        "error"
      );

      return;

    }

    msg(
      "Cheval supprimé.",
      "success"
    );

    load();

  }));

}


/* =========================================================
   AJOUT DU CHEVAL
========================================================= */

document.addEventListener("DOMContentLoaded",()=>{

  boot();


  /* =========================
     APERCU DE LA PHOTO
  ========================= */

  const photoInput=
    document.getElementById("photo-file");

  const photoPreview=
    document.getElementById("photo-preview");


  if(photoInput){

    photoInput.addEventListener("change",()=>{

      photoPreview.innerHTML="";

      const file=photoInput.files[0];

      if(!file)
        return;

      if(!file.type.startsWith("image/")){

        msg(
          "Le fichier sélectionné n'est pas une image.",
          "error"
        );

        photoInput.value="";

        return;

      }


      const img=document.createElement("img");

      img.src=URL.createObjectURL(file);

      img.style.maxWidth="250px";
      img.style.maxHeight="200px";
      img.style.objectFit="cover";
      img.style.borderRadius="10px";

      photoPreview.appendChild(img);

    });

  }


  /* =========================
     DECONNEXION
  ========================= */

  document
    .getElementById("logout")
    .addEventListener("click",async()=>{

      await client.auth.signOut();

      location.href="login.html";

    });


  /* =========================
     FORMULAIRE
  ========================= */

  document
    .getElementById("horse-form")
    .addEventListener("submit",async e=>{

      e.preventDefault();


      /* =========================
         INFORMATIONS DU CHEVAL
      ========================= */

      const row={

        nom:
          document
            .getElementById("nom")
            .value
            .trim(),

        discipline:
          document
            .getElementById("discipline")
            .value
            .trim(),

        sexe:
          document
            .getElementById("sexe")
            .value
            .trim(),

        age:
          document
            .getElementById("age")
            .value
            .trim(),

        prix:
          document
            .getElementById("prix")
            .value || null,

        photo:"",

        description:
          document
            .getElementById("description")
            .value
            .trim(),

        vendu:
          document
            .getElementById("vendu")
            .checked

      };


      /* =========================
         IMAGE
      ========================= */

      const file=
        photoInput &&
        photoInput.files &&
        photoInput.files[0];


      if(file){

        msg("Envoi de la photo...");


        const extension=
          file.name
            .split(".")
            .pop()
            .toLowerCase();


        const fileName=
          Date.now()+
          "-" +
          Math.random()
            .toString(36)
            .substring(2,10) +
          "."+
          extension;


        const filePath=
          "chevaux/"+fileName;


        const {error:uploadError}=
          await client
            .storage
            .from(STORAGE_BUCKET)
            .upload(
              filePath,
              file,
              {
                cacheControl:"3600",
                upsert:false
              }
            );


        if(uploadError){

          msg(
            "Upload image impossible : "+
            uploadError.message,
            "error"
          );

          console.error(uploadError);

          return;

        }


        const {data:urlData}=
          client
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);


        row.photo=urlData.publicUrl;

      }


      /* =========================
         AJOUT SUPABASE
      ========================= */

      const {error}=
        await client
          .from(table())
          .insert(row);


      if(error){

        msg(
          "Ajout impossible : "+
          error.message,
          "error"
        );

        console.error(error);

        return;

      }


      /* =========================
         SUCCES
      ========================= */

      msg(
        "Cheval ajouté.",
        "success"
      );


      e.target.reset();


      if(photoPreview){

        photoPreview.innerHTML="";

      }


      load();

    });

});
```
