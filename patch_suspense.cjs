const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const findCamera = `<CameraView
                  onCapture={handleCapture}
                  isOnline={isOnline}
                  onOpenMapPicker={() => setIsMapPickerOpen(true)}
                  manualLocation={manualLocation}
                  offlineQueueCount={offlineObservations.length}
                  recentObservations={observations}
                  onSelectObservation={setSelectedObservation}
                  onDeleteObservation={handleDelete}
                  onEditObservation={(obs) => setEditingId(obs.id)}
                  isAdmin={isAdmin}
                  isPro={isPro}
                  proRequestStatus={userData?.proRequestStatus}
                  proRequestMessage={userData?.proRequestMessage}
                  onRequestProAccess={handleRequestProAccess}
                />`;
const replaceCamera = `<Suspense fallback={<div className="h-64 flex items-center justify-center text-emerald-500"><div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div></div>}>
                <CameraView
                  onCapture={handleCapture}
                  isOnline={isOnline}
                  onOpenMapPicker={() => setIsMapPickerOpen(true)}
                  manualLocation={manualLocation}
                  offlineQueueCount={offlineObservations.length}
                  recentObservations={observations}
                  onSelectObservation={setSelectedObservation}
                  onDeleteObservation={handleDelete}
                  onEditObservation={(obs) => setEditingId(obs.id)}
                  isAdmin={isAdmin}
                  isPro={isPro}
                  proRequestStatus={userData?.proRequestStatus}
                  proRequestMessage={userData?.proRequestMessage}
                  onRequestProAccess={handleRequestProAccess}
                />
                </Suspense>`;

code = code.replace(findCamera, replaceCamera);

const findMap1 = `<MapView
              markers={observations
                .filter(o => o.location && typeof o.location.lat === 'number' && typeof o.location.lng === 'number')
                .map((o) => ({
                  id: o.id,
                  lat: o.location.lat,
                  lng: o.location.lng,
                  type: o.predicted_class,
                }))}
              onMarkerClick={(id) => {
                const obs = observations.find((o) => o.id === id);
                if (obs) setSelectedObservation(obs);
              }}
              onLocationSelect={() => {}}
            />`;

const replaceMap1 = `<Suspense fallback={<div className="h-full flex items-center justify-center text-blue-500"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></div>}>
              <MapView
                markers={observations
                  .filter(o => o.location && typeof o.location.lat === 'number' && typeof o.location.lng === 'number')
                  .map((o) => ({
                    id: o.id,
                    lat: o.location.lat,
                    lng: o.location.lng,
                    type: o.predicted_class,
                  }))}
                onMarkerClick={(id) => {
                  const obs = observations.find((o) => o.id === id);
                  if (obs) setSelectedObservation(obs);
                }}
                onLocationSelect={() => {}}
              />
            </Suspense>`;
code = code.replace(findMap1, replaceMap1);

const findMap2 = `<MapView
                  markers={
                    manualLocation
                      ? [
                          {
                            id: "manual",
                            lat: manualLocation.lat,
                            lng: manualLocation.lng,
                            type: "healthy",
                          },
                        ]
                      : []
                  }
                  onLocationSelect={setManualLocation}
                />`;
const replaceMap2 = `<Suspense fallback={<div className="h-full flex items-center justify-center text-blue-500"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div></div>}>
                  <MapView
                    markers={
                      manualLocation
                        ? [
                            {
                              id: "manual",
                              lat: manualLocation.lat,
                              lng: manualLocation.lng,
                              type: "healthy",
                            },
                          ]
                        : []
                    }
                    onLocationSelect={setManualLocation}
                  />
                </Suspense>`;
code = code.replace(findMap2, replaceMap2);

const findChat = `<ChatBot />`;
const replaceChat = `<Suspense fallback={null}><ChatBot /></Suspense>`;
code = code.replace(findChat, replaceChat);

fs.writeFileSync('src/App.tsx', code);
console.log("Suspense added");
