import type { DeliveryGroup } from "@prisma/client";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import type {
  OfficeMemberDTO,
  OfficeMemberStatus,
  OfficeTaskItemDTO,
  OfficeTaskRole,
} from "@/types/office";

const ROLE_PRIORITY: Record<OfficeTaskRole, number> = {
  R: 0,
  A: 1,
  C: 2,
  I: 3,
};

export function isTaskOverdueForMember(task: OfficeTaskItemDTO): boolean {
  return task.isOverdue && task.role === "R";
}

export function deriveMemberStatus(
  tasks: OfficeTaskItemDTO[]
): OfficeMemberStatus {
  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  );
  if (inProgressTasks.some((task) => isTaskOverdueForMember(task))) {
    return "OVERDUE";
  }
  if (inProgressTasks.length > 0) {
    return "WORKING";
  }
  return "IDLE";
}

export function pickPrimaryActiveTask(
  tasks: OfficeTaskItemDTO[]
): OfficeTaskItemDTO | null {
  const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS");
  if (inProgress.length === 0) return null;

  const sorted = [...inProgress].sort((a, b) => {
    const aOverdue = isTaskOverdueForMember(a);
    const bOverdue = isTaskOverdueForMember(b);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (ROLE_PRIORITY[a.role] !== ROLE_PRIORITY[b.role]) {
      return ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
    }
    return a.endDate.localeCompare(b.endDate);
  });

  return sorted[0] ?? null;
}

export type OfficeZoneId =
  | DeliveryGroup
  | "BRIEFING_ROOM"
  | "LOUNGE_CAFE";

export type OfficeWing = "north" | "south";

export type OfficeFloorStyle = "wood" | "tile" | "carpet" | "showroom";

export interface OfficeEmptySlot {
  x: number;
  y: number;
}

export interface OfficeZoneLayout {
  id: OfficeZoneId;
  label: string;
  kind: "sector" | "briefing" | "lounge";
  wing: OfficeWing;
  floorStyle: OfficeFloorStyle;
  deliveryGroup?: DeliveryGroup;
  x: number;
  y: number;
  width: number;
  height: number;
  doorOffsetX: number;
  doorWidth: number;
  memberCount: number;
  activeCount: number;
  overdueCount: number;
  emptyDeskSlots: OfficeEmptySlot[];
}

export interface OfficeCorridorLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  entranceWidth: number;
  doorPositionsX: number[];
}

export interface OfficeBuildingBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OfficeMemberPlacement {
  member: OfficeMemberDTO;
  zoneId: OfficeZoneId;
  x: number;
  y: number;
}

export interface OfficeFloorplanLayout {
  zones: OfficeZoneLayout[];
  corridor: OfficeCorridorLayout;
  building: OfficeBuildingBounds;
  placements: OfficeMemberPlacement[];
  width: number;
  height: number;
}

export type PixelHairStyle =
  | "short"
  | "spiky"
  | "bob"
  | "ponytail"
  | "curly"
  | "cap";

export type PixelSemanticTone =
  | "primary"
  | "success"
  | "warning"
  | "purple"
  | "magenta"
  | "peach"
  | "chart-4";

export interface PixelAvatarTraits {
  hairStyle: PixelHairStyle;
  hairTone: PixelSemanticTone;
  outfitTone: PixelSemanticTone;
  hasGlasses: boolean;
  hasBadgePin: boolean;
  hasHeadset: boolean;
}

export interface OfficeFilterCriteria {
  search: string;
  sector: DeliveryGroup | "ALL";
  status: OfficeMemberStatus | "ALL";
  role?: OfficeTaskRole | "ALL";
}

interface WingRoomSpec {
  id: OfficeZoneId;
  kind: "sector" | "briefing" | "lounge";
  label: string;
  floorStyle: OfficeFloorStyle;
  deliveryGroup?: DeliveryGroup;
}

const NORTH_WING_SPECS: WingRoomSpec[] = [
  {
    id: "BRIEFING_ROOM",
    kind: "briefing",
    label: "Recepção",
    floorStyle: "wood",
  },
  {
    id: "ENGINEERING_CAD",
    kind: "sector",
    label: DELIVERY_GROUP_SHORT_LABELS.ENGINEERING_CAD,
    floorStyle: "wood",
    deliveryGroup: "ENGINEERING_CAD",
  },
  {
    id: "MARKETING_SPONSOR",
    kind: "sector",
    label: DELIVERY_GROUP_SHORT_LABELS.MARKETING_SPONSOR,
    floorStyle: "wood",
    deliveryGroup: "MARKETING_SPONSOR",
  },
  {
    id: "PROJECT_MANAGEMENT",
    kind: "sector",
    label: DELIVERY_GROUP_SHORT_LABELS.PROJECT_MANAGEMENT,
    floorStyle: "wood",
    deliveryGroup: "PROJECT_MANAGEMENT",
  },
];

