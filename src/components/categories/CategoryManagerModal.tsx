import React, { useState } from 'react';
import { useTallyStore } from '../../store/useTallyStore.tsx';
import { Category } from '../../types/index.ts';
import { Modal } from '../ui/Modal.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';
import { PixelIcon } from '../ui/PixelIcon.tsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.tsx';

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#7FA35B', // Moss
  '#5F8043', // Moss Dark
  '#E9B44C', // Honey
  '#E27D4F', // Ember
  '#B84A5A', // Berry
  '#8CC0D6', // Sky
  '#7C6DA0', // Dusk
  '#B87B4B', // Oak
  '#8E5A34', // Oak Dark
  '#6B5344', // Cocoa
];

const PRESET_ICONS = [
  'quill',
  'swords',
  'shield',
  'clock',
  'music',
  'dumbbell',
  'volleyball',
  'camp',
  'star',
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { state, createCategory, updateCategory, deleteCategory } = useTallyStore();

  // Create Form State
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState(PRESET_ICONS[0]);

  // Edit State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIcon, setEditIcon] = useState('');

  // Delete flow state
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState('');
  const [reassignAction, setReassignAction] = useState<'reassign' | 'archive'>('reassign');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createCategory({
      name: name.trim(),
      elementColor: color,
      icon,
    });

    setName('');
    setColor(PRESET_COLORS[0]);
    setIcon(PRESET_ICONS[0]);
  };

  const handleStartEdit = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.elementColor);
    setEditIcon(cat.icon);
  };

  const handleSaveEdit = (catId: string) => {
    if (!editName.trim()) return;
    updateCategory(catId, {
      name: editName.trim(),
      elementColor: editColor,
      icon: editIcon,
    });
    setEditingCatId(null);
  };

  const handleStartDelete = (cat: Category) => {
    const affectedTrackers = state.trackers.filter(t => t.categoryId === cat.id);
    setDeletingCat(cat);

    if (affectedTrackers.length === 0) {
      // Empty category: simple confirm dialog
      setIsConfirmOpen(true);
    } else {
      // Has trackers: must prompt to reassign or archive (never orphan)
      const otherCategories = state.categories.filter(c => c.id !== cat.id);
      setReassignTargetId(otherCategories[0]?.id || '');
      setReassignAction('reassign');
      setIsReassignModalOpen(true);
    }
  };

  const handleConfirmEmptyDelete = () => {
    if (deletingCat) {
      deleteCategory(deletingCat.id);
    }
    setIsConfirmOpen(false);
    setDeletingCat(null);
  };

  const handleConfirmReassignDelete = () => {
    if (!deletingCat) return;

    const remainingCategories = state.categories.filter(c => c.id !== deletingCat.id);
    if (remainingCategories.length === 0 && reassignAction === 'reassign') {
      alert('You must have another category to reassign trackers to.');
      return;
    }

    deleteCategory(deletingCat.id, {
      reassignToCategoryId: reassignTargetId,
      archiveTrackers: reassignAction === 'archive',
    });

    setIsReassignModalOpen(false);
    setDeletingCat(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Manage categories" maxWidth="lg">
        <div className="space-y-6">
          {/* Create Category Form */}
          <div className="p-3 bg-cream-deep border-2 border-oak-dark space-y-3">
            <h4 className="font-pixel-heading text-xs text-cocoa flex items-center gap-1.5 font-bold">
              <PixelIcon name="plus" size={14} />
              <span>New category</span>
            </h4>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                  Category name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Training, Crafting, Work, Wellness..."
                  className="w-full bg-cream border-2 border-oak-dark px-3 py-1.5 font-pixel-body text-base text-cocoa outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Element Color Picker */}
                <div>
                  <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                    Element color
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 border-2 cursor-pointer pixel-btn-block ${
                          color === c ? 'border-cocoa scale-110 shadow-md' : 'border-cocoa-soft/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Picker */}
                <div>
                  <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                    Pixel icon
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ICONS.map(ic => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIcon(ic)}
                        className={`w-7 h-7 flex items-center justify-center border-2 cursor-pointer pixel-btn-block ${
                          icon === ic
                            ? 'bg-cream-deep border-honey shadow-[0_2px_0_var(--honey-dark)] text-cocoa'
                            : 'bg-cream border-oak-dark text-cocoa-soft hover:bg-cream-deep'
                        }`}
                      >
                        <PixelIcon name={ic} size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <PixelButton type="submit" size="sm" variant="moss" disabled={!name.trim()}>
                  + Create category
                </PixelButton>
              </div>
            </form>
          </div>

          {/* Existing Categories List */}
          <div>
            <h4 className="font-pixel-heading text-xs text-cocoa mb-2 font-bold">
              Realm categories ({state.categories.length})
            </h4>

            {state.categories.length === 0 ? (
              <p className="font-pixel-body text-base text-cocoa-soft italic p-3 bg-cream border border-oak-dark">
                No categories created yet. Create your first category above to begin organizing your trackers!
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {state.categories.map(cat => {
                  const isEditing = editingCatId === cat.id;
                  const trackerCount = state.trackers.filter(t => t.categoryId === cat.id).length;

                  if (isEditing) {
                    return (
                      <div
                        key={cat.id}
                        className="p-3 bg-cream border-2 border-honey space-y-3 shadow-[0_2px_0_var(--honey-dark)]"
                      >
                        <div>
                          <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                            Edit category name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full bg-cream-deep border border-oak-dark px-2 py-1 font-pixel-body text-base outline-none shadow-[inset_1px_1px_0_var(--cocoa-soft)]"
                          />
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <div>
                            <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                              Color
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {PRESET_COLORS.map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setEditColor(c)}
                                  style={{ backgroundColor: c }}
                                  className={`w-5 h-5 border cursor-pointer ${
                                    editColor === c ? 'border-cocoa scale-110' : 'border-cocoa-soft/60'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="font-pixel-heading text-[10px] text-cocoa-soft block mb-1">
                              Icon
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {PRESET_ICONS.map(ic => (
                                <button
                                  key={ic}
                                  type="button"
                                  onClick={() => setEditIcon(ic)}
                                  className={`w-6 h-6 flex items-center justify-center border cursor-pointer ${
                                    editIcon === ic
                                      ? 'bg-cream-deep border-honey text-cocoa'
                                      : 'bg-cream border-oak-dark text-cocoa-soft'
                                  }`}
                                >
                                  <PixelIcon name={ic} size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-cream-deep">
                          <PixelButton size="sm" variant="oak" onClick={() => setEditingCatId(null)}>
                            Cancel
                          </PixelButton>
                          <PixelButton size="sm" variant="moss" onClick={() => handleSaveEdit(cat.id)}>
                            Save
                          </PixelButton>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cat.id}
                      className="p-2.5 bg-cream border-2 border-oak-dark flex items-center justify-between gap-3 shadow-[0_2px_0_var(--oak-dark)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-5 h-5 flex-shrink-0 border border-cocoa flex items-center justify-center"
                          style={{ backgroundColor: cat.elementColor }}
                        >
                          <PixelIcon name={cat.icon} size={12} color="var(--cocoa)" />
                        </span>

                        <div className="min-w-0">
                          <h5 className="font-pixel-heading text-xs text-cocoa truncate font-bold">
                            {cat.name}
                          </h5>
                          <span className="font-pixel-body text-sm text-cocoa-soft">
                            {trackerCount} tracker{trackerCount === 1 ? '' : 's'} assigned
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="px-2 py-1 bg-cream-deep hover:bg-cream text-cocoa border border-oak-dark font-pixel-heading text-[10px] pixel-btn-block cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStartDelete(cat)}
                          className="px-2 py-1 bg-cream-deep hover:bg-berry hover:text-cream text-cocoa border border-oak-dark font-pixel-heading text-[10px] pixel-btn-block cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Empty Category */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete category"
        message={`Are you sure you want to delete the category "${deletingCat?.name}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="berry"
        onConfirm={handleConfirmEmptyDelete}
        onCancel={() => {
          setIsConfirmOpen(false);
          setDeletingCat(null);
        }}
      />

      {/* Category Deletion Prompt with Trackers (Never orphan) */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => {
          setIsReassignModalOpen(false);
          setDeletingCat(null);
        }}
        title={`Delete category: "${deletingCat?.name || ''}"`}
        maxWidth="md"
      >
        <div className="space-y-4 py-2">
          {deletingCat && (
            <>
              <div className="p-2.5 bg-cream-deep border border-honey text-cocoa font-pixel-body text-base leading-snug">
                This category currently contains{' '}
                <strong>
                  {state.trackers.filter(t => t.categoryId === deletingCat.id).length} tracker(s)
                </strong>
                . Trackers cannot be orphaned. Choose how to handle them before deleting:
              </div>

              {state.categories.filter(c => c.id !== deletingCat.id).length > 0 ? (
                <div className="space-y-3 font-pixel-body text-base text-cocoa">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reassign_option"
                      checked={reassignAction === 'reassign'}
                      onChange={() => setReassignAction('reassign')}
                      className="mt-1 accent-honey"
                    />
                    <div>
                      <span className="font-pixel-heading text-xs block text-cocoa font-bold">
                        Reassign to another category:
                      </span>
                      <select
                        value={reassignTargetId}
                        onChange={e => setReassignTargetId(e.target.value)}
                        disabled={reassignAction !== 'reassign'}
                        className="mt-1 w-full bg-cream border border-oak-dark px-2 py-1 text-base font-pixel-body outline-none"
                      >
                        {state.categories
                          .filter(c => c.id !== deletingCat.id)
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reassign_option"
                      checked={reassignAction === 'archive'}
                      onChange={() => setReassignAction('archive')}
                      className="mt-1 accent-honey"
                    />
                    <div>
                      <span className="font-pixel-heading text-xs block text-berry font-bold">
                        Archive affected trackers
                      </span>
                      <span className="font-pixel-body text-sm text-cocoa-soft">
                        Trackers will be safely archived so they can be restored later.
                      </span>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="p-3 bg-cream-deep border border-oak-dark space-y-2">
                  <p className="font-pixel-body text-base text-cocoa">
                    This is your only category! You must create another category first, or archive all trackers upon deletion.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reassignAction === 'archive'}
                      onChange={e => setReassignAction(e.target.checked ? 'archive' : 'reassign')}
                      className="accent-berry"
                    />
                    <span className="font-pixel-heading text-xs text-berry font-bold">
                      Archive all affected trackers
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-cream-deep flex justify-end gap-2">
                <PixelButton
                  size="sm"
                  variant="oak"
                  onClick={() => {
                    setIsReassignModalOpen(false);
                    setDeletingCat(null);
                  }}
                >
                  Cancel
                </PixelButton>
                <PixelButton size="sm" variant="berry" onClick={handleConfirmReassignDelete}>
                  Confirm & delete
                </PixelButton>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};
