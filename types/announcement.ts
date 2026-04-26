export type AnnouncementType = 'INFO' | 'WARNING' | 'URGENT' | 'SYSTEM';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: number;
  isPinned: boolean;
  publishedAt: string | null;
  expiredAt: string | null;
  createdAt: string;
}
