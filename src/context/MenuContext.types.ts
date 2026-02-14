export const MenuPage = {
  Home: 'home',
  Metronome: 'metronome',
  Builder: 'builder',
} as const;

export const MenuPageDescription = {
  [MenuPage.Home]: {
    title: 'Home',
    description: '',
  },
  [MenuPage.Metronome]: {
    title: 'Metronome Sequencer',
    description: 'build timing foundating and discover poly rhythms',
  },
  [MenuPage.Builder]: {
    title: 'Rhythm Builder',
    description: 'build training sequences',
  },
};

export type MenuPageType = (typeof MenuPage)[keyof typeof MenuPage];
