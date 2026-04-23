import { fireEvent, render, screen } from "@testing-library/react";
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
  {
    id: "frame-2",
    paneId: "pane-2",
    order: 2,
    bounds: { x: 0.2, y: 0.1, width: 0.4, height: 0.6 },
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
  onFrameDelete: vi.fn(),
  onFrameReorder: vi.fn(),
};

function createDataTransfer() {
  const store: Record<string, string> = {};
  const types: string[] = [];
  return {
    setData: vi.fn((type: string, value: string) => {
      store[type] = value;
      if (!types.includes(type)) {
        types.push(type);
      }
    }),
    getData: vi.fn((type: string) => store[type] ?? ""),
    clearData: vi.fn(() => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
      types.splice(0, types.length);
    }),
    setDragImage: vi.fn(),
    dropEffect: "move",
    effectAllowed: "move",
    files: [] as unknown as FileList,
    items: [] as unknown as DataTransferItemList,
    types,
  } as DataTransfer;
}

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

  it("shows the exported GIF preview when a source is provided", async () => {
    render(
      <FramesSidebar
        {...baseProps}
        onExportGif={vi.fn()}
        canExportGif
        isExportingGif={false}
        gifPreviewSrc="/images/sample.gif"
      />,
    );

    expect(await screen.findByAltText(/latest gif export preview/i)).toHaveAttribute(
      "src",
      expect.stringContaining("/images/sample.gif"),
    );
  });

  it("allows deleting a frame via the delete button", async () => {
    const onFrameDelete = vi.fn();
    render(
      <FramesSidebar
        {...baseProps}
        onFrameDelete={onFrameDelete}
        hoveredAnnotationId="pane-1"
        onExportGif={vi.fn()}
        canExportGif
        isExportingGif={false}
      />,
    );

    const button = await screen.findByRole("button", { name: /delete frame 1/i });
    await userEvent.click(button);
    expect(onFrameDelete).toHaveBeenCalledWith("pane-1");
  });

  it("reorders frames via drag and drop", async () => {
    const onFrameReorder = vi.fn();
    render(
      <FramesSidebar
        {...baseProps}
        onFrameReorder={onFrameReorder}
        onExportGif={vi.fn()}
        canExportGif
        isExportingGif={false}
      />,
    );

    const secondFrameThumbnail = await screen.findByRole("img", { name: /frame 2/i });
    const sourceCard = secondFrameThumbnail.closest('[role="button"]');
    const dropZone = await screen.findByTestId("dropzone-before-pane-1");
    expect(sourceCard).not.toBeNull();
    expect(dropZone).not.toBeNull();
    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(sourceCard!, { dataTransfer });
    fireEvent.dragEnter(dropZone!, { dataTransfer });
    fireEvent.dragOver(dropZone!, { dataTransfer });
    fireEvent.drop(dropZone!, { dataTransfer });
    fireEvent.dragEnd(sourceCard!, { dataTransfer });

    expect(onFrameReorder).toHaveBeenCalledWith(["pane-2", "pane-1"]);
  });
});
