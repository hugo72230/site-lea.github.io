```javascript
let client = null;

const table = () => window.LEADY_HORSES_TABLE || "chevaux";

function msg(t, type = "") {
  const e = document.getElementById("admin-message");
  e.textContent = t;
  e.className = "message " + type;
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, function(c) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c];
  });
}


/* =========================
   CONNEXION
========================= */

async function boot() {

  try {

    client = window.supabase.createClient(
      window.LEADY_SUPABASE_URL,
      window.LEADY_SUPABASE_ANON_KEY
    );

    const result = await client.auth.getSession();

    const session = result.data.session;

    if (!session) {
      location.href = "login.html";
      return;
    }

    await load();

  } catch (e) {

    msg("Erreur : " + e.message, "error");

  }
}


/* =========================
   AFFICHAGE DES CHEVAUX
========================= */

async function load() {

  const box = document.getElementById("horse-list");

  const result = await client
    .from(table())
    .select("*");

  const data = result.data;
  const error = result.error;

  if (error) {

    box.innerHTML =
      '<div class="empty">' +
      esc(error.message) +
      '</div>';

    return;
  }

  if (!data || !data.length) {

    box.innerHTML =
      '<div class="empty">Aucun cheval.</div>';

    return;
  }

  box.innerHTML = data.map(function(h) {

    let photo = "";

    if (h.photo) {
      photo =
        '<img src="' +
        esc(h.photo) +
        '" alt="' +
        esc(h.nom || "Cheval") +
        '" style="width:80px;height:80px;object-fit:cover;border-radius:10px;">';
    }

    return `
      <div class="admin-item">

        ${photo}

        <div style="flex:1;">
          <strong>${esc(h.nom || "Sans nom")}</strong>

          <div class="meta">
            ${esc(h.discipline || "")}
            ·
            ${esc(h.sexe || "")}
            ·
            ${esc(h.age || "")} ans
          </div>
        </div>

        <button
          class="delete"
          data-id="${esc(h.id)}">
          Supprimer
        </button>

      </div>
    `;

  }).join("");


  /* SUPPRESSION */

  box.querySelectorAll(".delete").forEach(function(button) {

    button.addEventListener("click", async function() {

      if (!confirm("Supprimer ce cheval ?")) {
        return;
      }

      const result = await client
        .from(table())
        .delete()
        .eq("id", button.dataset.id);

      if (result.error) {

        msg(
          "Suppression impossible : " +
          result.error.message,
          "error"
        );

        return;
      }

      msg("Cheval supprimé.", "success");

      load();

    });

  });

}


/* =========================
   PREVISUALISATION PHOTO
========================= */

document.addEventListener("DOMContentLoaded", function() {

  const photoInput =
    document.getElementById("photo-file");

  const preview =
    document.getElementById("photo-preview");


  photoInput.addEventListener("change", function() {

    preview.innerHTML = "";

    const file = photoInput.files[0];

    if (!file) {
      return;
    }

    const image = document.createElement("img");

    image.src = URL.createObjectURL(file);

    image.style.width = "150px";
    image.style.height = "150px";
    image.style.objectFit = "cover";
    image.style.borderRadius = "12px";
    image.style.marginTop = "5px";

    preview.appendChild(image);

  });


  /* =========================
     DECONNEXION
  ========================= */

  document
    .getElementById("logout")
    .addEventListener("click", async function() {

      await client.auth.signOut();

      location.href = "login.html";

    });


  /* =========================
     AJOUT CHEVAL
  ========================= */

  document
    .getElementById("horse-form")
    .addEventListener("submit", async function(e) {

      e.preventDefault();

      const button = e.submitter;

      button.disabled = true;

      try {

        const nom =
          document.getElementById("nom").value.trim();

        const discipline =
          document.getElementById("discipline").value.trim();

        const sexe =
          document.getElementById("sexe").value.trim();

        const age =
          document.getElementById("age").value.trim();

        const prixValue =
          document.getElementById("prix").value;

        const description =
          document.getElementById("description").value.trim();

        const vendu =
          document.getElementById("vendu").checked;

        const photoInput =
          document.getElementById("photo-file");

        const file =
          photoInput.files[0];


        /* =========================
           ENVOI DE LA PHOTO
        ========================= */

        let photoUrl = "";


        if (file) {

          const extension =
            file.name.split(".").pop().toLowerCase();

          const fileName =
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2) +
            "." +
            extension;


          const upload =
            await client.storage
              .from("chevaux")
              .upload(fileName, file, {
                cacheControl: "3600",
                upsert: false
              });


          if (upload.error) {

            throw new Error(
              "Envoi de la photo impossible : " +
              upload.error.message
            );

          }


          /* =========================
             RECUPERATION URL
          ========================= */

          const publicUrl =
            client.storage
              .from("chevaux")
              .getPublicUrl(fileName);


          photoUrl =
            publicUrl.data.publicUrl;

        }


        /* =========================
           CREATION DU CHEVAL
        ========================= */

        const row = {

          nom: nom,

          discipline: discipline,

          sexe: sexe,

          age: age,

          prix: prixValue || null,

          photo: photoUrl,

          description: description,

          vendu: vendu

        };


        const result =
          await client
            .from(table())
            .insert(row);


        if (result.error) {

          throw new Error(
            "Ajout impossible : " +
            result.error.message
          );

        }


        msg(
          "Cheval ajouté avec sa photo.",
          "success"
        );


        document
          .getElementById("horse-form")
          .reset();


        document
          .getElementById("photo-preview")
          .innerHTML = "";


        await load();


      } catch (error) {

        msg(
          error.message,
          "error"
        );

      } finally {

        button.disabled = false;

      }

    });


  /* LANCEMENT */

  boot();

});
```
