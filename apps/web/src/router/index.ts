import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { UserRole } from "@/types";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/auth/LoginView.vue";
import RegisterView from "@/views/auth/RegisterView.vue";
import { createRouter, createWebHistory, RouterView } from "vue-router";

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
      component: RouterView,
      meta: {
        requiresAuth: true,
        roles: [UserRole.Vendedor, UserRole.Administrador],
      },
      children: [
        {
          path: "",
          name: "admin",
          component: () => import("@/views/admin/AdminDashboardView.vue"),
          meta: {
            title: "Painel Administrativo | Empório Henz",
            requiresAuth: true,
            roles: [UserRole.Vendedor, UserRole.Administrador],
          },
        },

        // CRUD Fornecedores (List, New, Edit)
        {
          path: "fornecedores",
          name: "admin-fornecedores",
          component: () =>
            import("@/views/admin/fornecedores/FornecedorListView.vue"),
          meta: {
            title: "Gestão de Fornecedores | Empório Henz",
            requiresAuth: true,
            roles: [UserRole.Administrador],
          },
        },
        {
          path: "fornecedores/novo",
          name: "admin-fornecedores-novo",
          component: () =>
            import("@/views/admin/fornecedores/FornecedorNewView.vue"),
          meta: {
            title: "Novo Fornecedor | Empório Henz",
            requiresAuth: true,
            roles: [UserRole.Administrador],
          },
        },
        {
          path: "fornecedores/:id/editar",
          name: "admin-fornecedores-editar",
          component: () =>
            import("@/views/admin/fornecedores/FornecedorEditView.vue"),
          meta: {
            title: "Editar Fornecedor | Empório Henz",
            requiresAuth: true,
            roles: [UserRole.Administrador],
          },
        },

        // CRUD Usuários (List, New, Edit)
        {
          path: "usuarios",
          name: "admin-usuarios",
          component: () =>
            import("@/views/admin/usuarios/UsuarioListView.vue"),
          meta: {
            title: "Gestão de Usuários & Clientes | Empório Henz",
            requiresAuth: true,
            roles: [UserRole.Administrador],
          },
        },
        {
          path: "usuarios/novo",
          name: "admin-usuarios-novo",
          component: () =>
            import("@/views/admin/usuarios/UsuarioNewView.vue"),
          meta: {
            title: "Novo Usuário | Empório Henz",
            requiresAuth: true,
            roles: [UserRole.Administrador],
          },
        },
        {
          path: "usuarios/:id/editar",
          name: "admin-usuarios-editar",
          component: () =>
            import("@/views/admin/usuarios/UsuarioEditView.vue"),
          meta: {
            title: "Editar Usuário | Empório Henz",
            requiresAuth: true,
            roles: [UserRole.Administrador],
          },
        },
      ],
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

    // Usuário autenticado mas sem cargo autorizado (ex: Cliente tentando acessar /admin ou Vendedor tentando acessar fornecedores/usuarios)
    if (requiredRoles && !requiredRoles.includes(authStore.user.role)) {
      if (authStore.user.role === UserRole.Vendedor) {
        appStore.showAlert(
          "Acesso restrito: este módulo requer permissões de Administrador.",
          "warning",
        );
        return {
          path: "/admin",
        };
      }

      appStore.showAlert(
        "Acesso negado: a área administrativa é exclusiva para a equipe autorizada.",
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
