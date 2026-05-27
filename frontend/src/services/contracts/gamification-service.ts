export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon_url: string | null;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  awarded_at: string;
}

export interface GamificationService {
  getBadges(): Promise<Badge[]>;
  getMyBadges(): Promise<UserBadge[]>;
}
