import React, { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import Toast from "@/components/Toast";
import { NotificationContext } from "./NotificationContext";

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "success") => {
    const newItem = { message, type, id: Date.now() };
    setNotifications((prev) => [...prev, newItem]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ addNotification }), [addNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="fixed inset-0 pointer-events-none flex flex-col items-end gap-2 p-4 z-[9999]">
        {notifications.map((n) => (
          <Toast
            key={n.id}
            message={n.message}
            type={n.type}
            onClose={() => removeNotification(n.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
