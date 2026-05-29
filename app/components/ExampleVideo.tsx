import React from "react";

const VIDEO_SRC =
  "https://nulib-ds.github.io/muybridge/video/annotating-frames.mp4";
const GIF_SRC =
  "https://nulib-ds.github.io/muybridge/images/thumbnails/plate-number-743-guanaco-galloping.gif";

export default function ExampleVideo() {
  return (
    <div>
      <div
        style={{
          position: "relative",
        }}
      >
        <video
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          style={{
            display: "block",
            margin: "0 auto",
            opacity: 0.8,
            maskImage:
              "linear-gradient(to right, black calc(100% - 50vh), transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-50px",
            right: "50px",
            width: "30vw",
            height: "30vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={GIF_SRC}
            alt="Plate 743. Guanaco galloping."
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: "25px",
              boxShadow: "0 14px 18px rgba(0, 0, 0, 0.2)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
