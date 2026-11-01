import { apiClient } from '../api-client';
import { getCityCoordinates } from '@/lib/utils';

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

export interface SupportAssistantRequest {
  message: string;
  language?: string;
}

export interface SupportAssistantResponse {
  reply: string;
  should_handoff: boolean;
}

export const apiAiService = {
  getSmartPricingSuggestion: async (data: PricingSuggestionRequest) => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
      const origin = data.origin_coords ?? getCityCoordinates(data.origin);
      const destination = data.destination_coords ?? getCityCoordinates(data.destination);
      const km = origin && destination ? Math.round(111 * Math.hypot(origin.lat - destination.lat, (origin.lng - destination.lng) * Math.cos(origin.lat * Math.PI / 180))) : 120;
      return { suggested_price: Math.max(5, Math.round(km * 0.09)), reasoning: `Simulated estimate: ${km} km × 0.09 AZN per seat, rounded to whole AZN. No live AI or demand data.` };
    }
    return apiClient.post<PricingSuggestionResponse>('/ai/pricing-suggestion', data);
  },
  askSupportAssistant: async (data: SupportAssistantRequest) => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return { reply: 'This is a local portfolio demo. Explore rides, switch accounts, and reset data from the footer. For help with a booking, open its trip or chat.', should_handoff: false };
    return apiClient.post<SupportAssistantResponse>('/ai/support-assistant', data);
  },
  generateTripDescription: async (data: DescriptionGenerationRequest) => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return { description: `Shared ride from ${data.origin} to ${data.destination} at ${data.departure_time}. ${data.seats_total ?? 1} seats available in ${data.car_model || 'a comfortable car'}.` };
    return apiClient.post<DescriptionGenerationResponse>('/ai/generate-description', data);
  },
};
