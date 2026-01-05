import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Autocomplete, TextField, CircularProgress, Modal, IconButton } from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import '../../css/globals.css';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation } from 'react-i18next';

interface UserSummary {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  accountNonLocked: boolean;
}

interface Screenshot {
  id: string;
  sessionId: string;
  userId: string;
  imageUrl: string;
  capturedAt: string;
  session: {
    startTime: string;
    endTime?: string;
    project?: {
      id: string;
      name: string;
    };
    task?: {
      id: string;
      name: string;
    };
  };
}

interface ScreenshotResponse {
  content: Screenshot[];
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

interface ScreenshotModalProps {
  open: boolean;
  onClose: () => void;
  screenshot: Screenshot | null;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  open,
  onClose,
  screenshot,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}) => {
  const { t } = useTranslation();

  if (!screenshot) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
      onPrev();
    } else if (e.key === 'ArrowRight' && hasNext && onNext) {
      onNext();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
      }}
      aria-label={t('userScreenshots.screenshotModal')}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
        role="dialog"
        aria-modal="true"
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
          aria-label={t('userScreenshots.closeModal')}
        >
          <CloseIcon />
        </IconButton>

        {hasPrev && (
          <IconButton
            onClick={onPrev}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
            aria-label={t('userScreenshots.previousScreenshot')}
          >
            <PrevIcon />
          </IconButton>
        )}

        {hasNext && (
          <IconButton
            onClick={onNext}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
            aria-label={t('userScreenshots.nextScreenshot')}
          >
            <NextIcon />
          </IconButton>
        )}

        <img
          src={screenshot.imageUrl}
          alt={t('userScreenshots.screenshotFrom', {
            time: screenshot.capturedAt
              ? format(parseISO(screenshot.capturedAt), 'HH:mm:ss')
              : t('userScreenshots.noTime'),
          })}
          style={{
            maxWidth: '100%',
            maxHeight: '90vh',
            objectFit: 'contain',
          }}
        />
      </div>
    </Modal>
  );
};

const AdminUserScreenshots: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedUserData, setSelectedUserData] = useState<UserSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async (query: string) => {
    if (query.length < 3) {
      setUsers([]);
      return;
    }

    try {
      setLoadingUsers(true);
      const response = await api.get<UserSummary[]>('/admin/users/search', {
        params: {
          query: query,
        },
      });
      setUsers(response.data);
    } catch (err) {
      showToast('Failed to fetch users', 'error');
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        fetchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchScreenshots = useCallback(async () => {
    if (!selectedUserData) {
      setScreenshots([]);
      setTotalElements(0);
      return;
    }
    try {
      setLoadingScreenshots(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
        username: selectedUserData.username,
      });
      if (selectedDate) {
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        params.append('startDate', dayStart.toISOString());
        params.append('endDate', dayEnd.toISOString());
      }
      const response = await api.get<ScreenshotResponse>(`/web/screenshots?${params.toString()}`);
      setScreenshots(response.data.content);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      showToast('Failed to fetch screenshots', 'error');
      console.error('Error fetching screenshots:', err);
    } finally {
      setLoadingScreenshots(false);
    }
  }, [selectedUserData, page, rowsPerPage, selectedDate, showToast]);

  useEffect(() => {
    if (selectedUserData) {
      fetchScreenshots();
    } else {
      setScreenshots([]);
      setTotalElements(0);
    }
  }, [fetchScreenshots]);

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="main-content">
      <h1>{t('userScreenshots.title')}</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ width: '70%' }}>
          <Autocomplete
            options={users}
            getOptionLabel={option => `${option.name} (${option.username})`}
            loading={loadingUsers}
            value={selectedUserData}
            onChange={(_, newValue) => {
              setSelectedUserData(newValue);
              setSelectedUser(newValue?.username || '');
            }}
            onInputChange={(_, newInputValue, reason) => {
              if (reason === 'input') {
                setSearchQuery(newInputValue);
              }
            }}
            renderInput={params => (
              <TextField
                {...params}
                label={t('userScreenshots.searchUser')}
                variant="outlined"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.length > 0) {
                    fetchUsers(searchQuery);
                  }
                }}
              />
            )}
            fullWidth
          />
        </div>
        <div style={{ width: '30%' }}>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            dateFormat="MMMM d, yyyy"
            className="input"
            placeholderText={t('userScreenshots.selectDate')}
            showPopperArrow={false}
            wrapperClassName="date-picker-wrapper"
          />
        </div>
      </div>
      <ScreenshotsContent
        loadingScreenshots={loadingScreenshots}
        screenshots={screenshots}
        selectedUser={selectedUser}
        page={page}
        rowsPerPage={rowsPerPage}
        totalElements={totalElements}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

