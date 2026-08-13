"use client";

import { useEffect, useState, useRef } from "react";
import { Notification } from "@/types/db";
import { BellIcon, CheckIcon } from "@/components/Icons";

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
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [role]);

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "relative",
          background: "rgba(30, 41, 59, 0.7)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "8px",
          padding: "0.5rem 0.65rem",
          cursor: "pointer",
          color: "#94a3b8",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
          transition: "all 0.2s ease",
        }}
        title="System Notifications"
      >
        <BellIcon size={18} className="text-slate-300" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#6366f1",
              color: "#ffffff",
              fontSize: "0.65rem",
              fontWeight: "700",
              borderRadius: "10px",
              padding: "0.15rem 0.4rem",
              lineHeight: "1",
              border: "2px solid #090d16",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: "340px",
            maxHeight: "420px",
            background: "#131b2e",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          className="animate-fade-in"
        >
          <div
            style={{
              padding: "0.85rem 1rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#0b1220",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#f8fafc" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{ fontSize: "0.7rem", background: "rgba(99, 102, 241, 0.2)", color: "#818cf8", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "600" }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6366f1",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <CheckIcon size={12} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                No notifications recorded.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkSingleRead(n.id)}
                  style={{
                    padding: "0.85rem 1rem",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    background: n.is_read ? "transparent" : "rgba(99, 102, 241, 0.06)",
                    borderLeft: n.is_read ? "none" : "3px solid #6366f1",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    transition: "background 0.15s ease",
                  }}
                >
                  <p style={{ color: n.is_read ? "#cbd5e1" : "#f8fafc", lineHeight: "1.4", marginBottom: "0.35rem", fontWeight: n.is_read ? "400" : "500" }}>
                    {n.message}
                  </p>
                  <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
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
