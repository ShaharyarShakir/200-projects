import type { DateField } from '@prismicio/client';

export const formatDate = (dateStr: DateField): string => {
	if (!dateStr) return '';

	const date = new Date(dateStr as string);
	if (isNaN(date.getTime())) return '';

	const options: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};

	return new Intl.DateTimeFormat('en-US', options).format(date);
};

