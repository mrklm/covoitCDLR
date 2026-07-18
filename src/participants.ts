export type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  color: string;
};

// Les champs prévus restent centralisés ici pour faciliter les futures évolutions
// comme le rôle conducteur/passager, les horaires, les places et les remarques.
export const participants: Participant[] = [
  {
    id: 'camille-martin',
    firstName: 'Camille',
    lastName: 'Martin',
    city: 'Lille',
    latitude: 50.6292,
    longitude: 3.0573,
    phone: '06 00 00 00 01',
    color: '#2f6f8f',
  },
  {
    id: 'nora-bernard',
    firstName: 'Nora',
    lastName: 'Bernard',
    city: 'Rennes',
    latitude: 48.1173,
    longitude: -1.6778,
    phone: '06 00 00 00 02',
    color: '#8b5d33',
  },
  {
    id: 'hugo-petit',
    firstName: 'Hugo',
    lastName: 'Petit',
    city: 'Bordeaux',
    latitude: 44.8378,
    longitude: -0.5792,
    phone: '06 00 00 00 03',
    color: '#5d7c2f',
  },
  {
    id: 'ines-moreau',
    firstName: 'Ines',
    lastName: 'Moreau',
    city: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4442,
    phone: '06 00 00 00 04',
    color: '#9a4f63',
  },
  {
    id: 'lucas-dubois',
    firstName: 'Lucas',
    lastName: 'Dubois',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    phone: '06 00 00 00 05',
    color: '#4864a8',
  },
  {
    id: 'lea-roux',
    firstName: 'Lea',
    lastName: 'Roux',
    city: 'Nice',
    latitude: 43.7102,
    longitude: 7.262,
    phone: '06 00 00 00 06',
    color: '#7b6aa8',
  },
  {
    id: 'adam-fournier',
    firstName: 'Adam',
    lastName: 'Fournier',
    city: 'Strasbourg',
    latitude: 48.5734,
    longitude: 7.7521,
    phone: '06 00 00 00 07',
    color: '#b16a38',
  },
  {
    id: 'manon-girard',
    firstName: 'Manon',
    lastName: 'Girard',
    city: 'Nantes',
    latitude: 47.2184,
    longitude: -1.5536,
    phone: '06 00 00 00 08',
    color: '#3e8a64',
  },
  {
    id: 'ethan-leroy',
    firstName: 'Ethan',
    lastName: 'Leroy',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    phone: '06 00 00 00 09',
    color: '#7d6b34',
  },
  {
    id: 'sarah-simon',
    firstName: 'Sarah',
    lastName: 'Simon',
    city: 'Clermont-Ferrand',
    latitude: 45.7772,
    longitude: 3.087,
    phone: '06 00 00 00 10',
    color: '#b04b45',
  },
];
