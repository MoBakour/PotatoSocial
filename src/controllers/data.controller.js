// imports
const express = require("express");
const fs = require("fs");

const { Users, Posts, Comments } = require("../utils/db.js");
const { denyUnlogged } = require("../middlewares/auth.middleware.js");
const { getAvatar, getPosts } = require("../utils/utils.js");

// router
const router = express.Router();

// get data routes
router.get("/comments/:postId/:skips", denyUnlogged, async (req, res) => {
    try {
        const post = await Posts.findOne({ _id: req.params.postId });

        if (post) {
            const comments = await Comments.findMany(
                { commentParent: post._id },
                { limit: 30, skip: req.params.skips, recent: true }
            );

            for (const comment of comments) {
                comment.avatar = await getAvatar(comment.commenter);
            }

            const poster = await Users.findOne({ username: post.poster });
            const canComment = (() => {
                if (
                    (poster.settings.lockComments &&
                        poster.followers.includes(req.user._id)) ||
                    !poster.settings.lockComments ||
                    poster._id === req.user._id
                ) {
                    return true;
                } else return false;
            })();

            res.status(200).json({
                success: true,
                comments,
                canComment,
            });
        } else {
            res.status(400).json({
                success: false,
                error: "Post not found",
            });
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.get("/image/:imageId", denyUnlogged, (req, res) => {
    // create stream
    const imageId = req.params.imageId;
    const readStream = fs.createReadStream(`./database/uploads/${imageId}`);

    // handle stream
    readStream.on("open", () => readStream.pipe(res));
    readStream.on("error", (err) => res.end(err.message));
});

router.post("/getposts", denyUnlogged, async (req, res) => {
    const { excludes, profile } = req.body;

    try {
        const posts = await getPosts(req, excludes, !profile, profile);

        res.status(200).json({ success: true, posts });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// exports
module.exports = router;
