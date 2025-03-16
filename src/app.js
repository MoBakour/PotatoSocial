// imports
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { authenticate } = require("./middlewares/auth.middleware.js");

const pageController = require("./controllers/page.controller.js");
const dataController = require("./controllers/data.controller.js");
const authController = require("./controllers/auth.controller.js");
const postController = require("./controllers/post.controller.js");
const patchController = require("./controllers/patch.controller.js");
const deleteController = require("./controllers/delete.controller.js");

// app
const app = express();

// config app
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// port
const PORT = process.env.PORT || process.env.port || 3000;

// listen to server
app.listen(PORT, () => {
    console.log(`Server listening on port ${[PORT]}`);
});

// authenticate user
app.use(authenticate);

// use routers
app.use(pageController);
app.use(dataController);
app.use(authController);
app.use(postController);
app.use(patchController);
app.use(deleteController);

// 404 route
app.use((req, res) => {
    res.status(404).render("fof", { currentPage: "fof" });
});
