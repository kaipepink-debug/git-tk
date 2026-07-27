/**
 * Rota: /
 * Propósito: Ponto de entrada da aplicação. Redireciona automaticamente o usuário
 * para a página principal do produto, que é o foco da single product store.
 */

import { Navigate } from "react-router-dom";

/**
 * Componente Index.
 * Apenas redireciona para a rota /produto.
 */
const Index = () => {
  return <Navigate to="/produto" replace />;
};

export default Index;
