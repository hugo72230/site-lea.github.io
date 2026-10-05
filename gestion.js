let client=null;

const table=()=>window.LEADY_HORSES_TABLE||"chevaux";

/* NOM DE TON BUCKET SUPABASE STORAGE */
const STORAGE_BUCKET="photos-chevaux";


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

    console.error(e);

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
        type="button"
        data-id="${esc(h.id)}"
      >
        Supprimer
      </button>

    </div>

  `).join("");


  box.querySelectorAll(".delete").forEach(
    b=>b.addEventListener(
      "click",
      async()=>{

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

      }
    )
  );

}


/* =========================================================
   APERCU IMAGE
========================================================= */

const photoInput=document.getElementById("photo-file");

if(photoInput){

  photoInput.addEventListener(
    "change",
    ()=>{

      const preview=
        document.getElementById("photo-preview");

      if(!preview)
        return;


      preview.innerHTML="";


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


      preview.appendChild(img);

    }
  );

}


/* =========================================================
   UPLOAD PHOTO SUPABASE STORAGE
========================================================= */

async function uploadPhoto(file){

  if(!file)
    return "";


  const extension=
    file.name.split(".").pop().toLowerCase();


  const fileName=
    Date.now()+
    "-" +
    Math.random()
      .toString(36)
      .substring(2,10) +
    "." +
    extension;


  const filePath=
    "chevaux/" +
    fileName;


  console.log(
    "Upload de l'image :",
    filePath
  );


  const {error:uploadError}=
    await client.storage
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

    console.error(
      "Erreur upload image :",
      uploadError
    );

    throw uploadError;

  }


  const {data:urlData}=
    client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);


  if(!urlData || !urlData.publicUrl){

    throw new Error(
      "Impossible de récupérer l'URL de l'image."
    );

  }


  console.log(
    "URL image :",
    urlData.publicUrl
  );


  return urlData.publicUrl;

}


/* =========================================================
   AJOUT CHEVAL
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  ()=>{

    boot();


    /* DECONNEXION */

    document
      .getElementById("logout")
      .addEventListener(
        "click",
        async()=>{

          await client.auth.signOut();

          location.href="login.html";

        }
      );


    /* FORMULAIRE */

    document
      .getElementById("horse-form")
      .addEventListener(
        "submit",
        async e=>{

          e.preventDefault();


          try{

            /* ============================================
               RECUPERATION DES INFORMATIONS
            ============================================ */

            const nom=
              document
                .getElementById("nom")
                .value
                .trim();


            const discipline=
              document
                .getElementById("discipline")
                .value
                .trim();


            const sexe=
              document
                .getElementById("sexe")
                .value
                .trim();


            const age=
              document
                .getElementById("age")
                .value
                .trim();


            const prix=
              document
                .getElementById("prix")
                .value;


            const description=
              document
                .getElementById("description")
                .value
                .trim();


            const vendu=
              document
                .getElementById("vendu")
                .checked;


            /* ============================================
               RECUPERATION IMAGE
            ============================================ */

            const photoInput=
              document.getElementById(
                "photo-file"
              );


            const file=
              photoInput &&
              photoInput.files &&
              photoInput.files[0];


            let photo="";


            /* ============================================
               UPLOAD IMAGE
            ============================================ */

            if(file){

              msg(
                "Envoi de la photo...",
                ""
              );


              photo=
                await uploadPhoto(file);

            }


            /* ============================================
               CREATION DU CHEVAL
            ============================================ */

            const row={

              nom:nom,

              discipline:discipline,

              sexe:sexe,

              age:age,

              prix:prix||null,

              photo:photo,

              description:description,

              vendu:vendu

            };


            console.log(
              "Cheval à enregistrer :",
              row
            );


            /* ============================================
               INSERT SUPABASE
            ============================================ */

            const {error}=
              await client
                .from(table())
                .insert(row);


            if(error){

              console.error(error);


              msg(
                "Ajout impossible : "+
                error.message,
                "error"
              );


              return;

            }


            /* ============================================
               SUCCES
            ============================================ */

            msg(
              "Cheval ajouté.",
              "success"
            );


            e.target.reset();


            const preview=
              document.getElementById(
                "photo-preview"
              );


            if(preview){

              preview.innerHTML="";

            }


            await load();


          }catch(error){

            console.error(
              "Erreur ajout cheval :",
              error
            );


            msg(
              "Ajout impossible : "+
              error.message,
              "error"
            );

          }

        }
      );

  }
);
```