const SOUTH_WING_SPECS: WingRoomSpec[] = [
  {
    id: "LOUNGE_CAFE",
    kind: "lounge",
    label: "Copa & Lounge",
    floorStyle: "tile",
  },
  {
    id: "MANUFACTURING_CNC",
    kind: "sector",
    label: DELIVERY_GROUP_SHORT_LABELS.MANUFACTURING_CNC,
    floorStyle: "tile",
    deliveryGroup: "MANUFACTURING_CNC",
  },
  {
    id: "PIT_DISPLAY",
    kind: "sector",
    label: DELIVERY_GROUP_SHORT_LABELS.PIT_DISPLAY,
    floorStyle: "carpet",
    deliveryGroup: "PIT_DISPLAY",
  },
  {
    id: "SOCIAL_PROJECT",
    kind: "sector",
    label: DELIVERY_GROUP_SHORT_LABELS.SOCIAL_PROJECT,
    floorStyle: "wood",
    deliveryGroup: "SOCIAL_PROJECT",
  },
];

export const SECTOR_TONE_MAP: Record<DeliveryGroup, PixelSemanticTone> = {
  ENGINEERING_CAD: "primary",
  MANUFACTURING_CNC: "warning",
  PIT_DISPLAY: "purple",
  MARKETING_SPONSOR: "magenta",
  PROJECT_MANAGEMENT: "success",
  SOCIAL_PROJECT: "peach",
};

const HAIR_STYLES: PixelHairStyle[] = [
  "short",
  "spiky",
  "bob",
  "ponytail",
  "curly",
  "cap",
];

const HAIR_TONES: PixelSemanticTone[] = [
  "primary",
  "warning",
  "purple",
  "peach",
  "chart-4",
  "success",
];

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

export function getAvatarTraits(
  seed: string,
  deliveryGroup: DeliveryGroup | null
): PixelAvatarTraits {
  const h = hashString(seed);
  const hairStyle = HAIR_STYLES[h % HAIR_STYLES.length];
  const hairTone = HAIR_TONES[(h >> 3) % HAIR_TONES.length];
  const outfitTone = deliveryGroup
    ? SECTOR_TONE_MAP[deliveryGroup]
    : HAIR_TONES[(h >> 6) % HAIR_TONES.length];

  return {
    hairStyle,
    hairTone,
    outfitTone,
    hasGlasses: (h >> 9) % 3 === 0,
    hasBadgePin: (h >> 11) % 2 === 0,
    hasHeadset: (h >> 13) % 3 === 0,
  };
}

