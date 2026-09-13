export interface PlantIssue {
  id: string;
  name: string;
  scientificName: string;
  nameEn?: string;
  nameAr?: string;
  category: 'disease' | 'pest';
  type: 'fungal' | 'bacterial' | 'viral' | 'insect' | 'mite' | 'nematode' | 'deficiency';
  affectedCrops: string[];
  severity: 'low' | 'moderate' | 'high' | 'critical';
  imageUrl: string;
  symptoms: string;
  causes: string;
  organicTreatments: string[];
  chemicalTreatments: string[];
  preventionMethods: string[];
  keywords: string[];
}

export const PLANT_DISEASES_AND_PESTS: PlantIssue[] = [
  {
    id: 'mildiou-solanacees',
    name: 'Mildiou de la Tomate & Pomme de terre',
    scientificName: 'Phytophthora infestans',
    nameEn: 'Late Blight of Tomato & Potato',
    nameAr: 'اللفحة المتأخرة (الميلديو) في الطماطم والبطاطس',
    category: 'disease',
    type: 'fungal',
    affectedCrops: ['Tomate', 'Pomme de terre', 'Aubergine', 'Piment'],
    severity: 'critical',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop',
    symptoms: "Taches foliaires vert olive à brunes d'aspect huileux, débutant souvent par l'extrémité des folioles. Par temps humide, un duvet blanc cotonneux très caractéristique apparaît à la face inférieure des feuilles. Sur tiges et pétioles, chancres bruns noirâtres cassants. Sur fruits verts : marbrures bosselées brun cuivré dures au toucher.",
    causes: "Humidité relative élevée (> 90%) combinée à des températures fraîches à modérées (15°C à 22°C). Présence d'eau libre sur le feuillage pendant au moins 6 à 8 heures consécutives (rosée abondante, aspersion, pluie). Mauvaise aération de la canopée.",
    organicTreatments: [
      "Bouillie bordelaise ou sulfate de cuivre tribasique (préventif avant pluies : 10 à 20g/L selon formulation).",
      "Décoction de prêle des champs (riche en silice) diluée à 10% en pulvérisation foliaire pour renforcer la cuticule.",
      "Bicarbonate de potassium (3 à 5 g/L) + savon noir (émulsifiant) pour stopper la germination des conidies.",
      "Bacillus amyloliquefaciens / Bacillus subtilis en biofongicide foliaire homologué."
    ],
    chemicalTreatments: [
      "Fongicides translaminaires ou systémiques : Cyazofamide (Ranman), Mandipropamide (Revus) ou Fluopicolide + Propamocarbe.",
      "Fongicides de contact : Mancozèbe (respecter DAR 3 à 7 jours) ou Chlorothalonil lorsque homologué.",
      "Alterner les modes d'action (groupes FRAC 21, 40, 43) pour éviter toute apparition de résistance."
    ],
    preventionMethods: [
      "Irrigation au goutte-à-goutte stricte (proscrire tout arrosage par aspersion qui mouille le feuillage).",
      "Suppression immédiate et destruction (hors parcelle) des premiers foyers et feuilles touchées.",
      "Espacement suffisant entre les rangs (au moins 80 cm) et effeuillage bas régulier pour favoriser la circulation d'air.",
      "Choix de variétés ou hybrides tolérants/résistants (ex: Defiant, Mountain Magic)."
    ],
    keywords: ['mildiou', 'phytophthora', 'late blight', 'tache huileuse', 'duvet blanc', 'pourriture brune', 'feuille brune']
  },
  {
    id: 'oidium-vigne-maraichage',
    name: 'Oïdium (Blanc / Maladie du blanc)',
    scientificName: 'Erysiphe necator / Golovinomyces cichoracearum',
    nameEn: 'Powdery Mildew',
    nameAr: 'البياض الدقيقي (الأوديوم)',
    category: 'disease',
    type: 'fungal',
    affectedCrops: ['Vigne', 'Courgette', 'Concombre', 'Melon', 'Tomate', 'Pêche', 'Pommier'],
    severity: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop',
    symptoms: "Feutrage poudreux blanc farineux sur les deux faces des feuilles, jeunes pousses et boutons floraux. Feuilles crispées, déformées et dessèchement précoce. Sur grappes et fruits : éclatement des baies, nécroses superficielles et arrêt de la croissance.",
    causes: "Temps chaud et sec le jour (20°C à 28°C) avec une forte hygrométrie nocturne sans pluie battante. Ombrage important et canopée dense avec mauvaise circulation d'air.",
    organicTreatments: [
      "Soufre mouillable micronisé (50 à 75 g/10L) en pulvérisation préventive et curative douce (attention : ne pas appliquer au-dessus de 30°C pour éviter les brûlures).",
      "Bicarbonate de soude ou de potassium (5g/L) additionné de savon noir (2 ml/L) qui détruit le mycélium externe par choc osmotique.",
      "Lait de vache écrémé dilué à 10% dans l'eau (riche en protéines créant des radicaux libres antiseptiques au soleil).",
      "Huile essentielle d'orange douce homologuée (action dessiccative immédiate)."
    ],
    chemicalTreatments: [
      "Fongicides systémiques triazoles : Difénoconazole (Score) ou Tébuconazole.",
      "Strobilurines : Azoxystrobine ou Kresoxim-méthyl en alternance stricte.",
      "Respecter un intervalle de 10 à 14 jours entre interventions en période de forte pousse."
    ],
    preventionMethods: [
      "Ébourgeonnage et effeuillage précoce pour éclaircir le feuillage et laisser passer la lumière directe.",
      "Limiter les excès d'engrais azotés qui provoquent une végétation trop tendre et sensible.",
      "Ramassage et compostage à chaud des feuilles tombées en fin de saison."
    ],
    keywords: ['oidium', 'oïdium', 'blanc', 'poudre blanche', 'feutrage', 'farine', 'powdery mildew', 'erysiphe']
  },
  {
    id: 'pucerons-ravageurs',
    name: 'Pucerons (Verts, Noirs, Cendrés)',
    scientificName: 'Aphis gossypii / Myzus persicae / Aphis fabae',
    nameEn: 'Aphids (Green peach / Black bean)',
    nameAr: 'المن (قمل النبات)',
    category: 'pest',
    type: 'insect',
    affectedCrops: ['Agrumes', 'Tomate', 'Pêche', 'Pommier', 'Courgette', 'Céréales', 'Haricot'],
    severity: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=800&auto=format&fit=crop',
    symptoms: "Colonies denses sur la face inférieure des jeunes feuilles et sur les bourgeons terminaux. Enroulement, crispation et décoloration du feuillage. Présence abondante de miellat collant et développement consécutif de fumagine (dépôt noir charbonneux). Transmission de plus de 50 virus végétaux (CMV, PVY).",
    causes: "Hiver doux favorisant la survie des œufs d'hiver, temps tiède et sec au printemps. Apports excessifs d'azote stimulant la production de sève riche en acides aminés.",
    organicTreatments: [
      "Savon noir liquide à l'huile de lin (20 à 30 ml par litre d'eau tiède), pulvérisé directement sur les colonies (action mécanique asphyxiante).",
      "Lâchers d'auxiliaires : larves de coccinelles indigènes (Adalia bipunctata), chrysopes (Chrysoperla carnea) ou micro-guêpes parasitoïdes (Aphidius colemani).",
      "Macération ou purin d'ortie dilué à 5% répulsif et stimulant végétal.",
      "Huile de Neem (Azadirachtine) en pulvérisation du soir."
    ],
    chemicalTreatments: [
      "Insecticides spécifiques sélectifs : Flonicamide (Teppeki) ou Spirotétramate (Movento, systémique bidirectionnel).",
      "Pyréthrinoïdes de contact (ex: Deltaméthrine, Lambda-cyhalothrine) uniquement en dernier recours pour préserver la faune utile."
    ],
    preventionMethods: [
      "Installation de bandes fleuries d'ombellifères (aneth, coriandre, fenouil) favorisant les syrphes et coccinelles.",
      "Pose de pièges englués jaunes de détection précoce sous abri.",
      "Lutte contre les fourmis qui élèvent et protègent activement les pucerons de leurs prédateurs naturels."
    ],
    keywords: ['puceron', 'pucerons', 'aphid', 'miellat', 'fumagine', 'enroulement', 'feuille recroquevillee', 'aphis', 'myzus']
  },
  {
    id: 'acariens-tetranyques',
    name: 'Tétranyques tisserands (Araignées rouges)',
    scientificName: 'Tetranychus urticae',
    nameEn: 'Two-spotted Spider Mite',
    nameAr: 'العنكبوت الأحمر (الحلم الدودي)',
    category: 'pest',
    type: 'mite',
    affectedCrops: ['Tomate', 'Agrumes', 'Vigne', 'Courgette', 'Fraise', 'Pommier', 'Aubergine'],
    severity: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&auto=format&fit=crop',
    symptoms: "Fines ponctuations jaunâtres à argentées sur la face supérieure des feuilles (déchlorophyllose). Présence de très fines toiles soyeuses enserrant les apex et les fruits en cas de forte attaque. Dessèchement bronzé complet des feuilles et chute prématurée.",
    causes: "Ambiance très chaude (> 28°C) et sécheresse extrême de l'air (< 40% HR). Absence d'ennemis naturels souvent provoquée par des traitements insecticides à large spectre.",
    organicTreatments: [
      "Introduction d'acariens prédateurs naturels : Phytoseiulus persimilis (très vorace en serre) ou Neoseiulus californicus.",
      "Pulvérisation d'eau pure fraîche le soir sous les feuilles pour rompre le microclimat sec qui leur est favorable.",
      "Huiles végétales ou minérales d'été (1%) qui étouffent les œufs et adultes.",
      "Savon potassique avec soufre mouillable à faible dose."
    ],
    chemicalTreatments: [
      "Acaricides spécifiques : Abamectine (origine de fermentation), Tébufenpyrade, ou Acéquinocyl.",
      "Toujours mouiller abondamment le dessous des feuilles pour atteindre les foyers."
    ],
    preventionMethods: [
      "Maintien d'un taux d'humidité adéquat sous serre par brumisation.",
      "Élimination des adventices hôtes (chénopodes, amarantes, mauves) aux abords des cultures.",
      "Paillage du sol pour limiter la réverbération thermique et conserver la fraîcheur."
    ],
    keywords: ['araignee rouge', 'araignée rouge', 'acarien', 'tetranychus', 'spider mite', 'toiles', 'point jaune', 'bronze']
  },
  {
    id: 'mouche-olive',
    name: 'Mouche de l\'olive',
    scientificName: 'Bactrocera oleae',
    nameEn: 'Olive Fruit Fly',
    nameAr: 'ذبابة ثمار الزيتون',
    category: 'pest',
    type: 'insect',
    affectedCrops: ['Olivier'],
    severity: 'critical',
    imageUrl: 'https://images.unsplash.com/photo-1541256942802-7b2996802bf1?w=800&auto=format&fit=crop',
    symptoms: "Piqûres triangulaires caractéristiques sur l'épiderme des olives vertes dès l'été. Galeries creusées dans la pulpe par les larves blanchâtres. Pourrissement prématuré des fruits, chute massive d'olives au sol et forte acidité de l'huile produite.",
    causes: "Températures estivales douces (22°C à 30°C) avec présence de fruits réceptifs d'au moins 8 à 10 mm. Hivers tempérés permettant la nymphose dans le sol.",
    organicTreatments: [
      "Barrière minérale protectrice à base d'argile kaolin blanche (30 à 50 kg/ha) formant un film blanc répulsif perturbant la ponte.",
      "Piégeage massif d'attraction et destruction (Attract and Kill) à l'aide de pièges à phéromone et hydrolysat de protéines.",
      "Pulvérisation de Spinosad appâté (Spintor Fly / Success Appât) homologué en agriculture biologique."
    ],
    chemicalTreatments: [
      "Phosmet ou Deltaméthrine dès que le seuil économique d'intervention (1 à 2% d'olives piquées) est franchi.",
      "Traitements localisés par taches (1 arbre sur 3) pour réduire les doses et préserver la faune auxiliaire."
    ],
    preventionMethods: [
      "Installation de pièges de surveillance dès la mi-juin pour suivre la courbe de vol des adultes.",
      "Récolte précoce dès véraison pour éviter les pontes tardives d'automne.",
      "Travail superficiel du sol en hiver pour exposer les pupes au gel et aux oiseaux prédateurs."
    ],
    keywords: ['bactrocera', 'mouche de l olive', 'olive fruit fly', 'olive piquee', 'ver de l olive', 'chute d olives']
  },
  {
    id: 'botrytis-pourriture-grise',
    name: 'Pourriture grise (Botrytis)',
    scientificName: 'Botrytis cinerea',
    nameEn: 'Grey Mould (Botrytis)',
    nameAr: 'العفن الرمادي (البوتريتيس)',
    category: 'disease',
    type: 'fungal',
    affectedCrops: ['Vigne', 'Fraise', 'Tomate', 'Aubergine', 'Poivron', 'Agrumes'],
    severity: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop',
    symptoms: "Feutrage gris souris dense et poudreux recouvrant les tissus sénescents ou blessés. Pourriture molle aqueuse des fruits et des baies. Sur tiges de tomate : chancres beiges allongés ceinturant la tige principale conduisant au flétrissement brutal du sommet.",
    causes: "Humidité stagnante (> 85%), condensations répétées, température modérée (15°C à 20°C). Blessures d'effeuillage, piqûres d'insectes ou grêle créant des portes d'entrée au champignon.",
    organicTreatments: [
      "Biofongicide à base d'Aureobasidium pullulans (Botector) ou Bacillus amyloliquefaciens en compétition spatiale.",
      "Bicarbonate de potassium (3 à 5 g/L) asséchant immédiatement la surface des tissus.",
      "Décoction d'ail concentrée pour ses propriétés antifongiques alliciques naturelles."
    ],
    chemicalTreatments: [
      "Fongicides antibotrytis spécifiques : Fludioxonil + Cyprodinil (Switch), Fenhexamide (Teldor) ou Boscalid.",
      "Appliquer impérativement aux stades clés : fin floraison, fermeture de grappe et début véraison."
    ],
    preventionMethods: [
      "Effeuillage minutieux de la zone des grappes ou des fruits pour une aération maximale.",
      "Désinfection soignée des sécateurs et outils de taille à l'alcool ou eau de Javel diluée.",
      "Éviter les excès d'azote favorisant des parois cellulaires minces et fragiles."
    ],
    keywords: ['botrytis', 'pourriture grise', 'grey mould', 'feutrage gris', 'grappe pourrie', 'chancre beige']
  },
  {
    id: 'tuta-absoluta-mineuse',
    name: 'Mineuse de la tomate (Tuta)',
    scientificName: 'Tuta absoluta',
    nameEn: 'Tomato Leafminer',
    nameAr: 'حفارة أوراق الطماطم (توتا أبسوليوتا)',
    category: 'pest',
    type: 'insect',
    affectedCrops: ['Tomate', 'Pomme de terre', 'Aubergine', 'Piment'],
    severity: 'critical',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop',
    symptoms: "Grandes mines foliaires transparentes irrégulières (en plaques claires) laissant intacte l'épiderme. Présence de petits déjections noires à l'intérieur des mines. Galeries creusées dans les tiges terminales et sous le calice des fruits verts ou mûrs, rendant la récolte invendable.",
    causes: "Microclimat chaud et tempéré sous serre ou plein champ. Cycle biologique ultra-rapide (24 à 30 jours à 25°C), permettant jusqu'à 10 à 12 générations par an.",
    organicTreatments: [
      "Pulvérisations de Bacillus thuringiensis sous-espèce kurstaki (Bt) dès l'éclosion des jeunes larves (avant pénétration dans la feuille).",
      "Lâchers précoces de punaises prédatrices de la famille des Mirides (Nesidiocoris tenuis ou Macrolophus pygmaeus).",
      "Confusion sexuelle par diffuseurs d'attractifs de phéromones (Isonet-T).",
      "Azadirachtine (huile de neem) homologuée perturbant les mues larvaires."
    ],
    chemicalTreatments: [
      "Insecticides larvicides spécifiques : Chlorantraniliprole (Coragen), Emamectine benzoate, ou Flubendiamide.",
      "Respect strict des stratégies de rotation pour ne pas sélectionner de souches résistantes."
    ],
    preventionMethods: [
      "Pose de filets anti-insectes hermétiques (maille fine 50 mesh) sur toutes les ouvertures de serre.",
      "Double porte à sas d'entrée et destruction systématique des débris végétaux après récolte.",
      "Piégeage d'interception par plaques delta ou pièges à eau avec phéromone."
    ],
    keywords: ['tuta', 'tuta absoluta', 'mineuse', 'mine foliaire', 'chenille tomate', 'feuille transparente', 'galerie fruit']
  },
  {
    id: 'carence-fer-chlorose',
    name: 'Chlorose ferrique (Carence en Fer)',
    scientificName: 'Iron Chlorosis Deficiency',
    nameEn: 'Iron Deficiency Chlorosis',
    nameAr: 'نقص الحديد (الاصفرار الورقي)',
    category: 'disease',
    type: 'deficiency',
    affectedCrops: ['Agrumes', 'Vigne', 'Pêcher', 'Pommier', 'Tomate', 'Fraisier'],
    severity: 'moderate',
    imageUrl: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=800&auto=format&fit=crop',
    symptoms: "Jaunissement prononcé du limbe des plus jeunes feuilles terminales, tandis que les nervures principales et secondaires restent d'un vert franc très contrasté. En cas d'aggravation sévère, feuilles devenant blanches décolorées avec nécroses marginales et arrêt de floraison.",
    causes: "Sols très calcaires (pH > 7.5 - 8.0) où les ions bicarbonate bloquent l'assimilation du fer par les racines. Asphyxie racinaire due à un excès d'eau ou tassement du sol.",
    organicTreatments: [
      "Apport de chélates de fer de haute stabilité type Fe-EDDHA (forme ortho-ortho active) au sol via le réseau d'irrigation (fertigation).",
      "Pulvérisations foliaires d'extraits d'algues riches en oligo-éléments chélatés d'acides aminés.",
      "Épandage massif de compost mûr et de fumier pour abaisser localement le pH de la rhizosphère."
    ],
    chemicalTreatments: [
      "Engrais d'oligo-éléments solubles spécifiques formulés pour sols calcaires (Sequestrene / Basafer).",
      "Application printanière au démarrage de la pousse foliaire et renouvellement à l'automne."
    ],
    preventionMethods: [
      "Choix de porte-greffes résistants au calcaire actif (ex: 140 Ruggeri ou Fercal pour la vigne, Citrange Carrizo pour les agrumes).",
      "Drainage efficace des parcelles pour prévenir l'asphyxie et l'engorgement hivernal.",
      "Analyse régulière du sol et de l'eau d'irrigation pour corriger l'indice de calcaire actif."
    ],
    keywords: ['chlorose', 'fer', 'jaunissement', 'nervures vertes', 'carence ferrique', 'iron deficiency', 'calcaire']
  },
  {
    id: 'rouille-brune-cereales',
    name: 'Rouille brune du blé',
    scientificName: 'Puccinia triticina',
    nameEn: 'Leaf Rust (Brown Rust) of Wheat',
    nameAr: 'الصدأ البني في القمح',
    category: 'disease',
    type: 'fungal',
    affectedCrops: ['Blé', 'Orge', 'Avoine', 'Triticale'],
    severity: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop',
    symptoms: "Pustules orangées à brun cannelle circulaires ou ovales (urédosores) dispersées sans ordre sur la face supérieure des feuilles. Dégagent une poussière rouille poudreuse au toucher. En fin de saison, apparition de pustules noires de téliospores sous les feuilles.",
    causes: "Températures tempérées à chaudes (15°C à 25°C) avec rosées matinales régulières (au moins 4 à 6 heures d'humidité sur le feuillage). Vents favorisant la dissémination des spores sur de longues distances.",
    organicTreatments: [
      "Bouillie de soufre micronisé aux premiers stades avant épiaison.",
      "Préparations à base de silice colloïdale et de décoctions de prêle.",
      "Purin de fougère stimulant les défenses naturelles des céréales."
    ],
    chemicalTreatments: [
      "Fongicides de la famille des triazoles : Tébuconazole, Époxiconazole ou Prothioconazole.",
      "Associations avec SDHI (Bixafen, Fluxapyroxad) pour une protection prolongée des deux dernières feuilles (F1 et F2)."
    ],
    preventionMethods: [
      "Semis de variétés de blé certifiées dotées de gènes de résistance (Lr).",
      "Éviter les densités de semis trop élevées qui favorisent l'humidité confinée sous la canopée.",
      "Destruction des repousses spontanées de céréales servant de pont épidémiologique estival."
    ],
    keywords: ['rouille', 'puccinia', 'rust', 'pustule', 'poudre orange', 'ble', 'orge', 'cereale']
  },
  {
    id: 'bacteriose-xanthomonas',
    name: 'Bactériose / Gale bactérienne',
    scientificName: 'Xanthomonas campestris pv. vesicatoria',
    nameEn: 'Bacterial Spot',
    nameAr: 'التبقع البكتيري (الزانثوموناس)',
    category: 'disease',
    type: 'bacterial',
    affectedCrops: ['Tomate', 'Piment', 'Poivron'],
    severity: 'high',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=800&auto=format&fit=crop',
    symptoms: "Petites taches circulaires brunes à noires (1 à 3 mm) avec un halo jaune translucide sur feuilles. Les taches s'agrandissent et forment des déchirures perforées (criblures). Sur fruits : petites verrues croûteuses et liégeuses entourées d'une bordure surélevée.",
    causes: "Chaleur élevée (25°C à 32°C) accompagnée de pluies orageuses violentes ou d'aspersion projetant les bactéries d'une feuille à l'autre. Pénétration par les stomates ou les micro-blessures de taille.",
    organicTreatments: [
      "Cuivre sous forme d'hydroxyde de cuivre ou d'oxychlorure de cuivre à dose modérée pour limiter la phytotoxicité.",
      "Bacillus amyloliquefaciens souche FZB24 homologué contre les bactérioses légumières.",
      "Stimulateurs de défense des plantes (SDP) comme les laminaires ou acibenzolar-S-méthyl."
    ],
    chemicalTreatments: [
      "Traitements bactériostatiques combinant sels de cuivre et mancozèbe pour un effet de synergie prouvé.",
      "Attention : aucun antibiotique n'est autorisé en production agricole civile."
    ],
    preventionMethods: [
      "Utilisation exclusive de semences certifiées indexées indemnes ou traitées thermiquement à l'eau chaude (50°C pendant 25 min).",
      "Éviter tout travail dans les parcelles lorsque le feuillage est mouillé.",
      "Désinfection stricte du matériel et lavage des mains des ouvriers agricoles."
    ],
    keywords: ['bacteriose', 'xanthomonas', 'bacterial spot', 'tache noire', 'halo jaune', 'gale bacterienne', 'perforation']
  }
];

