export interface Floor {
  id: string;
  name: string;
  level: number;
  widthPx: number;
  heightPx: number;
  backgroundUrl?: string;
  rooms?: Room[];
  tables?: Table[];
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Table {
  id: string;
  floorId: string;
  roomId?: string;
  label: string;
  capacity: number;
  shape: 'rect' | 'circle';
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'available' | 'occupied' | 'reserved' | 'inactive';
}
