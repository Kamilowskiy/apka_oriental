export interface Task {
  id: string;
  title: string;
  dueDate: string;
  comments?: number;
  links?: number;
  assignee: string;
  status: string;
  projectDesc?: string;
  projectImg?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedHours?: number;
  tags?: string;
  price?: number;
  client_id?: number;       // Dodane pole
  startDate?: string;       // Dodane pole
  endDate?: string;         // Dodane pole
  category: {
    name: string;
    color: string;
  };
}

export interface DropResult {
  name: string;
}