export function findMatchingDiseases(queryText: string, cropFilter?: string): PlantIssue[] {
  const cleanQuery = queryText.toLowerCase().trim();
  return PLANT_DISEASES_AND_PESTS.filter(issue => {
    // Filter crop if specified
    if (cropFilter && cropFilter !== 'all') {
      const matchCrop = issue.affectedCrops.some(c => 
        c.toLowerCase().includes(cropFilter.toLowerCase()) || 
        cropFilter.toLowerCase().includes(c.toLowerCase())
      );
      if (!matchCrop) return false;
    }

    if (!cleanQuery) return true;

    // Check name, scientific name, symptoms, causes, or keywords
    return (
      issue.name.toLowerCase().includes(cleanQuery) ||
      issue.scientificName.toLowerCase().includes(cleanQuery) ||
      (issue.nameEn && issue.nameEn.toLowerCase().includes(cleanQuery)) ||
      (issue.nameAr && issue.nameAr.includes(cleanQuery)) ||
      issue.symptoms.toLowerCase().includes(cleanQuery) ||
      issue.causes.toLowerCase().includes(cleanQuery) ||
      issue.keywords.some(k => k.toLowerCase().includes(cleanQuery)) ||
      issue.affectedCrops.some(c => c.toLowerCase().includes(cleanQuery)) ||
      issue.organicTreatments.some(t => t.toLowerCase().includes(cleanQuery)) ||
      issue.chemicalTreatments.some(t => t.toLowerCase().includes(cleanQuery))
    );
  });
}

