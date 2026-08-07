const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const find = `              ) : (
                filteredObservations.map((obs, index) => (
                  <motion.div
                    key={obs.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }} layout
                    transition={{ duration: 0.3, delay: index * 0.05 }}`;

const replace = `              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredObservations.map((obs, index) => (
                    <motion.div
                      key={obs.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}`;

if (code.includes(find)) {
    code = code.replace(find, replace);
    console.log("Replaced start");
} else {
    console.log("Start not found");
}

const findEnd = `                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}`;

const replaceEnd = `                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              )}`;

if (code.includes(findEnd)) {
    code = code.replace(findEnd, replaceEnd);
    console.log("Replaced end");
} else {
    console.log("End not found");
}

fs.writeFileSync('src/App.tsx', code);
