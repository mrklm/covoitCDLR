import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './style.css';
import { participants, type Participant } from './participants';

type JourneyMode = 'outbound' | 'return';
type JourneyStatus = 'unset' | 'offer' | 'search';

type CityOption = {
  name: string;
  latitude: number;
  longitude: number;
};

type Journey = {
  status: JourneyStatus;
  date: string;
  steps: string[];
};

type ParticipantJourneys = {
  outbound: Journey;
  return: Journey;
};

type SavedJourneys = Record<string, ParticipantJourneys>;

const storageKey = 'covoitcdlr-journeys';
const emptyStepValue = '';

const festivalLocation: CityOption & { label: string } = {
  label: 'Festival CDLR',
  name: 'Chalon-sur-Saône',
  latitude: 46.7811,
  longitude: 4.8537,
};

const cityOptions: CityOption[] = [
  { name: 'Aucune étape', latitude: 0, longitude: 0 },
  { name: 'Paris', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Lyon', latitude: 45.764, longitude: 4.8357 },
  { name: 'Dijon', latitude: 47.322, longitude: 5.0415 },
  { name: 'Macon', latitude: 46.3069, longitude: 4.8319 },
  { name: 'Clermont-Ferrand', latitude: 45.7772, longitude: 3.087 },
  { name: 'Bourges', latitude: 47.081, longitude: 2.3988 },
  { name: 'Tours', latitude: 47.3941, longitude: 0.6848 },
  { name: 'Orleans', latitude: 47.9029, longitude: 1.9093 },
  { name: 'Reims', latitude: 49.2583, longitude: 4.0317 },
  { name: 'Troyes', latitude: 48.2973, longitude: 4.0744 },
  { name: 'Besancon', latitude: 47.2378, longitude: 6.0241 },
  { name: 'Grenoble', latitude: 45.1885, longitude: 5.7245 },
  { name: 'Valence', latitude: 44.9334, longitude: 4.8924 },
  { name: 'Avignon', latitude: 43.9493, longitude: 4.8055 },
  { name: 'Montpellier', latitude: 43.611, longitude: 3.8767 },
  { name: 'Limoges', latitude: 45.8336, longitude: 1.2611 },
  { name: 'Poitiers', latitude: 46.5802, longitude: 0.3404 },
  { name: 'Nantes', latitude: 47.2184, longitude: -1.5536 },
  { name: 'Rennes', latitude: 48.1173, longitude: -1.6778 },
  { name: 'Bordeaux', latitude: 44.8378, longitude: -0.5792 },
  { name: 'Toulouse', latitude: 43.6047, longitude: 1.4442 },
  { name: 'Marseille', latitude: 43.2965, longitude: 5.3698 },
  { name: 'Nice', latitude: 43.7102, longitude: 7.262 },
  { name: 'Strasbourg', latitude: 48.5734, longitude: 7.7521 },
  { name: 'Lille', latitude: 50.6292, longitude: 3.0573 },
];

const franceCenter: L.LatLngExpression = [46.8, 2.4];
let activeMode: JourneyMode = 'outbound';
let selectedParticipantId = participants[0]?.id ?? '';
let editingParticipantId: string | null = null;
let savedJourneys = loadSavedJourneys();

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
    steps: [emptyStepValue, emptyStepValue, emptyStepValue],
  };
}

function createEmptyParticipantJourneys(): ParticipantJourneys {
  return {
    outbound: createEmptyJourney(),
    return: createEmptyJourney(),
  };
}

