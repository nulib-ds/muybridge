import { useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import "@annotorious/react/annotorious-react.css";
import { ViewerWorkbench } from "../viewer/components/ViewerWorkbench";
import { DEFAULT_INFO_URL } from "../config/iiif";
import { sanitizeIiifUrl } from "../lib/iiif";
import { FramesSidebar } from "../workbench/frames/FramesSidebar";
import { useFrameList } from "../workbench/frames/useFrameList";

function App() {
  const [inputValue, setInputValue] = useState(DEFAULT_INFO_URL);
  const [infoUrl, setInfoUrl] = useState(DEFAULT_INFO_URL);
  const { frames, addFrame, clearFrames } = useFrameList();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextUrl = sanitizeIiifUrl(inputValue);
    setInfoUrl(nextUrl);
    clearFrames();
  };

  const handleAddPlaceholderFrame = () => {
    addFrame({
      bounds: { x: 0.2, y: 0.2, width: 0.25, height: 0.25 },
      paneId: `pane-${frames.length + 1}`,
    });
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <form className="iiif-form" onSubmit={handleSubmit}>
          <label htmlFor="infoUrl">Image URI</label>
          <div className="field-row">
            <input
              id="infoUrl"
              name="infoUrl"
              type="url"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="https://example.org/iiif/<id>/info.json"
              required
            />
            <button type="submit">Load plate</button>
          </div>
        </form>
      </header>

      <main className="workspace">
        <ViewerWorkbench infoUrl={infoUrl} onFrameAdd={addFrame} />
        <FramesSidebar
          frames={frames}
          onAddMockFrame={handleAddPlaceholderFrame}
          onClear={clearFrames}
        />
      </main>
    </div>
  );
}

export default App;
