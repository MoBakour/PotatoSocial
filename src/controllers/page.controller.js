// imports
const express = require("express");

const { Users, Posts, Comments } = require("../utils/db.js");
const { getPosts } = require("../utils/utils.js");
const {
    denyLogged,
    denyUnlogged,
} = require("../middlewares/auth.middleware.js");

// router
const router = express.Router();

// pages
router.get("/", denyUnlogged, async (req, res) => {
    try {
        // get posts
        const posts = await getPosts(req);

        // send success response
        res.render("home", {
            posts,
            currentPage: "home",
        });
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

router.get("/login", denyLogged, (req, res) => {
    res.render("login", { currentPage: "login" });
});

router.get("/signup", denyLogged, (req, res) => {
    res.render("signup", { currentPage: "signup" });
});

router.get("/logout", denyUnlogged, (req, res) => {
    res.cookie("token", "", { maxAge: 1, httpOnly: true });
    res.redirect("/");
});

router.get("/settings", denyUnlogged, (req, res) => {
    res.render("settings", { currentPage: "settings" });
});

router.get("/requests", denyUnlogged, (req, res) => {
    if (!req.user.settings.lockFollows) {
        return res.status(404).render("fof", { currentPage: "fof" });
    }

    res.render("requests", {
        requests: req.user.requests,
        currentPage: "requests",
    });
});

router.get("/:username", denyUnlogged, async (req, res, next) => {
    const visitedUsername = req.params.username;

    try {
        const user = await Users.findOne(
            (u) => u.username.toLowerCase() === visitedUsername.toLowerCase()
        );

        if (visitedUsername !== user.username) {
            res.redirect(`/${user.username}`);
            return;
        }

        if (user) {
            let posts = [];

            if (
                !user.settings.lockPosts ||
                user._id === req.user._id ||
                user.followers.includes(req.user._id)
            ) {
                posts = await Posts.findMany(
                    { poster: user.username },
                    { recent: true, limit: 10 }
                );
            }

            for (const post of posts) {
                const comments = await Comments.findMany({
                    commentParent: post._id,
                });

                post.avatar = user.avatar;
                post.commentsNumber = comments.length;
            }

            res.render("profile", {
                profile: user,
                currentPage: "profile",
                isSelf: user._id === req.user._id,
                followStatus: (() => {
                    if (
                        user.requests.some(
                            (request) => request.id === req.user._id
                        )
                    ) {
                        return "pending";
                    }

                    return req.user.follows.includes(user._id)
                        ? "followed"
                        : "unfollowed";
                })(),
                posts,
            });
        } else {
            next();
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({ success: false, error: err.message });
    }
});

// export router
module.exports = router;
