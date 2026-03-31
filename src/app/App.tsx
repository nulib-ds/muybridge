import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./App.css";
import "@annotorious/react/annotorious-react.css";
import { ViewerWorkbench } from "../viewer/components/ViewerWorkbench";
import { DEFAULT_INFO_URL } from "../config/iiif";
import { sanitizeIiifUrl } from "../lib/iiif";
import { FramesSidebar } from "../workbench/frames/FramesSidebar";
import { useAnnotationStore } from "../workbench/frames/useFrameList";
import { useIiifDimensions } from "../lib/useIiifDimensions";
import { annotationToFrame } from "../annotations/annotation-utils";
import type { FrameDescriptor } from "../workbench/frames/types";
import { FramePreviewPanel } from "../workbench/frames/FramePreviewPanel";
import { PlateSelector } from "../workbench/plates/PlateSelector";
import { defaultPlate, findPlateByInfoUrl, plateCatalog } from "../workbench/plates/plateCatalog";
import type { PlateEntry } from "../workbench/plates/types";

const INITIAL_INFO_URL = defaultPlate?.imageUri ?? DEFAULT_INFO_URL;

function App() {
  const [inputValue, setInputValue] = useState(INITIAL_INFO_URL);
  const [infoUrl, setInfoUrl] = useState(INITIAL_INFO_URL);
  const { annotations, addAnnotation, clearAnnotations } = useAnnotationStore(infoUrl);
  const { dimensions } = useIiifDimensions(infoUrl);
  const [animationDuration, setAnimationDuration] = useState(2);
  const activePlate = useMemo(() => findPlateByInfoUrl(infoUrl), [infoUrl]);

  const frames = useMemo<FrameDescriptor[]>(() => {
    if (!dimensions) {
      return [];
    }

    return annotations.flatMap((annotation, index) => {
      const frame = annotationToFrame(annotation, dimensions);
      if (!frame) {
        return [];
      }

      return [
        {
          id: frame.id ?? annotation.id ?? `frame-${index + 1}`,
          paneId: frame.paneId ?? annotation.id ?? `pane-${index + 1}`,
          order: index + 1,
          bounds: frame.bounds,
        },
      ];
    });
  }, [annotations, dimensions]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextUrl = sanitizeIiifUrl(inputValue);
    setInfoUrl(nextUrl);
  };

  const handlePlateSelect = (plate: PlateEntry) => {
    const nextUrl = sanitizeIiifUrl(plate.imageUri);
    setInputValue(nextUrl);
    setInfoUrl(nextUrl);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="plate-toolbar">
          <PlateSelector
            plates={plateCatalog}
            selectedInfoUrl={infoUrl}
            onSelect={handlePlateSelect}
          />
          {activePlate ? (
            <div className="plate-metadata-panel">
              <h2>{activePlate.label}</h2>
              <p>{activePlate.summary}</p>
              <ul>
                <li>
                  <strong>Date</strong>
                  <span>{activePlate.date}</span>
                </li>
                <li>
                  <strong>Medium</strong>
                  <span>{activePlate.medium}</span>
                </li>
                <li>
                  <strong>Homepage</strong>
                  <a href={activePlate.homepageId} target="_blank" rel="noreferrer">
                    {activePlate.homepageLabel || activePlate.homepageId}
                  </a>
                </li>
              </ul>
              {activePlate.metadata.length ? (
                <div className="plate-extra-metadata">
                  {activePlate.metadata.map((entry) => (
                    <div key={`${entry.label}-${entry.value}`}>
                      <strong>{entry.label}</strong>
                      <span>{entry.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="plate-metadata-panel">
              <h2>Select a plate</h2>
              <p>Choose a plate from the catalog to hydrate the viewer with stored frames.</p>
            </div>
          )}
        </div>
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
        <ViewerWorkbench
          infoUrl={infoUrl}
          annotations={annotations}
          onAnnotationAdd={addAnnotation}
        />
        <FramePreviewPanel
          frames={frames}
          infoUrl={infoUrl}
          durationSeconds={animationDuration}
          onDurationChange={setAnimationDuration}
        />
        <FramesSidebar frames={frames} infoUrl={infoUrl} onClear={clearAnnotations} />
      </main>
    </div>
  );
}

export default App;
