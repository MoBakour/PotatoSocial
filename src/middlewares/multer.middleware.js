const multer = require("multer");

const upload = multer({ dest: "database/uploads" });

// delete images
async function deleteImage(filename) {
    try {
        await fs.promises.unlink(`./database/uploads/${filename}`);
    } catch (err) {
        console.log(err);
    }
}

module.exports = { upload, deleteImage };
