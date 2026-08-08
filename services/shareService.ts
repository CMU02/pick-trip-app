import * as Linking from 'expo-linking';
import type { ItineraryStop } from '../types/itinerary';
import { apiClient } from './apiClient';

interface ShareCreateResponse {
  token: string;
}

export async function createShareLink(itineraryId: string): Promise<string> {
  const { data } = await apiClient.post<ShareCreateResponse>(`/itineraries/${itineraryId}/share`);
  return Linking.createURL(`share/${data.token}`);
}

interface SharedItem {
  contentId: string;
  title: string | null;
  order: number;
  reason: string;
}

interface SharedDay {
  dayIndex: number;
  items: SharedItem[];
}

interface SharedItineraryResponse {
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null;
  days: SharedDay[];
}

export interface SharedItinerary {
  title: string;
  region: string;
  travelDate: string | null;
  duration: number | null;
  stops: (ItineraryStop & { title: string | null })[];
}

export async function fetchSharedItinerary(token: string): Promise<SharedItinerary> {
  const { data } = await apiClient.get<SharedItineraryResponse>(`/share/${token}`);
  const stops = data.days.flatMap((day) =>
    [...day.items]
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        contentId: item.contentId,
        title: item.title,
        day: day.dayIndex,
        startTime: '',
        endTime: '',
        reason: item.reason,
      })),
  );
  return {
    title: data.title,
    region: data.region.toLowerCase(),
    travelDate: data.travelDate,
    duration: data.duration,
    stops,
  };
}
