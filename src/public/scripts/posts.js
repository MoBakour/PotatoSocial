// imports
import { formatNumber } from "./formatter.js";
import { constructPost, constructComment } from "./constructors.js";

// selectors
// general elements
const darken = document.querySelector(".darken");
const contextMenu = document.querySelector(".context-menu");
const contextMenuBtn = contextMenu.querySelector("button");

// post elements
const postPopup = document.querySelector(".post-popup");
const closePostPopup = document.querySelector(".close-post-popup-btn");
const publishPostBtn = document.querySelector(".publish-post-btn");
const postsList = document.querySelector(".posts");
const postInput = document.querySelector(".post-input");
const postPopupBtn = document.querySelector(".post-popup-btn");
const filePreview = document.querySelector(".file-preview");
const fileInput = document.querySelector(".post-file-upload");
const fileInputLabel = document.querySelector(".post-file-upload-label");

// comment elements
const commentsPopup = document.querySelector(".comments");
const closeCommentsBtn = document.querySelector(".close-comments-btn");
const commentsFooter = document.querySelector(".comments-footer");
const commentPublishBtn = document.querySelector(".comment-publish");
const commentsList = document.querySelector(".comments-list");
const commentInput = document.querySelector(".comment-input");
const commentsOfPoster = document.querySelectorAll(".comments-of-poster");

// current username
const currentUsername = document.querySelector(
    "header .current-user p"
).innerText;

// handle darken
darken.addEventListener("click", (e) => {
    if (e.target.classList.contains("darken")) {
        toggleComments(false, e);
        togglePostPopup(false);
    }
});

// set reaction/comment popup btn event listeners
function setPostBtnsListeners() {
    document
        .querySelectorAll(".post-btn-format:not(.comments-btn)")
        .forEach((btn) => {
            btn.addEventListener("click", sendReaction);
        });

    document
        .querySelectorAll(".post-btn-format.comments-btn")
        .forEach((btn) => {
            btn.addEventListener("click", (e) => toggleComments(true, e));
        });

    document.querySelectorAll(".post .post-content img").forEach((img) => {
        img.addEventListener("click", () => {
            window.open(img.src);
        });
    });
}
setPostBtnsListeners();

// handle canComment
function handleCanComment(canComment) {
    canComment
        ? commentsFooter.classList.remove("disabled-commenting")
        : commentsFooter.classList.add("disabled-commenting");
}

// handle infinite loading (scroll)
function infiniteScrollPosts() {
    const doc = document.documentElement;
    if (doc.scrollHeight - doc.scrollTop <= doc.clientHeight + 100) {
        getPosts();
    }
}
window.addEventListener("scroll", infiniteScrollPosts);

// handle context menu
function inPublished(element) {
    while (element) {
        if (element.classList.contains("post")) {
            const poster = element.querySelector(".poster-info p").innerText;

            if (poster === currentUsername) {
                return {
                    type: "post",
                    id: element.dataset.postId,
                };
            }
        } else if (element.classList.contains("comment")) {
            const commenter =
                element.querySelector(".comment-header p").innerText;

            if (commenter === currentUsername) {
                return {
                    type: "comment",
                    id: element.dataset.commentId,
                };
            }
        }

        element = element.parentElement;
    }

    return false;
}

function toggleContextMenu(status) {
    status
        ? contextMenu.classList.add("active")
        : contextMenu.classList.remove("active");
}

let contextMenuId, contextMenuType;
window.addEventListener("contextmenu", (e) => {
    const publishedItem = inPublished(e.target);

    if (publishedItem) {
        e.preventDefault();

        contextMenuId = publishedItem.id;
        contextMenuType = publishedItem.type;

        const xAxis = e.clientX;
        const yAxis = e.clientY;
        contextMenu.style.top = yAxis + "px";
        contextMenu.style.left = xAxis + "px";

        contextMenuBtn.innerText =
            contextMenuType === "post" ? "Delete post" : "Delete comment";

        toggleContextMenu(true);
    } else {
        toggleContextMenu(false);
    }
});

