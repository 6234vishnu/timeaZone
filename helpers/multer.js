const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/re-image'));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 50 * 1024 * 1024 
    },
    // fileFilter: (req, file, cb) => {
    //   const allowedTypes = /jpeg|jpg|png/;
    //   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    //   const mimetype = allowedTypes.test(file.mimetype);
  
    //   if (mimetype && extname) {
    //     return cb(null, true);
    //   }
    //   cb(new Error('Only images are allowed'));
    // }
  });

module.exports = upload;

