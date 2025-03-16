// imports
const { Users, Posts, Comments } = require("../utils/db.js");

// shuttle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// get avatar function
async function getAvatar(identification) {
    const { avatar } = await Users.findOne(
        (user) =>
            user.username === identification || user._id === identification
    );

    return avatar;
}

// filter private posts out
async function excludePrivates(req, unfilteredPosts) {
    const filteredPosts = [];

    for (const post of unfilteredPosts) {
        const poster = await Users.findOne({ username: post.poster });

        if (!poster.settings.lockPosts) {
            filteredPosts.push(post);
            continue;
        }

        if (
            poster.followers.includes(req.user._id) ||
            poster.username === req.user.username
        ) {
            filteredPosts.push(post);
        }
    }

    return filteredPosts;
}

// get posts function
async function getPosts(req, excludes = [], fill = true, profile = null) {
    // get unseen posts
    let posts = await Posts.findMany(
        (post) => {
            if (profile) {
                return post.poster === profile && !excludes.includes(post._id);
            }

            return (
                !req.user.seen.includes(post._id) &&
                !excludes.includes(post._id)
            );
        },
        {
            recent: !!profile,
            limit: 10,
        }
    );

    posts = await excludePrivates(req, posts);

    // if no unseen posts, fill with random posts
    if (posts.length < 1 && fill) {
        const allPosts = await Posts.findMany({});
        const randomPosts = shuffleArray(allPosts).slice(0, 10);

        posts = posts.concat(randomPosts);
    }

    posts = await excludePrivates(req, posts);

    // add seens
    const ids = posts.map((post) => post._id);
    await Users.updateOne({ _id: req.user._id }, (user) => {
        ids.forEach((id) => {
            if (!user.seen.includes(id)) {
                user.seen.push(id);
            }
        });
    });

    // attach avatars
    for (const post of posts) {
        post.avatar = await getAvatar(post.poster);
        const comments = await Comments.findMany({
            commentParent: post._id,
        });
        post.commentsNumber = comments.length;
    }

    return posts;
}

// clear seens function
async function clearSeens(ids) {
    await Users.updateMany(
        (user) => {
            return ids.some((id) => user.seen.includes(id));
        },
        (user) => {
            user.seen = user.seen.filter((item) => !ids.includes(item));
        }
    );
}

// exports
module.exports = { getAvatar, getPosts, clearSeens };
