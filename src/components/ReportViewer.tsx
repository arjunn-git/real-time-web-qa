import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  PlusCircle, 
  Split, 
  Search, 
  Filter, 
  Lightbulb, 
  FileCheck, 
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import type { CategoryType, QAItemResult, QASummary, SectionType } from '../types/qa';

interface ReportViewerProps {
  results: QAItemResult[];
  summary: QASummary;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ results, summary }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'ALL'>('ALL');
  const [selectedSection, setSelectedSection] = useState<SectionType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available unique sections from current results
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => set.add(r.section));
    return Array.from(set) as SectionType[];
  }, [results]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSec = selectedSection === 'ALL' || item.section === selectedSection;
      const matchQuery =
        !searchQuery.trim() ||
        item.expectedContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.foundContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.suggestedFix.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.section.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subCategory.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSec && matchQuery;
    });
  }, [results, selectedCategory, selectedSection, searchQuery]);

  const copyItemFix = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCategoryBadge = (category: CategoryType) => {
    switch (category) {
      case 'CORRECT':
        return { label: 'CORRECT CONTENT', icon: <CheckCircle2 size={14} />, className: 'badge-correct' };
      case 'MISSING':
        return { label: 'MISSING CONTENT', icon: <XCircle size={14} />, className: 'badge-missing' };
      case 'INCORRECT':
        return { label: 'INCORRECT CONTENT', icon: <AlertTriangle size={14} />, className: 'badge-incorrect' };
      case 'ADDITIONAL':
        return { label: 'ADDITIONAL CONTENT FOUND', icon: <PlusCircle size={14} />, className: 'badge-additional' };
      case 'PARTIAL':
        return { label: 'PARTIAL MATCH', icon: <Split size={14} />, className: 'badge-partial' };
    }
  };

  return (
    <div className="report-viewer-container" id="printable-qa-report">
      <div className="report-toolbar">
        <div className="toolbar-header">
          <FileCheck className="toolbar-icon" size={22} />
          <div>
            <h3>Detailed Section-by-Section Validation Report</h3>
            <p>Showing {filteredResults.length} of {results.length} total content items</p>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="filter-controls-row">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search content, sections, or suggested fixes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-selects">
            <div className="select-group">
              <Filter size={14} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
              >
                <option value="ALL">All Categories ({results.length})</option>
                <option value="CORRECT">Correct ({summary.correctCount})</option>
                <option value="MISSING">Missing ({summary.missingCount})</option>
                <option value="INCORRECT">Incorrect ({summary.incorrectCount})</option>
                <option value="ADDITIONAL">Additional ({summary.additionalCount})</option>
                <option value="PARTIAL">Partial Matches ({summary.partialCount})</option>
              </select>
            </div>

            <div className="select-group">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value as any)}
              >
                <option value="ALL">All Sections ({availableSections.length})</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec} Section
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK STATUS PILLS */}
      <div className="status-pills-row">
        <button
          className={`pill-btn ${selectedCategory === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('ALL')}
        >
          All Items ({results.length})
        </button>
        <button
          className={`pill-btn missing ${selectedCategory === 'MISSING' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('MISSING')}
        >
          <XCircle size={14} /> Missing ({summary.missingCount})
        </button>
        <button
          className={`pill-btn incorrect ${selectedCategory === 'INCORRECT' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('INCORRECT')}
        >
          <AlertTriangle size={14} /> Incorrect ({summary.incorrectCount})
        </button>
        <button
          className={`pill-btn partial ${selectedCategory === 'PARTIAL' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('PARTIAL')}
        >
          <Split size={14} /> Partial ({summary.partialCount})
        </button>
        <button
          className={`pill-btn additional ${selectedCategory === 'ADDITIONAL' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('ADDITIONAL')}
        >
          <PlusCircle size={14} /> Additional ({summary.additionalCount})
        </button>
        <button
          className={`pill-btn correct ${selectedCategory === 'CORRECT' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('CORRECT')}
        >
          <CheckCircle2 size={14} /> Correct ({summary.correctCount})
        </button>
      </div>

      {/* ITEM RESULTS LIST */}
      <div className="results-list">
        {filteredResults.length === 0 ? (
          <div className="empty-results">
            <HelpCircle size={40} />
            <h4>No items match your active filters</h4>
            <p>Try clearing the search box or changing category/section filters.</p>
          </div>
        ) : (
          filteredResults.map((item) => {
            const badge = getCategoryBadge(item.category);
            return (
              <div key={item.id} className={`result-card ${item.category.toLowerCase()}`}>
                <div className="result-card-header">
                  <div className="section-type-group">
                    <span className="section-tag">{item.section} Section</span>
                    <span className="subcategory-tag">{item.subCategory}</span>
                  </div>

                  <div className={`category-badge ${badge.className}`}>
                    {badge.icon}
                    <span>{badge.label}</span>
                  </div>
                </div>

                <div className="result-card-body">
                  <div className="comparison-grid">
                    {/* EXPECTED CONTENT */}
                    <div className="comparison-box expected">
                      <div className="box-title">Expected Content (Document)</div>
                      <div className="box-content">{item.expectedContent}</div>
                    </div>

                    {/* FOUND CONTENT */}
                    <div className="comparison-box found">
                      <div className="box-title">Found Content (Website)</div>
                      <div className={`box-content ${item.foundContent === 'Not Found' ? 'not-found' : ''}`}>
                        {item.foundContent}
                      </div>
                    </div>
                  </div>

                  {/* MISSING WORDS BREAKDOWN FOR PARTIAL MATCHES */}
                  {item.category === 'PARTIAL' && item.missingWords && item.missingWords.length > 0 && (
                    <div className="missing-words-box">
                      <span className="mw-label">Missing Words from Document:</span>
                      <div className="mw-pills">
                        {item.missingWords.map((word, idx) => (
                          <span key={idx} className="mw-pill">
                            "{word}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUGGESTED FIX ACTION BOX */}
                  {item.category !== 'CORRECT' && (
                    <div className="suggested-fix-box">
                      <div className="fix-header">
                        <div className="fix-title">
                          <Lightbulb size={16} />
                          <span>Suggested Fix:</span>
                        </div>
                        <button
                          className="copy-fix-btn"
                          onClick={() => copyItemFix(item.id, item.suggestedFix)}
                          title="Copy fix to clipboard"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check size={14} /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy Fix
                            </>
                          )}
                        </button>
                      </div>
                      <p className="fix-text">{item.suggestedFix}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
