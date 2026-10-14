
/* ========================================
   Our Little Date Journal
   Main JavaScript
======================================== */

/* ---------- Storage Keys ---------- */

const STORAGE_KEY = "our-little-date-journal-ideas-v1";


/* ---------- DOM Elements ---------- */

const $ = (selector) => document.querySelector(selector);

const todoList = $("#todoList");
const doneList = $("#doneList");
const dialog = $("#ideaDialog");
const form = $("#ideaForm");
const detailDialog = $("#detailDialog");


/* ---------- Application State ---------- */

let ideas = loadIdeas();
let toastTimer;
let selectedDetailId = null;

const fields = [
    "title",
    "location",
    "date",
    "time",
    "cost",
    "description",
    "bring",
    "notes"
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

/* Load saved date ideas from local storage */

function loadIdeas() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved)
            ? saved.map((idea) => ({
                ...idea,
                location: idea.location || "",
                date: idea.date || "",
                time: idea.time || "",
                cost: idea.cost ?? "",
                bring: idea.bring || "",
                notes: idea.notes || ""
            }))
            : [];
    } catch {
        return [];
    }
}


/* Save date ideas to local storage */

function saveIdeas() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(ideas)
        );

        return true;
    } catch {
        showToast(
            "Couldn't save in this browser. Check your storage settings."
        );

        return false;
    }
}


/* ========================================
   HELPER FUNCTIONS
======================================== */

/* Escape HTML to prevent user-entered text
   from being interpreted as HTML */

