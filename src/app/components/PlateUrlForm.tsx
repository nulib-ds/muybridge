import { useState } from "react";
import type { FormEvent } from "react";
import { sanitizeIiifUrl } from "../../lib/iiif";

interface PlateUrlFormProps {
  initialValue?: string;
  onSubmit?: (infoUrl: string) => void;
}

export function PlateUrlForm({ initialValue = "", onSubmit }: PlateUrlFormProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextUrl = sanitizeIiifUrl(value);
    setValue(nextUrl);
    if (!nextUrl) {
      return;
    }
    onSubmit?.(nextUrl);
  };

  return (
    <form className="iiif-form" onSubmit={handleSubmit}>
      <label htmlFor="manualInfoUrl">Image URI</label>
      <div className="field-row">
        <input
          id="manualInfoUrl"
          name="manualInfoUrl"
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="https://example.org/iiif/<id>/info.json"
          required
        />
        <button type="submit">Load plate</button>
      </div>
    </form>
  );
}
