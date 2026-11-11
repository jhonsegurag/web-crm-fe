export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  isClosed: boolean;
  isWon: boolean;
}

export interface Deal {
  id: string;
  stageId: string;
  contactId?: string;
  orderId?: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  position: number;
  assignedTo?: string;
  stage?: PipelineStage;
  contact?: { id: string; firstName: string; lastName?: string };
  createdAt: string;
}
