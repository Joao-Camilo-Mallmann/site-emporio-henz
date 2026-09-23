import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/auth/LoginView.vue";
import RegisterView from "@/views/auth/RegisterView.vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
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
      path: "/admin",
      name: "admin",
      component: () => import("@/views/admin/AdminDashboardView.vue"),
      meta: {
        title: "Painel Administrativo | Empório Henz",
        requiresAuth: true,
        roles: [2, 3],
      },
    },
    {
      path: "/sobre-a-loja",
      name: "sobre-a-loja",
      component: () => import("@/views/AboutView.vue"),
      meta: {
        title: "Sobre a Loja | Empório Henz",
      },
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const appStore = useAppStore();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiredRoles = to.meta.roles as number[] | undefined;

  // Se houver token salvo mas o usuário ainda não estiver no Pinia, aguarda carregamento
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchCurrentUser();
    } catch {
      // Falha ao obter usuário; fluxo abaixo cuidará da negação
    }
  }

  if (requiresAuth || requiredRoles) {
    // Visitante não autenticado tentando acessar rota restrita
    if (!authStore.isAuthenticated || !authStore.user) {
      return {
        path: "/login",
        query: { redirect: to.fullPath },
      };
    }

    // Usuário autenticado mas sem cargo autorizado (ex: Cliente tentando acessar /admin)
    if (requiredRoles && !requiredRoles.includes(authStore.user.role)) {
      appStore.showAlert(
        "Acesso negado: o Painel Administrativo é exclusivo para a equipe de colaboradores e gestores.",
        "warning",
      );
      return {
        path: "/",
      };
    }
  }
});

router.afterEach((to) => {
  if (to.meta.title && typeof to.meta.title === "string") {
    document.title = to.meta.title;
  }
});

export default router;
