const { name } = require("ejs");
const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const loadProductPage = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 6;

    const searchCriteria = search
      ? {
          $or: [
            { name: { $regex: new RegExp(".*" + search + ".*", "i") } },
            {
              brand: {
                $in: await Brand.find({
                  name: { $regex: new RegExp(".*" + search + ".*", "i") },
                }).select("_id"),
              },
            },
          ],
        }
      : {};

    const productData = await Product.find(searchCriteria)
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("category")
      .populate("brand")
      .exec();

    const count = await Product.countDocuments(searchCriteria);

    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });

    if (category && brand) {
      res.render("products", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand,
      });
    } else {
      res.render("pageNotfoundServer");
    }
  } catch (error) {
    res.status(500).render("pageNotfoundServer");
  }
};

const blockProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Product.updateOne(
      { _id: id },
      { $set: { isBlocked: true, isActive: false } }
    );
    res.redirect("/admin/products");
  } catch (error) {
    res.status(500).render("pageNotfoundServer");
  }
};
const unblockProduct = async (req, res) => {
  try {
    const id = req.query.id;
    await Product.updateOne(
      { _id: id },
      { $set: { isBlocked: false, isActive: true } }
    );
    res.redirect("/admin/products");
  } catch (error) {
    res.status(500).render("pageNotfoundServer");
  }
};

const addProductPage = async (req, res) => {
  try {
    const category = await Category.find({ isActive: true });
    const brand = await Brand.find({ isBlocked: false });
    res.render("addProducts ", {
      category: category,
      brand: brand,
    });
  } catch (error) {
    res.status(500).render("pageNotfoundServer");
  }
};

const addProducts = async (req, res) => {
  try {
    const color = Array.isArray(req.body.color)
      ? req.body.color.filter(Boolean)
      : [req.body.color].filter(Boolean);

    if (!req.body.regularPrice || !req.body.salePrice || !req.body.quantity) {
      return res
        .status(400)
        .send("RegularPrice, SalePrice, and Quantity are required");
    }

    const productExists = await Product.findOne({ name: req.body.productName });
    if (productExists) {
      return res.status(400).json("Product already exists");
    }

    const images = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const originalImagePath = req.files[i].path;
        const resizedImagePath = path.join(
          __dirname,
          "../../public/pictures",
          req.files[i].filename
        );

        await sharp(originalImagePath)
          // .resize({ width: 200, height: 230 })
          .resize(500, 500, { fit: "cover" })
          .jpeg({ quality: 100 })
          .png({ quality: 100 })
          .toFile(resizedImagePath);

        images.push(req.files[i].filename);
      }
    }

    const category = await Category.findOne({ name: req.body.category });
    if (!category) {
      return res.status(400).json("Invalid Category name");
    }

    const brand = await Brand.findOne({ name: req.body.brand });
    if (!brand) {
      return res.status(400).json("Invalid Brand name");
    }

    const newProduct = new Product({
      name: req.body.productName,
      description: req.body.description,
      brand: brand._id,
      category: category._id,
      regularPrice: req.body.regularPrice,
      salePrice: req.body.salePrice,
      createdOn: new Date(),
      quantity: req.body.quantity,
      size: req.body.size,
      color: color,
      productImage: images,
      status: req.body.status,
    });

    await newProduct.save();

    res.status(201).redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const editProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("brand");
    const brands = await Brand.find();
    const categories = await Category.find();

    if (!product) {
      return res.status(404).send("Product not found");
    }

    res.render("editProduct", {
      product: product,
      brand: brands,
      category: categories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in edit product");
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const productId = req.params.productId;
    const image = req.body.image;

    const product = await Product.findById(productId);

    product.productImage = product.productImage.filter((img) => img !== image);

    const imagePath = path.join(__dirname, "../../public/images/", image);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await product.save();

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting product image:", error);
    res.status(500).json({ message: "Error deleting image" });
  }
};

const uploadCroppedImage = async (req, res) => {
  try {
    const productId = req.params.productId;

    if (req.file) {
      const imageBlob = `${req.file.filename}`;
      const product = await Product.findById(productId);
      product.productImage.push(imageBlob);

      await product.save();

      res.status(200).json({ message: "Image uploade successfully" });
    } else {
      res.status(400).json({ message: "No file uploaded" });
    }
  } catch (error) {
    console.error("Error uploading cropped image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
};

const updateProduct = async (req, res) => {
  try {
    // Get productId from the route parameter
    const productId = req.params.productId;

    const id = await Category.findOne({ name: req.body.category });

    const brand = await Brand.findOne({ name: req.body.brand });

    // Create an updatedProduct object with the updated fields
    const updatedProduct = {
      name: req.body.productName,
      description: req.body.description,
      regularPrice: req.body.regularPrice,
      salePrice: req.body.salePrice,
      quantity: req.body.quantity,
      category: id._id,
      brand: brand._id,
      colors: req.body.color || [], // Use empty array if no colors
    };

    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.filename;
      updatedProduct.productImage = uploadedImages;
    }

    const product = await Product.findByIdAndUpdate(productId, updatedProduct, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Server error");
  }
};

module.exports = {
  loadProductPage,
  addProductPage,
  addProducts,
  blockProduct,
  unblockProduct,
  editProduct,
  updateProduct,
  deleteProductImage,
  uploadCroppedImage,
};
