import { useContext } from "react";
import { BrandingContext } from "../context/BrandingContext";

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return context;
};
