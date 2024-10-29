const Brand = require('../../models/brandSchema');
const product = require('../../models/productSchema'); 
const Order=require('../../models/orderSchema')
const Address=require('../../models/adressSchema')
const User=require('../../models/userSchema')
const Product=require('../../models/productSchema')


const editOrder = async (req, res) => {
 
    try {

      
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
      
        const orderData = await Order.find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
  
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);
        const reverseOrder = orderData.reverse();
  
     return   res.render('orders', {
          order: reverseOrder,
          currentPage: page,
          totalPages: totalPages,
          totalBrands: totalOrders,
        });
      
      
      
    } catch (error) {
      res.status(500).send('server error');
      console.log('error in editOrder admin ', error);
    }
  };
  
const editStatus=async(req,res)=>{
  
    try {
      
      const {orderId, newStatus }=req.body
      console.log('req body ',req.body);

      const updatedOrder = await Order.findByIdAndUpdate(
        orderId, 
        { orderStatus: newStatus }, 
        { new: true } 
    );

    if (!updatedOrder) {
        return res.status(404).send('Order not found');
    }

    res.redirect('/admin/order');

    } catch (error) {
        res.status(500).send("server error");
    console.log("error in editStatus admin ", error);
        
    }
}


const orderDetails=async(req,res)=>{

  try {
   
    const {orderId}  = req.query;  
  

   
      const order = await Order.findOne({ _id: orderId }).populate("products.product")
  
      const user = await User.findOne({ _id: order.user});
      const address = await Address.findOne({ _id: order.address });
      console.log("address:", address);

      const productIds = order.products.map((item) => item.product);
      const products = await Product.find({ _id: { $in: productIds } });
      console.log('address',address)
      res.render("orderdetailsAdmin", {
        order: order,
        product: products,
        address: address,
        user: user,
      });

      
  } catch (error) {
    console.error("Error in orderDetails:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
}




module.exports={
    editOrder,
    editStatus,
    orderDetails,
    
}