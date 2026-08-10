import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import { LocalNotifications } from "@capacitor/local-notifications";')) {
  content = content.replace('import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";', 
  'import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";\nimport { LocalNotifications } from "@capacitor/local-notifications";');
}

const effectCode = `  const [windyOverlay, setWindyOverlay] = useState<"temp" | "rain" | "wind" | "clouds" | "gust">("temp");

  useEffect(() => {
    const checkAlerts = async () => {
      if (!weather || !weather.current) return;
      
      const { temp, min, max } = weather.current;
      const t = parseFloat(temp);
      const alerts = [];
      
      if (t > 35) alerts.push("⚠️ Alerte forte chaleur : " + t + "°C ! Risque de stress hydrique.");
      if (t < 2) alerts.push("❄️ Alerte risque de gel : " + t + "°C ! Protégez vos cultures.");
      if (parseFloat(weather.current.wind) > 30) alerts.push("💨 Alerte vent fort ! Conditions de pulvérisation déconseillées.");
      
      if (alerts.length > 0) {
        try {
          const permStatus = await LocalNotifications.checkPermissions();
          if (permStatus.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
          
          await LocalNotifications.schedule({
            notifications: alerts.map((msg, idx) => ({
              title: "AgroScan IA - Alerte Météo",
              body: msg,
              id: Date.now() + idx,
              schedule: { at: new Date(Date.now() + 1000 * (idx + 1)) },
              sound: undefined,
              attachments: undefined,
              actionTypeId: "",
              extra: null
            }))
          });
        } catch (e) {
          console.warn("LocalNotifications not available (e.g. running in web)", e);
        }
      }
    };
    checkAlerts();
  }, [weather]);`;

content = content.replace('  const [windyOverlay, setWindyOverlay] = useState<"temp" | "rain" | "wind" | "clouds" | "gust">("temp");', effectCode);

fs.writeFileSync('src/App.tsx', content);
