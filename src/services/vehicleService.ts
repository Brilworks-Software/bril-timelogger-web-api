import api from './api';

export interface Vehicle {
  id: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  currentDriverId?: string;
}

export const getVehicles = async (): Promise<Vehicle[]> => {
  const response = await api.get<Vehicle[]>('/vehicles');
  return response.data;
};

export const getVehicleById = async (id: string): Promise<Vehicle> => {
  const response = await api.get<Vehicle>(`/vehicles/${id}`);
  return response.data;
};

export const createVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  const response = await api.post<Vehicle>('/vehicles', vehicle);
  return response.data;
};

export const updateVehicle = async (id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> => {
  const response = await api.put<Vehicle>(`/vehicles/${id}`, vehicle);
  return response.data;
};

export const deleteVehicle = async (id: string): Promise<void> => {
  await api.delete(`/vehicles/${id}`);
}; 