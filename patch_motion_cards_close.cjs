const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const find = `                      <div className="p-3">
                        <h4 className="font-bold text-sm text-slate-200 truncate">
                          {obs.variety}
                        </h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                          {obs.family}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          {obs.domain && (
                            <p className="text-[10px] text-emerald-400 truncate flex items-center gap-1">
                              <MapIcon size={10} />
                              {obs.domain}
                            </p>
                          )}
                          <p className="text-[8px] text-slate-400 font-medium">
                            {obs.capturedAt
                              ? new Date(obs.capturedAt).toLocaleDateString()
                              : obs.createdAt?.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "admin" && isAdmin && (`;

const replace = `                      <div className="p-3">
                        <h4 className="font-bold text-sm text-slate-200 truncate">
                          {obs.variety}
                        </h4>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">
                          {obs.family}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          {obs.domain && (
                            <p className="text-[10px] text-emerald-400 truncate flex items-center gap-1">
                              <MapIcon size={10} />
                              {obs.domain}
                            </p>
                          )}
                          <p className="text-[8px] text-slate-400 font-medium">
                            {obs.capturedAt
                              ? new Date(obs.capturedAt).toLocaleDateString()
                              : obs.createdAt?.toDate().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "admin" && isAdmin && (`;

if (code.includes(find)) {
    code = code.replace(find, replace);
    console.log("Motion cards closing tag patched.");
} else {
    console.log("Motion cards closing tag not found.");
}

fs.writeFileSync('src/App.tsx', code);
