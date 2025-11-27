// src/components/sidebar/sidebar-realtime-bridge.tsx
"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAppState } from "@/lib/provider/state-provider";

export function SidebarRealtimeBridge() {
  const { dispatch } = useAppState();

  useEffect(() => {
    const socket = io({
      path: "/api/socket/io",
    });

    // 🔔 when any client updates a workspace logo, update state here
    socket.on("workspace-logo-updated", ({ workspaceId, logoUrl }) => {
      dispatch({
        type: "UPDATE_WORKSPACE",
        payload: { workspace: { logo: logoUrl }, workspaceId },
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  // This component doesn't render anything visible
  return null;
}
