export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

export type TaskForm = {
  title: string;
  description: string;
  status: string;
};
