import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TablePagination,
  TableSortLabel,
  Chip
} from '@mui/material';
import api from '../../services/api';
import '../../css/globals.css';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/contexts/ToastContext';

interface UserActivity {
  username: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'PAUSED' | 'OFFLINE';
  totalHours: number;
  activityPercentage: number;
}

interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

interface ActivityResponse {
  content: UserActivity[];
  pageable: Pageable;
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

type SortOrder = 'asc' | 'desc';
type SortField = 'userName' | 'email' | 'status' | 'totalHours' | 'activityPercentage';
type StatusColor = 'success' | 'warning' | 'error' | 'default';

const UserList: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('userName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [totalElements, setTotalElements] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
        sort: `${sortField},${sortOrder}`
      });

      if (searchTerm) {
        params.append('searchTerm', searchTerm);
      }
      if (status) {
        params.append('status', status);
      }

      const response = await api.get<ActivityResponse>(`/admin/activity/summary?${params.toString()}`);
      setUsers(response.data.content);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      showToast(t('userList.error'), 'error');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, sortField, sortOrder, searchTerm, status, t, showToast]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (field: SortField) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const getStatusColor = (status: string): StatusColor => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'OFFLINE':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        {t('userList.activity')}
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          label={t('userList.search')}
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('userList.searchPlaceholder', 'Search by name or email')}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('userList.status')}</InputLabel>
          <Select
            value={status}
            label={t('userList.status')}
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="">{t('userList.all')}</MenuItem>
            <MenuItem value="ACTIVE">{t('userList.active')}</MenuItem>
            <MenuItem value="PAUSED">{t('userList.paused')}</MenuItem>
            <MenuItem value="OFFLINE">{t('userList.offline')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'userName'}
                  direction={sortField === 'userName' ? sortOrder : 'asc'}
                  onClick={() => handleSort('userName')}
                >
                  {t('userList.name')}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t('userList.email')}</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortOrder : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  {t('userList.status')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'totalHours'}
                  direction={sortField === 'totalHours' ? sortOrder : 'asc'}
                  onClick={() => handleSort('totalHours')}
                >
                  {t('userList.totalHours')}
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'activityPercentage'}
                  direction={sortField === 'activityPercentage' ? sortOrder : 'asc'}
                  onClick={() => handleSort('activityPercentage')}
                >
                  {t('userList.activityPercentage')}
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.username}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(`userList.${user.status.toLowerCase()}`)}
                      color={getStatusColor(user.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{user.totalHours.toFixed(1)}</TableCell>
                  <TableCell align="right">{user.activityPercentage.toFixed(1)}%</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {t('userList.noUsersFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default UserList; 