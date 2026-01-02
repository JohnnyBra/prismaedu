import React from 'react';
import { DataProvider, useData } from './context/DataContext';
import AuthView from './views/AuthView';
import TutorDashboard from './views/TutorDashboard';
import ParentDashboard from './views/ParentDashboard';
import StudentDashboard from './views/StudentDashboard';
import AdminDashboard from './views/AdminDashboard';
import { Role } from './types';

const Main: React.FC = () => {
  const { currentUser } = useData();

  if (!currentUser) {
    return <AuthView />;
  }

  switch (currentUser.role) {
    case Role.ADMIN:
    case Role.DIRECCION:
    case Role.TESORERIA:
      return <AdminDashboard />;
    case Role.TUTOR:
      return <TutorDashboard />;
    case Role.PARENT:
      return <ParentDashboard />;
    case Role.STUDENT:
      return <StudentDashboard />;
    default:
      return <AuthView />;
  }
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <Main />
    </DataProvider>
  );
};

export default App;