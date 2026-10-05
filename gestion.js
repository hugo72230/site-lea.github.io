let client = null;

const table = () => window.LEADY_HORSES_TABLE || "chevaux";


// ==============================
// MESSAGE
// ==============================

function msg(t, type) {

  const e = document.getElementById("admin-message");

  if (!e) return;

  e.textContent = t;
  e.className = "message " + (type || "");

}


// ==============================
// SECURITE
// ==============================

function esc(v) {

  return String(v || "").replace(
    /[&<>"']/g,
    function(c) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c];

    }
  );

}


// ==============================
// DEMARRAGE
// ==============================

async function boot() {

  try {

    client = window.supabase.createClient(
      window.LEADY_SUPABASE_URL,
      window.LEADY_SUPABASE_ANON_KEY
    );


    const result = await client.auth.getSession();

    const session = result.data.session;


    if (!session) {

      window.location.href = "login.html";

      return;

    }


    await load();


  } catch (error) {

    console.error(error);

    msg(
      "Erreur : " + error.message,
      "error"
    );

  }

}


// ==============================
// CHARGER LES CHEVAUX
// ==============================

async function load() {

  const box = document.getElementById("horse-list");

  if (!box) return;


  box.innerHTML = "Chargement...";


  const result = await client
    .from(table())
    .select("*");


  const data = result.data;
  const error = result.error;


  if (error) {

    console.error(error);

    box.innerHTML =
      '<div class="empty">' +
      esc(error.message) +
      '</div>';

    return;

  }


  if (!data || data.length === 0) {

    box.innerHTML =
      '<div class="empty">Aucun cheval.</div>';

    return;

  }


  box.innerHTML = data.map(function(h) {

    return `
      <div class="admin-item">

        <div>

          <strong>
            ${esc(h.nom || "Sans nom")}
          </strong>

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
          type="button"
          data-id="${esc(h.id)}"
        >
          Supprimer
        </button>

      </div>
    `;

  }).join("");


  // ==============================
  // SUPPRESSION
  // ==============================

  const buttons =
    box.querySelectorAll(".delete");


  buttons.forEach(function(button) {

    button.addEventListener("click", async function() {

      if (!confirm("Supprimer ce cheval ?")) {
        return;
      }


      const result = await client
        .from(table())
        .delete()
        .eq("id", button.dataset.id);


      if (result.error) {

        console.error(result.error);

        msg(
          "Suppression impossible : " +
          result.error.message,
          "error"
        );

        return;

      }


      msg(
        "Cheval supprimé.",
        "success"
      );


      await load();

    });

  });

}


// ==============================
// APERCU PHOTO
// ==============================

function setupPhoto() {

  const input =
    document.getElementById("photo-file");

  const preview =
    document.getElementById("photo-preview");


  if (!input || !preview) {
    return;
  }


  input.addEventListener("change", function() {

    preview.innerHTML = "";


    if (!input.files || !input.files[0]) {
      return;
    }


    const file = input.files[0];


    if (!file.type.startsWith("image/")) {

      msg(
        "Le fichier sélectionné n'est pas une image.",
        "error"
      );

      input.value = "";

      return;

    }


    const img = document.createElement("img");


    img.src =
      URL.createObjectURL(file);


    img.style.maxWidth = "250px";
    img.style.maxHeight = "200px";
    img.style.borderRadius = "10px";
    img.style.objectFit = "cover";


    preview.appendChild(img);

  });

}


// ==============================
// PAGE
// ==============================

document.addEventListener(
  "DOMContentLoaded",
  function() {


    // Connexion
    boot();


    // ==========================
    // DECONNEXION
    // ==========================

    const logout =
      document.getElementById("logout");


    if (logout) {

      logout.addEventListener(
        "click",
        async function() {

          if (client) {

            await client.auth.signOut();

          }

          window.location.href =
            "login.html";

        }
      );

    }


    // ==========================
    // PHOTO
    // ==========================

    setupPhoto();


    // ==========================
    // FORMULAIRE
    // ==========================

    const form =
      document.getElementById("horse-form");


    if (!form) {

      console.error(
        "ERREUR : horse-form introuvable"
      );

      return;

    }


    form.addEventListener(
      "submit",
      async function(e) {

        e.preventDefault();


        console.log(
          "BOUTON AJOUT CHEVAL CLIQUE"
        );


        if (!client) {

          msg(
            "Supabase n'est pas encore connecté.",
            "error"
          );

          return;

        }


        // ========================
        // RECUPERATION
        // ========================

        const nom =
          document.getElementById("nom").value.trim();

        const discipline =
          document.getElementById("discipline").value.trim();

        const sexe =
          document.getElementById("sexe").value.trim();

        const age =
          document.getElementById("age").value.trim();

        const prix =
          document.getElementById("prix").value;

        const description =
          document.getElementById("description").value.trim();

        const vendu =
          document.getElementById("vendu").checked;


        // ========================
        // VERIFICATION NOM
        // ========================

        if (!nom) {

          msg(
            "Le nom du cheval est obligatoire.",
            "error"
          );

          return;

        }


        // ========================
        // CREATION
        // ========================

        const row = {

          nom: nom,

          discipline: discipline,

          sexe: sexe,

          age: age,

          prix: prix
            ? Number(prix)
            : null,

          photo: "",

          description: description,

          vendu: vendu

        };


        console.log(
          "DONNEES ENVOYEES :",
          row
        );


        msg(
          "Ajout du cheval...",
          ""
        );


        // ========================
        // SUPABASE
        // ========================

        const result = await client
          .from(table())
          .insert(row);


        console.log(
          "REPONSE SUPABASE :",
          result
        );


        if (result.error) {

          console.error(
            "ERREUR SUPABASE :",
            result.error
          );


          msg(
            "Ajout impossible : " +
            result.error.message,
            "error"
          );

          return;

        }


        // ========================
        // SUCCES
        // ========================

        msg(
          "Cheval ajouté avec succès !",
          "success"
        );


        form.reset();


        const preview =
          document.getElementById("photo-preview");


        if (preview) {

          preview.innerHTML = "";

        }


        await load();

      }
    );

  }
);
```
