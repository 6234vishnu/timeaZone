const { name } = require("ejs");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product=require('../../models/productSchema')
const Coupon=require('../../models/couponSchema')
const Offer=require('../../models/offerSchema')



const offerPage=async(req,res)=>{
    try {

        const page = parseInt(req.query.page, 10) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
      
        const offer=await Offer.find({}).populate('product')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);
      
        const totalOffers = await Offer.countDocuments();
        const totalPages = Math.ceil(totalOffers / limit);
       
        
   console.log("offer",offer)
   res.render('offerAdmin',{offer:offer,currentPage:page,totalPages})

    } catch (error) {
        console.log('error in rendering offerPage',error)
        res.status(400).json('error to render offer Page')
    }
}

const createOffer=async(req,res)=>{
    try {
      const category=await Category.find({isBlocked:false})
      const product=await Product.find({isBlocked:false})
        res.render('CreateOffer',{category:category,product:product})
        
    } catch (error) {
        console.log('error in Create offer render admin',error)
        res.status(400).json('error to render create offer Page')
    }
}

const createNewOffer = async (req, res) => {
  try {
    console.log('body', req.body);
    const { offerName, offerCode, discountType, discountValue, startDate, endDate, product } = req.body;
    const existingProducts=await Product.find({})


    if (discountValue < 0 || discountValue > 10000) {
      return res.status(400).render("CreateOffer",{ message: 'Discount value must be between 0 and 10,000.' ,product:existingProducts});
    }

    const existingOffer = await Offer.findOne({ offerCode: offerCode });

    if (existingOffer) {
      return res.status(400).render("CreateOffer",{ message: 'Offer with this code already exists',product:existingProducts });
    }

   
    const productId = await Product.findOne({ name: product });
    if (!productId) {
      return res.status(400).render("CreateOffer",{ message: 'Product not found',product:existingProducts  });
    }

   
    const newOffer = new Offer({
      offerName: offerName,
      offerCode: offerCode,
      discountType: discountType,
      product: productId._id,
      discountValue: discountValue,
      startDate: startDate,
      endDate: endDate,
    });

    const saved = await newOffer.save();
    if (!saved) {
      return res.status(400).send('Error in adding coupon');
    }

    return res.redirect('/admin/offerPage');
  } catch (error) {
    console.log('error in adding offer', error);
    return res.status(400).json('Error creating offer');
  }
};


const offerDetails=async(req,res)=>{
    try {
        console.log('query',req.query.id)
        const id=req.query.id
        const offer = await Offer.findOne({_id: id}).populate('product');

        console.log('offer',offer)
        console.log('product',offer.product)
        res.render('offerDetails',{offer:offer})
    } catch (error) {
        console.log('error in   offer details',error)
        res.status(400).json('error to show offer details')
    }
}

 
 const searchOffer=async(req,res)=>{
    try {
     
        const searchQuery=req.query.searchQuery
        const offers=await Offer.find({_id:searchQuery})
        res.render('offerAdmin', { offer: offers });
    } catch (error) {
      res.status(500).render("pageNotfoundServer");
      console.log("Error in searchCoupon:", error);
    }
 }


 const blockOffer=async(req,res)=>{
    try {
        const id = req.query.id;
        await Offer.updateOne(
          { _id: id },
          { $set: { isActive: false,} }
        );
        res.redirect("/admin/offerPage");
      } catch (error) {
        res.status(500).render("pageNotfoundServer");
        console.log("Error in blockOffer:", error);
      }

 }

 const unBlockOffer=async(req,res)=>{
    try {
        const id = req.query.id;
        await Offer.updateOne(
          { _id: id },
          { $set: {isActive:true } }
        );
        res.redirect("/admin/offerPage");
      } catch (error) {
        res.status(500).render("pageNotfoundServer");
        console.log("Error in unblock Offer:", error);
      }
 }
  
module.exports={
    offerPage,
    createOffer,
    createNewOffer,
    offerDetails,
    searchOffer,
    blockOffer,
    unBlockOffer,

}