import { useState } from 'react';
import type {
  ApiEndpointSpec,
  DesignNotes,
  HttpMethod,
  NonFunctionalRequirements,
} from '@sds/shared/src/index';
import { useDesignStore } from '../../store/useDesignStore';

type Tab = 'requirements' | 'nfr' | 'api' | 'details';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'requirements', label: 'Requirements' },
  { id: 'nfr', label: 'NFRs' },
  { id: 'api', label: 'API Design' },
  { id: 'details', label: 'Data & Trade-offs' },
];

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const NFR_FIELDS: Array<{
  key: keyof NonFunctionalRequirements;
  label: string;
  placeholder: string;
}> = [
  { key: 'availability', label: 'Availability', placeholder: 'Example: 99.99% uptime' },
  { key: 'latency', label: 'Latency', placeholder: 'Example: p99 reads below 100 ms' },
  { key: 'scale', label: 'Scale', placeholder: 'Users, QPS, storage and bandwidth' },
  { key: 'consistency', label: 'Consistency', placeholder: 'Strong or eventual consistency?' },
  { key: 'durability', label: 'Durability', placeholder: 'Backup, replication and data-loss targets' },
];

export function DesignNotesPanel({ onClose }: { onClose: () => void }) {
  const notes = useDesignStore((state) => state.notes);
  const setNotes = useDesignStore((state) => state.setNotes);
  const [activeTab, setActiveTab] = useState<Tab>('requirements');
  const [newRequirement, setNewRequirement] = useState('');

  const updateNotes = (patch: Partial<DesignNotes>) => {
    setNotes({ ...notes, ...patch });
  };

  const addRequirement = () => {
    const text = newRequirement.trim();
    if (!text) return;
    updateNotes({
      functionalRequirements: [
        ...notes.functionalRequirements,
        { id: crypto.randomUUID(), text, completed: false },
      ],
    });
    setNewRequirement('');
  };

  const addEndpoint = () => {
    const endpoint: ApiEndpointSpec = {
      id: crypto.randomUUID(),
      method: 'GET',
      path: '/api/resource',
      description: '',
      request: '',
      response: '',
    };
    updateNotes({ apiEndpoints: [...notes.apiEndpoints, endpoint] });
  };

  return (
    <aside style={panelStyle} aria-label="Design notes">
      <div style={headerStyle}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Design Notes</div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
            Document your interview reasoning
          </div>
        </div>
        <button onClick={onClose} style={iconButtonStyle} aria-label="Close design notes">
          ×
        </button>
      </div>

      <div style={tabListStyle}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...tabStyle,
              color: activeTab === tab.id ? '#f8fafc' : '#64748b',
              borderBottomColor: activeTab === tab.id ? '#f97316' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={contentStyle}>
        {activeTab === 'requirements' && (
          <>
            <SectionIntro
              title="Functional requirements"
              description="List the user-visible capabilities that are in scope."
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                value={newRequirement}
                onChange={(event) => setNewRequirement(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') addRequirement();
                }}
                placeholder="Add a requirement"
                style={inputStyle}
              />
              <button onClick={addRequirement} style={primaryButtonStyle}>Add</button>
            </div>
            {notes.functionalRequirements.length === 0 && (
              <EmptyState text="Add the core actions your system must support." />
            )}
            {notes.functionalRequirements.map((requirement) => (
              <div key={requirement.id} style={requirementRowStyle}>
                <input
                  type="checkbox"
                  checked={requirement.completed}
                  onChange={(event) => updateNotes({
                    functionalRequirements: notes.functionalRequirements.map((item) =>
                      item.id === requirement.id
                        ? { ...item, completed: event.target.checked }
                        : item
                    ),
                  })}
                />
                <input
                  value={requirement.text}
                  onChange={(event) => updateNotes({
                    functionalRequirements: notes.functionalRequirements.map((item) =>
                      item.id === requirement.id ? { ...item, text: event.target.value } : item
                    ),
                  })}
                  style={{ ...inputStyle, textDecoration: requirement.completed ? 'line-through' : 'none' }}
                />
                <button
                  onClick={() => updateNotes({
                    functionalRequirements: notes.functionalRequirements.filter(
                      (item) => item.id !== requirement.id
                    ),
                  })}
                  style={iconButtonStyle}
                  aria-label={`Delete ${requirement.text}`}
                >
                  🗑
                </button>
              </div>
            ))}
          </>
        )}

        {activeTab === 'nfr' && (
          <>
            <SectionIntro
              title="Non-functional requirements"
              description="Capture measurable constraints before choosing architecture."
            />
            {NFR_FIELDS.map((field) => (
              <Field key={field.key} label={field.label}>
                <textarea
                  value={notes.nonFunctionalRequirements[field.key]}
                  onChange={(event) => updateNotes({
                    nonFunctionalRequirements: {
                      ...notes.nonFunctionalRequirements,
                      [field.key]: event.target.value,
                    },
                  })}
                  placeholder={field.placeholder}
                  style={textareaStyle}
                />
              </Field>
            ))}
          </>
        )}

        {activeTab === 'api' && (
          <>
            <SectionIntro
              title="API design"
              description="Define the contract clients use to interact with the system."
            />
            <button onClick={addEndpoint} style={{ ...primaryButtonStyle, marginBottom: 16 }}>
              + Add endpoint
            </button>
            {notes.apiEndpoints.length === 0 && (
              <EmptyState text="Add the primary APIs required by the use cases." />
            )}
            {notes.apiEndpoints.map((endpoint) => (
              <div key={endpoint.id} style={cardStyle}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={endpoint.method}
                    onChange={(event) => updateEndpoint(
                      notes,
                      setNotes,
                      endpoint.id,
                      { method: event.target.value as HttpMethod }
                    )}
                    style={{ ...inputStyle, flex: '0 0 92px' }}
                  >
                    {METHODS.map((method) => <option key={method}>{method}</option>)}
                  </select>
                  <input
                    value={endpoint.path}
                    onChange={(event) => updateEndpoint(
                      notes,
                      setNotes,
                      endpoint.id,
                      { path: event.target.value }
                    )}
                    placeholder="/api/resource"
                    style={inputStyle}
                  />
                  <button
                    onClick={() => updateNotes({
                      apiEndpoints: notes.apiEndpoints.filter((item) => item.id !== endpoint.id),
                    })}
                    style={iconButtonStyle}
                    aria-label={`Delete ${endpoint.path}`}
                  >
                    🗑
                  </button>
                </div>
                <input
                  value={endpoint.description}
                  onChange={(event) => updateEndpoint(
                    notes,
                    setNotes,
                    endpoint.id,
                    { description: event.target.value }
                  )}
                  placeholder="What does this endpoint do?"
                  style={{ ...inputStyle, marginTop: 10 }}
                />
                <Field label="Request">
                  <textarea
                    value={endpoint.request}
                    onChange={(event) => updateEndpoint(
                      notes,
                      setNotes,
                      endpoint.id,
                      { request: event.target.value }
                    )}
                    placeholder={'{\n  "field": "value"\n}'}
                    style={codeTextareaStyle}
                  />
                </Field>
                <Field label="Response">
                  <textarea
                    value={endpoint.response}
                    onChange={(event) => updateEndpoint(
                      notes,
                      setNotes,
                      endpoint.id,
                      { response: event.target.value }
                    )}
                    placeholder={'{\n  "id": "123"\n}'}
                    style={codeTextareaStyle}
                  />
                </Field>
              </div>
            ))}
          </>
        )}

        {activeTab === 'details' && (
          <>
            <SectionIntro
              title="Data model and trade-offs"
              description="Record important entities, indexes and architectural decisions."
            />
            <Field label="Data model">
              <textarea
                value={notes.dataModel}
                onChange={(event) => updateNotes({ dataModel: event.target.value })}
                placeholder="Entities, relationships, indexes and partition keys..."
                style={{ ...textareaStyle, minHeight: 180 }}
              />
            </Field>
            <Field label="Trade-offs and follow-ups">
              <textarea
                value={notes.tradeOffs}
                onChange={(event) => updateNotes({ tradeOffs: event.target.value })}
                placeholder="Alternatives considered, bottlenecks and future improvements..."
                style={{ ...textareaStyle, minHeight: 180 }}
              />
            </Field>
          </>
        )}
      </div>
    </aside>
  );
}

