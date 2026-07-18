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
};

type Journey = {
  status: JourneyStatus;
  date: string;
  endpointCity: string;
  steps: string[];
};

type ParticipantJourneys = {
  outbound: Journey;
  return: Journey;
};

type SavedJourneys = Record<string, ParticipantJourneys>;

type JourneyRow = {
  participant_id: string;
  journey_mode: JourneyMode;
  status: JourneyStatus;
  date: string | null;
  endpoint_city: string | null;
  steps: unknown;
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

const storageKey = 'covoitcdlr-journeys';
const themeStorageKey = 'covoitcdlr-theme';
const accessStorageKey = 'covoitcdlr-access-granted';
const accessPasswordHash =
  '06fabe7992014b72287461d5a55221f209d6ac71781bae72cdb601a801b10185';
const emptyStepValue = '';
const defaultStepCount = 3;
const maxStepCount = 8;

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
  { name: 'Angers', latitude: 47.4819, longitude: -0.5629 },
  { name: 'Avignon', latitude: 43.9493, longitude: 4.8055 },
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
  { name: 'Clermont Ferrand', latitude: 45.787, longitude: 3.1127 },
  { name: 'Clermont-Ferrand', latitude: 45.787, longitude: 3.1127 },
  { name: "Collonges Au Mont D'Or", latitude: 45.8188, longitude: 4.8425 },
  { name: 'Dieulefit', latitude: 44.5354, longitude: 5.0685 },
  { name: 'Dijon', latitude: 47.3319, longitude: 5.0322 },
  { name: 'Domagne', latitude: 48.0654, longitude: -1.4051 },
  { name: 'Epagny Metz Tessy', latitude: 45.943, longitude: 6.0934 },
  { name: 'Flée', latitude: 47.7353, longitude: 0.4577 },
  { name: 'Flee', latitude: 47.7353, longitude: 0.4577 },
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
  { name: 'Nantes', latitude: 47.2382, longitude: -1.5603 },
  { name: 'NANTES', latitude: 47.2382, longitude: -1.5603 },
  { name: 'Nice', latitude: 43.7102, longitude: 7.262 },
  { name: 'Nîmes', latitude: 43.8322, longitude: 4.3429 },
  { name: 'Orleans', latitude: 47.9029, longitude: 1.9093 },
  { name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Poitiers', latitude: 46.5802, longitude: 0.3404 },
  { name: 'Quingey', latitude: 47.1115, longitude: 5.8819 },
  { name: 'Reims', latitude: 49.2583, longitude: 4.0317 },
  { name: 'Rennes', latitude: 48.1173, longitude: -1.6778 },
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
  { name: 'Villefranche-Sur-Saône', latitude: 45.9837, longitude: 4.726 },
  { name: 'Villeurbanne', latitude: 45.7719, longitude: 4.8898 },
  { name: 'Voiteur', latitude: 46.7431, longitude: 5.6014 },
];

const franceCenter: L.LatLngExpression = [46.8, 2.4];
let activeMode: JourneyMode = 'outbound';
let appParticipants: Participant[] = demoParticipants;
let selectedParticipantId = appParticipants[0]?.id ?? '';
let editingParticipantId: string | null = null;
let savedJourneys: SavedJourneys = {};
let participantSourceNotice = '';

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
  iconSize: [54, 54],
  iconAnchor: [27, 27],
  popupAnchor: [0, -25],
});

const participantLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);

function createEmptyJourney(): Journey {
  return {
    status: 'unset',
    date: '',
    endpointCity: '',
    steps: Array(defaultStepCount).fill(emptyStepValue),
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
    .select('participant_id, journey_mode, status, date, endpoint_city, steps');

  if (error) {
    console.warn('Chargement Supabase impossible, données locales utilisées.', error);
    return localJourneys;
  }

  const remoteJourneys = (data as JourneyRow[]).reduce<SavedJourneys>(
    (journeys, row) => {
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
        }),
      };

      return journeys;
    },
    {},
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
  };
}

function saveJourneys(): void {
  localStorage.setItem(storageKey, JSON.stringify(savedJourneys));
}

async function saveJourneyToSupabase(
  participantId: string,
  mode: JourneyMode,
  journey: Journey,
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    return;
  }

  const { error } = await supabase.from('covoit_journeys').upsert(
    {
      participant_id: participantId,
      journey_mode: mode,
      status: journey.status,
      date: journey.date,
      endpoint_city: journey.endpointCity,
      steps: journey.steps,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'participant_id,journey_mode',
    },
  );

  if (error) {
    console.warn('Sauvegarde Supabase impossible.', error);
  }
}

