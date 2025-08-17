/**
 * Image utilities for handling both real URLs and mock mode URLs
 */

/**
 * Check if running in mock mode
 */
export const isMockMode = () => {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    !window.navigator.onLine
  );
};

/**
 * Check if a URL is a mock URL
 */
export const isMockUrl = (url) => {
  return url && url.startsWith("mock://");
};

/**
 * Generate a placeholder image for mock URLs
 */
export const getMockImagePlaceholder = (url, type = "logo") => {
  if (!isMockUrl(url)) return url;

  // Extract filename from mock URL
  const filename = url.split("/").pop()?.split("?")[0] || "image";

  // Return a placeholder based on type
  if (type === "logo") {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="60" fill="#3B82F6" rx="8"/>
        <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
          ${filename.replace(/\.[^/.]+$/, "")}
        </text>
      </svg>
    `)}`;
  }

  if (type === "avatar") {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#3B82F6"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
          ${filename.charAt(0).toUpperCase()}
        </text>
      </svg>
    `)}`;
  }

  return url;
};

/**
 * Handle image loading with mock mode support
 */
export const handleImageSrc = (url, type = "logo") => {
  if (!url) return null;

  // If it's a data URL, return as-is (these are real images)
  if (url.startsWith("data:")) {
    return url;
  }

  // Only use placeholders for mock:// protocol URLs
  if (isMockUrl(url)) {
    return getMockImagePlaceholder(url, type);
  }

  return url;
};

/**
 * Create an image component that handles mock URLs
 */
export const createImageProps = (
  src,
  alt,
  type = "logo",
  fallbackComponent = null
) => {
  const imageSrc = handleImageSrc(src, type);

  return {
    src: imageSrc,
    alt,
    onError: (e) => {
      if (fallbackComponent && typeof fallbackComponent === "function") {
        e.target.style.display = "none";
        fallbackComponent();
      }
    },
  };
};
