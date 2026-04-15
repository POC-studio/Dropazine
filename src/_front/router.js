import { createRouter, createWebHistory } from 'vue-router';

import wwPage from './views/wwPage.vue';

import {
    initializeData,
    initializePlugins,
    initializeIntegrationInstances,
    onPageUnload,
} from '@/_common/helpers/data';
import { convertPathToRouterFormat } from '@/_common/helpers/urlParametersParsing';
import { isPublishedProductionHost } from '@/_common/helpers/publishedRuntimeEnv.js';

import { useBackAuthStore } from '@/pinia/backAuth.js';

let router;
const routes = [];

function scrollBehavior(to) {
    if (to.hash) {
        return {
            el: to.hash,
            behavior: 'smooth',
        };
    } else {
        return { top: 0 };
    }
}

 
/* wwFront:start */
import pluginsSettings from '../../plugins-settings.json';

// eslint-disable-next-line no-undef
window.wwg_designInfo = {"id":"d9d0d618-de7d-4699-87b6-7e1ac3795fe1","homePageId":"d98b3b3d-a275-4f70-8ec6-57b4192fbd3a","authPluginId":null,"baseTag":null,"defaultTheme":"light","langs":[{"lang":"en","default":true}],"background":{},"workflows":[],"back":{"isServerSetup":{"staging":false,"production":false}},"auth":null,"pages":[{"id":"d98b3b3d-a275-4f70-8ec6-57b4192fbd3a","linkId":"d98b3b3d-a275-4f70-8ec6-57b4192fbd3a","name":"Home","folder":null,"paths":{"en":"home","default":"home"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"1f40ee01-f142-4c21-9ff4-dac00c0990ec","sectionTitle":"Header","linkId":"c45601f8-7a5e-423d-a961-0a69320d2b55"},{"uid":"5ec75c56-4297-4692-ae17-113a67dae8ba","sectionTitle":"Features","linkId":"7be8f556-8a11-48d1-a03f-4a9a3c1428be"},{"uid":"40eec5ff-9eaa-4aeb-910d-5312ef768441","sectionTitle":"Pricing","linkId":"1c883bc3-2900-4cc2-8ea0-8426f6cd04e7"},{"uid":"a16ccb2d-bf07-4590-a8c2-de7d097b64f9","sectionTitle":"Footer","linkId":"f61d97c7-84bd-46d3-b339-9ad8b79117d1"}],"pageUserGroups":[],"title":{"en":"Blank | Start from scratch","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":"","security":{}}],"plugins":[]};
// eslint-disable-next-line no-undef
window.wwg_cacheVersion = 4;
// eslint-disable-next-line no-undef
window.wwg_pluginsSettings = pluginsSettings;
// eslint-disable-next-line no-undef
window.wwg_disableManifest = false;

const defaultLang = window.wwg_designInfo.langs.find(({ default: isDefault }) => isDefault) || {};

