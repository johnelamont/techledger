import { useState, useEffect } from 'react';
import type { LinkWithContext } from '../types/links';
import { getObjectLinks } from '../services/linksAPI';

interface LinksListProps {
  objectType: 'systems' | 'actions' | 'roles' | 'tasks';
  objectId: number;
}

function LinksList({ objectType, objectId }: LinksListProps) {
  const [links, setLinks] = useState<LinkWithContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinks();
  }, [objectType, objectId]);

  const loadLinks = async () => {
    try {
      const data = await getObjectLinks(objectType, objectId);
      setLinks(data);
    } catch (error) {
      console.error('Error loading links:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading links...</div>;
  if (links.length === 0) return <div>No links available</div>;

  return (
    <div className="links-list">
      <h3>Related Resources</h3>
      {links.map((link) => (
        <div key={link.id} className="link-item" style={{
          border: '1px solid #ddd',
          padding: '10px',
          marginBottom: '10px',
          borderRadius: '5px'
        }}>
          <a 
            href={link.url} 
            target={link.open_in_new_tab ? '_blank' : '_self'}
            rel="noopener noreferrer"
            style={{ fontSize: '16px', fontWeight: 'bold' }}
          >
            {link.title}
          </a>
          
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {link.link_type} • {link.auth_required !== 'none' && `🔐 ${link.auth_required}`}
          </div>
          
          {link.description && (
            <p style={{ fontSize: '14px', marginTop: '5px' }}>{link.description}</p>
          )}
          
          {link.context_notes && (
            <p style={{ 
              fontSize: '12px', 
              fontStyle: 'italic', 
              color: '#555',
              marginTop: '5px' 
            }}>
              💡 {link.context_notes}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default LinksList;