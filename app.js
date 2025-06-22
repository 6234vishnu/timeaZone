const express = require("express");
const app = express();
const path = require("path");
const env = require("dotenv").config();
const db = require("./config/db");

const session = require("express-session");
const passport = require("./config/passport");
const adminRouter = require("./routes/adminRouter");
const userRouter = require("./routes/userRouter");
const morgan = require("morgan");
const methodOverride = require("method-override");
const { clearCacheAdmin, clearCacheUser } = require("./middlewares/clearCache");
const nocache = require("nocache");
const MongoStore = require("connect-mongo");

db();

const PORT = process.env.PORT || 3000;

app.use(
  session({
    secret: process.env.SECRECT_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use((req, res, next) => {
  res.locals.message = req.session.message || null;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use(nocache());
app.use(morgan("dev"));
app.use(methodOverride("_method"));

app.use(clearCacheAdmin, clearCacheUser);

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/user"),
  path.join(__dirname, "views/admin"),
  path.join(__dirname, "views/partials"),
]);

app.head("/", (req, res) => {
  res.status(200).end();
});

app.get("/", (req, res) => {
  res.redirect("/home");
});


app.use("/", userRouter);
app.use("/admin", adminRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
