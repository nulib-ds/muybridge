import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FramesSidebar } from "../../../src/workbench/frames/FramesSidebar";
import type { FrameDescriptor } from "../../../src/workbench/frames/types";

const frames: FrameDescriptor[] = [
  {
    id: "frame-1",
    paneId: "pane-1",
    order: 1,
    bounds: { x: 0, y: 0, width: 0.5, height: 0.5 },
  },
];

const baseProps = {
  frames,
  infoUrl: "https://example.org/iiif/resource/info.json",
  durationSeconds: 2,
  onDurationChange: vi.fn(),
  onExportManifest: vi.fn(),
  canExportManifest: true,
  onClear: vi.fn(),
};

describe("FramesSidebar", () => {
  it("invokes the GIF export handler when enabled", async () => {
    const onExportGif = vi.fn();
    render(
      <FramesSidebar
        {...baseProps}
        onExportGif={onExportGif}
        canExportGif
        isExportingGif={false}
      />,
    );

    const button = await screen.findByRole("button", { name: /export animated gif/i });
    await userEvent.click(button);
    expect(onExportGif).toHaveBeenCalledTimes(1);
  });

  it("disables the GIF export button when the queue is empty", async () => {
    render(
      <FramesSidebar
        {...baseProps}
        frames={[]}
        onExportGif={vi.fn()}
        canExportGif={false}
        isExportingGif={false}
      />,
    );

    const button = await screen.findByRole("button", { name: /export animated gif/i });
    expect(button).toBeDisabled();
  });

  it("shows a loading label when a GIF export is running", async () => {
    render(
      <FramesSidebar
        {...baseProps}
        onExportGif={vi.fn()}
        canExportGif
        isExportingGif
      />,
    );

    expect(await screen.findByRole("button", { name: /exporting gif/i })).toBeDisabled();
  });

  it("renders an error message when provided", async () => {
    render(
      <FramesSidebar
        {...baseProps}
        onExportGif={vi.fn()}
        canExportGif
        isExportingGif={false}
        gifError="Something went wrong"
      />,
    );

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});
