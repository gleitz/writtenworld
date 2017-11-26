/* global $ google document */

const GOOGLE_SHEET_ID = '1FnoiLkT1MZ1X5F6mBrAJZJFc9fbp6yfi5rDSeiMKkP8';
const AUTHOR_KEY = 'gsx$authoroptional';
const ADDRESS_KEY = 'gsx$address';
const POEM_KEY = 'gsx$poem';
const TITLE_KEY = 'gsx$poemtitle';
const DEFAULT_ZOOM_LEVEL = 11;

let geocoder;
let map;
let isMapInitialized = false;
let isMapCentered = false;

function addToMap(poem) {
  if (!isMapCentered) {
    map.setCenter(poem.location);
    isMapCentered = true;
  }
  const marker = new google.maps.Marker({
    position: poem.location,
    title: poem.title,
    map,
  });
  const contentHtml = poem.poem.replace(/\n/g, '<br/>');
  let content = `<b>${poem.title}</b><br/><br/>
        ${contentHtml}<br/>`;
  if (poem.author) {
    content = `${content}<br/>
      -- ${poem.author}`;
  }
  const infoWindow = new google.maps.InfoWindow({
    content,
  });
  marker.addListener('click', () => {
    let panorama = new google.maps.StreetViewPanorama(
      document.getElementById('pano'), {
        position: poem.location,
        pov: {
          heading: 34,
          pitch: 10,
        },
      });
    map.setStreetView(panorama);
    infoWindow.open(map, marker);
  });
}

function loadPoemsIntoMap(poems) {
  if (!isMapInitialized) {
    setTimeout(() => {
      loadPoemsIntoMap(poems);
    }, 1000);
  }

  poems.forEach((poem) => {
    geocoder.geocode({ address: poem.address }, (results, status) => {
      if (status !== 'OK') {
        console.log(`unable to geocode ${poem.address}`);
      }
      poem.location = results[0].geometry.location;
      addToMap(poem);
    });
  });
}

function handleSheetsResponse(data) {
  if (!data || !data.feed.entry) {
    console.log('no poems returned');
  }
  const poems = data.feed.entry.map((row) => {
    const poem = {
      title: row[TITLE_KEY].$t,
      poem: row[POEM_KEY].$t,
      author: row[AUTHOR_KEY].$t,
      address: row[ADDRESS_KEY].$t,
    };
    return poem;
  });
  loadPoemsIntoMap(poems);
}

function initMap() {
  isMapInitialized = true;
  geocoder = new google.maps.Geocoder();
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: DEFAULT_ZOOM_LEVEL,
  });
}

$.getJSON(`https://spreadsheets.google.com/feeds/list/${GOOGLE_SHEET_ID}/1/public/values?alt=json-in-script&callback=?`, handleSheetsResponse);
