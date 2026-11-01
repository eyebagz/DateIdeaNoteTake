
/* ========================================
   Our Little Date Journal
   Main JavaScript
======================================== */

const STORAGE_KEY = "our-little-date-journal-ideas-v1";
const $ = (selector) => document.querySelector(selector);

const todoList = $("#todoList");
const doneList = $("#doneList");
const dialog = $("#ideaDialog");
const form = $("#ideaForm");
const detailDialog = $("#detailDialog");

let ideas = loadIdeas();
let toastTimer;
let selectedDetailId = null;

const fields = [
    "title", "location", "date", "time", "cost",
    "description", "bring", "notes"
];

const fieldIds = {
    title: "ideaTitle",
    location: "ideaLocation",
    date: "ideaDate",
    time: "ideaTime",
    cost: "ideaCost",
    description: "ideaDescription",
    bring: "ideaBring",
    notes: "ideaNotes"
};

/* ========================================
   STORAGE
======================================== */

function loadIdeas() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved.map((idea) => ({
            ...idea,
            location: idea.location || "",
            date: idea.date || "",
            time: idea.time || "",
            cost: idea.cost ?? "",
            bring: idea.bring || "",
            notes: idea.notes || "",
            memoryNotes: idea.memoryNotes || "",
            rating: idea.rating || "",
            photos: Array.isArray(idea.photos) ? idea.photos : []
        })) : [];
    } catch {
        return [];
    }
}

function saveIdeas() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(ideas)
        );

        return true;
    } catch {
        showToast(
            "Couldn't save. Browser storage may be full; try removing a photo."
        );

        return false;
    }
}

/* ========================================
   HELPER FUNCTIONS
======================================== */

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function displayDate(date) {
    if (!date) return "";

    const formattedDate = new Date(`${date}T12:00:00`);

    return Number.isNaN(formattedDate.getTime())
        ? date
        : formattedDate.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}

function money(cost) {
    return cost !== "" && cost !== null && cost !== undefined
        ? `£${Number(cost).toLocaleString("en-GB", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`
        : "";
}

function dateMeta(idea) {
    const when = [
        displayDate(idea.date),
        idea.time
    ].filter(Boolean).join(" · ");

    const metadata = [
        ["⌖", idea.location],
        ["◷", when],
        ["£", money(idea.cost)]
    ];

    return metadata
        .filter((item) => item[1])
        .map(([icon, value]) => `
            <div class="meta-line">
                <span class="meta-icon" aria-hidden="true">${icon}</span>
                <span>${escapeHTML(value)}</span>
            </div>
        `)
        .join("");
}

/* ========================================
   RENDERING DATE IDEAS
======================================== */

function render() {
    const todo = ideas
        .filter((idea) => !idea.completed)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const done = ideas
        .filter((idea) => idea.completed)
        .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    $("#todoCount").textContent =
        `${todo.length} ${todo.length === 1 ? "idea" : "ideas"}`;

    $("#doneCount").textContent =
        `${done.length} ${done.length === 1 ? "date" : "dates"}`;

    todoList.innerHTML = todo.length
        ? todo.map((idea, index) =>
            cardHTML(idea, false, index)
        ).join("")
        : emptyHTML(
            "Nothing planned yet",
            "No date ideas just yet. Add one above and start filling these pages.",
            "+"
        );

    doneList.innerHTML = done.length
        ? done.map((idea, index) =>
            cardHTML(idea, true, index)
        ).join("")
        : emptyHTML(
            "Nothing completed yet",
            "Your memories will start collecting here once you've been on a date.",
            "✓"
        );
}

