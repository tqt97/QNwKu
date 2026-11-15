import { Check, X } from 'lucide-react';
import type { ChecklistItem } from '@/lib/types';

type Props = {
  item: ChecklistItem;
  eventLabel?: string;
  pending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function ChecklistRow({ item, eventLabel, pending, onToggle, onEdit, onDelete }: Props) {
  return <div className="check-row">
    <button className={`checkbox ${item.done ? 'checked' : ''}`} aria-label={item.done ? 'Bỏ đánh dấu' : 'Đánh dấu hoàn thành'} aria-busy={pending} disabled={pending} onClick={onToggle}>{item.done && <Check size={14}/>}</button>
    <button className={`check-title ${item.done ? 'is-done' : ''}`} onClick={onEdit}>{item.title}</button>
    {eventLabel && <span className="check-event">{eventLabel}</span>}
    <button className="mini-delete" aria-label="Xóa checklist" onClick={onDelete}><X size={15}/></button>
  </div>;
}