function getParticipantJourneys(participantId: string): ParticipantJourneys {
  const journeys = savedJourneys[participantId];

  return {
    outbound: normalizeJourney(journeys?.outbound),
    return: normalizeJourney(journeys?.return),
  };
}

function setParticipantJourney(
  participantId: string,
  mode: JourneyMode,
  journey: Journey,
): void {
  savedJourneys = {
    ...savedJourneys,
    [participantId]: {
      ...getParticipantJourneys(participantId),
      [mode]: journey,
    },
  };

  saveJourneys();
  void saveJourneyToSupabase(participantId, mode, journey);
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

function buildMissingCityOption(selectedValue: string): string {
  if (!selectedValue) {
    return '';
  }

  return `<option value="${escapeHtml(selectedValue)}" selected>${escapeHtml(selectedValue)} - coordonnées à compléter</option>`;
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
  return {
    id: technician.id,
    firstName: technician.first_name,
    lastName: technician.last_name,
    city: technician.city,
    latitude: technician.latitude,
    longitude: technician.longitude,
    phone: technician.phone,
    color: technician.color ?? participantColors[index % participantColors.length],
  };
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

  return remoteParticipants;
}

function formatParticipantPopup(participant: Participant): string {
  const journey = getParticipantJourneys(participant.id)[activeMode];
  const dateLabel = journey.date ? journey.date : 'Date non renseignée';
  const endpointLabel =
    activeMode === 'outbound' ? 'Départ' : 'Arrivée retour';
  const endpointCity = journey.endpointCity || participant.city;

  return `
    <strong>${participant.lastName} ${participant.firstName}</strong>
    <span>${participant.city}</span>
    <span>${participant.phone}</span>
    <span>${getStatusLabel(journey.status)}</span>
    <span>${endpointLabel} : ${endpointCity}</span>
    <span>${activeMode === 'outbound' ? 'Aller' : 'Retour'} : ${dateLabel}</span>
  `;
}

function createParticipantIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'participant-marker',
    html: `<span aria-hidden="true" style="--participant-color: ${color}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
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

  items.forEach((participant) => {
    if (participant.latitude === null || participant.longitude === null) {
      return;
    }

    L.marker([participant.latitude, participant.longitude], {
      icon: createParticipantIcon(participant.color),
      title: `${participant.firstName} ${participant.lastName}`,
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

  return (
    missingSelectedOption +
    cities
    .map((city) => {
      const value = city.name === 'Aucune étape' ? emptyStepValue : city.name;
      const selected = getCityKey(value) === selectedKey ? 'selected' : '';
      const coordinatesLabel =
        value && !hasCityCoordinates(city) ? ' - coordonnées à compléter' : '';

      return `<option value="${escapeHtml(value)}" ${selected}>${escapeHtml(city.name + coordinatesLabel)}</option>`;
    })
    .join('')
  );
}

function buildEndpointCityOptions(selectedValue: string): string {
  const cities = getSelectableCities(false);
  const missingSelectedOption = hasSelectableCityValue(cities, selectedValue)
    ? ''
    : buildMissingCityOption(selectedValue);
  const selectedKey = getCityKey(selectedValue);

  return (
    missingSelectedOption +
    cities
    .map((city) => {
      const selected =
        getCityKey(city.name) === selectedKey ? 'selected' : '';
      const coordinatesLabel = !hasCityCoordinates(city)
        ? ' - coordonnées à compléter'
        : '';

      return `<option value="${escapeHtml(city.name)}" ${selected}>${escapeHtml(city.name + coordinatesLabel)}</option>`;
    })
    .join('')
  );
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

  if (!list) {
    return;
  }

  if (notice) {
    notice.textContent = participantSourceNotice;
    notice.hidden = !participantSourceNotice;
  }

  if (items.length === 0) {
    list.innerHTML = '<li class="empty-list">Aucun participant à afficher.</li>';
    return;
  }

  list.innerHTML = items
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
        journey.steps.some(Boolean);

      return `
        <li class="${isSelected ? 'is-selected' : ''}">
          <div class="participant-row">
            <button class="participant-button" type="button" data-participant-id="${participant.id}">
              <span class="participant-name">
                <span class="participant-color" style="--participant-color: ${participant.color}"></span>
                <strong>${participant.firstName} ${participant.lastName}</strong>
                ${getStatusIcon(journey.status)}
              </span>
              <span>
                ${participant.city}${hasJourney ? ' - renseignements saisis' : ''}
                ${hasMapPoint ? '' : ' - coordonnées à compléter'}
              </span>
            </button>
            <button class="edit-journey-button" type="button" data-participant-id="${participant.id}">
              ${isEditing ? 'Fermer' : 'Renseigner'}
            </button>
          </div>
          ${isEditing ? renderJourneyForm(participant) : ''}
        </li>
      `;
    })
    .join('');
}

function getRoutePoints(participant: Participant, mode: JourneyMode): L.LatLngExpression[] {
  const journey = getParticipantJourneys(participant.id)[mode];
  const endpointCity = findCityByName(journey.endpointCity || participant.city);
  const selectedSteps = journey.steps
    .map(findCityByName)
    .filter((city): city is CityOption => Boolean(city) && hasCityCoordinates(city));

  const participantPoint: L.LatLngExpression | null = endpointCity
    ? hasCityCoordinates(endpointCity)
      ? [endpointCity.latitude as number, endpointCity.longitude as number]
      : null
    : participant.latitude !== null && participant.longitude !== null
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
    const hasRoute = journey.status === 'offer';

    if (!hasRoute) {
      return;
    }

    const isSelected = participant.id === selectedParticipantId;

    const routePoints = getRoutePoints(participant, activeMode);

    if (routePoints.length < 2) {
      return;
    }

    L.polyline(routePoints, {
      color: participant.color,
      weight: isSelected ? 5 : 3,
      opacity: isSelected ? 0.9 : 0.45,
      dashArray: isSelected ? undefined : '6 8',
    })
      .bindPopup(
        `<strong>${participant.firstName} ${participant.lastName}</strong><span>${activeMode === 'outbound' ? 'Aller' : 'Retour'}</span>`,
      )
      .addTo(routeLayer);
  });
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
}

function bindControls(): void {
  const modeSelect = document.querySelector<HTMLSelectElement>('#journey-mode');
  const list = document.querySelector<HTMLUListElement>('#participant-list');

  modeSelect?.addEventListener('change', () => {
    activeMode = modeSelect.value as JourneyMode;
    editingParticipantId = null;
    addParticipantMarkers(appParticipants);
    renderParticipantList(appParticipants);
    drawRoutes(appParticipants);
  });

  list?.addEventListener('click', (event) => {
    const stepButton = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[data-step-action]',
    );

    if (stepButton) {
      updateStepCountFromButton(stepButton);
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
  });

  list?.addEventListener('change', (event) => {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>(
      '.journey-form',
    );

    if (form) {
      updateParticipantJourneyFromForm(form);
    }
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

function setActiveModalTab(tabName: string): void {
  document.querySelectorAll<HTMLButtonElement>('.modal-tab').forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  document
    .querySelectorAll<HTMLElement>('[data-tab-panel]')
    .forEach((panel) => {
      const isActive = panel.dataset.tabPanel === tabName;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
}

function openHelpOptionsModal(): void {
  const modal = document.querySelector<HTMLElement>('#help-options-modal');

  if (!modal) {
    return;
  }

  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeHelpOptionsModal(): void {
  const modal = document.querySelector<HTMLElement>('#help-options-modal');

  if (!modal) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function bindHelpOptions(): void {
  const openButton =
    document.querySelector<HTMLButtonElement>('#help-options-button');
  const themeSelect = document.querySelector<HTMLSelectElement>('#theme-select');
  const savedTheme = getSavedTheme();

  applyTheme(savedTheme);

  if (themeSelect) {
    themeSelect.value = savedTheme;
  }

  openButton?.addEventListener('click', openHelpOptionsModal);

  document.querySelectorAll<HTMLElement>('[data-modal-close]').forEach((item) => {
    item.addEventListener('click', closeHelpOptionsModal);
  });

  document.querySelectorAll<HTMLButtonElement>('.modal-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab) {
        setActiveModalTab(tab.dataset.tab);
      }
    });
  });

  themeSelect?.addEventListener('change', () => {
    applyTheme(themeSelect.value as ThemeName);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeHelpOptionsModal();
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
      }),
    },
  };

  saveJourneys();
  addParticipantMarkers(appParticipants);
  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
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

async function initializeApp(): Promise<void> {
  const accessPassword = await bindAccessGate();
  appParticipants = await loadParticipants(accessPassword);
  selectedParticipantId = appParticipants[0]?.id ?? '';
  savedJourneys = await loadSavedJourneys();

  addFestivalMarker();
  addParticipantMarkers(appParticipants);
  renderParticipantList(appParticipants);
  drawRoutes(appParticipants);
  bindControls();
  bindHelpOptions();
  subscribeToRemoteJourneys();
}

void initializeApp();

// Leaflet doit recalculer sa taille lorsque le navigateur modifie le viewport.
window.addEventListener('resize', () => {
  map.invalidateSize();
});
