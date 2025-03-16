// imports
const express = require("express");
const { Users } = require("../utils/db.js");
const { setToken, denyLogged } = require("../middlewares/auth.middleware.js");
const { signupSchema } = require("../utils/validation.js");
const { ZodError } = require("zod");

// router
const router = express.Router();

// auth routes
router.post("/login", denyLogged, async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await Users.findOne((item) => {
            return item.username === username || item.email === username;
        });

        if (!user) {
            return res
                .status(400)
                .json({ success: false, error: "Incorrect username or email" });
        }

        if (user.password === password) {
            setToken(res, user._id);
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({
                success: false,
                error: "Incorrect password",
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});

router.post("/signup", denyLogged, async (req, res) => {
    try {
        // trim and lowercase email
        for (const key in req.body) {
            req.body[key] = req.body[key].trim();
        }
        req.body.email = req.body.email.toLowerCase();

        // validate
        signupSchema.parse(req.body);

        // reform signup body
        delete req.body.repassword;
        const defaultFields = {
            bio: "",
            avatar: "",
            follows: [],
            followers: [],
            requests: [],
            seen: [],
            settings: {
                lockComments: false,
                lockPosts: false,
                lockFollows: false,
            },
        };
        req.body = { ...req.body, ...defaultFields };
        req.body.email = req.body.email.toLowerCase();

        const emailExists = await Users.findOne((item) => {
            return item.email.toLowerCase() === req.body.email.toLowerCase();
        });

        if (emailExists) {
            return res.status(400).json({
                success: false,
                error: "Email already exists",
            });
        }

        const usernameExists = await Users.findOne((item) => {
            return (
                item.username.toLowerCase() === req.body.username.toLowerCase()
            );
        });

        if (usernameExists) {
            return res.status(400).json({
                success: false,
                error: "Username already exists",
            });
        }

        const user = await Users.insertOne(req.body);
        setToken(res, user._id);
        res.status(200).json({ success: true });
    } catch (err) {
        if (err instanceof ZodError) {
            res.status(400).json({
                success: false,
                error: err.errors[0].message,
            });
            return;
        }

        console.log(err);
        res.status(400).json({
            success: false,
            error: err.message,
        });
    }
});

// exports
module.exports = router;