const UserScreenshotsView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const fetchScreenshots = useCallback(async () => {
    if (!user) {
      setScreenshots([]);
      setTotalElements(0);
      return;
    }
    try {
      setLoadingScreenshots(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
        username: user.username,
      });
      if (selectedDate) {
        const dayStart = new Date(selectedDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        params.append('startDate', dayStart.toISOString());
        params.append('endDate', dayEnd.toISOString());
      }
      const response = await api.get<ScreenshotResponse>(`/web/screenshots?${params.toString()}`);
      setScreenshots(response.data.content);
      setTotalElements(response.data.totalElements);
    } catch (err) {
      console.error('Error fetching screenshots:', err);
    } finally {
      setLoadingScreenshots(false);
    }
  }, [user, page, rowsPerPage, selectedDate]);

  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div className="main-content">
      <h1>{t('userScreenshots.title')}</h1>
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-lg)' }}
      >
        <div style={{ width: '30%' }}>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => setSelectedDate(date)}
            dateFormat="MMMM d, yyyy"
            className="input"
            placeholderText={t('userScreenshots.selectDate')}
            showPopperArrow={false}
            wrapperClassName="date-picker-wrapper"
          />
        </div>
      </div>
      <ScreenshotsContent
        loadingScreenshots={loadingScreenshots}
        screenshots={screenshots}
        selectedUser={user?.username || ''}
        page={page}
        rowsPerPage={rowsPerPage}
        totalElements={totalElements}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

