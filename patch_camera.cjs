const fs = require('fs');
let code = fs.readFileSync('src/components/CameraView.tsx', 'utf8');

const oldCode = `        // Only set GPS if we haven't already set EXIF location
        setCurrentLocation(prev => {
          if (locationSource === 'exif') return prev;
          setLocationSource('gps');
          return {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        });`;

const newCode = `        // Only set GPS if we haven't already set EXIF location
        if (locationSource !== 'exif') {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationSource('gps');
        }`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('src/components/CameraView.tsx', code);
