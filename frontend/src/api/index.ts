import authApi from "./auth";
import catalogoApi from "./catalogo";
import fornecedoresApi from "./fornecedores";
import produtosApi from "./produtos";
import sistemaApi from "./sistema";
import usuariosApi from "./usuarios";

export {
  authApi,
  catalogoApi,
  fornecedoresApi,
  produtosApi,
  sistemaApi,
  usuariosApi,
};

export default {
  auth: authApi,
  catalogo: catalogoApi,
  fornecedores: fornecedoresApi,
  produtos: produtosApi,
  sistema: sistemaApi,
  usuarios: usuariosApi,
};

