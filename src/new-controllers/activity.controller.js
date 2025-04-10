const express = require("express");
const { denyUnlogged } = require("../middlewares/auth.middleware");
const { Users, Posts } = require("../utils/db");
const router = express.Router();

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

router.put("/follow/:action", denyUnlogged, async (req, res) => {
    try {
        const action = req.params.action;

        // verify account
        const account = await Users.findOne({ _id: req.body.account });

        if (!account)
            return res
                .status(400)
                .json({ success: false, error: "Account Not Found" });

        // validate
        if (["follow", "unfollow", "cancel"].indexOf(action) === -1) {
            return res
                .status(400)
                .json({ success: false, error: "Invalid Action" });
        }

        if (
            (action === "follow" &&
                (account.followers.includes(req.user._id) ||
                    account.request.includes(req.user._id))) ||
            (action === "unfollow" &&
                !account.followers.includes(req.user._id)) ||
            (action === "cancel" &&
                (!account.request.includes(req.user._id) ||
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
                        requests: req.user._id,
                    },
                }
            );

            return res.status(200).json({ success: true, pending: true });
        }

        // cancel pending
        if (action === "cancel") {
            await Users.updateOne(
                { _id: account._id },
                {
                    $pull: {
                        requests: req.user._id,
                    },
                }
            );
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

router.put("/respond", denyUnlogged, async (req, res) => {
    const { answer, requesterId } = req.body;

    try {
        const requester = await Users.findOne({ _id: requesterId });

        if (!requester) {
            return res
                .status(400)
                .json({ success: false, error: "Requester Not Found" });
        }

        if (answer === "accept") {
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
        } else if (answer !== "reject") {
            return res
                .status(400)
                .json({ success: false, error: "Undefined Action" });
        }

        await Users.updateOne(
            { _id: req.user._id },
            { $pull: { requests: requesterId } }
        );

        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false });
    }
});
