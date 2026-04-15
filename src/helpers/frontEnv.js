export function mapEnvironmentValuesToEnvVariables(valuesByEnvironment) {
    if (!valuesByEnvironment || typeof valuesByEnvironment !== 'object' || Array.isArray(valuesByEnvironment)) {
        throw new Error('Missing or invalid bundled front env variables');
    }

    const values = {};

    for (const env of ['staging', 'production']) {
        const environmentValues = valuesByEnvironment[env];
        if (!environmentValues || typeof environmentValues !== 'object' || Array.isArray(environmentValues)) {
            continue;
        }

        for (const [name, value] of Object.entries(environmentValues)) {
            if (!values[name]) values[name] = { name };
            values[name][`${env}Value`] = value;
        }
    }

    return values;
}

function parseAppUrls(value) {
    if (!value) return [];

    if (typeof value !== 'string') {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
            return parsed.filter(url => typeof url === 'string' && url);
        }
    } catch {
    }

    return [value];
}

function getOrigin(url) {
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

export function resolveEnvironmentFromEnvVariables(values, currentOrigin = window.location.origin) {
    if (!values || typeof values !== 'object' || Array.isArray(values)) {
        return 'production';
    }

    const appUrl = values.APP_URL;
    if (!appUrl || typeof appUrl !== 'object') {
        return 'production';
    }

    for (const env of ['staging', 'production']) {
        const envUrls = parseAppUrls(appUrl[`${env}Value`]);
        if (envUrls.some(url => getOrigin(url) === currentOrigin)) {
            return env;
        }
    }

    return 'production';
}
