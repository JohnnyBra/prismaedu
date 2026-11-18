import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { DataProvider, useData } from './context/DataContext';
import AuthView from './views/AuthView';
import EscenaPrisma from './components/EscenaPrisma';
import TutorDashboard from './views/TutorDashboard';
import ParentDashboard from './views/ParentDashboard';
import StudentDashboard from './views/StudentDashboard';
import AdminDashboard from './views/AdminDashboard';
import { Role } from './types';

// Al volver con la sesión iniciada (por ejemplo, desde Aulas) se ve entera la entrada del
// prisma: la luz aparece, lo atraviesa y se abre en el arcoíris. Después, el panel.
const DURACION_INTRO_MS = 2100; // termina con el abanico de luz (.lp-abanico: 0,85 s + 1,1 s)

const IntroPrisma: React.FC = () => (
  <div className="min-h-screen min-h-[100dvh] mesh-auth flex flex-col items-center justify-center p-4 overflow-x-hidden" role="status" aria-label="Entrando en Prisma">
    <EscenaPrisma />
  </div>
);

const Main: React.FC = () => {
  const { currentUser, restoringSession } = useData();
  // Solo se hace la entrada si al abrir la página ya había sesión (no tras escribir el PIN)
  const [conIntro] = useState(restoringSession);
  const [introHecha, setIntroHecha] = useState(!conIntro);

  useEffect(() => {
    if (introHecha) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setIntroHecha(true), reducido ? 0 : DURACION_INTRO_MS);
    return () => clearTimeout(t);
  }, [introHecha]);

  if (restoringSession || !introHecha) {
    return <IntroPrisma />;
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