import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const firmsKey = env.FIRMS_MAP_KEY || '4570132a34f2e9b9c94a4b24bfa6ff06';

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'firms-api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/firms', async (req, res) => {
            try {
              const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
              const lat = parseFloat(url.searchParams.get('latitude') || '-2.5');
              const lon = parseFloat(url.searchParams.get('longitude') || '114.0');
              const days = parseInt(url.searchParams.get('days') || '2', 10);

              const delta = 1.0;
              const minLon = (lon - delta).toFixed(3);
              const minLat = (lat - delta).toFixed(3);
              const maxLon = (lon + delta).toFixed(3);
              const maxLat = (lat + delta).toFixed(3);

              const firmsUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${firmsKey}/VIIRS_SNPP_NRT/${minLon},${minLat},${maxLon},${maxLat}/${days}`;

              const response = await fetch(firmsUrl);
              const text = await response.text();
              const lines = text.trim().split('\n');

              if (lines.length <= 1) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ count: 0, observations: [] }));
                return;
              }

              const headers = lines[0].split(',');
              const latIdx = headers.indexOf('latitude');
              const lonIdx = headers.indexOf('longitude');
              const brightIdx = headers.indexOf('bright_ti4');
              const frpIdx = headers.indexOf('frp');
              const timeIdx = headers.indexOf('acq_time');
              const dateIdx = headers.indexOf('acq_date');
              const confIdx = headers.indexOf('confidence');

              const observations = [];
              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',');
                if (cols.length > latIdx && cols[latIdx]) {
                  observations.push({
                    latitude: parseFloat(cols[latIdx]),
                    longitude: parseFloat(cols[lonIdx]),
                    brightness: brightIdx >= 0 ? parseFloat(cols[brightIdx]) : 330,
                    frp: frpIdx >= 0 ? parseFloat(cols[frpIdx]) : 30,
                    confidence: confIdx >= 0 ? cols[confIdx] : 'nominal',
                    observed_at: `${cols[dateIdx]}T${cols[timeIdx]}:00Z`,
                    source: 'NASA FIRMS VIIRS_SNPP_NRT',
                    is_simulated: false,
                  });
                }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ count: observations.length, observations }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        },
      },
    ],
  };
});
