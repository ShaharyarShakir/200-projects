export enum TaskStatus {
	TODO = 'TODO',
	IN_PROGRESS = 'IN_PROGRESS',
	DONE = 'DONE'
}

export enum TaskPriority {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH'
}

export interface Task {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}
export enum TaskStatus {
	TODO = 'TODO',
	IN_PROGRESS = 'IN_PROGRESS',
	DONE = 'DONE'
}

export enum TaskPriority {
	LOW = 'LOW',
	MEDIUM = 'MEDIUM',
	HIGH = 'HIGH'
}

export interface Task {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface QueryTaskParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: TaskStatus;
	priority?: TaskPriority;
	sortBy?: 'createdAt' | 'dueDate' | 'priority';
	sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
	data: T[];
	meta: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface QueryTaskParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: TaskStatus;
	priority?: TaskPriority;
	sortBy?: 'createdAt' | 'dueDate' | 'priority';
	sortOrder?: 'asc' | 'desc';
}
