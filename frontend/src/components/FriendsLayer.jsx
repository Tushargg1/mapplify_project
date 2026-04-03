import React from "react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

export default function FriendsLayer({ members, userId }) {
  return (
    <>
      {members
        .map((member) => {
          if (!member?.userId) return null;

          const memberId = String(member.userId);
          if (!memberId || memberId === String(userId)) return null;

          const lat = Number(member.lat);
          const lng = Number(member.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

          const label = member.name || memberId;

          return (
            <AdvancedMarker key={memberId} position={{ lat, lng }} title={label}>
              <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-black shadow" />
            </AdvancedMarker>
          );
        })
        .filter(Boolean)}
    </>
  );
}
