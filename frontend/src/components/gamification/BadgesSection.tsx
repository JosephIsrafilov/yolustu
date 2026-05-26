import React, { useEffect, useState } from 'react';
import { BadgeComponent } from './BadgeComponent';
import { apiClient } from '@/services/api-client';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';

interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  icon_url: string | null;
}

interface UserBadge {
  id: string;
  badge: Badge;
  awarded_at: string;
}

export const BadgesSection: React.FC = () => {
  const { currentUser, language } = useAppStore();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const BADGES_I18N = {
    az: { title: 'Nişanlar və Nailiyyətlər', noBadges: 'Hələ heç bir nişanınız yoxdur.' },
    ru: { title: 'Значки и достижения', noBadges: 'У вас пока нет значков.' },
    en: { title: 'Badges & Achievements', noBadges: 'You don\'t have any badges yet.' }
  };
  const copy = BADGES_I18N[language] || BADGES_I18N.en;

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [badgesRes, userBadgesRes] = await Promise.all([
          apiClient.get<Badge[]>('/gamification/badges'),
          apiClient.get<UserBadge[]>('/gamification/my-badges')
        ]);
        setAllBadges(badgesRes);
        setUserBadges(userBadgesRes);
      } catch (err) {
        console.error('Failed to load badges', err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      fetchBadges();
    }
  }, [currentUser]);

  if (!currentUser || loading) return null;

  return (
    <Card className="mb-6">
      <h3 className="font-bold text-text mb-4">{copy.title}</h3>
      {allBadges.length === 0 ? (
        <p className="text-sm text-text-muted">{copy.noBadges}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {allBadges.map((badge) => {
            const userBadge = userBadges.find((ub) => ub.badge.id === badge.id);
            return (
              <BadgeComponent
                key={badge.id}
                code={badge.code}
                name={badge.name}
                description={badge.description}
                icon_url={badge.icon_url || undefined}
                isUnlocked={!!userBadge}
                awardedAt={userBadge?.awarded_at}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
};
