const fs = require("fs");
const path = require("path");

const appRoot = path.join(__dirname, "..");
const defaultUploadRoot = process.env.NODE_ENV === "production"
  ? "/var/data"
  : path.join(appRoot, "public");
const uploadRoot = process.env.UPLOAD_ROOT
  ? path.resolve(process.env.UPLOAD_ROOT)
  : defaultUploadRoot;

const avatarUploadDir = path.join(uploadRoot, "uploads");
const novelUploadDir = path.join(uploadRoot, "images", "uploads");

function ensureUploadDirectories() {
  [avatarUploadDir, novelUploadDir].forEach((dirPath) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

module.exports = {
  uploadRoot,
  avatarUploadDir,
  novelUploadDir,
  ensureUploadDirectories,
};
