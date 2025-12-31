import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import api from '../../services/api';
import '../../css/globals.css';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface Pause {
  startTime: string;
  endTime: string;
  duration: number;
  reason: string;
}

interface Session {
  sessionId: number;
  startTime: string;
  endTime: string;
  logoutReason: string;
  totalDuration: number;
  activeDuration: number;
  idleDuration: number;
  activityPercentage: number;
  pauses?: Pause[];
  project?: {
    id: string;
    name: string;
  } | null;
  task?: {
    id: string;
    name: string;
  } | null;
}

interface TimelineResponse {
  content: Session[];
  pageable: {
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
  };
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

interface UserSummary {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  accountNonLocked: boolean;
}

const safeParseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  try {
    return parseISO(dateStr);
  } catch (e) {
    console.error('Error parsing date:', e);
    return null;
  }
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
};

const TimelineContent: React.FC<{
  loadingSessions: boolean;
  timelineData: TimelineResponse | undefined;
  children: React.ReactNode;
}> = ({ loadingSessions, timelineData, children }) => {
  const { t } = useTranslation();

  if (loadingSessions) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!timelineData?.content || timelineData.content.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
        <p style={{ color: 'var(--color-text-light)' }}>{t('userActivity.noSessionsFound')}</p>
      </div>
    );
  }

  return <>{children}</>;
};

