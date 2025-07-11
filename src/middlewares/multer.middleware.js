/*
Multer is a middleware for handling multipart/form data, which is primarily used for uploading files in Node. js.
*/

import multer from 'multer'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage: storage })
