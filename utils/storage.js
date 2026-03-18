import { encryptToken, decryptToken } from './crypto.js';

const CONFIG_KEY = 'grammarfix_config';

const DEFAULT_CONFIG = {
  apiUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
};

export async function getConfig() {
  const result = await chrome.storage.local.get(CONFIG_KEY);
  const stored = result[CONFIG_KEY] || {};
  return {
    apiUrl: stored.apiUrl || DEFAULT_CONFIG.apiUrl,
    model: stored.model || DEFAULT_CONFIG.model,
    token: stored.encryptedToken ? await decryptToken(stored.encryptedToken) : '',
  };
}

export async function saveConfig({ apiUrl, model, token }) {
  const encryptedToken = token ? await encryptToken(token) : null;
  await chrome.storage.local.set({
    [CONFIG_KEY]: {
      apiUrl: apiUrl || DEFAULT_CONFIG.apiUrl,
      model: model || DEFAULT_CONFIG.model,
      encryptedToken,
    },
  });
}

export async function hasToken() {
  const config = await getConfig();
  return !!config.token;
}
