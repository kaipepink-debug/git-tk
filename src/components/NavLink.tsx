import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Interface para as propriedades estendidas do NavLink compatível.
 */
interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  /** Classe CSS base */
  className?: string;
  /** Classe CSS aplicada quando o link está ativo */
  activeClassName?: string;
  /** Classe CSS aplicada quando o link está pendente */
  pendingClassName?: string;
}

/**
 * Componente NavLink customizado que estende o NavLink do react-router-dom.
 * Permite definir classes separadas para os estados ativo e pendente de forma mais declarativa.
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
