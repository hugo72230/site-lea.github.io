```js
var client = null;

var TABLE = window.LEADY_HORSES_TABLE || "chevaux";
var BUCKET = "chevaux";


function showMessage(text, type) {
  var box = document.getElementById("admin-message");

  if (!box) return;

  box.textContent = text;
  box.className = "message " + (type || "");
}


function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =====================================================
   CHARGER LES CHEVAUX
===================================================== */

async function loadHorses() {
  var list = document.getElementById("horse-list");

  if (!list) return;

  list.innerHTML = "Chargement...";

  var result = await client
    .from(TABLE)
    .select("*")
    .order("id", { ascending: false });

  if (result.error) {
    console.error(result.error);

    list.innerHTML =
      '<div class="empty">Erreur : ' +
      escapeHTML(result.error.message) +
      "</div>";

    return;
  }

  var horses = result.data || [];

  if (horses.length === 0) {
    list.innerHTML =
      '<div class="empty">Aucun cheval.</div>';

    return;
  }

  list.innerHTML = "";

  horses.forEach(function (horse) {
    var item = document.createElement("div");

    item.className = "admin-item";


    /* PHOTO */

    if (horse.photo) {
      var image = document.createElement("img");

      image.src = horse.photo;
      image.alt = horse.nom || "Cheval";

      image.style.width = "90px";
      image.style.height = "90px";
      image.style.objectFit = "cover";
      image.style.borderRadius = "10px";
      image.style.marginRight = "15px";

      item.appendChild(image);
    }


    /* INFORMATIONS */

    var info = document.createElement("div");

    info.style.flex = "1";

    var name = document.createElement("strong");

    name.textContent = horse.nom || "Sans nom";

    info.appendChild(name);


    var meta = document.createElement("div");

    meta.className = "meta";

    var texte = [];

    if (horse.discipline) {
      texte.push(horse.discipline);
    }

    if (horse.sexe) {
      texte.push(horse.sexe);
    }

    if (horse.age) {
      texte.push(horse.age + " ans");
    }

    if (horse.prix) {
      texte.push(horse.prix + " €");
    }

    meta.textContent = texte.join(" · ");

    info.appendChild(meta);


    /* DESCRIPTION */

    if (horse.description) {
      var description = document.createElement("div");

      description.style.marginTop = "5px";
      description.textContent = horse.description;

      info.appendChild(description);
    }


    /* VENDU */

    if (horse.vendu) {
      var vendu = document.createElement("div");

      vendu.textContent = "VENDU";
      vendu.style.fontWeight = "bold";
      vendu.style.marginTop = "5px";

      info.appendChild(vendu);
    }


    item.appendChild(info);


    /* SUPPRIMER */

    var button = document.createElement("button");

    button.className = "delete";
    button.type = "button";
    button.textContent = "Supprimer";

    button.addEventListener("click", async function () {
      if (!confirm("Supprimer ce cheval ?")) {
        return;
      }

      button.disabled = true;
      button.textContent = "Suppression...";

      var deleted = await client
        .from(TABLE)
        .delete()
        .eq("id", horse.id);

      if (deleted.error) {
        console.error(deleted.error);

        showMessage(
          "Suppression impossible : " +
          deleted.error.message,
          "error"
        );

        button.disabled = false;
        button.textContent = "Supprimer";

        return;
      }

      showMessage(
        "Cheval supprimé.",
        "success"
      );

      await loadHorses();
    });


    item.appendChild(button);

    list.appendChild(item);
  });
}


/* =====================================================
   ENVOYER UNE PHOTO
===================================================== */

async function sendPhoto(file) {
  if (!file) {
    return "";
  }


  if (file.type.indexOf("image/") !== 0) {
    throw new Error(
      "Le fichier choisi n'est pas une image."
    );
  }


  if (file.size > 10 * 1024 * 1024) {
    throw new Error(
      "La photo dépasse 10 Mo."
    );
  }


  var extension = "jpg";

  if (file.name.indexOf(".") !== -1) {
    extension = file.name
      .split(".")
      .pop()
      .toLowerCase();
  }


  var filename =
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2) +
    "." +
    extension;


  console.log(
    "Envoi photo :",
    filename
  );


  var upload = await client.storage
    .from(BUCKET)
    .upload(
      filename,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      }
    );


  if (upload.error) {
    console.error(
      "Erreur upload :",
      upload.error
    );

    throw new Error(
      "Erreur photo : " +
      upload.error.message
    );
  }


  var publicUrl = client.storage
    .from(BUCKET)
    .getPublicUrl(filename);


  if (
    !publicUrl ||
    !publicUrl.data ||
    !publicUrl.data.publicUrl
  ) {
    throw new Error(
      "Impossible de récupérer l'adresse de la photo."
    );
  }


  return publicUrl.data.publicUrl;
}


/* =====================================================
   APERCU PHOTO
===================================================== */

function setupPhoto() {
  var input =
    document.getElementById("photo-file");

  var preview =
    document.getElementById("photo-preview");


  if (!input || !preview) {
    return;
  }


  input.addEventListener("change", function () {
    preview.innerHTML = "";

    var file = input.files[0];

    if (!file) {
      return;
    }


    if (file.type.indexOf("image/") !== 0) {
      showMessage(
        "Le fichier choisi n'est pas une image.",
        "error"
      );

      input.value = "";

      return;
    }


    var image =
      document.createElement("img");

    image.src =
      URL.createObjectURL(file);

    image.alt = "Aperçu";

    image.style.width = "150px";
    image.style.height = "150px";
    image.style.objectFit = "cover";
    image.style.borderRadius = "12px";

    preview.appendChild(image);
  });
}


/* =====================================================
   AJOUTER UN CHEVAL
===================================================== */

function setupForm() {
  var form =
    document.getElementById("horse-form");


  if (!form) {
    return;
  }


  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      var button =
        document.getElementById(
          "add-horse-button"
        );


      if (button) {
        button.disabled = true;
        button.textContent =
          "Ajout en cours...";
      }


      try {

        var nom =
          document
            .getElementById("nom")
            .value
            .trim();


        var discipline =
          document
            .getElementById("discipline")
            .value
            .trim();


        var sexe =
          document
            .getElementById("sexe")
            .value
            .trim();


        var age =
          document
            .getElementById("age")
            .value
            .trim();


        var prix =
          document
            .getElementById("prix")
            .value;


        var description =
          document
            .getElementById("description")
            .value
            .trim();


        var vendu =
          document
            .getElementById("vendu")
            .checked;


        var photoInput =
          document.getElementById(
            "photo-file"
          );


        var file =
          photoInput &&
          photoInput.files.length > 0
            ? photoInput.files[0]
            : null;


        /* NOM OBLIGATOIRE */

        if (!nom) {
          throw new Error(
            "Le nom du cheval est obligatoire."
          );
        }


        /* PHOTO */

        var photo = "";


        if (file) {

          showMessage(
            "Envoi de la photo...",
            ""
          );


          photo =
            await sendPhoto(file);
        }


        /* CHEVAL */

        var horse = {
          nom: nom,
          discipline: discipline,
          sexe: sexe,
          age: age,
          prix: prix || null,
          photo: photo,
          description: description,
          vendu: vendu
        };


        console.log(
          "Cheval à ajouter :",
          horse
        );


        /* AJOUT SUPABASE */

        var result =
          await client
            .from(TABLE)
            .insert(horse);


        if (result.error) {

          console.error(
            "Erreur ajout :",
            result.error
          );


          throw new Error(
            "Ajout impossible : " +
            result.error.message
          );
        }


        /* SUCCÈS */

        showMessage(
          "Cheval ajouté avec succès !",
          "success"
        );


        form.reset();


        var preview =
          document.getElementById(
            "photo-preview"
          );


        if (preview) {
          preview.innerHTML = "";
        }


        await loadHorses();
      }


      catch (error) {

        console.error(
          "ERREUR :",
          error
        );


        showMessage(
          error.message ||
          "Une erreur est survenue.",
          "error"
        );
      }


      if (button) {

        button.disabled = false;

        button.textContent =
          "Ajouter le cheval";
      }
    }
  );
}


/* =====================================================
   DECONNEXION
===================================================== */

function setupLogout() {
  var logout =
    document.getElementById("logout");


  if (!logout) {
    return;
  }


  logout.addEventListener(
    "click",
    async function () {

      await client.auth.signOut();

      window.location.href =
        "login.html";
    }
  );
}


/* =====================================================
   DEMARRAGE
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "LEADY GESTION - démarrage"
    );


    /* VERIFICATION SUPABASE */

    if (
      !window.supabase ||
      !window.LEADY_SUPABASE_URL ||
      !window.LEADY_SUPABASE_ANON_KEY
    ) {

      console.error(
        "Configuration Supabase introuvable."
      );

      showMessage(
        "Erreur : configuration Supabase introuvable.",
        "error"
      );

      return;
    }


    /* CREATION CLIENT */

    client =
      window.supabase.createClient(
        window.LEADY_SUPABASE_URL,
        window.LEADY_SUPABASE_ANON_KEY
      );


    /* VERIFICATION CONNEXION */

    var sessionResult =
      await client.auth.getSession();


    if (
      sessionResult.error ||
      !sessionResult.data.session
    ) {

      window.location.href =
        "login.html";

      return;
    }


    console.log(
      "Connexion Supabase OK"
    );


    /* INITIALISATION */

    setupPhoto();

    setupForm();

    setupLogout();


    /* CHARGER LES CHEVAUX */

    await loadHorses();
  }
);
```
