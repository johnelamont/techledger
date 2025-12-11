import api from './api';
import type { Link, CreateLinkInput, LinkWithContext } from '../types/links';

// Copy the Link types to frontend/src/types/links.ts as well

export const createLink = async (input: CreateLinkInput): Promise<Link> => {
  const response = await api.post('/api/links', input);
  return response.data;
};

export const getLinks = async (filters?: {
  status?: string;
  link_type?: string;
}): Promise<{ links: Link[]; total: number }> => {
  const response = await api.get('/api/links', { params: filters });
  return response.data;
};

export const getLinkById = async (id: number): Promise<Link> => {
  const response = await api.get(`/api/links/${id}`);
  return response.data;
};

export const updateLink = async (id: number, input: Partial<CreateLinkInput>): Promise<Link> => {
  const response = await api.put(`/api/links/${id}`, input);
  return response.data;
};

export const deleteLink = async (id: number): Promise<void> => {
  await api.delete(`/api/links/${id}`);
};

// Object-specific link functions
export const getObjectLinks = async (
  objectType: 'systems' | 'actions' | 'roles' | 'tasks',
  objectId: number
): Promise<LinkWithContext[]> => {
  const response = await api.get(`/api/${objectType}/${objectId}/links`);
  return response.data.links;
};

export const addLinkToObject = async (
  objectType: 'systems' | 'actions' | 'roles' | 'tasks',
  objectId: number,
  linkId: number,
  contextNotes?: string
): Promise<void> => {
  await api.post(`/api/${objectType}/${objectId}/links`, {
    link_id: linkId,
    context_notes: contextNotes,
  });
};

export const removeLinkFromObject = async (
  objectType: 'systems' | 'actions' | 'roles' | 'tasks',
  objectId: number,
  linkId: number
): Promise<void> => {
  await api.delete(`/api/${objectType}/${objectId}/links/${linkId}`);
};