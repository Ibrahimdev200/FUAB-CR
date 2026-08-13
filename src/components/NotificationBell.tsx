"use client";

import { useEffect, useState, useRef } from "react";
import { Notification } from "@/types/db";

interface NotificationBellProps {
  role: "student" | "lecturer" | "management";
}

export default function NotificationBell({ role }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [role]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const res = await fetch(`/api/notifications?role=${role}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, markAllRead: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkSingleRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "8px",
          padding: "0.4rem 0.65rem",
          cursor: "pointer",
          fontSize: "1.1rem",
          color: "#f8fafc",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "#ef4444",
              color: "#ffffff",
              fontSize: "0.7rem",
              fontWeight: "800",
              borderRadius: "10px",
              padding: "0.1rem 0.4rem",
              lineHeight: "1",
              border: "2px solid #0f172a",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Popup */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: "320px",
            maxHeight: "400px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Dropdown Header */}
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#0f172a",
            }}
          >
            <h3 style={{ fontSize: "0.9rem", fontWeight: "700", color: "#f8fafc" }}>
              Notifications {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#60a5fa",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: "auto", flex: 1, padding: "0.5rem 0" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkSingleRead(n.id)}
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid #334155",
                    background: n.is_read ? "#1e293b" : "rgba(59, 130, 246, 0.08)",
                    borderLeft: n.is_read ? "none" : "3px solid #3b82f6",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                  }}
                >
                  <p style={{ color: "#f8fafc", lineHeight: "1.3", marginBottom: "0.3rem" }}>{n.message}</p>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                    {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
