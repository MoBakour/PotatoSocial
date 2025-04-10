const express = require("express");
const fs = require("fs");

const { Users, Posts, Comments } = require("../utils/db.js");
const { denyUnlogged } = require("../middlewares/auth.middleware.js");
const { upload } = require("../middlewares/multer.middleware.js");
const { getPosts, clearSeens } = require("../utils/utils.js");

const router = express.Router();

router.get("/image/:id", async (req, res) => {
    try {
        const path = `./database/uploads/${req.params.id}`;
        const readStream = fs.createReadStream(path);
        readStream.pipe(res);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post("/get", async (req, res) => {
    try {
        const { excludes, profile } = req.body;
        const posts = await getPosts(req, excludes, !profile, profile);

        res.status(200).json({ success: true, posts });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.post(
    "/create",
    denyUnlogged,
    upload.single("file"),
    async (req, res) => {
        try {
            const postObject = {
                poster: req.user._id,
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
    }
);

router.delete("/delete/:id", denyUnlogged, async (req, res) => {
    try {
        // find post
        const post = await Posts.findOne({ _id: req.params.id });

        // check permission
        if (post.poster !== req.user._id) {
            return res
                .status(403)
                .json({ success: false, error: "Unauthorized" });
        }

        // delete post
        await Posts.deleteOne({ _id: post._id });

        // delete post image
        if (postContent.file) {
            await deleteImage(postContent.file);
        }

        // delete comments
        await Comments.deleteMany({ commentParent: post._id });

        // remove from seen
        await clearSeens([post._id]);
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});
