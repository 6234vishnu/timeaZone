const user = require("../models/userSchema");

const userAuth = (req, res, next) => {
  if (req.session.User) {
    user
      .findById(req.session.user||req.session.googleId)
      .then((data) => {
        if (data && !user.isBlocked) {
          next();
        } else {
          res.redirect("/login");
        }
      })
      .catch((error) => {
        if (error) {
          console.log("error in user auth middleware");
          res.ststus(500).send("internal server error");
        }
      });
  } else {
    res.redirect("/login");
  }
};

const adminAuth = (req, res, next) => {
  if (req.session.admin) {
    user
    .findById(req.session.admin.id)
      .then((data) => {
        if (data) {
          next();
        } else {
          res.redirect("/admin/login");
        }
      })
      .catch((error) => {
        res.status(500).send("Internal server error");
        console.log("Error in admin auth middleware:", error);
      });
  } else {
    res.redirect("/admin/login");
  }
};


module.exports = {
  userAuth,
  adminAuth,
};