/**
 * Given an observation with phenotypicTraits or description, find linked disease entries
 */
export function linkObservationToDiseases(observation: {
  culture?: string;
  species?: string;
  phenotypicTraits?: { diseasesOrDeficiencies?: string[]; healthStatus?: string };
  description?: string;
}): PlantIssue[] {
  const matches = new Set<PlantIssue>();
  const textsToSearch: string[] = [];

  if (observation.phenotypicTraits?.diseasesOrDeficiencies) {
    textsToSearch.push(...observation.phenotypicTraits.diseasesOrDeficiencies);
  }
  if (observation.description) {
    textsToSearch.push(observation.description);
  }
  if (observation.phenotypicTraits?.healthStatus) {
    textsToSearch.push(observation.phenotypicTraits.healthStatus);
  }

  const combinedText = textsToSearch.join(' ').toLowerCase();

  for (const issue of PLANT_DISEASES_AND_PESTS) {
    // Check direct keywords
    const keywordMatch = issue.keywords.some(k => combinedText.includes(k.toLowerCase()));
    const nameMatch = combinedText.includes(issue.name.toLowerCase()) || combinedText.includes(issue.scientificName.toLowerCase());
    
    // Check if affected crops match observation culture
    const cropMatch = observation.culture 
      ? issue.affectedCrops.some(c => observation.culture?.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(observation.culture?.toLowerCase() || ''))
      : true;

    if (keywordMatch || nameMatch) {
      matches.add(issue);
    }
  }

  return Array.from(matches);
}
