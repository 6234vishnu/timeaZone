const User = require("../../models/userSchema");

const customerInfo = async (req, res) => {
  try {
    let search = req.query.search || "";
    let page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
   


   
    const data = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } }, 
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
        .populate("address")
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.find({
      isAdmin: false,
      $or: [
        {name: {$regex: ".*" + search + ".*",$options: "i" } },
        {email: {$regex: ".*" + search + ".*",$options: "i" } },
        {phone: {$regex: ".*" + search + ".*",$options: "i" } },
      ],
    }).countDocuments();
   
    
    const totalPages = Math.ceil(count / limit);
    return res.render("userManagement", { data, currentPage:page, limit, count ,totalPages});

  } catch (error) {
    console.log("Error in user management:", error);
    res.status(500).send("Internal Server Error");
  }
};

const customerBlock= async (req,res)=>{

    try {
        let id=req.query.id
        
        await User.updateOne({_id:id},{$set:{isBlocked:true}})
       
        res.redirect('/admin/users')
    } catch (error) {
        res.redirect('/admin/pageNotfoundServer')
        console.log('error in customer block');
        
    }
}
const unBlockCustomer= async (req,res)=>{
    try {
        let id=req.query.id
        await User.updateOne({_id:id},{$set:{isBlocked:false}})
        res.redirect('/admin/users')
    } catch (error) {
        res.redirect('/admin/pageNotfoundServer')
        console.log('error in customer unBlock');
    }
}

module.exports = {
  customerInfo,
  customerBlock,
  unBlockCustomer,
};
