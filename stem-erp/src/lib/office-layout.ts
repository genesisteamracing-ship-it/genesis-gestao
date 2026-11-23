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

export function deriveMemberStatus(
  tasks: OfficeTaskItemDTO[]
): OfficeMemberStatus {
  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  );
  if (inProgressTasks.some((task) => task.isOverdue)) {
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
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
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

export interface OfficeZoneLayout {
  id: OfficeZoneId;
  label: string;
  kind: "sector" | "briefing" | "lounge";
  deliveryGroup?: DeliveryGroup;
  x: number;
  y: number;
  width: number;
  height: number;
  memberCount: number;
  activeCount: number;
}

export interface OfficeMemberPlacement {
  member: OfficeMemberDTO;
  zoneId: OfficeZoneId;
  x: number;
  y: number;
}

export interface OfficeFloorplanLayout {
  zones: OfficeZoneLayout[];
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
}

export interface OfficeFilterCriteria {
  search: string;
  sector: DeliveryGroup | "ALL";
  status: OfficeMemberStatus | "ALL";
}

const LEFT_SECTORS: DeliveryGroup[] = [
  "ENGINEERING_CAD",
  "MANUFACTURING_CNC",
  "PIT_DISPLAY",
];

const RIGHT_SECTORS: DeliveryGroup[] = [
  "MARKETING_SPONSOR",
  "PROJECT_MANAGEMENT",
  "SOCIAL_PROJECT",
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

    if (!query) return true;

    const haystack = [
      member.name,
      member.jobTitle ?? "",
      member.deliveryGroup ? DELIVERY_GROUP_SHORT_LABELS[member.deliveryGroup] : "",
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

export function buildOfficeFloorplan(
  members: OfficeMemberDTO[]
): OfficeFloorplanLayout {
  const BAY_WIDTH = 440;
  const CENTER_WIDTH = 300;
  const GAP_X = 36;
  const GAP_Y = 28;
  const DESK_WIDTH = 196;
  const DESK_HEIGHT = 152;
  const BAY_PADDING_X = 18;
  const BAY_HEADER_H = 44;
  const BAY_PADDING_BOTTOM = 18;
  const DESK_GAP_X = 12;
  const DESK_GAP_Y = 14;

  const grouped = new Map<OfficeZoneId, OfficeMemberDTO[]>();
  for (const sector of [...LEFT_SECTORS, ...RIGHT_SECTORS]) {
    grouped.set(sector, []);
  }
  grouped.set("LOUNGE_CAFE", []);

  for (const member of members) {
    const targetZone: OfficeZoneId = member.deliveryGroup ?? "LOUNGE_CAFE";
    const list = grouped.get(targetZone) ?? [];
    list.push(member);
    grouped.set(targetZone, list);
  }

  const zones: OfficeZoneLayout[] = [];
  const placements: OfficeMemberPlacement[] = [];

  const placeColumn = (sectors: DeliveryGroup[], startX: number): number => {
    let cursorY = 24;

    for (const sector of sectors) {
      const bayMembers = grouped.get(sector) ?? [];
      const rows = Math.max(1, Math.ceil(bayMembers.length / 2));
      const height =
        BAY_HEADER_H +
        rows * DESK_HEIGHT +
        Math.max(0, rows - 1) * DESK_GAP_Y +
        BAY_PADDING_BOTTOM;

      const activeCount = bayMembers.filter(
        (m) => m.status === "WORKING" || m.status === "OVERDUE"
      ).length;

      zones.push({
        id: sector,
        label: DELIVERY_GROUP_SHORT_LABELS[sector],
        kind: "sector",
        deliveryGroup: sector,
        x: startX,
        y: cursorY,
        width: BAY_WIDTH,
        height,
        memberCount: bayMembers.length,
        activeCount,
      });

      bayMembers.forEach((member, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        placements.push({
          member,
          zoneId: sector,
          x: startX + BAY_PADDING_X + col * (DESK_WIDTH + DESK_GAP_X),
          y: cursorY + BAY_HEADER_H + row * (DESK_HEIGHT + DESK_GAP_Y),
        });
      });

      cursorY += height + GAP_Y;
    }

    return cursorY;
  };

  const leftX = 24;
  const centerX = leftX + BAY_WIDTH + GAP_X;
  const rightX = centerX + CENTER_WIDTH + GAP_X;

  const leftBottom = placeColumn(LEFT_SECTORS, leftX);
  const rightBottom = placeColumn(RIGHT_SECTORS, rightX);

  const totalActive = members.filter(
    (m) => m.status === "WORKING" || m.status === "OVERDUE"
  ).length;

  const briefingHeight = 250;
  zones.push({
    id: "BRIEFING_ROOM",
    label: "Sala de Briefing",
    kind: "briefing",
    x: centerX,
    y: 24,
    width: CENTER_WIDTH,
    height: briefingHeight,
    memberCount: members.length,
    activeCount: totalActive,
  });

  const loungeMembers = grouped.get("LOUNGE_CAFE") ?? [];
  const loungeRows = Math.max(1, loungeMembers.length);
  const loungeY = 24 + briefingHeight + GAP_Y;
  const loungeHeight = Math.max(
    260,
    BAY_HEADER_H +
      loungeRows * DESK_HEIGHT +
      Math.max(0, loungeRows - 1) * DESK_GAP_Y +
      BAY_PADDING_BOTTOM
  );

  zones.push({
    id: "LOUNGE_CAFE",
    label: "Lounge & Café",
    kind: "lounge",
    x: centerX,
    y: loungeY,
    width: CENTER_WIDTH,
    height: loungeHeight,
    memberCount: loungeMembers.length,
    activeCount: loungeMembers.filter(
      (m) => m.status === "WORKING" || m.status === "OVERDUE"
    ).length,
  });

  loungeMembers.forEach((member, idx) => {
    placements.push({
      member,
      zoneId: "LOUNGE_CAFE",
      x: centerX + Math.round((CENTER_WIDTH - DESK_WIDTH) / 2),
      y: loungeY + BAY_HEADER_H + idx * (DESK_HEIGHT + DESK_GAP_Y),
    });
  });

  const totalHeight = Math.max(leftBottom, rightBottom, loungeY + loungeHeight + 24);
  const totalWidth = rightX + BAY_WIDTH + 24;

  return {
    zones,
    placements,
    width: totalWidth,
    height: totalHeight,
  };
}
