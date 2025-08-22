import React, { useState, useCallback } from "react";
import {
  uploadProfilePicture,
  uploadLogo,
  uploadBrandingAsset,
} from "../services/storageService";

/**
 * FileUpload Component - Reusable file upload component for different asset types
 */
const FileUpload = ({
  type = "profile", // profile, logo, branding, product
  onUploadSuccess = () => {},
  onUploadError = () => {},
  maxSize = 5, // MB
  allowedTypes = ["image/jpeg", "image/png", "image/webp"],
  className = "",
  children,
  userId = null,
  assetName = null,
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(
    async (file) => {
      if (!file) return;

      setUploading(true);

      try {
        let result;

        switch (type) {
          case "profile":
            if (!userId)
              throw new Error("User ID required for profile uploads");
            result = await uploadProfilePicture(file, userId);
            break;

          case "logo":
            result = await uploadLogo(file, assetName || "main-logo");
            break;

          case "branding":
            if (!assetName)
              throw new Error("Asset name required for branding uploads");
            result = await uploadBrandingAsset(file, assetName);
            break;

          default:
            throw new Error("Invalid upload type");
        }

        if (result.success) {
          onUploadSuccess(result.data);
        } else {
          onUploadError(result.error);
        }
      } catch (error) {
        onUploadError(error.message);
      } finally {
        setUploading(false);
      }
    },
    [type, userId, assetName, onUploadSuccess, onUploadError]
  );

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleUpload(file);
      }
    },
    [handleUpload]
  );

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-6 text-center
        ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
        ${
          uploading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:border-gray-400"
        }
        ${className}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        onChange={handleFileSelect}
        accept={allowedTypes.join(",")}
        disabled={uploading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      {uploading ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-sm text-gray-600">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-2"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {children || (
            <>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium text-blue-600">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {allowedTypes
                  .map((type) => type.split("/")[1].toUpperCase())
                  .join(", ")}{" "}
                up to {maxSize}MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ProfilePictureUpload - Specific component for profile pictures
 */
export const ProfilePictureUpload = ({
  userId,
  onUploadSuccess,
  onUploadError,
  currentImage = null,
}) => {
  return (
    <div className="space-y-4">
      {currentImage && (
        <div className="flex justify-center">
          <img
            src={currentImage}
            alt="Current profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
          />
        </div>
      )}

      <FileUpload
        type="profile"
        userId={userId}
        onUploadSuccess={onUploadSuccess}
        onUploadError={onUploadError}
        maxSize={5}
        allowedTypes={["image/jpeg", "image/png", "image/webp", "image/gif"]}
        className="max-w-sm mx-auto"
      >
        <p className="text-sm text-gray-600">Upload your profile picture</p>
      </FileUpload>
    </div>
  );
};

/**
 * LogoUpload - Specific component for company logos
 */
export const LogoUpload = ({
  logoType = "main-logo",
  onUploadSuccess,
  onUploadError,
  currentLogo = null,
}) => {
  return (
    <div className="space-y-4">
      {currentLogo && (
        <div className="flex justify-center">
          <img
            src={currentLogo}
            alt="Current logo"
            className="max-h-20 object-contain"
          />
        </div>
      )}

      <FileUpload
        type="logo"
        assetName={logoType}
        onUploadSuccess={onUploadSuccess}
        onUploadError={onUploadError}
        maxSize={10}
        allowedTypes={[
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/svg+xml",
          "image/gif",
        ]}
      >
        <p className="text-sm text-gray-600">
          Upload company logo (SVG, PNG, JPG)
        </p>
      </FileUpload>
    </div>
  );
};

/**
 * BrandingAssetUpload - Specific component for branding assets
 */
export const BrandingAssetUpload = ({
  assetName,
  onUploadSuccess,
  onUploadError,
}) => {
  return (
    <FileUpload
      type="branding"
      assetName={assetName}
      onUploadSuccess={onUploadSuccess}
      onUploadError={onUploadError}
      maxSize={20}
      allowedTypes={[
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
        "image/gif",
        "application/pdf",
      ]}
    >
      <p className="text-sm text-gray-600">
        Upload branding asset ({assetName})
      </p>
    </FileUpload>
  );
};

/**
 * Usage Example Component
 */
export const UploadExample = () => {
  const [uploadStatus, setUploadStatus] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);

  const handleSuccess = (data, type) => {
    setUploadStatus(`${type} uploaded successfully!`);

    if (type === "Profile") {
      setProfileImage(data.url);
    } else if (type === "Logo") {
      setLogoImage(data.url);
    }

    setTimeout(() => setUploadStatus(""), 3000);
  };

  const handleError = (error, type) => {
    setUploadStatus(`${type} upload failed: ${error}`);
    setTimeout(() => setUploadStatus(""), 5000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">File Upload Examples</h1>

      {uploadStatus && (
        <div
          className={`p-4 rounded-md ${
            uploadStatus.includes("failed")
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          {uploadStatus}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
          <ProfilePictureUpload
            userId="current-user-id" // Replace with actual user ID
            currentImage={profileImage}
            onUploadSuccess={(data) => handleSuccess(data, "Profile")}
            onUploadError={(error) => handleError(error, "Profile")}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Company Logo</h2>
          <LogoUpload
            logoType="main-logo"
            currentLogo={logoImage}
            onUploadSuccess={(data) => handleSuccess(data, "Logo")}
            onUploadError={(error) => handleError(error, "Logo")}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Banner Asset</h2>
          <BrandingAssetUpload
            assetName="header-banner"
            onUploadSuccess={(data) => handleSuccess(data, "Banner")}
            onUploadError={(error) => handleError(error, "Banner")}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Background Asset</h2>
          <BrandingAssetUpload
            assetName="login-background"
            onUploadSuccess={(data) => handleSuccess(data, "Background")}
            onUploadError={(error) => handleError(error, "Background")}
          />
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
