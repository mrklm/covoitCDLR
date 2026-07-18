export type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
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
  },
  {
    id: 'nora-bernard',
    firstName: 'Nora',
    lastName: 'Bernard',
    city: 'Rennes',
    latitude: 48.1173,
    longitude: -1.6778,
    phone: '06 00 00 00 02',
  },
  {
    id: 'hugo-petit',
    firstName: 'Hugo',
    lastName: 'Petit',
    city: 'Bordeaux',
    latitude: 44.8378,
    longitude: -0.5792,
    phone: '06 00 00 00 03',
  },
  {
    id: 'ines-moreau',
    firstName: 'Ines',
    lastName: 'Moreau',
    city: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4442,
    phone: '06 00 00 00 04',
  },
  {
    id: 'lucas-dubois',
    firstName: 'Lucas',
    lastName: 'Dubois',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    phone: '06 00 00 00 05',
  },
  {
    id: 'lea-roux',
    firstName: 'Lea',
    lastName: 'Roux',
    city: 'Nice',
    latitude: 43.7102,
    longitude: 7.262,
    phone: '06 00 00 00 06',
  },
  {
    id: 'adam-fournier',
    firstName: 'Adam',
    lastName: 'Fournier',
    city: 'Strasbourg',
    latitude: 48.5734,
    longitude: 7.7521,
    phone: '06 00 00 00 07',
  },
  {
    id: 'manon-girard',
    firstName: 'Manon',
    lastName: 'Girard',
    city: 'Nantes',
    latitude: 47.2184,
    longitude: -1.5536,
    phone: '06 00 00 00 08',
  },
  {
    id: 'ethan-leroy',
    firstName: 'Ethan',
    lastName: 'Leroy',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    phone: '06 00 00 00 09',
  },
  {
    id: 'sarah-simon',
    firstName: 'Sarah',
    lastName: 'Simon',
    city: 'Clermont-Ferrand',
    latitude: 45.7772,
    longitude: 3.087,
    phone: '06 00 00 00 10',
  },
];