function updateEndpoint(
  notes: DesignNotes,
  setNotes: (notes: DesignNotes) => void,
  id: string,
  patch: Partial<ApiEndpointSpec>
) {
  setNotes({
    ...notes,
    apiEndpoints: notes.apiEndpoints.map((endpoint) =>
      endpoint.id === id ? { ...endpoint, ...patch } : endpoint
    ),
  });
}

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>
        {description}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginTop: 14 }}>
      <span style={{ color: '#94a3b8', display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ border: '1px dashed #334155', borderRadius: 8, color: '#64748b', fontSize: 12, padding: 18, textAlign: 'center' }}>
      {text}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: '#111827',
  borderLeft: '1px solid #334155',
  bottom: 0,
  boxShadow: '-12px 0 32px #0008',
  color: '#e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  right: 0,
  top: 48,
  width: 'min(520px, 100vw)',
  zIndex: 600,
};

const headerStyle: React.CSSProperties = {
  alignItems: 'center',
  borderBottom: '1px solid #334155',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '14px 18px',
};

const tabListStyle: React.CSSProperties = {
  borderBottom: '1px solid #334155',
  display: 'flex',
  overflowX: 'auto',
};

const tabStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 700,
  padding: '12px 14px',
  whiteSpace: 'nowrap',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 18,
};

const inputStyle: React.CSSProperties = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 6,
  color: '#e2e8f0',
  flex: 1,
  minWidth: 0,
  padding: '8px 10px',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  boxSizing: 'border-box',
  minHeight: 74,
  resize: 'vertical',
  width: '100%',
};

const codeTextareaStyle: React.CSSProperties = {
  ...textareaStyle,
  fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  fontSize: 12,
  minHeight: 96,
};

const primaryButtonStyle: React.CSSProperties = {
  background: '#ea580c',
  border: 'none',
  borderRadius: 6,
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
  padding: '8px 12px',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 16,
  padding: 6,
};

const requirementRowStyle: React.CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  gap: 8,
  marginBottom: 8,
};

const cardStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 10,
  marginBottom: 14,
  padding: 14,
};
