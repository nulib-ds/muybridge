import { Avatar, Button, Card, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import { useEffect, useMemo, useState } from "react";
import type { PlateEntry } from "./types";
import { useInView } from "../../lib/useInView";
import { usePlateChunkSource } from "./usePlateChunks";

const PAGE_SIZE = 10;

interface PlateSelectorProps {
  plates: PlateEntry[];
  selectedInfoUrl?: string;
  onSelect?: (plate: PlateEntry) => void;
}

export function PlateSelector({ plates, selectedInfoUrl, onSelect }: PlateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { entries: catalogEntries, loading: chunkLoading, error: chunkError, hasMore, ready, requestNextChunk } =
    usePlateChunkSource(isOpen);
  const [pageIndex, setPageIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const handleDialogToggle = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPageIndex(0);
      setSearchTerm("");
    }
  };
  useEffect(() => {
    if (!isOpen || !ready) {
      return;
    }
    const needed = (pageIndex + 1) * PAGE_SIZE;
    if (catalogEntries.length >= needed || (!hasMore && catalogEntries.length >= needed)) {
      return;
    }
    if (!chunkLoading && hasMore && catalogEntries.length < needed) {
      requestNextChunk();
    }
  }, [catalogEntries.length, chunkLoading, hasMore, isOpen, pageIndex, ready, requestNextChunk]);
  const normalizedFilter = searchTerm.trim().toLowerCase();
  useEffect(() => {
    if (!isOpen || !ready) {
      return;
    }
    if (!normalizedFilter) {
      return;
    }
    if (hasMore && !chunkLoading) {
      requestNextChunk();
    }
  }, [hasMore, chunkLoading, normalizedFilter, isOpen, ready, requestNextChunk]);
  const filteredEntries = useMemo(() => {
    if (!normalizedFilter) {
      return catalogEntries;
    }
    return catalogEntries.filter((entry) => entry.label.toLowerCase().includes(normalizedFilter));
  }, [catalogEntries, normalizedFilter]);
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
    <Dialog.Root open={isOpen} onOpenChange={handleDialogToggle}>
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
          <Dialog.Description />
          <Flex direction="column" gap="2" style={{ flex: 1 }}>
            <CatalogSearchField
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setPageIndex(0);
              }}
            />
            <Flex justify="space-between" align="center" gap="2">
              <Text size="1" color="gray">
                Page {pageIndex + 1}
              </Text>
              <Flex gap="2">
                <Button
                  variant="soft"
                  size="2"
                  type="button"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="soft"
                  size="2"
                  type="button"
                  disabled={(pageIndex + 1) * PAGE_SIZE >= filteredEntries.length && !hasMore}
                  onClick={() => {
                    const nextIndex = pageIndex + 1;
                    setPageIndex(nextIndex);
                    const needed = (nextIndex + 1) * PAGE_SIZE;
                    const poolSize = normalizedFilter ? filteredEntries.length : catalogEntries.length;
                    if (poolSize < needed && hasMore && !chunkLoading) {
                      requestNextChunk();
                    }
                  }}
                >
                  Next
                </Button>
              </Flex>
            </Flex>
            {!ready && !chunkError ? (
              <Text color="gray">Loading catalog…</Text>
            ) : null}
            {chunkError ? (
              <Text color="red">{chunkError.message}</Text>
            ) : null}
            {filteredEntries
              .slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE)
              .map((plate) => (
                <PlateCatalogItem
                  key={plate.id}
                  plate={plate}
                  selected={selectedPlate?.id === plate.id}
                  onSelect={handleSelect}
                />
              ))}
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

interface CatalogSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
}

function CatalogSearchField({ value, onChange }: CatalogSearchFieldProps) {
  if (!TextField?.Root || !TextField?.Input) {
    return (
      <input
        type="text"
        placeholder="Search by title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <TextField.Root>
      <TextField.Input
        placeholder="Search by title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </TextField.Root>
  );
}

interface PlateCatalogItemProps {
  plate: PlateEntry;
  selected: boolean;
  onSelect: (plate: PlateEntry) => void;
}

function PlateCatalogItem({ plate, selected, onSelect }: PlateCatalogItemProps) {
  const { ref, hasIntersected } = useInView<HTMLDivElement>({ rootMargin: "150px" });

  return (
    <div ref={ref}>
      <Card
        variant={selected ? "surface" : "classic"}
        size="2"
        style={{ height: "auto", padding: "0.5rem" }}
        asChild
      >
        <Dialog.Close asChild>
          <button
            type="button"
            className="plate-option-card"
            onClick={() => onSelect(plate)}
            data-selected={selected}
          >
            {hasIntersected ? (
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
            ) : (
              <Flex align="center" gap="1">
                <div className="plate-avatar-placeholder" />
                <Text color="gray" weight="medium" truncate>
                  {plate.label}
                </Text>
              </Flex>
            )}
          </button>
        </Dialog.Close>
      </Card>
    </div>
  );
}
