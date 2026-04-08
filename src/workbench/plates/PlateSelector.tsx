import { Avatar, Button, Card, Dialog, Flex, Text } from "@radix-ui/themes";
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

  const handleSelect = (plate: PlateEntry) => {
    onSelect?.(plate);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <Button
          variant="surface"
          size="3"
          style={{ width: "100%", justifyContent: "flex-start" }}
          disabled={!plates.length}
        >
          {selectedPlate ? (
            <Flex align="center" gap="3" style={{ width: "100%" }}>
              <Avatar
                size="2"
                src={selectedPlate.thumbnailUrl ?? undefined}
                fallback={selectedPlate.label.charAt(0)}
                radius="none"
              />
              <Text weight="medium" truncate>
                {selectedPlate.label}
              </Text>
            </Flex>
          ) : (
            <Text>Choose a plate</Text>
          )}
        </Button>
      </Dialog.Trigger>
      <Dialog.Content
        size="4"
        style={{ width: "min(92vw, 1100px)", height: "80vh" }}
      >
        <Flex direction="column" gap="4" style={{ height: "100%" }}>
          <Flex justify="between" align="center" gap="3">
            <Dialog.Title>Select a plate</Dialog.Title>
            <Dialog.Close>
              <Button variant="ghost" color="gray">
                Close
              </Button>
            </Dialog.Close>
          </Flex>
          <Dialog.Description>
            Browse stored Muybridge plates and pick one to hydrate the viewer.
          </Dialog.Description>
          <Flex direction="column" gap="1" style={{ flex: 1, overflowY: "auto" }}>
            {plates.map((plate) => (
              <Card
                key={plate.id}
                variant={selectedPlate?.id === plate.id ? "surface" : "classic"}
                size="2"
                style={{ height: "auto", padding: "0.5rem" }}
                asChild
              >
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="plate-option-card"
                    onClick={() => handleSelect(plate)}
                    data-selected={selectedPlate?.id === plate.id}
                    >
                      <Flex direction="column" gap="1">
                        <Flex align="center" gap="1">
                          <Avatar
                            size="3"
                            src={plate.thumbnailUrl ?? undefined}
                            fallback={plate.label.charAt(0)}
                            radius="none"
                            style={{ width: "50px", height: "50px" }}
                          />
                          <Text weight="medium" truncate>
                            {plate.label}
                          </Text>
                        </Flex>
                      </Flex>
                    </button>
                </Dialog.Close>
              </Card>
            ))}
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
