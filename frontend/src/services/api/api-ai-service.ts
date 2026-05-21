import { apiClient } from '../api-client';

export interface PricingSuggestionRequest {
  origin: string;
  destination: string;
  departure_time: string;
}

export interface PricingSuggestionResponse {
  suggested_price: number;
  reasoning: string;
}

export const apiAiService = {
  getSmartPricingSuggestion: async (data: PricingSuggestionRequest) => {
    return apiClient.post<PricingSuggestionResponse>('/ai/pricing-suggestion', data);
  },
};
