/**
 * Rota: * (Curinga)
 * Propósito: Página de erro 404. Exibida quando o usuário tenta acessar uma rota
 * que não existe no sistema.
 */

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

/**
 * Componente NotFound.
 * Registra o erro no console e oferece link de retorno à Home.
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log do erro para monitoramento interno
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
