import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import autoprefixer from 'autoprefixer';
import path from 'path';
import fs from 'fs';
import { parseEnv } from 'node:util';
import handlebars from 'handlebars';

const pages = {"d98b3b3d-a275-4f70-8ec6-57b4192fbd3a-en":{"outputDir":"./","lang":"en","title":"Dropazine","cacheVersion":16,"meta":[{"name":"title","content":"Dropazine"},{"name":"description","content":"Créez vos propres fanzines et envoyez les à vos abonnés. "},{"name":"keywords","content":"fanzine, diy, impression, impression à la demande, appel à participation"},{"name":"image","content":"/images/Capture_d’écran_2026-04-17_à_11.40.37.png?_wwcv=16"},{"itemprop":"name","content":"Dropazine"},{"itemprop":"description","content":"Créez vos propres fanzines et envoyez les à vos abonnés. "},{"itemprop":"image","content":"/images/Capture_d’écran_2026-04-17_à_11.40.37.png?_wwcv=16"},{"name":"twitter:card","content":"summary"},{"name":"twitter:title","content":"Dropazine"},{"name":"twitter:description","content":"Créez vos propres fanzines et envoyez les à vos abonnés. "},{"name":"twitter:image","content":"/images/Capture_d’écran_2026-04-17_à_11.40.37.png?_wwcv=16"},{"property":"og:title","content":"Dropazine"},{"property":"og:description","content":"Créez vos propres fanzines et envoyez les à vos abonnés. "},{"property":"og:image","content":"/images/Capture_d’écran_2026-04-17_à_11.40.37.png?_wwcv=16"},{"property":"og:site_name","content":"Dropazine"},{"property":"og:type","content":"website"},{"name":"robots","content":"index, follow"}],"scripts":{"head":"\n<style>\n.paper {\n    background-repeat: repeat !important;\n    background-size: 400px 392px !important; \n    background-position: top left !important;\n    background-image: url('images/so-white__1_.png?_wwcv=16');\n}\n</style>","body":"\n"},"baseTag":{"href":"/","target":"_self"},"alternateLinks":[{"rel":"alternate","hreflang":"x-default","href":"https://d9d0d618-de7d-4699-87b6-7e1ac3795fe1.weweb-preview.io/"},{"rel":"alternate","hreflang":"en","href":"https://d9d0d618-de7d-4699-87b6-7e1ac3795fe1.weweb-preview.io/"}]}};

// Read the main HTML template
const template = fs.readFileSync(path.resolve(__dirname, 'template.html'), 'utf-8');
const compiledTemplate = handlebars.compile(template);

// Generate an HTML file for each page with its metadata
Object.values(pages).forEach(pageConfig => {
    // Compile the template with page metadata
    const html = compiledTemplate({
        title: pageConfig.title,
        lang: pageConfig.lang,
        meta: pageConfig.meta,
        structuredData: pageConfig.structuredData || null,
        scripts: {
            head: pageConfig.scripts.head,
            body: pageConfig.scripts.body,
        },
        alternateLinks: pageConfig.alternateLinks,
        cacheVersion: pageConfig.cacheVersion,
        baseTag: pageConfig.baseTag,
    });

    // Save output html for each page
    if (!fs.existsSync(pageConfig.outputDir)) {
        fs.mkdirSync(pageConfig.outputDir, { recursive: true });
    }
    fs.writeFileSync(`${pageConfig.outputDir}/index.html`, html);
});

const rolldownOptionsInput = {};
for (const pageName in pages) {
    rolldownOptionsInput[pageName] = path.resolve(__dirname, pages[pageName].outputDir, 'index.html');
}

function getFrontEnvironmentValues(root, mode) {
    const filePath = path.resolve(root, `.env.${mode}`);
    if (!fs.existsSync(filePath)) {
        return {};
    }

    return Object.fromEntries(Object.entries(parseEnv(fs.readFileSync(filePath, 'utf8'))).filter(([key]) => !key.startsWith('VITE_')));
}

export default defineConfig(() => {
    return {
        plugins: [vue()],
        base: "/",
        define: {
            global: 'globalThis',
            __WW_FRONT_ENV_VARIABLES__: JSON.stringify({
                staging: getFrontEnvironmentValues(__dirname, 'staging'),
                production: getFrontEnvironmentValues(__dirname, 'production'),
            }),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        css: {
            preprocessorOptions: {
                scss: {
                    api: 'modern-compiler',
                },
            },
            postcss: {
                plugins: [autoprefixer],
            },
        },
        build: {
            chunkSizeWarningLimit: 10000,
            rolldownOptions: {
                input: rolldownOptionsInput,
                onwarn: (entry, next) => {
                    if (entry.loc?.file && /js$/.test(entry.loc.file) && /Use of eval in/.test(entry.message)) return;
                    if (/Use of direct `eval`/.test(entry.message)) return;
                    return next(entry);
                },
            },
        },
        logLevel: 'warn',
    };
});
