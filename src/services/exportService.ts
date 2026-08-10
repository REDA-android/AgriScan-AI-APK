import * as XLSX from 'xlsx';
import { Observation } from '../types';

/**
 * Functional Export Service for Excel (.xlsx) and CSV
 * Preserves pure data manipulation without altering UI components.
 */
export const exportService = {
  /**
   * Export array of observations to an Excel file (.xlsx)
   */
  exportToExcel(observations: Observation[], filename = 'observations-agriscan.xlsx') {
    if (!observations || observations.length === 0) return;

    const data = observations.map((obs) => ({
      ID: obs.id,
      Date: new Date(obs.capturedAt || Date.now()).toLocaleString(),
      Culture: obs.culture || 'N/A',
      Variété: obs.variety || 'N/A',
      'Stade BBCH': obs.bbchDominant || 'N/A',
      Domaine: obs.domain || 'N/A',
      Statut: obs.status || 'N/A',
      'Latitude GPS': obs.location?.lat ?? 'N/A',
      'Longitude GPS': obs.location?.lng ?? 'N/A',
      'État Sanitaire': obs.phenotypicTraits?.healthStatus || 'N/A',
      'Maladies/Carences': obs.phenotypicTraits?.diseasesOrDeficiencies?.join('; ') || 'N/A',
      Description: obs.description || '',
      Notes: obs.userNotes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Observations');

    XLSX.writeFile(workbook, filename);
  },

  /**
   * Export array of observations to CSV file
   */
  exportToCSV(observations: Observation[], filename = 'observations-agriscan.csv') {
    if (!observations || observations.length === 0) return;

    const data = observations.map((obs) => ({
      ID: obs.id,
      Date: new Date(obs.capturedAt || Date.now()).toLocaleString(),
      Culture: obs.culture || 'N/A',
      Variete: obs.variety || 'N/A',
      BBCH: obs.bbchDominant || 'N/A',
      Domaine: obs.domain || 'N/A',
      Status: obs.status || 'N/A',
      Latitude: obs.location?.lat ?? 'N/A',
      Longitude: obs.location?.lng ?? 'N/A',
      HealthStatus: obs.phenotypicTraits?.healthStatus || 'N/A',
      Diseases: obs.phenotypicTraits?.diseasesOrDeficiencies?.join('; ') || 'N/A',
      Notes: obs.userNotes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default exportService;
