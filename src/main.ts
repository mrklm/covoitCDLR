import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './style.css';
import {
  participants as demoParticipants,
  type Participant,
} from './participants';
import { isSupabaseConfigured, supabase } from './supabaseClient';

type JourneyMode = 'outbound' | 'return';
type JourneyStatus = 'unset' | 'offer' | 'search';
type ThemeName =
  | 'sombre-midnight-garage'
  | 'sombre-air-klm-night-flight'
  | 'sombre-cafe-serre'
  | 'sombre-matrix-deja-vu'
  | 'sombre-miami-vice-1987'
  | 'sombre-cyber-licorne'
  | 'clair-air-klm-day-flight'
  | 'clair-matin-brumeux'
  | 'clair-latte-vanille'
  | 'clair-miellerie-la-divette'
  | 'pouet-chewing-gum-ocean'
  | 'pouet-pamplemousse'
  | 'pouet-raisin-toxique'
  | 'pouet-citron-qui-pique'
  | 'pouet-barbie-apocalypse'
  | 'pouet-compagnie-creole';

type CityOption = {
  name: string;
  latitude: number | null;
  longitude: number | null;
  postalCode?: string;
};

type Journey = {
  status: JourneyStatus;
  date: string;
  endpointCity: string;
  steps: string[];
  message: string;
};

type ParticipantJourneys = {
  outbound: Journey;
  return: Journey;
};

type SavedJourneys = Record<string, ParticipantJourneys>;

type SetJourneyOptions = {
  autoMessage?: boolean;
};

type JourneyRow = {
  participant_id: string;
  journey_mode: JourneyMode;
  status: JourneyStatus;
  date: string | null;
  endpoint_city: string | null;
  steps: unknown;
  message?: string | null;
};

type TechnicianRow = {
  id: string;
  last_name: string;
  first_name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string;
  color: string | null;
};

type CustomCityRow = {
  id: string;
  name: string;
  postal_code: string | null;
  latitude: number;
  longitude: number;
};

type GeoApiCommune = {
  nom: string;
  codesPostaux?: string[];
  centre?: {
    coordinates?: [number, number];
  };
};

type PendingCityTarget =
  | {
      type: 'journey';
      participantId: string;
      mode: JourneyMode;
      fieldName: string;
    }
  | {
      type: 'new-participant';
    }
  | null;

const storageKey = 'covoitcdlr-journeys';
const customCitiesStorageKey = 'covoitcdlr-custom-cities';
const themeStorageKey = 'covoitcdlr-theme';
const mapBrightnessStorageKey = 'covoitcdlr-map-brightness';
const accessStorageKey = 'covoitcdlr-access-granted';
const accessPasswordHash =
  '06fabe7992014b72287461d5a55221f209d6ac71781bae72cdb601a801b10185';
const emptyStepValue = '';
const defaultStepCount = 3;
const maxStepCount = 8;
const maxMessageLength = 300;
const addCityValue = '__add-city__';
const returnDefaultDate = '2026-07-23';
const defaultDarkMapBrightness = 70;

const festivalLocation: {
  label: string;
  name: string;
  latitude: number;
  longitude: number;
} = {
  label: 'Festival CDLR',
  name: 'Chalon-sur-Saône',
  latitude: 46.7811,
  longitude: 4.8537,
};

const cityOptions: CityOption[] = [
  { name: 'Aucune étape', latitude: 0, longitude: 0 },
  { name: 'Allériot', latitude: 46.8021, longitude: 4.9532 },
  { name: 'Amiens', latitude: 49.8942, longitude: 2.2957 },
  { name: 'Angers', latitude: 47.4819, longitude: -0.5629 },
  { name: 'Annecy', latitude: 45.8992, longitude: 6.1294 },
  { name: 'Avignon', latitude: 43.9493, longitude: 4.8055 },
  { name: 'Bayonne', latitude: 43.4929, longitude: -1.4748 },
  { name: 'Besancon', latitude: 47.2602, longitude: 6.0123 },
  { name: 'Besançon', latitude: 47.2602, longitude: 6.0123 },
  { name: 'Bissey Sous Cruchaud', latitude: 46.7296, longitude: 4.6944 },
  { name: 'Bordeaux', latitude: 44.8378, longitude: -0.5792 },
  { name: 'Boulogne Billancourt', latitude: 48.8375, longitude: 2.2429 },
  { name: 'Bourg-lès-Valence', latitude: 44.9637, longitude: 4.89 },
  { name: 'BOURG LES VALENCE', latitude: 44.9637, longitude: 4.89 },
  { name: 'Bourges', latitude: 47.081, longitude: 2.3988 },
  { name: 'Boussenois', latitude: 47.6272, longitude: 5.2084 },
  { name: 'BOYER', latitude: 46.5985, longitude: 4.9036 },
  { name: 'Brains Sur Gée', latitude: 48.0111, longitude: -0.0216 },
  { name: 'Bracon', latitude: 46.9263, longitude: 5.8672 },
  { name: 'Brest', latitude: 48.3904, longitude: -4.4861 },
  { name: 'Caen', latitude: 49.1829, longitude: -0.3707 },
  { name: 'Chambéry', latitude: 45.5646, longitude: 5.9178 },
  { name: 'Chartres', latitude: 48.4439, longitude: 1.489 },
  { name: 'Clermont Ferrand', latitude: 45.787, longitude: 3.1127 },
  { name: 'Clermont-Ferrand', latitude: 45.787, longitude: 3.1127 },
  { name: 'Colmar', latitude: 48.0794, longitude: 7.3585 },
  { name: "Collonges Au Mont D'Or", latitude: 45.8188, longitude: 4.8425 },
  { name: 'Dieulefit', latitude: 44.5354, longitude: 5.0685 },
  { name: 'Dijon', latitude: 47.3319, longitude: 5.0322 },
  { name: 'Domagne', latitude: 48.0654, longitude: -1.4051 },
  { name: 'Epagny Metz Tessy', latitude: 45.943, longitude: 6.0934 },
  { name: 'Flée', latitude: 47.4356, longitude: 4.3284 },
  { name: 'Flee', latitude: 47.4356, longitude: 4.3284 },
  { name: 'Foix', latitude: 42.9701, longitude: 1.609 },
  { name: 'Gières', latitude: 45.1828, longitude: 5.7902 },
  { name: 'Gieres', latitude: 45.1828, longitude: 5.7902 },
  { name: 'Gevingey', latitude: 46.6362, longitude: 5.5073 },
  { name: 'Grenoble', latitude: 45.1885, longitude: 5.7245 },
  { name: 'Jugy', latitude: 46.6053, longitude: 4.8643 },
  { name: 'La Grave', latitude: 45.061, longitude: 6.2886 },
  { name: 'Lacrost', latitude: 46.5723, longitude: 4.9402 },
  { name: 'Lambesc', latitude: 43.6636, longitude: 5.2493 },
  { name: 'Lans', latitude: 46.7643, longitude: 4.9343 },
  { name: 'Lantenay', latitude: 47.3435, longitude: 4.8672 },
  { name: 'Le Bosc', latitude: 43.6985, longitude: 3.3896 },
  { name: 'Le Havre', latitude: 49.4944, longitude: 0.1079 },
  { name: 'Le Mans', latitude: 48.0061, longitude: 0.1996 },
  { name: 'Lépin-le-Lac', latitude: 45.5331, longitude: 5.7895 },
  { name: 'Lepin Le Lac', latitude: 45.5331, longitude: 5.7895 },
  { name: 'Les Salles Du Gardon', latitude: 44.1903, longitude: 4.0155 },
  { name: 'Lille', latitude: 50.6311, longitude: 3.0468 },
  { name: 'Limoges', latitude: 45.8336, longitude: 1.2611 },
  { name: 'Loire Authion', latitude: 47.4695, longitude: -0.3734 },
  { name: 'Lyon', latitude: 45.758, longitude: 4.8351 },
  { name: 'Lyon 02', latitude: 45.758, longitude: 4.8351 },
  { name: 'Macon', latitude: 46.3069, longitude: 4.8319 },
  { name: 'Marseille', latitude: 43.2965, longitude: 5.3698 },
  { name: 'Marseille 16e', latitude: 43.2803, longitude: 5.3806 },
  { name: 'Mauves-Sur-Loire', latitude: 47.3146, longitude: -1.4019 },
  { name: 'Meyzieu', latitude: 45.7785, longitude: 5.0114 },
  { name: 'Montpellier', latitude: 43.611, longitude: 3.8767 },
  { name: 'Mulhouse', latitude: 47.7508, longitude: 7.3359 },
  { name: 'Nancy', latitude: 48.6921, longitude: 6.1844 },
  { name: 'Nantes', latitude: 47.2382, longitude: -1.5603 },
  { name: 'NANTES', latitude: 47.2382, longitude: -1.5603 },
  { name: 'Nevers', latitude: 46.9896, longitude: 3.159 },
  { name: 'Nice', latitude: 43.7102, longitude: 7.262 },
  { name: 'Nîmes', latitude: 43.8322, longitude: 4.3429 },
  { name: 'Orleans', latitude: 47.9029, longitude: 1.9093 },
  { name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Pau', latitude: 43.2951, longitude: -0.3708 },
  { name: 'Perpignan', latitude: 42.6887, longitude: 2.8948 },
  { name: 'Poitiers', latitude: 46.5802, longitude: 0.3404 },
  { name: 'Quingey', latitude: 47.1115, longitude: 5.8819 },
  { name: 'Reims', latitude: 49.2583, longitude: 4.0317 },
  { name: 'Rennes', latitude: 48.1173, longitude: -1.6778 },
  { name: 'Roanne', latitude: 46.0362, longitude: 4.0689 },
  { name: 'Rouen', latitude: 49.4431, longitude: 1.0993 },
  { name: 'Saint Etienne', latitude: 45.4241, longitude: 4.3665 },
  { name: 'SAINT ETIENNE', latitude: 45.4241, longitude: 4.3665 },
  { name: 'Saint-Etienne', latitude: 45.4241, longitude: 4.3665 },
  { name: 'Saint-Étienne', latitude: 45.4241, longitude: 4.3665 },
  { name: 'Saint Marcellin En Forez', latitude: 45.4883, longitude: 4.1672 },
  { name: 'Saint Sernin Du Plain', latitude: 46.8873, longitude: 4.6162 },
  { name: 'Saint Sixte', latitude: 45.7728, longitude: 3.9695 },
  { name: "Saint-Martin D' Uriage", latitude: 45.1568, longitude: 5.8592 },
  { name: 'Saint-Martin-De-Coux', latitude: 45.1452, longitude: -0.1147 },
  { name: 'Sotteville Les Rouen', latitude: 49.4116, longitude: 1.0944 },
  { name: 'Sougeal', latitude: 48.5043, longitude: -1.5131 },
  { name: 'Strasbourg', latitude: 48.5734, longitude: 7.7521 },
  { name: 'Thorigné-Sur-Dué', latitude: 48.0294, longitude: 0.5175 },
  { name: 'Toulouse', latitude: 43.6007, longitude: 1.4328 },
  { name: 'Tours', latitude: 47.3943, longitude: 0.6949 },
  { name: 'Troyes', latitude: 48.2973, longitude: 4.0744 },
  { name: 'Valence', latitude: 44.9334, longitude: 4.8924 },
  { name: 'Vaulx En Velin', latitude: 45.7776, longitude: 4.925 },
  { name: 'Venerque', latitude: 43.4363, longitude: 1.4629 },
  { name: 'Vichy', latitude: 46.1239, longitude: 3.4267 },
  { name: 'Villefranche-Sur-Saône', latitude: 45.9837, longitude: 4.726 },
  { name: 'Villeurbanne', latitude: 45.7719, longitude: 4.8898 },
  { name: 'Voiteur', latitude: 46.7431, longitude: 5.6014 },
];

const franceCenter: L.LatLngExpression = [46.8, 2.4];
let activeMode: JourneyMode =
  getTodayValue() >= returnDefaultDate ? 'return' : 'outbound';
let appParticipants: Participant[] = demoParticipants;
let selectedParticipantId = appParticipants[0]?.id ?? '';
let editingParticipantId: string | null = null;
let savedJourneys: SavedJourneys = {};
let customCities: CityOption[] = [];
let pendingCityTarget: PendingCityTarget = null;
let participantSourceNotice = '';
let activeMobileView: 'map' | 'participants' = 'map';
let currentAccessPassword: string | null = null;

function isMobileViewport(): boolean {
  return window.matchMedia('(max-width: 820px)').matches;
}

const themes: ThemeName[] = [
  'sombre-midnight-garage',
  'sombre-air-klm-night-flight',
  'sombre-cafe-serre',
  'sombre-matrix-deja-vu',
  'sombre-miami-vice-1987',
  'sombre-cyber-licorne',
  'clair-air-klm-day-flight',
  'clair-matin-brumeux',
  'clair-latte-vanille',
  'clair-miellerie-la-divette',
  'pouet-chewing-gum-ocean',
  'pouet-pamplemousse',
  'pouet-raisin-toxique',
  'pouet-citron-qui-pique',
  'pouet-barbie-apocalypse',
  'pouet-compagnie-creole',
];

const participantColors = [
  '#2f6f8f',
  '#8b5d33',
  '#5d7c2f',
  '#9a4f63',
  '#4864a8',
  '#7b6aa8',
  '#b16a38',
  '#3e8a64',
  '#7d6b34',
  '#b04b45',
  '#5a8792',
  '#a36f9b',
];

const map = L.map('map', {
  zoomControl: true,
  scrollWheelZoom: true,
}).setView(franceCenter, 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const festivalIcon = L.divIcon({
  className: 'festival-marker',
  html: '<span aria-hidden="true">CDLR</span>',
  iconSize: [27, 27],
  iconAnchor: [14, 14],
  popupAnchor: [0, -13],
});

const participantLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);
const routeRenderer = L.svg({ padding: 0.8 });

function createEmptyJourney(): Journey {
  return {
    status: 'unset',
    date: '',
    endpointCity: '',
    steps: Array(defaultStepCount).fill(emptyStepValue),
    message: '',
  };
}

function createEmptyParticipantJourneys(): ParticipantJourneys {
  return {
    outbound: createEmptyJourney(),
    return: createEmptyJourney(),
  };
}

function loadLocalSavedJourneys(): SavedJourneys {
  const rawValue = localStorage.getItem(storageKey);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue) as SavedJourneys;
  } catch {
    return {};
  }
}

