declare module '@headlessui/react' {
  import { ComponentType, ReactNode } from 'react';

  export interface DisclosureProps {
    as?: keyof JSX.IntrinsicElements;
    defaultOpen?: boolean;
    children: ReactNode;
    className?: string;
  }

  export interface MenuProps {
    as?: keyof JSX.IntrinsicElements;
    children: ReactNode;
    className?: string;
  }

  export const Disclosure: ComponentType<DisclosureProps> & {
    Button: ComponentType<any>;
    Panel: ComponentType<any>;
  };

  export const Menu: ComponentType<MenuProps> & {
    Button: ComponentType<any>;
    Items: ComponentType<any>;
    Item: ComponentType<any>;
  };
} 