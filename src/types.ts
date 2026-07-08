export interface Participant {
  RACE: string;
  DISTANCE: string;
  GENDER: string;
  TXNAMOUNT: string;
  AGE: string;
  AGE_GROUP: string;
  NATIONALITY: string;
  PROVINCE_CITY: string;
  REGISTRATION_TYPE: string;
  PARTNER: string;
  STAGE: string;
  PARTNER_2?: string;
}

export interface DashboardStats {
  total: number;
  byDistance: Record<string, number>;
  byGender: { male: number; female: number; unknown: number };
  byAgeGroup: Record<string, number>;
  byRegType: Record<string, number>;
  byProvince: Record<string, number>;
}
