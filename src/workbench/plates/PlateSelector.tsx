import { useMemo, useState } from "react";
import type { PlateEntry } from "./types";

interface PlateSelectorProps {
  plates: PlateEntry[];
  selectedInfoUrl?: string;
  onSelect?: (plate: PlateEntry) => void;
}

export function PlateSelector({ plates, selectedInfoUrl, onSelect }: PlateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPlate = useMemo(() => {
    if (!selectedInfoUrl) {
      return null;
    }
    return plates.find((plate) => plate.imageUri === selectedInfoUrl) ?? null;
  }, [plates, selectedInfoUrl]);

  const handleToggle = () => {
    if (!plates.length) {
      return;
    }
    setIsOpen((value) => !value);
  };

  const handleSelect = (plate: PlateEntry) => {
    onSelect?.(plate);
    setIsOpen(false);
  };

  return (
    <div className={`plate-picker${isOpen ? " open" : ""}`}>
      <button
        type="button"
        className="plate-picker-toggle"
        onClick={handleToggle}
        disabled={!plates.length}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select a plate from the catalog"
      >
        {selectedPlate ? (
          <>
            <div className="plate-picker-thumb">
              {selectedPlate.thumbnailUrl ? (
                <img src={selectedPlate.thumbnailUrl} alt="" aria-hidden="true" />
              ) : (
                <span>{selectedPlate.label.charAt(0)}</span>
              )}
            </div>
            <div className="plate-picker-labels">
              <strong>{selectedPlate.label}</strong>
              <span>{selectedPlate.summary}</span>
            </div>
          </>
        ) : (
          <span>Choose a plate</span>
        )}
      </button>
      {isOpen && (
        <ul className="plate-picker-dropdown" role="listbox">
          {plates.map((plate) => (
            <li key={plate.id}>
              <button
                type="button"
                className="plate-picker-option"
                onClick={() => handleSelect(plate)}
                role="option"
                aria-selected={selectedPlate?.id === plate.id}
              >
                <div className="plate-picker-thumb">
                  {plate.thumbnailUrl ? (
                    <img src={plate.thumbnailUrl} alt="" aria-hidden="true" />
                  ) : (
                    <span>{plate.label.charAt(0)}</span>
                  )}
                </div>
                <div className="plate-picker-labels">
                  <strong>{plate.label}</strong>
                  <span>{plate.summary}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
