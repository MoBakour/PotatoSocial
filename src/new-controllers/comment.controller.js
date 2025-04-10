const express = require("express");
const router = express.Router();
const { Comments, Posts, Users } = require("../utils/db");

router.post("/", async (req, res) => {
    let { postId, comment } = req.body;
    comment = comment.trim();

    const commentObject = {
        commenter: req.user._id,
        commentParent: postId,
        comment,
    };

    try {
        const post = await Posts.findOne({ _id: postId });

        // check post existence
        if (!post) {
            return res.status(400).json({
                success: false,
                error: "Post Not Found",
            });
        }

        // check post privacy
        const { settings, followers } = await Users.findOne({
            _id: post.poster,
        });
        if (
            settings.lockComments &&
            !followers.includes(req.user._id) &&
            post.poster !== req.user._id
        ) {
            return res.status(400).json({
                success: false,
                error: "Unauthorized Comment",
            });
        }

        await Comments.insertOne(commentObject);
        commentObject.avatar = req.user.avatar;
        res.status(200).json({ success: true, comment: commentObject });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.get("/:postId/:skips", async (req, res) => {
    try {
        const post = await Posts.findOne(
            { _id: req.params.postId },
            {
                populate: {
                    poster: Users,
                },
                select: {
                    poster: {
                        settings: 1,
                        followers: 1,
                    },
                },
            }
        );

        // check post existence
        if (!post) {
            return res.status(400).json({
                success: false,
                error: "Post Not Found",
            });
        }

        // find comments
        const comments = await Comments.findMany(
            { commentParent: post._id },
            { limit: 30, skip: req.params.skips, recent: true },
            {
                populate: {
                    commenter: Users,
                },
                select: {
                    commenter: {
                        _id: 1,
                        username: 1,
                        avatar: 1,
                    },
                },
            }
        );

        const canComment =
            (post.poster.settings.lockComments &&
                post.poster.followers.includes(req.user._id)) ||
            !post.poster.settings.lockComments ||
            post.poster._id === req.user._id;

        res.status(200).json({
            success: true,
            comments,
            canComment,
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.delete("/:commentId", async (req, res) => {
    try {
        const comment = await Comments.deleteOne({
            _id: req.params.commentId,
            commenter: req.user._id,
        });

        if (!comment) {
            return res.status(400).json({
                success: false,
                error: "Your comment was not found",
            });
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});
