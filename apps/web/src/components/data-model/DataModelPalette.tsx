export function DataModelPalette({ onAdd }: { onAdd: () => void }) {
  return (
    <aside
      style={{
        background: '#1e293b',
        borderRight: '1px solid #334155',
        boxSizing: 'border-box',
        color: '#e2e8f0',
        padding: '16px 12px',
        width: 216,
      }}
    >
      <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
        DATA MODEL
      </div>
      <button onClick={onAdd} style={addButtonStyle}>
        <span style={{ fontSize: 22 }}>▦</span>
        <span>
          <strong style={{ display: 'block' }}>Add Entity</strong>
          <small style={{ color: '#94a3b8' }}>Table or collection</small>
        </span>
      </button>
      <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5, marginTop: 18 }}>
        Add entities, define their fields, then drag between orange handles to create relationships.
      </div>
      <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.5, marginTop: 14 }}>
        Select a relationship and press Delete or Backspace to remove it.
      </div>
    </aside>
  );
}

const addButtonStyle: React.CSSProperties = {
  alignItems: 'center',
  background: '#0f172a',
  border: '1px solid #475569',
  borderRadius: 8,
  color: '#e2e8f0',
  cursor: 'pointer',
  display: 'flex',
  gap: 10,
  marginTop: 14,
  padding: '10px 12px',
  textAlign: 'left',
  width: '100%',
};
