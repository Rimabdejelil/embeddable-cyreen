import axios from 'axios';

const API_KEY = 'arAtwc937e5a56954d74e36943-arml-Q8';

const getCacheKey = (text: string, target: string) => `${text}_${target}`;

const getCachedTranslation = (key: string): string | null => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error('Error reading from localStorage:', err);
    return null;
  }
};

const cacheTranslation = (key: string, translated: string) => {
  try {
    localStorage.setItem(key, JSON.stringify(translated));
    console.log(`Stored translation to cache: "${key}" -> "${translated}"`);
  } catch (err) {
    console.error('Error writing to localStorage:', err);
  }
};

export const translateText = async (text: string, target: string) => {
  const cacheKey = getCacheKey(text, target);

  const cached = getCachedTranslation(cacheKey);
  if (cached) {
    console.log('Returning cached translation for:', cacheKey);
    return cached;
  }

  try {
    const response = await axios.post(
      'https://api.translate.arml.trymagic.xyz/v1/translate',
      null,
      {
        params: {
          text: text,
          source: 'auto',
          target: target,
          api_key: API_KEY,
        },
      }
    );

    const translatedText = response.data.translated_text;

    // Save in persistent cache
    cacheTranslation(cacheKey, translatedText);

    return translatedText;
  } catch (error: any) {
    console.error('Translation API error:', error.response?.data || error.message);
    return text;
  }
};
