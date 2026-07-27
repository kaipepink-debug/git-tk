/**
 * @file use-toast.ts
 * @description Gerenciador de estado para o sistema de notificações (toasts) da interface.
 */

import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/** Limite máximo de toasts exibidos simultaneamente */
const TOAST_LIMIT = 1;
/** Atraso para remoção definitiva do toast após ser descartado */
const TOAST_REMOVE_DELAY = 1000000;

/**
 * @type ToasterToast
 * @description Extensão das propriedades básicas de um Toast com campos de identificação e conteúdo.
 */
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/** Tipos de ações disponíveis no reducer */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

/**
 * @function genId
 * @description Gera um ID numérico incremental para novos toasts.
 * @returns {string} O ID gerado em formato string.
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

/** Define a estrutura das ações disparadas para o reducer */
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

/** Estrutura do estado global dos toasts */
interface State {
  toasts: ToasterToast[];
}

/** Mapa para gerenciar os timers de remoção de cada toast */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * @function addToRemoveQueue
 * @description Adiciona um toast à fila de remoção após o delay configurado.
 * @param {string} toastId ID do toast a ser removido.
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * @function reducer
 * @description Reducer para gerenciar o estado dos toasts.
 * @param {State} state Estado atual.
 * @param {Action} action Ação a ser aplicada.
 * @returns {State} Novo estado.
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // Se um ID específico for passado, remove apenas ele, caso contrário remove todos
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

/** Lista de ouvintes que serão notificados em mudanças de estado */
const listeners: Array<(state: State) => void> = [];

/** Estado em memória compartilhado entre todos os hooks useToast */
let memoryState: State = { toasts: [] };

/**
 * @function dispatch
 * @description Atualiza o estado global e notifica todos os listeners.
 * @param {Action} action Ação a ser processada.
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/** Tipo simplificado para criação de um toast (sem ID) */
type Toast = Omit<ToasterToast, "id">;

/**
 * @function toast
 * @description Função imperativa para disparar uma nova notificação.
 * @param {Toast} props Propriedades da notificação.
 * @returns {object} Objeto com ID, função de descarte e função de atualização.
 */
function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * @hook useToast
 * @description Hook para acessar e manipular as notificações da interface.
 * @returns {object} Estado atual dos toasts e funções de controle.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    // Adiciona o setState da instância atual aos listeners globais
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
