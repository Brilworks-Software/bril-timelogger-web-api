import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonGroup } from '@mui/material';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    // Update currentLang when i18n language changes
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const changeLanguage = async (lng: string) => {
    try {
      
      // Save the language preference to localStorage
      localStorage.setItem('language', lng);
      
      // Change the language
      await i18n.changeLanguage(lng);
      
      
      // Update the state to trigger re-render
      setCurrentLang(lng);

      // Force a re-render of the entire app
      window.location.reload();
    } catch (err) {
      console.error('Error changing language:', err);
    }
  };

  return (
    <ButtonGroup size="small" variant="outlined" aria-label="language switcher">
      <Button
        onClick={() => changeLanguage('en')}
        variant={currentLang === 'en' ? 'contained' : 'outlined'}
        sx={{ minWidth: '60px' }}
      >
        EN
      </Button>
      <Button
        onClick={() => changeLanguage('es')}
        variant={currentLang === 'es' ? 'contained' : 'outlined'}
        sx={{ minWidth: '60px' }}
      >
        ES
      </Button>
    </ButtonGroup>
  );
};

export default LanguageSwitcher; 