function cardHTML(idea, completed, index = 0) {
    const metadata = dateMeta(idea);

    const rating = completed && idea.rating
        ? `<div class="card-rating" aria-label="Rated ${Number(idea.rating)} out of 5">
            ${"★".repeat(Number(idea.rating))}
            <span>${"☆".repeat(5 - Number(idea.rating))}</span>
        </div>`
        : "";

    const photo = completed && idea.photos?.length
        ? `<div class="card-memory-count">
            ▧ ${idea.photos.length}
            ${idea.photos.length === 1 ? "memory" : "memories"}
        </div>`
        : "";

    return `
        <article
            class="idea-card${completed ? " completed" : ""}"
            data-id="${escapeHTML(idea.id)}"
            style="--card-index:${Math.min(index, 8)}"
        >
            <div class="card-top">
                <span class="card-label">
                    ${completed ? "Completed" : "Planned"}
                </span>

                <span class="card-status" aria-hidden="true">
                    ${completed ? "✓" : String(index + 1).padStart(2, "0")}
                </span>
            </div>

            <h3>${escapeHTML(idea.title)}</h3>

            ${metadata ? `<div class="card-meta">${metadata}</div>` : ""}

            ${idea.description
                ? `<p>${escapeHTML(idea.description)}</p>`
                : ""}

            ${rating}
            ${photo}

            <div class="card-actions">
                <button class="small-action" data-action="details" type="button">
                    View details
                </button>

                ${completed
                    ? `<button class="small-action" data-action="undo" type="button">
                        Move back
                    </button>`
                    : `<button class="small-action complete" data-action="complete" type="button">
                        ✓ Completed
                    </button>`}

                <button class="small-action" data-action="edit" type="button">
                    Edit
                </button>

                <button class="small-action delete" data-action="delete" type="button">
                    Delete
                </button>
            </div>
        </article>
    `;
}

function emptyHTML(title, description, icon) {
    return `
        <div class="empty-state">
            <div class="empty-icon" aria-hidden="true">${icon}</div>
            <h3>${title}</h3>
            <p>${description}</p>
        </div>
    `;
}

/* ========================================
   ADDING AND EDITING DATE IDEAS
======================================== */

function openForm(idea = null) {
    form.reset();

    $("#ideaId").value = idea?.id || "";

    fields.forEach((key) => {
        $("#" + fieldIds[key]).value = idea?.[key] ?? "";
    });

    $("#dialogTitle").textContent = idea
        ? "Edit our date idea"
        : "Add a date idea";

    if (detailDialog.open) {
        detailDialog.close();
    }

    dialog.showModal();
    $("#ideaTitle").focus();
}

function closeForm() {
    if (dialog.open) dialog.close();
    form.reset();
}

/* ========================================
   NOTIFICATIONS
======================================== */

