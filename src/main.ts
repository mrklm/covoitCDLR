import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './style.css';
import { participants, type Participant } from './participants';

const festivalLocation = {
  name: 'Festival CDLR',
  city: 'Chalon-sur-Saône',
  latitude: 46.7811,
  longitude: 4.8537,
};

const franceCenter: L.LatLngExpression = [46.8, 2.4];

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

const participantIcon = L.divIcon({
  className: 'participant-marker',
  html: '<span aria-hidden="true"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

// Le groupe facilite les prochaines évolutions : filtres, recherche et imports.
const participantLayer = L.layerGroup().addTo(map);

function formatParticipantPopup(participant: Participant): string {
  return `
    <strong>${participant.lastName} ${participant.firstName}</strong>
    <span>${participant.city}</span>
    <span>${participant.phone}</span>
  `;
}

function addFestivalMarker(): void {
  L.marker([festivalLocation.latitude, festivalLocation.longitude], {
    icon: festivalIcon,
    title: festivalLocation.name,
  })
    .bindPopup(
      `<strong>${festivalLocation.name}</strong><span>${festivalLocation.city}</span>`,
    )
    .addTo(map);
}

function addParticipantMarkers(items: Participant[]): void {
  participantLayer.clearLayers();

  items.forEach((participant) => {
    L.marker([participant.latitude, participant.longitude], {
      icon: participantIcon,
      title: `${participant.firstName} ${participant.lastName}`,
    })
      .bindPopup(formatParticipantPopup(participant))
      .addTo(participantLayer);
  });
}

function renderParticipantList(items: Participant[]): void {
  const list = document.querySelector<HTMLUListElement>('#participant-list');

  if (!list) {
    return;
  }

  list.innerHTML = items
    .map(
      (participant) => `
        <li>
          <strong>${participant.firstName} ${participant.lastName}</strong>
          <span>${participant.city}</span>
        </li>
      `,
    )
    .join('');
}

addFestivalMarker();
addParticipantMarkers(participants);
renderParticipantList(participants);

// Leaflet doit recalculer sa taille lorsque le navigateur modifie le viewport.
window.addEventListener('resize', () => {
  map.invalidateSize();
});
