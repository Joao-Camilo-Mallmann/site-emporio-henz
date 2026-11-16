import authApi from "./auth";
import catalogoApi from "./catalogo";
import categoriasApi, { subtiposApi } from "./categorias";
import atendimentoApi from "./atendimento";
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
  atendimentoApi,
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
  atendimento: atendimentoApi,
  fornecedores: fornecedoresApi,
  listas: listasApi,
  produtos: produtosApi,
  sistema: sistemaApi,
  usuarios: usuariosApi,
};

