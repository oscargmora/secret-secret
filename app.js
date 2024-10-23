require("dotenv").config();
const express = require("express");
const app = express();
const appRouter = require("./routes/appRouter");
const session = require("express-session");
const passport = require("passport");

app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: false }));
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use("/", appRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT);
