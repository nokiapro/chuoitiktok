export interface Person {
  id: string;
  name: string;
  currentDay: number;
}

export interface AppData {
  people: Person[];
  images: Record<string, string>; // day -> fileId
}
