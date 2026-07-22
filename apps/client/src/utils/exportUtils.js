/**
 * Converts an array of objects to CSV/Excel format and triggers a download.
 * @param {Array} data - The array of objects to export.
 * @param {String} filename - The name of the downloadable file (without extension).
 */
import toast from 'react-hot-toast';

export const exportToCSV = (data, filename = 'export') => {
    if (!data || !data.length) {
        toast.error("No data to export!");
        return;
    }

    // Extract headers
    const headers = Object.keys(data[0]);
    
    // Construct CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(fieldName => {
            let value = row[fieldName];
            // Handle null/undefined
            if (value === null || value === undefined) return '';
            // Handle strings with commas or quotes
            if (typeof value === 'string') {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            // Handle objects/arrays (convert to string)
            if (typeof value === 'object') {
                value = `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')) // Data rows
    ].join('\n');

    // Create Blob and Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Records exported successfully!");
};
