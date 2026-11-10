export interface Person {
  id: string;
  name: string;
  currentDay: number;
}

export interface AppData {
  people: Person[];
  images: Record<string, string>; // day (as string) -> fileId
}

export const DEFAULT_PEOPLE: Person[] = [
  { id: '1', name: 'Người 1', currentDay: 1 },
  { id: '2', name: 'Người 2', currentDay: 1 },
  { id: '3', name: 'Người 3', currentDay: 1 },
  { id: '4', name: 'Người 4', currentDay: 1 },
  { id: '5', name: 'Người 5', currentDay: 1 },
  { id: '6', name: 'Người 6', currentDay: 1 },
  { id: '7', name: 'Người 7', currentDay: 1 },
];

export const DEFAULT_DATA: AppData = {
  people: DEFAULT_PEOPLE,
  images: {},
};
