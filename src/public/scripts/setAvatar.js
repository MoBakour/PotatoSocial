// imports
import confirmation from "./confirmation.js";

// selectors
const avatarInput = document.querySelector(".avatar-input");
const headerAvatar = document.querySelector("header .current-user img");
const coverAvatar =
    document.querySelector(".profile-cover .avatar img") ||
    document.querySelector(".avatar-settings .avatar-wrapper img");

// edit avatar
let avatarLock = false;
avatarInput?.addEventListener("input", async (e) => {
    if (avatarLock) return false;
    avatarLock = true;

    // confirmation
    const confirmed = await confirmation(
        "Are you sure you want to change your profile picture?"
    );
    if (!confirmed) {
        avatarLock = false;
        return false;
    }

    // fetch setavatar request
    const form = new FormData();
    form.append("newAvatar", avatarInput.files[0]);

    const fetchOptions = {
        method: "PATCH",
        body: form,
    };

    fetch("/setavatar", fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                headerAvatar.src = "/image/" + data.newAvatar;
                coverAvatar.src = "/image/" + data.newAvatar;
                document
                    .querySelectorAll(".post .poster-info img")
                    ?.forEach((img) => {
                        img.src = "/image/" + data.newAvatar;
                    });
            }
        })
        .catch((err) => console.log(err))
        .finally(() => (avatarLock = false));
});
