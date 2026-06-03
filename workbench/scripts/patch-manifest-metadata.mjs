#!/usr/bin/env node
/**
 * Patches Animal + Movement metadata into the 70 manifests that are missing them.
 * Never overwrites values that already exist.
 *
 * Usage: node workbench/scripts/patch-manifest-metadata.mjs
 *   (run from the repo root)
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iiifDir = resolve(__dirname, "../../assets/iiif");

// ---------------------------------------------------------------------------
// Approved mapping — all terms confirmed with user
// ---------------------------------------------------------------------------
const MAPPING = {
  // Human — domestic / water-jar series
  225: { animal: "Human",  movement: "Carrying"   },
  226: { animal: "Human",  movement: "Carrying"   },
  235: { animal: "Human",  movement: "Carrying"   },
  238: { animal: "Human",  movement: "Posing"     },
  247: { animal: "Human",  movement: "Sitting"    },
  254: { animal: "Human",  movement: "Kneeling"   },
  255: { animal: "Human",  movement: "Rising"     },
  262: { animal: "Human",  movement: "Rising"     },
  264: { animal: "Human",  movement: "Rising"     },
  304: { animal: "Human",  movement: "Throwing"   },
  // Human — bathing / toilet / domestic labour
  402: { animal: "Human",  movement: "Pouring"    },
  407: { animal: "Human",  movement: "Pouring"    },
  409: { animal: "Human",  movement: "Stepping"   },
  411: { animal: "Human",  movement: "Dressing"   },
  412: { animal: "Human",  movement: "Dressing"   },
  413: { animal: "Human",  movement: "Pouring"    },
  415: { animal: "Human",  movement: "Dressing"   },
  419: { animal: "Human",  movement: "Dressing"   },
  425: { animal: "Human",  movement: "Dressing"   },
  427: { animal: "Human",  movement: "Dressing"   },
  429: { animal: "Human",  movement: "Dressing"   },
  432: { animal: "Human",  movement: "Cleaning"   }, // new term — approved
  436: { animal: "Human",  movement: "Sweeping"   },
  440: { animal: "Human",  movement: "Spreading"  },
  442: { animal: "Human",  movement: "Stooping"   },
  448: { animal: "Human",  movement: "Descending" },
  450: { animal: "Human",  movement: "Drinking"   },
  452: { animal: "Human",  movement: "Drinking"   },
  453: { animal: "Human",  movement: "Carrying"   },
  482: { animal: "Human",  movement: "Running"    },
  493: { animal: "Human",  movement: "Rowing"     },
  500: { animal: "Human",  movement: "Various"    },
  526: { animal: "Human",  movement: "Various"    },
  528: { animal: "Human",  movement: "Various"    },
  // Human — pathological locomotion
  537: { animal: "Human",  movement: "Hopping"    },
  547: { animal: "Human",  movement: "Walking"    },
  551: { animal: "Human",  movement: "Walking"    },
  552: { animal: "Human",  movement: "Walking"    },
  554: { animal: "Human",  movement: "Walking"    },
  558: { animal: "Human",  movement: "Standing"   },
  560: { animal: "Human",  movement: "Walking"    },
  // Mule — new animal term, approved
  658: { animal: "Mule",   movement: "Kicking"    },
  659: { animal: "Mule",   movement: "Bucking"    },
  660: { animal: "Mule",   movement: "Performing" },
  661: { animal: "Mule",   movement: "Performing" },
  662: { animal: "Mule",   movement: "Performing" },
  664: { animal: "Mule",   movement: "Performing" },
  // Donkey — new animal term, approved (plates labelled "Ass")
  665: { animal: "Donkey", movement: "Walking"    },
  666: { animal: "Donkey", movement: "Walking"    },
  667: { animal: "Donkey", movement: "Walking"    },
  668: { animal: "Donkey", movement: "Ambling"    },
  // Ox — new animal term, approved
  669: { animal: "Ox",     movement: "Walking"    },
  670: { animal: "Ox",     movement: "Walking"    },
  671: { animal: "Ox",     movement: "Walking"    },
  672: { animal: "Ox",     movement: "Trotting"   },
  // Pig (Sow) — existing term
  675: { animal: "Pig",    movement: "Galloping"  },
  // Goat — existing term
  678: { animal: "Goat",   movement: "Trotting"   },
  // Dog — existing term
  703: { animal: "Dog",    movement: "Walking"    },
  704: { animal: "Dog",    movement: "Walking"    },
  708: { animal: "Dog",    movement: "Galloping"  },
  709: { animal: "Dog",    movement: "Galloping"  },
  711: { animal: "Dog",    movement: "Running"    },
  712: { animal: "Dog",    movement: "Jumping"    },
  // Cat — existing term
  717: { animal: "Cat",    movement: "Trotting"   },
  719: { animal: "Cat",    movement: "Galloping"  },
  720: { animal: "Cat",    movement: "Galloping"  },
  // Other animals — existing terms
  737: { animal: "Camel",   movement: "Walking"   },
  773: { animal: "Ostrich", movement: "Running"   },
  780: { animal: "Stork",   movement: "Flying"    },
  781: { animal: "Chicken", movement: "Running"   }, // new animal term, approved
};

// ---------------------------------------------------------------------------
// Build a lookup from plate number → filename
// ---------------------------------------------------------------------------
const files = readdirSync(iiifDir).filter(
  (f) => f.endsWith(".json") && f !== "collection.json"
);

const plateToFile = new Map();
for (const f of files) {
  const match = f.match(/^plate-number-(\d+)-/);
  if (match) plateToFile.set(parseInt(match[1], 10), f);
}

// ---------------------------------------------------------------------------
// Patch each manifest
// ---------------------------------------------------------------------------
function makeEntry(label, value) {
  return { label: { en: [label] }, value: { en: [value] } };
}

function getMeta(metadata, key) {
  return metadata.find((e) => e.label?.en?.[0] === key) ?? null;
}

let patched = 0;
let skipped = 0;

for (const [plate, { animal, movement }] of Object.entries(MAPPING)) {
  const plateNum = parseInt(plate, 10);
  const filename = plateToFile.get(plateNum);
  if (!filename) {
    console.warn(`  ⚠  Plate ${plateNum}: no manifest file found`);
    continue;
  }

  const filePath = resolve(iiifDir, filename);
  const manifest = JSON.parse(readFileSync(filePath, "utf8"));
  const metadata = manifest.metadata ?? [];

  const hasAnimal   = getMeta(metadata, "Animal");
  const hasMovement = getMeta(metadata, "Movement");

  if (hasAnimal && hasMovement) {
    skipped++;
    continue;
  }

  if (!hasAnimal)   metadata.push(makeEntry("Animal",   animal));
  if (!hasMovement) metadata.push(makeEntry("Movement", movement));

  manifest.metadata = metadata;
  writeFileSync(filePath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`  ✓  ${String(plateNum).padStart(3)}  ${animal} | ${movement}`);
  patched++;
}

console.log(`\nPatched ${patched} manifests, skipped ${skipped} (already had values).`);
