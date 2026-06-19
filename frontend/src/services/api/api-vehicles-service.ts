import { apiClient } from '@/services/api-client';
import type {
  VehicleInput,
  VehiclesService,
  VehicleUpdateInput,
} from '@/services/contracts/vehicles-service';
import {
  mapApiVehicleToVehicle,
  mapApiVehicleDocumentToVehicleDocument,
  mapApiVerificationStatus,
  type ApiVehicle,
  type ApiVehicleDocument,
  type ApiVehicleVerificationStatus,
} from '@/services/api/mappers';
import type { VehicleDocumentType } from '@/types';

function mapVehicleInput(input: VehicleUpdateInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (input.brand !== undefined) payload.brand = input.brand;
  if (input.model !== undefined) payload.model = input.model;
  if (input.year !== undefined) payload.year = input.year;
  if (input.color !== undefined) payload.color = input.color;
  if (input.plateNumber !== undefined) payload.plate_number = input.plateNumber;
  if (input.seatsCount !== undefined) payload.seats_count = input.seatsCount;

  return payload;
}

export const apiVehiclesService: VehiclesService = {
  async getMyVehicles() {
    const response = await apiClient.get<ApiVehicle[]>('/vehicles/my');
    return response.map(mapApiVehicleToVehicle);
  },

  async createVehicle(input: VehicleInput) {
    const response = await apiClient.post<ApiVehicle>('/vehicles', mapVehicleInput(input));
    return mapApiVehicleToVehicle(response);
  },

  async updateVehicle(vehicleId: string, input: VehicleUpdateInput) {
    const response = await apiClient.patch<ApiVehicle>(
      `/vehicles/${vehicleId}`,
      mapVehicleInput(input),
    );
    return mapApiVehicleToVehicle(response);
  },

  async setDefaultVehicle(vehicleId: string) {
    const response = await apiClient.post<ApiVehicle>(`/vehicles/${vehicleId}/set-default`);
    return mapApiVehicleToVehicle(response);
  },

  async deactivateVehicle(vehicleId: string) {
    await apiClient.delete(`/vehicles/${vehicleId}`);
  },

  async uploadDocument(vehicleId: string, documentType: VehicleDocumentType, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.postForm<ApiVehicleDocument>(
      `/vehicles/${vehicleId}/documents?document_type=${documentType}`,
      formData,
    );
    return mapApiVehicleDocumentToVehicleDocument(response);
  },

  async getDocuments(vehicleId: string) {
    const response = await apiClient.get<ApiVehicleDocument[]>(`/vehicles/${vehicleId}/documents`);
    return response.map(mapApiVehicleDocumentToVehicleDocument);
  },

  async getVerificationStatus(vehicleId: string) {
    const response = await apiClient.get<ApiVehicleVerificationStatus>(
      `/vehicles/${vehicleId}/verification`,
    );
    return mapApiVerificationStatus(response);
  },
};
