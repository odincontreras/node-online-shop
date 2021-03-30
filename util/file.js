const fs = require('fs');

const deleteFile = (filePath) => {
  //delete a file usint its path
  fs.unlink(filePath, (err) => {
    if(err) {
      throw (err)
    }
  })
}

module.exports = {
  deleteFile
}