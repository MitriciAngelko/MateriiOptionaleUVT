import { funnyLoadingMessages } from './constants';

// Funcție helper pentru eliminarea diacriticelor
export const removeDiacritics = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export const getRandomLoadingMessage = () => {
  return funnyLoadingMessages[Math.floor(Math.random() * funnyLoadingMessages.length)];
}; 