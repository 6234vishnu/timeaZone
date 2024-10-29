const Brand = require('../../models/brandSchema');
const product = require('../../models/productSchema'); 

const getBrandPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        
    
        const brandData = await Brand.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands / limit);
        const reverseBrand=brandData.reverse()
    
        res.render('brand', {
            data: reverseBrand, 
            currentPage: page,
            totalPages: totalPages,
            totalBrands: totalBrands
        });
    } catch (error) {
        console.error('Error fetching brand data:', error);
        res.status(500).send('Server Error');
    }
};

const addBrand = async (req, res) => {
    try {
        const { name } = req.body;
        const image = req.file ? req.file.filename : null;
        console.log(image);

        const findBrand = await Brand.findOne({ name });

        if (!findBrand) {
            const newBrand = new Brand({
                name,
                logo: image,
            });
            await newBrand.save();
        }

        res.redirect('/admin/addBrand');
    } catch (error) {
        console.error('Error in addBrand:', error);
        res.redirect('/admin/brand', { message: 'Error occurred' });
    }
};


const blockBrand= async (req,res)=>{

    try {
        let id=req.query.id
        
        await Brand.updateOne({_id:id},{$set:{isBlocked:true}})
       
        res.redirect('/admin/addBrand')
    } catch (error) {
        res.redirect('/admin/pageNotfoundServer')
        console.log('error in customer block');
        
    }
}
const unblockBrand= async (req,res)=>{

    try {
        let id=req.query.id
        
        await Brand.updateOne({_id:id},{$set:{isBlocked:false}})
       
        res.redirect('/admin/addBrand')
    } catch (error) {
        res.redirect('/admin/pageNotfoundServer')
        console.log('error in customer block');
        
    }
}
const deleteBrand= async (req,res)=>{

    try {
        let id=req.query.id
        
        await Brand.deleteOne({_id:id},{$set:{isBlocked:false}})
       
        res.redirect('/admin/addBrand')
    } catch (error) {
        res.redirect('/admin/pageNotfoundServer')
        console.log('error in customer block');
        
    }
}

module.exports = {
    getBrandPage,
    addBrand,
    blockBrand,
    unblockBrand,
    deleteBrand

};