function escapeHTML(value = "") {
    return String(value).replace(
        /[&<>"']/g,
        (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}


/* Format dates for display */

function displayDate(date) {
    if (!date) {
        return "";
    }

    const formattedDate = new Date(`${date}T12:00:00`);

    return Number.isNaN(formattedDate.getTime())
        ? date
        : formattedDate.toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}


/* Format costs as British pounds */

function money(cost) {
    return cost !== "" &&
        cost !== null &&
        cost !== undefined
        ? `£${Number(cost).toLocaleString("en-GB", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        })}`
        : "";
}


/* Generate location, date, time and cost information */

function dateMeta(idea) {
    const when = [
        displayDate(idea.date),
        idea.time
    ]
        .filter(Boolean)
        .join(" · ");

    const metadata = [
        ["⌖", idea.location],
        ["◷", when],
        ["£", money(idea.cost)]
    ];

    return metadata
        .filter((item) => item[1])
        .map(([icon, value]) => `
            <div class="meta-line">
                <span
                    class="meta-icon"
                    aria-hidden="true"
                >${icon}</span>

                <span>${escapeHTML(value)}</span>
            </div>
        `)
        .join("");
}


/* ========================================
   RENDERING DATE IDEAS
======================================== */

/* Display all date ideas in the correct lists */

function render() {
    const todo = ideas
        .filter((idea) => !idea.completed)
        .sort(
            (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
        );

    const done = ideas
        .filter((idea) => idea.completed)
        .sort(
            (a, b) => (b.completedAt || 0) - (a.completedAt || 0)
        );

    /* Update list counters */

    $("#todoCount").textContent =
        `${todo.length} ${todo.length === 1 ? "idea" : "ideas"}`;

    $("#doneCount").textContent =
        `${done.length} ${done.length === 1 ? "date" : "dates"}`;


    /* Render dates to be completed */

    todoList.innerHTML = todo.length
        ? todo.map((idea, index) => cardHTML(idea, false, index)).join("")
        : emptyHTML(
            "Nothing planned yet",
            "Wow you dont even want to make a date idea for us.. *cries and pees*",
            "+"
        );


    /* Render completed dates */

    doneList.innerHTML = done.length
        ? done.map((idea, index) => cardHTML(idea, true, index)).join("")
        : emptyHTML(
            "Nothing completed yet",
            "We haven't done ANYTHING??? *cries and pees*",
            "✓"
        );
}


/* Create the HTML for an individual date card */

function cardHTML(idea, completed, index = 0) {
    const metadata = dateMeta(idea);

    return `
        <article
            class="idea-card${completed ? " completed" : ""}"
            data-id="${escapeHTML(idea.id)}"
            style="--card-index: ${Math.min(index, 8)}"
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

            ${metadata
                ? `<div class="card-meta">${metadata}</div>`
                : ""}

            ${idea.description
                ? `<p>${escapeHTML(idea.description)}</p>`
                : ""}

            <div class="card-actions">
                <button
                    class="small-action"
                    data-action="details"
                    type="button"
                >
                    View details
                </button>

                ${completed
                    ? `
                        <button
                            class="small-action"
                            data-action="undo"
                            type="button"
                        >
                            Move back
                        </button>
                    `
                    : `
                        <button
                            class="small-action complete"
                            data-action="complete"
                            type="button"
                        >
                            ✓ Completed
                        </button>
                    `}

                <button
                    class="small-action"
                    data-action="edit"
                    type="button"
                >
                    Edit
                </button>

                <button
                    class="small-action delete"
                    data-action="delete"
                    type="button"
                >
                    Delete
                </button>
            </div>
        </article>
    `;
}


/* Create the empty-state message for each list */

function emptyHTML(title, description, icon) {
    return `
        <div class="empty-state">
            <div
                class="empty-icon"
                aria-hidden="true"
            >${icon}</div>

            <h3>${title}</h3>
            <p>${description}</p>
        </div>
    `;
}


/* ========================================
   ADDING AND EDITING DATE IDEAS
======================================== */

/* Open the form to add a new idea or edit an existing one */

function openForm(idea = null) {
    form.reset();

    $("#ideaId").value = idea?.id || "";

    fields.forEach((key) => {
        const element = $("#" + fieldIds[key]);

        element.value = idea?.[key] ?? "";
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


/* Close and reset the form */

function closeForm() {
    if (dialog.open) {
        dialog.close();
    }

    form.reset();
}


/* ========================================
   NOTIFICATIONS
======================================== */

/* Show a temporary notification message */

function showToast(message) {
    const toast = $("#toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}


/* ========================================
   DATE DETAILS
======================================== */

/* Display all available information about a date */

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
        notes: "Notes"
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

    $("#detailContent").innerHTML =
        Object.entries(labels)
            .filter(([key]) => values[key])
            .map(([key, label]) => `
                <section class="detail-row">
                    <strong>${label}</strong>
                    <p>${escapeHTML(values[key])}</p>
                </section>
            `)
            .join("")
        || `
            <p class="intro-text">
                Just a title for now. You can add more details whenever you like.
            </p>
        `;

    if (dialog.open) {
        dialog.close();
    }

    detailDialog.showModal();
}


/* ========================================
   DIALOG EVENT LISTENERS
======================================== */

/* Open the add-date dialog */

$("#openAdd").addEventListener("click", () => {
    openForm();
});


/* Close the add/edit dialog */

$("#closeDialog").addEventListener("click", closeForm);
$("#cancelDialog").addEventListener("click", closeForm);


/* Close the form when clicking its backdrop */

dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
        closeForm();
    }
});


/* Close the date details dialog */

$("#closeDetails").addEventListener("click", () => {
    detailDialog.close();
});

$("#detailClose").addEventListener("click", () => {
    detailDialog.close();
});


/* Edit a date directly from its details dialog */

$("#detailEdit").addEventListener("click", () => {
    const idea = ideas.find(
        (item) => item.id === selectedDetailId
    );

    if (idea) {
        openForm(idea);
    }
});


/* ========================================
   SAVING DATE IDEAS
======================================== */

/* Handle the add/edit form submission */

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = $("#ideaTitle").value.trim();

    /* Validate the required title */

    if (!title) {
        $("#ideaTitle").setCustomValidity(
            "Please add a title for your date."
        );

        $("#ideaTitle").reportValidity();

        return;
    }

    $("#ideaTitle").setCustomValidity("");


    /* Find the existing idea, if editing */

    const id = $("#ideaId").value;

    const existing = ideas.find(
        (idea) => idea.id === id
    );


    /* Collect the form values */

    const values = {};

    fields.forEach((key) => {
        values[key] = $("#" + fieldIds[key]).value.trim();
    });


    /* Validate the estimated cost */

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


    /* Update an existing date or create a new one */

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
            completedAt: null
        });

        showToast("Idea saved.");
    }


    /* Save and refresh the page */

    if (saveIdeas()) {
        render();
        closeForm();
    }
});


/* Clear title validation errors while typing */

$("#ideaTitle").addEventListener("input", () => {
    $("#ideaTitle").setCustomValidity("");
});


/* ========================================
   DATE CARD ACTIONS
======================================== */

/* Handle clicks on dynamically rendered date cards */

document.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const card = button.closest("[data-id]");

    const idea = ideas.find(
        (item) => item.id === card?.dataset.id
    );

    if (!idea) {
        return;
    }


    /* Perform the selected action */

    switch (button.dataset.action) {

        case "details":
            showDetails(idea);
            break;


        case "complete":
            idea.completed = true;
            idea.completedAt = Date.now();

            saveIdeas();
            render();

            showToast("Moved to Completed.");
            break;


        case "undo":
            idea.completed = false;
            idea.completedAt = null;

            saveIdeas();
            render();

            showToast("Moved back to To Be Completed.");
            break;


        case "edit":
            openForm(idea);
            break;


        case "delete":
            if (
                confirm(
                    `Delete “${idea.title}”? This can't be undone.`
                )
            ) {
                ideas = ideas.filter(
                    (item) => item.id !== idea.id
                );

                saveIdeas();
                render();

                showToast("Idea deleted.");
            }

            break;
    }
});


/* ========================================
   INITIALISE THE WEBSITE
======================================== */

/* Display saved date ideas */

render();