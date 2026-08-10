import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import localforage from 'localforage';

localforage.config({
  name: 'leaflet-offline',
  storeName: 'tiles'
});

const OfflineTileLayerClass = L.TileLayer.extend({
  createTile: function (coords: any, done: any) {
    const tile = document.createElement('img');
    
    L.DomEvent.on(tile, 'load', L.Util.bind(this._tileOnLoad, this, done, tile));
    L.DomEvent.on(tile, 'error', L.Util.bind(this._tileOnError, this, done, tile));

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }

    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    const url = this.getTileUrl(coords);
    const key = url;

    localforage.getItem<Blob>(key).then((blob) => {
      if (blob) {
        tile.src = URL.createObjectURL(blob);
      } else {
        // Fetch and cache
        fetch(url)
          .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.blob();
          })
          .then(blob => {
            localforage.setItem(key, blob).catch(console.error);
            tile.src = URL.createObjectURL(blob);
          })
          .catch(err => {
            console.error('Error fetching tile', err);
            tile.src = url; // Fallback to direct url
          });
      }
    }).catch(err => {
      console.error('IndexedDB error', err);
      tile.src = url;
    });

    return tile;
  }
});

export default function OfflineTileLayer(props: L.TileLayerOptions & { url: string }) {
  const map = useMap();

  useEffect(() => {
    // Pass only the necessary options and avoid relying on the full `props` object identity
    const layer = new (OfflineTileLayerClass as any)(props.url, { ...props });
    map.addLayer(layer);
    
    return () => {
      map.removeLayer(layer);
    };
  }, [map, props.url]); // Removed `props` from dependencies to avoid endless re-renders

  return null;
}
