import { useState } from 'react';
import { CompanionSelectScreen } from './screens/CompanionSelectScreen';
import { ContentExploreScreen } from './screens/ContentExploreScreen';
import { RegionSelectScreen } from './screens/RegionSelectScreen';
import { TripDateScreen } from './screens/TripDateScreen';
import type { CompanionType } from './types/companion';

type Screen = 'region' | 'date' | 'companion' | 'explore';

export default function App() {
  const [screen, setScreen] = useState<Screen>('region');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [tripDate, setTripDate] = useState<{
    startDate: Date;
    durationType: string;
    nights: number;
  } | null>(null);

  if (screen === 'region') {
    return (
      <RegionSelectScreen
        onContinue={(regions) => {
          setSelectedRegions(regions);
          setScreen('date');
        }}
      />
    );
  }

  if (screen === 'date') {
    return (
      <TripDateScreen
        onContinue={(date) => {
          setTripDate(date);
          setScreen('companion');
        }}
      />
    );
  }

  if (screen === 'companion') {
    return (
      <CompanionSelectScreen
        onContinue={(_companions: CompanionType[]) => {
          setScreen('explore');
        }}
      />
    );
  }

  return <ContentExploreScreen selectedRegions={selectedRegions} />;
}