const registerRoute = (page, lang, forcedPath) => {
    const langSlug = !lang.default || lang.isDefaultPath ? `/${lang.lang}` : '';
    let path =
        forcedPath ||
        (page.id === window.wwg_designInfo.homePageId ? '/' : `/${page.paths[lang.lang] || page.paths.default}`);

    path = convertPathToRouterFormat(path);

    routes.push({
        path: langSlug + path,
        component: wwPage,
        name: `page-${page.id}-${lang.lang}`,
        meta: {
            pageId: page.id,
            lang,
            isPrivate: !!page.pageUserGroups?.length,
        },
        async beforeEnter(to, from) {
            if (to.name === from.name) return;
            //Set page lang
            wwLib.wwLang.defaultLang = defaultLang.lang;
            wwLib.$store.dispatch('front/setLang', lang.lang);

            //Init plugins
            await initializePlugins();

            //Init integration instances
            await initializeIntegrationInstances();

            if (wwLib.wwAuth.plugin) {
                if (page.pageUserGroups?.length) {
                    await wwLib.wwAuth.init();

                    // Redirect to not sign in page if not logged
                    if (!wwLib.wwAuth.getIsAuthenticated()) {
                        window.location.href = `${wwLib.wwPageHelper.getPagePath(
                            wwLib.wwAuth.getUnauthenticatedPageId()
                        )}?_source=${to.path}`;

                        return null;
                    }

                    //Check roles are required
                    if (
                        page.pageUserGroups.length > 1 &&
                        !wwLib.wwAuth.matchUserGroups(page.pageUserGroups.map(({ userGroup }) => userGroup))
                    ) {
                        window.location.href = `${wwLib.wwPageHelper.getPagePath(
                            wwLib.wwAuth.getUnauthorizedPageId()
                        )}?_source=${to.path}`;

                        return null;
                    }
                }
            } else {
                const backAuthStore = useBackAuthStore(wwLib.$pinia);
                if (!backAuthStore.projectAuth && window.wwg_designInfo.auth) {
                    backAuthStore.setProjectAuth(window.wwg_designInfo.auth);
                }
                await backAuthStore.refresh();
                const projectAuth = backAuthStore.projectAuth || {};

                //Check if private page
                if (page.security?.accessRule === 'authenticated') {
                    if (!backAuthStore.isAuthenticated) {
                        window.location.href = `${wwLib.wwPageHelper.getPagePath(
                            projectAuth.unauthenticatedPageId
                        )}?_source=${to.path}`;
                        return null;
                    } else if (page.security?.accessRoles?.length) {
                        const hasAccess =
                            page.security.accessRolesCondition === 'AND'
                                ? backAuthStore.matchAllRoles(page.security.accessRoles)
                                : backAuthStore.matchAnyRoles(page.security.accessRoles);
                        if (!hasAccess) {
                            window.location.href = `${wwLib.wwPageHelper.getPagePath(
                                projectAuth.unauthorizedPageId
                            )}?_source=${to.path}`;
                            return null;
                        }
                    }
                }
            }

            try {
                await import(`@/pages/${page.id.split('_')[0]}.js`);
                await wwLib.wwWebsiteData.fetchPage(page.id);

                //Scroll to section or on top after page change
                if (to.hash) {
                    const targetElement = document.getElementById(to.hash.replace('#', ''));
                    if (targetElement) targetElement.scrollIntoView();
                } else {
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                }

                return;
            } catch (err) {
                wwLib.$store.dispatch('front/showPageLoadProgress', false);

                if (err.redirectUrl) {
                    return { path: err.redirectUrl || '404' };
                } else {
                    //Any other error: go to target page using window.location
                    window.location = to.fullPath;
                }
            }
        },
    });
};

for (const page of window.wwg_designInfo.pages) {
    for (const lang of window.wwg_designInfo.langs) {
        if (!page.langs.includes(lang.lang)) continue;
        registerRoute(page, lang);
    }
}

const page404 = window.wwg_designInfo.pages.find(page => page.paths.default === '404');
if (page404) {
    for (const lang of window.wwg_designInfo.langs) {
        // Create routes /:lang/:pathMatch(.*)* etc for all langs of the 404 page
        if (!page404.langs.includes(lang.lang)) continue;
        registerRoute(
            page404,
            {
                default: false,
                lang: lang.lang,
            },
            '/:pathMatch(.*)*'
        );
    }
    // Create route /:pathMatch(.*)* using default project lang
    registerRoute(page404, { default: true, isDefaultPath: false, lang: defaultLang.lang }, '/:pathMatch(.*)*');
} else {
    routes.push({
        path: '/:pathMatch(.*)*',
        async beforeEnter() {
            window.location.href = '/404';
        },
    });
}

let routerOptions = {};

const isProd = isPublishedProductionHost(window.location.host);

if (isProd && window.wwg_designInfo.baseTag?.href) {
    let baseTag = window.wwg_designInfo.baseTag.href;
    if (!baseTag.startsWith('/')) {
        baseTag = '/' + baseTag;
    }
    if (!baseTag.endsWith('/')) {
        baseTag += '/';
    }

    routerOptions = {
        base: baseTag,
        history: createWebHistory(baseTag),
        routes,
    };
} else {
    routerOptions = {
        history: createWebHistory(),
        routes,
    };
}

router = createRouter({
    ...routerOptions,
    scrollBehavior,
});

//Trigger on page unload
let isFirstNavigation = true;
router.beforeEach(async (to, from) => {
    if (to.name === from.name) return;
    if (!isFirstNavigation) await onPageUnload();
    isFirstNavigation = false;
    wwLib.globalVariables._navigationId++;
    return;
});

//Init page
router.afterEach((to, from, failure) => {
    wwLib.$store.dispatch('front/showPageLoadProgress', false);
    let fromPath = from.path;
    let toPath = to.path;
    if (!fromPath.endsWith('/')) fromPath = fromPath + '/';
    if (!toPath.endsWith('/')) toPath = toPath + '/';
    if (failure || (from.name && toPath === fromPath)) return;
    initializeData(to);
});
/* wwFront:end */

export default router;
