
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

async function load() {
  const box = document.getElementById("horse-list");

  box.innerHTML = "Chargement...";

  const result = await client
    .from(table())
    .select("*")
    .order("id", { ascending: false });

  const data = result.data;
  const error = result.error;

  if (error) {
    box.innerHTML =
      '<div class="empty">' + esc(error.message) + "</div>";
    return;
  }

  if (!data || data.length === 0) {
    box.innerHTML =
      '<div class="empty">Aucun cheval.</div>';
    return;
  }

  box.innerHTML = data.map(function(h) {
    return `
      <div class="admin-item horse-card" data-id="${esc(h.id)}" style="cursor:pointer;">

        <div>
          <strong>${esc(h.nom || h.name || "Sans nom")}</strong>

          <div class="meta">
            ${esc(h.discipline || "")}
            ·
            ${esc(h.sexe || h.sex || "")}
            ·
            ${esc(h.age || "")} ans
          </div>

          <div class="meta">
            ${h.vendu ? "🔴 Vendu" : "🟢 Disponible"}
          </div>
        </div>

        <button class="delete" data-id="${esc(h.id)}" type="button">
          Supprimer
        </button>

      </div>
    `;
  }).join("");

  const cards = box.querySelectorAll(".horse-card");

  cards.forEach(function(card) {
    card.addEventListener("click", function(event) {

      if (event.target.closest(".delete")) {
        return;
      }

      const id = card.dataset.id;

      const cheval = data.find(function(h) {
        return String(h.id) === String(id);
      });

      if (cheval) {
        openEdit(cheval);
      }
    });
  });

  const deleteButtons = box.querySelectorAll(".delete");

  deleteButtons.forEach(function(button) {

    button.addEventListener("click", async function(event) {

      event.stopPropagation();

      if (!confirm("Supprimer ce cheval ?")) {
        return;
      }

      const result = await client
        .from(table())
        .delete()
        .eq("id", button.dataset.id);

      if (result.error) {
        msg(
          "Suppression impossible : " + result.error.message,
          "error"
        );
        return;
      }

      msg("Cheval supprimé.", "success");

      await load();
    });
  });
}

function openEdit(h) {

  document.getElementById("edit-panel").style.display = "block";

  document.getElementById("edit-id").value = h.id || "";

  document.getElementById("edit-nom").value =
    h.nom || h.name || "";

  document.getElementById("edit-discipline").value =
    h.discipline || "";

  document.getElementById("edit-sexe").value =
    h.sexe || h.sex || "";

  document.getElementById("edit-age").value =
    h.age || "";

  document.getElementById("edit-prix").value =
    h.prix || "";

  document.getElementById("edit-photo").value =
    h.photo || "";

  document.getElementById("edit-description").value =
    h.description || "";

  document.getElementById("edit-vendu").checked =
    Boolean(h.vendu);

  document.getElementById("edit-title").textContent =
    "Modifier : " + (h.nom || h.name || "Cheval");

  document.getElementById("edit-panel").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function closeEdit() {
  document.getElementById("edit-panel").style.display = "none";
}

document.addEventListener("DOMContentLoaded", function() {

  boot();

  document.getElementById("logout").addEventListener(
    "click",
    async function() {

      await client.auth.signOut();

      location.href = "login.html";
    }
  );


  /* AJOUTER */

  document.getElementById("horse-form").addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();

      const row = {
        nom: document.getElementById("nom").value.trim(),
        discipline: document.getElementById("discipline").value.trim(),
        sexe: document.getElementById("sexe").value.trim(),
        age: document.getElementById("age").value.trim(),
        prix: document.getElementById("prix").value || null,
        photo: document.getElementById("photo").value.trim(),
        description: document.getElementById("description").value.trim(),
        vendu: document.getElementById("vendu").checked
      };

      const result = await client
        .from(table())
        .insert(row);

      if (result.error) {
        msg(
          "Ajout impossible : " + result.error.message,
          "error"
        );
        return;
      }

      msg("Cheval ajouté.", "success");

      e.target.reset();

      await load();
    }
  );


  /* MODIFIER */

  document.getElementById("edit-form").addEventListener(
    "submit",
    async function(e) {

      e.preventDefault();

      const id = document.getElementById("edit-id").value;

      const updates = {
        nom: document.getElementById("edit-nom").value.trim(),
        discipline: document.getElementById("edit-discipline").value.trim(),
        sexe: document.getElementById("edit-sexe").value.trim(),
        age: document.getElementById("edit-age").value.trim(),
        prix: document.getElementById("edit-prix").value || null,
        photo: document.getElementById("edit-photo").value.trim(),
        description: document.getElementById("edit-description").value.trim(),
        vendu: document.getElementById("edit-vendu").checked
      };

      const result = await client
        .from(table())
        .update(updates)
        .eq("id", id);

      if (result.error) {
        msg(
          "Modification impossible : " + result.error.message,
          "error"
        );
        return;
      }

      msg(
        "Modifications enregistrées.",
        "success"
      );

      await load();

      closeEdit();
    }
  );


  /* ANNULER */

  document.getElementById("cancel-edit").addEventListener(
    "click",
    closeEdit
  );

  document.getElementById("cancel-edit-2").addEventListener(
    "click",
    closeEdit
  );

});
```
