import { PlantAnalysis } from '../types';

export interface OfflineDiagnosticRule {
  culture: string;
  keywords: string[];
  diseaseName: string;
  scientificName?: string;
  category: 'maladie' | 'ravageur' | 'carence' | 'stress_abiotique' | 'sain';
  confidence: number;
  symptoms: string[];
  immediateActions: string[];
  preventativeAdvice: string[];
  probableBbch: string;
}

// Base de connaissances agronomiques hors-ligne pour la zone blanche
export const OFFLINE_AGRO_KNOWLEDGE: OfflineDiagnosticRule[] = [
  {
    culture: 'Tomate',
    keywords: ['mildiou', 'tache', 'brune', 'feuille', 'humidité', 'pourriture'],
    diseaseName: 'Mildiou de la Tomate (Phytophthora infestans)',
    scientificName: 'Phytophthora infestans',
    category: 'maladie',
    confidence: 85,
    symptoms: [
      'Taches huileuses brunâtres sur les folioles à bordure décolorée',
      'Feutrage blanc au revers de la feuille en conditions humides',
      'Nécroses des tiges et pourriture marbrée des fruits'
    ],
    immediateActions: [
      'Isoler et éliminer immédiatement les feuilles et rameaux atteints',
      'Arrêter l’irrigation par aspersion pour limiter l’humidité foliaire',
      'Aérer fortement les serres ou abris'
    ],
    preventativeAdvice: [
      'Application préventive de bouillie bordelaise ou cuivre dès le retour du soleil',
      'Respecter les écartements de plantation pour favoriser la circulation de l’air'
    ],
    probableBbch: 'BBCH 65-75 (Floraison & Nouaison)'
  },
  {
    culture: 'Tomate',
    keywords: ['oïdium', 'blanc', 'poussière', 'feutrage', 'jaunissement'],
    diseaseName: 'Oïdium de la Tomate (Leveillula taurica / Oidium neolycopersici)',
    scientificName: 'Leveillula taurica',
    category: 'maladie',
    confidence: 88,
    symptoms: [
      'Taches chlorotiques jaunes sur la face supérieure des feuilles',
      'Poudrage blanc farineux discret sur la face inférieure',
      'Dessèchement prématuré du feuillage basal'
    ],
    immediateActions: [
      'Éclaircir le feuillage bas pour augmenter la luminosité',
      'Éviter les excès de fertilisation azotée'
    ],
    preventativeAdvice: [
      'Traitement au soufre mouillable aux heures fraîches',
      'Favoriser les pulvérisations de bicarbonate de potassium préventif'
    ],
    probableBbch: 'BBCH 60-70'
  },
  {
    culture: 'Tomate',
    keywords: ['tuta', 'mineuse', 'galerie', 'trou', 'feuille', 'chenille'],
    diseaseName: 'Mineuse de la Tomate (Tuta absoluta)',
    scientificName: 'Tuta absoluta',
    category: 'ravageur',
    confidence: 90,
    symptoms: [
      'Galeries transparentes blanchâtres creusées dans le parenchyme foliaire',
      'Présence d’excréments noirs caractéristiques dans les mines',
      'Perforations des bourgeons apicaux et des fruits'
    ],
    immediateActions: [
      'Installer ou inspecter les pièges à phéromones et pièges à eau lumineux',
      'Supprimer manuellement les folioles minées avec larves actives'
    ],
    preventativeAdvice: [
      'Maintenir l’étanchéité des filets insect-proof (maille 50 mesh)',
      'Introduire des auxiliaires prédateurs (Nesidiocoris tenuis / Macrolophus)'
    ],
    probableBbch: 'BBCH 40-80'
  },
  {
    culture: 'Tomate',
    keywords: ['cul', 'noir', 'nécrose', 'apicale', 'fruit', 'bout'],
    diseaseName: 'Nécrose Apicale / Cul Noir (Carence induite en Calcium)',
    category: 'carence',
    confidence: 92,
    symptoms: [
      'Tache circulaire plate et noire au pôle opposé au pédoncule du fruit',
      'Affaissement et durcissement des tissus de la pointe du fruit'
    ],
    immediateActions: [
      'Régulariser les cycles d’irrigation (éviter l’alternance sécheresse/excès)',
      'Pulvérisation foliaire de chlorure ou nitrate de calcium'
    ],
    preventativeAdvice: [
      'Contrôler la conductivité électrique (EC) de la solution fertilisante',
      'Éviter les excès de potassium et magnésium qui bloquent le calcium'
    ],
    probableBbch: 'BBCH 71-79 (Grossissement des fruits)'
  },
  {
    culture: 'Olivier',
    keywords: ['oeil', 'paon', 'tache', 'ronde', 'feuille', 'cercle', 'chute'],
    diseaseName: 'Œil de Paon de l’Olivier (Spilocaea oleagina)',
    scientificName: 'Spilocaea oleagina',
    category: 'maladie',
    confidence: 90,
    symptoms: [
      'Taches circulaires concentriques sombres auréolées de jaune sur les feuilles',
      'Défoliation massive débutant par le bas de la frondaison'
    ],
    immediateActions: [
      'Tailler les branches intérieures denses pour aérer la couronne',
      'Ramasser et brûler ou enfouir les feuilles tombées au sol'
    ],
    preventativeAdvice: [
      'Traitement cuprique préventif en automne et au débourrement printanier'
    ],
    probableBbch: 'BBCH 15-55'
  },
  {
    culture: 'Olivier',
    keywords: ['mouche', 'piqûre', 'olive', 'ver', 'galerie', 'fruit'],
    diseaseName: 'Mouche de l’Olive (Bactrocera oleae)',
    scientificName: 'Bactrocera oleae',
    category: 'ravageur',
    confidence: 88,
    symptoms: [
      'Petite piqûre triangulaire brune sur l’épiderme de l’olive',
      'Ramollissement et pourriture prématurée du fruit piqué'
    ],
    immediateActions: [
      'Poser des pièges de surveillance (attractif alimentaire + phéromone)',
      'Récolte avancée des parcelles fortement touchées pour l’huile'
    ],
    preventativeAdvice: [
      'Application d’argile kaolin en barrière minérale protectrice'
    ],
    probableBbch: 'BBCH 75-85 (Grossissement & Véraison)'
  },
  {
    culture: 'Agrumes',
    keywords: ['mineuse', 'serpentine', 'feuille', 'enroulée', 'citron', 'orange', 'clémentine'],
    diseaseName: 'Mineuse des Agrumes (Phyllocnistis citrella)',
    scientificName: 'Phyllocnistis citrella',
    category: 'ravageur',
    confidence: 89,
    symptoms: [
      'Galeries sinueuses argentées caractéristiques sur jeunes pousses',
      'Crispation, déformation et enroulement des feuilles terminales'
    ],
    immediateActions: [
      'Éviter les tailles sévères en période de forte poussée végétative',
      'Limiter les excès d’azote qui stimulent les jeunes pousses vulnérables'
    ],
    preventativeAdvice: [
      'Huile minérale blanche d’été sur les jeunes débourrements',
      'Protection des greffes et pépinières'
    ],
    probableBbch: 'BBCH 31-39 (Pousses végétatives)'
  },
  {
    culture: 'Pommier',
    keywords: ['tavelure', 'tache', 'noire', 'croûte', 'pomme', 'feuille', 'fente'],
    diseaseName: 'Tavelure du Pommier (Venturia inaequalis)',
    scientificName: 'Venturia inaequalis',
    category: 'maladie',
    confidence: 87,
    symptoms: [
      'Taches veloutées olivâtres puis noires sur feuilles et jeunes fruits',
      'Déformations, crevasses et subérisation de l’épiderme des pommes'
    ],
    immediateActions: [
      'Éliminer les feuilles au sol pour casser le cycle primaire de l’ascospores',
      'Maintenir une bonne aération de la ramure par la taille d’été'
    ],
    preventativeAdvice: [
      'Traitements fongicides préventifs lors des périodes pluvieuses critiques'
    ],
    probableBbch: 'BBCH 55-72'
  },
  {
    culture: 'Vigne',
    keywords: ['mildiou', 'tache', 'huile', 'feutrage', 'vigne', 'raisin', 'feuille'],
    diseaseName: 'Mildiou de la Vigne (Plasmopara viticola)',
    scientificName: 'Plasmopara viticola',
    category: 'maladie',
    confidence: 90,
    symptoms: [
      'Taches d’huile jaunes translucides sur face supérieure',
      'Duvet blanc dense sur face inférieure par temps humide',
      'Dessèchement et brunissement des inflorescences (rot gris/brun)'
    ],
    immediateActions: [
      'Épamprer et effeuiller modérément la zone des grappes pour aérer',
      'Surveiller les repousses vigoureuses près du sol'
    ],
    preventativeAdvice: [
      'Couverture cuprique avant les épisodes pluvieux annoncés'
    ],
    probableBbch: 'BBCH 53-75'
  },
  {
    culture: 'Pommier',
    keywords: ['carpocapse', 'ver', 'trou', 'sciure', 'pomme', 'chute'],
    diseaseName: 'Carpocapse des Pommes (Cydia pomonella)',
    scientificName: 'Cydia pomonella',
    category: 'ravageur',
    confidence: 86,
    symptoms: [
      'Orifice de pénétration avec amas de déjections granuleuses brunâtres',
      'Chute précoce des fruits véreux et pourriture secondaire'
    ],
    immediateActions: [
      'Ramasser et détruire tous les fruits piqués tombés au sol',
      'Poser des bandes de carton ondulé autour des troncs pour piéger les larves'
    ],
    preventativeAdvice: [
      'Confusion sexuelle par diffuseurs de phéromones',
      'Traitements à base de virus de la granulose (CpGV)'
    ],
    probableBbch: 'BBCH 71-85'
  },
  {
    culture: 'Fraise',
    keywords: ['botrytis', 'pourriture', 'grise', 'fraise', 'duvet', 'pourri'],
    diseaseName: 'Pourriture Grise (Botrytis cinerea)',
    scientificName: 'Botrytis cinerea',
    category: 'maladie',
    confidence: 89,
    symptoms: [
      'Ramollissement brun aqueux des fruits',
      'Couverture dense d’un feutrage grisâtre pulvérulent'
    ],
    immediateActions: [
      'Récolte et élimination minutieuse de tous les fruits contaminés',
      'Réduire l’humidité relative sous tunnel et pailler proprement'
    ],
    preventativeAdvice: [
      'Assurer une aération maximale dès le lever du jour',
      'Utiliser du paillage plastique ou paille propre pour éviter le contact sol'
    ],
    probableBbch: 'BBCH 69-89 (Fructification)'
  }
];

