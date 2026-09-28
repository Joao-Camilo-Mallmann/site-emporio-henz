import authApi from "./auth";
import fornecedoresApi from "./fornecedores";
import produtosApi from "./produtos";
import sistemaApi from "./sistema";
import usuariosApi from "./usuarios";

export { authApi, fornecedoresApi, produtosApi, sistemaApi, usuariosApi };

export default {
  auth: authApi,
  fornecedores: fornecedoresApi,
  produtos: produtosApi,
  sistema: sistemaApi,
  usuarios: usuariosApi,
};
