```javascript
let client = null;

function table() {
  return window.LEADY_HORSES_TABLE || "chevaux";
}

function msg(t, type) {
  var e = document.getElementById("admin-message");

  if (!e) return;

  e.textContent = t;
  e.className = "message " + (type || "");
}

function esc(v) {
  return String(v || "").replace(/[&<>"']/g, function(c) {
    var map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return map[c];
  });
}


/* =========================
   DEMARRAGE
========================= */

async function boot() {
  try {

    client = window.supabase.createClient(
      window.LEADY_SUPABASE_URL,
      window.LEADY_SUPABASE_ANON_KEY
    );

    var result = await client.auth.getSession();

    var session = result.data.session;

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
   CHARGER LES CHEVAUX
========================= */

async function load() {

  var box = document.getElementById("horse-list");

  var result = await client
    .from(table())
    .select("*");

  if (result.error) {

    box.innerHTML =
      '<div class="empty">' +
      esc(result.error.message) +
      "</div>";

    return;
  }

  var data = result.data;

  if (!data || data.length === 0) {

    box.innerHTML =
      '<div class="empty">Aucun cheval.</div>';

    return;
  }

  box.innerHTML = "";

  data.forEach(function(h) {

    var item = document.createElement("div");

    item.className = "admin-item";

    var photo = "";

    if (h.photo) {

      photo =
        '<img src="' +
        esc(h.photo) +
        '" alt="' +
        esc(h.nom || "Cheval") +
        '" style="width:80px;height:80px;object-fit:cover;border-radius:10px;">';

    }

    item.innerHTML =
      photo +
      '<div style="flex:1;">' +
        "<strong>" +
        esc(h.nom || "Sans nom") +
        "</strong>" +
        '<div class="meta">' +
          esc(h.discipline || "") +
          " · " +
          esc(h.sexe || "") +
          " · " +
          esc(h.age || "") +
          " ans" +
        "</div>" +
      "</div>" +
      '<button class="delete" data-id="' +
        esc(h.id) +
        '">' +
        "Supprimer" +
      "</button>";

    box.appendChild(item);

  });


  /* =========================
     BOUTONS SUPPRIMER
  ========================= */

  box.querySelectorAll(".delete").forEach(function(button) {

    button.addEventListener("click", async function() {

      if (!confirm("Supprimer ce cheval ?")) {
        return;
      }

      var result = await client
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

      await load();

    });

  });

}


/* =========================
   PAGE CHARGEE
========================= */

document.addEventListener("DOMContentLoaded", function() {

  /* =========================
     APERCU DE LA PHOTO
  ========================= */

  var photoInput =
    document.getElementById("photo-file");

  var preview =
    document.getElementById("photo-preview");

  if (photoInput) {

    photoInput.addEventListener("change", function() {

      preview.innerHTML = "";

      var file = photoInput.files[0];

      if (!file) {
        return;
      }

      var image = document.createElement("img");

      image.src = URL.createObjectURL(file);

      image.style.width = "150px";
      image.style.height = "150px";
      image.style.objectFit = "cover";
      image.style.borderRadius = "12px";
      image.style.marginTop = "5px";

      preview.appendChild(image);

    });

  }


  /* =========================
     DECONNEXION
  ========================= */

  var logout =
    document.getElementById("logout");

  if (logout) {

    logout.addEventListener("click", async function() {

      if (client) {
        await client.auth.signOut();
      }

      location.href = "login.html";

    });

  }


  /* =========================
     AJOUTER UN CHEVAL
  ========================= */

  var form =
    document.getElementById("horse-form");

  if (form) {

    form.addEventListener("submit", async function(e) {

      e.preventDefault();

      var button =
        form.querySelector('button[type="submit"]');

      button.disabled = true;

      try {

        var nom =
          document.getElementById("nom").value.trim();

        var discipline =
          document.getElementById("discipline").value.trim();

        var sexe =
          document.getElementById("sexe").value.trim();

        var age =
          document.getElementById("age").value.trim();

        var prix =
          document.getElementById("prix").value;

        var description =
          document.getElementById("description").value.trim();

        var vendu =
          document.getElementById("vendu").checked;

        var file =
          photoInput ? photoInput.files[0] : null;


        /* =========================
           PHOTO
        ========================= */

        var photoUrl = "";


        if (file) {

          var extension =
            file.name
              .split(".")
              .pop()
              .toLowerCase();

          var fileName =
            Date.now() +
            "-" +
            Math.random()
              .toString(36)
              .substring(2) +
            "." +
            extension;


          var upload =
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


          var publicResult =
            client.storage
              .from("chevaux")
              .getPublicUrl(fileName);


          photoUrl =
            publicResult.data.publicUrl;

        }


        /* =========================
           CREER LE CHEVAL
        ========================= */

        var row = {
          nom: nom,
          discipline: discipline,
          sexe: sexe,
          age: age,
          prix: prix || null,
          photo: photoUrl,
          description: description,
          vendu: vendu
        };


        var insertResult =
          await client
            .from(table())
            .insert(row);


        if (insertResult.error) {

          throw new Error(
            "Ajout impossible : " +
            insertResult.error.message
          );

        }


        msg(
          "Cheval ajouté avec succès.",
          "success"
        );


        form.reset();

        if (preview) {
          preview.innerHTML = "";
        }

        await load();


      } catch (error) {

        msg(
          error.message,
          "error"
        );

      }


      button.disabled = false;

    });

  }


  /* =========================
     DEMARRAGE
  ========================= */

  boot();

});
```
