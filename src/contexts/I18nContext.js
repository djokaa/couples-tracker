import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

const translations = {
  en: {
    userProfile: 'User Profile',
    personalInformation: 'Personal Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    mobilePhone: 'Mobile Phone',
    editProfile: 'Edit Profile',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    settings: 'Settings',
    notifications: 'Notifications',
    emailNotifications: 'Email notifications',
    pushNotifications: 'Push notifications',
    appearance: 'Appearance',
    darkMode: 'Dark mode',
    preferences: 'Preferences',
    language: 'Language',
    timezone: 'Timezone',
    myPartner: 'My Partner',
    inviteYourPartner: 'Invite Your Partner',
    profileVisibleToPartners: 'Profile visible to partners',
  },
  es: {
    userProfile: 'Perfil de Usuario',
    personalInformation: 'Información Personal',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    mobilePhone: 'Teléfono móvil',
    editProfile: 'Editar Perfil',
    saveChanges: 'Guardar Cambios',
    cancel: 'Cancelar',
    settings: 'Ajustes',
    notifications: 'Notificaciones',
    emailNotifications: 'Notificaciones por correo',
    pushNotifications: 'Notificaciones push',
    appearance: 'Apariencia',
    darkMode: 'Modo oscuro',
    preferences: 'Preferencias',
    language: 'Idioma',
    timezone: 'Zona horaria',
    myPartner: 'Mi Pareja',
    inviteYourPartner: 'Invitar a tu pareja',
    profileVisibleToPartners: 'Perfil visible para la pareja',
  },
};

const I18nContext = createContext({ lang: 'en', t: (k) => k, setLanguage: () => {} });

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app:lang');
      if (saved && translations[saved]) setLang(saved);
    } catch {}
  }, []);

  const setLanguage = (l) => {
    if (!translations[l]) return;
    setLang(l);
    try { localStorage.setItem('app:lang', l); } catch {}
  };

  const value = useMemo(() => ({
    lang,
    setLanguage,
    t: (key) => translations[lang]?.[key] || translations.en[key] || key,
  }), [lang]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);







