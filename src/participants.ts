export type Participant = {
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
    firstName: 'Camille',
    lastName: 'Martin',
    city: 'Lille',
    latitude: 50.6292,
    longitude: 3.0573,
    phone: '06 00 00 00 01',
  },
  {
    firstName: 'Nora',
    lastName: 'Bernard',
    city: 'Rennes',
    latitude: 48.1173,
    longitude: -1.6778,
    phone: '06 00 00 00 02',
  },
  {
    firstName: 'Hugo',
    lastName: 'Petit',
    city: 'Bordeaux',
    latitude: 44.8378,
    longitude: -0.5792,
    phone: '06 00 00 00 03',
  },
  {
    firstName: 'Ines',
    lastName: 'Moreau',
    city: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4442,
    phone: '06 00 00 00 04',
  },
  {
    firstName: 'Lucas',
    lastName: 'Dubois',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    phone: '06 00 00 00 05',
  },
  {
    firstName: 'Lea',
    lastName: 'Roux',
    city: 'Nice',
    latitude: 43.7102,
    longitude: 7.262,
    phone: '06 00 00 00 06',
  },
  {
    firstName: 'Adam',
    lastName: 'Fournier',
    city: 'Strasbourg',
    latitude: 48.5734,
    longitude: 7.7521,
    phone: '06 00 00 00 07',
  },
  {
    firstName: 'Manon',
    lastName: 'Girard',
    city: 'Nantes',
    latitude: 47.2184,
    longitude: -1.5536,
    phone: '06 00 00 00 08',
  },
  {
    firstName: 'Ethan',
    lastName: 'Leroy',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    phone: '06 00 00 00 09',
  },
  {
    firstName: 'Sarah',
    lastName: 'Simon',
    city: 'Clermont-Ferrand',
    latitude: 45.7772,
    longitude: 3.087,
    phone: '06 00 00 00 10',
  },
];
