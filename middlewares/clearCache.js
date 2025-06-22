const user = require("../models/userSchema");

const clearCacheUser = (req, res, next) => {
  if (req.session.user) {
    return res.redirect("/home");
  }
  next();
};
const clearCacheAdmin = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect("/admin/adminDashboard");
  }
  next();
};

module.exports = {
  clearCacheUser,
  clearCacheAdmin,
};
