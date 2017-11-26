/* global $ google document */

const LAT_LNG_FROM_GOOGLE_MAPS_REGEX = /@(\-?[0-9]+\.[0-9]+),(\-?[0-9]+\.[0-9]+)/;
const GOOGLE_SHEET_ID = '1FnoiLkT1MZ1X5F6mBrAJZJFc9fbp6yfi5rDSeiMKkP8';
const AUTHOR_KEY = 'gsx$authoroptional';
const URL_KEY = 'gsx$googlemapslink';
const POEM_KEY = 'gsx$poem';
const TITLE_KEY = 'gsx$poemtitle';
const DEFAULT_ZOOM_LEVEL = 11;

let isMapInitialized = false;

function extractLatLngFromGoogleMapsUrl(url) {
  const matches = LAT_LNG_FROM_GOOGLE_MAPS_REGEX.exec(url);
  if (!matches || matches.length !== 3) {
    console.log('no match for url ' + url);
  }
  return { lat: parseFloat(matches[1]),
           lng: parseFloat(matches[2]) };
}

function loadPoemsIntoMap(poems) {
  if (!isMapInitialized) {
    setTimeout(() => {
      loadPoemsIntoMap(poems);
    }, 1000);
  }
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: DEFAULT_ZOOM_LEVEL,
    center: poems[0].latLng,
  });

  poems.forEach((poem) => {
    const marker = new google.maps.Marker({
      position: poem.latLng,
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
      infoWindow.open(map, marker);
    });
  });

}

function handleSheetsResponse(data) {
  if (!data || !data.feed.entry) {
    console.log('no poems returned');
  }
  const poems = data.feed.entry.map((row) => {
    const url = row[URL_KEY].$t;
    const latLng = extractLatLngFromGoogleMapsUrl(url);
    const poem = {
      title: row[TITLE_KEY].$t,
      poem: row[POEM_KEY].$t,
      author: row[AUTHOR_KEY].$t,
      url,
      latLng,
    };
    return poem;
  });
  loadPoemsIntoMap(poems);
}

function initMap() {
  isMapInitialized = true;
}

$.getJSON(`https://spreadsheets.google.com/feeds/list/${GOOGLE_SHEET_ID}/1/public/values?alt=json-in-script&callback=?`, handleSheetsResponse);
