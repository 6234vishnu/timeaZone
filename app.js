const express = require("express");
const app = express();
const path = require("path");
const env = require("dotenv").config();
const db = require("./config/db");
const router = require("./routes/userRouter");
const session = require("express-session");
const passport=require('./config/passport')
const adminRouter=require('./routes/adminRouter')
const userRouter=require('./routes/userRouter')
const morgan=require('morgan')
const methodOverride = require('method-override');
const { clearCacheAdmin, clearCacheUser } = require("./middlewares/clearCache");
const nocache = require('nocache');




db();

app.use(
  session({
    secret: process.env.SECRECT_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize())
app.use(passport.session())
app.use((req,res,next)=>{
  res.locals.user=req.user||null;
  next()
})
app.use((req, res, next) => {
  res.locals.message = req.session.message || null;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/", router);
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store'); 
  res.setHeader('Pragma', 'no-cache'); 
  res.setHeader('Expires', '0'); 
  next();
});



app.use(nocache())

app.use(morgan('dev'))

app.use('/',userRouter)
app.use('/admin',adminRouter)

app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use(methodOverride('_method'));

app.use(clearCacheAdmin,clearCacheUser)




app.set("view engine", "ejs");
app.set(
  "views",[
  path.join(__dirname, "views/user"),
  path.join(__dirname, "views/admin"),
  path.join(__dirname, "views/partials")
]);

app.use('/images', express.static(path.join(__dirname, 'public/images')));


app.listen(process.env.PORT, () => {
  console.log(`server is running on http://localhost:3000`);
});

module.exports = app;
