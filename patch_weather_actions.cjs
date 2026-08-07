const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const findHeaderButtons = `              <button
                onClick={handleShareWeather}
                className="p-1 rounded-full text-slate-400 hover:bg-white/5 transition-colors"
                title="Partager la météo"
              >
                <Share2 size={14} />
              </button>
              <button
                onClick={handleExportWeatherReport}
                className="p-1 rounded-full text-slate-400 hover:bg-white/5 transition-colors"
                title="Générer un rapport PDF"
              >
                <FileText size={14} />
              </button>`;

if (code.includes(findHeaderButtons)) {
    code = code.replace(findHeaderButtons, "");
    console.log("Header buttons removed.");
}

const findInsertionPoint = `                <div className="weather-quick-pill px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors">
                  <Wind size={14} className="text-slate-400 dark:text-slate-300 stroke-[2.2]" />
                  <span className="weather-quick-pill-text text-xs font-black text-slate-200">
                    {weather.current.windSpeed != null ? \`\${Math.round(weather.current.windSpeed)} km/h\` : "--"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>`;

const replaceInsertionPoint = `                <div className="weather-quick-pill px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors">
                  <Wind size={14} className="text-slate-400 dark:text-slate-300 stroke-[2.2]" />
                  <span className="weather-quick-pill-text text-xs font-black text-slate-200">
                    {weather.current.windSpeed != null ? \`\${Math.round(weather.current.windSpeed)} km/h\` : "--"}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleExportWeatherReport}
                  className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider"
                  title="Télécharger le rapport PDF"
                >
                  <FileText size={16} /> Exporter PDF
                </button>
                <button
                  onClick={handleShareWeather}
                  className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider"
                  title="Partager la météo"
                >
                  <Share2 size={16} /> Partager
                </button>
              </div>
            </div>
          </div>
        </div>`;

if (code.includes(findInsertionPoint)) {
    code = code.replace(findInsertionPoint, replaceInsertionPoint);
    console.log("Actions inserted.");
} else {
    console.log("Insertion point not found.");
}

fs.writeFileSync('src/App.tsx', code);
