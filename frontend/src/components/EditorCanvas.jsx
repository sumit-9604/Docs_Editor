import React from 'react';
import { Trash2, Eye } from 'lucide-react';

export default function EditorCanvas({
  document,
  elements,
  activeElementId,
  onSelectElement,
  onUpdateElement,
  onRemoveElement,
  onAddTextBlock,
  canEdit,
  userRole
}) {
  if (!document) {
    return (
      <div className="editor-viewport">
        <div className="doc-page-sheet" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ color: '#94a3b8' }}>Select or create a document to start editing.</p>
        </div>
      </div>
    );
  }

  const handleTextChange = (id, newContent) => {
    onUpdateElement(id, { content: newContent });
  };

  /**
   * Automatic Pagination Engine
   * Groups vector<DocumentElement> into standard 11" Google Docs paper sheets.
   */
  const paginateElements = (elementsList) => {
    const pages = [];
    let currentPage = [];
    let currentHeight = 0;
    const MAX_PAGE_HEIGHT = 760; // Usable vertical height inside 1056px page sheet

    (elementsList || []).forEach((el) => {
      if (el.type === 'pagebreak') {
        if (currentPage.length > 0) {
          pages.push(currentPage);
        }
        currentPage = [];
        currentHeight = 0;
        return;
      }

      // Estimate element vertical footprint
      let elHeight = 45; // default paragraph
      if (el.type === 'image') elHeight = 300;
      else if (el.heading === 'h1') elHeight = 75;
      else if (el.heading === 'h2') elHeight = 60;
      else if (el.heading === 'h3') elHeight = 50;

      // Also limit to max 10 elements per page if short text
      if ((currentHeight + elHeight > MAX_PAGE_HEIGHT || currentPage.length >= 10) && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [el];
        currentHeight = elHeight;
      } else {
        currentPage.push(el);
        currentHeight += elHeight;
      }
    });

    if (currentPage.length > 0 || pages.length === 0) {
      pages.push(currentPage);
    }

    return pages;
  };

  const pages = paginateElements(elements);
  const totalPages = pages.length;

  // Global index tracking for enter key insertions
  let globalElementIndex = 0;

  return (
    <div className="editor-viewport">
      {!canEdit && (
        <div className="read-only-banner" style={{ maxWidth: '816px', width: '100%' }}>
          <Eye size={16} />
          <span>Viewing Mode: You are viewing as <strong>{userRole}</strong>. Editing is restricted.</span>
        </div>
      )}

      {pages.map((pageElements, pageIdx) => (
        <React.Fragment key={pageIdx}>
          <div className="doc-page-sheet">
            {/* Page Header Indicator */}
            <div className="page-header-mark">
              <span>Page {pageIdx + 1} of {totalPages}</span>
            </div>

            {pageElements.map((el) => {
              const elementIndex = globalElementIndex++;
              const isSelected = el.id === activeElementId;

              // Image Element
              if (el.type === 'image') {
                return (
                  <div
                    key={el.id}
                    className={`element-block ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectElement(el.id)}
                  >
                    <figure style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                      <img
                        src={el.url}
                        alt={el.alt || 'Uploaded image'}
                        style={{ maxWidth: el.width || '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      {canEdit ? (
                        <input
                          type="text"
                          value={el.caption || ''}
                          onChange={(e) => onUpdateElement(el.id, { caption: e.target.value })}
                          placeholder="Add image caption..."
                          style={{
                            width: '80%',
                            margin: '0.5rem auto 0 auto',
                            display: 'block',
                            textAlign: 'center',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.85rem',
                            color: '#64748b',
                            outline: 'none'
                          }}
                        />
                      ) : (
                        el.caption && (
                          <figcaption style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
                            {el.caption}
                          </figcaption>
                        )
                      )}
                    </figure>

                    {canEdit && (
                      <div className="element-controls">
                        <button
                          className="btn-element-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveElement(el.id);
                          }}
                          title="Delete Image Block"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              // Text Element
              const headingClass =
                el.heading === 'h1' ? 'heading-h1' :
                el.heading === 'h2' ? 'heading-h2' :
                el.heading === 'h3' ? 'heading-h3' : '';

              const listClass =
                el.listType === 'bullet' ? 'list-bullet' :
                el.listType === 'numbered' ? 'list-numbered' : '';

              const styleObj = {
                fontWeight: el.bold ? 'bold' : 'normal',
                fontStyle: el.italic ? 'italic' : 'normal',
                textDecoration: el.underline ? 'underline' : 'none',
                textAlign: el.align || 'left'
              };

              return (
                <div
                  key={el.id}
                  className={`element-block ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectElement(el.id)}
                >
                  {el.listType !== 'none' ? (
                    <div className={listClass}>
                      <div
                        contentEditable={canEdit}
                        suppressContentEditableWarning
                        className={`element-editable ${headingClass}`}
                        style={styleObj}
                        onBlur={(e) => handleTextChange(el.id, e.target.innerText)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onAddTextBlock(elementIndex + 1);
                          }
                        }}
                      >
                        {el.content}
                      </div>
                    </div>
                  ) : (
                    <div
                      contentEditable={canEdit}
                      suppressContentEditableWarning
                      className={`element-editable ${headingClass}`}
                      style={styleObj}
                      onBlur={(e) => handleTextChange(el.id, e.target.innerText)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onAddTextBlock(elementIndex + 1);
                        }
                      }}
                    >
                      {el.content}
                    </div>
                  )}

                  {canEdit && elements.length > 1 && (
                    <div className="element-controls">
                      <button
                        className="btn-element-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveElement(el.id);
                        }}
                        title="Delete Text Block"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Page Footer Numbering */}
            <div className="page-footer-number">
              <span>{pageIdx + 1}</span>
            </div>
          </div>

          {/* Inter-page Gap Divider */}
          {pageIdx < totalPages - 1 && (
            <div className="inter-page-gap">
              <span>Page Break</span>
            </div>
          )}
        </React.Fragment>
      ))}

      {/* Floating Bottom Status Bar */}
      <div className="floating-page-bar">
        <span>Pages: {totalPages}</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>Elements: {elements.length}</span>
      </div>
    </div>
  );
}