async function loadSavedJourneys(): Promise<SavedJourneys> {
  const localJourneys = loadLocalSavedJourneys();

  if (!isSupabaseConfigured || !supabase) {
    return localJourneys;
  }

  const { data, error } = await supabase
    .from('covoit_journeys')
    .select('participant_id, journey_mode, status, date, endpoint_city, steps, message');

  const resultData = data;
  let resultError = error;

  if (resultError) {
    const fallbackResult = await supabase
      .from('covoit_journeys')
      .select('participant_id, journey_mode, status, date, endpoint_city, steps');

    resultError = fallbackResult.error;

    if (!resultError) {
      console.warn(
        'La colonne message est absente de Supabase. Les messages resteront locaux jusqu’à la mise à jour du schéma.',
      );
      return reduceJourneyRows(fallbackResult.data as JourneyRow[], localJourneys);
    }
  }

  if (resultError) {
    console.warn('Chargement Supabase impossible, données locales utilisées.', resultError);
    return localJourneys;
  }

  return reduceJourneyRows(resultData as JourneyRow[], localJourneys);
}

function reduceJourneyRows(
  rows: JourneyRow[],
  baseJourneys: SavedJourneys = {},
): SavedJourneys {
  const remoteJourneys = rows.reduce<SavedJourneys>(
    (journeys, row) => {
      const existingJourney = journeys[row.participant_id]?.[row.journey_mode];

      journeys[row.participant_id] = {
        ...createEmptyParticipantJourneys(),
        ...journeys[row.participant_id],
        [row.journey_mode]: normalizeJourney({
          status: row.status,
          date: row.date ?? '',
          endpointCity: row.endpoint_city ?? '',
          steps: Array.isArray(row.steps)
            ? row.steps.map(String)
            : Array(defaultStepCount).fill(emptyStepValue),
          message: row.message ?? existingJourney?.message ?? '',
        }),
      };

      return journeys;
    },
    { ...baseJourneys },
  );

  localStorage.setItem(storageKey, JSON.stringify(remoteJourneys));

  return remoteJourneys;
}

function normalizeJourney(journey?: Partial<Journey>): Journey {
  const savedSteps = journey?.steps?.length
    ? journey.steps
    : Array(defaultStepCount).fill(emptyStepValue);

  return {
    ...createEmptyJourney(),
    ...journey,
    status: journey?.status ?? 'unset',
    endpointCity: journey?.endpointCity ?? '',
    steps: savedSteps.map((step) => step ?? emptyStepValue),
    message: String(journey?.message ?? '').slice(0, maxMessageLength),
  };
}

function saveJourneys(): void {
  localStorage.setItem(storageKey, JSON.stringify(savedJourneys));
}

