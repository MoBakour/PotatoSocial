// imports
const express = require("express");
const fs = require("fs");
const { Users, Posts, Comments } = require("../utils/db.js");
const { denyUnlogged } = require("../middlewares/auth.middleware.js");
const { upload } = require("../middlewares/multer.middleware.js");
const { updateAccountSchema } = require("../utils/validation.js");
const { ZodError } = require("zod");

// router
const router = express.Router();

// follow/unfollow user
router.patch("/follow/:action", denyUnlogged, async (req, res) => {
    const action = req.params.action;

    try {
        // verify account
        const account = await Users.findOne({ _id: req.body.account });

        if (!account)
            return res
                .status(400)
                .json({ success: false, error: "Account Not Found" });

        // validate
        if (
            (action === "follow" &&
                (account.followers.includes(req.user._id) ||
                    account.requests.some(
                        (request) => request.id === req.user._id
                    ))) ||
            (action === "unfollow" &&
                !account.followers.includes(req.user._id)) ||
            (action === "cancel" &&
                (!account.requests.some(
                    (request) => request.id === req.user._id
                ) ||
                    account.followers.includes(req.user._id) ||
                    !account.settings.lockFollows))
        ) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid Action" });
        }

        // pend if locked
        if (action === "follow" && account.settings.lockFollows) {
            await Users.updateOne(
                { _id: account._id },
                {
                    $push: {
                        requests: {
                            id: req.user._id,
                            username: req.user.username,
                            avatar: req.user.avatar,
                        },
                    },
                }
            );

            return res.status(200).json({ success: true, pending: true });
        }

        // cancel pending
        if (action === "cancel") {
            await Users.updateOne({ _id: account._id }, (user) => {
                const index = user.requests.findIndex((request) => {
                    return request.id === req.user._id;
                });
                if (index === -1) return false;
                return user.requests.splice(index, 1);
            });
        }

        // update objects
        const accountUpdate =
            action === "follow"
                ? { $push: { followers: req.user._id } }
                : { $pull: { followers: req.user._id } };

        const selfUpdate =
            action === "follow"
                ? { $push: { follows: account._id } }
                : { $pull: { follows: account._id } };

        // update process
        const { followers } = await Users.updateOne(
            { _id: account._id },
            accountUpdate
        );
        await Users.updateOne({ _id: req.user._id }, selfUpdate);

        // success response
        res.status(200).json({
            success: true,
            followersNumber: followers.length,
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// set user avatar
router.patch(
    "/setavatar",
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

            // update following requests avatars
            await Users.updateMany(
                (user) => {
                    return user.requests.some(
                        (request) => request.id === req.user._id
                    );
                },
                (user) => {
                    const index = user.requests.findIndex(
                        (request) => request.id === req.user._id
                    );
                    if (index === -1) return false;
                    return (user.requests[index].avatar = req.file.filename);
                }
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

// edit user account settings
router.patch("/editaccountinfo", denyUnlogged, async (req, res) => {
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

        switch (req.body.editType) {
            case "username": {
                const isExistent = await Users.findOne((user) => {
                    return (
                        user.username.toLowerCase() ===
                        req.body.editData.toLowerCase()
                    );
                });

                if (isExistent) {
                    return res.status(400).json({
                        success: false,
                        error: "Username already taken",
                    });
                }

                // basic updates
                await Users.updateOne(
                    { _id: req.user._id },
                    { username: req.body.editData }
                );
                await Posts.updateMany(
                    { poster: req.user.username },
                    { poster: req.body.editData }
                );
                await Comments.updateMany(
                    { commenter: req.user.username },
                    { commenter: req.body.editData }
                );

                // update following requests usernames
                await Users.updateMany(
                    (user) => {
                        return user.requests.some(
                            (request) => request.username === req.user.username
                        );
                    },
                    (user) => {
                        const index = user.requests.findIndex(
                            (request) => request.username === req.user.username
                        );
                        if (index === -1) return false;
                        return (user.requests[index].username =
                            req.body.editData);
                    }
                );

                break;
            }
            case "email": {
                req.body.editData = req.body.editData.toLowerCase();

                const isExistent = await Users.findOne({
                    email: req.body.editData,
                });

                if (isExistent) {
                    return res
                        .status(400)
                        .json({ success: false, error: "Email already taken" });
                }

                await Users.updateOne(
                    { _id: req.user._id },
                    { email: req.body.editData }
                );
                break;
            }
            case "password": {
                await Users.updateOne(
                    { _id: req.user._id },
                    { password: req.body.editData }
                );

                req.body.editData = "".padStart(req.body.editData.length, "*");

                break;
            }
            case "bio": {
                await Users.updateOne(
                    { _id: req.user._id },
                    { bio: req.body.editData }
                );

                break;
            }
            default: {
                return res.status(400).json({
                    success: false,
                    error: "Undefined edit type",
                });
            }
        }

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

// edit user privacy settings
router.patch("/editprivacy", async (req, res) => {
    try {
        const action = req.body.action;

        await Users.updateOne({ _id: req.user._id }, (user) => {
            return (user.settings[action] = !user.settings[action]);
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// accept follow request
router.patch("/respond", async (req, res) => {
    const { response, requesterId } = req.body;

    try {
        const requester = await Users.findOne({ _id: requesterId });

        if (!requester) {
            return res
                .status(400)
                .json({ success: false, error: "Requester Not Found" });
        }

        if (response === "accept") {
            if (req.user.followers.includes(requesterId)) {
                return res
                    .status(400)
                    .json({ success: false, error: "Already a follower" });
            }

            await Users.updateOne(
                { _id: requesterId },
                { $push: { follows: req.user._id } }
            );

            await Users.updateOne(
                { _id: req.user._id },
                { $push: { followers: requesterId } }
            );
        } else if (response !== "reject") {
            return res
                .status(400)
                .json({ success: false, error: "Undefined Action" });
        }

        await Users.updateOne({ _id: req.user._id }, (user) => {
            const index = user.requests.findIndex(
                (request) => request.id === requesterId
            );
            if (index === -1) return false;
            user.requests.splice(index, 1);
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false });
    }
});

// exports
module.exports = router;
