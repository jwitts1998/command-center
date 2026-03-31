// A2UI-inspired widget types for AI-generated UI

// Core widget types
export type WidgetType =
  // Primitives
  | 'text'
  | 'markdown'
  | 'code'
  | 'image'
  // Layout
  | 'card'
  | 'list'
  | 'grid'
  | 'row'
  | 'column'
  | 'divider'
  // Data display
  | 'table'
  | 'timeline'
  | 'chart'
  | 'progress'
  | 'stat'
  | 'badge'
  // Domain-specific cards
  | 'agent_card'
  | 'task_card'
  | 'goal_card'
  | 'approval_card'
  | 'team_card'
  | 'run_card'
  | 'session_card'
  // Interactive
  | 'form'
  | 'input'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'date_picker'
  | 'action_group'
  | 'button'
  | 'confirmation'
  // Complex
  | 'wizard'
  | 'tabs'
  | 'accordion';

// Base widget structure
export interface Widget {
  id: string;
  type: WidgetType;
  props: Record<string, unknown>;
  children?: Widget[];
  actions?: WidgetAction[];
  dataBinding?: DataBinding;
  style?: WidgetStyle;
}

// Action that can be triggered from a widget
export interface WidgetAction {
  id: string;
  label: string;
  actionType: ActionType;
  payload?: Record<string, unknown>;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  icon?: string;
  disabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// Types of actions
export type ActionType =
  // Navigation
  | 'navigate'
  | 'show_workbench'
  | 'close_workbench'
  | 'show_modal'
  | 'close_modal'
  // CRUD operations
  | 'create'
  | 'update'
  | 'delete'
  // Domain actions
  | 'approve'
  | 'reject'
  | 'checkout_task'
  | 'release_task'
  | 'assign_agent'
  | 'delegate'
  | 'decompose_goal'
  | 'start_execution'
  | 'pause_agent'
  | 'resume_agent'
  // Form actions
  | 'submit_form'
  | 'reset_form'
  | 'validate'
  // Custom
  | 'custom';

// Data binding for live updates
export interface DataBinding {
  source: DataSource;
  path?: string;
  transform?: string;
  refreshInterval?: number;
}

// Data sources for binding
export interface DataSource {
  type: 'api' | 'context' | 'static';
  endpoint?: string;
  method?: 'GET' | 'POST';
  params?: Record<string, unknown>;
  contextKey?: string;
  staticData?: unknown;
}

// Widget styling
export interface WidgetStyle {
  className?: string;
  padding?: string;
  margin?: string;
  maxWidth?: string;
  minHeight?: string;
  background?: string;
}

// Props for specific widget types

export interface TextWidgetProps {
  content: string;
  variant?: 'body' | 'heading' | 'caption' | 'label';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface MarkdownWidgetProps {
  content: string;
}

export interface CodeWidgetProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export interface CardWidgetProps {
  title?: string;
  description?: string;
  footer?: string;
  variant?: 'default' | 'outlined' | 'elevated';
}

export interface ListWidgetProps {
  items: ListItem[];
  variant?: 'simple' | 'detailed' | 'compact';
  ordered?: boolean;
}

export interface ListItem {
  id: string;
  primary: string;
  secondary?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface TableWidgetProps {
  columns: TableColumn[];
  rows: TableRow[];
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
}

export interface TableColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface TableRow {
  id: string;
  cells: Record<string, unknown>;
  actions?: WidgetAction[];
}

export interface TimelineWidgetProps {
  events: TimelineEvent[];
  direction?: 'vertical' | 'horizontal';
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  type?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export interface ProgressWidgetProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'linear' | 'circular';
}

export interface StatWidgetProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: string;
}

export interface FormWidgetProps {
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
  layout?: 'vertical' | 'horizontal' | 'grid';
  validationSchema?: Record<string, unknown>;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'date' | 'time' | 'datetime';
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  options?: SelectOption[];
  validation?: FieldValidation;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

export interface ActionGroupWidgetProps {
  actions: WidgetAction[];
  layout?: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export interface ConfirmationWidgetProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'info' | 'warning' | 'danger';
  icon?: string;
}

export interface WizardWidgetProps {
  steps: WizardStep[];
  currentStep?: number;
  allowStepNavigation?: boolean;
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: Widget;
  validation?: Record<string, unknown>;
}

export interface TabsWidgetProps {
  tabs: Tab[];
  defaultTab?: string;
}

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: Widget;
  disabled?: boolean;
}

export interface AccordionWidgetProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
}

export interface AccordionItem {
  id: string;
  title: string;
  content: Widget;
}

// Domain-specific card props (extend existing component props)

export interface AgentCardWidgetProps {
  agentId: string;
  showActions?: boolean;
  compact?: boolean;
}

export interface TaskCardWidgetProps {
  taskId: string;
  showActions?: boolean;
  compact?: boolean;
  showSubtasks?: boolean;
}

export interface GoalCardWidgetProps {
  goalId: string;
  showActions?: boolean;
  compact?: boolean;
  showTasks?: boolean;
}

export interface ApprovalCardWidgetProps {
  approvalId: string;
  showActions?: boolean;
  compact?: boolean;
}

export interface TeamCardWidgetProps {
  teamId: string;
  showMembers?: boolean;
  compact?: boolean;
}

export interface RunCardWidgetProps {
  runId: string;
  showEvents?: boolean;
  compact?: boolean;
}

export interface ChartWidgetProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData;
  options?: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  color?: string;
}

export interface ChartOptions {
  title?: string;
  legend?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// Helper type for creating widgets
export type CreateWidget<T extends WidgetType, P = Record<string, unknown>> = {
  id: string;
  type: T;
  props: P;
  children?: Widget[];
  actions?: WidgetAction[];
  dataBinding?: DataBinding;
  style?: WidgetStyle;
};
