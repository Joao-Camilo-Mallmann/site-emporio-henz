import authApi from "./auth";
import produtosApi from "./produtos";
import sistemaApi from "./sistema";

export { authApi, produtosApi, sistemaApi };

export default {
  auth: authApi,
  produtos: produtosApi,
  sistema: sistemaApi,
};
