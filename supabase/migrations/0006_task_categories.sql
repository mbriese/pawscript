-- Add broader task categories for pre-generated human and pet tasks.

alter type task_category add value if not exists 'household';
alter type task_category add value if not exists 'wellness';
alter type task_category add value if not exists 'work';
alter type task_category add value if not exists 'family';
alter type task_category add value if not exists 'adventure';