const AdminUserActivity: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserData, setSelectedUserData] = useState<UserSummary | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState<Date | null>(new Date());

  const { data: users = [], isLoading: usersLoading } = useQuery<UserSummary[]>({
    queryKey: ['user-activity-users', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 3) return [];
      const response = await api.get<UserSummary[]>('/admin/users/search', {
        params: { query: searchQuery },
      });
      return response.data;
    },
    enabled: searchQuery.length >= 3,
  });

  const { data: timelineData, isLoading: loadingSessions } = useQuery<TimelineResponse>({
    queryKey: ['user-timeline', selectedUserData?.username, page, rowsPerPage, startDate],
    queryFn: async () => {
      if (!selectedUserData) {
        return {
          content: [],
          totalElements: 0,
          pageable: {
            pageNumber: 0,
            pageSize: 0,
            sort: { empty: true, sorted: false, unsorted: true },
            offset: 0,
            paged: true,
            unpaged: false,
          },
          last: true,
          totalPages: 0,
          size: 0,
          number: 0,
          sort: { empty: true, sorted: false, unsorted: true },
          first: true,
          numberOfElements: 0,
          empty: true,
        };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
      });

      if (startDate) {
        const dayStart = new Date(startDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
        params.append('startDate', dayStart.toISOString());
        params.append('endDate', dayEnd.toISOString());
      }

      const response = await api.get<TimelineResponse>(
        `/web/activity/${selectedUserData.username}/timeline?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!selectedUserData,
  });

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="main-content">
      <h1>{t('userActivity.title')}</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ width: '70%' }}>
          <Autocomplete
            options={users}
            getOptionLabel={option => `${option.name} (${option.username})`}
            loading={usersLoading}
            value={selectedUserData}
            onChange={(_, newValue) => {
              setSelectedUserData(newValue);
            }}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === 'input') {
                setSearchQuery(newInputValue);
              }
            }}
            renderInput={params => (
              <TextField
                {...params}
                label={t('userActivity.searchUser')}
                variant="outlined"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                aria-label={t('userActivity.searchUser')}
                inputProps={{
                  ...params.inputProps,
                  'aria-label': t('userActivity.searchUser'),
                  'aria-describedby': 'user-search-description',
                }}
              />
            )}
            fullWidth
            aria-label={t('userActivity.searchUser')}
          />
          <span id="user-search-description" className="sr-only">
            {t('userActivity.searchUserDescription')}
          </span>
        </div>
        <div style={{ width: '30%' }}>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            dateFormat="MMMM d, yyyy"
            className="input"
            placeholderText={t('userActivity.selectDate')}
            showPopperArrow={false}
            wrapperClassName="date-picker-wrapper"
            aria-label={t('userActivity.selectDate')}
            aria-describedby="date-picker-description"
          />
          <span id="date-picker-description" className="sr-only">
            {t('userActivity.selectDateDescription')}
          </span>
        </div>
      </div>
      <TimelineContent loadingSessions={loadingSessions} timelineData={timelineData}>
        {timelineData && (
          <TimelineTable
            sessions={timelineData.content}
            page={page}
            rowsPerPage={rowsPerPage}
            totalElements={timelineData.totalElements}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TimelineContent>
    </div>
  );
};

const UserActivityView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState<Date | null>(new Date());

  const { data: timelineData, isLoading: loadingSessions } = useQuery<TimelineResponse>({
    queryKey: ['user-timeline', user?.username, page, rowsPerPage, startDate],
    queryFn: async () => {
      if (!user) {
        return {
          content: [],
          totalElements: 0,
          pageable: {
            pageNumber: 0,
            pageSize: 0,
            sort: { empty: true, sorted: false, unsorted: true },
            offset: 0,
            paged: true,
            unpaged: false,
          },
          last: true,
          totalPages: 0,
          size: 0,
          number: 0,
          sort: { empty: true, sorted: false, unsorted: true },
          first: true,
          numberOfElements: 0,
          empty: true,
        };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
      });

      if (startDate) {
        const dayStart = new Date(startDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
        params.append('startDate', dayStart.toISOString());
        params.append('endDate', dayEnd.toISOString());
      }

      const response = await api.get<TimelineResponse>(
        `/web/activity/${user.username}/timeline?${params.toString()}`
      );
      return response.data;
    },
    enabled: !!user,
  });

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="main-content">
      <h1>{t('userActivity.title')}</h1>
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-lg)' }}
      >
        <div style={{ width: '30%' }}>
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            dateFormat="MMMM d, yyyy"
            className="input"
            placeholderText={t('userActivity.selectDate')}
            showPopperArrow={false}
            wrapperClassName="date-picker-wrapper"
          />
        </div>
      </div>
      <TimelineContent loadingSessions={loadingSessions} timelineData={timelineData}>
        {timelineData && (
          <TimelineTable
            sessions={timelineData.content}
            page={page}
            rowsPerPage={rowsPerPage}
            totalElements={timelineData.totalElements}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TimelineContent>
    </div>
  );
};

interface TimelineTableProps {
  sessions: Session[];
  page: number;
  rowsPerPage: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const TimelineTable: React.FC<TimelineTableProps> = ({
  sessions,
  page,
  rowsPerPage,
  totalElements,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('userActivity.startTime')}</th>
              <th>{t('userActivity.endTime')}</th>
              <th>{t('userActivity.project', 'Project')}</th>
              <th>{t('userActivity.task', 'Task')}</th>
              <th>{t('userActivity.totalDuration')}</th>
              <th>{t('userActivity.activeDuration')}</th>
              <th>{t('userActivity.idleDuration')}</th>
              <th>{t('userActivity.activityPercentage')}</th>
              <th>{t('userActivity.logoutReason')}</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => {
              const sessionStartDate = safeParseDate(session.startTime);
              const sessionEndDate = safeParseDate(session.endTime);
              return (
                <React.Fragment key={session.sessionId}>
                  <tr>
                    <td>
                      {sessionStartDate ? format(sessionStartDate, 'yyyy-MM-dd HH:mm:ss') : '-'}
                    </td>
                    <td>{sessionEndDate ? format(sessionEndDate, 'yyyy-MM-dd HH:mm:ss') : '-'}</td>
                    <td>{session.project?.name || '-'}</td>
                    <td>{session.task?.name || '-'}</td>
                    <td>{session.totalDuration.toFixed(2)} min</td>
                    <td>{session.activeDuration.toFixed(2)} min</td>
                    <td>{session.idleDuration.toFixed(2)} min</td>
                    <td>{session.activityPercentage.toFixed(1)}%</td>
                    <td>{session.logoutReason || '-'}</td>
                  </tr>
                  {session.pauses?.length ? (
                    <tr className="pause-row">
                      <td colSpan={9}>
                        <div className="pause-details">
                          <strong>{t('userActivity.pauses')}:</strong>
                          <ul>
                            {session.pauses.map((pause, index) => {
                              const startDate = safeParseDate(pause.startTime);
                              const endDate = safeParseDate(pause.endTime);
                              const duration =
                                startDate && endDate
                                  ? Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
                                  : 0;
                              return (
                                <li key={index}>
                                  {startDate && endDate ? (
                                    <>
                                      {format(startDate, 'HH:mm:ss')} -{' '}
                                      {format(endDate, 'HH:mm:ss')}({formatDuration(duration)})
                                      {pause.reason && ` - ${pause.reason}`}
                                    </>
                                  ) : (
                                    <em>Process Interrupted: Unexpected Pause</em>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr className="pause-row">
                      <td colSpan={7}>
                        <div className="pause-details">
                          <em>{t('userActivity.noPauses')}</em>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--spacing-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span>{t('userActivity.rowsPerPage')}:</span>
          <select
            className="input"
            value={rowsPerPage}
            onChange={onRowsPerPageChange}
            style={{ width: 'auto' }}
          >
            {[10, 20, 30, 40].map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            {t('userActivity.previous')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= Math.ceil(totalElements / rowsPerPage) - 1}
          >
            {t('userActivity.next')}
          </button>
        </div>
      </div>
    </>
  );
};

const UserActivity: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return isAdmin ? <AdminUserActivity /> : <UserActivityView />;
};

export default UserActivity;