function showToast(message) {
    const toast = $("#toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

/* ========================================
   DATE DETAILS AND MEMORIES
======================================== */

function showDetails(idea) {
    selectedDetailId = idea.id;
    $("#detailTitle").textContent = idea.title;

    const labels = {
        location: "Location",
        date: "Planned date",
        time: "Start time",
        cost: "Estimated cost",
        description: "Description",
        bring: "Things to bring",
        notes: "Planning notes"
    };

    const values = {
        location: idea.location,
        date: displayDate(idea.date),
        time: idea.time,
        cost: money(idea.cost),
        description: idea.description,
        bring: idea.bring,
        notes: idea.notes
    };

    const originalDetails = Object.entries(labels)
        .filter(([key]) => values[key])
        .map(([key, label]) => `
            <section class="detail-row">
                <strong>${label}</strong>
                <p>${escapeHTML(values[key])}</p>
            </section>
        `)
        .join("");

    const completedMemories = idea.completed ? `
        <section class="memory-editor">

            <div class="memory-heading">
                <span class="memory-kicker">AFTER THE DATE</span>
                <h3>Keep the memories</h3>
                <p>
                    Add a few photos, give the date a rating,
                    or write down anything you want to remember.
                    All optional.
                </p>
            </div>

            <div class="memory-field">
                <label for="memoryRating">Your rating</label>

                <select id="memoryRating">
                    <option value="">No rating</option>
                    <option value="1" ${String(idea.rating) === "1" ? "selected" : ""}>
                        ★☆☆☆☆ — Not for us
                    </option>
                    <option value="2" ${String(idea.rating) === "2" ? "selected" : ""}>
                        ★★☆☆☆ — It was okay
                    </option>
                    <option value="3" ${String(idea.rating) === "3" ? "selected" : ""}>
                        ★★★☆☆ — Enjoyed it
                    </option>
                    <option value="4" ${String(idea.rating) === "4" ? "selected" : ""}>
                        ★★★★☆ — Really good
                    </option>
                    <option value="5" ${String(idea.rating) === "5" ? "selected" : ""}>
                        ★★★★★ — One to remember
                    </option>
                </select>
            </div>

            <div class="memory-field">
                <label for="memoryNotes">
                    Memory notes <span class="optional">(optional)</span>
                </label>

                <textarea
                    id="memoryNotes"
                    rows="4"
                    maxlength="2000"
                    placeholder="What did you enjoy? Any funny moments or little details worth remembering?"
                >${escapeHTML(idea.memoryNotes || "")}</textarea>
            </div>

            <div class="memory-field">
                <div class="photo-label-row">
                    <label for="memoryPhotos">
                        Photos <span class="optional">(optional, up to 4)</span>
                    </label>

                    <span class="photo-counter">
                        ${(idea.photos || []).length}/4 added
                    </span>
                </div>

                <input
                    id="memoryPhotos"
                    class="photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                >

                <p class="field-hint">
                    Pictures are resized before saving to help keep your browser storage manageable.
                </p>

                <div class="memory-photo-grid">
                    ${(idea.photos || []).map((photo, index) => `
                        <figure class="memory-photo">
                            <img src="${photo}" alt="Memory ${index + 1}">
                            <button
                                type="button"
                                data-remove-photo="${index}"
                                aria-label="Remove photo ${index + 1}"
                            >×</button>
                        </figure>
                    `).join("")}
                </div>
            </div>

            <button
                class="button button-primary memory-save"
                type="button"
                id="saveMemories"
            >
                Save memories
            </button>

        </section>
    ` : `
        <p class="memory-prompt">
            Once you mark this date as completed, you can add photos,
            a rating and memory notes here.
        </p>
    `;

    $("#detailContent").innerHTML =
        (originalDetails || `
            <p class="intro-text">
                Just a title for now. You can add more details whenever you like.
            </p>
        `) + completedMemories;

    if (dialog.open) dialog.close();

    detailDialog.showModal();
}

/* Resize photos before storing them */

function compressImage(file) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            return reject(new Error("Please choose an image file."));
        }

        const reader = new FileReader();

        reader.onerror = () =>
            reject(new Error("That image couldn't be read."));

        reader.onload = () => {
            const image = new Image();

            image.onerror = () =>
                reject(new Error("That image couldn't be opened."));

            image.onload = () => {
                const maxDimension = 1100;

                const scale = Math.min(
                    1,
                    maxDimension / Math.max(image.width, image.height)
                );

                const canvas = document.createElement("canvas");

                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);

                const context = canvas.getContext("2d");

                context.drawImage(
                    image,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                resolve(canvas.toDataURL("image/jpeg", 0.72));
            };

            image.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

async function saveMemoryPhotos(files) {
    const idea = ideas.find(
        (item) => item.id === selectedDetailId
    );

    if (!idea) return;

    const current = Array.isArray(idea.photos) ? idea.photos : [];
    const available = 4 - current.length;

    if (available <= 0) {
        showToast("You've reached the limit of four photos for this date.");
        return;
    }

    const selected = Array.from(files).slice(0, available);

    if (files.length > available) {
        showToast(`Only ${available} more photo${available === 1 ? "" : "s"} can be added.`);
    }

    try {
        const compressed = await Promise.all(
            selected.map(compressImage)
        );

        idea.photos = [...current, ...compressed];

        if (saveIdeas()) {
            showDetails(idea);
            showToast("Photos added to your memories.");
        }
    } catch (error) {
        showToast(error.message || "Couldn't add those photos.");
    }
}

function saveMemoryDetails() {
    const idea = ideas.find(
        (item) => item.id === selectedDetailId
    );

    if (!idea || !idea.completed) return;

    idea.rating = $("#memoryRating").value;
    idea.memoryNotes = $("#memoryNotes").value.trim();

    if (saveIdeas()) {
        render();
        showDetails(idea);
        showToast("Your date memories have been saved.");
    }
}

/* ========================================
   DIALOG EVENT LISTENERS
======================================== */

$("#openAdd").addEventListener("click", () => openForm());

$("#closeDialog").addEventListener("click", closeForm);
$("#cancelDialog").addEventListener("click", closeForm);

dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeForm();
});

