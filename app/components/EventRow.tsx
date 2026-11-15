import { Clock3, MapPin } from 'lucide-react';
import type { EventItem } from '@/lib/types';
import { formatAppDay, formatAppMonth, formatAppTime } from '@/lib/dates';

type Props = {
  event: EventItem;
  featured: boolean;
  actionsOpen: boolean;
  onToggleActions: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function EventRow({ event, featured, actionsOpen, onToggleActions, onEdit, onDelete }: Props) {
  return <article className={`event-row ${featured ? 'event-row-featured' : ''}`}>
    <div className="event-datebox"><span>{formatAppMonth(event.starts_at)}</span><strong>{formatAppDay(event.starts_at)}</strong></div>
    <div className="event-copy">
      <h3>{event.title}</h3>
      <p>
        <span className="event-meta-item"><Clock3 size={13}/>{formatAppTime(event.starts_at)}</span>
        <span className="event-meta-item"><MapPin size={13}/>{event.location || 'Chưa có địa điểm'}</span>
      </p>
    </div>
    <div className="event-actions-root" data-actions-root>
      <button type="button" className="event-more" data-actions-root aria-label={`Thao tác với ${event.title}`} aria-expanded={actionsOpen} aria-controls={`event-actions-${event.id}`} onClick={onToggleActions}>···</button>
      <div className="place-actions-menu event-actions-menu" data-actions-root id={`event-actions-${event.id}`} hidden={!actionsOpen}>
        <button type="button" onClick={onEdit}>Chỉnh sửa</button>
        <button type="button" onClick={onDelete}>Xóa mục</button>
      </div>
    </div>
  </article>;
}
