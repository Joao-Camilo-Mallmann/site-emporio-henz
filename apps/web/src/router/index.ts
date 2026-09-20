import HomeView from "@/views/HomeView.vue";
import EquipeLoginView from "@/views/auth/EquipeLoginView.vue";
import LoginView from "@/views/auth/LoginView.vue";
import RegisterView from "@/views/auth/RegisterView.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        title: "Empório Henz | Móveis Nobres e Alta Decoração",
      },
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: {
        title: "Acesse sua conta | Empório Henz",
      },
    },
    {
      path: "/cadastro",
      name: "cadastro",
      component: RegisterView,
      meta: {
        title: "Crie sua conta | Empório Henz",
      },
    },
    {
      path: "/equipe/login",
      name: "equipe-login",
      component: EquipeLoginView,
      meta: {
        title: "Portal da Equipe | Empório Henz",
      },
    },
  ],
});

router.afterEach((to) => {
  if (to.meta.title && typeof to.meta.title === "string") {
    document.title = to.meta.title;
  }
});

export default router;
