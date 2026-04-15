export function isPublishedProductionHost(host) {
    const previewUrl = import.meta.env.VITE_APP_PREVIEW_URL || '';
    const stagingHostMarker =
        '-staging.' + (process.env.WW_ENV === 'staging' ? previewUrl : '');
    return !host.includes(stagingHostMarker) && !host.includes(previewUrl);
}
