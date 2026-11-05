export interface Tag {
  id: string;
  name: string;
  color?: string; // hex color used for badges/pills, e.g. "#5EEAD4"
  incidentCount?: number;
  createdAt?: string;
}

export interface CreateTagPayload {
  name: string;
  color?: string;
}

export interface UpdateTagPayload {
  name?: string;
  color?: string;
}