function loadSavedJourneys(): SavedJourneys {
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

function normalizeJourney(journey?: Partial<Journey>): Journey {
  return {
    ...createEmptyJourney(),
    ...journey,
    status: journey?.status ?? 'unset',
    steps: [
      journey?.steps?.[0] ?? emptyStepValue,
      journey?.steps?.[1] ?? emptyStepValue,
      journey?.steps?.[2] ?? emptyStepValue,
    ],
  };
}

function saveJourneys(): void {
  localStorage.setItem(storageKey, JSON.stringify(savedJourneys));
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
}

function findCityByName(cityName: string): CityOption | undefined {
  return cityOptions.find((city) => city.name === cityName);
}

function formatParticipantPopup(participant: Participant): string {
  const journey = getParticipantJourneys(participant.id)[activeMode];
  const dateLabel = journey.date ? journey.date : 'Date non renseignée';

  return `
    <strong>${participant.lastName} ${participant.firstName}</strong>
    <span>${participant.city}</span>
    <span>${participant.phone}</span>
    <span>${getStatusLabel(journey.status)}</span>
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
    L.marker([participant.latitude, participant.longitude], {
      icon: createParticipantIcon(participant.color),
      title: `${participant.firstName} ${participant.lastName}`,
    })
      .bindPopup(formatParticipantPopup(participant))
      .on('click', () => {
        selectedParticipantId = participant.id;
        renderParticipantList(participants);
        drawRoutes(participants);
      })
      .addTo(participantLayer);
  });
}

function buildCityOptions(selectedValue: string): string {
  return cityOptions
    .map((city) => {
      const value = city.name === 'Aucune étape' ? emptyStepValue : city.name;
      const selected = value === selectedValue ? 'selected' : '';

      return `<option value="${value}" ${selected}>${city.name}</option>`;
    })
    .join('');
}

function renderJourneyForm(participant: Participant): string {
  const journey = getParticipantJourneys(participant.id)[activeMode];
  const modeLabel = activeMode === 'outbound' ? 'aller' : 'retour';
  const cannotEnterRoute = journey.status !== 'offer';

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

      <label>
        Ville-étape 1
        <select name="step-0" ${cannotEnterRoute ? 'disabled' : ''}>
          ${buildCityOptions(journey.steps[0] ?? emptyStepValue)}
        </select>
      </label>

      <label>
        Ville-étape 2
        <select name="step-1" ${cannotEnterRoute ? 'disabled' : ''}>
          ${buildCityOptions(journey.steps[1] ?? emptyStepValue)}
        </select>
      </label>

      <label>
        Ville-étape 3
        <select name="step-2" ${cannotEnterRoute ? 'disabled' : ''}>
          ${buildCityOptions(journey.steps[2] ?? emptyStepValue)}
        </select>
      </label>
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
    return '<span class="status-icon status-icon--offer" aria-label="Propose un covoit" title="Propose un covoit">auto</span>';
  }

  if (status === 'search') {
    return '<span class="status-icon status-icon--search" aria-label="Cherche un covoit" title="Cherche un covoit">main</span>';
  }

  return '<span class="status-icon status-icon--unset" aria-label="Statut non renseigné" title="Statut non renseigné">?</span>';
}

function renderParticipantList(items: Participant[]): void {
  const list = document.querySelector<HTMLUListElement>('#participant-list');

  if (!list) {
    return;
  }

  list.innerHTML = items
    .map((participant) => {
      const isSelected = participant.id === selectedParticipantId;
      const isEditing = participant.id === editingParticipantId;
      const journey = getParticipantJourneys(participant.id)[activeMode];
      const hasJourney =
        journey.status !== 'unset' || journey.date || journey.steps.some(Boolean);

      return `
        <li class="${isSelected ? 'is-selected' : ''}">
          <div class="participant-row">
            <button class="participant-button" type="button" data-participant-id="${participant.id}">
              <span class="participant-name">
                <span class="participant-color" style="--participant-color: ${participant.color}"></span>
                <strong>${participant.firstName} ${participant.lastName}</strong>
                ${getStatusIcon(journey.status)}
              </span>
              <span>${participant.city}${hasJourney ? ' - renseignements saisis' : ''}</span>
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
  const selectedSteps = journey.steps
    .map(findCityByName)
    .filter((city): city is CityOption => Boolean(city));

  const participantPoint: L.LatLngExpression = [
    participant.latitude,
    participant.longitude,
  ];
  const festivalPoint: L.LatLngExpression = [
    festivalLocation.latitude,
    festivalLocation.longitude,
  ];
  const stepPoints = selectedSteps.map<L.LatLngExpression>((city) => [
    city.latitude,
    city.longitude,
  ]);

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

    L.polyline(getRoutePoints(participant, activeMode), {
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

function updateParticipantJourneyFromForm(form: HTMLFormElement): void {
  const participantId = form.dataset.participantId;

  if (!participantId) {
    return;
  }

  const formData = new FormData(form);
  const status = String(formData.get('status') ?? 'unset') as JourneyStatus;
  const journey: Journey = {
    status,
    date: String(formData.get('date') ?? ''),
    steps:
      status === 'offer'
        ? [
            String(formData.get('step-0') ?? ''),
            String(formData.get('step-1') ?? ''),
            String(formData.get('step-2') ?? ''),
          ]
        : [emptyStepValue, emptyStepValue, emptyStepValue],
  };

  setParticipantJourney(participantId, activeMode, journey);
  addParticipantMarkers(participants);
  renderParticipantList(participants);
  drawRoutes(participants);
}

function bindControls(): void {
  const modeSelect = document.querySelector<HTMLSelectElement>('#journey-mode');
  const list = document.querySelector<HTMLUListElement>('#participant-list');

  modeSelect?.addEventListener('change', () => {
    activeMode = modeSelect.value as JourneyMode;
    editingParticipantId = null;
    addParticipantMarkers(participants);
    renderParticipantList(participants);
    drawRoutes(participants);
  });

  list?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '.participant-button',
    );

    if (!button?.dataset.participantId) {
      return;
    }

    selectedParticipantId = button.dataset.participantId;
    renderParticipantList(participants);
    drawRoutes(participants);
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
    renderParticipantList(participants);
    drawRoutes(participants);
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

addFestivalMarker();
addParticipantMarkers(participants);
renderParticipantList(participants);
drawRoutes(participants);
bindControls();

// Leaflet doit recalculer sa taille lorsque le navigateur modifie le viewport.
window.addEventListener('resize', () => {
  map.invalidateSize();
});
