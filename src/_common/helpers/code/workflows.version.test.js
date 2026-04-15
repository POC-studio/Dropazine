import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/_common/use/useActions.js', () => ({
    executeComponentAction: vi.fn(),
}));

vi.mock('@/_common/helpers/code/workflowsCallstack.js', () => ({
    detectInfinityLoop: vi.fn(() => false),
}));

vi.mock('@/_common/helpers/updateVariable.js', () => ({
    applyVariableUpdate: vi.fn(),
}));

vi.mock('@/pinia/variables.js', () => ({
    useVariablesStore: vi.fn(() => ({
        getConfiguration: vi.fn(),
        components: {},
        values: {},
        setValue: vi.fn(),
    })),
}));

vi.mock('@/_common/helpers/code/backendWorkflows.js', () => ({
    executeBackendWorkflow: vi.fn(),
    parseSSEStreamAsync: vi.fn(),
}));

vi.mock('@/pinia/popup', () => ({
    usePopupStore: vi.fn(() => ({})),
}));

vi.mock('@/pinia/backTableViews.js', () => ({
    useBackTableViewsStore: vi.fn(() => ({
        fetchData: vi.fn(),
        latestFetchParameters: {},
        data: {},
    })),
}));

vi.mock('@better-fetch/fetch', () => ({
    betterFetch: vi.fn(),
}));

vi.mock('@/_front/integrations/index.js', () => ({
    default: {},
}));

vi.mock('@/pinia/integrations.js', () => ({
    useIntegrationsStore: vi.fn(() => ({})),
}));

vi.mock('@/pinia/backAuth', () => ({
    useBackAuthStore: vi.fn(() => ({})),
}));

vi.mock('@/pinia/editor/debugger.js', () => ({
    useDebuggerStore: vi.fn(() => ({
        startWorkflow: vi.fn(() => 'execution-id'),
        stopWorkflow: vi.fn(),
        log: vi.fn(),
    })),
}));

import { executeWorkflow } from './workflows.js';

describe('executeWorkflow versioned formula handling', () => {
    const dispatch = vi.fn();

    beforeEach(() => {
        dispatch.mockReset();
        globalThis.wwLib = {
            WW_SAFE_MODE_HARD: 'hard',
            $pinia: {},
            $store: {
                getters: {
                    'manager/getSafeMode': null,
                    'data/getWorkflowResults': vi.fn(() => ({})),
                    'data/getFormulas': {},
                    'data/getPluginFormulas': {},
                    'data/getCollections': {},
                    'libraries/getComponents': {},
                },
                dispatch,
            },
        };
    });

    it('keeps legacy workflows non-fatal when a config formula fails', async () => {
        const execution = await executeWorkflow({
            id: 'workflow-v1',
            firstAction: 'return-action',
            actions: {
                'return-action': {
                    id: 'return-action',
                    type: 'return',
                    value: {
                        __wwtype: 'f',
                        code: 'missing.value',
                    },
                },
            },
        });

        expect(execution.error).toBeUndefined();
        expect(execution.result).toBeUndefined();
        expect(dispatch).not.toHaveBeenCalledWith(
            'data/setWorkflowError',
            expect.anything()
        );
    });

    it('fails v2 workflows when a config formula fails', async () => {
        const execution = await executeWorkflow({
            id: 'workflow-v2',
            version: 2,
            firstAction: 'return-action',
            actions: {
                'return-action': {
                    id: 'return-action',
                    type: 'return',
                    value: {
                        __wwtype: 'f',
                        code: 'missing.value',
                    },
                },
            },
        });

        expect(execution.error).toMatchObject({
            name: 'FormulaError',
            message: expect.stringContaining('Formula evaluation error'),
        });
        expect(dispatch).toHaveBeenCalledWith('data/setWorkflowError', {
            workflowId: 'workflow-v2',
            value: expect.objectContaining({
                name: 'FormulaError',
                message: expect.stringContaining('Formula evaluation error'),
            }),
        });
    });
});
