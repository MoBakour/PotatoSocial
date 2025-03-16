// imports
import { formatNumber } from "./formatter.js";
import { getPosts } from "./posts.js";

// selectors
const follow = document.querySelector(".follow");
const followBtn = document.querySelector(".follow-btn");
const unfollowBtn = document.querySelector(".unfollow-btn");
const cancelBtn = document.querySelector(".cancel-btn");
const followersNumber = document.querySelector(".followers-number");
const profileId = document.querySelector("html").dataset.profileId;

if (!window.isSelf) {
    followBtn.addEventListener("click", () => sendFollow("follow"));
    unfollowBtn.addEventListener("click", () => sendFollow("unfollow"));
    cancelBtn.addEventListener("click", () => sendFollow("cancel"));
}

let followLock = false;
function sendFollow(action) {
    if (followLock) return false;
    followLock = true;

    const fetchOptions = {
        method: "PATCH",
        body: JSON.stringify({ account: profileId }),
        headers: { "Content-Type": "application/json" },
    };

    fetch(`/follow/${action}`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                follow.classList.remove("followed", "unfollowed", "pending");

                if (data.pending) {
                    return follow.classList.add("pending");
                }

                // get posts (in case private)
                getPosts();

                // update followers number
                let newNumber = data.followersNumber;
                followersNumber.innerText = formatNumber(newNumber, true);

                // change button
                let newClass = action === "follow" ? "followed" : "unfollowed";
                follow.classList.add(newClass);
            }
        })
        .catch((err) => console.log(err))
        .finally(() => (followLock = false));
}
