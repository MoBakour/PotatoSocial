// imports
import confirmation from "./confirmation.js";

// selectors
const editBtns = document.querySelectorAll(".edit-btn");
const editPopup = document.querySelector(".edit-popup");
const closePopupBtn = document.querySelector(".close-edit-popup");
const darken = document.querySelector(".darken");

const editTitle = editPopup.querySelector(".edit-title");
const editInput = editPopup.querySelector(".edit-input");
const editTextarea = editPopup.querySelector(".edit-textarea");
const editSubmit = editPopup.querySelector(".edit-submit");
const repasswordInput = editPopup.querySelector(".repassword-input");
const errorField = editPopup.querySelector(".error-field");

const privacyBtns = document.querySelectorAll(
    ".privacy-settings .settings-toggler"
);

const dangerBtns = document.querySelectorAll(".danger-zone .danger-btn");

let currentEdit;

// handle darken
darken.addEventListener("click", (e) => {
    toggleEditPopup(false);
    darken.classList.remove("active");
});

// ACCOUNT SETTINGS
// handle toggling edit popup
editBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const inpType = e.currentTarget.classList.contains("edit-bio-btn")
            ? "textarea"
            : e.currentTarget.classList.contains("edit-password-btn")
            ? "password"
            : "input";

        let prevValue;
        if (!e.currentTarget.classList.contains("edit-password-btn")) {
            prevValue =
                e.currentTarget.parentElement.querySelector(
                    ".left p"
                ).innerText;
        }

        const title = (() => {
            let className = [...e.currentTarget.classList].filter(
                (name) => name !== "edit-btn" && name !== "right"
            )[0];
            className = className.replace("edit-", "").replace("-btn", "");
            return className[0].toUpperCase() + className.substring(1);
        })();

        currentEdit = title;

        toggleEditPopup(true, inpType, title, prevValue);
    });
});

closePopupBtn.addEventListener("click", () => toggleEditPopup(false));

function toggleEditPopup(status, inpType, title, prevValue) {
    if (status) {
        darken.classList.add("active");
        editPopup.classList.add("active");

        editPopup.classList.remove("input", "password", "textarea");
        editPopup.classList.add(inpType);
        editTitle.innerText = `Edit ${title}`;
        editInput.placeholder = `New ${title.toLowerCase()}`;

        if (title === "Bio") {
            editTextarea.value = prevValue;
        } else if (title === "Password") {
            editInput.value = "";
            editTextarea.value = "";
            repasswordInput.value = "";
        } else {
            editInput.value = prevValue;
        }

        handleTextareaHeight();

        editInput.type = inpType === "password" ? "password" : "text";
    } else {
        darken.classList.remove("active");
        editPopup.classList.remove("active");
        errorField.innerText = "";
    }
}

// handle textarea height
function handleTextareaHeight() {
    editTextarea.style.height = "20px";
    editTextarea.style.height = editTextarea.scrollHeight + "px";
}
editTextarea.addEventListener("input", handleTextareaHeight);

// fetch edit request
editSubmit.addEventListener("click", accountSettingsEdit);

let accountSettingsEditLock = false;
function accountSettingsEdit() {
    if (accountSettingsEditLock) return false;
    accountSettingsEditLock = true;

    const editData =
        currentEdit === "Bio"
            ? editTextarea.value.trim()
            : editInput.value.trim();

    const fetchOptions = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            editType: currentEdit,
            editData,
            repassword: repasswordInput.value,
        }),
    };

    fetch(`/editaccountinfo`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                toggleEditPopup(false);

                document.querySelector(
                    `.${currentEdit.toLowerCase()}-settings .left p`
                ).innerText = data.newData;

                if (currentEdit === "Username") {
                    document.querySelector("header .current-user p").innerText =
                        data.newData;
                }
            } else {
                errorField.innerText = data.error;
            }
        })
        .catch((err) => console.log(err))
        .finally(() => (accountSettingsEditLock = false));
}

// PRIVACY SETTINGS
let privacyActionLock = false;
privacyBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        if (privacyActionLock) return false;
        privacyActionLock = true;

        const action = btn.dataset.privacyAction;

        const fetchOptions = {
            method: "PATCH",
            body: JSON.stringify({
                action,
            }),
            headers: { "Content-Type": "application/json" },
        };

        fetch("/editprivacy", fetchOptions)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    btn.classList.toggle("active");
                }
            })
            .catch((err) => console.log(err))
            .finally(() => (privacyActionLock = false));
    });
});

// DANGER ZONE
dangerBtns.forEach((btn) => {
    const action = btn.dataset.action;
    btn.addEventListener("click", () => deleteRequest(action));
});

let deleteLock = false;
async function deleteRequest(action) {
    // confirm
    let phrase;

    if (action === "comments") phrase = "all your comments";
    else if (action === "posts") phrase = "all your posts";
    else if (action === "account") phrase = "your account";
    else return false;

    const confirmed = await confirmation(
        `Are you sure you want to delete ${phrase}?`
    );

    if (!confirmed) return false;

    // lock
    if (deleteLock) return false;
    deleteLock = true;

    // fetch
    const fetchOptions = {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    };

    fetch(`/delete/${action}`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                if (action === "account") {
                    location.href = "/logout";
                }
            }
        })
        .catch((err) => console.log(err))
        .finally(() => (deleteLock = false));
}