$("#closeDetails").addEventListener("click", () => {
    detailDialog.close();
});

$("#detailClose").addEventListener("click", () => {
    detailDialog.close();
});

$("#detailEdit").addEventListener("click", () => {
    const idea = ideas.find(
        (item) => item.id === selectedDetailId
    );

    if (idea) openForm(idea);
});

/* ========================================
   SAVING DATE IDEAS
======================================== */

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = $("#ideaTitle").value.trim();

    if (!title) {
        $("#ideaTitle").setCustomValidity(
            "Please add a title for your date."
        );

        $("#ideaTitle").reportValidity();
        return;
    }

    $("#ideaTitle").setCustomValidity("");

    const id = $("#ideaId").value;

    const existing = ideas.find(
        (idea) => idea.id === id
    );

    const values = {};

    fields.forEach((key) => {
        values[key] = $("#" + fieldIds[key]).value.trim();
    });

    if (
        values.cost !== "" &&
        (
            !Number.isFinite(Number(values.cost)) ||
            Number(values.cost) < 0
        )
    ) {
        showToast("Please enter a valid cost.");
        return;
    }

    if (existing) {
        Object.assign(existing, values, {
            updatedAt: Date.now()
        });

        showToast("Idea updated.");
    } else {
        ideas.push({
            id: globalThis.crypto?.randomUUID?.()
                || `${Date.now()}-${Math.random().toString(16).slice(2)}`,

            ...values,

            completed: false,
            createdAt: Date.now(),
            completedAt: null,

            rating: "",
            memoryNotes: "",
            photos: []
        });

        showToast("Idea saved.");
    }

    if (saveIdeas()) {
        render();
        closeForm();
    }
});

$("#ideaTitle").addEventListener("input", () => {
    $("#ideaTitle").setCustomValidity("");
});

/* ========================================
   DATE CARD AND MEMORY ACTIONS
======================================== */

document.addEventListener("click", (event) => {

    /* Remove an individual photo */

    const removePhoto = event.target.closest("[data-remove-photo]");

    if (removePhoto) {
        const idea = ideas.find(
            (item) => item.id === selectedDetailId
        );

        if (!idea) return;

        idea.photos.splice(
            Number(removePhoto.dataset.removePhoto),
            1
        );

        if (saveIdeas()) showDetails(idea);

        return;
    }

    /* Save rating and memory notes */

    if (event.target.closest("#saveMemories")) {
        saveMemoryDetails();
        return;
    }

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const card = button.closest("[data-id]");

    const idea = ideas.find(
        (item) => item.id === card?.dataset.id
    );

    if (!idea) return;

    switch (button.dataset.action) {

        case "details":
            showDetails(idea);
            break;

        case "complete":
            idea.completed = true;
            idea.completedAt = Date.now();

            if (saveIdeas()) {
                render();
                showDetails(idea);
                showToast("Moved to Completed. Add memories whenever you're ready.");
            }
            break;

        case "undo":
            idea.completed = false;
            idea.completedAt = null;

            if (saveIdeas()) {
                render();
                showToast("Moved back to To Be Completed. Your saved memories are kept.");
            }
            break;

        case "edit":
            openForm(idea);
            break;

        case "delete":
            if (confirm(`Delete “${idea.title}”? This can't be undone.`)) {
                ideas = ideas.filter(
                    (item) => item.id !== idea.id
                );

                if (saveIdeas()) {
                    render();
                    showToast("Idea deleted.");
                }
            }
            break;
    }
});

/* Handle photo uploads */

document.addEventListener("change", (event) => {
    if (
        event.target.id === "memoryPhotos" &&
        event.target.files?.length
    ) {
        saveMemoryPhotos(event.target.files);
    }
});

/* ========================================
   INITIALISE THE WEBSITE
======================================== */

render();
