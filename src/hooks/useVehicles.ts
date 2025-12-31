import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getVehicles, 
  getVehicleById, 
  createVehicle, 
  updateVehicle, 
  deleteVehicle,
  type Vehicle 
} from '../services/vehicleService';

export const useVehicles = () => {
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: getVehicles,
  });

  const { mutate: createVehicleMutation } = useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const { mutate: updateVehicleMutation } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) => 
      updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const { mutate: deleteVehicleMutation } = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  return {
    vehicles,
    isLoading,
    error,
    createVehicle: createVehicleMutation,
    updateVehicle: updateVehicleMutation,
    deleteVehicle: deleteVehicleMutation,
  };
};

export const useVehicle = (id: string) => {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => getVehicleById(id),
    enabled: !!id,
  });
}; 