async function saveJourneyToSupabase(
  participantId: string,
  mode: JourneyMode,
  journey: Journey,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  const payload = {
    participant_id: participantId,
    journey_mode: mode,
    status: journey.status,
    date: journey.date,
    endpoint_city: journey.endpointCity,
    steps: journey.steps,
    message: journey.message,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('covoit_journeys').upsert(payload, {
    onConflict: 'participant_id,journey_mode',
  });

  if (error && 'message' in payload) {
    if (journey.message.trim()) {
      console.warn(
        'Message non sauvegardé dans Supabase : exécuter le schéma SQL pour ajouter la colonne message.',
        error,
      );
      return false;
    }

    const { message: _message, ...payloadWithoutMessage } = payload;
    const fallbackResult = await supabase
      .from('covoit_journeys')
      .upsert(payloadWithoutMessage, {
        onConflict: 'participant_id,journey_mode',
      });

    if (!fallbackResult.error) {
      console.warn(
        'Message non sauvegardé dans Supabase : exécuter le schéma SQL pour ajouter la colonne message.',
      );
      return true;
    }
  }

  if (error) {
    console.warn('Sauvegarde Supabase impossible.', error);
    return false;
  }

  return true;
}

function getParticipantJourneys(participantId: string): ParticipantJourneys {
  const journeys = savedJourneys[participantId];

  return {
    outbound: normalizeJourney(journeys?.outbound),
    return: normalizeJourney(journeys?.return),
  };
}

function applyAutomaticJourneyMessage(
  participantId: string,
  mode: JourneyMode,
  journey: Journey,
): Journey {
  const participant = getParticipantById(participantId);
  const previousJourney = getParticipantJourneys(participantId)[mode];

  if (!participant || journey.status !== 'offer') {
    return journey;
  }

  const previousMessage = previousJourney.message.trim();
  const canReplaceMessage =
    !previousMessage || isDefaultJourneyMessage(participant, previousMessage);

  if (!canReplaceMessage) {
    return journey;
  }

  return {
    ...journey,
    message: buildDefaultJourneyMessage(participant, journey, mode),
  };
}

function setParticipantJourney(
  participantId: string,
  mode: JourneyMode,
  journey: Journey,
  options: SetJourneyOptions = {},
): Promise<boolean> {
  const nextJourney =
    options.autoMessage === false
      ? journey
      : applyAutomaticJourneyMessage(participantId, mode, journey);

  savedJourneys = {
    ...savedJourneys,
    [participantId]: {
      ...getParticipantJourneys(participantId),
      [mode]: nextJourney,
    },
  };

  saveJourneys();
  return saveJourneyToSupabase(participantId, mode, nextJourney);
}

async function ensureAutomaticMessagesForOffers(): Promise<void> {
  const updates: Array<Promise<boolean>> = [];
  let hasChanges = false;

  appParticipants.forEach((participant) => {
    (['outbound', 'return'] as JourneyMode[]).forEach((mode) => {
      const journey = getParticipantJourneys(participant.id)[mode];
      const nextJourney = applyAutomaticJourneyMessage(
        participant.id,
        mode,
        journey,
      );

      if (nextJourney.message === journey.message) {
        return;
      }

      savedJourneys = {
        ...savedJourneys,
        [participant.id]: {
          ...getParticipantJourneys(participant.id),
          [mode]: nextJourney,
        },
      };
      hasChanges = true;
      updates.push(saveJourneyToSupabase(participant.id, mode, nextJourney));
    });
  });

  if (hasChanges) {
    saveJourneys();
  }

  await Promise.allSettled(updates);
}

function normalizeCustomCity(city: CityOption): CityOption {
  return {
    name: city.name.trim(),
    postalCode: city.postalCode?.trim() ?? '',
    latitude: city.latitude,
    longitude: city.longitude,
  };
}

function mapCustomCityRow(row: CustomCityRow): CityOption {
  return normalizeCustomCity({
    name: row.name,
    postalCode: row.postal_code ?? '',
    latitude: row.latitude,
    longitude: row.longitude,
  });
}

function getCustomCityId(city: CityOption): string {
  const postalCode = city.postalCode ? `-${city.postalCode}` : '';

  return `${getCityKey(city.name)}${postalCode}`.replace(/\s+/g, '-');
}

function loadLocalCustomCities(): CityOption[] {
  const rawValue = localStorage.getItem(customCitiesStorageKey);

  if (!rawValue) {
    return [];
  }

  try {
    return (JSON.parse(rawValue) as CityOption[]).map(normalizeCustomCity);
  } catch {
    return [];
  }
}

function saveLocalCustomCities(cities: CityOption[]): void {
  localStorage.setItem(customCitiesStorageKey, JSON.stringify(cities));
}

function mergeCustomCities(cities: CityOption[]): CityOption[] {
  const citiesByKey = new Map<string, CityOption>();

  cities.forEach((city) => {
    const normalizedCity = normalizeCustomCity(city);
    const cityKey = getCustomCityId(normalizedCity);

    if (normalizedCity.name && hasCityCoordinates(normalizedCity)) {
      citiesByKey.set(cityKey, normalizedCity);
    }
  });

  return Array.from(citiesByKey.values()).sort((cityA, cityB) =>
    cityA.name.localeCompare(cityB.name, 'fr'),
  );
}

async function loadCustomCities(): Promise<CityOption[]> {
  const localCities = loadLocalCustomCities();

  if (!isSupabaseConfigured || !supabase) {
    return localCities;
  }

  const { data, error } = await supabase
    .from('custom_cities')
    .select('id, name, postal_code, latitude, longitude')
    .order('name', { ascending: true });

  if (error) {
    console.warn('Chargement des villes personnalisées impossible.', error);
    return localCities;
  }

  const remoteCities = (data as CustomCityRow[]).map(mapCustomCityRow);
  const mergedCities = mergeCustomCities([...localCities, ...remoteCities]);
  saveLocalCustomCities(mergedCities);

  return mergedCities;
}

async function saveCustomCity(city: CityOption): Promise<void> {
  const normalizedCity = normalizeCustomCity(city);
  customCities = mergeCustomCities([...customCities, normalizedCity]);
  saveLocalCustomCities(customCities);

  if (!isSupabaseConfigured || !supabase || !hasCityCoordinates(normalizedCity)) {
    return;
  }

  const { error } = await supabase.from('custom_cities').upsert({
    id: getCustomCityId(normalizedCity),
    name: normalizedCity.name,
    postal_code: normalizedCity.postalCode ?? '',
    latitude: normalizedCity.latitude,
    longitude: normalizedCity.longitude,
  });

  if (error) {
    console.warn('Sauvegarde de la ville personnalisée impossible.', error);
  }
}

function getParticipantCityOptions(): CityOption[] {
  return appParticipants.map((participant) => ({
    name: participant.city,
    latitude: participant.latitude,
    longitude: participant.longitude,
  }));
}

function getCityKey(cityName: string): string {
  return cityName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getSelectableCities(includeEmptyOption: boolean): CityOption[] {
  const citiesByKey = new Map<string, CityOption>();
  const allCities = [
    ...(includeEmptyOption ? cityOptions : cityOptions.slice(1)),
    ...customCities,
    ...getParticipantCityOptions(),
  ];

  allCities.forEach((city) => {
    const cityKey = getCityKey(city.name);
    const existingCity = citiesByKey.get(cityKey);

    if (!existingCity || (!hasCityCoordinates(existingCity) && hasCityCoordinates(city))) {
      citiesByKey.set(cityKey, city);
    }
  });

  return Array.from(citiesByKey.values()).sort((cityA, cityB) => {
    if (cityA.name === 'Aucune étape') {
      return -1;
    }

    if (cityB.name === 'Aucune étape') {
      return 1;
    }

    return cityA.name.localeCompare(cityB.name, 'fr');
  });
}

function findCityByName(cityName: string): CityOption | undefined {
  const searchedKey = getCityKey(cityName);

  return getSelectableCities(false).find(
    (city) => getCityKey(city.name) === searchedKey,
  );
}

function hasCityCoordinates(
  city: CityOption | undefined,
): city is CityOption & { latitude: number; longitude: number } {
  return city !== undefined && city.latitude !== null && city.longitude !== null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNamePart(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('fr-FR')
    .replace(/(^|[\s'-])(\p{L})/gu, (match, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase('fr-FR')}`,
    );
}

function formatParticipantName(participant: Participant): string {
  return `${formatNamePart(participant.firstName)} ${formatNamePart(participant.lastName)}`;
}

function getParticipantIdentityKey(participant: Participant): string {
  const phoneKey = participant.phone.replace(/\D/g, '');

  return [
    getCityKey(participant.firstName),
    getCityKey(participant.lastName),
    phoneKey,
  ].join('|');
}

function getJourneyDestination(
  participant: Participant,
  journey: Journey,
  mode: JourneyMode,
): string {
  return mode === 'outbound'
    ? festivalLocation.name
    : journey.endpointCity || participant.city;
}

function formatMessageDate(dateValue: string): string {
  return formatShortDate(dateValue) || 'date à préciser';
}

function buildDefaultJourneyMessage(
  participant: Participant,
  journey: Journey,
  mode: JourneyMode,
): string {
  const destination = getJourneyDestination(participant, journey, mode);

  return `${formatParticipantName(participant)} propose un trajet vers ${destination} le ${formatMessageDate(journey.date)}`;
}

function isDefaultJourneyMessage(participant: Participant, message: string): boolean {
  return message
    .trim()
    .startsWith(`${formatParticipantName(participant)} propose un trajet vers `);
}

function getTodayValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isJourneyExpired(journey: Journey): boolean {
  return Boolean(journey.date) && journey.date < getTodayValue();
}

function isJourneyVisible(journey: Journey): boolean {
  return !isJourneyExpired(journey);
}

function getParticipantById(participantId: string): Participant | undefined {
  return appParticipants.find((participant) => participant.id === participantId);
}

function buildMissingCityOption(selectedValue: string): string {
  if (!selectedValue) {
    return '';
  }

  return `<option value="${escapeHtml(selectedValue)}" selected>${escapeHtml(selectedValue)} - trajet à renseigner</option>`;
}

function hasSelectableCityValue(
  cities: CityOption[],
  selectedValue: string,
): boolean {
  const selectedKey = getCityKey(selectedValue);

  return cities.some((city) => {
    const value = city.name === 'Aucune étape' ? emptyStepValue : city.name;

    return getCityKey(value) === selectedKey;
  });
}

function mapTechnicianToParticipant(
  technician: TechnicianRow,
  index: number,
): Participant {
  const cityCoordinates = findCityByName(technician.city);
  const latitude =
    technician.latitude ?? (hasCityCoordinates(cityCoordinates) ? cityCoordinates.latitude : null);
  const longitude =
    technician.longitude ?? (hasCityCoordinates(cityCoordinates) ? cityCoordinates.longitude : null);

  return {
    id: technician.id,
    firstName: formatNamePart(technician.first_name),
    lastName: formatNamePart(technician.last_name),
    city: technician.city,
    latitude,
    longitude,
    phone: technician.phone,
    color: technician.color ?? participantColors[index % participantColors.length],
  };
}

function dedupeParticipants(participants: Participant[]): Participant[] {
  const participantsByKey = new Map<string, Participant>();

  participants.forEach((participant) => {
    const identityKey = getParticipantIdentityKey(participant);

    if (!participantsByKey.has(identityKey)) {
      participantsByKey.set(identityKey, participant);
    }
  });

  return Array.from(participantsByKey.values());
}

function sortParticipants(participants: Participant[]): Participant[] {
  return [...participants].sort((participantA, participantB) => {
    const lastNameComparison = participantA.lastName.localeCompare(
      participantB.lastName,
      'fr',
    );

    return lastNameComparison !== 0
      ? lastNameComparison
      : participantA.firstName.localeCompare(participantB.firstName, 'fr');
  });
}

function createParticipantId(firstName: string, lastName: string): string {
  const baseId = `${getCityKey(firstName)}-${getCityKey(lastName)}`
    .replace(/\s+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Date.now().toString(36);

  return `${baseId || 'participant'}-${suffix}`;
}

function getNextParticipantColor(): string {
  return participantColors[appParticipants.length % participantColors.length];
}

async function saveParticipantToSupabase(
  participant: Participant,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !currentAccessPassword) {
    return false;
  }

  const { error } = await supabase.rpc('upsert_technician', {
    access_password: currentAccessPassword,
    technician_id: participant.id,
    last_name_value: participant.lastName,
    first_name_value: participant.firstName,
    city_value: participant.city,
    latitude_value: participant.latitude,
    longitude_value: participant.longitude,
    phone_value: participant.phone,
    color_value: participant.color,
  });

  if (error) {
    console.warn('Ajout du participant impossible dans Supabase.', error);
    return false;
  }

  return true;
}

function getFallbackParticipants(notice: string): Participant[] {
  participantSourceNotice = notice;

  return import.meta.env.DEV ? demoParticipants : [];
}

async function loadParticipants(accessPassword: string | null): Promise<Participant[]> {
  if (!isSupabaseConfigured || !supabase || !accessPassword) {
    return getFallbackParticipants(
      'Supabase n’est pas configuré pour cette version. Vérifie les variables GitHub Pages.',
    );
  }

  const { data, error } = await supabase.rpc('get_technicians', {
    access_password: accessPassword,
  });

  if (error || !data) {
    console.warn('Chargement des techniciens impossible.', error);
    return getFallbackParticipants(
      'Impossible de charger les techniciens depuis Supabase. Vérifie la fonction get_technicians et le mot de passe.',
    );
  }

  const remoteParticipants = (data as TechnicianRow[]).map(
    mapTechnicianToParticipant,
  );

  if (remoteParticipants.length === 0) {
    return getFallbackParticipants(
      'Supabase répond, mais la table technicians ne contient aucun contact.',
    );
  }

  participantSourceNotice = '';

  return sortParticipants(dedupeParticipants(remoteParticipants));
}

function formatParticipantPopup(participant: Participant): string {
  return `
    <strong>${escapeHtml(formatParticipantName(participant))}</strong>
    <span>Ville : ${escapeHtml(participant.city)}</span>
    <span>Téléphone : ${escapeHtml(participant.phone)}</span>
  `;
}

function getParticipantInitials(participant: Participant): string {
  return `${participant.firstName.charAt(0)}${participant.lastName.charAt(0)}`
    .toUpperCase();
}

function createParticipantIcon(participant: Participant): L.DivIcon {
  return L.divIcon({
    className: 'participant-marker',
    html: `<span aria-hidden="true" style="--participant-color: ${participant.color}">${escapeHtml(getParticipantInitials(participant))}</span>`,
    iconSize: [27, 27],
    iconAnchor: [14, 14],
    popupAnchor: [0, -13],
  });
}

function addFestivalMarker(): void {
  L.marker([festivalLocation.latitude, festivalLocation.longitude], {
    icon: festivalIcon,
    title: festivalLocation.label,
  })
    .bindPopup(
      `<strong>${festivalLocation.label}</strong><span>${festivalLocation.name}</span>`,
    )
    .addTo(map);
}

function addParticipantMarkers(items: Participant[]): void {
  participantLayer.clearLayers();
  const visibleParticipants = items.filter(
    (participant) =>
      participant.latitude !== null && participant.longitude !== null,
  );
  const markerIndexesByCoordinates = new Map<string, number>();

  visibleParticipants.forEach((participant) => {
    if (participant.latitude === null || participant.longitude === null) {
      return;
    }

    const coordinatesKey = `${participant.latitude.toFixed(5)},${participant.longitude.toFixed(5)}`;
    const markerIndex = markerIndexesByCoordinates.get(coordinatesKey) ?? 0;
    const markerPoint = map.latLngToLayerPoint([
      participant.latitude,
      participant.longitude,
    ]);
    markerPoint.y += markerIndex * 31;
    markerIndexesByCoordinates.set(coordinatesKey, markerIndex + 1);

    L.marker(map.layerPointToLatLng(markerPoint), {
      icon: createParticipantIcon(participant),
      title: formatParticipantName(participant),
    })
      .bindPopup(formatParticipantPopup(participant))
      .on('click', () => {
        selectedParticipantId = participant.id;
        renderParticipantList(appParticipants);
        drawRoutes(appParticipants);
      })
      .addTo(participantLayer);
  });
}

function buildCityOptions(selectedValue: string): string {
  const cities = getSelectableCities(true);
  const missingSelectedOption = hasSelectableCityValue(cities, selectedValue)
    ? ''
    : buildMissingCityOption(selectedValue);
  const selectedKey = getCityKey(selectedValue);

  const addCityOption = `<option value="${addCityValue}">+ Ajouter une ville...</option>`;

  return (
    missingSelectedOption +
    cities
    .map((city) => {
      const value = city.name === 'Aucune étape' ? emptyStepValue : city.name;
      const selected = getCityKey(value) === selectedKey ? 'selected' : '';
      const coordinatesLabel =
        value && !hasCityCoordinates(city) ? ' - trajet à renseigner' : '';

      return `<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(city.name + coordinatesLabel)}</option>`;
    })
    .join('') +
    addCityOption
  );
}

function buildEndpointCityOptions(selectedValue: string): string {
  const cities = getSelectableCities(false);
  const missingSelectedOption = hasSelectableCityValue(cities, selectedValue)
    ? ''
    : buildMissingCityOption(selectedValue);
  const selectedKey = getCityKey(selectedValue);

  const addCityOption = `<option value="${addCityValue}">+ Ajouter une ville...</option>`;

  return (
    missingSelectedOption +
    cities
    .map((city) => {
      const selected =
        getCityKey(city.name) === selectedKey ? 'selected' : '';
      const coordinatesLabel = !hasCityCoordinates(city)
        ? ' - trajet à renseigner'
        : '';

      return `<option value="${escapeHtml(city.name)}" ${selected}>${escapeHtml(city.name + coordinatesLabel)}</option>`;
    })
    .join('') +
    addCityOption
  );
}

function buildParticipantCityOptions(selectedValue: string): string {
  const placeholderSelected = selectedValue ? '' : 'selected';

  return `
    <option value="" ${placeholderSelected}>Choisir une ville</option>
    ${buildEndpointCityOptions(selectedValue)}
  `;
}

function renderFixedCity(label: string, cityName: string): string {
  return `
    <div class="fixed-city">
      <span>${label}</span>
      <strong>${cityName}</strong>
    </div>
  `;
}

function renderEndpointField(label: string, selectedCity: string): string {
  return `
    <label>
      ${label}
      <select name="endpoint-city">
        ${buildEndpointCityOptions(selectedCity)}
      </select>
    </label>
  `;
}

function renderStepFields(journey: Journey, disabled: boolean): string {
  return journey.steps
    .map(
      (step, index) => `
        <label>
          Étape ${index + 1}
          <select name="step-${index}" ${disabled ? 'disabled' : ''}>
            ${buildCityOptions(step ?? emptyStepValue)}
          </select>
        </label>
      `,
    )
    .join('');
}

function renderStepControls(journey: Journey, disabled: boolean): string {
  const canAddStep = journey.steps.length < maxStepCount;
  const canRemoveStep = journey.steps.length > 0;

  return `
    <div class="step-controls">
      <button type="button" data-step-action="add" ${disabled || !canAddStep ? 'disabled' : ''}>
        Ajouter une étape
      </button>
      <button type="button" data-step-action="remove" ${disabled || !canRemoveStep ? 'disabled' : ''}>
        Supprimer une étape
      </button>
    </div>
  `;
}

function renderJourneyForm(participant: Participant): string {
  const journey = getParticipantJourneys(participant.id)[activeMode];
  const modeLabel = activeMode === 'outbound' ? 'aller' : 'retour';
  const selectedEndpointCity = journey.endpointCity || participant.city;
  const cannotEnterRoute = journey.status !== 'offer';
  const routeFields =
    activeMode === 'outbound'
      ? `
        ${renderEndpointField('Ville de départ', selectedEndpointCity)}
        ${renderStepFields(journey, cannotEnterRoute)}
        ${renderStepControls(journey, cannotEnterRoute)}
        ${renderFixedCity("Ville d'arrivée", festivalLocation.name)}
      `
      : `
        ${renderFixedCity('Ville de départ', festivalLocation.name)}
        ${renderStepFields(journey, cannotEnterRoute)}
        ${renderStepControls(journey, cannotEnterRoute)}
        ${renderEndpointField("Ville d'arrivée", selectedEndpointCity)}
      `;

  return `
    <form class="journey-form" data-participant-id="${participant.id}">
      <label>
        Statut
        <select name="status">
          <option value="unset" ${journey.status === 'unset' ? 'selected' : ''}>Non renseigné</option>
          <option value="offer" ${journey.status === 'offer' ? 'selected' : ''}>Propose un covoit</option>
          <option value="search" ${journey.status === 'search' ? 'selected' : ''}>Cherche un covoit</option>
        </select>
      </label>

      <label>
        Date ${modeLabel}
        <input type="date" name="date" value="${journey.date}" />
      </label>

      <div class="route-fields">
        ${routeFields}
      </div>
    </form>
  `;
}

function getStatusLabel(status: JourneyStatus): string {
  if (status === 'offer') {
    return 'Propose un covoit';
  }

  if (status === 'search') {
    return 'Cherche un covoit';
  }

  return 'Statut non renseigné';
}

function getStatusIcon(status: JourneyStatus): string {
  if (status === 'offer') {
    return `
      <span class="status-icon status-icon--offer" aria-label="Propose un covoit" title="Propose un covoit">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 11l1.6-4.1A3 3 0 0 1 9.4 5h5.2a3 3 0 0 1 2.8 1.9L19 11" />
          <path d="M4 11h16v6H4z" />
          <path d="M7 17v2" />
          <path d="M17 17v2" />
          <circle cx="7.5" cy="14.5" r="1.2" />
          <circle cx="16.5" cy="14.5" r="1.2" />
        </svg>
      </span>
    `;
  }

  if (status === 'search') {
    return `
      <span class="status-icon status-icon--search" aria-label="Cherche un covoit" title="Cherche un covoit">
        <svg class="thumb-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 10v10H4V10h3z" />
          <path d="M7 19h8.6a2 2 0 0 0 1.9-1.4l2.1-6.2A1.8 1.8 0 0 0 17.9 9H14V5.8A2.8 2.8 0 0 0 11.2 3L10 8.2 7 10z" />
        </svg>
      </span>
    `;
  }

  return '<span class="status-icon status-icon--unset" aria-label="Statut non renseigné" title="Statut non renseigné">?</span>';
}

function renderParticipantList(items: Participant[]): void {
  const list = document.querySelector<HTMLUListElement>('#participant-list');
  const notice = document.querySelector<HTMLElement>('#participant-source-notice');
  const title = document.querySelector<HTMLElement>('#participants-title');

  if (!list) {
    return;
  }

  if (title) {
    title.textContent = `Participant-e-s (${items.length})`;
  }

  if (notice) {
    notice.textContent = participantSourceNotice;
    notice.hidden = !participantSourceNotice;
  }

  if (items.length === 0) {
    list.innerHTML = `
      ${renderAddParticipantListItem('top')}
      <li class="empty-list">Aucun participant à afficher.</li>
      ${renderAddParticipantListItem('bottom')}
    `;
    return;
  }

  list.innerHTML =
    renderAddParticipantListItem('top') +
    items
      .map((participant) => {
      const isSelected = participant.id === selectedParticipantId;
      const isEditing = participant.id === editingParticipantId;
      const journey = getParticipantJourneys(participant.id)[activeMode];
      const hasMapPoint =
        participant.latitude !== null && participant.longitude !== null;
      const hasJourney =
        journey.status !== 'unset' ||
        journey.date ||
        Boolean(journey.endpointCity) ||
        journey.steps.some(Boolean) ||
        Boolean(journey.message);
      const expiredLabel = isJourneyExpired(journey) ? ' - trajet passé' : '';

      return `
        <li class="${isSelected ? 'is-selected' : ''}">
          <div class="participant-row">
            <button class="participant-button" type="button" data-participant-id="${participant.id}">
              <span class="participant-name">
                <span class="participant-color" style="--participant-color: ${participant.color}"></span>
                <strong>${escapeHtml(formatParticipantName(participant))}</strong>
                ${getStatusIcon(journey.status)}
              </span>
              <span>
                ${participant.city}${hasJourney ? ' - renseignements saisis' : ''}${expiredLabel}
                ${hasMapPoint ? '' : ' - trajet à renseigner'}
              </span>
            </button>
            <div class="participant-actions">
              <button class="edit-journey-button" type="button" data-participant-id="${participant.id}">
                ${isEditing ? 'Fermer' : 'Renseigner'}
              </button>
              <button class="message-button" type="button" data-participant-id="${participant.id}">
                Message
              </button>
            </div>
          </div>
          ${isEditing ? renderJourneyForm(participant) : ''}
        </li>
      `;
      })
      .join('') + renderAddParticipantListItem('bottom');
}

function renderAddParticipantListItem(position: 'top' | 'bottom'): string {
  return `
    <li class="add-participant-list-item add-participant-list-item--${position}">
      <button class="add-participant-list-button" type="button">
        Ajouter participant-e-s
      </button>
    </li>
  `;
}

function getRoutePoints(participant: Participant, mode: JourneyMode): L.LatLngExpression[] {
  const journey = getParticipantJourneys(participant.id)[mode];
  const endpointCityName = journey.endpointCity || participant.city;
  const endpointCity = findCityByName(endpointCityName);
  const canUseParticipantFallback =
    !journey.endpointCity ||
    getCityKey(endpointCityName) === getCityKey(participant.city);
  const selectedSteps = journey.steps
    .map(findCityByName)
    .filter((city): city is CityOption => Boolean(city) && hasCityCoordinates(city));

  const participantPoint: L.LatLngExpression | null = endpointCity
    ? hasCityCoordinates(endpointCity)
      ? [endpointCity.latitude as number, endpointCity.longitude as number]
      : null
    : canUseParticipantFallback &&
        participant.latitude !== null &&
        participant.longitude !== null
      ? [participant.latitude, participant.longitude]
      : null;
  const festivalPoint: L.LatLngExpression = [
    festivalLocation.latitude,
    festivalLocation.longitude,
  ];
  const stepPoints = selectedSteps.map<L.LatLngExpression>((city) => [
    city.latitude as number,
    city.longitude as number,
  ]);

  if (!participantPoint) {
    return [];
  }

  return mode === 'outbound'
    ? [participantPoint, ...stepPoints, festivalPoint]
    : [festivalPoint, ...stepPoints, participantPoint];
}

function drawRoutes(items: Participant[]): void {
  routeLayer.clearLayers();

  items.forEach((participant) => {
    const journey = getParticipantJourneys(participant.id)[activeMode];
    const hasRoute = journey.status === 'offer' && isJourneyVisible(journey);

    if (!hasRoute) {
      return;
    }

    const isSelected = participant.id === selectedParticipantId;

    const routePoints = getRoutePoints(participant, activeMode);

    if (routePoints.length < 2) {
      return;
    }

    const defaultWeight = isMobileViewport() ? 6 : 4;
    const selectedWeight = isMobileViewport() ? 8 : 6;
    const routeWeight = isSelected ? selectedWeight : defaultWeight;

    L.polyline(routePoints, {
      color: '#ffffff',
      weight: routeWeight + 4,
      opacity: 0.58,
      interactive: false,
      lineCap: 'round',
      lineJoin: 'round',
      renderer: routeRenderer,
    }).addTo(routeLayer);

    L.polyline(routePoints, {
      color: participant.color,
      weight: routeWeight,
      opacity: isSelected ? 0.95 : 0.82,
      lineCap: 'round',
      lineJoin: 'round',
      renderer: routeRenderer,
    })
      .bindPopup(
        `<strong>${escapeHtml(formatParticipantName(participant))}</strong><span>${activeMode === 'outbound' ? 'Aller' : 'Retour'}</span>`,
      )
      .addTo(routeLayer);
  });

  routeLayer.eachLayer((layer) => {
    if ('bringToFront' in layer && typeof layer.bringToFront === 'function') {
      layer.bringToFront();
    }
  });
}

function refreshVisibleMapLayers(): void {
  requestAnimationFrame(() => {
    map.invalidateSize();
    addParticipantMarkers(appParticipants);
    drawRoutes(appParticipants);

    requestAnimationFrame(() => {
      map.invalidateSize();
      drawRoutes(appParticipants);
    });
  });
}

function getJourneyMessageItems(items: Participant[]): Array<{
  participant: Participant;
  journey: Journey;
  mode: JourneyMode;
}> {
  return items.flatMap((participant) => {
    const journeys = getParticipantJourneys(participant.id);

    return (['outbound', 'return'] as JourneyMode[])
      .map((mode) => ({
        participant,
        journey: journeys[mode],
        mode,
      }))
      .filter(
        ({ journey }) =>
          isJourneyVisible(journey) &&
          Boolean(journey.message.trim()),
      );
  });
}

function getMessageItemValue(participantId: string, mode: JourneyMode): string {
  return `${participantId}::${mode}`;
}

function formatShortDate(dateValue: string): string {
  if (!dateValue) {
    return '';
  }

  const [, month, day] = dateValue.split('-');

  if (!day || !month) {
    return '';
  }

  return `${day}/${month}`;
}

function renderMessageBanner(items: Participant[]): void {
  const banner = document.querySelector<HTMLElement>('#message-banner');
  const track = document.querySelector<HTMLElement>('#message-track');

  if (!banner || !track) {
    return;
  }

  const messages = getJourneyMessageItems(items);
  const showEmptyMobileBanner = messages.length === 0 && isMobileViewport();

  banner.hidden = messages.length === 0 && !showEmptyMobileBanner;

  if (showEmptyMobileBanner) {
    track.innerHTML =
      '<span class="message-empty">Aucun message covoit actif pour le moment.</span>';
    return;
  }

  const messageSeparator =
    messages.length > 1
      ? '<span class="message-separator" aria-hidden="true">-</span>'
      : '';

  track.innerHTML = messages
    .map(({ participant, journey, mode }) => {
      const shortDate = formatShortDate(journey.date);
      const dateLabel = shortDate ? ` ${shortDate}` : '';
      const message = journey.message.trim();

      if (isDefaultJourneyMessage(participant, message)) {
        return `
          <button
            class="message-ticker-item"
            type="button"
            data-message-participant-id="${participant.id}"
            data-message-mode="${mode}"
          >
            <span>${escapeHtml(message)}</span>
          </button>
        `;
      }

      return `
        <button
          class="message-ticker-item"
          type="button"
          data-message-participant-id="${participant.id}"
          data-message-mode="${mode}"
        >
          <strong>${escapeHtml(formatParticipantName(participant))}</strong>
          <span>${escapeHtml(dateLabel)} ${escapeHtml(message)}</span>
        </button>
      `;
    })
    .join(messageSeparator);
}

function readJourneyFromForm(form: HTMLFormElement): Journey {
  const participantId = form.dataset.participantId;
  const existingJourney = participantId
    ? getParticipantJourneys(participantId)[activeMode]
    : createEmptyJourney();

  const formData = new FormData(form);
  const status = String(formData.get('status') ?? 'unset') as JourneyStatus;

  return {
    status,
    date: String(formData.get('date') ?? ''),
    endpointCity: String(formData.get('endpoint-city') ?? ''),
    message: existingJourney.message,
    steps:
      status === 'offer'
        ? Array.from(
            form.querySelectorAll<HTMLSelectElement>('select[name^="step-"]'),
          ).map((select) => select.value)
        : existingJourney.steps.map(() => emptyStepValue),
  };
}

function updateParticipantJourneyFromForm(form: HTMLFormElement): void {
  const participantId = form.dataset.participantId;

  if (!participantId) {
    return;
  }

  setParticipantJourney(participantId, activeMode, readJourneyFromForm(form));
  addParticipantMarkers(appParticipants);
  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
  renderMessageBanner(appParticipants);
}

function updateStepCountFromButton(button: HTMLButtonElement): void {
  const form = button.closest<HTMLFormElement>('.journey-form');
  const participantId = form?.dataset.participantId;
  const action = button.dataset.stepAction;

  if (!form || !participantId || !action) {
    return;
  }

  const journey = readJourneyFromForm(form);

  if (action === 'add' && journey.steps.length < maxStepCount) {
    journey.steps = [...journey.steps, emptyStepValue];
  }

  if (action === 'remove' && journey.steps.length > 0) {
    journey.steps = journey.steps.slice(0, -1);
  }

  setParticipantJourney(participantId, activeMode, journey);
  addParticipantMarkers(appParticipants);
  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
  renderMessageBanner(appParticipants);
}

function setMobileView(view: 'map' | 'participants'): void {
  activeMobileView = view;
  document.body.dataset.mobileView = view;

  document
    .querySelectorAll<HTMLButtonElement>('.mobile-view-button')
    .forEach((button) => {
      const isActive = button.dataset.mobileView === view;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

  if (view === 'map') {
    refreshVisibleMapLayers();
  }
}

function syncModalOpenState(): void {
  const hasOpenModal = Boolean(document.querySelector('.modal:not([hidden])'));

  document.body.classList.toggle('modal-open', hasOpenModal);
}

function closeMessageModal(): void {
  const modal = document.querySelector<HTMLElement>('#message-modal');

  if (!modal) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function updateMessageCounter(textarea: HTMLTextAreaElement): void {
  const counter = document.querySelector<HTMLElement>('#message-counter');

  if (counter) {
    counter.textContent = `${textarea.value.length} / ${maxMessageLength}`;
  }
}

function openMessageModal(participantId: string): void {
  const participant = getParticipantById(participantId);
  const modal = document.querySelector<HTMLElement>('#message-modal');
  const title = document.querySelector<HTMLElement>('#message-modal-title');
  const form = document.querySelector<HTMLFormElement>('#message-form');
  const textarea = document.querySelector<HTMLTextAreaElement>('#message-text');

  if (!participant || !modal || !form || !textarea) {
    return;
  }

  const journey = getParticipantJourneys(participant.id)[activeMode];
  form.dataset.participantId = participant.id;
  title?.replaceChildren(
    document.createTextNode(
      `Message - ${formatParticipantName(participant)}`,
    ),
  );
  textarea.value =
    journey.message ||
    (journey.status === 'offer'
      ? buildDefaultJourneyMessage(participant, journey, activeMode)
      : '');
  updateMessageCounter(textarea);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  textarea.focus();
}

async function saveMessageFromModal(form: HTMLFormElement): Promise<void> {
  const participantId = form.dataset.participantId;
  const textarea = document.querySelector<HTMLTextAreaElement>('#message-text');

  if (!participantId || !textarea) {
    return;
  }

  const journey = getParticipantJourneys(participantId)[activeMode];
  const isShared = await setParticipantJourney(participantId, activeMode, {
    ...journey,
    message: textarea.value.trim().slice(0, maxMessageLength),
  }, { autoMessage: false });

  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
  renderMessageBanner(appParticipants);
  closeMessageModal();

  if (!isShared && textarea.value.trim()) {
    window.alert(
      "Le message est visible sur cet appareil, mais il n'a pas été partagé avec les autres utilisateurs. Réexécute le fichier supabase/schema.sql dans Supabase pour vérifier la colonne message.",
    );
  }
}

function closeMessageDetailModal(): void {
  const modal = document.querySelector<HTMLElement>('#message-detail-modal');

  if (!modal) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove('modal-open');
  restartMessageTicker();
}

function restartMessageTicker(): void {
  const track = document.querySelector<HTMLElement>('#message-track');

  if (!track) {
    return;
  }

  track.style.animation = 'none';
  void track.offsetWidth;
  track.style.animation = '';
}

function renderMessageDetailContent(
  participantId: string,
  mode: JourneyMode,
): void {
  const participant = getParticipantById(participantId);
  const content = document.querySelector<HTMLElement>('#message-detail-content');

  if (!participant || !content) {
    return;
  }

  const journey = getParticipantJourneys(participant.id)[mode];
  const statusLabel =
    journey.status === 'offer'
      ? 'Propose un covoit'
      : journey.status === 'search'
        ? 'Cherche un covoit'
        : 'Non renseigné';

  content.innerHTML = `
    <p class="message-detail-text">${escapeHtml(journey.message)}</p>
    <dl>
      <div>
        <dt>Statut</dt>
        <dd>${statusLabel}</dd>
      </div>
      <div>
        <dt>Trajet</dt>
        <dd>${mode === 'outbound' ? 'Aller' : 'Retour'}</dd>
      </div>
      <div>
        <dt>Date</dt>
        <dd>${journey.date ? escapeHtml(journey.date) : 'Non renseignée'}</dd>
      </div>
      <div>
        <dt>Ville</dt>
        <dd>${escapeHtml(participant.city)}</dd>
      </div>
      <div>
        <dt>Téléphone</dt>
        <dd>${escapeHtml(participant.phone)}</dd>
      </div>
    </dl>
  `;
}

function openMessageDetailModal(participantId: string, mode: JourneyMode): void {
  const modal = document.querySelector<HTMLElement>('#message-detail-modal');
  const select = document.querySelector<HTMLSelectElement>('#message-detail-select');
  const messages = getJourneyMessageItems(appParticipants);

  if (!modal || !select) {
    return;
  }

  select.innerHTML = messages
    .map(({ participant, mode: itemMode }) => {
      const modeLabel = itemMode === 'outbound' ? 'Aller' : 'Retour';
      const value = getMessageItemValue(participant.id, itemMode);

      return `<option value="${value}">${escapeHtml(modeLabel)} - ${escapeHtml(formatParticipantName(participant))}</option>`;
    })
    .join('');
  select.value = getMessageItemValue(participantId, mode);
  renderMessageDetailContent(participantId, mode);
  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function setParticipantFormNotice(message: string): void {
  const notice = document.querySelector<HTMLElement>('#participant-form-notice');

  if (!notice) {
    return;
  }

  notice.textContent = message;
  notice.hidden = !message;
}

function closeParticipantModal(): void {
  const modal = document.querySelector<HTMLElement>('#participant-modal');
  const form = document.querySelector<HTMLFormElement>('#participant-form');

  if (!modal) {
    return;
  }

  modal.hidden = true;
  form?.reset();
  setParticipantFormNotice('');
  syncModalOpenState();
}

function openParticipantModal(): void {
  const modal = document.querySelector<HTMLElement>('#participant-modal');
  const citySelect =
    document.querySelector<HTMLSelectElement>('#participant-city');
  const firstNameInput =
    document.querySelector<HTMLInputElement>('#participant-first-name');

  if (!modal || !citySelect) {
    return;
  }

  citySelect.innerHTML = buildParticipantCityOptions('');
  citySelect.value = '';
  setParticipantFormNotice('');
  modal.hidden = false;
  document.body.classList.add('modal-open');
  firstNameInput?.focus();
}

async function addParticipantFromForm(form: HTMLFormElement): Promise<void> {
  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const formData = new FormData(form);
  const firstName = String(formData.get('first-name') ?? '').trim();
  const lastName = String(formData.get('last-name') ?? '').trim();
  const cityName = String(formData.get('city') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const city = findCityByName(cityName);

  if (!firstName || !lastName || !cityName || !phone) {
    setParticipantFormNotice('Tous les champs sont obligatoires.');
    return;
  }

  if (!hasCityCoordinates(city)) {
    setParticipantFormNotice(
      'Choisissez une ville avec coordonnées GPS ou ajoutez-la avant de valider.',
    );
    return;
  }

  const participant: Participant = {
    id: createParticipantId(firstName, lastName),
    firstName: formatNamePart(firstName),
    lastName: formatNamePart(lastName),
    city: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    phone,
    color: getNextParticipantColor(),
  };
  const existingParticipant = appParticipants.find(
    (item) => getParticipantIdentityKey(item) === getParticipantIdentityKey(participant),
  );

  if (existingParticipant) {
    selectedParticipantId = existingParticipant.id;
    renderParticipantList(appParticipants);
    addParticipantMarkers(appParticipants);
    setParticipantFormNotice('Cette fiche existe déjà dans la liste.');
    return;
  }

  submitButton?.setAttribute('disabled', 'true');
  setParticipantFormNotice('Ajout en cours...');

  const isShared = await saveParticipantToSupabase(participant);

  appParticipants = sortParticipants([...appParticipants, participant]);
  selectedParticipantId = participant.id;
  editingParticipantId = null;
  addParticipantMarkers(appParticipants);
  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
  renderMessageBanner(appParticipants);
  submitButton?.removeAttribute('disabled');

  if (!isShared) {
    setParticipantFormNotice(
      "Participant-e ajouté-e sur cet appareil, mais pas partagé-e. Réexécute le fichier supabase/technicians.sql dans Supabase.",
    );
    return;
  }

  closeParticipantModal();
}

function closeCityModal(): void {
  const modal = document.querySelector<HTMLElement>('#city-modal');
  const result = document.querySelector<HTMLElement>('#city-search-result');
  const form = document.querySelector<HTMLFormElement>('#city-form');

  if (!modal) {
    return;
  }

  modal.hidden = true;
  pendingCityTarget = null;
  result?.replaceChildren();

  if (result) {
    result.hidden = true;
  }

  form?.reset();
  syncModalOpenState();
}

function openCityModal(participantId: string, fieldName: string): void {
  const modal = document.querySelector<HTMLElement>('#city-modal');
  const cityNameInput = document.querySelector<HTMLInputElement>('#city-name');
  const result = document.querySelector<HTMLElement>('#city-search-result');

  if (!modal || !cityNameInput) {
    return;
  }

  pendingCityTarget = {
    type: 'journey',
    participantId,
    mode: activeMode,
    fieldName,
  };

  result?.replaceChildren();

  if (result) {
    result.hidden = true;
  }

  modal.hidden = false;
  document.body.classList.add('modal-open');
  cityNameInput.focus();
}

function openCityModalForNewParticipant(): void {
  const modal = document.querySelector<HTMLElement>('#city-modal');
  const cityNameInput = document.querySelector<HTMLInputElement>('#city-name');
  const result = document.querySelector<HTMLElement>('#city-search-result');

  if (!modal || !cityNameInput) {
    return;
  }

  pendingCityTarget = {
    type: 'new-participant',
  };

  result?.replaceChildren();

  if (result) {
    result.hidden = true;
  }

  modal.hidden = false;
  document.body.classList.add('modal-open');
  cityNameInput.focus();
}

function formatCityResultLabel(city: CityOption): string {
  const postalCode = city.postalCode ? ` (${city.postalCode})` : '';

  return `${city.name}${postalCode}`;
}

async function searchCityFromForm(form: HTMLFormElement): Promise<void> {
  const result = document.querySelector<HTMLElement>('#city-search-result');
  const formData = new FormData(form);
  const cityName = String(formData.get('city-name') ?? '').trim();
  const postalCode = String(formData.get('city-postal-code') ?? '').trim();

  if (!result || !cityName) {
    return;
  }

  result.hidden = false;
  result.innerHTML = '<p>Recherche en cours...</p>';

  const params = new URLSearchParams({
    nom: cityName,
    fields: 'nom,codesPostaux,centre',
    boost: 'population',
    limit: '5',
  });

  if (postalCode) {
    params.set('codePostal', postalCode);
  }

  try {
    const response = await fetch(`https://geo.api.gouv.fr/communes?${params}`);

    if (!response.ok) {
      throw new Error(`Erreur API ${response.status}`);
    }

    const data = (await response.json()) as GeoApiCommune[];
    const cities = data
      .map<CityOption | null>((city) => {
        const coordinates = city.centre?.coordinates;

        if (!coordinates) {
          return null;
        }

        return {
          name: city.nom,
          postalCode: postalCode || city.codesPostaux?.[0] || '',
          latitude: coordinates[1],
          longitude: coordinates[0],
        };
      })
      .filter((city): city is CityOption => Boolean(city));

    if (cities.length === 0) {
      result.innerHTML =
        '<p>Aucune ville trouvée. Vérifiez le nom ou ajoutez le code postal.</p>';
      return;
    }

    result.innerHTML = `
      <p>Choisissez la ville à ajouter :</p>
      <div class="city-result-list">
        ${cities
          .map(
            (city) => `
              <button
                type="button"
                data-city-result
                data-city-name="${escapeHtml(city.name)}"
                data-city-postal-code="${escapeHtml(city.postalCode ?? '')}"
                data-city-latitude="${city.latitude}"
                data-city-longitude="${city.longitude}"
              >
                <strong>${escapeHtml(formatCityResultLabel(city))}</strong>
                <span>${city.latitude?.toFixed(4)}, ${city.longitude?.toFixed(4)}</span>
              </button>
            `,
          )
          .join('')}
      </div>
    `;
  } catch (error) {
    console.warn('Recherche de ville impossible.', error);
    result.innerHTML =
      '<p>Impossible de rechercher la ville pour le moment. Réessayez dans quelques instants.</p>';
  }
}

function setPendingTargetCity(cityName: string): void {
  if (!pendingCityTarget) {
    return;
  }

  if (pendingCityTarget.type === 'new-participant') {
    const citySelect =
      document.querySelector<HTMLSelectElement>('#participant-city');

    if (citySelect) {
      citySelect.innerHTML = buildParticipantCityOptions(cityName);
      citySelect.value = cityName;
    }

    return;
  }

  const journey = getParticipantJourneys(pendingCityTarget.participantId)[
    pendingCityTarget.mode
  ];
  const nextJourney = normalizeJourney({ ...journey });

  if (pendingCityTarget.fieldName === 'endpoint-city') {
    nextJourney.endpointCity = cityName;
  } else if (pendingCityTarget.fieldName.startsWith('step-')) {
    const stepIndex = Number(pendingCityTarget.fieldName.replace('step-', ''));

    if (Number.isInteger(stepIndex) && stepIndex >= 0) {
      nextJourney.steps = [...nextJourney.steps];
      nextJourney.steps[stepIndex] = cityName;
    }
  }

  setParticipantJourney(pendingCityTarget.participantId, pendingCityTarget.mode, nextJourney);
  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
  renderMessageBanner(appParticipants);
}

async function addCityFromResult(button: HTMLButtonElement): Promise<void> {
  const latitude = Number(button.dataset.cityLatitude);
  const longitude = Number(button.dataset.cityLongitude);
  const city: CityOption = {
    name: button.dataset.cityName ?? '',
    postalCode: button.dataset.cityPostalCode ?? '',
    latitude,
    longitude,
  };

  if (!city.name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return;
  }

  await saveCustomCity(city);
  setPendingTargetCity(city.name);
  closeCityModal();
}

function bindControls(): void {
  const modeSelect = document.querySelector<HTMLSelectElement>('#journey-mode');
  const list = document.querySelector<HTMLUListElement>('#participant-list');
  const banner = document.querySelector<HTMLElement>('#message-banner');
  const messageForm = document.querySelector<HTMLFormElement>('#message-form');
  const messageTextarea =
    document.querySelector<HTMLTextAreaElement>('#message-text');
  const cityForm = document.querySelector<HTMLFormElement>('#city-form');
  const cityResult = document.querySelector<HTMLElement>('#city-search-result');
  const participantForm =
    document.querySelector<HTMLFormElement>('#participant-form');
  const participantCitySelect =
    document.querySelector<HTMLSelectElement>('#participant-city');

  setMobileView(activeMobileView);

  if (modeSelect) {
    modeSelect.value = activeMode;
  }

  document
    .querySelectorAll<HTMLButtonElement>('.mobile-view-button')
    .forEach((button) => {
      button.addEventListener('click', () => {
        const view = button.dataset.mobileView;

        if (view === 'map' || view === 'participants') {
          setMobileView(view);
        }
      });
    });

  modeSelect?.addEventListener('change', () => {
    activeMode = modeSelect.value as JourneyMode;
    editingParticipantId = null;
    addParticipantMarkers(appParticipants);
    renderParticipantList(appParticipants);
    drawRoutes(appParticipants);
    renderMessageBanner(appParticipants);

    if (activeMobileView === 'map') {
      refreshVisibleMapLayers();
    }
  });

  list?.addEventListener('click', (event) => {
    const addParticipantButton = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.add-participant-list-button',
    );

    if (addParticipantButton) {
      openParticipantModal();
      return;
    }

    const stepButton = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-step-action]',
    );

    if (stepButton) {
      updateStepCountFromButton(stepButton);
      return;
    }

    const messageButton = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.message-button',
    );

    if (messageButton?.dataset.participantId) {
      selectedParticipantId = messageButton.dataset.participantId;
      openMessageModal(messageButton.dataset.participantId);
      return;
    }

    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.participant-button',
    );

    if (!button?.dataset.participantId) {
      return;
    }

    selectedParticipantId = button.dataset.participantId;
    renderParticipantList(appParticipants);
    drawRoutes(appParticipants);
    renderMessageBanner(appParticipants);
  });

  list?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.edit-journey-button',
    );

    if (!button?.dataset.participantId) {
      return;
    }

    selectedParticipantId = button.dataset.participantId;
    editingParticipantId =
      editingParticipantId === button.dataset.participantId
        ? null
        : button.dataset.participantId;
    renderParticipantList(appParticipants);
    drawRoutes(appParticipants);
    renderMessageBanner(appParticipants);
  });

  list?.addEventListener('change', (event) => {
    const changedSelect = (event.target as HTMLElement).closest<HTMLSelectElement>(
      'select[name="endpoint-city"], select[name^="step-"]',
    );

    if (changedSelect?.value === addCityValue) {
      const form = changedSelect.closest<HTMLFormElement>('.journey-form');

      if (form?.dataset.participantId) {
        const journey = getParticipantJourneys(form.dataset.participantId)[activeMode];
        const stepIndex = changedSelect.name.startsWith('step-')
          ? Number(changedSelect.name.replace('step-', ''))
          : null;
        const previousValue =
          changedSelect.name === 'endpoint-city'
            ? journey.endpointCity
            : stepIndex !== null && Number.isInteger(stepIndex)
              ? journey.steps[stepIndex] ?? emptyStepValue
              : emptyStepValue;

        changedSelect.value = previousValue;
        openCityModal(form.dataset.participantId, changedSelect.name);
      }

      return;
    }

    const form = (event.target as HTMLElement).closest<HTMLFormElement>(
      '.journey-form',
    );

    if (form) {
      updateParticipantJourneyFromForm(form);
    }
  });

  banner?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-message-participant-id]',
    );

    const mode = button?.dataset.messageMode;

    if (
      button?.dataset.messageParticipantId &&
      (mode === 'outbound' || mode === 'return')
    ) {
      openMessageDetailModal(button.dataset.messageParticipantId, mode);
    }
  });

  messageTextarea?.addEventListener('input', () => {
    updateMessageCounter(messageTextarea);
  });

  messageForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    saveMessageFromModal(messageForm);
  });

  participantCitySelect?.addEventListener('change', () => {
    if (participantCitySelect.value !== addCityValue) {
      return;
    }

    participantCitySelect.value = '';
    openCityModalForNewParticipant();
  });

  participantForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    void addParticipantFromForm(participantForm);
  });

  document
    .querySelectorAll<HTMLElement>('[data-participant-close]')
    .forEach((item) => {
      item.addEventListener('click', closeParticipantModal);
    });

  document.querySelectorAll<HTMLElement>('[data-message-close]').forEach((item) => {
    item.addEventListener('click', closeMessageModal);
  });

  document
    .querySelectorAll<HTMLElement>('[data-message-detail-close]')
    .forEach((item) => {
      item.addEventListener('click', closeMessageDetailModal);
    });

  document
    .querySelector<HTMLSelectElement>('#message-detail-select')
    ?.addEventListener('change', (event) => {
      const [participantId, mode] = (event.target as HTMLSelectElement).value.split(
        '::',
      );

      if (participantId && (mode === 'outbound' || mode === 'return')) {
        renderMessageDetailContent(participantId, mode);
      }
    });

  cityForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    void searchCityFromForm(cityForm);
  });

  cityResult?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-city-result]',
    );

    if (button) {
      void addCityFromResult(button);
    }
  });

  document.querySelectorAll<HTMLElement>('[data-city-close]').forEach((item) => {
    item.addEventListener('click', closeCityModal);
  });
}

