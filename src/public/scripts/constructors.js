import { formatDate, formatNumber } from "./formatter.js";

// construct posts
function constructPost(post, userId, commentsNumber) {
    const _post = document.createElement("div");
    _post.classList.add("post");
    _post.setAttribute("data-post-id", post._id);

    const _postHeader = document.createElement("div");
    _postHeader.classList.add("post-header");

    const _posterInfo = document.createElement("a");
    _posterInfo.classList.add("poster-info");
    _posterInfo.href = `/${post.poster}`;

    const _posterAvatar = document.createElement("div");
    _posterAvatar.classList.add("avatar");

    const _posterAvatarImg = document.createElement("img");
    _posterAvatarImg.src = post.avatar
        ? `/image/${post.avatar}`
        : "./images/default-avatar.jpg";
    _posterAvatarImg.alt = "User Avatar";

    _posterAvatar.appendChild(_posterAvatarImg);

    const _posterName = document.createElement("p");
    _posterName.innerText = post.poster;

    _posterInfo.appendChild(_posterAvatar);
    _posterInfo.appendChild(_posterName);

    const _postedAt = document.createElement("p");
    _postedAt.classList.add("posted-at");
    _postedAt.setAttribute("data-date", post.createdAt);
    _postedAt.innerText = formatDate(post.createdAt, "dd mm, yy tt");

    _postHeader.appendChild(_posterInfo);
    _postHeader.appendChild(_postedAt);

    const _postContent = document.createElement("div");
    _postContent.classList.add("post-content");

    const _postText = document.createElement("p");
    _postText.innerText = post.postContent.text;

    _postContent.appendChild(_postText);

    if (post.postContent.file) {
        const _postFile = document.createElement("img");
        _postFile.src = "/image/" + post.postContent.file;
        _postFile.alt = "Post File";
        _postContent.appendChild(_postFile);
    }

    const _postFooter = document.createElement("div");
    _postFooter.classList.add("post-footer");

    const _postReactions = document.createElement("div");
    _postReactions.classList.add("reactions");

    const _likes = document.createElement("button");
    _likes.classList.add("likes", "post-btn-format");
    if (post.postLikes.includes(userId)) {
        _likes.classList.add("active");
    }

    const _likeIcon = document.createElement("i");
    _likeIcon.classList.add("fa-solid", "fa-thumbs-up");

    const _likesNumber = document.createElement("span");
    _likesNumber.setAttribute("data-number", post.postLikes.length);
    _likesNumber.innerText = formatNumber(post.postLikes.length, true);

    _likes.appendChild(_likeIcon);
    _likes.appendChild(_likesNumber);

    const _dislikes = document.createElement("button");
    _dislikes.classList.add("dislikes", "post-btn-format");
    if (post.postDislikes.includes(userId)) {
        _dislikes.classList.add("active");
    }

    const _dislikesNumber = document.createElement("span");
    _dislikesNumber.setAttribute("data-number", post.postDislikes.length);
    _dislikesNumber.innerText = formatNumber(post.postDislikes.length, true);

    const _dislikeIcon = document.createElement("i");
    _dislikeIcon.classList.add("fa-solid", "fa-thumbs-down");

    _dislikes.appendChild(_dislikesNumber);
    _dislikes.appendChild(_dislikeIcon);

    _postReactions.appendChild(_likes);
    _postReactions.appendChild(_dislikes);

    const _comments = document.createElement("button");
    _comments.classList.add("comments-btn", "post-btn-format");

    const _commentsNumber = document.createElement("span");
    _commentsNumber.innerText = formatNumber(commentsNumber, true);

    const _commentIcon = document.createElement("i");
    _commentIcon.classList.add("fa-solid", "fa-comment");

    _comments.appendChild(_commentsNumber);
    _comments.appendChild(_commentIcon);

    _postFooter.appendChild(_postReactions);
    _postFooter.appendChild(_comments);

    _post.appendChild(_postHeader);
    _post.appendChild(_postContent);
    _post.appendChild(_postFooter);

    return _post;
}

// construct comments
function constructComment(comment) {
    const _comment = document.createElement("div");
    _comment.classList.add("comment");
    _comment.setAttribute("data-comment-id", comment._id);

    const _commentHeader = document.createElement("a");
    _commentHeader.classList.add("comment-header");
    _commentHeader.href = `/${comment.commenter}`;

    const _commenterAvatar = document.createElement("div");
    _commenterAvatar.classList.add("avatar");

    const _commenterAvatarImg = document.createElement("img");
    _commenterAvatarImg.src = comment.avatar
        ? `/image/${comment.avatar}`
        : `./images/default-avatar.jpg`;
    _commenterAvatarImg.alt = "User Avatar";

    _commenterAvatar.appendChild(_commenterAvatarImg);

    const _commenterName = document.createElement("p");
    _commenterName.innerText = comment.commenter;

    _commentHeader.appendChild(_commenterAvatar);
    _commentHeader.appendChild(_commenterName);

    const _commentContent = document.createElement("div");
    _commentContent.classList.add("comment-content");

    const _commentText = document.createElement("p");
    _commentText.innerText = comment.comment;

    _commentContent.appendChild(_commentText);

    const _commentFooter = document.createElement("div");
    _commentFooter.classList.add("comment-footer");

    const _commentDate = document.createElement("p");
    _commentDate.innerText = formatDate(comment.createdAt, "dd mm, yy tt");

    _commentFooter.appendChild(_commentDate);

    _comment.appendChild(_commentHeader);
    _comment.appendChild(_commentContent);
    _comment.appendChild(_commentFooter);

    return _comment;
}

export { constructPost, constructComment };
