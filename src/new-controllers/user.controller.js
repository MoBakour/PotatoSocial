const fs = require("fs");
const express = require("express");
const router = express.Router();
const { Users, Posts, Comments } = require("../utils/db.js");
const { denyUnlogged } = require("../middlewares/auth.middleware.js");

router.get("/avatar/:id", async (req, res) => {
    try {
        const path = `./database/uploads/${req.params.id}`;
        const readStream = fs.createReadStream(path);
        readStream.pipe(res);
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete("/", denyUnlogged, async (req, res) => {
    try {
        // Delete user account
        const { avatar } = await Users.deleteOne({ _id: req.user._id });
        await deleteImage(avatar);

        // Delete user comments
        await Comments.deleteMany({ commenter: req.user._id });

        // Delete user posts
        const posts = await Posts.deleteMany({
            poster: req.user.username,
        });

        // Delete post images
        const files = posts
            .map((post) => post.postContent.file)
            .filter(Boolean);

        for (const file of files) {
            await deleteImage(file);
        }

        // Clear seens
        await clearSeens(posts.map((post) => post._id));

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.put(
    "/avatar",
    denyUnlogged,
    upload.single("newAvatar"),
    async (req, res) => {
        try {
            // delete old avatar
            try {
                await fs.promises.unlink(
                    `./database/uploads/${req.user.avatar}`
                );
            } catch (err) {}

            // update avatar
            await Users.updateOne(
                { _id: req.user._id },
                { avatar: req.file.filename }
            );

            res.status(200).json({
                success: true,
                newAvatar: req.file.filename,
            });
        } catch (err) {
            console.log(err);
            res.status(400).json({ success: false, error: err.message });
        }
    }
);

router.put("/account", denyUnlogged, async (req, res) => {
    try {
        // trim and lowercase
        req.body.editData = req.body.editData.trim();
        req.body.repassword = req.body.repassword.trim();
        req.body.editType = req.body.editType.toLowerCase();
        if (req.body.editType === "email") {
            req.body.editData = req.body.editData.toLowerCase();
        }

        // validate values
        const validationObject = {
            [req.body.editType]: req.body.editData,
        };
        if (req.body.editType === "password") {
            validationObject.repassword = req.body.repassword;
        }

        // perform changes
        updateAccountSchema.parse(validationObject);

        // check uniqueness
        if (["username", "email"].includes(req.body.editType)) {
            const exists = await Users.exists({
                [req.body.editType]: req.body.editData,
            });

            const editType =
                req.body.editType[0].toUpperCase() + req.body.editType.slice(1);

            if (exists) {
                return res.status(400).json({
                    success: false,
                    error: `${editType} already taken`,
                });
            }
        }

        // basic updates
        await Users.updateOne(
            { _id: req.user._id },
            { [req.body.editType]: req.body.editData }
        );

        // hide password
        req.body.editData = "".padStart(6, "*");

        // success
        res.status(200).json({ success: true, newData: req.body.editData });

        // success
        res.status(200).json({ success: true, newData: req.body.editData });
    } catch (err) {
        if (err instanceof ZodError) {
            res.status(400).json({
                success: false,
                error: err.errors[0].message,
            });
            return;
        }

        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.put("/privacy", denyUnlogged, async (req, res) => {
    try {
        const action = req.body.action;

        const updated = await Users.updateOne({ _id: req.user._id }, (user) => {
            user.settings[action] = !user.settings[action];
        });

        if (action === "lockFollows" && !updated.settings.lockFollows) {
            await Users.updateMany(
                { _id: { $in: req.user.requests } },
                { $push: { follows: req.user._id } }
            );

            await Users.updateOne(
                { _id: req.user._id },
                {
                    $conact: {
                        followers: req.user.requests,
                    },
                    requests: [],
                }
            );
        }

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});
