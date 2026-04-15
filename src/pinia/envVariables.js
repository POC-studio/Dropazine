import { defineStore } from 'pinia';
/* wwFront:start */
import { mapEnvironmentValuesToEnvVariables } from '@/helpers/frontEnv.js';
/* wwFront:end */
 
export const useEnvVariablesStore = defineStore('envVariables', () => {
    let values;
    /* wwFront:start */
    function getFrontEnvVariables() {
        // eslint-disable-next-line no-undef
        return mapEnvironmentValuesToEnvVariables(__WW_FRONT_ENV_VARIABLES__);
    }

    values = getFrontEnvVariables();
    /* wwFront:end */
 
 
    return {
        values,
     };
});