window.addEventListener("click", () => {
    toggleContextMenu(false);
});

let contextMenuLock = false;
contextMenuBtn.addEventListener("click", () => {
    if (contextMenuLock) return false;
    if (!contextMenuType || !contextMenuId) return false;
    contextMenuLock = true;

    const fetchOptions = {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
    };

    const contextMenuCred = { contextMenuType, contextMenuId };

    fetch(`/deletepublished/${contextMenuType}/${contextMenuId}`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                document
                    .querySelector(
                        `[data-${contextMenuCred.contextMenuType}-id="${contextMenuCred.contextMenuId}"]`
                    )
                    .remove();
            }
        })
        .catch((err) => console.log(err))
        .finally(() => (contextMenuLock = false));
});

// handling
// posts
if (postPopupBtn) {
    postPopupBtn.addEventListener("click", () => togglePostPopup(true));
}
closePostPopup.addEventListener("click", () => togglePostPopup(false));
function togglePostPopup(status) {
    if (status) {
        postPopup.classList.add("active");
        darken.classList.add("active");
    } else {
        postPopup.classList.remove("active");
        darken.classList.remove("active");

        postInput.value = "";
        fileInputLabel.classList.remove("asided");
        filePreview.classList.remove("active");
        filePreview.src = "";
    }
}

// handle file upload
fileInput.addEventListener("input", (e) => {
    const file = fileInput.files[0];
    const fileReader = new FileReader();

    fileReader.readAsDataURL(file);

    fileReader.onload = () => {
        filePreview.src = fileReader.result;
        filePreview.classList.add("active");
        fileInputLabel.classList.add("asided");
    };
    fileReader.onerror = (e) => {
        console.error("An error occured while reading file");
    };
});

// trigger publish post
publishPostBtn.addEventListener("click", publishPost);

// comments
// handle comments popup
closeCommentsBtn.addEventListener("click", (e) => toggleComments(false, e));
function toggleComments(status, e) {
    if (status) {
        commentsPopup.classList.add("active");
        darken.classList.add("active");

        const postId =
            e.currentTarget.parentElement.parentElement.dataset.postId;
        window.currentPost = postId;

        const posterName =
            e.currentTarget.parentElement.parentElement.querySelector(
                ".post-header .poster-info p"
            ).innerText;

        commentsOfPoster.forEach((pstr) => {
            pstr.innerText = posterName;
            pstr.href = `/${posterName}`;
        });

        commentsList.innerHTML = "";

        getComments();
    } else {
        commentsPopup.classList.remove("active");
        darken.classList.remove("active");
        commentSkips = 0;
        infiniteCommentsLock = false;
    }
}

// handle comment input
function handleCommentInputHeight() {
    commentInput.style.height = "30px";
    commentInput.style.height = commentInput.scrollHeight + "px";
}
handleCommentInputHeight();
commentInput.addEventListener("input", handleCommentInputHeight);

// trigger publish comment
commentPublishBtn.addEventListener("click", sendComment);
commentInput.addEventListener("keydown", (e) => {
    if (!e.shiftKey && e.key === "Enter") {
        sendComment();
    }
});

// handle comments infinite scrolling
let infiniteCommentsLock = false;
commentsList.addEventListener("scroll", (e) => {
    if (infiniteCommentsLock) return false;

    if (
        commentsList.scrollHeight - commentsList.scrollTop <=
        commentsList.clientHeight + 100
    ) {
        getComments();
        console.log("getting comments");
    }
});

// fetching
// send posts
let publishPostLock = false;
function publishPost() {
    if (publishPostLock) return false;
    publishPostLock = true;

    // build form
    const form = new FormData();

    form.append("text", postInput.value.trim());
    form.append("file", fileInput.files[0]);

    const fetchOptions = {
        method: "POST",
        body: form,
    };

    fetch("/post", fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                const postElement = constructPost(
                    data.post,
                    window.userId,
                    "0"
                );
                postsList.insertAdjacentElement("afterbegin", postElement);
                setPostBtnsListeners();
                togglePostPopup(false);
                fileInput.value = null;
            }
        })
        .catch((err) => console.log(err))
        .finally(() => (publishPostLock = false));
}

