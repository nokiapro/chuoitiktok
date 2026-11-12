export interface Person {
  id: string;
  userId: string;
  name: string;
  currentDay: number;
}

export interface User {
  id: string;
  name: string;
  secret: string;
}

export interface AppData {
  people: Person[];
  images: Record<string, string>; // day -> fileId
  users: User[];
}
