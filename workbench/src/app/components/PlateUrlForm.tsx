import { Button, Flex, Text, TextField } from "@radix-ui/themes";
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
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="2">
        <Text asChild size="2" weight="medium">
          <label htmlFor="manualInfoUrl">Image URI</label>
        </Text>
        <Flex gap="2" wrap="wrap">
          <TextField.Root
            id="manualInfoUrl"
            name="manualInfoUrl"
            type="url"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://example.org/iiif/<id>/info.json"
            required
            style={{ flex: "1 1 260px" }}
          />
          <Button type="submit" variant="soft">
            Load plate
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}
