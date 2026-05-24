import { apiClient } from '../api-client';

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface PricingSuggestionRequest {
  origin: string;
  destination: string;
  departure_time: string;
  departure_date?: string;
  language?: string;
  origin_coords?: LocationCoords;
  destination_coords?: LocationCoords;
  car_model?: string;
  seats_total?: number;
}

export interface PricingSuggestionResponse {
  suggested_price: number;
  reasoning: string;
}

export interface DescriptionGenerationRequest {
  origin: string;
  destination: string;
  departure_time: string;
  departure_date?: string;
  car_model?: string;
  seats_total?: number;
  language?: string;
  preferences?: string[];
}

export interface DescriptionGenerationResponse {
  description: string;
}

export const apiAiService = {
  getSmartPricingSuggestion: async (data: PricingSuggestionRequest) => {
    return apiClient.post<PricingSuggestionResponse>('/ai/pricing-suggestion', data);
  },
  generateTripDescription: async (data: DescriptionGenerationRequest) => {
    return apiClient.post<DescriptionGenerationResponse>('/ai/generate-description', data);
  },
};
