export interface ProfesorData {
  municipio: string;
  schoolName: string;
  hasActiveProcess: boolean;
  hasTeacher2026: boolean;
  teacherCount: number;
  teacherName: string;
  contractType: string;
  contractDuration: string;
  musicalGroups: string;
  linkedInstitutions: boolean;
  institutions: string;
  startYear: string;
}

export interface BICEntry {
  id: string;
  name: string;
  municipalityName?: string;
  resolution: string;
  isDeclared: boolean;
  isNotDeclared: boolean;
  nivel?: string;
  tipoBic?: string;
  grupo?: string;
  subgrupo?: string;
  categoria?: string;
  subcategoria?: string;
  direccion?: string;
  zonaInfluencia?: string;
  pemp?: string;
}

export interface MunicipalityData {
  id: string;
  name: string;
  province: string;
  flagUrl: string;
  totalBICs: number;
  daneCode?: string;
  declaredCount: number;
  notDeclaredCount: number;
  nacionalCount?: number;
  departamentalCount?: number;
  municipalCount?: number;
  hasTeacher: boolean;
  profesorData?: ProfesorData;
  radarData: {
    subject: string;
    value: number;
    fullMark: number;
  }[];
  bics: BICEntry[];
}