function getSavedTheme(): ThemeName {
  const savedTheme = localStorage.getItem(themeStorageKey);

  return themes.includes(savedTheme as ThemeName)
    ? (savedTheme as ThemeName)
    : 'clair-latte-vanille';
}

function applyTheme(theme: ThemeName): void {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(themeStorageKey, theme);
}

function isDarkTheme(theme: ThemeName): boolean {
  return theme.startsWith('sombre-');
}

function getSavedMapBrightness(): number {
  const savedBrightness = Number(localStorage.getItem(mapBrightnessStorageKey));

  if (Number.isNaN(savedBrightness)) {
    return defaultDarkMapBrightness;
  }

  return Math.min(110, Math.max(45, savedBrightness));
}

function setMapBrightnessCss(value: number): void {
  const brightness = Math.min(110, Math.max(45, value));

  document.documentElement.style.setProperty(
    '--map-brightness',
    `${brightness}%`,
  );
}

function applyMapBrightness(value: number): void {
  const brightness = Math.min(110, Math.max(45, value));

  setMapBrightnessCss(brightness);
  localStorage.setItem(mapBrightnessStorageKey, String(brightness));
}

function updateMapBrightnessLabel(value: number): void {
  const label = document.querySelector<HTMLElement>('#map-brightness-value');

  if (label) {
    label.textContent = `${value} %`;
  }
}

