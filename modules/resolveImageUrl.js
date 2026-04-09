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
		return encodeURI(imageValue);
	}

	if (folderPrefix) {
		const normalizedPrefix = folderPrefix.endsWith("/")
			? folderPrefix.slice(0, -1)
			: folderPrefix;
		return encodeURI(normalizedPrefix + "/" + imageValue);
	}

	return fallback;
}

module.exports = resolveImageUrl;