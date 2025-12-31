import React, { useState, useMemo } from 'react';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { type DateRange, type DateRangeType } from '../../services/dashboardService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, isBefore } from 'date-fns';
import '../../css/globals.css';
import { useTranslation } from 'react-i18next';

const getDefaultRange = (type: DateRangeType): [Date, Date] => {
  const today = new Date();
  switch (type) {
    case 'day':
      return [today, today];
    case 'week':
      return [startOfWeek(today, { weekStartsOn: 1 }), endOfWeek(today, { weekStartsOn: 1 })];
    case 'month':
      return [startOfMonth(today), endOfMonth(today)];
    case 'custom':
      return [subDays(today, 1), today];
    default:
      return [today, today];
  }
};

const TimeTrackingSummaryDashboard: React.FC = () => {
  const [rangeType, setRangeType] = useState<DateRangeType>('day');
  const [[fromDate, toDate], setDateRange] = useState<[Date, Date]>(getDefaultRange('day'));
  const [dateError, setDateError] = useState<string>('');
  const { t } = useTranslation();

  React.useEffect(() => {
    if (isBefore(toDate, fromDate)) {
      setDateError('To date should not be less than from date');
    } else {
      setDateError('');
    }
  }, [fromDate, toDate]);

  const apiDateRange: DateRange = useMemo(() => {
    if (rangeType === 'day') {
      return { type: 'day', startDate: fromDate, endDate: fromDate };
    }
    if (rangeType === 'week') {
      return { type: 'week', startDate: fromDate, endDate: toDate };
    }
    if (rangeType === 'month') {
      return { type: 'month', startDate: fromDate, endDate: toDate };
    }
    return { type: 'custom', startDate: fromDate, endDate: toDate };
  }, [rangeType, fromDate, toDate]);

  const { data: stats } = useDashboardStats(apiDateRange);

  return (
    <div className="main-content">
      <h1>Time Tracking Summary</h1>
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div className="btn-group">
          <button
            className={`btn ${rangeType === 'day' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setRangeType('day');
              setDateRange([fromDate, fromDate]);
            }}
          >
            {t('reports.timeRange.day')}
          </button>
          <button
            className={`btn ${rangeType === 'week' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setRangeType('week');
              const today = new Date();
              setDateRange([
                startOfWeek(today, { weekStartsOn: 1 }),
                endOfWeek(today, { weekStartsOn: 1 }),
              ]);
            }}
          >
            {t('reports.timeRange.week')}
          </button>
          <button
            className={`btn ${rangeType === 'month' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setRangeType('month');
              const today = new Date();
              setDateRange([startOfMonth(today), endOfMonth(today)]);
            }}
          >
            {t('reports.timeRange.month')}
          </button>
          <button
            className={`btn ${rangeType === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setRangeType('custom');
              const today = new Date();
              setDateRange([subDays(today, 1), today]);
            }}
          >
            Custom
          </button>
        </div>

        {rangeType === 'day' ? (
          <DatePicker
            selected={fromDate}
            onChange={(date: Date | null) => {
              if (date) {
                setDateRange([date, date]);
              }
            }}
            maxDate={new Date()}
            dateFormat="MMMM d, yyyy"
            className="input"
            placeholderText="Select day"
            showPopperArrow={false}
          />
        ) : (
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <DatePicker
              selected={fromDate}
              onChange={(date: Date | null) => {
                if (date) {
                  setDateRange([date, toDate]);
                }
              }}
              maxDate={new Date()}
              dateFormat="MMMM d, yyyy"
              className="input"
              placeholderText="From date"
              showPopperArrow={false}
            />
            <DatePicker
              selected={toDate}
              onChange={(date: Date | null) => {
                if (date) {
                  setDateRange([fromDate, date]);
                }
              }}
              minDate={fromDate}
              maxDate={new Date()}
              dateFormat="MMMM d, yyyy"
              className="input"
              placeholderText="To date"
              showPopperArrow={false}
            />
          </div>
        )}

        {dateError && (
          <div className="badge badge-error" style={{ marginLeft: 'var(--spacing-md)' }}>
            {dateError}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <div
          className="card stat-card"
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-background)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.2s ease-in-out',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-sm)',
                background: 'rgba(37, 99, 235, 0.1)',
                borderRadius: 'var(--border-radius-md)',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3
              style={{
                color: 'var(--color-text-light)',
                margin: 0,
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Active Users
            </h3>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            {stats?.activeUsers || 0}
          </h2>
        </div>

        <div
          className="card stat-card"
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-background)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.2s ease-in-out',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-sm)',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: 'var(--border-radius-md)',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3
              style={{
                color: 'var(--color-text-light)',
                margin: 0,
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Total Hours Logged
            </h3>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            {stats?.totalHoursLogged ? stats.totalHoursLogged.toFixed(1) : '0.0'}
          </h2>
        </div>

        <div
          className="card stat-card"
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-background)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-md)',
            transition: 'transform 0.2s ease-in-out',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                padding: 'var(--spacing-sm)',
                background: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 'var(--border-radius-md)',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3
              style={{
                color: 'var(--color-text-light)',
                margin: 0,
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Activity Percentage
            </h3>
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 600,
              color: 'var(--color-text)',
            }}
          >
            {stats?.activityPercentage ? stats.activityPercentage.toFixed(1) : '0.0'}%
          </h2>
        </div>
      </div>
    </div>
  );
};

export default TimeTrackingSummaryDashboard;
