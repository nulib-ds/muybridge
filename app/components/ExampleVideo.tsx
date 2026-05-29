import React from "react";

const VIDEO_SRC =
  "https://nulib-ds.github.io/muybridge/video/annotating-frames.mp4";
const GIF_SRC =
  "https://nulib-ds.github.io/muybridge/images/thumbnails/plate-number-743-guanaco-galloping.gif";

export default function ExampleVideo() {
  return (
    <div style={{position: "relative", width: "100%"}}>
      <video
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        style={{display: "block", margin: "0 auto"}}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: "20%",
          width: "250px",
          height: "100%",
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
            border: "5px solid black",
            borderRadius: "8px",
          }}
        />
      </div>
    </div>
  );
}
