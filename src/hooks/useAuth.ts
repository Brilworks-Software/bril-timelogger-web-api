import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, logout as logoutService, User } from '@/services/auth';

export const useAuth = () => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error('User not found');
        }
        return user;
      } catch (err) {
        console.error('Error fetching user:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 1,
    gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes
  });

  // Handle errors separately
  if (error) {
    console.error('Auth error:', error);
    showToast(t('common.unexpectedError'), 'error');
  }

  const logout = async () => {
    try {
      await logoutService();
      queryClient.clear(); // Clear all queries from cache
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
      showToast(t('common.unexpectedError'), 'error');
    }
  };

  return {
    user,
    loading: isLoading,
    logout,
    isAuthenticated: !!user,
  };
}; 