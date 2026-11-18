import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider, useData } from './context/DataContext';
import AuthView from './views/AuthView';
import TutorDashboard from './views/TutorDashboard';
import ParentDashboard from './views/ParentDashboard';
import StudentDashboard from './views/StudentDashboard';
import AdminDashboard from './views/AdminDashboard';
import { Role } from './types';

// Pantalla tranquila mientras se recupera una sesión guardada (por ejemplo, al volver de Aulas):
// evita que asome la animación del login antes de entrar.
const RecuperandoSesion: React.FC = () => (
  <div className="min-h-screen min-h-[100dvh] mesh-auth flex items-center justify-center" role="status" aria-label="Cargando Prisma">
    <img src="/suite/escudo.png" alt="" className="h-16 w-auto opacity-0 animate-[fade-in_0.6s_ease-out_0.5s_forwards]" />
  </div>
);

const Main: React.FC = () => {
  const { currentUser, restoringSession } = useData();

  if (restoringSession) {
    return <RecuperandoSesion />;
  }

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
    <ThemeProvider>
      <DataProvider>
        <Main />
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;