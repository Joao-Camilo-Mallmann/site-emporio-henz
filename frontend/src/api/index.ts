import authApi from "./auth";
import catalogoApi from "./catalogo";
import categoriasApi, { subtiposApi } from "./categorias";
import fornecedoresApi from "./fornecedores";
import listasApi from "./listas";
import produtosApi from "./produtos";
import sistemaApi from "./sistema";
import usuariosApi from "./usuarios";

export {
  authApi,
  catalogoApi,
  categoriasApi,
  subtiposApi,
  fornecedoresApi,
  listasApi,
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
  listas: listasApi,
  produtos: produtosApi,
  sistema: sistemaApi,
  usuarios: usuariosApi,
};

