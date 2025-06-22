const User = require("../../models/userSchema");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const nodeMailer = require("nodemailer");
const Order = require("../../models/orderSchema");

const pageNotfoundServer = async (req, res) => {
  res.render("pageNotfoundServer");
};

const loadLoginPage = async (req, res) => {
  try {
    res.render("adminLogin", { messages: null });
  } catch (error) {}
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const admin = await User.findOne({ email: email, isAdmin: true });

    if (!admin) {
      return res.render("adminLogin", {
        message: "Incorrect email or not an admin",
      });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.render("adminLogin", { message: "Incorrect password" });
    }

    req.session.admin = { id: admin._id, email: admin.email };

    return res.redirect("/admin/adminDashboard");
  } catch (error) {
    console.error("Error in admin login:", error);

    return res.render("adminLogin", {
      message: "Error in login, please try again",
    });
  }
};

const adminlogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return res.render("adminDashboard", {
          message: "An error occurred, can't log out",
        });
      } else {
        return res.redirect("/admin/login");
      }
    });
  } catch (error) {
    res.render("adminDashboard", {
      message: "An unexpected error occurred, can't log out",
    });
  }
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmailVerification = async (email, otp) => {
  try {
    const transporter = nodeMailer.createTransport({
      service: "gmail",
      requireTLS: true,
      auth: {
        user: process.env.NODEEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.NODEEMAILER_EMAIL,
      to: email,
      subject: "verify your account",
      html: `<b> your otp :${otp}</b>`,
    });
    if (info.accepted.length > 0) {
      return true;
    } else {
      console.error("Email not accepted:", info);
      return false;
    }
  } catch (error) {
    console.error("error in sending email", error);
    return false;
  }
};

function forgotPasswordAdmin(req, res) {
  try {
    res.render("eneterEmailAdmin");
  } catch (error) {
    res.redirect("/admin/pageNotfoundServer");
  }
}

const forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const findAdmin = await User.findOne({ email: email, isAdmin: true });

    if (findAdmin) {
      const otpGenerated = await generateOtp();

      req.session.otpGenerated = otpGenerated;
      req.session.email = email;
      return res.render("verifyOtpAdmin");
    } else {
      return res.render("eneterEmailAdmin", { message: "incorrect  email" });
    }
  } catch (error) {
    if (error) {
      res.status(400).send({ message: "account not exists" });
    }
  }
};

const resendOtp = async (req, res) => {
  try {
    const email = req.session.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email not found in session",
      });
    }

    const otp = generateOtp();

    req.session.userOtp = otp;
    const emailSent = await sendEmailVerification(email, otp);

    if (emailSent) {
      return res.status(200).json({
        success: true,
        message: "OTP resent successfully",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to resend OTP",
      });
    }
  } catch (error) {
    console.error("Error in resend OTP:", error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "An unexpected error occurred",
      });
    }
  }
};

const otpcompareforgotAdmin = async (req, res) => {
  try {
    const { otp } = req.body;

    const generatedOtp = req.session.otpGenerated;

    if (otp === generatedOtp) {
      return res
        .status(200)
        .json({ success: true, redirectUrl: "/admin/newPasswordAdmin" });
    } else {
      return res.status(400).json({ message: "otp is not matched" });
    }
  } catch (error) {}
};
const newPasswordrender = (req, res) => {
  try {
    return res.render("newPassword");
  } catch (error) {
    res.status(500).redirect("/pageNotfoundServer");
  }
};

const newPasswordAdmin = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const email = req.session.email;
    if (newPassword === confirmPassword) {
      await User.updateOne(
        { email: email },
        { $set: { password: newPassword } }
      );
      return res.status(200).redirect("/admin/login");
    }
    return res.status(400).json({ message: "passwords are is not match" });
  } catch (error) {}
};

const loadDashboard = async (req, res) => {
  try {
    return res.render("adminDashboard");
  } catch (error) {
    if (error) {
      res.render("adminLogin", { message: "there is a server error" });
    }
  }
};

function getAllDatesInMonth(year, month) {
  const dates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get number of days in month
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`
    ); // Format as YYYY-MM-DD
  }
  return dates;
}

// Utility function to get weeks in a month
function getWeeksInMonth(year, month) {
  const weeks = [];
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);

  let currentWeekStart = firstDate;

  while (currentWeekStart <= lastDate) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6); // 7 days for the week
    weeks.push({
      start: currentWeekStart.toISOString().split("T")[0],
      end:
        weekEnd <= lastDate
          ? weekEnd.toISOString().split("T")[0]
          : lastDate.toISOString().split("T")[0],
    });
    currentWeekStart.setDate(currentWeekStart.getDate() + 7); // Move to the next week
  }

  return weeks;
}

const dashboardGraph = async (req, res) => {
  const { aggregation } = req.query; // Get aggregation type from query parameter

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // Current month (0-indexed)

    let matchCondition = {
      createdAt: {
        $gte: new Date(year, month, 1),
        $lt: new Date(year, month + 1, 1), // Filter orders in the current month
      },
    };

    let groupBy;
    let allTimeFrames = [];

    // Determine the aggregation level and set up the match and grouping accordingly
    if (aggregation === "daily") {
      // Daily aggregation
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
      allTimeFrames = getAllDatesInMonth(year, month);
    } else if (aggregation === "weekly") {
      // Weekly aggregation
      groupBy = {
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
      };
      allTimeFrames = getWeeksInMonth(year, month).map((week) => week.start); // Use the start of each week
    } else if (aggregation === "monthly") {
      // Monthly aggregation (assuming you want the current month)
      groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
      allTimeFrames = [`${year}-${String(month + 1).padStart(2, "0")}`]; // Current month
    } else {
      return res
        .status(400)
        .json({
          message: "Invalid aggregation type. Use daily, weekly, or monthly.",
        });
    }

    // Retrieve orders based on the specified aggregation
    const orders = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy, // Group by the chosen format
          totalAmount: { $sum: "$totalAmount" }, // Sum the total amounts
        },
      },
      { $sort: { _id: 1 } }, // Sort by date
    ]);

    // Create a map from order data for quick lookup
    const orderMap = {};
    orders.forEach((order) => {
      orderMap[order._id] = order.totalAmount;
    });

    // Prepare final data array with all time frames and their corresponding amounts
    const result = allTimeFrames.map((timeFrame) => ({
      _id: timeFrame,
      totalAmount: orderMap[timeFrame] || 0, // Default to 0 if no orders for that date/week/month
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching order data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  loadLoginPage,
  login,
  loadDashboard,
  adminlogout,
  pageNotfoundServer,
  forgotPasswordAdmin,
  forgotPasswordEmail,
  otpcompareforgotAdmin,
  newPasswordrender,
  newPasswordAdmin,
  resendOtp,
  dashboardGraph,
};