interface ScreenshotsContentProps {
  loadingScreenshots: boolean;
  screenshots: Screenshot[];
  selectedUser: string;
  page: number;
  rowsPerPage: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const ScreenshotsContent: React.FC<ScreenshotsContentProps> = ({
  loadingScreenshots,
  screenshots,
  selectedUser,
  page,
  rowsPerPage,
  totalElements,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const { t } = useTranslation();
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [currentSessionIndex, setCurrentSessionIndex] = useState<number>(0);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState<number>(0);

  const handleScreenshotClick = (
    screenshot: Screenshot,
    sessionIndex: number,
    screenshotIndex: number
  ) => {
    setSelectedScreenshot(screenshot);
    setCurrentSessionIndex(sessionIndex);
    setCurrentScreenshotIndex(screenshotIndex);
  };

  const handleNext = () => {
    const sessions = Object.entries(
      screenshots.reduce((acc: Record<string, Screenshot[]>, shot) => {
        if (!acc[shot.sessionId]) acc[shot.sessionId] = [];
        acc[shot.sessionId].push(shot);
        return acc;
      }, {})
    );

    const currentSession = sessions[currentSessionIndex];
    if (currentScreenshotIndex < currentSession[1].length - 1) {
      setCurrentScreenshotIndex(currentScreenshotIndex + 1);
      setSelectedScreenshot(currentSession[1][currentScreenshotIndex + 1]);
    } else if (currentSessionIndex < sessions.length - 1) {
      setCurrentSessionIndex(currentSessionIndex + 1);
      setCurrentScreenshotIndex(0);
      setSelectedScreenshot(sessions[currentSessionIndex + 1][1][0]);
    }
  };

  const handlePrev = () => {
    const sessions = Object.entries(
      screenshots.reduce((acc: Record<string, Screenshot[]>, shot) => {
        if (!acc[shot.sessionId]) acc[shot.sessionId] = [];
        acc[shot.sessionId].push(shot);
        return acc;
      }, {})
    );

    const currentSession = sessions[currentSessionIndex];
    if (currentScreenshotIndex > 0) {
      setCurrentScreenshotIndex(currentScreenshotIndex - 1);
      setSelectedScreenshot(currentSession[1][currentScreenshotIndex - 1]);
    } else if (currentSessionIndex > 0) {
      setCurrentSessionIndex(currentSessionIndex - 1);
      const prevSession = sessions[currentSessionIndex - 1][1];
      setCurrentScreenshotIndex(prevSession.length - 1);
      setSelectedScreenshot(prevSession[prevSession.length - 1]);
    }
  };

  if (loadingScreenshots) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (screenshots.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
        <p style={{ color: 'var(--color-text-light)' }}>
          {selectedUser ? t('userScreenshots.noScreenshotsFound') : t('userScreenshots.selectUser')}
        </p>
      </div>
    );
  }

  const sessions = Object.entries(
    screenshots.reduce((acc: Record<string, Screenshot[]>, shot) => {
      if (!acc[shot.sessionId]) acc[shot.sessionId] = [];
      acc[shot.sessionId].push(shot);
      return acc;
    }, {})
  );

  return (
    <>
      {sessions.map(([sessionId, sessionShots], sessionIndex) => {
        const firstShot = sessionShots[0];
        const sessionStartTime = firstShot?.session?.startTime;
        const sessionEndTime = firstShot?.session?.endTime;

        return (
          <div key={sessionId} style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--color-text-light)',
              }}
            >
              <p>
                {t('userScreenshots.session')} {sessionId} |{t('userScreenshots.start')}:{' '}
                {sessionStartTime ? format(parseISO(sessionStartTime), 'MMM d, yyyy HH:mm') : 'N/A'}{' '}
                |{t('userScreenshots.end')}:{' '}
                {sessionEndTime ? format(parseISO(sessionEndTime), 'MMM d, yyyy HH:mm') : 'N/A'}
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 'var(--spacing-md)',
              }}
            >
              {sessionShots.map((screenshot, screenshotIndex) => (
                <div key={screenshot.id}>
                  <div
                    className="card"
                    style={{
                      cursor: 'pointer',
                      height: '220px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: 'var(--spacing-sm)',
                      transition: 'transform 0.2s',
                    }}
                    onClick={() => handleScreenshotClick(screenshot, sessionIndex, screenshotIndex)}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                      {screenshot.imageUrl ? (
                        <img
                          src={screenshot.imageUrl}
                          alt={`Screenshot from ${screenshot.capturedAt ? format(parseISO(screenshot.capturedAt), 'HH:mm:ss') : 'No time'}`}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-lg)',
                          }}
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.style.cssText = `
                                position: absolute;
                                top: 0;
                                left: 0;
                                width: 100%;
                                height: 100%;
                                background-color: var(--color-background);
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                border-radius: var(--radius-lg);
                              `;
                              fallback.innerHTML = `
                                <svg style="width: 48px; height: 48px; color: var(--color-text-light); margin-bottom: var(--spacing-sm)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p style="color: var(--color-text-light)">${t('userScreenshots.imageNotAvailable')}</p>
                              `;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'var(--color-background)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-lg)',
                          }}
                        >
                          <svg
                            style={{
                              width: '48px',
                              height: '48px',
                              color: 'var(--color-text-light)',
                              marginBottom: 'var(--spacing-sm)',
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p style={{ color: 'var(--color-text-light)' }}>
                            {t('userScreenshots.noScreenshotAvailable')}
                          </p>
                        </div>
                      )}
                    </div>
                    <p
                      style={{
                        marginTop: 'var(--spacing-sm)',
                        color: 'var(--color-text-light)',
                        fontSize: 'var(--font-size-sm)',
                      }}
                    >
                      {screenshot.capturedAt
                        ? format(parseISO(screenshot.capturedAt), 'HH:mm:ss')
                        : 'No time'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <ScreenshotModal
        open={!!selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
        screenshot={selectedScreenshot}
        onNext={handleNext}
        onPrev={handlePrev}
        hasNext={
          currentSessionIndex < sessions.length - 1 ||
          (currentSessionIndex === sessions.length - 1 &&
            currentScreenshotIndex < sessions[currentSessionIndex][1].length - 1)
        }
        hasPrev={
          currentSessionIndex > 0 || (currentSessionIndex === 0 && currentScreenshotIndex > 0)
        }
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--spacing-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span>{t('userScreenshots.rowsPerPage')}:</span>
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
            {t('userScreenshots.previous')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= Math.ceil(totalElements / rowsPerPage) - 1}
          >
            {t('userScreenshots.next')}
          </button>
        </div>
      </div>
    </>
  );
};

const UserScreenshots: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return isAdmin ? <AdminUserScreenshots /> : <UserScreenshotsView />;
};

export default UserScreenshots;
