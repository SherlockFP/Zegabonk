export type AssetStatus = "concept" | "prototype" | "production";
export type AssetFamily = "hero" | "enemy" | "boss" | "environment" | "vfx" | "ui";

export interface AssetRecord {
  id: string;
  family: AssetFamily;
  status: AssetStatus;
  source: string;
  runtimeUrl?: string;
  authoringFile?: string;
  lodTriangles?: readonly number[];
  materialSlots?: number;
  textureCount?: number;
  bones?: number;
  clips?: readonly string[];
  collider?: string;
  provenance: "project-original" | "procedural" | "external";
}

export const ASSET_MANIFEST: Readonly<Record<string, AssetRecord>> = {
  "ui.menu.keyart": {
    id: "ui.menu.keyart",
    family: "ui",
    status: "production",
    source: "assets/ui/menu-keyart-v3.png",
    runtimeUrl: "/assets/ui/menu-keyart-v3.avif",
    provenance: "project-original",
  },
  "hero.crown-runner.v1": {
    id: "hero.crown-runner.v1",
    family: "hero",
    status: "production",
    source: "assets/concepts/characters/hero-crownrunner-turnaround-v1.png",
    authoringFile: "v2/tools/create_crownfall_actors.py",
    runtimeUrl: "/assets/models/crown_runner_v2.glb",
    lodTriangles: [2524],
    materialSlots: 8,
    textureCount: 0,
    bones: 0,
    clips: [],
    collider: "capsule 0.55 x 1.65",
    provenance: "project-original",
  },
  "enemy.rattlecap.v1": {
    id: "enemy.rattlecap.v1",
    family: "enemy",
    status: "production",
    source: "assets/concepts/characters/enemy-rattlecap-runner-turnaround-v1.png",
    authoringFile: "v2/tools/create_crownfall_actors.py",
    runtimeUrl: "/assets/models/rattlecap_runner_v1.glb",
    lodTriangles: [950],
    materialSlots: 5,
    bones: 0,
    clips: [],
    collider: "capsule 0.5 x 1.1",
    provenance: "project-original",
  },
  "boss.king-grom.v1": {
    id: "boss.king-grom.v1",
    family: "boss",
    status: "production",
    source: "assets/concepts/characters/boss-king-grom-turnaround-v1.png",
    authoringFile: "v2/tools/create_crownfall_grom.py",
    runtimeUrl: "/assets/models/king_grom_v1.glb",
    lodTriangles: [1488],
    materialSlots: 5,
    bones: 0,
    clips: [],
    collider: "capsule 0.92 x 3.4",
    provenance: "project-original",
  },
  "environment.mosswatch-tower.v1": {
    id: "environment.mosswatch-tower.v1",
    family: "environment",
    status: "prototype",
    source: "assets/concepts/environment/mosswatch-runtime-kit-v2.png",
    authoringFile: "v2/tools/create_mosswatch_tower.py",
    runtimeUrl: "/assets/models/mosswatch_tower_v1.glb",
    lodTriangles: [2512],
    materialSlots: 4,
    collider: "decoration only",
    provenance: "project-original",
  },
  "environment.rift-scar-arch.v1": {
    id: "environment.rift-scar-arch.v1",
    family: "environment",
    status: "prototype",
    source: "assets/concepts/environment/rift-scar-runtime-kit-v1.png",
    authoringFile: "v2/tools/create_rift_scar_arch.py",
    runtimeUrl: "/assets/models/rift_scar_arch_v1.glb",
    lodTriangles: [1460],
    materialSlots: 3,
    collider: "decoration only",
    provenance: "project-original",
  },
  "environment.crown-ascent-spire.v1": {
    id: "environment.crown-ascent-spire.v1",
    family: "environment",
    status: "prototype",
    source: "assets/concepts/environment/crown-ascent-runtime-kit-v1.png",
    authoringFile: "v2/tools/create_crown_ascent_spire.py",
    runtimeUrl: "/assets/models/crown_ascent_spire_v1.glb",
    lodTriangles: [2232],
    materialSlots: 3,
    collider: "decoration only",
    provenance: "project-original",
  },
};

export function requireProductionAsset(id: string): AssetRecord {
  const asset = ASSET_MANIFEST[id];
  if (!asset) throw new Error(`Unknown asset manifest id: ${id}`);
  if (asset.status !== "production" || !asset.runtimeUrl) {
    throw new Error(`Asset is not approved for runtime: ${id} (${asset.status})`);
  }
  return asset;
}
