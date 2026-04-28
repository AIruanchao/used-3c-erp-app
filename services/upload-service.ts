import { api } from '../lib/api';

export async function uploadFile(params: { uri: string; name: string; type: string }): Promise<string> {
  const form = new FormData();
  // RN FormData file object
  form.append('file', { uri: params.uri, name: params.name, type: params.type } as unknown as Blob);

  const res = await api.post<{ ok: true; data: { url: string } }>('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url;
}

export async function attachDevicePhotos(params: {
  deviceId: string;
  photoUrls: string[];
  photoType: string;
}): Promise<void> {
  await api.post(`/api/devices/${params.deviceId}/photos`, {
    photoUrls: params.photoUrls,
    photoType: params.photoType,
  });
}

