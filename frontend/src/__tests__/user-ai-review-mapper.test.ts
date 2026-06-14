import { mapApiUserToUser, type ApiUser } from '@/services/api/mappers';

const baseApiUser: ApiUser = {
  id: 'u-1',
  first_name: 'Elvin',
  last_name: 'Mammadov',
  phone: '+994501110001',
  rating: 4.9,
  total_rides: 3,
  created_at: '2026-01-01T00:00:00Z',
};

describe('mapApiUserToUser - AI review mapping', () => {
  it('returns undefined aiReview when field absent', () => {
    expect(mapApiUserToUser(baseApiUser).aiReview).toBeUndefined();
  });

  it('maps snake_case AI review to camelCase', () => {
    const user = mapApiUserToUser({
      ...baseApiUser,
      verification_ai_review: {
        recommendation: 'approve',
        confidence: 0.91,
        is_document: true,
        is_azerbaijani: true,
        document_type: 'drivers_license',
        extracted_name: 'Elvin Mammadov',
        expiry_date: '2030-01-01',
        name_matches_profile: true,
        is_expired: false,
        portrait_present: true,
        document_number_present: true,
        license_title_present: true,
        license_categories: ['B'],
        image_dimensions: { width: 800, height: 520 },
        image_geometry_plausible: true,
        visible_text: ['AZƏRBAYCAN', 'Sürücülük vəsiqəsi'],
        issues: [],
        model: 'meta/llama-3.2-11b-vision-instruct',
        reviewed_at: '2026-06-14T12:00:00Z',
      },
    });

    expect(user.aiReview).toEqual({
      recommendation: 'approve',
      confidence: 0.91,
      isDocument: true,
      isAzerbaijani: true,
      documentType: 'drivers_license',
      extractedName: 'Elvin Mammadov',
      expiryDate: '2030-01-01',
      nameMatchesProfile: true,
      isExpired: false,
      portraitPresent: true,
      documentNumberPresent: true,
      licenseTitlePresent: true,
      licenseCategories: ['B'],
      imageDimensions: { width: 800, height: 520 },
      imageGeometryPlausible: true,
      visibleText: ['AZƏRBAYCAN', 'Sürücülük vəsiqəsi'],
      issues: [],
      model: 'meta/llama-3.2-11b-vision-instruct',
      reviewedAt: '2026-06-14T12:00:00Z',
    });
  });

  it('coerces invalid recommendation to needs_review and defaults missing fields', () => {
    const user = mapApiUserToUser({
      ...baseApiUser,
      verification_ai_review: {
        recommendation: 'definitely_yes',
      },
    });

    expect(user.aiReview?.recommendation).toBe('needs_review');
    expect(user.aiReview?.confidence).toBe(0);
    expect(user.aiReview?.issues).toEqual([]);
  });

  it('downgrades legacy approve results that have no supporting evidence', () => {
    const user = mapApiUserToUser({
      ...baseApiUser,
      verification_ai_review: {
        recommendation: 'approve',
        confidence: 0.9,
        is_azerbaijani: true,
        document_type: 'drivers_license',
        extracted_name: 'Yusif Israfilov',
        name_matches_profile: true,
        is_expired: false,
        issues: [],
      },
    });

    expect(user.aiReview?.recommendation).toBe('needs_review');
    expect(user.aiReview?.confidence).toBe(0);
    expect(user.aiReview?.issues).toContain('insufficient_evidence');
  });
});
