import authApi from "./auth";
import catalogoApi from "./catalogo";
import categoriasApi, { subtiposApi } from "./categorias";
import fornecedoresApi from "./fornecedores";
import produtosApi from "./produtos";
import sistemaApi from "./sistema";
import usuariosApi from "./usuarios";

export {
  authApi,
  catalogoApi,
  categoriasApi,
  subtiposApi,
  fornecedoresApi,
  produtosApi,
  sistemaApi,
  usuariosApi,
};

export default {
  auth: authApi,
  catalogo: catalogoApi,
  categorias: categoriasApi,
  subtipos: subtiposApi,
  fornecedores: fornecedoresApi,
  produtos: produtosApi,
  sistema: sistemaApi,
  usuarios: usuariosApi,
};

