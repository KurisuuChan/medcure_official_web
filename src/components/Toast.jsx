import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { CheckCircle, X, AlertTriangle, Info, XCircle } from "lucide-react";

const TYPES = {
  success: {
    bg: "bg-green-50 border-green-200",
    textColor: "text-green-800",
    iconColor: "text-green-600",
    icon: CheckCircle,
  },
  error: {
    bg: "bg-red-50 border-red-200",
    textColor: "text-red-800",
    iconColor: "text-red-600",
    icon: XCircle,
  },
  warning: {
    bg: "bg-orange-50 border-orange-200",
    textColor: "text-orange-800",
    iconColor: "text-orange-600",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
    icon: Info,
  },
};

const Toast = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setVisible(true);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          setVisible(false);
          setTimeout(onClose, 300);
          clearInterval(progressInterval);
          return 0;
        }
        return prev - 100 / 350; // 3.5 seconds total
      });
    }, 10);

    return () => clearInterval(progressInterval);
  }, [message, type, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const cfg = TYPES[type] || TYPES.info;
  const IconComponent = cfg.icon;

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden bg-white border rounded-lg shadow-lg transition-all duration-300 ${
        cfg.bg
      } ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
      }`}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${cfg.iconColor}`}>
            <IconComponent size={20} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${cfg.textColor}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </p>
            <p
              className={`mt-1 text-sm ${cfg.textColor.replace("800", "700")}`}
            >
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`flex-shrink-0 p-1 rounded-full transition-colors ${cfg.textColor.replace(
              "800",
              "400"
            )} hover:${cfg.textColor.replace("800", "600")}`}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className={`h-full transition-all duration-100 ease-linear ${
            type === "success"
              ? "bg-green-500"
              : type === "error"
              ? "bg-red-500"
              : type === "warning"
              ? "bg-orange-500"
              : "bg-blue-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(Object.keys(TYPES)).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Toast;
