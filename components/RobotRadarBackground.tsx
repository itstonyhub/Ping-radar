"use client";

import Image from "next/image";

export default function RobotRadarBackground() {
  // ===== ADJUSTABLE VARIABLES =====
  const robotScale = 50; // Robot size as % of viewport height (45-55)
  const radarX = 50; // Radar horizontal position in % relative to robot (0-100)
  const radarY = 23; // Radar vertical position in % relative to robot (0-100)
  // =================================

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Robot watermark - centered */}
      <div
        className="robot-watermark"
        style={{
          height: `${robotScale}vh`,
          width: `${robotScale}vh`,
        }}
      >
        <Image
          src="/logo.png"
          alt=""
          width={600}
          height={600}
          className="h-full w-full object-contain"
          priority
        />

        {/* Radar animation overlay - clipped to circular head */}
        <div
          className="radar-overlay"
          style={{
            left: `${radarX}%`,
            top: `${radarY}%`,
          }}
        >
          {/* Concentric rings */}
          <div className="radar-rings">
            <div className="radar-ring" style={{ width: "90%", height: "90%" }} />
            <div className="radar-ring" style={{ width: "70%", height: "70%" }} />
            <div className="radar-ring" style={{ width: "50%", height: "50%" }} />
            <div className="radar-ring" style={{ width: "30%", height: "30%" }} />
            <div className="radar-center-dot" />
          </div>

          {/* Rotating sweep wedge */}
          <div className="radar-sweep" />
        </div>
      </div>
    </div>
  );
}