// get posts
let getPostsLock = false;

function getPosts() {
    if (getPostsLock) return false;
    getPostsLock = true;

    const excludes = [...document.querySelectorAll(".posts .post")].map(
        (post) => post.dataset.postId
    );

    const profile = document.documentElement.classList.contains("profile")
        ? document.querySelector(".profile-username").innerText
        : null;

    const fetchOptions = {
        method: "POST", // cuz need to send body
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludes, profile }),
    };

    fetch("/getposts", fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                if (data.posts.length < 1) {
                    window.removeEventListener("scroll", infiniteScrollPosts);
                } else {
                    data.posts.forEach((post) => {
                        const postElement = constructPost(
                            post,
                            window.userId,
                            post.commentsNumber
                        );
                        postsList.insertAdjacentElement(
                            "beforeend",
                            postElement
                        );
                        setPostBtnsListeners();
                    });
                }
            }
        })
        .catch((err) => console.log(err))
        .finally(() => {
            getPostsLock = false;
        });
}

// reactions
let reactionLocked = false;
function sendReaction(event) {
    if (reactionLocked) return false;
    reactionLocked = true;

    const btn = event.currentTarget;
    const postId = btn.parentElement.parentElement.parentElement.dataset.postId;
    const action = btn.classList.contains("likes") ? "like" : "dislike";

    const fetchOptions = {
        method: "POST",
        body: JSON.stringify({ postId }),
        headers: { "Content-Type": "application/json" },
    };

    fetch(`/reaction/${action}`, fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                // btn class
                btn.classList.toggle("active");
                if (action == "like") {
                    btn.parentElement
                        .querySelector(".dislikes")
                        .classList.remove("active");
                } else {
                    btn.parentElement
                        .querySelector(".likes")
                        .classList.remove("active");
                }

                // btn innerText
                btn.parentElement.querySelector(".likes span").innerText =
                    formatNumber(data.postLikes, true);
                btn.parentElement.querySelector(".dislikes span").innerText =
                    formatNumber(data.postDislikes, true);
            }
        })
        .catch((err) => console.log(err))
        .finally(() => (reactionLocked = false));
}

// comments
// send comments
let commentLocked = false;
function sendComment() {
    if (commentLocked) return false;
    commentLocked = true;

    const fetchOptions = {
        method: "POST",
        body: JSON.stringify({
            postId: window.currentPost,
            comment: commentInput.value.trim(),
        }),
        headers: { "Content-Type": "application/json" },
    };

    fetch("/comment", fetchOptions)
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                const commentElement = constructComment(data.comment);
                commentsList.insertAdjacentElement(
                    "afterbegin",
                    commentElement
                );

                commentInput.value = "";
                commentsList.scrollTo(0, 0);
                handleCommentInputHeight();

                const commentsNumber = document.querySelector(
                    `[data-post-id="${window.currentPost}"] .comments-btn span`
                );
                commentsNumber.innerText = formatNumber(
                    parseInt(commentsNumber.innerText) + 1,
                    true
                );
            }
        })
        .catch((err) => console.log(err))
        .finally(() => (commentLocked = false));
}

// get comments
let getCommentsLock = false;
let commentSkips = 0;
function getComments() {
    if (getCommentsLock) return false;
    getCommentsLock = true;

    fetch(`/comments/${window.currentPost}/${commentSkips}`, {
        method: "GET",
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                handleCanComment(data.canComment);

                commentSkips += 30;

                for (const comment of data.comments) {
                    const commentElement = constructComment(comment);
                    commentsList.insertAdjacentElement(
                        "beforeend",
                        commentElement
                    );
                }

                if (
                    commentsList.childElementCount ==
                    document.querySelector(
                        `[data-post-id="${window.currentPost}"] .comments-btn span`
                    ).innerText
                ) {
                    infiniteCommentsLock = true;
                }
            }
        })
        .catch((err) => console.log(err))
        .finally(() => {
            getCommentsLock = false;
        });
}

// exports
export { getPosts };
