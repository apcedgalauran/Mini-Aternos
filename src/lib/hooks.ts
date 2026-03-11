import useSWR from 'swr';
import { api } from './api';

export function useServerStatus() {
  return useSWR('server-status', () => api.getStatus(), {
    refreshInterval: 10000, // Poll every 10 seconds
    revalidateOnFocus: true,
  });
}

export function usePlayers() {
  return useSWR('players', () => api.getPlayers(), {
    refreshInterval: 15000,
  });
}

export function useSessions() {
  return useSWR('sessions', () => api.getSessions());
}

export function usePlans() {
  return useSWR('plans', () => api.getPlans());
}

export function useConfig() {
  return useSWR('config', () => api.getConfig());
}
