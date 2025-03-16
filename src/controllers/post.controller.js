// imports
const express = require("express");

const { Users, Posts, Comments } = require("../utils/db.js");
const { denyUnlogged } = require("../middlewares/auth.middleware.js");
const { upload } = require("../middlewares/multer.middleware.js");

// router
const router = express.Router();

// post routes
router.post("/reaction/:action", denyUnlogged, async (req, res) => {
    const action = req.params.action;

    try {
        const post = await Posts.findOne({ _id: req.body.postId });

        let updateObject;
        switch (action) {
            case "like": {
                if (post.postLikes.includes(req.user._id)) {
                    updateObject = { $pull: { postLikes: req.user._id } };
                } else {
                    updateObject = {
                        $push: { postLikes: req.user._id },
                        $pull: { postDislikes: req.user._id },
                    };
                }
                break;
            }

            case "dislike": {
                if (post.postDislikes.includes(req.user._id)) {
                    updateObject = { $pull: { postDislikes: req.user._id } };
                } else {
                    updateObject = {
                        $push: { postDislikes: req.user._id },
                        $pull: { postLikes: req.user._id },
                    };
                }
                break;
            }
        }

        const { postLikes, postDislikes } = await Posts.updateOne(
            { _id: req.body.postId },
            updateObject
        );

        res.status(200).json({
            success: true,
            postLikes: postLikes.length,
            postDislikes: postDislikes.length,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});

router.post("/comment", denyUnlogged, async (req, res) => {
    let { postId, comment } = req.body;
    comment = comment.trim();

    const commentObject = {
        commenter: req.user.username,
        commentParent: postId,
        comment,
    };

    try {
        const post = await Posts.findOne({ _id: postId });

        // check post existence
        if (post) {
            // check post privacy
            const { settings, followers } = await Users.findOne({
                username: post.poster,
            });
            if (
                settings.lockComments &&
                !followers.includes(req.user._id) &&
                post.poster !== req.user.username
            ) {
                return res.status(400).json({
                    success: false,
                    error: "Unauthorized Comment",
                });
            }

            // resume process
            await Comments.insertOne(commentObject);
            commentObject.avatar = req.user.avatar;
            res.status(200).json({ success: true, comment: commentObject });
        } else {
            return res
                .status(400)
                .json({ success: false, error: "Post Not Found" });
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.post("/post", denyUnlogged, upload.single("file"), async (req, res) => {
    try {
        const postObject = {
            poster: req.user.username,
            postContent: {
                text: req.body.text,
                file: req.file ? req.file.filename : "",
            },
            postLikes: [],
            postDislikes: [],
        };

        const post = await Posts.insertOne(postObject);

        post.avatar = req.user.avatar;

        res.status(200).json({ success: true, post });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// exports
module.exports = router;
