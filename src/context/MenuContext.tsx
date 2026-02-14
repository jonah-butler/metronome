import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';
import type { MenuPageType } from './MenuContext.types';

export type MenuContextType = {
  currentPage: MenuPageType;
  setCurrentPage: Dispatch<SetStateAction<MenuPageType>>;
  showHeaderMenu: boolean;
};

export const MenuContext = createContext<MenuContextType | null>(null);
