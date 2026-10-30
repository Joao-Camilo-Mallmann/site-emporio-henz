<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { computed, watch } from "vue";

const props = defineProps<{
  password: string;
  confirmPassword: string;
}>();

// true quando a senha cumpre todos os requisitos e a confirmação coincide (v-model:valid)
const valid = defineModel<boolean>("valid", { default: false });

// Requisitos de Senha Segura
const criteria = computed(() => {
  const p = props.password || "";
  return [
    { id: "length", label: "Mínimo de 8 caracteres", met: p.length >= 8 },
    {
      id: "uppercase",
      label: "Pelo menos uma letra maiúscula (A-Z)",
      met: /[A-Z]/.test(p),
    },
    {
      id: "lowercase",
      label: "Pelo menos uma letra minúscula (a-z)",
      met: /[a-z]/.test(p),
    },
    {
      id: "number",
      label: "Pelo menos um número (0-9)",
      met: /[0-9]/.test(p),
    },
    {
      id: "special",
      label: "Pelo menos um caractere especial (!@#$%...)",
      met: /[^A-Za-z0-9]/.test(p),
    },
  ];
});

const score = computed(() => {
  if (!props.password) return 0;
  return criteria.value.filter((c) => c.met).length;
});

const passwordsMatch = computed(
  () => !!props.confirmPassword && props.password === props.confirmPassword,
);

watch(
  () => criteria.value.every((c) => c.met) && passwordsMatch.value,
  (isValid) => {
    valid.value = isValid;
  },
  { immediate: true },
);

const feedback = computed(() => {
  if (score.value === 0) {
    return {
      label: "",
      colorClass: "text-stone-400",
      barColor: "bg-stone-200",
    };
  }
  if (score.value <= 2) {
    return {
      label: "Senha Fraca",
      colorClass: "text-rose-600",
      barColor: "bg-rose-500",
    };
  }
  if (score.value <= 4) {
    return {
      label: "Senha Razoável",
      colorClass: "text-amber-600",
      barColor: "bg-amber-500",
    };
  }
  return {
    label: "Senha Forte e Segura",
    colorClass: "text-emerald-600",
    barColor: "bg-emerald-500",
  };
});
</script>

<template>
  <div class="p-3.5 rounded-lg bg-stone-50 border border-stone-200/80 space-y-3">
    <!-- Barra de Força da Senha -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between text-xs">
        <span class="font-medium text-stone-600 flex items-center gap-1.5">
          <Icon icon="mdi:shield-check-outline" class="w-3.5 h-3.5 text-stone-500" />
          Nível de Segurança:
        </span>
        <span class="font-semibold" :class="feedback.colorClass">
          {{ feedback.label || "Não definida" }}
        </span>
      </div>

      <!-- Medidor visual de 5 blocos -->
      <div class="grid grid-cols-5 gap-1.5 h-1.5 w-full">
        <div
          v-for="index in criteria.length"
          :key="index"
          class="rounded-full transition-all duration-300"
          :class="index <= score ? feedback.barColor : 'bg-stone-200'"
        ></div>
      </div>
    </div>

    <!-- Checklist de Critérios de Senha Segura -->
    <div>
      <span class="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-2">
        Requisitos para uma Senha Segura:
      </span>
      <ul class="space-y-1.5">
        <li
          v-for="criterion in criteria"
          :key="criterion.id"
          class="flex items-center gap-2 text-xs transition-colors duration-200"
          :class="criterion.met ? 'text-emerald-700 font-medium' : 'text-stone-500'"
        >
          <Icon
            :icon="
              criterion.met
                ? 'mdi:check-circle'
                : 'mdi:checkbox-blank-circle-outline'
            "
            class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
            :class="criterion.met ? 'text-emerald-600 scale-110' : 'text-stone-400'"
          />
          <span>{{ criterion.label }}</span>
        </li>
        <li
          class="flex items-center gap-2 text-xs transition-colors duration-200 pt-1.5 border-t border-stone-200/80"
          :class="passwordsMatch ? 'text-emerald-700 font-medium' : 'text-stone-500'"
        >
          <Icon
            :icon="
              passwordsMatch
                ? 'mdi:check-circle'
                : 'mdi:checkbox-blank-circle-outline'
            "
            class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
            :class="passwordsMatch ? 'text-emerald-600 scale-110' : 'text-stone-400'"
          />
          <span>A confirmação é igual à senha</span>
        </li>
      </ul>
    </div>
  </div>
</template>