function updateMapBrightnessControls(theme: ThemeName): void {
  const controls = document.querySelector<HTMLElement>(
    '#map-brightness-controls',
  );
  const hint = document.querySelector<HTMLElement>('#map-brightness-hint');
  const brightness = getSavedMapBrightness();
  const isDark = isDarkTheme(theme);

  if (controls) {
    controls.hidden = !isDark;
  }

  if (hint) {
    hint.hidden = isDark;
  }

  setMapBrightnessCss(isDark ? brightness : 100);
  updateMapBrightnessLabel(brightness);
}

function openModal(selector: string): void {
  const modal = document.querySelector<HTMLElement>(selector);

  if (!modal) {
    return;
  }

  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeHelpAndOptionsModals(): void {
  document
    .querySelectorAll<HTMLElement>('#help-modal, #options-modal')
    .forEach((modal) => {
      modal.hidden = true;
    });
  document.body.classList.remove('modal-open');
}

function bindHelpOptions(): void {
  const helpButton = document.querySelector<HTMLButtonElement>('#help-button');
  const optionsButton =
    document.querySelector<HTMLButtonElement>('#options-button');
  const addParticipantButton =
    document.querySelector<HTMLButtonElement>('#add-participant-button');
  const themeSelect = document.querySelector<HTMLSelectElement>('#theme-select');
  const mapBrightnessInput =
    document.querySelector<HTMLInputElement>('#map-brightness');
  const savedTheme = getSavedTheme();
  const savedMapBrightness = getSavedMapBrightness();

  applyTheme(savedTheme);
  updateMapBrightnessControls(savedTheme);

  if (themeSelect) {
    themeSelect.value = savedTheme;
  }

  if (mapBrightnessInput) {
    mapBrightnessInput.value = String(savedMapBrightness);
  }

  helpButton?.addEventListener('click', () => openModal('#help-modal'));
  optionsButton?.addEventListener('click', () => openModal('#options-modal'));
  addParticipantButton?.addEventListener('click', () => openParticipantModal());

  document
    .querySelectorAll<HTMLElement>('[data-help-close], [data-options-close]')
    .forEach((item) => {
      item.addEventListener('click', closeHelpAndOptionsModals);
    });

  themeSelect?.addEventListener('change', () => {
    const selectedTheme = themeSelect.value as ThemeName;

    applyTheme(selectedTheme);
    updateMapBrightnessControls(selectedTheme);
  });

  mapBrightnessInput?.addEventListener('input', () => {
    const brightness = Number(mapBrightnessInput.value);

    applyMapBrightness(brightness);
    updateMapBrightnessLabel(brightness);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeHelpAndOptionsModals();
      closeMessageModal();
      closeMessageDetailModal();
      closeParticipantModal();
      closeCityModal();
    }
  });
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function hashText(value: string): Promise<string> {
  const encodedValue = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encodedValue);

  return bytesToHex(digest);
}

