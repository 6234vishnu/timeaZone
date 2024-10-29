const { name } = require("ejs");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product=require('../../models/productSchema')

const categoryInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const categoryData = await Category.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await User.countDocuments();
    const totalPages = await Math.ceil(totalCategories / limit);

    res.render("category", {
      cat: categoryData,
      currentPage: page,
      totalPage: totalPages,
      totalCategoris: totalCategories,
    });
  } catch (error) {
    if (error) {
      res.redirect("/admin/pageNotfoundServer");
      console.log("error in categoryinfo", error);
    }
  }
};
const addCategoryPage = (req, res) => {
  try {
    res.render("addCategory");
  } catch (error) {
    if (error) {
      res.status(500).json("server error in rendering addd category");
    }
  }
};

const addCategory = async (req, res) => {
    
  const { name, discription } = req.body;

  try {
    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.status(400).json({ error: "category already exists" });
    } else {
      const newCategory = new Category({ name, discription });

      await newCategory.save();

      return res.json("category added successfully");
    }
  } catch (error) {
    if (error) {
      res.status(500).render("pageNotfoundServer");
      console.log("category adding error");
    }
  }
};



const blockCategory= async (req,res)=>{

  try {
      let id=req.query.id
      
     await Category.updateOne({_id:id},{$set:{isBlocked:true,isActive:false}})
     
      res.redirect('/admin/category')
  } catch (error) {
      res.redirect('/admin/pageNotfoundServer')
      console.log('error in customer block');
      
  }
}
const unBlockCategory= async (req,res)=>{
  try {
      let id=req.query.id
      await Category.updateOne({_id:id},{$set:{isBlocked:false,isActive:true}})
      res.redirect('/admin/category')
  } catch (error) {
      res.redirect('/admin/pageNotfoundServer')
      console.log('error in customer unBlock');
  }
}

const editCategoryrender=(req,res)=>{
  try {
    res.render('editCategory')
    
  } catch (error) {
    console.log("error in rendering editCategory",error);
    
    
  }
}

const editCategory =async(req,res)=>{
try {
  
  const {oldname,name,discription}=req.body
  const find=Category.find({name:oldname})
  console.log('errrr',find);

if(find){
  const updated=await Category.updateOne({ name:oldname }, { $set: { name: name, discription: discription } });
if (updated.modifiedCount > 0) {
  console.log('Category updated successfully');
} else {
  console.log('No category found or no changes made');
}

res.redirect('/admin/category')
}

} catch (error) {
  res.status(500).render('pageNotfoundServer')
  console.log('error in editCategory',error);
  
}

}

const addOffer= (req,res)=>{
  try {
    res.render('addCategory')
    
  } catch (error) {
    res.render('pageNotfoundServer')
    console.log('error in rendering add category',error);
    
  }
}

module.exports = {
  categoryInfo,
  addCategory,
  addCategoryPage,
  unBlockCategory,
  blockCategory,
  editCategoryrender,
  editCategory,
  addOffer,


};
