import type { Vehicle, VehicleDocument, VehicleDocumentType, VehicleVerificationStatus } from '@/types';

export interface VehicleInput {
  brand: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  seatsCount: number;
}

export type VehicleUpdateInput = Partial<VehicleInput>;

export interface VehiclesService {
  getMyVehicles(): Promise<Vehicle[]>;
  createVehicle(input: VehicleInput): Promise<Vehicle>;
  updateVehicle(vehicleId: string, input: VehicleUpdateInput): Promise<Vehicle>;
  setDefaultVehicle(vehicleId: string): Promise<Vehicle>;
  deactivateVehicle(vehicleId: string): Promise<void>;
  uploadDocument(vehicleId: string, documentType: VehicleDocumentType, file: File): Promise<VehicleDocument>;
  getDocuments(vehicleId: string): Promise<VehicleDocument[]>;
  getVerificationStatus(vehicleId: string): Promise<VehicleVerificationStatus>;
}
