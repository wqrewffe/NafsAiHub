import React from 'react';

export enum ToolCategory {
  TEXT = 'Text',
  IMAGE = 'Image',
  COLOR = 'Color',
  SOCIAL_CONTENT = 'Social & Content',
  DEVELOPER = 'Developer',
  AI = 'AI',
  HACKING = 'Hacking',
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}
