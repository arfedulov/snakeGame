import formatNumber from './formatNumber';

function formatDateTime(date: string | Date): string {
    let d: Date;
    if (typeof date === 'string') {
        d = new Date(date);
    } else {
        d = date as Date;
    }

    return `${d.getFullYear()}/${formatNumber(d.getMonth() + 1, 2)}/${formatNumber(d.getDate(), 2)} ${formatNumber(d.getHours(), 2)}:${formatNumber(d.getMinutes(), 2)}`;
}

export default formatDateTime;
