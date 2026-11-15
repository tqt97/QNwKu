import { Check } from 'lucide-react';
import type { Place } from '@/lib/types';

type Props = {
  place: Place;
  actionsOpen: boolean;
  onToggleVisited: () => void;
  onToggleActions: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function PlaceRow({ place, actionsOpen, onToggleVisited, onToggleActions, onEdit, onDelete }: Props) {
  return <article className="place-row">
    <button className={`checkbox ${place.visited ? 'checked' : ''}`} aria-label={place.visited ? `Bỏ đánh dấu đã thử ${place.name}` : `Đánh dấu đã thử ${place.name}`} onClick={onToggleVisited}>{place.visited && <Check size={14}/>}</button>
    <span className={`place-note-title ${place.visited ? 'is-done' : ''}`}>{place.name}</span>
    <button type="button" className="place-more" data-actions-root aria-label={`Thao tác với ${place.name}`} aria-expanded={actionsOpen} aria-controls={`place-actions-${place.id}`} onClick={onToggleActions}>···</button>
    <div className="place-actions-menu" data-actions-root id={`place-actions-${place.id}`} hidden={!actionsOpen}>
      <button type="button" onClick={onEdit}>Chỉnh sửa</button>
      <button type="button" onClick={onDelete}>Xóa mục</button>
    </div>
  </article>;
}
