```javascript
/* =========================================================
   LEADY COMMERCE
   GESTION DES CHEVAUX
   ========================================================= */


/* =========================================================
   VARIABLES
   ========================================================= */

var client = null;

var TABLE =
  window.LEADY_HORSES_TABLE || "chevaux";

var BUCKET = "chevaux";


/* =========================================================
   MESSAGE
   ========================================================= */

function message(texte, type) {

  var element =
    document.getElementById("admin-message");

  if (!element) {
    return;
  }

  element.textContent = texte;

  element.className =
    "message " + (type || "");

}


/* =========================================================
   SECURITE HTML
   ========================================================= */

function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   DEMARRAGE
   ========================================================= */

async function start() {

  try {

    console.log("=== LEADY GESTION ===");

    console.log(
      "Table utilisée :",
      TABLE
    );


    /* Vérification Supabase */

    if (!window.supabase) {

      throw new Error(
        "Supabase n'est pas chargé."
      );

    }


    if (!window.LEADY_SUPABASE_URL) {

      throw new Error(
        "LEADY_SUPABASE_URL est introuvable."
      );

    }


    if (!window.LEADY_SUPABASE_ANON_KEY) {

      throw new Error(
        "LEADY_SUPABASE_ANON_KEY est introuvable."
      );

    }


    /* Connexion */

    client =
      window.supabase.createClient(
        window.LEADY_SUPABASE_URL,
        window.LEADY_SUPABASE_ANON_KEY
      );


    console.log(
      "Connexion Supabase OK"
    );


    /* Vérification connexion utilisateur */

    var sessionResult =
      await client.auth.getSession();


    if (
      sessionResult.error
    ) {

      throw sessionResult.error;

    }


    var session =
      sessionResult.data.session;


    if (!session) {

      console.log(
        "Aucune connexion utilisateur."
      );

      window.location.href =
        "login.html";

      return;

    }


    console.log(
      "Utilisateur connecté :",
      session.user.email
    );


    /* Chargement */

    await loadHorses();


  } catch (error) {

    console.error(
      "ERREUR DEMARRAGE :",
      error
    );

    message(
      "Erreur : " + error.message,
      "error"
    );

  }

}


/* =========================================================
   CHARGER LES CHEVAUX
   ========================================================= */

async function loadHorses() {

  var list =
    document.getElementById("horse-list");


  if (!list) {

    console.error(
      "horse-list introuvable"
    );

    return;

  }


  list.innerHTML =
    "Chargement des chevaux...";


  try {

    console.log(
      "Chargement de la table :",
      TABLE
    );


    var result =
      await client
        .from(TABLE)
        .select("*")
        .order("id", {
          ascending: false
        });


    if (result.error) {

      console.error(
        "ERREUR LECTURE :",
        result.error
      );

      list.innerHTML =
        "<div class=\"empty\">" +
        "Erreur de chargement : " +
        escapeHTML(
          result.error.message
        ) +
        "</div>";

      return;

    }


    var horses =
      result.data || [];


    console.log(
      "Chevaux trouvés :",
      horses
    );


    /* Aucun cheval */

    if (horses.length === 0) {

      list.innerHTML =
        "<div class=\"empty\">" +
        "Aucun cheval." +
        "</div>";

      return;

    }


    /* Nettoyage */

    list.innerHTML = "";


    /* Création de chaque cheval */

    horses.forEach(function(horse) {

      var item =
        document.createElement("div");

      item.className =
        "admin-item";


      /* PHOTO */

      var photoHTML = "";

      if (
        horse.photo &&
        String(horse.photo).trim() !== ""
      ) {

        photoHTML =
          "<img " +
          "src=\"" +
          escapeHTML(horse.photo) +
          "\" " +
          "alt=\"" +
          escapeHTML(
            horse.nom || "Cheval"
          ) +
          "\" " +
          "style=\"" +
          "width:90px;" +
          "height:90px;" +
          "object-fit:cover;" +
          "border-radius:10px;" +
          "margin-right:15px;" +
          "\">";

      }


      /* INFORMATIONS */

      var nom =
        horse.nom || "Sans nom";

      var discipline =
        horse.discipline || "";

      var sexe =
        horse.sexe || "";

      var age =
        horse.age || "";


      var informations =
        "<div style=\"" +
        "flex:1;" +
        "\">" +

        "<strong>" +
        escapeHTML(nom) +
        "</strong>" +

        "<div class=\"meta\">" +

        escapeHTML(
          discipline
        ) +

        (
          discipline && sexe
            ? " · "
            : ""
        ) +

        escapeHTML(
          sexe
        ) +

        (
          age
            ? " · " +
              escapeHTML(age) +
              " ans"
            : ""
        ) +

        "</div>" +

        "</div>";


      /* BOUTON SUPPRIMER */

      var deleteButton =
        document.createElement("button");

      deleteButton.className =
        "delete";

      deleteButton.type =
        "button";

      deleteButton.textContent =
        "Supprimer";

      deleteButton.dataset.id =
        horse.id;


      /* Structure */

      item.innerHTML =
        photoHTML +
        informations;


      item.appendChild(
        deleteButton
      );


      list.appendChild(
        item
      );


      /* Suppression */

      deleteButton.addEventListener(
        "click",
        function() {

          deleteHorse(
            horse.id
          );

        }
      );

    });


  } catch (error) {

    console.error(
      "ERREUR LOAD :",
      error
    );

    list.innerHTML =
      "<div class=\"empty\">" +
      "Erreur : " +
      escapeHTML(
        error.message
      ) +
      "</div>";

  }

}


/* =========================================================
   SUPPRIMER UN CHEVAL
   ========================================================= */

async function deleteHorse(id) {

  if (!id) {

    message(
      "ID du cheval introuvable.",
      "error"
    );

    return;

  }


  if (
    !confirm(
      "Voulez-vous vraiment supprimer ce cheval ?"
    )
  ) {

    return;

  }


  try {

    console.log(
      "Suppression du cheval :",
      id
    );


    var result =
      await client
        .from(TABLE)
        .delete()
        .eq("id", id);


    if (result.error) {

      console.error(
        "ERREUR SUPPRESSION :",
        result.error
      );

      message(
        "Suppression impossible : " +
        result.error.message,
        "error"
      );

      return;

    }


    message(
      "Cheval supprimé.",
      "success"
    );


    await loadHorses();


  } catch (error) {

    console.error(
      "ERREUR DELETE :",
      error
    );

    message(
      "Erreur : " +
      error.message,
      "error"
    );

  }

}


/* =========================================================
   UPLOAD PHOTO
   ========================================================= */

async function uploadPhoto(file) {

  if (!file) {

    return "";

  }


  console.log(
    "Upload de la photo :",
    file.name
  );


  /* Vérification type */

  if (
    !file.type ||
    file.type.indexOf("image/") !== 0
  ) {

    throw new Error(
      "Le fichier choisi n'est pas une image."
    );

  }


  /* Limite 10 Mo */

  if (
    file.size > 10 * 1024 * 1024
  ) {

    throw new Error(
      "La photo est trop grosse. Maximum : 10 Mo."
    );

  }


  /* Extension */

  var extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  if (!extension) {

    extension = "jpg";

  }


  /* Nom unique */

  var filename =
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 12) +
    "." +
    extension;


  /* Envoi */

  var upload =
    await client.storage
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
      "ERREUR STORAGE :",
      upload.error
    );

    throw new Error(
      "Impossible d'envoyer la photo : " +
      upload.error.message
    );

  }


  console.log(
    "Photo envoyée :",
    filename
  );


  /* URL publique */

  var publicURL =
    client.storage
      .from(BUCKET)
      .getPublicUrl(
        filename
      );


  if (
    !publicURL ||
    !publicURL.data ||
    !publicURL.data.publicUrl
  ) {

    throw new Error(
      "Impossible de récupérer l'adresse de la photo."
    );

  }


  console.log(
    "URL photo :",
    publicURL.data.publicUrl
  );


  return publicURL.data.publicUrl;

}


/* =========================================================
   APERCU PHOTO
   ========================================================= */

function setupPhotoPreview() {

  var input =
    document.getElementById(
      "photo-file"
    );

  var preview =
    document.getElementById(
      "photo-preview"
    );


  if (!input || !preview) {

    return;

  }


  input.addEventListener(
    "change",
    function() {

      preview.innerHTML = "";


      var file =
        input.files &&
        input.files[0];


      if (!file) {

        return;

      }


      var image =
        document.createElement("img");


      image.src =
        URL.createObjectURL(
          file
        );


      image.style.width =
        "150px";

      image.style.height =
        "150px";

      image.style.objectFit =
        "cover";

      image.style.borderRadius =
        "12px";


      preview.appendChild(
        image
      );

    }
  );

}


/* =========================================================
   AJOUTER UN CHEVAL
   ========================================================= */

function setupHorseForm() {

  var form =
    document.getElementById(
      "horse-form"
    );


  if (!form) {

    console.error(
      "horse-form introuvable"
    );

    return;

  }


  form.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      var button =
        document.getElementById(
          "add-horse-button"
        );


      if (button) {

        button.disabled =
          true;

        button.textContent =
          "Ajout en cours...";

      }


      try {

        /* =====================
           RECUPERATION CHAMPS
        ===================== */

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
          photoInput.files &&
          photoInput.files[0];


        /* =====================
           VERIFICATION NOM
        ===================== */

        if (!nom) {

          throw new Error(
            "Tu dois mettre le nom du cheval."
          );

        }


        /* =====================
           PHOTO
        ===================== */

        var photoURL = "";


        if (file) {

          message(
            "Envoi de la photo...",
            ""
          );


          photoURL =
            await uploadPhoto(
              file
            );

        }


        /* =====================
           CREATION DONNEE
        ===================== */

        var horse = {

          nom: nom,

          discipline:
            discipline,

          sexe:
            sexe,

          age:
            age,

          prix:
            prix || null,

          photo:
            photoURL,

          description:
            description,

          vendu:
            vendu

        };


        console.log(
          "Ajout du cheval :",
          horse
        );


        /* =====================
           INSERT SUPABASE
        ===================== */

        var result =
          await client
            .from(TABLE)
            .insert(horse);


        if (result.error) {

          console.error(
            "ERREUR INSERT :",
            result.error
          );


          throw new Error(
            "Ajout impossible : " +
            result.error.message
          );

        }


        /* =====================
           SUCCES
        ===================== */

        message(
          "Cheval ajouté avec succès !",
          "success"
        );


        /* Reset */

        form.reset();


        var preview =
          document.getElementById(
            "photo-preview"
          );


        if (preview) {

          preview.innerHTML = "";

        }


        /* Recharge la liste */

        await loadHorses();


      } catch (error) {

        console.error(
          "ERREUR AJOUT CHEVAL :",
          error
        );


        message(
          error.message,
          "error"
        );

      }


      if (button) {

        button.disabled =
          false;

        button.textContent =
          "Ajouter le cheval";

      }

    }
  );

}


/* =========================================================
   DECONNEXION
   ========================================================= */

function setupLogout() {

  var button =
    document.getElementById(
      "logout"
    );


  if (!button) {

    return;

  }


  button.addEventListener(
    "click",
    async function() {

      try {

        if (client) {

          await client.auth.signOut();

        }

      } catch (error) {

        console.error(
          error
        );

      }


      window.location.href =
        "login.html";

    }
  );

}


/* =========================================================
   DEMARRAGE PAGE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "gestion.js version 4 chargé"
    );


    setupPhotoPreview();

    setupHorseForm();

    setupLogout();

    start();

  }
);
```
