import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { BrandingContext } from "./BrandingContext";
import { getBrandingSettings, getProfileSettings } from "../services/settingsService";

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    brandingName: "MedCure",
    companyLogo: "",
    logoUrl: "",
    brandColor: "#2563eb",
    accentColor: "#3b82f6",
    headerStyle: "modern",
    sidebarStyle: "minimal",
    systemDescription: "Pharmacy Management System",
  });

  const [profile, setProfile] = useState({
    profileName: "Admin User",
    profileEmail: "admin@medcure.com",
    profileRole: "Administrator",
    profileAvatar: "",
    profilePhone: "+63 912 345 6789",
    displayName: "Admin",
    userInitials: "AU",
  });

  const [loading, setLoading] = useState(true);

  const loadBrandingSettings = async () => {
    try {
      const [brandingResult, profileResult] = await Promise.all([
        getBrandingSettings(),
        getProfileSettings(),
      ]);

      if (brandingResult.success) {
        setBranding(brandingResult.data);
      }

      if (profileResult.success) {
        setProfile(profileResult.data);
      }
    } catch (error) {
      console.error("Error loading branding settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrandingSettings();
  }, []);

  const updateBranding = (newBranding) => {
    setBranding((prev) => ({ ...prev, ...newBranding }));
  };

  const updateProfile = (newProfile) => {
    setProfile((prev) => ({ ...prev, ...newProfile }));
  };

  const value = {
    branding,
    profile,
    loading,
    updateBranding,
    updateProfile,
    refreshSettings: loadBrandingSettings,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};

BrandingProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
