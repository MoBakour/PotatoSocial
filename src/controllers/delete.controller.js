// imports
const express = require("express");
const { deleteImage } = require("../middlewares/multer.middleware.js");
const { Comments, Posts, Users } = require("../utils/db.js");
const { clearSeens } = require("../utils/utils.js");

// router
const router = express.Router();

// routes
router.delete("/delete/:action", async (req, res) => {
    const action = req.params.action;

    try {
        switch (action) {
            case "comments": {
                await Comments.deleteMany({ commenter: req.user.username });
                break;
            }
            case "posts": {
                const posts = await Posts.deleteMany({
                    poster: req.user.username,
                });

                const ids = posts.map((post) => post._id);
                let files = posts.map((post) => post.postContent.file);
                files = files.filter((file) => file);

                await Comments.deleteMany({ commentParent: { $in: ids } });
                await clearSeens(ids);

                for (const file of files) {
                    await deleteImage(file);
                }

                break;
            }
            case "account": {
                const { avatar } = await Users.deleteOne({ _id: req.user._id });
                let posts = await Posts.deleteMany({
                    poster: req.user.username,
                });

                let files = posts.map((post) => post.postContent.file);
                files = files.filter((file) => file);

                await Comments.deleteMany({ commenter: req.user.username });
                await deleteImage(avatar);

                for (const file of files) {
                    await deleteImage(file);
                }

                posts = posts.map((post) => post._id);
                await clearSeens(posts);

                break;
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.delete("/deletepublished/:type/:id", async (req, res) => {
    const { type, id } = req.params;

    // validate
    const Storage = type === "post" ? Posts : Comments;
    const item = await Storage.findOne({ _id: id });
    const cred = item.poster || item.commenter;
    if (cred !== req.user.username)
        return res
            .status(400)
            .json({ success: false, error: "Unauthorized operation" });

    try {
        switch (type) {
            case "post": {
                const { postContent } = await Posts.deleteOne({ _id: id });
                await Comments.deleteMany({ commentParent: id });

                if (postContent.file) {
                    await deleteImage(postContent.file);
                }

                break;
            }
            case "comment": {
                await Comments.deleteOne({ _id: id });
                break;
            }
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);

        res.status(400).json({ success: false, error: err.message });
    }
});

// exports
module.exports = router;
