import * as XLSX from 'xlsx';
import { MunicipalityData, BICEntry, ProfesorData } from '../types';

async function loadProfesData(): Promise<Record<string, ProfesorData>> {
  // Returns empty object as the file was removed
  return {};
}

const DANE_MAP: Record<string, { name: string; province: string }> = {
  '15001': { name: 'Tunja', province: 'Centro' },
  '15087': { name: 'Belén', province: 'Tundama' },
  '15092': { name: 'Betéitiva', province: 'Valderrama' },
  '15176': { name: 'Chiquinquirá', province: 'Occidente' },
  '15187': { name: 'Chivatá', province: 'Centro' },
  '15215': { name: 'Gámeza', province: 'Sugamuxi' },
  '15224': { name: 'Cucaita', province: 'Centro' },
  '15226': { name: 'Cuítiva', province: 'Sugamuxi' },
  '15232': { name: 'Chíquiza', province: 'Centro' },
  '15238': { name: 'Duitama', province: 'Tundama' },
  '15244': { name: 'El Cocuy', province: 'Gutiérrez' },
  '15299': { name: 'Garagoa', province: 'Neira' },
  '15362': { name: 'Iza', province: 'Sugamuxi' },
  '15407': { name: 'Villa de Leyva', province: 'Ricaurte' },
  '15466': { name: 'Monguí', province: 'Sugamuxi' },
  '15476': { name: 'Motavita', province: 'Centro' },
  '15500': { name: 'Oicatá', province: 'Centro' },
  '15511': { name: 'Pachavita', province: 'Neira' },
  '15516': { name: 'Paipa', province: 'Tundama' },
  '15533': { name: 'Paya', province: 'La Libertad' },
  '15600': { name: 'Ráquira', province: 'Ricaurte' },
  '15632': { name: 'Saboyá', province: 'Occidente' },
  '15646': { name: 'Samacá', province: 'Centro' },
  '15720': { name: 'Sáchica', province: 'Ricaurte' },
  '15740': { name: 'Siachoque', province: 'Centro' },
  '15753': { name: 'Soatá', province: 'Norte' },
  '15757': { name: 'Socha', province: 'Valderrama' },
  '15759': { name: 'Sogamoso', province: 'Sugamuxi' },
  '15762': { name: 'Sora', province: 'Centro' },
  '15763': { name: 'Sotaquirá', province: 'Centro' },
  '15776': { name: 'Santa Sofía', province: 'Ricaurte' },
  '15806': { name: 'Tibasosa', province: 'Sugamuxi' },
  '15810': { name: 'Tipacoque', province: 'Norte' },
  '15820': { name: 'Tópaga', province: 'Sugamuxi' },
  '15835': { name: 'Turmequé', province: 'Márquez' },
  '15837': { name: 'Tuta', province: 'Centro' },
  '15861': { name: 'Ventaquemada', province: 'Centro' },
};

export async function loadMunicipalityData(): Promise<MunicipalityData[]> {
  try {
    const response = await fetch('/data/BIC.csv');
    const csvText = await response.text();
    const workbook = XLSX.read(csvText, { type: 'string' });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

    const municipalitiesMap: Record<string, MunicipalityData> = {};

    rawData.forEach((row, index) => {
      // Handle potential trailing empty rows or header rows
      if (!row['nombre_bien'] && !row['id_bic']) return;

      const daneCodeVal = row['codigo_dane'];
      let daneCode = daneCodeVal ? String(daneCodeVal).trim() : '';
      
      if (!daneCode) {
        const daneCode2Val = row['codigo_dane₂'];
        if (daneCode2Val) daneCode = String(daneCode2Val).trim();
      }

      // If we still don't have a DANE code, check if we can infer or if we should skip
      if (!daneCode) return;

      const mapped = DANE_MAP[daneCode];
      const mName = mapped ? mapped.name : `Municipio ${daneCode}`;
      const pName = mapped ? mapped.province : 'Boyacá';

      if (!municipalitiesMap[mName]) {
        municipalitiesMap[mName] = {
          id: mName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'),
          name: mName,
          province: pName, 
          flagUrl: `/img/${mName}.png`,
          daneCode: daneCode,
          totalBICs: 0,
          declaredCount: 0,
          notDeclaredCount: 0,
          nacionalCount: 0,
          departamentalCount: 0,
          municipalCount: 0,
          hasTeacher: false,
          radarData: [
            { subject: 'Nacional', value: 0, fullMark: 0 },
            { subject: 'Departamental', value: 0, fullMark: 0 },
            { subject: 'Municipal', value: 0, fullMark: 0 },
          ],
          bics: [],
        };
      }

      const m = municipalitiesMap[mName];
      const bicName = row['nombre_bien'] || 'Patrimonio';
      const resolution = row['acto_administrativo'] || 'Sin Acto Administrativo';
      const nivel = (row['nivel'] || 'Nacional').trim();

      // All entries in the BIC database are declared cultural heritages
      const isDeclared = true;
      const isNotDeclared = false;

      const entry: BICEntry = {
        id: `${m.id}-bic-${index}`,
        name: bicName,
        municipalityName: mName,
        resolution: resolution,
        isDeclared: isDeclared,
        isNotDeclared: isNotDeclared,
        nivel: nivel,
        tipoBic: row['tipo_bic'] || '',
        grupo: row['grupo'] || '',
        subgrupo: row['subgrupo'] || '',
        categoria: row['categoria'] || '',
        subcategoria: row['subcategoria'] || '',
        direccion: row['direccion'] || '',
        zonaInfluencia: row['zona_influencia'] || '',
        pemp: row['pemp'] || '',
      };

      m.bics.push(entry);
      m.totalBICs++;
      m.declaredCount++;

      if (nivel.toLowerCase() === 'nacional') {
        m.nacionalCount = (m.nacionalCount || 0) + 1;
        m.radarData[0].value++;
      } else if (nivel.toLowerCase() === 'departamental') {
        m.departamentalCount = (m.departamentalCount || 0) + 1;
        m.radarData[1].value++;
      } else if (nivel.toLowerCase() === 'municipal') {
        m.municipalCount = (m.municipalCount || 0) + 1;
        m.radarData[2].value++;
      }
    });

    const result = Object.values(municipalitiesMap).map(m => {
      const total = m.totalBICs || 1;
      m.radarData[0].fullMark = total;
      m.radarData[1].fullMark = total;
      m.radarData[2].fullMark = total;
      return m;
    });

    // Sort priority
    const priority = ['Duitama', 'Tunja', 'Sogamoso', 'Paipa'];
    result.sort((a, b) => {
      const aIdx = priority.indexOf(a.name);
      const bIdx = priority.indexOf(b.name);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  } catch (error) {
    console.error("Error loading BIC data:", error);
    return [];
  }
}

