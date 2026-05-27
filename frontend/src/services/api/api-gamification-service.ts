import { apiClient } from '../api-client';
import type { GamificationService, Badge, UserBadge } from '../contracts/gamification-service';

export const apiGamificationService: GamificationService = {
  getBadges: async () => {
    return apiClient.get<Badge[]>('/gamification/badges');
  },
  getMyBadges: async () => {
    return apiClient.get<UserBadge[]>('/gamification/my-badges');
  },
};
