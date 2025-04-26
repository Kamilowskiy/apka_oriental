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
  category: {
    name: string;
    color: string;
  };
}

export interface DropResult {
  name: string;
}