// imports
const jwt = require("jsonwebtoken");
const { Users } = require("../utils/db.js");

// secret
const SECRET = process.env.SECRET || process.env.secret;

// auth functions
function authenticate(req, res, next) {
    const token = req.cookies.token;

    if (token) {
        jwt.verify(token, SECRET, (err, decoded) => {
            if (!err) {
                const id = decoded.id;
                Users.findOne({ _id: id }).then((user) => {
                    if (user) {
                        req.user = user;

                        res.locals.userId = user._id;
                        res.locals.user = user;
                    }
                    next();
                });
            } else next();
        });
    } else next();
}

function setToken(res, userId) {
    const minimumExpiry = 60 * 60 * 24 * 14;
    const token = jwt.sign({ id: userId }, SECRET, {
        expiresIn: minimumExpiry,
    });
    res.cookie("token", token, {
        maxAge: minimumExpiry * 1000,
        httpOnly: true,
    });
}

function denyLogged(req, res, next) {
    if (req.user) {
        res.redirect("/");
    } else {
        next();
    }
}

function denyUnlogged(req, res, next) {
    if (!req.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

// exports
module.exports = { authenticate, setToken, denyLogged, denyUnlogged };
