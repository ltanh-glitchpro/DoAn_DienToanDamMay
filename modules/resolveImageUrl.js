const fs = require("fs");
const path = require("path");

function fileExistsInPublic(urlPath) {
	if (!urlPath || !urlPath.startsWith("/")) return false;

	try {
		const cleanedPath = decodeURI(urlPath.split("?")[0]);
		const absolutePath = path.join(__dirname, "..", "public", cleanedPath.replace(/^\//, ""));
		return fs.existsSync(absolutePath);
	} catch (error) {
		return false;
	}
}

function resolveImageUrl(value, folderPrefix = "", fallback = "") {
	if (!value) return fallback;

	const imageValue = String(value).trim();
	if (!imageValue) return fallback;

	if (
		imageValue.startsWith("http://") ||
		imageValue.startsWith("https://") ||
		imageValue.startsWith("//") ||
		imageValue.startsWith("data:")
	) {
		return encodeURI(imageValue);
	}

	if (imageValue.startsWith("/")) {
		return fileExistsInPublic(imageValue) ? encodeURI(imageValue) : fallback;
	}

	if (folderPrefix) {
		const normalizedPrefix = folderPrefix.endsWith("/")
			? folderPrefix.slice(0, -1)
			: folderPrefix;
		const combinedPath = normalizedPrefix + "/" + imageValue;
		return fileExistsInPublic(combinedPath) ? encodeURI(combinedPath) : fallback;
	}

	return fallback;
}

module.exports = resolveImageUrl;