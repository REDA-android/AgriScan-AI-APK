import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix the LocalNotifications import if it's missing or wrong
if (!content.includes('import { LocalNotifications }')) {
    content = 'import { LocalNotifications } from "@capacitor/local-notifications";\n' + content;
}

// Fix the logic in the useEffect
const oldEffect = `      const { temp, min, max } = weather.current;
      const t = parseFloat(temp);
      const alerts = [];
      
      if (t > 35) alerts.push("⚠️ Alerte forte chaleur : " + t + "°C ! Risque de stress hydrique.");
      if (t < 2) alerts.push("❄️ Alerte risque de gel : " + t + "°C ! Protégez vos cultures.");
      if (parseFloat(weather.current.wind) > 30) alerts.push("💨 Alerte vent fort ! Conditions de pulvérisation déconseillées.");`;

const newEffect = `      const { temp, tempMin, tempMax, windSpeed } = weather.current;
      const t = Number(temp);
      const alerts = [];
      
      if (t > 35) alerts.push("⚠️ Alerte forte chaleur : " + t + "°C ! Risque de stress hydrique.");
      if (t < 2) alerts.push("❄️ Alerte risque de gel : " + t + "°C ! Protégez vos cultures.");
      if (Number(windSpeed) > 30) alerts.push("💨 Alerte vent fort ! Conditions de pulvérisation déconseillées.");`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync('src/App.tsx', content);
