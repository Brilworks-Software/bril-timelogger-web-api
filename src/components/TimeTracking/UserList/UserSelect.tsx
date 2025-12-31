import React from 'react';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface UserSelectProps {
  value?: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  className?: string;
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  disabled,
  className,
}) => {
  const { t } = useTranslation();

  // TODO: Replace with actual user data from API
  const users = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
  ];

  return (
    <FormControl className={className} size="small">
      <InputLabel id="user-select-label">{t('reports.selectUser')}</InputLabel>
      <Select
        labelId="user-select-label"
        value={value || ''}
        label={t('reports.selectUser')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <MenuItem value="">
          <em>{t('reports.allUsers')}</em>
        </MenuItem>
        {users.map((user) => (
          <MenuItem key={user.id} value={user.id}>
            {user.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default UserSelect; 