function unlockAccessGate(): void {
  const gate = document.querySelector<HTMLElement>('#access-gate');

  if (!gate) {
    return;
  }

  gate.hidden = true;
  document.body.classList.remove('access-locked');
}

function bindAccessGate(): Promise<string | null> {
  const gate = document.querySelector<HTMLElement>('#access-gate');
  const form = document.querySelector<HTMLFormElement>('#access-form');
  const input = document.querySelector<HTMLInputElement>('#access-password');
  const error = document.querySelector<HTMLElement>('#access-error');
  const savedPassword = sessionStorage.getItem(`${accessStorageKey}-password`);

  if (!gate || !form || !input) {
    return Promise.resolve(null);
  }

  if (sessionStorage.getItem(accessStorageKey) === 'true' && savedPassword) {
    unlockAccessGate();
    return Promise.resolve(savedPassword);
  }

  document.body.classList.add('access-locked');
  input.focus();

  return new Promise((resolve) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const password = input.value;
      const hash = await hashText(password);

      if (hash === accessPasswordHash) {
        sessionStorage.setItem(accessStorageKey, 'true');
        sessionStorage.setItem(`${accessStorageKey}-password`, password);
        input.value = '';
        unlockAccessGate();
        resolve(password);
        return;
      }

      if (error) {
        error.hidden = false;
      }

      input.select();
    });
  });
}

