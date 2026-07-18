export type DurationType = 'day' | '1night' | '2night' | 'custom';

export interface TripDate {
  startDate: Date;
  durationType: DurationType;
  nights: number;
}
