export class TreatmentStatisticsDto {
  total: number;
  active: number;
  inactive: number;
  byType: TreatmentByTypeDto[];
  mostUsed: MostUsedTreatmentDto[];
  averagePrice: number;
  averageDuration: number;
}

export class TreatmentByTypeDto {
  type: string;
  count: number;
  percentage: number;
}

export class MostUsedTreatmentDto {
  id: string;
  name: string;
  type: string; // Aquí debe ser string, no TreatmentType
  appointmentsCount: number;
  revenue?: number;
}

export class TreatmentTypeDto {
  value: string;
  label: string;
}