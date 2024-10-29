const { name } = require("ejs");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product=require('../../models/productSchema')
const Coupon=require('../../models/couponSchema')
const Offer=require('../../models/offerSchema')
const Order=require('../../models/orderSchema')
const moment = require('moment');
const PDFDocument = require("pdfkit");
const ExcelJS = require('exceljs');


const salesPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    // Fetch all orders first
    let allOrders = await Order.find({})
      .populate('products.product')
      .populate('user')
      .sort({ createdAt: -1 });

    
    let { filterType, startDate, endDate, searchQuery } = req.query;

    let filteredOrders = allOrders;  

    if (searchQuery) {
      const searchedOrder = await Order.findOne({ _id: searchQuery }).populate('products.product').populate('user');
      if (searchedOrder) {
        filteredOrders = [searchedOrder]; 
      } else {
        filteredOrders = []; 
      }
    }

    if (!searchQuery && filterType) {
      switch (filterType) {
        case 'daily':
          const startOfDay = moment().startOf('day');
          const endOfDay = moment().endOf('day');
          filteredOrders = allOrders.filter(order => moment(order.createdAt).isBetween(startOfDay, endOfDay));
          break;
        case 'weekly':
          const startOfWeek = moment().startOf('week');
          const endOfWeek = moment().endOf('week');
          filteredOrders = allOrders.filter(order => moment(order.createdAt).isBetween(startOfWeek, endOfWeek));
          break;
        case 'monthly':
          const startOfMonth = moment().startOf('month');
          const endOfMonth = moment().endOf('month');
          filteredOrders = allOrders.filter(order => moment(order.createdAt).isBetween(startOfMonth, endOfMonth));
          break;
        case 'total':
          filteredOrders = allOrders; // Use all orders for 'total' filter
          break;
        case 'custom':
          if (startDate && endDate) {
            const start = moment(startDate).startOf('day');
            const end = moment(endDate).endOf('day');
            filteredOrders = allOrders.filter(order => moment(order.createdAt).isBetween(start, end));
          } else {
            console.log('Start date or end date missing for custom range filter.');
            filteredOrders = [];
          }
          break;
        default:
          break;
      }
    }

   
    filteredOrders = Array.isArray(filteredOrders) ? filteredOrders : [];

    let totalOrders = filteredOrders.length;
    let totalDiscount = filteredOrders.reduce((acc, order) => acc + (order.discount || 0), 0);
    let totalAmount = filteredOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

    let paginatedOrders = filteredOrders.slice(skip, skip + limit);
    console.log("filtersOrders",filteredOrders.length)


    // PDF Download
    if (req.query.download === 'pdf') {
     
      console.log("filtersOrders2",filteredOrders.length)
      let totalOrders = filteredOrders.length;
      console.log("filtersOrders3",totalOrders)
      let totalDiscount = filteredOrders.reduce((acc, order) => acc + (order.discount || 0), 0);
      let totalAmount = filteredOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
    
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);
    
      // Add title
      doc.fontSize(16).fillColor('black').text('Sales Report', { align: 'center' });
      doc.moveDown();
    
      // Add summary
      doc.fontSize(12).fillColor('red').text(`Total Orders: ${totalOrders}`);
      doc.text(`Total Discount: ${totalDiscount} $`);
      doc.text(`Total Amount: ${totalAmount} $`);
      doc.moveDown();
    
      // Add table header
      doc.fontSize(9).fillColor('black');
      doc.text('Order ID', 40, doc.y, { continued: true });
      doc.text('User Name', 180, doc.y, { continued: true });
      doc.text('Order Amount', 260, doc.y, { continued: true });
      doc.text('Discount', 310, doc.y, { continued: true });
      doc.text('Payment Method', 340, doc.y, { continued: true });
      doc.text('Created At', 390, doc.y, { continued: true });
      doc.text('Products', 470, doc.y, { width: 290 });
      doc.moveDown();
    
      doc.moveTo(40, doc.y).lineTo(780, doc.y).stroke();
      doc.moveDown();
    
      
      filteredOrders.forEach((order) => {
        const userName = order.user ? order.user.name : 'N/A';
        doc.fontSize(8)
          .text(order._id, 40, doc.y, { continued: true })
          .text(userName, 100, doc.y, { continued: true })
          .text(`${order.totalAmount} $`, 180, doc.y, { continued: true })
          .text(`${order.discount ? order.discount + ' $' : '0 $'}`, 250, doc.y, { continued: true })
          .text(order.paymentMethod, 320, doc.y, { continued: true })
          .text(moment(order.createdAt).format('DD-MM-YYYY'), 390, doc.y, { continued: true });
    
        let productList = order.products.map(productItem => 
          `${productItem.product.name} (Qty: ${productItem.quantity})`
        ).join(', ');
        doc.text(productList, 450, doc.y, { width: 290 });
    
        doc.moveDown();
      });
    
      doc.end();
      return;
    }

  
    res.render('sales', {
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      order: paginatedOrders,
      totalOrders,
      totalDiscount,
      totalAmount,
    });

  } catch (error) {
    console.log('Error in rendering salesPage', error);
    res.status(400).json('Error in rendering sales page');
  }
};




const excelDownload=async(req,res)=>{
     
  try {
    const renderingOrders = await Order.find({})
    .populate('products.product')
    .populate('user')

    if (req.query.download === 'excel') {
      

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sales Report');

     
      worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 20 },
        { header: 'User Name', key: 'userName', width: 30 },
        { header: ' Order Amount', key: 'totalAmount', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 20 },
        { header: 'Order Status', key: 'orderStatus', width: 20 },
        { header: 'Created At', key: 'createdAt', width: 25 },
        { header: 'Products', key: 'products', width: 50 },
      ];

      // Add data rows
      renderingOrders.forEach(order => {
        const productsList = order.products.map(productItem => `${productItem.product.name} (Qty: ${productItem.quantity})`).join(', ');
        worksheet.addRow({
          orderId: order._id,
          userName: order.user.name,
          totalAmount: order.totalAmount,
          discount: order.discount,
          paymentMethod: order.paymentMethod,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          products: productsList,
        });
      });

      // Set response headers for Excel download
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      
      await workbook.xlsx.write(res);
      res.end();
      return; 
    }

    res.render('sales', { order: renderingOrders });
    return; 

  } catch (error) {
    console.log('error in rendering salesPage', error);
    res.status(400).json('Error in rendering sales page');
  }
}




module.exports={
    salesPage,
    excelDownload,
  
   

}