function applyRemoteJourneyRow(row: JourneyRow): void {
  savedJourneys = {
    ...savedJourneys,
    [row.participant_id]: {
      ...getParticipantJourneys(row.participant_id),
      [row.journey_mode]: normalizeJourney({
        status: row.status,
        date: row.date ?? '',
        endpointCity: row.endpoint_city ?? '',
        steps: Array.isArray(row.steps)
          ? row.steps.map(String)
          : Array(defaultStepCount).fill(emptyStepValue),
        message: row.message ?? '',
      }),
    },
  };

  saveJourneys();
  addParticipantMarkers(appParticipants);
  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
  renderMessageBanner(appParticipants);
}

function subscribeToRemoteJourneys(): void {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  supabase
    .channel('covoit_journeys_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'covoit_journeys',
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          return;
        }

        applyRemoteJourneyRow(payload.new as JourneyRow);
      },
    )
    .subscribe();
}

function subscribeToCustomCities(): void {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  supabase
    .channel('custom_cities_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'custom_cities',
      },
      (payload) => {
        const city = mapCustomCityRow(payload.new as CustomCityRow);
        customCities = mergeCustomCities([...customCities, city]);
        saveLocalCustomCities(customCities);
        addParticipantMarkers(appParticipants);
        renderParticipantList(appParticipants);
        drawRoutes(appParticipants);
        renderMessageBanner(appParticipants);
        map.invalidateSize();
      },
    )
    .subscribe();
}

async function initializeApp(): Promise<void> {
  const accessPassword = await bindAccessGate();
  currentAccessPassword = accessPassword;
  appParticipants = await loadParticipants(accessPassword);
  customCities = await loadCustomCities();
  selectedParticipantId = appParticipants[0]?.id ?? '';
  savedJourneys = await loadSavedJourneys();
  await ensureAutomaticMessagesForOffers();

  addFestivalMarker();
  addParticipantMarkers(appParticipants);
  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
  renderMessageBanner(appParticipants);
  bindControls();
  bindHelpOptions();
  subscribeToRemoteJourneys();
  subscribeToCustomCities();
}

void initializeApp();

// Leaflet doit recalculer sa taille lorsque le navigateur modifie le viewport.
window.addEventListener('resize', () => {
  refreshVisibleMapLayers();
  renderMessageBanner(appParticipants);
});

map.on('zoomend', () => {
  addParticipantMarkers(appParticipants);
});