export function filterOfficeMembers(
  members: OfficeMemberDTO[],
  criteria: OfficeFilterCriteria
): OfficeMemberDTO[] {
  const query = criteria.search.trim().toLowerCase();

  return members.filter((member) => {
    if (criteria.sector !== "ALL" && member.deliveryGroup !== criteria.sector) {
      return false;
    }

    if (criteria.status !== "ALL" && member.status !== criteria.status) {
      return false;
    }

    if (criteria.role && criteria.role !== "ALL") {
      const hasMatchingRole =
        member.activeTask?.role === criteria.role ||
        member.tasks.some((t) => t.role === criteria.role);
      if (!hasMatchingRole) {
        return false;
      }
    }

    if (!query) return true;

    const haystack = [
      member.name,
      member.jobTitle ?? "",
      member.deliveryGroup
        ? DELIVERY_GROUP_SHORT_LABELS[member.deliveryGroup]
        : "",
      member.activeTask?.title ?? "",
      ...member.tasks.map((t) => t.title),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function getMemberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export interface OfficeSectorGroup {
  id: DeliveryGroup | "GENERAL";
  label: string;
  tone: PixelSemanticTone;
  members: OfficeMemberDTO[];
  activeCount: number;
  overdueCount: number;
  doneTasksCount: number;
  totalTasksCount: number;
  rolesPresent: OfficeTaskRole[];
}

export function groupMembersBySector(
  members: OfficeMemberDTO[]
): OfficeSectorGroup[] {
  const buckets = new Map<DeliveryGroup | "GENERAL", OfficeMemberDTO[]>();

  for (const member of members) {
    const key = member.deliveryGroup ?? "GENERAL";
    const list = buckets.get(key) ?? [];
    list.push(member);
    buckets.set(key, list);
  }

  const groups: OfficeSectorGroup[] = [];

  for (const [key, groupMembers] of buckets.entries()) {
    const sortedMembers = [...groupMembers].sort((a, b) => {
      const statusWeight: Record<OfficeMemberStatus, number> = {
        OVERDUE: 0,
        WORKING: 1,
        IDLE: 2,
      };
      if (statusWeight[a.status] !== statusWeight[b.status]) {
        return statusWeight[a.status] - statusWeight[b.status];
      }
      const roleA = a.activeTask ? ROLE_PRIORITY[a.activeTask.role] : 99;
      const roleB = b.activeTask ? ROLE_PRIORITY[b.activeTask.role] : 99;
      if (roleA !== roleB) {
        return roleA - roleB;
      }
      return a.name.localeCompare(b.name);
    });

    const uniqueTasks = new Map<string, { isDone: boolean }>();
    const rolesSet = new Set<OfficeTaskRole>();

    for (const m of sortedMembers) {
      if (m.activeTask) {
        rolesSet.add(m.activeTask.role);
      }
      for (const t of m.tasks) {
        rolesSet.add(t.role);
        if (!uniqueTasks.has(t.id)) {
          uniqueTasks.set(t.id, { isDone: t.status === "DONE" });
        }
      }
    }

    let doneTasksCount = 0;
    for (const item of uniqueTasks.values()) {
      if (item.isDone) doneTasksCount += 1;
    }

    const fallbackTotal = sortedMembers.reduce(
      (acc, m) => acc + m.activeTasksCount + m.todoTasksCount + m.doneTasksCount,
      0
    );
    const fallbackDone = sortedMembers.reduce(
      (acc, m) => acc + m.doneTasksCount,
      0
    );

    const totalTasksCount = Math.max(uniqueTasks.size, fallbackTotal);
    const resolvedDoneCount =
      uniqueTasks.size > 0
        ? Math.max(doneTasksCount, Math.min(totalTasksCount, fallbackDone))
        : fallbackDone;

    const rolesOrdered: OfficeTaskRole[] = (
      ["R", "A", "C", "I"] as const
    ).filter((r) => rolesSet.has(r));

    groups.push({
      id: key,
      label:
        key === "GENERAL" ? "Equipe Geral" : DELIVERY_GROUP_SHORT_LABELS[key],
      tone: key === "GENERAL" ? "chart-4" : SECTOR_TONE_MAP[key],
      members: sortedMembers,
      activeCount: sortedMembers.filter((m) => m.status !== "IDLE").length,
      overdueCount: sortedMembers.filter((m) => m.status === "OVERDUE").length,
      doneTasksCount: resolvedDoneCount,
      totalTasksCount,
      rolesPresent: rolesOrdered,
    });
  }

  return groups.sort((a, b) => {
    if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
    if (a.activeCount !== b.activeCount) return b.activeCount - a.activeCount;
    return a.label.localeCompare(b.label);
  });
}

export function buildOfficeFloorplan(
  members: OfficeMemberDTO[]
): OfficeFloorplanLayout {
  const EXTERIOR_MARGIN_X = 96;
  const EXTERIOR_MARGIN_Y = 80;
  const ROOM_WIDTH = 312;
  const MIN_ROOM_HEIGHT = 252;
  const CORRIDOR_HEIGHT = 86;
  const ENTRANCE_WIDTH = 44;

  const STATION_WIDTH = 136;
  const STATION_HEIGHT = 108;
  const STATION_GAP_X = 12;
  const STATION_GAP_Y = 16;
  const ROOM_SIDE_PADDING = Math.round(
    (ROOM_WIDTH - (STATION_WIDTH * 2 + STATION_GAP_X)) / 2
  );
  const NORTH_TOP_DECOR_H = 74;
  const NORTH_BOTTOM_PAD = 24;
  const SOUTH_TOP_PAD = 46;
  const SOUTH_BOTTOM_DECOR_H = 52;
  const DOOR_WIDTH = 56;

  const grouped = new Map<OfficeZoneId, OfficeMemberDTO[]>();
  for (const spec of [...NORTH_WING_SPECS, ...SOUTH_WING_SPECS]) {
    grouped.set(spec.id, []);
  }

  for (const member of members) {
    const targetZone: OfficeZoneId = member.deliveryGroup ?? "LOUNGE_CAFE";
    const list = grouped.get(targetZone) ?? [];
    list.push(member);
    grouped.set(targetZone, list);
  }

  const calcWingHeight = (specs: WingRoomSpec[], wing: OfficeWing): number => {
    let maxHeight = MIN_ROOM_HEIGHT;
    for (const spec of specs) {
      const roomMembers = grouped.get(spec.id) ?? [];
      if (roomMembers.length === 0) continue;
      const rows = Math.ceil(roomMembers.length / 2);
      const topPad = wing === "north" ? NORTH_TOP_DECOR_H : SOUTH_TOP_PAD;
      const bottomPad =
        wing === "north" ? NORTH_BOTTOM_PAD : SOUTH_BOTTOM_DECOR_H;
      const needed =
        topPad +
        rows * STATION_HEIGHT +
        Math.max(0, rows - 1) * STATION_GAP_Y +
        bottomPad;
      if (needed > maxHeight) {
        maxHeight = needed;
      }
    }
    return maxHeight;
  };

  const northHeight = calcWingHeight(NORTH_WING_SPECS, "north");
  const southHeight = calcWingHeight(SOUTH_WING_SPECS, "south");

  const buildingX = EXTERIOR_MARGIN_X + ENTRANCE_WIDTH;
  const buildingY = EXTERIOR_MARGIN_Y;
  const buildingWidth = NORTH_WING_SPECS.length * ROOM_WIDTH;
  const corridorY = buildingY + northHeight;
  const southWingY = corridorY + CORRIDOR_HEIGHT;
  const buildingHeight = northHeight + CORRIDOR_HEIGHT + southHeight;

  const totalActive = members.filter(
    (m) => m.status === "WORKING" || m.status === "OVERDUE"
  ).length;
  const totalOverdue = members.filter((m) => m.status === "OVERDUE").length;

  const zones: OfficeZoneLayout[] = [];
  const placements: OfficeMemberPlacement[] = [];
  const doorPositionsX: number[] = [];

  const buildWing = (
    specs: WingRoomSpec[],
    wing: OfficeWing,
    wingY: number,
    wingHeight: number
  ) => {
    specs.forEach((spec, index) => {
      const roomX = buildingX + index * ROOM_WIDTH;
      const roomMembers = grouped.get(spec.id) ?? [];
      const doorOffsetX = Math.round((ROOM_WIDTH - DOOR_WIDTH) / 2);
      doorPositionsX.push(roomX + doorOffsetX);

      const startStationY =
        wing === "north" ? NORTH_TOP_DECOR_H : SOUTH_TOP_PAD;

      roomMembers.forEach((member, mIdx) => {
        const col = mIdx % 2;
        const row = Math.floor(mIdx / 2);
        placements.push({
          member,
          zoneId: spec.id,
          x: roomX + ROOM_SIDE_PADDING + col * (STATION_WIDTH + STATION_GAP_X),
          y: wingY + startStationY + row * (STATION_HEIGHT + STATION_GAP_Y),
        });
      });

      const emptyDeskSlots: OfficeEmptySlot[] = [];
      if (spec.kind === "sector") {
        if (roomMembers.length === 0) {
          emptyDeskSlots.push(
            { x: ROOM_SIDE_PADDING, y: startStationY + 18 },
            {
              x: ROOM_SIDE_PADDING + STATION_WIDTH + STATION_GAP_X,
              y: startStationY + 18,
            }
          );
        } else if (roomMembers.length % 2 === 1) {
          const lastRow = Math.floor((roomMembers.length - 1) / 2);
          emptyDeskSlots.push({
            x: ROOM_SIDE_PADDING + STATION_WIDTH + STATION_GAP_X,
            y: startStationY + lastRow * (STATION_HEIGHT + STATION_GAP_Y) + 18,
          });
        }
      }

      const isBriefing = spec.kind === "briefing";
      const memberCount = isBriefing ? members.length : roomMembers.length;
      const activeCount = isBriefing
        ? totalActive
        : roomMembers.filter(
            (m) => m.status === "WORKING" || m.status === "OVERDUE"
          ).length;
      const overdueCount = isBriefing
        ? totalOverdue
        : roomMembers.filter((m) => m.status === "OVERDUE").length;

      zones.push({
        id: spec.id,
        label: spec.label,
        kind: spec.kind,
        wing,
        floorStyle: spec.floorStyle,
        deliveryGroup: spec.deliveryGroup,
        x: roomX,
        y: wingY,
        width: ROOM_WIDTH,
        height: wingHeight,
        doorOffsetX,
        doorWidth: DOOR_WIDTH,
        memberCount,
        activeCount,
        overdueCount,
        emptyDeskSlots,
      });
    });
  };

  buildWing(NORTH_WING_SPECS, "north", buildingY, northHeight);
  buildWing(SOUTH_WING_SPECS, "south", southWingY, southHeight);

  const uniqueDoors = Array.from(new Set(doorPositionsX)).sort((a, b) => a - b);

  return {
    zones,
    corridor: {
      x: buildingX,
      y: corridorY,
      width: buildingWidth,
      height: CORRIDOR_HEIGHT,
      entranceWidth: ENTRANCE_WIDTH,
      doorPositionsX: uniqueDoors,
    },
    building: {
      x: buildingX,
      y: buildingY,
      width: buildingWidth,
      height: buildingHeight,
    },
    placements,
    width: buildingX + buildingWidth + EXTERIOR_MARGIN_X,
    height: buildingY + buildingHeight + EXTERIOR_MARGIN_Y,
  };
}