export interface GeneratePreliminaryDiagnosticParams {
  culture?: string;
  variety?: string;
  domain?: string;
  userNotes?: string;
  defects?: string;
  phenotypicHealth?: string;
  scanType?: string;
}

/**
 * Moteur de diagnostic préliminaire agronomique en Zone Blanche (Offline)
 * Permet d'obtenir une fiche d'analyse préliminaire immédiate et des conseils d'urgence
 * avant la synchronisation et la validation fine par Gemini Multimodal.
 */
export function generatePreliminaryDiagnostic(
  params: GeneratePreliminaryDiagnosticParams
): PlantAnalysis {
  const userText = `${params.culture || ''} ${params.variety || ''} ${params.userNotes || ''} ${params.defects || ''} ${params.phenotypicHealth || ''} ${params.scanType || ''}`.toLowerCase();

  // Recherche de la règle la plus pertinente
  let bestMatch: OfflineDiagnosticRule | null = null;
  let highestScore = 0;

  for (const rule of OFFLINE_AGRO_KNOWLEDGE) {
    let score = 0;
    const cultureMatch = params.culture && rule.culture.toLowerCase().includes(params.culture.toLowerCase().trim());
    if (cultureMatch) {
      score += 10;
    }

    for (const kw of rule.keywords) {
      if (userText.includes(kw.toLowerCase())) {
        score += 5;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = rule;
    }
  }

  // Déduction de la famille botanique selon la culture
  const cultureName = params.culture || 'Culture non spécifiée';
  let detectedFamily = 'Plantae';
  let detectedSpecies = params.variety || cultureName;

  if (/tomate|aubergine|poivron|piment|pomme de terre/i.test(cultureName)) {
    detectedFamily = 'Solanaceae';
    detectedSpecies = cultureName.toLowerCase().includes('tomate') ? 'Solanum lycopersicum' : 'Solanaceae sp.';
  } else if (/olivier|olive/i.test(cultureName)) {
    detectedFamily = 'Oleaceae';
    detectedSpecies = 'Olea europaea';
  } else if (/agrume|citron|orange|clémentine|mandarine/i.test(cultureName)) {
    detectedFamily = 'Rutaceae';
    detectedSpecies = 'Citrus sp.';
  } else if (/pommier|pomme|poirier|pêcher|abricotier|frais/i.test(cultureName)) {
    detectedFamily = 'Rosaceae';
    detectedSpecies = cultureName.toLowerCase().includes('pommier') ? 'Malus domestica' : 'Rosaceae sp.';
  } else if (/vigne|raisin/i.test(cultureName)) {
    detectedFamily = 'Vitaceae';
    detectedSpecies = 'Vitis vinifera';
  } else if (/blé|orge|maïs|céréale/i.test(cultureName)) {
    detectedFamily = 'Poaceae';
    detectedSpecies = 'Triticum sp.';
  } else if (/courgette|melon|pastèque|concombre/i.test(cultureName)) {
    detectedFamily = 'Cucurbitaceae';
    detectedSpecies = 'Cucurbita sp.';
  }

  // Construction du rapport préliminaire
  if (bestMatch && highestScore >= 10) {
    return {
      family: detectedFamily,
      species: detectedSpecies,
      variety: params.variety || 'Variété observée sur le terrain',
      culture: bestMatch.culture,
      domain: params.domain || 'Parcelle terrain',
      status: 'pending',
      bbchDominant: bestMatch.probableBbch,
      bbchSecondary: ['Stade intermédiaire observé en zone blanche'],
      organCounts: {
        flowers: 0,
        fruits: 0,
        details: 'Comptage organs sauvegardé localement.'
      },
      phenotypicTraits: {
        color: 'Observation terrain hors-ligne',
        shape: 'Conforme au phénotype',
        size: 'Standard',
        healthStatus: bestMatch.category === 'sain' ? 'Sain' : `Vigilance : ${bestMatch.diseaseName}`,
        diseasesOrDeficiencies: [bestMatch.diseaseName]
      },
      description: `[DIAGNOSTIC PRÉLIMINAIRE HORS-LIGNE - ZONE BLANCHE]\n\n` +
        `🔍 Hypothèse dominante : ${bestMatch.diseaseName} (Indice de confiance heuristique : ${bestMatch.confidence}%)\n\n` +
        `⚠️ Symptômes typiques associés :\n` +
        bestMatch.symptoms.map(s => ` • ${s}`).join('\n') + '\n\n' +
        `🚨 Recommandations agronomiques immédiates :\n` +
        bestMatch.immediateActions.map(a => ` • ${a}`).join('\n') + '\n\n' +
        `🛡️ Mesures préventives :\n` +
        bestMatch.preventativeAdvice.map(p => ` • ${p}`).join('\n') + '\n\n' +
        `ℹ️ Cette fiche sera affinée automatiquement par l'IA Gemini dès le retour de la connexion réseau.`,
      userNotes: params.userNotes || ''
    };
  }

  // Diagnostic générique en l'absence de mots-clés spécifiques
  return {
    family: detectedFamily,
    species: detectedSpecies,
    variety: params.variety || 'Enregistrement hors-ligne',
    culture: cultureName,
    domain: params.domain || 'Parcelle terrain',
    status: 'pending',
    bbchDominant: 'BBCH -- (En attente d’analyse)',
    bbchSecondary: [],
    organCounts: {
      flowers: 0,
      fruits: 0,
      details: 'Comptage sauvegardé en attente de synchronisation.'
    },
    phenotypicTraits: {
      color: 'Conforme',
      shape: 'Normal',
      size: 'Standard',
      healthStatus: params.phenotypicHealth || 'Observation terrain enregistrée',
      diseasesOrDeficiencies: params.defects ? [params.defects] : []
    },
    description: `[FICHE D'OBSERVATION HORS-LIGNE - ZONE BLANCHE]\n\n` +
      `📸 Photos et données agronomiques capturées et stockées de manière sécurisée en base locale (IndexedDB).\n` +
      `📡 Synchronisation automatique vers Firestore et validation multimodale IA programmées dès le rétablissement du réseau.`,
    userNotes: params.userNotes || ''
  };
}
